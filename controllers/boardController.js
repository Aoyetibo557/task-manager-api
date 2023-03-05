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
  const snapshot = await boardRef.where("userid", "==", userid).get();

  if (snapshot.empty) {
    return {
      name: "",
    };
  }

  let boards = [];
  snapshot.forEach((doc) => {
    const newData = doc.data();
    newData.id = doc.id;
    boards.push(newData);
  });

  res.send({
    message: "Boards fetched successfully!",
    status: "success",
    boards: boards,
  });
}

module.exports = {
  createBoard,
  getBoardByName,
  getUserBoards,
};
