import React, { useState } from 'react';
import useStickyState from '../useStickyState';
import AboutUs from './AboutUs';
import Service from './Service';
import Product from './Product';
import Orderspage from './Orderspage';
import toast from 'react-hot-toast';

export default function WelcomePage({ onSignInClick, user, onAddFeedback }) {
  const [currentPage, setCurrentPage] = useStickyState('home', 'welcome_currentPage');
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');

  const handleSendFeedback = () => {
    if (!feedbackText.trim()) {
      toast.error('Please enter your feedback before sending.');
      return;
    }

    if (onAddFeedback) {
      onAddFeedback({
        id: Date.now(),
        customerName: user?.name || 'Guest Customer',
        message: feedbackText.trim(),
        date: new Date().toLocaleString()
      });
    }

    toast.success('Thank you! Your feedback has been sent to the admin.');
    setFeedbackText('');
    setIsFeedbackOpen(false);
  };

  const renderContent = () => {
    if (currentPage === 'about') return <AboutUs />;
    if (currentPage === 'services') return <Service />;
    if (currentPage === 'products') return <Product />; // no props needed for static view
    

    // default home content
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
                <span></span>
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
      <nav style={{
        background: 'rgba(4, 171, 12, 0.9)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        padding: '13px 24px',
        display: 'flex',
        alignItems: 'center',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
      }}>
        {/* logo positioned left */}
        <div style={{ position: 'absolute', left: '24px', display: 'flex', alignItems: 'center' }}>
          <button
            style={{
              color: 'white',
              textDecoration: 'none',
              fontSize: '15px',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <img src="/logo.png" alt="OBA logo" className="homepage-logo" />
            OBA Supplies & Services
          </button>
        </div>

        {/* centered navigation links */}
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
          
        </div>

        {/* icons positioned right */}
        
          <button
            onClick={onSignInClick}
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
            Sign In
          </button>
          <span role="img" aria-label="user" style={{ fontSize: '20px', color: 'white', cursor: 'pointer' }}></span>
          <span role="img" aria-label="menu" style={{ fontSize: '24px', color: 'white', cursor: 'pointer' }}></span>
        

        {/* icons positioned right */}
        <div style={{ position: 'absolute', right: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span role="img" aria-label="user" style={{ fontSize: '20px', color: 'white', cursor: 'pointer' }}></span>
          <span role="img" aria-label="menu" style={{ fontSize: '24px', color: 'white', cursor: 'pointer' }}></span>
        </div>
      </nav>

      <main style={{ margin: 0, padding: 0 }}>
        {renderContent()}
      </main>
    </div>
  );
}
