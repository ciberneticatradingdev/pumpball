import { Ball, Player, GAME_CONFIG, FIELD_CONFIG, PHYSICS } from "./types";

const { width, height, goalWidth, goalHeight } = GAME_CONFIG;
const { padding } = FIELD_CONFIG;

// Field boundaries
const fieldLeft = padding;
const fieldRight = width - padding;
const fieldTop = padding;
const fieldBottom = height - padding;

// Goal positions (centered vertically)
const goalTop = (height - goalHeight) / 2;
const goalBottom = (height + goalHeight) / 2;

/**
 * HaxBall-style physics engine
 * 
 * Key concepts from HaxBall:
 * - Speed is in units per tick (60 ticks/second)
 * - Damping multiplies velocity each tick (< 1 slows down)
 * - bCoef determines how much velocity is preserved on bounce
 * - Collision uses impulse-based resolution with mass consideration
 */

// Apply damping (velocity reduction per tick)
function applyDamping(velocity: number, damping: number): number {
  return velocity * damping;
}

// Resolve collision between two circular objects
function resolveCircleCollision(
  x1: number, y1: number, vx1: number, vy1: number, radius1: number, invMass1: number, bCoef1: number,
  x2: number, y2: number, vx2: number, vy2: number, radius2: number, invMass2: number, bCoef2: number
): { x1: number; y1: number; vx1: number; vy1: number; x2: number; y2: number; vx2: number; vy2: number } | null {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const minDist = radius1 + radius2;
  
  if (dist >= minDist || dist === 0) return null;
  
  // Normalize collision normal
  const nx = dx / dist;
  const ny = dy / dist;
  
  // Separate objects (push apart equally based on inverse mass)
  const overlap = minDist - dist;
  const totalInvMass = invMass1 + invMass2;
  const sep1 = overlap * (invMass1 / totalInvMass);
  const sep2 = overlap * (invMass2 / totalInvMass);
  
  const newX1 = x1 - nx * sep1;
  const newY1 = y1 - ny * sep1;
  const newX2 = x2 + nx * sep2;
  const newY2 = y2 + ny * sep2;
  
  // Calculate relative velocity along collision normal
  const dvx = vx1 - vx2;
  const dvy = vy1 - vy2;
  const dvn = dvx * nx + dvy * ny;
  
  // Only resolve if objects are approaching
  if (dvn <= 0) {
    return { x1: newX1, y1: newY1, vx1, vy1, x2: newX2, y2: newY2, vx2, vy2 };
  }
  
  // Combined bounce coefficient
  const bCoef = bCoef1 * bCoef2;
  
  // Impulse scalar (HaxBall formula)
  const impulse = dvn * (1 + bCoef) / totalInvMass;
  
  // Apply impulse
  const newVx1 = vx1 - impulse * invMass1 * nx;
  const newVy1 = vy1 - impulse * invMass1 * ny;
  const newVx2 = vx2 + impulse * invMass2 * nx;
  const newVy2 = vy2 + impulse * invMass2 * ny;
  
  return {
    x1: newX1, y1: newY1, vx1: newVx1, vy1: newVy1,
    x2: newX2, y2: newY2, vx2: newVx2, vy2: newVy2
  };
}

// Resolve collision with a static wall segment
function resolveWallCollision(
  x: number, y: number, vx: number, vy: number, radius: number, bCoef: number,
  wallX1: number, wallY1: number, wallX2: number, wallY2: number, wallBCoef: number
): { x: number; y: number; vx: number; vy: number } | null {
  // Wall vector
  const wx = wallX2 - wallX1;
  const wy = wallY2 - wallY1;
  const wallLen = Math.sqrt(wx * wx + wy * wy);
  if (wallLen === 0) return null;
  
  // Normalized wall direction
  const wdx = wx / wallLen;
  const wdy = wy / wallLen;
  
  // Wall normal (perpendicular)
  const wnx = -wdy;
  const wny = wdx;
  
  // Vector from wall start to circle center
  const dx = x - wallX1;
  const dy = y - wallY1;
  
  // Project onto wall
  const proj = dx * wdx + dy * wdy;
  
  // Clamp to wall segment
  const clampedProj = Math.max(0, Math.min(wallLen, proj));
  
  // Closest point on wall
  const closestX = wallX1 + wdx * clampedProj;
  const closestY = wallY1 + wdy * clampedProj;
  
  // Distance to closest point
  const distX = x - closestX;
  const distY = y - closestY;
  const dist = Math.sqrt(distX * distX + distY * distY);
  
  if (dist >= radius || dist === 0) return null;
  
  // Normal from wall to circle
  const nx = distX / dist;
  const ny = distY / dist;
  
  // Push out
  const overlap = radius - dist;
  const newX = x + nx * overlap;
  const newY = y + ny * overlap;
  
  // Reflect velocity
  const vn = vx * nx + vy * ny;
  
  if (vn >= 0) {
    return { x: newX, y: newY, vx, vy };
  }
  
  const combinedBCoef = bCoef * wallBCoef;
  const newVx = vx - (1 + combinedBCoef) * vn * nx;
  const newVy = vy - (1 + combinedBCoef) * vn * ny;
  
  return { x: newX, y: newY, vx: newVx, vy: newVy };
}

