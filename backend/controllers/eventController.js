const Event = require('../models/Event');
const Seat = require('../models/Seat');
const Reservation = require('../models/Reservation');
const { cleanupExpiredReservations } = require('../utils/reservationHelper');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'sort_my_scene_super_secret_token_key';

// @desc    Retrieve a list of all available events
// @route   GET /api/events
exports.getEvents = async (req, res) => {
  try {
    // Clean up any expired reservations globally before displaying lists
    await cleanupExpiredReservations();

    const events = await Event.find().sort({ date: 1 });

    // Dynamically calculate available seats for each event
    const enrichedEvents = await Promise.all(
      events.map(async (event) => {
        const availableSeatsCount = await Seat.countDocuments({ 
          eventId: event._id, 
          status: 'available' 
        });
        return {
          ...event.toObject(),
          availableSeatsCount
        };
      })
    );

    res.json(enrichedEvents);
  } catch (err) {
    console.error('Get Events Error:', err);
    res.status(500).json({ message: 'Server error while retrieving events' });
  }
};

// @desc    Retrieve details for a single event (with seat grid)
// @route   GET /api/events/:id
exports.getEventById = async (req, res) => {
  try {
    const eventId = req.params.id;

    // Clean up expired reservations for this event specifically
    await cleanupExpiredReservations(eventId);

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const seats = await Seat.find({ eventId }).sort({ seatNumber: 1 });

    // Optional user context: check if the requesting user has an active reservation
    let activeReservation = null;
    const authHeader = req.headers['authorization'];
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET);
        
        activeReservation = await Reservation.findOne({
          userId: decoded.id,
          eventId: event._id,
          expiresAt: { $gt: new Date() },
          isCompleted: false
        });
      } catch (jwtErr) {
        // Token invalid or expired, continue without active reservation context
      }
    }

    res.json({
      event,
      seats,
      activeReservation
    });
  } catch (err) {
    console.error('Get Event By ID Error:', err);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Event not found' });
    }
    res.status(500).json({ message: 'Server error while retrieving event details' });
  }
};
