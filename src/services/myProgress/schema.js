const { Schema, model } = require("mongoose")

const myProgressSchema = new Schema(
    { 
        user:{type: Schema.Types.ObjectId, ref: "user"},
        course:{type: Schema.Types.ObjectId, ref: "Video" },
        completed:[ {
          index: { type: Number,unique: true }
        
        }],
        totalWatch:Number,
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