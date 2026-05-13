import { Ball, Player, GAME_CONFIG, FIELD_CONFIG } from "./types";

const { width, height, playerRadius, ballRadius, goalWidth, goalHeight, friction, ballFriction, kickForce } = GAME_CONFIG;
const { padding } = FIELD_CONFIG;

// Field boundaries
const fieldLeft = padding;
const fieldRight = width - padding;
const fieldTop = padding;
const fieldBottom = height - padding;

// Goal positions
const goalTop = (height - goalHeight) / 2;
const goalBottom = (height + goalHeight) / 2;

export function updateBallPhysics(ball: Ball): Ball {
  let { x, y, vx, vy } = ball;
  
  // Apply velocity
  x += vx;
  y += vy;
  
  // Apply friction
  vx *= ballFriction;
  vy *= ballFriction;
  
  // Stop tiny movements
  if (Math.abs(vx) < 0.01) vx = 0;
  if (Math.abs(vy) < 0.01) vy = 0;
  
  // Wall collisions (excluding goal areas)
  // Left wall
  if (x - ballRadius < fieldLeft) {
    if (y < goalTop || y > goalBottom) {
      x = fieldLeft + ballRadius;
      vx = -vx * 0.8;
    }
  }
  
  // Right wall
  if (x + ballRadius > fieldRight) {
    if (y < goalTop || y > goalBottom) {
      x = fieldRight - ballRadius;
      vx = -vx * 0.8;
    }
  }
  
  // Top wall
  if (y - ballRadius < fieldTop) {
    y = fieldTop + ballRadius;
    vy = -vy * 0.8;
  }
  
  // Bottom wall
  if (y + ballRadius > fieldBottom) {
    y = fieldBottom - ballRadius;
    vy = -vy * 0.8;
  }
  
  // Goal post collisions
  const postRadius = 8;
  const posts = [
    { x: fieldLeft, y: goalTop },
    { x: fieldLeft, y: goalBottom },
    { x: fieldRight, y: goalTop },
    { x: fieldRight, y: goalBottom },
  ];
  
  for (const post of posts) {
    const dx = x - post.x;
    const dy = y - post.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const minDist = ballRadius + postRadius;
    
    if (dist < minDist && dist > 0) {
      const nx = dx / dist;
      const ny = dy / dist;
      x = post.x + nx * minDist;
      y = post.y + ny * minDist;
      
      const dot = vx * nx + vy * ny;
      vx = (vx - 2 * dot * nx) * 0.8;
      vy = (vy - 2 * dot * ny) * 0.8;
    }
  }
  
  return { x, y, vx, vy };
}

export function updatePlayerPhysics(player: Player): Player {
  let { x, y, vx, vy } = player;
  
  // Apply velocity
  x += vx;
  y += vy;
  
  // Apply friction
  vx *= friction;
  vy *= friction;
  
  // Stop tiny movements
  if (Math.abs(vx) < 0.01) vx = 0;
  if (Math.abs(vy) < 0.01) vy = 0;
  
  // Wall collisions
  if (x - playerRadius < fieldLeft) {
    x = fieldLeft + playerRadius;
    vx = 0;
  }
  if (x + playerRadius > fieldRight) {
    x = fieldRight - playerRadius;
    vx = 0;
  }
  if (y - playerRadius < fieldTop) {
    y = fieldTop + playerRadius;
    vy = 0;
  }
  if (y + playerRadius > fieldBottom) {
    y = fieldBottom - playerRadius;
    vy = 0;
  }
  
  return { ...player, x, y, vx, vy };
}

export function checkPlayerBallCollision(player: Player, ball: Ball): Ball | null {
  const dx = ball.x - player.x;
  const dy = ball.y - player.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const minDist = playerRadius + ballRadius;
  
  if (dist < minDist && dist > 0) {
    // Normalize collision vector
    const nx = dx / dist;
    const ny = dy / dist;
    
    // Separate ball from player
    const newX = player.x + nx * minDist;
    const newY = player.y + ny * minDist;
    
    // Calculate relative velocity
    const dvx = ball.vx - player.vx;
    const dvy = ball.vy - player.vy;
    const dvn = dvx * nx + dvy * ny;
    
    // Only collide if objects are approaching
    if (dvn < 0) {
      // Apply impulse based on kick state
      const impulse = player.isKicking ? kickForce : 0.8;
      const newVx = ball.vx - dvn * nx * impulse + player.vx * 0.5;
      const newVy = ball.vy - dvn * ny * impulse + player.vy * 0.5;
      
      return {
        x: newX,
        y: newY,
        vx: Math.max(-20, Math.min(20, newVx)),
        vy: Math.max(-20, Math.min(20, newVy)),
      };
    }
    
    // Still separate even if not approaching
    return {
      ...ball,
      x: newX,
      y: newY,
    };
  }
  
  return null;
}

export function checkPlayerCollision(p1: Player, p2: Player): [Player, Player] | null {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const minDist = playerRadius * 2;
  
  if (dist < minDist && dist > 0) {
    const nx = dx / dist;
    const ny = dy / dist;
    
    // Separate players
    const overlap = (minDist - dist) / 2;
    const newP1 = {
      ...p1,
      x: p1.x - nx * overlap,
      y: p1.y - ny * overlap,
    };
    const newP2 = {
      ...p2,
      x: p2.x + nx * overlap,
      y: p2.y + ny * overlap,
    };
    
    // Exchange velocities (elastic collision)
    const dvx = p1.vx - p2.vx;
    const dvy = p1.vy - p2.vy;
    const dvn = dvx * nx + dvy * ny;
    
    if (dvn > 0) {
      newP1.vx -= dvn * nx * 0.5;
      newP1.vy -= dvn * ny * 0.5;
      newP2.vx += dvn * nx * 0.5;
      newP2.vy += dvn * ny * 0.5;
    }
    
    return [newP1, newP2];
  }
  
  return null;
}

export function checkGoal(ball: Ball): "red" | "blue" | null {
  // Ball in left goal = blue scores
  if (ball.x - ballRadius < fieldLeft - goalWidth) {
    if (ball.y > goalTop && ball.y < goalBottom) {
      return "blue";
    }
  }
  
  // Ball in right goal = red scores
  if (ball.x + ballRadius > fieldRight + goalWidth) {
    if (ball.y > goalTop && ball.y < goalBottom) {
      return "red";
    }
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
  const offset = (index - 1) * 80;
  
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
