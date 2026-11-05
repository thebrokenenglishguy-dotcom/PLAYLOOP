import { useEffect, useRef, useState } from 'react'
import { RotateCcw } from 'lucide-react'
import GameButton from './GameButton.jsx'

const WIDTH = 800
const HEIGHT = 450
const WIN_SCORE = 5
const PADDLE = { width: 12, height: 92, inset: 34 }

function makeBall(direction = Math.random() < 0.5 ? -1 : 1) {
  return { x: WIDTH / 2, y: HEIGHT / 2, vx: direction * 270, vy: (Math.random() * 2 - 1) * 170, radius: 9 }
}

export default function Pong({ onComplete }) {
  const canvasRef = useRef(null)
  const stateRef = useRef({ ball: makeBall(), leftY: HEIGHT / 2, rightY: HEIGHT / 2, leftScore: 0, rightScore: 0, status: 'ready', mode: 'cpu', keys: new Set(), frame: 0, lastTime: 0 })
  const onCompleteRef = useRef(onComplete)
  const [mode, setMode] = useState('cpu')
  const [status, setStatus] = useState('ready')
  const [score, setScore] = useState([0, 0])
  onCompleteRef.current = onComplete
  stateRef.current.mode = mode
  stateRef.current.status = status

  useEffect(() => {
    const canvas = canvasRef.current
    const context = canvas.getContext('2d')
    const state = stateRef.current
    let active = true
    let resizeObserver

    const draw = () => {
      const rect = canvas.getBoundingClientRect()
      const ratio = window.devicePixelRatio || 1
      const pixelWidth = Math.max(1, Math.round(rect.width * ratio))
      const pixelHeight = Math.max(1, Math.round(rect.height * ratio))
      if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
        canvas.width = pixelWidth
        canvas.height = pixelHeight
      }
      context.setTransform(pixelWidth / WIDTH, 0, 0, pixelHeight / HEIGHT, 0, 0)
      context.clearRect(0, 0, WIDTH, HEIGHT)
      context.fillStyle = '#0c1118'
      context.fillRect(0, 0, WIDTH, HEIGHT)
      context.setLineDash([9, 12])
      context.strokeStyle = 'rgba(177, 205, 218, .18)'
      context.lineWidth = 2
      context.beginPath()
      context.moveTo(WIDTH / 2, 0)
      context.lineTo(WIDTH / 2, HEIGHT)
      context.stroke()
      context.setLineDash([])
      context.fillStyle = '#4fe0c1'
      context.shadowColor = '#4fe0c1'
      context.shadowBlur = 16
      context.fillRect(PADDLE.inset, state.leftY - PADDLE.height / 2, PADDLE.width, PADDLE.height)
      context.fillStyle = '#ff7f9d'
      context.shadowColor = '#ff7f9d'
      context.fillRect(WIDTH - PADDLE.inset - PADDLE.width, state.rightY - PADDLE.height / 2, PADDLE.width, PADDLE.height)
      context.fillStyle = '#fff1be'
      context.shadowColor = '#ffe3a1'
      context.shadowBlur = 20
      context.beginPath()
      context.arc(state.ball.x, state.ball.y, state.ball.radius, 0, Math.PI * 2)
      context.fill()
      context.shadowBlur = 0
    }

    const frame = (time) => {
      if (!active) return
      const delta = state.lastTime ? Math.min((time - state.lastTime) / 1000, 0.035) : 0
      state.lastTime = time
      if (state.status === 'playing') {
        const keys = state.keys
        const leftDirection = Number(keys.has('s') || state.mode === 'cpu' && keys.has('arrowdown')) - Number(keys.has('w') || state.mode === 'cpu' && keys.has('arrowup'))
        const rightDirection = Number(keys.has('arrowdown')) - Number(keys.has('arrowup'))
        state.leftY = Math.max(PADDLE.height / 2, Math.min(HEIGHT - PADDLE.height / 2, state.leftY + leftDirection * 390 * delta))
        if (state.mode === 'cpu') {
          const target = state.ball.y + state.ball.vy * 0.12
          state.rightY += Math.sign(target - state.rightY) * Math.min(Math.abs(target - state.rightY), 290 * delta)
        } else state.rightY = Math.max(PADDLE.height / 2, Math.min(HEIGHT - PADDLE.height / 2, state.rightY + rightDirection * 390 * delta))

        const ball = state.ball
        ball.x += ball.vx * delta
        ball.y += ball.vy * delta
        if (ball.y - ball.radius < 0 || ball.y + ball.radius > HEIGHT) {
          ball.vy *= -1
          ball.y = Math.max(ball.radius, Math.min(HEIGHT - ball.radius, ball.y))
        }
        if (ball.vx < 0 && ball.x - ball.radius <= PADDLE.inset + PADDLE.width && Math.abs(ball.y - state.leftY) < PADDLE.height / 2 + ball.radius) {
          ball.x = PADDLE.inset + PADDLE.width + ball.radius
          ball.vx = Math.abs(ball.vx) * 1.045
          ball.vy += (ball.y - state.leftY) * 5
        } else if (ball.vx > 0 && ball.x + ball.radius >= WIDTH - PADDLE.inset - PADDLE.width && Math.abs(ball.y - state.rightY) < PADDLE.height / 2 + ball.radius) {
          ball.x = WIDTH - PADDLE.inset - PADDLE.width - ball.radius
          ball.vx = -Math.abs(ball.vx) * 1.045
          ball.vy += (ball.y - state.rightY) * 5
        }
        if (ball.x < -ball.radius || ball.x > WIDTH + ball.radius) {
          if (ball.x < 0) state.rightScore += 1
          else state.leftScore += 1
          setScore([state.leftScore, state.rightScore])
          if (state.leftScore >= WIN_SCORE || state.rightScore >= WIN_SCORE) {
            state.status = 'done'
            setStatus('done')
            if (state.leftScore >= WIN_SCORE) onCompleteRef.current?.(100, { winner: 'player' })
          } else state.ball = makeBall(ball.x < 0 ? 1 : -1)
        }
      }
      draw()
      state.frame = requestAnimationFrame(frame)
    }

    resizeObserver = new ResizeObserver(draw)
    resizeObserver.observe(canvas)
    state.frame = requestAnimationFrame(frame)
    return () => {
      active = false
      cancelAnimationFrame(state.frame)
      resizeObserver.disconnect()
    }
  }, [])

  useEffect(() => {
    const handleKeyDown = (event) => {
      const key = event.key.toLowerCase()
      if (['w', 's', 'arrowup', 'arrowdown'].includes(key)) {
        event.preventDefault()
        stateRef.current.keys.add(key)
      }
    }
    const handleKeyUp = (event) => stateRef.current.keys.delete(event.key.toLowerCase())
    const clearKeys = () => stateRef.current.keys.clear()
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    window.addEventListener('blur', clearKeys)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      window.removeEventListener('blur', clearKeys)
    }
  }, [])

  const restart = () => {
    const state = stateRef.current
    state.ball = makeBall()
    state.leftY = HEIGHT / 2
    state.rightY = HEIGHT / 2
    state.leftScore = 0
    state.rightScore = 0
    state.lastTime = 0
    state.keys.clear()
    state.status = 'ready'
    setScore([0, 0])
    setStatus('ready')
  }

  const start = () => {
    stateRef.current.status = 'playing'
    setStatus('playing')
  }

  const hold = (key, active) => {
    if (active) stateRef.current.keys.add(key)
    else stateRef.current.keys.delete(key)
  }

  return (
    <div className="mini-game pong-game">
      <div className="game-hud"><div><span className="hud-label">YOU</span><strong>{String(score[0]).padStart(2, '0')}</strong></div><div className="pong-mode-control" role="group" aria-label="Pong game mode"><button className={mode === 'cpu' ? 'selected' : ''} onClick={() => { setMode('cpu'); restart() }}>VS COMPUTER</button><button className={mode === 'local' ? 'selected' : ''} onClick={() => { setMode('local'); restart() }}>2 PLAYERS</button></div><div><span className="hud-label">{mode === 'cpu' ? 'CPU' : 'PLAYER 2'}</span><strong>{String(score[1]).padStart(2, '0')}</strong></div><GameButton className="restart-small" onClick={restart} aria-label="Restart game"><RotateCcw size={15} /></GameButton></div>
      <div className="pong-stage"><canvas ref={canvasRef} className="pong-canvas" aria-label="Pong match" />{status !== 'playing' && <div className="pong-overlay"><span className="hud-label">FIRST TO {WIN_SCORE}</span><strong>{status === 'done' ? score[0] >= WIN_SCORE ? 'YOU WIN' : mode === 'cpu' ? 'COMPUTER WINS' : 'PLAYER 2 WINS' : 'READY TO RALLY?'}</strong><GameButton onClick={start}>{status === 'done' ? 'Play again' : 'Start match'}</GameButton></div>}</div>
      <div className="pong-touch-controls"><div className="pong-control-side"><span>PLAYER 1</span><button aria-label="Move player 1 up" onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); hold('w', true) }} onPointerUp={() => hold('w', false)} onPointerCancel={() => hold('w', false)} onPointerLeave={() => hold('w', false)}>UP</button><button aria-label="Move player 1 down" onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); hold('s', true) }} onPointerUp={() => hold('s', false)} onPointerCancel={() => hold('s', false)} onPointerLeave={() => hold('s', false)}>DOWN</button></div><span className="pong-key-hint">W / S {mode === 'cpu' ? '· arrows also move you' : '· ARROWS'}</span>{mode === 'local' && <div className="pong-control-side right"><span>PLAYER 2</span><button aria-label="Move player 2 up" onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); hold('arrowup', true) }} onPointerUp={() => hold('arrowup', false)} onPointerCancel={() => hold('arrowup', false)} onPointerLeave={() => hold('arrowup', false)}>UP</button><button aria-label="Move player 2 down" onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); hold('arrowdown', true) }} onPointerUp={() => hold('arrowdown', false)} onPointerCancel={() => hold('arrowdown', false)} onPointerLeave={() => hold('arrowdown', false)}>DOWN</button></div>}</div>
      <div className="game-footnote"><span>First to {WIN_SCORE} points wins</span><span>{mode === 'cpu' ? 'W / S to move · arrows supported' : 'W / S vs arrow keys'}</span></div>
    </div>
  )
}