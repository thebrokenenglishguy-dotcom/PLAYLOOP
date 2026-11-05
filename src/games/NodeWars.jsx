import { useEffect, useRef, useState } from 'react'
import { ArrowUpRight, Bot, BookOpen, RotateCcw, Shield, Swords, Trash2 } from 'lucide-react'
import GameButton from './GameButton.jsx'
import { advanceNodeWars, createNodeWarsState, issueOrder, MAX_DESTINATIONS, OWNER_COLORS, OWNER_NAMES, removeOrder, upgradeNode } from './nodeWarsSimulation.js'

const WIDTH = 850
const HEIGHT = 500
const NODE_RADIUS = 29

function nodeAtPoint(state, x, y) {
  return state.nodes.find((node) => Math.hypot(node.x * WIDTH - x, node.y * HEIGHT - y) < NODE_RADIUS + 14)
}

function drawState(canvas, context, state, drag) {
  const ratio = window.devicePixelRatio || 1
  const width = Math.max(1, Math.round(canvas.clientWidth * ratio))
  const height = Math.max(1, Math.round(canvas.clientHeight * ratio))
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width
    canvas.height = height
  }
  context.setTransform(width / WIDTH, 0, 0, height / HEIGHT, 0, 0)
  context.clearRect(0, 0, WIDTH, HEIGHT)
  context.fillStyle = '#09111a'
  context.fillRect(0, 0, WIDTH, HEIGHT)
  context.strokeStyle = 'rgba(125, 178, 191, .055)'
  context.lineWidth = 1
  for (let x = 25; x < WIDTH; x += 35) for (let y = 25; y < HEIGHT; y += 35) {
    context.beginPath()
    context.arc(x, y, 1, 0, Math.PI * 2)
    context.stroke()
  }

  state.orders.forEach((order) => {
    const source = state.nodes[order.source]
    const target = state.nodes[order.target]
    if (!source || !target) return
    const color = OWNER_COLORS[order.owner]
    context.beginPath()
    context.moveTo(source.x * WIDTH, source.y * HEIGHT)
    context.lineTo(target.x * WIDTH, target.y * HEIGHT)
    context.strokeStyle = `${color}66`
    context.lineWidth = order.owner === 0 ? 2 : 1.5
    context.setLineDash([6, 7])
    context.lineDashOffset = -state.elapsed * 16
    context.stroke()
    context.setLineDash([])
    const angle = Math.atan2(target.y - source.y, target.x - source.x)
    const ax = target.x * WIDTH - Math.cos(angle) * 47
    const ay = target.y * HEIGHT - Math.sin(angle) * 47
    context.fillStyle = color
    context.beginPath()
    context.moveTo(ax, ay)
    context.lineTo(ax - Math.cos(angle - 0.5) * 10, ay - Math.sin(angle - 0.5) * 10)
    context.lineTo(ax - Math.cos(angle + 0.5) * 10, ay - Math.sin(angle + 0.5) * 10)
    context.closePath()
    context.fill()
  })

  if (drag?.source !== null && drag?.point) {
    const source = state.nodes[drag.source]
    if (source) {
      context.beginPath()
      context.moveTo(source.x * WIDTH, source.y * HEIGHT)
      context.lineTo(drag.point.x, drag.point.y)
      context.strokeStyle = `${OWNER_COLORS[0]}bb`
      context.lineWidth = 2
      context.setLineDash([5, 6])
      context.stroke()
      context.setLineDash([])
    }
  }

  state.units.forEach((unit) => {
    const x = unit.x * WIDTH
    const y = unit.y * HEIGHT
    context.beginPath()
    context.arc(x, y, 10, 0, Math.PI * 2)
    context.fillStyle = '#101b26'
    context.fill()
    context.strokeStyle = OWNER_COLORS[unit.owner]
    context.lineWidth = 2
    context.shadowColor = OWNER_COLORS[unit.owner]
    context.shadowBlur = 12
    context.stroke()
    context.shadowBlur = 0
    context.fillStyle = '#fff'
    context.font = '700 9px DM Sans, sans-serif'
    context.textAlign = 'center'
    context.textBaseline = 'middle'
    context.fillText(String(unit.amount), x, y)
  })

  state.nodes.forEach((node) => {
    const x = node.x * WIDTH
    const y = node.y * HEIGHT
    const color = OWNER_COLORS[node.owner]
    const selected = node.id === drag?.selectedId
    const pulse = 1 + Math.sin(state.elapsed * 2.4 + node.id) * 0.035
    const radius = NODE_RADIUS * pulse
    const gradient = context.createRadialGradient(x, y, 3, x, y, radius + 16)
    gradient.addColorStop(0, `${color}44`)
    gradient.addColorStop(1, `${color}00`)
    context.fillStyle = gradient
    context.beginPath()
    context.arc(x, y, radius + 16, 0, Math.PI * 2)
    context.fill()
    context.beginPath()
    context.arc(x, y, radius, 0, Math.PI * 2)
    context.fillStyle = '#111c27'
    context.fill()
    context.strokeStyle = color
    context.lineWidth = selected ? 3 : 2
    context.shadowColor = color
    context.shadowBlur = selected ? 22 : 13
    context.stroke()
    context.shadowBlur = 0
    context.fillStyle = '#f2f6f7'
    context.font = '700 17px "Space Grotesk", sans-serif'
    context.textAlign = 'center'
    context.textBaseline = 'middle'
    context.fillText(String(Math.floor(node.soldiers)), x, y - 2)
    context.fillStyle = '#a4b1bd'
    context.font = '700 8px DM Sans, sans-serif'
    context.fillText(`LV ${node.level} · ${node.production.toFixed(1)}/s`, x, y + 15)
    context.beginPath()
    context.arc(x, y, radius + 5, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * node.health / 100)
    context.strokeStyle = `${color}9c`
    context.lineWidth = 2
    context.stroke()
  })

  state.effects.forEach((effect) => {
    const progress = effect.age / 1.1
    context.beginPath()
    context.arc(effect.x * WIDTH, effect.y * HEIGHT, 22 + progress * 56, 0, Math.PI * 2)
    context.strokeStyle = `${effect.color}${Math.max(0, Math.round((1 - progress) * 190)).toString(16).padStart(2, '0')}`
    context.lineWidth = 3 - progress * 2
    context.stroke()
  })
}

