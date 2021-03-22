const { Schema, model } = require("mongoose");
const bcrypt = require("bcryptjs");

const VideoSchema = new Schema(
  {
    videoName: String,
    tutor: {
      tutorName: String,
      tutorProfession: String,
    },
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

    likes: [{ type: Schema.Types.ObjectId, ref: "user"}],

    saved: [{ type: Schema.Types.ObjectId, ref: "user" }],
  },

  
  { timestamps: true }
);




  const VideoModel = model("video", VideoSchema)

module.exports = VideoModel;
