import { useState, useEffect } from 'react'
import { Sparkles, ChevronLeft, FolderOpen, FileText } from 'lucide-react'
import { useStore } from '@/store/infinyStore'
import { Sidebar } from './components/Sidebar'
import { ChatArea } from './components/ChatArea'
import { FilesPanel } from './components/FilesPanel'
import { ThemeSelector } from '@/theme'
import { ThemeProvider } from '@/theme'
import { Onboarding } from './components/Onboarding'
import { SplashScreen } from './components/SplashScreen'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { useSidebarShortcut } from '@/hooks/useKeyboardShortcuts'
import { fadeInUpVariants, staggerContainerVariants } from '@/lib/transitions'
import { Button } from '@/components/ui/Button'

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.2, ease: 'easeIn' } }
} as const

function AppContent() {
  const { isSidebarOpen, setSidebarOpen, isFilesPanelOpen, setFilesPanelOpen, currentProject, currentChat, settings, completeOnboarding } = useStore()
  const [mounted, setMounted] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [showSplash, setShowSplash] = useState(true)

  useSidebarShortcut()

  useEffect(() => {
    setMounted(true)
    // Show onboarding if not completed and no projects exist
    if (!settings.hasCompletedOnboarding) {
      setShowOnboarding(true)
    }
  }, [settings.hasCompletedOnboarding])

  const handleOnboardingComplete = () => {
    completeOnboarding()
    setShowOnboarding(false)
  }

  const handleSplashComplete = () => {
    setShowSplash(false)
    if (!settings.hasCompletedOnboarding) {
      setShowOnboarding(true)
    }
  }

  if (showSplash) {
    return <SplashScreen onComplete={handleSplashComplete} />
  }

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
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 flex bg-background overflow-hidden"
    >
      {/* Sidebar */}
      <AnimatePresence mode="wait">
        {isSidebarOpen && (
          <Sidebar isOpen={isSidebarOpen} onToggle={() => setSidebarOpen(!isSidebarOpen)} />
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className={cn(
        'flex-1 flex flex-col overflow-hidden transition-all duration-300',
        isSidebarOpen ? 'lg:ml-72' : 'lg:ml-0'
      )}>
        {/* Top Bar */}
        <header className="flex items-center justify-between h-12 px-4 border-b border-border bg-background/80 backdrop-blur-sm z-10">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainerVariants}
            className="flex items-center gap-3"
          >
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!isSidebarOpen)}
              className="lg:hidden"
              aria-label={isSidebarOpen ? 'Fechar menu' : 'Abrir menu'}
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>

            {currentProject && (
              <motion.div
                variants={fadeInUpVariants}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface border border-border"
              >
                <FolderOpen className="w-4 h-4 text-textSecondary" />
                <span className="text-sm font-medium text-textPrimary truncate max-w-[200px]">{currentProject.name}</span>
              </motion.div>
            )}

            {currentChat && (
              <motion.div
                variants={fadeInUpVariants}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface border border-border"
              >
                <FileText className="w-4 h-4 text-textSecondary" />
                <span className="text-sm font-medium text-textPrimary truncate max-w-[250px]">{currentChat.title}</span>
              </motion.div>
            )}
          </motion.div>

          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainerVariants}
            className="flex items-center gap-2"
          >
            <Button
              variant={isFilesPanelOpen ? 'subtle' : 'ghost'}
              size="icon"
              onClick={() => setFilesPanelOpen(!isFilesPanelOpen)}
              aria-label="Arquivos gerados"
            >
              <FileText className="w-5 h-5" />
            </Button>
            <ThemeSelector />
          </motion.div>
        </header>

        {/* Chat Area */}
        <ChatArea
          isFilesPanelOpen={isFilesPanelOpen}
          onToggleFilesPanel={() => setFilesPanelOpen(!isFilesPanelOpen)}
        />

        {/* Files Panel */}
        <AnimatePresence mode="wait">
          {isFilesPanelOpen && (
            <FilesPanel
              isOpen={isFilesPanelOpen}
              onClose={() => setFilesPanelOpen(false)}
            />
          )}
        </AnimatePresence>

        {/* Onboarding */}
        <Onboarding isOpen={showOnboarding} onClose={handleOnboardingComplete} />
      </main>
    </motion.div>
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