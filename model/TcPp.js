const mongoose = require('mongoose');
 
const tcPpSchema = new mongoose.Schema({
    title: {
        type: String,
        default:""
    },
    content: {
        type: String,
        default:""
    },
    companyImage:{
        type: String,
        default:""
    },
    contentType: {
        type: String,
        enum: ['privacy_policy', 'terms_and_conditions', 'about_us','information'],
        default:""
    }
}, {
    timestamps: true
});
  
mongoose.model('TcPp', tcPpSchema);
