'use client'

import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import {
  CheckCircle,
  AlertCircle,
  Loader2,
  Server,
  Cpu,
  Wifi,
} from 'lucide-react'
import turtlyImg from '@/assets/Gemini_Generated_Image_xev09dxev09dxev0-removebg-preview.png'

interface SplashScreenProps {
  onComplete: () => void
}

interface Step {
  id: string
  label: string
  icon: React.ReactNode
  status: 'pending' | 'active' | 'completed' | 'error'
  message?: string
}

// Tipagem explícita do retorno de getProcessStatusSnapshot(). Declarada aqui
// em vez de depender só da inferência via window.electronAPI, pra não dar
// TS7006 (parâmetro implicitamente "any") caso a tipagem global do preload
// não seja resolvida nesse ponto (ex.: cache de tipos do editor, tsconfig
// do renderer sem o .d.ts incluído, etc.).
interface ProcessStatusEntry {
  processName: string
  status: string
  details?: string
}

interface ProcessStatusSnapshot {
  processes: ProcessStatusEntry[]
  providerHealthy: boolean
  providerReady: boolean
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  const completedRef = useRef(false)

  const [steps, setSteps] = useState<Step[]>([
    {
      id: 'server',
      label: 'Iniciando servidor proxy',
      icon: <Server className="w-5 h-5" />,
      status: 'pending',
    },
    {
      id: 'health',
      label: 'Verificando saúde do servidor',
      icon: <Wifi className="w-5 h-5" />,
      status: 'pending',
    },
    {
      id: 'claude',
      label: 'Iniciando Claude CLI',
      icon: <Cpu className="w-5 h-5" />,
      status: 'pending',
    },
    {
      id: 'connect',
      label: 'Conectando ao ambiente',
      icon: <img src={turtlyImg} alt="Turtly" className="w-5 h-5 object-contain" />,
      status: 'pending',
    },
  ])

  const [error, setError] = useState<string | null>(null)


  useEffect(() => {

    // Alguns processos (ex.: fcc-server) podem já ter chegado a "running"
    // ANTES deste componente montar e registrar os listeners abaixo — nesse
    // caso o evento correspondente já foi disparado e se perdeu. Por isso
    // consultamos o snapshot atual assim que montamos, para não ficar preso
    // esperando um evento que já aconteceu.
    window.electronAPI?.getProcessStatusSnapshot?.().then((snapshot: ProcessStatusSnapshot | undefined) => {
      if (!snapshot) return

      const processNameToStepId: Record<string, string> = {
        'fcc-server': 'server',
        'claude': 'claude',
      }

      setSteps((prev) =>
        prev.map((step) => {
          const entry = snapshot.processes.find(
            (p: ProcessStatusEntry) => processNameToStepId[p.processName] === step.id
          )

          if (entry?.status === 'running') {
            return { ...step, status: 'completed', message: entry.details || 'Pronto' }
          }

          if (step.id === 'health' && snapshot.providerHealthy) {
            return { ...step, status: 'completed', message: 'Servidor saudável' }
          }

          if (step.id === 'connect' && snapshot.providerReady) {
            return { ...step, status: 'completed', message: 'Conectado' }
          }

          return step
        })
      )
    }).catch((err: unknown) => {
      console.error('[SplashScreen] falha ao buscar snapshot de status:', err)
    })

    const handleStatus = (
      data: {
        processName: string
        status: string
        details?: string
      }
    ) => {

      const processNameToStepId: Record<string, string> = {
        'fcc-server': 'server',
        'claude': 'claude',
      }

      const stepId = processNameToStepId[data.processName]
      if (!stepId) return

      setSteps((prev) =>
        prev.map((step) => {
          if (step.id !== stepId) return step

          if (data.status === 'running') {
            return { ...step, status: 'completed', message: data.details || 'Pronto' }
          }
          if (data.status === 'starting') {
            return { ...step, status: 'active', message: data.details || 'Iniciando...' }
          }
          if (data.status === 'error') {
            setError(data.details || `Erro no processo "${data.processName}"`)
            return { ...step, status: 'error', message: data.details || 'Erro' }
          }
          if (data.status === 'stopped') {
            setError(data.details || `"${data.processName}" parou inesperadamente`)
            return { ...step, status: 'error', message: data.details || 'Parado inesperadamente' }
          }
          return step
        })
      )
    }


    const handleError = (
      data: {
        name: string
        error: string
      }
    ) => {
      const processNameToStepId: Record<string, string> = {
        'fcc-server': 'server',
        'claude': 'claude',
      }
      const stepId = processNameToStepId[data.name]
      if (!stepId) return

      setError(data.error)
      setSteps((prev) =>
        prev.map((step) =>
          step.id === stepId
            ? { ...step, status: 'error', message: data.error }
            : step
        )
      )
    }


    const handleProcessStopped = (
      data: {
        name: string
        code: number | null
      }
    ) => {
      const processNameToStepId: Record<string, string> = {
        'fcc-server': 'server',
        'claude': 'claude',
      }
      const stepId = processNameToStepId[data.name]
      if (!stepId) return

      if (data.code !== 0) {
        setError(`${data.name} encerrou (código: ${data.code ?? 'signal'})`)
        setSteps((prev) =>
          prev.map((step) =>
            step.id === stepId
              ? { ...step, status: 'error', message: `${data.name} encerrou (código: ${data.code ?? 'signal'})` }
              : step
          )
        )
      }
    }


    const handleRestarting = (
      data: {
        processName: string
        attempt: number
      }
    ) => {
      const processNameToStepId: Record<string, string> = {
        'fcc-server': 'server',
        'claude': 'claude',
      }
      const stepId = processNameToStepId[data.processName]
      if (!stepId) return

      setSteps((prev) =>
        prev.map((step) =>
          step.id === stepId
            ? { ...step, status: 'active', message: `Reiniciando... tentativa ${data.attempt}/3` }
            : step
        )
      )
    }


    const cleanup = [
      window.electronAPI?.onProcessStatus?.(handleStatus),
      window.electronAPI?.onProcessError?.(handleError),
      window.electronAPI?.onProcessStopped?.(handleProcessStopped),
      window.electronAPI?.onProcessRestarting?.(handleRestarting),
      window.electronAPI?.onProviderReady?.(() => {
        console.log('[SplashScreen] provider-ready event received, completing connect step')
        setSteps((prev) =>
          prev.map((step) =>
            step.id === 'connect'
              ? { ...step, status: 'completed', message: 'Conectado' }
              : step
          )
        )
      }),
      window.electronAPI?.onProviderHealthy?.(() => {
        console.log('[SplashScreen] provider-healthy event received, completing health step')
        setSteps((prev) =>
          prev.map((step) =>
            step.id === 'health'
              ? { ...step, status: 'completed', message: 'Servidor saudável' }
              : step
          )
        )
      }),
    ]


    return () => {

      cleanup.forEach((fn) => {
        if (typeof fn === 'function') {
          fn()
        }
      })

    }


  }, [])

