import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron'
import { join } from 'path'
import { spawn, ChildProcess } from 'child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync, statSync } from 'fs'

// TypeScript types for our preload
interface ClaudeProcessManager {
  process: ChildProcess | null
  currentProject: string
  currentModel: string
  currentEffort: string
  webSearchEnabled: boolean
}

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

let mainWindow: BrowserWindow | null = null
const claudeManager: ClaudeProcessManager = {
  process: null,
  currentProject: '',
  currentModel: 'claude-fable-5',
  currentEffort: 'high',
  webSearchEnabled: false
}

const PROJECTS_DIR = join(app.getPath('userData'), 'projects')
const CONFIG_FILE = join(app.getPath('userData'), 'config.json')

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
      sandbox: true
    },
    titleBarStyle: 'hidden',
    trafficLightPosition: { x: 12, y: 12 },
    backgroundColor: '#0d0d0d',
    show: false
  })

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(join(__dirname, '../dist/index.html'))
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show()
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

function initApp() {
  if (!existsSync(PROJECTS_DIR)) {
    mkdirSync(PROJECTS_DIR, { recursive: true })
  }

  if (!existsSync(CONFIG_FILE)) {
    writeFileSync(CONFIG_FILE, JSON.stringify({ projects: [], lastProject: '' }))
  }
}

function getProjects(): ProjectConfig[] {
  try {
    const config = JSON.parse(readFileSync(CONFIG_FILE, 'utf-8'))
    return config.projects || []
  } catch {
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
  const existingIndex = projects.findIndex(p => p.name === project.name)
  if (existingIndex >= 0) {
    projects[existingIndex] = { ...project, history: project.history.slice(-100) }
  } else {
    projects.push({ ...project, history: project.history.slice(-100) })
  }
  saveProjects(projects)
}

function startClaudeProcess(projectPath: string, model: string, effort: string, webSearch: boolean) {
  if (claudeManager.process) {
    claudeManager.process.kill()
  }

  const args = ['--model', model, '--effort', effort]
  if (webSearch) args.push('--web-search')

  const claudeProcess = spawn('claude', args, {
    cwd: projectPath,
    env: { ...process.env, CLAUDE_CODE_IDE: 'infiny' }
  })

  claudeProcess.stdout?.on('data', (data) => {
    mainWindow?.webContents.send('claude-output', data.toString())
  })

  claudeProcess.stderr?.on('data', (data) => {
    mainWindow?.webContents.send('claude-error', data.toString())
  })

  claudeProcess.on('close', (code) => {
    mainWindow?.webContents.send('claude-exit', code)
    claudeManager.process = null
  })

  claudeManager.process = claudeProcess
  claudeManager.currentProject = projectPath
  claudeManager.currentModel = model
  claudeManager.currentEffort = effort
  claudeManager.webSearchEnabled = webSearch

  return claudeProcess
}

function sendToClaude(input: string, images?: string[]) {
  if (!claudeManager.process) return false

  const message = images && images.length > 0
    ? JSON.stringify({ type: 'user', content: [{ type: 'text', text: input }, ...images.map(img => ({ type: 'image', source: { type: 'base64', data: img } }))] })
    : input

  claudeManager.process.stdin?.write(message + '\n')
  return true
}

function stopClaude() {
  if (claudeManager.process) {
    claudeManager.process.kill('SIGINT')
    claudeManager.process = null
  }
}

// IPC Handlers
ipcMain.handle('get-projects', () => getProjects())

ipcMain.handle('create-project', async (_, name: string, path: string) => {
  const projects = getProjects()
  if (projects.some(p => p.name === name)) {
    throw new Error('Projeto já existe')
  }

  const project: ProjectConfig = {
    path,
    name,
    lastOpened: Date.now(),
    history: [],
    summary: '',
    importantInfo: ''
  }

  saveProject(project)
  return project
})

ipcMain.handle('select-folder', async () => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    properties: ['openDirectory']
  })
  return result.filePaths[0]
})

ipcMain.handle('load-project', (_, name: string) => {
  const project = loadProject(name)
  if (project) {
    project.lastOpened = Date.now()
    saveProject(project)
  }
  return project
})

ipcMain.handle('save-project', (_, project: ProjectConfig) => {
  saveProject(project)
})

ipcMain.handle('delete-project', (_, name: string) => {
  const projects = getProjects().filter(p => p.name !== name)
  saveProjects(projects)
  const path = getProjectPath(name)
  if (existsSync(path)) {
    require('fs').unlinkSync(path)
  }
})

ipcMain.handle('start-claude', (_, projectPath: string, model: string, effort: string, webSearch: boolean) => {
  startClaudeProcess(projectPath, model, effort, webSearch)
})

ipcMain.handle('send-to-claude', (_, input: string, images?: string[]) => {
  return sendToClaude(input, images)
})

ipcMain.handle('stop-claude', () => {
  stopClaude()
})

ipcMain.handle('get-config', () => ({
  model: claudeManager.currentModel,
  effort: claudeManager.currentEffort,
  webSearch: claudeManager.webSearchEnabled
}))

ipcMain.handle('save-config', (_, config: { model?: string; effort?: string; webSearch?: boolean }) => {
  if (config.model) claudeManager.currentModel = config.model
  if (config.effort) claudeManager.currentEffort = config.effort
  if (config.webSearch !== undefined) claudeManager.webSearchEnabled = config.webSearch
})

ipcMain.handle('open-file', async (_, path: string) => {
  await shell.openPath(path)
})

ipcMain.handle('get-file-info', (_, path: string) => {
  try {
    const stats = statSync(path)
    return { name: path.split(/[/\\]/).pop(), size: stats.size, modified: stats.mtime }
  } catch {
    return null
  }
})

app.whenReady().then(() => {
  initApp()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('before-quit', () => {
  stopClaude()
})