const mount = document.getElementById("gameMount");
const statusEl = document.getElementById("status");

const cssW = 880;
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

// Game
const groundY = 245;
let worldSpeed = 3.2;
let gameOver = false;
let groundOffset = 0;

let score = 0;
let bestScore = Number(localStorage.getItem("bestScore") || 0);

const wolf = {
  x: 120,
  y: groundY,
  w: 66,     // wider, more animal-like
  h: 28,     // lower profile
  vy: 0,
  onGround: true
};

let coins = [];
let coinTimer = 0;
let obstacles = [];
let obstacleTimer = 0;

const keys = { jump: false };

document.addEventListener("keydown", (e) => {
  if (e.key === " ") keys.jump = true;
  if (e.key.toLowerCase() === "r" && gameOver) restart();
});
document.addEventListener("keyup", (e) => {
  if (e.key === " ") keys.jump = false;
});

// tap to jump (mobile)
canvas.addEventListener("pointerdown", () => (keys.jump = true));
canvas.addEventListener("pointerup", () => (keys.jump = false));

// Parallax stars
const starsFar = Array.from({ length: 40 }, () => ({
  x: Math.random() * cssW,
  y: Math.random() * cssH,
  r: 1 + Math.random(),
  s: 0.15 + Math.random() * 0.25
}));
const starsNear = Array.from({ length: 18 }, () => ({
  x: Math.random() * cssW,
  y: Math.random() * cssH,
  r: 1.2 + Math.random() * 1.4,
  s: 0.35 + Math.random() * 0.35
}));

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

function spawnCoin() {
  const x = cssW + 30;
  const ys = [groundY + 10, groundY - 38, groundY - 86];
  const y = ys[(Math.random() * ys.length) | 0];
  coins.push({ x, y, r: 12, collected: false });
}
function spawnObstacle() {
  const x = cssW + 50;
  const h = 28;
  const y = groundY + (wolf.h - h);
  obstacles.push({ x, y, w: 36, h });
}

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
  ctx.fillStyle = "rgba(255,77,109,0.95)";
  ctx.beginPath();
  ctx.moveTo(o.x, o.y + o.h);
  ctx.lineTo(o.x + o.w / 2, o.y);
  ctx.lineTo(o.x + o.w, o.y + o.h);
  ctx.closePath();
  ctx.fill();
}

// Wolf silhouette: long snout + sharp ear + tail + angled back
function drawWolf() {
  const col = "rgba(245,245,245,0.92)";
  const cut = "#0b0f17";
  const t = performance.now() * 0.008;
  const bob = wolf.onGround && !gameOver ? Math.sin(t) * 1.2 : 0;
  const step = wolf.onGround && !gameOver ? Math.sin(t * 1.8) * 2 : 0;

  const x = wolf.x;
  const y = wolf.y + bob;

  ctx.fillStyle = col;

  // body (polygon with angled back)
  ctx.beginPath();
  ctx.moveTo(x + 22, y + 10);
  ctx.lineTo(x + 46, y + 6);
  ctx.lineTo(x + 60, y + 14);
  ctx.lineTo(x + 58, y + 26);
  ctx.lineTo(x + 28, y + 26);
  ctx.closePath();
  ctx.fill();

  // head
  ctx.beginPath();
  ctx.arc(x + 16, y + 14, 8, 0, Math.PI * 2);
  ctx.fill();

  // snout
  ctx.beginPath();
  ctx.moveTo(x + 12, y + 14);
  ctx.lineTo(x - 6, y + 10);
  ctx.lineTo(x - 6, y + 18);
  ctx.closePath();
  ctx.fill();

  // ear
  ctx.beginPath();
  ctx.moveTo(x + 16, y + 4);
  ctx.lineTo(x + 20, y + 14);
  ctx.lineTo(x + 10, y + 12);
  ctx.closePath();
  ctx.fill();

  // tail
  ctx.beginPath();
  ctx.moveTo(x + 60, y + 16);
  ctx.lineTo(x + 74, y + 10);
  ctx.lineTo(x + 70, y + 22);
  ctx.closePath();
  ctx.fill();

  // leg “cuts”
  ctx.fillStyle = cut;
  ctx.fillRect(x + 32, y + 22, 6, 10);
  ctx.fillRect(x + 46, y + 22 + step, 6, 10);

  // eye
  ctx.fillRect(x + 14, y + 12, 2.5, 2.5);
}

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
  coinTimer += 1;
  if (coinTimer > 62) { spawnCoin(); coinTimer = 0; }

  for (const c of coins) c.x -= worldSpeed;
  coins = coins.filter(c => c.x > -60 && !c.collected);

  for (const c of coins) {
    if (c.collected) continue;
    const hit = squareHitsCircle(wolf.x, wolf.y, wolf.w, wolf.h, c.x, c.y, c.r);
    if (hit) {
      c.collected = true;
      score += 1;
      if (score % 6 === 0) worldSpeed += 0.25;
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

function render() {
  drawBackground();
  drawGround();
  for (const c of coins) drawCoin(c);
  for (const o of obstacles) drawObstacle(o);
  drawWolf();
  drawHUD();
}

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

