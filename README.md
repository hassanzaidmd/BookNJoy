# BookNJoy - Event Ticket Booking Flow

BookNJoy is a simplified event ticket booking application built with the MERN stack:
Node.js, Express, MongoDB, and React (Vite). It focuses on seat reservation, booking confirmation, concurrency safety, authentication, and a clean responsive UI.

## Live Demo
- Frontend: [https://book-n-joy.vercel.app](https://book-n-joy.vercel.app)
- Backend: [https://booknjoy.onrender.com](https://booknjoy.onrender.com)

## Features
- Event listing with basic event details
- Interactive seat grid with clear status colors
- Multi-seat selection and temporary 10-minute reservation
- Booking confirmation flow with expiry protection
- Basic JWT authentication
- "Booked by You" and "Booked by Others" seat states
- Dedicated "Ticket Booked by Me" section for logged-in users
- Atomic reservation handling to prevent double booking
- Background cleanup of expired reservations
- Responsive glassmorphic UI

## Tech Stack
- Backend: Node.js, Express.js, MongoDB, Mongoose, JWT, bcryptjs
- Frontend: React 19, Vite, Lucide React, vanilla CSS
- Deployment: Render for backend, Vercel for frontend

## Project Structure
```text
backend/
frontend/
README.md
```

## How It Works
1. A user opens the app and sees a list of available events.
2. Selecting an event loads the seat layout.
3. The user selects one or more seats and clicks Reserve.
4. The backend creates a timed reservation for 10 minutes.
5. The frontend shows a countdown timer.
6. The user confirms booking before expiry.
7. The booked seats are marked as booked and appear in the "Ticket Booked by Me" section.

## Backend API
- `GET /api/events` - Retrieve all events
- `GET /api/events/:id` - Retrieve one event with its seat grid
- `POST /api/reserve` - Reserve available seats for 10 minutes
- `POST /api/bookings` - Confirm booking for an active reservation
- `GET /api/bookings/me` - Retrieve the logged-in user’s booked tickets

## Local Setup

### Prerequisites
- Node.js v18+ recommended
- MongoDB Atlas or local MongoDB

### 1. Backend
```bash
cd backend
npm install
npm run dev
```

### 2. Frontend
```bash
cd frontend
npm install
npm run dev
```

## Environment Variables

### `backend/.env`
```env
PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/booknjoy?retryWrites=true&w=majority
FRONTEND_URL=https://book-n-joy.vercel.app
JWT_SECRET=your_secure_secret
```

### `frontend/.env`
```env
VITE_API_BASE_URL=https://booknjoy.onrender.com
```

## Deployment Notes
- The frontend reads the API base URL from `VITE_API_BASE_URL`.
- The backend allows requests from `FRONTEND_URL`.
- When deploying on Vercel and Render, make sure:
  - the frontend env points to the live backend URL
  - the backend env points to the live frontend URL
  - both services are redeployed after env updates

## Concurrency and Double Booking
BookNJoy prevents double booking using atomic MongoDB updates instead of depending on replica-set transactions.

### Reservation flow
- A reservation document is created first.
- Seats are updated only if they are currently `available`.
- If a conflict is detected, any partial update is rolled back.
- Booking is only confirmed if the reservation is still valid.

### Expiry flow
- Reservations expire after 10 minutes.
- Expired seats are released by:
  - a background cleanup job
  - an inline cleanup when event details are fetched

## Authentication
- Users can register and log in with email and password.
- JWT is used to protect reservation and booking endpoints.
- The app stores the token locally for session persistence.

## Design Decisions
- Kept the booking UI single-page and state-driven with React hooks.
- Used a dedicated booking summary panel to keep the flow clear.
- Split booked seats into two visual states:
  - booked by you
  - booked by others
- Added a separate "My Tickets" view for confirmed bookings.

## Assumptions
- Events are seeded with mock data for demonstration.
- Seating grids are generated automatically based on event size.
- A logged-in user can view bookings made by their account.

## Notes for Reviewers
- If the backend root URL shows `Cannot GET /`, that is expected unless `/` is explicitly defined.
- The main API health endpoint is `/status`.
- The frontend must be rebuilt after changing Vercel environment variables because Vite reads them at build time.

## Useful Commands
### Backend
```bash
npm run dev
npm run seed
npm run test-concurrency
```

### Frontend
```bash
npm run dev
npm run build
```
