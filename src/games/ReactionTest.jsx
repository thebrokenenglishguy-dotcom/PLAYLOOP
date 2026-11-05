import { useEffect, useRef, useState } from 'react'
import { RotateCcw } from 'lucide-react'
import { loadProfile } from '../utils/storage.js'
import GameButton from './GameButton.jsx'

export default function ReactionTest({ onComplete }) {
  const [state, setState] = useState('ready')
  const [elapsed, setElapsed] = useState(null)
  const [best, setBest] = useState(() => loadProfile().bestScores['reaction-test'] || null)
  const timer = useRef(null)
  const startedAt = useRef(0)
  useEffect(() => () => window.clearTimeout(timer.current), [])

  const start = () => {
    window.clearTimeout(timer.current)
    setElapsed(null)
    setState('waiting')
    timer.current = window.setTimeout(() => { startedAt.current = performance.now(); setState('go') }, 1200 + Math.random() * 2800)
  }
  const press = () => {
    if (state === 'ready' || state === 'early' || state === 'result') { start(); return }
    if (state === 'waiting') { window.clearTimeout(timer.current); setState('early'); return }
    if (state === 'go') {
      const result = Math.round(performance.now() - startedAt.current)
      setElapsed(result)
      setBest((current) => current === null ? result : Math.min(current, result))
      setState('result')
      onComplete?.(Math.max(300 - Math.floor(result / 2), 1), { reactionMs: result, lowerIsBetter: true })
    }
  }
  return (
    <div className="mini-game reaction-game">
      <div className="game-hud"><div><span className="hud-label">YOUR TIME</span><strong>{elapsed === null ? '—' : `${elapsed}`}<small>{elapsed !== null ? 'ms' : ''}</small></strong></div><div className="reaction-best"><span className="hud-label">PERSONAL BEST</span><strong>{best === null ? '—' : `${best}ms`}</strong></div><GameButton className="restart-small" onClick={start} aria-label="Restart test"><RotateCcw size={15} /></GameButton></div>
      <button className={`reaction-pad pad-${state}`} onClick={press}><span className="reaction-symbol">{state === 'go' ? '!' : state === 'early' ? '✕' : state === 'result' ? '✓' : '·'}</span><strong>{state === 'ready' ? 'Tap to start' : state === 'waiting' ? 'Wait for green...' : state === 'go' ? 'TAP NOW!' : state === 'early' ? 'Too early!' : `${elapsed} ms`}</strong><small>{state === 'ready' || state === 'early' || state === 'result' ? 'Tap here to try again' : state === 'waiting' ? 'Hold your nerve' : 'Nice reflexes!'}</small></button>
      <div className="game-footnote"><span>Wait for the green screen</span><span>Best: {best === null ? 'Not set' : `${best}ms`}</span></div>
    </div>
  )
}
