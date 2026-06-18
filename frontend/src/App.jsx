import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import AuthModal from './components/AuthModal';
import EventCard from './components/EventCard';
import SeatMap from './components/SeatMap';
import BookingSummary from './components/BookingSummary';
import { ArrowLeft, RefreshCw, Info, AlertTriangle, CheckCircle, Ticket } from 'lucide-react';

const API_BASE = 'http://localhost:5000';

function App() {
  // Global States
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [eventDetails, setEventDetails] = useState(null);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [activeReservation, setActiveReservation] = useState(null);
  const [toasts, setToasts] = useState([]);
  
  // UI states
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);

  // 1. Toast Notification Helper
  const showToast = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    
    // Automatically prune toast after 5 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  // 2. Load Auth Token on startup
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const savedToken = localStorage.getItem('token');
    if (savedUser && savedToken) {
      setUser(JSON.parse(savedUser));
      setToken(savedToken);
    }
  }, []);

  // 3. Fetch all Events
  const fetchEvents = useCallback(async () => {
    setLoadingEvents(true);
    try {
      const res = await fetch(`${API_BASE}/api/events`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to fetch events');
      setEvents(data);
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Connection to backend failed. Make sure server is running.', 'error');
    } finally {
      setLoadingEvents(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // 4. Fetch Details for Selected Event (includes Seat layout & optional active user reservation)
  const fetchEventDetails = useCallback(async (eventId, customToken = null) => {
    setLoadingDetails(true);
    const activeToken = customToken || token;
    
    try {
      const headers = {};
      if (activeToken) {
        headers['Authorization'] = `Bearer ${activeToken}`;
      }

      const res = await fetch(`${API_BASE}/api/events/${eventId}`, { headers });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.message || 'Failed to fetch event details');
      
      setEventDetails(data.event);
      // Wait, data.seats contains all event seats
      // data.activeReservation contains reservation details if user has one
      setActiveReservation(data.activeReservation);
      
      // If there is an active reservation, pre-populate seats (but keep selectedSeats array empty for updates)
      if (data.activeReservation) {
        setSelectedSeats([]);
      }
      
      // Update our details object
      setEventDetails((prev) => ({
        ...prev,
        seats: data.seats
      }));

    } catch (err) {
      console.error(err);
      showToast(err.message || 'Failed to load seats layout.', 'error');
    } finally {
      setLoadingDetails(false);
    }
  }, [token, showToast]);

  // Trigger seat details fetch when selected event ID changes
  useEffect(() => {
    if (selectedEventId) {
      fetchEventDetails(selectedEventId);
    } else {
      setEventDetails(null);
      setActiveReservation(null);
      setSelectedSeats([]);
    }
  }, [selectedEventId, fetchEventDetails]);

  // 5. Auth Success Handlers
  const handleAuthSuccess = (userData, userToken) => {
    setUser(userData);
    setToken(userToken);
    showToast(`Welcome back, ${userData.name}!`, 'success');
    
    // If we were looking at an event, re-fetch detail with user auth context
    if (selectedEventId) {
      fetchEventDetails(selectedEventId, userToken);
    }
    // Refresh global events list
    fetchEvents();
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setToken(null);
    setActiveReservation(null);
    setSelectedSeats([]);
    showToast('Logged out successfully.', 'success');
    
    // Refresh selected event details without token
    if (selectedEventId) {
      fetchEventDetails(selectedEventId, null);
    }
    fetchEvents();
  };

  // 6. Handle Seat Clicks (Toggling Selection)
  const handleSeatClick = (seatNumber, isDisabled) => {
    if (isDisabled) return;

    // If there's an active reservation, selection is locked (user must book or wait)
    if (activeReservation) {
      showToast('You already have reserved seats. Confirm booking or wait for timer to expire.', 'warning');
      return;
    }

    setSelectedSeats((prev) => {
      if (prev.includes(seatNumber)) {
        return prev.filter((s) => s !== seatNumber);
      } else {
        return [...prev, seatNumber];
      }
    });
  };

  // 7. Click Reserve -> calls /api/reserve
  const handleReserve = async () => {
    if (!user || !token) {
      setAuthModalOpen(true);
      return;
    }

    if (selectedSeats.length === 0) {
      showToast('Please select at least one seat first.', 'warning');
      return;
    }

    setBookingLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/reserve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          eventId: selectedEventId,
          seatNumbers: selectedSeats
        })
      });

      const data = await res.json();

      if (res.status === 409) {
        // Double booking collision occurred!
        // Display exact seats that became unavailable
        const unavailableMsg = data.unavailableSeats 
          ? `Seat(s) ${data.unavailableSeats.join(', ')} were booked or reserved by someone else while you were selecting.`
          : data.message;
        
        showToast(unavailableMsg, 'error');
        // Instantly refresh seats grid to show updated status
        await fetchEventDetails(selectedEventId);
        return;
      }

      if (!res.ok) {
        throw new Error(data.message || 'Failed to reserve seats.');
      }

      // Reservation secured
      setActiveReservation(data.reservation);
      setSelectedSeats([]); // Clear current selections since they are now reserved
      showToast('Seats reserved successfully! Complete booking within 10 minutes.', 'success');
      
      // Refresh event details to reflect seat colors (reserved blue)
      await fetchEventDetails(selectedEventId);
      await fetchEvents();

    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setBookingLoading(false);
    }
  };

  // 8. Confirm Booking -> calls /api/bookings
  const handleConfirmBooking = async () => {
    if (!activeReservation) return;

    setBookingLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          reservationId: activeReservation._id
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Booking confirmation failed.');
      }

      // Booking confirmed
      showToast('Booking confirmed! Your tickets are secured.', 'success');
      setActiveReservation(null);
      
      // Refresh event detail (seats turn green) and event statistics
      await fetchEventDetails(selectedEventId);
      await fetchEvents();

    } catch (err) {
      showToast(err.message, 'error');
      // If error indicates expired reservation, clear it locally
      setActiveReservation(null);
      await fetchEventDetails(selectedEventId);
    } finally {
      setBookingLoading(false);
    }
  };

  // 9. Timer Expiry Handler
  const handleTimerExpire = useCallback(() => {
    setActiveReservation(null);
    showToast('Your reservation timer expired. Seats have been released.', 'warning');
    // Refresh seat layout grid
    if (selectedEventId) {
      fetchEventDetails(selectedEventId);
    }
    fetchEvents();
  }, [selectedEventId, fetchEventDetails, fetchEvents, showToast]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* Navigation */}
      <Navbar user={user} onLogout={handleLogout} onOpenAuth={() => setAuthModalOpen(true)} />

      {/* Main Container */}
      <main style={{ flex: 1, width: '100%', maxWidth: '1200px', margin: '0 auto', padding: '0 24px 60px' }}>
        
        {!selectedEventId ? (
          /* SECTION 1: Event Showcase Grid */
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
              <div>
                <h1 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '6px' }}>Upcoming Events</h1>
                <p style={{ color: 'var(--text-muted)' }}>Browse list and select an event to choose your seats.</p>
              </div>
              
              <button 
                onClick={fetchEvents} 
                className="btn-secondary" 
                style={{ padding: '10px 14px', borderRadius: 'var(--radius-md)', gap: '6px' }}
                disabled={loadingEvents}
              >
                <RefreshCw size={16} className={loadingEvents ? 'animate-spin' : ''} />
                <span>Refresh</span>
              </button>
            </div>

            {loadingEvents ? (
              /* Loading Spinner */
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '100px 0' }}>
                <div style={{ border: '4px solid rgba(255, 255, 255, 0.05)', borderTop: '4px solid var(--primary)', borderRadius: '50%', width: '48px', height: '48px', animation: 'spin 1s linear infinite', marginBottom: '16px' }} />
                <p style={{ color: 'var(--text-muted)' }}>Loading events list...</p>
              </div>
            ) : events.length === 0 ? (
              /* Empty Database */
              <div className="glass-panel" style={{ padding: '60px', textAlign: 'center' }}>
                <Ticket size={48} style={{ margin: '0 auto 16px', color: 'var(--text-muted)' }} />
                <h3>No Events Found</h3>
                <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>Please try seeding the database or refresh the page.</p>
              </div>
            ) : (
              /* Events Cards Layout */
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', 
                gap: '24px' 
              }}>
                {events.map((event) => (
                  <EventCard 
                    key={event._id} 
                    event={event} 
                    onSelect={(evt) => setSelectedEventId(evt._id)}
                    isSelected={false}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          /* SECTION 2: Detailed Seat Map Layout */
          <div>
            {/* Back Button */}
            <button 
              onClick={() => setSelectedEventId(null)} 
              className="btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px', padding: '8px 16px' }}
            >
              <ArrowLeft size={16} />
              <span>Back to Events</span>
            </button>

            {loadingDetails || !eventDetails ? (
              /* Seat grid loader */
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '100px 0' }}>
                <div style={{ border: '4px solid rgba(255, 255, 255, 0.05)', borderTop: '4px solid var(--primary)', borderRadius: '50%', width: '48px', height: '48px', animation: 'spin 1s linear infinite', marginBottom: '16px' }} />
                <p style={{ color: 'var(--text-muted)' }}>Loading seating chart...</p>
              </div>
            ) : (
              /* Interactive Seat Selection */
              <div>
                {/* Event Summary Banner */}
                <div className="glass-panel" style={{ padding: '24px', marginBottom: '32px', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '20px' }}>
                  <div>
                    <h2 style={{ fontSize: '1.75rem', fontWeight: '800', marginBottom: '4px' }}>{eventDetails.name}</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                      {eventDetails.venue} • {new Date(eventDetails.date).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
                    </p>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Ticket Price</span>
                      <p style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--primary)' }}>₹{eventDetails.price}</p>
                    </div>
                    
                    <button 
                      onClick={() => fetchEventDetails(selectedEventId)} 
                      className="btn-secondary"
                      title="Refresh seat grid status"
                      style={{ padding: '10px' }}
                    >
                      <RefreshCw size={18} />
                    </button>
                  </div>
                </div>

                {/* Grid Split Content */}
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '3fr 1.5fr', 
                  gap: '32px',
                  alignItems: 'start'
                }}>
                  {/* Grid layout adjusts for mobile sizing */}
                  <style dangerouslySetInnerHTML={{__html: `
                    @media (max-width: 900px) {
                      main > div > div > div {
                        grid-template-columns: 1fr !important;
                      }
                    }
                    @keyframes spin {
                      0% { transform: rotate(0deg); }
                      100% { transform: rotate(360deg); }
                    }
                    @keyframes pulse {
                      from { transform: scale(1); box-shadow: 0 0 10px rgba(239, 68, 68, 0.1); }
                      to { transform: scale(1.01); box-shadow: 0 0 20px rgba(239, 68, 68, 0.3); }
                    }
                    .animate-spin {
                      animation: spin 1s linear infinite;
                    }
                    .animate-pulse {
                      animation: pulse 1s linear infinite alternate;
                    }
                  `}} />

                  {/* Seat grid selection */}
                  <SeatMap 
                    seats={eventDetails.seats || []} 
                    selectedSeats={selectedSeats}
                    onSeatClick={handleSeatClick}
                    activeReservation={activeReservation}
                  />

                  {/* Order review */}
                  <BookingSummary 
                    event={eventDetails}
                    selectedSeats={selectedSeats}
                    activeReservation={activeReservation}
                    user={user}
                    onReserve={handleReserve}
                    onConfirmBooking={handleConfirmBooking}
                    onTimerExpire={handleTimerExpire}
                    onOpenAuth={() => setAuthModalOpen(true)}
                    loading={bookingLoading}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Floating glass Toast notifications container */}
      <div className="toast-container">
        {toasts.map((toast) => {
          let ToastIcon = Info;
          if (toast.type === 'success') ToastIcon = CheckCircle;
          if (toast.type === 'error') ToastIcon = AlertTriangle;
          if (toast.type === 'warning') ToastIcon = AlertTriangle;

          return (
            <div key={toast.id} className={`toast toast-${toast.type}`}>
              <ToastIcon size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div style={{ fontSize: '0.875rem', fontWeight: '500' }}>
                {toast.message}
              </div>
            </div>
          );
        })}
      </div>

      {/* Auth Modal Overlay */}
      <AuthModal 
        isOpen={authModalOpen} 
        onClose={() => setAuthModalOpen(false)} 
        onAuthSuccess={handleAuthSuccess} 
      />
    </div>
  );
}

export default App;
