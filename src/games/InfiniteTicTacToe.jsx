import { useEffect, useRef, useState } from 'react'
import { Minus, Plus, RotateCcw } from 'lucide-react'
import GameButton from './GameButton.jsx'

const CELL_SIZE = 54
const DIRECTIONS = [[1, 0], [0, 1], [1, 1], [1, -1]]

const cellKey = (x, y) => `${x},${y}`

function findWinningLine(cells, x, y, mark) {
  for (const [dx, dy] of DIRECTIONS) {
    const line = [[x, y]]
    for (const sign of [-1, 1]) {
      let step = 1
      while (cells[cellKey(x + dx * step * sign, y + dy * step * sign)] === mark) {
        line.push([x + dx * step * sign, y + dy * step * sign])
        step += 1
      }
    }
    if (line.length >= 3) return line
  }
  return null
}

export default function InfiniteTicTacToe({ onComplete }) {
  const canvasRef = useRef(null)
  const gestureRef = useRef({ pointers: new Map(), start: null, moved: false, pinchDistance: 0 })
  const cameraRef = useRef({ x: 0, y: 0, zoom: 1 })
  const [cells, setCells] = useState({})
  const [turn, setTurn] = useState('X')
  const [winner, setWinner] = useState(null)
  const [camera, setCamera] = useState(cameraRef.current)
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 360 })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return undefined
    const observer = new ResizeObserver(([entry]) => {
      setCanvasSize({ width: entry.contentRect.width, height: entry.contentRect.height })
    })
    observer.observe(canvas)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ratio = window.devicePixelRatio || 1
    canvas.width = Math.max(1, Math.round(canvasSize.width * ratio))
    canvas.height = Math.max(1, Math.round(canvasSize.height * ratio))
    const context = canvas.getContext('2d')
    context.setTransform(ratio, 0, 0, ratio, 0, 0)
    context.clearRect(0, 0, canvasSize.width, canvasSize.height)
    context.fillStyle = '#0c111c'
    context.fillRect(0, 0, canvasSize.width, canvasSize.height)
    const spacing = CELL_SIZE * camera.zoom
    const originX = canvasSize.width / 2 + camera.x
    const originY = canvasSize.height / 2 + camera.y
    const startX = Math.floor((-originX) / spacing) - 1
    const endX = Math.ceil((canvasSize.width - originX) / spacing) + 1
    const startY = Math.floor((-originY) / spacing) - 1
    const endY = Math.ceil((canvasSize.height - originY) / spacing) + 1

    context.beginPath()
    context.strokeStyle = 'rgba(144, 178, 204, .13)'
    context.lineWidth = 1
    for (let x = startX; x <= endX; x += 1) {
      const position = originX + (x + 0.5) * spacing
      context.moveTo(position, 0)
      context.lineTo(position, canvasSize.height)
    }
    for (let y = startY; y <= endY; y += 1) {
      const position = originY + (y + 0.5) * spacing
      context.moveTo(0, position)
      context.lineTo(canvasSize.width, position)
    }
    context.stroke()

    const winningKeys = new Set((winner?.line || []).map(([x, y]) => cellKey(x, y)))
    for (const [key, mark] of Object.entries(cells)) {
      const [x, y] = key.split(',').map(Number)
      const px = originX + x * spacing
      const py = originY + y * spacing
      if (px < -spacing || px > canvasSize.width + spacing || py < -spacing || py > canvasSize.height + spacing) continue
      const size = Math.max(12, spacing * 0.32)
      context.lineWidth = Math.max(2.5, camera.zoom * 3)
      context.lineCap = 'round'
      context.strokeStyle = winningKeys.has(key) ? '#ffd178' : mark === 'X' ? '#54d7c2' : '#ff7d9d'
      context.shadowColor = context.strokeStyle
      context.shadowBlur = winningKeys.has(key) ? 18 : 10
      context.beginPath()
      if (mark === 'X') {
        context.moveTo(px - size, py - size)
        context.lineTo(px + size, py + size)
        context.moveTo(px + size, py - size)
        context.lineTo(px - size, py + size)
      } else {
        context.arc(px, py, size, 0, Math.PI * 2)
      }
      context.stroke()
      context.shadowBlur = 0
    }
  }, [camera, canvasSize, cells, winner])

  const setView = (nextCamera) => {
    cameraRef.current = nextCamera
    setCamera(nextCamera)
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return undefined
    const handleWheel = (event) => {
      event.preventDefault()
      const factor = event.deltaY < 0 ? 1.08 : 0.92
      setView({ ...cameraRef.current, zoom: Math.min(1.8, Math.max(0.55, cameraRef.current.zoom * factor)) })
    }
    canvas.addEventListener('wheel', handleWheel, { passive: false })
    return () => canvas.removeEventListener('wheel', handleWheel)
  }, [])

  const placeMark = (event) => {
    if (winner) return
    const rect = event.currentTarget.getBoundingClientRect()
    const spacing = CELL_SIZE * cameraRef.current.zoom
    const x = Math.round((event.clientX - rect.left - rect.width / 2 - cameraRef.current.x) / spacing)
    const y = Math.round((event.clientY - rect.top - rect.height / 2 - cameraRef.current.y) / spacing)
    const key = cellKey(x, y)
    if (cells[key]) return
    const nextCells = { ...cells, [key]: turn }
    const line = findWinningLine(nextCells, x, y, turn)
    setCells(nextCells)
    if (line) {
      setWinner({ mark: turn, line })
      if (turn === 'X') onComplete?.(100, { winner: turn })
    } else setTurn(turn === 'X' ? 'O' : 'X')
  }

  const handlePointerDown = (event) => {
    event.currentTarget.setPointerCapture(event.pointerId)
    const gesture = gestureRef.current
    gesture.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY })
    if (gesture.pointers.size === 1) {
      gesture.start = { x: event.clientX, y: event.clientY, camera: cameraRef.current }
      gesture.moved = false
    } else if (gesture.pointers.size === 2) {
      const [first, second] = [...gesture.pointers.values()]
      gesture.pinchDistance = Math.hypot(first.x - second.x, first.y - second.y)
      gesture.start = null
    }
  }

  const handlePointerMove = (event) => {
    const gesture = gestureRef.current
    if (!gesture.pointers.has(event.pointerId)) return
    gesture.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY })
    if (gesture.pointers.size > 1) {
      const [first, second] = [...gesture.pointers.values()]
      const distance = Math.hypot(first.x - second.x, first.y - second.y)
      if (gesture.pinchDistance > 0) setView({ ...cameraRef.current, zoom: Math.min(1.8, Math.max(0.55, cameraRef.current.zoom * distance / gesture.pinchDistance)) })
      gesture.pinchDistance = distance
      gesture.moved = true
    } else if (gesture.start) {
      const dx = event.clientX - gesture.start.x
      const dy = event.clientY - gesture.start.y
      if (Math.hypot(dx, dy) > 7) gesture.moved = true
      if (gesture.moved) setView({ ...gesture.start.camera, x: gesture.start.camera.x + dx, y: gesture.start.camera.y + dy })
    }
  }

  const handlePointerUp = (event) => {
    const gesture = gestureRef.current
    const shouldPlace = gesture.pointers.size === 1 && !gesture.moved && gesture.start
    gesture.pointers.delete(event.pointerId)
    if (shouldPlace) placeMark(event)
    gesture.start = null
    gesture.pinchDistance = 0
    if (!gesture.pointers.size) gesture.moved = false
  }

  const restart = () => { setCells({}); setTurn('X'); setWinner(null); setView({ x: 0, y: 0, zoom: 1 }) }
  const zoomBy = (factor) => setView({ ...cameraRef.current, zoom: Math.min(1.8, Math.max(0.55, cameraRef.current.zoom * factor)) })

  return (
    <div className="mini-game infinite-ttt-game">
      <div className="game-hud"><div><span className="hud-label">LOCAL MATCH</span><strong>{winner ? `${winner.mark} WINS` : `${turn}'S TURN`}</strong></div><div className="ttt-score-note"><span className="hud-label">BOARD</span><strong>INFINITE</strong></div><GameButton className="restart-small" onClick={restart} aria-label="Restart game"><RotateCcw size={15} /></GameButton></div>
      <div className="infinite-board-wrap">
        <canvas ref={canvasRef} className="infinite-board" aria-label="Infinite Tic-Tac-Toe board" role="application" onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} onPointerCancel={handlePointerUp} />
        <div className="board-zoom-controls"><button onClick={() => zoomBy(0.85)} aria-label="Zoom out"><Minus size={14} /></button><button onClick={() => zoomBy(1.18)} aria-label="Zoom in"><Plus size={14} /></button></div>
        {winner && <div className="board-win-banner">{winner.mark} connects three</div>}
      </div>
      <div className="game-footnote"><span>Tap an empty cell to mark</span><span>Drag to pan · Pinch or scroll to zoom</span></div>
    </div>
  )
}