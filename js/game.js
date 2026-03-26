// game.js - Canvas game engine: physics, collision detection, rendering

// ─── roundRect polyfill (for older browsers / Safari < 15.4) ─────────────────
if (!CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
    if (typeof r === 'undefined') r = 0;
    if (Array.isArray(r)) r = r[0];
    if (w < 2 * r) r = w / 2;
    if (h < 2 * r) r = h / 2;
    this.beginPath();
    this.moveTo(x + r, y);
    this.arcTo(x + w, y,     x + w, y + h, r);
    this.arcTo(x + w, y + h, x,     y + h, r);
    this.arcTo(x,     y + h, x,     y,     r);
    this.arcTo(x,     y,     x + w, y,     r);
    this.closePath();
    return this;
  };
}

// ─── Canvas constants (landscape 16:9-ish) ────────────────────────────────────
const CANVAS_W     = 720;
const CANVAS_H     = 420;
const PLAYER_X     = 100;      // fixed screen X for player
const PLAYER_SIZE  = 38;
const GROUND_Y     = 340;      // Y of ground surface
const CEILING_Y    = 50;       // upper boundary
const SPIKE_W      = 36;
const SPIKE_H      = 36;
const BLOCK_W      = 42;
const BLOCK_H      = 42;
const BLOCK_TALL_H = 80;

// ─── Game state ──────────────────────────────────────────────────────────────
let canvas, ctx;
let animId   = null;
let lastTime = 0;

let gState = null; // active game state

function createGameState(level, character) {
  return {
    level,
    character,
    running:       false,
    paused:        false,
    dead:          false,
    complete:      false,
    deaths:        0,
    scrollX:       0,
    speed:         level.speed,
    frame:         0,
    deathTimer:    0,
    completeTimer: 0,
    flashTimer:    0,
    player: {
      x:              PLAYER_X,
      y:              GROUND_Y - PLAYER_SIZE,
      vy:             0,
      onGround:       true,
      jumpsLeft:      character.maxJumps || 1,
      gravityFlipped: false,
      isHolding:      false,
      rotation:       0,
    },
    particles: [],
    trail:     [],
    stars:     buildStarfield(),
  };
}

// ─── Initialise ──────────────────────────────────────────────────────────────
function initGame(canvasEl) {
  canvas = canvasEl;
  ctx    = canvas.getContext('2d');
  canvas.width  = CANVAS_W;
  canvas.height = CANVAS_H;

  // Initialise audio context (created here, resumed on first tap)
  Sound.init();

  // Input – unified handler that checks pause button first
  canvas.addEventListener('touchstart', onInputDown, { passive: false });
  canvas.addEventListener('touchend',   onInputUp,   { passive: false });
  canvas.addEventListener('mousedown',  onInputDown);
  canvas.addEventListener('mouseup',    onInputUp);
}

function startLevel(levelId, charId) {
  const level = getLevel(levelId);
  const char  = getCharacter(charId);
  if (!level || !char) return;

  gState = createGameState(level, char);
  gState.running = true;

  cancelAnimationFrame(animId);
  lastTime = 0;
  animId   = requestAnimationFrame(gameLoop);
}

function stopGame() {
  Sound.stopMusic();
  gState = null;
  cancelAnimationFrame(animId);
  animId = null;
}

// ─── Starfield ───────────────────────────────────────────────────────────────
function buildStarfield() {
  const stars = [];
  for (let i = 0; i < 80; i++) {
    stars.push({
      x:     Math.random() * CANVAS_W,
      y:     Math.random() * GROUND_Y,
      r:     0.5 + Math.random() * 2,
      alpha: 0.3 + Math.random() * 0.7,
      speed: 0.3 + Math.random() * 0.7,
    });
  }
  return stars;
}

// ─── Input handling ──────────────────────────────────────────────────────────
function onInputDown(e) {
  e.preventDefault();
  if (!gState || !gState.running) return;

  // Resume audio context on first interaction
  Sound.resume();

  // Detect touch/click position for HUD button checks
  const rect   = e.target.getBoundingClientRect();
  const scaleX = CANVAS_W / rect.width;
  const scaleY = CANVAS_H / rect.height;
  const src    = e.touches ? e.touches[0] : e;
  const cx     = (src.clientX - rect.left) * scaleX;
  const cy     = (src.clientY - rect.top)  * scaleY;

  // Pause button
  if (isPauseButtonHit(cx, cy)) {
    if (gState.paused) resumeGame();
    else pauseGame();
    return;
  }

  // Mute button
  if (isMuteButtonHit(cx, cy)) {
    const muted = Sound.toggleMute();
    if (!muted) Sound.startMusic(gState.level.id);
    return;
  }

  if (gState.paused)  { resumeGame(); return; }
  if (gState.dead || gState.complete) return;

  gState.player.isHolding = true;
  handleJump();
}

function onInputUp(e) {
  e.preventDefault();
  if (!gState) return;
  gState.player.isHolding = false;
}

function handleJump() {
  const p    = gState.player;
  const char = gState.character;

  if (char.id === 'ball') {
    p.gravityFlipped = !p.gravityFlipped;
    p.vy = p.gravityFlipped ? -4 : 4;
    Sound.jump();
    return;
  }

  if (char.id === 'ship') {
    // Thrust handled in physics; just play sound on first press
    Sound.jump();
    return;
  }

  if (p.jumpsLeft > 0) {
    const isDouble = p.jumpsLeft < char.maxJumps;
    p.vy = char.jumpVel;
    p.jumpsLeft--;
    p.onGround = false;
    if (isDouble) Sound.doubleJump();
    else          Sound.jump();
  }
}

