const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const workshopSchema = new Schema(
  {
    title: { type: String, minLength: 5, maxLength: 200, required: true },
    description: { type: String, maxLength: 1000 },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'Admin', required: true },
    participants: [
      { type: Schema.Types.ObjectId, ref: 'Participant', default: [] },
    ],
    location: {
      address: { type: String, maxLength: 200 },
      city: { type: String, maxLength: 50 },
      isVirtual: { type: Boolean, default: false },
      link: { type: String, maxLength: 500 },
    },
    capacity: { type: Number, min: 1, max: 10000 },
    registrationDeadline: { type: Date },
    price: { type: Number, min: 0, max: 10000, default: 0 },
    materials: [
      {
        name: { type: String, maxLength: 100 },
        url: { type: String, maxLength: 500 },
      },
    ],
  },
  { timestamps: true }
);

const Workshop = mongoose.model('Workshop', workshopSchema);
module.exports = Workshop;
