import React, { useState } from 'react';

function FeedbackCard({ feedback, onReply, adminReplies }) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyText, setReplyText] = useState('');
  const reply = adminReplies[feedback.id];

  const handleSubmitReply = () => {
    if (replyText.trim()) {
      onReply(feedback.id, replyText);
      setReplyText('');
      setShowReplyForm(false);
    }
  };

  return (
    <div style={{
      border: '1px solid #e8e8e8',
      borderRadius: '8px',
      padding: '15px',
      marginBottom: '15px',
      backgroundColor: '#f9f9f9'
    }}>
      <div style={{ marginBottom: '10px' }}>
        <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#333', marginBottom: '5px' }}>
          {feedback.customerName}
        </div>
        <div style={{ fontSize: '13px', color: '#666', marginBottom: '8px' }}>
          {feedback.message}
        </div>
        <div style={{ fontSize: '12px', color: '#999' }}>
          {feedback.date}
        </div>
      </div>

      {reply && (
        <div style={{
          backgroundColor: '#e8f5e9',
          border: '1px solid #81c784',
          borderRadius: '6px',
          padding: '10px',
          marginBottom: '10px'
        }}>
          <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#2e7d32', marginBottom: '5px' }}>
            Admin Reply:
          </div>
          <div style={{ fontSize: '13px', color: '#333' }}>
            {reply.text}
          </div>
          <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
            {reply.date}
          </div>
        </div>
      )}

      {!reply && (
        <button
          onClick={() => setShowReplyForm(!showReplyForm)}
          style={{
            padding: '6px 12px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px',
            marginBottom: showReplyForm ? '10px' : '0'
          }}
        >
          {showReplyForm ? 'Cancel' : 'Reply'}
        </button>
      )}

      {showReplyForm && (
        <div style={{ marginTop: '10px' }}>
          <textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Type your reply here..."
            rows="3"
            style={{
              width: '100%',
              padding: '8px',
              borderRadius: '4px',
              border: '1px solid #d0d0d0',
              fontFamily: 'Arial, sans-serif',
              marginBottom: '8px',
              boxSizing: 'border-box'
            }}
          />
          <button
            onClick={handleSubmitReply}
            style={{
              padding: '6px 12px',
              backgroundColor: '#2196F3',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            Send Reply
          </button>
        </div>
      )}
    </div>
  );
}

export default function Feedback({ user, onLogout, onNavigate, feedbacks, onAddFeedback, onOpenJobOrderModal }) {
  const [showFeedbacks, setShowFeedbacks] = useState(true);
  const [adminReplies, setAdminReplies] = useState({});

  const displayedFeedbacks = feedbacks && feedbacks.length > 0 ? feedbacks : [
    {
      id: 1,
      customerName: 'John Santos',
      message: 'Great service! The delivery was on time and the staff was very professional. Highly recommended!',
      date: 'March 10, 2026 - 2:30 PM'
    },
    {
      id: 2,
      customerName: 'Maria Lopez',
      message: 'Good delivery service but the pricing could be more competitive. Please consider reviewing your rates.',
      date: 'March 11, 2026 - 10:15 AM'
    },
    {
      id: 3,
      customerName: 'Carlos Reyes',
      message: 'Excellent customer service! The team helped with loading and unloading. Very satisfied.',
      date: 'March 13, 2026 - 4:45 PM'
    },
    {
      id: 4,
      customerName: 'Anna Cruz',
      message: 'The driver was very friendly and accommodating. Items arrived in perfect condition. Thank you!',
      date: 'March 14, 2026 - 11:20 AM'
    },
    {
      id: 5,
      customerName: 'Manuel Rodriguez',
      message: 'Had a minor issue with one of the packages. Please improve packaging quality.',
      date: 'March 15, 2026 - 3:00 PM'
    }
  ];

  const visibleFeedbacks = [...displayedFeedbacks].sort((a, b) => {
    const timeA = new Date(a.date).getTime();
    const timeB = new Date(b.date).getTime();

    if (Number.isNaN(timeA) || Number.isNaN(timeB)) {
      return 0;
    }

    return timeB - timeA;
  });

  const handleReply = (feedbackId, replyText) => {
    setAdminReplies({
      ...adminReplies,
      [feedbackId]: {
        text: replyText,
        date: new Date().toLocaleString()
      }
    });
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
              <li className="nav-item active" onClick={() => onNavigate('feedback')}>Feedbacks</li>
              <li className="nav-item" onClick={() => onNavigate('settings')}>Settings</li>

            </ul>
          </div>
        </nav>
      </aside>

      <main className="dashboard-main">
        <div className="dashboard-header-bar"></div>
        <div className="dashboard-content">
          <header className="dashboard-header">
            <h1>Feedback Management</h1>
            <div className="header-right">
              <div className="user-greeting">
                <span className="avatar-icon">👤</span>
                <span>Hello Admin</span>
              </div>
              <button className="btn-logout" onClick={onLogout}>Logout</button>
            </div>
          </header>

          {showFeedbacks && (
            <section className="meetings-section">
              <div className="meetings-header">
                <h3>Customer Feedbacks</h3>
              </div>
              <div style={{ marginTop: '15px' }}>
                {visibleFeedbacks.map((feedback) => (
                  <FeedbackCard
                    key={feedback.id}
                    feedback={feedback}
                    onReply={handleReply}
                    adminReplies={adminReplies}
                  />
                ))}
              </div>
            </section>
          )}

          {!showFeedbacks && (
            <section className="meetings-section" style={{ textAlign: 'center', padding: '40px 20px' }}>
              <p style={{ color: '#999', fontSize: '16px' }}>
                No customer feedback available.
              </p>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}
