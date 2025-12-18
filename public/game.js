const canvas = document.createElement("canvas");
canvas.width = 700;
canvas.height = 300;
document.body.appendChild(canvas);

const ctx = canvas.getContext("2d");

// --- GAME SETTINGS ---
const groundY = 210;
let worldSpeed = 3;

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

// spawn a new coin every so often
let coinTimer = 0;

const keys = { jump: false };

document.addEventListener("keydown", (e) => {
  if (e.key === " ") keys.jump = true;
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

function spawnCoin() {
  const x = canvas.width + 30;
  const yOptions = [groundY + 10, groundY - 40, groundY - 90];
  const y = yOptions[Math.floor(Math.random() * yOptions.length)];
  coins.push({ x, y, r: 12, collected: false });
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
  for (const c of coins) {
    c.x -= worldSpeed;
  }

  // remove coins off screen
  coins = coins.filter(c => c.x > -50 && !c.collected);

  // collision
  for (const c of coins) {
    if (c.collected) continue;
    const hit = squareHitsCircle(wolf.x, wolf.y, wolf.w, wolf.h, c.x, c.y, c.r);
    if (hit) {
      c.collected = true;
      score += 1;
      // speed slowly increases like Sonic
      if (score % 5 === 0) worldSpeed += 0.3;
    }
  }
}

function draw() {
  // background
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#0b0f17";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // HUD
  ctx.fillStyle = "white";
  ctx.font = "18px system-ui";
  ctx.fillText("Score: " + score, 12, 24);
  ctx.fillText("Speed: " + worldSpeed.toFixed(1), 12, 46);
  ctx.fillText("Jump: SPACE", 12, 68);

  // ground
  ctx.fillStyle = "#444";
  ctx.fillRect(0, groundY + 40, canvas.width, 5);

  // coins
  for (const c of coins) drawCoin(c);

  // wolf
  ctx.fillStyle = "white";
  ctx.fillRect(wolf.x, wolf.y, wolf.w, wolf.h);

  requestAnimationFrame(loop);
}

function loop() {
  updateWolf();
  updateCoins();
  draw();
}

loop();
