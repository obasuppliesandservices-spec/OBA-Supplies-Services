import React, { useState, useEffect } from 'react';
import useStickyState from '../useStickyState';
import AboutUs from './AboutUs';
import Service from './Service';
import Product from './Product';
import Orderspage from './Orderspage';
import Cart from './Cart';
import toast from 'react-hot-toast';

// Service Configuration - Fixed manpower and contract lengths per service
const SERVICE_CONFIG = {
  'Insulation and Cladding': { manpower: 4, contractLength: '1 Month' },
  'Cold Box Insulation and Cladding': { manpower: 5, contractLength: '2 Weeks' },
  'Equipment Foundation Coating': { manpower: 3, contractLength: '1 Week' },
  'Welding and Fabrication': { manpower: 6, contractLength: '3 Months' },
  'Cooler Tube Replacement': { manpower: 4, contractLength: '1 Week' },
  'Vacuum Insulated Piping Installation (VIP)': { manpower: 5, contractLength: '1 Month' },
  'Liquid Nitrogen Piping': { manpower: 5, contractLength: '2 Weeks' },
  'Crack Detection Test': { manpower: 2, contractLength: '1 Week' },
  'Repainting': { manpower: 3, contractLength: '1 Week' },
  'Professional Mechanical Engineer Consultancy': { manpower: 1, contractLength: '3 Months' }
};

const formatDateInput = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const parseDateInput = (value) => {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
};

