const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const dayjs = require("dayjs");
const uuid = require("uuid");

const { db, admin, ref, storage } = require("../services/useAuth.js");

async function signup(req, res) {
  // Validate request
  if (!req.body.email || !req.body.password) {
    res.status(400).send({
      message: "Content can not be empty!",
    });
    return;
  }
  try {
    const user = await getUserByEmail(req.body.email);

    if (user.email === req.body.email) {
      res.send({
        message: "Email already exists!",
        status: "error",
      });
      return;
    } else {
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(req.body.password, salt);

      const newUser = {
        email: req.body.email,
        password: hash,
      };

      const newDocUser = {
        email: req.body.email,
        password: hash,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        language: req.body.language || "en",
        country: req.body.country || "",
        phone: req.body.phone || "",
        username: req.body.username || "",
        bio: req.body.bio || "",
        timestamp: dayjs().unix(),
        tourtaken: false,
      };

      const userRecord = await admin.auth().createUser(newUser);

      const docRef = await db.collection("users").add(newDocUser);
      const userData = await docRef.get();

      const userDocId = userData.id;

      const { password: _, ...newRec } = userData.data();

      await docRef.update({ userid: userDocId });

      newRec.userid = userDocId;

      const token = jwt.sign({ id: userRecord.uid }, "secret", {
        expiresIn: 86400, // 24 hours
      });

      res.status(201).json({
        message: "User was created successfully!",
        status: "success",
        user: newRec,
        token: token,
      });
    }
  } catch (error) {
    res.status(400).json({
      message:
        error.message || "Unable to create user. Please try again later.",
    });
  }
}

async function login(req, res) {
  const emailorusername = req.body.email || req.body.username;
  const password = req.body.password;

  // Check if user with provided email exists in Firestore
  const userSnapshot = await db
    .collection("users")
    .where("email", "==", emailorusername)
    .limit(1)
    .get();

  if (userSnapshot.empty) {
    return res.send({ message: "Invalid email or password", status: "error" });
  }

  const userDoc = userSnapshot.docs[0];
  const user = userDoc.data();
  const userid = userDoc.id;

  // check if the account is disabled/deleted, if isDeleted is true, then the account is disabled/deleted
  if (user.isDeleted) {
    return res.send({
      message: "Your account has been disabled. Please contact support.",
      status: "error",
    });
  }

  // Compare provided password with hashed password stored in Firestore
  const passwordMatch = await bcrypt.compare(password, user.password);

  if (!passwordMatch) {
    return res.json({ message: "Invalid email or password", status: "error" });
  }

  const token = jwt.sign({ uid: userDoc.id }, "secret", {
    expiresIn: "1h",
  });
  user.token = token;
  user.userid = userid;
  res.status(200).json({
    message: "Login successful",
    user: user,
    userId: userid,
    token: token,
    status: "success",
  });
}

async function getUserByEmail(email) {
  try {
    const userRecord = await admin.auth().getUserByEmail(email);
    return userRecord.toJSON();
  } catch (error) {
    console.error("Error fetching user data:", error.message);
    return error.message;
  }
}

async function getUserDataByEmail(email) {
  const usersRef = db.collection("users");
  const query = usersRef.where("email", "==", email).limit(1);

  const snapshot = await query.get();

  if (snapshot.empty) {
    return null;
  }
  const doc = snapshot.docs[0];
  const userData = doc.data();
  const userId = doc.id;

  return { ...userData, id: userId };
}

// find a single user by username
async function findUserByEmail(req, res) {
  const email = req.params.email || req.body.email;

  const userRec = await getUserDataByEmail(email);
  if (
    !userRec ||
    userRec ===
      "There is no user record corresponding to the provided identifier."
  ) {
    return res.send({
      message: "User not found with email",
      email: email,
      status: "error",
    });
  }

  return res.status(200).json({
    message: "User found successfully!",
    status: "success",
    user: userRec,
  });
}

