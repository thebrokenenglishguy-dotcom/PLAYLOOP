import { useEffect, useRef, useState } from 'react'
import Phaser from 'phaser'
import { RotateCcw, Zap } from 'lucide-react'
import { loadProfile } from '../utils/storage.js'
import GameButton from './GameButton.jsx'

const ROUND_SECONDS = 15

export default function TapRush({ onComplete }) {
  const mountRef = useRef(null)
  const gameRef = useRef(null)
  const onCompleteRef = useRef(onComplete)
  const [status, setStatus] = useState('ready')
  const [score, setScore] = useState(0)
  const [seconds, setSeconds] = useState(ROUND_SECONDS)
  const [best, setBest] = useState(() => loadProfile().bestScores['tap-rush'] || 0)

  useEffect(() => { onCompleteRef.current = onComplete }, [onComplete])

  useEffect(() => {
    const game = new Phaser.Game({
      type: Phaser.CANVAS,
      width: 520,
      height: 330,
      parent: mountRef.current,
      backgroundColor: '#11131f',
      scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
      render: { antialias: true },
      scene: {
        create() {
          this.score = 0
          this.roundActive = false
          this.paintBackground = () => {
            this.cameras.main.setBackgroundColor('#11131f')
            const grid = this.add.graphics()
            grid.lineStyle(1, 0x24263a, 0.55)
            for (let x = 0; x <= 520; x += 32) grid.lineBetween(x, 0, x, 330)
            for (let y = 0; y <= 330; y += 32) grid.lineBetween(0, y, 520, y)
          }
          this.paintBackground()
          this.spawnTarget = () => {
            if (!this.roundActive) return
            const x = Phaser.Math.Between(42, 478)
            const y = Phaser.Math.Between(42, 288)
            const radius = Phaser.Math.Between(21, 29)
            const ring = this.add.circle(x, y, radius + 9, 0x9b7bff, 0.15)
            const target = this.add.circle(x, y, radius, 0x8c65ff).setInteractive({ useHandCursor: true })
            target.setStrokeStyle(3, 0xd7c9ff, 0.85)
            target.on('pointerdown', () => {
              if (!this.roundActive) return
              this.score += 1
              setScore(this.score)
              ring.destroy()
              target.destroy()
              this.spawnTarget()
            })
            this.tweens.add({ targets: [target, ring], scale: 0.82, duration: 700, yoyo: true, repeat: -1 })
            this.activeTarget = target
            this.activeRing = ring
          }
          this.events.on('start-round', () => {
            this.children.removeAll()
            this.paintBackground()
            this.score = 0
            let remaining = ROUND_SECONDS
            this.roundActive = true
            setScore(0)
            setSeconds(ROUND_SECONDS)
            setStatus('playing')
            this.spawnTarget()
            this.roundTimer = this.time.addEvent({
              delay: 1000,
              repeat: ROUND_SECONDS - 1,
              callback: () => {
                remaining -= 1
                setSeconds(remaining)
                if (remaining === 0) {
                  this.roundActive = false
                  this.time.removeEvent(this.roundTimer)
                  setStatus('done')
                  setBest((current) => Math.max(current, this.score))
                  onCompleteRef.current?.(this.score)
                }
              },
            })
          })
          this.events.on('pause-round', () => {
            this.roundActive = false
            this.time.removeAllEvents()
          })
          this.events.on('shutdown', () => this.time.removeAllEvents())
        },
      },
    })
    gameRef.current = game
    return () => {
      game.destroy(true)
      gameRef.current = null
    }
  }, [])

  const start = () => gameRef.current?.scene.scenes[0]?.events.emit('start-round')
  const remaining = seconds / ROUND_SECONDS * 100

  return (
    <div className="mini-game tap-rush-game">
      <div className="game-hud"><div><span className="hud-label">SCORE</span><strong>{score.toString().padStart(2, '0')}</strong></div><div className="timer-wrap"><span className="hud-label">{status === 'ready' ? 'BEST' : 'TIME LEFT'}</span><strong>{status === 'ready' ? best.toString().padStart(2, '0') : `${seconds}s`}</strong></div><div><span className="hud-label">BEST</span><strong>{Math.max(best, score).toString().padStart(2, '0')}</strong></div></div>
      <div className="game-progress"><span style={{ width: `${status === 'ready' ? 100 : remaining}%` }} /></div>
      <div className="phaser-wrap">
        <div ref={mountRef} className={`phaser-mount ${status === 'ready' ? 'phaser-muted' : ''}`} />
        {status !== 'playing' && <div className="game-overlay"><div className="overlay-icon">{status === 'done' ? '🏁' : '⚡'}</div><h3>{status === 'done' ? 'Nice run!' : 'Ready, set, tap!'}</h3><p>{status === 'done' ? `You hit ${score} targets. Can you beat it?` : 'Hit every target you can in 15 seconds.'}</p><GameButton onClick={start}><RotateCcw size={15} /> {status === 'done' ? 'Play again' : 'Start game'}</GameButton></div>}
      </div>
      <div className="game-footnote"><span><Zap size={13} /> Tap the glowing targets</span><span>15 seconds · Phaser powered</span></div>
    </div>
  )
}
