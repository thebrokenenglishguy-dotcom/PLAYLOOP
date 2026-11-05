import { Gamepad2, Search, UserRound } from 'lucide-react'

export default function TopBar({ page, setPage, search, setSearch, onProfile, profile }) {
  return (
    <header className="topbar">
      <div className="mobile-brand"><span className="brand-mark"><span /></span>PLAY<span className="brand-accent">LOOP</span></div>
      <div className="top-tabs">
        <button className={page === 'discover' || page === 'feed' ? 'active' : ''} onClick={() => setPage('discover')}>Discover</button>
        <button className={page === 'arcade' ? 'active' : ''} onClick={() => setPage('arcade')}>Arcade</button>
      </div>
      <label className="searchbox">
        <Search size={17} />
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Find your next game..." aria-label="Search games" />
        <kbd>⌘ K</kbd>
      </label>
      <button className="top-play-button" onClick={() => setPage('feed')}><Gamepad2 size={17} /><span>Quick play</span></button>
      <button className="top-avatar" onClick={onProfile} aria-label={`Open ${profile.username}'s profile`}>{profile.avatar || <UserRound size={19} />}</button>
    </header>
  )
}
