const { db, admin } = require("../services/useAuth.js");
const dayjs = require("dayjs");
/**
 * This is the structure of a notification object:
 * notification: {
 *  title: String,
 * message: String,
 * userId: String,
 * read: Boolean,
 * type: String,
 * change: String,
 * timestamp: Date,
 * }
 *
 * and user will have a notifications array of notification objects
 */

// Create and Save a new Notification
async function createNotification(req, res) {
    if (!req.body) {
        return res.status(400).send({
            message: "Content can not be empty!",
            error: "No notification data",
        });
    }

    const { title, message, userId, read, change, type } = req.body;
    const timestamp = dayjs().format();
    const notification = {
        title,
        message,
        userId,
        read: false,
        type,
        change,
        timestamp: dayjs().unix(),
    };

    console.log(notification);

    try {
        const docRef = await db.collection("notifications").add(notification);
        const newNotification = await docRef.get();
        const newRec = newNotification.data();
        const notificationId = newNotification.id;
        newRec._id = notificationId;
        const updateRec = await docRef.update(newRec);
        if (!updateRec) {
            return res.send({
                message: "Error updating notification, Notification Not found!",
                status: "error",
            });
        }
        res.status(201).json({
            message: "Notification created successfully",
            status: "success",
            notification: newRec,
        });
    } catch (err) {
        res.status(500).json({ status: "error", error: err.message });
    }
}

// Retrieve all user  Notifications from the database.
async function getUserNotifications(req, res) {
    const { userId } = req.params;
    try {
        const notifications = [];
        const snapshot = await db
            .collection("notifications")
            .where("userId", "==", userId)
            .get();
        snapshot.forEach((doc) => {
            notifications.push(doc.data());
        });
        res.status(200).json({ notifications: notifications, status: "success" });
    } catch (err) {
        res.status(500).send({ status: "error", error: err.message });
    }
}

// update a notification (read or deleted)
async function updateNotification(req, res) {
    const { notificationId } = req.params;
    const { actionType } = req.body;

    try {
        const notificationRef = db.collection("notifications").doc(notificationId);
        const notification = await notificationRef.get();
        if (!notification.exists) {
            return res
                .status(404)
                .json({ status: "error", message: "Notification not found" });
        }
        if (actionType === "read") {
            await notificationRef.update({ read: true });

            res.status(200).json({
                status: "success",
                message: "Notification updated successfully [read]",
            });
        }
        if (actionType === "delete") {
            await notificationRef.update({ isDeleted: true });
            res.status(200).json({
                status: "success",
                message: "Notification updated successfully [deleted]",
            });
        }
    } catch (err) {
        res.status(500).json({ status: "error", error: err.message });
    }
}

module.exports = {
    createNotification,
    getUserNotifications,
    updateNotification,
};