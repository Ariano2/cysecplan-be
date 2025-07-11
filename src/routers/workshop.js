const express = require('express');
const { adminAuth, participantAuth } = require('../middlewares/auth');
const mongoose = require('mongoose');
const Workshop = require('../models/workshop');
const Participant = require('../models/participant');
const Request = require('../models/joinRequest');
const workshopRouter = express.Router();
const { createWorkshopValidator } = require('../validators/workshopValidator');

// creat new workshop
workshopRouter.post('/api/workshop/create', adminAuth, async (req, res) => {
  const {
    title,
    description,
    startDate,
    endDate,
    participants,
    location,
    capacity,
    registrationDeadline,
    category,
    price,
    materials,
  } = req.body;
  try {
    createWorkshopValidator(req.body);
    let regDeadline;
    if (registrationDeadline) {
      regDeadline = new Date(registrationDeadline);
      if (regDeadline > new Date(startDate))
        throw new Error('deadline must be before start of workshop');
      if (regDeadline < new Date(Date.now()))
        throw new Error('Registration Deadline cannot be in the past!');
    }

    // Validate participants if provided
    if (participants && participants.length > 0) {
      const validParticipants = await mongoose
        .model('Participant')
        .find({ _id: { $in: participants } });
      if (validParticipants.length !== participants.length) {
        throw new Error('One or more participant ID is invalid');
      }
    }
    // Create workshop
    const workshop = new Workshop({
      title,
      description,
      startDate,
      endDate,
      createdBy: req.admin._id, // Set createdBy to authenticated admin
      participants: participants || [],
      location: location || {},
      capacity,
      registrationDeadline: regDeadline || startDate,
      category,
      price: price || 0,
      materials: materials || [],
    });

    // Save workshop to database
    await workshop.save();

    // Populate createdBy and participants
    const populatedWorkshop = await Workshop.findById(workshop._id)
      .populate('createdBy', 'firstName lastName emailId')
      .populate('participants', 'firstName lastName emailId');

    return res.status(201).json({
      message: 'Workshop created successfully',
      workshop: populatedWorkshop,
    });
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
});

workshopRouter.get('/api/workshop/details/:workshopId', async (req, res) => {
  const workshopId = req.params.workshopId;
  try {
    const workshop = await Workshop.findById(workshopId);
    if (!workshop) {
      throw new Error('No workshop with provided ID');
    }
    res.json({ message: 'workshop details fetched successfully', workshop });
  } catch (err) {
    res.status(400).send(err.message);
  }
});

// fetch active workshops
workshopRouter.get('/api/workshop/active', async (req, res) => {
  const currentDate = new Date(Date.now());
  let { page, pageSize } = req.query;
  try {
    page = parseInt(page, 10) || 1;
    pageSize = parseInt(pageSize, 10) || 10;
    const activeWorkshop = await Workshop.aggregate([
      {
        $match: {
          startDate: { $lte: currentDate },
          endDate: { $gte: currentDate },
        },
      },
      {
        $facet: {
          data: [
            { $sort: { startDate: 1 } },
            { $skip: (page - 1) * pageSize },
            { $limit: pageSize },
          ],
          metadata: [{ $count: 'total' }],
        },
      },
    ]);
    res.json(activeWorkshop);
  } catch (err) {
    res.status(400).send('Error encountered');
  }
});

// fetch available workshops
workshopRouter.get(
  '/api/workshop/available',
  participantAuth,
  async (req, res) => {
    const currentDate = new Date(Date.now());
    let { page, pageSize } = req.query;
    const participantId = req.participant._id;
    const requests = await Request.find({ participantId });
    const unavailableWorkshops = requests.map((request) => request.workshopId);
    try {
      page = parseInt(page, 10) || 1;
      pageSize = parseInt(pageSize, 10) || 10;
      const upcomingWorkshop = await Workshop.aggregate([
        {
          $match: {
            startDate: { $gt: currentDate },
            registrationDeadline: { $gt: currentDate },
            _id: { $nin: unavailableWorkshops },
          },
        },
        {
          $facet: {
            data: [
              { $sort: { startDate: 1 } }, // ascending sort
              { $skip: (page - 1) * pageSize },
              { $limit: pageSize },
            ],
            metadata: [{ $count: 'total' }],
          },
        },
      ]);
      res.json(upcomingWorkshop);
    } catch (err) {
      res.status(400).send('Error encountered');
    }
  }
);

// fetch completed workshops
workshopRouter.get('/api/workshop/completed', async (req, res) => {
  const currentDate = new Date(Date.now());
  let { page, pageSize } = req.query;
  try {
    page = parseInt(page, 10) || 1;
    pageSize = parseInt(pageSize, 10) || 10;
    const completedWorkshops = await Workshop.aggregate([
      {
        $match: {
          endDate: { $lt: currentDate },
        },
      },
      {
        $facet: {
          data: [
            { $sort: { endDate: -1 } },
            { $skip: (page - 1) * pageSize },
            { $limit: pageSize },
          ],
          metadata: [{ $count: 'total' }],
        },
      },
    ]);
    res.json(completedWorkshops);
  } catch (err) {
    res.status(400).send('Error encountered');
  }
});

// edit workshop details
workshopRouter.patch(
  '/api/workshop/edit/:workshopId',
  adminAuth,
  async (req, res) => {
    const workshopId = req.params.workshopId;
    const {
      title,
      description,
      startDate,
      endDate,
      participants,
      location,
      capacity,
      registrationDeadline,
      category,
      price,
      materials,
    } = req.body;

    try {
      // Validate ID format
      if (!workshopId.match(/^[0-9a-fA-F]{24}$/)) {
        return res.status(400).json({ message: 'Invalid workshop ID format' });
      }
      const workshop = await Workshop.findById(workshopId);
      if (!workshop) {
        return res
          .status(404)
          .json({ message: 'No workshop found with given ID' });
      }
      createWorkshopValidator(req.body);
      // Validate participants if provided
      if (participants && participants.length > 0) {
        const validParticipants = await mongoose
          .model('Participant')
          .find({ _id: { $in: participants } });
        if (validParticipants.length !== participants.length) {
          return res
            .status(400)
            .json({ message: 'One or more participant IDs are invalid' });
        }
      }
      let regDeadline;
      if (registrationDeadline) {
        regDeadline = new Date(registrationDeadline);
        if (regDeadline > new Date(startDate))
          throw new Error('deadline must be before start of workshop');
        if (regDeadline < new Date(Date.now()))
          throw new Error('Registration Deadline cannot be in the past!');
      }

      // Validate participants if provided
      if (participants && participants.length > 0) {
        const validParticipants = await mongoose
          .model('Participant')
          .find({ _id: { $in: participants } });
        if (validParticipants.length !== participants.length) {
          throw new Error('One or more participant ID is invalid');
        }
      }

      // Update fields if provided
      if (title !== undefined) workshop.title = title;
      if (description !== undefined) workshop.description = description;
      if (startDate !== undefined) workshop.startDate = startDate;
      if (endDate !== undefined) workshop.endDate = endDate;
      if (participants !== undefined) workshop.participants = participants;
      if (location !== undefined) workshop.location = location;
      if (capacity !== undefined) workshop.capacity = capacity;
      if (registrationDeadline !== undefined)
        workshop.registrationDeadline = registrationDeadline;
      if (category !== undefined) workshop.category = category;
      if (price !== undefined) workshop.price = price;
      if (materials !== undefined) workshop.materials = materials;

      await workshop.save();

      const updatedWorkshop = await Workshop.findById(workshopId)
        .populate('createdBy', 'firstName lastName emailId')
        .populate('participants', 'firstName lastName emailId');

      return res.status(200).json({
        message: 'Workshop updated successfully',
        workshop: updatedWorkshop,
      });
    } catch (err) {
      return res.status(400).json({ message: err.message });
    }
  }
);

// delete a workshop
workshopRouter.delete('/api/workshop/delete/:workshopId', async (req, res) => {
  const { workshopId } = req.params;
  try {
    if (!workshopId.match(/^[0-9a-fA-F]{24}$/)) {
      throw new Error('Invalid ID, please use a valid mongoDB id');
    }
    const workshop = await Workshop.findById(workshopId);
    if (!workshop) {
      return res
        .status(404)
        .json({ message: 'No workshop found with given ID' });
    }
    // delete record
    await Workshop.findByIdAndDelete(workshopId);
    res.send('Workshop deleted successfully');
  } catch (err) {
    return res.status(400).send('ERROR: ' + err.message);
  }
});

module.exports = workshopRouter;
