import React from 'react';

export default function AboutUs() {
  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px 24px' }}>
      {/* Page Title */}
      <h1 style={{
        textAlign: 'center',
        fontSize: '42px',
        fontWeight: '800',
        color: 'var(--text)',
        marginBottom: '40px',
        letterSpacing: '-1px'
      }}>
        About OBA Supplies & Services
      </h1>

      {/* Hero Collage Image */}
      <div
        className="modern-shadow hover-lift"
        style={{
          width: '100%',
          marginBottom: '64px',
          overflow: 'hidden',
          borderRadius: '24px',
          border: '1px solid var(--border)'
        }}
      >
        <img
          src="/images/picture.png"
          alt="OBA team and operations collage"
          style={{
            width: '100%',
            height: '400px',
            objectFit: 'cover',
            display: 'block'
          }}
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=1200&h=400";
          }}
        />
      </div>

      {/* About Section with Logo and Description */}
      <div
        className="glass-panel"
        style={{
          borderRadius: '24px',
          padding: '48px',
          display: 'flex',
          gap: '64px',
          alignItems: 'center',
          flexWrap: 'wrap-reverse'
        }}
      >
        {/* Description Text */}
        <div style={{ flex: '1 1 500px', fontSize: '16px', lineHeight: '1.8', color: 'var(--text)' }}>
          <p style={{ marginBottom: '24px', fontSize: '18px' }}>
            <strong style={{ color: 'var(--green)', fontWeight: '700' }}>OBA Supplies and Services Inc.</strong> is a SEC registered company with registration no. 20230300323-04, established in March 2023 as a result of the vision and expansion plans of the team behind Marchevel Manpower Services.
          </p>

          <p style={{ marginBottom: '32px', color: 'var(--text-light)' }}>
            Leveraging the expertise gained from 12 years of operating Marchevel Manpower Services, OBA Supplies and Services Inc. aims to continue providing exceptional services in mechanical and electrical works, fabrication, and installation while expanding its offerings to meet a broader range of client needs.
          </p>

          <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '250px' }}>
              <h3 style={{ fontSize: '20px', color: 'var(--text)', marginBottom: '16px', borderBottom: '2px solid var(--green)', paddingBottom: '8px', display: 'inline-block' }}>Products</h3>
              <ul style={{ listStyleType: 'none', padding: 0, margin: 0, color: 'var(--text-light)' }}>
                <li style={{ marginBottom: '12px' }}>
                  <span style={{ color: 'var(--green)', marginRight: '8px', fontWeight: 'bold' }}>✓</span>
                  Authorized Reseller of <a href="https://www.ihi.co.jp/compressor/en/" target="_blank" rel="noreferrer" style={{ color: 'var(--green)', textDecoration: 'none', fontWeight: '600' }}>IHI Compressors</a>
                </li>
                <li style={{ marginBottom: '12px' }}>
                  <span style={{ color: 'var(--green)', marginRight: '8px', fontWeight: 'bold' }}>✓</span>
                  Authorized Reseller of <a href="https://www.didwanis.com/" target="_blank" rel="noreferrer" style={{ color: 'var(--green)', textDecoration: 'none', fontWeight: '600' }}>Indian Compressor LTD</a>
                </li>
              </ul>
            </div>

            <div style={{ flex: 2, minWidth: '250px' }}>
              <h3 style={{ fontSize: '20px', color: 'var(--text)', marginBottom: '16px', borderBottom: '2px solid var(--green)', paddingBottom: '8px', display: 'inline-block' }}>Core Services</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', color: 'var(--text-light)', fontSize: '14px' }}>
                <div><span style={{ color: 'var(--green)' }}>•</span> Insulations and Cladding</div>
                <div><span style={{ color: 'var(--green)' }}>•</span> Cold Box Insulation</div>
                <div><span style={{ color: 'var(--green)' }}>•</span> Equipment Foundation Coating</div>
                <div><span style={{ color: 'var(--green)' }}>•</span> Welding and Fabrication</div>
                <div><span style={{ color: 'var(--green)' }}>•</span> Cooler Tube Replacement</div>
                <div><span style={{ color: 'var(--green)' }}>•</span> VIP Installation</div>
                <div><span style={{ color: 'var(--green)' }}>•</span> Liquid Nitrogen Piping</div>
                <div><span style={{ color: 'var(--green)' }}>•</span> Crack Detection Test</div>
                <div><span style={{ color: 'var(--green)' }}>•</span> Repainting</div>
                <div><span style={{ color: 'var(--green)' }}>•</span> Professional ME Consultancy</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Logo & Certification */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '40px',
          minWidth: '250px',
          flex: '1 1 300px'
        }}>
          {/* OBA Logo Spotlight */}
          <div
            className="hover-lift"
            style={{
              width: '180px',
              height: '180px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #ffffff 0%, #f1f5f9 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '4px solid var(--green)',
              flexDirection: 'column',
              boxShadow: '0 10px 25px rgba(5, 150, 105, 0.2)',
              color: 'var(--green)',
              fontWeight: '800',
              fontSize: '36px',
              textAlign: 'center',
              lineHeight: '1.2'
            }}>
            OBA
            <div style={{ fontSize: '11px', marginTop: '8px', fontWeight: '700', letterSpacing: '1px', color: 'var(--text-light)' }}>
              SUPPLIES &<br />SERVICES
            </div>
          </div>

          {/* SEC Certificate Document - Beside Description */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
            maxWidth: '320px',
            background: 'rgba(255,255,255,0.7)',
            padding: '20px',
            borderRadius: '20px',
            border: '1px solid rgba(5, 150, 105, 0.1)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.04)'
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text)', marginBottom: '16px', letterSpacing: '-0.3px', textAlign: 'center' }}>Accreditations</h3>
            
            <div style={{
              width: '100%',
              paddingBottom: '141%', /* standard A4 format aspect ratio */
              position: 'relative',
              borderRadius: '8px',
              overflow: 'hidden',
              boxShadow: '0 4px 15px rgba(0, 0, 0, 0.08)',
              backgroundColor: '#f8fafc',
              border: '2px solid #ffffff'
            }}>
              <img
                src="/images/sec-cert.jpg"
                alt="SEC Certificate of Incorporation"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  backgroundColor: '#ffffff'
                }}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&q=80&w=800&h=1131";
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  background: 'var(--green)',
                  color: 'white',
                  padding: '4px 10px',
                  borderRadius: '16px',
                  fontSize: '10px',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  boxShadow: '0 2px 8px rgba(5, 150, 105, 0.3)'
                }}
              >
                <span style={{ width: '4px', height: '4px', background: '#fff', borderRadius: '50%', display: 'inline-block' }}></span>
                Verified
              </div>
            </div>

            <div style={{ marginTop: '16px', textAlign: 'center' }}>
              <div style={{
                display: 'inline-block',
                background: 'rgba(5, 150, 105, 0.1)',
                color: 'var(--green)',
                padding: '4px 8px',
                borderRadius: '6px',
                fontSize: '10px',
                fontWeight: '700',
                marginBottom: '8px'
              }}>
                REG. NO. 20230300323-04
              </div>
              <p style={{ color: 'var(--text-light)', fontSize: '13px', lineHeight: '1.5', margin: 0, fontWeight: '500' }}>
                SEC Certificate of Incorporation
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
