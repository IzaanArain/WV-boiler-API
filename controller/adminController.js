const mongoose = require("mongoose");
const Admins = mongoose.model("Admins");
const Users = mongoose.model("Users");
const TcPp = mongoose.model("TcPp");
const bcrypt = require("bcrypt");
const main = require("../index.js");
const { pushNotifications } = require("../utils/utils");
const moment = require("moment");
const Services = mongoose.model("service");
const BookServices = mongoose.model("bookService");

//done
const signIn = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email) {
      return res
        .status(400)
        .send({ status: 0, message: "Email field can't be empty" });
    } else if (!password) {
      return res
        .status(400)
        .send({ status: 0, message: "Password field can't be empty" });
    }
    const emaill = email.toLowerCase();
    const admin = await Admins.findOne({ email: emaill });
    var emailRegex =
      /^[-!#$%&'*+\/0-9=?A-Z^_a-z{|}~](\.?[-!#$%&'*+\/0-9=?A-Z^_a-z`{|}~])*@[a-zA-Z0-9](-*\.?[a-zA-Z0-9])*\.[a-zA-Z](-?[a-zA-Z0-9])+$/;
    if (!emaill.match(emailRegex)) {
      return res
        .status(400)
        .send({ status: 0, message: "Invalid Email Address" });
    }
    if (!admin) {
      return res.status(400).send({ status: 0, message: "User Not Found" });
    }
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res
        .status(400)
        .send({ status: 0, message: "Password is not valid" });
    } else {
      await admin.generateAuthToken();
      const adminDetail = await Admins.findOne({ _id: admin._id });
      res
        .status(200)
        .send({ status: 1, message: "Login Successfully", data: adminDetail });
    }
  } catch (err) {
    return res.status(500).send({ status: 0, message: "Something went wrong" });
  }
};

const getDashboard = async (req, res) => {
  try {
    const usersCount = await Users.countDocuments({ isDeleted: 0 });
    const servicesCount = await Services.countDocuments({});
    const bookedServices = await BookServices.countDocuments({});
    const currentyear = new Date().getFullYear();
    const startDate = new Date(`${currentyear}-01-01`);
    const endDate = new Date(`${currentyear + 1}-01-01`);
    // const users = await Users.find({});
    // const months = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
    const months = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    // monthly users
    const users = await Users.aggregate([
      {
        $match: {
          isDeleted: 0,
          createdAt: { $gte: startDate, $lt: endDate },
        },
      },
      {
        $group: {
          _id: { $month: "$createdAt" },
          count: { $sum: 1 },
        },
      },
    ]);
    const monthlyCount = months.map((month) => {
      let monthData = users.find((user) => {
        if (user._id === month) {
          return user;
        }
      });
      return {
        month: `${currentyear}-${month}`,
        users: monthData ? monthData.count : 0,
      };
    });
    // monthly services
    const services=await BookServices.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lt: endDate },
        },
      },
      {
        $group: {
          _id: { $month: "$createdAt" },
          count: { $sum: 1 },
        },
      },
    ])
    const monthlyServiceCount = months.map((month) => {
      let monthData = services.find((service) => {
        if (service._id === month) {
          return service;
        }
      });
      return {
        month: `${currentyear}-${month}`,
        services: monthData ? monthData.count : 0,
      };
    });
    // const monthlyCount=months.map((month)=>{
    //   let count=0
    //   users.forEach((user)=>{
    //     const userMonth = new Date(user.createdAt).getMonth();
    //     if(month===userMonth){
    //       count++
    //     }
    //   })
    //   return { month: `${currentyear}-${month+1}`, users: count }
    // });

    // const monthlyCount = [];
    // for (let i = 0; i < months.length; i++) {
    //   let count = 0;
    //   for (let j = 0; j < users.length; j++) {
    //     const userMonth = new Date(users[j].createdAt).getMonth();
    //     if (months[i] === userMonth) {
    //       //  count=count+1
    //       count++;
    //     }
    //     // if(moment(months[i]+1,"M").month()===moment(users[j].createdAt).month()){
    //     //   count++
    //     // }
    //   }
    //   montlyCount.push({ month: `${currentyear}-${months[i]}`, users: count });
    // };

    return res.status(200).send({
      status: 1,
      message: "sucesss",
      users: monthlyCount,
      services:monthlyServiceCount,
      data: {
        usersCount: usersCount,
        servicesCount: servicesCount,
        bookedServices: bookedServices,
      },
    });
  } catch (err) {
    return res
      .status(500)
      .send({ status: 0, message: "Something went wrong", err: err.message });
  }
};

