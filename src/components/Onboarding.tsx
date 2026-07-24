'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { ArrowRight, Check, Sparkles, Brain, Zap, Globe, Palette, Keyboard } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import {
  fadeInUpVariants,
  transitions,
} from '@/lib/transitions'
import { useStore } from '@/store/infinyStore'

const ONBOARDING_STEPS = [
  {
    id: 'welcome',
    title: 'Bem-vindo ao Infiny',
    description: 'Seu assistente de IA com personalidade calma, estável e confiável — inspirado na Turtly.',
    icon: Sparkles,
    color: 'primary',
  },
  {
    id: 'chat',
    title: 'Converse naturalmente',
    description: 'Digite suas mensagens, envie imagens, use busca na web. O Infiny entende contexto e mantém o histórico.',
    icon: Brain,
    color: 'blue',
  },
  {
    id: 'models',
    title: 'Escolha seu modelo',
    description: 'Selecione entre diversos provedores (Claude, OpenAI, Gemini) e ajuste o nível de esforço para cada tarefa.',
    icon: Zap,
    color: 'purple',
  },
  {
    id: 'projects',
    title: 'Organize por projetos',
    description: 'Crie projetos, pastas e chats. Tudo salvo localmente, privado e acessível offline.',
    icon: Globe,
    color: 'green',
  },
  {
    id: 'themes',
    title: 'Personalize seu espaço',
    description: '6 temas cuidadosamente criados — do claro ao escuro, do minimal ao futurista. Troque a qualquer momento.',
    icon: Palette,
    color: 'amber',
  },
  {
    id: 'shortcuts',
    title: 'Atalhos úteis',
    description: 'Ctrl+B abre/fecha a sidebar. Ctrl+Enter envia a mensagem. Shift+Enter nova linha. Explore mais no menu.',
    icon: Keyboard,
    color: 'orange',
  },
  {
    id: 'ready',
    title: 'Pronto para começar!',
    description: 'Crie seu primeiro projeto ou selecione um existente na barra lateral. A Turtly está torcendo por você.',
    icon: Check,
    color: 'success',
  },
]

const colorStyles: Record<string, { bg: string; text: string; iconBg: string; border: string }> = {
  primary: { bg: 'bg-primary/10', text: 'text-primary', iconBg: 'bg-primary/20', border: 'border-primary/20' },
  blue: { bg: 'bg-blue-500/10', text: 'text-blue-500', iconBg: 'bg-blue-500/20', border: 'border-blue-500/20' },
  purple: { bg: 'bg-purple-500/10', text: 'text-purple-500', iconBg: 'bg-purple-500/20', border: 'border-purple-500/20' },
  green: { bg: 'bg-emerald-500/10', text: 'text-emerald-500', iconBg: 'bg-emerald-500/20', border: 'border-emerald-500/20' },
  amber: { bg: 'bg-amber-500/10', text: 'text-amber-500', iconBg: 'bg-amber-500/20', border: 'border-amber-500/20' },
  orange: { bg: 'bg-orange-500/10', text: 'text-orange-500', iconBg: 'bg-orange-500/20', border: 'border-orange-500/20' },
  success: { bg: 'bg-success/10', text: 'text-success', iconBg: 'bg-success/20', border: 'border-success/20' },
}

interface OnboardingProps {
  isOpen: boolean
  onClose: () => void
}

