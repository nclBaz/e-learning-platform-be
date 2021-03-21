const { Schema, model } = require("mongoose")
const mongoose = require("mongoose")
const mongoosePaginate = require("mongoose-paginate-v2")

const CommentSchema = new Schema(
	{
		text: {
			type: String,
		},
		user: {
			type: Schema.Types.ObjectId,
			ref: "user",
			required: true,
		},
		likes: [{ type: Schema.Types.ObjectId, ref: "user" }],
		comments: [{ type: Schema.Types.ObjectId, ref: "Comment" }],
		imageUrl: String,
	},
	{ timestamps: true }
)
//{ type: "ObjectId", index: true }
const CommentModel = model("Comment", CommentSchema)

CommentSchema.plugin(mongoosePaginate)
CommentSchema.static("findCommentWithAuthor", async (id) => {
	const comment = await CommentModel.findById(id).populate("user")
	return comment
})
module.exports = mongoose.model("Comment", CommentSchema)
