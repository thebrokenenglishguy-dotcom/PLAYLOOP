import { Trophy } from 'lucide-react'

const demoPlayers = [
  { name: 'pixel.panda', avatar: '🐼', score: 2480 },
  { name: 'neon.nova', avatar: '👾', score: 1960 },
  { name: 'tiny.tiger', avatar: '🐯', score: 1535 },
]

export default function Leaderboard({ profile }) {
  const players = [...demoPlayers, { name: profile.username, avatar: profile.avatar, score: profile.totalScore, you: true }]
    .sort((a, b) => b.score - a.score)
  return (
    <div className="leaderboard-card">
      <div className="block-heading"><h3><Trophy size={16} /> Arcade leaderboard</h3><span className="demo-label">DEMO + YOU</span></div>
      {players.map((player, index) => <div className={`leader-row ${player.you ? 'you' : ''}`} key={player.name}><span className={`leader-rank ${index < 3 ? `rank-${index + 1}` : ''}`}>{String(index + 1).padStart(2, '0')}</span><span className="leader-avatar">{player.avatar}</span><span className="leader-name">{player.name}{player.you && <small>YOU</small>}</span><strong>{player.score.toLocaleString()} <small>PTS</small></strong></div>)}
      <p className="demo-disclaimer">Demo players are fictional. Online scores need a backend.</p>
    </div>
  )
}
