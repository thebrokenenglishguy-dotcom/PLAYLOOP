import { useEffect, useRef, useState } from 'react'
import { RotateCcw } from 'lucide-react'
import GameButton from './GameButton.jsx'

const colors = [
  { name: 'Coral', hex: '#ff6b78' }, { name: 'Violet', hex: '#9b7bff' },
  { name: 'Mint', hex: '#38d6ae' }, { name: 'Sky', hex: '#55a9ff' },
  { name: 'Sunshine', hex: '#ffc857' }, { name: 'Pink', hex: '#f278c9' },
]
const pickTarget = (previous) => {
  const available = colors.filter((color) => color.name !== previous)
  return available[Math.floor(Math.random() * available.length)]
}
const ROUND_SECONDS = 20

export default function ColorRush({ onComplete }) {
  const [status, setStatus] = useState('ready')
  const [seconds, setSeconds] = useState(ROUND_SECONDS)
  const [score, setScore] = useState(0)
  const [target, setTarget] = useState(() => pickTarget())
  const [feedback, setFeedback] = useState('')
  const interval = useRef(null)
  const scoreRef = useRef(0)
  const remainingRef = useRef(ROUND_SECONDS)
  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete
  const finish = () => {
    window.clearInterval(interval.current)
    setStatus('done')
    onCompleteRef.current?.(scoreRef.current)
  }
  useEffect(() => () => window.clearInterval(interval.current), [])

  const start = () => {
    window.clearInterval(interval.current)
    scoreRef.current = 0
    remainingRef.current = ROUND_SECONDS
    setScore(0)
    setSeconds(ROUND_SECONDS)
    setFeedback('')
    setTarget(pickTarget())
    setStatus('playing')
    interval.current = window.setInterval(() => {
      remainingRef.current -= 1
      setSeconds(remainingRef.current)
      if (remainingRef.current <= 0) finish()
    }, 1000)
  }
  const choose = (color) => {
    if (status !== 'playing') return
    if (color.name === target.name) {
      scoreRef.current += 1
      setScore(scoreRef.current)
      setFeedback('Perfect match!')
      const next = pickTarget(target.name)
      setTarget(next)
    } else {
      setFeedback('Not quite — try again!')
      remainingRef.current = Math.max(remainingRef.current - 2, 0)
      setSeconds(remainingRef.current)
      if (remainingRef.current === 0) finish()
    }
  }

  return (
    <div className="mini-game color-game">
      <div className="game-hud"><div><span className="hud-label">MATCHES</span><strong>{score.toString().padStart(2, '0')}</strong></div><div className="color-timer"><span className="hud-label">TIME LEFT</span><strong>{seconds}s</strong></div><GameButton className="restart-small" onClick={start} aria-label="Restart game"><RotateCcw size={15} /></GameButton></div>
      <div className="color-target-area"><span className="hud-label">FIND THIS COLOR</span><div className="color-target" style={{ backgroundColor: target.hex }} /><strong>{target.name}</strong></div>
      <div className="color-options">{colors.map((color) => <button key={color.name} style={{ backgroundColor: color.hex }} className="color-swatch" onClick={() => choose(color)} aria-label={`Select ${color.name}`} disabled={status !== 'playing'} />)}</div>
      <div className={`color-feedback ${feedback.includes('Perfect') ? 'good' : ''}`}>{status === 'ready' ? <div className="color-start"><p>Match as many colors as you can in 20 seconds.</p><GameButton onClick={start}>Start round</GameButton></div> : status === 'done' ? <div className="color-finish"><strong>Round over — {score} matches!</strong><GameButton onClick={start}>Play again</GameButton></div> : feedback || 'Tap the matching swatch'}</div>
      <div className="game-footnote"><span>Correct match = +1 point</span><span>Wrong match = −2 seconds</span></div>
    </div>
  )
}
