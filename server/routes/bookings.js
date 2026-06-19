const express = require('express');
const router = express.Router();
const {bookEvent,getAllBookings, sendBookingOtp, getMyBookings, cancelBooking, confirmBooking} = require('../controllers/bookingController.js');
const {protect, admin} = require('../middleware/auth.js');


router.post('/', protect, bookEvent);
router.post('/send-otp', protect, sendBookingOtp);
router.put('/:id/confirm', protect, admin, confirmBooking);
router.get('/my', protect, getMyBookings);
router.delete('/:id', protect, cancelBooking);
router.get('/', protect, admin, getAllBookings);

module.exports = router;