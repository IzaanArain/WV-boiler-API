const express=require("express");
const { signin,signup, otpVerify, socialLogin, resendOTP, logout, completeProfile, deleteProfile, myProfile, recoverAccount} = require("../controller/UserController");
const tokenValidator= require("../middleware/authUser");
const { upload } = require("../middleware/multer");
const {bookService,unBookService, getAllServices, getServiceDetails } = require("../controller/ServicesController");
// const { getAllServices, getServiceDetails, book_service } = require("../controller/ServicesController");
const router=express.Router();

router.post("/api/signin",signin);
router.post("/api/signup",signup);
router.post("/api/otpVerify",otpVerify);
router.post("/api/socialLogin",socialLogin);
router.post("/api/resendOTP",resendOTP);
router.post("/api/completeProfile",tokenValidator,upload.fields([{name:"profileImage",maxCount:1}]),completeProfile);
router.post("/api/logout",tokenValidator,logout);
router.delete("/api/deleteProfile",tokenValidator,deleteProfile);
router.post("/api/recoverAccount",recoverAccount);
router.get("/api/myProfile",tokenValidator,myProfile)
// /********** Service *************/
router.get("/api/getAllService",tokenValidator,getAllServices);
router.get("/api/getServiceDetails",tokenValidator,getServiceDetails);
router.post("/api/bookService",tokenValidator,bookService);
router.post("/api/unBookService",tokenValidator,unBookService);

module.exports=router;