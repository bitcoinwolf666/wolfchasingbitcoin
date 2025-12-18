const canvas = document.createElement("canvas");
canvas.width = 400;
canvas.height = 200;
document.body.appendChild(canvas);

const ctx = canvas.getContext("2d");

let wolfX = 20;

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // draw wolf (simple square for now)
  ctx.fillStyle = "white";
  ctx.fillRect(wolfX, 120, 40, 40);

  wolfX += 1;
  if (wolfX > canvas.width) wolfX = -40;

  requestAnimationFrame(draw);
}

draw();
