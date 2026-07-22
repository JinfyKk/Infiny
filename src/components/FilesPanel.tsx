import { useState, useMemo } from 'react'
import { FileText, X, ChevronRight, ChevronDown, Search, Sparkles, Code } from 'lucide-react'
import { cn, formatFileSize, getFileIcon } from '@/lib/utils'
import { useStore } from '@/store/infinyStore'
import { motion, AnimatePresence } from 'framer-motion'

const panelVariants = {
  closed: { x: 300, opacity: 0 },
  open: { x: 0, opacity: 1, transition: { type: 'spring', stiffness: 400, damping: 30 } as const },
} as const

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
      <div className="flex items-center justify-between h-12 px-4 border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-textSecondary" />
          <span className="font-medium text-text">Arquivos Gerados</span>
          {currentProject && filteredFiles.length > 0 && (
            <span className="text-xs px-2 py-0.5 bg-surface border border-border rounded-full text-textMuted">
              {filteredFiles.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button onClick={onClose} className="p-1.5 rounded hover:bg-surfaceHover transition-colors" aria-label="Fechar painel">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="p-3 border-b border-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-textMuted" />
          <input
            type="text"
            placeholder="Buscar arquivos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-surface border border-border rounded-lg text-text placeholder-textMuted text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border">
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          className="flex-1 px-3 py-1.5 bg-surface border border-border rounded-lg text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="date">Mais recentes</option>
          <option value="name">Nome (A-Z)</option>
          <option value="size">Tamanho</option>
        </select>
      </div>

      {/* File List */}
      <div className="flex-1 overflow-y-auto p-2">
        {filteredFiles.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-textMuted p-8">
            <div className="w-16 h-16 rounded-2xl bg-surface border border-border flex items-center justify-center mb-4">
              <Sparkles className="w-8 h-8 opacity-30" />
            </div>
            <p className="text-sm text-center font-medium">Nenhum arquivo gerado ainda</p>
            <p className="text-xs mt-1 text-center max-w-[200px]">O Claude criará arquivos aqui durante a conversa</p>
            <Code className="w-5 h-5 opacity-20 mt-4" />
          </div>
        ) : (
          <ul className="space-y-1" role="tree">
            {filteredFiles.map((file) => (
              <FileTreeItem
                key={file.id}
                file={file}
                isExpanded={expandedFolders.has(file.path)}
                onToggle={() => handleFileClick(file)}
                onOpen={() => handleFileClick(file)}
              />
            ))}
          </ul>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-border bg-background/50">
        <div className="flex items-center justify-between text-xs text-textMuted">
          <span>{filteredFiles.length} arquivo{filteredFiles.length !== 1 ? 's' : ''}</span>
          <span>
            {filteredFiles.reduce((acc, f) => acc + f.size, 0) > 0
              ? formatFileSize(filteredFiles.reduce((acc, f) => acc + f.size, 0))
              : '0 B'}
          </span>
        </div>
      </div>
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
    : getFileIcon(file.name)

  return (
    <li className="relative">
      <button
        onClick={file.isDirectory ? onToggle : onOpen}
        className={cn(
          'w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-colors',
          'hover:bg-surfaceHover',
          !file.isDirectory && 'text-text hover:text-text',
          file.isDirectory && 'text-textSecondary'
        )}
        aria-expanded={file.isDirectory ? isExpanded : undefined}
      >
        {file.isDirectory && (<span className="w-4 h-4 flex-shrink-0 text-textMuted">{icon}</span>)}
        {!file.isDirectory && <span className="w-4 h-4 flex-shrink-0 text-textMuted">{icon}</span>}
        <span className="flex-1 min-w-0 truncate text-sm font-medium">{file.name}</span>
        {!file.isDirectory && (
          <span className="text-xs text-textMuted flex-shrink-0">{formatFileSize(file.size)}</span>
        )}
      </button>

      {file.isDirectory && isExpanded && file.children && (
        <ul className="ml-4 space-y-1 border-l border-border/50 pl-2" role="group">
          {file.children.map((child: any) => (
            <FileTreeItem key={child.path} file={child} isExpanded={false} onToggle={onToggle} onOpen={onOpen} />
          ))}
        </ul>
      )}
    </li>
  )
}