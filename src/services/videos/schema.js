const { Schema, model } = require("mongoose")
const mongoose = require("mongoose")
const mongoosePaginate = require("mongoose-paginate-v2")

const VideoSchema = new Schema(
	{
		videoName: String,
        tutor: {
			tutorName: String,
            tutorProfession:String
		},
        duration:Number,
        playListLength:Number,
        playList:[
           { src:String,
            duration:Number,
            contentName:String,

                }],
        category:String,
        skills:[{
			skills: String
		  
		  }],

		// likes: [{ type: Schema.Types.ObjectId, ref: "user"}],
		
		// saved: [{ type: Schema.Types.ObjectId, ref: "user" }],
	},
	{ timestamps: true }
)
//{ type: "ObjectId", index: true }



module.exports = mongoose.model("Video", VideoSchema)
