import { useEffect, useMemo, useState } from 'react'
import { ArrowDownWideNarrow, Search } from 'lucide-react'
import GameCard from './GameCard.jsx'
import { categories } from '../data/games.js'

export default function Arcade({ games, profile, onPlay, onFavorite, search, initialCategory = 'All games' }) {
  const [category, setCategory] = useState(initialCategory)
  const [sort, setSort] = useState('Trending')
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    const matches = games.filter((game) =>
      (category === 'All games' || game.category === category) &&
      (!query || `${game.title} ${game.category} ${game.description}`.toLowerCase().includes(query)),
    )
    return sort === 'Newest' ? [...matches].reverse() : matches
  }, [games, category, sort, search])

  useEffect(() => setCategory(initialCategory), [initialCategory])

  return (
    <section className="page-section arcade-page">
      <div className="page-heading">
        <div><span className="eyebrow"><span className="eyebrow-line" /> THE ARCADE</span><h1>Pick your next <span className="gradient-text">obsession.</span></h1><p>Big fun, zero downloads. What are you in the mood for?</p></div>
        <div className="sort-control"><ArrowDownWideNarrow size={16} /><select value={sort} onChange={(event) => setSort(event.target.value)} aria-label="Sort games"><option>Trending</option><option>Newest</option></select></div>
      </div>
      <div className="filter-row">
        {categories.map((item) => <button key={item} className={`filter-chip ${category === item ? 'chosen' : ''}`} onClick={() => setCategory(item)}>{item}</button>)}
        <span className="result-count">{filtered.length} GAMES</span>
      </div>
      {filtered.length ? <div className="game-grid">{filtered.map((game) => <GameCard key={game.id} game={game} profile={profile} onPlay={onPlay} onFavorite={onFavorite} />)}</div> : <div className="empty-state"><Search size={25} /><h3>No games found</h3><p>Try a different title or category.</p></div>}
    </section>
  )
}
