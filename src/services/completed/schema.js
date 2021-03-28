const { Schema, model } = require("mongoose")

const completedSchema = new Schema(
  {
  index: { type: String, required: true ,unique: true }
    
   
  },
  {
    timestamps: true,
  }
)

module.exports = model("completed", completedSchema)