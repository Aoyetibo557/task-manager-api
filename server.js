const express = require("express");
const cors = require("cors");

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
    "Welcome to Tasskker's REST API. To get started, please visit /api/{route} to see the API's endpoints.";
  res.json({ message: message });
});

app.use("/api", require("./controllers"));

const PORT = process.env.PORT || 9090;
if (PORT) {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}.`);
  });
} else {
  console.log("===== ERROR ====\nCREATE A .env FILE!\n===== /ERROR ====");
}
("C:UsersaoyetDesktopPersonal Programs\task manager\firebaseservicekey.json");
