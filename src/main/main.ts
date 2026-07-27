import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron'
import { join } from 'path'
import { existsSync, mkdirSync, readFileSync, writeFileSync, statSync } from 'fs'
import { homedir } from 'os'
import { providerManager, ProviderConfig } from '../providers/Provider'
import { ClaudeProvider } from '../providers/claude/ClaudeProvider'
import { FreeClaudeProvider } from '../providers/freeClaude/FreeClaudeProvider'
import { ProcessManager, ProcessInfo } from './process/ProcessManager'

// ============================================
// TIPOS E INTERFACES DO APP (sem lógica de Provider)
// ============================================

interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
  images?: string[]
  timestamp: number
}

interface ProjectConfig {
  path: string
  name: string
  lastOpened: number
  history: ChatMessage[]
  summary: string
  importantInfo: string
}

// ============================================
// CONFIGURAÇÃO E ESTADO GLOBAL
// ============================================

let mainWindow: BrowserWindow | null = null

let PROJECTS_DIR = ''
let CONFIG_FILE = ''

// Provider Manager - instancia única (singleton do Provider.ts)

// Registrar provedores disponíveis
providerManager.registerProvider('claude', (manager) => new ClaudeProvider(manager))
providerManager.registerProvider('free-claude', (manager) => new FreeClaudeProvider(manager))
// Provedores futuros serão registrados aqui:
// providerManager.registerProvider('gemini', (manager) => new GeminiProvider(manager))
// providerManager.registerProvider('codex', (manager) => new CodexProvider(manager))
// providerManager.registerProvider('ollama', (manager) => new OllamaProvider(manager))
// providerManager.registerProvider('openrouter', (manager) => new OpenRouterProvider(manager))
// providerManager.registerProvider('nim', (manager) => new NimProvider(manager))

// Process Manager - gerenciador genérico de processos filhos (inicializado lazy)
let processManager: ProcessManager | null = null

// Cache do último status conhecido de cada processo.
// Necessário porque eventos como "fcc-server: running" podem ser emitidos
// (e enviados via sendToRenderer) ANTES do renderer terminar de montar e
// registrar seus listeners de IPC — nesse caso o evento se perde. O
// SplashScreen consulta esse cache ao montar para não ficar preso.
const processStatusCache = new Map<string, { status: string; details?: string }>()

// Mesma lógica de cache para os eventos "provider-healthy" e "provider-ready",
// que também podem disparar antes do SplashScreen estar escutando.
let providerHealthyFired = false
let providerReadyFired = false

// Track current chatId being streamed (for routing events to correct chat)
let currentStreamingChatId: string | null = null

// Configuração padrão do provedor ativo (persistida no config.json)
let activeProviderId = 'free-claude' // Default para free-claude (sem login)
let activeProviderConfig: ProviderConfig = {
  model: 'claude-fable-5',
  effort: 'low',
  webSearch: false,
  projectPath: '',
}

// ============================================
// WINDOW MANAGEMENT
// ============================================

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
    titleBarStyle: 'hidden',
    trafficLightPosition: { x: 12, y: 12 },
    backgroundColor: '#F4F3EE',
    show: false,
  })

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(join(__dirname, '../../index.html'))
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show()
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

// ============================================
// PROCESS MANAGER INTEGRATION - API Genérica
// ============================================

/**
 * Obtém ou cria o ProcessManager (lazy initialization).
 * O ProcessManager NÃO inicia processos automaticamente.
 * Providers decidem quais processos spawnar via spawn(name, cmd, args, opts).
 */
