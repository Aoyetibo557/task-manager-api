const { db } = require("../services/useAuth.js");
const dayjs = require("dayjs");

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
    timestamp: dayjs().unix(),
    pinned: false,
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

// get all the tasks for a user
async function getUserTasks(req, res) {
  const { userid } = req.params;

  const taskRef = db.collection("tasks");
  const snapshot = await taskRef
    .where("userId", "==", userid)
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
      status: "error",
    });

    return;
  }

  // the data could be anything in the body, so we need to get the data from the body
  const data = req.body;

  console.log("data", data);

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
async function getBoardArchivedTasks(req, res) {
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

// get all archived tasks for a user
async function getUserArchivedTasks(req, res) {
  const { userid } = req.params;
  const taskRef = db.collection("tasks");
  const snapshot = await taskRef
    .where("userId", "==", userid)
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

  // get the board name for each task and add it to the task object
  const boardRef = db.collection("boards");
  const boardSnapshot = await boardRef.get();

  if (boardSnapshot.empty) {
    return res.send({
      message: "No boards found!",
      status: "error",
    });
  }

  let boards = [];
  boardSnapshot.forEach((doc) => {
    const boardId = doc.id;
    const board = doc.data();
    boards.push({ boardId, ...board });
  });

  tasks.forEach((task) => {
    boards.forEach((board) => {
      if (task.boardId === board.boardId) {
        task.boardName = board.name;
      }
    });
  });

  res.status(200).json({
    message: "Tasks fetched successfully!",
    status: "success",
    tasks: tasks,
  });
}

// get the 4 most recent tasks for the collection tasks that have the category of active and are for the user.
// if the tasks are not up  to 4, then return all the tasks for the user that are active and recent based off the timestamp (unix time)
// it should return an array of objects with the task id and the task data, and using the board id, get the board name and add it to the task object that will be returned
async function getRecentTasks(req, res) {
  const { userid } = req.params;
  const taskRef = db.collection("tasks");
  const snapshot = await taskRef
    .where("userId", "==", userid)
    .where("category", "==", "active")
    .orderBy("timestamp", "asc")
    .limit(6)
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

  // get the board name for each task
  const boardRef = db.collection("boards");
  const boardSnapshot = await boardRef.get();

  if (boardSnapshot.empty) {
    return res.send({
      message: "No boards found!",
      status: "error",
    });
  }

  boardSnapshot.forEach((doc) => {
    const boardId = doc.id;
    const board = doc.data();

    tasks.forEach((task) => {
      if (task.boardId === boardId) {
        task.boardName = board.name;
      }
    });
  });

  res.status(200).json({
    message: "Tasks fetched successfully!",
    status: "success",
    tasks: tasks,
  });
}

// pin a task
async function pinTask(req, res) {
  const { taskid } = req.params;

  const taskRef = db.collection("tasks").doc(taskid);
  const taskData = await taskRef.get();

  if (!taskData.exists) {
    return res.status(404).json({
      message: "Task not found!",
      status: "error",
    });
  }

  await taskRef.update({ pinned: true });

  res.status(200).json({
    message: "Task pinned successfully!",
    status: "success",
  });
}

// unpin a task
async function unpinTask(req, res) {
  const { taskid } = req.params;

  const taskRef = db.collection("tasks").doc(taskid);
  const taskData = await taskRef.get();

  if (!taskData.exists) {
    return res.status(404).json({
      message: "Task not found!",
      status: "error",
    });
  }

  await taskRef.update({ pinned: false });

  res.status(200).json({
    message: "Task unpinned successfully!",
    status: "success",
  });
}

// get pinned tasks
async function getPinnedTasks(req, res) {
  const { userid } = req.params;
  const taskRef = db.collection("tasks");
  const snapshot = await taskRef
    .where("userId", "==", userid)
    .where("category", "==", "active")
    .where("pinned", "==", true)
    .orderBy("timestamp", "desc")
    .get();

  if (snapshot.empty) {
    return res.send({
      message: "No tasks found!",
      status: "error",
    });

    return;
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

// get tasks, it'll take in a userid, filters(optional), and sort(optional), filters could be category={active, deleted or archived}, another filter could be pinned(boolean) ={true or false}
async function getTasks(req, res) {
  const { userid } = req.params;
  const { filter, filterType } = req.query;

  const taskRef = db.collection("tasks");
  // let snapshot = await taskRef.where("userId", "==", userid).get();
  let snapshot =
    filterType === "pinned"
      ? await taskRef
          .where("userId", "==", userid)
          .where("pinned", "==", filter)
          .get()
      : filterType === "category" &&
        (await taskRef
          .where("userId", "==", userid)
          .where("category", "==", filter)
          .get());

  if (snapshot.empty) {
    res.send({
      message: "No tasks found!",
      status: "error",
    });

    return;
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
  getUserTasks,
  updateTask,
  deleteTask,
  updateTaskStatus,
  archiveTask,
  getBoardArchivedTasks,
  getUserArchivedTasks,
  getRecentTasks,
  pinTask,
  unpinTask,
  getPinnedTasks,
  getTasks,
};
