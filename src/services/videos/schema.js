const { Schema, model } = require("mongoose");
const bcrypt = require("bcryptjs");

const VideoSchema = new Schema(
  {
    videoName: String,
    tutor: {
      tutorName: String,
      tutorProfession: String,
    },
    userVideos:[
        { type: Schema.Types.ObjectId, ref: "user" ,
        isCompleted:Boolean,
        remainingTime:Number,
        secondLeft:Number,
        completePercentage:Number,
        playlistIndex:Number
      
        }
    ],
    duration: Number,
    playListLength: Number,
    playList: [{ 
        src: String, 
        type:String,
        duration: Number, 
        contentName: String }],
    category: String,
    skills: [
      {
        type: String,
      },
    ],

    // likes: [{ type: Schema.Types.ObjectId, ref: "user"}],

    // saved: [{ type: Schema.Types.ObjectId, ref: "user" }],
  },
  { timestamps: true }
);


UserSchema.static("addVideosToPlayList", async function (id, product) {
    await VideoSchema.findOneAndUpdate(
      { _id: id },
      {
        $push: { playList: product },
      }
    )
  })

module.exports = model("video", VideoSchema);
