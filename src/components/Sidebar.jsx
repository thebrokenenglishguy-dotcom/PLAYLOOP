import { Compass, Gamepad2, Heart, Trophy, UserRound } from 'lucide-react'

export default function Sidebar({ page, setPage, onProfile, profile }) {
  const links = [
    { id: 'discover', label: 'Discover', icon: Compass },
    { id: 'arcade', label: 'Arcade', icon: Gamepad2 },
  ]

  return (
    <aside className="sidebar">
      <button className="brand" onClick={() => setPage('discover')} aria-label="PLAYLOOP home">
        <span className="brand-mark"><span /></span>
        <span>PLAY<span className="brand-accent">LOOP</span></span>
      </button>
      <div className="side-label">MENU</div>
      <nav className="side-nav">
        {links.map(({ id, label, icon: Icon }) => (
          <button key={id} className={`side-link ${page === id ? 'selected' : ''}`} onClick={() => setPage(id)}>
            <Icon size={19} strokeWidth={2} /><span>{label}</span>
          </button>
        ))}
        <button className="side-link" onClick={onProfile}><Trophy size={19} /><span>Challenges</span><span className="nav-dot" /></button>
        <button className="side-link" onClick={onProfile}><Heart size={19} /><span>Favorites</span></button>
      </nav>
      <div className="sidebar-bottom">
        <button className="profile-mini" onClick={onProfile}>
          <span className="avatar">{profile.avatar}</span>
          <span className="profile-mini-copy"><strong>{profile.username}</strong><small>Level {Math.floor(profile.xp / 250) + 1} player</small></span>
          <UserRound size={16} className="profile-arrow" />
        </button>
        <div className="sidebar-footnote"><span className="online-dot" /> Your next favorite is one tap away.</div>
      </div>
    </aside>
  )
}
