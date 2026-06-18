const Reservation = require('../models/Reservation');
const Seat = require('../models/Seat');

const cleanupExpiredReservations = async (eventId = null) => {
  try {
    const query = { expiresAt: { $lt: new Date() }, isCompleted: false };
    if (eventId) {
      query.eventId = eventId;
    }

    const expiredReservations = await Reservation.find(query);
    if (expiredReservations.length > 0) {
      const ids = expiredReservations.map(r => r._id);
      
      for (const res of expiredReservations) {
        // Release only seats that are still matched to this reservation and in status 'reserved'
        await Seat.updateMany(
          { 
            eventId: res.eventId, 
            seatNumber: { $in: res.seatNumbers }, 
            status: 'reserved',
            reservationId: res._id 
          },
          { 
            $set: { status: 'available' }, 
            $unset: { reservationId: 1, reservedAt: 1 } 
          }
        );
      }
      
      // Delete the expired reservation documents
      await Reservation.deleteMany({ _id: { $in: ids } });
      console.log(`[Cleanup] Successfully released seats for ${expiredReservations.length} expired reservations.`);
    }
  } catch (err) {
    console.error('[Cleanup Error]:', err);
  }
};

module.exports = { cleanupExpiredReservations };
