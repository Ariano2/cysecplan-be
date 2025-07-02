const { adminAuth } = require('../middlewares/auth');
const Request = require('../models/joinRequest');
const Workshop = require('../models/workshop');
const Product = require('../models/product');
const Article = require('../models/article');
const Order = require('../models/order');
const Participant = require('../models/participant');
const { listenerCount } = require('../models/participant');

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

adminRouter.get('/api/admin/analytics', adminAuth, async (req, res) => {
  try {
    const currentDate = new Date();

    // ====== Query Params for Pagination ======
    const productPage = parseInt(req.query.productPage) || 1;
    const productLimit = parseInt(req.query.productLimit) || 5;

    const articlePage = parseInt(req.query.articlePage) || 1;
    const articleLimit = parseInt(req.query.articleLimit) || 5;

    const workshopPage = parseInt(req.query.workshopPage) || 1;
    const workshopLimit = parseInt(req.query.workshopLimit) || 5;

    // ====== Article Stats ======
    const articleCount = await Article.countDocuments();
    const articleReadsResult = await Article.aggregate([
      {
        $group: {
          _id: null,
          totalReads: { $sum: '$activity.total_reads' },
        },
      },
    ]);
    const totalReads = articleReadsResult[0]?.totalReads || 0;

    // Minimal paginated articles
    const minimalArticles = await Article.find({})
      .select('title description')
      .sort({ createdAt: -1 })
      .skip((articlePage - 1) * articleLimit)
      .limit(articleLimit);

    // ====== Product Stats ======
    const totalProducts = await Product.countDocuments();

    const minimalProducts = await Product.find({})
      .select('name price stock imageUrl')
      .skip((productPage - 1) * productLimit)
      .limit(productLimit);

    // ====== Join Requests ======
    const pendingRequests = await Request.countDocuments({ status: 'pending' });

    // ====== Upcoming Workshops with Pending Request Count ======
    const upcomingWorkshopsRaw = await Workshop.find({
      startDate: { $gt: currentDate },
      registrationDeadline: { $gt: currentDate },
    })
      .select('title startDate registrationDeadline')
      .sort({ startDate: 1 })
      .skip((workshopPage - 1) * workshopLimit)
      .limit(workshopLimit);

    const upcomingWorkshopIds = upcomingWorkshopsRaw.map((w) => w._id);

    // Count pending requests for each workshop
    const pendingByWorkshop = await Request.aggregate([
      {
        $match: {
          status: 'pending',
          workshopId: { $in: upcomingWorkshopIds },
        },
      },
      {
        $group: {
          _id: '$workshopId',
          count: { $sum: 1 },
        },
      },
    ]);

    const pendingCountMap = {};
    pendingByWorkshop.forEach((item) => {
      pendingCountMap[item._id.toString()] = item.count;
    });

    // Add pending count to workshops
    const upcomingWorkshops = upcomingWorkshopsRaw.map((workshop) => ({
      ...workshop.toObject(),
      pendingRequests: pendingCountMap[workshop._id.toString()] || 0,
    }));

    // ====== Final Response ======
    return res.status(200).json({
      articleCount,
      totalReads,
      totalProducts,
      pendingRequests,
      minimalArticles,
      minimalProducts,
      upcomingWorkshops,
      pagination: {
        productPage,
        productLimit,
        productTotalPages: Math.ceil(totalProducts / productLimit),

        articlePage,
        articleLimit,
        articleTotalPages: Math.ceil(articleCount / articleLimit),

        workshopPage,
        workshopLimit,
        workshopTotalPages: Math.ceil(
          (await Workshop.countDocuments({
            startDate: { $gt: currentDate },
            registrationDeadline: { $gt: currentDate },
          })) / workshopLimit
        ),
      },
    });
  } catch (err) {
    console.error('Error in admin analytics:', err);
    return res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

module.exports = adminRouter;
