const express = require("express");
const router = express.Router();

//load controller
const appConfigController = require("./appconfig.js");
const authConfigController = require("../routes/auth.routes.js");
const boardConfigController = require("../routes/board.routes.js");
const taskConfigController = require("../routes/task.routes.js");
const notificationController = require("../routes/notification.routes.js");

router.use("/", appConfigController);
router.use("/auth", authConfigController);
router.use("/boards", boardConfigController);
router.use("/tasks", taskConfigController);
router.use("/notifications", notificationController);

module.exports = router;
