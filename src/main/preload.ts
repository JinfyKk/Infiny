import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron'
import type { ProviderConfig } from '../providers/Provider'

/**
 * Preload script — a ÚNICA ponte segura entre o processo main (Node/Electron)
 * e o renderer (React, sandboxed, sem acesso direto a Node).
 *
 * Tudo que o renderer chama via `window.electronAPI.*` precisa estar
 * exposto aqui via contextBridge.exposeInMainWorld, espelhando 1:1 os
 * canais registrados com ipcMain.handle()/ipcMain.on() em src/main/main.ts.
 *
 * IMPORTANTE: este arquivo NÃO deve conter lógica de negócio (isso é
 * responsabilidade do ProcessManager / Provider / main.ts). Ele existe só
 * para repassar chamadas IPC de forma tipada e segura.
 */

// ============================================
// TIPOS
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

interface ProcessStatusEntry {
  processName: string
  status: string
  details?: string
}

interface ProcessStatusSnapshot {
  processes: ProcessStatusEntry[]
  providerHealthy: boolean
  providerReady: boolean
}

interface StartProviderResult {
  success: boolean
  error?: string
}

// ============================================
// HELPER: cria um listener de evento IPC que retorna sua própria função de cleanup
// ============================================

function createListener<T = unknown>(channel: string) {
  return (callback: (data: T) => void) => {
    const listener = (_event: IpcRendererEvent, data: T) => {
      const timestamp = new Date().toISOString()
      if (channel.startsWith('provider-') || channel.startsWith('process-')) {
        console.log(`[SEND 29] [${timestamp}] [renderer] preload createListener RECEIVED: ${channel}`, data)
      }
      callback(data)
    }
    ipcRenderer.on(channel, listener)
    return () => {
      ipcRenderer.removeListener(channel, listener)
    }
  }
}

// ============================================
// API EXPOSTA AO RENDERER
// ============================================

const electronAPI = {
  // ---------- Projetos ----------
  getProjects: (): Promise<ProjectConfig[]> => ipcRenderer.invoke('get-projects'),
  createProject: (name: string, path: string): Promise<ProjectConfig> =>
    ipcRenderer.invoke('create-project', name, path),
  selectFolder: (): Promise<string | undefined> => ipcRenderer.invoke('select-folder'),
  loadProject: (name: string): Promise<ProjectConfig | null> => ipcRenderer.invoke('load-project', name),
  saveProject: (project: ProjectConfig): Promise<void> => ipcRenderer.invoke('save-project', project),
  deleteProject: (name: string): Promise<void> => ipcRenderer.invoke('delete-project', name),

  // ---------- Sistema ----------
  getHomeDir: (): Promise<string> => ipcRenderer.invoke('get-home-dir'),

  // ---------- Provider / Processos ----------
  getProcessStatusSnapshot: (): Promise<ProcessStatusSnapshot> =>
    ipcRenderer.invoke('get-process-status-snapshot'),
  startProvider: (projectPath: string, config?: Partial<ProviderConfig>, source?: string): Promise<StartProviderResult> => {
    const timestamp = new Date().toISOString()
    console.log(`[SEND 06] [${timestamp}] [renderer] electronAPI.startProvider INVOKE`, { projectPath, config, source })
    return ipcRenderer.invoke('start-provider', projectPath, config, source)
  },
  sendToProvider: (chatId: string, message: string, images?: string[]): Promise<{ success: boolean }> => {
    const timestamp = new Date().toISOString()
    console.log(`[SEND 16] [${timestamp}] [renderer] electronAPI.sendToProvider INVOKE`, { chatId, messageLength: message.length, imagesCount: images?.length || 0 })
    return ipcRenderer.invoke('send-to-provider', chatId, message, images)
  },
  stopProvider: (chatId: string): Promise<{ success: boolean }> => ipcRenderer.invoke('stop-provider', chatId),
  restartProvider: (): Promise<StartProviderResult> => ipcRenderer.invoke('restart-provider'),
  getProviderConfig: (): Promise<{ providerId: string; config: ProviderConfig }> =>
    ipcRenderer.invoke('get-provider-config'),
  saveProviderConfig: (config: Partial<ProviderConfig>): Promise<void> =>
    ipcRenderer.invoke('save-provider-config', config),
  getAvailableProviders: (): Promise<unknown> => ipcRenderer.invoke('get-available-providers'),
  getAvailableModels: (): Promise<unknown[]> => ipcRenderer.invoke('get-provider-models'),
  setActiveProvider: (providerId: string, config?: Partial<ProviderConfig>): Promise<StartProviderResult> =>
    ipcRenderer.invoke('set-active-provider', providerId, config),

  // ---------- Arquivos ----------
  openFile: (path: string): Promise<void> => ipcRenderer.invoke('open-file', path),
  openExternal: (url: string): Promise<{ success: boolean; error?: string }> =>
    ipcRenderer.invoke('open-external', url),
  getFileInfo: (path: string): Promise<{ name?: string; size: number; modified: Date } | null> =>
    ipcRenderer.invoke('get-file-info', path),
  readFile: (path: string): Promise<{ success: boolean; content?: string; error?: string }> =>
    ipcRenderer.invoke('read-file', path),
  writeFile: (path: string, content: string): Promise<{ success: boolean; error?: string }> =>
    ipcRenderer.invoke('write-file', path, content),
  listFiles: (dirPath: string): Promise<unknown[]> => ipcRenderer.invoke('list-files', dirPath),

  // ---------- Controles de janela ----------
  windowMinimize: (): void => ipcRenderer.send('window-minimize'),
  windowMaximize: (): void => ipcRenderer.send('window-maximize'),
  windowClose: (): void => ipcRenderer.send('window-close'),

  // ---------- Eventos do Provider (stream de output do Claude CLI) ----------
  onProviderOutput: createListener<{ chatId: string; content: string }>('provider-output'),
  onProviderError: createListener<{ chatId: string; error: string }>('provider-error'),
  onProviderExit: createListener<{ chatId: string; code: number }>('provider-exit'),
  onProviderReady: createListener<{ providerId: string }>('provider-ready'),
  onProviderHealthy: createListener<Record<string, never>>('provider-healthy'),
  onProviderStarted: createListener<{ providerId: string }>('provider-started'),
  onProviderStopped: createListener<{ providerId: string }>('provider-stopped'),
  onProviderResponseComplete: createListener<{ chatId: string }>('provider-response-complete'),

  // ---------- Eventos de processos (fcc-server / claude) ----------
  onProcessStatus: createListener<{ processName: string; status: string; details?: string }>('process-status'),
  onProcessError: createListener<{ name: string; error: string }>('process-error'),
  onProcessStopped: createListener<{ name: string; code: number | null }>('process-stopped'),
  onProcessRestarting: createListener<{ processName: string; attempt: number }>('process-restarting'),
  onProcessStarted: createListener<{ name: string; command: string; args: string[] }>('process-started'),
  onProcessOutput: createListener<{ processName: string; output: string }>('process-output'),
}

export type ElectronAPI = typeof electronAPI

contextBridge.exposeInMainWorld('electronAPI', electronAPI)