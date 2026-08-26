import React, { useState } from 'react';

export default function Settings({ user, onLogout, onNavigate }) {
  const [activeTab, setActiveTab] = useState('general');
  const [companyName, setCompanyName] = useState('OBA Supplies and Services');
  const [companyEmail, setCompanyEmail] = useState('OBASuppliesandServices@gmail.com');
  const [companyPhone, setCompanyPhone] = useState('(+63) 123-456-7890');
  const [companyAddress, setCompanyAddress] = useState('123 Manila Street, Manila, Philippines');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  const handleCompanyInfoSave = () => {
    alert('Company information updated successfully!');
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
              <li className="nav-item" onClick={() => onNavigate('customersacc')}>Manage Customer Accounts</li>
            </ul>
          </div>
          <div className="nav-section">
            <div className="nav-title">Support</div>
            <ul>
              <li className="nav-item" onClick={() => onNavigate('feedback')}>Feedbacks</li>
              <li className="nav-item active" onClick={() => onNavigate('settings')}>Settings</li>
            </ul>
          </div>
        </nav>
      </aside>

      <main className="dashboard-main">
        <div className="dashboard-header-bar"></div>
        <div className="dashboard-content">
          <header className="dashboard-header">
            <h1>Settings</h1>
            <div className="header-right">
              <div className="user-greeting">
                <span className="avatar-icon">👤</span>
                <span>Hello Admin</span>
              </div>
              <button className="btn-logout" onClick={onLogout}>Logout</button>
            </div>
          </header>

          <section className="settings-section">
            <div style={{ display: 'flex', gap: '20px', marginBottom: '30px', borderBottom: '2px solid #e8e8e8', paddingBottom: '15px' }}>
              <button
                onClick={() => setActiveTab('general')}
                style={{
                  padding: '10px 20px',
                  backgroundColor: activeTab === 'general' ? '#2196F3' : '#f0f0f0',
                  color: activeTab === 'general' ? 'white' : '#333',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '14px'
                }}
              >
                General Settings
              </button>
              <button
                onClick={() => setActiveTab('notifications')}
                style={{
                  padding: '10px 20px',
                  backgroundColor: activeTab === 'notifications' ? '#2196F3' : '#f0f0f0',
                  color: activeTab === 'notifications' ? 'white' : '#333',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '14px'
                }}
              >
                Notifications
              </button>
            </div>

            {/* General Settings Tab */}
            {activeTab === 'general' && (
              <div>
                <h2 style={{ marginBottom: '20px', color: '#333' }}>Company Information</h2>
                <div style={{
                  backgroundColor: '#f9f9f9',
                  padding: '20px',
                  borderRadius: '8px',
                  border: '1px solid #e8e8e8'
                }}>
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px', color: '#333' }}>Company Name</label>
                    <input
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
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
                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px', color: '#333' }}>Company Email</label>
                    <input
                      type="email"
                      value={companyEmail}
                      onChange={(e) => setCompanyEmail(e.target.value)}
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
                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px', color: '#333' }}>Company Phone</label>
                    <input
                      type="tel"
                      value={companyPhone}
                      onChange={(e) => setCompanyPhone(e.target.value)}
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
                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px', color: '#333' }}>Company Address</label>
                    <textarea
                      value={companyAddress}
                      onChange={(e) => setCompanyAddress(e.target.value)}
                      rows="3"
                      style={{
                        width: '100%',
                        padding: '10px',
                        borderRadius: '4px',
                        border: '1px solid #ddd',
                        fontSize: '14px',
                        boxSizing: 'border-box',
                        fontFamily: 'Arial'
                      }}
                    />
                  </div>

                  <button
                    onClick={handleCompanyInfoSave}
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
                    Save Changes
                  </button>
                </div>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div>
                <h2 style={{ marginBottom: '20px', color: '#333' }}>Notification Preferences</h2>
                <div style={{
                  backgroundColor: '#f9f9f9',
                  padding: '20px',
                  borderRadius: '8px',
                  border: '1px solid #e8e8e8'
                }}>
                  <div style={{ marginBottom: '20px', paddingBottom: '15px', borderBottom: '1px solid #e0e0e0' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={notificationsEnabled}
                        onChange={(e) => setNotificationsEnabled(e.target.checked)}
                        style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                      />
                      <span style={{ fontWeight: 'bold', color: '#333' }}>Enable All Notifications</span>
                    </label>
                    <p style={{ color: '#666', fontSize: '13px', marginTop: '5px' }}>Receive alerts for orders, deliveries, and system updates</p>
                  </div>

                  <div style={{ marginBottom: '20px', paddingBottom: '15px', borderBottom: '1px solid #e0e0e0' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={emailNotifications}
                        onChange={(e) => setEmailNotifications(e.target.checked)}
                        disabled={!notificationsEnabled}
                        style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                      />
                      <span style={{ fontWeight: 'bold', color: '#333' }}>Email Notifications</span>
                    </label>
                    <p style={{ color: '#666', fontSize: '13px', marginTop: '5px' }}>Get email updates for important events</p>
                  </div>

                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        defaultChecked
                        style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                      />
                      <span style={{ fontWeight: 'bold', color: '#333' }}>Order Updates</span>
                    </label>
                    <p style={{ color: '#666', fontSize: '13px', marginTop: '5px' }}>Notified when new orders are received</p>
                  </div>

                  <button
                    style={{
                      padding: '10px 20px',
                      backgroundColor: '#4CAF50',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      marginTop: '10px'
                    }}
                  >
                    Save Preferences
                  </button>
                </div>
              </div>
            )}

            {/* Manage Customers Tab - Moved to CustomerAcc.js */}
          </section>
        </div>
      </main>
    </div>
  );
}
