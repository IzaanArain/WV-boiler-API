const mongoose = require("mongoose");
const Users = mongoose.model("Users");
const bcrypt = require("bcrypt");
const { pushNotifications } = require("../utils/utils");
const stripe = require("stripe")(process.env.STRIPE_KEY);

const socialLogin = async (req, res) => {
  const { socialToken, socialType, devicetoken, devicetype, name, email, phone } = req.body;
  try {
    if (!socialToken) {
      return res.status(400).send({ status: 0, message: "User Social Token field can't be empty" });
    } else if (!socialType) {
      return res.status(400).send({ status: 0, message: "User Social Type field can't be empty" });
    } else {
      const users = await Users.findOne({ user_social_token: socialToken });
      if (!users) {
        const createCustomer = await stripe.customers.create({
          description: "New Customer Created",
        });
        const user = new Users({ name, phone, email, stripeId: createCustomer?.id, isProfileCompleted: 0, user_social_token: socialToken, user_social_type: socialType, user_device_type: devicetype, user_device_token: devicetoken, isVerified: 1 });
        // await user.generateAuthToken();
        await user.save();
        return res.status(200).send({ status: 1, message: "Account Created Successfully", data: user });
      } else if (users?.isDeleted == 1) {
        return res.status(200).send({ status: 1, message: "Account is deleted", data: users });
      } else {
        const users = await Users.findOne({ user_social_token: socialToken, isDeleted: 0 });
        if (users?.isProfileCompleted == 0) {
          return res.status(400).send({ status: 0, message: "Profile is not completed", data: users });
        } else {
          await users.generateAuthToken();
          users.user_device_token = devicetoken;
          users.user_device_type = devicetype;
          await users.save();
          return res.status(200).send({ status: 1, message: "Login Successfully", data: users });
        }
      }
    }
  } catch (e) {
    return res.status(500).send({ status: 0, message: "Something went wrong" });
  }
};

const signUp = async (req, res) => {
  try {
    const { email, password, confirmPassword, devicetoken, devicetype } = req.body;
    const otp = Math.floor(100000 + Math.random() * 900000);
    const ex = await Users.findOne({ email: email?.toLowerCase() });
    const emailValidation = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    const pass = /^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{7,15}$/;
    if (!email) {
      return res.status(400).send({ status: 0, message: "Email field can't be empty" });
    } else if (!email.match(emailValidation)) {
      return res.status(400).send({ status: 0, message: "You have enter invalid email address." });
    } else if (ex) {
      return res.status(400).send({ status: 0, message: `Email Already Exist` });
    } else if (ex?.isDeleted == 1) {
      return res.status(400).send({ status: 0, message: `Account is deleted` });
    } else if (!password) {
      return res.status(400).send({ status: 0, message: "Password field can't be empty" });
    } else if (!password.match(pass)) {
      return res.status(400).send({ status: 0, message: "Password should be 8 characters long (should contain uppercase, lowercase, numeric and special character)" });
    } else if (!confirmPassword) {
      return res.status(400).send({ status: 0, message: "Confirm Password field can't be empty" });
    } else if (!confirmPassword.match(pass)) {
      return res.status(400).send({ status: 0, message: "Password and Confirm Password must be same" });
    } else if (password != confirmPassword) {
      return res.status(400).send({ status: 0, message: "Password and Confirm Password must be same" });
    } else {
      const createCustomer = await stripe.customers.create({
        email,
      });
      const user = new Users({
        stripeId: createCustomer?.id,
        email: email,
        password,
        otp: 123456,
        user_device_token: devicetoken,
        user_device_type: devicetype,
      });
      await user.save();
      // sendVerificationEmail(user)
      return res.status(200).send({ status: 1, message: "OTP verification code has been sent to your email address.", data: { _id: user._id } });
    }
  } catch (err) {
    return res.status(500).send({ status: 0, message: "Something went wrong" });
  }
};

const completeProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const { basics, career, physical, personality, theTea, description, long, lat, address } = req.body;
    const basicsJSON = JSON.parse(basics);
    const careerJSON = JSON.parse(career);
    const physicalJSON = JSON.parse(physical);
    const personalityJSON = JSON.parse(personality);
    const theTeaJSON = JSON.parse(theTea);
    const user = await Users.findOne({ _id: id });
    if (user) {
      if (user.isVerified == 0) {
        return res.status(200).send({ status: 1, message: "User is Not Verified", data: user });
      } else {
        var otherImages = [];
        if (req.files.otherImages !== undefined) {
          for (let i = 0; i < req.files.otherImages.length; i++) {
            otherImages.push(req.files.otherImages[i].path);
          }
        } else {
          otherImages = [];
        }
        console.log(req.files);
        user.basics = basicsJSON;
        user.career = careerJSON;
        user.physical = physicalJSON;
        user.personality = personalityJSON;
        user.theTea = theTeaJSON;
        user.isProfileCompleted = 1;
        user.description = description;
        user.location.coordinates = [long ? parseFloat(long) : 0, lat ? parseFloat(lat) : 0];
        user.location.address = address;
        user.imageName = req.files.profileImage?.length > 0 ? req.files?.profileImage[0].path : null;
        user.otherImages = otherImages;
        await user.generateAuthToken();
        await user.save();
        return res.status(200).send({ status: 1, message: "Profile completed successfully", data: user });
      }
    } else {
      return res.status(400).send({ status: 0, message: "User not found" });
    }
  } catch (err) {
    return res.status(500).send({ status: 0, message: "Something went wrong" });
  }
};

const resendOTP = async (req, res) => {
  try {
    const { id } = req.body;
    const otp = Math.floor(100000 + Math.random() * 900000);
    const user = await Users.findOne({ _id: id });
    if (!user) {
      return res.status(400).send({ status: 0, message: "Invalid User" });
    } else {
      user.otp = 123456;
      await user.save();
      return res.status(200).send({ status: 1, message: "We have resend  OTP verification code at your email address", data: { _id: user._id } });
    }
  } catch (error) {
    return res.status(500).send({ status: 0, message: "Something went wrong" });
  }
};

const verifyAccount = async (req, res) => {
  try {
    const { otp, id } = req.body;
    if (!otp) {
      return res.status(400).send({ status: 0, message: "OTP field can't be empty." });
    } else {
      const user = await Users.findOne({ _id: id });
      if (!user) {
        return res.status(400).send({ status: 0, message: "Invalid User" });
      } else {
        if (otp != user.otp) {
          return res.status(400).send({ status: 0, message: "Invalid OTP Verification Code." });
        } else {
          // await user.generateAuthToken();
          user.isVerified = 1;
          user.save();
          return res.status(200).send({ status: 1, message: "Account Verified successfully", data: user });
        }
      }
    }
  } catch (error) {
    return res.status(500).send({ status: 0, message: "Something went wrong" });
  }
};

const forgetPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const otp = Math.floor(100000 + Math.random() * 900000);
    const emailValidation = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    const user = await Users.findOne({ email: email?.toLowerCase() });
    if (!email) {
      return res.status(400).send({ status: 0, message: "Email field can't be empty" });
    } else if (!email.match(emailValidation)) {
      return res.status(400).send({ status: 0, message: "Invalid email address" });
    }
    if (!user) {
      return res.status(400).send({ status: 0, message: "User not found" });
    } else {
      user.otp = 123456;
      user.token = null;
      user.isForget = 1;
      await user.save();
      // sendVerificationEmail(user)
      return res.status(200).send({ status: 1, message: "OTP verification code has been sent to your email.", data: { _id: user._id } });
    }
  } catch (error) {
    return res.status(500).send({ status: 0, message: "Something went wrong" });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { newPassword, confirmNewPassword, id } = req.body;
    const pass = /^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{7,15}$/;
    if (!newPassword) {
      return res.status(400).send({ status: 0, message: "New Password field can't be empty" });
    } else if (!newPassword.match(pass)) {
      return res.status(400).send({ status: 0, message: "Password should be 8 characters long (should contain uppercase, lowercase, numeric and special character)" });
    } else if (!confirmNewPassword) {
      return res.status(400).send({ status: 0, message: "Confirm Password field can't be empty" });
    } else if (!confirmNewPassword.match(pass)) {
      return res.status(400).send({ status: 0, message: "Password should be 8 characters long (should contain uppercase, lowercase, numeric and special character)" });
    } else if (newPassword != confirmNewPassword) {
      return res.status(400).send({ status: 0, message: "New Password and Confirm New Password must be same" });
    } else {
      const userCheck = await Users.findOne({ _id: id });
      if (!userCheck) {
        return res.status(400).send({ status: 0, message: "User not found" });
      } else if (userCheck.isVerified === 0) {
        return res.status(400).send({ status: 0, message: "Verify your account" });
      } else {
        let salt = await bcrypt.genSalt(10);
        let pass = await bcrypt.hash(newPassword, salt);
        const user = await Users.findByIdAndUpdate({ _id: userCheck._id }, { $set: { password: pass, isForget: 0 } }, { new: true });
        res.status(200).send({ status: 1, message: "Password changed successfully", data: user });
      }
    }
  } catch (err) {
    return res.status(500).send({ status: 0, message: "Something went wrong" });
  }
};

