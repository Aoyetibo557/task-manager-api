const express = require("express");
const cors = require("cors");
const controllers = require("./controllers/index");

const app = express();

var corsOption = {
  origin: "http://localhost:9090",
  origin: "http://localhost:3000",
  credentials: true,
  optionSuccessStatus: 200,
};

app.use(cors(corsOption));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware that lifts the cors restriction for routing from a diffrent url to the server url
app.use(function (req, res, next) {
  res.setHeader("Access-Control-Allow-origin", "*");
  next();
});

// simple route
app.get("/", (req, res) => {
  const message =
    "Welcome to Tassker's REST API. To get started, please visit /api/{controller}/{route} to see the API's endpoints.";
  res.json({ message: message });
});

app.use("/api", controllers);

const PORT = process.env.PORT || 9090;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});

// if (PORT) {
//   app.listen(PORT, () => {
//     console.log(`Server is running on port ${PORT}.`);
//   });
// } else {
//   console.log("===== ERROR ====\nCREATE A .env FILE!\n===== /ERROR ====");
// }

module.exports = app;
