const multer = require('multer');
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        if (file.fieldname == "profileImage") {
            cb(null, './uploads/profileImages/')
        }
        else if (file.fieldname == "serviceImage") {
            cb(null, './uploads/serviceImages/')
        }
        else if (file.fieldname == "companyImage") {
            cb(null, './uploads/companyImages/')
        }
        else if (file.fieldname == "chatFile") {
            cb(null, './uploads/chatFiles/')
        }
    },
    filename(req, file, callback) {
        callback(null, `${file.fieldname}_${Date.now()}_${file.originalname}`);
    },
});
const upload = multer({
    storage,
    fileFilter: async (req, file, cb) => {
        if (!file) {
            cb(null, false);
        }
        else {
            cb(null, true);
        }
    }
});

module.exports = { upload } 
