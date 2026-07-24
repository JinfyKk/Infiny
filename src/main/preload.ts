import { contextBridge, ipcRenderer } from 'electron'

/**
 * Tipos dos eventos do ProcessManager encaminhados ao renderer
 */
export interface ProcessStatusEvent {
  processName: string
  status: 'starting' | 'running' | 'stopped' | 'error'
  details?: string
}

export interface ProcessErrorEvent {
  name: string
  error: string
}

export interface ProcessStoppedEvent {
  name: string
  code: number | null
}

export interface ProcessRestartingEvent {
  processName: string
  attempt: number
}

export interface ProcessStartedEvent {
  name: string
  command: string
  args: string[]
}

export interface ProcessOutputEvent {
  processName: string
  output: string
}

/**
 * API exposta ao renderer via contextBridge
 */
export interface ElectronAPI {
  // Project management
  getProjects: () => Promise<any[]>
  createProject: (name: string, path: string) => Promise<any>
  selectFolder: () => Promise<string | undefined>
  loadProject: (name: string) => Promise<any>
  saveProject: (project: any) => Promise<void>
  deleteProject: (name: string) => Promise<void>

  // Provider management
  startProvider: (projectPath: string, config?: Partial<ProviderConfig>) => Promise<{ success: boolean; error?: string }>
  sendToProvider: (chatId: string, message: string, images?: string[]) => Promise<{ success: boolean }>
  stopProvider: () => Promise<{ success: boolean }>
  restartProvider: () => Promise<{ success: boolean; error?: string }>
  getProviderConfig: () => Promise<{ providerId: string; config: ProviderConfig }>
  saveProviderConfig: (config: Partial<ProviderConfig>) => Promise<void>
  getAvailableProviders: () => Promise<Array<{ id: string; name: string }>>
  getProviderModels: () => Promise<any[]>
  // Alias for backward compatibility
  getAvailableModels: () => Promise<any[]>
  setActiveProvider: (providerId: string, config?: Partial<ProviderConfig>) => Promise<{ success: boolean; error?: string }>

  // Files
  openFile: (path: string) => Promise<void>
  getFileInfo: (path: string) => Promise<{ name: string; size: number; modified: Date } | null>
  readFile: (path: string) => Promise<{ success: boolean; content?: string; error?: string }>
  writeFile: (path: string, content: string) => Promise<{ success: boolean; error?: string }>
  listFiles: (dirPath: string) => Promise<any[]>

  // Process events (from ProcessManager)
  onProcessStatus: (callback: (event: ProcessStatusEvent) => void) => () => void
  onProcessError: (callback: (event: ProcessErrorEvent) => void) => () => void
  onProcessStopped: (callback: (event: ProcessStoppedEvent) => void) => () => void
  onProcessRestarting: (callback: (event: ProcessRestartingEvent) => void) => () => void
  onProcessStarted: (callback: (event: ProcessStartedEvent) => void) => () => void
  onProcessOutput: (callback: (event: ProcessOutputEvent) => void) => () => void

  // Provider events (from ProviderManager)
  onProviderOutput: (callback: (data: string) => void) => () => void
  onProviderError: (callback: (error: string) => void) => () => void
  onProviderExit: (callback: (code: number) => void) => () => void
}

/**
 * Configuração do Provider (espelha ProviderConfig do main)
 */
export interface ProviderConfig {
  model: string
  effort: string
  webSearch: boolean
  projectPath: string
  [key: string]: any
}

/**
 * Helper para criar listeners IPC com cleanup automático
 */
function createIpcListener<T>(channel: string, callback: (event: T) => void): () => void {
  const handler = (_event: Electron.IpcRendererEvent, data: T) => {
    console.log('[Preload] [IPC] Received:', channel, data)
    callback(data)
  }
  ipcRenderer.on(channel, handler)
  return () => ipcRenderer.off(channel, handler)
}