  useEffect(() => {
    if (completedRef.current) return
    const allCompleted = steps.every((step) => step.status === 'completed')
    if (!allCompleted) return

    completedRef.current = true
    const timer = setTimeout(() => {
      onComplete()
    }, 400)

    return () => clearTimeout(timer)
  }, [steps, onComplete])

    return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">

      <div className="relative w-full max-w-md mx-4">

        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-accent/10 rounded-2xl blur-3xl"
          initial={{
            opacity: 0,
            scale: 0.8,
          }}
          animate={{
            opacity: 1,
            scale: 1,
          }}
          transition={{
            duration: 0.6,
            ease: 'easeOut',
          }}
        />


        <motion.div
          className="relative bg-card/90 backdrop-blur-xl border border-border/50 rounded-2xl p-8 shadow-2xl"
          initial={{
            opacity: 0,
            y: 20,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 0.5,
            delay: 0.1,
            ease: 'easeOut',
          }}
        >

          <div className="text-center mb-8">

            <motion.div
              className="inline-flex items-center justify-center w-20 h-20 mb-4"
              initial={{
                scale: 0,
                rotate: -180,
              }}
              animate={{
                scale: 1,
                rotate: 0,
              }}
              transition={{
                type: 'spring',
                stiffness: 260,
                damping: 20,
                delay: 0.2,
              }}
            >
              <img src={turtlyImg} alt="Turtly" className="w-16 h-16 object-contain" />
            </motion.div>


            <h1 className="text-2xl font-bold text-foreground">
              Infiny
            </h1>

            <p className="text-muted-foreground mt-1">
              Iniciando ambiente de desenvolvimento...
            </p>

          </div>


          <div
            className="space-y-3"
            role="status"
            aria-live="polite"
          >

            <AnimatePresence mode="wait">

