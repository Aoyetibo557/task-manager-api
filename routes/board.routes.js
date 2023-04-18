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

// get board tasks count
router.get("/getboardtaskscount/:boardId", board.getBoardTaskCount);

// clear tasks on a board
router.put("/cleartasks/:boardId", board.clearBoardTasks);

// delete a board
router.delete("/deleteboard/:boardId", board.deleteBoard);

// add collaborator to a board
router.put("/addcollaborator/:boardId", board.addCollaborator);

// remove collaborator from a board
router.put("/removecollaborator/:boardId", board.removeCollaborator);

// send invite to a collaborator
router.post("/sendinvite/:boardId", board.sendInvites);

module.exports = router;