function getProcessManager(): ProcessManager {
  if (!processManager) {
    processManager = new ProcessManager()

    // Encaminhar eventos do ProcessManager para o renderer
    processManager.on('process-started', (info: ProcessInfo) => {
      console.log('[Main] [ProcessManager] process-started:', { name: info.name, command: info.command, args: info.args })
      sendToRenderer('process-started', { name: info.name, command: info.command, args: info.args })
    })

    processManager.on('process-stopped', (info: ProcessInfo, code: number | null) => {
      console.log('[Main] [ProcessManager] process-stopped:', { name: info.name, code, signal: info.error })
      sendToRenderer('process-stopped', { name: info.name, code })
    })

    processManager.on('process-error', (info: ProcessInfo, error: Error) => {
      console.error('[Main] [ProcessManager] process-error:', { name: info.name, error: error.message, stack: error.stack })
      sendToRenderer('process-error', { name: info.name, error: error.message })
    })

    processManager.on('process-output', (processName: string, output: string) => {
      console.log('[Main] [ProcessManager] process-output:', { processName, outputPreview: output.slice(0, 200) })
      sendToRenderer('process-output', { processName, output })
    })

    processManager.on('process-restarting', (processName: string, attempt: number) => {
      console.warn('[Main] [ProcessManager] process-restarting:', { processName, attempt })
      sendToRenderer('process-restarting', { processName, attempt })
    })

    processManager.on('status-changed', (processName: string, status: ProcessInfo['status'], details?: string) => {
      console.log('[Main] [ProcessManager] status-changed:', { processName, status, details })
      processStatusCache.set(processName, { status, details })
      sendToRenderer('process-status', { processName, status, details })
    })

    console.log('[Main] ProcessManager criado (lazy)')
  }
  return processManager
}

/**
 * Para todos os processos graciosamente.
 */
async function stopAllProcesses(): Promise<void> {
  if (processManager) {
    console.log('[Main] Parando todos os processos...')
    await processManager.shutdown()
    processManager = null
  }
}

function initApp() {
  if (!existsSync(PROJECTS_DIR)) {
    mkdirSync(PROJECTS_DIR, { recursive: true })
  }

  if (!existsSync(CONFIG_FILE)) {
    writeFileSync(CONFIG_FILE, JSON.stringify({ projects: [], lastProject: '', provider: 'claude', providerConfig: {} }))
  }
}

// ============================================
// PROJECT STORAGE (inalterado)
// ============================================

function getProjects(): ProjectConfig[] {
  console.log('[DEBUG] getProjects() - reading from:', CONFIG_FILE)
  try {
    const config = JSON.parse(readFileSync(CONFIG_FILE, 'utf-8'))
    console.log('[DEBUG] getProjects() - config:', JSON.stringify(config))
    return config.projects || []
  } catch (err) {
    console.log('[DEBUG] getProjects() - error:', err)
    return []
  }
}

function saveProjects(projects: ProjectConfig[]) {
  const config = JSON.parse(readFileSync(CONFIG_FILE, 'utf-8'))
  config.projects = projects
  writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2))
}

function getProjectPath(projectName: string): string {
  return join(PROJECTS_DIR, `${projectName}.json`)
}

function loadProject(projectName: string): ProjectConfig | null {
  const path = getProjectPath(projectName)
  if (!existsSync(path)) return null
  try {
    return JSON.parse(readFileSync(path, 'utf-8'))
  } catch {
    return null
  }
}

function saveProject(project: ProjectConfig) {
  const path = getProjectPath(project.name)
  writeFileSync(path, JSON.stringify(project, null, 2))

  const projects = getProjects()
  const existingIndex = projects.findIndex((p) => p.name === project.name)
  if (existingIndex >= 0) {
    projects[existingIndex] = { ...project, history: project.history.slice(-100) }
  } else {
    projects.push({ ...project, history: project.history.slice(-100) })
  }
  saveProjects(projects)
}

// ============================================
// HELPER: SEND TO RENDERER
// ============================================

function sendToRenderer(event: string, data: unknown) {
  const timestamp = new Date().toISOString()
  if (event.startsWith('provider-') || event.startsWith('process-')) {
    console.log(`[SEND 28] [${timestamp}] [main] sendToRenderer: ${event}`, data)
  }
  mainWindow?.webContents.send(event, data)
}

// ============================================
// PROVIDER MANAGEMENT
// ============================================

/**
 * Configura listeners do ProviderManager para encaminhar eventos ao renderer.
 */
