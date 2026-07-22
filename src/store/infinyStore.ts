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
}

interface InfinyState {
  projects: Project[]
  chats: Chat[]
  generatedFiles: GeneratedFile[]
  currentProject: Project | null
  currentChat: Chat | null
  settings: Settings
  isClaudeRunning: boolean
  claudeOutput: string
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
  setClaudeRunning: (running: boolean) => void
  appendClaudeOutput: (output: string) => void
  clearClaudeOutput: () => void
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  toggleFilesPanel: () => void
  setFilesPanelOpen: (open: boolean) => void
  sendToClaude: (chatId: string, message: string, images?: string[]) => Promise<void>
  stopClaude: () => void
  addPendingImage: (base64: string) => void
  removePendingImage: (index: number) => void
  clearPendingImages: () => void
  setSearchQuery: (query: string) => void
  addGeneratedFile: (file: Omit<GeneratedFile, 'id'>) => void
  removeGeneratedFile: (id: string) => void
  getProjectFiles: (projectId: string) => GeneratedFile[]
  openGeneratedFile: (id: string) => void
}

const DEFAULT_SETTINGS: Settings = {
  model: 'claude-fable-5',
  effort: 'high',
  webSearch: false
}

const MODELS = [
  'claude-fable-5',
  'claude-opus-4-8',
  'claude-sonnet-5',
  'claude-haiku-4-5',
] as const

const EFFORTS = ['low', 'medium', 'high', 'max', 'xhigh'] as const

export const useStore = create<InfinyState>()(
  persist(
    (set, get) => ({
      projects: [],
      chats: [],
      generatedFiles: [],
      currentProject: null,
      currentChat: null,
      settings: DEFAULT_SETTINGS,
      isClaudeRunning: false,
      claudeOutput: '',
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
      c.id === id
        ? { ...c, title: trimmed, updatedAt: Date.now() }
        : c
    ),
    currentChat:
      state.currentChat?.id === id
        ? {
            ...state.currentChat,
            title: trimmed,
            updatedAt: Date.now(),
          }
        : state.currentChat,
  }))
},

setCurrentChat: (chat) => {
  set({ currentChat: chat })
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

      setClaudeRunning: (running) => {
        set({ isClaudeRunning: running })
      },

      appendClaudeOutput: (output) => {
        set((state) => ({ claudeOutput: state.claudeOutput + output }))
      },

      clearClaudeOutput: () => {
        set({ claudeOutput: '' })
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
        set((state) => ({ generatedFiles: state.generatedFiles.filter(f => f.id !== id) }))
      },

      getProjectFiles: (projectId) => {
        return get().generatedFiles.filter(f => f.projectId === projectId)
      },

      setFilesPanelOpen: (open) => {
        set({ isFilesPanelOpen: open })
      },

      sendToClaude: async (chatId: string, message: string, images: string[] = []) => {
        // Será implementado via IPC no main process
        console.log('sendToClaude chamado', { chatId, message, images })
      },

      stopClaude: () => {
        set({ isClaudeRunning: false })
      },

      openGeneratedFile: async (id: string) => {
        const file = get().generatedFiles.find(f => f.id === id)
        if (file) {
          await window.electronAPI?.openFile(file.path)
        }
      },
    }),
    {
      name: 'infiny-storage',
      partialize: (state) => ({
        projects: state.projects,
        chats: state.chats.map(c => ({ ...c, messages: c.messages.slice(-50) })),
        settings: state.settings,
        isSidebarOpen: state.isSidebarOpen,
      }),
    }
  )
)

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

export { MODELS, EFFORTS }