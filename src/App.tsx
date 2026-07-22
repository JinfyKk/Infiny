import { useState, useEffect } from 'react'
import { Sparkles, ChevronLeft, FolderOpen, FileText } from 'lucide-react'
import { useStore } from '@/store/infinyStore'
import { Sidebar } from './components/Sidebar'
import { ChatArea } from './components/ChatArea'
import { FilesPanel } from './components/FilesPanel'
import { ThemeSelector } from '@/theme'
import { ThemeProvider } from '@/theme'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.2, ease: 'easeIn' } }
} as const

function AppContent() {
  const { isSidebarOpen, setSidebarOpen, isFilesPanelOpen, setFilesPanelOpen, currentProject, currentChat } = useStore()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="fixed inset-0 bg-background flex items-center justify-center">
        <div className="text-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="w-16 h-16 mx-auto mb-4 text-primary"
          >
            <Sparkles className="w-full h-full animate-pulse" />
          </motion.div>
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
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2, delay: 0.05 }}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface border border-border"
              >
                <FolderOpen className="w-4 h-4 text-textSecondary" />
                <span className="text-sm font-medium text-textPrimary truncate max-w-[200px]">{currentProject.name}</span>
              </motion.div>
            )}

            {currentChat && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2, delay: 0.1 }}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface border border-border"
              >
                <FileText className="w-4 h-4 text-textSecondary" />
                <span className="text-sm font-medium text-textPrimary truncate max-w-[250px]">{currentChat.title}</span>
              </motion.div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
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
            </motion.button>
            <ThemeSelector />
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

export function App() {
  return (
    <ThemeProvider>
      <motion.div variants={fadeInUp} initial="initial" animate="animate" exit="exit">
        <AppContent />
      </motion.div>
    </ThemeProvider>
  )
}