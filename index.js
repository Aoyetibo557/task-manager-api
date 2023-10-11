const express = require("express");
const cors = require("cors");
const controllers = require("./controllers/index");
const taskRoutes = require("./routes/task.routes");
const boardRoutes = require("./routes/board.routes");
const userRoutes = require("./routes/auth.routes");
const notificationRoutes = require("./routes/notification.routes");
const fs = require("fs").promises;
const path = require("path");
require("dotenv").config();

const app = express();

var corsOption = {
    origin: [
        "https://task-manager-api-dun.vercel.app",
        "https://task-manager-client-nu.vercel.app",
        "http://localhost:9090",
        "http://localhost:3000",
    ],
    credentials: true,
    optionSuccessStatus: 200,
};

app.use(cors(corsOption));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware that lifts the cors restriction for routing from a diffrent url to the server url
app.use(function(req, res, next) {
    res.setHeader("Access-Control-Allow-origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
    res.setHeader(
        "Access-Control-Allow-Headers",
        "X-Requested-With, content-type, Authorization"
    );
    next();
});

// simple route
app.get("/", async(req, res) => {
    try {
        const filePath = path.join(__dirname, "welcome.html");
        const htmlContent = await fs.readFile(filePath, "utf8");
        res.send(htmlContent);
    } catch (error) {
        console.error("Error reading file:", error);
        res.status(500).send("Internal Server Error");
    }
});

app.use("/api", controllers);
app.use("/api/tasks", taskRoutes);
app.use("/api/boards", boardRoutes);
app.use("/api/auth", userRoutes);
app.use("/api/notifications", notificationRoutes);

const PORT = process.env.PORT || 9090;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}.`);
});

module.exports = app;