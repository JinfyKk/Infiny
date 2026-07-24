import { useRef, useEffect, useState, useCallback } from 'react'
import { Send, X, Paperclip, Globe, StopCircle, Sparkles, FolderOpen, MessageSquare, FileText, Brain } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useStore } from '@/store/infinyStore'
import { Button } from '@/components/ui/Button'
import { AnimatedTextarea } from '@/components/ui/AnimatedComponents'
import { Message } from './Message'
import { TypingIndicator } from './TypingIndicator'
import { ModelSelector } from './ModelSelector'
import { EffortSelector } from './EffortSelector'
import { ProviderSelector } from './ProviderSelector'
import { ThemeSelector } from '@/theme/ThemeSelector'
import { motion, AnimatePresence } from 'framer-motion'
import {
  typingIndicatorContainerVariants,
  transitions,
} from '@/lib/transitions'
import { StaggerContainer, StaggerItem } from '@/components/ui/AnimatedComponents'

interface ChatAreaProps {
  isFilesPanelOpen: boolean
  onToggleFilesPanel: () => void
}

export function ChatArea({ isFilesPanelOpen, onToggleFilesPanel }: ChatAreaProps) {
  const {
    currentChat,
    currentProject,
    settings,
    isProviderRunning,
    providerOutput,
    pendingImages,
    addMessage,
    updateSettings,
    sendToProvider,
    stopProvider,
    clearProviderOutput,
    addPendingImage,
    removePendingImage,
    clearPendingImages,
  } = useStore()

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [inputValue, setInputValue] = useState('')
  const [dragActive, setDragActive] = useState(false)

  // Carregar modelos do provider ativo
  const loadModels = useCallback(async () => {
    if (!window.electronAPI?.getAvailableModels) return []
    try {
      const models = await window.electronAPI.getAvailableModels()
      if (models.length > 0) {
        return models.map((m) => ({
          value: m.value,
          label: m.label,
          description: m.description,
          icon: <Brain className="w-4 h-4" />,
        }))
      }
    } catch (error) {
      console.error('[ChatArea] Erro ao carregar modelos:', error)
    }
    return []
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [currentChat?.messages, isProviderRunning, providerOutput])

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    setInputValue(value)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleSend = async () => {
    const text = inputValue.trim()
    const images = [...pendingImages]
    if (!text && images.length === 0) return

    setInputValue('')

    const userMessage = { role: 'user' as const, content: text, images: images.length > 0 ? images : undefined, timestamp: Date.now() }
    addMessage(currentChat!.id, userMessage)

    clearPendingImages()
    clearProviderOutput()
    await sendToProvider(currentChat!.id, text, images)
  }

  const handleStop = () => {
    stopProvider()
  }

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData.items
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        e.preventDefault()
        const file = item.getAsFile()
        if (file) {
          const reader = new FileReader()
          reader.onload = (event) => {
            addPendingImage(event.target?.result as string)
          }
          reader.readAsDataURL(file)
        }
      }
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const files = Array.from(e.dataTransfer.files)
    for (const file of files) {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onload = (event) => {
          addPendingImage(event.target?.result as string)
        }
        reader.readAsDataURL(file)
      }
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    for (const file of files) {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onload = (event) => {
          addPendingImage(event.target?.result as string)
        }
        reader.readAsDataURL(file)
      }
    }
    e.target.value = ''
  }

  if (!currentChat || !currentProject) {
    return (
      <div className="flex-1 flex flex-col bg-background overflow-hidden">
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center max-w-md mx-auto">
            <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <Sparkles className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-2xl font-medium text-text mb-3">Bem-vindo ao Infiny</h2>
            <p className="text-textSecondary mb-6 leading-relaxed">
              Selecione ou crie um projeto na barra lateral para começar a conversar.
            </p>
            <div className="flex items-center justify-center gap-3 text-xs text-textMuted">
              <kbd className="px-2 py-1 bg-surface border border-border rounded">Ctrl</kbd>
              <span>+</span>
              <kbd className="px-2 py-1 bg-surface border border-border rounded">B</kbd>
              <span>para alternar a barra lateral</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col bg-background overflow-hidden relative">
      {/* Top Bar */}
      <header className="flex items-center justify-between h-14 px-3 border-b border-border bg-background/80 backdrop-blur-sm z-10">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={transitions.smooth}
          className="flex items-center gap-2"
        >
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...transitions.smooth, delay: 0.05 }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface border border-border"
          >
            <FolderOpen className="w-4 h-4 text-textSecondary" />
            <span className="text-sm font-medium text-text truncate max-w-[200px]">{currentProject.name}</span>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...transitions.smooth, delay: 0.1 }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface border border-border"
          >
            <MessageSquare className="w-4 h-4 text-textSecondary" />
            <span className="text-sm font-medium text-text truncate max-w-[250px]">{currentChat.title}</span>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={transitions.smooth}
          className="flex items-center gap-1"
        >
          {/* Model Settings Group */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...transitions.smooth, delay: 0.05 }}
            className="flex items-center gap-1"
          >
            <ProviderSelector />
            <ModelSelector
              model={settings.model}
              onChange={(model) => updateSettings({ model })}
              fetchModels={loadModels}
            />
            <EffortSelector
              effort={settings.effort}
              onChange={(effort) => updateSettings({ effort })}
            />
          </motion.div>

          <div className="w-px h-6 bg-border mx-1" aria-hidden="true" />

          {/* Actions Group */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...transitions.smooth, delay: 0.1 }}
            className="flex items-center gap-1"
          >
            <Button
              variant={settings.webSearch ? 'subtle' : 'ghost'}
              size="icon"
              interactionType="icon-pulse"
              onClick={() => updateSettings({ webSearch: !settings.webSearch })}
              aria-label={settings.webSearch ? 'Desativar busca na web' : 'Ativar busca na web'}
              title={settings.webSearch ? 'Busca na web ativa' : 'Ativar busca na web'}
            >
              <Globe className="w-5 h-5" />
            </Button>
            <Button
              variant={isFilesPanelOpen ? 'subtle' : 'ghost'}
              size="icon"
              interactionType="icon-pulse"
              onClick={onToggleFilesPanel}
              aria-label={isFilesPanelOpen ? 'Fechar arquivos gerados' : 'Abrir arquivos gerados'}
              title={isFilesPanelOpen ? 'Fechar painel de arquivos' : 'Arquivos gerados'}
            >
              <FileText className="w-5 h-5" />
            </Button>
          </motion.div>

          <div className="w-px h-6 bg-border mx-1" aria-hidden="true" />

          {/* Theme Group */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...transitions.smooth, delay: 0.15 }}
          >
            <ThemeSelector />
          </motion.div>
        </motion.div>
      </header>

      {/* Messages Area */}
      <div
        className="flex-1 overflow-y-auto p-4 space-y-4"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <StaggerContainer speed="normal" className="space-y-4">
          <AnimatePresence mode="popLayout">
            {currentChat.messages.map((message) => (
              <StaggerItem key={message.id} animation="fade">
                <Message message={message} isStreaming={message.isStreaming} />
              </StaggerItem>
            ))}
          </AnimatePresence>
        </StaggerContainer>

        {isProviderRunning && (
          <motion.div
            variants={typingIndicatorContainerVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="flex items-start gap-3"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={transitions.smooth}
              className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5"
            >
              <Sparkles className="w-4 h-4 text-primary" />
            </motion.div>
            <div className="flex-1 max-w-[85%]">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={transitions.smooth}
                className="bg-surfaceHover rounded-2xl rounded-bl-md p-4"
              >
                <TypingIndicator />
              </motion.div>
              {providerOutput && (
                <motion.div
                  initial={{ opacity: 0, scaleY: 0.8, y: -8 }}
                  animate={{ opacity: 1, scaleY: 1, y: 0 }}
                  exit={{ opacity: 0, scaleY: 0.8, y: -8 }}
                  transition={transitions.smooth}
                  className="mt-2 p-3 bg-surface/50 border border-border rounded-lg font-mono text-xs text-textSecondary max-h-40 overflow-y-auto transform-origin-top"
                >
                  {providerOutput.slice(-2000)}
                </motion.div>
              )}
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Pending Images Preview */}
      {pendingImages.length > 0 && (
        <motion.div
          initial={{ opacity: 0, scaleY: 0.8, y: -10 }}
          animate={{ opacity: 1, scaleY: 1, y: 0 }}
          exit={{ opacity: 0, scaleY: 0.8, y: -10 }}
          transition={transitions.smooth}
          className="px-3 pb-2 flex flex-wrap gap-2 max-h-24 overflow-y-auto border-t border-border/50 transform-origin-top"
        >
          {pendingImages.map((img, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.8, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: -10 }}
              transition={transitions.bouncy}
              className="relative w-16 h-16 rounded-lg overflow-hidden border border-border"
            >
              <img src={img} alt="Preview" className="w-full h-full object-cover" />
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => removePendingImage(index)}
                className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors"
                aria-label="Remover imagem"
              >
                <X className="w-4 h-4" />
              </motion.button>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Input Area */}
      <motion.div
        className={cn('p-3 border-t border-border bg-background/80 backdrop-blur-sm', dragActive && 'bg-primary/5 border-t-primary')}
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1, backgroundColor: dragActive ? 'var(--primary)/0.05' : 'transparent' }}
        transition={transitions.smooth}
      >
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...transitions.smooth, delay: 0.1 }}
          className="flex items-end gap-2"
        >
          <motion.label
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex-shrink-0 p-1 rounded-lg hover:bg-surfaceHover transition-colors"
            aria-label="Anexar imagem"
          >
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileSelect}
              className="sr-only"
              id="file-upload"
            />
            <Paperclip className="w-5 h-5 text-textSecondary hover:text-textPrimary" />
          </motion.label>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ ...transitions.smooth, delay: 0.15 }}
            className="flex-1 relative"
          >
            <AnimatedTextarea
              value={inputValue}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              placeholder={isProviderRunning ? 'IA está respondendo...' : 'Digite sua mensagem... (Shift+Enter para nova linha)'}
              disabled={isProviderRunning}
              minRows={1}
              maxRows={8}
              className={cn(
                'bg-surface border-border rounded-2xl',
                'focus-visible:ring-primary focus-visible:border-transparent',
                dragActive && 'border-primary/50 bg-primary/5'
              )}
              aria-label="Mensagem"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ ...transitions.smooth, delay: 0.2 }}
            className="flex items-center gap-1"
          >
            <Button
              variant={isProviderRunning ? 'danger' : 'primary'}
              size="icon"
              onClick={isProviderRunning ? handleStop : handleSend}
              disabled={(!inputValue.trim() && pendingImages.length === 0) || isProviderRunning}
              aria-label={isProviderRunning ? 'Parar geração' : 'Enviar mensagem'}
              interactionType="icon-pulse"
            >
              {isProviderRunning ? <StopCircle className="w-5 h-5" /> : <Send className="w-5 h-5" />}
            </Button>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  )
}