const Particpant = require('../models/participant');
const Admin = require('../models/admin');
const jwt = require('jsonwebtoken');

// verify participant token
const participantAuth = async (req, res, next) => {
  try {
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).send('Token is Invalid');
    }
    const data = await jwt.verify(token, process.env.JWT_SECRET_KEY);
    const { emailId, password } = data.data;
    const participant = await Particpant.findOne({ emailId });
    if (!participant) {
      throw new Error('Participant not found');
    }
    if (participant.password !== password) {
      throw new Error('Invalid Token');
    }
    req.participant = participant;
    next();
  } catch (err) {
    res.status(400).send('ERROR : ' + err.message);
  }
};

// verify admin token
const adminAuth = async (req, res, next) => {
  try {
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).send('Token is Invalid');
    }
    const data = await jwt.verify(token, process.env.JWT_SECRET_KEY);
    const { emailId, password } = data.data;
    const admin = await Admin.findOne({ emailId });
    if (!admin) {
      throw new Error('Not Authorized to perform action');
    }
    if (admin.password != password) {
      throw new Error('Invalid Cookies');
    }
    req.admin = admin;
    next();
  } catch (err) {
    res.status(400).send('ERROR : ' + err.message);
  }
};

module.exports = { participantAuth, adminAuth };
