const Booking = require('../models/Bookings.js');
const OTP = require('../models/OTP.js');
const Event = require('../models/Event.js');
const { sendOtpEmail, sendBookingEmail } = require('../utils/email.js');

const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString(); // Generates a 6-digit OTP
}

exports.sendBookingOtp = async (req, res) => {
    const otp = generateOTP();

    console.log(`Booking OTP for ${req.user.email}: ${otp}`);

    await OTP.findOneAndDelete({ email: req.user.email, action: 'event_booking' });
    await OTP.create({ email: req.user.email, otp: otp, action: 'event_booking' });
    await sendOtpEmail(req.user.email, otp, 'event_booking');
    res.json({ message: 'OTP sent to email' });
}

exports.bookEvent = async (req, res) => {
    const { eventId, otp } = req.body;

    const otpRecord = await OTP.findOne({ email: req.user.email, otp, action: 'event_booking' });
    if (!otpRecord) {
        return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    const event = await Event.findById(eventId);
    if (!event) {
        return res.status(404).json({ message: 'Event not found' });
    }

    // FIX: Check availableSeats instead of totalSeats
    if (event.availableSeats <= 0) {
        return res.status(400).json({ message: 'No seats available for this event' });
    }

    const existingBooking = await Booking.findOne({ userId: req.user._id, eventId });
    if (existingBooking) {
        return res.status(400).json({ message: 'You have already booked this event' });
    }
    
    const booking = await Booking.create({
        userId: req.user._id,
        eventId,
        status: 'pending',
        paymentStatus: 'not_paid',
        amount: event.ticketPrice
    });

    await OTP.deleteMany({ email: req.user.email, action: 'event_booking' });
    res.status(201).json({ message: 'Booking created. Please wait for admin confirmation.' });
}

exports.confirmBooking = async (req, res) => {
    const paymentStatus = req.body.paymentStatus;
    if (!['paid', 'not_paid'].includes(paymentStatus)) {
        return res.status(400).json({ message: 'Invalid payment status' });
    }
    
    const booking = await Booking.findById(req.params.id).populate('eventId');
    if (!booking) {
        return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.status === 'confirmed') {
        return res.status(400).json({ message: 'Booking is already confirmed' });
    }

    const event = await Event.findById(booking.eventId._id);
    
    // FIX: Check availableSeats instead of totalSeats
    if (event.availableSeats <= 0) {
        return res.status(400).json({ message: "No seats available" });
    }

    booking.status = 'confirmed';

    if (paymentStatus) {
        booking.paymentStatus = paymentStatus;
    }
    await booking.save();
    
    // FIX: Subtract from availableSeats, not total capacity
    event.availableSeats -= 1;
    await event.save();

    // FIX: Pass user name to the email properly
    await sendBookingEmail(req.user.email, req.user.name, event.title);

    res.json({ message: "Booking confirmed successfully" });
}

// FIX: Added function so the Admin Dashboard can fetch everyone's bookings
exports.getAllBookings = async (req, res) => {
    try {
        const bookings = await Booking.find({}).populate('eventId userId');
        res.json(bookings);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching all bookings' });
    }
}

exports.getMyBookings = async (req, res) => {
    try {
        const bookings = await Booking.find({ userId: req.user._id }).populate('eventId');
        res.json(bookings);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching your bookings' });
    }
}

exports.cancelBooking = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);

        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        // FIX: Allow admin to bypass the owner check
        if (booking.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Unauthorized: Only admins or the owner can cancel' });
        }

        const wasConfirmed = booking.status === 'confirmed';
        
        booking.status = 'cancelled';
        await booking.save();

        // Restore the seat if it was already confirmed
        if (wasConfirmed) {
            // FIX: Removed ._id to prevent crash
            const event = await Event.findById(booking.eventId); 
            if (event) {
                // FIX: Add back to availableSeats, not total capacity
                event.availableSeats += 1; 
                await event.save();
            }
        }

        // FIX: Completely removed `await booking.remove();` so the cancelled tag shows up!

        res.json({ message: 'Booking successfully cancelled' });
    } catch (error) {
        console.error("Cancel Booking Error:", error);
        res.status(500).json({ message: 'Server error while cancelling booking' });
    }
};