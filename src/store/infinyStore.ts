import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface Project {
  id: string
  name: string
  path: string
  lastOpened: number
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  images?: string[]
  timestamp: number
  isStreaming?: boolean
}

export interface Chat {
  id: string
  projectId: string
  title: string
  messages: ChatMessage[]
  createdAt: number
  updatedAt: number
  summary?: string
  importantInfo?: string
}

export interface GeneratedFile {
  id: string
  projectId: string
  path: string
  name: string
  size: number
  type: string
  createdAt: number
  modified: number
}

export interface Settings {
  model: string
  effort: 'low' | 'medium' | 'high' | 'max' | 'xhigh'
  webSearch: boolean
  theme: 'pampas' | 'dark-premium' | 'tech-blue' | 'natural-green' | 'monochrome' | 'futuristic'
  provider: string
  hasCompletedOnboarding: boolean
}

interface InfinyState {
  projects: Project[]
  chats: Chat[]
  generatedFiles: GeneratedFile[]
  currentProject: Project | null
  currentChat: Chat | null
  settings: Settings
  isProviderRunning: boolean
  providerOutput: string
  isSidebarOpen: boolean
  isFilesPanelOpen: boolean
  pendingImages: string[]
  searchQuery: string

  // Actions
  addProject: (project: Omit<Project, 'id'>) => Project
  removeProject: (id: string) => void
  renameProject: (id: string, newName: string) => void
  setCurrentProject: (project: Project | null) => void
  addChat: (chat: Omit<Chat, 'id' | 'createdAt' | 'updatedAt'>) => Chat
  updateChat: (id: string, updates: Partial<Chat>) => void
  removeChat: (id: string) => void
  renameChat: (id: string, newTitle: string) => void
  setCurrentChat: (chat: Chat | null) => void
  addMessage: (chatId: string, message: Omit<ChatMessage, 'id'>) => void
  updateMessage: (chatId: string, messageId: string, updates: Partial<ChatMessage>) => void
  updateSettings: (settings: Partial<Settings>) => void
  setProviderRunning: (running: boolean) => void
  appendProviderOutput: (output: string) => void
  clearProviderOutput: () => void
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  toggleFilesPanel: () => void
  setFilesPanelOpen: (open: boolean) => void
  sendToProvider: (chatId: string, message: string, images?: string[]) => Promise<void>
  stopProvider: () => void
  addPendingImage: (base64: string) => void
  removePendingImage: (index: number) => void
  clearPendingImages: () => void
  setSearchQuery: (query: string) => void
  addGeneratedFile: (file: Omit<GeneratedFile, 'id'>) => void
  removeGeneratedFile: (id: string) => void
  getProjectFiles: (projectId: string) => GeneratedFile[]
  openGeneratedFile: (id: string) => Promise<void>
  completeOnboarding: () => void

  // Internal: Electron event handlers
  _setupElectronListeners: () => void
  _cleanupElectronListeners: () => void
}

const DEFAULT_SETTINGS: Settings = {
  model: 'claude-fable-5',
  effort: 'high',
  webSearch: false,
  theme: 'pampas',
  provider: 'claude',
  hasCompletedOnboarding: false,
}

let outputCleanup: (() => void) | null = null
let errorCleanup: (() => void) | null = null
let exitCleanup: (() => void) | null = null

