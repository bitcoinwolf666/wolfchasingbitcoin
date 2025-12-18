// ================= CANVAS SETUP =================
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
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.setTransform(canvas.width / cssW, 0, 0, canvas.height / cssH, 0, 0);
}
window.addEventListener("resize", fitCanvas);
fitCanvas();

// ================= GAME STATE =================
const groundY = 245;
let worldSpeed = 3.2;
let gameOver = false;
let groundOffset = 0;

let score = 0;
let bestScore = Number(localStorage.getItem("bestScore") || 0);

// ================= PLAYER =================
const wolf = {
  x: 120,
  y: groundY,
  w: 46,
  h: 36,
  vy: 0,
  onGround: true
};

// ================= ENTITIES =================
let coins = [];
let coinTimer = 0;
let obstacles = [];
let obstacleTimer = 0;

// ================= INPUT =================
const keys = { jump: false };
document.addEventListener("keydown", e => {
  if (e.key === " ") keys.jump = true;
  if (e.key.toLowerCase() === "r" && gameOver) restart();
});
document.addEventListener("keyup", e => {
  if (e.key === " ") keys.jump = false;
});
canvas.addEventListener("pointerdown", () => keys.jump = true);
canvas.addEventListener("pointerup", () => keys.jump = false);

// ================= HELPERS =================
function rectHitsRect(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x &&
         a.y < b.y + b.h && a.y + a.h > b.y;
}
function squareHitsCircle(sx, sy, sw, sh, cx, cy, cr) {
  const x = Math.max(sx, Math.min(cx, sx + sw));
  const y = Math.max(sy, Math.min(cy, sy + sh));
  return (cx - x) ** 2 + (cy - y) ** 2 <= cr ** 2;
}

// ================= SPAWN =================
function spawnCoin() {
  const yOptions = [groundY + 6, groundY - 40, groundY - 90];
  coins.push({ x: cssW + 30, y: yOptions[Math.random()*3|0], r: 12 });
}
function spawnObstacle() {
  obstacles.push({ x: cssW + 40, y: groundY + 8, w: 32, h: 28 });
}

// ================= DRAW =================
function drawBackground() {
  const g = ctx.createLinearGradient(0,0,0,cssH);
  g.addColorStop(0,"#0b0f17");
  g.addColorStop(1,"#06080d");
  ctx.fillStyle = g;
  ctx.fillRect(0,0,cssW,cssH);
}

function drawGround() {
  ctx.fillStyle = "rgba(255,255,255,.15)";
  ctx.fillRect(0, groundY + wolf.h, cssW, 2);

  groundOffset += worldSpeed;
  ctx.strokeStyle = "rgba(255,255,255,.08)";
  for (let x = -(groundOffset % 40); x < cssW; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, groundY + wolf.h + 6);
    ctx.lineTo(x + 18, groundY + wolf.h + 6);
    ctx.stroke();
  }
}

function drawCoin(c) {
  ctx.beginPath();
  ctx.arc(c.x, c.y, c.r, 0, Math.PI*2);
  ctx.fillStyle = "#ffd54a";
  ctx.fill();
  ctx.fillStyle = "#0b0f17";
  ctx.font = "16px system-ui";
  ctx.fillText("₿", c.x-6, c.y+6);
}

function drawObstacle(o) {
  ctx.fillStyle = "#ff4d6d";
  ctx.beginPath();
  ctx.moveTo(o.x, o.y+o.h);
  ctx.lineTo(o.x+o.w/2, o.y);
  ctx.lineTo(o.x+o.w, o.y+o.h);
  ctx.fill();
}

// ================= WOLF (NEW SHAPE) =================
function drawWolf() {
  const x = wolf.x, y = wolf.y;
  ctx.fillStyle = "#f1f1f1";

  // body
  ctx.fillRect(x+12, y+12, 26, 18);

  // head
  ctx.beginPath();
  ctx.arc(x+10, y+18, 8, 0, Math.PI*2);
  ctx.f

