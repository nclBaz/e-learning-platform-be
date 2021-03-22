const express = require("express");
const listEndPoints = require("express-list-endpoints");
const cors = require("cors");
const mongoose = require("mongoose");
const passport = require("passport")
const cookieParser = require("cookie-parser")
const oauth = require("./services/auth/oauth")

const {
  notFoundHandler,
  forbiddenHandler,
  badRequestHandler,
  genericErrorHandler,
} = require("./errorHandlers");

const userRoutes = require("./services/users/index");

const videoRoutes = require("./services/videos");


const server = express();


server.use(express.json());
server.use(cookieParser())
server.use(passport.initialize())

const whitelist = ["http://localhost:3000"]
const corsOptions = {
  origin: (origin, callback) => {
    if (whitelist.indexOf(origin) !== -1 || !origin) {
      callback(null, true)
    } else {
      callback(new Error("Not allowed by CORS"))
    }
  },
  credentials: true,
}

server.use(cors(corsOptions));
server.use("/users", userRoutes);
server.use("/videos", videoRoutes);

server.use(badRequestHandler);
server.use(forbiddenHandler);
server.use(notFoundHandler);
server.use(genericErrorHandler);

console.log(listEndPoints(server));

mongoose.set("debug", true);

mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
  })
  .then(
    server.listen(process.env.PORT, () => {
      console.log("Server running on port: ", process.env.PORT);
    })
  )
  .catch(console.error);
