import React from 'react';
import { Calendar, MapPin, Users } from 'lucide-react';

const EventCard = ({ event, onSelect, isSelected }) => {
  const { name, date, venue, totalSeats, price, description, availableSeatsCount } = event;
  
  // Format Date and Time
  const eventDate = new Date(date);
  const formattedDate = eventDate.toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
  
  const formattedTime = eventDate.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const availablePct = (availableSeatsCount / totalSeats) * 100;
  
  // Determine color matching seat availability progress bar
  let progressColor = 'var(--primary)';
  if (availableSeatsCount === 0) {
    progressColor = 'rgba(239, 68, 68, 0.3)';
  } else if (availablePct < 20) {
    progressColor = '#ef4444'; // Red (Critical availability)
  } else if (availablePct < 50) {
    progressColor = '#f59e0b'; // Amber (Moderate availability)
  }

  return (
    <div 
      className={`glass-panel glass-panel-hover`}
      style={{
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        height: '100%',
        cursor: 'pointer',
        border: isSelected ? '2px solid var(--primary)' : '1px solid var(--border)',
        boxShadow: isSelected ? '0 0 20px var(--primary-glow)' : 'var(--shadow-premium)',
        transform: isSelected ? 'translateY(-4px)' : 'none',
      }}
      onClick={() => onSelect(event)}
    >
      <div>
        {/* Header Title & Pricing */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: '12px' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: '700', lineHeight: '1.3', color: 'var(--text-main)' }}>
            {name}
          </h3>
          <span className="badge badge-info" style={{ flexShrink: 0, fontSize: '0.8rem' }}>
            ₹{price}
          </span>
        </div>

        {/* Clamped Description */}
        <p style={{ 
          color: 'var(--text-muted)', 
          fontSize: '0.875rem', 
          marginBottom: '20px', 
          display: '-webkit-box', 
          WebkitLineClamp: 2, 
          WebkitBoxOrient: 'vertical', 
          overflow: 'hidden', 
          height: '42px',
          lineHeight: '1.5'
        }}>
          {description}
        </p>

        {/* Location & Time specs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            <Calendar size={15} style={{ color: 'var(--primary)', flexShrink: 0 }} />
            <span>{formattedDate} at {formattedTime}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            <MapPin size={15} style={{ color: 'var(--primary)', flexShrink: 0 }} />
            <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
              {venue}
            </span>
          </div>
        </div>
      </div>

      <div>
        {/* Availability details */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '8px', 
          fontSize: '0.775rem', 
          fontWeight: '600',
          textTransform: 'uppercase',
          letterSpacing: '0.05em'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)' }}>
            <Users size={13} />
            <span>Tickets</span>
          </div>
          <span style={{ color: availableSeatsCount === 0 ? '#ef4444' : 'var(--text-main)' }}>
            {availableSeatsCount === 0 ? 'SOLD OUT' : `${availableSeatsCount} / ${totalSeats} Left`}
          </span>
        </div>
        
        {/* Progress indicator bar */}
        <div style={{ 
          height: '6px', 
          background: 'rgba(255, 255, 255, 0.05)', 
          borderRadius: '9999px', 
          overflow: 'hidden', 
          marginBottom: '20px' 
        }}>
          <div style={{ 
            height: '100%', 
            width: `${availablePct}%`, 
            background: progressColor, 
            borderRadius: '9999px', 
            transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)' 
          }} />
        </div>

        <button 
          onClick={(e) => {
            e.stopPropagation();
            onSelect(event);
          }}
          className={isSelected ? 'btn-primary' : 'btn-secondary'}
          style={{ width: '100%', padding: '10px 16px', fontSize: '0.875rem' }}
        >
          {isSelected ? 'Viewing Layout' : 'Book Tickets'}
        </button>
      </div>
    </div>
  );
};

export default EventCard;
