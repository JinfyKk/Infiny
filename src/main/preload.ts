import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron'

/**
 * Interface da API exposta ao renderer (preload).
 * Todas as chamadas de Provider são genéricas - não expõem detalhes de implementação.
 * Os eventos do ProcessManager devem espelhar EXATAMENTE o formato enviado pelo main.ts
 * (main.ts é a fonte da verdade).
 */
interface ElectronAPI {
  // Projects
  getProjects: () => Promise<Array<{ id: string; name: string; path: string; lastOpened: number }>>
  addProject: (name: string, path: string) => Promise<Array<{ id: string; name: string; path: string; lastOpened: number }>>
  removeProject: (id: string) => Promise<Array<{ id: string; name: string; path: string; lastOpened: number }>>
  selectFolder: () => Promise<string | null>

  // Chats (legacy - kept for compatibility)
  getChats: (projectPath?: string) => Promise<any[]>
  saveChat: (chat: any) => Promise<any>
  deleteChat: (chatId: string) => Promise<any[]>

  // Settings / Provider Config
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

  // Provider (generic - replaces claude-specific)
  sendToProvider: (chatId: string, message: string, images?: string[]) => Promise<{ success: boolean; error?: string }>
  startProvider: (projectPath: string, config?: { model?: string; effort?: string; webSearch?: boolean }) => Promise<{ success: boolean; error?: string }>
  stopProvider: () => Promise<{ success: boolean; error?: string }>
  restartProvider: () => Promise<{ success: boolean; error?: string }>
  getProviderConfig: () => Promise<{ providerId: string; config: any }>
  saveProviderConfig: (config: any) => Promise<void>
  getAvailableProviders: () => Promise<Array<{ id: string; name: string }>>
  setActiveProvider: (providerId: string, config?: any) => Promise<{ success: boolean; error?: string }>
  getAvailableModels: () => Promise<Array<{ value: string; label: string; description: string }>>

  // Provider Events (generic - replaces claude-output, claude-error, claude-exit)
  onProviderOutput: (callback: (data: string) => void) => () => void
  onProviderError: (callback: (data: string) => void) => () => void
  onProviderExit: (callback: (code: number) => void) => () => void

  // Process Manager Events - espelham EXATAMENTE o formato do main.ts
  // main.ts envia: { name, command, args }
  onProcessStarted: (callback: (data: { name: string; command: string; args: string[] }) => void) => () => void
  // main.ts envia: { name, code }
  onProcessStopped: (callback: (data: { name: string; code: number | null }) => void) => () => void
  // main.ts envia: { name, error }
  onProcessError: (callback: (data: { name: string; error: string }) => void) => () => void
  // main.ts envia: { processName, output }
  onProcessOutput: (callback: (data: { processName: string; output: string }) => void) => () => void
  // main.ts envia: { processName, attempt }
  onProcessRestarting: (callback: (data: { processName: string; attempt: number }) => void) => () => void
  // main.ts envia: { processName, status, details } (via status-changed)
  onProcessStatus: (callback: (data: { processName: string; status: string; details?: string }) => void) => () => void
}

