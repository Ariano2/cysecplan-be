const { adminAuth } = require('../middlewares/auth');
const Request = require('../models/joinRequest');
const { listenerCount } = require('../models/participant');
const Workshop = require('../models/workshop');
const express = require('express');
const adminRouter = express.Router();
// get join requests for workshop
adminRouter.get(
  '/api/workshop/join/request/:workshopId',
  adminAuth,
  async (req, res) => {
    const { workshopId } = req.params;
    try {
      const requestList = await Request.find({ workshopId });
      if (!requestList) {
        throw new Error('WorkshopId may be invalid');
      }
      res.send(requestList);
    } catch (err) {
      res.status(400).send(err.message);
    }
  }
);

adminRouter.get('/api/workshop/upcoming', adminAuth, async (req, res) => {
  const currentDate = new Date(Date.now());
  try {
    const upcomingWorkshops = await Workshop.find({
      startDate: { $gt: currentDate },
    });
    // array of promises
    const pendingCountPromises = upcomingWorkshops.map(async (workshop) => {
      return await Request.countDocuments({
        workshopId: workshop._id,
        status: 'pending',
      });
    });
    // Wait for all counts to resolve
    const pendingCount = await Promise.all(pendingCountPromises);
    res.json({ upcomingWorkshops, pendingCount });
  } catch (err) {
    res.status(400).send(err.message);
  }
});

// admin accepts/rejects workshop join requests
adminRouter.patch(
  '/api/workshop/join/request/:requestId/:status',
  adminAuth,
  async (req, res) => {
    const { requestId, status } = req.params;
    try {
      const request = await Request.findById(requestId);
      if (!request)
        throw new Error('Request with id ' + requestId + ' not found');
      const validStatus = ['accepted', 'rejected'];
      if (!validStatus.includes(status)) throw new Error('Status is Invalid');
      request.status = status;
      const { adminNotes } = req.body;
      if (adminNotes) request.adminNotes = adminNotes;
      await request.save();
      if (status === 'accepted') {
        // add to workshops participants list
        const workshop = await Workshop.findById(request.workshopId);
        workshop.participants.push(request.participantId);
        await workshop.save();
      }
      res.json({ message: 'Status Updated Successfully', request });
    } catch (err) {
      res.status(400).send(err.message);
    }
  }
);

module.exports = adminRouter;
