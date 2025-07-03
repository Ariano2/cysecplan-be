const express = require('express');
const Participant = require('../models/participant');
const Admin = require('../models/admin');
const authRouter = express.Router();
const bcrypt = require('bcrypt');

//participant sign up
authRouter.post('/api/participant/register', async (req, res) => {
  try {
    const { firstName, lastName, emailId, password } = req.body;
    const passwordRegex = new RegExp(
      '^(?=.*[a-z])(?=.*[A-Z])(?=.*d)(?=.*[^a-zA-Zd]).{5,}$'
    );
    if (!passwordRegex.test(password))
      throw new Error(
        'Password must contain minimum 1 uppercase, 1 lowercase, 1 special character and a number and length more than 4'
      );
    const hashedPassword = await bcrypt.hash(password, 10);
    const participant = new Participant({
      firstName,
      lastName,
      emailId,
      password: hashedPassword,
    });
    await participant.save();
    const token = await participant.generateJWT();
    res.cookie('token', token, { maxAge: 3600000 * 2 });
    res.json({
      message: 'Participant Account Created Successfully',
    });
  } catch (err) {
    return res.status(400).send(err.message);
  }
});

//participant login
authRouter.post('/api/participant/login', async (req, res) => {
  try {
    const { emailId, password } = req.body;
    const participant = await Participant.findOne({ emailId });
    if (!participant) {
      throw new Error('no participant with provided email');
    }
    // compare plaintext pwd to hashed pwd
    const isPwdValid = await bcrypt.compare(password, participant.password);
    if (!isPwdValid) {
      throw new Error('Invalid Password');
    }
    const token = await participant.generateJWT();
    res.cookie('token', token, { maxAge: 3600000 * 2 });
    res.json({ message: 'Participant Login Successfull' });
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
});

//admin sign up
authRouter.post('/api/admin/register', async (req, res) => {
  try {
    const { firstName, lastName, emailId, password, role } = req.body;
    const admin = new Admin({
      firstName,
      lastName,
      emailId,
      password,
      role,
    });
    const passwordRegex = new RegExp(
      '^(?=.*[a-z])(?=.*[A-Z])(?=.*d)(?=.*[^a-zA-Zd]).{5,}$'
    );
    if (!passwordRegex.test(password))
      throw new Error(
        'Password must contain minimum 1 uppercase, 1 lowercase, 1 special character and a number and length more than 4'
      );
    const hashedPassword = await bcrypt.hash(password, 10);
    await admin.save();
    const token = await admin.generateJWT();
    res.cookie('token', token, { maxAge: 3600000 * 2 });
    res.json({
      message: 'Admin Account Created Successfully',
    });
  } catch (err) {
    return res.status(400).send(err.message);
  }
});

//admin login
authRouter.post('/api/admin/login', async (req, res) => {
  try {
    const { emailId, password } = req.body;
    const admin = await Admin.findOne({ emailId });
    if (!admin) {
      throw new Error('No admin with provided email');
    }
    const isPwdValid = await bcrypt.compare(password, participant.password);
    if (!isPwdValid) {
      throw new Error('Invalid Password');
    }
    const token = await admin.generateJWT();
    res.cookie('token', token, { maxAge: 3600000 * 2 });
    res.json({ message: 'Admin Login Successfull' });
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
});

module.exports = authRouter;
