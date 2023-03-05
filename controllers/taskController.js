const { db } = require("../services/useAuth.js");

async function createTask(req, res) {
  // Validate request
  if (!req.body) {
    res.status(400).send({
      message: "Content can not be empty!",
    });
    return;
  }
  const { name, description, status, boardId, userId } = req.body;

  const newTask = {
    name,
    description,
    status,
    boardId,
    userId,
    category: "active",
  };

  const docRef = await db.collection("tasks").add(newTask);
  const taskData = await docRef.get();

  const newRec = taskData.data();
  const taskId = taskData.id;

  newRec.taskId = taskId;

  // update the doc with the task id
  const updateRec = await docRef.update(newRec);

  if (!updateRec) {
    return res.send({
      message: "Error Updaing Record. Task not found!",
      status: "error",
      task: newRec,
    });
  }

  res.status(201).json({
    message: "Task created successfully!",
    status: "success",
    task: newRec,
  });
}

async function getBoardTasks(req, res) {
  const { boardid } = req.params;
  const taskRef = db.collection("tasks");
  const snapshot = await taskRef
    .where("boardId", "==", boardid)
    .where("category", "==", "active")
    .get();

  if (snapshot.empty) {
    return res.send({
      message: "No tasks found!",
      status: "error",
    });
  }

  let tasks = [];
  snapshot.forEach((doc) => {
    const taskId = doc.id;
    const task = doc.data();
    tasks.push({ taskId, ...task });
  });

  res.status(200).json({
    message: "Tasks fetched successfully!",
    status: "success",
    tasks: tasks,
  });
}

// update task
async function updateTask(req, res) {
  const { taskid } = req.params;
  // Validate request
  if (!req.body) {
    res.status(400).send({
      message: "Content can not be empty!",
    });

    return;
  }

  // the data could be anything in the body, so we need to get the data from the body
  const data = req.body;

  const taskRef = db.collection("tasks").doc(taskid);
  const taskData = await taskRef.get();

  if (!taskData.exists) {
    return res.status(404).json({
      message: "Task not found!",
      status: "error",
    });
  }

  await taskRef.update(data);

  res.status(200).json({
    message: "Task updated successfully!",
    status: "success",
  });
}

// delete a task
async function deleteTask(req, res) {
  const { taskid } = req.params;

  const taskRef = db.collection("tasks").doc(taskid);
  const taskData = await taskRef.get();

  if (!taskData.exists) {
    return res.status(404).json({
      message: "Task not found!",
      status: "error",
    });
  }

  // delete should just update the category to deleted
  await taskRef.update({ category: "deleted" });

  res.status(200).json({
    message: "Task deleted successfully!",
    status: "success",
  });
}

// update task status
async function updateTaskStatus(req, res) {
  const { taskid } = req.params;
  // Validate request
  if (!req.body) {
    res.status(400).send({
      message: "Content can not be empty!",
    });

    return;
  }

  const { status } = req.body;

  const taskRef = db.collection("tasks").doc(taskid);
  const taskData = await taskRef.get();

  if (!taskData.exists) {
    return res.status(404).json({
      message: "Task not found!",
      status: "error",
    });
  }

  await taskRef.update({ status });

  res.status(200).json({
    message: "Task updated successfully!",
    status: "success",
  });
}

// archive a task
async function archiveTask(req, res) {
  const { taskid } = req.params;

  const taskRef = db.collection("tasks").doc(taskid);
  const taskData = await taskRef.get();

  if (!taskData.exists) {
    return res.json({
      message: "Task not found!",
      status: "error",
    });
  }

  await taskRef.update({ category: "archived" });

  res.status(200).json({
    message: "Task archived successfully!",
    status: "success",
  });
}

// get all archived tasks for a board
async function getArchivedTasks(req, res) {
  const { boardid } = req.params;
  const taskRef = db.collection("tasks");
  const snapshot = await taskRef
    .where("boardId", "==", boardid)
    .where("category", "==", "archived")
    .get();

  if (snapshot.empty) {
    return res.send({
      message: "No tasks found!",
      status: "error",
    });
  }

  let tasks = [];
  snapshot.forEach((doc) => {
    const taskId = doc.id;
    const task = doc.data();
    tasks.push({ taskId, ...task });
  });

  res.status(200).json({
    message: "Tasks fetched successfully!",
    status: "success",
    tasks: tasks,
  });
}

module.exports = {
  createTask,
  getBoardTasks,
  updateTask,
  deleteTask,
  updateTaskStatus,
  archiveTask,
  getArchivedTasks,
};
