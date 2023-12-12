const express = require('express')
const router = express.Router();
const { signIn, signUp, verifyAccount, resendOTP, forgetPassword, resetPassword, signOut, socialLogin, editProfile, updatePassword, notificationToggle, deleteAccount, recoverAccount, completeProfile } = require("../controller/commonController");
const authUser = require('../middleware/authUser');
const { upload } = require('../middleware/multer');
const { getContent, getAllContent,getInformation } = require('../controller/ContentController');

// router.post('/api/signup', signUp)
// router.post('/api/completeProfile/:id', upload.fields([{ name: 'profileImage', maxCount: 1 }, { name: 'otherImages' }]), completeProfile)
// router.post('/api/sociallogin', socialLogin)
// router.post('/api/resendotp', resendOTP)
// router.post('/api/verifyaccount', verifyAccount)
// router.post('/api/forgetpassword', forgetPassword)
// router.post('/api/resetpassword', resetPassword)
// router.post('/api/signin', signIn)
// router.post('/api/editProfile', authUser, upload.fields([{ name: 'profileImage', maxCount: 1 }, { name: 'otherImages' }]), editProfile)
// router.post('/api/changepassword', authUser, updatePassword)
// router.post('/api/notificationToggle', authUser, notificationToggle)
// router.post('/api/signout', authUser, signOut)
// router.delete('/api/deleteAccount', authUser, deleteAccount)
// router.post('/api/recoverAccount/:id', recoverAccount)
/********** Service *************/

router.get("/api/getTcPp",getContent);
router.get("/api/getAllTcPp",getAllContent);
router.get("/api/getInformation",getInformation);
module.exports = router