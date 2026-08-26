import React, { useState, useEffect } from 'react';

export default function AddItemModal({ isOpen, onClose, item, onAddToCart }) {
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    setQuantity(1);
  }, [item]);

  const handleAddToCart = () => {
    if (quantity < 1) {
      alert('Please enter a valid quantity');
      return;
    }
    onAddToCart({ ...item, quantity });
    onClose();
  };

  const handleQuantityChange = (e) => {
    const value = parseInt(e.target.value) || 0;
    if (value >= 0) {
      setQuantity(value);
    }
  };

  const incrementQuantity = () => {
    setQuantity(quantity + 1);
  };

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  if (!isOpen || !item) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: '#fff',
        borderRadius: 12,
        padding: 32,
        maxWidth: 500,
        width: '90%',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
        animation: 'slideIn 0.3s ease-out'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 20
        }}>
          <h2 style={{ margin: 0, fontSize: 24, fontWeight: 'bold' }}>Add to Cart</h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: 28,
              cursor: 'pointer',
              color: '#666',
              padding: 0,
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            ×
          </button>
        </div>

        {/* Item Image */}
        <div style={{
          marginBottom: 24,
          textAlign: 'center'
        }}>
          <img
            src={item.img || '/images/placeholder.jpg'}
            alt={item.title}
            style={{
              width: '100%',
              height: 250,
              objectFit: 'cover',
              borderRadius: 8,
              marginBottom: 16
            }}
          />
        </div>

        {/* Item Name */}
        <div style={{
          marginBottom: 24,
          textAlign: 'center'
        }}>
          <h3 style={{
            margin: '0 0 8px 0',
            fontSize: 20,
            fontWeight: 600,
            color: '#333'
          }}>
            {item.title}
          </h3>
          {item.description && (
            <p style={{
              margin: '0 0 8px 0',
              fontSize: 14,
              color: '#666'
            }}>
              {item.description}
            </p>
          )}
          {item.price && (
            <p style={{
              margin: 0,
              fontSize: 18,
              fontWeight: 'bold',
              color: '#000000'
            }}>
              ₱ {item.price.toFixed(2)}
            </p>
          )}
        </div>

        {/* Quantity Input */}
        <div style={{
          marginBottom: 24,
          textAlign: 'center'
        }}>
          <label style={{
            display: 'block',
            marginBottom: 12,
            fontSize: 16,
            fontWeight: 600,
            color: '#333'
          }}>
            Quantity
          </label>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12
          }}>
            <button
              onClick={decrementQuantity}
              style={{
                background: '#f0f0f0',
                border: '1px solid #ddd',
                width: 40,
                height: 40,
                borderRadius: 6,
                cursor: 'pointer',
                fontSize: 18,
                fontWeight: 'bold',
                color: '#333',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.background = '#e0e0e0'}
              onMouseLeave={(e) => e.target.style.background = '#f0f0f0'}
            >
              −
            </button>
            <input
              type="number"
              value={quantity}
              onChange={handleQuantityChange}
              style={{
                width: 80,
                height: 40,
                fontSize: 16,
                textAlign: 'center',
                border: '1px solid #ddd',
                borderRadius: 6,
                padding: '8px'
              }}
              min="1"
            />
            <button
              onClick={incrementQuantity}
              style={{
                background: '#f0f0f0',
                border: '1px solid #ddd',
                width: 40,
                height: 40,
                borderRadius: 6,
                cursor: 'pointer',
                fontSize: 18,
                fontWeight: 'bold',
                color: '#333',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.background = '#e0e0e0'}
              onMouseLeave={(e) => e.target.style.background = '#f0f0f0'}
            >
              +
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          gap: 12,
          justifyContent: 'center'
        }}>
          <button
            onClick={onClose}
            style={{
              background: '#f0f0f0',
              border: '1px solid #ddd',
              color: '#333',
              padding: '12px 24px',
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 600,
              flex: 1,
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.background = '#e0e0e0'}
            onMouseLeave={(e) => e.target.style.background = '#f0f0f0'}
          >
            Cancel
          </button>
          <button
            onClick={handleAddToCart}
            style={{
              background: '#04ab0c',
              border: 'none',
              color: 'white',
              padding: '12px 24px',
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 600,
              flex: 1,
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.background = '#039a0a'}
            onMouseLeave={(e) => e.target.style.background = '#04ab0c'}
          >
            Add to Cart
          </button>
        </div>
      </div>
      <style>{`
        @keyframes slideIn {
          from {
            transform: translateY(-50px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
