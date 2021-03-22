const express = require("express");

const VideoSchema = require("./schema");


const { authenticate } = require("../auth/tools");
const { authorize } = require("../auth/middleware");


const videoRouter = express.Router();

videoRouter.post("/", authorize, async (req, res, next) => {
	try {
		console.log("NEW VIDEO")
		const video = { ...req.body }
		console.log(video)

	
		const newvideo = new VideoSchema(video)
		const { _id } = await newvideo.save()
        
		
		res.status(201).send(_id)
	} catch (error) {
		next(error)
	}
})

videoRouter.post("/addplaylist/:videoId", authorize, async (req, res, next) => {
	try {
		console.log("NEW VIDEO")
		const video = { ...req.body }
		console.log(video)

	
		const newvideo = new VideoSchema(video)
		const { _id } = await newvideo.save()
        
		
		res.status(201).send(_id)
	} catch (error) {
		next(error)
	}
})


videoRouter.get("/", authorize, async (req, res, next) => {
	try {
		//const query = q2m(req.query)
		const posts = await PostSchema.find({}).populate(
			"user",
			"-password -refreshToken"
		)
		res.send(posts)
	} catch (error) {
		return next(error)
	}
})


module.exports = videoRouter;
