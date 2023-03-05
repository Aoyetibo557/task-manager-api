const express = require("express");
const router = express.Router();

router.get("/", (req, res) => {
  res.json({
    title: "Tasskker API",
    description:
      "Tasskker is an application that allows you to create tasks and set status an more.",
  });
});

module.exports = router;