export const useStore = create<InfinyState>()(
  persist(
    (set, get) => ({
      projects: [],
      chats: [],
      generatedFiles: [],
      currentProject: null,
      currentChat: null,
      settings: DEFAULT_SETTINGS,
      isProviderRunning: false,
      providerOutput: '',
      isSidebarOpen: true,
      isFilesPanelOpen: false,
      pendingImages: [],
      searchQuery: '',

      addProject: (project) => {
        const newProject: Project = { ...project, id: generateId() }
        set((state) => ({ projects: [...state.projects, newProject] }))
        return newProject
      },

      removeProject: (id) => {
        set((state) => ({
          projects: state.projects.filter((p) => p.id !== id),
          currentProject: state.currentProject?.id === id ? null : state.currentProject,
          chats: state.chats.filter((c) => c.projectId !== id),
        }))
      },

      renameProject: (id, newName) => {
        const trimmed = newName.trim()
        if (!trimmed) return

        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === id ? { ...p, name: trimmed } : p
          ),
          currentProject:
            state.currentProject?.id === id
              ? { ...state.currentProject, name: trimmed }
              : state.currentProject,
        }))
      },

      setCurrentProject: (project) => {
        set({ currentProject: project })
      },

      addChat: (chat) => {
        const newChat: Chat = {
          ...chat,
          id: generateId(),
          createdAt: Date.now(),
          updatedAt: Date.now(),
        }
        set((state) => ({ chats: [...state.chats, newChat], currentChat: newChat }))
        return newChat
      },

      updateChat: (id, updates) => {
        set((state) => ({
          chats: state.chats.map((c) =>
            c.id === id ? { ...c, ...updates, updatedAt: Date.now() } : c
          ),
          currentChat: state.currentChat?.id === id ? { ...state.currentChat, ...updates, updatedAt: Date.now() } : state.currentChat,
        }))
      },

      removeChat: (id) => {
        set((state) => ({
          chats: state.chats.filter((c) => c.id !== id),
          currentChat: state.currentChat?.id === id ? null : state.currentChat,
        }))
      },

      renameChat: (id, newTitle) => {
        const trimmed = newTitle.trim()
        if (!trimmed) return

        set((state) => ({
          chats: state.chats.map((c) =>
            c.id === id ? { ...c, title: trimmed, updatedAt: Date.now() } : c
          ),
          currentChat:
            state.currentChat?.id === id
              ? { ...state.currentChat, title: trimmed, updatedAt: Date.now() }
              : state.currentChat,
        }))
      },

      setCurrentChat: (chat) => {
        set({ currentChat: chat })
        // Configurar listeners do provider quando muda o chat
        get()._setupElectronListeners()
      },

      addMessage: (chatId, message) => {
        const newMessage: ChatMessage = { ...message, id: generateId() }
        set((state) => ({
          chats: state.chats.map((c) =>
            c.id === chatId ? { ...c, messages: [...c.messages, newMessage], updatedAt: Date.now() } : c
          ),
          currentChat: state.currentChat?.id === chatId
            ? { ...state.currentChat, messages: [...state.currentChat.messages, newMessage], updatedAt: Date.now() }
            : state.currentChat,
        }))
      },

      updateMessage: (chatId, messageId, updates) => {
        set((state) => ({
          chats: state.chats.map((c) =>
            c.id === chatId
              ? { ...c, messages: c.messages.map((m) => (m.id === messageId ? { ...m, ...updates } : m)), updatedAt: Date.now() }
              : c
          ),
          currentChat: state.currentChat?.id === chatId
            ? { ...state.currentChat, messages: state.currentChat.messages.map((m) => (m.id === messageId ? { ...m, ...updates } : m)), updatedAt: Date.now() }
            : state.currentChat,
        }))
      },

      updateSettings: (settings) => {
        set((state) => ({ settings: { ...state.settings, ...settings } }))
      },

      setProviderRunning: (running) => {
        set({ isProviderRunning: running })
      },

      appendProviderOutput: (output) => {
        set((state) => ({ providerOutput: state.providerOutput + output }))
      },

      clearProviderOutput: () => {
        set({ providerOutput: '' })
      },

      toggleSidebar: () => {
        set((state) => ({ isSidebarOpen: !state.isSidebarOpen }))
      },

      setSidebarOpen: (open) => {
        set({ isSidebarOpen: open })
      },

      toggleFilesPanel: () => {
        set((state) => ({ isFilesPanelOpen: !state.isFilesPanelOpen }))
      },

      setFilesPanelOpen: (open) => {
        set({ isFilesPanelOpen: open })
      },

      sendToProvider: async (chatId: string, message: string, images: string[] = []) => {
        const state = get()
        const { currentProject, settings } = state

        console.log('[Renderer] [Pipeline] sendToProvider CALLED', { chatId, messageLength: message.length, imagesCount: images.length, isProviderRunning: state.isProviderRunning })

        if (!currentProject) {
          console.error('[Renderer] [Pipeline] sendToProvider FAILED: No current project')
          return
        }

        let assistantMessageId = ''

        // Iniciar provider se não estiver rodando
        if (!state.isProviderRunning) {
          try {
            console.log('[Renderer] [Pipeline] sendToProvider - Starting provider for project:', currentProject.path)
            await window.electronAPI?.startProvider(currentProject.path, {
              model: settings.model,
              effort: settings.effort,
              webSearch: settings.webSearch,
            })
            console.log('[Renderer] [Pipeline] sendToProvider - startProvider returned, waiting 500ms')
            // Aguardar um pouco para o provider iniciar
            await new Promise((resolve) => setTimeout(resolve, 500))
          } catch (error) {
            console.error('[Renderer] [Pipeline] sendToProvider - Error starting provider:', error)
            return
          }
        }

        // Enviar mensagem
        try {
          console.log('[Renderer] [Pipeline] sendToProvider - Sending message via IPC')
          set({ isProviderRunning: true, providerOutput: '' })

          const assistantMessage: ChatMessage = {
            id: generateId(),
            role: 'assistant',
            content: '',
            timestamp: Date.now(),
            isStreaming: true,
          }
          assistantMessageId = assistantMessage.id

          set((state) => ({
            chats: state.chats.map((c) =>
              c.id === chatId ? { ...c, messages: [...c.messages, assistantMessage], updatedAt: Date.now() } : c
            ),
            currentChat: state.currentChat?.id === chatId
              ? { ...state.currentChat, messages: [...state.currentChat.messages, assistantMessage], updatedAt: Date.now() }
              : state.currentChat,
          }))

          // Enviar para o provider via IPC
          console.log('[Renderer] [Pipeline] sendToProvider - Calling electronAPI.sendToProvider')
          await window.electronAPI?.sendToProvider(chatId, message, images)
          console.log('[Renderer] [Pipeline] sendToProvider - IPC call completed')
        } catch (error) {
          console.error('[Renderer] [Pipeline] sendToProvider - Error sending message:', error)
          set({ isProviderRunning: false })

          // Remover mensagem de streaming em caso de erro
          if (assistantMessageId) {
            set((state) => ({
              chats: state.chats.map((c) =>
                c.id === chatId
                  ? { ...c, messages: c.messages.filter((m) => m.id !== assistantMessageId), updatedAt: Date.now() }
                  : c
              ),
              currentChat: state.currentChat?.id === chatId
                ? { ...state.currentChat, messages: state.currentChat.messages.filter((m) => m.id !== assistantMessageId), updatedAt: Date.now() }
                : state.currentChat,
            }))
          }
        }
      },

      stopProvider: () => {
        window.electronAPI?.stopProvider()
        set({ isProviderRunning: false })
      },

      addPendingImage: (base64) => {
        set((state) => ({ pendingImages: [...state.pendingImages, base64] }))
      },

      removePendingImage: (index) => {
        set((state) => ({ pendingImages: state.pendingImages.filter((_, i) => i !== index) }))
      },

      clearPendingImages: () => {
        set({ pendingImages: [] })
      },

      setSearchQuery: (query) => {
        set({ searchQuery: query })
      },

      addGeneratedFile: (file) => {
        const newFile: GeneratedFile = { ...file, id: generateId() }
        set((state) => ({ generatedFiles: [...state.generatedFiles, newFile] }))
      },

      removeGeneratedFile: (id) => {
        set((state) => ({ generatedFiles: state.generatedFiles.filter((f) => f.id !== id) }))
      },

      getProjectFiles: (projectId) => {
        return get().generatedFiles.filter((f) => f.projectId === projectId)
      },

      openGeneratedFile: async (id: string) => {
        const file = get().generatedFiles.find((f) => f.id === id)
        if (file) {
          await window.electronAPI?.openFile(file.path)
        }
      },

      completeOnboarding: () => {
        set((state) => ({ settings: { ...state.settings, hasCompletedOnboarding: true } }))
      },

      _setupElectronListeners: () => {
        // Limpar listeners anteriores
        get()._cleanupElectronListeners()

        // Listener para saída do provider (streaming)
        outputCleanup = window.electronAPI?.onProviderOutput((data: string) => {
          console.log('[Renderer] [Pipeline] onProviderOutput RECEIVED', { dataLength: data.length, dataPreview: data.slice(0, 100) })
          get().appendProviderOutput(data)

          // Atualizar a mensagem de streaming
          const currentChat = get().currentChat
          if (currentChat) {
            const lastMessage = currentChat.messages[currentChat.messages.length - 1]
            if (lastMessage && lastMessage.role === 'assistant' && lastMessage.isStreaming) {
              console.log('[Renderer] [Pipeline] onProviderOutput - Updating streaming message')
              get().updateMessage(currentChat.id, lastMessage.id, {
                content: lastMessage.content + data,
              })
            } else {
              console.warn('[Renderer] [Pipeline] onProviderOutput - No streaming message to update, lastMessage:', lastMessage?.role, lastMessage?.isStreaming)
            }
          }
        })

        errorCleanup = window.electronAPI?.onProviderError((data: string) => {
          console.error('[Renderer] [Pipeline] onProviderError RECEIVED:', data)
          get().appendProviderOutput(`\n[Erro: ${data}]`)
        })

        exitCleanup = window.electronAPI?.onProviderExit((code: number) => {
          console.log('[Renderer] [Pipeline] onProviderExit RECEIVED, code:', code)
          set({ isProviderRunning: false })

          // Finalizar mensagem de streaming
          const currentChat = get().currentChat
          if (currentChat) {
            const lastMessage = currentChat.messages[currentChat.messages.length - 1]
            if (lastMessage && lastMessage.role === 'assistant' && lastMessage.isStreaming) {
              console.log('[Renderer] [Pipeline] onProviderExit - Finalizing streaming message')
              get().updateMessage(currentChat.id, lastMessage.id, {
                isStreaming: false,
              })
            }
          }
        })
      },

      _cleanupElectronListeners: () => {
        if (outputCleanup) outputCleanup()
        if (errorCleanup) errorCleanup()
        if (exitCleanup) exitCleanup()
        outputCleanup = null
        errorCleanup = null
        exitCleanup = null
      },
    }),
    {
      name: 'infiny-storage',
      partialize: (state) => ({
        projects: state.projects,
        chats: state.chats.map((c) => ({ ...c, messages: c.messages.slice(-50) })),
        settings: state.settings,
        isSidebarOpen: state.isSidebarOpen,
      }),
    }
  )
)

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

// Exportar constantes para uso em componentes
export const MODELS = [
  'claude-fable-5',
  'claude-opus-4-8',
  'claude-sonnet-5',
  'claude-haiku-4-5-20251001',
  'claude-haiku-4-5',
] as const

export const EFFORTS = ['low', 'medium', 'high', 'max', 'xhigh'] as const

export const PROVIDERS = ['claude', 'free-claude', 'gemini', 'codex', 'ollama', 'openrouter', 'nim'] as const