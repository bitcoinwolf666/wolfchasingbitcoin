// Mount canvas inside #gameMount (not directly into body)
const mount = document.getElementById("gameMount");
const statusEl = document.getElementById("status");

const cssW = 880;   // logical size (CSS)
const cssH = 340;

const canvas = document.createElement("canvas");
canvas.width = cssW;
canvas.height = cssH;
mount.appendChild(canvas);

const ctx = canvas.getContext("2d");

// --- Retina / crisp scaling ---
function fitCanvas() {
  const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1)); // cap at 2 for perf
  const rect = canvas.getBoundingClientRect();

  // if CSS size changes, keep internal resolution crisp
  const targetW = Math.floor(rect.width * dpr);
  const targetH = Math.floor(rect.height * dpr);

  if (canvas.width !== targetW || canvas.height !== targetH) {
    canvas.width = targetW;
    canvas.height = targetH;
  }

  // map "game units" to actual pixels
  ctx.setTransform(canvas.width / cssW, 0, 0, canvas.height / cssH, 0, 0);
}
window.addEventListener("resize", fitCanvas);

// Set CSS size once
canvas.style.width = "100%";
canvas.style.maxWidth = cssW + "px";
fitCanvas();

// --- GAME SETTINGS ---
const groundY = 245;
let worldSpeed = 3.2;
let gameOver = false;
let groundOffset = 0;

// --- SCORE ---
let score = 0;
let bestScore = Number(localStorage.getItem("bestScore") || 0);

// --- WOLF (player) ---
const wolf = {
  x: 120,
  y: groundY,
  w: 42,
  h: 42,
  vy: 0,
  onGround: true
};

// --- COINS & OBSTACLES ---
let coins = [];
let coinTimer = 0;

let obstacles = [];
let obstacleTimer = 0;

// --- INPUT ---
const keys = { jump: false };
document.addEventListener("keydown", (e) => {
  if (e.key === " ") keys.jump = true;
  if (e.key.toLowerCase() === "r" && gameOver) restart();
});
document.addEventListener("keyup", (e) => {
  if (e.key === " ") keys.jump = false;
});

// --- MOBILE: tap to jump (minimal) ---
canvas.addEventListener("pointerdown", () => {
  // first user gesture also enables audio on mobile, if you add sounds later
  keys.jump = true;
});
canvas.addEventListener("pointerup", () => {
  keys.jump = false;
});

// --- Subtle parallax stars ---
const starsFar = Array.from({ length: 40 }, () => ({
  x: Math.random() * cssW,
  y: Math.random() * cssH,
  r: 1 + Math.random() * 1,
  s: 0.15 + Math.random() * 0.25
}));

const starsNear = Array.from({ length: 18 }, () => ({
  x: Math.random() * cssW,
  y: Math.random() * cssH,
  r: 1.2 + Math.random() * 1.4,
  s: 0.35 + Math.random() * 0.35
}));

// --- COLLISIONS ---
function squareHitsCircle(sx, sy, sw, sh, cx, cy, cr) {
  const closestX = Math.max(sx, Math.min(cx, sx + sw));
  const closestY = Math.max(sy, Math.min(cy, sy + sh));
  const dx = cx - closestX;
  const dy = cy - closestY;
  return (dx * dx + dy * dy) <= (cr * cr);
}
function rectHitsRect(a, b) {
  return (a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y);
}

// --- SPAWN ---
function spawnCoin() {
  const x = cssW + 30;
  const yOptions = [groundY + 8, groundY - 44, groundY - 98];
  const y = yOptions[(Math.random() * yOptions.length) | 0];
  coins.push({ x, y, r: 12, collected: false });
}

function spawnObstacle() {
  const x = cssW + 50;
  const h = 32;
  const y = groundY + (wolf.h - h);
  obstacles.push({ x, y, w: 38, h });
}

