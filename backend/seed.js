const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Event = require('./models/Event');
const Seat = require('./models/Seat');
const Reservation = require('./models/Reservation');

dotenv.config();

const seedData = async () => {
  try {
    // Clear existing data
    await Event.deleteMany({});
    await Seat.deleteMany({});
    await Reservation.deleteMany({});

    console.log('[Seed] Cleared existing Events, Seats, and Reservations.');

    // 1. Define events
    const eventsToCreate = [
      {
        name: 'Summer Sound Festival 2026',
        date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        venue: 'Jio World Garden, BKC Mumbai',
        totalSeats: 40,
        description: 'An evening under the stars featuring the best indie rock bands and electronic music artists.',
        price: 1999
      },
      {
        name: 'Stand-up Comedy Showcase',
        date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
        venue: 'NCPA Auditorium, Nariman Point Mumbai',
        totalSeats: 24,
        description: 'Get ready to laugh until your stomach hurts with 4 award-winning national stand-up comedians.',
        price: 999
      },
      {
        name: 'Grand Opera Symphony',
        date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days from now
        venue: 'Shilpakala Vedika, Hyderabad',
        totalSeats: 40,
        description: 'Experience timeless classics performed by the world-renowned symphony orchestra and soprano soloists.',
        price: 3499
      }
    ];

    const createdEvents = await Event.create(eventsToCreate);
    console.log(`[Seed] Created ${createdEvents.length} events.`);

    // 2. Generate seat layouts for each event
    for (const event of createdEvents) {
      const seats = [];
      const rows = event.totalSeats === 24 ? ['A', 'B', 'C'] : ['A', 'B', 'C', 'D'];
      const seatsPerRow = event.totalSeats / rows.length;

      for (const row of rows) {
        for (let num = 1; num <= seatsPerRow; num++) {
          seats.push({
            eventId: event._id,
            seatNumber: `${row}${num}`,
            status: 'available'
          });
        }
      }

      await Seat.insertMany(seats);
      console.log(`[Seed] Generated ${seats.length} seats for event: "${event.name}"`);
    }

    console.log('[Seed] Database seeding completed successfully.');
  } catch (err) {
    console.error('[Seed Error] Failed to seed database:', err);
    throw err;
  }
};

// Check if run directly from terminal
if (require.main === module) {
  const run = async () => {
    try {
      const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/sortmyscene';
      console.log(`[Seed CLI] Connecting to MongoDB at: ${mongoUri}`);
      await mongoose.connect(mongoUri);
      await seedData();
      await mongoose.connection.close();
      console.log('[Seed CLI] Disconnected from database.');
      process.exit(0);
    } catch (e) {
      console.error('[Seed CLI Error]:', e);
      process.exit(1);
    }
  };
  run();
}

module.exports = { seedData };