function pauseGame()  { if (gState) { gState.paused = true;  Sound.stopMusic(); } }
function resumeGame() { if (gState) { gState.paused = false; Sound.startMusic(gState.level.id); } }

// ─── Game loop ───────────────────────────────────────────────────────────────
function gameLoop(timestamp) {
  if (!gState || !gState.running) return;

  const raw = lastTime ? (timestamp - lastTime) : 16.67;
  lastTime  = timestamp;
  const dt  = Math.min(raw / 16.67, 3);

  if (!gState.paused) update(dt);
  render();

  animId = requestAnimationFrame(gameLoop);
}

// ─── Update ──────────────────────────────────────────────────────────────────
function update(dt) {
  const gs   = gState;
  const p    = gs.player;
  const char = gs.character;

  if (gs.dead) {
    gs.deathTimer -= dt;
    updateParticles(gs.particles, dt);
    if (gs.deathTimer <= 0) respawn();
    return;
  }

  if (gs.complete) {
    gs.completeTimer -= dt;
    updateParticles(gs.particles, dt);
    if (gs.completeTimer <= 0) {
      gs.running = false;
      onLevelComplete(gs.level.id, gs.deaths);
    }
    return;
  }

  gs.frame++;
  gs.scrollX += gs.speed * dt;

  if (gs.scrollX >= gs.level.length) {
    triggerLevelComplete();
    return;
  }

  // Physics
  if      (char.id === 'ship') updateShipPhysics(p, char, dt);
  else if (char.id === 'ball') updateBallPhysics(p, char, dt);
  else                          updateDefaultPhysics(p, char, dt);

  // Rotation
  if (char.id !== 'ship' && char.id !== 'rocket') {
    const rotSpeed = (char.id === 'ball') ? 0.08 : 0.055;
    p.rotation += rotSpeed * gs.speed * dt;
  }

  // Trail
  gs.trail.push({ x: p.x + PLAYER_SIZE / 2, y: p.y + PLAYER_SIZE / 2, alpha: 0.6 });
  if (gs.trail.length > 14) gs.trail.shift();
  gs.trail.forEach(t => { t.alpha -= 0.04; });

  // Collision
  checkCollisions();

  updateParticles(gs.particles, dt);
}

// ─── Physics ─────────────────────────────────────────────────────────────────
function updateDefaultPhysics(p, char, dt) {
  p.vy += char.gravity * dt;
  p.vy  = Math.min(p.vy, char.maxFall);
  p.y  += p.vy * dt;

  // Ceiling clamp — prevents characters from flying off the top of the canvas
  if (p.y < CEILING_Y) {
    p.y  = CEILING_Y;
    if (p.vy < 0) p.vy = 0;
  }

  if (p.y + PLAYER_SIZE >= GROUND_Y) {
    p.y        = GROUND_Y - PLAYER_SIZE;
    p.vy       = 0;
    p.onGround = true;
    p.jumpsLeft = char.maxJumps;
  } else {
    p.onGround = false;
  }
}

function updateShipPhysics(p, char, dt) {
  if (p.isHolding) {
    p.vy -= 0.55 * dt;
    p.vy  = Math.max(p.vy, -9);
  } else {
    p.vy += char.gravity * dt;
    p.vy  = Math.min(p.vy, char.maxFall);
  }
  p.y += p.vy * dt;

  if (p.y < CEILING_Y) {
    p.y  = CEILING_Y;
    p.vy = Math.abs(p.vy) * 0.3;
    triggerDeath();
    return;
  }
  if (p.y + PLAYER_SIZE > GROUND_Y) {
    p.y  = GROUND_Y - PLAYER_SIZE;
    p.vy = -Math.abs(p.vy) * 0.3;
    triggerDeath();
    return;
  }
  p.onGround = false;
}

function updateBallPhysics(p, char, dt) {
  const gDir = p.gravityFlipped ? -1 : 1;
  p.vy += char.gravity * gDir * dt;
  p.vy  = Math.max(-char.maxFall, Math.min(p.vy, char.maxFall));
  p.y  += p.vy * dt;

  if (!p.gravityFlipped) {
    if (p.y + PLAYER_SIZE >= GROUND_Y) {
      p.y        = GROUND_Y - PLAYER_SIZE;
      p.vy       = 0;
      p.onGround = true;
    } else {
      p.onGround = false;
    }
  } else {
    if (p.y <= CEILING_Y) {
      p.y        = CEILING_Y;
      p.vy       = 0;
      p.onGround = true;
    } else {
      p.onGround = false;
    }
  }
}

