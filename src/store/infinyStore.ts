import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Constante para chats independentes (sem projeto)
export const INDEPENDENT_PROJECT_ID = 'independent'

export interface Project {
  id: string
  name: string
  path: string
  lastOpened: number
}

export interface MainProjectConfig {
  path: string
  name: string
  lastOpened: number
  history: ChatMessage[]
  summary: string
  importantInfo: string
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
  isGenerating?: boolean
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
  effort: 'low' | 'medium' | 'high' | 'max' | 'xhigh' | 'ultracode'
  webSearch: boolean
  theme: 'turtly-light' | 'turtly-forest' | 'pampas' | 'dark-premium' | 'tech-blue' | 'natural-green' | 'monochrome' | 'futuristic'
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
  isSidebarOpen: boolean
  isFilesPanelOpen: boolean
  pendingImages: string[]
  searchQuery: string

  // Actions
  addProject: (project: Omit<Project, 'id'>) => Project
  removeProject: (id: string) => void
  renameProject: (id: string, newName: string) => void
  setCurrentProject: (project: Project | null) => void
  loadChatsForProject: (projectId: string, projectPath: string) => Promise<void>
  addChat: (chat: Omit<Chat, 'id' | 'createdAt' | 'updatedAt'>) => Chat
  addIndependentChat: () => Chat
  updateChat: (id: string, updates: Partial<Chat>) => void
  removeChat: (id: string) => void
  renameChat: (id: string, newTitle: string) => void
  setCurrentChat: (chat: Chat | null) => void
  addMessage: (chatId: string, message: Omit<ChatMessage, 'id'>) => void
  updateMessage: (chatId: string, messageId: string, updates: Partial<ChatMessage>) => void
  updateSettings: (settings: Partial<Settings>) => void
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  toggleFilesPanel: () => void
  setFilesPanelOpen: (open: boolean) => void
  sendToProvider: (chatId: string, message: string, images?: string[]) => Promise<void>
  stopProvider: (chatId: string) => void
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

  // Selectors for per-chat streaming state
  isChatGenerating: (chatId: string) => boolean
  setChatGenerating: (chatId: string, generating: boolean) => void
}

const DEFAULT_SETTINGS: Settings = {
  model: 'claude-fable-5',
  effort: 'low',
  webSearch: false,
  theme: 'turtly-light',
  provider: 'free-claude',
  hasCompletedOnboarding: false,
}

let outputCleanup: (() => void) | null = null
let errorCleanup: (() => void) | null = null
let exitCleanup: (() => void) | null = null
let responseCompleteCleanup: (() => void) | null = null
let providerStartPromise: Promise<void> | null = null

