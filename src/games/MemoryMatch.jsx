import { useCallback, useEffect, useRef, useState } from 'react'
import { RotateCcw } from 'lucide-react'
import GameButton from './GameButton.jsx'

const symbols = ['🍉', '🍋', '🍓', '🍇', '🍒', '🥝']
const shuffle = () => {
  const deck = [...symbols, ...symbols]
  for (let index = deck.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1))
    ;[deck[index], deck[swapIndex]] = [deck[swapIndex], deck[index]]
  }
  return deck.map((emoji, index) => ({ id: `${emoji}-${index}-${Math.random()}`, emoji }))
}

export default function MemoryMatch({ onComplete }) {
  const onCompleteRef = useRef(onComplete)
  const completionReported = useRef(false)
  onCompleteRef.current = onComplete
  const [cards, setCards] = useState(shuffle)
  const [flipped, setFlipped] = useState([])
  const [matched, setMatched] = useState([])
  const [moves, setMoves] = useState(0)
  const [locked, setLocked] = useState(false)
  const finished = matched.length === cards.length && cards.length > 0

  useEffect(() => {
    if (finished && !completionReported.current) {
      completionReported.current = true
      onCompleteRef.current?.(Math.max(100 - moves * 5, 25), { moves })
    }
  }, [finished, moves])

  const flip = useCallback((index) => {
    if (locked || flipped.includes(index) || matched.includes(index) || finished) return
    const next = [...flipped, index]
    setFlipped(next)
    if (next.length === 2) {
      setMoves((count) => count + 1)
      setLocked(true)
      if (cards[next[0]].emoji === cards[next[1]].emoji) {
        window.setTimeout(() => {
          setMatched((current) => [...current, ...next])
          setFlipped([])
          setLocked(false)
        }, 420)
      } else {
        window.setTimeout(() => { setFlipped([]); setLocked(false) }, 760)
      }
    }
  }, [cards, flipped, finished, locked, matched])

  const restart = () => { completionReported.current = false; setCards(shuffle()); setFlipped([]); setMatched([]); setMoves(0); setLocked(false) }

  return (
    <div className="mini-game memory-game">
      <div className="game-hud"><div><span className="hud-label">MOVES</span><strong>{moves.toString().padStart(2, '0')}</strong></div><div className="memory-progress"><span className="hud-label">PAIRS FOUND</span><strong>{matched.length / 2} <small>/ 6</small></strong></div><GameButton className="restart-small" onClick={restart} aria-label="Restart game"><RotateCcw size={15} /></GameButton></div>
      <div className="memory-grid">{cards.map((card, index) => { const faceUp = flipped.includes(index) || matched.includes(index); return <button key={card.id} className={`memory-card ${faceUp ? 'face-up' : ''} ${matched.includes(index) ? 'matched' : ''}`} onClick={() => flip(index)} aria-label={faceUp ? card.emoji : 'Flip hidden card'} aria-pressed={faceUp}><span>{faceUp ? card.emoji : '✦'}</span></button> })}</div>
      {finished && <div className="game-result-inline"><span>🎉</span><strong>All matched in {moves} moves!</strong><button onClick={restart}>Play again</button></div>}
      <div className="game-footnote"><span>Flip two cards to find a pair</span><span>Fewer moves = more points</span></div>
    </div>
  )
}
