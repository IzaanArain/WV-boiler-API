const express = require("express");
const router = express.Router();
const {
  signIn,
  signOut,
  updatePassword,
  getAllUsers,
  deleteAccount,
  blockunblock,
  getDashboard
} = require("../controller/adminController");
const authAdmin = require("../middleware/authAdmin");
const { upload } = require("../middleware/multer");
const { createService, editService, deleteService} = require("../controller/ServicesController");
const { editContent } = require("../controller/ContentController");

router.post("/admin/signin", signIn);
router.post("/admin/signout", authAdmin, signOut);
router.get("/admin/dashboard-data",authAdmin, getDashboard)
router.post("/admin/changePassword", authAdmin, updatePassword);
router.get("/admin/getAllUsers", authAdmin, getAllUsers);
router.delete("/admin/deleteAccount", authAdmin, deleteAccount);
router.post("/admin/blockUnblock", authAdmin, blockunblock); 
router.post("/admin/editTcPp", authAdmin,upload.fields([{name:"companyImage",maxCount:1}]), editContent);
/********** Service *************/
router.post("/admin/createService",authAdmin,upload.fields([{name:"serviceImage",maxCount:1}]),createService);
router.post("/admin/editService",authAdmin,upload.fields([{name:"serviceImage",maxCount:1}]),editService);
router.delete("/admin/deleteService",authAdmin,deleteService);

module.exports = router;
