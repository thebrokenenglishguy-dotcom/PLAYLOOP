import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { ArrowDown, ArrowLeft, ArrowUp, Heart, Maximize, Minimize, Share2, Star } from 'lucide-react'

const gameModules = {
  'tap-rush': lazy(() => import('../games/TapRush.jsx')),
  'memory-match': lazy(() => import('../games/MemoryMatch.jsx')),
  'reaction-test': lazy(() => import('../games/ReactionTest.jsx')),
  'number-guess': lazy(() => import('../games/NumberGuess.jsx')),
  'color-rush': lazy(() => import('../games/ColorRush.jsx')),
  'infinite-tic-tac-toe': lazy(() => import('../games/InfiniteTicTacToe.jsx')),
  '2048': lazy(() => import('../games/TwentyFortyEight.jsx')),
  pong: lazy(() => import('../games/Pong.jsx')),
  'node-wars': lazy(() => import('../games/NodeWars.jsx')),
}

export default function GameFeed({ games, selectedId, profile, onExit, onActive, onFavorite, onLike, onShare, onComplete }) {
  const [activeId, setActiveId] = useState(selectedId || games[0]?.id)
  const [fullscreenGameId, setFullscreenGameId] = useState('')
  const [fullscreenError, setFullscreenError] = useState('')
  const itemRefs = useRef(new Map())
  const scrollRef = useRef(null)
  const activeTrackedRef = useRef(new Set())
  const onActiveRef = useRef(onActive)
  const onCompleteRef = useRef(onComplete)
  onActiveRef.current = onActive
  onCompleteRef.current = onComplete

  useEffect(() => {
    const handleFullscreenChange = () => {
      const fullscreenId = document.fullscreenElement?.dataset.gameId || ''
      setFullscreenGameId(fullscreenId)
      if (fullscreenId) setActiveId(fullscreenId)
      setFullscreenError('')
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  useEffect(() => {
    if (selectedId) {
      setActiveId(selectedId)
      const container = scrollRef.current
      const element = itemRefs.current.get(selectedId)
      if (container && element) {
        const top = element.getBoundingClientRect().top - container.getBoundingClientRect().top + container.scrollTop
        container.scrollTo({ top, behavior: 'smooth' })
      }
    }
  }, [selectedId])

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (document.fullscreenElement) return
      const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
      if (visible) setActiveId(visible.target.dataset.gameId)
    }, { root: scrollRef.current, threshold: [0.35, 0.65] })
    itemRefs.current.forEach((element) => element && observer.observe(element))
    return () => observer.disconnect()
  }, [games])

  useEffect(() => {
    const active = games.find((game) => game.id === activeId)
    if (active && !activeTrackedRef.current.has(active.id)) {
      activeTrackedRef.current.add(active.id)
      onActiveRef.current?.(active.id)
    }
  }, [activeId, games])

  const scrollToIndex = (index) => {
    const target = games[(index + games.length) % games.length]
    const container = scrollRef.current
    const element = target && itemRefs.current.get(target.id)
    if (!container || !element) return
    const top = element.getBoundingClientRect().top - container.getBoundingClientRect().top + container.scrollTop
    container.scrollTo({ top, behavior: 'smooth' })
  }

  const toggleFullscreen = async (id) => {
    const slide = itemRefs.current.get(id)
    if (!slide) return

    setActiveId(id)
    setFullscreenError('')
    try {
      if (document.fullscreenElement === slide) {
        await document.exitFullscreen()
      } else {
        await slide.requestFullscreen()
      }
    } catch (error) {
      console.error('Could not change game fullscreen mode:', error)
      setFullscreenError('Fullscreen could not be started. Check your browser permissions and try again.')
    }
  }

  if (!games.length) return <div className="empty-state"><h3>No games to play</h3></div>

  return (
    <main className="feed-page">
      <button className="feed-back" onClick={onExit}><ArrowLeft size={17} /> Back to discover</button>
      <div className="feed-scroll" aria-label="Scrollable game feed" ref={scrollRef}>
        {games.map((game, index) => {
          const isActive = game.id === activeId
          const Game = gameModules[game.id]
          const favorite = profile.favorites.includes(game.id)
          const liked = profile.liked.includes(game.id)
          const isFullscreen = fullscreenGameId === game.id
          const handleComplete = (score, details) => {
            onCompleteRef.current?.(game, score, details)
          }
          return (
            <section className="feed-slide" key={game.id} data-game-id={game.id} ref={(element) => itemRefs.current.set(game.id, element)}>
              <div className="feed-game-column">
                <div className="feed-game-top">
                  <span className="feed-kicker"><span className="live-pulse" /> NOW PLAYING <b>{String(index + 1).padStart(2, '0')} / {String(games.length).padStart(2, '0')}</b></span>
                  <div className="feed-game-header-actions">
                    <span className={`feed-category category-${game.color}`}>{game.category}</span>
                    <button className="feed-fullscreen-button" onClick={() => toggleFullscreen(game.id)} aria-label={`${isFullscreen ? 'Exit fullscreen for' : 'Enter fullscreen for'} ${game.title}`} title={isFullscreen ? 'Exit fullscreen' : 'Play fullscreen'}>
                      {isFullscreen ? <Minimize size={15} /> : <Maximize size={15} />}
                      <span>{isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}</span>
                    </button>
                  </div>
                </div>
                {fullscreenError && isActive && <p className="feed-fullscreen-error" role="alert">{fullscreenError}</p>}
                <div className="feed-playground">
                  {isActive ? <Suspense fallback={<div className="game-loading"><span className="loading-spinner" /> Loading game...</div>}><Game key={game.id} onComplete={handleComplete} /></Suspense> : <div className={`feed-inactive art-${game.color}`}><span>{game.emoji}</span><p>Scroll to jump in</p></div>}
                </div>
                <div className="feed-game-copy"><div><h2>{game.title}</h2><p>{game.description}</p></div><div className="controls-hint"><span>HOW TO PLAY</span><strong>{game.instructions || 'Tap or click to play'}</strong></div></div>
                <div className="feed-game-footer"><span><span className="online-dot" /> {game.players} players playing</span><button onClick={() => onShare(game)}><Share2 size={15} /> Share</button></div>
              </div>
              <div className="feed-side-actions">
                <button className={`feed-action ${liked ? 'active' : ''}`} onClick={() => onLike(game.id)} aria-label="Like game"><span><Heart size={19} fill={liked ? 'currentColor' : 'none'} /></span><small>{liked ? 'Liked' : 'Like'}</small></button>
                <button className={`feed-action ${favorite ? 'active' : ''}`} onClick={() => onFavorite(game.id)} aria-label="Favorite game"><span><Star size={19} fill={favorite ? 'currentColor' : 'none'} /></span><small>{favorite ? 'Saved' : 'Save'}</small></button>
                <button className="feed-action" onClick={() => onShare(game)} aria-label="Share game"><span><Share2 size={19} /></span><small>Share</small></button>
                <div className="feed-nav-actions"><button onClick={() => scrollToIndex(index - 1)} aria-label="Previous game"><ArrowUp size={18} /></button><button onClick={() => scrollToIndex(index + 1)} aria-label="Next game"><ArrowDown size={18} /></button></div>
              </div>
            </section>
          )
        })}
      </div>
    </main>
  )
}
