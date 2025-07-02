const express = require('express');
const profileRouter = express.Router();
const { participantAuth } = require('../middlewares/auth');
const Participant = require('../models/participant');

profileRouter.get('/api/profile', participantAuth, async (req, res) => {
  const userProfile = req.participant;
  if (!userProfile) {
    res.status(404).send('Invalid User, No Profile Details Found. Login Again');
  }
  userProfile.password = null;
  res.send(userProfile);
});

profileRouter.patch('/api/profile', participantAuth, async (req, res) => {
  const userProfile = req.participant;
  if (!userProfile) {
    return res
      .status(404)
      .send('Invalid User, No Profile Details Found. Login Again');
  }
  const firstName = req.body?.firstName;
  const lastName = req.body?.lastName;
  const oldPassword = req.body?.oldPassword;
  const newPassword = req.body?.newPassword;
  if (firstName && (firstName.length < 3 || firstName.length > 50))
    return res.status(400).send('firstName length Invalid  3-50 char allowed');
  if (lastName && (lastName.length < 3 || lastName.length > 50))
    return res.status(400).send('lastName length Invalid  3-50 char allowed');
  if (oldPassword && userProfile.password !== oldPassword)
    return res.status(400).send('Cannot update password as oldPwd is Invalid');
  if (
    (oldPassword && !newPassword) ||
    (oldPassword && (newPassword.length < 5 || newPassword.length > 100))
  )
    return res.status(400).send('Invalid new Password could not update');
  try {
    const participant = await Participant.findById(userProfile._id);
    participant.firstName = firstName || participant.firstName;
    participant.lastName = lastName || participant.lastName;
    participant.password = newPassword || participant.password;
    await participant.save();
    // send new tokens as pwd maybe changed
    const token = await participant.generateJWT();
    res.cookie('token', token, { maxAge: 3600000 * 2 });
    const modifiedParticipant = participant;
    modifiedParticipant.password = null;
    res.status(200).send(modifiedParticipant);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

module.exports = profileRouter;
