import React, { useState } from 'react';
import toast from 'react-hot-toast';

function JobOrderItem({ jobOrder }) {
  return (
    <div className="meeting-item">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <span className="meeting-name" style={{ fontWeight: '600' }}>{jobOrder.customerName} - {jobOrder.company}</span>
        <div style={{ display: 'flex', gap: '12px', fontSize: '11px', color: 'var(--text-light)' }}>
          <span>👔 {jobOrder.position}</span>
          <span>{jobOrder.jobType}</span>
          <span>👥 {jobOrder.manpower} workers</span>
          <span>📅 {jobOrder.contractLength}</span>
        </div>
      </div>
    </div>
  );
}

export default function JobOrder({ user, onLogout, onNavigate, jobOrders, onAddJobOrder, onRejectOrder, onProcessJobOrder }) {
  const [newJobOrder, setNewJobOrder] = useState({
    customerName: '',
    position: '',
    company: '',
    address: '',
    jobType: '',
    manpower: '',
    contractLength: '',
    startDate: '',
    companyId: null,
    businessLicense: null
  });
  const [selectedOrderForReview, setSelectedOrderForReview] = useState(null);
  const [showRequirementsModal, setShowRequirementsModal] = useState(false);
  const [zoomedImage, setZoomedImage] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewJobOrder({ ...newJobOrder, [name]: value });
  };

  const handleFileChange = (e, field) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewJobOrder({ ...newJobOrder, [field]: reader.result });
      };
      reader.readAsDataURL(file);
    } else {
      setNewJobOrder({ ...newJobOrder, [field]: null });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (newJobOrder.customerName && newJobOrder.position && newJobOrder.company && newJobOrder.address && newJobOrder.jobType && newJobOrder.manpower && newJobOrder.contractLength && newJobOrder.startDate) {
      onAddJobOrder({
        ...newJobOrder,
        manpower: parseInt(newJobOrder.manpower),
        id: Date.now()
      });
      setNewJobOrder({
        customerName: '',
        position: '',
        company: '',
        address: '',
        jobType: '',
        manpower: '',
        contractLength: '',
        startDate: '',
        companyId: null,
        businessLicense: null
      });
    }
  };

  const getJobTypeIcon = (jobType) => {
    const icons = {
      'Insulation and Cladding': '🏗️',
      'Crack Detection Test': '🔍',
      'Order Of IHI Compressor': '🔧',
      'Construction': '🏗️',
      'Maintenance': '🔧',
      'Installation': '⚙️',
      'Other': '📋'
    };
    return icons[jobType] || '📋';
  };

  const getCustomerInitial = (name) => {
    return name ? name.charAt(0).toUpperCase() : '👤';
  };

  const handleViewRequirements = (jobOrder) => {
    setSelectedOrderForReview(jobOrder);
    setShowRequirementsModal(true);
  };

  const closeRequirementsModal = () => {
    setShowRequirementsModal(false);
    setSelectedOrderForReview(null);
  };

  const handleProcessOrder = (jobOrder) => {
    if (onProcessJobOrder) {
      onProcessJobOrder(jobOrder);
      toast.success(
        <div>
          <b>Order from {jobOrder.customerName} processed!</b>
          <br />
          <small>✓ Start: {jobOrder.startDate} | ✓ End: {jobOrder.endDate} | ✓ Manpower: {jobOrder.manpower}</small>
        </div>,
        { duration: 4000 }
      );
    } else {
      toast(`Processing order: ${jobOrder.customerName}`);
    }
  };

  const handleRejectOrder = () => {
    if (selectedOrderForReview && onRejectOrder) {
      const confirmReject = window.confirm(
        `Are you sure you want to reject the order from ${selectedOrderForReview.customerName}?\n\nThis action cannot be undone.`
      );

      if (confirmReject) {
        onRejectOrder(selectedOrderForReview.id);
        closeRequirementsModal();
        toast.error('Order has been rejected and removed from the queue.', {
          icon: '🗑️',
        });
      }
    }
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
              <li className="nav-item active">Orders / Job Order</li>
              <li className="nav-item" onClick={() => onNavigate('customersacc')}>Manage Customer Accounts</li>
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
            <h1>Orders and Job Order</h1>
            <div className="header-right">
              <div className="user-greeting">
                <span className="avatar-icon">👤</span>
                <span>Hello Admin</span>
              </div>
              <button className="btn-logout" onClick={onLogout}>Logout</button>
            </div>
          </header>

          {/* Orders Display Section */}





          <section className="meetings-section">
            <div className="meetings-header">
              <h3>Current Orders</h3>
            </div>
            {jobOrders.length === 0 ? (
              <div className="empty-inventory" style={{ padding: '40px 20px', textAlign: 'center' }}>
                <p> No Orders and Job Orders Created yet.</p>
                <p style={{ fontSize: '12px', color: '#bbb' }}>Orders will appear here</p>
              </div>

            ) : (
              <div className="orders-cards-container" style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(1, 1fr)',
                gap: '24px'
              }}>
                {jobOrders.filter(jobOrder => jobOrder.status === 'pending' || !jobOrder.status).map((jobOrder, index) => (
                  <div
                    key={jobOrder.id}
                    className="order-card"
                    style={{
                      backgroundColor: 'white',
                      borderRadius: '12px',
                      padding: '24px',
                      border: index === jobOrders.length - 1 ? '3px solid var(--green)' : '1px solid #e0e0e0',
                      display: 'flex',
                      gap: '20px',
                      alignItems: 'flex-start',
                      boxShadow: index === jobOrders.length - 1 ? '0 2px 8px rgba(5, 150, 105, 0.15)' : '0 1px 3px rgba(0, 0, 0, 0.08)',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (index !== jobOrders.length - 1) {
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (index !== jobOrders.length - 1) {
                        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.08)';
                      }
                    }}
                  >
                    {/* Left: Customer Avatar and Info */}
                    <div style={{
                      flex: '0 0 auto',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '12px',
                      minWidth: '140px'
                    }}>
                      <div style={{
                        width: '80px',
                        height: '80px',
                        borderRadius: '50%',
                        backgroundColor: '#f0a040',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '32px',
                        fontWeight: 'bold',
                        color: 'white'
                      }}>
                        {getCustomerInitial(jobOrder.customerName)}
                      </div>
                      <div style={{ textAlign: 'center', width: '100%' }}>
                        <div style={{ fontSize: '14px', fontWeight: '600', color: '#333', marginBottom: '4px' }}>
                          {jobOrder.customerName}
                        </div>
                        <div style={{ fontSize: '12px', color: '#666', marginBottom: '2px' }}>
                          {jobOrder.position}
                        </div>
                        <div style={{ fontSize: '12px', color: '#999', marginBottom: '4px' }}>
                          {jobOrder.company}
                        </div>
                        <div style={{ fontSize: '11px', color: '#bbb', lineHeight: '1.3' }}>
                          {jobOrder.address}
                        </div>
                      </div>
                    </div>

                    {/* Middle: Job Order Details */}
                    <div style={{
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '16px'
                    }}>
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                        <div style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '4px'
                        }}>
                          <div style={{ fontSize: '12px', color: '#999', marginBottom: '4px' }}>
                            Order / Job Order:
                          </div>
                          <div style={{ fontSize: '14px', fontWeight: '600', color: '#333' }}>
                            {jobOrder.jobType}
                          </div>
                        </div>
                        <div style={{
                          width: '120px',
                          height: '100px',
                          backgroundColor: '#f0f0f0',
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '48px',
                          flexShrink: 0
                        }}>
                          {getJobTypeIcon(jobOrder.jobType)}
                        </div>
                      </div>
                    </div>

                    {/* Right: Details and Actions */}
                    <div style={{
                      flex: '0 0 auto',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                      minWidth: '180px',
                      alignItems: 'stretch'
                    }}>
                      <div style={{
                        backgroundColor: '#f9f9f9',
                        padding: '16px',
                        borderRadius: '8px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px'
                      }}>
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          paddingBottom: '12px',
                          borderBottom: '1px solid #e0e0e0',

                        }}>
                          <span style={{ fontSize: '12px', color: '#999' }}>Num. of manpower: </span>
                          <span style={{ fontSize: '15px', fontWeight: 'bold', color: '#333' }}>
                            {jobOrder.manpower}
                          </span>
                        </div>
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          paddingBottom: '12px',
                          gap: '15px',
                        }}>
                          <span style={{ fontSize: '12px', color: '#999' }}>Length OF Contract: </span>
                          <span style={{ fontSize: '15px', fontWeight: '600', color: '#333' }}>
                            {jobOrder.contractLength}
                          </span>
                        </div>
                      </div>

                      <div style={{
                        display: 'flex',
                        gap: '8px',
                        flexDirection: 'column'
                      }}>
                        <button
                          style={{
                            padding: '10px 16px',
                            fontSize: '12px',
                            fontWeight: '600',
                            border: '1px solid #ddd',
                            borderRadius: '6px',
                            backgroundColor: 'white',
                            color: '#333',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.backgroundColor = '#f5f5f5';
                            e.target.style.borderColor = '#bbb';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.backgroundColor = 'white';
                            e.target.style.borderColor = '#ddd';
                          }}
                          onClick={() => handleViewRequirements(jobOrder)}
                        >
                          View Reqs.
                        </button>
                        <button
                          style={{
                            padding: '10px 16px',
                            fontSize: '12px',
                            fontWeight: '600',
                            border: 'none',
                            borderRadius: '6px',
                            backgroundColor: '#04ab0c',
                            color: 'white',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => e.target.style.backgroundColor = '#039a0a'}
                          onMouseLeave={(e) => e.target.style.backgroundColor = '#04ab0c'}
                          onClick={() => handleProcessOrder(jobOrder)}
                        >
                          Approve
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>


        </div>
      </main>

      {/* Requirements Modal */}
      {showRequirementsModal && selectedOrderForReview && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
          onClick={closeRequirementsModal}
        >
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '32px',
              maxWidth: '800px',
              minWidth: '600px',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: '#333' }}>
                📋 Order Requirements
              </h2>
              <button
                onClick={closeRequirementsModal}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '28px',
                  cursor: 'pointer',
                  color: '#999',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                ✕
              </button>
            </div>

            {/* Customer & Order Info */}
            <div style={{
              backgroundColor: '#f9f9f9',
              padding: '16px',
              borderRadius: '8px',
              marginBottom: '24px'
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '12px' }}>
                <div>
                  <div style={{ fontSize: '12px', color: '#999', marginBottom: '4px' }}>Customer Name</div>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: '#333' }}>
                    {selectedOrderForReview.customerName}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: '#999', marginBottom: '4px' }}>Contact Number</div>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: '#333' }}>
                    {selectedOrderForReview.contactNumber || 'N/A'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: '#999', marginBottom: '4px' }}>Company</div>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: '#333' }}>
                    {selectedOrderForReview.company}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: '#999', marginBottom: '4px' }}>Address</div>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: '#333' }}>
                    {selectedOrderForReview.address}
                  </div>
                </div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: '#999', marginBottom: '4px' }}>Service Type</div>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#333' }}>
                  {selectedOrderForReview.jobType}
                </div>
              </div>
            </div>

            {/* Documents Section */}
            <h3 style={{ margin: '24px 0 16px 0', fontSize: '16px', fontWeight: '600', color: '#333' }}>
              📸 Documents & Licenses
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              {/* Business License */}
              <div style={{
                border: '2px solid #e0e0e0',
                borderRadius: '8px',
                padding: '16px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#333', marginBottom: '12px' }}>
                  📄 Business License
                </div>
                {selectedOrderForReview.businessLicense ? (
                  typeof selectedOrderForReview.businessLicense === 'string' ? (
                    <div style={{
                      position: 'relative',
                      width: '100%',
                      height: '200px',
                      backgroundColor: '#f0f0f0',
                      borderRadius: '6px',
                      overflow: 'hidden',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <button
                        onClick={(e) => { e.stopPropagation(); setZoomedImage(selectedOrderForReview.businessLicense); }}
                        style={{ position: 'absolute', top: '8px', right: '8px', zIndex: 10, background: 'rgba(0,0,0,0.6)', color: 'white', border: 'none', borderRadius: '4px', padding: '6px 12px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        🔍 Zoom
                      </button>
                      <img
                        src={selectedOrderForReview.businessLicense}
                        alt="Business License"
                        style={{
                          maxWidth: '100%',
                          maxHeight: '100%',
                          objectFit: 'contain'
                        }}
                      />
                    </div>
                  ) : (
                    <div style={{
                      position: 'relative',
                      width: '100%',
                      height: '200px',
                      backgroundColor: '#f0f0f0',
                      borderRadius: '6px',
                      overflow: 'hidden',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <button
                        onClick={(e) => { e.stopPropagation(); setZoomedImage(URL.createObjectURL(selectedOrderForReview.businessLicense)); }}
                        style={{ position: 'absolute', top: '8px', right: '8px', zIndex: 10, background: 'rgba(0,0,0,0.6)', color: 'white', border: 'none', borderRadius: '4px', padding: '6px 12px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        🔍 Zoom
                      </button>
                      <img
                        src={URL.createObjectURL(selectedOrderForReview.businessLicense)}
                        alt="Business License"
                        style={{
                          maxWidth: '100%',
                          maxHeight: '100%',
                          objectFit: 'contain'
                        }}
                      />
                    </div>
                  )
                ) : (
                  <div style={{
                    width: '100%',
                    height: '200px',
                    backgroundColor: '#f0f0f0',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#999'
                  }}>
                    No document provided
                  </div>
                )}
                {selectedOrderForReview.businessLicense && (
                  <div style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
                    {typeof selectedOrderForReview.businessLicense === 'string'
                      ? 'Document provided'
                      : selectedOrderForReview.businessLicense.name
                    }
                  </div>
                )}
              </div>

              {/* Company ID */}
              <div style={{
                border: '2px solid #e0e0e0',
                borderRadius: '8px',
                padding: '16px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#333', marginBottom: '12px' }}>
                  📄 Company ID
                </div>
                {selectedOrderForReview.companyId ? (
                  typeof selectedOrderForReview.companyId === 'string' ? (
                    <div style={{
                      position: 'relative',
                      width: '100%',
                      height: '200px',
                      backgroundColor: '#f0f0f0',
                      borderRadius: '6px',
                      overflow: 'hidden',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <button
                        onClick={(e) => { e.stopPropagation(); setZoomedImage(selectedOrderForReview.companyId); }}
                        style={{ position: 'absolute', top: '8px', right: '8px', zIndex: 10, background: 'rgba(0,0,0,0.6)', color: 'white', border: 'none', borderRadius: '4px', padding: '6px 12px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        🔍 Zoom
                      </button>
                      <img
                        src={selectedOrderForReview.companyId}
                        alt="Company ID"
                        style={{
                          maxWidth: '100%',
                          maxHeight: '100%',
                          objectFit: 'contain'
                        }}
                      />
                    </div>
                  ) : (
                    <div style={{
                      position: 'relative',
                      width: '100%',
                      height: '200px',
                      backgroundColor: '#f0f0f0',
                      borderRadius: '6px',
                      overflow: 'hidden',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <button
                        onClick={(e) => { e.stopPropagation(); setZoomedImage(URL.createObjectURL(selectedOrderForReview.companyId)); }}
                        style={{ position: 'absolute', top: '8px', right: '8px', zIndex: 10, background: 'rgba(0,0,0,0.6)', color: 'white', border: 'none', borderRadius: '4px', padding: '6px 12px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        🔍 Zoom
                      </button>
                      <img
                        src={URL.createObjectURL(selectedOrderForReview.companyId)}
                        alt="Company ID"
                        style={{
                          maxWidth: '100%',
                          maxHeight: '100%',
                          objectFit: 'contain'
                        }}
                      />
                    </div>
                  )
                ) : (
                  <div style={{
                    width: '100%',
                    height: '200px',
                    backgroundColor: '#f0f0f0',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#999'
                  }}>
                    No document provided
                  </div>
                )}
                {selectedOrderForReview.companyId && (
                  <div style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
                    {typeof selectedOrderForReview.companyId === 'string'
                      ? 'Document provided'
                      : selectedOrderForReview.companyId.name
                    }
                  </div>
                )}
              </div>
            </div>

            {/* Close Button */}
            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <button
                onClick={handleRejectOrder}
                style={{
                  flex: 1,
                  padding: '12px',
                  backgroundColor: '#ff4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#cc0000'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#ff4444'}
              >
                ✕ Reject Order
              </button>
              <button
                onClick={() => {
                  handleProcessOrder(selectedOrderForReview);
                  closeRequirementsModal();
                }}
                style={{
                  flex: 1,
                  padding: '12px',
                  backgroundColor: '#04ab0c',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#039a0a'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#04ab0c'}
              >
                ✓ Approve & Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Zoomed Image Modal Overlay */}
      {zoomedImage && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            zIndex: 2000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '40px'
          }}
          onClick={() => setZoomedImage(null)}
        >
          <button
            onClick={() => setZoomedImage(null)}
            style={{
              position: 'absolute',
              top: '24px',
              right: '32px',
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              color: 'white',
              fontSize: '28px',
              cursor: 'pointer',
              borderRadius: '50%',
              width: '48px',
              height: '48px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.2)'}
            onMouseLeave={(e) => e.target.style.background = 'rgba(255,255,255,0.1)'}
          >
            ✕
          </button>
          <img
            src={zoomedImage}
            alt="Zoomed Document"
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'contain',
              boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
              borderRadius: '8px'
            }}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
