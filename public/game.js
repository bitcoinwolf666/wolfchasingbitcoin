const canvas = document.createElement("canvas");
canvas.width = 600;
canvas.height = 280;
document.body.appendChild(canvas);

const ctx = canvas.getContext("2d");

// wolf
let wolfX = 120;
let wolfY = 160;
let wolfVelocityY = 0;
let isOnGround = true;

const groundY = 200;

// score
let score = 0;

// coins (we start with 3 coins)
let coins = [
  { x: 350, y: 170, r: 12, collected: false },
  { x: 450, y: 120, r: 12, collected: false },
  { x: 540, y: 170, r: 12, collected: false }
];

// keyboard
const keys = { left: false, right: false, jump: false };

document.addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft") keys.left = true;
  if (e.key === "ArrowRight") keys.right = true;
  if (e.key === " ") keys.jump = true;
});

document.addEventListener("keyup", (e) => {
  if (e.key === "ArrowLeft") keys.left = false;
  if (e.key === "ArrowRight") keys.right = false;
  if (e.key === " ") keys.jump = false;
});

// helper: simple collision between square and circle
function squareHitsCircle(sx, sy, sw, sh, cx, cy, cr) {
  const closestX = Math.max(sx, Math.min(cx, sx + sw));
  const closestY = Math.max(sy, Math.min(cy, sy + sh));
  const dx = cx - closestX;
  const dy = cy - closestY;
  return (dx * dx + dy * dy) <= (cr * cr);
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

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // HUD
  ctx.fillStyle = "white";
  ctx.font = "18px system-ui";
  ctx.fillText("Score: " + score, 12, 24);

  // movement
  if (keys.left) wolfX -= 3;
  if (keys.right) wolfX += 3;
  wolfX = Math.max(0, Math.min(canvas.width - 40, wolfX));

  // jump
  if (keys.jump && isOnGround) {
    wolfVelocityY = -10;
    isOnGround = false;
  }

  // gravity
  wolfVelocityY += 0.5;
  wolfY += wolfVelocityY;

  // ground collision
  if (wolfY >= groundY) {
    wolfY = groundY;
    wolfVelocityY = 0;
    isOnGround = true;
  }

  // draw ground
  ctx.fillStyle = "#444";
  ctx.fillRect(0, groundY + 40, canvas.width, 5);

  // draw coins + collision
  for (const c of coins) {
    if (c.collected) continue;

    drawCoin(c);

    const hit = squareHitsCircle(wolfX, wolfY, 40, 40, c.x, c.y, c.r);
    if (hit) {
      c.collected = true;
      score += 1;
    }
  }

  // draw wolf
  ctx.fillStyle = "white";
  ctx.fillRect(wolfX, wolfY, 40, 40);

  requestAnimationFrame(draw);
}

draw();
