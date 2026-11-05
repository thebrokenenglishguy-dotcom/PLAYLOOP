export const OWNER_COLORS = ['#52d9c4', '#ff718f', '#dfb65d']
export const OWNER_NAMES = ['YOU', 'AI', 'NEUTRAL']
export const MAX_DESTINATIONS = 3
const MAX_GARRISON = 110

const layout = [
  { x: 0.12, y: 0.27, owner: 0, soldiers: 24, production: 4.4, defense: 5 },
  { x: 0.14, y: 0.72, owner: 0, soldiers: 22, production: 3.5, defense: 6 },
  { x: 0.35, y: 0.17, owner: 2, soldiers: 14, production: 5.2, defense: 3 },
  { x: 0.40, y: 0.50, owner: 2, soldiers: 20, production: 2.8, defense: 9 },
  { x: 0.35, y: 0.83, owner: 2, soldiers: 13, production: 4.8, defense: 4 },
  { x: 0.65, y: 0.17, owner: 1, soldiers: 22, production: 4.3, defense: 5 },
  { x: 0.86, y: 0.28, owner: 1, soldiers: 23, production: 3.7, defense: 6 },
  { x: 0.86, y: 0.72, owner: 1, soldiers: 21, production: 4.6, defense: 4 },
  { x: 0.65, y: 0.83, owner: 1, soldiers: 20, production: 3.2, defense: 7 },
]

export function createNodeWarsState(mode = 'ai') {
  return {
    mode,
    nodes: layout.map((node, id) => ({ ...node, id, level: 1, health: 100 })),
    orders: [],
    units: [],
    effects: [],
    nextUnitId: 1,
    aiTimer: 1.1,
    elapsed: 0,
    result: null,
    userCaptures: 0,
  }
}

function uniqueDestinations(state, owner, sourceId) {
  return new Set(state.orders.filter((order) => order.owner === owner && order.source === sourceId).map((order) => order.target))
}

export function issueOrder(state, sourceId, targetId, owner = 0) {
  if (sourceId === targetId) return false
  const source = state.nodes[sourceId]
  const target = state.nodes[targetId]
  if (!source || !target || source.owner !== owner) return false
  const destinations = uniqueDestinations(state, owner, sourceId)
  if (destinations.has(targetId)) return true
  if (destinations.size >= MAX_DESTINATIONS) return false
  state.orders.push({ owner, source: sourceId, target: targetId, timer: 0.25 })
  return true
}

export function removeOrder(state, sourceId, targetId) {
  state.orders = state.orders.filter((order) => order.source !== sourceId || order.target !== targetId)
}

export function upgradeNode(state, nodeId) {
  const node = state.nodes[nodeId]
  if (!node || node.owner !== 0) return false
  const cost = node.level * 18
  if (node.soldiers < cost) return false
  node.soldiers -= cost
  node.level += 1
  node.production = Math.min(12, node.production + 1.35)
  node.defense += 3
  node.health = Math.min(100, node.health + 20)
  return true
}

function launch(state, order) {
  const source = state.nodes[order.source]
  if (!source || source.owner !== order.owner) return
  const amount = Math.min(16, Math.floor((source.soldiers - 5) * 0.32))
  if (amount < 3) return
  source.soldiers -= amount
  state.units.push({
    id: state.nextUnitId++,
    owner: order.owner,
    source: source.id,
    target: order.target,
    amount,
    progress: 0,
    x: source.x,
    y: source.y,
  })
}

function resolveArrival(state, unit) {
  const target = state.nodes[unit.target]
  if (!target) return
  if (target.owner === unit.owner) {
    target.soldiers = Math.min(MAX_GARRISON, target.soldiers + unit.amount)
    return
  }
  const defenders = target.soldiers + target.defense
  if (unit.amount >= defenders) {
    const previousOwner = target.owner
    target.owner = unit.owner
    target.soldiers = Math.min(MAX_GARRISON, Math.max(2, unit.amount - defenders + 2))
    target.health = 100
    state.effects.push({ x: target.x, y: target.y, color: OWNER_COLORS[unit.owner], age: 0 })
    if (unit.owner === 0 && previousOwner !== 0) state.userCaptures += 1
  } else target.soldiers = defenders - unit.amount - target.defense
}

function chooseAiTarget(state, source) {
  return state.nodes
    .filter((node) => node.owner !== 1 && !state.orders.some((order) => order.owner === 1 && order.source === source.id && order.target === node.id))
    .map((node) => ({ node, value: node.soldiers + node.defense + Math.hypot(node.x - source.x, node.y - source.y) * 11 }))
    .sort((a, b) => a.value - b.value)[0]?.node
}

export function advanceNodeWars(state, delta) {
  const dt = Math.min(delta, 0.08)
  state.elapsed += dt
  state.nodes.forEach((node) => {
    if (node.owner !== 2) node.soldiers = Math.min(MAX_GARRISON, node.soldiers + node.production * dt)
  })
  state.orders = state.orders.filter((order) => state.nodes[order.source]?.owner === order.owner)
  state.orders.forEach((order) => {
    order.timer -= dt
    if (order.timer <= 0) {
      launch(state, order)
      order.timer += 1.05
    }
  })
  state.units = state.units.filter((unit) => {
    const target = state.nodes[unit.target]
    if (!target) return false
    const dx = target.x - unit.x
    const dy = target.y - unit.y
    const distance = Math.hypot(dx, dy) || 1
    unit.progress = Math.min(1, unit.progress + dt * 0.38 / distance)
    unit.x = state.nodes[unit.source].x + dx * unit.progress
    unit.y = state.nodes[unit.source].y + dy * unit.progress
    if (unit.progress >= 1) {
      resolveArrival(state, unit)
      return false
    }
    return true
  })
  state.effects = state.effects.filter((effect) => {
    effect.age += dt
    return effect.age < 1.1
  })

  if (state.mode === 'ai' && !state.result) {
    state.aiTimer -= dt
    if (state.aiTimer <= 0) {
      const source = state.nodes
        .filter((node) => node.owner === 1 && uniqueDestinations(state, 1, node.id).size < MAX_DESTINATIONS)
        .sort((a, b) => b.soldiers - a.soldiers)[0]
      if (source && source.soldiers > 17) {
        const target = chooseAiTarget(state, source)
        if (target) issueOrder(state, source.id, target.id, 1)
      }
      state.aiTimer = 1.3 + Math.random() * 0.9
    }
  }

  const playerNodes = state.nodes.filter((node) => node.owner === 0).length
  const aiNodes = state.nodes.filter((node) => node.owner === 1).length
  if (aiNodes === 0) state.result = 'win'
  else if (playerNodes === 0) state.result = 'loss'
  return state
}