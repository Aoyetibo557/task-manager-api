require("dotenv").config();

// move the firebase admin initialization to services\useAuth.js

const admin = require("firebase-admin");

// const serviceAccount = require("../../firebaseservicekey.json");
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://task-manager-api-8aaa3.firebaseio.com/",
});

const db = admin.firestore();

module.exports = {
  db,
  admin,
};
