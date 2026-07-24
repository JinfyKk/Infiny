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
  const handler = (_event: Electron.IpcRendererEvent, data: T) => callback(data)
  ipcRenderer.on(channel, handler)
  return () => ipcRenderer.off(channel, handler)
}

// Expor API ao renderer
contextBridge.exposeInMainWorld('electronAPI', {
  // Projects
  getProjects: () => ipcRenderer.invoke('get-projects'),
  createProject: (name: string, path: string) => ipcRenderer.invoke('create-project', name, path),
  selectFolder: () => ipcRenderer.invoke('select-folder'),
  loadProject: (name: string) => ipcRenderer.invoke('load-project', name),
  saveProject: (project: any) => ipcRenderer.invoke('save-project', project),
  deleteProject: (name: string) => ipcRenderer.invoke('delete-project', name),

  // Provider
  startProvider: (projectPath: string, config?: Partial<ProviderConfig>) =>
    ipcRenderer.invoke('start-provider', projectPath, config),
  sendToProvider: (chatId: string, message: string, images?: string[]) =>
    ipcRenderer.invoke('send-to-provider', chatId, message, images),
  stopProvider: () => ipcRenderer.invoke('stop-provider'),
  restartProvider: () => ipcRenderer.invoke('restart-provider'),
  getProviderConfig: () => ipcRenderer.invoke('get-provider-config'),
  saveProviderConfig: (config: Partial<ProviderConfig>) =>
    ipcRenderer.invoke('save-provider-config', config),
  getAvailableProviders: () => ipcRenderer.invoke('get-available-providers'),
  getProviderModels: () => ipcRenderer.invoke('get-provider-models'),
  // Alias for backward compatibility
  getAvailableModels: () => ipcRenderer.invoke('get-provider-models'),
  setActiveProvider: (providerId: string, config?: Partial<ProviderConfig>) =>
    ipcRenderer.invoke('set-active-provider', providerId, config),

  // Files
  openFile: (path: string) => ipcRenderer.invoke('open-file', path),
  getFileInfo: (path: string) => ipcRenderer.invoke('get-file-info', path),
  readFile: (path: string) => ipcRenderer.invoke('read-file', path),
  writeFile: (path: string, content: string) => ipcRenderer.invoke('write-file', path, content),
  listFiles: (dirPath: string) => ipcRenderer.invoke('list-files', dirPath),

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