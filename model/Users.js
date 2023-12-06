const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: false,
      trim: true,
      default: null,
      lowercase: true,
    },
    name: {
      type: String,
      required: false,
      trim: true,
      default: null,
    },
    role:{
      type: String,
      enum:["user"],
      default: "user",
    },
    socialPhone: {
      type: String,
      required: false,
      trim: true,
      default: null,
    },
    phone: {
      type: String,
      required: false,
      trim: true,
      default: null,
    },
    profileImage: {
      type: String,
      required: false,
      trim: true,
      default: null,
    },
    otp: {
      type: Number,
      required: false,
      trim: true,
      default: null,
    },
    isVerified: {
      type: Number,
      default: 0,
    },
    token: {
      type: String,
      default: null
    },
    isProfileCompleted: {
      type: Number,
      default: 0,
    },
    notification: {
      type: String,
      required: false,
      trim: true,
      default: "on",
    },
    isForget: {
      type: Number,
      default: 0,
    },
    isBlocked: {
      type: Number,
      default: 0,
    },
    isDeleted: {
      type: Number,
      default: 0,
    },
    socialToken: {
      type: String,
      required: false,
      trim: true,
      default: null,
    },
    socialType: {
      type: String,
      required: false,
      trim: true,
      default: null,
    },
    deviceType: {
      type: String,
      required: false,
      trim: true,
      default: null,
    },
    deviceToken: {
      type: String,
      required: false,
      trim: true,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);
userSchema.pre("save", function (next) {
  const user = this;
  if (!user.isModified("password")) {
    return next();
  }
  bcrypt.genSalt(10, (err, salt) => {
    if (err) {
      return next(err);
    }
    bcrypt.hash(user.password, salt, (err, hash) => {
      if (err) {
        return next(err);
      }
      user.password = hash;
      next();
    });
  });
});

userSchema.methods.generateAuthToken = async function () {
  const user = this;
  const token = jwt.sign({ userId: user._id }, process.env.secret_Key);
  user.token = token;
  await user.save();
  return token;
};

userSchema.methods.comparePassword = function (candidatePassword) {
  const user = this;
  return new Promise((resolve, reject) => {
    bcrypt.compare(candidatePassword, user.password, (err, isMatch) => {
      if (err) {
        return reject(err);
      }
      if (!isMatch) {
        return reject(err);
      }
      resolve(true);
    });
  });
};
userSchema.index({ location: '2dsphere' });
mongoose.model("Users", userSchema);
