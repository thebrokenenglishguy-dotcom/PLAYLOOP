import { useState } from 'react'
import { ArrowRight, Award, Flame, Gamepad2, Pencil, Sparkles, X, Zap } from 'lucide-react'
import { getLevel, getLevelProgress } from '../utils/storage.js'

const avatars = ['🦊', '🐼', '🐸', '🐯', '🐙', '👾', '🦄', '🐲']

export default function ProfileModal({ profile, games, onClose, onUpdateName, onUpdateAvatar, onPlay }) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(profile.username)
  const level = getLevel(profile.xp)
  const date = new Date()
  const today = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  const challengeProgress = profile.challengeDate === today ? Math.min(new Set(profile.completedChallenges).size, 3) : 0
  const badges = [
    { label: 'First steps', icon: '🎮', earned: profile.totalPlayed > 0 },
    { label: 'On a roll', icon: '🔥', earned: profile.streak >= 3 },
    { label: 'Fan club', icon: '💜', earned: profile.favorites.length >= 3 },
    { label: 'High score', icon: '🏆', earned: Object.keys(profile.bestScores).length >= 3 },
  ]
  const favorites = games.filter((game) => profile.favorites.includes(game.id))
  const recents = profile.recent.map((id) => games.find((game) => game.id === id)).filter(Boolean)
  const bests = games.filter((game) => profile.bestScores[game.id] !== undefined)

  const saveName = (event) => {
    event.preventDefault()
    const trimmed = name.trim().slice(0, 20)
    if (trimmed) onUpdateName(trimmed)
    setEditing(false)
  }

  return (
    <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="profile-modal" role="dialog" aria-modal="true" aria-labelledby="profile-title">
        <button className="modal-close" onClick={onClose} aria-label="Close profile"><X size={19} /></button>
        <div className="profile-cover"><span className="cover-orb orb-a" /><span className="cover-orb orb-b" /><div className="profile-avatar-wrap"><span className="profile-avatar">{profile.avatar}</span><span className="level-chip"><Zap size={11} fill="currentColor" /> LVL {level}</span></div></div>
        <div className="profile-body">
          <div className="profile-title-row"><div><span className="eyebrow">YOUR PLAYER CARD</span>{editing ? <form className="edit-name-form" onSubmit={saveName}><input autoFocus value={name} onChange={(event) => setName(event.target.value)} maxLength={20} aria-label="Player name" /><button className="text-button">Save</button></form> : <h2 id="profile-title">{profile.username}<button className="edit-name-button" onClick={() => setEditing(true)} aria-label="Edit username"><Pencil size={14} /></button></h2>}<p>Making every minute more playful.</p></div><div className="xp-total"><strong>{profile.xp}</strong><small>TOTAL XP</small></div></div>
          <div className="avatar-picker"><span>CHOOSE YOUR AVATAR</span><div>{avatars.map((avatar) => <button key={avatar} className={profile.avatar === avatar ? 'selected' : ''} onClick={() => onUpdateAvatar(avatar)} aria-label={`Choose ${avatar} avatar`}>{avatar}</button>)}</div></div>
          <div className="level-progress"><div className="level-label"><span>LEVEL {level}</span><span>{profile.xp % 250} / 250 XP</span></div><div className="progress-track"><span style={{ width: `${getLevelProgress(profile.xp)}%` }} /></div></div>
          <div className="profile-stats"><div><Gamepad2 size={17} /><strong>{profile.totalPlayed}</strong><small>GAMES PLAYED</small></div><div><Sparkles size={17} /><strong>{profile.totalScore.toLocaleString()}</strong><small>TOTAL SCORE</small></div><div><Flame size={17} /><strong>{profile.streak} days</strong><small>PLAY STREAK</small></div></div>
          <div className="profile-block"><div className="block-heading"><h3><Award size={16} /> Achievements</h3><span>{badges.filter((badge) => badge.earned).length} / {badges.length}</span></div><div className="badge-row">{badges.map((badge) => <div key={badge.label} className={`badge ${badge.earned ? 'earned' : ''}`} title={badge.label}><span>{badge.icon}</span><small>{badge.label}</small></div>)}</div></div>
          <div className="profile-block"><div className="block-heading"><h3><Flame size={16} /> Daily challenge</h3><span className="challenge-tag">+50 XP</span></div><div className="challenge-card"><div className="challenge-icon">🎯</div><div><strong>Play 3 different games today</strong><small>{challengeProgress} of 3 games played · resets daily</small></div><div className="challenge-progress"><span style={{ width: `${challengeProgress / 3 * 100}%` }} /></div></div></div>
          <div className="profile-block"><div className="block-heading"><h3><Sparkles size={16} /> Personal bests</h3></div>{bests.length ? <div className="profile-game-list">{bests.map((game) => <div className="best-score-row" key={game.id}><span className={`list-game-icon art-${game.color}`}>{game.emoji}</span><span><strong>{game.title}</strong><small>{game.category}</small></span><b>{profile.bestScores[game.id]}{game.id === 'reaction-test' ? ' ms' : ' pts'}</b></div>)}</div> : <p className="profile-empty">Finish a game to set your first personal best.</p>}</div>
          <div className="profile-block"><div className="block-heading"><h3><Sparkles size={16} /> Your favorites</h3></div>{favorites.length ? <div className="profile-game-list">{favorites.map((game) => <button key={game.id} onClick={() => onPlay(game.id)}><span className={`list-game-icon art-${game.color}`}>{game.emoji}</span><span><strong>{game.title}</strong><small>{game.category}</small></span><ArrowRight size={15} /></button>)}</div> : <p className="profile-empty">Save games with the star icon to find them here.</p>}</div>
          {recents.length > 0 && <div className="profile-block"><div className="block-heading"><h3>Recently played</h3></div><div className="recent-pills">{recents.slice(0, 4).map((game) => <button key={game.id} onClick={() => onPlay(game.id)}>{game.emoji} {game.title}</button>)}</div></div>}
        </div>
      </section>
    </div>
  )
}
