import { useState, useMemo } from 'react'
import { FileText, X, ChevronRight, ChevronDown, Search, Sparkles, Code, File, Image, FileCode, Archive } from 'lucide-react'
import { cn, formatFileSize, getFileIcon } from '@/lib/utils'
import { useStore } from '@/store/infinyStore'
import { motion, AnimatePresence } from 'framer-motion'
import {
  filesPanelVariants,
  fileTreeItemVariants,
  fileTreeChildVariants,
  transitions,
} from '@/lib/transitions'
import { Button } from '@/components/ui/Button'
import { StaggerContainer, StaggerItem } from '@/components/ui/AnimatedComponents'

const panelVariants = filesPanelVariants

function renderFileIcon(iconName: string) {
  switch (iconName) {
    case 'code':
      return <FileCode className="w-4 h-4" />
    case 'image':
      return <Image className="w-4 h-4" />
    case 'file-text':
      return <FileText className="w-4 h-4" />
    case 'archive':
      return <Archive className="w-4 h-4" />
    case 'braces':
      return <FileCode className="w-4 h-4" />
    default:
      return <File className="w-4 h-4" />
  }
}

interface FilesPanelProps {
  isOpen: boolean
  onClose: () => void
}

export function FilesPanel({ isOpen, onClose }: FilesPanelProps) {
  const { currentProject, generatedFiles, openGeneratedFile } = useStore()
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'size'>('date')

  const projectFiles = useMemo(() =>
    currentProject
      ? generatedFiles.filter(f => f.projectId === currentProject.id)
      : []
  , [currentProject, generatedFiles])

  const filteredFiles = useMemo(() =>
    projectFiles
      .filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()))
      .sort((a, b) => {
        if (sortBy === 'name') return a.name.localeCompare(b.name)
        if (sortBy === 'size') return b.size - a.size
        return b.modified - a.modified
      })
  , [projectFiles, searchQuery, sortBy])

  const handleFileClick = (file: any) => {
    if (file.isDirectory) {
      setExpandedFolders(prev => {
        const next = new Set(prev)
        if (next.has(file.path)) next.delete(file.path)
        else next.add(file.path)
        return next
      })
    } else {
      openGeneratedFile(file.path)
    }
  }

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <motion.div
          variants={panelVariants}
          initial="closed"
          animate="open"
          exit="closed"
          className="fixed right-0 top-0 z-50 h-full bg-background border-l border-border flex flex-col w-80"
        >
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...transitions.smooth, delay: 0.05 }}
            className="flex items-center justify-between h-12 px-4 border-b border-border bg-background/80 backdrop-blur-sm"
          >
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-textSecondary" />
              <span className="font-medium text-text">Arquivos Gerados</span>
              {currentProject && filteredFiles.length > 0 && (
                <motion.span
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={transitions.bouncy}
                  className="text-xs px-2 py-0.5 bg-surface border border-border rounded-full text-textMuted"
                >
                  {filteredFiles.length}
                </motion.span>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              aria-label="Fechar painel"
              interactionType="icon-rotate"
            >
              <X className="w-4 h-4" />
            </Button>
          </motion.div>

          {/* Search */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...transitions.smooth, delay: 0.1 }}
            className="p-3 border-b border-border"
          >
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-textMuted" />
              <motion.input
                type="text"
                placeholder="Buscar arquivos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-surface border border-border rounded-lg text-text placeholder-textMuted text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                whileFocus={{ scale: 1.005, transition: transitions.snappy }}
              />
            </div>
          </motion.div>

          {/* Toolbar */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...transitions.smooth, delay: 0.15 }}
            className="flex items-center gap-2 px-3 py-2 border-b border-border"
          >
            <motion.select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="flex-1 px-3 py-1.5 bg-surface border border-border rounded-lg text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              whileFocus={{ scale: 1.005, transition: transitions.snappy }}
            >
              <option value="date">Mais recentes</option>
              <option value="name">Nome (A-Z)</option>
              <option value="size">Tamanho</option>
            </motion.select>
          </motion.div>

          {/* File List */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ ...transitions.smooth, delay: 0.2 }}
            className="flex-1 overflow-y-auto p-2"
          >
            {filteredFiles.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={transitions.smooth}
                className="flex flex-col items-center justify-center h-full text-textMuted p-8"
              >
                <motion.div
                  animate={{ rotate: [0, 0, 360] }}
                  transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
                  className="w-16 h-16 rounded-2xl bg-surface border border-border flex items-center justify-center mb-4"
                >
                  <Sparkles className="w-8 h-8 opacity-30" />
                </motion.div>
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...transitions.smooth, delay: 0.1 }}
                  className="text-sm text-center font-medium"
                >
                  Nenhum arquivo gerado ainda
                </motion.p>
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...transitions.smooth, delay: 0.15 }}
                  className="text-xs mt-1 text-center max-w-[200px]"
                >
                  O Claude criará arquivos aqui durante a conversa
                </motion.p>
                <motion.span
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                  className="mt-4"
                >
                  <Code className="w-5 h-5 opacity-20" />
                </motion.span>
              </motion.div>
            ) : (
              <StaggerContainer speed="fast" className="space-y-1" role="tree">
                {filteredFiles.map((file) => (
                  <FileTreeItem
                    key={file.id}
                    file={file}
                    isExpanded={expandedFolders.has(file.path)}
                    onToggle={() => handleFileClick(file)}
                    onOpen={() => handleFileClick(file)}
                  />
                ))}
              </StaggerContainer>
            )}
          </motion.div>

          {/* Footer */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...transitions.smooth, delay: 0.25 }}
            className="p-3 border-t border-border bg-background/50"
          >
            <div className="flex items-center justify-between text-xs text-textMuted">
              <span>{filteredFiles.length} arquivo{filteredFiles.length !== 1 ? 's' : ''}</span>
              <span>
                {filteredFiles.reduce((acc, f) => acc + f.size, 0) > 0
                  ? formatFileSize(filteredFiles.reduce((acc, f) => acc + f.size, 0))
                  : '0 B'}
              </span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

