import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron'
import { join } from 'path'
import { existsSync, mkdirSync, readFileSync, writeFileSync, statSync } from 'fs'
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

// Configuração padrão do provedor ativo (persistida no config.json)
let activeProviderId = 'free-claude' // Default para free-claude (sem login)
let activeProviderConfig: ProviderConfig = {
  model: 'claude-fable-5',
  effort: 'high',
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
      sendToRenderer('process-started', { name: info.name, command: info.command, args: info.args })
    })

    processManager.on('process-stopped', (info: ProcessInfo, code: number | null) => {
      sendToRenderer('process-stopped', { name: info.name, code })
    })

    processManager.on('process-error', (info: ProcessInfo, error: Error) => {
      sendToRenderer('process-error', { name: info.name, error: error.message })
    })

    processManager.on('process-output', (processName: string, output: string) => {
      sendToRenderer('process-output', { processName, output })
    })

    processManager.on('process-restarting', (processName: string, attempt: number) => {
      sendToRenderer('process-restarting', { processName, attempt })
    })

    processManager.on('status-changed', (processName: string, status: ProcessInfo['status'], details?: string) => {
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
    sendToRenderer('provider-output', data)
  })

  providerManager.onError((error: string) => {
    sendToRenderer('provider-error', error)
  })

  providerManager.onExit((code: number) => {
    sendToRenderer('provider-exit', code)
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
async function initializeActiveProvider(projectPath: string): Promise<void> {
  console.log('[DEBUG] initializeActiveProvider - START, projectPath:', projectPath)
  const pm = getProcessManager()
  const config: ProviderConfig = {
    ...activeProviderConfig,
    projectPath,
  }

  try {
    // 1. Pegar a instância do provider ANTES de iniciar
    console.log('[DEBUG] initializeActiveProvider - getting provider:', activeProviderId)
    const provider = providerManager.getProvider(activeProviderId)
    console.log('[DEBUG] initializeActiveProvider - got provider:', provider?.getId())

    // 2. Injetar o ProcessManager antes do start()
    if (provider && 'setProcessManagerRef' in provider) {
      console.log('[DEBUG] initializeActiveProvider - injecting ProcessManager')
      ;(provider as any).setProcessManagerRef(pm)
      console.log('[DEBUG] initializeActiveProvider - ProcessManager injected')
    }

    // 3. Agora sim, iniciar o provider já com o ProcessManager disponível
    console.log('[DEBUG] initializeActiveProvider - calling setActiveProvider')
    await providerManager.setActiveProvider(activeProviderId, config)
    console.log('[DEBUG] initializeActiveProvider - setActiveProvider completed')

    sendToRenderer('provider-started', { providerId: activeProviderId })
    console.log('[DEBUG] initializeActiveProvider - END SUCCESS')
  } catch (error: any) {
    console.error('[DEBUG] initializeActiveProvider - ERROR:', error)
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
async function sendToActiveProvider(message: string, images?: string[]): Promise<boolean> {
  try {
    console.log('[Main] sendToActiveProvider - START, message length:', message.length)
    const activeProvider = providerManager.getActiveProvider()

    if (!activeProvider) {
      console.error('[Main] sendToActiveProvider - No active provider')
      sendToRenderer('provider-error', 'Nenhum provedor ativo')
      return false
    }

    console.log('[Main] sendToActiveProvider - Active provider:', activeProvider.getId())

    // Delegar SEMPRE para o Provider via ProviderManager.send()
    // O Provider sabe como lidar com seu próprio transporte (ProcessManager, stdio, HTTP, etc.)
    await providerManager.send(message, images)
    console.log('[Main] sendToActiveProvider - SUCCESS')
    return true
  } catch (error: any) {
    console.error('[Main] sendToActiveProvider - ERROR:', error)
    sendToRenderer('provider-error', `Erro ao enviar mensagem: ${error.message}`)
    return false
  }
}

// ============================================
// IPC HANDLERS - PROJECTS
// ============================================

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
 * Inicia o provedor para um projeto.
 * Se já estiver rodando com mesmo provedor/config, apenas reconecta.
 */
ipcMain.handle('start-provider', async (_event, projectPath: string, config?: Partial<ProviderConfig>) => {
  try {
    // Atualizar config se fornecida
    if (config) {
      activeProviderConfig = { ...activeProviderConfig, ...config }
    }

    // Se já está rodando com mesmo provedor, apenas atualiza config se mudou
    if (providerManager.isRunning() && providerManager.getActiveProviderId() === activeProviderId) {
      // Para simplificar, reiniciamos com nova config
      await stopActiveProvider()
    }

    await initializeActiveProvider(projectPath)
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
})

/**
 * Envia mensagem para o provedor ativo.
 */
ipcMain.handle('send-to-provider', async (_event, _chatId: string, message: string, images?: string[]) => {
  console.log('[Main] IPC send-to-provider RECEIVED - message length:', message.length, 'images:', images?.length || 0)
  const success = await sendToActiveProvider(message, images)
  console.log('[Main] IPC send-to-provider COMPLETED - success:', success)
  return { success }
})

/**
 * Para o provedor ativo.
 */
ipcMain.handle('stop-provider', async () => {
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
    const freeProvider = (providerManager.getActiveProvider() as any)?.getFreeProvider?.() || 'openrouter'
    return getModelOptionsForProvider(freeProvider)
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
      await initializeActiveProvider(currentProject.path)
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
        await initializeActiveProvider(lastProject.path)
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