const express = require("express");
const mongoose = require("mongoose")
const VideoSchema = require("./schema");
const UserSchema = require("../users/schema");
const playlistSchema = require("../playlist/schema");
const q2m = require("query-to-mongo")

const { authenticate } = require("../auth/tools");
const { authorize } = require("../auth/middleware");

const videoRouter = express.Router();

videoRouter.post("/", authorize, async (req, res, next) => {
  try {
    console.log("NEW VIDEO");
    const video = { ...req.body,duration:0 };
    console.log(video);

    const newvideo = new VideoSchema(video);
    const { _id } = await newvideo.save();

    res.status(201).send(_id);
  } catch (error) {
    next(error);
  }
});
videoRouter.get("/", authorize, async (req, res, next) => {
  try {
console.log(req.query)
    const videos = await VideoSchema.find(req.query)
    .populate("myProgress")
    .populate("saved");
    // console.log(videos)
    // videos.map((video) =>  console.log(video))
    res.send(videos);
  } catch (error) {
    console.log(error);
  }
});

videoRouter.get("/:courseId", authorize, async (req, res, next) => {
  try {
    const id = req.params.courseId;

    const video = await VideoSchema.findById(id)
    .populate("myProgress")
    .populate("saved");;
    if (video) {
      res.send(video);
    } else {
      const error = new Error();
      error.httpStatusCode = 404;
      next(error);
    }
  } catch (error) {
    console.log(error);
    next("PROBLEM OCCURED");
  }
});

videoRouter.put("/:courseId", authorize, async (req, res, next) => {
  try {
    const video = await VideoSchema.findByIdAndUpdate(
      req.params.courseId,
      req.body,
      {
        runValidators: true,
        new: true,
      }
    );
    if (video) {
      res.send(video);
    } else {
      const error = new Error(`video with id ${req.params.courseId} not found`);
      error.httpStatusCode = 404;
      next(error);
    }
  } catch (error) {
    next(error);
  }
});

videoRouter.delete("/:courseId", authorize, async (req, res, next) => {
  try {
    const video = await VideoSchema.findByIdAndDelete(req.params.courseId);
    if (video) {
      res.send("Deleted");
    } else {
      const error = new Error(`video with id ${req.params.courseId} not found`);
      error.httpStatusCode = 404;
      next(error);
    }
  } catch (error) {
    next(error);
  }
});

///EMBEDDING playlist

videoRouter.post(
  "/:courseId/addplaylist",
  authorize,
  async (req, res, next) => {
    try {
      const playlist = new playlistSchema(req.body);

      const playlistToInsert = { ...playlist.toObject() };
      console.log(playlist, playlistToInsert);


      const updated = await VideoSchema.findByIdAndUpdate(
        req.params.courseId,
        {
          $push: {
            playList: playlistToInsert,
          },
        },
        { runValidators: true, new: true }
      );
      


      let duration= updated.duration 
      let newduration= updated.duration+req.body.duration
    
      console.log("duration,newduration",duration,newduration)
      
      const video = await VideoSchema.findByIdAndUpdate(
        req.params.courseId,
       {duration:newduration},
        {
          runValidators: true,
          new: true,
        }
      );

      res.status(201).send(updated);
    } catch (error) {
      next(error);
    }
  }
);

videoRouter.get("/:courseId/playlist", authorize, async (req, res, next) => {
  try {
    const playlist  = await VideoSchema.findById(req.params.courseId, {
      playList: 1,
      _id: 0,
    });

    console.log(playlist)
    res.send(playlist);
  } catch (error) {
    console.log(error);
    next(error);
  }
});

videoRouter.get(
  "/:courseId/playlist/:videoId",
  authorize,
  async (req, res, next) => {
    try {
      const  playlist  = await VideoSchema.find(
        {
          _id: mongoose.Types.ObjectId(req.params.courseId),
        },
        {_id: 0,
         
          
          playList: {
            $elemMatch: { _id: mongoose.Types.ObjectId(req.params.videoId) },
          },
        }
      );

      if (playlist && playlist.length > 0) {
        res.send(playlist[0].playList[0]);
      } else {
        const error = new Error(
          `course with id ${req.params.courseId} or video with ID:${req.params.videoId}  not found`
        );
        error.httpStatusCode = 404;
        next(error);
      }
    } catch (error) {
      console.log(error);
      next(error);
    }
  }
);