// ─── Collision detection ──────────────────────────────────────────────────────
function getObstacleHitbox(obs, screenX) {
  switch (obs.t) {
    case 'sp':
      return { left: screenX + SPIKE_W * 0.22,
               right: screenX + SPIKE_W * 0.78,
               top: GROUND_Y - SPIKE_H * 0.88,
               bottom: GROUND_Y };
    case 'sp2':
      return { left: screenX + SPIKE_W * 0.22,
               right: screenX + SPIKE_W * 2 + 4 - SPIKE_W * 0.22,
               top: GROUND_Y - SPIKE_H * 0.88,
               bottom: GROUND_Y };
    case 'sp3':
      return { left: screenX + SPIKE_W * 0.22,
               right: screenX + SPIKE_W * 3 + 8 - SPIKE_W * 0.22,
               top: GROUND_Y - SPIKE_H * 0.88,
               bottom: GROUND_Y };
    case 'bl':
      return { left: screenX + 3, right: screenX + BLOCK_W - 3,
               top: GROUND_Y - BLOCK_H, bottom: GROUND_Y };
    case 'blt':
      return { left: screenX + 3, right: screenX + BLOCK_W - 3,
               top: GROUND_Y - BLOCK_TALL_H, bottom: GROUND_Y };
    case 'fbl':
      return { left: screenX + 3, right: screenX + BLOCK_W - 3,
               top: GROUND_Y - obs.h - BLOCK_H, bottom: GROUND_Y - obs.h };
    case 'csp':
      return { left: screenX + SPIKE_W * 0.22,
               right: screenX + SPIKE_W * 0.78,
               top: CEILING_Y,
               bottom: CEILING_Y + SPIKE_H * 0.88 };
    case 'csp2':
      return { left: screenX + SPIKE_W * 0.22,
               right: screenX + SPIKE_W * 2 + 4 - SPIKE_W * 0.22,
               top: CEILING_Y,
               bottom: CEILING_Y + SPIKE_H * 0.88 };
    case 'circ':
      return { left: screenX + 4,
               right: screenX + 40,
               top: GROUND_Y - obs.cy - 18,
               bottom: GROUND_Y - obs.cy + 18 };
    default: return null;
  }
}

function getPlayerHitbox(p) {
  const shrink = PLAYER_SIZE * 0.18;
  return {
    left:   PLAYER_X + shrink,
    right:  PLAYER_X + PLAYER_SIZE - shrink,
    top:    p.y + shrink,
    bottom: p.y + PLAYER_SIZE - shrink,
  };
}

function aabbOverlap(a, b) {
  return a.left < b.right && a.right > b.left &&
         a.top  < b.bottom && a.bottom > b.top;
}

function checkCollisions() {
  if (!gState || gState.dead) return;
  const gs = gState;
  const ph = getPlayerHitbox(gs.player);

  for (const obs of gs.level.obstacles) {
    const screenX = obs.x - gs.scrollX + PLAYER_X;
    if (screenX > CANVAS_W + 200 || screenX + 200 < -50) continue;

    const oh = getObstacleHitbox(obs, screenX);
    if (!oh) continue;

    if (aabbOverlap(ph, oh)) {
      triggerDeath();
      return;
    }
  }
}

// ─── Death & respawn ─────────────────────────────────────────────────────────
function triggerDeath() {
  if (gState.dead || gState.complete) return;
  gState.dead       = true;
  gState.deaths++;
  gState.deathTimer = 90;
  gState.flashTimer = 8;

  const p = gState.player;
  spawnDeathParticles(gState.particles, p.x + PLAYER_SIZE / 2, p.y + PLAYER_SIZE / 2, gState.character.color);
  Sound.death();
}

function respawn() {
  const gs   = gState;
  const char = gs.character;

  gs.dead      = false;
  gs.scrollX   = 0;
  gs.player    = {
    x:              PLAYER_X,
    y:              GROUND_Y - PLAYER_SIZE,
    vy:             0,
    onGround:       true,
    jumpsLeft:      char.maxJumps || 1,
    gravityFlipped: false,
    isHolding:      false,
    rotation:       0,
  };
  gs.trail     = [];
  gs.particles = [];
}

// ─── Level complete ───────────────────────────────────────────────────────────
function triggerLevelComplete() {
  if (gState.complete) return;
  gState.complete      = true;
  gState.completeTimer = 100;
  spawnCelebrationParticles(gState.particles, CANVAS_W / 2, CANVAS_H / 2);
  Sound.levelComplete();
}

// ─── Particles ───────────────────────────────────────────────────────────────
function spawnDeathParticles(arr, cx, cy, color) {
  for (let i = 0; i < 16; i++) {
    const angle = (i / 16) * Math.PI * 2;
    const spd   = 2 + Math.random() * 5;
    arr.push({ x: cx, y: cy,
      vx: Math.cos(angle) * spd, vy: Math.sin(angle) * spd - 2,
      r: 4 + Math.random() * 5, alpha: 1, color });
  }
}

function spawnCelebrationParticles(arr, cx, cy) {
  const cols = ['#FFD700','#FF6B9D','#4DC3FF','#4DFFB4','#C77DFF','#FF7043'];
  for (let i = 0; i < 30; i++) {
    const angle = Math.random() * Math.PI * 2;
    const spd   = 1 + Math.random() * 6;
    arr.push({
      x: cx + (Math.random() - 0.5) * 200,
      y: cy + (Math.random() - 0.5) * 200,
      vx: Math.cos(angle) * spd, vy: Math.sin(angle) * spd - 4,
      r: 5 + Math.random() * 7, alpha: 1,
      color: cols[Math.floor(Math.random() * cols.length)],
    });
  }
}

function updateParticles(arr, dt) {
  for (let i = arr.length - 1; i >= 0; i--) {
    const p  = arr[i];
    p.x     += p.vx * dt;
    p.y     += p.vy * dt;
    p.vy    += 0.25 * dt;
    p.alpha -= 0.022 * dt;
    p.r     *= 0.98;
    if (p.alpha <= 0 || p.r < 0.5) arr.splice(i, 1);
  }
}

