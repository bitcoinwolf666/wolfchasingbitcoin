const canvas = document.createElement("canvas");
canvas.width = 700;
canvas.height = 300;
document.body.appendChild(canvas);

const ctx = canvas.getContext("2d");

// --- GAME SETTINGS ---
const groundY = 210;
let worldSpeed = 3;
let gameOver = false;

// --- WOLF (player) ---
const wolf = {
  x: 120,
  y: groundY,
  w: 40,
  h: 40,
  vy: 0,
  onGround: true
};

// --- SCORE ---
let score = 0;

// --- COINS ---
let coins = [];
let coinTimer = 0;

// --- OBSTACLES (spikes) ---
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

// collision: square vs circle
function squareHitsCircle(sx, sy, sw, sh, cx, cy, cr) {
  const closestX = Math.max(sx, Math.min(cx, sx + sw));
  const closestY = Math.max(sy, Math.min(cy, sy + sh));
  const dx = cx - closestX;
  const dy = cy - closestY;
  return (dx * dx + dy * dy) <= (cr * cr);
}

// collision: square vs rectangle
function rectHitsRect(a, b) {
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  );
}

function spawnCoin() {
  const x = canvas.width + 30;
  const yOptions = [groundY + 10, groundY - 40, groundY - 90];
  const y = yOptions[Math.floor(Math.random() * yOptions.length)];
  coins.push({ x, y, r: 12, collected: false });
}

function spawnObstacle() {
  const x = canvas.width + 40;
  const h = 30;
  // spikes sit on ground
  const y = groundY + (40 - h);
  obstacles.push({ x, y, w: 36, h });
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
  // simple spike triangle
  ctx.fillStyle = "#ff4d6d";
  ctx.beginPath();
  ctx.moveTo(o.x, o.y + o.h);
  ctx.lineTo(o.x + o.w / 2, o.y);
  ctx.lineTo(o.x + o.w, o.y + o.h);
  ctx.closePath();
  ctx.fill();
}

function updateWolf() {
  // jump
  if (keys.jump && wolf.onGround) {
    wolf.vy = -10;
    wolf.onGround = false;
  }

  // gravity
  wolf.vy += 0.5;
  wolf.y += wolf.vy;

  // ground collision
  if (wolf.y >= groundY) {
    wolf.y = groundY;
    wolf.vy = 0;
    wolf.onGround = true;
  }
}

function updateCoins() {
  // spawn coins
  coinTimer += 1;
  if (coinTimer > 60) { // about once per second
    spawnCoin();
    coinTimer = 0;
  }

  // move coins left
  for (const c of coins) c.x -= worldSpeed;

  // remove off screen or collected
  coins = coins.filter(c => c.x > -50 && !c.collected);

  // collision
  for (const c of coins) {
    if (c.collected) continue;
    const hit = squareHitsCircle(wolf.x, wolf.y, wolf.w, wolf.h, c.x, c.y, c.r);
    if (hit) {
      c.collected = true;
      score += 1;
      if (score % 5 === 0) worldSpeed += 0.3; // speed up like Sonic
    }
  }
}

function updateObstacles() {
  obstacleTimer += 1;

  // spawn obstacle sometimes (not too often)
  if (obstacleTimer > 110) {
    // small randomness so it's not predictable
    if (Math.random() < 0.7) spawnObstacle();
    obstacleTimer = 0;
  }

  // move obstacles
  for (const o of obstacles) o.x -= worldSpeed;

  // remove off screen
  obstacles = obstacles.filter(o => o.x > -80);

  // collision with wolf
  const wolfRect = { x: wolf.x, y: wolf.y, w: wolf.w, h: wolf.h };
  for (const o of obstacles) {
    if (rectHitsRect(wolfRect, o)) {
      gameOver = true;
      break;
    }
  }
}

function drawHUD() {
  ctx.fillStyle = "white";
  ctx.font = "18px system-ui";
  ctx.fillText("Score: " + score, 12, 24);
  ctx.fillText("Speed: " + worldSpeed.toFixed(1), 12, 46);
  ctx.fillText("Jump: SPACE", 12, 68);

  if (gameOver) {
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "white";
    ctx.font = "28px system-ui";
    ctx.fillText("Game Over", canvas.width / 2 - 70, canvas.height / 2 - 10);

    ctx.font = "18px system-ui";
    ctx.fillText("Press R to restart", canvas.width / 2 - 85, canvas.height / 2 + 25);
  }
}

function drawScene() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // background
  ctx.fillStyle = "#0b0f17";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // ground
  ctx.fillStyle = "#444";
  ctx.fillRect(0, groundY + 40, canvas.width, 5);

  // coins
  for (const c of coins) drawCoin(c);

  // obstacles
  for (const o of obstacles) drawObstacle(o);

  // wolf
  ctx.fillStyle = "white";
  ctx.fillRect(wolf.x, wolf.y, wolf.w, wolf.h);

  drawHUD();
}

function restart() {
  worldSpeed = 3;
  score = 0;
  coins = [];
  obstacles = [];
  coinTimer = 0;
  obstacleTimer = 0;

  wolf.y = groundY;
  wolf.vy = 0;
  wolf.onGround = true;

  gameOver = false;
}

function loop() {
  if (!gameOver) {
    updateWolf();
    updateCoins();
    updateObstacles();
  }
  drawScene();
  requestAnimationFrame(loop);
}

loop();
