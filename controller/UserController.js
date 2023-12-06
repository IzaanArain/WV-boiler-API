const mongoose = require("mongoose");
const User = mongoose.model("Users");

//sign up
const signup = async (req, res) => {
  try {
    const { email, deviceToken, deviceType } = req?.body;
    const otp = Math.floor(Math.random() * 900000) + 100000;
    const ex = await User.findOne({ email: email?.toLowerCase() });
    const emailValidation = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    if (!email) {
      return res
        .status(400)
        .send({ status: 0, message: "Email field can't be empty" });
    } else if (!email.match(emailValidation)) {
      return res.status(400).send({
        status: 0,
        message: "You have entered invalid email address.",
      });
    } else if (ex) {
      return res
        .status(400)
        .send({ status: 0, message: `Email Already Exist` });
    } else if (ex?.isDeleted == 1) {
      return res.status(400).send({ status: 0, message: `Account is deleted` });
    }
    const signupUser = await User.create({
      email,
      otp: 123456,
      deviceToken,
      deviceType,
    });
    const userId = signupUser?._id;
    if (signupUser) {
      return res.status(200).send({
        status: 1,
        message: "OTP verification code has been sent to your email address.",
        data: { id: userId },
      });
    } else {
      return res.status(400).send({ status: 0, message: "sign up failed" });
    }
  } catch (err) {
    console.error("error", err.message);
    return res.status(500).send({
      status: 0,
      message: "Something went wrong",
    });
  }
};

//verify otp
const otpVerify = async (req, res) => {
  try {
    const { id, otp } = req?.body;
    if (!id) {
      return res.status(400).send({
        status: 0,
        message: "please enter id",
      });
    } else if (!otp) {
      return res.status(400).send({
        status: 0,
        message: "otp field can't be empty",
      });
    } else if (!mongoose.isValidObjectId(id)) {
      return res.status(400).send({
        status: 0,
        message: "not a valid ID",
      });
    }
    // if (otp.length !== 6) {
    //   return res.status(400).send({
    //     status: 0,
    //     message: "OTP code must be of six digits",
    //   });
    // }
    // if (!otp.match(/^[0-9]*$/)) {
    //   return res.status(400).send({
    //     status: 0,
    //     message: "OTP code consists of numbers only",
    //   });
    // }
    const user = await User.findById(id);
    if (!user) {
      return res.status(400).send({
        status: 0,
        message: "user not found",
      });
    }
    const userDeleted = user?.isDeleted;
    const userBlocked = user?.isBlocked;
    if (userDeleted === 1) {
      return res.status(200).send({
        status: 0,
        message:
          "user account has been deleted, please contact admin for further details",
      });
    } else if (userBlocked === 1) {
      return res.status(200).send({
        status: 0,
        message:
          "user account has been blocked, please contact admin for further details",
      });
    }

    const user_otp_code = user?.otp;
    if (user_otp_code === parseInt(otp)) {
      user.isVerified = 1;
      await user.save();
      await user.generateAuthToken();
      if (user) {
        return res.status(200).send({
          status: 1,
          message: "user verified",
          data: user,
        });
      } else {
        return res.status(400).send({
          status: 0,
          message: "failed to verify user",
        });
      }
    } else {
      return res.status(400).send({
        status: 0,
        message: "OTP does not match",
      });
    }
  } catch (err) {
    console.error("error", err);
    return res.status(500).send({
      status: 0,
      message: "Something went wrong",
    });
  }
};

