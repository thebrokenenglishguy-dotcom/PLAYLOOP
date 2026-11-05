import { useCallback, useEffect, useRef, useState } from 'react'
import { RotateCcw } from 'lucide-react'
import { loadProfile } from '../utils/storage.js'
import GameButton from './GameButton.jsx'

const SIZE = 4
const BEST_KEY = 'playloop-best-2048'

function addTile(board) {
  const empty = []
  board.forEach((value, index) => { if (!value) empty.push(index) })
  if (!empty.length) return board
  const index = empty[Math.floor(Math.random() * empty.length)]
  const next = [...board]
  next[index] = Math.random() < 0.9 ? 2 : 4
  return next
}

function newBoard() {
  return addTile(addTile(Array(SIZE * SIZE).fill(0)))
}

function mergeLine(line) {
  const values = line.filter(Boolean)
  const result = []
  let gained = 0
  for (let index = 0; index < values.length; index += 1) {
    if (values[index] === values[index + 1]) {
      const merged = values[index] * 2
      result.push(merged)
      gained += merged
      index += 1
    } else result.push(values[index])
  }
  while (result.length < SIZE) result.push(0)
  return { line: result, gained }
}

function moveBoard(board, direction) {
  const next = [...board]
  let gained = 0
  for (let index = 0; index < SIZE; index += 1) {
    const positions = Array.from({ length: SIZE }, (_, offset) => direction === 'left' || direction === 'right'
      ? index * SIZE + (direction === 'left' ? offset : SIZE - 1 - offset)
      : (direction === 'up' ? offset : SIZE - 1 - offset) * SIZE + index)
    const { line, gained: lineScore } = mergeLine(positions.map((position) => board[position]))
    positions.forEach((position, offset) => { next[position] = line[offset] })
    gained += lineScore
  }
  return { board: next, gained, changed: next.some((value, index) => value !== board[index]) }
}

function isGameOver(board) {
  if (board.includes(0)) return false
  return !['left', 'right', 'up', 'down'].some((direction) => moveBoard(board, direction).changed)
}

export default function TwentyFortyEight({ onComplete }) {
  const [board, setBoard] = useState(newBoard)
  const [score, setScore] = useState(0)
  const [best, setBest] = useState(() => {
    try { return Math.max(Number(localStorage.getItem(BEST_KEY)) || 0, loadProfile().bestScores['2048'] || 0) } catch { return 0 }
  })
  const [gameOver, setGameOver] = useState(false)
  const [won, setWon] = useState(false)
  const [keepPlaying, setKeepPlaying] = useState(false)
  const gestureRef = useRef(null)
  const completedRef = useRef(false)
  const boardRef = useRef(board)
  const scoreRef = useRef(score)
  const overRef = useRef(gameOver)
  const onCompleteRef = useRef(onComplete)
  boardRef.current = board
  scoreRef.current = score
  overRef.current = gameOver
  onCompleteRef.current = onComplete

  const move = useCallback((direction) => {
    if (overRef.current) return
    const result = moveBoard(boardRef.current, direction)
    if (!result.changed) return
    const next = addTile(result.board)
    const nextScore = scoreRef.current + result.gained
    boardRef.current = next
    scoreRef.current = nextScore
    setBoard(next)
    setScore(nextScore)
    setBest((current) => {
      const nextBest = Math.max(current, nextScore)
      try { localStorage.setItem(BEST_KEY, String(nextBest)) } catch {}
      return nextBest
    })
    if (!won && next.includes(2048)) setWon(true)
    if (isGameOver(next)) {
      overRef.current = true
      setGameOver(true)
      if (!completedRef.current) {
        completedRef.current = true
        onCompleteRef.current?.(nextScore, { lowerIsBetter: false })
      }
    }
  }, [won])

  useEffect(() => {
    const directions = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down' }
    const handleKeyDown = (event) => {
      const direction = directions[event.key]
      if (!direction) return
      event.preventDefault()
      move(direction)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [move])

  const restart = () => {
    const next = newBoard()
    boardRef.current = next
    scoreRef.current = 0
    overRef.current = false
    completedRef.current = false
    setBoard(next)
    setScore(0)
    setGameOver(false)
    setWon(false)
    setKeepPlaying(false)
  }

  const handlePointerDown = (event) => {
    gestureRef.current = { x: event.clientX, y: event.clientY }
  }
  const handlePointerUp = (event) => {
    if (!gestureRef.current) return
    const dx = event.clientX - gestureRef.current.x
    const dy = event.clientY - gestureRef.current.y
    gestureRef.current = null
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 28) return
    move(Math.abs(dx) > Math.abs(dy) ? dx > 0 ? 'right' : 'left' : dy > 0 ? 'down' : 'up')
  }

  return (
    <div className="mini-game twenty48-game">
      <div className="game-hud"><div><span className="hud-label">SCORE</span><strong>{score}</strong></div><div><span className="hud-label">BEST</span><strong>{best}</strong></div><GameButton className="restart-small" onClick={restart} aria-label="Restart game"><RotateCcw size={15} /></GameButton></div>
      <div className="twenty48-board" role="grid" aria-label="2048 board" onPointerDown={handlePointerDown} onPointerUp={handlePointerUp} onPointerCancel={() => { gestureRef.current = null }}>
        {board.map((value, index) => <div key={index} role="gridcell" aria-label={value ? String(value) : 'Empty'} className={`twenty48-tile ${value ? `tile-${Math.min(value, 2048)}` : ''}`}>{value || ''}</div>)}
        {(gameOver || won && !keepPlaying) && <div className="twenty48-overlay"><strong>{gameOver ? 'No moves left' : '2048 reached!'}</strong><span>{gameOver ? `Final score ${score}` : 'Keep going or start a new board.'}</span>{won && !keepPlaying && !gameOver && <GameButton onClick={() => setKeepPlaying(true)}>Keep playing</GameButton>}{gameOver && <GameButton onClick={restart}><RotateCcw size={14} /> Try again</GameButton>}</div>}
      </div>
      <div className="game-footnote"><span>Arrow keys or swipe to move</span><span>Join matching tiles to reach 2048</span></div>
    </div>
  )
}