export const useStore = create<InfinyState>()(
  persist(
    (set, get) => ({
      projects: [],
      chats: [],
      generatedFiles: [],
      currentProject: null,
      currentChat: null,
      settings: DEFAULT_SETTINGS,
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
          chats: state.chats.filter((c) => c.projectId !== id && c.projectId !== INDEPENDENT_PROJECT_ID),
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
        console.log('[Store] setCurrentProject:', project?.name)
        set({ currentProject: project })
        if (project) {
          get().loadChatsForProject(project.id, project.path)
        }
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

      addIndependentChat: () => {
        const newChat: Chat = {
          id: generateId(),
          projectId: INDEPENDENT_PROJECT_ID,
          title: 'Nova conversa independente',
          messages: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
          summary: '',
          importantInfo: '',
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
        console.log('[Store] setCurrentChat:', chat?.title)
        set({ currentChat: chat })
        // Configurar listeners do provider quando muda o chat
        get()._setupElectronListeners()
      },

      addMessage: (chatId, message) => {
        const newMessage: ChatMessage = { ...message, id: generateId() }
        set((state) => {
          const chat = state.chats.find((c) => c.id === chatId)
          const isFirstUserMessage = chat && chat.messages.length === 0 && message.role === 'user'
          const shouldAutoName = isFirstUserMessage && (chat?.title === 'Nova conversa' || chat?.title === 'Novo Chat' || chat?.title === 'Nova conversa independente')

          return {
            chats: state.chats.map((c) => {
              if (c.id !== chatId) return c
              let updatedChat = { ...c, messages: [...c.messages, newMessage], updatedAt: Date.now() }
              if (shouldAutoName) {
                updatedChat = { ...updatedChat, title: generateChatTitle(message.content) }
              }
              return updatedChat
            }),
            currentChat: state.currentChat?.id === chatId
              ? (() => {
                  let updated = { ...state.currentChat, messages: [...state.currentChat.messages, newMessage], updatedAt: Date.now() }
                  if (shouldAutoName) {
                    updated = { ...updated, title: generateChatTitle(message.content) }
                  }
                  return updated
                })()
              : state.currentChat,
          }
        })
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
        // Sync to main process so provider restarts use the updated config
        if (window.electronAPI?.saveProviderConfig) {
          window.electronAPI.saveProviderConfig(settings).catch((err) => {
            console.error('[infinyStore] Failed to sync settings to main:', err)
          })
        }
      },

      // Per-chat streaming state selectors
      isChatGenerating: (chatId: string) => {
        const chat = get().chats.find((c) => c.id === chatId)
        return chat?.isGenerating === true
      },

      setChatGenerating: (chatId: string, generating: boolean) => {
        set((state) => ({
          chats: state.chats.map((c) =>
            c.id === chatId ? { ...c, isGenerating: generating, updatedAt: Date.now() } : c
          ),
          currentChat: state.currentChat?.id === chatId
            ? { ...state.currentChat, isGenerating: generating, updatedAt: Date.now() }
            : state.currentChat,
        }))
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
        const { currentProject, settings, chats } = state

        const timestamp = new Date().toISOString()
        const providerId = settings.provider
        const model = settings.model

        // Find the chat to determine its projectId
        const chat = chats.find(c => c.id === chatId)
        const isIndependentChat = chat?.projectId === INDEPENDENT_PROJECT_ID

        // For independent chats, use a default working directory (user home)
        // For project chats, use the project path
        const projectPath = isIndependentChat
          ? (process.env.USERPROFILE || process.env.HOME || process.cwd())
          : currentProject?.path

        console.log(`[SEND 04] [${timestamp}] [renderer] sendToProvider START`, {
          chatId,
          providerId,
          model,
          projectPath,
          isIndependentChat,
          messageLength: message.length,
          imagesCount: images.length,
          isChatGenerating: state.isChatGenerating(chatId),
        })

        if (!projectPath) {
          console.error(`[SEND 04] [${timestamp}] [renderer] sendToProvider FAILED: No project path available`)
          return
        }

        let assistantMessageId = ''

        // SEMPRE chamar startProvider com a config atual.
        // O ProviderManager no main process tem lógica idempotente:
        // só reinicia se provider, projectPath ou config (model/effort/webSearch) mudaram.
        // Isso garante que mudanças de settings tenham efeito na próxima mensagem.
        let myStartPromise: Promise<void> | null = null
        try {
          if (!providerStartPromise) {
            console.log(`[SEND 05] [${timestamp}] [renderer] Starting/ensuring provider for ${isIndependentChat ? 'independent chat' : 'project'}`, {
              projectPath,
              model: settings.model,
              effort: settings.effort,
              webSearch: settings.webSearch,
            })
            myStartPromise = (async () => {
              await window.electronAPI?.startProvider(
                projectPath,
                {
                  model: settings.model,
                  effort: settings.effort,
                  webSearch: settings.webSearch,
                },
                'renderer:infinyStore.sendToProvider'
              )
              console.log(`[SEND 05b] [${timestamp}] [renderer] startProvider returned, waiting 500ms`)
              // Aguardar um pouco para o provider iniciar
              await new Promise((resolve) => setTimeout(resolve, 500))
            })()
            providerStartPromise = myStartPromise
          } else {
            console.log(`[SEND 05] [${timestamp}] [renderer] Reusing in-flight startProvider call`)
          }

          await providerStartPromise
        } catch (error) {
          console.error(`[SEND 05] [${timestamp}] [renderer] Error starting provider:`, error)
          return
        } finally {
          // Só limpa o mutex se ainda apontar para a promise que ESTA
          // chamada criou (evita apagar a referência de uma chamada mais
          // nova que possa ter sido criada nesse meio-tempo).
          if (myStartPromise && providerStartPromise === myStartPromise) {
            providerStartPromise = null
          }
        }

        // Enviar mensagem
        try {
          console.log(`[SEND 06] [${timestamp}] [renderer] Sending message via IPC`)
          // Marcar chat como gerando
          get().setChatGenerating(chatId, true)

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

          // Enviar para o provider via IPC (inclui chatId)
          console.log(`[SEND 16] [${timestamp}] [renderer] Calling electronAPI.sendToProvider`)
          await window.electronAPI?.sendToProvider(chatId, message, images)
          console.log(`[SEND 16b] [${timestamp}] [renderer] IPC call completed`)
        } catch (error) {
          console.error(`[SEND 06] [${timestamp}] [renderer] Error sending message:`, error)
          get().setChatGenerating(chatId, false)

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

      stopProvider: (chatId: string) => {
        window.electronAPI?.stopProvider(chatId)
        get().setChatGenerating(chatId, false)
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

      loadChatsForProject: async (projectId: string, projectPath: string) => {
        try {
          // Load project from main process (includes chat history)
          // Use project name from store, not path parsing
          const project = get().projects.find((p) => p.id === projectId)
          const projectName = project?.name || projectPath.split(/[\\/]/).pop() || ''
          const projectData = await window.electronAPI?.loadProject(projectName)
          if (!projectData) {
            console.log('[Store] No project data found for:', projectName)
            return
          }

          // Convert main process project history to chats
          // The main process stores all messages in project.history as a flat array
          // We need to group them into chats based on some logic, or just use the first chat
          // For now, let's check if there are existing chats for this project in local store
          const existingChats = get().chats.filter((c) => c.projectId === projectId)
          if (existingChats.length > 0) {
            console.log('[Store] Using existing', existingChats.length, 'chats for project:', projectId)
            // Always select the first chat if we don't have a current chat for this project
            const currentChat = get().currentChat
            if (!currentChat || currentChat.projectId !== projectId) {
              get().setCurrentChat(existingChats[0])
            }
            return
          }

          // If no local chats, create a chat from the project history
          if (projectData.history && projectData.history.length > 0) {
            console.log('[Store] Creating chat from project history:', projectData.history.length, 'messages')
            const chatMessages: ChatMessage[] = projectData.history.map((m) => ({
              id: generateId(),
              role: m.role,
              content: m.content,
              images: m.images,
              timestamp: m.timestamp,
              isStreaming: false,
            }))

            const newChat: Chat = {
              id: generateId(),
              projectId,
              title: projectData.summary || 'Continuação do chat',
              messages: chatMessages,
              createdAt: projectData.lastOpened || Date.now(),
              updatedAt: Date.now(),
              summary: projectData.summary,
              importantInfo: projectData.importantInfo,
            }

            set((state) => ({ chats: [...state.chats, newChat] }))
            get().setCurrentChat(newChat)
          } else {
            // No history - create a new empty chat
            console.log('[Store] No history for project, creating new empty chat')
            const newChat = get().addChat({
              projectId,
              title: 'Nova conversa',
              messages: [],
              summary: '',
              importantInfo: '',
            })
            get().setCurrentChat(newChat)
          }
        } catch (error) {
          console.error('[Store] Failed to load chats for project:', error)
        }
      },

      _setupElectronListeners: () => {
        const timestamp = new Date().toISOString()
        const chatId = get().currentChat?.id
        console.log(`[SEND 29] [${timestamp}] [renderer] _setupElectronListeners called`, { chatId, hasOutputCleanup: !!outputCleanup, hasErrorCleanup: !!errorCleanup, hasExitCleanup: !!exitCleanup, hasResponseCompleteCleanup: !!responseCompleteCleanup })
        // Limpar listeners anteriores
        get()._cleanupElectronListeners()

        // Listener para saída do provider (streaming) - agora recebe chatId
        outputCleanup = window.electronAPI?.onProviderOutput((data: { chatId: string; content: string }) => {
          const receiveTimestamp = new Date().toISOString()
          console.log(`[SEND 30] [${receiveTimestamp}] [renderer] onProviderOutput RECEIVED`, { chatId: data.chatId, contentLength: data.content.length })
          const state = get()
          const chat = state.chats.find((c) => c.id === data.chatId)
          if (chat) {
            const lastMessage = chat.messages[chat.messages.length - 1]
            if (lastMessage && lastMessage.role === 'assistant' && lastMessage.isStreaming) {
              console.log(`[SEND 31] [${receiveTimestamp}] [renderer] updateMessage CALL (append content)`, { chatId: data.chatId, messageId: lastMessage.id, newContentLength: lastMessage.content.length + data.content.length })
              get().updateMessage(data.chatId, lastMessage.id, {
                content: lastMessage.content + data.content,
              })
            } else {
              console.warn(`[SEND 30] [${receiveTimestamp}] [renderer] onProviderOutput - No streaming message to update for chat`, data.chatId, 'lastMessage:', lastMessage?.role, lastMessage?.isStreaming)
            }
          }
        })

        errorCleanup = window.electronAPI?.onProviderError((data: { chatId: string; error: string }) => {
          const receiveTimestamp = new Date().toISOString()
          console.error(`[SEND 30-ERR] [${receiveTimestamp}] [renderer] onProviderError RECEIVED:`, data)
          // Append error to streaming message
          const state = get()
          const chat = state.chats.find((c) => c.id === data.chatId)
          if (chat) {
            const lastMessage = chat.messages[chat.messages.length - 1]
            if (lastMessage && lastMessage.role === 'assistant' && lastMessage.isStreaming) {
              get().updateMessage(data.chatId, lastMessage.id, {
                content: lastMessage.content + `\n[Erro: ${data.error}]`,
              })
            }
          }
        })

        exitCleanup = window.electronAPI?.onProviderExit((data: { chatId: string; code: number }) => {
          const receiveTimestamp = new Date().toISOString()
          console.log(`[END 06] [${receiveTimestamp}] [renderer] onProviderExit RECEIVED`, { chatId: data.chatId, code: data.code })
          get().setChatGenerating(data.chatId, false)

          // Finalizar mensagem de streaming
          const state = get()
          const chat = state.chats.find((c) => c.id === data.chatId)
          if (chat) {
            const lastMessage = chat.messages[chat.messages.length - 1]
            if (lastMessage && lastMessage.role === 'assistant' && lastMessage.isStreaming) {
              console.log(`[END 08] [${receiveTimestamp}] [renderer] onProviderExit - Finalizing streaming message (isStreaming=false)`, { chatId: data.chatId, messageId: lastMessage.id })
              get().updateMessage(data.chatId, lastMessage.id, {
                isStreaming: false,
              })
            }
          }
        })

        // Listener para fim de resposta (quando provider emite 'result' type)
        responseCompleteCleanup = window.electronAPI?.onProviderResponseComplete((data: { chatId: string }) => {
          const receiveTimestamp = new Date().toISOString()
          console.log(`[END 06] [${receiveTimestamp}] [renderer] onProviderResponseComplete RECEIVED`, { chatId: data.chatId })
          get().setChatGenerating(data.chatId, false)

          // Finalizar mensagem de streaming
          const state = get()
          const chat = state.chats.find((c) => c.id === data.chatId)
          if (chat) {
            const lastMessage = chat.messages[chat.messages.length - 1]
            if (lastMessage && lastMessage.role === 'assistant' && lastMessage.isStreaming) {
              console.log(`[END 08] [${receiveTimestamp}] [renderer] onProviderResponseComplete - Finalizing streaming message (isStreaming=false)`, { chatId: data.chatId, messageId: lastMessage.id })
              get().updateMessage(data.chatId, lastMessage.id, {
                isStreaming: false,
              })
            }
          }
        })
      },

      _cleanupElectronListeners: () => {
        const timestamp = new Date().toISOString()
        console.log(`[SEND 29-CLEANUP] [${timestamp}] [renderer] _cleanupElectronListeners called`, { hasOutputCleanup: !!outputCleanup, hasErrorCleanup: !!errorCleanup, hasExitCleanup: !!exitCleanup, hasResponseCompleteCleanup: !!responseCompleteCleanup })
        if (outputCleanup) outputCleanup()
        if (errorCleanup) errorCleanup()
        if (exitCleanup) exitCleanup()
        if (responseCompleteCleanup) responseCompleteCleanup()
        outputCleanup = null
        errorCleanup = null
        exitCleanup = null
        responseCompleteCleanup = null
      },
    }),
    {
      name: 'infiny-storage',
      partialize: (state) => ({
        projects: state.projects,
        chats: state.chats.map((c) => {
          const { isGenerating, ...rest } = c
          return { ...rest, messages: c.messages.slice(-50), isGenerating: false }
        }),
        settings: state.settings,
        isSidebarOpen: state.isSidebarOpen,
      }),
    }
  )
)

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

/**
 * Gera um título curto para o chat baseado na primeira mensagem do usuário.
 * Estilo ChatGPT: extrai palavras-chave e trunca para ~35 caracteres.
 */
function generateChatTitle(firstMessage: string): string {
  const text = firstMessage.trim()
  if (!text) return 'Nova conversa'

  // Remover saudações comuns e palavras de preenchimento
  const stopWords = new Set([
    'o', 'a', 'os', 'as', 'um', 'uma', 'uns', 'umas',
    'de', 'do', 'da', 'dos', 'das', 'em', 'no', 'na', 'nos', 'nas',
    'por', 'para', 'com', 'sem', 'sobre', 'entre', 'apos', 'ate',
    'e', 'ou', 'mas', 'que', 'se', 'como', 'qual', 'quais',
    'quanto', 'quantos', 'quanta', 'quantas', 'onde', 'quando',
    'olá', 'oi', 'ola', 'eai', 'e aí', 'tudo', 'bem', '?', '!', '.',
    'please', 'por favor', 'poderia', 'pode', 'poderias', 'me', 'dizer',
    'explicar', 'explica', 'me ajude', 'ajuda', 'preciso', 'gostaria',
    'quero', 'queria', 'quais', 'qual', 'quanto', 'tempo'
  ])

  // Extrair palavras significativas
  const words = text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !stopWords.has(w))
    .slice(0, 8)

  let title = words.join(' ')

  // Capitalizar primeira letra de cada palavra
  title = title
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')

  // Truncar se muito longo
  if (title.length > 35) {
    title = title.slice(0, 35).trim() + '…'
  }

  // Fallback se não extraiu nada útil
  return title || 'Nova conversa'
}

// Exportar constantes para uso em componentes
// Estes modelos devem corresponder aos suportados pelo FreeClaudeProvider.getSupportedModels()
export const MODELS = [
  'claude-fable-5',
  'claude-opus-5',
  'claude-sonnet-5',
  'claude-haiku-5',
  'claude-haiku-4-5-20251001', // legacy
] as const

export const EFFORTS = ['low', 'medium', 'high', 'max', 'xhigh', 'ultracode'] as const

export const PROVIDERS = ['claude', 'free-claude', 'gemini', 'codex', 'ollama', 'openrouter', 'nim'] as const