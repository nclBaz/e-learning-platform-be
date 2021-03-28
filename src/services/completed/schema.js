const { Schema, model } = require("mongoose")

const completedSchema = new Schema(
  {
  index: { type: Number, required: true ,unique: true }
    
   
  },
  {
    timestamps: true,
  }
)

module.exports = model("completed", completedSchema)