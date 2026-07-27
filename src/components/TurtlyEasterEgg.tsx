import { useCallback, useEffect, useRef, useState } from 'react'
import { motion, useAnimation, AnimatePresence } from 'framer-motion'
import turtlyImg from '@/assets/Gemini_Generated_Image_xev09dxev09dxev0-removebg-preview.png'

const CLICKS_TO_ACTIVATE = 3
const CATCH_DISTANCE = 46 // px — distância pra considerar que a Turtly "alcançou" o mouse
const CHASE_SPEED = 0.09 // 0-1, quanto maior mais rápido ela persegue
const MIN_CHASE_FRAMES = 12 // evita "pegar" o mouse no instante em que sai correndo
const PUSH_DISTANCE = 90 // px que o cursor "voa" ao ser empurrado

interface PushFx {
  x: number
  y: number
  angle: number
  key: number
}

/**
 * Easter egg da Turtly: clique 3x nela e ela sacode, pula e sai
 * perseguindo o cursor pela tela inteira. Se ela te alcançar, empurra
 * o cursor pra longe (navegadores não deixam mover o cursor real do
 * SO, então simulamos com um pequeno "empurrão" visual no ponto onde
 * o mouse estava) e volta correndo pro lugar dela.
 */
export function TurtlyEasterEgg() {
  const slotRef = useRef<HTMLDivElement>(null)
  const runnerRef = useRef<HTMLDivElement>(null)
  const controls = useAnimation()

  const [clickCount, setClickCount] = useState(0)
  const [active, setActive] = useState(false)
  const [pushFx, setPushFx] = useState<PushFx | null>(null)

  const mouseRef = useRef({ x: 0, y: 0 })
  const mouseMovedRef = useRef(false)
  const posRef = useRef({ x: 0, y: 0 })
  const homeRef = useRef({ x: 0, y: 0 })
  const facingRef = useRef(1)
  const rafRef = useRef<number>()
  const catchingRef = useRef(false)

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY }
      mouseMovedRef.current = true
    }
    window.addEventListener('mousemove', onMove)
    return () => window.removeEventListener('mousemove', onMove)
  }, [])

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  const applyTransform = useCallback((x: number, y: number) => {
    if (!runnerRef.current) return
    runnerRef.current.style.transform =
      `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%) scaleX(${facingRef.current})`
  }, [])

  const returnHome = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    const start = { ...posRef.current }
    const target = homeRef.current
    const duration = 550
    const startTime = performance.now()

    const step = (now: number) => {
      const t = Math.min(1, (now - startTime) / duration)
      const eased = 1 - Math.pow(1 - t, 3)
      const x = start.x + (target.x - start.x) * eased
      const y = start.y + (target.y - start.y) * eased
      posRef.current = { x, y }
      applyTransform(x, y)
      if (t < 1) {
        rafRef.current = requestAnimationFrame(step)
      } else {
        setActive(false)
        setClickCount(0)
      }
    }
    rafRef.current = requestAnimationFrame(step)
  }, [applyTransform])

  const startChase = useCallback(() => {
    if (!slotRef.current) return
    const rect = slotRef.current.getBoundingClientRect()
    const home = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
    homeRef.current = home
    posRef.current = { ...home }
    catchingRef.current = false
    setActive(true)

    let frame = 0

    const tick = () => {
      frame += 1
      const { x, y } = posRef.current
      const { x: mx, y: my } = mouseRef.current
      const dx = mx - x
      const dy = my - y
      const dist = Math.hypot(dx, dy)

      if (Math.abs(dx) > 2) facingRef.current = dx < 0 ? -1 : 1

      if (
        !catchingRef.current &&
        mouseMovedRef.current &&
        frame > MIN_CHASE_FRAMES &&
        dist < CATCH_DISTANCE
      ) {
        catchingRef.current = true
        const angle = Math.atan2(dy, dx)
        setPushFx({ x: mx, y: my, angle, key: Date.now() })
        returnHome()
        return
      }

      const nx = x + dx * CHASE_SPEED
      const ny = y + dy * CHASE_SPEED
      posRef.current = { x: nx, y: ny }
      applyTransform(nx, ny)
      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
  }, [applyTransform, returnHome])

  const handleClick = () => {
    if (active) return

    const next = clickCount + 1
    if (next >= CLICKS_TO_ACTIVATE) {
      setClickCount(0)
      controls
        .start({
          x: [0, -6, 6, -6, 6, 0],
          y: [0, 0, -20, 0, -12, 0],
          rotate: [0, -8, 8, -6, 4, 0],
          transition: { duration: 0.5, ease: 'easeInOut' },
        })
        .then(() => startChase())
    } else {
      setClickCount(next)
    }
  }

  return (
    <>
      <div
        ref={slotRef}
        className="w-28 h-28 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6"
      >
        <motion.img
          src={turtlyImg}
          alt="Turtly"
          onClick={handleClick}
          animate={controls}
          whileHover={active ? undefined : { scale: 1.05 }}
          whileTap={active ? undefined : { scale: 0.95 }}
          className="w-20 h-20 object-contain select-none cursor-pointer"
          style={{ visibility: active ? 'hidden' : 'visible' }}
          draggable={false}
        />
      </div>

      {active && (
        <div
          ref={runnerRef}
          className="fixed top-0 left-0 z-[9999] pointer-events-none will-change-transform"
          style={{
            transform: `translate3d(${homeRef.current.x}px, ${homeRef.current.y}px, 0) translate(-50%, -50%)`,
          }}
        >
          <img src={turtlyImg} alt="" className="w-16 h-16 object-contain drop-shadow-xl" draggable={false} />
        </div>
      )}

      <AnimatePresence>
        {pushFx && (
          <motion.div
            key={pushFx.key}
            className="fixed z-[9999] pointer-events-none rounded-full border-2 border-primary/70"
            style={{ left: pushFx.x, top: pushFx.y, width: 14, height: 14, marginLeft: -7, marginTop: -7 }}
            initial={{ opacity: 1, scale: 1, x: 0, y: 0 }}
            animate={{
              opacity: 0,
              scale: 1.7,
              x: Math.cos(pushFx.angle) * PUSH_DISTANCE,
              y: Math.sin(pushFx.angle) * PUSH_DISTANCE,
            }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
            onAnimationComplete={() => setPushFx(null)}
          />
        )}
      </AnimatePresence>
    </>
  )
}