const editProfile = async (req, res) => {
  try {
    const { basics, career, physical, personality, theTea, description, long, lat, address, prevGallery } = req.body;
    const user = await Users.findOne({ _id: req.user._id });
    if (user) {
      if (user.isVerified == 0) {
        return res.status(200).send({ status: 1, message: "User is Not Verified", data: user });
      } else {
        var otherImages = [];
        if (req.files.otherImages !== undefined) {
          for (let i = 0; i < req.files.otherImages.length; i++) {
            otherImages.push(req.files.otherImages[i].path);
          }
        } else {
          otherImages = [];
        }
        if (prevGallery !== undefined) {
          const previmages = JSON.parse(prevGallery);
          if (previmages.length > 0) {
            for (let i = 0; i < previmages.length; i++) {
              otherImages.push(previmages[i]);
            }
          } else {
            if (previmages.length > 0) {
              for (let i = 0; i < previmages.length; i++) {
                otherImages.push(previmages[i]);
              }
            }
          }
        }
        user.basics = basics ? JSON.parse(basics) : req.user.basics;
        user.career = career ? JSON.parse(career) : req.user.career;
        user.physical = physical ? JSON.parse(physical) : req.user.physical;
        user.personality = personality ? JSON.parse(personality) : req.user.personality;
        user.theTea = theTea ? JSON.parse(theTea) : req.user.theTea;
        user.description = description ? description : req.user.description;
        user.location.coordinates = [long ? parseFloat(long) : req.user.location?.coordinates[0], lat ? parseFloat(lat) : req.user.location?.coordinates[1]];
        user.location.address = address ? address : req.user.address;
        user.imageName = req.files.profileImage?.length > 0 ? req.files?.profileImage[0].path : req.user.imageName;
        user.otherImages = otherImages;
        await user.save();
        return res.status(200).send({ status: 1, message: "Profile updated successfully", data: user });
      }
    } else {
      return res.status(400).send({ status: 0, message: "User not found" });
    }
  } catch (err) {
    return res.status(500).send({ status: 0, message: "Something went wrong", err: err.message });
  }
};

const signIn = async (req, res) => {
  try {
    const { email, password, devicetoken, devicetype } = req.body;
    const emailValidation = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    if (!email) {
      return res.status(400).send({ status: 0, message: "Email field can't be empty" });
    } else if (!email.match(emailValidation)) {
      return res.status(400).send({ status: 0, message: "Invalid email address" });
    }
    const user = await Users.findOne({ email: email?.toLowerCase() });
    if (!user) {
      return res.status(400).send({ status: 0, message: "User not found" });
    } else if (user?.block) {
      return res.status(401).send({ status: 0, message: "Account blocked" });
    } else if (!password) {
      return res.status(400).send({ status: 0, message: "Password field can't be empty" });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).send({ status: 0, message: "Invalid password" });
    } else if (user?.isDeleted == 1) {
      return res.status(200).send({ status: 1, message: `Account is deleted`, data: user });
    } else if (user.isVerified === 0) {
      return res.status(400).send({ status: 0, message: "User is Not Verified", data: user });
    } else if (user.isProfileCompleted === 0) {
      return res.status(400).send({ status: 0, message: "Profile is not completed", data: user });
    } else {
      await user.generateAuthToken();
      user.user_device_type = devicetype;
      user.user_device_token = devicetoken;
      await user.save();
      res.status(200).send({ status: 1, message: "Login successfully", data: user });
    }
  } catch (err) {
    return res.status(500).send({ status: 0, message: "Something went wrong" });
  }
};