// Resolve collision with a static post (circle)
function resolvePostCollision(
  x: number, y: number, vx: number, vy: number, radius: number, bCoef: number,
  postX: number, postY: number, postRadius: number, postBCoef: number
): { x: number; y: number; vx: number; vy: number } | null {
  const dx = x - postX;
  const dy = y - postY;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const minDist = radius + postRadius;
  
  if (dist >= minDist || dist === 0) return null;
  
  const nx = dx / dist;
  const ny = dy / dist;
  
  // Push out
  const overlap = minDist - dist;
  const newX = x + nx * overlap;
  const newY = y + ny * overlap;
  
  // Reflect velocity
  const vn = vx * nx + vy * ny;
  
  if (vn >= 0) {
    return { x: newX, y: newY, vx, vy };
  }
  
  const combinedBCoef = bCoef * postBCoef;
  const newVx = vx - (1 + combinedBCoef) * vn * nx;
  const newVy = vy - (1 + combinedBCoef) * vn * ny;
  
  return { x: newX, y: newY, vx: newVx, vy: newVy };
}

export function updateBallPhysics(ball: Ball): Ball {
  let { x, y, vx, vy } = ball;
  const { radius, damping, bCoef } = PHYSICS.ball;
  
  // Apply velocity
  x += vx;
  y += vy;
  
  // Apply damping (HaxBall style - multiply each tick)
  vx = applyDamping(vx, damping);
  vy = applyDamping(vy, damping);
  
  // Top wall
  const topWall = resolveWallCollision(x, y, vx, vy, radius, bCoef, fieldLeft, fieldTop, fieldRight, fieldTop, PHYSICS.wall.bCoef);
  if (topWall) { x = topWall.x; y = topWall.y; vx = topWall.vx; vy = topWall.vy; }
  
  // Bottom wall
  const bottomWall = resolveWallCollision(x, y, vx, vy, radius, bCoef, fieldLeft, fieldBottom, fieldRight, fieldBottom, PHYSICS.wall.bCoef);
  if (bottomWall) { x = bottomWall.x; y = bottomWall.y; vx = bottomWall.vx; vy = bottomWall.vy; }
  
  // Left wall (excluding goal)
  if (y < goalTop || y > goalBottom) {
    const leftWall = resolveWallCollision(x, y, vx, vy, radius, bCoef, fieldLeft, fieldTop, fieldLeft, fieldBottom, PHYSICS.wall.bCoef);
    if (leftWall) { x = leftWall.x; y = leftWall.y; vx = leftWall.vx; vy = leftWall.vy; }
  }
  
  // Right wall (excluding goal)
  if (y < goalTop || y > goalBottom) {
    const rightWall = resolveWallCollision(x, y, vx, vy, radius, bCoef, fieldRight, fieldTop, fieldRight, fieldBottom, PHYSICS.wall.bCoef);
    if (rightWall) { x = rightWall.x; y = rightWall.y; vx = rightWall.vx; vy = rightWall.vy; }
  }
  
  // Goal posts
  const posts = [
    { x: fieldLeft, y: goalTop },
    { x: fieldLeft, y: goalBottom },
    { x: fieldRight, y: goalTop },
    { x: fieldRight, y: goalBottom },
  ];
  
  for (const post of posts) {
    const collision = resolvePostCollision(x, y, vx, vy, radius, bCoef, post.x, post.y, PHYSICS.post.radius, PHYSICS.post.bCoef);
    if (collision) { x = collision.x; y = collision.y; vx = collision.vx; vy = collision.vy; }
  }
  
  // Goal back walls
  // Left goal back
  if (x < fieldLeft && y >= goalTop && y <= goalBottom) {
    const backWall = resolveWallCollision(x, y, vx, vy, radius, bCoef, fieldLeft - goalWidth, goalTop, fieldLeft - goalWidth, goalBottom, PHYSICS.wall.bCoef);
    if (backWall) { x = backWall.x; y = backWall.y; vx = backWall.vx; vy = backWall.vy; }
    // Goal side walls
    const topSide = resolveWallCollision(x, y, vx, vy, radius, bCoef, fieldLeft - goalWidth, goalTop, fieldLeft, goalTop, PHYSICS.wall.bCoef);
    if (topSide) { x = topSide.x; y = topSide.y; vx = topSide.vx; vy = topSide.vy; }
    const bottomSide = resolveWallCollision(x, y, vx, vy, radius, bCoef, fieldLeft - goalWidth, goalBottom, fieldLeft, goalBottom, PHYSICS.wall.bCoef);
    if (bottomSide) { x = bottomSide.x; y = bottomSide.y; vx = bottomSide.vx; vy = bottomSide.vy; }
  }
  
  // Right goal back
  if (x > fieldRight && y >= goalTop && y <= goalBottom) {
    const backWall = resolveWallCollision(x, y, vx, vy, radius, bCoef, fieldRight + goalWidth, goalTop, fieldRight + goalWidth, goalBottom, PHYSICS.wall.bCoef);
    if (backWall) { x = backWall.x; y = backWall.y; vx = backWall.vx; vy = backWall.vy; }
    // Goal side walls
    const topSide = resolveWallCollision(x, y, vx, vy, radius, bCoef, fieldRight, goalTop, fieldRight + goalWidth, goalTop, PHYSICS.wall.bCoef);
    if (topSide) { x = topSide.x; y = topSide.y; vx = topSide.vx; vy = topSide.vy; }
    const bottomSide = resolveWallCollision(x, y, vx, vy, radius, bCoef, fieldRight, goalBottom, fieldRight + goalWidth, goalBottom, PHYSICS.wall.bCoef);
    if (bottomSide) { x = bottomSide.x; y = bottomSide.y; vx = bottomSide.vx; vy = bottomSide.vy; }
  }
  
  return { x, y, vx, vy };
}

