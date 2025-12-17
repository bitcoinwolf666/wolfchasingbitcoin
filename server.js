const express = require("express");
const app = express();

// simple test page
app.get("/", (req, res) => {
  res.send("Hello! The server is working 🙂");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
