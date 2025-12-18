// ================= UI HOOKS =================
const mount = document.getElementById("gameMount");
const statusEl = document.getElementById("status");
const tipEl = document.getElementById("tip");

const overlay = document.getElementById("overlay");
const overlayTitle = document.getElementById("overlayTitle");
const overlayText = document.getElementById("overlayText");
const btnStart = document.getElementById("btnStart");
const btnHow = document.getElementById("btnHow");

// ================= CANVAS =================
const cssW = 900;
const cssH = 340;

const canvas = document.createElement("canvas");
mount.appendChild(canvas);
const ctx = canvas.getContext("2d");

canvas.style.width = "100%";
canvas.style.maxWidth = cssW + "px";

function fitCanvas() {
  const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
  const rect = canvas.getBoundingClientRect();
  const targetW = Math.floor(rect.width * dpr);
  const targetH = Math.floor(rect.height * dpr);
  if (canvas.width !== targetW || canvas.height !== targetH) {
    canvas.width = targetW;
    canvas.height = targetH;
  }
  ctx.setTransform(canvas.width / cssW, 0, 0, canvas.height / cssH, 0, 0);
}
window.addEventListener("resize", fitCanvas);
fitCanvas();

// ================= GAME STATE =================
const STATE = { START:"start", PLAY:"play", PAUSE:"pause", OVER:"over" };
let state = STATE.START;

const groundY = 245;
let worldSpeed = 3.1;
let groundOffset = 0;

let score = 0;
let bestScore = Number(localStorage.getItem("bestScore") || 0);

let coins = [];
let coinTimer = 0;

let obstacles = [];
let obstacleTimer = 0;

let hitFlash = 0;

// ================= INPUT =================
const keys = { jump:false };

document.addEventListener("keydown", (e) => {
  if (e.key === " ") keys.jump = true;

  if (e.key.toLowerCase() === "p") {
    if (state === STATE.PLAY) setState(STATE.PAUSE);
    else if (state === STATE.PAUSE) setState(STATE.PLAY);
  }

  if (e.key.toLowerCase() === "r") restart();

  // start from overlay with space
  if (e.key === " " && state === STATE.START) start();
});
document.addEventListener("keyup", (e) => {
  if (e.key === " ") keys.jump = false;
});

// mobile tap
canvas.addEventListener("pointerdown", () => {
  keys.jump = true;
  if (state === STATE.START) start();
});
canvas.addEventListener("pointerup", () => keys.jump = false);

// buttons
btnStart.onclick = () => start();
btnHow.onclick = () => {
  overlayTitle.textContent = "How to play";
  overlayText.innerHTML = "Jump with <b>SPACE</b> or <b>Tap</b>. Avoid spikes. Collect ₿. Press <b>P</b> to pause. Press <b>R</b> to restart.";
};

// ================= PLAYER =================
const wolf = {
  x: 140,
  y: groundY,
  w: 86,
  h: 34,
  vy: 0,
  onGround: true
};

// ================= WOLF SPRITE (SVG) =================
// A minimal wolf silhouette (real wolf shape), rendered as an image and drawn to canvas.
const wolfSVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="220" height="120" viewBox="0 0 220 120">
  <path fill="#F5F5F5" d="
    M28 70
    L50 56
    L68 52
    L88 54
    L104 44
    L126 42
    L150 50
    L170 46
    L188 54
    L196 70
    L182 78
    L170 92
    L152 94
    L138 86
    L118 90
    L98 92
    L78 88
    L58 92
    L44 86
    L40 74
    L28 70
    Z
  "/>
  <!-- ear -->
  <path fill="#F5F5F5" d="M92 42 L102 26 L110 48 Z"/>
  <!-- tail -->
  <path fill="#F5F5F5" d="M188 54 L214 46 L204 70 Z"/>
  <!-- snout -->
  <path fill="#F5F5F5" d="M28 70 L8 62 L10 78 Z"/>
  <!-- eye -->
  <rect x="64" y="60" width="6" height="6" fill="#0b0f17"/>
  <!-- leg cutouts -->
  <rect x="92" y="86" width="10" height="24" fill="#0b0f17"/>
  <rect x="134" y="84" width="10" height="26" fill="#0b0f17"/>
