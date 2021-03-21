require("dotenv").config()
const express = require("express")
const mongoose = require("mongoose")
const CommentSchema = require("./schema")
const userSchema = require("../users/schema")
const PostSchema = require("../posts/schema")
const CommentRouter = express.Router()
const { authenticate, refreshToken } = require("../auth/tools")
const { authorize } = require("../auth/middleware")

CommentRouter.post("/:id", authorize, async (req, res, next) => {
	try {
		console.log("NEWcomment")
		const comment = { ...req.body, user: req.user.id }
		console.log(comment)
		//post.userName = req.user.name
		console.log(comment.userName)
		comment.user = req.user._id
		console.log(comment.user)
		console.log(comment)
		const newComment = new CommentSchema(comment)
		const { _id } = await newComment.save()
		const userUpd = await userSchema.findByIdAndUpdate(
			req.user._id,
			{
				$addToSet: {
					comments: _id,
				},
			},
			{ runValidators: true, new: true }
		)
		const postupd = await PostSchema.findByIdAndUpdate(
			req.params.id,
			{
				$addToSet: {
					comments: _id,
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

CommentRouter.post("/reply/:id", authorize, async (req, res, next) => {
	try {
		console.log("NEWcomment")
		const comment = { ...req.body, image: "", user: req.user.id }
		console.log(comment)
		//comment.userName = req.user.name
		console.log(comment.userName)
		comment.user = req.user._id
		console.log(comment.user)
		console.log(comment)
		const newComment = new CommentSchema(comment)
		const { _id } = await newComment.save()
		const userUpd = await userSchema.findByIdAndUpdate(
			req.user._id,
			{
				$addToSet: {
					comments: _id,
				},
			},
			{ runValidators: true, new: true }
		)
		const postupd = await CommentSchema.findByIdAndUpdate(
			req.params.id,
			{
				$addToSet: {
					comments: _id,
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

CommentRouter.get("/", authorize, async (req, res, next) => {
	try {
		//const query = q2m(req.query)
		const comments = await CommentSchema.find({})
			.populate("user", "-password -refreshToken")
			.populate("comments")
		res.send(comments)
	} catch (error) {
		return next(error)
	}
})

CommentRouter.get("/:id", authorize, async (req, res, next) => {
	try {
		const comment = await CommentSchema.findById(req.params.id)
		if (comment) {
			res.send(comment)
		} else {
			const error = new Error(`Comment with id ${req.params.id} not found`)
			error.httpStatusCode = 404
			next(error)
		}
	} catch (error) {
		return next(error)
	}
})

CommentRouter.get("/likes/:id", authorize, async (req, res, next) => {
	try {
		const comment = await CommentSchema.findById(req.params.id, {
			_id: 0,
			likes: 1,
		}).populate("likes", "-password -refreshToken")
		if (comment) {
			res.send(comment)
		} else {
			const error = new Error(`Comment with id ${req.params.id} not found`)
			error.httpStatusCode = 404
			next(error)
		}
	} catch (error) {
		return next(error)
	}
})

CommentRouter.put("/:id", authorize, async (req, res, next) => {
	try {
		const comment = { ...req.body }
		const author = await CommentSchema.findById(req.params.id, {
			_id: 0,
			user: 1,
		})
		if (author.userName !== req.user.userName) {
			const error = new Error(
				`User does not own the Comment with id ${req.params.id}`
			)
			error.httpStatusCode = 403
			return next(error)
		}
		const newComment = await CommentSchema.findByIdAndUpdate(
			req.params.id,
			comment,
			{
				runValidators: true,
				new: true,
			}
		)
		if (newComment) {
			res.status(201).send(req.params.id)
		} else {
			const error = new Error(`Comment with id ${req.params.id} not found`)
			error.httpStatusCode = 404
			next(error)
		}
	} catch (error) {
		next(error)
	}
})

CommentRouter.post("/like/:id", authorize, async (req, res, next) => {
	try {
		const comment = await CommentSchema.findByIdAndUpdate(
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
		if (comment) {
			const updated = await userSchema.findByIdAndUpdate(
				req.user,
				{
					$addToSet: {
						likedComments: req.params.id,
					},
				},
				{ runValidators: true, new: true }
			)
			res.status(201).send("liked")
		} else {
			const error = new Error(`Comment with id ${req.params.id} not found`)
			error.httpStatusCode = 404
			next(error)
		}
	} catch (error) {
		next(error)
	}
})

CommentRouter.post("/dislike/:id", authorize, async (req, res, next) => {
	try {
		const comment = await CommentSchema.findByIdAndUpdate(
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
		if (comment) {
			const updated = await userSchema.findByIdAndUpdate(
				req.user,
				{
					$pull: {
						likedComments: req.params.id,
					},
				},
				{ runValidators: true, new: true }
			)
			res.status(201).send("removed the like")
		} else {
			const error = new Error(`Comment with id ${req.params.id} not found`)
			error.httpStatusCode = 404
			next(error)
		}
	} catch (error) {
		next(error)
	}
})

CommentRouter.delete("/:id", authorize, async (req, res, next) => {
	try {
		const author = await CommentSchema.findById(req.params.id, {
			_id: 0,
			user: 1,
		})
		if (author.user.userName !== req.user.iserName) {
			const error = new Error(
				`User does not own the Comment with id ${req.params.id}`
			)
			error.httpStatusCode = 403
			return next(error)
		}
		const comment = await CommentSchema.findByIdAndDelete(req.params.id)
		if (comment) {
			const updated = await userSchema.findByIdAndUpdate(
				req.user,
				{
					$pull: {
						comments: req.params.id,
					},
				},
				{ runValidators: true, new: true }
			)
			if (updated) {
				res.send("Deleted")
			}
		} else {
			const error = new Error(`Comment with id ${req.params.id} not found`)
			error.httpStatusCode = 404
			next(error)
		}
	} catch (error) {
		next(error)
	}
})

module.exports = CommentRouter