function setupProviderListeners(): void {
  providerManager.onData((data: string) => {
    const timestamp = new Date().toISOString()
    console.log(`[SEND 28] [${timestamp}] [main] onData CALLBACK -> sendToRenderer('provider-output')`, { chatId: currentStreamingChatId, dataLength: data.length })
    if (currentStreamingChatId) {
      sendToRenderer('provider-output', { chatId: currentStreamingChatId, content: data })
    } else {
      // Fallback: send without chatId (backward compatibility)
      sendToRenderer('provider-output', { chatId: '', content: data })
    }
  })

  providerManager.onError((error: string) => {
    const timestamp = new Date().toISOString()
    console.log(`[SEND 28-ERR] [${timestamp}] [main] onError CALLBACK -> sendToRenderer('provider-error')`, { chatId: currentStreamingChatId, error })
    if (currentStreamingChatId) {
      sendToRenderer('provider-error', { chatId: currentStreamingChatId, error })
    } else {
      sendToRenderer('provider-error', { chatId: '', error })
    }
  })

  providerManager.onExit((code: number) => {
    const timestamp = new Date().toISOString()
    console.log(`[END 04] [${timestamp}] [main] onExit CALLBACK -> sendToRenderer('provider-exit')`, { chatId: currentStreamingChatId, code })
    if (currentStreamingChatId) {
      sendToRenderer('provider-exit', { chatId: currentStreamingChatId, code })
      // Clear the streaming chatId when provider exits
      currentStreamingChatId = null
    } else {
      sendToRenderer('provider-exit', { chatId: '', code })
    }
  })

  providerManager.onReady(() => {
    const timestamp = new Date().toISOString()
    console.log(`[SEND 14] [${timestamp}] [main] onReady CALLBACK -> sendToRenderer('provider-ready')`, { providerId: activeProviderId })
    providerReadyFired = true
    sendToRenderer('provider-ready', { providerId: activeProviderId })
  })

  providerManager.onResponseComplete(() => {
    const timestamp = new Date().toISOString()
    console.log(`[END 04] [${timestamp}] [main] onResponseComplete CALLBACK -> sendToRenderer('provider-response-complete')`, { chatId: currentStreamingChatId })
    if (currentStreamingChatId) {
      sendToRenderer('provider-response-complete', { chatId: currentStreamingChatId })
      // Clear the streaming chatId when response completes
      currentStreamingChatId = null
    } else {
      sendToRenderer('provider-response-complete', { chatId: '' })
    }
  })
}

/**
 * Inicializa o provedor ativo com a configuração atual.
 *
 * ORDEM CORRIGIDA:
 * 1. Obtém a INSTÂNCIA do provider (sem startar) via providerManager.getProvider()
 * 2. Injeta o ProcessManager nessa instância (setProcessManagerRef)
 * 3. Só então chama setActiveProvider(), que dispara o start() internamente
 *
 * Isso resolve o erro "ProcessManager não injetado. Chame setProcessManagerRef
 * antes de start()." que ocorria porque a injeção rodava DEPOIS do start().
 */
