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

// finduserbyid
router.get("/finduserbyid/:userid", auth.findUserById);

// update a user by id
router.put("/updateuserbyid/:userid", auth.updateUserById);

// reset password by userid
router.put("/resetpassword/:userid", auth.resetPassword);

// get user stats
router.get("/userstats/:userid", auth.getUserStats);

module.exports = router;
