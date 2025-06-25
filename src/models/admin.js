const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const jwt = require('jsonwebtoken');

const adminSchema = new Schema(
  {
    firstName: {
      type: String,
      required: true,
      lowercase: true,
      maxLength: 50,
      minLength: 3,
    },
    lastName: {
      type: String,
      lowercase: true,
      maxLength: 50,
      minLength: 3,
    },
    emailId: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      minLength: 8,
      maxLength: 100,
    },
    role: {
      type: String,
      enum: ['superadmin', 'workshopadmin'],
      default: 'workshopadmin',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

adminSchema.method('generateJWT', async function () {
  const emailId = this.emailId;
  const password = this.password;
  // token expires in 2 hours
  const token = await jwt.sign(
    {
      exp: Math.floor(Date.now() / 1000) + 60 * 60,
      data: { emailId, password },
    },
    process.env.JWT_SECRET_KEY
  );
  return token;
});

const Admin = mongoose.model('Admin', adminSchema);
module.exports = Admin;
