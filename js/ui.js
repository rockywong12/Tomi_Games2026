// ui.js - Screen management, menus, character select, world map, results

// ─── Screen registry ──────────────────────────────────────────────────────────
let Screens = null;
let activeScreen = null;

function showScreen(name) {
  Object.keys(Screens).forEach(k => {
    Screens[k].classList.toggle('active', k === name);
  });
  activeScreen = name;
}

// ─── App-level state ──────────────────────────────────────────────────────────
let selectedWorldId = 1;
let selectedLevelId = 1;
let selectedCharId  = 'cube';

// ─── UI Init ──────────────────────────────────────────────────────────────────
function initUI() {
  // Initialize Screens object after DOM is ready
  Screens = {
    menu:      document.getElementById('screen-menu'),
    charSelect:document.getElementById('screen-char-select'),
    worldMap:  document.getElementById('screen-world-map'),
    levelSel:  document.getElementById('screen-level-select'),
    game:      document.getElementById('screen-game'),
    results:   document.getElementById('screen-results'),
  };

  selectedCharId = Storage.getChar();

  // Wire up main menu buttons
  document.getElementById('btn-play').addEventListener('click', () => showScreen('charSelect'));
  document.getElementById('btn-reset').addEventListener('click', () => {
    if (confirm('Reset all progress?')) { Storage.reset(); buildWorldMap(); }
  });

  // Character select
  buildCharSelect();
  document.getElementById('btn-char-back').addEventListener('click', () => showScreen('menu'));
  document.getElementById('btn-char-go').addEventListener('click', () => {
    Storage.saveChar(selectedCharId);
    buildWorldMap();
    showScreen('worldMap');
  });

  // World map
  document.getElementById('btn-world-back').addEventListener('click', () => showScreen('charSelect'));

  // Level select
  document.getElementById('btn-level-back').addEventListener('click', () => showScreen('worldMap'));

  // Results screen
  document.getElementById('btn-result-retry').addEventListener('click', launchCurrentLevel);
  document.getElementById('btn-result-menu').addEventListener('click', () => showScreen('worldMap'));
  document.getElementById('btn-result-next').addEventListener('click', () => {
    const nextId = selectedLevelId + 1;
    if (nextId <= 20 && Storage.isUnlocked(nextId)) {
      selectedLevelId = nextId;
      selectedWorldId = getLevel(nextId).worldId;
      launchCurrentLevel();
    } else {
      showScreen('worldMap');
    }
  });

  // Hook into game engine's level-complete callback
  onLevelComplete = handleLevelComplete;

  // Build initial world map
  buildWorldMap();

  showScreen('menu');
}


