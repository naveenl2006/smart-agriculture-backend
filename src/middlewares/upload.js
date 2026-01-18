const multer = require('multer');
const path = require('path');
const { UPLOAD } = require('../config/constants');

// Storage configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        let uploadPath = 'uploads/';

        if (file.fieldname === 'diseaseImage') {
            uploadPath += 'diseases/';
        } else if (file.fieldname === 'profileImage') {
            uploadPath += 'profiles/';
        } else if (file.fieldname === 'equipmentImage') {
            uploadPath += 'equipment/';
        } else if (file.fieldname === 'livestockImage') {
            uploadPath += 'livestock/';
        } else if (file.fieldname === 'vehicleImage') {
            uploadPath += 'vehicles/';
        } else {
            uploadPath += 'general/';
        }

        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    },
});

// File filter
const fileFilter = (req, file, cb) => {
    if (UPLOAD.ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only JPEG, PNG, and WebP are allowed.'), false);
    }
};

// Multer upload configuration
const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: UPLOAD.MAX_FILE_SIZE,
    },
});

// Upload single image
const uploadSingle = (fieldName) => upload.single(fieldName);

// Upload multiple images
const uploadMultiple = (fieldName, maxCount = 5) => upload.array(fieldName, maxCount);

module.exports = { upload, uploadSingle, uploadMultiple };
