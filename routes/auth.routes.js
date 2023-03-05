const express = require("express");
const router = express.Router();

const auth = require("../controllers/authController.js");

// Create a new user
router.post("/signup", auth.signup);

// Login a user
router.post("/login", auth.login);

// retrieve a user
router.get("/finduser/:email", auth.findUserByEmail);

// update a user by email
router.put("/updateuser/:email", auth.updateUserByEmail);

module.exports = router;
