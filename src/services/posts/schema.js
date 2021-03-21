const { Schema, model } = require("mongoose")
const mongoose = require("mongoose")
const mongoosePaginate = require("mongoose-paginate-v2")

const PostSchema = new Schema(
	{
		text: {
			type: String,
		},
		user: {
			type: Schema.Types.ObjectId,
			ref: "user",
			required: true,
		},
		likes: [{ type: Schema.Types.ObjectId, ref: "user", required: true }],
		imageUrl: String,
		comments: [{ type: Schema.Types.ObjectId, ref: "Comment" }],
	},
	{ timestamps: true }
)
//{ type: "ObjectId", index: true }
const PostModel = model("Post", PostSchema)

PostSchema.plugin(mongoosePaginate)
PostSchema.static("findPostWithAuthor", async (id) => {
	const post = await PostModel.findById(id).populate(user, "name surname")
	return post
})
module.exports = mongoose.model("Post", PostSchema)
