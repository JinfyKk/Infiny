import { FolderGit2, Plus, MessageSquare, ChevronRight, X, FolderOpen, Trash2, Edit2 } from 'lucide-react'
import { useState } from 'react'
import { cn, formatDate } from '@/lib/utils'
import { useStore } from '@/store/infinyStore'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

interface SidebarProps {
  isOpen: boolean
  onToggle: () => void
}

// Prefixo usado para diferenciar "editando o nome do projeto" de "editando o título de um chat"
// (ambos guardados no mesmo estado editingId, já que só um pode estar em edição por vez)
const PROJECT_EDIT_SUFFIX = '-project-edit'

export function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const {
    projects,
    chats,
    currentProject,
    currentChat,
    addProject,
    removeProject,
    renameProject,
    setCurrentProject,
    addChat,
    setCurrentChat,
    removeChat,
    renameChat,
    searchQuery,
    setSearchQuery,
  } = useStore()

  const [expandedProject, setExpandedProject] = useState<string | null>(null)
  const [showNewProject, setShowNewProject] = useState(false)
  const [newProjectPath, setNewProjectPath] = useState('')
  const [newProjectName, setNewProjectName] = useState('')

  // Estado único de edição: guarda o id sendo editado (projeto usa sufixo, chat usa o id puro)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')

  // Removido: projectChats filtrado era baseado em currentProject, causando bug no botão "Novo Chat"
  // Agora filtramos diretamente dentro do map para cada projeto

  const handleCreateProject = () => {
    if (newProjectPath && newProjectName) {
      const project = addProject({ name: newProjectName, path: newProjectPath, lastOpened: Date.now() })
      setCurrentProject(project)
      setShowNewProject(false)
      setNewProjectPath('')
      setNewProjectName('')
    }
  }

  const handleSelectFolder = async () => {
    const path = prompt('Digite o caminho da pasta do projeto:')
    if (path) {
      setNewProjectPath(path)
      setNewProjectName(path.split(/[\\/]/).pop() || 'Novo Projeto')
    }
  }

  const startEditProject = (projectId: string, currentName: string) => {
    setEditingId(projectId + PROJECT_EDIT_SUFFIX)
    setEditValue(currentName)
  }

  const startEditChat = (chatId: string, currentTitle: string) => {
    setEditingId(chatId)
    setEditValue(currentTitle)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditValue('')
  }

  const saveProjectEdit = (projectId: string) => {
    renameProject(projectId, editValue)
    cancelEdit()
  }

  const saveChatEdit = (chatId: string) => {
    renameChat(chatId, editValue)
    cancelEdit()
  }

  if (!isOpen) return null

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-full bg-background border-r border-border flex flex-col',
        'transition-all duration-300 ease-out',
        'w-72',
      )}
    >
      {/* Header do Sidebar */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
            <FolderGit2 className="w-5 h-5 text-primary" />
          </div>
          <span className="font-semibold text-lg text-textPrimary">Infiny</span>
        </div>
        <Button variant="ghost" size="icon" onClick={onToggle} className="lg:hidden" aria-label="Fechar sidebar">
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* Barra de busca */}
      <div className="p-4 border-b border-border">
        <Input
          placeholder="Buscar projetos e chats..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full"
        />
      </div>

      {/* Botão novo projeto */}
      <div className="px-4 py-2">
        {showNewProject ? (
          <div className="space-y-2">
            <Input
              placeholder="Nome do projeto"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              className="w-full"
            />
            <div className="flex gap-2">
              <Input
                placeholder="Caminho da pasta"
                value={newProjectPath}
                onChange={(e) => setNewProjectPath(e.target.value)}
                className="flex-1"
              />
              <Button variant="secondary" size="sm" onClick={handleSelectFolder}>
                <FolderOpen className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" size="sm" onClick={() => setShowNewProject(false)}>
                Cancelar
              </Button>
              <Button size="sm" onClick={handleCreateProject} disabled={!newProjectPath || !newProjectName}>
                Criar
              </Button>
            </div>
          </div>
        ) : (
          <Button variant="secondary" className="w-full justify-start gap-2" onClick={() => setShowNewProject(true)}>
            <Plus className="w-4 h-4" />
            <span>Novo Projeto</span>
          </Button>
        )}
      </div>

      {/* Lista de projetos */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {projects.length === 0 ? (
          <div className="px-4 py-8 text-center text-textMuted">
            <FolderGit2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Nenhum projeto ainda</p>
            <p className="text-xs mt-1">Clique em "Novo Projeto" para começar</p>
          </div>
        ) : (
          projects.map((project) => {
            const isActive = currentProject?.id === project.id
            const projectChatsCount = chats.filter((c) => c.projectId === project.id).length
            const isExpanded = expandedProject === project.id
            const isEditingThisProject = editingId === project.id + PROJECT_EDIT_SUFFIX

            return (
              <div key={project.id} className="group relative">
                {isEditingThisProject ? (
                  <div className="flex items-center gap-1 px-3 py-2">
                    <FolderGit2 className="w-5 h-5 flex-shrink-0 text-primary" />
                    <input
                      type="text"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveProjectEdit(project.id)
                        if (e.key === 'Escape') cancelEdit()
                      }}
                      onBlur={() => saveProjectEdit(project.id)}
                      autoFocus
                      className="flex-1 px-2 py-1 text-sm bg-surface border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                ) : (
                  <button
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-150',
                      'hover:bg-surfaceHover',
                      isActive && 'bg-primary/10 text-primary border-l-2 border-primary',
                      !isActive && 'text-textSecondary',
                    )}
                    onClick={() => {
                      setCurrentProject(project)
                      setExpandedProject(isExpanded ? null : project.id)
                    }}
                    onContextMenu={(e) => {
                      e.preventDefault()
                      startEditProject(project.id, project.name)
                    }}
                  >
                    <FolderGit2
                      className={cn('w-5 h-5 flex-shrink-0 transition-transform', isExpanded && 'rotate-90')}
                    />
                    <div className="flex-1 min-w-0 truncate flex items-center gap-2">
                      <span className="font-medium truncate">{project.name}</span>
                      {projectChatsCount > 0 && (
                        <span
                          className={cn(
                            'text-xs px-1.5 py-0.5 rounded-full',
                            isActive ? 'bg-primary/20 text-primary' : 'bg-surfaceHover text-textMuted',
                          )}
                        >
                          {projectChatsCount}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span
                        role="button"
                        tabIndex={0}
                        className="h-7 w-7 inline-flex items-center justify-center rounded-md hover:bg-surfaceHover"
                        onClick={(e) => {
                          e.stopPropagation()
                          startEditProject(project.id, project.name)
                        }}
                        aria-label="Renomear projeto"
                      >
                        <Edit2 className="w-4 h-4" />
                      </span>
                      <span
                        role="button"
                        tabIndex={0}
                        className="h-7 w-7 inline-flex items-center justify-center rounded-md hover:bg-surfaceHover"
                        onClick={(e) => {
                          e.stopPropagation()
                          removeProject(project.id)
                        }}
                        aria-label="Remover projeto"
                      >
                        <Trash2 className="w-4 h-4 text-error" />
                      </span>
                    </div>
                  </button>
                )}

                {/* Chats do projeto */}
                {isExpanded && (
                  <div
                    className="ml-8 mt-1 space-y-1 border-l border-border/50 pl-2"
                    role="group"
                    aria-label={`${project.name} chats`}
                  >
                    {chats.filter(c => c.projectId === project.id).length === 0 ? (
                      <button
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg text-textMuted hover:bg-surfaceHover hover:text-textPrimary transition-colors"
                        onClick={() => {
                          const chat = addChat({ projectId: project.id, title: 'Novo Chat', messages: [] })
                          setCurrentChat(chat)
                        }}
                      >
                        <Plus className="w-4 h-4" />
                        <span>Novo Chat</span>
                      </button>
                    ) : (
                      chats.filter(c => c.projectId === project.id).map((chat) => (
                        <div key={chat.id} className="relative group/chat">
                          {editingId === chat.id ? (
                            <div className="flex gap-1 px-1">
                              <input
                                type="text"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') saveChatEdit(chat.id)
                                  if (e.key === 'Escape') cancelEdit()
                                }}
                                onBlur={() => saveChatEdit(chat.id)}
                                autoFocus
                                className="flex-1 px-2 py-1 text-sm bg-surface border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary"
                              />
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={cancelEdit}>
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          ) : (
                            <button
                              className={cn(
                                'w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg text-left transition-all duration-150',
                                'hover:bg-surfaceHover',
                                currentChat?.id === chat.id
                                  ? 'bg-primary/10 text-primary font-medium'
                                  : 'text-textSecondary hover:text-textPrimary',
                              )}
                              onClick={() => setCurrentChat(chat)}
                              onContextMenu={(e) => {
                                e.preventDefault()
                                startEditChat(chat.id, chat.title)
                              }}
                            >
                              <MessageSquare
                                className={cn(
                                  'w-4 h-4 flex-shrink-0',
                                  currentChat?.id === chat.id && 'text-primary',
                                )}
                              />
                              <span className="flex-1 truncate">{chat.title}</span>
                              <span className="text-xs text-textMuted">{formatDate(chat.updatedAt)}</span>
                              <span
                                role="button"
                                tabIndex={0}
                                className="h-6 w-6 inline-flex items-center justify-center rounded-md hover:bg-surfaceHover opacity-0 group-hover/chat:opacity-100"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  startEditChat(chat.id, chat.title)
                                }}
                                aria-label="Renomear chat"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </span>
                              <span
                                role="button"
                                tabIndex={0}
                                className="h-6 w-6 inline-flex items-center justify-center rounded-md hover:bg-surfaceHover opacity-0 group-hover/chat:opacity-100"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  removeChat(chat.id)
                                }}
                                aria-label="Remover chat"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-error" />
                              </span>
                            </button>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}

                {chats.filter((c) => c.projectId === project.id).length > 0 && !isExpanded && (
                  <button
                    className="w-full flex items-center justify-between px-3 py-1.5 text-xs text-textMuted hover:text-textPrimary transition-colors ml-8 -mt-1"
                    onClick={(e) => {
                      e.stopPropagation()
                      setExpandedProject(project.id)
                    }}
                  >
                    <span>
                      {chats.filter((c) => c.projectId === project.id).length} chat{chats.filter((c) => c.projectId === project.id).length > 1 ? 's' : ''}
                    </span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-surfaceHover">
          <MessageSquare className="w-5 h-5 text-textMuted" />
          <span className="text-sm text-textSecondary flex-1">
            {chats.length} chat{chats.length !== 1 ? 's' : ''} no total
          </span>
        </div>
      </div>
    </aside>
  )
}
