// characters.js - Character definitions, physics configs, and canvas draw functions

const CHARACTERS = [
  {
    id: 'cube',
    name: 'Cubey',
    color: '#FF6B9D',
    outline: '#C7336E',
    trailColor: 'rgba(255,107,157,0.4)',
    mechanic: 'TAP TWICE TO DOUBLE JUMP',
    description: 'The classic! Tap once or twice to double jump!',
    maxJumps: 2,
    jumpVel: -14,
    gravity: 0.65,
    maxFall: 18,
    popular: true,
  },
  {
    id: 'ship',
    name: 'Shippy',
    color: '#4DC3FF',
    outline: '#1A8FCC',
    trailColor: 'rgba(77,195,255,0.4)',
    mechanic: 'HOLD TO FLY UP',
    description: 'Hold the screen to fly up. Release to fall!',
    maxJumps: 0,
    jumpVel: 0,
    gravity: 0.4,
    maxFall: 12,
    popular: true,
  },
  {
    id: 'ball',
    name: 'Bally',
    color: '#4DFFB4',
    outline: '#1ACC80',
    trailColor: 'rgba(77,255,180,0.4)',
    mechanic: 'TAP TO FLIP GRAVITY',
    description: 'Tap to flip gravity and bounce!',
    maxJumps: 1,
    jumpVel: -14,
    gravity: 0.65,
    maxFall: 18,
    popular: true,
  },
  {
    id: 'star',
    name: 'Starry',
    color: '#FFD700',
    outline: '#CC9900',
    trailColor: 'rgba(255,215,0,0.4)',
    mechanic: 'TAP TWICE TO DOUBLE JUMP',
    description: 'Jump twice in the air for extra reach!',
    maxJumps: 2,
    jumpVel: -13,
    gravity: 0.58,
    maxFall: 16,
    popular: false,
  },
  {
    id: 'teardrop',
    name: 'Droppy',
    color: '#C77DFF',
    outline: '#8B3FCC',
    trailColor: 'rgba(199,125,255,0.4)',
    mechanic: 'TAP TWICE FOR FLOATY DOUBLE JUMP',
    description: 'Floats slowly in the air. Double tap for extra reach!',
    maxJumps: 2,
    jumpVel: -11,
    gravity: 0.52,
    maxFall: 14,
    popular: false,
  },
  {
    id: 'rocket',
    name: 'Rockety',
    color: '#FF7043',
    outline: '#BF360C',
    trailColor: 'rgba(255,112,67,0.4)',
    mechanic: 'TAP TWICE FOR TURBO DOUBLE JUMP',
    description: 'Jumps super high twice, but falls fast. Watch out!',
    maxJumps: 2,
    jumpVel: -19,
    gravity: 1.0,
    maxFall: 22,
    popular: false,
  }
];

function getCharacter(id) {
  return CHARACTERS.find(c => c.id === id) || CHARACTERS[0];
}

// ─── Shared drawing helpers ──────────────────────────────────────────────────

function drawFace(ctx, cx, cy, eyeR) {
  // Eyes
  ctx.fillStyle = '#222';
  ctx.beginPath();
  ctx.arc(cx - eyeR * 1.6, cy - eyeR * 0.3, eyeR * 0.9, 0, Math.PI * 2);
  ctx.arc(cx + eyeR * 1.6, cy - eyeR * 0.3, eyeR * 0.9, 0, Math.PI * 2);
  ctx.fill();

  // Eye shine
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(cx - eyeR * 1.3, cy - eyeR * 0.6, eyeR * 0.35, 0, Math.PI * 2);
  ctx.arc(cx + eyeR * 1.9, cy - eyeR * 0.6, eyeR * 0.35, 0, Math.PI * 2);
  ctx.fill();

  // Smile
  ctx.beginPath();
  ctx.arc(cx, cy + eyeR * 0.5, eyeR * 1.3, 0.1, Math.PI - 0.1);
  ctx.strokeStyle = '#222';
  ctx.lineWidth = eyeR * 0.6;
  ctx.lineCap = 'round';
  ctx.stroke();
}

