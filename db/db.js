const mongoose = require("mongoose")

const connect = async () => {
    try {
        mongoose.set("strictQuery", false);
        mongoose.connect(process.env.mongoUrl, {
            useNewUrlParser: true,
            useUnifiedTopology: true, 
        })
        mongoose.connection.on('connected', () => {
            console.log("connected to mongo")
        })
        mongoose.connection.on('error', (err) => {
            console.log("this is error", err)
        })
    } catch (error) {
        console.log(error.message);
    }
}

module.exports = connect