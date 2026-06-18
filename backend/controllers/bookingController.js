const Event = require('../models/Event');
const Seat = require('../models/Seat');
const Reservation = require('../models/Reservation');

// @desc    Reserve available seats for a specific event for 10 minutes
// @route   POST /api/reserve
exports.reserveSeats = async (req, res) => {
  let tempReservation = null;
  try {
    const { eventId, seatNumbers } = req.body;
    const userId = req.user.id;

    if (!eventId || !seatNumbers || !Array.isArray(seatNumbers) || seatNumbers.length === 0) {
      return res.status(400).json({ message: 'Please provide eventId and a list of seat numbers' });
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // 1. Release user's previous active reservation for this event (if any exists)
    // This allows the user to re-select seats and overwrite their previous selection seamlessly
    const existingReservation = await Reservation.findOne({
      userId,
      eventId,
      expiresAt: { $gt: new Date() },
      isCompleted: false
    });

    if (existingReservation) {
      await Seat.updateMany(
        { 
          eventId, 
          reservationId: existingReservation._id 
        },
        { 
          $set: { status: 'available' }, 
          $unset: { reservationId: 1, reservedAt: 1 } 
        }
      );
      await Reservation.deleteOne({ _id: existingReservation._id });
    }

    // 2. Double check if seats actually exist in the event setup
    const matchedSeatsCount = await Seat.countDocuments({
      eventId,
      seatNumber: { $in: seatNumbers }
    });

    if (matchedSeatsCount !== seatNumbers.length) {
      return res.status(400).json({ message: 'One or more selected seats do not exist for this event' });
    }

    // 3. Create Reservation document first (acting as our lock token)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now
    tempReservation = new Reservation({
      userId,
      eventId,
      seatNumbers,
      expiresAt
    });
    await tempReservation.save();

    // 4. Atomic seat reservation update. We only target seats that are currently 'available'
    const updateResult = await Seat.updateMany(
      {
        eventId,
        seatNumber: { $in: seatNumbers },
        status: 'available'
      },
      {
        $set: {
          status: 'reserved',
          reservationId: tempReservation._id,
          reservedAt: new Date()
        }
      }
    );

    // 5. Verification
    if (updateResult.modifiedCount === seatNumbers.length) {
      // Success! All requested seats locked
      return res.status(201).json({
        message: 'Seats reserved successfully for 10 minutes',
        reservation: tempReservation
      });
    } else {
      // Collision occurred! Some seats were already taken.
      // Identify exactly which seats were occupied
      const occupiedSeats = await Seat.find({
        eventId,
        seatNumber: { $in: seatNumbers },
        status: { $ne: 'available' },
        reservationId: { $ne: tempReservation._id } // Not locked by us
      }).select('seatNumber status');

      const occupiedSeatNumbers = occupiedSeats.map(s => s.seatNumber);

      // Revert any seats that we DID lock in our partial updateMany execution
      await Seat.updateMany(
        {
          eventId,
          seatNumber: { $in: seatNumbers },
          reservationId: tempReservation._id
        },
        {
          $set: { status: 'available' },
          $unset: { reservationId: 1, reservedAt: 1 }
        }
      );

      // Delete the temporary reservation document
      await Reservation.deleteOne({ _id: tempReservation._id });

      return res.status(409).json({
        message: 'One or more of your selected seats are no longer available.',
        unavailableSeats: occupiedSeatNumbers
      });
    }
  } catch (err) {
    console.error('Reservation Error:', err);
    if (tempReservation) {
      // Clean up on error
      await Reservation.deleteOne({ _id: tempReservation._id });
    }
    res.status(500).json({ message: 'Server error during seat reservation' });
  }
};

// @desc    Marks the seats as booked and removes the reservation
// @route   POST /api/bookings
exports.confirmBooking = async (req, res) => {
  try {
    const { reservationId } = req.body;
    const userId = req.user.id;

    if (!reservationId) {
      return res.status(400).json({ message: 'Please provide reservationId' });
    }

    // Attempt to find and delete the reservation in one atomic operation.
    // If it has expired, expiresAt will be <= new Date() and this won't find it.
    const reservation = await Reservation.findOneAndDelete({
      _id: reservationId,
      userId,
      expiresAt: { $gt: new Date() },
      isCompleted: false
    });

    if (!reservation) {
      return res.status(410).json({
        message: 'Booking failed. Your reservation has expired, already been completed, or does not exist.'
      });
    }

    // Atomically upgrade the seats from 'reserved' to 'booked'
    const updateResult = await Seat.updateMany(
      {
        eventId: reservation.eventId,
        seatNumber: { $in: reservation.seatNumbers },
        status: 'reserved',
        reservationId: reservation._id
      },
      {
        $set: { status: 'booked', bookedBy: userId, bookedAt: new Date() },
        $unset: { reservationId: 1, reservedAt: 1 }
      }
    );

    // Double check that we actually updated the correct number of seats
    if (updateResult.modifiedCount !== reservation.seatNumbers.length) {
      console.warn(
        `Booking Seat Count Mismatch: Expected ${reservation.seatNumbers.length}, updated ${updateResult.modifiedCount}`
      );
    }

    res.status(200).json({
      message: 'Booking confirmed successfully!',
      booking: {
        eventId: reservation.eventId,
        seatNumbers: reservation.seatNumbers,
        bookingDate: new Date()
      }
    });
  } catch (err) {
    console.error('Booking Confirmation Error:', err);
    res.status(500).json({ message: 'Server error during booking confirmation' });
  }
};

// @desc    Retrieve all bookings made by the logged-in user
// @route   GET /api/bookings/me
exports.getMyBookings = async (req, res) => {
  try {
    const userId = req.user.id;

    const bookedSeats = await Seat.find({
      bookedBy: userId,
      status: 'booked'
    })
      .populate('eventId')
      .sort({ bookedAt: -1, updatedAt: -1 })
      .lean();

    const bookingsByEvent = bookedSeats.reduce((acc, seat) => {
      const event = seat.eventId;
      if (!event) return acc;

      const eventId = String(event._id);
      if (!acc[eventId]) {
        acc[eventId] = {
          event: {
            id: eventId,
            name: event.name,
            date: event.date,
            venue: event.venue,
            price: event.price
          },
          seatNumbers: [],
          bookedAt: seat.bookedAt || seat.updatedAt || seat.createdAt,
          totalAmount: 0
        };
      }

      acc[eventId].seatNumbers.push(seat.seatNumber);
      acc[eventId].totalAmount = acc[eventId].seatNumbers.length * event.price;

      const seatBookedAt = seat.bookedAt || seat.updatedAt || seat.createdAt;
      if (seatBookedAt && new Date(seatBookedAt) > new Date(acc[eventId].bookedAt)) {
        acc[eventId].bookedAt = seatBookedAt;
      }

      return acc;
    }, {});

    res.json(Object.values(bookingsByEvent));
  } catch (err) {
    console.error('Get My Bookings Error:', err);
    res.status(500).json({ message: 'Server error while retrieving your bookings' });
  }
};