//sign in
const signin = async (req, res) => {
  try {
    const { email, deviceToken, deviceType } = req?.body;
    const emailValidation = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    if (!email) {
      return res
        .status(400)
        .send({ status: 0, message: "Email field can't be empty" });
    } else if (!email.match(emailValidation)) {
      return res.status(400).send({
        status: 0,
        message: "You have entered invalid email address.",
      });
    }
    const user = await User.findOne({ email: email?.toLowerCase() });
    const userDeleted = user?.isDeleted;
    const userBlocked = user?.isBlocked;
    // if (!user) {
    //   return res.status(400).send({
    //     status: 0,
    //     message: "user not found",
    //   });
    // }
    if (!user) {
      const gen_otp_code = Math.floor(Math.random() * 900000) + 100000;
      const newUser = new User({
        email,
        otp: 123456,
        deviceToken,
        deviceType,
      });
      newUser.save();
      const userId = newUser?._id;
      return res.status(200).send({
        status: 1,
        message: "otp generated successfully",
        data: { id: userId },
      });
    } else if (userDeleted === 1) {
      return res.status(200).send({
        status: 0,
        message:
          "user account has been deleted, please contact admin for further details",
      });
    } else if (userBlocked === 1) {
      return res.status(200).send({
        status: 0,
        message:
          "user account has been blocked, please contact admin for further details",
      });
    } else {
      const gen_otp_code = Math.floor(Math.random() * 900000) + 100000;
      const loginUser = await User.findOneAndUpdate(
        { email },
        {
          otp: 123456,
          deviceToken,
          deviceType,
        },
        { new: true }
      );
      const userId = loginUser?._id;
      if (loginUser) {
        return res.status(200).send({
          status: 1,
          message: "otp generated successfully",
          data: { id: userId },
        });
      } else {
        return res.status(400).send({ status: 0, message: "login failed" });
      }
    }
  } catch (err) {
    return res.status(500).send({
      status: 0,
      message: "Something went wrong",
    });
  }
};

const socialLogin = async (req, res) => {
  try {
    const { socialPhone, deviceToken, deviceType, socialToken, socialType } =
      req.body;
    if (!socialType) {
      return res.status(400).send({
        status: 0,
        message: "please enter social type",
      });
    } else if (!socialToken) {
      return res.status(400).send({
        status: 0,
        message: "please enter social token",
      });
    } else if (!deviceToken) {
      return res.status(400).send({
        status: 0,
        message: "please enter social token",
      });
    } else if (!deviceType) {
      return res.status(400).send({
        status: 0,
        message: "please enter social token",
      });
    }
    const user = await User.findOne({ socialToken: socialToken });
    if (!user) {
      const new_user = new User({
        socialPhone,
        socialToken,
        socialType,
        deviceToken,
        deviceType,
      });
      await new_user.save();
      console.log(new_user);
      new_user.isVerified = 1;
      await new_user?.generateAuthToken();
      return res.status(200).send({
        status: 1,
        message: "social login successful",
        data: new_user,
      });
    } else {
      const userDeleted = user?.isDeleted;
      const user_blocked = user?.isblocked;
      if (userDeleted === 1) {
        return res.status(200).send({
          status: 0,
          message: "user account has been deleted",
        });
      } else if (user_blocked === 1) {
        return res.status(200).send({
          status: 0,
          message: "user account has been blocked",
        });
      } else {
        user.isVerified = 1;
        user.deviceToken = deviceToken;
        user.deviceType = deviceType;
        await user.save();
        await user.generateAuthToken();
        return res.status(200).send({
          status: 1,
          message: "social login successful",
          data: user,
        });
      }
    }
  } catch (err) {
    return res.status(500).send({
      status: 0,
      message: "Something went wrong",
      err: err.message,
    });
  }
};

//resend otp
const resendOTP = async (req, res) => {
  try {
    const id = req?.query?.id;
    if (!id) {
      return res.status(400).send({
        status: 0,
        message: "please enter id",
      });
    } else if (!mongoose.isValidObjectId(id)) {
      return res.status(400).send({
        status: 0,
        message: "not a valid ID",
      });
    }
    const user = await User.findById(id);
    if (!user) {
      return res.status(400).send({
        status: 0,
        message: "user not found",
      });
    }
    const gen_otp_code = Math.floor(Math.random() * 900000) + 100000;
    const updateUser = await User.findByIdAndUpdate(
      id,
      { otp: 123456 },
      { new: true }
    );
    const userId = updateUser?._id;
    return res.status(200).send({
      status: 1,
      message: "otp resend successfully",
      data: { id: userId },
    });
  } catch (err) {
    return res.status(500).send({
      status: 0,
      message: "Something went wrong",
    });
  }
};

