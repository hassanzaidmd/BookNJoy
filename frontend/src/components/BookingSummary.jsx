import React, { useState, useEffect } from 'react';
import { Clock, CreditCard, AlertTriangle, LogIn } from 'lucide-react';

const BookingSummary = ({ 
  event, 
  selectedSeats, 
  activeReservation, 
  user, 
  onReserve, 
  onConfirmBooking, 
  onTimerExpire,
  onOpenAuth,
  loading 
}) => {
  const [secondsLeft, setSecondsLeft] = useState(0);

  // Countdown timer effect based on absolute target timestamp
  useEffect(() => {
    if (!activeReservation) {
      setSecondsLeft(0);
      return;
    }

    const targetTime = new Date(activeReservation.expiresAt).getTime();
    
    const updateTimer = () => {
      const remaining = Math.max(0, Math.floor((targetTime - Date.now()) / 1000));
      setSecondsLeft(remaining);
      
      if (remaining <= 0) {
        clearInterval(intervalId);
        onTimerExpire();
      }
    };

    // Run immediately
    updateTimer();

    const intervalId = setInterval(updateTimer, 1000);

    return () => clearInterval(intervalId);
  }, [activeReservation, onTimerExpire]);

  // Formatter for countdown
  const formatTime = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
    const secs = (totalSeconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  const totalPrice = (activeReservation ? activeReservation.seatNumbers.length : selectedSeats.length) * event.price;
  const seatsToDisplay = activeReservation ? activeReservation.seatNumbers : selectedSeats;

  // Determine countdown styling
  let timerColor = 'var(--primary)';
  let isFlashing = false;
  
  if (secondsLeft < 60) {
    timerColor = '#ef4444'; // Red
    isFlashing = true;
  } else if (secondsLeft < 180) {
    timerColor = '#f59e0b'; // Amber
  } else {
    timerColor = '#3b82f6'; // Blue
  }

  return (
    <div className="glass-panel" style={{ padding: '28px', height: 'fit-content' }}>
      <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '20px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
        Booking Summary
      </h3>

      {seatsToDisplay.length === 0 ? (
        <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
          <AlertTriangle size={32} style={{ margin: '0 auto 12px', color: 'var(--text-muted)' }} />
          <p style={{ fontSize: '0.9rem' }}>No seats selected yet.</p>
          <p style={{ fontSize: '0.8rem', marginTop: '4px' }}>Click on any available seat in the map grid to get started.</p>
        </div>
      ) : (
        <div>
          {/* Ticket Stats */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Event</span>
              <span style={{ fontWeight: '600' }}>{event.name}</span>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Ticket Price</span>
              <span style={{ fontWeight: '600' }}>₹{event.price} / seat</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', alignItems: 'flex-start' }}>
              <span style={{ color: 'var(--text-muted)' }}>Selected Seats</span>
              <span style={{ 
                fontWeight: '700', 
                color: activeReservation ? 'var(--seat-reserved-self)' : 'var(--seat-selected)',
                maxWidth: '180px',
                textAlign: 'right',
                wordBreak: 'break-all'
              }}>
                {seatsToDisplay.join(', ')}
              </span>
            </div>
          </div>

          {/* Pricing Total */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            borderTop: '1px solid var(--border)', 
            borderBottom: '1px solid var(--border)', 
            padding: '16px 0', 
            marginBottom: '24px' 
          }}>
            <span style={{ fontSize: '1rem', fontWeight: '500', color: 'var(--text-muted)' }}>Total Amount</span>
            <span style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--text-main)' }}>
              ₹{totalPrice}
            </span>
          </div>

          {/* User authentication warning */}
          {!user && (
            <div style={{ 
              display: 'flex', 
              gap: '10px', 
              padding: '14px', 
              background: 'rgba(245, 158, 11, 0.08)', 
              border: '1px solid rgba(245, 158, 11, 0.2)', 
              borderRadius: 'var(--radius-md)', 
              marginBottom: '24px' 
            }}>
              <AlertTriangle size={18} style={{ color: '#fbbf24', flexShrink: 0, marginTop: '2px' }} />
              <div>
                <p style={{ fontSize: '0.85rem', fontWeight: '600', color: '#fbbf24', marginBottom: '2px' }}>Authentication Required</p>
                <p style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>Please log in to your account to reserve seats.</p>
              </div>
            </div>
          )}

          {/* Timer Section (only shown if reservation holds seats) */}
          {activeReservation && (
            <div style={{ 
              background: 'rgba(255, 255, 255, 0.02)', 
              border: `1px solid ${isFlashing ? 'rgba(239, 68, 68, 0.3)' : 'var(--border)'}`, 
              borderRadius: 'var(--radius-md)', 
              padding: '16px', 
              marginBottom: '24px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              animation: isFlashing ? 'pulse 1s infinite alternate' : 'none',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: timerColor, marginBottom: '6px' }}>
                <Clock size={16} className={isFlashing ? 'animate-pulse' : ''} />
                <span style={{ fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Reservation Expires In
                </span>
              </div>
              <span style={{ 
                fontSize: '2rem', 
                fontWeight: '800', 
                color: timerColor, 
                fontFamily: 'monospace',
                letterSpacing: '0.05em' 
              }}>
                {formatTime(secondsLeft)}
              </span>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px', textAlign: 'center' }}>
                Confirm your booking before the seats are released back to public.
              </p>
            </div>
          )}

          {/* Action buttons */}
          {!user ? (
            <button 
              onClick={onOpenAuth} 
              className="btn-primary" 
              style={{ width: '100%', padding: '14px', gap: '10px' }}
            >
              <LogIn size={18} />
              <span>Sign In to Reserve</span>
            </button>
          ) : !activeReservation ? (
            <button 
              onClick={onReserve} 
              disabled={selectedSeats.length === 0 || loading}
              className="btn-primary" 
              style={{ width: '100%', padding: '14px' }}
            >
              {loading ? 'Reserving Seats...' : `Reserve ${selectedSeats.length} Seats`}
            </button>
          ) : (
            <button 
              onClick={onConfirmBooking} 
              disabled={loading}
              className="btn-primary" 
              style={{ 
                width: '100%', 
                padding: '14px', 
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                boxShadow: '0 4px 14px 0 rgba(16, 185, 129, 0.3)'
              }}
            >
              <CreditCard size={18} style={{ marginRight: '6px' }} />
              {loading ? 'Processing Booking...' : 'Confirm Booking & Pay'}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default BookingSummary;
