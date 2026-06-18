import React from 'react';
import { Ticket, LogOut, User, LogIn } from 'lucide-react';

const Navbar = ({ user, onLogout, onOpenAuth }) => {
  return (
    <header className="glass-panel" style={{ borderRadius: '0 0 16px 16px', borderTop: 'none', marginBottom: '32px' }}>
      <div style={{ 
        maxWidth: '1200px', 
        margin: '0 auto', 
        padding: '16px 24px', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center' 
      }}>
        {/* Logo Branding */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', cursor: 'pointer' }}>
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '16px',
            display: 'grid',
            placeItems: 'center',
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.22) 0%, rgba(168, 85, 247, 0.28) 100%)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 8px 24px rgba(99, 102, 241, 0.18), inset 0 1px 0 rgba(255, 255, 255, 0.08)'
          }}>
            <Ticket style={{ color: 'white', width: '22px', height: '22px' }} strokeWidth={2.2} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.05 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <span style={{ 
                fontSize: '1.35rem', 
                fontWeight: '800', 
                letterSpacing: '-0.04em', 
                color: 'var(--text-main)' 
              }}>
                BookNJoy
              </span>
              <span style={{
                padding: '4px 9px',
                borderRadius: '9999px',
                fontSize: '0.68rem',
                fontWeight: '700',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: '#c4b5fd',
                background: 'rgba(99, 102, 241, 0.12)',
                border: '1px solid rgba(99, 102, 241, 0.18)'
              }}>
                Live Booking
              </span>
            </div>
            <span style={{
              marginTop: '4px',
              fontSize: '0.8rem',
              color: 'var(--text-muted)',
              letterSpacing: '0.01em'
            }}>
              Book seats. Secure joy.
            </span>
          </div>
        </div>

        {/* User Auth Section */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {user ? (
            <>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px', 
                padding: '6px 14px', 
                background: 'rgba(255,255,255,0.03)', 
                borderRadius: '9999px', 
                border: '1px solid var(--border)' 
              }}>
                <User size={16} style={{ color: 'var(--text-muted)' }} />
                <span style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-main)' }}>
                  Hi, {user.name}
                </span>
              </div>
              
              <button 
                onClick={onLogout} 
                className="btn-secondary" 
                style={{ padding: '8px 16px', fontSize: '0.875rem', height: '38px' }}
              >
                <LogOut size={16} />
                <span>Log Out</span>
              </button>
            </>
          ) : (
            <button 
              onClick={onOpenAuth} 
              className="btn-primary" 
              style={{ padding: '8px 18px', fontSize: '0.875rem', height: '38px' }}
            >
              <LogIn size={16} />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