// --- DRAW HELPERS (minimal) ---
function drawBackground() {
  // soft gradient
  const g = ctx.createLinearGradient(0, 0, 0, cssH);
  g.addColorStop(0, "#0b0f17");
  g.addColorStop(1, "#070a10");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, cssW, cssH);

  // stars far
  ctx.fillStyle = "rgba(255,255,255,0.18)";
  for (const s of starsFar) {
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
  }

  // stars near
  ctx.fillStyle = "rgba(255,255,255,0.28)";
  for (const s of starsNear) {
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawGround() {
  // base line
  ctx.fillStyle = "rgba(255,255,255,0.18)";
  ctx.fillRect(0, groundY + wolf.h, cssW, 2);

  // moving stripes (very subtle)
  groundOffset += worldSpeed;
  ctx.strokeStyle = "rgba(255,255,255,0.10)";
  ctx.lineWidth = 2;

  for (let x = -(groundOffset % 44); x < cssW; x += 44) {
    ctx.beginPath();
    ctx.moveTo(x, groundY + wolf.h + 5);
    ctx.lineTo(x + 18, groundY + wolf.h + 5);
    ctx.stroke();
  }
}

function drawHUD() {
  ctx.fillStyle = "rgba(255,255,255,0.92)";
  ctx.font = "16px system-ui";
  ctx.fillText(`Score ${score}`, 16, 26);

  ctx.fillStyle = "rgba(255,255,255,0.60)";
  ctx.fillText(`Best ${bestScore}`, 16, 48);

  if (gameOver) {
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.fillRect(0, 0, cssW, cssH);

    ctx.fillStyle = "rgba(255,255,255,0.92)";
    ctx.font = "28px system-ui";
    ctx.fillText("Game Over", cssW / 2 - 70, cssH / 2 - 6);

    ctx.fillStyle = "rgba(255,255,255,0.65)";
    ctx.font = "16px system-ui";
    ctx.fillText("Press R to restart", cssW / 2 - 74, cssH / 2 + 22);
  }
}

function drawCoin(c) {
  ctx.beginPath();
  ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
  ctx.fillStyle = "#ffd54a";
  ctx.fill();
  ctx.closePath();

  ctx.fillStyle = "#0b0f17";
  ctx.font = "16px system-ui";
  ctx.fillText("₿", c.x - 6, c.y + 6);
}

function drawObstacle(o) {
  ctx.fillStyle = "#ff4d6d";
  ctx.beginPath();
  ctx.moveTo(o.x, o.y + o.h);
  ctx.lineTo(o.x + o.w / 2, o.y);
  ctx.lineTo(o.x + o.w, o.y + o.h);
  ctx.closePath();
  ctx.fill();
}

function drawWolf() {
  // body
  ctx.fillStyle = "rgba(255,255,255,0.95)";
  ctx.fillRect(wolf.x, wolf.y, wolf.w, wolf.h);

  // ears (minimal)
  ctx.beginPath();
  ctx.moveTo(wolf.x + 9, wolf.y);
  ctx.lineTo(wolf.x + 16, wolf.y - 10);
  ctx.lineTo(wolf.x + 23, wolf.y);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(wolf.x + 22, wolf.y);
  ctx.lineTo(wolf.x + 29, wolf.y - 10);
  ctx.lineTo(wolf.x + 36, wolf.y);
  ctx.closePath();
  ctx.fill();

  // eye
  ctx.fillStyle = "#0b0f17";
  ctx.fillRect(wolf.x + 29, wolf.y + 14, 4, 4);
}

// --- UPDATE ---
function updateParallax() {
  const far = worldSpeed * 0.15;
  const near = worldSpeed * 0.35;

  for (const s of starsFar) {
    s.x -= far * s.s;
    if (s.x < -10) s.x = cssW + 10;
  }
  for (const s of starsNear) {
    s.x -= near * s.s;
    if (s.x < -10) s.x = cssW + 10;
  }
}

function updateWolf() {
  if (keys.jump && wolf.onGround) {
    wolf.vy = -10.2;
    wolf.onGround = false;
  }

  wolf.vy += 0.52; // gravity
  wolf.y += wolf.vy;

  if (wolf.y >= groundY) {
    wolf.y = groundY;
    wolf.vy = 0;
    wolf.onGround = true;
  }
}

function updateCoins() {
  coinTimer += 1;
  if (coinTimer > 62) {
    spawnCoin();
    coinTimer = 0;
  }

  for (const c of coins) c.x -= worldSpeed;
  coins = coins.filter(c => c.x > -60 && !c.collected);

  for (const c of coins) {
    if (c.collected) continue;
    const hit = squareHitsCircle(wolf.x, wolf.y, wolf.w, wolf.h, c.x, c.y, c.r);
    if (hit) {
      c.collected = true;
      score += 1;
      if (score % 6 === 0) worldSpeed += 0.25; // gentle speed curve
    }
  }
}

function updateObstacles() {
  obstacleTimer += 1;
  if (obstacleTimer > 115) {
    if (Math.random() < 0.72) spawnObstacle();
    obstacleTimer = 0;
  }

  for (const o of obstacles) o.x -= worldSpeed;
  obstacles = obstacles.filter(o => o.x > -90);

  const wolfRect = { x: wolf.x, y: wolf.y, w: wolf.w, h: wolf.h };
  for (const o of obstacles) {
    if (rectHitsRect(wolfRect, o)) {
      gameOver = true;
      if (score > bestScore) {
        bestScore = score;
        localStorage.setItem("bestScore", String(bestScore));
      }
      statusEl.textContent = "Game Over";
      break;
    }
  }
}

// --- RENDER ---
function render() {
  drawBackground();
  drawGround();

  for (const c of coins) drawCoin(c);
  for (const o of obstacles) drawObstacle(o);

  drawWolf();
  drawHUD();
}

// --- RESTART ---
function restart() {
  worldSpeed = 3.2;
  score = 0;
  coins = [];
  obstacles = [];
  coinTimer = 0;
  obstacleTimer = 0;
  groundOffset = 0;

  wolf.y = groundY;
  wolf.vy = 0;
  wolf.onGround = true;

  gameOver = false;
  statusEl.textContent = "Ready";
}

// --- LOOP ---
function loop() {
  fitCanvas();

  if (!gameOver) {
    updateParallax();
    updateWolf();
    updateCoins();
    updateObstacles();
    statusEl.textContent = "Playing";
  }

  render();
  requestAnimationFrame(loop);
}

loop();