export default function NodeWars({ onComplete }) {
  const canvasRef = useRef(null)
  const stateRef = useRef(createNodeWarsState())
  const dragRef = useRef({ source: null, point: null, selectedId: null })
  const onCompleteRef = useRef(onComplete)
  const reportedResultRef = useRef(null)
  const [, render] = useState(0)
  const [mode, setMode] = useState('ai')
  const [selectedId, setSelectedId] = useState(null)
  const [notice, setNotice] = useState('Drag from one of your teal nodes to a destination.')
  const [snapshot, setSnapshot] = useState({ nodes: [], captures: 0, result: null })
  onCompleteRef.current = onComplete
  dragRef.current.selectedId = selectedId

  useEffect(() => {
    const canvas = canvasRef.current
    const context = canvas.getContext('2d')
    let active = true
    let lastTime = 0
    let lastUiTime = 0
    let frameId = 0
    const frame = (time) => {
      if (!active) return
      const state = stateRef.current
      const delta = lastTime ? (time - lastTime) / 1000 : 0
      lastTime = time
      if (!state.result) advanceNodeWars(state, delta)
      drawState(canvas, context, state, dragRef.current)
      if (time - lastUiTime > 200) {
        lastUiTime = time
        setSnapshot({ nodes: state.nodes, captures: state.userCaptures, result: state.result })
        if (state.result && reportedResultRef.current !== state.result) {
          reportedResultRef.current = state.result
          if (state.result === 'win') onCompleteRef.current?.(200, { winner: 'player' })
        }
        render((version) => version + 1)
      }
      frameId = requestAnimationFrame(frame)
    }
    frameId = requestAnimationFrame(frame)
    return () => { active = false; cancelAnimationFrame(frameId) }
  }, [])

  const restart = (nextMode = mode) => {
    stateRef.current = createNodeWarsState(nextMode)
    dragRef.current = { source: null, point: null, selectedId: null }
    reportedResultRef.current = null
    setSelectedId(null)
    setMode(nextMode)
    setNotice(nextMode === 'tutorial' ? 'Tutorial: send a small force to the neutral center node, then reinforce it.' : 'Drag from one of your teal nodes to a destination.')
    setSnapshot({ nodes: stateRef.current.nodes, captures: 0, result: null })
  }

  const getCanvasPoint = (event) => {
    const rect = event.currentTarget.getBoundingClientRect()
    return { x: (event.clientX - rect.left) / rect.width * WIDTH, y: (event.clientY - rect.top) / rect.height * HEIGHT }
  }

  const handlePointerDown = (event) => {
    const point = getCanvasPoint(event)
    const node = nodeAtPoint(stateRef.current, point.x, point.y)
    if (node?.owner === 0) {
      event.currentTarget.setPointerCapture(event.pointerId)
      dragRef.current = { source: node.id, point, selectedId: node.id }
      setSelectedId(node.id)
    } else dragRef.current.point = point
  }

  const handlePointerMove = (event) => {
    if (dragRef.current.source !== null) dragRef.current.point = getCanvasPoint(event)
  }

  const handlePointerUp = (event) => {
    const drag = dragRef.current
    if (drag.source === null) return
    const point = getCanvasPoint(event)
    const target = nodeAtPoint(stateRef.current, point.x, point.y)
    if (target && target.id !== drag.source) {
      const accepted = issueOrder(stateRef.current, drag.source, target.id, 0)
      setNotice(accepted ? `Route set: ${OWNER_NAMES[target.owner]} node ${target.id + 1}.` : `Limit reached: connect to at most ${MAX_DESTINATIONS} different targets.`)
    } else if (target?.id === drag.source) setNotice(`Node ${target.id + 1} selected. Drag it to a destination to send troops.`)
    dragRef.current = { source: null, point: null, selectedId: target?.owner === 0 ? target.id : selectedId }
  }

  const onUpgrade = () => {
    if (selectedId === null) return
    const node = stateRef.current.nodes[selectedId]
    const cost = node.level * 18
    if (upgradeNode(stateRef.current, selectedId)) setNotice(`Node ${selectedId + 1} upgraded. Production increased.`)
    else setNotice(`Upgrade needs ${cost} soldiers at the selected node.`)
    setSnapshot((current) => ({ ...current, nodes: [...stateRef.current.nodes] }))
  }

  const selectedNode = snapshot.nodes[selectedId]
  const routeList = stateRef.current.orders.filter((order) => order.owner === 0)
  const selectedRouteCount = selectedId === null ? 0 : routeList.filter((order) => order.source === selectedId).length
  const ownNodes = snapshot.nodes.filter((node) => node.owner === 0).length
  const enemyNodes = snapshot.nodes.filter((node) => node.owner === 1).length

  return (
    <div className="mini-game node-wars-game">
      <div className="game-hud"><div><span className="hud-label">YOUR NODES</span><strong>{ownNodes}</strong></div><div className="node-score-center"><span className="hud-label">CAPTURED</span><strong>{snapshot.captures}</strong></div><div><span className="hud-label">ENEMY NODES</span><strong>{enemyNodes}</strong></div><GameButton className="restart-small" onClick={() => restart()} aria-label="Restart game"><RotateCcw size={15} /></GameButton></div>
      <div className="node-mode-tabs" role="group" aria-label="Node Wars game mode"><button className={mode === 'tutorial' ? 'selected' : ''} onClick={() => restart('tutorial')}><BookOpen size={13} /> Tutorial</button><button className={mode === 'ai' ? 'selected' : ''} onClick={() => restart('ai')}><Bot size={13} /> Vs AI</button><button className={mode === 'practice' ? 'selected' : ''} onClick={() => restart('practice')}><Shield size={13} /> Practice</button><span><Swords size={13} /> 3 route limit</span></div>
      <div className="node-wars-stage"><canvas ref={canvasRef} className="node-wars-canvas" aria-label="Node Wars strategy map" onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} onPointerCancel={handlePointerUp} />{snapshot.result && <div className="node-result-overlay"><strong>{snapshot.result === 'win' ? 'SECTOR SECURED' : 'YOUR NETWORK FELL'}</strong><GameButton onClick={() => restart()}>Play again</GameButton></div>}<div className="node-legend"><span><i style={{ background: OWNER_COLORS[0] }} /> You</span><span><i style={{ background: OWNER_COLORS[1] }} /> {mode === 'practice' ? 'Practice' : 'AI'}</span><span><i style={{ background: OWNER_COLORS[2] }} /> Neutral</span></div></div>
      <div className="node-command-row"><span className="node-notice">{mode === 'tutorial' ? `TUTORIAL · ${notice}` : notice}</span><span className="node-route-count">ROUTES {selectedRouteCount} / {MAX_DESTINATIONS}</span></div>
      <div className="node-controls-row">{selectedNode?.owner === 0 ? <div className="node-upgrade-info"><span><strong>NODE {selectedNode.id + 1}</strong> · {selectedNode.soldiers.toFixed(0)} troops · {selectedNode.production.toFixed(1)} / sec · defence {selectedNode.defense}</span><GameButton onClick={onUpgrade}><ArrowUpRight size={14} /> Upgrade · {selectedNode.level * 18}</GameButton></div> : <span className="node-howto">Drag between your teal and any other node. Your routes send reinforcements automatically.</span>}{routeList.length > 0 && <div className="node-route-list">{routeList.map((order) =>       <button key={`${order.source}-${order.target}`} onClick={() => { removeOrder(stateRef.current, order.source, order.target); setNotice(`Route to node ${order.target + 1} removed.`) }} aria-label={`Remove route from node ${order.source + 1} to node ${order.target + 1}`}><span>{order.source + 1} → {order.target + 1}</span><Trash2 size={12} /></button>)}</div>}</div>
      <div className="game-footnote"><span>Nodes produce automatically · Routes send small waves</span><span>Capture every enemy node to win</span></div>
    </div>
  )
}