const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const requestSchema = new mongoose.Schema(
  {
    workshopId: {
      type: Schema.Types.ObjectId,
      ref: 'Workshop',
      required: true,
    },
    participantId: {
      type: Schema.Types.ObjectId,
      ref: 'Participant',
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      required: true,
      default: 'pending',
    },
    originCity: {
      type: String,
      required: true,
      maxLength: 100,
    },
    modeOfTravel: {
      type: String,
      enum: ['train', 'flight', 'bus', 'car', 'other'],
      required: true,
    },
    preferredDate: {
      type: Date,
      required: true,
    },
    accommodationRequired: {
      type: Boolean,
      default: false,
    },
    remarks: {
      type: String,
      maxLength: 500,
      default: '',
    },
    adminNotes: {
      type: String,
      maxLength: 1000,
    },
  },
  { timestamps: true }
);

const Request = mongoose.model('Request', requestSchema);

module.exports = Request;
