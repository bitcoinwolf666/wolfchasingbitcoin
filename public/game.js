const canvas = document.createElement("canvas");
canvas.width = 500;
canvas.height = 250;
document.body.appendChild(canvas);

const ctx = canvas.getContext("2d");

// wolf position & movement
let wolfX = 200;
let wolfY = 150;
let wolfVelocityY = 0;
let isOnGround = true;

const groundY = 190;

// keyboard state
const keys = {
  left: false,
  right: false,
  jump: false
};

document.addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft") keys.left = true;
  if (e.key === "ArrowRight") keys.right = true;
  if (e.key === " ") keys.jump = true; // space bar
});

document.addEventListener("keyup", (e) => {
  if (e.key === "ArrowLeft") keys.left = false;
  if (e.key === "ArrowRight") keys.right = false;
  if (e.key === " ") keys.jump = false;
});

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // horizontal movement
  if (keys.left) wolfX -= 3;
  if (keys.right) wolfX += 3;

  // keep on screen
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

  // draw wolf
  ctx.fillStyle = "white";
  ctx.fillRect(wolfX, wolfY, 40, 40);

  requestAnimationFrame(draw);
}

draw();