videoRouter.delete(
  "/:courseId/playlist/:videoId",
  authorize,
  async (req, res, next) => {
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
      );
      res.send(modifiedreview);
    } catch (error) {
      console.log(error);
      next(error);
    }
  }
);

videoRouter.put(
  "/:courseId/playlist/:videoId",
  authorize,
  async (req, res, next) => {
    try {
      const { playlist } = await VideoSchema.findOne(
        {
          _id: mongoose.Types.ObjectId(req.params.courseId),
        },
        {
          _id: 0,
          playList: {
            $elemMatch: { _id: mongoose.Types.ObjectId(req.params.videoId) },
          },
        }
      );
console.log({ playlist })
      if (playlist && playlist.length > 0) {
        const reviewToReplace = { ...playlist[0].toObject(), ...req.body };

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
        );
        res.send(modifiedreview);
      } else {
        next();
      }
    } catch (error) {
      console.log(error);
      next(error);
    }
  }
);

///SAVE A VIDEO


videoRouter.get("/saved/:courseId", authorize, async (req, res, next) => {
  try {
    const Course = await VideoSchema.findById(req.params.courseId, {
      _id: 0,
      saved: 1,
    }).populate("saved");
    if (Course) {
      res.send(Course);
    } else {
      const error = new Error(
        `Course with id ${req.params.courseId} not found`
      );
      error.httpStatusCode = 404;
      next(error);
    }
  } catch (error) {
    return next(error);
  }
});

videoRouter.put("/:courseId", authorize, async (req, res, next) => {
  try {
    const Course = { ...req.body };
    const author = await VideoSchema.findById(req.params.courseId, {
      _id: 0,
      user: 1,
    });
    if (author.userName !== req.user.userName) {
      const error = new Error(
        `User does not own the Course with id ${req.params.courseId}`
      );
      error.httpStatusCode = 403;
      return next(error);
    }
    const newCourse = await VideoSchema.findByIdAndUpdate(
      req.params.courseId,
      Course,
      {
        runValidators: true,
        new: true,
      }
    );
    if (newCourse) {
      res.status(201).send(req.params.courseId);
    } else {
      const error = new Error(
        `Course with id ${req.params.courseId} not found`
      );
      error.httpStatusCode = 404;
      next(error);
    }
  } catch (error) {
    next(error);
  }
});

videoRouter.post("/save/:courseId", authorize, async (req, res, next) => {
  try {
    const Course = await VideoSchema.findByIdAndUpdate(
      req.params.courseId,
      {
        $addToSet: {
          saved: req.user._id,
        },
      },
      {
        runValidators: true,
        new: true,
      }
    );
    if (Course) {
      const updated = await UserSchema.findByIdAndUpdate(
        req.user,
        {
          $addToSet: {
            savedVideos: req.params.courseId,
          },
        },
        { runValidators: true, new: true }
      );
      res.status(201).send("saved");
    } else {
      const error = new Error(
        `Course with id ${req.params.courseId} not found`
      );
      error.httpStatusCode = 404;
      next(error);
    }
  } catch (error) {
    next(error);
  }
});

videoRouter.post("/unsave/:courseId", authorize, async (req, res, next) => {
  try {
    const Course = await VideoSchema.findByIdAndUpdate(
      req.params.courseId,
      {
        $pull: {
          saved: req.user._id,
        },
      },
      {
        runValidators: true,
        new: true,
      }
    );
    if (Course) {
      const updated = await UserSchema.findByIdAndUpdate(
        req.user,
        {
          $pull: {
            savedVideos: req.params.courseId,
          },
        },
        { runValidators: true, new: true }
      );
      res.status(201).send("removed the save");
    } else {
      const error = new Error(
        `Course with id ${req.params.courseId} not found`
      );
      error.httpStatusCode = 404;
      next(error);
    }
  } catch (error) {
    next(error);
  }
});

module.exports = videoRouter;
