import React, { useState, useEffect } from 'react';
import { database } from '../firebase';
import toast from 'react-hot-toast';
import { ref, onValue, push, set, remove, update } from 'firebase/database';

export default function CustomerAcc({ user, onLogout, onNavigate }) {
  const [customers, setCustomers] = useState([]);
  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    company: '',
    name: '',
    address: '',
    contactNumber: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  useEffect(() => {
    const customersRef = ref(database, 'customers');
    const unsubscribe = onValue(customersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        // Convert Firebase object map to array
        const customersList = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));
        setCustomers(customersList);
      } else {
        setCustomers([]);
      }
    });

    // Cleanup listener on unmount
    return () => unsubscribe();
  }, []);

  const handleAddCustomer = (e) => {
    e.preventDefault();

    if (!newCustomer.company || !newCustomer.name || !newCustomer.address || !newCustomer.contactNumber || !newCustomer.email || !newCustomer.password) {
      toast.error('Please fill in all fields');
      return;
    }

    if (newCustomer.password !== newCustomer.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    const customersRef = ref(database, 'customers');
    const newCustomerRef = push(customersRef);
    const addedEmail = newCustomer.email;

    set(newCustomerRef, {
      company: newCustomer.company,
      name: newCustomer.name,
      address: newCustomer.address,
      contactNumber: newCustomer.contactNumber,
      email: newCustomer.email,
      password: newCustomer.password,
      status: 'Active',
      createdDate: new Date().toISOString().split('T')[0]
    }).then(() => {
      setNewCustomer({
        company: '',
        name: '',
        address: '',
        contactNumber: '',
        email: '',
        password: '',
        confirmPassword: ''
      });
      setShowNewCustomerForm(false);
      toast.success(`Customer account created successfully!\nEmail: ${addedEmail}\nTemporary password sent to their email.`, { duration: 5000 });
    }).catch((error) => {
      console.error("Error adding customer: ", error);
      toast.error("Failed to create customer account. Please try again.");
    });
  };

  const handleDeleteCustomer = (customerId) => {
    if (window.confirm('Are you sure you want to delete this customer account?')) {
      const customerRef = ref(database, `customers/${customerId}`);
      remove(customerRef)
        .then(() => toast.success('Customer account deleted successfully'))
        .catch(() => toast.error('Failed to delete customer account.'));
    }
  };

  const toggleCustomerStatus = (customerId) => {
    const customer = customers.find(c => c.id === customerId);
    if (!customer) return;

    const customerRef = ref(database, `customers/${customerId}`);
    const newStatus = customer.status === 'Active' ? 'Inactive' : 'Active';
    update(customerRef, { status: newStatus })
      .catch(() => toast.error('Failed to update status.'));
  };

  return (
    <div className="dashboard-page">
      <aside className="sidebar-left">
        <div className="sidebar-logo">
          <img src="/logo.png" alt="OBA Logo" className="logo-badge" />
        </div>
        <nav className="sidebar-nav">
          <div className="nav-section">
            <div className="nav-title">General</div>
            <ul>
              <li className="nav-item" onClick={() => onNavigate('dashboard')}>Dashboard</li>
              <li className="nav-item" onClick={() => onNavigate('inventory')}>Trip Manager</li>
              <li className="nav-item" onClick={() => onNavigate('employees')}>Employees</li>
            </ul>
          </div>
          <div className="nav-section">
            <div className="nav-title">Management</div>
            <ul>
              <li className="nav-item" onClick={() => onNavigate('calendar')}>Calendar</li>
              <li className="nav-item" onClick={() => onNavigate('joborder')}>Orders / Job Order</li>
              <li className="nav-item active" onClick={() => onNavigate('customersacc')}>Manage Customer Accounts</li>
            </ul>
          </div>
          <div className="nav-section">
            <div className="nav-title">Support</div>
            <ul>
              <li className="nav-item" onClick={() => onNavigate('feedback')}>Feedbacks</li>
              <li className="nav-item" onClick={() => onNavigate('settings')}>Settings</li>
            </ul>
          </div>
        </nav>
      </aside>

      <main className="dashboard-main">
        <div className="dashboard-header-bar"></div>
        <div className="dashboard-content">
          <header className="dashboard-header">
            <h1>Manage Customer Accounts</h1>
            <div className="header-right">
              <div className="user-greeting">
                <span className="avatar-icon">👤</span>
                <span>Hello Admin</span>
              </div>
              <button className="btn-logout" onClick={onLogout}>Logout</button>
            </div>
          </header>

          <section className="settings-section">
              <div className="customer-accounts-content" style={{ marginBottom: '30px' }}>
              <div className="customer-accounts-toolbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                  <h2 style={{ margin: 0, color: '#333', fontSize: '24px' }}></h2>
                </div>
                <button
                  onClick={() => setShowNewCustomerForm(true)}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#4CAF50',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  + Create Customer Account
                </button>
              </div>

              {showNewCustomerForm && (
                <div
                  style={{
                    position: 'fixed',
                    inset: 0,
                    backgroundColor: 'rgba(0,0,0,0.35)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '20px',
                    zIndex: 2000
                  }}
                  onClick={() => setShowNewCustomerForm(false)}
                >
                  <div
                    style={{
                      width: '100%',
                      maxWidth: '560px',
                      backgroundColor: '#ffffff',
                      borderRadius: '16px',
                      padding: '24px',
                      boxShadow: '0 24px 80px rgba(15, 23, 42, 0.15)',
                      position: 'relative'
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => setShowNewCustomerForm(false)}
                      style={{
                        position: 'absolute',
                        top: '16px',
                        right: '16px',
                        background: 'transparent',
                        border: 'none',
                        color: '#555',
                        fontSize: '24px',
                        cursor: 'pointer'
                      }}
                      aria-label="Close form"
                    >
                      ×
                    </button>
                    <h3 style={{ marginBottom: '15px', color: '#333' }}>New Customer Account</h3>
                    <form onSubmit={handleAddCustomer}>
                    <div style={{ marginBottom: '15px' }}>
                      <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px', color: '#333' }}>Company *</label>
                      <input
                        type="text"
                        value={newCustomer.company}
                        onChange={(e) => setNewCustomer({ ...newCustomer, company: e.target.value })}
                        placeholder="Enter company name"
                        style={{
                          width: '100%',
                          padding: '10px',
                          borderRadius: '4px',
                          border: '1px solid #ddd',
                          fontSize: '14px',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>

                    <div style={{ marginBottom: '15px' }}>
                      <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px', color: '#333' }}>Full Name *</label>
                      <input
                        type="text"
                        value={newCustomer.name}
                        onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                        placeholder="Enter customer full name"
                        style={{
                          width: '100%',
                          padding: '10px',
                          borderRadius: '4px',
                          border: '1px solid #ddd',
                          fontSize: '14px',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>

                    <div style={{ marginBottom: '15px' }}>
                      <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px', color: '#333' }}>Complete Address *</label>
                      <input
                        type="text"
                        value={newCustomer.address}
                        onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
                        placeholder="Enter complete address"
                        style={{
                          width: '100%',
                          padding: '10px',
                          borderRadius: '4px',
                          border: '1px solid #ddd',
                          fontSize: '14px',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>

                    <div style={{ marginBottom: '15px' }}>
                      <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px', color: '#333' }}>Contact No. *</label>
                      <input
                        type="tel"
                        value={newCustomer.contactNumber}
                        onChange={(e) => setNewCustomer({ ...newCustomer, contactNumber: e.target.value })}
                        placeholder="Enter contact number"
                        style={{
                          width: '100%',
                          padding: '10px',
                          borderRadius: '4px',
                          border: '1px solid #ddd',
                          fontSize: '14px',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>

                    <div style={{ marginBottom: '15px' }}>
                      <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px', color: '#333' }}>Email Address *</label>
                      <input
                        type="email"
                        value={newCustomer.email}
                        onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                        placeholder="Enter customer email"
                        style={{
                          width: '100%',
                          padding: '10px',
                          borderRadius: '4px',
                          border: '1px solid #ddd',
                          fontSize: '14px',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>

                    <div style={{ marginBottom: '15px' }}>
                      <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px', color: '#333' }}>Password *</label>
                      <input
                        type="password"
                        value={newCustomer.password}
                        onChange={(e) => setNewCustomer({ ...newCustomer, password: e.target.value })}
                        placeholder="Enter temporary password"
                        style={{
                          width: '100%',
                          padding: '10px',
                          borderRadius: '4px',
                          border: '1px solid #ddd',
                          fontSize: '14px',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>

                    <div style={{ marginBottom: '15px' }}>
                      <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px', color: '#333' }}>Confirm Password *</label>
                      <input
                        type="password"
                        value={newCustomer.confirmPassword}
                        onChange={(e) => setNewCustomer({ ...newCustomer, confirmPassword: e.target.value })}
                        placeholder="Confirm password"
                        style={{
                          width: '100%',
                          padding: '10px',
                          borderRadius: '4px',
                          border: '1px solid #ddd',
                          fontSize: '14px',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>

                    <div className="customer-account-form-actions" style={{ display: 'flex', gap: '12px', marginTop: '18px' }}>
                      <button
                        type="submit"
                        style={{
                          padding: '10px 20px',
                          backgroundColor: '#2196F3',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontWeight: 'bold'
                        }}
                      >
                        Create Account
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowNewCustomerForm(false)}
                        style={{
                          padding: '10px 20px',
                          backgroundColor: '#ffffff',
                          color: '#333',
                          border: '1px solid #ddd',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontWeight: 'bold'
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              </div>
              )}

              <div className="customer-accounts-table-wrap" style={{
                backgroundColor: '#f9f9f9',
                borderRadius: '8px',
                border: '1px solid #e8e8e8',
                overflow: 'hidden'
              }}>
                <table className="customer-accounts-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#e3f2fd', borderBottom: '2px solid #ddd' }}>
                      <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold', color: '#333' }}>Name</th>
                      <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold', color: '#333' }}>Email</th>
                      <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold', color: '#333' }}>Company</th>
                      <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold', color: '#333' }}>Status</th>
                      <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold', color: '#333' }}>Created Date</th>
                      <th style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold', color: '#333' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customers.map((customer) => (
                      <tr key={customer.id} style={{ borderBottom: '1px solid #ddd', backgroundColor: '#fff' }}>
                        <td style={{ padding: '12px', color: '#333' }}>{customer.name}</td>
                        <td style={{ padding: '12px', color: '#666', fontSize: '13px' }}>{customer.email}</td>
                        <td style={{ padding: '12px', color: '#333' }}>{customer.company}</td>
                        <td style={{ padding: '12px' }}>
                          <span style={{
                            padding: '4px 12px',
                            backgroundColor: customer.status === 'Active' ? '#c8e6c9' : '#ffcccc',
                            color: customer.status === 'Active' ? '#2e7d32' : '#c62828',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: 'bold'
                          }}>
                            {customer.status}
                          </span>
                        </td>
                        <td style={{ padding: '12px', color: '#999', fontSize: '13px' }}>{customer.createdDate}</td>
                        <td className="customer-account-actions-cell" style={{ padding: '12px', textAlign: 'center' }}>
                          <div className="customer-account-actions">
                          <button
                            onClick={() => toggleCustomerStatus(customer.id)}
                            style={{
                              padding: '4px 10px',
                              backgroundColor: customer.status === 'Active' ? '#ff9800' : '#4CAF50',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '12px',
                              minWidth: '78px'
                            }}
                          >
                            {customer.status === 'Active' ? 'Disable' : 'Enable'}
                          </button>
                          <button
                            onClick={() => handleDeleteCustomer(customer.id)}
                            style={{
                              padding: '4px 10px',
                              backgroundColor: '#f44336',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '12px',
                              minWidth: '78px'
                            }}
                          >
                            Delete
                          </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