export function updatePlayerPhysics(player: Player, input: { up: boolean; down: boolean; left: boolean; right: boolean }): Player {
  let { x, y, vx, vy, isKicking } = player;
  const { radius, damping, kickingDamping, acceleration, kickingAcceleration, bCoef } = PHYSICS.player;
  
  // Use kicking physics if holding kick
  const currentDamping = isKicking ? kickingDamping : damping;
  const currentAcceleration = isKicking ? kickingAcceleration : acceleration;
  
  // Apply input acceleration (HaxBall style)
  if (input.left) vx -= currentAcceleration;
  if (input.right) vx += currentAcceleration;
  if (input.up) vy -= currentAcceleration;
  if (input.down) vy += currentAcceleration;
  
  // Apply velocity
  x += vx;
  y += vy;
  
  // Apply damping
  vx = applyDamping(vx, currentDamping);
  vy = applyDamping(vy, currentDamping);
  
  // Wall collisions (players can't enter goals)
  // Left wall
  if (x - radius < fieldLeft) {
    x = fieldLeft + radius;
    vx = Math.abs(vx) * bCoef;
  }
  
  // Right wall
  if (x + radius > fieldRight) {
    x = fieldRight - radius;
    vx = -Math.abs(vx) * bCoef;
  }
  
  // Top wall
  if (y - radius < fieldTop) {
    y = fieldTop + radius;
    vy = Math.abs(vy) * bCoef;
  }
  
  // Bottom wall
  if (y + radius > fieldBottom) {
    y = fieldBottom - radius;
    vy = -Math.abs(vy) * bCoef;
  }
  
  return { ...player, x, y, vx, vy };
}

