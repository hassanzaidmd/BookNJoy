const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const Event = require('./models/Event');
const Seat = require('./models/Seat');
const Reservation = require('./models/Reservation');

// Simulate the atomic reservation locking algorithm from bookingController
const simulateReserve = async (userId, eventId, seatNumbers) => {
  let tempReservation = null;
  try {
    // 1. Create draft Reservation document
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    tempReservation = new Reservation({
      userId,
      eventId,
      seatNumbers,
      expiresAt
    });
    await tempReservation.save();

    // Introduce a brief artificial delay to maximize the chances of overlapping operations
    await new Promise(resolve => setTimeout(resolve, Math.floor(Math.random() * 20)));

    // 2. Perform atomic update matching available seats
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

    if (updateResult.modifiedCount === seatNumbers.length) {
      return { success: true, reservationId: tempReservation._id, userId };
    } else {
      // Conflict: Revert any seats we locked in the partial execution of this query
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
      // Clean up reservation document
      await Reservation.deleteOne({ _id: tempReservation._id });
      return { success: false, error: 'Seats already taken', userId };
    }
  } catch (err) {
    if (tempReservation) {
      await Reservation.deleteOne({ _id: tempReservation._id });
    }
    return { success: false, error: err.message, userId };
  }
};

const runTest = async () => {
  let mongoServer;
  try {
    console.log('============================================================');
    console.log('STARTING CONCURRENCY LOCK TEST FOR "SORT MY SCENE"');
    console.log('============================================================');

    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
    console.log('[Test DB] Connected to temporary in-memory database.');

    // Seed 1 test event and 1 test seat
    const event = new Event({
      name: 'Concurrent Jazz Night',
      date: new Date(),
      venue: 'The Jazz Loft',
      totalSeats: 1,
      price: 60
    });
    await event.save();

    const seat = new Seat({
      eventId: event._id,
      seatNumber: 'A1',
      status: 'available'
    });
    await seat.save();

    console.log(`[Test DB] Seeded Event "${event.name}" (ID: ${event._id}) and Seat "A1" (status: available).`);

    const userA = new mongoose.Types.ObjectId();
    const userB = new mongoose.Types.ObjectId();

    console.log('[Race] Triggering simultaneous reservation requests for Seat "A1" from User A and User B...');

    // Run both reservations in parallel to create a race condition
    const results = await Promise.all([
      simulateReserve(userA, event._id, ['A1']),
      simulateReserve(userB, event._id, ['A1'])
    ]);

    console.log('\n============================================================');
    console.log('RACE CONDITION OUTCOMES');
    console.log('============================================================');
    console.log('User A Result:', results[0]);
    console.log('User B Result:', results[1]);

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    console.log(`Success Count: ${successCount}`);
    console.log(`Conflict/Failure Count: ${failureCount}`);

    // Verify database status is correct and consistent
    const finalSeat = await Seat.findOne({ eventId: event._id, seatNumber: 'A1' });
    const activeReservations = await Reservation.find({ eventId: event._id });

    console.log('\n============================================================');
    console.log('DATABASE STATE AUDIT');
    console.log('============================================================');
    console.log('Seat "A1" status in DB:', finalSeat.status);
    console.log('Seat "A1" reservationId in DB:', finalSeat.reservationId);
    console.log('Active Reservation documents in DB:', activeReservations.length);

    console.log('============================================================');
    if (successCount === 1 && failureCount === 1 && finalSeat.status === 'reserved' && activeReservations.length === 1) {
      console.log('VERDICT: SUCCESS! Concurrency Lock verified.');
      console.log('Exactly one reservation succeeded, and the seat is correctly assigned.');
      console.log('No double booking occurred.');
    } else {
      console.log('VERDICT: FAILURE. Database state is invalid.');
    }
    console.log('============================================================\n');

  } catch (err) {
    console.error('[Error during testing]:', err);
  } finally {
    await mongoose.disconnect();
    if (mongoServer) {
      await mongoServer.stop();
    }
    console.log('[Test DB] Disconnected.');
  }
};

runTest();
