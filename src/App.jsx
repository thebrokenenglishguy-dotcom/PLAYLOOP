import { useCallback, useEffect, useMemo, useState } from 'react'
import { ArrowRight, ArrowUpRight, Compass, Flame, Gamepad2, Sparkles, Trophy, Zap } from 'lucide-react'
import Sidebar from './components/Sidebar.jsx'
import TopBar from './components/TopBar.jsx'
import GameCard from './components/GameCard.jsx'
import Arcade from './components/Arcade.jsx'
import GameFeed from './components/GameFeed.jsx'
import ProfileModal from './components/ProfileModal.jsx'
import Leaderboard from './components/Leaderboard.jsx'
import { games } from './data/games.js'
import { getLevel, loadProfile, saveProfile } from './utils/storage.js'

function todayKey() {
  const date = new Date()
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function HomePage({ profile, filteredGames, search, onPlay, onFavorite, setPage, setCategory }) {
  const featured = games[0]
  const popular = [games[2], games[1], games[4]]
  const newest = games.slice(5)
  const recent = profile.recent.map((id) => games.find((game) => game.id === id)).filter(Boolean)
  const challengeCount = profile.challengeDate === todayKey() ? profile.completedChallenges.length : 0

  return (
    <div className="discover-page page-section">
      <div className="home-welcome">
        <div><span className="eyebrow"><span className="eyebrow-line" /> YOUR DAILY DOSE OF PLAY</span><h1>Hey, {profile.username.split(' ')[0]} <span className="wave">✦</span></h1><p>Ready to make a little time for fun?</p></div>
        <button className="streak-pill" onClick={() => document.getElementById('daily-challenge')?.scrollIntoView({ behavior: 'smooth', block: 'center' })}><Flame size={16} fill="currentColor" /> {profile.streak} day streak <ArrowUpRight size={14} /></button>
      </div>
      <div className="discover-layout">
        <div className="discover-main">
          <section className="featured-banner">
            <div className="featured-content"><span className="featured-label"><span className="live-pulse" /> GAME OF THE DAY</span><h2>One more round.<br /><span className="gradient-text">You know you want to.</span></h2><p>{featured.description}</p><div className="featured-actions"><button className="button-primary" onClick={() => onPlay(featured.id)}><Gamepad2 size={17} /> Play {featured.title}<ArrowRight size={16} /></button><span><span className="online-dot" /> {featured.players} playing now</span></div></div>
            <div className="featured-art"><div className="featured-ring ring-outer" /><div className="featured-ring ring-mid" /><div className="featured-ring ring-inner" /><span className="featured-bolt">ϟ</span><span className="featured-spark spark-one">✦</span><span className="featured-spark spark-two">✧</span><span className="featured-sticker">15<br /><small>SEC</small></span></div>
            <div className="banner-footnote"><span><Sparkles size={14} /> Instant play. Zero downloads.</span><span>01 — 05</span></div>
          </section>
          {search.trim() ? <section className="home-section search-results-section"><div className="section-heading"><div><span className="eyebrow">SEARCH RESULTS</span><h2>{filteredGames.length ? `Games matching “${search.trim()}”` : 'No games found'}</h2></div><button className="view-all" onClick={() => setPage('arcade')}>Open arcade <ArrowRight size={15} /></button></div>{filteredGames.length ? <div className="game-grid home-game-grid">{filteredGames.map((game) => <GameCard key={game.id} game={game} profile={profile} onPlay={onPlay} onFavorite={onFavorite} />)}</div> : <div className="empty-state"><p>Try searching for arcade, puzzle, color, or reaction.</p></div>}</section> : <section className="home-section">
            <div className="section-heading"><div><span className="eyebrow">CAN'T STOP, WON'T STOP</span><h2>Trending now <span className="heading-spark">↗</span></h2></div><button className="view-all" onClick={() => setPage('arcade')}>View all <ArrowRight size={15} /></button></div>
            <div className="game-grid home-game-grid">{popular.map((game) => <GameCard key={game.id} game={game} profile={profile} onPlay={onPlay} onFavorite={onFavorite} />)}</div>
          </section>}
          {!search.trim() && <section className="home-section"><div className="section-heading"><div><span className="eyebrow">FRESH OFF THE LOOP</span><h2>Recently added</h2></div><button className="view-all" onClick={() => { setCategory('All games'); setPage('arcade') }}>Explore all <ArrowRight size={15} /></button></div><div className="game-grid home-game-grid recently-added-grid">{newest.map((game) => <GameCard key={game.id} game={game} profile={profile} onPlay={onPlay} onFavorite={onFavorite} />)}</div></section>}
          {recent.length > 0 && <section className="home-section recent-section"><div className="section-heading"><div><span className="eyebrow">PICK UP WHERE YOU LEFT OFF</span><h2>Recently played</h2></div><button className="view-all" onClick={() => setPage('arcade')}>Your arcade <ArrowRight size={15} /></button></div><div className="recent-game-row">{recent.slice(0, 4).map((game) => <button key={game.id} className="recent-game" onClick={() => onPlay(game.id)}><span className={`recent-game-icon art-${game.color}`}>{game.emoji}</span><span><strong>{game.title}</strong><small>{game.category}</small></span><ArrowUpRight size={15} /></button>)}</div></section>}
          <section className="home-section category-section"><div className="section-heading"><div><span className="eyebrow">FIND YOUR VIBE</span><h2>Pick a mood</h2></div></div><div className="mood-grid">{[{ name: 'Arcade', emoji: '🕹️', note: 'Fast & focused', color: 'violet' }, { name: 'Puzzle', emoji: '🧩', note: 'Brain tingles', color: 'pink' }, { name: 'Quick play', emoji: '⚡', note: 'Got a minute?', color: 'blue' }].map((item) => <button key={item.name} className={`mood-card mood-${item.color}`} onClick={() => { setCategory(item.name); setPage('arcade') }}><span>{item.emoji}</span><strong>{item.name}</strong><small>{item.note}</small><ArrowUpRight size={15} /></button>)}</div></section>
        </div>
        <aside className="discover-rail">
          <div className="level-card"><div className="level-card-top"><span className="level-icon"><Zap size={17} fill="currentColor" /></span><span className="level-pill">LEVEL {getLevel(profile.xp)}</span></div><strong>{profile.xp} <small>XP</small></strong><div className="xp-track"><span style={{ width: `${(profile.xp % 250) / 250 * 100}%` }} /></div><div className="xp-caption"><span>{profile.xp % 250} / 250 to level up</span><span>✨</span></div></div>
          <div id="daily-challenge" className="daily-card"><div className="daily-heading"><span className="daily-icon">🎯</span><span className="daily-bonus">+50 XP</span></div><span className="eyebrow">DAILY CHALLENGE</span><h3>Try 3 games<br />today.</h3><div className="daily-progress"><span style={{ width: `${Math.min(challengeCount / 3, 1) * 100}%` }} /></div><div className="daily-caption"><span>{challengeCount} of 3 played</span><span>↻ 24h</span></div></div>
          <Leaderboard profile={profile} />
          <div className="quick-note"><div className="note-icon"><Sparkles size={15} /></div><p><strong>A little break goes a long way.</strong><br />Five tiny games. Infinite rematches.</p></div>
        </aside>
      </div>
    </div>
  )
}

export default function App() {
  const [profile, setProfile] = useState(loadProfile)
  const [initialGame] = useState(() => {
    const match = window.location.hash.match(/^#play\/([a-z0-9-]+)$/)
    return games.some((game) => game.id === match?.[1]) ? match[1] : ''
  })
  const [page, setPage] = useState(initialGame ? 'feed' : 'discover')
  const [search, setSearch] = useState('')
  const [profileOpen, setProfileOpen] = useState(false)
  const [selectedGame, setSelectedGame] = useState(initialGame)
  const [toast, setToast] = useState('')
  const [arcadeCategory, setArcadeCategory] = useState('All games')

  useEffect(() => { saveProfile(profile) }, [profile])
  useEffect(() => {
    const handler = (event) => {
      const input = event.target
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        document.querySelector('.searchbox input')?.focus()
      }
      if (input?.tagName !== 'INPUT' && event.key === 'Escape') setProfileOpen(false)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])
  useEffect(() => {
    const handleHistoryChange = () => {
      const match = window.location.hash.match(/^#play\/([a-z0-9-]+)$/)
      const id = games.find((game) => game.id === match?.[1])?.id || ''
      setSelectedGame(id)
      setPage(id ? 'feed' : 'discover')
    }
    window.addEventListener('popstate', handleHistoryChange)
    window.addEventListener('hashchange', handleHistoryChange)
    return () => {
      window.removeEventListener('popstate', handleHistoryChange)
      window.removeEventListener('hashchange', handleHistoryChange)
    }
  }, [])
  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(''), 2600)
    return () => window.clearTimeout(timer)
  }, [toast])

  const filteredGames = useMemo(() => {
    const query = search.trim().toLowerCase()
    return games.filter((game) => !query || `${game.title} ${game.category} ${game.description}`.toLowerCase().includes(query))
  }, [search])
  const launchGame = useCallback((id) => {
    setSelectedGame(id)
    setPage('feed')
    window.history.pushState(null, '', `#play/${id}`)
  }, [])
  const toggleFavorite = useCallback((id) => {
    setProfile((current) => ({ ...current, favorites: current.favorites.includes(id) ? current.favorites.filter((item) => item !== id) : [...current.favorites, id] }))
  }, [])
  const toggleLike = useCallback((id) => {
    setProfile((current) => ({ ...current, liked: current.liked.includes(id) ? current.liked.filter((item) => item !== id) : [...current.liked, id] }))
  }, [])
  const markActive = useCallback((id) => {
    setProfile((current) => {
      const date = todayKey()
      const last = current.lastPlayedDate
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      const yesterdayKey = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`
      const challengeBase = current.challengeDate === date ? current.completedChallenges : []
      const nextChallengeGames = challengeBase.includes(id) ? challengeBase : [...challengeBase, id]
      const challengeEarned = challengeBase.length < 3 && nextChallengeGames.length >= 3
      return {
        ...current,
        recent: [id, ...current.recent.filter((item) => item !== id)].slice(0, 8),
        totalPlayed: current.totalPlayed + 1,
        xp: current.xp + (challengeEarned ? 50 : 0),
        lastPlayedDate: date,
        streak: last === date ? current.streak : last === yesterdayKey ? current.streak + 1 : 1,
        challengeDate: date,
        completedChallenges: nextChallengeGames,
      }
    })
  }, [])
  const completeGame = useCallback((game, score, details) => {
    setProfile((current) => {
      const best = current.bestScores[game.id]
      return {
        ...current,
        totalScore: current.totalScore + score,
        xp: current.xp + Math.max(score, 10),
        bestScores: {
          ...current.bestScores,
          [game.id]: best === undefined
            ? score
            : details?.lowerIsBetter
              ? Math.min(best, score)
              : Math.max(best, score),
        },
      }
    })
    setToast(`+${Math.max(score, 10)} XP earned${score > 0 ? ` · ${game.title}` : ''}`)
  }, [])
  const shareGame = useCallback(async (game) => {
    const url = `${window.location.origin}${window.location.pathname}#play/${game.id}`
    try {
      if (navigator.share) await navigator.share({ title: `${game.title} — PLAYLOOP`, text: game.shortDescription, url })
      else if (navigator.clipboard?.writeText) { await navigator.clipboard.writeText(url); setToast('Game link copied to clipboard') }
      else { window.prompt('Copy this game link:', url); setToast('Share link ready') }
    } catch (error) {
      if (error.name !== 'AbortError') { console.error('Could not share game:', error); setToast('Could not share right now') }
    }
  }, [])
  const updateName = (username) => setProfile((current) => ({ ...current, username }))
  const updateAvatar = (avatar) => setProfile((current) => ({ ...current, avatar }))
  const handlePage = (nextPage) => { setPage(nextPage); if (nextPage === 'feed' && !selectedGame) setSelectedGame(games[0].id) }
  return (
    <div className="app-shell">
      {page !== 'feed' && <Sidebar page={page} setPage={handlePage} onProfile={() => setProfileOpen(true)} profile={profile} />}
      <div className={`app-main ${page === 'feed' ? 'feed-main' : ''}`}>
        {page !== 'feed' && <TopBar page={page} setPage={handlePage} search={search} setSearch={setSearch} onProfile={() => setProfileOpen(true)} profile={profile} />}
        {page === 'discover' && <HomePage profile={profile} filteredGames={filteredGames} search={search} onPlay={launchGame} onFavorite={toggleFavorite} setPage={handlePage} setCategory={setArcadeCategory} />}
        {page === 'arcade' && <Arcade games={games} profile={profile} onPlay={launchGame} onFavorite={toggleFavorite} search={search} initialCategory={arcadeCategory} />}
        {page === 'feed' && <GameFeed games={games} selectedId={selectedGame} profile={profile} onExit={() => { window.history.pushState(null, '', `${window.location.pathname}${window.location.search}`); setPage('discover') }} onActive={markActive} onFavorite={toggleFavorite} onLike={toggleLike} onShare={shareGame} onComplete={completeGame} />}
      </div>
      {page !== 'feed' && <nav className="mobile-bottom-nav" aria-label="Main navigation"><button className={page === 'discover' ? 'active' : ''} onClick={() => handlePage('discover')}><Compass size={18} /><span>Discover</span></button><button className={page === 'arcade' ? 'active' : ''} onClick={() => handlePage('arcade')}><Gamepad2 size={18} /><span>Arcade</span></button><button onClick={() => launchGame(games[0].id)}><Zap size={18} /><span>Quick play</span></button></nav>}
      {page === 'feed' && <div className="feed-profile-button"><button className="top-avatar" onClick={() => setProfileOpen(true)} aria-label="Open profile">{profile.avatar}</button><span>YOUR PLAYER</span></div>}
      {profileOpen && <ProfileModal profile={profile} games={games} onClose={() => setProfileOpen(false)} onUpdateName={updateName} onUpdateAvatar={updateAvatar} onPlay={(id) => { setProfileOpen(false); launchGame(id) }} />}
      {toast && <div className="toast-message"><span className="toast-spark">✦</span>{toast}</div>}
      <div className="app-build-mark"><Trophy size={12} /> YOUR PERSONAL ARCADE</div>
    </div>
  )
}
