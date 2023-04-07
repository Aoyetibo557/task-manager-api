const { db } = require("../services/useAuth.js");
const nodeMailer = require("nodemailer");

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
    collaborators: [],
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

  // get the count of the tasks on a board
  for (let i = 0; i < boards.length; i++) {
    const tasksRef = db.collection("tasks");
    const snapshot = await tasksRef
      .where("boardId", "==", boards[i].id)
      .where("category", "==", "active")
      .get();

    if (snapshot.empty) {
      boards[i].taskCount = 0;
      continue;
    }

    let count = 0;
    snapshot.forEach((doc) => {
      count++;
    });

    boards[i].taskCount = count;
  }

  res.status(200).json({
    message: "Boards fetched successfully!",
    status: "success",
    boards: boards,
  });
}

// get the count of the tasks on a board
async function getBoardTaskCount(req, res) {
  const { boardId } = req.params;

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

  if (snapshot.empty) {
    res.send({
      message: "No tasks found!",
      status: "error",
    });
    return;
  }

  // get the count of the tasks on a board
  let count = 0;
  snapshot.forEach((doc) => {
    count++;
  });

  res.status(200).json({
    message: "Tasks count fetched successfully!",
    status: "success",
    count: count,
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

// new feature - a new field was added to the board, collaborators to store the userids of the users who have access to the board
// the collaborators field is an array of strings
// the collaborators field is empty by default
// the collaborators field is updated when a user is added to the board
// the collaborators field is updated when a user is removed from the board
/**
 * I want to add a new feature/endpoint that allows a user to add a collaborator to a board. That means, the user will be able to send invites to other users to collaborate on a board.
 * and based on the user's response, the user will be added to the board's collaborators array.
 *
 */

// add a collaborator to a board
async function addCollaborator(req, res) {
  const { boardId } = req.params;
  const { userid } = req.body;

  // if the user is not logged in ot the userid is not provided return an error
  if (!boardId) {
    res.send({
      message: "No boardId provided!",
      status: "error",
    });

    return;
  }

  if (!userid) {
    res.send({
      message: "No userid provided!",
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
    collaborators: [...board.collaborators, userid],
  };

  await db.collection("boards").doc(boardId).update(updatedBoard);

  res.send({
    message: "Collaborator added successfully!",
    status: "success",
    board: updatedBoard,
  });
}

// remove a collaborator from a board
async function removeCollaborator(req, res) {
  const { boardId } = req.params;
  const { userid } = req.body;

  // if the user is not logged in ot the userid is not provided return an error
  if (!boardId) {
    res.send({
      message: "No boardId provided!",
      status: "error",
    });

    return;
  }

  if (!userid) {
    res.send({
      message: "No userid provided!",
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
    collaborators: board.collaborators.filter(
      (collaborator) => collaborator !== userid
    ),
  };

  await db.collection("boards").doc(boardId).update(updatedBoard);

  res.send({
    message: "Collaborator removed successfully!",
    status: "success",
    board: updatedBoard,
  });
}

// get all the boards that a user is a collaborator on

// send invites to users to collaborate on a board
async function sendInvites(req, res) {
  const { boardId } = req.params;
  // the emails of the users to send invites to will be an array of strings
  const { emails, senderemail } = req.body;

  console.log(emails, senderemail, boardId);

  // if the user is not logged in ot the emails are not provided return an error
  if (!emails) {
    res.send({
      message: "No emails provided!",
      status: "error",
    });

    return;
  }

  // send the invites to the users using the email service
  const message = {
    // the emails of the users to send invites to will be an array of
    to: emails.map((email) => email),
    from: senderemail,
    subject: `You have been invited to collaborate on a board by ${senderemail} on ${boardId}`,
    text: `You have been invited to collaborate on a board by ${senderemail} on ${boardId}`,
    html: `<strong>You have been invited to collaborate on a board ${senderemail} on ${boardId} </strong>`,
  };

  // try {
  //   const transporter = nodeMailer.createTransport({
  //     service: "gmail",
  //     host: "smtp.gmail.com",
  //     port: 587,
  //     secure: false,
  //     auth: {
  //       user: process.env.EMAIL || senderemail,
  //       pass: process.env.PASSWORD,
  //   });

  //   transporter.sendMail(message, (err, info) => {
  //     if (err) {
  //       console.log(err);
  //       res.send({
  //         message: "Error sending invites!",
  //         status: "error",
  //       });
  //     } else {
  //       console.log(info);
  //       res.send({
  //         message: "Invites sent successfully!",
  //         status: "success",
  //         info: info,
  //       });
  //     }
  //   });
  // } catch (err) {
  //   res.send({
  //     message: "Error sending invites!",
  //     status: "error",
  //   });
  // }
}

module.exports = {
  createBoard,
  getBoardByName,
  getUserBoards,
  getBoardTaskCount,
  clearBoardTasks,
  deleteBoard,
  addCollaborator,
  removeCollaborator,
  sendInvites,
};
