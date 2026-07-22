import { useState, useEffect } from 'react'
import { Sparkles, ChevronLeft, FolderOpen, FileText } from 'lucide-react'
import { useStore } from '@/store/infinyStore'
import { Sidebar } from './components/Sidebar'
import { ChatArea } from './components/ChatArea'
import { FilesPanel } from './components/FilesPanel'
import { cn } from '@/lib/utils'

export function App() {
  const { isSidebarOpen, setSidebarOpen, isFilesPanelOpen, setFilesPanelOpen, currentProject, currentChat } = useStore()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="fixed inset-0 bg-background flex items-center justify-center">
        <div className="text-center">
          <Sparkles className="w-16 h-16 mx-auto mb-4 text-primary animate-pulse" />
          <p className="text-textSecondary">Carregando Infiny...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 flex bg-background overflow-hidden">
      {/* Sidebar */}
      <Sidebar isOpen={isSidebarOpen} onToggle={() => setSidebarOpen(!isSidebarOpen)} />

      {/* Main Content */}
      <main className={cn(
        'flex-1 flex flex-col overflow-hidden transition-all duration-300',
        isSidebarOpen ? 'lg:ml-72' : 'lg:ml-0'
      )}>
        {/* Top Bar */}
        <header className="flex items-center justify-between h-12 px-4 border-b border-border bg-background/80 backdrop-blur-sm z-10">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!isSidebarOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-surfaceHover transition-colors"
              aria-label={isSidebarOpen ? 'Fechar menu' : 'Abrir menu'}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            {currentProject && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface border border-border">
                <FolderOpen className="w-4 h-4 text-textSecondary" />
                <span className="text-sm font-medium text-textPrimary truncate max-w-[200px]">{currentProject.name}</span>
              </div>
            )}

            {currentChat && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface border border-border">
                <FileText className="w-4 h-4 text-textSecondary" />
                <span className="text-sm font-medium text-textPrimary truncate max-w-[250px]">{currentChat.title}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilesPanelOpen(!isFilesPanelOpen)}
              className={cn(
                'p-2 rounded-lg transition-colors',
                isFilesPanelOpen
                  ? 'bg-primary/10 text-primary'
                  : 'text-textSecondary hover:bg-surfaceHover hover:text-textPrimary'
              )}
              aria-label="Arquivos gerados"
            >
              <FileText className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Chat Area */}
        <ChatArea
          isFilesPanelOpen={isFilesPanelOpen}
          onToggleFilesPanel={() => setFilesPanelOpen(!isFilesPanelOpen)}
        />

        {/* Files Panel */}
        <FilesPanel
          isOpen={isFilesPanelOpen}
          onClose={() => setFilesPanelOpen(false)}
        />
      </main>
    </div>
  )
}