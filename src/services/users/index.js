const express = require("express");

const mongoose = require("mongoose");

const UserSchema = require("./Schema");
const VideoSchema = require("../videos/schema");
const myProgressSchema = require("../myProgress/schema");
const completedSchema = require("../completed/schema");
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
      // res.cookie("accessToken", req.user.tokens.accessToken, {
      //   httpOnly: true,
      // });
      // res.cookie("refreshToken", req.user.tokens.refreshToken, {
      //   httpOnly: true,
      //   path: "/authors/refreshToken",
      // })
      // res.status(200).redirect("http://localhost:3000/");
      res.redirect(
       process.env.FRONTEND_URL+ "/?accessToken=" + req.user.tokens.accessToken
      );
    } catch (error) {
      next(error);
    }
  }
);

// get single user
userRouter.get("/me", authorize, async (req, res, next) => {
  try {
    const userId = req.user._id;
    // const myCourses = await  myProgressSchema.find(
    //   {
    //       user: userId
    //   }
    // )
    // .populate('course')
    // .populate('user')

    const me = await UserSchema.find({
      _id: userId,
    })
      .populate("likedVideos")
      .populate("savedVideos")
      .populate("myProgress")
      .populate('course')
      .populate('user');

      res.send(me[0]);
   
  }catch (error) {
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
    // res.cookie("accessToken", accessToken, {
    //   httpOnly: true,
    //   path: "/",
    // });
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


//POST PROGRESS OF A COURSE
userRouter.post("/myLearning/:courseId", authorize, async (req, res, next) => {
  try {
    const id = req.params.courseId;

    const course = await VideoSchema.findById(id);

    if (course) {
      //Eğer ki bu user ve bu coursa ait zaten bir progress kaydı var ise modify et



       const myProgress = await  myProgressSchema.find(
        {
          
          course: req.params.courseId,
          user: req.user._id
            
        }
      )

      console.log("myprogress[0]",myProgress[0])

      if (myProgress[0]) {
console.log("there is progress already so this is course duration--->",course.duration)
        let duration= course.duration //it should be second also
        let newTotalWatch= myProgress[0].totalWatch+ req.body.totalWatch// it is second
        let percentage= newTotalWatch/duration
        let remainingTime=duration -newTotalWatch

        console.log("there is progress already so this is newTotalWatch--->",course.duration,newTotalWatch)
        const modifiedVideo = await myProgressSchema.findOneAndUpdate(
          {
            "user": req.user._id,
            "course": req.params.courseId,
          },
          { ...req.body,totalWatch:  newTotalWatch,remainingTime:  remainingTime, completePercentage:percentage, course: req.params.courseId, user: req.user._id },
          {
            runValidators: true,
            new: true,
          }
        );
        
        res.send(modifiedVideo);
      } else {
        //Eğer ki bu user ve bu coursa ait progress kaydı yok ise yeni progress kaydı oluştur.
console.log("hey new progress is saved here --> requestbody",req.body)
let duration= course.duration //it should be second also

let newTotalWatch= 0// it is second
let remainingTime=duration -newTotalWatch
let percentage= newTotalWatch/duration
        const newVideo = new myProgressSchema({
          ...req.body,
          playlistIndex:0,
          totalWatch:newTotalWatch,
          completePercentage:percentage,
          remainingTime:  remainingTime,
          course: req.params.courseId,
          user: req.user._id,
        });

       
        //AŞağıda oluşturulan yeni progree kaydının idsi mevcut
        const { _id } = await newVideo.save();

        console.log("hey new progress is saved here --> requestbody,newVideo,progressid",req.body,newVideo)
        ///User Schemaya da  progress kaydı  atıyoruz ki daha sonra get /me ile ulaşabilelim
        const user= await UserSchema.findByIdAndUpdate(
          req.user._id,
          {
            $addToSet: {
              myProgress: _id,
            },
          },
          { runValidators: true, new: true }
        );
         ///Video Schemaya da  progress kaydı  atıyoruz ki daha sonra get /videos ile ulaşabilelim
         const video= await VideoSchema.findByIdAndUpdate(
          req.params.courseId,
          {
            $addToSet: {
              myProgress: _id,
            },
          },
          { runValidators: true, new: true }
        );

        res.status(201).send(newVideo);
      }
    } else {
      //bu id ile bir kurs mevcut değil
      const error = new Error();
      error.httpStatusCode = 404;
      next(error);
    }
  } catch (error) {
    next(error);
  }
});
//POST COMPLETE SITUTATION PROGRESS OF A COURSE
userRouter.post("/myLearning/:courseId/complete", authorize, async (req, res, next) => {
 

//  if exists push complete into Array
//  if not create a progress



  try {

    //  find course, 
    const id = req.params.courseId;

    const course = await VideoSchema.findById(id);

//  if exists find progress schema 
    if (course) { 
      let playlistIndex=req.body.index +1
      const completed = new completedSchema(req.body)
      const completedToInsert = { ...completed.toObject()}
      console.log(completed,completedToInsert)
   
      const modifiedVideo =await myProgressSchema.findOneAndUpdate(
      {
        "user": req.user._id,
        "course": req.params.courseId,
      },
     
      { $push: {
        completed: completedToInsert,
      },},
      {
        runValidators: true,
        new: true,
        }
      )

      
      

      res.send(modifiedVideo);
     
    }
    else{    //bu id ile bir kurs mevcut değil
      const error = new Error();
      error.httpStatusCode = 404;
      next(error);}

 
   

  } catch (error) {
    next(error)
  }

});



userRouter.get("/myLearning", authorize, async (req, res, next) => {
  try {
    const userId = req.user._id;
    const myCourses = await  myProgressSchema.find(
      {
          user: userId
      }
    )
    .populate('course')
    .populate('user')

    // const myCourses = await UserSchema.find({
    //   _id: userId,
    // })
    //   .populate("likedVideos")
    //   .populate("savedVideos")
    //   .populate("myProgress")
    //   .populate('course')
    //   .populate('user');

    if (myCourses) {
      res.send(myCourses);
    } else {
      const error = new Error(` you have no course`);
      error.httpStatusCode = 404;
      next(error);
    }
  } catch (error) {
    return next(error);
  }
});

userRouter.get("/myLearning/:courseId", authorize, async (req, res, next) => {
  try {
    const userId = req.user._id;
    const courseId = req.params.courseId;
    const myProgress = await  myProgressSchema.find(
      {
          user: userId,
          course: courseId
      }
    )
    .populate('course')


    // const myProgress = await UserSchema.find({
    //   _id: userId,
    // })
    //   .populate("likedVideos")
    //   .populate("savedVideos")
    //   .populate("myProgress")
    //   .populate('course')
    //   .populate('user');

    if (myProgress) {
      console.log(typeof myProgress[0])
      res.send(myProgress[0]);
    } else {
      const error = new Error(` you have no course`);
      error.httpStatusCode = 404;
      next(error);
    }
  } catch (error) {
    return next(error);
  }
});

// userRouter.post("/:courseId/myProgress", authorize,async (req, res, next) => {
//   try {
 
   
//     const myProgress = new myProgressSchema(req.body)
    
//     const progressToinsert = { ...myProgress.toObject(),course:req.params.courseId}
//     console.log(myProgress,progressToinsert)

//     const updated = await UserSchema.findByIdAndUpdate(
//       req.user._id,
//       {
//         $push: {
//           myProgress: progressToinsert,
//         },
//       },
//       { runValidators: true, new: true }
//     )
//     res.status(201).send(updated)
//   } catch (error) {
//     next(error)
//   }
// })


// userRouter.get("/myProgress", authorize,async (req, res, next) => {
//   try {
//     const { myProgress} = await UserSchema.findById(req.user._id, {
//       myProgress: 1,
//       _id: 0,
//     }).populate("course")
//     res.send(myProgress)
//   } catch (error) {
//     console.log(error)
//     next(error)
//   }
// })


module.exports = userRouter;
