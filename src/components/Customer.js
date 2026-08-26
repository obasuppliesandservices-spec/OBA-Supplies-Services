import React from 'react';
import Homepage from './homepage';

export default function Customer({ user, onLogout, cart, onAddToCart, onRemoveFromCart, onCheckout, onSubmitOrder, notifications, setNotifications }) {
  return (
    <div style={{ minHeight: '100vh' }}>
      <Homepage
        isLoggedIn={true}
        onLogout={onLogout}
        user={user}
        cart={cart}
        onAddToCart={onAddToCart}
        onRemoveFromCart={onRemoveFromCart}
        onCheckout={onCheckout}
        onSubmitOrder={onSubmitOrder}
        notifications={notifications}
        setNotifications={setNotifications}
      />
    </div>
  );
}