// ─── Rendering ───────────────────────────────────────────────────────────────
function render() {
  if (!gState) return;
  const gs    = gState;
  const world = getWorld(gs.level.worldId);

  // Background
  const bg = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
  bg.addColorStop(0, world.bgTop);
  bg.addColorStop(1, world.bgBottom);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  drawLevelBackground(ctx, gs.level.id, gs.scrollX, gs.frame, world);
  renderDecorations(gs, world);
  renderGround(world);
  renderObstacles(gs, world);
  renderTrail(gs);

  // Draw double jump ready indicator
  if (gs.player.jumpsLeft < gs.character.maxJumps && gs.character.maxJumps >= 2) {
    ctx.strokeStyle = 'rgba(255, 200, 0, 0.7)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(gs.player.x + PLAYER_SIZE / 2, gs.player.y + PLAYER_SIZE / 2, PLAYER_SIZE / 2 + 8, 0, Math.PI * 2);
    ctx.stroke();
  }

  if (!gs.dead) drawCharacter(ctx, gs.character, gs.player, PLAYER_SIZE);

  renderParticles(gs.particles);

  if (gs.flashTimer > 0) {
    ctx.fillStyle = `rgba(255,0,0,${gs.flashTimer / 8 * 0.35})`;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    gs.flashTimer--;
  }

  renderHUD(gs);

  if (gs.paused)   renderPauseOverlay();
  if (gs.complete) renderCompleteOverlay(gs);
}

