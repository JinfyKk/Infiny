import { app, BrowserWindow, ipcMain, shell, dialog } from 'electron'
import { join } from 'path'
import { existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync, statSync } from 'fs'
import Store from 'electron-store'

const store = new Store({
  name: 'infiny-data',
  defaults: {
    projects: [],
    chats: [],
    settings: {
      model: 'claude-fable-5',
      effort: 'high',
      webSearch: false,
    }
  }
})

let mainWindow: BrowserWindow | null = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 600,
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#0f0f0f',
      symbolColor: '#ffffff',
      height: 40
    },
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false
    },
    backgroundColor: '#0f0f0f',
    show: false
  })

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(join(__dirname, '../index.html'))
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show()
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

// IPC Handlers
ipcMain.handle('get-projects', () => {
  const projects = store.get('projects', [])
  return projects as Array<{ id: string; name: string; path: string; lastOpened: number }>
})

ipcMain.handle('add-project', (_event, name: string, path: string) => {
  const projects = store.get('projects', []) as Array<{ id: string; name: string; path: string; lastOpened: number }>
  if (!projects.some((p) => p.path === path)) {
    const newProject = { id: `${Date.now()}`, name, path, lastOpened: Date.now() }
    projects.push(newProject)
    store.set('projects', projects)
  }
  return projects
})

ipcMain.handle('remove-project', (_event, id: string) => {
  const projects = store.get('projects', []) as any[]
  const filtered = projects.filter((p: any) => p.id !== id)
  store.set('projects', filtered)
  return filtered
})

ipcMain.handle('get-chats', (_event, projectPath?: string) => {
  const chats = store.get('chats', []) as any[]
  if (projectPath) {
    return chats.filter((c: any) => c.projectPath === projectPath)
  }
  return chats
})

ipcMain.handle('save-chat', (_event, chat: any) => {
  const chats = store.get('chats', []) as any[]
  const existingIndex = chats.findIndex((c: any) => c.id === chat.id)
  if (existingIndex >= 0) {
    chats[existingIndex] = chat
  } else {
    chats.push(chat)
  }
  store.set('chats', chats)
  return chat
})

ipcMain.handle('delete-chat', (_event, chatId: string) => {
  const chats = store.get('chats', []) as any[]
  const filtered = chats.filter((c: any) => c.id !== chatId)
  store.set('chats', filtered)
  return filtered
})

ipcMain.handle('get-settings', () => store.get('settings', {
  model: 'claude-fable-5',
  effort: 'high',
  webSearch: false,
}))

ipcMain.handle('update-settings', (_event, settings: any) => {
  const current = store.get('settings', {
    model: 'claude-fable-5',
    effort: 'high',
    webSearch: false,
  })
  store.set('settings', { ...current, ...settings })
  return store.get('settings')
})

ipcMain.handle('select-folder', async () => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    properties: ['openDirectory'],
    title: 'Selecionar pasta do projeto'
  })
  if (!result.canceled && result.filePaths.length > 0) {
    return result.filePaths[0]
  }
  return null
})

ipcMain.handle('read-file', (_event, filePath: string) => {
  try {
    if (existsSync(filePath)) {
      const stats = statSync(filePath)
      const content = readFileSync(filePath, 'utf-8')
      return { success: true, content, size: stats.size, name: filePath.split(/[\\/]/).pop() }
    }
    return { success: false, error: 'Arquivo não encontrado' }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
})

ipcMain.handle('write-file', (_event, filePath: string, content: string) => {
  try {
    const dir = filePath.substring(0, filePath.lastIndexOf('/'))
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true })
    }
    writeFileSync(filePath, content, 'utf-8')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
})

ipcMain.handle('list-files', (_event, dirPath: string) => {
  try {
    if (!existsSync(dirPath)) return []
    const files = readdirSync(dirPath)
    return files.map(file => {
      const fullPath = join(dirPath, file)
      const stats = statSync(fullPath)
      return {
        name: file,
        path: fullPath,
        isDirectory: stats.isDirectory(),
        size: stats.size,
        modified: stats.mtimeMs
      }
    })
  } catch {
    return []
  }
})

ipcMain.handle('open-external', (_event, url: string) => shell.openExternal(url))

ipcMain.handle('show-item-in-folder', (_event, path: string) => shell.showItemInFolder(path))

// Window controls
ipcMain.on('window-minimize', () => mainWindow?.minimize())
ipcMain.on('window-maximize', () => {
  if (mainWindow?.isMaximized()) mainWindow.unmaximize()
  else mainWindow?.maximize()
})
ipcMain.on('window-close', () => mainWindow?.close())

// Claude Code integration
let claudeProcess: any = null

ipcMain.handle('send-to-claude', async (_event, _chatId: string, message: string, _images: string[] = []) => {
  // Esta integração será implementada posteriormente
  // Por ora, apenas simula uma resposta
  mainWindow?.webContents.send('claude-output', 'Claude Code integration coming soon...\n')
  mainWindow?.webContents.send('claude-output', `\n> ${message}\n\n`)
  mainWindow?.webContents.send('claude-exit', 0)
  return { success: true }
})

ipcMain.handle('stop-claude', () => {
  if (claudeProcess) {
    claudeProcess.kill()
    claudeProcess = null
    return { success: true }
  }
  return { success: false, error: 'Nenhum processo rodando' }
})