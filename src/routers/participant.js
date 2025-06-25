const express = require('express');
const participantRouter = express.Router();
const { participantAuth } = require('../middlewares/auth');
const Workshop = require('../models/workshop');
const Request = require('../models/joinRequest');

//participants apply for upcoming workshops
participantRouter.post(
  '/api/workshop/join/request/:workshopId',
  participantAuth,
  async (req, res) => {
    const { workshopId } = req.params;
    try {
      const workshop = await Workshop.findById(workshopId);
      if (!workshop) {
        throw new Error('No workshop with provided ID');
      }
      const currentDate = new Date(Date.now());
      if (
        workshop.startDate > currentDate &&
        workshop.registrationDeadline > currentDate
      ) {
        // now send request
        let request = await Request.findOne({
          workshopId,
          participantId: req.participant._id,
        });
        if (request) {
          throw new Error('Duplicate requests not allowed');
        }
        // logic to handle travel requests
        const {
          originCity,
          modeOfTravel,
          preferredDate,
          accommodationRequired,
          remarks,
        } = req.body;
        if (!['train', 'flight', 'bus', 'car', 'other'].includes(modeOfTravel))
          throw new Error('Travel Mode not valid');
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
      } else {
        throw new Error('Travel Dates Incorrect');
      }
    } catch (err) {
      res.status(400).send('ERROR : ' + err.message);
    }
  }
);

module.exports = participantRouter;
