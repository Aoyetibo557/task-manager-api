require("dotenv").config();

// move the firebase admin initialization to services\useAuth.js

const admin = require("firebase-admin");

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://task-manager-api-8aaa3.firebaseio.com/",
});

const db = admin.firestore();
const storage = admin.storage();
const { ref } = storage;

module.exports = {
  db,
  admin,
  storage,
  ref,
};
