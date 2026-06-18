const mongoose = require('mongoose');

const seatSchema = new mongoose.Schema({
  eventId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Event', 
    required: true 
  },
  seatNumber: { 
    type: String, 
    required: true 
  },
  status: { 
    type: String, 
    enum: ['available', 'reserved', 'booked'], 
    default: 'available' 
  },
  reservationId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Reservation', 
    default: null 
  },
  reservedAt: { 
    type: Date, 
    default: null 
  }
}, { timestamps: true });

// Prevent duplicate seats for the same event
seatSchema.index({ eventId: 1, seatNumber: 1 }, { unique: true });

module.exports = mongoose.model('Seat', seatSchema);
