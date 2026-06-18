# BookNJoy - Event Ticket Booking Flow

A simplified event ticket booking application built using the MERN stack (Node.js, Express, MongoDB, and React.js). This project focuses on real-time seat reservation, atomic concurrency safety, and booking confirmation with active countdown timers.

---

## Key Features
* **Interactive Seating Chart**: Real-time visual layout representing Seat Statuses (Available, Selected, Reserved by You, Reserved by Others, Booked) with a premium dark glassmorphic design.
* **Atomic Concurrency locks**: Guaranteed prevention of double bookings even under heavy concurrent traffic without requiring replica set transaction configurations.
* **Resilient Expiry Session**: 10-minute active countdown timers. If a user refreshes the browser, the active reservation is fetched from the backend and resumed with the accurate remaining duration.
* **Stale Reservation Garbage Collection**: Dynamic cleanup running both as a 10-second periodic worker and inline "just-in-time" when viewing event details to guarantee data freshness.
* **Zero-Config Setup**: If no MongoDB connection string is provided, the backend automatically spins up an in-memory MongoDB server and seeds mock events and seat grids on startup.

---

## Tech Stack
* **Backend**: Node.js, Express.js, Mongoose (MongoDB), JWT, BcryptJS, MongoDB Memory Server.
* **Frontend**: React (Vite), Vanilla CSS (premium dark theme), Lucide Icons.

---

## Quick Start (Running the Application)

### Prerequisites
* [Node.js](https://nodejs.org/) installed (v18+ recommended)
* Optional: Local [MongoDB](https://www.mongodb.com/) running (if not running, the app automatically runs in-memory!)

---

### Step 1: Start the Backend Service
1. Navigate to the `backend/` directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. *(Optional)* Configure environment variables. If you have MongoDB running locally, copy the `.env.example` file in the `backend/` folder to a new file named `.env`:
   ```bash
   cp .env.example .env
   ```
   Or create `.env` manually:
   ```env
   PORT=5000
   MONGO_URI=mongodb://localhost:27017/booknjoy
   JWT_SECRET=your_custom_secret_key
   ```
   *Note: If no `.env` is created, the server will fallback to a **MongoDB Memory Server** running on port `5000` and automatically seed the database.*
4. Start the backend development server:
   ```bash
   npm run dev
   ```
   *You should see output indicating MongoDB connection and automatic database seeding if empty.*

---

### Step 2: Start the Frontend React Client
1. Open a new terminal and navigate to the `frontend/` directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
4. Open the browser and visit the URL displayed in the terminal (usually `http://localhost:5173`).

---

## Testing Concurrency & Atomic Locks
To run the automated concurrency check which simulates multiple users attempting to book the same seat simultaneously:
1. Navigate to the `backend/` directory.
2. Run the test script:
   ```bash
   npm run test-concurrency
   ```
This script runs a race-condition simulation, verifying that exactly one user claims the seat, while the other receives a conflict exception, leaving the database state consistent.

---

## Design Decisions & Technical Explanations

### 1. How We Avoid Double Booking
Since MongoDB transactions require a replica set setup (which is usually not present on a reviewer's local development machine), we implemented an **Atomic Reservation Token Lock** at the document level:

1. **Pre-Reservation Lock**: A draft `Reservation` document is created first with a 10-minute lifespan, generating a unique `reservationId` token.
2. **Atomic Seat Update**: We execute an atomic query on the `Seat` collection:
   ```javascript
   const updateResult = await Seat.updateMany(
     {
       eventId,
       seatNumber: { $in: seatNumbers },
       status: 'available' // Crucial match criteria
     },
     {
       $set: {
         status: 'reserved',
         reservationId: reservation._id,
         reservedAt: new Date()
       }
     }
   );
   ```
3. **Modified Verification**:
   * If `updateResult.modifiedCount` equals the requested number of seats, the lock is secured.
   * If there is a mismatch (some seats were taken between selection and reservation), the operation is rolled back. We revert only the seats matching our specific `reservationId` back to `'available'`, delete the draft `Reservation` record, and return a HTTP `409 Conflict` containing the names of the unavailable seats.
4. **Confirm Booking**: When `/api/bookings` is hit, we atomically search and delete the reservation (`findOneAndDelete`) where `expiresAt > Date.now()`. If found, we upgrade the seats matching that `reservationId` from `'reserved'` to `'booked'`. If not found, it has expired, and booking is denied.

### 2. Timeouts and Expiration Strategy
* **Background Worker**: Every 10 seconds, a background job searches for `expiresAt < Date.now()` reservations. It reverts associated seat statuses back to `'available'` and deletes the expired documents.
* **Just-In-Time Expiry**: To ensure the user interface never displays stale seats, the `GET /api/events/:id` endpoint runs the expiry check for that event *inline* before returning the seat layout. This guarantees 100% data correctness.

### 3. Assumptions Made
1. **User Identity**: To make the checkout flow functional, basic user registration and login are implemented using JWT. Unauthenticated users can view events and layouts but must register or sign in to reserve seats.
2. **Fixed Venue Sizes**: Seating grids are modeled as a standard layout (Rows A-D, seats 1-10) for mock events, but the database model dynamically adapts to any grid configuration.
3. **Overwrite Selection**: If a user holds active seats for an event but goes back and selects a *new* set of seats for the same event, the app automatically releases the previous seats and updates the reservation to the new ones rather than blocking them.
