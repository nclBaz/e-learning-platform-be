const { Schema, model } = require("mongoose")

const playlistSchema = new Schema(
    { 
        src: String, 
        type: {type:String},
        duration: Number, 
        contentName: String },
 
  {
    timestamps: true,
  }
)

module.exports = model("playlist", playlistSchema)