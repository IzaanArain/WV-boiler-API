const mongoose = require('mongoose');
const {Schema}=mongoose

const serviceSchema = new Schema({
    title: {
        type: String,
        default:""
    },
    content: {
        type: String,
        default:""
    },
    serviceImage:{
        type: String,
        default:""
    },
},
    { timestamps: true }
);

mongoose.model("service", serviceSchema); 