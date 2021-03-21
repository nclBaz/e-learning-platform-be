require("dotenv").config()
const express = require("express")
const mongoose = require("mongoose")
//const q2m = require("query-to-mongo")
const multer = require("multer")
const { CloudinaryStorage } = require("multer-storage-cloudinary")
const { cloudinary } = require("../../cloudinary")
const cloudStorage = new CloudinaryStorage({
	cloudinary: cloudinary,
	params: {
		folder: "Instagram/posts",
	},
})

const cloudMulter = multer({ storage: cloudStorage })
const PostSchema = require("./schema")
//const profileSchema = require("../profiles/mongo")
const userSchema = require("../users/schema")
const PostRouter = express.Router()
//const authenticateToken = require("../../authentication")
const { authenticate, refreshToken } = require("../auth/tools")
const { authorize } = require("../auth/middleware")

PostRouter.post("/", authorize, async (req, res, next) => {
	try {
		console.log("NEW POST")
		const post = { ...req.body, image: "", user: req.user.id }
		console.log(post)
		//post.userName = req.user.name
		console.log(post.userName)
		//post.user = await userSchema.find({ username: post.userName }, { _id: 1 })
		post.user = req.user._id //post.user[0]._id
		console.log(post.user)
		console.log(post)
		const newPost = new PostSchema(post)
		const { _id } = await newPost.save()
		const updated = await userSchema.findByIdAndUpdate(
			req.user,
			{
				$addToSet: {
					posts: _id,
				},
			},
			{ runValidators: true, new: true }
		)
		console.log(_id)
		res.status(201).send(_id)
	} catch (error) {
		next(error)
	}
})

PostRouter.get("/", authorize, async (req, res, next) => {
	try {
		//const query = q2m(req.query)
		const posts = await PostSchema.find({}).populate(
			"user",
			"-password -refreshToken"
		)
		res.send(posts)
	} catch (error) {
		return next(error)
	}
})

PostRouter.get("/fromFollowed", authorize, async (req, res, next) => {
	try {
		//const query = q2m(req.query)
		let posts = await PostSchema.find({}).populate(
			"user",
			"-password -refreshToken"
		)
		posts = posts.filter((post) => req.user.follows.includes(post.user._id))
		res.send(posts)
	} catch (error) {
		return next(error)
	}
})

PostRouter.get("/fromNotFollowed", authorize, async (req, res, next) => {
	try {
		//const query = q2m(req.query)
		let posts = await PostSchema.find({}).populate(
			"user",
			"-password -refreshToken"
		)
		posts = posts.filter((post) => !req.user.follows.includes(post.user._id))
		res.send(posts)
	} catch (error) {
		return next(error)
	}
})

PostRouter.get("/from/:userid", authorize, async (req, res, next) => {
	try {
		//const query = q2m(req.query)
		let posts = await PostSchema.find({}).populate(
			"user",
			"-password -refreshToken"
		)
		posts = posts.filter((post) => req.params.userid === post.user._id)
		res.send(posts)
	} catch (error) {
		return next(error)
	}
})

PostRouter.get("/:id", authorize, async (req, res, next) => {
	try {
		const post = await PostSchema.findById(req.params.id)
		if (post) {
			res.send(post)
		} else {
			const error = new Error(`Post with id ${req.params.id} not found`)
			error.httpStatusCode = 404
			next(error)
		}
	} catch (error) {
		return next(error)
	}
})

PostRouter.get("/likes/:id", authorize, async (req, res, next) => {
	try {
		const post = await PostSchema.findById(req.params.id, {
			_id: 0,
			likes: 1,
		}).populate("likes")
		if (post) {
			res.send(post)
		} else {
			const error = new Error(`Post with id ${req.params.id} not found`)
			error.httpStatusCode = 404
			next(error)
		}
	} catch (error) {
		return next(error)
	}
})

