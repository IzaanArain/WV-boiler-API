const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const Admins = mongoose.model('Admins')
module.exports = (req, res, next) => {
  const { authorization } = req.headers;
  if (!authorization) {
    return res.status(401).send({ error: "unauthorized" })
  }
  const token = authorization.replace("Bearer ", "");
  jwt.verify(token, process.env.secret_Key, async (err, payload) => {
    if (err) {
      return res.status(401).send({ error: "unathorized" })
    }
    const { adminId } = payload;
    const admin = await Admins.findById(adminId)
    if (!admin) {
      return res.status(401).send({status: 0, message: "unauthorized" })
    }
    else if (admin.token !== token) {
      return res.status(401).send({status: 0, message: "unauthorized" })
    } 
    else if (admin.token == token) {
      req.user = admin;
      next();
    } 
  })
}  
