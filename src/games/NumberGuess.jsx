import { useState } from 'react'
import { RotateCcw, Send } from 'lucide-react'
import GameButton from './GameButton.jsx'

const newNumber = () => Math.floor(Math.random() * 100) + 1

export default function NumberGuess({ onComplete }) {
  const [secret, setSecret] = useState(newNumber)
  const [guess, setGuess] = useState('')
  const [attempts, setAttempts] = useState(0)
  const [history, setHistory] = useState([])
  const [hint, setHint] = useState('Make your first guess to get started.')
  const [won, setWon] = useState(false)

  const submit = (event) => {
    event.preventDefault()
    const value = Number(guess)
    if (!Number.isInteger(value) || value < 1 || value > 100 || won) return
    const count = attempts + 1
    setAttempts(count)
    setHistory((items) => [{ value, result: value === secret ? 'correct' : value < secret ? 'low' : 'high' }, ...items].slice(0, 5))
    if (value === secret) {
      setHint(`You got it in ${count} ${count === 1 ? 'guess' : 'guesses'}!`)
      setWon(true)
      onComplete?.(Math.max(250 - (count - 1) * 25, 50), { attempts: count })
    } else setHint(value < secret ? 'Too low — go a little higher.' : 'Too high — bring it down.')
    setGuess('')
  }
  const restart = () => { setSecret(newNumber()); setGuess(''); setAttempts(0); setHistory([]); setHint('Make your first guess to get started.'); setWon(false) }

  return (
    <div className="mini-game number-game">
      <div className="game-hud"><div><span className="hud-label">ATTEMPTS</span><strong>{attempts.toString().padStart(2, '0')}</strong></div><div className="number-range"><span className="hud-label">SECRET NUMBER</span><strong>1 — 100</strong></div><GameButton className="restart-small" onClick={restart} aria-label="Restart game"><RotateCcw size={15} /></GameButton></div>
      <div className="number-center"><span className={`number-orb ${won ? 'won' : ''}`}>{won ? secret : '?'}</span><h3>{won ? 'Nailed it!' : 'What’s the number?'}</h3><p>{hint}</p></div>
      <form className="guess-form" onSubmit={submit}><input type="number" min="1" max="100" value={guess} onChange={(event) => setGuess(event.target.value)} placeholder="1 – 100" aria-label="Your number guess" disabled={won} required /><GameButton type="submit" disabled={won || !guess}><Send size={15} /> Guess</GameButton></form>
      <div className="guess-history">{history.length ? history.map((item, index) => <span key={`${item.value}-${index}`} className={`guess-pill ${item.result}`}>{item.value} {item.result === 'low' ? '↓' : item.result === 'high' ? '↑' : '✓'}</span>) : <span className="history-empty">Your guesses will appear here</span>}</div>
      {won && <button className="play-again-link" onClick={restart}>Play again</button>}
    </div>
  )
}