export function checkPlayerBallCollision(player: Player, ball: Ball): Ball | null {
  const { radius: playerRadius, invMass: playerInvMass, bCoef: playerBCoef, kickStrength } = PHYSICS.player;
  const { radius: ballRadius, invMass: ballInvMass, bCoef: ballBCoef } = PHYSICS.ball;
  
  const dx = ball.x - player.x;
  const dy = ball.y - player.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const minDist = playerRadius + ballRadius;
  
  if (dist >= minDist || dist === 0) return null;
  
  // Normalize collision direction
  const nx = dx / dist;
  const ny = dy / dist;
  
  // Separate ball from player - only move ball, not player (player is "heavier")
  const overlap = minDist - dist + 0.1;
  const newX = ball.x + nx * overlap;
  const newY = ball.y + ny * overlap;
  
  // If kicking, apply strong kick impulse
  if (player.isKicking) {
    // Kick in direction from player center to ball
    const kickImpulseX = nx * kickStrength;
    const kickImpulseY = ny * kickStrength;
    
    // Ball gets kick force + some of player's momentum
    const newVx = kickImpulseX + player.vx * 0.5;
    const newVy = kickImpulseY + player.vy * 0.5;
    
    return { x: newX, y: newY, vx: newVx, vy: newVy };
  }
  
  // Normal collision - HaxBall style dribbling
  // Ball moves with player when pushed, with proper physics
  
  // Calculate relative velocity (ball relative to player)
  const relVx = ball.vx - player.vx;
  const relVy = ball.vy - player.vy;
  const relVn = relVx * nx + relVy * ny; // velocity component along collision normal
  
  // If ball is moving away from player already, just separate
  if (relVn > 0) {
    return { x: newX, y: newY, vx: ball.vx, vy: ball.vy };
  }
  
  // Impulse-based collision (HaxBall authentic)
  // Player has more mass, so ball bounces off more
  const combinedBCoef = playerBCoef * ballBCoef;
  const totalInvMass = playerInvMass + ballInvMass;
  
  // Only ball receives impulse (player is controlled by input, doesn't get pushed)
  const impulse = -relVn * (1 + combinedBCoef) * ballInvMass / totalInvMass;
  
  // Apply impulse to ball - this makes ball move with player when dribbling
  const newVx = ball.vx + impulse * nx;
  const newVy = ball.vy + impulse * ny;
  
  return { x: newX, y: newY, vx: newVx, vy: newVy };
}

export function checkPlayerCollision(p1: Player, p2: Player): [Player, Player] | null {
  const { radius, invMass, bCoef } = PHYSICS.player;
  
  const collision = resolveCircleCollision(
    p1.x, p1.y, p1.vx, p1.vy, radius, invMass, bCoef,
    p2.x, p2.y, p2.vx, p2.vy, radius, invMass, bCoef
  );
  
  if (!collision) return null;
  
  return [
    { ...p1, x: collision.x1, y: collision.y1, vx: collision.vx1, vy: collision.vy1 },
    { ...p2, x: collision.x2, y: collision.y2, vx: collision.vx2, vy: collision.vy2 }
  ];
}

export function checkGoal(ball: Ball): "red" | "blue" | null {
  const { radius } = PHYSICS.ball;
  
  // Ball center crosses into goal area = goal scored
  // Left goal: blue team scores when ball enters left goal
  if (ball.x < fieldLeft && ball.y > goalTop + radius && ball.y < goalBottom - radius) {
    return "blue";
  }
  
  // Right goal: red team scores when ball enters right goal  
  if (ball.x > fieldRight && ball.y > goalTop + radius && ball.y < goalBottom - radius) {
    return "red";
  }
  
  return null;
}

export function getInitialBallPosition(): Ball {
  return {
    x: width / 2,
    y: height / 2,
    vx: 0,
    vy: 0,
  };
}

export function getPlayerSpawnPosition(team: "red" | "blue", index: number): { x: number; y: number } {
  const centerY = height / 2;
  const offset = (index % 3 - 1) * 50; // Spread players vertically
  
  if (team === "red") {
    return {
      x: width * 0.25,
      y: centerY + offset,
    };
  } else {
    return {
      x: width * 0.75,
      y: centerY + offset,
    };
  }
}
