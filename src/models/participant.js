const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const jwt = require('jsonwebtoken');
const participantSchema = new Schema(
  {
    firstName: {
      type: String,
      required: true,
      lowercase: true,
      maxLength: 50,
      minLength: 3,
    },
    lastName: { type: String, lowercase: true, maxLength: 50, minLength: 3 },
    emailId: { type: String, required: true, unique: true },
    password: { type: String, required: true, minLength: 5, maxLength: 100 },
  },
  { timeStamps: true }
);

participantSchema.method('generateJWT', async function () {
  const password = this.password;
  const emailId = this.emailId;
  // token expires in 2 hours
  const token = await jwt.sign(
    {
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 2,
      data: { emailId, password },
    },
    process.env.JWT_SECRET_KEY
  );
  return token;
});

const Participant = mongoose.model('Participant', participantSchema);
module.exports = Participant;
