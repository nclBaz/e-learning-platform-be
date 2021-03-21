const express = require("express")
const cors = require("cors")
const { join } = require("path")
const listEndpoints = require("express-list-endpoints")
const mongoose = require("mongoose")
const passport = require("passport")
const cookieParser = require("cookie-parser")

// const usersRouter = require("./services/users")
const oauth = require("./services/auth/oauth")
const videosRouter = require("./services/videos")
const postsRouter = require("./services/posts")
const commentsRouter = require("./services/comments")


const {
  notFoundHandler,
  forbiddenHandler,
  badRequestHandler,
  genericErrorHandler,
} = require("./errorHandlers")

const server = express()

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

server.use(cors(corsOptions))
const port = process.env.PORT

const staticFolderPath = join(__dirname, "../public")
server.use(express.static(staticFolderPath))
server.use(express.json())
server.use(cookieParser())
server.use(passport.initialize())
// server.use("/users", usersRouter)
server.use("/videos", videosRouter)
server.use("/posts", postsRouter)
server.use("/comments", commentsRouter)

// ERROR HANDLERS MIDDLEWARES

server.use(badRequestHandler)
server.use(forbiddenHandler)
server.use(notFoundHandler)
server.use(genericErrorHandler)

const endpoints = listEndpoints(server)

//console.log(listEndpoints(server))

mongoose
	.connect(process.env.MONGO_CONNECTION_STRING, {
		useNewUrlParser: true,
		useUnifiedTopology: true,
		useCreateIndex: true,
	})
	.then(
		server.listen(port, () => {
			console.log("Running on port", port)
			endpoints.forEach((endpoint) => {
				console.log(endpoint.methods, " - ", endpoint.path)
			})
		})
	)
	.catch((err) => console.log(err))