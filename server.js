const express = require("express");
const path = require("path");

const app = express();

// serve the public folder
app.use(express.static(path.join(__dirname, "public")));

// health check (useful for testing)
app.get("/health", (req, res) => {
  res.json({ ok: true });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