// ─── Character Select ─────────────────────────────────────────────────────────
function buildCharSelect() {
  const grid = document.getElementById('char-grid');
  grid.innerHTML = '';

  CHARACTERS.forEach(char => {
    const card = document.createElement('div');
    card.className = 'char-card' + (char.id === selectedCharId ? ' selected' : '');
    card.dataset.id = char.id;
    card.style.setProperty('--char-color', char.color);
    card.style.setProperty('--char-outline', char.outline);

    card.innerHTML = `
      <div class="char-preview" id="char-prev-${char.id}"></div>
      <div class="char-name">${char.name}</div>
      <div class="char-mechanic">${char.mechanic}</div>
      ${char.popular ? '<div class="char-badge">⭐ Popular</div>' : ''}
    `;

    card.addEventListener('click', () => {
      selectedCharId = char.id;
      document.querySelectorAll('.char-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      updateCharDesc(char);
    });

    grid.appendChild(card);

    // Draw mini canvas preview of character
    requestAnimationFrame(() => renderCharPreview(char));
  });

  updateCharDesc(getCharacter(selectedCharId));
}

function renderCharPreview(char) {
  const container = document.getElementById(`char-prev-${char.id}`);
  if (!container) return;

  // Check if canvas already exists to avoid duplicates
  let cvs = container.querySelector('canvas');
  if (!cvs) {
    cvs = document.createElement('canvas');
    cvs.width  = 70;
    cvs.height = 70;
    container.appendChild(cvs);
  }

  const c   = cvs.getContext('2d');
  const sz  = 48;
  const px  = (70 - sz) / 2;
  const py  = (70 - sz) / 2;
  const fakePlayer = { x: px, y: py, rotation: -0.3, gravityFlipped: false, isHolding: false };
  drawCharacter(c, char, fakePlayer, sz);
}

function updateCharDesc(char) {
  const el = document.getElementById('char-desc');
  if (el) el.textContent = char.description;
}

// ─── World Map ────────────────────────────────────────────────────────────────
function buildWorldMap() {
  const container = document.getElementById('world-cards');
  container.innerHTML = '';

  WORLDS.forEach(world => {
    const lvls       = getLevelsForWorld(world.id);
    const firstLevel = lvls[0];
    const unlocked   = Storage.isUnlocked(firstLevel.id);
    const totalStars = lvls.reduce((s, l) => s + Storage.getStars(l.id), 0);
    const maxStars   = lvls.length * 5;
    const completed  = lvls.filter(l => Storage.getStars(l.id) > 0).length;

    const card = document.createElement('div');
    card.className = 'world-card' + (unlocked ? '' : ' locked');
    card.style.setProperty('--world-top',    world.bgTop);
    card.style.setProperty('--world-bottom', world.bgBottom);

    card.innerHTML = `
      <div class="world-card-bg">
        <canvas class="world-art-canvas" width="220" height="110"></canvas>
      </div>
      <div class="world-card-content">
        <div class="world-name">${world.name}</div>
        <div class="world-desc">${world.desc}</div>
        <div class="world-progress">
          ${unlocked
            ? `<span>⭐ ${totalStars}/${maxStars}</span><span>${completed}/${lvls.length} levels</span>`
            : '<span>🔒 Locked</span>'}
        </div>
      </div>
    `;

    if (unlocked) {
      card.addEventListener('click', () => {
        selectedWorldId = world.id;
        buildLevelSelect(world.id);
        showScreen('levelSel');
      });
    }

    container.appendChild(card);

    // Draw world art onto the canvas
    requestAnimationFrame(() => {
      const cvs = card.querySelector('.world-art-canvas');
      if (cvs) drawWorldArt(cvs.getContext('2d'), world.id, 220, 110);
    });
  });
}

// ─── Level Select ─────────────────────────────────────────────────────────────
function buildLevelSelect(worldId) {
  const world    = getWorld(worldId);
  const levels   = getLevelsForWorld(worldId);

  document.getElementById('level-world-title').textContent = world.name;

  const grid = document.getElementById('level-grid');
  grid.innerHTML = '';

  levels.forEach(level => {
    const stars    = Storage.getStars(level.id);
    const unlocked = Storage.isUnlocked(level.id);

    const tile = document.createElement('div');
    tile.className = 'level-tile' + (unlocked ? '' : ' locked');
    tile.style.setProperty('--world-top',     world.bgTop);
    tile.style.setProperty('--world-bottom',  world.bgBottom);
    tile.style.setProperty('--world-obs',     world.obsColor);

    tile.innerHTML = `
      <canvas class="level-tile-art" width="90" height="54"></canvas>
      <div class="level-num">${level.id}</div>
      <div class="level-name">${level.name}</div>
      <div class="level-stars">${renderStarsHtml(stars, 5)}</div>
      ${!unlocked ? '<div class="level-lock">🔒</div>' : ''}
    `;

    if (unlocked) {
      tile.addEventListener('click', () => {
        selectedLevelId = level.id;
        launchCurrentLevel();
      });
    }

    grid.appendChild(tile);

    // Draw level thumbnail art
    requestAnimationFrame(() => {
      const cvs = tile.querySelector('.level-tile-art');
      if (cvs) drawLevelTileArt(cvs.getContext('2d'), level.id, worldId, 90, 54);
    });
  });
}

function renderStarsHtml(earned, max) {
  let html = '';
  for (let i = 1; i <= max; i++) {
    html += `<span class="star ${i <= earned ? 'filled' : 'empty'}">★</span>`;
  }
  return html;
}

// ─── Launch level ─────────────────────────────────────────────────────────────
function launchCurrentLevel() {
  showScreen('game');
  // Short delay so screen transition renders, then start level + music
  setTimeout(() => {
    const level = getLevel(selectedLevelId);
    startLevel(selectedLevelId, selectedCharId);
    if (level) Sound.startMusic(level.id);
  }, 80);
}

// ─── Level complete callback ──────────────────────────────────────────────────
function handleLevelComplete(levelId, deaths) {
  Sound.stopMusic();
  stopGame();
  const stars = Storage.completeLevel(levelId, deaths);

  // Rebuild world map in background
  buildWorldMap();

  // Show results screen
  showResultsScreen(levelId, deaths, stars);
  showScreen('results');
}

// ─── Results Screen ───────────────────────────────────────────────────────────
function showResultsScreen(levelId, deaths, stars) {
  const level = getLevel(levelId);
  const world = getWorld(level.worldId);

  document.getElementById('result-level-name').textContent = `${world.name.split(' ')[0]} • ${level.name}`;
  document.getElementById('result-stars').innerHTML   = renderStarsHtml(stars, 5);
  document.getElementById('result-deaths').textContent = `💀 Deaths: ${deaths}`;
  document.getElementById('result-msg').textContent    = getResultMessage(stars);

  // Show/hide Next button
  const nextId      = levelId + 1;
  const btnNext     = document.getElementById('btn-result-next');
  const hasNext     = nextId <= 20;
  btnNext.style.display = hasNext ? '' : 'none';
  if (hasNext) btnNext.textContent = `Next ▶`;

  // Animate stars in
  setTimeout(() => {
    document.querySelectorAll('#result-stars .star.filled').forEach((s, i) => {
      s.style.animationDelay = `${i * 0.15}s`;
      s.classList.add('pop');
    });
  }, 200);
}

function getResultMessage(stars) {
  switch (stars) {
    case 5: return '🏆 PERFECT! Flawless run!';
    case 4: return '🌟 Amazing! Nearly perfect!';
    case 3: return '😊 Great job! Keep practicing!';
    case 2: return '👍 Good effort! Try again!';
    default:return '💪 You finished! Keep going!';
  }
}

// ─── World Card Art (procedural canvas illustrations) ─────────────────────────
function drawWorldArt(ctx, worldId, W, H) {
  ctx.clearRect(0, 0, W, H);

  if (worldId === 1) {
    // 🍬 Candy Kingdom — pink sky, rolling hills, lollipops, clouds
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#FFB6DB'); bg.addColorStop(1, '#FFF0F8');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

    // Rolling green hills
    ctx.fillStyle = 'rgba(144,238,100,0.85)';
    ctx.beginPath();
    ctx.moveTo(0, H);
    ctx.bezierCurveTo(40, H - 40, 90, H - 55, 140, H - 35);
    ctx.bezierCurveTo(170, H - 22, 200, H - 50, W, H - 30);
    ctx.lineTo(W, H); ctx.fill();

    // Lollipops
    [[55, H - 58, '#FF69B4'], [130, H - 74, '#CC44FF'], [185, H - 62, '#FF4499']].forEach(([lx, ly, col]) => {
      ctx.fillStyle = '#8B4513'; ctx.fillRect(lx - 3, ly + 20, 6, 35);
      ctx.fillStyle = col;
      ctx.beginPath(); ctx.arc(lx, ly, 18, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(lx, ly, 18, 0.3, 1.8); ctx.stroke();
    });

    // Clouds
    [[30, 18], [110, 10], [175, 22]].forEach(([cx, cy]) => {
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      [[0, 0, 14], [14, -5, 11], [-12, -4, 10]].forEach(([ox, oy, r]) => {
        ctx.beginPath(); ctx.arc(cx + ox, cy + oy, r, 0, Math.PI * 2); ctx.fill();
      });
    });

    // Candy cane
    ctx.strokeStyle = '#FF1493'; ctx.lineWidth = 5;
    ctx.setLineDash([6, 5]);
    ctx.beginPath(); ctx.moveTo(170, H - 28); ctx.lineTo(170, H - 60);
    ctx.arc(170, H - 60, 8, Math.PI, 0, false); ctx.stroke();
    ctx.setLineDash([]);

  } else if (worldId === 2) {
    // 🚀 Space Adventure — deep space, stars, planet, rocket
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#06081A'); bg.addColorStop(1, '#1A2A4A');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

    // Stars
    const starSeeds = [7,17,31,41,53,67,79,89,97,103,113,127,137,149,163,173,181,193,199,211];
    starSeeds.forEach((s, i) => {
      const sx = (s * 11 + i * 37) % W;
      const sy = (s * 7  + i * 13) % (H - 20);
      const sr = (i % 3 === 0) ? 1.5 : 0.8;
      ctx.fillStyle = `rgba(255,255,255,${0.4 + (i % 5) * 0.12})`;
      ctx.beginPath(); ctx.arc(sx, sy, sr, 0, Math.PI * 2); ctx.fill();
    });

    // Nebula glow
    const neb = ctx.createRadialGradient(40, H - 30, 5, 40, H - 30, 55);
    neb.addColorStop(0, 'rgba(100,50,200,0.35)'); neb.addColorStop(1, 'transparent');
    ctx.fillStyle = neb; ctx.fillRect(0, 0, W, H);

    // Planet with ring
    ctx.fillStyle = '#3A1A6E';
    ctx.beginPath(); ctx.arc(W - 45, 35, 28, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(100,80,200,0.6)';
    ctx.beginPath(); ctx.arc(W - 45, 35, 28, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(150,120,255,0.7)'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.ellipse(W - 45, 35, 42, 12, -0.3, 0, Math.PI * 2); ctx.stroke();
    // Planet shine
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.beginPath(); ctx.arc(W - 55, 25, 12, 0, Math.PI * 2); ctx.fill();

    // Rocket silhouette
    ctx.fillStyle = '#AAAACC';
    ctx.beginPath();
    ctx.moveTo(65, H - 15); ctx.lineTo(55, H - 15); ctx.lineTo(60, H - 55);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#FF4444';
    ctx.beginPath(); ctx.arc(60, H - 55, 6, Math.PI, 0); ctx.fill();
    // Exhaust
    ctx.fillStyle = 'rgba(255,150,50,0.7)';
    ctx.beginPath(); ctx.moveTo(57, H - 15); ctx.lineTo(63, H - 15); ctx.lineTo(60, H); ctx.fill();

  } else if (worldId === 3) {
    // 🌊 Ocean Deep — teal water, coral, fish, bubbles
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#003D5B'); bg.addColorStop(1, '#005F80');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

    // Light rays from top
    ctx.save();
    for (let i = 0; i < 5; i++) {
      const rx = 30 + i * 44;
      ctx.fillStyle = `rgba(100,220,255,${0.05 + i * 0.02})`;
      ctx.beginPath();
      ctx.moveTo(rx, 0); ctx.lineTo(rx - 25, H); ctx.lineTo(rx + 25, H);
      ctx.fill();
    }
    ctx.restore();

    // Coral branches
    [[30, H - 5], [80, H - 5], [155, H - 5], [200, H - 5]].forEach(([bx, by]) => {
      ctx.strokeStyle = '#FF7043'; ctx.lineWidth = 5;
      ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx, by - 45); ctx.stroke();
      ctx.lineWidth = 3;
      [[-20, 25], [18, 20], [-14, 10]].forEach(([dx, dy]) => {
        ctx.beginPath(); ctx.moveTo(bx, by - dy); ctx.lineTo(bx + dx, by - dy - 14); ctx.stroke();
      });
    });

    // Fish
    [[105, H - 55, '#FFD700', 1], [165, H - 70, '#FF6B9D', -1]].forEach(([fx, fy, fc, dir]) => {
      ctx.fillStyle = fc;
      ctx.save(); ctx.translate(fx, fy); ctx.scale(dir, 1);
      ctx.beginPath(); ctx.ellipse(0, 0, 14, 7, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.moveTo(14, 0); ctx.lineTo(22, -7); ctx.lineTo(22, 7); ctx.fill();
      ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(-8, -1, 2, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    });

    // Bubbles
    [[40, 30], [90, 18], [140, 40], [190, 22]].forEach(([bx, by]) => {
      ctx.strokeStyle = 'rgba(150,220,255,0.6)'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(bx, by, 5, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = 'rgba(150,220,255,0.3)';
      ctx.beginPath(); ctx.arc(bx + 14, by + 12, 3, 0, Math.PI * 2); ctx.stroke();
    });

  } else if (worldId === 4) {
    // 🌋 Volcano Island — red sky, volcano, lava, embers
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#1A0000'); bg.addColorStop(1, '#5C1500');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

    // Lava glow on horizon
    const glow = ctx.createLinearGradient(0, H - 25, 0, H);
    glow.addColorStop(0, 'rgba(255,80,0,0.4)'); glow.addColorStop(1, 'rgba(255,120,0,0.2)');
    ctx.fillStyle = glow; ctx.fillRect(0, H - 25, W, 25);

    // Volcano silhouette
    ctx.fillStyle = '#1A0000';
    ctx.beginPath();
    ctx.moveTo(W * 0.55, H);
    ctx.lineTo(W * 0.72, H * 0.12);
    ctx.lineTo(W * 0.89, H);
    ctx.fill();

    // Lava inside crater
    ctx.fillStyle = 'rgba(255,100,0,0.8)';
    ctx.beginPath();
    ctx.moveTo(W * 0.665, H * 0.15);
    ctx.lineTo(W * 0.72, H * 0.12);
    ctx.lineTo(W * 0.775, H * 0.15);
    ctx.fill();

    // Lava streams on volcano sides
    ctx.strokeStyle = 'rgba(255,80,0,0.6)'; ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(W * 0.72, H * 0.15); ctx.bezierCurveTo(W * 0.69, H * 0.35, W * 0.65, H * 0.55, W * 0.62, H);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(W * 0.72, H * 0.15); ctx.bezierCurveTo(W * 0.75, H * 0.35, W * 0.79, H * 0.5, W * 0.82, H);
    ctx.stroke();

    // Jagged rocks in foreground
    ctx.fillStyle = '#0D0000';
    [[0, H], [20, H - 22], [45, H], [65, H - 30], [90, H], [180, H], [200, H - 18], [W, H - 10], [W, H]].forEach(([rx, ry], i, arr) => {
      if (i === 0) { ctx.beginPath(); ctx.moveTo(rx, ry); }
      else ctx.lineTo(rx, ry);
    });
    ctx.fill();

    // Embers / sparks
    [[W * 0.72 - 10, H * 0.08], [W * 0.72 + 5, H * 0.05], [W * 0.72 - 20, H * 0.14],
     [W * 0.72 + 18, H * 0.11], [W * 0.72 - 5, H * 0.02]].forEach(([ex, ey]) => {
      ctx.fillStyle = `rgba(255,${100 + Math.random() * 100 | 0},0,0.9)`;
      ctx.beginPath(); ctx.arc(ex, ey, 2 + Math.random() * 2, 0, Math.PI * 2); ctx.fill();
    });

    // Small secondary volcano
    ctx.fillStyle = '#1A0000';
    ctx.beginPath();
    ctx.moveTo(5, H); ctx.lineTo(28, H * 0.55); ctx.lineTo(50, H); ctx.fill();
    ctx.fillStyle = 'rgba(255,80,0,0.5)';
    ctx.beginPath();
    ctx.moveTo(22, H * 0.57); ctx.lineTo(28, H * 0.55); ctx.lineTo(34, H * 0.57); ctx.fill();
  }
}

// ─── Level Tile Art (mini themed thumbnails per level) ────────────────────────
function drawLevelTileArt(ctx, levelId, worldId, W, H) {
  const world = getWorld(worldId);
  if (!world) return;

  // Background gradient from world theme
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, world.bgTop); bg.addColorStop(1, world.bgBottom);
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

  // Ground strip
  ctx.fillStyle = world.groundColor;
  ctx.fillRect(0, H - 10, W, 10);

  // Per-level themed mini scene
  switch (levelId) {
    case 1: {
      // Sweet Start: single spike + rolling hill
      ctx.fillStyle = 'rgba(144,238,100,0.7)';
      ctx.beginPath(); ctx.ellipse(W * 0.5, H - 10, W * 0.55, 18, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = world.obsColor;
      ctx.beginPath(); ctx.moveTo(W * 0.5, H - 28); ctx.lineTo(W * 0.43, H - 10); ctx.lineTo(W * 0.57, H - 10); ctx.fill();
      break;
    }
    case 2: {
      // Gummy Way: colorful pillars
      ['#FF1493','#00BFFF','#32CD32'].forEach((c, i) => {
        ctx.fillStyle = c;
        ctx.globalAlpha = 0.7;
        ctx.fillRect(10 + i * 26, H - 10 - 18 - i * 6, 14, 18 + i * 6);
      });
      ctx.globalAlpha = 1;
      break;
    }
    case 3: {
      // Lollipop Lane: lollipop tree
      ctx.fillStyle = '#8B4513';
      ctx.fillRect(W * 0.5 - 2, H - 10 - 30, 4, 30);
      ctx.fillStyle = '#FF69B4';
      ctx.beginPath(); ctx.arc(W * 0.5, H - 40, 14, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(W * 0.5, H - 40, 14, 0.5, 2.0); ctx.stroke();
      break;
    }
    case 4: {
      // Caramel Crunch: caramel drips from ceiling
      ctx.fillStyle = 'rgba(210,140,60,0.8)';
      [W * 0.25, W * 0.5, W * 0.75].forEach(dx => {
        ctx.fillRect(dx - 6, 0, 12, 22 + (dx / W) * 10);
      });
      ctx.fillStyle = world.obsColor;
      ctx.beginPath(); ctx.moveTo(W * 0.5, H - 28); ctx.lineTo(W * 0.43, H - 10); ctx.lineTo(W * 0.57, H - 10); ctx.fill();
      break;
    }
    case 5: {
      // Sugar Rush: rainbow arc + sprinkles
      ctx.strokeStyle = 'rgba(255,105,180,0.6)'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.arc(W * 0.5, H + 5, W * 0.4, Math.PI, 0); ctx.stroke();
      ['#FF6B6B','#FFE66D','#4ECDC4','#FF9FF3'].forEach((c, i) => {
        ctx.fillStyle = c;
        ctx.fillRect(10 + i * 20, 10 + (i % 2) * 8, 4, 4);
      });
      break;
    }
    case 6: {
      // Launchpad: rocket + pad
      ctx.fillStyle = 'rgba(100,100,100,0.5)';
      ctx.fillRect(W * 0.35, H - 20, W * 0.3, 10);
      ctx.fillStyle = '#AAAACC';
      ctx.beginPath(); ctx.moveTo(W * 0.5, H - 20); ctx.lineTo(W * 0.44, H - 20); ctx.lineTo(W * 0.47, H - 46); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#FF4444';
      ctx.beginPath(); ctx.arc(W * 0.47, H - 46, 5, Math.PI, 0); ctx.fill();
      ctx.fillStyle = 'rgba(255,150,50,0.8)';
      ctx.beginPath(); ctx.moveTo(W * 0.44, H - 20); ctx.lineTo(W * 0.5, H - 20); ctx.lineTo(W * 0.47, H - 10); ctx.fill();
      break;
    }
    case 7: {
      // Asteroid Belt: rocky asteroids floating
      [[20, 20, 12], [55, 14, 8], [72, 26, 6]].forEach(([ax, ay, ar]) => {
        ctx.fillStyle = 'rgba(105,105,105,0.7)';
        ctx.beginPath(); ctx.arc(ax, ay, ar, 0, Math.PI * 2); ctx.fill();
      });
      ctx.fillStyle = world.obsColor;
      ctx.beginPath(); ctx.moveTo(W * 0.5, H - 28); ctx.lineTo(W * 0.43, H - 10); ctx.lineTo(W * 0.57, H - 10); ctx.fill();
      break;
    }
    case 8: {
      // Nebula Run: nebula blobs
      ['rgba(138,43,226,0.3)','rgba(255,105,180,0.25)','rgba(0,191,255,0.25)'].forEach((c, i) => {
        ctx.fillStyle = c;
        ctx.beginPath(); ctx.ellipse(20 + i * 30, 15 + i * 8, 22, 14, 0, 0, Math.PI * 2); ctx.fill();
      });
      break;
    }
    case 9: {
      // Galaxy Trail: spiral rings
      ctx.save(); ctx.translate(W * 0.4, H * 0.4); ctx.globalAlpha = 0.6;
      [12, 22, 32].forEach(r => {
        ctx.strokeStyle = 'rgba(255,215,0,0.7)'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.ellipse(0, 0, r, r * 0.55, 0.2, 0, Math.PI * 2); ctx.stroke();
      });
      ctx.restore(); ctx.globalAlpha = 1;
      break;
    }
    case 10: {
      // Warp Speed: speed lines
      for (let i = 0; i < 5; i++) {
        ctx.strokeStyle = `rgba(255,255,255,${0.3 - i * 0.04})`; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(W * 0.1, 10 + i * 9); ctx.lineTo(W, 10 + i * 9); ctx.stroke();
      }
      break;
    }
    case 11: {
      // Coral Coast: coral branch
      ctx.strokeStyle = '#FF7043'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(W * 0.5, H - 10); ctx.lineTo(W * 0.5, H - 38); ctx.stroke();
      ctx.lineWidth = 2;
      [[-16, 20], [14, 15], [-10, 8]].forEach(([dx, dy]) => {
        ctx.beginPath(); ctx.moveTo(W * 0.5, H - 10 - dy); ctx.lineTo(W * 0.5 + dx, H - 10 - dy - 10); ctx.stroke();
      });
      break;
    }
    case 12: {
      // Kelp Forest: wavy kelp
      ctx.strokeStyle = 'rgba(34,139,34,0.7)'; ctx.lineWidth = 4;
      [W * 0.3, W * 0.55, W * 0.75].forEach(kx => {
        ctx.beginPath();
        for (let ky = H - 10; ky > 5; ky -= 8) {
          const wave = Math.sin((ky * 0.04)) * 8;
          if (ky === H - 10) ctx.moveTo(kx + wave, ky);
          else ctx.lineTo(kx + wave, ky);
        }
        ctx.stroke();
      });
      break;
    }
    case 13: {
      // Underwater Caves: dark arch
      ctx.fillStyle = 'rgba(30,60,60,0.6)';
      ctx.beginPath(); ctx.arc(W * 0.5, H - 10, W * 0.38, Math.PI, 0, true); ctx.fill();
      break;
    }
    case 14: {
      // Abyss: glowing orb
      const orb = ctx.createRadialGradient(W * 0.5, H * 0.4, 2, W * 0.5, H * 0.4, 18);
      orb.addColorStop(0, 'rgba(0,255,255,0.9)'); orb.addColorStop(1, 'rgba(0,255,255,0)');
      ctx.fillStyle = orb; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = 'rgba(0,200,200,0.6)';
      ctx.beginPath(); ctx.arc(W * 0.5, H * 0.4, 10, 0, Math.PI * 2); ctx.fill();
      break;
    }
    case 15: {
      // Tsunami: big wave
      ctx.fillStyle = 'rgba(0,100,180,0.5)';
      ctx.beginPath(); ctx.ellipse(W * 0.7, H * 0.45, W * 0.4, H * 0.35, -0.3, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(150,220,255,0.6)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(W * 0.7, H * 0.45, W * 0.38, 3.5, 5.5); ctx.stroke();
      break;
    }
    case 16: {
      // Lava Fields: glowing crack
      ctx.strokeStyle = 'rgba(255,120,0,0.8)'; ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(10, H - 10); ctx.lineTo(30, H - 5); ctx.lineTo(W - 10, H - 10); ctx.stroke();
      ctx.fillStyle = 'rgba(255,80,0,0.4)';
      ctx.fillRect(0, H - 12, W, 12);
      break;
    }
    case 17: {
      // Magma Surge: rising magma streaks
      ['rgba(255,100,0,0.6)','rgba(255,150,0,0.5)','rgba(255,60,0,0.7)'].forEach((c, i) => {
        const mx = 20 + i * 28;
        ctx.fillStyle = c;
        ctx.fillRect(mx - 5, H - 10 - 28 + i * 4, 10, 28 - i * 4);
      });
      break;
    }
    case 18: {
      // Eruption: volcano peak
      ctx.fillStyle = 'rgba(60,20,0,0.9)';
      ctx.beginPath();
      ctx.moveTo(W * 0.25, H - 10); ctx.lineTo(W * 0.5, 8); ctx.lineTo(W * 0.75, H - 10); ctx.fill();
      ctx.fillStyle = 'rgba(255,80,0,0.9)';
      ctx.beginPath(); ctx.ellipse(W * 0.5, 10, 10, 5, 0, 0, Math.PI * 2); ctx.fill();
      break;
    }
    case 19: {
      // Inferno: flames
      ['rgba(255,50,0,0.8)','rgba(255,120,0,0.7)','rgba(255,200,0,0.6)'].forEach((c, i) => {
        ctx.fillStyle = c;
        const fx = 15 + i * 25;
        ctx.beginPath();
        ctx.moveTo(fx, H - 10); ctx.quadraticCurveTo(fx - 10, H - 26 - i * 5, fx, H - 38 - i * 6);
        ctx.quadraticCurveTo(fx + 10, H - 26 - i * 5, fx, H - 10);
        ctx.fill();
      });
      break;
    }
    case 20: {
      // Final Flame: epic sun + silhouette
      const sun = ctx.createRadialGradient(W * 0.5, H * 0.35, 4, W * 0.5, H * 0.35, 22);
      sun.addColorStop(0, 'rgba(255,220,50,0.9)'); sun.addColorStop(1, 'rgba(255,100,0,0)');
      ctx.fillStyle = sun; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = 'rgba(255,200,0,0.8)';
      ctx.beginPath(); ctx.arc(W * 0.5, H * 0.35, 12, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, H - 18, W, 18);
      // Tiny silhouette spikes
      ctx.fillStyle = '#000';
      [10, 28, 50, 68].forEach(sx => {
        ctx.beginPath(); ctx.moveTo(sx, H - 18); ctx.lineTo(sx + 8, H - 30); ctx.lineTo(sx + 16, H - 18); ctx.fill();
      });
      break;
    }
  }
}