export default function Homepage({ onLoginClick, onLogout, isLoggedIn, user, cart, onAddToCart, onViewCart, onRemoveFromCart, showCart, onContinueShopping, onClearCart, onCheckout, onSubmitOrder, notifications, setNotifications, onAddFeedback }) {
  const [currentPage, setCurrentPage] = useStickyState('home', 'homepage_currentPage');
  const [showBlankCart, setShowBlankCart] = useState(false);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [orderDetails, setOrderDetails] = useState([]);
  const [isLoadingCheckout, setIsLoadingCheckout] = useState(false);
  const [isLoadingPlaceOrder, setIsLoadingPlaceOrder] = useState(false);
  const [customerInfo, setCustomerInfo] = useState({
    name: user?.name || '',
    address: '',
    contactNumber: '',
    company: '',
    businessLicense: null,
    companyId: null
  });
  
  const isUserLoggedIn = isLoggedIn || !!onLogout;

  // Initialize order details when showing the form
  const handleProceedToCheckout = () => {
    setIsLoadingCheckout(true);
    
    // Show loading for at least 3 seconds
    setTimeout(() => {
      const details = (cart || []).map(item => {
        const serviceName = item.name || item.title;
        const config = SERVICE_CONFIG[serviceName] || { manpower: 1, contractLength: '1 Month' };
        
        const startDate = new Date();
        const endDate = new Date(startDate);
        
        // Calculate end date based on contract length
        if (config.contractLength === '1 Week') {
          endDate.setDate(endDate.getDate() + 7);
        } else if (config.contractLength === '2 Weeks') {
          endDate.setDate(endDate.getDate() + 14);
        } else if (config.contractLength === '1 Month') {
          endDate.setMonth(endDate.getMonth() + 1);
        } else if (config.contractLength === '3 Months') {
          endDate.setMonth(endDate.getMonth() + 3);
        } else if (config.contractLength === '6 Months') {
          endDate.setMonth(endDate.getMonth() + 6);
        } else if (config.contractLength === '1 Year') {
          endDate.setFullYear(endDate.getFullYear() + 1);
        }
        
        return {
          ...item,
          startDate: formatDateInput(startDate),
          endDate: formatDateInput(endDate),
          manpower: config.manpower,
          contractLength: config.contractLength
        };
      });
      setOrderDetails(details);
      setShowOrderDetails(true);
      setIsLoadingCheckout(false);
    }, 3000);
  };

  const handleUpdateOrderDetail = (index, field, value) => {
    const updatedDetails = [...orderDetails];
    updatedDetails[index][field] = value;

    // If contractLength is changed, automatically calculate the end date
    if (field === 'contractLength') {
      const startDate = parseDateInput(updatedDetails[index].startDate);
      let endDate = new Date(startDate);

      // Parse contract length and add appropriate days
      const lengthStr = value;
      if (lengthStr === '1 Week') {
        endDate.setDate(endDate.getDate() + 7);
      } else if (lengthStr === '2 Weeks') {
        endDate.setDate(endDate.getDate() + 14);
      } else if (lengthStr === '1 Month') {
        endDate.setMonth(endDate.getMonth() + 1);
      } else if (lengthStr === '3 Months') {
        endDate.setMonth(endDate.getMonth() + 3);
      } else if (lengthStr === '6 Months') {
        endDate.setMonth(endDate.getMonth() + 6);
      } else if (lengthStr === '1 Year') {
        endDate.setFullYear(endDate.getFullYear() + 1);
      }

      // Update endDate in the order detail
      updatedDetails[index].endDate = formatDateInput(endDate);
    }

    // If startDate is changed, recalculate endDate based on current contractLength
    if (field === 'startDate') {
      const startDate = parseDateInput(value);
      let endDate = new Date(startDate);
      const contractLength = updatedDetails[index].contractLength;

      // Recalculate based on existing contract length
      if (contractLength === '1 Week') {
        endDate.setDate(endDate.getDate() + 7);
      } else if (contractLength === '2 Weeks') {
        endDate.setDate(endDate.getDate() + 14);
      } else if (contractLength === '1 Month') {
        endDate.setMonth(endDate.getMonth() + 1);
      } else if (contractLength === '3 Months') {
        endDate.setMonth(endDate.getMonth() + 3);
      } else if (contractLength === '6 Months') {
        endDate.setMonth(endDate.getMonth() + 6);
      } else if (contractLength === '1 Year') {
        endDate.setFullYear(endDate.getFullYear() + 1);
      }

      updatedDetails[index].endDate = formatDateInput(endDate);
    }

    setOrderDetails(updatedDetails);
  };

  const handleUpdateCustomerInfo = (field, value) => {
    setCustomerInfo({ ...customerInfo, [field]: value });
  }

  const handleSendFeedback = () => {
    if (!feedbackText.trim()) {
      toast.error('Please enter your feedback before sending.');
      return;
    }

    if (onAddFeedback) {
      onAddFeedback({
        id: Date.now(),
        customerName: user?.name || 'Customer',
        message: feedbackText.trim(),
        date: new Date().toLocaleString()
      });
    }

    toast.success('Thank you! Your feedback has been sent to the admin.');
    setFeedbackText('');
    setIsFeedbackOpen(false);
  };

  const handleFileChange = (field, file) => {
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCustomerInfo({ ...customerInfo, [field]: { name: file.name, data: reader.result } });
      };
      reader.readAsDataURL(file);
    } else {
      setCustomerInfo({ ...customerInfo, [field]: null });
    }
  };

  const handlePlaceOrder = () => {
    // Validation checks
    const errors = [];

    // Validate customer info
    if (!customerInfo.name || customerInfo.name.trim() === '') {
      errors.push('Customer name is required');
    }
    if (!customerInfo.contactNumber || customerInfo.contactNumber.trim() === '') {
      errors.push('Contact number is required');
    }
    if (!customerInfo.company || customerInfo.company.trim() === '') {
      errors.push('Company name is required');
    }
    if (!customerInfo.address || customerInfo.address.trim() === '') {
      errors.push('Address is required');
    }
    if (!customerInfo.businessLicense) {
      errors.push('Business license document is required');
    }
    if (!customerInfo.companyId) {
      errors.push('Company ID document is required');
    }

    // Validate order items
    if (!orderDetails || orderDetails.length === 0) {
      errors.push('At least one service item is required');
    } else {
      orderDetails.forEach((item, index) => {
        if (!item.startDate) {
          errors.push(`Service ₱ {index + 1}: Start date is required`);
        }
        if (!item.endDate) {
          errors.push(`Service ₱ {index + 1}: End date is required`);
        }
        if (!item.manpower || item.manpower < 1) {
          errors.push(`Service ₱ {index + 1}: Manpower must be at least 1`);
        }
      });
    }

    // If there are errors, show them to the user
    if (errors.length > 0) {
      toast.error('Please complete the following before placing your order:\n\n' + errors.join('\n'), {
        duration: 5000,
        style: { maxWidth: '500px' }
      });
      return;
    }

    // Set loading state
    setIsLoadingPlaceOrder(true);

    // Show loading for at least 3 seconds
    setTimeout(() => {
      // All validations passed, proceed with order submission
      if (onSubmitOrder) {
        onSubmitOrder({
          orderItems: orderDetails,
          customerInfo: customerInfo
        });
      }
      setShowOrderDetails(false);
      setShowBlankCart(false);
      toast.success('Order placed successfully! Your order is being processed.');
      // Reset customer info
      setCustomerInfo({
        name: user?.name || '',
        address: '',
        contactNumber: '',
        company: '',
        businessLicense: null,
        companyId: null
      });
      // Optionally clear cart
      if (onClearCart) onClearCart();
      setIsLoadingPlaceOrder(false);
    }, 3000);
  };

  const handleCartIconClick = () => {
    if (!user) {
      toast.error('Please login to view cart');
      onLoginClick();
      return;
    }
    setShowBlankCart(true);
  };

  const renderContent = () => {
    if (showOrderDetails) {
      return (
        <div style={{
          minHeight: '100vh',
          backgroundColor: '#f9f9f9',
          padding: '40px 20px'
        }}>
          <button 
            onClick={() => {
              setShowOrderDetails(false);
              setShowBlankCart(true);
            }}
            style={{
              position: 'fixed',
              top: '20px',
              left: '20px',
              backgroundColor: '#04ab0c',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              zIndex: 10
            }}
          >
            ← Back
          </button>

          <div style={{ maxWidth: '1000px', margin: '0 auto', marginTop: '40px' }}>
            <h1 style={{ marginBottom: '8px' }}>Order Details</h1>
            <p style={{ color: '#666', marginBottom: '30px' }}>
              Please fill in the customer information and service requirements
            </p>

            {orderDetails && orderDetails.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Customer Information Section */}
                <div
                  style={{
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    padding: '24px',
                    border: '2px solid var(--green)',
                    boxShadow: '0 2px 6px rgba(5, 150, 105, 0.1)'
                  }}
                >
                  <h3 style={{ margin: '0 0 20px 0', fontSize: '16px', fontWeight: '600', color: 'var(--green)' }}>
                    📋 Customer Information
                  </h3>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: '#333' }}>
                        Customer Name
                      </label>
                      <input
                        type="text"
                        value={customerInfo.name}
                        onChange={(e) => handleUpdateCustomerInfo('name', e.target.value)}
                        placeholder="* Juan Dela Cruz"
                        style={{
                          width: '100%',
                          padding: '10px',
                          borderRadius: '6px',
                          border: '1px solid #ddd',
                          fontSize: '14px',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: '#333' }}>
                        Contact Number
                      </label>
                      <input
                        type="tel"
                        value={customerInfo.contactNumber}
                        onChange={(e) => handleUpdateCustomerInfo('contactNumber', e.target.value)}
                        placeholder="* 09xx-xxx-xxxx"
                        style={{
                          width: '100%',
                          padding: '10px',
                          borderRadius: '6px',
                          border: '1px solid #ddd',
                          fontSize: '14px',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: '#333' }}>
                        Company
                      </label>
                      <input
                        type="text"
                        value={customerInfo.company}
                        onChange={(e) => handleUpdateCustomerInfo('company', e.target.value)}
                        placeholder="Enter company name"
                        style={{
                          width: '100%',
                          padding: '10px',
                          borderRadius: '6px',
                          border: '1px solid #ddd',
                          fontSize: '14px',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: '#333' }}>
                        Complete Address
                      </label>
                      <input
                        type="text"
                        value={customerInfo.address}
                        onChange={(e) => handleUpdateCustomerInfo('address', e.target.value)}
                        placeholder="* 123 Street, Barangay, City, Province, ZIP Code"
                        style={{
                          width: '100%',
                          padding: '10px',
                          borderRadius: '6px',
                          border: '1px solid #ddd',
                          fontSize: '14px',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: '#333' }}>
                        📸 Business License *.jpg
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileChange('businessLicense', e.target.files[0])}
                        style={{
                          width: '100%',
                          padding: '10px',
                          borderRadius: '6px',
                          border: '1px solid #ddd',
                          fontSize: '14px',
                          boxSizing: 'border-box'
                        }}
                      />
                      {customerInfo.businessLicense && (
                        <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: '#04ab0c', fontWeight: '600' }}>
                          ✓ {customerInfo.businessLicense.name}
                        </p>
                      )}
                    </div>

                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: '#333' }}>
                        📸 Company ID *.jpg
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileChange('companyId', e.target.files[0])}
                        style={{
                          width: '100%',
                          padding: '10px',
                          borderRadius: '6px',
                          border: '1px solid #ddd',
                          fontSize: '14px',
                          boxSizing: 'border-box'
                        }}
                      />
                      {customerInfo.companyId && (
                        <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: '#04ab0c', fontWeight: '600' }}>
                          ✓ {customerInfo.companyId.name}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Service Items Section */}
                {orderDetails.map((item, index) => (
                  <div
                    key={index}
                    style={{
                      backgroundColor: 'white',
                      borderRadius: '8px',
                      padding: '24px',
                      border: '1px solid #e0e0e0',
                      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)'
                    }}
                  >
                    <div style={{ marginBottom: '20px', paddingBottom: '16px', borderBottom: '2px solid #f0f0f0' }}>
                      <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '600', color: '#333' }}>
                        {item.name || item.title}
                      </h3>
                      <p style={{ margin: '0', color: '#666', fontSize: '14px' }}>
                        Price: ₱ {item.price ? item.price.toFixed(2) : '0.00'}
                      </p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                      <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: '#333' }}>
                          Start Date of Contract
                        </label>
                        <input
                          type="date"
                          value={item.startDate}
                          onChange={(e) => handleUpdateOrderDetail(index, 'startDate', e.target.value)}
                          style={{
                            width: '100%',
                            padding: '10px',
                            borderRadius: '6px',
                            border: '1px solid #ddd',
                            fontSize: '14px',
                            boxSizing: 'border-box'
                          }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: '#333' }}>
                          End Date of Contract (Auto-calculated)
                        </label>
                        <input
                          type="date"
                          value={item.endDate}
                          disabled
                          style={{
                            width: '100%',
                            padding: '10px',
                            borderRadius: '6px',
                            border: '1px solid #ddd',
                            fontSize: '14px',
                            boxSizing: 'border-box',
                            backgroundColor: '#f5f5f5',
                            color: '#666',
                            cursor: 'not-allowed'
                          }}
                        />
                        <small style={{ color: '#999', marginTop: '4px', display: 'block' }}>
                          Updates automatically based on Start Date and Contract Length
                        </small>
                      </div>

                      <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: '#333' }}>
                          Number of Manpower Needed
                        </label>
                        <input
                          type="number"
                          value={item.manpower}
                          onChange={(e) => handleUpdateOrderDetail(index, 'manpower', Math.max(1, parseInt(e.target.value) || 1))}
                          min="1"
                          style={{
                            width: '100%',
                            padding: '10px',
                            borderRadius: '6px',
                            border: '1px solid #ddd',
                            fontSize: '14px',
                            boxSizing: 'border-box'
                          }}
                        />
                        <small style={{ color: '#04ab0c', marginTop: '4px', display: 'block', fontWeight: '600' }}>
                         Required Manpower: {SERVICE_CONFIG[item.name || item.title]?.manpower || 1} personnel required for this service
                        </small>
                      </div>

                      <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: '#333' }}>
                          Contract Length
                        </label>
                        <select
                          value={item.contractLength}
                          onChange={(e) => handleUpdateOrderDetail(index, 'contractLength', e.target.value)}
                          style={{
                            width: '100%',
                            padding: '10px',
                            borderRadius: '6px',
                            border: '1px solid #ddd',
                            fontSize: '14px',
                            boxSizing: 'border-box'
                          }}
                        >
                          <option value="1 Week">1 Week</option>
                          <option value="2 Weeks">2 Weeks</option>
                          <option value="1 Month">1 Month</option>
                          <option value="3 Months">3 Months</option>
                          <option value="6 Months">6 Months</option>
                          <option value="1 Year">1 Year</option>
                        </select>
                        <small style={{ color: '#04ab0c', marginTop: '4px', display: 'block', fontWeight: '600' }}>
                          Recommended: {SERVICE_CONFIG[item.name || item.title]?.contractLength || '1 Month'} contract for optimal service delivery
                        </small>
                      </div>
                    </div>
                  </div>
                ))}

                <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                  <button
                    onClick={handlePlaceOrder}
                    disabled={isLoadingPlaceOrder}
                    style={{
                      flex: 1,
                      padding: '14px',
                      backgroundColor: isLoadingPlaceOrder ? '#ccc' : '#04ab0c',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: isLoadingPlaceOrder ? 'not-allowed' : 'pointer',
                      fontSize: '16px',
                      fontWeight: '600',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => !isLoadingPlaceOrder && (e.target.style.backgroundColor = '#039a0a')}
                    onMouseLeave={(e) => !isLoadingPlaceOrder && (e.target.style.backgroundColor = '#04ab0c')}
                  >
                    {isLoadingPlaceOrder ? 'Placing Order...' : 'Place Order'}
                  </button>
                  <button
                    onClick={() => {
                      setShowOrderDetails(false);
                      setShowBlankCart(true);
                    }}
                    style={{
                      flex: 1,
                      padding: '14px',
                      backgroundColor: '#f0f0f0',
                      color: '#333',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '16px',
                      fontWeight: '600',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = '#e0e0e0';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = '#f0f0f0';
                    }}
                  >
                    Back to Cart
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ backgroundColor: 'white', padding: '40px', borderRadius: '8px', textAlign: 'center' }}>
                <p style={{ color: '#666' }}>No items to order</p>
              </div>
            )}
          </div>
        </div>
      );
    }

    if (showBlankCart) {
      return (
        <div style={{
          minHeight: '100vh',
          backgroundColor: '#f9f9f9',
          padding: '40px 20px'
        }}>
          <button 
            onClick={() => setShowBlankCart(false)}
            style={{
              position: 'fixed',
              top: '20px',
              left: '20px',
              backgroundColor: '#04ab0c',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              zIndex: 10
            }}
          >
            ← Back
          </button>

          <div style={{ maxWidth: '1200px', margin: '0 auto', marginTop: '40px' }}>
            <h1 style={{ marginBottom: '8px' }}>Shopping Cart</h1>
            <p style={{ color: '#666', marginBottom: '30px' }}>
              {cart && cart.length > 0 ? `${cart.length} ${cart.length === 1 ? 'item' : 'items'} in your cart` : 'Your cart is empty'}
            </p>
            
            {cart && cart.length > 0 ? (
              <div style={{ display: 'flex', gap: '30px' }}>
                {/* Cart Items */}
                <div style={{ flex: 1 }}>
                  <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '20px' }}>
                    {cart.map((item, index) => {
                      const itemTotal = item.price ? (item.price * (item.quantity || 1)).toFixed(2) : '0.00';
                      return (
                        <div 
                          key={index}
                          style={{
                            display: 'flex',
                            gap: '20px',
                            alignItems: 'center',
                            padding: '20px 0',
                            borderBottom: index < cart.length - 1 ? '1px solid #eee' : 'none'
                          }}
                        >
                          {/* Product Image */}
                          <div style={{
                            flex: '0 0 100px',
                            width: '100px',
                            height: '100px',
                            backgroundColor: '#f5f5f5',
                            borderRadius: '6px',
                            overflow: 'hidden'
                          }}>
                            {item.img ? (
                              <img 
                                src={item.img} 
                                alt={item.name || item.title}
                                style={{
                                  width: '100%',
                                  height: '100%',
                                  objectFit: 'cover'
                                }}
                              />
                            ) : (
                              <div style={{
                                width: '100%',
                                height: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#999',
                                fontSize: '12px'
                              }}>
                                No Image
                              </div>
                            )}
                          </div>

                          {/* Product Details */}
                          <div style={{ flex: 1 }}>
                            <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: '600' }}>
                              {item.name || item.title}
                            </h3>
                            <p style={{ margin: '0', color: '#666', fontSize: '14px' }}>
                              ₱ {item.price ? item.price.toFixed(2) : '0.00'}
                            </p>
                          </div>

                          {/* Quantity Controls */}
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            backgroundColor: '#f5f5f5',
                            borderRadius: '6px',
                            padding: '8px'
                          }}>
                            <button
                              onClick={() => {
                                const newCart = [...cart];
                                if (newCart[index].quantity > 1) {
                                  newCart[index].quantity -= 1;
                                }
                              }}
                              style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '18px',
                                color: '#666',
                                width: '30px',
                                height: '30px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                            >
                              −
                            </button>
                            <span style={{ 
                              minWidth: '30px', 
                              textAlign: 'center',
                              fontWeight: '600'
                            }}>
                              {item.quantity || 1}
                            </span>
                            <button
                              onClick={() => {
                                const newCart = [...cart];
                                newCart[index].quantity = (newCart[index].quantity || 1) + 1;
                              }}
                              style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '18px',
                                color: '#666',
                                width: '30px',
                                height: '30px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                            >
                              +
                            </button>
                          </div>

                          {/* Item Total */}
                          <div style={{
                            minWidth: '100px',
                            textAlign: 'right',
                            marginRight: '10px'
                          }}>
                            <p style={{ 
                              margin: '0', 
                              fontSize: '16px', 
                              fontWeight: 'bold', 
                              color: '#333' 
                            }}>
                              ₱ {itemTotal}
                            </p>
                          </div>

                          {/* Delete Button */}
                          <button 
                            onClick={() => onRemoveFromCart(index)}
                            style={{
                              backgroundColor: '#ff4444',
                              color: 'white',
                              border: 'none',
                              width: '36px',
                              height: '36px',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '18px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'background-color 0.2s'
                            }}
                            onMouseEnter={(e) => e.target.style.backgroundColor = '#cc0000'}
                            onMouseLeave={(e) => e.target.style.backgroundColor = '#ff4444'}
                            title="Remove item"
                          >
                            🗑
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Order Summary Sidebar */}
                <div style={{ flex: '0 0 300px' }}>
                  <div style={{
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    padding: '20px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
                  }}>
                    <h2 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: '600' }}>
                      Order Summary
                    </h2>

                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: '12px',
                      borderBottom: '1px solid #eee',
                      paddingBottom: '12px'
                    }}>
                      <span style={{ color: '#666' }}>Subtotal</span>
                      <span style={{ fontWeight: '600' }}>
                        ₱ {cart.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0).toFixed(2)}
                      </span>
                    </div>

                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: '16px',
                      paddingBottom: '12px',
                      borderBottom: '2px solid #eee'
                    }}>
                      <span style={{ color: '#666' }}>Tax</span>
                      <span style={{ fontWeight: '600' }}>
                        ₱ {(cart.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0) * 0.1).toFixed(2)}
                      </span>
                    </div>

                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: '20px',
                      fontSize: '18px',
                      fontWeight: 'bold'
                    }}>
                      <span>Total</span>
                      <span style={{ color: '#333' }}>
                        ₱ {(cart.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0) * 1.1).toFixed(2)}
                      </span>
                    </div>

                    <button 
                      onClick={() => {
                        handleProceedToCheckout();
                      }}
                      disabled={isLoadingCheckout}
                      style={{
                        width: '100%',
                        backgroundColor: isLoadingCheckout ? '#ccc' : 'var(--green)',
                        color: 'white',
                        border: 'none',
                        padding: '12px',
                        borderRadius: '6px',
                        cursor: isLoadingCheckout ? 'not-allowed' : 'pointer',
                        fontSize: '16px',
                        fontWeight: '600',
                        marginBottom: '12px',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseEnter={(e) => !isLoadingCheckout && (e.target.style.backgroundColor = '#047857')}
                      onMouseLeave={(e) => !isLoadingCheckout && (e.target.style.backgroundColor = 'var(--green)')}
                    >
                      {isLoadingCheckout ? 'Processing...' : 'Proceed to Checkout'}
                    </button>

                    <button 
                      onClick={() => {
                        setShowBlankCart(false);
                        setCurrentPage('order');
                      }}
                      style={{
                        width: '100%',
                        background: 'none',
                        border: 'none',
                        color: 'var(--green)',
                        padding: '12px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '600',
                        textDecoration: 'none'
                      }}
                      onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
                      onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
                    >
                      Continue Shopping
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{
                backgroundColor: 'white',
                padding: '60px 20px',
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <p style={{ fontSize: '18px', color: '#666', marginBottom: '20px' }}>Your cart is empty</p>
                <button 
                  onClick={() => {
                    setShowBlankCart(false);
                    setCurrentPage('products');
                  }}
                  style={{
                    backgroundColor: '#04ab0c',
                    color: 'white',
                    border: 'none',
                    padding: '12px 30px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '16px',
                    fontWeight: '600'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#039a0a'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = '#04ab0c'}
                >
                  Continue Shopping
                </button>
              </div>
            )}
          </div>
        </div>
      );
    }

    if (showCart) {
      return (
        <Cart 
          cart={cart} 
          onContinueShopping={onContinueShopping}
          onRemoveFromCart={onRemoveFromCart}
          onClearCart={onClearCart}
        />
      );
    }

    if (currentPage === 'about') {
      return <AboutUs />;
    }
    if (currentPage === 'services') {
      return <Service />;
    }
    if (currentPage === 'products') {
      return <Product user={user} onAddToCart={onAddToCart} />;
    }
    if (currentPage === 'order') {
      return <Orderspage user={user} onAddToCart={onAddToCart} />;
    }
    
     return (
      <div className="customer-homepage">
        <div className="customer-homepage-overlay"></div>
        <div className="customer-homepage-content">
          <div className="customer-homepage-header">
            <h1>WELCOME TO OBA SUPPLIES AND SERVICES!</h1>
            <p>
              We believe great service starts with great people and dependable products. Our mission is to provide top-quality supplies and personalized service that help you achieve more every day.
            </p>
          </div>

          {/* Mission & Vision Section (Modern Glassmorphism) */}
          <section style={{ padding: '80px 24px', maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap', justifyContent: 'center' }}>
              
              {/* Mission Card */}
              <div 
                className="glass-panel hover-lift"
                style={{
                  flex: '1 1 400px',
                  borderRadius: '24px',
                  padding: '48px',
                  background: 'linear-gradient(145deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.9) 100%)',
                  boxShadow: '0 20px 40px -15px rgba(0,0,0,0.05)',
                  border: '1px solid rgba(5, 150, 105, 0.15)',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                <div style={{
                  position: 'absolute', top: '-20px', right: '-20px', fontSize: '120px', opacity: 0.05,
                  color: 'var(--green)', pointerEvents: 'none', lineHeight: 1
                }}>🎯</div>
                <h2 style={{ color: 'var(--green)', fontSize: '28px', fontWeight: '800', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '32px' }}>🎯</span> Our Mission
                </h2>
                <p style={{ color: 'var(--text-light)', fontSize: '16px', lineHeight: '1.8' }}>
                  To be the industry leader in providing exceptional mechanical and electrical works, precise fabrication, and flawless installation services. We are committed to delivering innovative, reliable, and sustainable solutions that exceed our clients' expectations and foster long-term partnerships.
                </p>
              </div>

              {/* Vision Card */}
              <div 
                className="glass-panel hover-lift"
                style={{
                  flex: '1 1 400px',
                  borderRadius: '24px',
                  padding: '48px',
                  background: 'linear-gradient(145deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.9) 100%)',
                  boxShadow: '0 20px 40px -15px rgba(0,0,0,0.05)',
                  border: '1px solid rgba(5, 150, 105, 0.15)',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                <div style={{
                  position: 'absolute', top: '-20px', right: '-20px', fontSize: '120px', opacity: 0.05,
                  color: 'var(--green)', pointerEvents: 'none', lineHeight: 1
                }}>👁️</div>
                <h2 style={{ color: 'var(--green)', fontSize: '28px', fontWeight: '800', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '32px' }}>👁️</span> Our Vision
                </h2>
                <p style={{ color: 'var(--text-light)', fontSize: '16px', lineHeight: '1.8' }}>
                  To redefine the standard of excellence in industrial supplies and services across the Philippines. We envision a future where our brand is synonymous with unwavering quality, unmatched integrity, and visionary expansion, building upon our rich heritage from Marchevel Manpower Services.
                </p>
              </div>

            </div>
          </section>

          {/* Expanded Testimonials Section */}
          <section style={{ backgroundColor: '#f8fafc', padding: '80px 24px' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
              <h2 style={{ textAlign: 'center', color: 'var(--text)', fontSize: '36px', fontWeight: '800', marginBottom: '60px' }}>
                Client <span style={{ color: 'var(--green)' }}>Testimonials</span>
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px' }}>
                
                <div className="glass-panel hover-lift" style={{ padding: '32px', borderRadius: '20px', background: 'white', border: '1px solid #e2e8f0', boxShadow: '0 10px 25px rgba(0,0,0,0.03)' }}>
                  <div style={{ color: '#f59e0b', fontSize: '20px', marginBottom: '16px' }}>★★★★★</div>
                  <p style={{ color: 'var(--text-light)', fontStyle: 'italic', marginBottom: '24px', lineHeight: '1.7' }}>
                    "OBA has been our go-to supplier for over a year — always dependable and professional! Their attention to detail on our insulation project was unmatched."
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--green)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold' }}>J</div>
                    <div>
                      <div style={{ fontWeight: '700', color: 'var(--text)' }}>Juan Dela Cruz</div>
                      <div style={{ fontSize: '12px', color: '#94a3b8' }}>Operations Manager</div>
                    </div>
                  </div>
                </div>

                <div className="glass-panel hover-lift" style={{ padding: '32px', borderRadius: '20px', background: 'white', border: '1px solid #e2e8f0', boxShadow: '0 10px 25px rgba(0,0,0,0.03)' }}>
                  <div style={{ color: '#f59e0b', fontSize: '20px', marginBottom: '16px' }}>★★★★★</div>
                  <p style={{ color: 'var(--text-light)', fontStyle: 'italic', marginBottom: '24px', lineHeight: '1.7' }}>
                    "The transition from Marchevel Manpower has been seamless. The quality of IHI Compressors they supplied drastically improved our plant's efficiency."
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--green)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold' }}>M</div>
                    <div>
                      <div style={{ fontWeight: '700', color: 'var(--text)' }}>Maria Santos</div>
                      <div style={{ fontSize: '12px', color: '#94a3b8' }}>Procurement Head</div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </section>
          
          <section className="customer-homepage-features">
            <div className="customer-features">
              <div className="customer-feature-item">
                <span></span>
                <span></span>
              </div>
              <div className="customer-feature-item">
                <span></span>
                <span></span>
                </div>
                <div className="customer-feature-item">
                <span></span>
                <span>  </span>
                </div>
                <div className="customer-feature-item">
                <span></span>
                <span></span>
              </div>
            </div>
          </section>

          
          <section className="customer-homepage-contact">
            <p>Have a question or need a custom order? We’re here to help!</p>
            
            <div>
              <span role="img" aria-label="email">📧</span> obasuppliesandservices@gmail.com {' '}
              | {' '}
              <span role="img" aria-label="phone">📞</span> (555) 123-4567
            </div>

            <button
              type="button"
              className="contact-button"
              onClick={() => setIsFeedbackOpen(true)}
            >
              Send Feedback
            </button>
          </section>

          {isFeedbackOpen && (
            <div className="feedback-modal-backdrop" onClick={() => setIsFeedbackOpen(false)}>
              <div className="feedback-modal" onClick={(e) => e.stopPropagation()}>
                <div className="feedback-modal-header">
                  <h3>Send Feedback</h3>
                  <button
                    type="button"
                    className="feedback-close-btn"
                    onClick={() => setIsFeedbackOpen(false)}
                    aria-label="Close feedback form"
                  >
                    ×
                  </button>
                </div>

                <textarea
                  className="feedback-textarea"
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  placeholder="Tell us how we can improve..."
                  rows={6}
                />

                <div className="feedback-modal-actions">
                  <button
                    type="button"
                    className="feedback-send-btn"
                    onClick={handleSendFeedback}
                  >
                    Send
                  </button>
                  <button
                    type="button"
                    className="feedback-cancel-btn"
                    onClick={() => {
                      setFeedbackText('');
                      setIsFeedbackOpen(false);
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          <img
            src="/images/man.jpg"
            alt="Delivery person"
            className="customer-homepage-image"
          />
        </div>
        </div>
    )
  };

  return (
    <div style={{ minHeight: '100vh' }}>
      {!showBlankCart && (
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
            onClick={() => setCurrentPage('home')}
            style={{ color: 'white', textDecoration: 'none', fontSize: '15px', background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <img src="/logo.png" alt="OBA logo" className="homepage-logo" />
            OBA Supplies & Services
          </button>
        </div>

        {/* centered links */}
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center', margin: '0 auto' }}>
          <button 
            onClick={() => setCurrentPage('home')}
            style={{ color: 'white', textDecoration: 'none', fontSize: '13px', background: 'transparent', border: 'none', cursor: 'pointer' }}
          >
            Home
          </button>
          <button 
            onClick={() => setCurrentPage('about')}
            style={{ color: 'white', textDecoration: 'none', fontSize: '13px', background: 'transparent', border: 'none', cursor: 'pointer' }}
          >
            About Us
          </button>
          <button 
            onClick={() => setCurrentPage('services')}
            style={{ color: 'white', textDecoration: 'none', fontSize: '13px', background: 'transparent', border: 'none', cursor: 'pointer' }}
          >
            Services
          </button>
          <button 
            onClick={() => setCurrentPage('products')}
            style={{ color: 'white', textDecoration: 'none', fontSize: '13px', background: 'transparent', border: 'none', cursor: 'pointer' }}
          >
            Products
          </button>
          <button 
            onClick={() => setCurrentPage('order')}
            style={{ color: 'white', textDecoration: 'none', fontSize: '13px', background: 'transparent', border: 'none', cursor: 'pointer' }}
          >
            Order
          </button>
        </div>

        <div style={{ position: 'absolute', right: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          {isUserLoggedIn && (
            <div style={{ position: 'relative' }}>
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '40px',
                  height: '40px',
                  padding: 0,
                  position: 'relative'
                }}
                title="Notifications"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                </svg>
                {notifications && notifications.some(n => !n.read) && (
                  <span style={{
                    position: 'absolute',
                    top: '4px',
                    right: '4px',
                    backgroundColor: 'red',
                    color: 'white',
                    borderRadius: '50%',
                    width: '16px',
                    height: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '10px',
                    fontWeight: 'bold'
                  }}>
                    {notifications.filter(n => !n.read).length}
                  </span>
                )}
              </button>
              
              {showNotifications && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  width: '300px',
                  backgroundColor: 'white',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  marginTop: '12px',
                  zIndex: 1000,
                  maxHeight: '400px',
                  overflowY: 'auto'
                }}>
                  <div style={{ padding: '12px 16px', borderBottom: '1px solid #eee', fontWeight: 'bold' }}>Notifications</div>
                  {(!notifications || notifications.length === 0) ? (
                    <div style={{ padding: '16px', color: '#666', textAlign: 'center', fontSize: '14px' }}>No notifications</div>
                  ) : (
                    notifications.map(notif => (
                      <div 
                        key={notif.id}
                        onClick={() => {
                          if (setNotifications) {
                            setNotifications(notifications.map(n => n.id === notif.id ? { ...n, read: true } : n));
                          }
                          setSelectedNotification(notif);
                          setShowNotifications(false);
                        }}
                        style={{
                          padding: '12px 16px',
                          borderBottom: '1px solid #eee',
                          cursor: 'pointer',
                          backgroundColor: notif.read ? 'white' : '#f0f8ff',
                          transition: 'background-color 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = notif.read ? 'white' : '#f0f8ff'}
                      >
                        <div style={{ fontWeight: '600', marginBottom: '4px', fontSize: '14px' }}>{notif.title || 'Job Order Approved'}</div>
                        <div style={{ fontSize: '13px', color: '#666' }}>{notif.message}</div>
                        <div style={{ fontSize: '11px', color: '#999', marginTop: '6px' }}>{new Date(notif.date).toLocaleString()}</div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}
          <button 
            onClick={handleCartIconClick}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '40px',
              height: '40px',
              padding: 0,
              position: 'relative'
            }}
            title="Shopping Cart"
          >
            <svg 
              width="24" 
              height="24" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="white" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <circle cx="9" cy="21" r="1"></circle>
              <circle cx="20" cy="21" r="1"></circle>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
            </svg>
            {cart && cart.length > 0 && (
              <span style={{
                position: 'absolute',
                top: '4px',
                right: '4px',
                backgroundColor: 'red',
                color: 'white',
                borderRadius: '50%',
                width: '16px',
                height: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '10px',
                fontWeight: 'bold'
              }}>
                {cart.length}
              </span>
            )}
          </button>
          {isUserLoggedIn ? (
            <button 
              onClick={onLogout}
              style={{
                backgroundColor: 'white',
                color: '#04ab0c',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '600'
              }}
            >
              Logout
            </button>
          ) : (
            <button 
              onClick={onLoginClick}
              style={{
                backgroundColor: 'white',
                color: '#04ab0c',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '600'
              }}
            >
              Login
            </button>
          )}
        </div>
      </nav>
      )}

      <main style={{ margin: 0, padding: 0 }}>
        {renderContent()}
      </main>

      {/* Receipt Modal */}
      {selectedNotification && selectedNotification.jobOrder && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }} onClick={() => setSelectedNotification(null)}>
          <div id="receipt-content" style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '32px',
            maxWidth: '600px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 10px 40px rgba(0,0,0,0.3)'
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee', paddingBottom: '16px', marginBottom: '24px' }}>
              <h2 style={{ margin: 0 }}>🧾 Order Receipt</h2>
              <div className="no-print" style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <button 
                  onClick={() => {
                    const style = document.createElement('style');
                    style.innerHTML = `
                      @media print {
                        body * { visibility: hidden; }
                        #receipt-content, #receipt-content * { visibility: visible; }
                        #receipt-content { position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 20px; box-shadow: none; max-height: none; overflow: visible; }
                        .no-print { display: none !important; }
                      }
                    `;
                    document.head.appendChild(style);
                    window.print();
                    document.head.removeChild(style);
                  }}
                  style={{ background: '#f0f0f0', border: '1px solid #ddd', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '14px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px', color: '#333' }}
                >
                  🖨️ Print
                </button>
                <button 
                  onClick={() => setSelectedNotification(null)}
                  style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#999', padding: 0 }}
                >✕</button>
              </div>
            </div>
            
            <div style={{ backgroundColor: '#f9f9f9', padding: '20px', borderRadius: '8px', marginBottom: '24px' }}>
              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <h3 style={{ margin: 0, color: '#04ab0c', fontSize: '20px' }}>{selectedNotification.title || 'Order Approved!'}</h3>
                <p style={{ margin: '8px 0 0 0', color: '#666' }}>{selectedNotification.message || 'Your job order has been approved by the admin.'}</p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                <div>
                  <div style={{ fontSize: '12px', color: '#999' }}>Customer Name</div>
                  <div style={{ fontWeight: '600' }}>{selectedNotification.jobOrder.customerName}</div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: '#999' }}>Company</div>
                  <div style={{ fontWeight: '600' }}>{selectedNotification.jobOrder.company}</div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: '#999' }}>Service Type</div>
                  <div style={{ fontWeight: '600' }}>{selectedNotification.jobOrder.jobType}</div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: '#999' }}>Manpower</div>
                  <div style={{ fontWeight: '600' }}>{selectedNotification.jobOrder.manpower} workers</div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: '#999' }}>Start Date</div>
                  <div style={{ fontWeight: '600' }}>{selectedNotification.jobOrder.startDate}</div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: '#999' }}>End Date</div>
                  <div style={{ fontWeight: '600' }}>{selectedNotification.jobOrder.endDate}</div>
                </div>
              </div>
              
              <div style={{ borderTop: '1px solid #ddd', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 'bold' }}>Total Contract Length:</span>
                <span style={{ fontWeight: '600', color: '#333' }}>{selectedNotification.jobOrder.contractLength}</span>
              </div>
            </div>

            {selectedNotification.jobOrder.deliveryData && (
              <div style={{ backgroundColor: '#f9f9f9', padding: '20px', borderRadius: '8px', marginBottom: '24px', border: '2px solid #04ab0c' }}>
                <h4 style={{ margin: '0 0 16px 0', color: '#333', display: 'flex', justifyContent: 'space-between' }}>
                  <span>🚚 Truck Layout Draft</span>
                  <span style={{ fontSize: '14px', color: '#04ab0c' }}>{selectedNotification.jobOrder.deliveryData.selectedTruck}</span>
                </h4>
                <div style={{ display: 'flex', justifyContent: 'center', overflow: 'hidden', padding: '20px 0' }}>
                  <div style={{ transform: 'scale(0.8) rotateX(55deg) rotateZ(-35deg)', transformStyle: 'preserve-3d', display: 'flex', flexDirection: 'column', alignItems: 'center', width: '250px' }}>
                    {/* Realistic Forward Cab Area */}
                    <div style={{ width: '130px', display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '2px', zIndex: 10, transform: 'translateZ(15px)' }}>
                      <div style={{ width: '90px', height: '30px', backgroundColor: '#e0e0e0', border: '2px solid #9e9e9e', borderBottom: 'none', borderRadius: '16px 16px 0 0', position: 'relative', boxShadow: 'inset -2px 2px 5px rgba(255,255,255,0.8), -2px 2px 0 #9e9e9e' }}>
                         <div style={{ position: 'absolute', top: '10px', left: '20px', right: '20px', height: '5px', backgroundColor: '#9e9e9e', borderRadius: '2px' }}></div>
                         <div style={{ position: 'absolute', top: '5px', left: '5px', width: '10px', height: '8px', backgroundColor: '#fff', borderRadius: '4px', boxShadow: '0 0 5px #fff' }}></div>
                         <div style={{ position: 'absolute', top: '5px', right: '5px', width: '10px', height: '8px', backgroundColor: '#fff', borderRadius: '4px', boxShadow: '0 0 5px #fff' }}></div>
                      </div>
                      <div style={{ width: '130px', height: '50px', backgroundColor: '#f5f5f5', border: '2px solid #9e9e9e', borderRadius: '8px 8px 4px 4px', position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', boxShadow: 'inset -2px 2px 5px rgba(255,255,255,0.8), -3px 3px 0 #9e9e9e, -5px 5px 15px rgba(0,0,0,0.4)', transform: 'translateZ(10px)' }}>
                         <div style={{ width: '110px', height: '20px', backgroundColor: '#111', marginTop: '-10px', borderRadius: '4px 4px 0 0', opacity: 0.85, boxShadow: 'inset 0 0 8px #000, 0 2px 0 #9e9e9e', borderTop: '2px solid #616161' }}></div>
                         <div style={{ width: '80px', height: '10px', border: '1px solid #e0e0e0', marginTop: '10px', borderRadius: '2px' }}></div>
                         <div style={{ position: 'absolute', top: '5px', left: '-12px', width: '8px', height: '25px', backgroundColor: '#424242', borderRadius: '4px', border: '2px solid #9e9e9e' }}></div>
                         <div style={{ position: 'absolute', top: '5px', right: '-12px', width: '8px', height: '25px', backgroundColor: '#424242', borderRadius: '4px', border: '2px solid #9e9e9e' }}></div>
                      </div>
                    </div>
                    
                    <div style={{ width: '40px', height: '15px', backgroundColor: '#424242', borderLeft: '2px solid #212121', borderRight: '2px solid #212121', boxShadow: '-2px 2px 0 #212121', transform: 'translateZ(5px)', marginBottom: '2px' }}></div>
                    
                    <div style={{ width: '100%', backgroundColor: '#b0bec5', backgroundImage: 'repeating-linear-gradient(0deg, #cfd8dc, #cfd8dc 20px, #b0bec5 20px, #b0bec5 24px)', padding: '16px', border: '6px solid #78909c', position: 'relative', boxShadow: '-1px 1px 0 #607d8b, -2px 2px 0 #607d8b, -3px 3px 0 #546e7a, -4px 4px 0 #546e7a, -6px 6px 0 #455a64, -12px 12px 25px rgba(0,0,0,0.6), inset 0 0 30px rgba(0,0,0,0.2)', zIndex: 1, display: 'flex', flexDirection: 'column', transformStyle: 'preserve-3d' }}>
                      
                      <div style={{ position: 'absolute', left: '-20px', top: '5%', width: '16px', height: '40px', backgroundColor: '#212121', borderRadius: '4px', boxShadow: '-2px 2px 5px rgba(0,0,0,0.8), inset -2px 0 5px #000', transform: 'translateZ(-15px)' }}></div>
                      <div style={{ position: 'absolute', right: '-20px', top: '5%', width: '16px', height: '40px', backgroundColor: '#212121', borderRadius: '4px', boxShadow: '-2px 2px 5px rgba(0,0,0,0.8), inset 2px 0 5px #000', transform: 'translateZ(-15px)' }}></div>
                      <div style={{ position: 'absolute', left: '-24px', bottom: '10%', width: '24px', height: '80px', backgroundColor: '#111', borderRadius: '4px', boxShadow: '-2px 2px 5px rgba(0,0,0,0.8), inset -5px 0 10px #000', transform: 'translateZ(-15px)' }}></div>
                      <div style={{ position: 'absolute', right: '-24px', bottom: '10%', width: '24px', height: '80px', backgroundColor: '#111', borderRadius: '4px', boxShadow: '-2px 2px 5px rgba(0,0,0,0.8), inset 5px 0 10px #000', transform: 'translateZ(-15px)' }}></div>

                      <div style={{ textAlign: 'center', color: '#111', fontWeight: '900', letterSpacing: '4px', marginBottom: '16px', textTransform: 'uppercase', fontSize: '11px', textShadow: '0 1px 1px rgba(255,255,255,0.8)', transform: 'translateZ(1px)' }}>Trailer Headwall</div>
                      
                      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gridAutoRows: '60px', gap: '6px', paddingRight: '4px', transformStyle: 'preserve-3d' }}>
                        {(() => {
                          const deliveryData = selectedNotification.jobOrder.deliveryData;
                          const activeTruckGridZones = deliveryData.selectedTruck.includes('10-Wheeler') ? 21 : deliveryData.selectedTruck.includes('6-Wheeler') ? 12 : deliveryData.selectedTruck.includes('4-Wheeler') ? 9 : 6;
                          const totalZones = Math.max(activeTruckGridZones, (deliveryData.scannedEquipment || []).length);
                          
                          return Array.from({ length: totalZones }).map((_, zoneId) => {
                            const occupantIdxStr = (deliveryData.placedItems || {})[zoneId];
                            const occupantIndex = occupantIdxStr !== undefined ? parseInt(occupantIdxStr, 10) : null;
                            const occupant = occupantIndex !== null ? deliveryData.scannedEquipment[occupantIndex] : null;

                            return (
                              <div 
                                key={zoneId}
                                style={{ 
                                  backgroundColor: occupant ? '#e0e0e0' : 'rgba(0,0,0,0.2)', 
                                  backgroundImage: occupant ? 'repeating-linear-gradient(45deg, transparent, transparent 5px, rgba(0,0,0,0.05) 5px, rgba(0,0,0,0.05) 10px)' : 'repeating-linear-gradient(45deg, rgba(255,235,59,0.1) 25%, transparent 25%, transparent 50%, rgba(255,235,59,0.1) 50%, rgba(255,235,59,0.1) 75%, transparent 75%, transparent)',
                                  backgroundSize: occupant ? 'auto' : '20px 20px',
                                  border: occupant ? '2px solid #9e9e9e' : '2px dashed rgba(255,235,59,0.4)', 
                                  borderRadius: '2px', 
                                  display: 'flex', 
                                  alignItems: 'center', 
                                  justifyContent: 'center', 
                                  padding: '2px',
                                  position: 'relative',
                                  boxShadow: occupant ? '-1px 1px 0 #bdbdbd, -2px 2px 0 #9e9e9e, -3px 3px 0 #757575, -4px 4px 0 #616161, -5px 5px 0 #424242, -10px 10px 15px rgba(0,0,0,0.6)' : 'inset 0 0 10px rgba(0,0,0,0.5)',
                                  transform: occupant ? 'translateZ(15px)' : 'translateZ(0)',
                                }}
                              >
                                {!occupant && <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px', fontWeight: 'bold' }}>Z-{zoneId + 1}</span>}
                                {occupant && (
                                  <div style={{ textAlign: 'center', width: '100%', pointerEvents: 'none' }}>
                                    <div style={{ fontSize: '10px', color: '#333', fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{occupant.name.substring(0, 11)}..</div>
                                    <div style={{ fontSize: '10px', color: '#fff', backgroundColor: '#616161', padding: '1px 3px', borderRadius: '3px', display: 'inline-block', marginTop: '2px' }}>x{occupant.scanQty}</div>
                                  </div>
                                )}
                              </div>
                            );
                          });
                        })()}
                      </div>
                      <div style={{ textAlign: 'center', color: '#fff', fontWeight: 'bold', letterSpacing: '4px', marginTop: '16px', textTransform: 'uppercase', fontSize: '11px', textShadow: '0 2px 4px rgba(0,0,0,0.8)', transform: 'translateZ(1px)' }}>Loading Ramp</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <button 
              className="no-print"
              onClick={() => setSelectedNotification(null)}
              style={{
                width: '100%',
                backgroundColor: '#04ab0c',
                color: 'white',
                border: 'none',
                padding: '14px',
                borderRadius: '6px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#039a0a'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#04ab0c'}
            >
              Close Receipt
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
