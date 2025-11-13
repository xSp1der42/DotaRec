const multer = require('multer');
const path = require('path');

// Allowed file types for logos
const ALLOWED_MIME_TYPES = [
  'image/png',
  'image/jpeg', 
  'image/jpg',
  'image/svg+xml'
];

const ALLOWED_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.svg'];

// Maximum file size: 2MB (as per requirement 5.4)
const MAX_FILE_SIZE = 2 * 1024 * 1024;

// File filter function for multer
const fileFilter = (req, file, cb) => {
  // Check MIME type
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    return cb(new Error(`Invalid file type. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}`), false);
  }

  // Check file extension
  const ext = path.extname(file.originalname).toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return cb(new Error(`Invalid file extension. Allowed extensions: ${ALLOWED_EXTENSIONS.join(', ')}`), false);
  }

  cb(null, true);
};

// Storage configuration for team logos
const logoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/team-logos/');
  },
  filename: (req, file, cb) => {
    // Generate unique filename: team-{teamId}-{timestamp}.{ext}
    const teamId = req.params.teamId || 'unknown';
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    cb(null, `team-${teamId}-${timestamp}${ext}`);
  }
});

// Multer configuration for logo uploads
const logoUpload = multer({
  storage: logoStorage,
  fileFilter: fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 1 // Only allow single file upload
  }
});

// Error handling middleware for multer errors
const handleMulterError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        return res.status(400).json({
          success: false,
          message: `File too large. Maximum size allowed is ${MAX_FILE_SIZE / (1024 * 1024)}MB`
        });
      case 'LIMIT_FILE_COUNT':
        return res.status(400).json({
          success: false,
          message: 'Too many files. Only one file allowed per upload'
        });
      case 'LIMIT_UNEXPECTED_FILE':
        return res.status(400).json({
          success: false,
          message: 'Unexpected field name for file upload'
        });
      default:
        return res.status(400).json({
          success: false,
          message: `Upload error: ${error.message}`
        });
    }
  }

  if (error.message.includes('Invalid file')) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }

  next(error);
};

// Middleware to validate file exists in request
const validateFileExists = (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'No file uploaded. Please select a logo file to upload.'
    });
  }
  next();
};

module.exports = {
  logoUpload,
  handleMulterError,
  validateFileExists,
  ALLOWED_MIME_TYPES,
  ALLOWED_EXTENSIONS,
  MAX_FILE_SIZE
};