const express = require("express");
const router = express.Router();

//load controller
const task = require("../controllers/taskController.js");

// create a new task
router.post("/createtask", task.createTask);

// get all tasks for a board
router.get("/getboardtasks/:boardid", task.getBoardTasks);

// update a task
router.put("/updatetask/:taskid", task.updateTask);

// delete a task
router.delete("/deletetask/:taskid", task.deleteTask);

// update task status
router.put("/updatetaskstatus/:taskid", task.updateTaskStatus);

// archive a task
router.put("/archivetask/:taskid", task.archiveTask);

// get all archived tasks for a board
router.get("/getarchivedtasks/:boardid", task.getArchivedTasks);

module.exports = router;
