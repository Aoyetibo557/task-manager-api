const express = require("express");
const router = express.Router();

// load controller
const notification = require("../controllers/notificationController.js");

// create a new notification
router.post("/createnotification", notification.createNotification);

// get all notifications for a user
router.get("/getnotifications/:userId", notification.getUserNotifications);

// update a notification, either read or deleted
router.put(
    "/updatenotification/:notificationId",
    notification.updateNotification
);

module.exports = router;