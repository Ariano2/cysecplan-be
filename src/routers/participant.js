const express = require('express');
const participantRouter = express.Router();
const { participantAuth } = require('../middlewares/auth');
const Workshop = require('../models/workshop');
const Request = require('../models/joinRequest');
const { joinRequestValidator } = require('../validators/workshopValidator');

//participants apply for upcoming workshops
participantRouter.post(
  '/api/workshop/join/request/:workshopId',
  participantAuth,
  async (req, res) => {
    const { workshopId } = req.params;
    try {
      const workshop = await Workshop.findById(workshopId);
      if (!workshop) throw new Error('No workshop with provided ID');
      joinRequestValidator(req.body, workshop);
      let request = await Request.findOne({
        workshopId,
        participantId: req.participant._id,
      });
      const {
        originCity,
        modeOfTravel,
        preferredDate,
        accommodationRequired,
        remarks,
      } = req.body;
      if (request) throw new Error('Duplicate requests not allowed');
      request = await Request.insertOne({
        workshopId,
        participantId: req.participant._id,
        status: 'pending',
        originCity,
        modeOfTravel,
        remarks,
        accommodationRequired: accommodationRequired || false,
        preferredDate,
      });
      res.json({ message: 'Applied successfully', request });
    } catch (err) {
      res.status(400).send('ERROR : ' + err.message);
    }
  }
);

// view status of my join requests
participantRouter.get(
  '/api/workshop/join/request',
  participantAuth,
  async (req, res) => {
    const participantId = req.participant._id;
    try {
      // find and show status of join Requests a user has posted
      const requestStatus = await Request.find({ participantId });
      return res.json({
        message: 'Join Requests fetched successfully',
        requestStatus,
      });
    } catch (err) {
      return res.status(400).send(err.message);
    }
  }
);

module.exports = participantRouter;