contextBridge.exposeInMainWorld('electronAPI', {
  // Projects
  getProjects: () => ipcRenderer.invoke('get-projects'),
  addProject: (name: string, path: string) => ipcRenderer.invoke('add-project', name, path),
  removeProject: (id: string) => ipcRenderer.invoke('remove-project', id),
  selectFolder: () => ipcRenderer.invoke('select-folder'),

  // Chats (legacy)
  getChats: (projectPath?: string) => ipcRenderer.invoke('get-chats', projectPath),
  saveChat: (chat: any) => ipcRenderer.invoke('save-chat', chat),
  deleteChat: (chatId: string) => ipcRenderer.invoke('delete-chat', chatId),

  // Settings
  getSettings: () => ipcRenderer.invoke('get-provider-config'),
  updateSettings: (settings: any) => ipcRenderer.invoke('save-provider-config', settings),

  // Files
  readFile: (path: string) => ipcRenderer.invoke('read-file', path),
  writeFile: (path: string, content: string) => ipcRenderer.invoke('write-file', path, content),
  listFiles: (dirPath: string) => ipcRenderer.invoke('list-files', dirPath),
  openFile: (path: string) => ipcRenderer.invoke('open-file', path),
  showItemInFolder: (path: string) => ipcRenderer.invoke('show-item-in-folder', path),

  // Window controls
  windowMinimize: () => ipcRenderer.send('window-minimize'),
  windowMaximize: () => ipcRenderer.send('window-maximize'),
  windowClose: () => ipcRenderer.send('window-close'),

  // Provider (generic)
  sendToProvider: (chatId: string, message: string, images?: string[]) =>
    ipcRenderer.invoke('send-to-provider', chatId, message, images),
  startProvider: (projectPath: string, config?: { model?: string; effort?: string; webSearch?: boolean }) =>
    ipcRenderer.invoke('start-provider', projectPath, config),
  stopProvider: () => ipcRenderer.invoke('stop-provider'),
  restartProvider: () => ipcRenderer.invoke('restart-provider'),
  getProviderConfig: () => ipcRenderer.invoke('get-provider-config'),
  saveProviderConfig: (config: any) => ipcRenderer.invoke('save-provider-config', config),
  getAvailableProviders: () => ipcRenderer.invoke('get-available-providers'),
  setActiveProvider: (providerId: string, config?: any) =>
    ipcRenderer.invoke('set-active-provider', providerId, config),
  getAvailableModels: () => ipcRenderer.invoke('get-provider-models'),

  // Provider Events (generic)
  onProviderOutput: (callback: (data: string) => void) => {
    const listener = (_event: IpcRendererEvent, data: string) => callback(data)
    ipcRenderer.on('provider-output', listener)
    return () => ipcRenderer.off('provider-output', listener)
  },
  onProviderError: (callback: (data: string) => void) => {
    const listener = (_event: IpcRendererEvent, data: string) => callback(data)
    ipcRenderer.on('provider-error', listener)
    return () => ipcRenderer.off('provider-error', listener)
  },
  onProviderExit: (callback: (code: number) => void) => {
    const listener = (_event: IpcRendererEvent, code: number) => callback(code)
    ipcRenderer.on('provider-exit', listener)
    return () => ipcRenderer.off('provider-exit', listener)
  },

  // Process Manager Events - espelham EXATAMENTE o formato do main.ts
  // main.ts: sendToRenderer('process-started', { name, command, args })
  onProcessStarted: (callback: (data: { name: string; command: string; args: string[] }) => void) => {
    const listener = (_event: IpcRendererEvent, data: { name: string; command: string; args: string[] }) => callback(data)
    ipcRenderer.on('process-started', listener)
    return () => ipcRenderer.off('process-started', listener)
  },
  // main.ts: sendToRenderer('process-stopped', { name, code })
  onProcessStopped: (callback: (data: { name: string; code: number | null }) => void) => {
    const listener = (_event: IpcRendererEvent, data: { name: string; code: number | null }) => callback(data)
    ipcRenderer.on('process-stopped', listener)
    return () => ipcRenderer.off('process-stopped', listener)
  },
  // main.ts: sendToRenderer('process-error', { name, error })
  onProcessError: (callback: (data: { name: string; error: string }) => void) => {
    const listener = (_event: IpcRendererEvent, data: { name: string; error: string }) => callback(data)
    ipcRenderer.on('process-error', listener)
    return () => ipcRenderer.off('process-error', listener)
  },
  // main.ts: sendToRenderer('process-output', { processName, output })
  onProcessOutput: (callback: (data: { processName: string; output: string }) => void) => {
    const listener = (_event: IpcRendererEvent, data: { processName: string; output: string }) => callback(data)
    ipcRenderer.on('process-output', listener)
    return () => ipcRenderer.off('process-output', listener)
  },
  // main.ts: sendToRenderer('process-restarting', { processName, attempt })
  onProcessRestarting: (callback: (data: { processName: string; attempt: number }) => void) => {
    const listener = (_event: IpcRendererEvent, data: { processName: string; attempt: number }) => callback(data)
    ipcRenderer.on('process-restarting', listener)
    return () => ipcRenderer.off('process-restarting', listener)
  },
  // main.ts: sendToRenderer('process-status', { processName, status, details }) via status-changed
  onProcessStatus: (callback: (data: { processName: string; status: string; details?: string }) => void) => {
    const listener = (_event: IpcRendererEvent, data: { processName: string; status: string; details?: string }) => callback(data)
    ipcRenderer.on('process-status', listener)
    return () => ipcRenderer.off('process-status', listener)
  },
})

export type { ElectronAPI }