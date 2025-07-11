const express = require('express');
const bcrypt = require('bcrypt');
const profileRouter = express.Router();
const { participantAuth } = require('../middlewares/auth');
const Participant = require('../models/participant');

profileRouter.get('/api/profile', participantAuth, async (req, res) => {
  const userProfile = req.participant;
  if (!userProfile) {
    return res
      .status(404)
      .send('Invalid User, No Profile Details Found. Login Again');
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

  const { firstName, lastName, oldPassword, newPassword } = req.body;

  // Validate input lengths
  if (firstName && (firstName.length < 3 || firstName.length > 50)) {
    return res.status(400).send('firstName length Invalid 3-50 char allowed');
  }
  if (lastName && (lastName.length < 3 || lastName.length > 50)) {
    return res.status(400).send('lastName length Invalid 3-50 char allowed');
  }
  const firstNameAlphabetic = /^[A-Za-z]+$/.test(firstName);
  const lastNameAlphabetic = /^[A-Za-z]+$/.test(lastName);
  if (!firstNameAlphabetic || !lastNameAlphabetic)
    return res
      .status(400)
      .send('firstName and lastName can contain alphabets only');
  if (
    (oldPassword && !newPassword) ||
    (oldPassword && (newPassword.length < 5 || newPassword.length > 100))
  ) {
    return res
      .status(400)
      .send('Invalid new Password length btw 5-100 characters');
  }
  const passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z\d]).{5,}$/;
  if (!passwordRegex.test(newPassword))
    return res
      .status(401)
      .send(
        'Password must contain minimum 1 uppercase, 1 lowercase, 1 special character and a number and length > 4'
      );

  try {
    const participant = await Participant.findById(userProfile._id);

    if (!participant) {
      return res.status(404).send('User not found');
    }

    // compare old password with hashed password
    if (oldPassword) {
      const isMatch = await bcrypt.compare(oldPassword, participant.password);
      if (!isMatch) {
        return res
          .status(400)
          .send('Cannot update password as oldPwd is Invalid');
      }

      // Hash the new password before saving
      const salt = await bcrypt.genSalt(10);
      participant.password = await bcrypt.hash(newPassword, salt);
    }

    // Update name fields
    participant.firstName = firstName || participant.firstName;
    participant.lastName = lastName || participant.lastName;

    await participant.save();

    // Regenerate JWT after password change
    const token = await participant.generateJWT();
    res.cookie('token', token, { maxAge: 3600000 * 2 });

    const modifiedParticipant = participant.toObject();
    modifiedParticipant.password = null;

    res.status(200).send(modifiedParticipant);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

module.exports = profileRouter;
