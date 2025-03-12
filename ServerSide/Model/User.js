const mongoose = require("mongoose");
const userSchema = new mongoose.Schema({
  Name: {
    type: String,
    require: true,
    trim: true,
  },

  email: {
    type: String,
    require: true,
    trim: true,
  },
  password: {
    type: String,
    require: true,
  },
  contactNumber: {
    type: Number,
    require: false,
  },
  image: {
    type: String,
    require: true,
  },
  accountType: {
    type: String,
    enum: ["farmer", "customer"],
    require: true,
  },
  token: {
    type: String,
    require: false,
  },
  resetPasswordExpire: {
    type: Date,
    require: false,
  },
  additionalDetail: {
    type: mongoose.Schema.Types.ObjectId,
    require: true,
    ref: "Profile",
  },

  Products: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
    },
  ],
  FarmName:{
    type:String,
    require:true
  },
  FarmLocation:{
    type:String,
    require:true
  }
});
module.exports = mongoose.model("User", userSchema);