async function initializeActiveProvider(projectPath: string, source = 'unknown'): Promise<void> {
  console.log('[Main] [Pipeline] initializeActiveProvider START', {
    projectPath,
    activeProviderId,
    activeProviderConfig,
    source,
    timestamp: new Date().toISOString(),
  })
  console.log(`[Main] [Pipeline] initializeActiveProvider origin stack:\n${new Error('initializeActiveProvider origin').stack}`)
  const pm = getProcessManager()
  const config: ProviderConfig = {
    ...activeProviderConfig,
    projectPath,
  }

  try {
    // 1. Pegar a instância do provider ANTES de iniciar
    console.log('[Main] [Pipeline] Getting provider instance:', activeProviderId)
    const provider = providerManager.getProvider(activeProviderId)
    console.log('[Main] [Pipeline] Got provider:', provider?.getId())

    // 2. Injetar o ProcessManager antes do start()
    if (provider && 'setProcessManagerRef' in provider) {
      console.log('[Main] [Pipeline] Injecting ProcessManager into provider')
      ;(provider as any).setProcessManagerRef(pm)
      console.log('[Main] [Pipeline] ProcessManager injected successfully')
    } else {
      console.warn('[Main] [Pipeline] Provider does not have setProcessManagerRef method')
    }

    // 4. Escutar evento de health check do fcc-server (específico do FreeClaudeProvider)
    if (provider && 'onHealthy' in provider) {
      console.log('[Main] [Pipeline] Registering onHealthy callback for FreeClaudeProvider')
      ;(provider as any).onHealthy(() => {
        console.log('[Main] [Pipeline] FreeClaudeProvider healthy, forwarding to renderer')
        providerHealthyFired = true
        sendToRenderer('provider-healthy', {})
      })
    }

    // 5. REMOVIDO: registrar onResponseComplete direto no provider aqui sobrescrevia
    // (sem chatId) o callback correto que o ProviderManager já registra sozinho em
    // start() -> setupProviderListeners(). Isso causava o bug de "IA está respondendo"
    // travado para sempre a partir da 2ª mensagem (quando setActiveProvider é pulado
    // por idempotência e start() não roda de novo pra restaurar o callback certo).

    // 3. Agora sim, iniciar o provider já com o ProcessManager disponível
    console.log('[Main] [Pipeline] Calling setActiveProvider with config')
    await providerManager.setActiveProvider(activeProviderId, config, source)
    console.log('[Main] [Pipeline] setActiveProvider completed successfully')

    sendToRenderer('provider-started', { providerId: activeProviderId })
    console.log('[Main] [Pipeline] initializeActiveProvider SUCCESS')
  } catch (error: any) {
    console.error('[Main] [Pipeline] initializeActiveProvider FAILED:', error)
    sendToRenderer('provider-error', `Falha ao iniciar provedor: ${error.message}`)
    throw error
  }
}

/**
 * Para o provedor ativo.
 */
async function stopActiveProvider(): Promise<void> {
  if (providerManager.isRunning()) {
    await providerManager.stop()
    sendToRenderer('provider-stopped', { providerId: activeProviderId })
  }
}

/**
 * Envia mensagem para o provedor ativo.
 * SEMPRE delega para o Provider via ProviderManager (não escreve direto no ProcessManager).
 */
async function sendToActiveProvider(chatId: string, message: string, images?: string[]): Promise<boolean> {
  try {
    const timestamp = new Date().toISOString()
    const activeProvider = providerManager.getActiveProvider()
    const providerId = activeProvider?.getId()
    console.log(`[SEND 17] [${timestamp}] [main] IPC send-to-provider RECEIVED`, { chatId, messageLength: message.length, imagesCount: images?.length || 0, providerId, activeProviderConfig })

    if (!activeProvider) {
      console.error(`[SEND 17] [${timestamp}] [main] sendToActiveProvider FAILED: No active provider`)
      sendToRenderer('provider-error', { chatId, error: 'Nenhum provedor ativo' })
      return false
    }

    console.log(`[SEND 18] [${timestamp}] [main] sendToActiveProvider: currentStreamingChatId = ${chatId}`)
    currentStreamingChatId = chatId

    console.log(`[SEND 19] [${timestamp}] [main] Calling providerManager.send()`)
    await providerManager.send(chatId, message, images)
    console.log(`[SEND 19] [${timestamp}] [main] providerManager.send() COMPLETED`)
    return true
  } catch (error: any) {
    const timestamp = new Date().toISOString()
    console.error(`[SEND 17] [${timestamp}] [main] sendToActiveProvider ERROR:`, error)
    sendToRenderer('provider-error', { chatId, error: `Erro ao enviar mensagem: ${error.message}` })
    return false
  }
}

// ============================================
// IPC HANDLERS - PROJECTS
// ============================================

ipcMain.handle('get-home-dir', () => homedir())

ipcMain.handle('get-projects', () => getProjects())

