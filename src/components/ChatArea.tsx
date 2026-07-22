import { useRef, useEffect, useState } from 'react'
import { Send, X, Paperclip, Globe, StopCircle, Sparkles, FolderOpen, MessageSquare, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useStore } from '@/store/infinyStore'
import { Button } from '@/components/ui/Button'
import { Message } from './Message'
import { TypingIndicator } from './TypingIndicator'
import { ModelSelector } from './ModelSelector'
import { EffortSelector } from './EffortSelector'

interface ChatAreaProps {
  isFilesPanelOpen: boolean
  onToggleFilesPanel: () => void
}

export function ChatArea({ isFilesPanelOpen, onToggleFilesPanel }: ChatAreaProps) {
  const {
    currentChat,
    currentProject,
    settings,
    isClaudeRunning,
    claudeOutput,
    pendingImages,
    addMessage,
    updateSettings,
    sendToClaude,
    stopClaude,
    clearClaudeOutput,
    addPendingImage,
    removePendingImage,
    clearPendingImages,
  } = useStore()

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [inputValue, setInputValue] = useState('')
  const [inputHeight, setInputHeight] = useState(48)
  const [showModelSelector, setShowModelSelector] = useState(false)
  const [showEffortSelector, setShowEffortSelector] = useState(false)
  const [dragActive, setDragActive] = useState(false)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [currentChat?.messages, isClaudeRunning, claudeOutput])

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    setInputValue(value)
    textareaRef.current?.style.setProperty('height', 'auto')
    const height = Math.min(Math.max(textareaRef.current?.scrollHeight || 48, 48), 200)
    setInputHeight(height)
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
    setInputHeight(48)
    textareaRef.current?.style.setProperty('height', '48px')

    const userMessage = { role: 'user' as const, content: text, images: images.length > 0 ? images : undefined, timestamp: Date.now() }
    addMessage(currentChat!.id, userMessage)

    clearPendingImages()
    clearClaudeOutput()
    await sendToClaude(currentChat!.id, text, images)
  }

  const handleStop = () => {
    stopClaude()
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
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center p-8">
            <FileText className="w-16 h-16 mx-auto mb-4 text-textMuted" />
            <h2 className="text-xl font-medium text-textPrimary mb-2">Bem-vindo ao Infiny</h2>
            <p className="text-textSecondary max-w-md mx-auto">
              Selecione ou crie um projeto na barra lateral para começar a conversar com o Claude Code.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col bg-background overflow-hidden relative">
      {/* Top Bar */}
      <div className="flex items-center justify-between h-14 px-4 border-b border-border bg-background/80 backdrop-blur-sm z-10">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface border border-border">
            <FolderOpen className="w-4 h-4 text-textSecondary" />
            <span className="text-sm font-medium text-textPrimary truncate max-w-[200px]">{currentProject.name}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface border border-border">
            <MessageSquare className="w-4 h-4 text-textSecondary" />
            <span className="text-sm font-medium text-textPrimary truncate max-w-[250px]">{currentChat.title}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ModelSelector
            model={settings.model}
            onChange={(model) => updateSettings({ model })}
            isOpen={showModelSelector}
            onToggle={() => { setShowModelSelector(!showModelSelector); setShowEffortSelector(false) }}
          />
          <EffortSelector
            effort={settings.effort}
            onChange={(effort) => updateSettings({ effort })}
            isOpen={showEffortSelector}
            onToggle={() => { setShowEffortSelector(!showEffortSelector); setShowModelSelector(false) }}
          />
          <Button
            variant="ghost"
            size="icon"
            className={cn('text-textSecondary hover:text-textPrimary', settings.webSearch && 'text-primary')}
            onClick={() => updateSettings({ webSearch: !settings.webSearch })}
            aria-label={settings.webSearch ? 'Desativar busca na web' : 'Ativar busca na web'}
          >
            <Globe className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onToggleFilesPanel} aria-label="Arquivos gerados">
            <FileText className={cn('w-5 h-5', isFilesPanelOpen && 'text-primary')} />
          </Button>
        </div>
      </div>

      {/* Messages Area */}
      <div
        className="flex-1 overflow-y-auto p-4 space-y-4"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {currentChat.messages.map((message) => (
          <Message key={message.id} message={message} isStreaming={message.isStreaming} />
        ))}

        {isClaudeRunning && (
          <div className="flex items-start gap-3 animate-in slide-up-200">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1 max-w-[85%]">
              <div className="bg-surfaceHover rounded-2xl rounded-bl-md p-4">
                <TypingIndicator />
              </div>
              {claudeOutput && (
                <div className="mt-2 p-3 bg-surface/50 border border-border rounded-lg font-mono text-xs text-textSecondary max-h-40 overflow-y-auto">
                  {claudeOutput.slice(-2000)}
                </div>
              )}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Pending Images Preview */}
      {pendingImages.length > 0 && (
        <div className="px-4 pb-2 flex flex-wrap gap-2 max-h-24 overflow-y-auto border-t border-border/50">
          {pendingImages.map((img, index) => (
            <div key={index} className="relative w-16 h-16 rounded-lg overflow-hidden border border-border">
              <img src={img} alt="Preview" className="w-full h-full object-cover" />
              <button
                onClick={() => removePendingImage(index)}
                className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors"
                aria-label="Remover imagem"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input Area */}
      <div className={cn('p-4 border-t border-border bg-background/80 backdrop-blur-sm', dragActive && 'bg-primary/5 border-t-primary')}>
        <div className="flex items-end gap-2">
          <label className="flex-shrink-0 p-1 rounded-lg hover:bg-surfaceHover transition-colors" aria-label="Anexar imagem">
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileSelect}
              className="sr-only"
              id="file-upload"
            />
            <Paperclip className="w-5 h-5 text-textSecondary hover:text-textPrimary" />
          </label>

          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={inputValue}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              placeholder={isClaudeRunning ? 'Claude está respondendo...' : 'Digite sua mensagem... (Shift+Enter para nova linha)'}
              disabled={isClaudeRunning}
              className={cn(
                'w-full bg-surface border border-border rounded-2xl px-4 py-3 text-textPrimary placeholder-textMuted',
                'focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent',
                'resize-none transition-all duration-150',
                'min-h-[48px] max-h-[200px]',
                'font-sans text-base leading-relaxed',
                dragActive && 'border-primary/50 bg-primary/5'
              )}
              style={{ height: inputHeight }}
              rows={1}
              aria-label="Mensagem"
            />
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={isClaudeRunning ? handleStop : handleSend}
              disabled={(!inputValue.trim() && pendingImages.length === 0) || isClaudeRunning}
              aria-label={isClaudeRunning ? 'Parar geração' : 'Enviar mensagem'}
              className={cn('h-10 w-10 rounded-xl', isClaudeRunning ? 'text-error hover:bg-error/10' : 'text-primary hover:bg-primary/10')}
            >
              {isClaudeRunning ? <StopCircle className="w-5 h-5" /> : <Send className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-4 mt-2 text-xs text-textMuted">
          <span>Modelo: <strong className="text-textSecondary">{settings.model.replace('claude-', '').replace(/-/g, ' ')}</strong></span>
          <span>Effort: <strong className="text-textSecondary capitalize">{settings.effort}</strong></span>
          {settings.webSearch && <span className="text-primary">🌐 Busca na Web ativa</span>}
        </div>
      </div>
    </div>
  )
}