interface FileTreeItemProps {
  file: any
  isExpanded: boolean
  onToggle: () => void
  onOpen: () => void
}

function FileTreeItem({ file, isExpanded, onToggle, onOpen }: FileTreeItemProps) {
  const icon = file.isDirectory
    ? (isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />)
    : renderFileIcon(getFileIcon(file.name))

  const isFile = !file.isDirectory

  return (
    <StaggerItem animation="slide" className="relative">
      <motion.button
        onClick={file.isDirectory ? onToggle : onOpen}
        variants={file.isDirectory ? fileTreeItemVariants : fileTreeChildVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className={cn(
          'w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-all duration-150',
          'hover:bg-surfaceHover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
          isFile && 'text-text',
          file.isDirectory && 'text-textSecondary'
        )}
        aria-expanded={file.isDirectory ? isExpanded : undefined}
        whileHover={{ x: 2, transition: transitions.snappy }}
        whileTap={{ x: 0, scale: 0.99, transition: transitions.tweenFast }}
      >
        {file.isDirectory && (
          <motion.span
            className="w-4 h-4 flex-shrink-0 text-textMuted flex items-center justify-center"
            animate={{ rotate: isExpanded ? 90 : 0 }}
            transition={transitions.snappy}
          >
            {icon}
          </motion.span>
        )}
        {!file.isDirectory && (
          <motion.span
            className="w-4 h-4 flex-shrink-0 text-textMuted"
            initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={transitions.bouncy}
          >
            {icon}
          </motion.span>
        )}
        <span className="flex-1 min-w-0 truncate text-sm font-medium">{file.name}</span>
        {!file.isDirectory && (
          <span className="text-xs text-textMuted flex-shrink-0">{formatFileSize(file.size)}</span>
        )}
      </motion.button>

      <AnimatePresence>
        {file.isDirectory && isExpanded && file.children && (
          <motion.ul
            variants={fileTreeItemVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="ml-4 space-y-1 border-l border-border/50 pl-2"
            role="group"
          >
            {file.children.map((child: any) => (
              <FileTreeItem key={child.path} file={child} isExpanded={false} onToggle={onToggle} onOpen={onOpen} />
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </StaggerItem>
  )
}