ipcMain.handle('create-project', async (_event, name: string, path: string) => {
  const projects = getProjects()
  if (projects.some((p) => p.name === name)) {
    throw new Error('Projeto já existe')
  }

  const project: ProjectConfig = {
    path,
    name,
    lastOpened: Date.now(),
    history: [],
    summary: '',
    importantInfo: '',
  }

  saveProject(project)
  return project
})

ipcMain.handle('select-folder', async () => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    properties: ['openDirectory'],
  })
  return result.filePaths[0]
})

ipcMain.handle('load-project', (_event, name: string) => {
  const project = loadProject(name)
  if (project) {
    project.lastOpened = Date.now()
    saveProject(project)

    // Atualizar lastProject no config.json para persistir seleção do usuário
    const config = JSON.parse(readFileSync(CONFIG_FILE, 'utf-8'))
    config.lastProject = name
    writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2))
  }
  return project
})

ipcMain.handle('save-project', (_event, project: ProjectConfig) => {
  saveProject(project)
})

ipcMain.handle('delete-project', (_event, name: string) => {
  const projects = getProjects().filter((p) => p.name !== name)
  saveProjects(projects)
  const path = getProjectPath(name)
  if (existsSync(path)) {
    require('fs').unlinkSync(path)
  }
})

// ============================================
// IPC HANDLERS - PROVIDER
// ============================================

/**
 * Retorna o snapshot atual de status conhecido no momento da chamada.
 *
 * Existe para resolver a race condition em que o main process inicia o
 * FreeClaudeProvider (e portanto emite "fcc-server: running") logo após
 * createWindow(), antes do renderer terminar de montar o SplashScreen e
 * registrar seus listeners de IPC. Sem isso, o evento se perde e o step
 * correspondente nunca sai de "pending".
 */
ipcMain.handle('get-process-status-snapshot', () => {
  return {
    processes: Array.from(processStatusCache.entries()).map(([processName, s]) => ({
      processName,
      status: s.status,
      details: s.details,
    })),
    providerHealthy: providerHealthyFired,
    providerReady: providerReadyFired,
  }
})

/**
 * Inicia o provedor para um projeto.
 * Se já estiver rodando com mesmo provedor/config, apenas reconecta.
 */
