import { FolderGit2, Plus, MessageSquare, ChevronRight, X, FolderOpen, Trash2, Edit2 } from 'lucide-react'
import { useState, useMemo } from 'react'
import { cn, formatDate } from '@/lib/utils'
import { useStore } from '@/store/infinyStore'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useToastHelpers } from '@/components/ui/Toast'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { motion, AnimatePresence } from 'framer-motion'
import {
  sidebarVariants,
  listItemVariants,
  transitions,
  PROJECT_EDIT_SUFFIX,
} from '@/lib/transitions'
import { StaggerContainer, StaggerItem, AnimatedIcon } from '@/components/ui/AnimatedComponents'

interface SidebarProps {
  isOpen: boolean
  onToggle: () => void
}

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
    searchQuery,
    setSearchQuery,
  } = useStore()

  const { success, error, warning } = useToastHelpers()

  const [expandedProject, setExpandedProject] = useState<string | null>(null)
  const [showNewProject, setShowNewProject] = useState(false)
  const [newProjectPath, setNewProjectPath] = useState('')
  const [newProjectName, setNewProjectName] = useState('')

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')

  const [deleteProjectId, setDeleteProjectId] = useState<string | null>(null)
  const [deleteChatId, setDeleteChatId] = useState<string | null>(null)

  const handleCreateProject = () => {
    if (newProjectPath && newProjectName) {
      const project = addProject({ name: newProjectName, path: newProjectPath, lastOpened: Date.now() })
      setCurrentProject(project)
      setShowNewProject(false)
      setNewProjectPath('')
      setNewProjectName('')
      success('Projeto criado', `${project.name} foi adicionado`)
    }
  }

  const handleSelectFolder = async () => {
    try {
      const path = await window.electronAPI?.selectFolder()
      if (path) {
        setNewProjectPath(path)
        setNewProjectName(path.split(/[\\/]/).pop() || 'Novo Projeto')
      }
    } catch {
      error('Erro', 'Não foi possível selecionar a pasta')
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
    const trimmed = editValue.trim()
    if (!trimmed) return
    renameProject(projectId, trimmed)
    success('Projeto renomeado', `${trimmed}`)
    cancelEdit()
  }

  const confirmDeleteProject = (projectId: string) => {
    setDeleteProjectId(projectId)
  }

  const executeDeleteProject = () => {
    if (deleteProjectId) {
      const project = projects.find(p => p.id === deleteProjectId)
      removeProject(deleteProjectId)
      if (project) {
        warning('Projeto removido', `${project.name} foi excluído`)
      }
      setDeleteProjectId(null)
    }
  }

  const confirmDeleteChat = (chatId: string) => {
    setDeleteChatId(chatId)
  }

  const executeDeleteChat = () => {
    if (deleteChatId) {
      const chat = chats.find(c => c.id === deleteChatId)
      removeChat(deleteChatId)
      if (chat) {
        warning('Chat removido', `${chat.title} foi excluído`)
      }
      setDeleteChatId(null)
    }
  }

  const filteredProjects = useMemo(() => {
    if (!searchQuery) return projects
    const query = searchQuery.toLowerCase()
    return projects.filter((p) =>
      p.name.toLowerCase().includes(query) ||
      chats.some((c) => c.projectId === p.id && c.title.toLowerCase().includes(query))
    )
  }, [projects, chats, searchQuery])

  const projectButtonVariants = {
    initial: { scale: 1 },
    hover: { scale: 1.01, transition: transitions.snappy },
    tap: { scale: 0.99, transition: transitions.tweenFast }
  } as const

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <motion.aside
          variants={sidebarVariants}
          initial="closed"
          animate="open"
          exit="closed"
          className={cn(
            'fixed left-0 top-0 z-40 h-full bg-background border-r border-border flex flex-col',
            'w-72',
          )}
        >
          {/* Header do Sidebar */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...transitions.smooth, delay: 0.1 }}
            className="flex items-center justify-between h-14 px-4 border-b border-border"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <FolderGit2 className="w-4 h-4 text-primary" />
              </div>
              <span className="font-semibold text-lg text-text">Infiny</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggle}
              className="lg:hidden"
              aria-label="Fechar sidebar"
              interactionType="icon-rotate"
            >
              <X className="w-5 h-5" />
            </Button>
          </motion.div>

          {/* Barra de busca */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...transitions.smooth, delay: 0.15 }}
            className="px-4 py-3 border-b border-border"
          >
            <Input
              placeholder="Buscar projetos e chats..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
              aria-label="Buscar projetos e chats"
            />
          </motion.div>

          {/* Botão novo projeto */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...transitions.smooth, delay: 0.2 }}
            className="px-4 py-2"
          >
            {showNewProject ? (
              <motion.div
                initial={{ opacity: 0, scaleY: 0.8, y: -8 }}
                animate={{ opacity: 1, scaleY: 1, y: 0 }}
                exit={{ opacity: 0, scaleY: 0.8, y: -8 }}
                transition={transitions.smooth}
                className="space-y-3 transform-origin-top"
              >
                <Input
                  placeholder="Nome do projeto"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  className="w-full"
                  aria-label="Nome do projeto"
                />
                <div className="flex gap-2">
                  <Input
                    placeholder="Caminho da pasta"
                    value={newProjectPath}
                    onChange={(e) => setNewProjectPath(e.target.value)}
                    className="flex-1"
                    aria-label="Caminho da pasta do projeto"
                  />
                  <Button variant="secondary" size="sm" onClick={handleSelectFolder} aria-label="Selecionar pasta">
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
              </motion.div>
            ) : (
              <Button variant="secondary" className="w-full justify-start gap-2" onClick={() => setShowNewProject(true)}>
                <Plus className="w-4 h-4" />
                <span>Novo Projeto</span>
              </Button>
            )}
          </motion.div>

          {/* Lista de projetos */}
          <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
            {filteredProjects.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={transitions.smooth}
                className="px-3 py-8 text-center text-textMuted"
              >
                <FolderGit2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Nenhum projeto ainda</p>
                <p className="text-xs mt-1">Clique em "Novo Projeto" para começar</p>
              </motion.div>
            ) : (
              <StaggerContainer speed="normal" className="space-y-1" role="list">
                {filteredProjects.map((project) => {
                  const isActive = currentProject?.id === project.id
                  const projectChats = chats.filter((c) => c.projectId === project.id)
                  const projectChatsCount = projectChats.length
                  const isExpanded = expandedProject === project.id
                  const isEditingThisProject = editingId === project.id + PROJECT_EDIT_SUFFIX

                  return (
                    <StaggerItem key={project.id} animation="slide" className="group relative">
                      {isEditingThisProject ? (
                        <motion.div
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -10 }}
                          transition={transitions.tweenFast}
                          className="flex items-center gap-2 px-3 py-2"
                        >
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
                            className="flex-1 px-2 py-1.5 text-sm bg-surface border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary"
                            aria-label="Editar nome do projeto"
                          />
                        </motion.div>
                      ) : (
                        <motion.button
                          variants={projectButtonVariants}
                          initial="initial"
                          whileHover="hover"
                          whileTap="tap"
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
                          <AnimatedIcon isOpen={isExpanded} rotateAmount={90} className="w-4 h-4 flex-shrink-0">
                            <FolderGit2 className="w-4 h-4" />
                          </AnimatedIcon>
                          <div className="flex-1 min-w-0 truncate flex items-center gap-2">
                            <span className="font-medium truncate">{project.name}</span>
                            {projectChatsCount > 0 && (
                              <span
                                className={cn(
                                  'text-xs px-2 py-0.5 rounded-full',
                                  isActive ? 'bg-primary/20 text-primary' : 'bg-surfaceHover text-textMuted',
                                )}
                              >
                                {projectChatsCount}
                              </span>
                            )}
                          </div>
                          <motion.div
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            transition={transitions.tweenFast}
                            className="flex items-center gap-1"
                          >
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation()
                                startEditProject(project.id, project.name)
                              }}
                              aria-label="Renomear projeto"
                              interactionType="icon-pulse"
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation()
                                confirmDeleteProject(project.id)
                              }}
                              aria-label="Remover projeto"
                              interactionType="icon-pulse"
                            >
                              <Trash2 className="w-4 h-4 text-error" />
                            </Button>
                          </motion.div>
                        </motion.button>
                      )}

                      {/* Chats do projeto */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            variants={{
                              hidden: { opacity: 0, height: 0 },
                              visible: { opacity: 1, height: 'auto', transition: { staggerChildren: 0.02 } },
                              exit: { opacity: 0, height: 0, transition: { staggerChildren: 0.01, staggerDirection: -1 } }
                            }}
                            className="ml-8 mt-1 space-y-1 border-l border-border/50 pl-2"
                            role="group"
                            aria-label={`${project.name} chats`}
                          >
                            {projectChats.length === 0 ? (
                              <StaggerItem animation="fade">
                                <Button
                                  variant="ghost"
                                  className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg text-textMuted hover:text-textPrimary"
                                  onClick={() => {
                                    const chat = addChat({ projectId: project.id, title: 'Novo Chat', messages: [] })
                                    setCurrentChat(chat)
                                  }}
                                >
                                  <Plus className="w-4 h-4" />
                                  <span>Novo Chat</span>
                                </Button>
                              </StaggerItem>
                            ) : (
                              projectChats.map((chat) => (
                                <AnimatePresence key={chat.id} mode="wait">
                                  {editingId !== chat.id && (
                                    <StaggerItem animation="fade">
                                      <motion.button
                                        variants={listItemVariants}
                                        initial="hidden"
                                        animate="visible"
                                        exit="exit"
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
                                        <motion.div
                                          initial={{ opacity: 0, x: 10 }}
                                          animate={{ opacity: 1, x: 0 }}
                                          exit={{ opacity: 0, x: -10 }}
                                          transition={transitions.tweenFast}
                                          className="flex items-center gap-1"
                                        >
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6"
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              startEditChat(chat.id, chat.title)
                                            }}
                                            aria-label="Renomear chat"
                                            interactionType="icon-pulse"
                                          >
                                            <Edit2 className="w-3.5 h-3.5" />
                                          </Button>
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6"
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              confirmDeleteChat(chat.id)
                                            }}
                                            aria-label="Remover chat"
                                            interactionType="icon-pulse"
                                          >
                                            <Trash2 className="w-3.5 h-3.5 text-error" />
                                          </Button>
                                        </motion.div>
                                      </motion.button>
                                    </StaggerItem>
                                  )}
                                </AnimatePresence>
                              ))
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {projectChats.length > 0 && !isExpanded && (
                        <StaggerItem animation="slide">
                          <Button
                            variant="ghost"
                            className="w-full flex items-center justify-between px-3 py-1.5 text-xs text-textMuted hover:text-textPrimary ml-8 -mt-1"
                            onClick={(e) => {
                              e.stopPropagation()
                              setExpandedProject(project.id)
                            }}
                            interactionType="scale"
                          >
                            <span>{projectChats.length} chat{projectChats.length > 1 ? 's' : ''}</span>
                            <AnimatedIcon isOpen={isExpanded} rotateAmount={90}>
                              <ChevronRight className="w-4 h-4" />
                            </AnimatedIcon>
                          </Button>
                        </StaggerItem>
                      )}
                    </StaggerItem>
                  )
                })}
              </StaggerContainer>
            )}
          </div>

          {/* Footer */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...transitions.smooth, delay: 0.3 }}
            className="px-3 py-3 border-t border-border"
          >
            <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-surfaceHover">
              <MessageSquare className="w-4 h-4 text-textMuted" />
              <span className="text-sm text-textSecondary flex-1">
                {chats.length} chat{chats.length !== 1 ? 's' : ''} no total
              </span>
            </div>
          </motion.div>

          {/* Confirm Dialogs */}
          <ConfirmDialog
            isOpen={!!deleteProjectId}
            onClose={() => setDeleteProjectId(null)}
            onConfirm={executeDeleteProject}
            title="Excluir projeto"
            description="Esta ação não pode ser desfeita. Todos os chats deste projeto serão removidos permanentemente."
            confirmLabel="Excluir"
            cancelLabel="Cancelar"
            variant="danger"
          />
          <ConfirmDialog
            isOpen={!!deleteChatId}
            onClose={() => setDeleteChatId(null)}
            onConfirm={executeDeleteChat}
            title="Excluir chat"
            description="Esta ação não pode ser desfeita. O histórico de mensagens será removido permanentemente."
            confirmLabel="Excluir"
            cancelLabel="Cancelar"
            variant="danger"
          />
        </motion.aside>
      )}
    </AnimatePresence>
  )
}