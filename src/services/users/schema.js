const { Schema, model } = require("mongoose");
const bcrypt = require("bcryptjs");

const UserSchema = new Schema(
  
    {
      email: {
      type: String,
      required: true,
      unique: true,
    },
    googleId: String,
      
      password: {
        type: String,
        //	required: true,
      },
      
      userName: String,
      name: String,
      surname: String,
      profilePic: String,
    
      likedVideos :[{ type: Schema.Types.ObjectId, ref: "Video" }],
      savedVideos: [{ type: Schema.Types.ObjectId, ref: "Video" }],
  
  
      skills:[{
        skills: String
        
        }],
  
        posts: [{ type: Schema.Types.ObjectId, ref: "Post" }],
    
      comments: [{ type: Schema.Types.ObjectId, ref: "Comment" }],
      likedPosts: [{ type: Schema.Types.ObjectId, ref: "Post" }],
      likedComments: [{ type: Schema.Types.ObjectId, ref: "Comment" }],
  
      

    // refreshTokens: [
    //   {
    //     token: {
    //       type: String,
    //     },
    //   },
    // ],
  },
  { timestamps: true }
);


UserSchema.methods.toJSON = function () {
  const user = this
  const userObject = user.toObject()

  delete userObject.password
  delete userObject.__v

  return userObject
}

UserSchema.pre("save", async function (next) {
  const user= this
  const plainPW = user.password

  if (user.isModified("password")) {
    user.password = await bcrypt.hash(plainPW, 10)
  }
  next()
})

UserSchema .statics.findByCredentials = async function(email, plainPW)  {
  const user = await this.findOne({ email })
  
  if (user) {
    const isMatch = await bcrypt.compare(plainPW, user.password)
    console.log("isMatch?",isMatch)
    if (isMatch) 
    return user
    else return null
  } else {
    return null
  }
}

UserSchema.static("findCourseInMyList", async function (id, courseId) {
  const isCourseThere = await UserSchema.findOne({
    _id: id,
    "myVideos._id": courseId,
  })
  return isCourseThere
})


UserSchema.static("addVideosToMyList", async function (id, video) {
  await UserSchema.findOneAndUpdate(
    { _id: id },
    {
      $push: { myVideos: video},
    }
  )
})



module.exports = model("user", UserSchema);
