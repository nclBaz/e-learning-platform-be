const express = require("express");

const VideoSchema = require("./schema");
const UserSchema = require("../users/Schema");
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
videoRouter.get("/",authorize, async (req, res, next) => {
    try {
      const videos = await VideoSchema.find();
      res.send(videos);
    } catch (error) {
      console.log(error);
    }
  });
  
  
  videoRouter.get("/:courseId",authorize, async (req, res, next) => {
    try {
      const id = req.params.courseId
    
      const video = await VideoSchema.findById(id)
      if (video) {
        res.send(video)
      } else {
        const error = new Error()
        error.httpStatusCode = 404
        next(error)
      }
    } catch (error) {
      console.log(error)
      next("PROBLEM OCCURED")
    }
  })

  videoRouter.put("/:courseId",authorize, async (req, res, next) => {
    try {
      const video = await VideoSchema.findByIdAndUpdate(req.params.courseId, req.body, {
        runValidators: true,
        new: true,
      })
      if (video) {
        res.send(video)
      } else {
        const error = new Error(`video with id ${req.params.courseId} not found`)
        error.httpStatusCode = 404
        next(error)
      }
    } catch (error) {
      next(error)
    }
  })
  
  videoRouter.delete("/:courseId", authorize, async (req, res, next) => {
    try {
      const video = await VideoSchema.findByIdAndDelete(req.params.courseId)
      if (video) {
        res.send("Deleted")
      } else {
        const error = new Error(`video with id ${req.params.courseId} not found`)
        error.httpStatusCode = 404
        next(error)
      }
    } catch (error) {
      next(error)
    }
  })
  
  

///EMBEDDING 

videoRouter.post("/:courseId/addplaylist", authorize, async (req, res, next) => {


    try {
 
   
        const playlist = new playlistSchema(req.body)
        
        const playlistToInsert = { ...playlist.toObject()}
        console.log(playlist,playlistToInsert)
    
        const updated = await VideoSchema.findByIdAndUpdate(
          req.params.courseId,
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

videoRouter.get("/:courseId/playlist", authorize,async (req, res, next) => {
    try {
      const { playlist} = await VideoSchema.findById(req.params.courseId, {
        playList: 1,
        _id: 0,
      })
      res.send(playlist)
    } catch (error) {
      console.log(error)
      next(error)
    }
  })
  
  videoRouter.get("/:courseId/playlist/:videoId", authorize, async (req, res, next) => {
    try {
      const {playlist} = await VideoSchema.findOne(
        {
          _id: mongoose.Types.ObjectId(req.params.courseId),
        },
        {
          _id: 0,
        playList: {
            $elemMatch: { _id: mongoose.Types.ObjectId(req.params.videoId) },
          },
        }
      )
  
      if (playlist && playlist.length > 0) {
        res.send(playlist[0])
      } else {
        next()
      }
    } catch (error) {
      console.log(error)
      next(error)
    }
  })
  
  videoRouter.delete("/:courseId/playlist/:videoId",authorize, async (req, res, next) => {
    try {
      const modifiedreview = await VideoSchema.findByIdAndUpdate(
        req.params.courseId,
        {
          $pull: {
            playList: { _id: mongoose.Types.ObjectId(req.params.videoId) },
          },
        },
        {
          new: true,
        }
      )
      res.send(modifiedreview)
    } catch (error) {
      console.log(error)
      next(error)
    }
  })
  
  videoRouter.put("/:courseId/playlist/:videoId", authorize, async (req, res, next) => {
    try {
      const { playlist} = await VideoSchema.findOne(
        {
          _id: mongoose.Types.ObjectId(req.params.courseId),
        },
        {
          _id: 0,
          playList: {
            $elemMatch: { _id: mongoose.Types.ObjectId(req.params.videoId) },
          },
        }
      )
  
      if (playlist&& playlist.length > 0) {
       
        const reviewToReplace = { ...playlist[0].toObject(), ...req.body }
  
        const modifiedreview = await VideoSchema.findOneAndUpdate(
          {
            _id: mongoose.Types.ObjectId(req.params.courseId),
            "playList._id": mongoose.Types.ObjectId(req.params.videoId),
          },
          { $set: { "playList.$": reviewToReplace } },
          {
            runValidators: true,
            new: true,
          }
        )
        res.send(modifiedreview)
      } else {
        next()
      }
    } catch (error) {
      console.log(error)
      next(error)
    }
  })
  
  

  ///
  


  


module.exports = videoRouter;
