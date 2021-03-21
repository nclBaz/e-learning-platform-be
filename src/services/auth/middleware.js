const jwt = require("jsonwebtoken")
const UserSchema = require("../users/Schema")
const { verifyJWT } = require("./tools")

const authorize = async (req, res, next) => {
  try {
    
    const token = req.header("Authorization").replace("Bearer ", "")

    const decoded = await verifyJWT(token)
    
    const user = await UserSchema.findOne({
      _id: decoded._id,
    })
    console.log("user:",user)

    if (!user) {
      throw new Error()
    }
    req.token = token
    req.user = user
    next()
  } catch (e) {
    const err = new Error("You have no permission , please authenticate")
    err.httpStatusCode = 401
    next(err)
  }
}

const adminOnlyMiddleware = async (req, res, next) => {
  if (req.user && req.user.role === "admin") next()
  else {
    const err = new Error("Only for admins!")
    err.httpStatusCode = 403
    next(err)
  }
}

module.exports = { authorize, adminOnlyMiddleware }