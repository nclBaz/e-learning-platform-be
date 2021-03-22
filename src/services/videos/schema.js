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
        type: {type:String},
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


VideoSchema.static("addVideosToPlayList", async function (id, source) {
    await VideoSchema.findOneAndUpdate(
      { _id: id },
      {
        $push: { playList: source},
      }
    )
  })

  const UserModel = model("video", VideoSchema)

module.exports = UserModel;
