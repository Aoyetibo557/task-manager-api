const { db } = require("../services/useAuth.js");

const getBoardByName = async (name) => {
  const boardRef = db.collection("boards");
  const snapshot = await boardRef.where("name", "==", name).limit(1).get();

  if (snapshot.empty) {
    return {
      name: "",
    };
  }

  let board = {};
  snapshot.forEach((doc) => {
    board = doc.data();
  });

  return board;
};

async function createBoard(req, res) {
  // Validate request
  if (!req.body) {
    res.status(400).send({
      message: "Content can not be empty!",
    });
    return;
  }
  const { name, userid } = req.body;

  // check if the name is already taken
  const board = await getBoardByName(name);

  if (board.name === name || board.name.toLowerCase() === name.toLowerCase()) {
    res.send({
      message: "Board name already exists!",
      status: "error",
    });
    return;
  }

  const newBoard = {
    name,
    userid,
    boardstatus: "active",
  };

  const docRef = await db.collection("boards").add(newBoard);
  const boardData = await docRef.get();

  // const { tasks: _, ...newRec } = boardData.data();
  const newRec = boardData.data();

  res.status(201).json({
    message: "Board created successfully!",
    status: "success",
    board: newRec,
  });
}

async function getUserBoards(req, res) {
  const { userid } = req.params;

  // if the user is not logged in ot the userid is not provided return an error
  if (!userid) {
    res.send({
      message: "No userid provided!",
      status: "error",
    });
    return;
  }

  const boardRef = db.collection("boards");
  const snapshot = await boardRef
    .where("userid", "==", userid)
    .where("boardstatus", "==", "active")
    .get();

  if (snapshot.empty) {
    res.send({
      message: "No boards found!",
      status: "error",
    });
    return;
  }

  let boards = [];
  snapshot.forEach((doc) => {
    const newData = doc.data();
    newData.id = doc.id;
    boards.push(newData);
  });

  res.status(200).json({
    message: "Boards fetched successfully!",
    status: "success",
    boards: boards,
  });
}

// clear tasks on a board, all the tasks with that boardId, thier category will be set to deleted
async function clearBoardTasks(req, res) {
  const { boardId } = req.params;
  console.log("boardId", boardId);

  // if the user is not logged in ot the userid is not provided return an error
  if (!boardId) {
    res.send({
      message: "No boardId provided!",
      status: "error",
    });
    return;
  }

  const tasksRef = db.collection("tasks");
  const snapshot = await tasksRef.where("boardId", "==", boardId).get();

  console.log("snapshot", snapshot.empty);

  if (snapshot.empty) {
    res.send({
      message: "No tasks found!",
      status: "error",
    });
    return;
  }

  let tasks = [];
  snapshot.forEach((doc) => {
    const newData = doc.data();
    newData.id = doc.id;
    tasks.push(newData);
  });

  // if the tasks are found and are already deleted, return a message
  if (tasks.every((task) => task.category === "deleted")) {
    res.send({
      message: "Board is empty!",
      status: "error",
    });
    return;
  }

  // update the tasks
  tasks.forEach(async (task) => {
    const { id, ...rest } = task;
    const updatedTask = {
      ...rest,
      category: "deleted",
    };
    await db.collection("tasks").doc(id).update(updatedTask);
  });

  res.status(200).json({
    message: "Tasks cleared successfully!",
    status: "success",
    tasks: tasks,
  });
}

// delete a board, set the boardstatus to deleted
async function deleteBoard(req, res) {
  const { boardId } = req.params;

  // if the user is not logged in ot the userid is not provided return an error
  if (!boardId) {
    res.send({
      message: "No boardId provided!",
      status: "error",
    });

    return;
  }

  const boardRef = db.collection("boards").doc(boardId);
  const snapshot = await boardRef.get();

  if (snapshot.empty) {
    res.send({
      message: "No board found!",
      status: "error",
    });
    return;
  }

  const board = snapshot.data();

  // if the board is already deleted, return a message
  if (board.boardstatus === "deleted") {
    res.send({
      message: "Board is already deleted!",
      status: "error",
    });
    return;
  }

  // update the board
  const updatedBoard = {
    ...board,
    boardstatus: "deleted",
  };

  // clear the tasks on the board
  const tasksRef = db.collection("tasks");
  const tasksSnapshot = await tasksRef.where("boardId", "==", boardId).get();

  if (!tasksSnapshot.empty) {
    let tasks = [];
    tasksSnapshot.forEach((doc) => {
      const newData = doc.data();
      newData.id = doc.id;
      tasks.push(newData);
    });

    // if the tasks are found and are already deleted, return a message
    // if (tasks.every((task) => task.category === "deleted")) {
    //   res.send({
    //     message: "Board is empty!",
    //     status: "error",
    //   });
    //   // return;
    // }

    // update the tasks
    tasks.forEach(async (task) => {
      const { id, ...rest } = task;
      const updatedTask = {
        ...rest,
        category: "deleted",
      };

      await db.collection("tasks").doc(id).update(updatedTask);
    });
  }

  await db.collection("boards").doc(boardId).update(updatedBoard);

  res.status(200).json({
    message: "Board deleted successfully!",
    status: "success",
    board: updatedBoard,
  });
}

module.exports = {
  createBoard,
  getBoardByName,
  getUserBoards,
  clearBoardTasks,
  deleteBoard,
};
