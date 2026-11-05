import { ArrowUpRight, Heart, Play, Sparkles } from 'lucide-react'

export default function GameCard({ game, profile, onPlay, onFavorite, compact = false }) {
  const favorite = profile.favorites.includes(game.id)
  return (
    <article className={`game-card ${compact ? 'game-card-compact' : ''}`}>
      <button className={`game-art art-${game.color}`} onClick={() => onPlay(game.id)} aria-label={`Play ${game.title}`}>
        <div className="art-glow" />
        <span className="art-orbit orbit-one" /><span className="art-orbit orbit-two" />
        <span className="art-emoji">{game.emoji}</span>
        <span className="art-tag"><Sparkles size={12} /> {game.category}</span>
        <span className="art-play"><Play size={16} fill="currentColor" /></span>
      </button>
      <div className="game-card-info">
        <div className="game-card-copy">
          <h3>{game.title}</h3>
          <p>{game.shortDescription}</p>
        </div>
        <button className={`icon-button favorite-button ${favorite ? 'is-favorite' : ''}`} onClick={() => onFavorite(game.id)} aria-label={favorite ? 'Remove from favorites' : 'Add to favorites'}>
          <Heart size={17} fill={favorite ? 'currentColor' : 'none'} />
        </button>
      </div>
      <div className="game-card-meta"><span><span className="online-dot" /> {game.players} playing</span><button onClick={() => onPlay(game.id)}>Play now <ArrowUpRight size={14} /></button></div>
    </article>
  )
}