              {steps.map((step, index) => (

                <motion.div
                  key={step.id}
                  layout

                  className={cn(
                    'flex items-center gap-3 p-3 rounded-lg transition-all duration-300',

                    step.status === 'active' &&
                      'bg-primary/5 border border-primary/20',

                    step.status === 'completed' &&
                      'bg-green-500/5 border border-green-500/20',

                    step.status === 'error' &&
                      'bg-red-500/5 border border-red-500/20',

                    step.status === 'pending' &&
                      'bg-muted/30'
                  )}

                  initial={{
                    opacity: 0,
                    x: -20,
                  }}

                  animate={{
                    opacity: 1,
                    x: 0,
                  }}

                  exit={{
                    opacity: 0,
                    x: 20,
                  }}

                  transition={{
                    delay: index * 0.08,
                  }}
                >


                  <motion.div

                    className={cn(
                      'flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-300',

                      step.status === 'active' &&
                        'bg-primary/10 text-primary',

                      step.status === 'completed' &&
                        'bg-green-500/10 text-green-500',

                      step.status === 'error' &&
                        'bg-red-500/10 text-red-500',

                      step.status === 'pending' &&
                        'bg-muted text-muted-foreground'
                    )}

                    animate={{
                      scale:
                        step.status === 'active'
                          ? [1, 1.1, 1]
                          : 1,

                      rotate:
                        step.status === 'active'
                          ? [0, 5, -5, 0]
                          : 0,
                    }}

                    transition={{
                      duration: 1.5,
                      repeat:
                        step.status === 'active'
                          ? Infinity
                          : 0,
                    }}

                  >

                    {
                      step.status === 'completed'
                        ? (
                          <CheckCircle className="w-5 h-5" />
                        )

                        : step.status === 'error'
                        ? (
                          <AlertCircle className="w-5 h-5" />
                        )

                        : step.status === 'active'
                        ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        )

                        : (
                          step.icon
                        )
                    }

                  </motion.div>


                  <div className="flex-1 min-w-0">

                    <p
                      className={cn(
                        'font-medium text-sm',
                        step.status === 'error' &&
                        'text-red-500'
                      )}
                    >
                      {step.label}
                    </p>


                    {
                      step.message && (

                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                          {step.message}
                        </p>

                      )
                    }

                  </div>


                  <motion.div

                    className="w-2 h-2 rounded-full"

                    animate={{

                      backgroundColor:

                        step.status === 'active'
                          ? 'hsl(var(--primary))'

                          : step.status === 'completed'
                          ? 'hsl(142 76% 36%)'

                          : step.status === 'error'
                          ? 'hsl(0 84% 60%)'

                          : 'hsl(var(--muted-foreground) / 0.3)',

                    }}

                    transition={{
                      duration: 0.3,
                    }}

                  />

                </motion.div>

              ))}

            </AnimatePresence>

          </div>

                    <motion.div
            className="mt-6 h-1.5 bg-muted rounded-full overflow-hidden"
            initial={{
              scaleX: 0,
            }}
            animate={{
              scaleX:
                steps.filter(
                  (s) => s.status === 'completed'
                ).length / steps.length,
            }}
            transition={{
              duration: 0.5,
              ease: 'easeOut',
            }}
          >

            <motion.div
              className="h-full bg-gradient-to-r from-primary to-accent rounded-full"
              initial={{
                width: 0,
              }}
              animate={{
                width: '100%',
              }}
              transition={{
                duration: 0.5,
                ease: 'easeOut',
              }}
            />

          </motion.div>


          {
            error && (

              <motion.div

                className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm"

                initial={{
                  opacity: 0,
                  y: 10,
                }}

                animate={{
                  opacity: 1,
                  y: 0,
                }}

              >

                <div className="flex items-center gap-2">

                  <AlertCircle className="w-4 h-4 flex-shrink-0" />

                  <span>
                    Erro: {error}
                  </span>

                </div>


                <p className="mt-2 text-xs text-red-400">
                  Verifique se o free-claude-code está instalado e tente novamente.
                </p>

              </motion.div>

            )
          }


        </motion.div>


        <motion.div

          className="flex items-center justify-center gap-1.5 mt-6"

          initial={{
            opacity: 0,
          }}

          animate={{
            opacity: 1,
          }}

          transition={{
            delay: 0.8,
          }}

        >

          <img
            src={turtlyImg}
            alt="Turtly"
            title="Turtly tá vigiando o carregamento"
            className="w-4 h-4 object-contain"
          />

          <p className="text-center text-xs text-muted-foreground">
            Infiny v1.0.0 — Powered by free-claude-code
          </p>

        </motion.div>


      </div>

    </div>
  )
}