</svg>
`;

const wolfImg = new Image();
wolfImg.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(wolfSVG);

// ================= BACKGROUND (parallax) =================
const starsFar = Array.from({ length: 40 }, () => ({
  x: Math.random() * cssW, y: Math.random() * cssH,
  r: 1 + Math.random(), s: 0.15 + Math.random() * 0.25
}));
const starsNear = Array.from({ length: 18 }, () => ({
  x: Math.random() * cssW, y: Math.random() * cssH,
  r: 1.2 + Math.random() * 1.4, s: 0.35 + Math.random() * 0.35
}));

// ================= COLLISIONS =================
function squareHitsCircle(sx, sy, sw, sh, cx, cy, cr) {
  const closestX = Math.max(sx, Math.min(cx, sx + sw));
  const closestY = Math.max(sy, Math.min(cy, sy + sh));
  const dx = cx - closestX;
  const dy = cy - closestY;
  return dx * dx + dy * dy <= cr * cr;
}
function rectHitsRect(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

// ================= SPAWN =================
function spawnCoin() {
  const x = cssW + 30;
  const ys = [groundY + 10, groundY - 38, groundY - 86];
  const y = ys[(Math.random() * ys.length) | 0];
  coins.push({ x, y, r: 12, pop: 0 });
}
function spawnObstacle() {
  const x = cssW + 50;
  const h = 28;
  const y = groundY + (wolf.h - h);
  obstacles.push({ x, y, w: 36, h });
}

// ================= UI STATE =================
function setState(next) {
  state = next;
  if (state === STATE.START) {
    overlay.classList.add("show");
    overlayTitle.textContent = "WolfRun";
    overlayText.innerHTML = "Press <b>SPACE</b> (or tap) to jump. Avoid spikes. Collect ₿.";
    statusEl.textContent = "Ready";
  }
  if (state === STATE.PLAY) {
    overlay.classList.remove("show");
    statusEl.textContent = "Playing";
  }
  if (state === STATE.PAUSE) {
    overlay.classList.add("show");
    overlayTitle.textContent = "Paused";
    overlayText.innerHTML = "Press <b>P</b> to resume.";
    statusEl.textContent = "Paused";
  }
  if (state === STATE.OVER) {
    overlay.classList.add("show");
    overlayTitle.textContent = "Game Over";
    overlayText.innerHTML = `Score <b>${score}</b> • Best <b>${bestScore}</b><br/>Press <b>R</b> to restart.`;
    statusEl.textContent = "Game Over";
  }
}

function start() {
  if (state === STATE.START || state === STATE.PAUSE) setState(STATE.PLAY);
}

function restart() {
  worldSpeed = 3.1;
  groundOffset = 0;
  score = 0;
  coins = [];
  obstacles = [];
  coinTimer = 0;
  obstacleTimer = 0;
  hitFlash = 0;

  wolf.y = groundY;
  wolf.vy = 0;
  wolf.onGround = true;

  setState(STATE.START);
}

// ================= DRAW =================
function drawBackground() {
  const g = ctx.createLinearGradient(0, 0, 0, cssH);
  g.addColorStop(0, "#0b0f17");
  g.addColorStop(1, "#070a10");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, cssW, cssH);

  ctx.fillStyle = "rgba(255,255,255,0.18)";
  for (const s of starsFar) {
    ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fill();
  }
  ctx.fillStyle = "rgba(255,255,255,0.28)";
  for (const s of starsNear) {
    ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fill();
  }
}

function drawGround() {
  ctx.fillStyle = "rgba(255,255,255,0.18)";
  ctx.fillRect(0, groundY + wolf.h + 2, cssW, 2);

  groundOffset += worldSpeed;
  ctx.strokeStyle = "rgba(255,255,255,0.10)";
  ctx.lineWidth = 2;

  for (let x = -(groundOffset % 44); x < cssW; x += 44) {
    ctx.beginPath();
    ctx.moveTo(x, groundY + wolf.h + 8);
    ctx.lineTo(x + 18, groundY + wolf.h + 8);
    ctx.stroke();
  }
}

function drawCoin(c) {
  const scale = c.pop > 0 ? 1 + c.pop * 0.12 : 1;
  ctx.save();
  ctx.translate(c.x, c.y);
  ctx.scale(scale, scale);
  ctx.translate(-c.x, -c.y);

  ctx.beginPath();
  ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
  ctx.fillStyle = "#ffd54a";
  ctx.fill();

  ctx.fillStyle = "#0b0f17";
  ctx.font = "16px system-ui";
  ctx.fillText("₿", c.x - 6, c.y + 6);

  ctx.restore();
}

function drawObstacle(o) {
  ctx.fillStyle = "rgba(255,77,109,0.95)";
  ctx.beginPath();
  ctx.moveTo(o.x, o.y + o.h);
  ctx.lineTo(o.x + o.w / 2, o.y);
  ctx.lineTo(o.x + o.w, o.y + o.h);
  ctx.closePath();
  ctx.fill();
}

function drawWolf() {
  // small bob for life
  const t = performance.now() * 0.010;
  const bob = wolf.onGround && state === STATE.PLAY ? Math.sin(t) * 1.2 : 0;

  // Draw SVG wolf as a real silhouette
  const drawX = wolf.x;
  const drawY = wolf.y + bob - 18; // lift sprite a bit
  const drawW = wolf.w;
  const drawH = wolf.h + 30;

  if (wolfImg.complete) {
    ctx.drawImage(wolfImg, drawX, drawY, drawW, drawH);
  } else {
    // fallback simple silhouette while image loads
    ctx.fillStyle = "rgba(245,245,245,0.92)";
    ctx.fillRect(wolf.x, wolf.y, wolf.w, wolf.h);
  }
}

function drawHUD() {
  ctx.fillStyle = "rgba(255,255,255,0.92)";
  ctx.font = "16px system-ui";
  ctx.fillText(`Score ${score}`, 16, 26);

  ctx.fillStyle = "rgba(255,255,255,0.60)";
  ctx.fillText(`Best ${bestScore}`, 16, 48);
}

// ================= UPDATE =================
function updateParallax() {
  const far = worldSpeed * 0.15;
  const near = worldSpeed * 0.35;

  for (const s of starsFar) { s.x -= far * s.s; if (s.x < -10) s.x = cssW + 10; }
  for (const s of starsNear) { s.x -= near * s.s; if (s.x < -10) s.x = cssW + 10; }
}

function updateWolf() {
  if (keys.jump && wolf.onGround) {
    wolf.vy = -10.2;
    wolf.onGround = false;
  }
  wolf.vy += 0.52;
  wolf.y += wolf.vy;

  if (wolf.y >= groundY) {
    wolf.y = groundY;
    wolf.vy = 0;
    wolf.onGround = true;
  }
}

function updateCoins() {
  coinTimer++;
  if (coinTimer > 62) { spawnCoin(); coinTimer = 0; }

  for (const c of coins) c.x -= worldSpeed;

  // animate coin pop
  for (const c of coins) c.pop = Math.max(0, c.pop - 0.08);

  coins = coins.filter(c => c.x > -60);

  for (let i = coins.length - 1; i >= 0; i--) {
    const c = coins[i];
    const hit = squareHitsCircle(wolf.x, wolf.y, wolf.w, wolf.h, c.x, c.y, c.r);
    if (hit) {
      score++;
      c.pop = 1;
      coins.splice(i, 1);
      if (score % 6 === 0) worldSpeed += 0.25;
    }
  }
}

function updateObstacles() {
  obstacleTimer++;
  if (obstacleTimer > 115) {
    if (Math.random() < 0.72) spawnObstacle();
    obstacleTimer = 0;
  }

  for (const o of obstacles) o.x -= worldSpeed;
  obstacles = obstacles.filter(o => o.x > -90);

  const wolfRect = { x: wolf.x, y: wolf.y, w: wolf.w, h: wolf.h };

  for (const o of obstacles) {
    if (rectHitsRect(wolfRect, o)) {
      hitFlash = 1;
      gameOver = true;
      bestScore = Math.max(bestScore, score);
      localStorage.setItem("bestScore", String(bestScore));
      setState(STATE.OVER);
      break;
    }
  }
}

// ================= RENDER =================
function render() {
  drawBackground();
  drawGround();

  for (const c of coins) drawCoin(c);
  for (const o of obstacles) drawObstacle(o);

  drawWolf();
  drawHUD();

  // hit flash
  if (hitFlash > 0) {
    ctx.fillStyle = `rgba(255,77,109,${0.12 * hitFlash})`;
    ctx.fillRect(0, 0, cssW, cssH);
    hitFlash = Math.max(0, hitFlash - 0.08);
  }
}

// ================= LOOP =================
function loop() {
  fitCanvas();

  if (state === STATE.PLAY && !gameOver) {
    updateParallax();
    updateWolf();
    updateCoins();
    updateObstacles();
  }

  render();
  requestAnimationFrame(loop);
}

// Start in START state
setState(STATE.START);
loop();
