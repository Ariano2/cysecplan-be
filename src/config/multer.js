const multer = require('multer');
const path = require('path');

// Set up storage config
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // Ensure this folder exists
  },
  filename: function (req, file, cb) {
    const uniqueName = `${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 11)}-${file.originalname}`;
    cb(null, uniqueName); // Added random string for extra uniqueness
  },
});

// File filter to allow only jpg/jpeg
const fileFilter = function (req, file, cb) {
  const allowedExts = ['.jpg', '.jpeg', '.png'];
  const allowedMimes = ['image/jpeg', 'image/jpg'];

  const ext = path.extname(file.originalname).toLowerCase();
  const mime = file.mimetype;

  if (allowedExts.includes(ext) && allowedMimes.includes(mime)) {
    cb(null, true);
  } else {
    const error = new Error('Only .jpg and .jpeg image files are allowed');
    error.status = 400;
    cb(error, false);
  }
};

// Final upload middleware with additional validation
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // Limit file size to 5MB
  },
});

module.exports = upload;
