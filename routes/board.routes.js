const express = require("express");
const router = express.Router();

//load controller
const board = require("../controllers/boardController.js");

//create a new board
router.post("/createboard", board.createBoard);

// get board by name
router.get("/getboard/:name", board.getBoardByName);

//  get user boards
router.get("/getuserboards/:userid", board.getUserBoards);

module.exports = router;
