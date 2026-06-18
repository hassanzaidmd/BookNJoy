import React from 'react';

const SeatMap = ({ seats, selectedSeats, onSeatClick, activeReservation }) => {
  
  // Group seats by their row character (e.g. 'A' from 'A1')
  const seatsByRow = seats.reduce((acc, seat) => {
    const row = seat.seatNumber.charAt(0);
    if (!acc[row]) {
      acc[row] = [];
    }
    acc[row].push(seat);
    return acc;
  }, {});

  // Sort rows alphabetically, and columns numerically
  const sortedRows = Object.keys(seatsByRow).sort();
  sortedRows.forEach(row => {
    seatsByRow[row].sort((a, b) => {
      const numA = parseInt(a.seatNumber.slice(1), 10);
      const numB = parseInt(b.seatNumber.slice(1), 10);
      return numA - numB;
    });
  });

  // Determine button background matching state
  const getSeatColor = (seat) => {
    const isSelected = selectedSeats.includes(seat.seatNumber);
    
    if (seat.status === 'booked') {
      return 'var(--seat-booked)';
    }
    
    const isReservedByMe = activeReservation && 
      seat.status === 'reserved' && 
      seat.reservationId === activeReservation._id;

    if (isReservedByMe) {
      return 'var(--seat-reserved-self)';
    }

    if (seat.status === 'reserved') {
      return 'var(--seat-reserved-others)';
    }

    if (isSelected) {
      return 'var(--seat-selected)';
    }

    return 'var(--seat-available)';
  };

  // Hover title tooltip helper
  const getSeatTitle = (seat) => {
    const isReservedByMe = activeReservation && 
      seat.status === 'reserved' && 
      seat.reservationId === activeReservation._id;

    if (seat.status === 'booked') return `Seat ${seat.seatNumber} (Booked)`;
    if (isReservedByMe) return `Seat ${seat.seatNumber} (Reserved by you)`;
    if (seat.status === 'reserved') return `Seat ${seat.seatNumber} (Reserved by another user)`;
    if (selectedSeats.includes(seat.seatNumber)) return `Seat ${seat.seatNumber} (Selected)`;
    return `Seat ${seat.seatNumber} (Available)`;
  };

  return (
    <div className="glass-panel" style={{ 
      padding: '32px', 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center',
      width: '100%'
    }}>
      {/* Screen / Stage projection indicator */}
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        width: '85%', 
        marginBottom: '40px' 
      }}>
        <div style={{ 
          width: '100%', 
          height: '4px', 
          background: 'linear-gradient(90deg, transparent 0%, var(--primary) 50%, transparent 100%)', 
          boxShadow: '0 4px 15px var(--primary-glow)', 
          borderRadius: '9999px' 
        }} />
        <span style={{ 
          fontSize: '0.75rem', 
          color: 'var(--text-muted)', 
          fontWeight: '600', 
          letterSpacing: '0.2em', 
          marginTop: '10px', 
          textTransform: 'uppercase' 
        }}>
          STAGE
        </span>
      </div>

      {/* Grid container with overflow-x support */}
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '14px', 
        width: '100%', 
        overflowX: 'auto', 
        paddingBottom: '16px', 
        alignItems: 'center' 
      }}>
        {sortedRows.map(row => (
          <div key={row} style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 'max-content' }}>
            {/* Left Row Label */}
            <span style={{ 
              width: '24px', 
              fontWeight: '700', 
              fontSize: '0.9rem', 
              color: 'var(--text-muted)', 
              textAlign: 'center' 
            }}>
              {row}
            </span>
            
            {/* Row Seats */}
            <div style={{ display: 'flex', gap: '10px' }}>
              {seatsByRow[row].map(seat => {
                const isSelected = selectedSeats.includes(seat.seatNumber);
                const isBooked = seat.status === 'booked';
                
                const isReservedByMe = activeReservation && 
                  seat.status === 'reserved' && 
                  seat.reservationId === activeReservation._id;
                
                const isReservedByOthers = seat.status === 'reserved' && !isReservedByMe;
                
                // If there's an active reservation but it's not THIS seat, disable other inputs to enforce flow
                const isDisabled = isBooked || isReservedByOthers || (activeReservation && !isReservedByMe);
                const color = getSeatColor(seat);

                return (
                  <button
                    key={seat._id}
                    onClick={() => onSeatClick(seat.seatNumber, isDisabled)}
                    disabled={isDisabled}
                    title={getSeatTitle(seat)}
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: 'var(--radius-sm)',
                      background: color,
                      border: isSelected ? '1.5px solid #fff' : '1px solid rgba(255,255,255,0.05)',
                      color: 'white',
                      fontWeight: '600',
                      fontSize: '0.75rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: isDisabled ? 'not-allowed' : 'pointer',
                      transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
                      boxShadow: isSelected ? '0 0 10px var(--seat-selected-glow)' : 'none',
                    }}
                    onMouseOver={(e) => {
                      if (!isDisabled && !isSelected) {
                        e.currentTarget.style.background = 'var(--seat-available-hover)';
                        e.currentTarget.style.transform = 'scale(1.1)';
                      }
                    }}
                    onMouseOut={(e) => {
                      if (!isDisabled && !isSelected) {
                        e.currentTarget.style.background = color;
                        e.currentTarget.style.transform = 'scale(1)';
                      }
                    }}
                  >
                    {seat.seatNumber.slice(1)}
                  </button>
                );
              })}
            </div>

            {/* Right Row Label */}
            <span style={{ 
              width: '24px', 
              fontWeight: '700', 
              fontSize: '0.9rem', 
              color: 'var(--text-muted)', 
              textAlign: 'center' 
            }}>
              {row}
            </span>
          </div>
        ))}
      </div>

      {/* Seating Grid Legend */}
      <div style={{ 
        display: 'flex', 
        flexWrap: 'wrap', 
        justifyContent: 'center', 
        gap: '20px', 
        marginTop: '36px', 
        paddingTop: '24px', 
        borderTop: '1px solid var(--border)',
        width: '100%'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
          <div style={{ width: '16px', height: '16px', borderRadius: '4px', background: 'var(--seat-available)' }} />
          <span style={{ color: 'var(--text-muted)' }}>Available</span>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
          <div style={{ 
            width: '16px', 
            height: '16px', 
            borderRadius: '4px', 
            background: 'var(--seat-selected)', 
            border: '1px solid #fff', 
            boxShadow: '0 0 6px var(--seat-selected-glow)' 
          }} />
          <span style={{ color: 'var(--text-muted)' }}>Selected</span>
        </div>
        
        {activeReservation && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
            <div style={{ width: '16px', height: '16px', borderRadius: '4px', background: 'var(--seat-reserved-self)' }} />
            <span style={{ color: 'var(--text-muted)' }}>Reserved (You)</span>
          </div>
        )}
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
          <div style={{ width: '16px', height: '16px', borderRadius: '4px', background: 'var(--seat-reserved-others)' }} />
          <span style={{ color: 'var(--text-muted)' }}>Reserved (Others)</span>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
          <div style={{ width: '16px', height: '16px', borderRadius: '4px', background: 'var(--seat-booked)' }} />
          <span style={{ color: 'var(--text-muted)' }}>Booked</span>
        </div>
      </div>
    </div>
  );
};

export default SeatMap;
