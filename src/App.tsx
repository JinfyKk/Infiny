import { useState, useEffect } from 'react'
import { ChevronLeft, FolderOpen, FileText } from 'lucide-react'
import { useStore } from '@/store/infinyStore'
import { Sidebar } from './components/Sidebar'
import { ChatArea } from './components/ChatArea'
import { FilesPanel } from './components/FilesPanel'
import { ThemeSelector } from '@/theme'
import { ThemeProvider } from '@/theme'
import { Onboarding } from './components/Onboarding'
import { SplashScreen } from './components/SplashScreen'
import { LinkWarningDialog } from '@/components/ui/LinkWarningDialog'
import turtlyImg from '@/assets/Gemini_Generated_Image_xev09dxev09dxev0-removebg-preview.png'
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
  const { isSidebarOpen, setSidebarOpen, isFilesPanelOpen, setFilesPanelOpen, currentProject, currentChat, settings, completeOnboarding, _setupElectronListeners } = useStore()
  const [mounted, setMounted] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [showSplash, setShowSplash] = useState(true)

  useSidebarShortcut()

  // Inicializa listeners do Electron (IPC do main process pro renderer)
  // Isso conecta os eventos do provider (stream de resposta, erros, fim de resposta) ao store
  useEffect(() => {
    _setupElectronListeners()
    return () => {
      const { _cleanupElectronListeners } = useStore.getState()
      _cleanupElectronListeners()
    }
  }, [_setupElectronListeners])

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
            <img src={turtlyImg} alt="Turtly" className="w-full h-full object-contain animate-pulse" />
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

      {/* Aviso de redirecionamento ao clicar em links externos nas mensagens */}
      <LinkWarningDialog />
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