const canvas = document.createElement("canvas");
canvas.width = 500;
canvas.height = 250;
document.body.appendChild(canvas);

const ctx = canvas.getContext("2d");

let wolfX = 200;

// keyboard state
const keys = {
  left: false,
  right: false
};

document.addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft") keys.left = true;
  if (e.key === "ArrowRight") keys.right = true;
});

document.addEventListener("keyup", (e) => {
  if (e.key === "ArrowLeft") keys.left = false;
  if (e.key === "ArrowRight") keys.right = false;
});

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // move wolf
  if (keys.left) wolfX -= 3;
  if (keys.right) wolfX += 3;

  // keep wolf on screen
  if (wolfX < 0) wolfX = 0;
  if (wolfX > canvas.width - 40) wolfX = canvas.width - 40;

  // draw wolf (still a square for now)
  ctx.fillStyle = "white";
  ctx.fillRect(wolfX, 150, 40, 40);

  requestAnimationFrame(draw);
}

draw();