PostRouter.put("/:id", authorize, async (req, res, next) => {
	try {
		const post = { ...req.body }
		const author = await PostSchema.findById(req.params.id, {
			_id: 0,
			user: 1,
		})
		if (author.userName !== req.user.userName) {
			const error = new Error(
				`User does not own the Post with id ${req.params.id}`
			)
			error.httpStatusCode = 403
			return next(error)
		}
		const newPost = await PostSchema.findByIdAndUpdate(req.params.id, post, {
			runValidators: true,
			new: true,
		})
		if (newPost) {
			res.status(201).send(req.params.id)
		} else {
			const error = new Error(`Post with id ${req.params.id} not found`)
			error.httpStatusCode = 404
			next(error)
		}
	} catch (error) {
		next(error)
	}
})

PostRouter.post("/like/:id", authorize, async (req, res, next) => {
	try {
		const post = await PostSchema.findByIdAndUpdate(
			req.params.id,
			{
				$addToSet: {
					likes: req.user._id,
				},
			},
			{
				runValidators: true,
				new: true,
			}
		)
		if (post) {
			const updated = await userSchema.findByIdAndUpdate(
				req.user,
				{
					$addToSet: {
						likedPosts: req.params.id,
					},
				},
				{ runValidators: true, new: true }
			)
			res.status(201).send("liked")
		} else {
			const error = new Error(`Post with id ${req.params.id} not found`)
			error.httpStatusCode = 404
			next(error)
		}
	} catch (error) {
		next(error)
	}
})

PostRouter.post("/dislike/:id", authorize, async (req, res, next) => {
	try {
		const post = await PostSchema.findByIdAndUpdate(
			req.params.id,
			{
				$pull: {
					likes: req.user._id,
				},
			},
			{
				runValidators: true,
				new: true,
			}
		)
		if (post) {
			const updated = await userSchema.findByIdAndUpdate(
				req.user,
				{
					$pull: {
						likedPosts: req.params.id,
					},
				},
				{ runValidators: true, new: true }
			)
			res.status(201).send("removed the like")
		} else {
			const error = new Error(`Post with id ${req.params.id} not found`)
			error.httpStatusCode = 404
			next(error)
		}
	} catch (error) {
		next(error)
	}
})

/**
 * this is for the image upload
 */
PostRouter.post(
	"/imageUpload/:id",
	authorize,
	cloudMulter.single("image"),
	async (req, res, next) => {
		try {
			const post = { imageUrl: req.file.path }
			const author = await PostSchema.findById(req.params.id, {
				_id: 0,
				user: 1,
			})
			if (author.user.userName !== req.user.userName) {
				const error = new Error(
					`User does not own the Post with id ${req.params.id}`
				)
				error.httpStatusCode = 403
				return next(error)
			}
			console.log(req.body)
			console.log(req.file.buffer)
			console.log("help")
			//res.json({ msg: "image uploaded" })

			const newPost = await PostSchema.findByIdAndUpdate(req.params.id, post, {
				runValidators: true,
				new: true,
			})
			if (newPost) {
				res.status(201).send("immage updated")
			} else {
				const error = new Error(`Post with id ${req.params.id} not found`)
				error.httpStatusCode = 404
				next(error)
			}
		} catch (error) {
			console.log("error", error)
			next(error)
		}
	}
)

PostRouter.delete("/:id", authorize, async (req, res, next) => {
	try {
		const author = await PostSchema.findById(req.params.id, {
			_id: 0,
			user: 1,
		})
		if (author.user.userName !== req.user.iserName) {
			const error = new Error(
				`User does not own the Post with id ${req.params.id}`
			)
			error.httpStatusCode = 403
			return next(error)
		}
		const post = await PostSchema.findByIdAndDelete(req.params.id)
		if (post) {
			const updated = await userSchema.findByIdAndUpdate(
				req.user,
				{
					$pull: {
						posts: req.params.id,
					},
				},
				{ runValidators: true, new: true }
			)
			if (updated) {
				res.send("Deleted")
			}
		} else {
			const error = new Error(`Post with id ${req.params.id} not found`)
			error.httpStatusCode = 404
			next(error)
		}
	} catch (error) {
		next(error)
	}
})

module.exports = PostRouter