//done
const signOut = async (req, res) => {
  try {
    const user = await Admins.findById({ _id: req.user._id });
    if (!user) {
      return res.status(400).send({ status: 0, message: "Admin Not Found" });
    } else {
      await Admins.findOneAndUpdate(
        { _id: req.user._id },
        {
          token: null,
        },
        { new: true }
      );
      res.status(200).send({ status: 1, message: "Admin Logged Out" });
    }
  } catch (err) {
    return res.status(500).send({ status: 0, message: "Something went wrong" });
  }
};

// //done
const updatePassword = async (req, res) => {
  try {
    const { currentPassword, confirmNewPassword, newPassword } = req.body;
    const passwordValidation =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    const usercheck = await Admins.findOne({ _id: req.user._id });
    if (!currentPassword) {
      return res
        .status(400)
        .send({ status: 0, message: "Current Password Is Required" });
    }
    const isMatch = await bcrypt.compare(currentPassword, usercheck.password);
    if (!isMatch) {
      return res
        .status(400)
        .send({ status: 0, message: "Invalid Current Password" });
    } else if (!newPassword) {
      return res
        .status(400)
        .send({ status: 0, message: "New Password Is Required" });
    } else if (!confirmNewPassword) {
      return res
        .status(400)
        .send({ status: 0, message: "Confirm New Password Is Required" });
    } else if (newPassword.length < 6) {
      return res
        .status(400)
        .send({ status: 0, message: "Password Should Be 6 Character Long" });
    } else if (confirmNewPassword.length < 6) {
      return res
        .status(400)
        .send({ status: 0, message: "Password Should Be 6 Character Long" });
    }
    // else if (!newPassword.match(passwordValidation)) {
    //   return res.status(400).send({
    //     status: 0,
    //     message:
    //       "Password should include at least 8 characters, one uppercase letter, one lowercase letter, one digit, and one special character.",
    //   });
    // }
    else if (newPassword !== confirmNewPassword) {
      return res.status(400).send({
        status: 0,
        message: "New Password And Confirm New Password Should Be Same",
      });
    } else if (
      currentPassword == newPassword ||
      currentPassword == confirmNewPassword
    ) {
      return res.status(400).send({
        status: 0,
        message: "Current Password And New Password Can't Be Same",
      });
    } else if (!usercheck) {
      return res.status(400).send({ status: 0, message: "User Not Found" });
    } else {
      await usercheck.comparePassword(currentPassword);
      const salt = await bcrypt.genSalt(10);
      const pass = await bcrypt.hash(newPassword, salt);
      await Admins.findByIdAndUpdate(
        { _id: req.user._id },
        { $set: { password: pass } }
      );
      res
        .status(200)
        .send({ status: 1, message: "Password Changed Successfully" });
    }
  } catch (err) {
    return res.status(500).send({ status: 0, message: "Something went wrong" });
  }
};

// //done
const getAllUsers = async (req, res) => {
  try {
    const users = await Users.find({ isDeleted: 0 }).sort({ createdAt: -1 });
    if (users.length < 1) {
      return res.status(400).send({ status: 0, message: "No Users Found" });
    } else {
      return res.status(200).send({ status: 1, Users: users });
    }
  } catch (error) {
    return res.status(500).send({ status: 0, message: "Something went wrong" });
  }
};