export function Onboarding({ isOpen, onClose }: OnboardingProps) {
  const { projects, addProject, setCurrentProject } = useStore()
  const [currentStep, setCurrentStep] = useState(0)
  const shouldReduceMotion = useReducedMotion()

  const step = ONBOARDING_STEPS[currentStep]
  const colors = colorStyles[step.color] || colorStyles.primary
  const isFirst = currentStep === 0
  const isLast = currentStep === ONBOARDING_STEPS.length - 1
  const progress = ((currentStep + 1) / ONBOARDING_STEPS.length) * 100

  const handleNext = useCallback(() => {
    if (isLast) {
      // Create default project if none exists
      if (projects.length === 0) {
        const project = addProject({ name: 'Meu Primeiro Projeto', path: '', lastOpened: Date.now() })
        setCurrentProject(project)
      }
      // Small delay to show completion animation
      setTimeout(() => onClose(), shouldReduceMotion ? 0 : 500)
    } else {
      setCurrentStep((prev) => prev + 1)
    }
  }, [isLast, projects.length, addProject, setCurrentProject, onClose, shouldReduceMotion])

  const handleSkip = useCallback(() => {
    if (projects.length === 0) {
      const project = addProject({ name: 'Meu Primeiro Projeto', path: '', lastOpened: Date.now() })
      setCurrentProject(project)
    }
    onClose()
  }, [projects.length, addProject, setCurrentProject, onClose])

  // Keyboard navigation
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (!isOpen) return
      if (e.key === 'ArrowRight' || e.key === 'Enter') {
        e.preventDefault()
        handleNext()
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        setCurrentStep((prev) => Math.max(prev - 1, 0))
      } else if (e.key === 'Escape') {
        handleSkip()
      }
    }
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
    }
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, handleNext, handleSkip])

  if (!isOpen) return null

  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={transitions.tween}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="onboarding-title"
      >
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={transitions.tweenFast}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          onClick={handleSkip}
          aria-hidden="true"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 20 }}
          transition={shouldReduceMotion ? { duration: 0 } : transitions.smooth}
          className={cn(
            'w-full max-w-2xl bg-background border border-border rounded-2xl shadow-2xl overflow-hidden',
            'glass relative'
          )}
        >
          {/* Progress Bar */}
          <motion.div
            className="absolute top-0 left-0 right-0 h-1 bg-border overflow-hidden"
            aria-hidden="true"
          >
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: shouldReduceMotion ? 0 : 0.4, ease: [0.25, 0.1, 0.25, 1] }}
              className={cn('h-full', colors.text, 'origin-left')}
            />
          </motion.div>

          {/* Content */}
          <div className="p-8">
            {/* Step Indicator */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...transitions.smooth, delay: 0.1 }}
              className="flex items-center justify-between mb-8"
            >
              <span className="text-xs font-medium text-textMuted uppercase tracking-wider">
                Passo {currentStep + 1} de {ONBOARDING_STEPS.length}
              </span>
              {!isLast && (
                <Button variant="ghost" size="sm" onClick={handleSkip} className="text-textMuted hover:text-textSecondary">
                  Pular
                </Button>
              )}
            </motion.div>

            {/* Main Content */}
            <AnimatePresence mode="wait">
              <motion.div
                key={step.id}
                variants={fadeInUpVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                custom={shouldReduceMotion ? 0 : undefined}
                className="text-center"
              >
                {/* Icon */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.8, rotate: -15 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  transition={shouldReduceMotion ? { duration: 0 } : { ...transitions.bouncy, delay: 0.15 }}
                  className={cn('w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6', colors.iconBg)}
                >
                  <step.icon className={cn('w-10 h-10', colors.text)} />
                </motion.div>

                {/* Title */}
                <motion.h2
                  id="onboarding-title"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...transitions.smooth, delay: 0.25 }}
                  className={cn('text-2xl font-semibold text-text mb-3', colors.text)}
                >
                  {step.title}
                </motion.h2>

                {/* Description */}
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...transitions.smooth, delay: 0.3 }}
                  className="text-textSecondary text-lg leading-relaxed max-w-md mx-auto"
                >
                  {step.description}
                </motion.p>

                {/* Features for specific steps */}
                {step.id === 'chat' && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4, duration: 0.3 }}
                    className="mt-6 flex items-center justify-center gap-4 text-sm text-textMuted"
                  >
                    <span className="flex items-center gap-1.5 px-3 py-1.5 bg-surface border border-border rounded-lg">
                      <kbd className="px-1.5 py-0.5 bg-surfaceHover border border-border rounded text-xs font-mono">Ctrl</kbd>
                      <span>+</span>
                      <kbd className="px-1.5 py-0.5 bg-surfaceHover border border-border rounded text-xs font-mono">Enter</kbd>
                      <span className="ml-1">Enviar</span>
                    </span>
                    <span className="flex items-center gap-1.5 px-3 py-1.5 bg-surface border border-border rounded-lg">
                      <kbd className="px-1.5 py-0.5 bg-surfaceHover border border-border rounded text-xs font-mono">Shift</kbd>
                      <span>+</span>
                      <kbd className="px-1.5 py-0.5 bg-surfaceHover border border-border rounded text-xs font-mono">Enter</kbd>
                      <span className="ml-1">Nova linha</span>
                    </span>
                    <span className="flex items-center gap-1.5 px-3 py-1.5 bg-surface border border-border rounded-lg">
                      <kbd className="px-1.5 py-0.5 bg-surfaceHover border border-border rounded text-xs font-mono">Ctrl</kbd>
                      <span>+</span>
                      <kbd className="px-1.5 py-0.5 bg-surfaceHover border border-border rounded text-xs font-mono">B</kbd>
                      <span className="ml-1">Sidebar</span>
                    </span>
                  </motion.div>
                )}

                {step.id === 'shortcuts' && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4, duration: 0.3 }}
                    className="mt-6 space-y-3 text-left max-w-md mx-auto"
                  >
                    {[
                      { keys: ['Ctrl', 'B'], action: 'Alternar barra lateral' },
                      { keys: ['Ctrl', 'Enter'], action: 'Enviar mensagem' },
                      { keys: ['Shift', 'Enter'], action: 'Nova linha' },
                      { keys: ['Ctrl', 'K'], action: 'Buscar (próximamente)' },
                      { keys: ['Esc'], action: 'Fechar modais/menus' },
                    ].map((item, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ ...transitions.smooth, delay: 0.4 + idx * 0.05 }}
                        className="flex items-center gap-3 p-3 bg-surface border border-border rounded-lg"
                      >
                        <div className="flex items-center gap-1.5">
                          {item.keys.map((k, i) => (
                            <span key={i} className="flex items-center gap-1">
                              <kbd className="px-2 py-1 bg-surfaceHover border border-border rounded text-xs font-mono">{k}</kbd>
                              {i < item.keys.length - 1 && <span className="text-textMuted">+</span>}
                            </span>
                          ))}
                        </div>
                        <span className="text-textSecondary text-sm">{item.action}</span>
                      </motion.div>
                    ))}
                  </motion.div>
                )}

                {step.id === 'ready' && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={shouldReduceMotion ? { duration: 0 } : { ...transitions.bouncy, delay: 0.4 }}
                    className="mt-8 p-6 rounded-xl bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20"
                  >
                    <motion.div
                      animate={{ rotate: [0, 5, -5, 0] }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                      className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center mx-auto mb-3"
                    >
                      <Sparkles className="w-7 h-7 text-primary" />
                    </motion.div>
                    <p className="font-medium text-text mb-1">A Turtly está torcendo por você! 🐢</p>
                    <p className="text-textSecondary text-sm">Lembre-se: devagar e sempre se chega lá.</p>
                  </motion.div>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Navigation */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...transitions.smooth, delay: 0.5 }}
              className="mt-8 flex items-center justify-between gap-4"
            >
              {!isFirst && (
                <Button
                  variant="ghost"
                  onClick={() => setCurrentStep((prev) => prev - 1)}
                  className="flex-1"
                  aria-label="Passo anterior"
                >
                  <ArrowRight className="w-4 h-4 mr-2 rotate-180" />
                  Voltar
                </Button>
              )}

              <Button
                variant={isLast ? 'primary' : 'primary'}
                size="lg"
                onClick={handleNext}
                className={cn('flex-1', isLast && 'gap-2')}
                aria-label={isLast ? 'Começar a usar o Infiny' : 'Próximo passo'}
              >
                {isLast ? (
                  <>
                    Começar
                    <motion.span
                      animate={{ x: [0, 4, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                    >
                      <ArrowRight className="w-4 h-4" />
                    </motion.span>
                  </>
                ) : (
                  <>
                    Próximo
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </motion.div>

            {/* Step Dots */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.3 }}
              className="mt-6 flex items-center justify-center gap-1.5"
              role="tablist"
              aria-label="Passos do onboarding"
            >
              {ONBOARDING_STEPS.map((_, idx) => (
                <motion.button
                  key={idx}
                  role="tab"
                  aria-selected={idx === currentStep}
                  aria-label={`Passo ${idx + 1}`}
                  onClick={() => setCurrentStep(idx)}
                  className={cn(
                    'w-2 h-2 rounded-full transition-all duration-300',
                    idx === currentStep
                      ? `${colors.text} w-6`
                      : 'text-textMuted/50 hover:text-textMuted'
                  )}
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.9 }}
                  disabled={idx === currentStep}
                />
              ))}
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default Onboarding