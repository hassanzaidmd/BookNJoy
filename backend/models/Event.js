const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true, 
    trim: true 
  },
  date: { 
    type: Date, 
    required: true 
  },
  venue: { 
    type: String, 
    required: true, 
    trim: true 
  },
  totalSeats: { 
    type: Number, 
    required: true 
  },
  description: { 
    type: String, 
    trim: true 
  },
  price: { 
    type: Number, 
    required: true, 
    default: 0 
  }
}, { timestamps: true });

module.exports = mongoose.model('Event', eventSchema);