// Expor API ao renderer
contextBridge.exposeInMainWorld('electronAPI', {
  // Projects
  getProjects: () => {
    console.log('[Preload] [IPC] Invoke: get-projects')
    return ipcRenderer.invoke('get-projects')
  },
  createProject: (name: string, path: string) => {
    console.log('[Preload] [IPC] Invoke: create-project', { name, path })
    return ipcRenderer.invoke('create-project', name, path)
  },
  selectFolder: () => {
    console.log('[Preload] [IPC] Invoke: select-folder')
    return ipcRenderer.invoke('select-folder')
  },
  loadProject: (name: string) => {
    console.log('[Preload] [IPC] Invoke: load-project', { name })
    return ipcRenderer.invoke('load-project', name)
  },
  saveProject: (project: any) => {
    console.log('[Preload] [IPC] Invoke: save-project', { name: project?.name })
    return ipcRenderer.invoke('save-project', project)
  },
  deleteProject: (name: string) => {
    console.log('[Preload] [IPC] Invoke: delete-project', { name })
    return ipcRenderer.invoke('delete-project', name)
  },

  // Provider
  startProvider: (projectPath: string, config?: Partial<ProviderConfig>) => {
    console.log('[Preload] [IPC] Invoke: start-provider', { projectPath, config })
    return ipcRenderer.invoke('start-provider', projectPath, config)
  },
  sendToProvider: (chatId: string, message: string, images?: string[]) => {
    console.log('[Preload] [IPC] Invoke: send-to-provider', { chatId, messageLength: message.length, imagesCount: images?.length || 0 })
    return ipcRenderer.invoke('send-to-provider', chatId, message, images)
  },
  stopProvider: () => {
    console.log('[Preload] [IPC] Invoke: stop-provider')
    return ipcRenderer.invoke('stop-provider')
  },
  restartProvider: () => {
    console.log('[Preload] [IPC] Invoke: restart-provider')
    return ipcRenderer.invoke('restart-provider')
  },
  getProviderConfig: () => {
    console.log('[Preload] [IPC] Invoke: get-provider-config')
    return ipcRenderer.invoke('get-provider-config')
  },
  saveProviderConfig: (config: Partial<ProviderConfig>) => {
    console.log('[Preload] [IPC] Invoke: save-provider-config', config)
    return ipcRenderer.invoke('save-provider-config', config)
  },
  getAvailableProviders: () => {
    console.log('[Preload] [IPC] Invoke: get-available-providers')
    return ipcRenderer.invoke('get-available-providers')
  },
  getProviderModels: () => {
    console.log('[Preload] [IPC] Invoke: get-provider-models')
    return ipcRenderer.invoke('get-provider-models')
  },
  // Alias for backward compatibility
  getAvailableModels: () => {
    console.log('[Preload] [IPC] Invoke: get-provider-models (alias)')
    return ipcRenderer.invoke('get-provider-models')
  },
  setActiveProvider: (providerId: string, config?: Partial<ProviderConfig>) => {
    console.log('[Preload] [IPC] Invoke: set-active-provider', { providerId, config })
    return ipcRenderer.invoke('set-active-provider', providerId, config)
  },

  // Files
  openFile: (path: string) => {
    console.log('[Preload] [IPC] Invoke: open-file', { path })
    return ipcRenderer.invoke('open-file', path)
  },
  getFileInfo: (path: string) => {
    console.log('[Preload] [IPC] Invoke: get-file-info', { path })
    return ipcRenderer.invoke('get-file-info', path)
  },
  readFile: (path: string) => {
    console.log('[Preload] [IPC] Invoke: read-file', { path })
    return ipcRenderer.invoke('read-file', path)
  },
  writeFile: (path: string, content: string) => {
    console.log('[Preload] [IPC] Invoke: write-file', { path, contentLength: content.length })
    return ipcRenderer.invoke('write-file', path, content)
  },
  listFiles: (dirPath: string) => {
    console.log('[Preload] [IPC] Invoke: list-files', { dirPath })
    return ipcRenderer.invoke('list-files', dirPath)
  },

  // Process events (from ProcessManager via main.ts)
  onProcessStatus: (callback: (event: ProcessStatusEvent) => void) =>
    createIpcListener<ProcessStatusEvent>('process-status', callback),
  onProcessError: (callback: (event: ProcessErrorEvent) => void) =>
    createIpcListener<ProcessErrorEvent>('process-error', callback),
  onProcessStopped: (callback: (event: ProcessStoppedEvent) => void) =>
    createIpcListener<ProcessStoppedEvent>('process-stopped', callback),
  onProcessRestarting: (callback: (event: ProcessRestartingEvent) => void) =>
    createIpcListener<ProcessRestartingEvent>('process-restarting', callback),
  onProcessStarted: (callback: (event: ProcessStartedEvent) => void) =>
    createIpcListener<ProcessStartedEvent>('process-started', callback),
  onProcessOutput: (callback: (event: ProcessOutputEvent) => void) =>
    createIpcListener<ProcessOutputEvent>('process-output', callback),

  // Provider events (from ProviderManager via main.ts)
  onProviderOutput: (callback: (data: string) => void) =>
    createIpcListener<string>('provider-output', callback),
  onProviderError: (callback: (error: string) => void) =>
    createIpcListener<string>('provider-error', callback),
  onProviderExit: (callback: (code: number) => void) =>
    createIpcListener<number>('provider-exit', callback),
})

export {}