// find a single user by userid
async function findUserById(req, res) {
  const userid = req.params.userid || req.body.userid;

  const user = await db.collection("users").doc(userid).get();

  if (!user.exists) {
    return res.send({
      message: "User not found with id",
      userid: userid,
      status: "error",
    });
  }

  return res.status(200).json({
    message: "User found successfully!",
    status: "success",
    user: user.data(),
  });
}

async function updateUserByEmail(req, res) {
  const email = req.params.email || req.body.email;
  const data = req.body;

  // Check if user with provided email exists in Firestore
  const user = await getUserDataByEmail(email);

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  // Update user document with provided data
  try {
    await db.collection("users").doc(user.id).update(data);
    return res.status(200).json({ message: "User updated successfully" });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: error.message || "Internal server error" });
  }
}

// update user profile/or any other field by userid
async function updateUserById(req, res) {
  const userid = req.params.userid || req.body.userid;
  const data = req.body;

  // Check if user with provided userId exists in Firestore
  const isUser = await db.collection("users").doc(userid).get();

  if (!isUser.exists) {
    return res.send({ message: "User not found", status: "error" });
  }

  // Update user document with provided data, then get the updated document
  try {
    await db.collection("users").doc(userid).update(data);
    const user = await db.collection("users").doc(userid).get();

    return res.status(200).json({
      message: "User updated successfully",
      status: "success",
      user: user.data(),
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: error.message || "Internal server error" });
  }
}

// reset password by userid
async function resetPassword(req, res) {
  const userid = req.params.userid || req.body.userid;
  const data = req.body;

  // Check if user with provided userId exists in Firestore
  const isUser = await db.collection("users").doc(userid).get();

  if (!isUser.exists) {
    return res.send({ message: "User not found", status: "error" });
  }

  // decrypt the password in the document and compare with the new password provided
  const user = isUser.data();
  const passwordMatch = await bcrypt.compare(data.password, user.password);

  if (passwordMatch) {
    return res.send({
      message: "New password cannot be the same as the old password",
      status: "error",
    });
  }

  // encrypt the new password and update the document
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(data.password, salt);

  try {
    await db
      .collection("users")
      .doc(userid)
      .update({ password: hashedPassword });
    return res.send({
      message: "Password updated successfully",
      status: "success",
    });
  } catch (error) {
    console.error(error);
    return res.send({
      message: error.message || "Internal server error",
      status: "error",
    });
  }
}

async function getUserStats(req, res) {
  const { userid } = req.params;

  const user = await db.collection("users").doc(userid).get();

  if (!user.exists) {
    return res.send({
      message: "User not found with id",
      userid: userid,
      status: "error",
    });
  }

  const userStats = {
    totalTasks: 0,
    totalCompletedTasks: 0,
    totalIncompleteTasks: 0,
    totalTasksDueToday: 0,
    totalTasksInProgress: 0,
    totalTasksOverdue: 0,
    totalBoards: 0,
    totalPinnedTasks: 0,
  };

  // get all boards for the user
  const boards = await db
    .collection("boards")
    .where("userid", "==", userid)
    .where("boardstatus", "==", "active")
    .get();

  // get all tasks for the user
  const tasks = await db
    .collection("tasks")
    .where("userId", "==", userid)
    .get();

  // get the counts for the userStats
  userStats.totalBoards = boards.docs.length;
  userStats.totalTasks = tasks.docs.length;

  tasks.docs.forEach((task) => {
    const taskData = task.data();
    if (taskData.status === "done") {
      userStats.totalCompletedTasks++;
    }
    if (taskData.status === "doing") {
      userStats.totalTasksInProgress++;
    }
    if (taskData.status === "todo") {
      userStats.totalIncompleteTasks++;
    }
    if (taskData.pinned === true) {
      userStats.totalPinnedTasks++;
    }
  });

  res.status(200).json({
    message: "User stats found successfully!",
    status: "success",
    userStats: userStats,
  });
}

module.exports = {
  signup,
  login,
  findUserByEmail,
  updateUserByEmail,
  findUserById,
  updateUserById,
  resetPassword,
  getUserStats,
};
