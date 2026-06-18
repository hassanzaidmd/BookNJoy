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
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
          <Ticket style={{ color: 'var(--primary)', width: '28px', height: '28px' }} />
          <span style={{ 
            fontSize: '1.5rem', 
            fontWeight: '800', 
            letterSpacing: '-0.02em', 
            background: 'linear-gradient(135deg, #a855f7 0%, #6366f1 100%)', 
            WebkitBackgroundClip: 'text', 
            WebkitTextFillColor: 'transparent' 
          }}>
            SORT MY SCENE
          </span>
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
