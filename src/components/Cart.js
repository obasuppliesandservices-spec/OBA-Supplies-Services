import React from 'react';

export default function Cart({ cart, onRemoveFromCart, onContinueShopping, onClearCart }) {
  return (
    <div style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto', minHeight: '70vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{
        textAlign: 'center',
        padding: '60px 24px',
        background: '#f9f9f9',
        borderRadius: '8px',
        border: '2px dashed #ddd',
        maxWidth: '500px'
      }}>
        <h2 style={{ color: '#666', marginBottom: '12px', fontSize: '28px' }}>Shopping Cart</h2>
        <p style={{ color: '#999', marginBottom: '24px', fontSize: '16px' }}>
          No items added
        </p>
        <button
          onClick={onContinueShopping}
          style={{
            background: '#04ab0c',
            border: 'none',
            color: 'white',
            padding: '12px 24px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '600',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => e.target.style.background = '#039a0a'}
          onMouseLeave={(e) => e.target.style.background = '#04ab0c'}
        >
          Continue Shopping
        </button>
      </div>
    </div>
  );
}
