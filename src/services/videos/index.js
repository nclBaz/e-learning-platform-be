const express = require("express");

const VideoSchema = require("./schema");
const playlistSchema = require("../playlist/schema");


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
 
   
        const playlist = new playlistSchema(req.body)
        
        const playlistToInsert = { ...playlist.toObject()}
        console.log(playlist,playlistToInsert)
    
        const updated = await VideoSchema.findByIdAndUpdate(
          req.params.videoId,
          {
            $push: {
              playList: playlistToInsert,
            },
          },
          { runValidators: true, new: true }
        )
        res.status(201).send(updated)
      } catch (error) {
        next(error)
      }
    })

// 	try {
//         const video = await VideoSchema.findById(req.params.videoId)
//         const playlist= req.body
//         console.log(video)
//         if( video){
//             await VideoSchema.addVideosToPlayList(req.params.videoId, playlist)
//             res.send(playlist)

//         }else{
//             res.send("video doesn't exist in db!")
//         }
       
// 	} catch (error) {
// 		next(error)
// 	}
// })


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
