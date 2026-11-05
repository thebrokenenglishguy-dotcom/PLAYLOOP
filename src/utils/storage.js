const STORAGE_KEY = 'playloop-player-v1'

export const createDefaultProfile = () => ({
  username: 'Player One',
  avatar: '🦊',
  totalPlayed: 0,
  totalScore: 0,
  xp: 0,
  bestScores: {},
  favorites: [],
  liked: [],
  recent: [],
  lastPlayedDate: '',
  lastCountedPlayDate: '',
  streak: 0,
  completedChallenges: [],
  challengeDate: '',
})

export function loadProfile() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (!saved) return createDefaultProfile()
    const parsed = JSON.parse(saved)
    return { ...createDefaultProfile(), ...parsed }
  } catch (error) {
    console.error('Could not load PLAYLOOP player data:', error)
    return createDefaultProfile()
  }
}

export function saveProfile(profile) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile))
    return true
  } catch (error) {
    console.error('Could not save PLAYLOOP player data:', error)
    return false
  }
}

export const getLevel = (xp) => Math.floor(xp / 250) + 1
export const getLevelProgress = (xp) => (xp % 250) / 250 * 100