// // done
const deleteAccount = async (req, res) => {
  try {
    const _id = req?.query?.id;
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
    const deleteUser = await Users.findByIdAndUpdate(
      { _id: _id },
      { $set: { isDeleted: 1 } }
    );
    if (deleteUser) {
      res
        .status(200)
        .send({ status: 1, message: "Account deleted successfully" });
    } else {
      return res.status(400).send({ status: 0, message: "User not found" });
    }
  } catch (err) {
    return res.status(500).send({ status: 0, message: "Something went wrong" });
  }
};

// // not working
const blockunblock = async (req, res) => {
  try {
    const _id = req?.body?.id;
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
    const checkUser = await Users.findOne({ _id });
    if (checkUser.isBlocked === 1) {
      const user = await Users.findByIdAndUpdate(
        { _id },
        { $set: { isBlocked: 0 } },
        { new: true }
      );

      if (user) {
        return res
          .status(200)
          .send({ status: 1, message: "Account Unblocked Successfully" });
      }
    } else {
      const user = await Users.findByIdAndUpdate(
        { _id },
        { $set: { isBlocked: 1 } },
        { new: true }
      );
      if (user) {
        await Users.findOneAndUpdate(
          { _id: user._id },
          {
            token: null,
            deviceToken: null,
            deviceType: null,
          },
          { new: true }
        );
        return res
          .status(200)
          .send({ status: 1, message: "Account Blocked Successfully" });
      }
    }
  } catch (error) {
    return res.status(500).send({ status: 0, message: "Something went wrong" });
  }
};

// //done
const TcandPp = async (req, res) => {
  try {
    const { termCondition, privacyPolicy, aboutUs } = req.body;
    const findData = await TcPp.findOne();
    if (!termCondition && !privacyPolicy && !aboutUs) {
      res.status(400).send({
        status: 0,
        message: "Please Add Term Condition, Privacy Policy or About Us",
      });
    } else if (termCondition && privacyPolicy) {
      await TcPp.findByIdAndUpdate(
        { _id: findData?._id },
        { $set: { termCondition, privacyPolicy, aboutUs } }
      );
    } else if (termCondition && !privacyPolicy && !aboutUs) {
      await TcPp.findByIdAndUpdate(
        { _id: findData?._id },
        { $set: { termCondition } }
      );
    } else if (privacyPolicy && !termCondition && !aboutUs) {
      await TcPp.findByIdAndUpdate(
        { _id: findData?._id },
        { $set: { privacyPolicy } }
      );
    } else if (aboutUs && !termCondition && !privacyPolicy) {
      await TcPp.findByIdAndUpdate(
        { _id: findData?._id },
        { $set: { aboutUs } }
      );
    }
    res.status(200).send({
      status: 1,
      message: `${
        termCondition && privacyPolicy && aboutUs
          ? "Term Condition, Privacy Policy and About Us"
          : termCondition
          ? "Term Condition "
          : privacyPolicy
          ? "Privacy Policy "
          : aboutUs
          ? "About Us "
          : " "
      }Added Successfully`,
    });
  } catch (err) {
    res.status(400).send({ status: 0, message: "Something went wrong" });
  }
  main.dbSeed();
};

// //done
const getTcandPp = async (req, res) => {
  try {
    const { type } = req.query;
    const tcAndPp = await TcPp.findOne();
    if (
      type == "about_us" ||
      type == "privacy_policy" ||
      type == "terms_and_conditions"
    ) {
      res.status(200).send({
        status: 1,
        tcAndPp,
        url: { content: `${process.env.URL}${type}` },
      });
    } else if (type == "all") {
      res.status(200).send({
        status: 1,
        tcAndPp,
        url: { content: `${process.env.URL}${type}` },
      });
    } else {
      res.status(400).send({ status: 0, message: "Invalid content type" });
    }
  } catch (err) {
    return res.status(500).send({ status: 0, message: "Something went wrong" });
  }
};

module.exports = {
  signIn,
  signOut,
  updatePassword,
  getAllUsers,
  deleteAccount,
  blockunblock,
  TcandPp,
  getTcandPp,
  getDashboard,
};