ipcMain.handle('start-provider', async (_event, projectPath: string, config?: Partial<ProviderConfig>, source?: string) => {
  console.log('[Main] [IPC] start-provider RECEIVED', { projectPath, config, source })
  try {
    // Atualizar config se fornecida
    if (config) {
      activeProviderConfig = { ...activeProviderConfig, ...config }
    }

    // NOTA (fix BUG C): anteriormente esta função SEMPRE parava o provider
    // ativo antes de chamar initializeActiveProvider quando ele já estava
    // rodando com o mesmo provedor — mesmo que o projectPath e a config
    // fossem exatamente os mesmos ("para simplificar, reiniciamos com nova
    // config"). Isso causava um ciclo stop→start desnecessário a cada
    // chamada repetida (ex.: múltiplas invocações concorrentes desta mesma
    // IPC). A decisão de parar/reiniciar agora é feita de forma centralizada
    // e idempotente dentro de providerManager.setActiveProvider(), que só
    // faz stop→start quando o provider, o projectPath ou a config
    // relevante realmente mudaram.
    await initializeActiveProvider(projectPath, source ?? 'ipc:start-provider')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
})

/**
 * Envia mensagem para o provedor ativo.
 */
ipcMain.handle('send-to-provider', async (_event, chatId: string, message: string, images?: string[]) => {
  console.log('[Main] [IPC] send-to-provider RECEIVED', { chatId, messageLength: message.length, imagesCount: images?.length || 0 })
  const success = await sendToActiveProvider(chatId, message, images)
  console.log('[Main] [IPC] send-to-provider COMPLETED', { success })
  return { success }
})

/**
 * Para o provedor ativo.
 */
ipcMain.handle('stop-provider', async (_event, _chatId: string) => {
  await stopActiveProvider()
  return { success: true }
})

/**
 * Reinicia o provedor ativo.
 */
ipcMain.handle('restart-provider', async () => {
  try {
    if (providerManager.getActiveProvider()) {
      await providerManager.restart()
    }
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
})

/**
 * Obtém configuração atual do provedor.
 */
ipcMain.handle('get-provider-config', () => ({
  providerId: activeProviderId,
  config: activeProviderConfig,
}))

/**
 * Salva configuração do provedor (model, effort, webSearch).
 */
ipcMain.handle('save-provider-config', (_event, config: Partial<ProviderConfig>) => {
  activeProviderConfig = { ...activeProviderConfig, ...config }

  // Persistir no config file
  try {
    const configData = JSON.parse(readFileSync(CONFIG_FILE, 'utf-8'))
    configData.providerConfig = activeProviderConfig
    configData.provider = activeProviderId
    writeFileSync(CONFIG_FILE, JSON.stringify(configData, null, 2))
  } catch {
    // Ignore
  }
})

/**
 * Lista provedores disponíveis.
 */
ipcMain.handle('get-available-providers', () => {
  return providerManager.getRegisteredProviders()
})

/**
 * Obtém modelos suportados pelo provedor ativo.
 * Útil para popular ModelSelector dinamicamente.
 */
ipcMain.handle('get-provider-models', async () => {
  const activeProvider = providerManager.getActiveProvider()
  if (!activeProvider) {
    return []
  }

  const models = activeProvider.getSupportedModels()
  const providerId = activeProvider.getId()

  // Para Free Claude, enriquecer com labels/descriptions
  if (providerId === 'free-claude') {
    const { getModelOptionsForProvider } = await import('../providers/freeClaude')
    // getModelOptionsForProvider não usa o parâmetro - retorna todos os modelos suportados
    return getModelOptionsForProvider()
  }

  // Para outros providers, retornar formato básico
  return models.map((model: string) => ({
    value: model,
    label: model,
    description: '',
    icon: null,
  }))
})

/**
 * Muda o provedor ativo.
 */
ipcMain.handle('set-active-provider', async (_event, providerId: string, config?: Partial<ProviderConfig>) => {
  try {
    if (config) {
      activeProviderConfig = { ...activeProviderConfig, ...config }
    }
    activeProviderId = providerId

    // Persistir
    const configData = JSON.parse(readFileSync(CONFIG_FILE, 'utf-8'))
    configData.provider = activeProviderId
    configData.providerConfig = activeProviderConfig
    writeFileSync(CONFIG_FILE, JSON.stringify(configData, null, 2))

    // Se há projeto atual, reinicializar
    const projects = getProjects()
    const currentProject = projects.find((p) => p.lastOpened === Math.max(...projects.map((p) => p.lastOpened)))
    if (currentProject) {
      await initializeActiveProvider(currentProject.path, 'ipc:set-active-provider')
    }

    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
})

// ============================================
// IPC HANDLERS - FILES & UTILS
// ============================================

ipcMain.handle('open-file', async (_event, path: string) => {
  await shell.openPath(path)
})

ipcMain.handle('open-external', async (_event, url: string) => {
  try {
    const parsed = new URL(url)
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      throw new Error('Protocolo não permitido')
    }
    await shell.openExternal(parsed.toString())
    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) }
  }
})

ipcMain.handle('get-file-info', (_event, path: string) => {
  try {
    const stats = statSync(path)
    return { name: path.split(/[/\\]/).pop(), size: stats.size, modified: stats.mtime }
  } catch {
    return null
  }
})

