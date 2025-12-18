const express = require("express");
const path = require("path");

const app = express();

// Serve files from /public (index.html will load at "/")
app.use(express.static(path.join(__dirname, "public")));

// Optional health check
app.get("/health", (req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log("Server running on port " + PORT);
});
