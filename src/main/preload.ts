import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron'

interface ElectronAPI {
  // Projects
  getProjects: () => Promise<Array<{ id: string; name: string; path: string; lastOpened: number }>>
  addProject: (name: string, path: string) => Promise<Array<{ id: string; name: string; path: string; lastOpened: number }>>
  removeProject: (id: string) => Promise<Array<{ id: string; name: string; path: string; lastOpened: number }>>
  selectFolder: () => Promise<string | null>

  // Chats
  getChats: (projectPath?: string) => Promise<any[]>
  saveChat: (chat: any) => Promise<any>
  deleteChat: (chatId: string) => Promise<any[]>

  // Settings
  getSettings: () => Promise<{ model: string; effort: string; webSearch: boolean }>
  updateSettings: (settings: any) => Promise<{ model: string; effort: string; webSearch: boolean }>

  // Files
  readFile: (path: string) => Promise<{ success: boolean; content?: string; size?: number; name?: string; error?: string }>
  writeFile: (path: string, content: string) => Promise<{ success: boolean; error?: string }>
  listFiles: (dirPath: string) => Promise<Array<{ name: string; path: string; isDirectory: boolean; size: number; modified: number }>>
  openFile: (path: string) => Promise<void>
  showItemInFolder: (path: string) => Promise<void>

  // Window controls
  windowMinimize: () => void
  windowMaximize: () => void
  windowClose: () => void

  // Claude events
  sendToClaude: (chatId: string, message: string, images?: string[]) => Promise<{ success: boolean; error?: string }>
  stopClaude: () => Promise<{ success: boolean; error?: string }>
  onClaudeOutput: (callback: (data: string) => void) => () => void
  onClaudeError: (callback: (data: string) => void) => () => void
  onClaudeExit: (callback: (code: number) => void) => () => void
}

contextBridge.exposeInMainWorld('electronAPI', {
  // Projects
  getProjects: () => ipcRenderer.invoke('get-projects'),
  addProject: (name: string, path: string) => ipcRenderer.invoke('add-project', name, path),
  removeProject: (id: string) => ipcRenderer.invoke('remove-project', id),
  selectFolder: () => ipcRenderer.invoke('select-folder'),

  // Chats
  getChats: (projectPath?: string) => ipcRenderer.invoke('get-chats', projectPath),
  saveChat: (chat: any) => ipcRenderer.invoke('save-chat', chat),
  deleteChat: (chatId: string) => ipcRenderer.invoke('delete-chat', chatId),

  // Settings
  getSettings: () => ipcRenderer.invoke('get-settings'),
  updateSettings: (settings: any) => ipcRenderer.invoke('update-settings', settings),

  // Files
  readFile: (path: string) => ipcRenderer.invoke('read-file', path),
  writeFile: (path: string, content: string) => ipcRenderer.invoke('write-file', path, content),
  listFiles: (dirPath: string) => ipcRenderer.invoke('list-files', dirPath),
  openFile: (path: string) => ipcRenderer.invoke('open-external', path),
  showItemInFolder: (path: string) => ipcRenderer.invoke('show-item-in-folder', path),

  // Window controls
  windowMinimize: () => ipcRenderer.send('window-minimize'),
  windowMaximize: () => ipcRenderer.send('window-maximize'),
  windowClose: () => ipcRenderer.send('window-close'),

  // Claude events
  sendToClaude: (chatId: string, message: string, images?: string[]) =>
    ipcRenderer.invoke('send-to-claude', chatId, message, images),
  stopClaude: () => ipcRenderer.invoke('stop-claude'),
  onClaudeOutput: (callback: (data: string) => void) => {
    const listener = (_event: IpcRendererEvent, data: string) => callback(data)
    ipcRenderer.on('claude-output', listener)
    return () => ipcRenderer.off('claude-output', listener)
  },
  onClaudeError: (callback: (data: string) => void) => {
    const listener = (_event: IpcRendererEvent, data: string) => callback(data)
    ipcRenderer.on('claude-error', listener)
    return () => ipcRenderer.off('claude-error', listener)
  },
  onClaudeExit: (callback: (code: number) => void) => {
    const listener = (_event: IpcRendererEvent, code: number) => callback(code)
    ipcRenderer.on('claude-exit', listener)
    return () => ipcRenderer.off('claude-exit', listener)
  },
})

export type { ElectronAPI }