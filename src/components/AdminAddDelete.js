import React, { useState } from 'react';
import useStickyState from '../useStickyState';
import AdminService from './AdminService';
import AdminProduct from './AdminProduct';
import AdminOrderspage from './AdminOrderspage';

export default function AdminAddDelete({ onLogout }) {
  const [currentPage, setCurrentPage] = useStickyState('services', 'admin_currentPage');

  const renderContent = () => {
    switch (currentPage) {
      case 'services':
        return <AdminService />;
      case 'products':
        return <AdminProduct />;
      case 'order':
        return <AdminOrderspage />;
      default:
        return <AdminService />;
    }
  };

  return (
    <div style={{ minHeight: '100vh' }}>
      {/* Navigation */}
      <nav style={{
        background: 'rgba(4, 171, 12, 0.9)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        padding: '20px 24px',
        display: 'flex',
        alignItems: 'center',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        borderBottom: '1px solid rgba(255,255,255,0.1)'
      }}>
        {/* logo left */}
        <div style={{ position: 'absolute', left: '24px', display: 'flex', alignItems: 'center' }}>
          <button
            onClick={() => setCurrentPage('services')}
            style={{ color: 'white', textDecoration: 'none', fontSize: '15px', background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <img src="/logo.png" alt="OBA logo" className="homepage-logo" />
            OBA SUPPLIES - ADMIN
          </button>
        </div>

        {/* centered links */}
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center', margin: '0 auto' }}>
          <button
            onClick={() => setCurrentPage('services')}
            style={{
              color: 'white',
              textDecoration: 'none',
              fontSize: '13px',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '8px 16px',
              borderRadius: '6px',
              transition: 'background-color 0.2s',
              backgroundColor: currentPage === 'services' ? 'rgba(255,255,255,0.2)' : 'transparent'
            }}
          >
            Services
          </button>
          <button
            onClick={() => setCurrentPage('products')}
            style={{
              color: 'white',
              textDecoration: 'none',
              fontSize: '13px',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '8px 16px',
              borderRadius: '6px',
              transition: 'background-color 0.2s',
              backgroundColor: currentPage === 'products' ? 'rgba(255,255,255,0.2)' : 'transparent'
            }}
          >
            Products
          </button>
          <button
            onClick={() => setCurrentPage('order')}
            style={{
              color: 'white',
              textDecoration: 'none',
              fontSize: '13px',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '8px 16px',
              borderRadius: '6px',
              transition: 'background-color 0.2s',
              backgroundColor: currentPage === 'order' ? 'rgba(255,255,255,0.2)' : 'transparent'
            }}
          >
            Order
          </button>
        </div>

        {/* logout button */}
        <div style={{ position: 'absolute', right: '24px' }}>
          <button
            onClick={onLogout}
            style={{
              backgroundColor: 'rgba(255,255,255,0.2)',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '13px',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255,255,255,0.3)'}
            onMouseLeave={(e) => e.target.style.backgroundColor = 'rgba(255,255,255,0.2)'}
          >
            Logout
          </button>
        </div>
      </nav>

      {/* Content */}
      {renderContent()}
    </div>
  );
}