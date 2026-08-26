import React, { useState, useEffect, useRef } from 'react';

export default function RfidReaderModal({
  isOpen,
  onClose,
  employees = [],
  onTapEmployee,
  lastTapResult
}) {
  const [rfidInput, setRfidInput] = useState('');
  const [searchFilter, setSearchFilter] = useState('');
  const inputRef = useRef(null);

  // Auto-focus reader input when modal opens or after a tap
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen, lastTapResult]);

  if (!isOpen) return null;

  const handleRfidSubmit = (e) => {
    e.preventDefault();
    if (!rfidInput.trim()) return;

    const query = rfidInput.trim().toLowerCase();
    // Match by exact RFID tag, employee ID, or partial name
    const found = employees.find(emp => 
      emp.id.toLowerCase() === query ||
      (emp.rfidTag && emp.rfidTag.toLowerCase() === query) ||
      emp.name.toLowerCase().includes(query)
    );

    if (found) {
      onTapEmployee(found);
      setRfidInput('');
    } else {
      alert(`No employee found matching RFID tag/ID: "${rfidInput}"`);
      setRfidInput('');
    }
  };

  const filteredEmployees = employees.filter(emp =>
    emp.id.toLowerCase().includes(searchFilter.toLowerCase()) ||
    emp.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
    (emp.rfidTag && emp.rfidTag.toLowerCase().includes(searchFilter.toLowerCase()))
  );

  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '20px'
      }}
      onClick={onClose}
    >
      <div 
        style={{
          backgroundColor: 'white',
          borderRadius: '20px',
          padding: '32px',
          width: '650px',
          maxWidth: '95%',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
          animation: 'fadeIn 0.2s ease-out'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #eee', paddingBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', backgroundColor: '#e8f5e9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>
              🎴
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '22px', color: '#333', fontWeight: '700' }}>RFID Tap Reader System</h2>
              <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#666' }}>1st Tap = Time In | 2nd Tap = Time Out</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            style={{ border: 'none', background: '#f5f5f5', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', fontSize: '16px', color: '#666', fontWeight: 'bold' }}
          >
            ✕
          </button>
        </div>

        {/* Live Tap Result Banner */}
        {lastTapResult && (
          <div style={{
            marginBottom: '24px',
            padding: '20px',
            borderRadius: '14px',
            backgroundColor: lastTapResult.action === 'TIME_IN' ? '#edf7ed' : '#fdeded',
            border: `2px solid ${lastTapResult.action === 'TIME_IN' ? '#4caf50' : '#ef5350'}`,
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
            animation: 'fadeIn 0.2s ease-in-out'
          }}>
            <div style={{
              width: '52px',
              height: '52px',
              borderRadius: '50%',
              backgroundColor: lastTapResult.action === 'TIME_IN' ? '#2e7d32' : '#c62828',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              fontWeight: 'bold',
              flexShrink: 0
            }}>
              {lastTapResult.action === 'TIME_IN' ? '🟢' : '🔴'}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{
                  padding: '4px 10px',
                  borderRadius: '12px',
                  backgroundColor: lastTapResult.action === 'TIME_IN' ? '#2e7d32' : '#c62828',
                  color: 'white',
                  fontWeight: 'bold',
                  fontSize: '12px',
                  letterSpacing: '0.5px'
                }}>
                  {lastTapResult.action === 'TIME_IN' ? 'TIME IN (1ST TAP)' : 'TIME OUT (2ND TAP)'}
                </span>
                <span style={{ fontSize: '13px', color: '#666', fontWeight: '500' }}>
                  🕒 {lastTapResult.timestamp}
                </span>
              </div>
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#222', marginTop: '6px' }}>
                {lastTapResult.employee.name} <span style={{ fontSize: '14px', color: '#666', fontWeight: 'normal' }}>({lastTapResult.employee.id})</span>
              </div>
              <div style={{ fontSize: '13px', color: '#555', marginTop: '4px' }}>
                Department: <strong>{lastTapResult.employee.department}</strong> | Status: <strong style={{ color: lastTapResult.action === 'TIME_IN' ? '#2e7d32' : '#c62828' }}>{lastTapResult.action === 'TIME_IN' ? 'Present' : 'Timed Out'}</strong>
              </div>
            </div>
          </div>
        )}

        {/* Physical USB RFID Scanner Input Listener */}
        <div style={{ backgroundColor: '#f8f9fa', border: '1px solid #e9ecef', borderRadius: '14px', padding: '20px', marginBottom: '24px' }}>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', color: '#333', marginBottom: '8px' }}>
            📡 USB RFID Hardware Reader Input (Auto-Listening)
          </label>
          <form onSubmit={handleRfidSubmit} style={{ display: 'flex', gap: '10px' }}>
            <input
              ref={inputRef}
              type="text"
              value={rfidInput}
              onChange={(e) => setRfidInput(e.target.value)}
              placeholder="Tap RFID Card on Hardware Reader or type ID..."
              style={{
                flex: 1,
                padding: '12px 16px',
                borderRadius: '8px',
                border: '2px solid #04ab0c',
                fontSize: '14px',
                outline: 'none',
                backgroundColor: 'white'
              }}
            />
            <button
              type="submit"
              style={{
                padding: '12px 24px',
                backgroundColor: '#04ab0c',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Scan / Tap
            </button>
          </form>
          <span style={{ display: 'block', fontSize: '12px', color: '#777', marginTop: '6px' }}>
            💡 Tip: Point USB RFID Scanner to your screen or tap a card to trigger instant Time In / Time Out.
          </span>
        </div>

        {/* Visual Card Tap Simulator */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h3 style={{ margin: 0, fontSize: '16px', color: '#333', fontWeight: '700' }}>
              💳 Card Tap Simulator (Click any card to tap)
            </h3>
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Search employee..."
              style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '13px', width: '180px' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', maxHeight: '280px', overflowY: 'auto', paddingRight: '4px' }}>
            {filteredEmployees.slice(0, 20).map(emp => {
              const hasTimedIn = emp.timeIn && emp.timeIn !== '-';
              const hasTimedOut = emp.timeOut && emp.timeOut !== '-';
              
              let nextActionLabel = '1st Tap: TIME IN';
              let nextActionColor = '#2e7d32';
              let nextActionBg = '#e8f5e9';

              if (hasTimedIn && !hasTimedOut) {
                nextActionLabel = '2nd Tap: TIME OUT';
                nextActionColor = '#c62828';
                nextActionBg = '#ffebee';
              } else if (hasTimedIn && hasTimedOut) {
                nextActionLabel = 'Tap: Start New Shift';
                nextActionColor = '#1565c0';
                nextActionBg = '#e3f2fd';
              }

              return (
                <div
                  key={emp.id}
                  onClick={() => onTapEmployee(emp)}
                  style={{
                    padding: '12px 14px',
                    border: '1px solid #e0e0e0',
                    borderRadius: '12px',
                    backgroundColor: 'white',
                    cursor: 'pointer',
                    display: 'flex',
                    justify: 'space-between',
                    alignItems: 'center',
                    transition: 'all 0.2s',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = '#04ab0c';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = '#e0e0e0';
                    e.currentTarget.style.transform = 'none';
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 'bold', color: '#333', fontSize: '14px' }}>
                      👤 {emp.name}
                    </div>
                    <div style={{ fontSize: '12px', color: '#666', marginTop: '2px' }}>
                      ID: {emp.id} | {emp.department}
                    </div>
                    <div style={{ fontSize: '11px', color: '#888', marginTop: '4px' }}>
                      In: <strong>{emp.timeIn || '-'}</strong> | Out: <strong>{emp.timeOut || '-'}</strong>
                    </div>
                  </div>

                  <button
                    type="button"
                    style={{
                      padding: '6px 10px',
                      borderRadius: '8px',
                      border: 'none',
                      backgroundColor: nextActionBg,
                      color: nextActionColor,
                      fontSize: '11px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {nextActionLabel}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
