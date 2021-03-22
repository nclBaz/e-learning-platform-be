const express = require("express");

const UserSchema = require("./Schema");
const VideoSchema = require("../videos/schema");
const passport = require("passport");
const fetch = require("node-fetch");

const { authenticate } = require("../auth/tools");
const { authorize } = require("../auth/middleware");


const userRouter = express.Router();

// get all users
userRouter.get("/", async (req, res, next) => {
  try {
    const users = await UserSchema.find();
    res.status(200).send(users);

  } catch (error) {
    next(error);
  }
});

userRouter.get(
  "/googleLogin",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

userRouter.get(
  "/googleRedirect",
  passport.authenticate("google"),
  async (req, res, next) => {
    try {
      res.cookie("accessToken", req.user.tokens.accessToken, {
        httpOnly: true,
      });
      // res.cookie("refreshToken", req.user.tokens.refreshToken, {
      //   httpOnly: true,
      //   path: "/authors/refreshToken",
      // })
      res.status(200).redirect("http://localhost:3000/");
      // res.redirect("http://localhost:3000/"+"?accessToken="+req.user.tokens.accessToken) -->without cookies shitty method:D
    } catch (error) {
      next(error);
    }
  }
);

// get single user
userRouter.get("/me", authorize, async (req, res, next) => {


  try {
    res.send(req.user);
  } catch (error) {
    next(error);
  }
});

// edit user

userRouter.put("/me", authorize, async (req, res, next) => {


  try {
    const updates = Object.keys(req.body);
    updates.forEach((update) => (req.user[update] = req.body[update]));
    await req.user.save();
    res.send(res.user);
    res.send(updates);
  } catch (error) {
    next(error);
  }
});

// delete user
userRouter.delete("/me", authorize, async (req, res, next) => {

  try {
    await res.user.deleteOne();
    res.status(204).send("Delete");
  } catch (error) {
    next(error);
  }
});


//post a new user
userRouter.post("/register", async (req, res, next) => {
  try {
    const newUser = new UserSchema(req.body);
    const { _id } = await newUser.save();

    res.status(201).send(_id);
  } catch (error) {
    next(error);
  }
});

userRouter.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await UserSchema.findByCredentials(email, password);
    console.log(user);
    const { accessToken } = await authenticate(user);
    console.log(accessToken);
    // without cookies res.send(tokens)
    //  Send back tokens
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      path: "/",
    });
    // res.cookie("refreshToken", refreshToken, {
    //   httpOnly: true,
    //   path: "/users/refreshToken",
    // })

    res.send(accessToken);
  } catch (error) {
    next(error);
  }
});
userRouter.post("/logout", authorize, async (req, res, next) => {
  try {
    // find the user's refresh token
    req.user.accessToken = req.user.accessToken.filter(
      (token) => token.token !== req.body.accessToken
    );

    await req.user.save();

    res.send("Logged out");
  } catch (error) {
    next(error);
  }
});


userRouter.post("/myLearning/:courseId",authorize, async (req, res, next) => {

    
  try {
    const id = req.params.courseId
    
    const video = await VideoSchema.findById(id).populate(
        "video"  
    )
    
    if (video) {

        const newVideo = { ...video.toObject(),
          isCompleted:req.body.isCompleted,
      	remainingTime:req.body.	remainingTime,
      	secondLeft:	req.body.secondLeft,
      	completePercentage:req.body.completePercentage,
      	playlistIndex:req.body.playlistIndex}
      
        await UserSchema.findOneAndUpdate(
            { _id: req.user._id },
            {
              $push: { myVideos: newVideo},
            }
          )
          res.send(req.user.myVideos)

        // await UserSchema.addVideosToMyList(req.user._id, newVideo)
        //      res.send("New video added!")

    //   const isVideoThere = await UserSchema.findCourseInMyList(
    //     req.user._id,
    //     req.params.courseId
    //   )
    //   if (isVideoThere) {
    
    //     res.send("Video is already in db, info  needs to be updated")
    //   } else {
    //     await VideoSchema.addVideosToMyList(req.user._id, newVideo)
    //     res.send("New video added!")
    //   }
   
       
       
    } else {
      const error = new Error()
      error.httpStatusCode = 404
      next(error)
    }
  } catch (error) {
    next(error)
  }
})

module.exports = userRouter;