//signout
const logout = async (req, res) => {
  try {
    // const id = req?.query?.id;
    const id = req?.user?._id;
    if (!id) {
      return res.status(400).send({
        status: 0,
        message: "please enter id",
      });
    } else if (!mongoose.isValidObjectId(id)) {
      return res.status(400).send({
        status: 0,
        message: "not a valid ID",
      });
    }
    const user = await User.findById(id);
    if (!user) {
      return res.status(400).send({
        status: 0,
        message: "user not found",
      });
    }
    const updatedUser = await User.findByIdAndUpdate(
      id,
      {
        token: null,
        isVerified: 0,
        otp_code: null,
        deviceToken: null,
        deviceToken: null,
      },
      { new: true }
    );
    return res.status(200).send({
      status: 0,
      message: "signout successfully",
    });
  } catch (err) {
    return res.status(500).send({
      status: 0,
      message: "Something went wrong",
    });
  }
};

//complete profile
const completeProfile = async (req, res) => {
  try {
    const userId = req?.user?._id;
    const { name, phone } = req.body;
    if (!name) {
      return res.status(400).send({
        status: 0,
        message: "name field can't be empty",
      });
    } else if (!phone) {
      return res.status(400).send({
        status: 0,
        message: "phone number field can't be empty",
      });
    } else if (
      !phone.match(
        /^(\+\d{1,2}\s?)?(\d{10}|\d{3}[-\.\s]?\d{3}[-\.\s]?\d{4}|\(\d{3}\)[-\.\s]?\d{3}[-\.\s]?\d{4})$/
      )
    ) {
      return res.status(400).send({
        status: 0,
        message: "please enter valid phone number",
      });
    }
    const profileImage = req?.files?.profileImage;
    const profileImagePath = profileImage
      ? profileImage[0]?.path.replace(/\\/g, "/")
      : null;
    const user = await User.findByIdAndUpdate(
      userId,
      {
        name,
        phone,
        profileImage: profileImagePath,
        isProfileCompleted: 1,
      },
      { new: true }
    );
    return res.status(200).send({
      status: 1,
      message: "complete profile successful",
      data: user,
    });
  } catch (err) {
    return res.status(500).send({
      status: 0,
      message: "Something went wrong",
    });
  }
};

const myProfile = async (req, res) => {
  try {
    const userId = req?.user?._id;
    const user = await User.findById(userId);
    return res.status(200).send({
      status: 1,
      message: "user profile",
      data: user,
    });
  } catch (err) {
    return res.status(500).send({
      status: 0,
      message: "Something went wrong",
    });
  }
};
//delete profile
const deleteProfile = async (req, res) => {
  try {
    const userId = req?.user._id;
    const deletedUser = await User.findByIdAndUpdate(
      userId,
      {
        isDeleted: 1,
      },
      { new: true }
    );
    return res.status(200).send({
      status: 1,
      message: "user deleted successfully",
    });
  } catch (err) {
    return res.status(500).send({
      status: 0,
      message: "Something went wrong",
      err: err.message,
    });
  }
};

const recoverAccount = async (req, res) => {
  try {
    const _id = req.query.id;
    if (!_id) {
      return res.status(400).send({
        status: 0,
        message: "id is required",
      });
    } else if (!mongoose.isValidObjectId(_id)) {
      return res.status(400).send({
        status: 0,
        message: "not a valid ID",
      });
    }
    const recoverAccount = await User.findByIdAndUpdate(
      { _id: _id },
      { $set: { isDeleted: 0 } },
      { new: true }
    );
    await recoverAccount.generateAuthToken();
    if (recoverAccount) {
      res
        .status(200)
        .send({
          status: 1,
          message: "Account recovered successfully",
          data: recoverAccount,
        });
    } else {
      return res.status(400).send({ status: 0, message: "User not found" });
    }
  } catch (err) {
    return res.status(500).send({ status: 0, message: "Something went wrong" });
  }
};

module.exports = {
  signup,
  otpVerify,
  signin,
  socialLogin,
  resendOTP,
  logout,
  completeProfile,
  deleteProfile,
  myProfile,
  recoverAccount,
};