// ─── Character draw functions ────────────────────────────────────────────────

function drawCube(ctx, x, y, size, rotation, char) {
  ctx.save();
  ctx.translate(x + size / 2, y + size / 2);
  ctx.rotate(rotation);

  const r = size * 0.18;
  ctx.beginPath();
  ctx.roundRect(-size / 2, -size / 2, size, size, r);
  ctx.fillStyle = char.color;
  ctx.fill();
  ctx.strokeStyle = char.outline;
  ctx.lineWidth = 3.5;
  ctx.stroke();

  // Inner square decoration
  ctx.beginPath();
  ctx.roundRect(-size * 0.3, -size * 0.3, size * 0.6, size * 0.6, r * 0.5);
  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  ctx.lineWidth = 2;
  ctx.stroke();

  drawFace(ctx, 0, size * 0.05, size * 0.09);
  ctx.restore();
}

function drawShip(ctx, x, y, size, char) {
  ctx.save();
  ctx.translate(x + size / 2, y + size / 2);

  // Fuselage
  ctx.beginPath();
  ctx.moveTo(size * 0.52, 0);              // Nose
  ctx.lineTo(-size * 0.4, -size * 0.38);  // Top back
  ctx.lineTo(-size * 0.5, 0);             // Rear center
  ctx.lineTo(-size * 0.4, size * 0.38);   // Bottom back
  ctx.closePath();
  ctx.fillStyle = char.color;
  ctx.fill();
  ctx.strokeStyle = char.outline;
  ctx.lineWidth = 3;
  ctx.stroke();

  // Cockpit window
  ctx.beginPath();
  ctx.ellipse(size * 0.05, 0, size * 0.16, size * 0.14, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.fill();
  ctx.strokeStyle = char.outline;
  ctx.lineWidth = 2;
  ctx.stroke();

  drawFace(ctx, size * 0.05, 0, size * 0.06);
  ctx.restore();
}

function drawBall(ctx, x, y, size, rotation, gravFlipped, char) {
  ctx.save();
  ctx.translate(x + size / 2, y + size / 2);
  if (gravFlipped) ctx.scale(1, -1);
  ctx.rotate(rotation);

  ctx.beginPath();
  ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
  ctx.fillStyle = char.color;
  ctx.fill();
  ctx.strokeStyle = char.outline;
  ctx.lineWidth = 3.5;
  ctx.stroke();

  // Stripe
  ctx.save();
  ctx.clip();
  ctx.beginPath();
  ctx.moveTo(-size / 2, -size * 0.15);
  ctx.lineTo(size / 2, -size * 0.15);
  ctx.lineTo(size / 2, size * 0.15);
  ctx.lineTo(-size / 2, size * 0.15);
  ctx.closePath();
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  ctx.fill();
  ctx.restore();

  drawFace(ctx, 0, 0, size * 0.09);
  ctx.restore();
}

function drawStar(ctx, x, y, size, rotation, char) {
  ctx.save();
  ctx.translate(x + size / 2, y + size / 2);
  ctx.rotate(rotation);

  const outerR = size / 2;
  const innerR = size / 4.2;
  const pts = 5;

  ctx.beginPath();
  for (let i = 0; i < pts * 2; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const angle = (i * Math.PI / pts) - Math.PI / 2;
    if (i === 0) ctx.moveTo(r * Math.cos(angle), r * Math.sin(angle));
    else ctx.lineTo(r * Math.cos(angle), r * Math.sin(angle));
  }
  ctx.closePath();
  ctx.fillStyle = char.color;
  ctx.fill();
  ctx.strokeStyle = char.outline;
  ctx.lineWidth = 3;
  ctx.stroke();

  drawFace(ctx, 0, size * 0.05, size * 0.085);
  ctx.restore();
}

function drawTeardrop(ctx, x, y, size, rotation, char) {
  ctx.save();
  ctx.translate(x + size / 2, y + size / 2);
  ctx.rotate(rotation);

  ctx.beginPath();
  ctx.moveTo(0, size * 0.5);
  ctx.bezierCurveTo(-size * 0.55, size * 0.2, -size * 0.55, -size * 0.3, 0, -size * 0.5);
  ctx.bezierCurveTo(size * 0.55, -size * 0.3, size * 0.55, size * 0.2, 0, size * 0.5);
  ctx.fillStyle = char.color;
  ctx.fill();
  ctx.strokeStyle = char.outline;
  ctx.lineWidth = 3;
  ctx.stroke();

  // Shine
  ctx.beginPath();
  ctx.ellipse(-size * 0.1, -size * 0.2, size * 0.1, size * 0.16, -0.4, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.fill();

  drawFace(ctx, 0, -size * 0.05, size * 0.09);
  ctx.restore();
}

function drawRocket(ctx, x, y, size, char, thrustActive) {
  ctx.save();
  ctx.translate(x + size / 2, y + size / 2);

  // Flame (when thrusting)
  if (thrustActive) {
    const flameH = size * 0.35 + Math.random() * size * 0.15;
    ctx.beginPath();
    ctx.moveTo(-size * 0.22, size * 0.48);
    ctx.lineTo(0, size * 0.48 + flameH);
    ctx.lineTo(size * 0.22, size * 0.48);
    ctx.fillStyle = '#FFA500';
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(-size * 0.12, size * 0.48);
    ctx.lineTo(0, size * 0.48 + flameH * 0.6);
    ctx.lineTo(size * 0.12, size * 0.48);
    ctx.fillStyle = '#FFE500';
    ctx.fill();
  }

  // Body
  ctx.beginPath();
  ctx.moveTo(0, -size * 0.5);            // nose tip
  ctx.lineTo(-size * 0.28, size * 0.22); // left body
  ctx.lineTo(-size * 0.28, size * 0.48); // left base
  ctx.lineTo(size * 0.28, size * 0.48);  // right base
  ctx.lineTo(size * 0.28, size * 0.22);  // right body
  ctx.closePath();
  ctx.fillStyle = char.color;
  ctx.fill();
  ctx.strokeStyle = char.outline;
  ctx.lineWidth = 3;
  ctx.stroke();

  // Fins
  ctx.beginPath();
  ctx.moveTo(-size * 0.28, size * 0.2);
  ctx.lineTo(-size * 0.5, size * 0.48);
  ctx.lineTo(-size * 0.28, size * 0.48);
  ctx.fillStyle = char.outline;
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(size * 0.28, size * 0.2);
  ctx.lineTo(size * 0.5, size * 0.48);
  ctx.lineTo(size * 0.28, size * 0.48);
  ctx.fillStyle = char.outline;
  ctx.fill();

  // Window
  ctx.beginPath();
  ctx.arc(0, -size * 0.08, size * 0.14, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.fill();
  ctx.strokeStyle = char.outline;
  ctx.lineWidth = 2;
  ctx.stroke();

  drawFace(ctx, 0, -size * 0.08, size * 0.06);
  ctx.restore();
}

// Master dispatch
function drawCharacter(ctx, char, player, size) {
  const { x, y, rotation, gravityFlipped, isHolding } = player;
  switch (char.id) {
    case 'cube':     drawCube(ctx, x, y, size, rotation, char); break;
    case 'ship':     drawShip(ctx, x, y, size, char); break;
    case 'ball':     drawBall(ctx, x, y, size, rotation, gravityFlipped, char); break;
    case 'star':     drawStar(ctx, x, y, size, rotation, char); break;
    case 'teardrop': drawTeardrop(ctx, x, y, size, rotation, char); break;
    case 'rocket':   drawRocket(ctx, x, y, size, char, isHolding); break;
  }
}