ipcMain.handle('read-file', async (_event, path: string) => {
  try {
    const content = readFileSync(path, 'utf-8')
    return { success: true, content }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
})

ipcMain.handle('write-file', async (_event, path: string, content: string) => {
  try {
    writeFileSync(path, content, 'utf-8')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
})

ipcMain.handle('list-files', async (_event, dirPath: string) => {
  try {
    const { readdirSync } = require('fs')
    const files = readdirSync(dirPath)
    return files.map((name: string) => {
      const fullPath = join(dirPath, name)
      const stats = statSync(fullPath)
      return { name, path: fullPath, isDirectory: stats.isDirectory(), size: stats.size, modified: stats.mtime }
    })
  } catch {
    return []
  }
})

// ============================================
// WINDOW CONTROLS
// ============================================

ipcMain.on('window-minimize', () => mainWindow?.minimize())
ipcMain.on('window-maximize', () => {
  if (mainWindow?.isMaximized()) mainWindow.unmaximize()
  else mainWindow?.maximize()
})
ipcMain.on('window-close', () => mainWindow?.close())

// ============================================
// SINGLE INSTANCE LOCK
// ============================================

console.log('[DEBUG] requestSingleInstanceLock - START')
const gotTheLock = app.requestSingleInstanceLock()
console.log('[DEBUG] requestSingleInstanceLock - END, gotTheLock:', gotTheLock)

// TEMPORARY: Disable single instance lock for debugging
if (!gotTheLock) {
  console.log('[DEBUG] No lock, but continuing for debugging')
}
console.log('[DEBUG] Setting up second-instance handler')
app.on('second-instance', (_event, _commandLine, _workingDirectory) => {
    // Alguém tentou rodar uma segunda instância, focar na janela existente
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    }
  })

  // ============================================
  // APP LIFECYCLE
  // ============================================

  console.log('[DEBUG] app.whenReady() - registering callback')
  app.whenReady().then(async () => {
    console.log('[DEBUG] app.whenReady() - CALLBACK START')
    PROJECTS_DIR = join(app.getPath('userData'), 'projects')
    CONFIG_FILE = join(app.getPath('userData'), 'config.json')
    console.log('[DEBUG] CONFIG_FILE path:', CONFIG_FILE)
    console.log('[DEBUG] PROJECTS_DIR path:', PROJECTS_DIR)

    console.log('[DEBUG] initApp() - START')
    initApp()
    console.log('[DEBUG] initApp() - END')

    console.log('[DEBUG] createWindow() - START')
    createWindow()
    console.log('[DEBUG] createWindow() - END')

    // Configurar listeners do ProviderManager para encaminhar para renderer
    console.log('[DEBUG] setupProviderListeners() - START')
    setupProviderListeners()
    console.log('[DEBUG] setupProviderListeners() - END')

    // ProcessManager será criado lazy na primeira vez que um provider precisar
    // Não inicializamos processos aqui - o provider decide isso ao ser ativado

    // Se havia um último projeto, inicializar o provider completo
    console.log('[DEBUG] getProjects() - START')
    const projects = getProjects()
    console.log('[DEBUG] getProjects() - END, count:', projects.length)

    console.log('[DEBUG] getLastOpenedProject() - START')
    const lastProjectName = getLastOpenedProject()
    console.log('[DEBUG] getLastOpenedProject() - END, name:', lastProjectName)

    const lastProject = projects.find((p) => p.name === lastProjectName)
    console.log('[DEBUG] Found lastProject:', lastProject?.name)

    if (lastProject) {
      console.log('[DEBUG] initializeActiveProvider() - START for:', lastProject.path)
      try {
        await initializeActiveProvider(lastProject.path, 'app:boot')
        console.log('[DEBUG] initializeActiveProvider() - END SUCCESS')
      } catch (error) {
        console.error('[DEBUG] initializeActiveProvider() - ERROR:', error)
      }
    } else {
      console.log('[DEBUG] No last project, skipping provider init')
    }

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
    console.log('[DEBUG] app.whenReady() - END')
  })

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
  })

  app.on('before-quit', async () => {
    console.log('[Main] Shutting down application...')
    // Parar provider ativo
    await stopActiveProvider()
    // Parar todos os processos gerenciados
    await stopAllProcesses()
  })

/**
 * Obtém o último projeto aberto do config.
 */
function getLastOpenedProject(): string {
  console.log('[DEBUG] getLastOpenedProject() - reading from:', CONFIG_FILE)
  try {
    const config = JSON.parse(readFileSync(CONFIG_FILE, 'utf-8'))
    console.log('[DEBUG] getLastOpenedProject() - lastProject:', config.lastProject)
    return config.lastProject || ''
  } catch {
    return ''
  }
}