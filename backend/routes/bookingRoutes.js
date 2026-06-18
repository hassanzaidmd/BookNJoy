const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const authMiddleware = require('../middleware/auth');

router.post('/reserve', authMiddleware, bookingController.reserveSeats);
router.post('/bookings', authMiddleware, bookingController.confirmBooking);

module.exports = router;