// ─── Level background ─────────────────────────────────────────────────────────
function drawLevelBackground(ctx, levelId, scrollX, frame, world) {
  const parallaxSpeed = 0.2;

  switch (levelId) {
    case 1: {
      // Sweet Start: candy rolling hills
      ctx.fillStyle = 'rgba(144, 238, 144, 0.4)';
      for (let i = 0; i < 4; i++) {
        const x = ((i * 250 - scrollX * parallaxSpeed) % (CANVAS_W + 300) + CANVAS_W + 300) % (CANVAS_W + 300) - 150;
        ctx.beginPath();
        ctx.ellipse(x, GROUND_Y - 80, 120, 60, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      // Lollipops
      for (let i = 0; i < 3; i++) {
        const x = ((i * 300 + 50 - scrollX * parallaxSpeed) % (CANVAS_W + 300) + CANVAS_W + 300) % (CANVAS_W + 300) - 150;
        ctx.fillStyle = 'rgba(139, 69, 19, 0.5)';
        ctx.fillRect(x - 3, GROUND_Y - 120, 6, 60);
        ctx.fillStyle = 'rgba(255, 105, 180, 0.5)';
        ctx.beginPath(); ctx.arc(x, GROUND_Y - 140, 22, 0, Math.PI * 2); ctx.fill();
      }
      break;
    }
    case 2: {
      // Gummy Way: colorful pillars
      const colors = ['rgba(255, 20, 147, 0.3)', 'rgba(0, 191, 255, 0.3)', 'rgba(50, 205, 50, 0.3)'];
      for (let i = 0; i < 5; i++) {
        const x = ((i * 200 - scrollX * parallaxSpeed) % (CANVAS_W + 200) + CANVAS_W + 200) % (CANVAS_W + 200) - 100;
        ctx.fillStyle = colors[i % colors.length];
        ctx.fillRect(x - 20, GROUND_Y - 150, 40, 150);
      }
      break;
    }
    case 3: {
      // Lollipop Lane: tall lollipop trees
      for (let i = 0; i < 4; i++) {
        const x = ((i * 220 + 60 - scrollX * parallaxSpeed) % (CANVAS_W + 220) + CANVAS_W + 220) % (CANVAS_W + 220) - 110;
        ctx.fillStyle = 'rgba(160, 82, 45, 0.4)';
        ctx.fillRect(x - 4, GROUND_Y - 150, 8, 100);
        ctx.fillStyle = 'rgba(220, 20, 60, 0.4)';
        ctx.beginPath(); ctx.arc(x, GROUND_Y - 160, 28, 0, Math.PI * 2); ctx.fill();
      }
      break;
    }
    case 4: {
      // Caramel Crunch: drips from top
      for (let i = 0; i < 6; i++) {
        const x = ((i * 150 - scrollX * parallaxSpeed) % (CANVAS_W + 150) + CANVAS_W + 150) % (CANVAS_W + 150) - 75;
        ctx.fillStyle = 'rgba(210, 180, 140, 0.3)';
        ctx.fillRect(x - 15, CEILING_Y, 30, 100);
      }
      break;
    }
    case 5: {
      // Sugar Rush: sprinkles and rainbow
      for (let i = 0; i < 40; i++) {
        const seed = i * 73;
        const x = ((seed - scrollX * parallaxSpeed) % (CANVAS_W + 100) + CANVAS_W + 100) % (CANVAS_W + 100);
        const y = 80 + (seed % 200);
        const cols = ['#FF6B6B', '#FFE66D', '#4ECDC4', '#FF9FF3', '#54A0FF'];
        ctx.fillStyle = cols[seed % cols.length];
        ctx.fillRect(x, y, 3, 3);
      }
      // Rainbow arc
      ctx.strokeStyle = 'rgba(255, 105, 180, 0.2)';
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.arc(CANVAS_W / 2, CEILING_Y - 40, 150, 0, Math.PI, false);
      ctx.stroke();
      break;
    }
    case 6: {
      // Launchpad: rocket pad
      ctx.fillStyle = 'rgba(128, 128, 128, 0.4)';
      ctx.fillRect(CANVAS_W / 2 - 50, GROUND_Y - 100, 100, 100);
      for (let i = 0; i < 3; i++) {
        ctx.fillStyle = 'rgba(255, 165, 0, 0.5)';
        ctx.beginPath();
        ctx.arc(CANVAS_W / 2 - 30 + i * 30, GROUND_Y + 20, 8 + Math.sin(frame * 0.05) * 4, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
    case 7: {
      // Asteroid Belt: floating rocks
      for (let i = 0; i < 5; i++) {
        const x = ((i * 240 - scrollX * parallaxSpeed) % (CANVAS_W + 240) + CANVAS_W + 240) % (CANVAS_W + 240) - 120;
        const y = 100 + Math.sin(frame * 0.02 + i) * 50;
        ctx.fillStyle = 'rgba(105, 105, 105, 0.4)';
        ctx.beginPath(); ctx.arc(x, y, 30 + i * 5, 0, Math.PI * 2); ctx.fill();
      }
      break;
    }
    case 8: {
      // Nebula Run: nebula blobs
      const nebColors = ['rgba(138, 43, 226, 0.15)', 'rgba(255, 105, 180, 0.15)', 'rgba(0, 191, 255, 0.15)'];
      for (let i = 0; i < 4; i++) {
        const x = ((i * 300 + 50 - scrollX * parallaxSpeed) % (CANVAS_W + 300) + CANVAS_W + 300) % (CANVAS_W + 300) - 150;
        ctx.fillStyle = nebColors[i % nebColors.length];
        ctx.beginPath(); ctx.ellipse(x, 120 + i * 40, 100 + i * 20, 70, 0, 0, Math.PI * 2); ctx.fill();
      }
      break;
    }
    case 9: {
      // Galaxy Trail: spiral galaxy
      ctx.save();
      ctx.translate(CANVAS_W * 0.8 - scrollX * parallaxSpeed * 0.5, CEILING_Y + 80);
      ctx.globalAlpha = 0.3;
      for (let r = 20; r < 120; r += 25) {
        ctx.strokeStyle = 'rgba(255, 215, 0, 0.6)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(0, 0, r, r * 0.6, frame * 0.01, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
      break;
    }
    case 10: {
      // Warp Speed: speed lines
      for (let i = 0; i < 8; i++) {
        const yPos = CEILING_Y + 60 + i * 35;
        ctx.strokeStyle = `rgba(255, 255, 255, ${0.3 - i * 0.03})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(((CANVAS_W * 0.6 - scrollX * parallaxSpeed) % (CANVAS_W + 200) + CANVAS_W + 200) % (CANVAS_W + 200), yPos);
        ctx.lineTo(CANVAS_W, yPos);
        ctx.stroke();
      }
      break;
    }
    case 11: {
      // Coral Coast: branching coral
      for (let i = 0; i < 3; i++) {
        const x = ((i * 300 - scrollX * parallaxSpeed) % (CANVAS_W + 300) + CANVAS_W + 300) % (CANVAS_W + 300) - 150;
        ctx.strokeStyle = 'rgba(255, 140, 0, 0.4)';
        ctx.lineWidth = 8;
        ctx.beginPath(); ctx.moveTo(x, GROUND_Y); ctx.lineTo(x, GROUND_Y - 120); ctx.stroke();
        for (let j = 0; j < 3; j++) {
          ctx.beginPath();
          ctx.moveTo(x, GROUND_Y - 40 - j * 25);
          ctx.lineTo(x - 30 + j * 20, GROUND_Y - 70 - j * 25);
          ctx.stroke();
        }
      }
      break;
    }
    case 12: {
      // Kelp Forest: wavy kelp strands
      for (let i = 0; i < 5; i++) {
        const x = ((i * 200 - scrollX * parallaxSpeed) % (CANVAS_W + 200) + CANVAS_W + 200) % (CANVAS_W + 200) - 100;
        ctx.strokeStyle = 'rgba(34, 139, 34, 0.35)';
        ctx.lineWidth = 6;
        ctx.beginPath();
        for (let y = GROUND_Y; y > CEILING_Y; y -= 10) {
          const wave = Math.sin((y - GROUND_Y) * 0.02 + frame * 0.03) * 20;
          if (y === GROUND_Y) ctx.moveTo(x + wave, y);
          else ctx.lineTo(x + wave, y);
        }
        ctx.stroke();
      }
      break;
    }
    case 13: {
      // Underwater Caves: dark arches
      for (let i = 0; i < 4; i++) {
        const x = ((i * 250 - scrollX * parallaxSpeed) % (CANVAS_W + 250) + CANVAS_W + 250) % (CANVAS_W + 250) - 125;
        ctx.fillStyle = 'rgba(47, 79, 79, 0.35)';
        ctx.beginPath();
        ctx.arc(x, GROUND_Y - 60, 70, 0, Math.PI, true);
        ctx.fill();
      }
      break;
    }
    case 14: {
      // Abyss: glowing orbs
      for (let i = 0; i < 4; i++) {
        const x = ((i * 280 - scrollX * parallaxSpeed) % (CANVAS_W + 280) + CANVAS_W + 280) % (CANVAS_W + 280) - 140;
        const y = 120 + i * 50;
        ctx.fillStyle = `rgba(0, 255, 255, ${0.2 + 0.1 * Math.sin(frame * 0.04 + i)})`;
        ctx.beginPath(); ctx.arc(x, y, 25, 0, Math.PI * 2); ctx.fill();
      }
      break;
    }
    case 15: {
      // Tsunami: massive wave
      ctx.fillStyle = 'rgba(0, 100, 180, 0.25)';
      ctx.beginPath();
      ctx.ellipse(CANVAS_W * 1.2 - scrollX * parallaxSpeed, GROUND_Y - 100, 200, 150, -0.3, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 16: {
      // Lava Fields: glowing cracks
      for (let i = 0; i < 6; i++) {
        const x = ((i * 180 - scrollX * parallaxSpeed) % (CANVAS_W + 180) + CANVAS_W + 180) % (CANVAS_W + 180) - 90;
        ctx.strokeStyle = 'rgba(255, 140, 0, 0.5)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x, GROUND_Y);
        ctx.lineTo(x + 40, GROUND_Y + 20);
        ctx.lineTo(x - 40, GROUND_Y + 40);
        ctx.stroke();
      }
      break;
    }
    case 17: {
      // Magma Surge: rising streaks
      for (let i = 0; i < 5; i++) {
        const x = ((i * 220 - scrollX * parallaxSpeed) % (CANVAS_W + 220) + CANVAS_W + 220) % (CANVAS_W + 220) - 110;
        ctx.fillStyle = 'rgba(255, 99, 71, 0.4)';
        ctx.fillRect(x - 8, GROUND_Y - 100 - Math.sin(frame * 0.03 + i) * 30, 16, 100);
      }
      break;
    }
    case 18: {
      // Eruption: volcano peak
      ctx.fillStyle = 'rgba(139, 69, 19, 0.3)';
      ctx.beginPath();
      ctx.moveTo(CANVAS_W * 0.75 - scrollX * parallaxSpeed, GROUND_Y);
      ctx.lineTo(CANVAS_W * 0.85 - scrollX * parallaxSpeed, CEILING_Y + 40);
      ctx.lineTo(CANVAS_W * 0.65 - scrollX * parallaxSpeed, GROUND_Y);
      ctx.fill();
      break;
    }
    case 19: {
      // Inferno: flames on horizon
      ctx.fillStyle = 'rgba(255, 69, 0, 0.3)';
      for (let i = 0; i < 8; i++) {
        const x = ((i * 150 - scrollX * parallaxSpeed) % (CANVAS_W + 150) + CANVAS_W + 150) % (CANVAS_W + 150) - 75;
        ctx.beginPath();
        ctx.moveTo(x, GROUND_Y);
        ctx.lineTo(x - 25, GROUND_Y - 60);
        ctx.lineTo(x + 25, GROUND_Y - 60);
        ctx.fill();
      }
      break;
    }
    case 20: {
      // Final Flame: epic sun + silhouette landscape
      ctx.fillStyle = 'rgba(255, 215, 0, 0.4)';
      ctx.beginPath();
      ctx.arc(CANVAS_W / 2, CEILING_Y + 60, 80, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
      ctx.fillRect(0, GROUND_Y - 60, CANVAS_W, 60);
      break;
    }
  }
}

// ─── Background decorations ───────────────────────────────────────────────────
function renderDecorations(gs, world) {
  const wid = gs.level.worldId;
  const t   = gs.frame;

  if (wid === 1) {
    drawCandyCloud(ctx, ((CANVAS_W * 0.1  - gs.scrollX * 0.05) % (CANVAS_W + 100) + CANVAS_W + 100) % (CANVAS_W + 100) - 50, 55, 1);
    drawCandyCloud(ctx, ((CANVAS_W * 0.5  - gs.scrollX * 0.04) % (CANVAS_W + 100) + CANVAS_W + 100) % (CANVAS_W + 100) - 50, 80, 0.8);
    drawCandyCloud(ctx, ((CANVAS_W * 0.82 - gs.scrollX * 0.06) % (CANVAS_W + 100) + CANVAS_W + 100) % (CANVAS_W + 100) - 50, 40, 0.7);
  } else if (wid === 2) {
    gs.stars.forEach(s => {
      const sx = ((s.x - gs.scrollX * s.speed * 0.01) % CANVAS_W + CANVAS_W) % CANVAS_W;
      ctx.globalAlpha = s.alpha * (0.7 + 0.3 * Math.sin(t * 0.05 + s.x));
      ctx.fillStyle   = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(sx, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
    const px = ((400 - gs.scrollX * 0.02) % (CANVAS_W + 200) + CANVAS_W + 200) % (CANVAS_W + 200) - 100;
    ctx.beginPath(); ctx.arc(px, 90, 50, 0, Math.PI * 2);
    ctx.fillStyle = '#3A1A6E'; ctx.fill();
    ctx.strokeStyle = '#7B4FFF'; ctx.lineWidth = 3; ctx.stroke();
    ctx.beginPath(); ctx.ellipse(px, 90, 72, 16, -0.3, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(123,79,255,0.5)'; ctx.lineWidth = 5; ctx.stroke();
  } else if (wid === 3) {
    for (let i = 0; i < 8; i++) {
      const bx = ((i * 90 + 30 - gs.scrollX * 0.03) % (CANVAS_W + 80) + CANVAS_W + 80) % (CANVAS_W + 80) - 40;
      const by = 50 + Math.sin(t * 0.03 + i) * 15 + i * 30;
      if (by > GROUND_Y - 20) continue;
      ctx.beginPath(); ctx.arc(bx, by, 10 + i * 2, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(64,224,208,0.5)'; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle   = 'rgba(64,224,208,0.07)'; ctx.fill();
    }
  } else if (wid === 4) {
    ctx.fillStyle = `rgba(255,69,0,${0.04 + 0.02 * Math.sin(t * 0.04)})`;
    ctx.fillRect(0, GROUND_Y - 100, CANVAS_W, 100);
    for (let i = 0; i < 10; i++) {
      const ex = ((i * 72 + 20 - gs.scrollX * 0.1) % (CANVAS_W + 70) + CANVAS_W + 70) % (CANVAS_W + 70) - 35;
      const ey = GROUND_Y - 25 - Math.abs(Math.sin(t * 0.04 + i * 0.8)) * 90;
      ctx.beginPath(); ctx.arc(ex, ey, 2 + Math.random() * 2, 0, Math.PI * 2);
      ctx.fillStyle   = i % 2 === 0 ? '#FF4500' : '#FFD700';
      ctx.globalAlpha = 0.6 + Math.random() * 0.4;
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
}

function drawCandyCloud(ctx, x, y, scale) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  [[0,0,24],[22,-8,18],[-18,-7,17],[36,4,15],[-30,4,13]].forEach(([cx,cy,r]) => {
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
  });
  ctx.restore();
}

// ─── Ground ───────────────────────────────────────────────────────────────────
function renderGround(world) {
  ctx.fillStyle = world.groundColor;
  ctx.fillRect(0, GROUND_Y, CANVAS_W, CANVAS_H - GROUND_Y);

  ctx.strokeStyle = world.groundPattern;
  ctx.lineWidth   = 3;
  ctx.beginPath(); ctx.moveTo(0, GROUND_Y); ctx.lineTo(CANVAS_W, GROUND_Y); ctx.stroke();

  ctx.strokeStyle = 'rgba(0,0,0,0.15)';
  ctx.lineWidth   = 1;
  for (let i = 0; i < CANVAS_W; i += 42) {
    ctx.beginPath(); ctx.moveTo(i, GROUND_Y); ctx.lineTo(i, CANVAS_H); ctx.stroke();
  }
}

// ─── Obstacles ────────────────────────────────────────────────────────────────
function renderObstacles(gs, world) {
  for (const obs of gs.level.obstacles) {
    const screenX = obs.x - gs.scrollX + PLAYER_X;
    if (screenX > CANVAS_W + 60 || screenX + 200 < -20) continue;
    drawObstacle(obs, screenX, world);
  }
}

function drawObstacle(obs, sx, world) {
  switch (obs.t) {
    case 'sp':
      drawSpike(ctx, sx, GROUND_Y, SPIKE_W, SPIKE_H, world.obsColor); break;
    case 'sp2':
      drawSpike(ctx, sx,              GROUND_Y, SPIKE_W, SPIKE_H, world.obsColor);
      drawSpike(ctx, sx + SPIKE_W + 4, GROUND_Y, SPIKE_W, SPIKE_H, world.obsColor); break;
    case 'sp3':
      drawSpike(ctx, sx,                   GROUND_Y, SPIKE_W, SPIKE_H, world.obsColor);
      drawSpike(ctx, sx + SPIKE_W + 4,      GROUND_Y, SPIKE_W, SPIKE_H, world.obsColor);
      drawSpike(ctx, sx + (SPIKE_W + 4) * 2, GROUND_Y, SPIKE_W, SPIKE_H, world.obsColor); break;
    case 'bl':
      drawBlock(ctx, sx, GROUND_Y, BLOCK_W, BLOCK_H,      world.blockColor, world.blockOutline); break;
    case 'blt':
      drawBlock(ctx, sx, GROUND_Y, BLOCK_W, BLOCK_TALL_H, world.blockColor, world.blockOutline); break;
    case 'fbl': {
      drawBlock(ctx, sx, GROUND_Y - obs.h, BLOCK_W, BLOCK_H, world.blockColor, world.blockOutline);
      ctx.strokeStyle = 'rgba(0,0,0,0.3)';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(sx + BLOCK_W / 2, GROUND_Y - obs.h);
      ctx.lineTo(sx + BLOCK_W / 2, GROUND_Y);
      ctx.stroke();
      ctx.setLineDash([]);
      break;
    }
    case 'csp':
      drawCeilingSpike(ctx, sx, CEILING_Y, SPIKE_W, SPIKE_H, world.obsColor); break;
    case 'csp2':
      drawCeilingSpike(ctx, sx,              CEILING_Y, SPIKE_W, SPIKE_H, world.obsColor);
      drawCeilingSpike(ctx, sx + SPIKE_W + 4, CEILING_Y, SPIKE_W, SPIKE_H, world.obsColor); break;
    case 'circ': {
      const cy = GROUND_Y - obs.cy;
      ctx.fillStyle = world.obsColor;
      ctx.beginPath(); ctx.arc(sx + 22, cy, 22, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#000';
      ctx.beginPath(); ctx.arc(sx + 16, cy - 5, 3, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(sx + 28, cy - 5, 3, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(sx + 22, cy + 8, 4, 0, Math.PI); ctx.stroke();
      break;
    }
  }
}

function drawSpike(ctx, x, groundY, w, h, color) {
  ctx.beginPath();
  ctx.moveTo(x + 3, groundY + 2); ctx.lineTo(x + w + 3, groundY + 2); ctx.lineTo(x + w / 2 + 3, groundY - h + 3);
  ctx.closePath(); ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fill();

  ctx.beginPath();
  ctx.moveTo(x + w / 2, groundY - h);
  ctx.lineTo(x, groundY);
  ctx.lineTo(x + w, groundY);
  ctx.closePath();
  ctx.fillStyle = color; ctx.fill();

  ctx.beginPath();
  ctx.moveTo(x + w / 2, groundY - h); ctx.lineTo(x, groundY);
  ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 1.5; ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(x + w / 2, groundY - h); ctx.lineTo(x, groundY); ctx.lineTo(x + w, groundY); ctx.closePath();
  ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = 1.5; ctx.stroke();
}

function drawCeilingSpike(ctx, x, ceilingY, w, h, color) {
  // Inverted spike (pointing down from ceiling)
  ctx.beginPath();
  ctx.moveTo(x + 3, ceilingY - 2);
  ctx.lineTo(x + w + 3, ceilingY - 2);
  ctx.lineTo(x + w / 2 + 3, ceilingY + h - 3);
  ctx.closePath();
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(x + w / 2, ceilingY + h);
  ctx.lineTo(x, ceilingY);
  ctx.lineTo(x + w, ceilingY);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(x + w / 2, ceilingY + h);
  ctx.lineTo(x, ceilingY);
  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(x + w / 2, ceilingY + h);
  ctx.lineTo(x, ceilingY);
  ctx.lineTo(x + w, ceilingY);
  ctx.closePath();
  ctx.strokeStyle = 'rgba(0,0,0,0.5)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

function drawBlock(ctx, x, groundY, w, h, color, outline) {
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.fillRect(x + 4, groundY - h + 4, w, h);

  ctx.beginPath(); ctx.roundRect(x, groundY - h, w, h, 5);
  ctx.fillStyle = color; ctx.fill();
  ctx.strokeStyle = outline; ctx.lineWidth = 3; ctx.stroke();

  ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x + w / 2, groundY - h + 4); ctx.lineTo(x + w / 2, groundY - 4);
  ctx.moveTo(x + 4, groundY - h / 2);     ctx.lineTo(x + w - 4, groundY - h / 2);
  ctx.stroke();
}

// ─── Trail ────────────────────────────────────────────────────────────────────
function renderTrail(gs) {
  gs.trail.forEach((t, i) => {
    if (t.alpha <= 0) return;
    const r = (PLAYER_SIZE / 2) * (0.15 + 0.3 * (i / gs.trail.length));
    ctx.globalAlpha = t.alpha * 0.5;
    ctx.beginPath(); ctx.arc(t.x, t.y, r, 0, Math.PI * 2);
    ctx.fillStyle = gs.character.trailColor; ctx.fill();
  });
  ctx.globalAlpha = 1;
}

// ─── Particles ────────────────────────────────────────────────────────────────
function renderParticles(arr) {
  arr.forEach(p => {
    ctx.globalAlpha = Math.max(0, p.alpha);
    ctx.fillStyle   = p.color;
    ctx.beginPath(); ctx.arc(p.x, p.y, Math.max(0, p.r), 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;
}

// ─── HUD ─────────────────────────────────────────────────────────────────────
function renderHUD(gs) {
  const progress = Math.min(gs.scrollX / gs.level.length, 1);
  const barX = 16, barY = 10, barW = CANVAS_W - 32, barH = 10;

  // Progress bar bg
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath(); ctx.roundRect(barX, barY, barW, barH, 5); ctx.fill();

  // Fill
  const world = getWorld(gs.level.worldId);
  ctx.fillStyle = world.obsColor;
  ctx.beginPath(); ctx.roundRect(barX, barY, barW * progress, barH, 5); ctx.fill();

  // Outline
  ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.roundRect(barX, barY, barW, barH, 5); ctx.stroke();

  ctx.font = '14px sans-serif';
  ctx.fillText('🏁', barX + barW - 6, barY + 12);

  // Pause button
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.beginPath(); ctx.roundRect(12, 28, 36, 26, 7); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.font = '16px sans-serif';
  ctx.fillText('⏸', 16, 47);

  // Mute button
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.beginPath(); ctx.roundRect(54, 28, 36, 26, 7); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.font = '16px sans-serif';
  ctx.fillText(Sound.muted ? '🔇' : '🔊', 58, 47);

  // Death counter
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.beginPath(); ctx.roundRect(CANVAS_W - 68, 28, 58, 26, 7); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.font = 'bold 13px sans-serif';
  ctx.textAlign = 'right'; ctx.fillText(`💀 ${gs.deaths}`, CANVAS_W - 16, 46);
  ctx.textAlign = 'left';

  // Level name
  ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.font = 'bold 12px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(gs.level.name, CANVAS_W / 2, 46);
  ctx.textAlign = 'left';
}

// ─── Hit-test helpers ─────────────────────────────────────────────────────────
function isPauseButtonHit(cx, cy) {
  return cx >= 12 && cx <= 48 && cy >= 28 && cy <= 54;
}
function isMuteButtonHit(cx, cy) {
  return cx >= 54 && cx <= 90 && cy >= 28 && cy <= 54;
}

// ─── Overlays ─────────────────────────────────────────────────────────────────
function renderPauseOverlay() {
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  ctx.fillStyle = '#fff'; ctx.font = 'bold 36px sans-serif'; ctx.textAlign = 'center';
  ctx.fillText('⏸ PAUSED', CANVAS_W / 2, CANVAS_H / 2 - 10);
  ctx.font = '18px sans-serif'; ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ctx.fillText('Tap to resume', CANVAS_W / 2, CANVAS_H / 2 + 28);
  ctx.textAlign = 'left';
}

function renderCompleteOverlay(gs) {
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  ctx.fillStyle = '#FFD700'; ctx.font = 'bold 38px sans-serif'; ctx.textAlign = 'center';
  ctx.fillText('🎉 LEVEL COMPLETE!', CANVAS_W / 2, CANVAS_H / 2 - 10);
  ctx.fillStyle = '#fff'; ctx.font = '18px sans-serif';
  ctx.fillText('Loading results…', CANVAS_W / 2, CANVAS_H / 2 + 28);
  ctx.textAlign = 'left';
}

// ─── Level-complete callback (overridden by ui.js) ────────────────────────────
let onLevelComplete = function (levelId, deaths) {};