const updatePassword = async (req, res) => {
  try {
    const pass = /^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{7,15}$/;
    const { existingPassword, confirmNewPassword, newPassword } = req.body;
    if (!existingPassword) {
      return res.status(400).send({ status: 0, message: "Current Password field can't be empty" });
    }
    const userCheck = await Users.findOne({ _id: req.user._id });
    const isMatch = await bcrypt.compare(existingPassword, userCheck.password);
    if (!isMatch) {
      return res.status(400).send({ status: 0, message: "Invalid Current Password" });
    } else if (!newPassword) {
      return res.status(400).send({ status: 0, message: "New Password field can't be empty" });
    } else if (!newPassword.match(pass)) {
      return res.status(400).send({ status: 0, message: "Password should be 8 characters long (should contain uppercase, lowercase, numeric and special character)" });
    } else if (!confirmNewPassword) {
      return res.status(400).send({ status: 0, message: "Confirm New Password field can't be empty" });
    } else if (!confirmNewPassword.match(pass)) {
      return res.status(400).send({ status: 0, message: "Password should be 8 characters long (should contain uppercase, lowercase, numeric and special character)" });
    } else if (newPassword !== confirmNewPassword) {
      return res.status(400).send({ status: 0, message: "New Password and Confirm New Password should be same" });
    } else if (existingPassword == newPassword || existingPassword == confirmNewPassword) {
      return res.status(400).send({ status: 0, message: "Current password and new password can't be same" });
    } else if (!userCheck) {
      return res.status(400).send({ status: 0, message: "User Not Found" });
    } else {
      await userCheck.comparePassword(existingPassword);
      const salt = await bcrypt.genSalt(10);
      const pass = await bcrypt.hash(newPassword, salt);
      await Users.findByIdAndUpdate({ _id: req.user._id }, { $set: { password: pass } });
      res.status(200).send({ status: 1, message: "Password changed successfully" });
    }
  } catch (err) {
    return res.status(500).send({ status: 0, message: "Something went wrong" });
  }
};

const notificationToggle = async (req, res) => {
  try {
    const user = await Users.findOne({ _id: req.user._id });
    if (!user) {
      return res.status(400).send({ status: 0, message: "User not found" });
    } else {
      if (user?.notification == "on") {
        const user = await Users.findOneAndUpdate(
          { _id: req.user._id },
          {
            notification: "off",
          },
          { new: true }
        );
        res.status(200).send({ status: 1, message: "Notification off", data: user });
      } else {
        const user = await Users.findOneAndUpdate(
          { _id: req.user._id },
          {
            notification: "on",
          },
          { new: true }
        );
        res.status(200).send({ status: 1, message: "Notification on", data: user });
      }
    }
  } catch (err) {
    return res.status(500).send({ status: 0, message: "Something went wrong" });
  }
};

const signOut = async (req, res) => {
  try {
    const user = await Users.findOne({ _id: req.user._id });
    if (!user) {
      return res.status(400).send({ status: 0, message: "User not found" });
    } else {
      user.token = null;
      user.user_device_type = null;
      user.user_device_token = null;
      user.save();
      res.status(200).send({ status: 1, message: "Logout successfully" });
    }
  } catch (err) {
    return res.status(500).send({ status: 0, message: "Something went wrong" });
  }
};

const deleteAccount = async (req, res) => {
  try {
    const deleteUser = await Users.findByIdAndUpdate({ _id: req.user._id }, { $set: { isDeleted: 1 } });
    if (deleteUser) {
      res.status(200).send({ status: 1, message: "Account deleted successfully" });
    } else {
      return res.status(400).send({ status: 0, message: "User not found" });
    }
  } catch (err) {
    return res.status(500).send({ status: 0, message: "Something went wrong" });
  }
};

const recoverAccount = async (req, res) => {
  try {
    const _id = req.params.id;
    const recoverAccount = await Users.findByIdAndUpdate({ _id: _id }, { $set: { isDeleted: 0 } });
    await recoverAccount.generateAuthToken();
    if (recoverAccount) {
      res.status(200).send({ status: 1, message: "Account recovered successfully", data: recoverAccount });
    } else {
      return res.status(400).send({ status: 0, message: "User not found" });
    }
  } catch (err) {
    return res.status(500).send({ status: 0, message: "Something went wrong" });
  }
};


module.exports = { signUp, completeProfile, resendOTP, verifyAccount, forgetPassword, resetPassword, signIn, signOut, socialLogin, editProfile, updatePassword, notificationToggle, deleteAccount,recoverAccount};
