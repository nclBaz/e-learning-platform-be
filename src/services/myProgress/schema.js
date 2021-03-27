const { Schema, model } = require("mongoose")

const myProgressSchema = new Schema(
    { 
        user:{type: Schema.Types.ObjectId, ref: "user"},
        course:{type: Schema.Types.ObjectId, ref: "Video" },
        completed:[{
          index:Number,
          isCompleted:Boolean
        }],
        remainingTime:Number,
        secondLeft:Number,
        completePercentage:Number,
        playlistIndex:Number,
    },
  {
    timestamps: true,
  }
)

module.exports = model("progress", myProgressSchema)