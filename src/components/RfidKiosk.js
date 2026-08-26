import React, { useState, useEffect, useRef, useMemo } from 'react';
import { database } from '../firebase';
import { ref, onValue, set, runTransaction, update } from 'firebase/database';
import toast from 'react-hot-toast';

export default function RfidKiosk({ onBackToLogin, onNavigate }) {
  const [employees, setEmployees] = useState([]);
  const [rfidInput, setRfidInput] = useState('');
  const [lastTapResult, setLastTapResult] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [searchFilter, setSearchFilter] = useState('');
  const inputRef = useRef(null);

  // Live Digital Clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Sync with Firebase Realtime Database
  useEffect(() => {
    const employeesRef = ref(database, 'employees');
    const unsubscribe = onValue(employeesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.keys(data).map(key => ({
          ...data[key],
          id: key
        }));
        setEmployees(list);
      }
    });
    return () => unsubscribe();
  }, []);

  // Keep scanner input focused
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [lastTapResult]);

  const handleRfidTap = (employee) => {
    if (!employee) return;

    const empRef = ref(database, 'employees/' + employee.id);

    // Optimistic UI: show immediate feedback while transaction runs
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const hasTimedIn = employee.timeIn && employee.timeIn !== '-';
    const hasTimedOut = employee.timeOut && employee.timeOut !== '-';
    const optimisticAction = (!hasTimedIn || (hasTimedIn && hasTimedOut)) ? 'TIME_IN' : 'TIME_OUT';
    const optimistic = optimisticAction === 'TIME_IN'
      ? { ...employee, status: 'Present', date: dateStr, timeIn: timeStr, timeOut: '-' }
      : { ...employee, status: 'Present', timeOut: timeStr };
    setLastTapResult({ employee: optimistic, action: optimisticAction, timestamp: timeStr, date: dateStr, timeIn: optimistic.timeIn, timeOut: optimistic.timeOut });

    // Server-side transaction to record authoritative timestamps
    runTransaction(empRef, (currentData) => {
      if (currentData === null) return currentData;

      const hasTimedInServer = !!currentData.timeInTimestamp && currentData.timeInTimestamp !== 0;
      const hasTimedOutServer = !!currentData.timeOutTimestamp && currentData.timeOutTimestamp !== 0;

      if (!hasTimedInServer || (hasTimedInServer && hasTimedOutServer)) {
        // TIME IN
        currentData.status = 'Present';
        currentData.date = new Date().toISOString().split('T')[0];
        currentData.timeInTimestamp = { '.sv': 'timestamp' };
        currentData.timeOutTimestamp = 0;
      } else {
        // TIME OUT
        currentData.status = 'Present';
        currentData.timeOutTimestamp = { '.sv': 'timestamp' };
      }

      return currentData;
    }).then((result) => {
      if (!result.committed) return;
      const updated = result.snapshot.val();
      const timeInTs = updated.timeInTimestamp || 0;
      const timeOutTs = updated.timeOutTimestamp || 0;

      const formattedTimeIn = timeInTs ? new Date(timeInTs).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : (updated.timeIn || '-');
      const formattedTimeOut = timeOutTs ? new Date(timeOutTs).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : (updated.timeOut || '-');

      update(empRef, {
        timeIn: formattedTimeIn || '-',
        timeOut: formattedTimeOut || '-',
        status: updated.status || 'Present',
        date: updated.date || new Date().toISOString().split('T')[0]
      }).catch(err => console.error('Failed to update formatted times:', err));

      const actionType = (timeOutTs && timeOutTs !== 0 && (!timeInTs || timeInTs === 0 || timeOutTs >= timeInTs)) ? 'TIME_OUT' : 'TIME_IN';
      const timestampStr = `${updated.date || dateStr} ${actionType === 'TIME_IN' ? formattedTimeIn : formattedTimeOut}`;

      // Update floating form with authoritative values
      setLastTapResult({ employee: { ...employee, ...updated }, action: actionType, timestamp: timestampStr, timeIn: formattedTimeIn, timeOut: formattedTimeOut });
    }).catch((err) => {
      console.error('RFID save error (transaction):', err);
      toast.error('Failed to save attendance record.');
    });
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!rfidInput.trim()) return;

    const query = rfidInput.trim().toLowerCase();
    const found = employees.find(emp =>
      emp.id.toLowerCase() === query ||
      (emp.rfidTag && emp.rfidTag.toLowerCase() === query) ||
      emp.name.toLowerCase().includes(query)
    );

    if (found) {
      handleRfidTap(found);
    } else {
      toast.error(`No employee found for: "${rfidInput}"`);
    }
    setRfidInput('');
  };

  const todayDateStr = new Date().toISOString().split('T')[0];
  const activeTodayEmployees = useMemo(() => {
    return employees.filter(emp => emp.timeIn && emp.timeIn !== '-');
  }, [employees, todayDateStr]);

  const filteredEmployees = useMemo(() => {
    if (!searchFilter.trim()) return employees;
    return employees.filter(emp =>
      emp.id.toLowerCase().includes(searchFilter.toLowerCase()) ||
      emp.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      (emp.rfidTag && emp.rfidTag.toLowerCase().includes(searchFilter.toLowerCase()))
    );
  }, [employees, searchFilter]);

  const timeString = currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const dateString = currentTime.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="dashboard-page" style={{ fontFamily: "'Outfit', sans-serif" }}>
      {/* Sidebar — OBA Green */}
      <aside className="sidebar-left">
        <div className="sidebar-logo">
          <img src="/logo.png" alt="OBA Logo" className="logo-badge" />
        </div>
        <nav className="sidebar-nav">
          <div className="nav-section">
            <div className="nav-title">Navigation</div>
            <ul>
              {onNavigate && (
                <>
                  <li className="nav-item" onClick={() => onNavigate('dashboard')}>🏠 Dashboard</li>
                  <li className="nav-item" onClick={() => onNavigate('employees')}>👥 Employees</li>
                  <li className="nav-item" onClick={() => onNavigate('inventory')}>🚛 Trip Manager</li>
                  <li className="nav-item" onClick={() => onNavigate('calendar')}>📅 Calendar</li>
                  <li className="nav-item" onClick={() => onNavigate('analytics')}>📊 Analytics</li>
                </>
              )}
            </ul>
          </div>

          <div className="nav-section">
            <div className="nav-title">RFID Terminal</div>
            <ul>
              <li className="nav-item active">🎴 Attendance Kiosk</li>
            </ul>
          </div>

          {/* Live Clock in Sidebar */}
          <div style={{
            marginTop: 'auto',
            paddingTop: '24px',
            borderTop: '1px solid rgba(255,255,255,0.2)'
          }}>
            <div style={{
              background: 'rgba(0,0,0,0.2)',
              borderRadius: '12px',
              padding: '16px',
              textAlign: 'center'
            }}>
              <div style={{
                fontSize: '28px',
                fontWeight: '800',
                color: 'white',
                letterSpacing: '1px',
                fontFamily: 'monospace'
              }}>
                {timeString}
              </div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.75)', marginTop: '4px', lineHeight: '1.4' }}>
                {dateString}
              </div>
            </div>
          </div>
        </nav>

        <button
          onClick={onBackToLogin}
          className="btn-logout"
          style={{ marginTop: '16px', width: '100%', textAlign: 'center' }}
        >
          🔒 System Login
        </button>
      </aside>

      {/* Main Content */}
      <main className="dashboard-main">
        <div className="dashboard-header-bar" />
        <div className="dashboard-content">

          {/* Page Header */}
          <header className="dashboard-header">
            <div>
              <h1 style={{ margin: 0, fontSize: '26px', fontWeight: '800', color: 'var(--text)' }}>
                🎴 Employee RFID Attendance Terminal
              </h1>
              <p style={{ margin: '4px 0 0 0', color: 'var(--text-light)', fontSize: '14px' }}>
                1st Tap = <span style={{ color: '#4CAF50', fontWeight: '600' }}>TIME IN</span> &nbsp;|&nbsp; 2nd Tap = <span style={{ color: '#f44336', fontWeight: '600' }}>TIME OUT</span>
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                padding: '8px 16px',
                backgroundColor: '#f0fdf4',
                border: '1px solid #bbf7d0',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '13px',
                color: 'var(--text-light)'
              }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#4CAF50', display: 'inline-block' }} />
                {activeTodayEmployees.length} Clocked In Today
              </div>
              {onNavigate && (
                <button
                  className="btn-logout"
                  onClick={() => onNavigate('employees')}
                >
                  👥 View All Employees
                </button>
              )}
            </div>
          </header>

          {/* Floating Tap Result Form */}
          {lastTapResult ? (
            <div style={{
              marginBottom: '18px',
              borderRadius: '12px',
              background: 'linear-gradient(180deg, rgba(255,255,255,0.98), rgba(250,250,250,0.95))',
              border: '1px solid #e6e6e6',
              padding: '12px 14px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.08)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div style={{ fontWeight: '700', color: '#222' }}>
                  {lastTapResult.action === 'TIME_IN' ? 'First Tap =' : 'Second Tap ='}
                </div>
                <div style={{ fontSize: '13px', color: '#666' }}>{lastTapResult.timestamp}</div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <label style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Name:</label>
                  <div style={{ fontWeight: '600', color: '#111' }}>{lastTapResult.employee.name}</div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <label style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Employee ID:</label>
                  <div style={{ fontWeight: '600', color: '#111' }}>{lastTapResult.employee.id}</div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <label style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Status:</label>
                  <div style={{ fontWeight: '600', color: '#111' }}>{lastTapResult.action === 'TIME_IN' ? 'Present' : 'Present'}</div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <label style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>{lastTapResult.action === 'TIME_IN' ? 'Time In:' : 'Time Out:'}</label>
                  <div style={{ fontWeight: '600', color: '#111' }}>{lastTapResult.action === 'TIME_IN' ? (lastTapResult.timeIn || '-') : (lastTapResult.timeOut || '-')}</div>
                </div>
              </div>
            </div>
          ) : (
            <div style={{
              marginBottom: '18px',
              borderRadius: '12px',
              background: '#f8fafc',
              border: '1px dashed #e6e6e6',
              padding: '12px 14px',
              color: '#666'
            }}>
              <div style={{ fontWeight: '600' }}>Ready for Card Tap</div>
              <div style={{ fontSize: '13px', marginTop: '4px' }}>Tap your RFID card on the scanner, or click an employee card below to record attendance.</div>
            </div>
          )}

          {/* Two Column Layout */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>

            {/* Left: Scanner Input + Card Simulator */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

              {/* USB RFID Scanner Input */}
              <div className="glass-panel" style={{
                borderRadius: '16px',
                padding: '24px',
                background: 'rgba(255,255,255,0.9)'
              }}>
                <h3 style={{ margin: '0 0 14px 0', fontSize: '15px', fontWeight: '700', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>📡</span> Hardware RFID Scanner
                </h3>
                <form onSubmit={handleFormSubmit} style={{ display: 'flex', gap: '10px' }}>
                  <input
                    ref={inputRef}
                    type="text"
                    value={rfidInput}
                    onChange={(e) => setRfidInput(e.target.value)}
                    placeholder="Tap RFID card or type Employee ID..."
                    style={{
                      flex: 1,
                      padding: '12px 16px',
                      borderRadius: '10px',
                      border: '1.5px solid var(--border)',
                      background: '#f8fafc',
                      fontSize: '14px',
                      color: 'var(--text)',
                      outline: 'none',
                      transition: 'border-color 0.2s'
                    }}
                    onFocus={(e) => { e.target.style.borderColor = 'var(--green)'; e.target.style.boxShadow = '0 0 0 3px rgba(4,171,12,0.1)'; }}
                    onBlur={(e) => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none'; }}
                  />
                  <button
                    type="submit"
                    className="btn-login"
                    style={{ margin: 0, width: 'auto', padding: '12px 20px', fontSize: '14px' }}
                  >
                    Tap ➤
                  </button>
                </form>
                <p style={{ margin: '10px 0 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
                  💡 Connect USB RFID scanner — this field auto-focuses for continuous card reading.
                </p>
              </div>

              {/* Card Simulator */}
              <div className="glass-panel" style={{
                borderRadius: '16px',
                padding: '24px',
                background: 'rgba(255,255,255,0.9)',
                flex: 1
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>💳</span> Quick Tap Simulator
                  </h3>
                  <input
                    type="text"
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    placeholder="Search employee..."
                    style={{
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--border)',
                      background: '#f8fafc',
                      fontSize: '12px',
                      width: '160px',
                      color: 'var(--text)',
                      outline: 'none'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '340px', overflowY: 'auto' }}>
                  {filteredEmployees.slice(0, 15).map(emp => {
                    const hasTimedIn = emp.timeIn && emp.timeIn !== '-';
                    const hasTimedOut = emp.timeOut && emp.timeOut !== '-';

                    let tapLabel = '🟢 Tap: Time IN';
                    let tapBg = '#e8f5e9';
                    let tapColor = '#2e7d32';
                    let tapBorder = '#4CAF50';

                    if (hasTimedIn && !hasTimedOut) {
                      tapLabel = '🔴 Tap: Time OUT';
                      tapBg = '#fff5f5';
                      tapColor = '#c62828';
                      tapBorder = '#f44336';
                    } else if (hasTimedIn && hasTimedOut) {
                      tapLabel = '🔄 New Shift';
                      tapBg = '#e3f2fd';
                      tapColor = '#1565c0';
                      tapBorder = '#2196F3';
                    }

                    return (
                      <div
                        key={emp.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '12px 14px',
                          borderRadius: '10px',
                          background: '#f8fafc',
                          border: '1px solid var(--border)',
                          cursor: 'pointer',
                          transition: 'all 0.15s',
                        }}
                        onClick={() => handleRfidTap(emp)}
                        onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--green)'; e.currentTarget.style.background = '#f0fdf4'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = '#f8fafc'; }}
                      >
                        <div>
                          <div style={{ fontWeight: '600', fontSize: '13px', color: 'var(--text)' }}>
                            {emp.name}
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                            {emp.id} · {emp.department}
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                            In: <strong>{emp.timeIn || '-'}</strong> &nbsp;|&nbsp; Out: <strong>{emp.timeOut || '-'}</strong>
                          </div>
                        </div>
                        <span style={{
                          padding: '6px 10px',
                          borderRadius: '20px',
                          backgroundColor: tapBg,
                          color: tapColor,
                          fontSize: '11px',
                          fontWeight: '700',
                          border: `1px solid ${tapBorder}`,
                          whiteSpace: 'nowrap',
                          flexShrink: 0,
                          marginLeft: '8px'
                        }}>
                          {tapLabel}
                        </span>
                      </div>
                    );
                  })}
                  {filteredEmployees.length === 0 && (
                    <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                      No employees found.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Today's Live Attendance Feed */}
            <div className="glass-panel" style={{
              borderRadius: '16px',
              padding: '24px',
              background: 'rgba(255,255,255,0.9)',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>📋</span> Today's Attendance Stream
                  </h3>
                  <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
                    Live log of employee check-ins · {activeTodayEmployees.length} total
                  </p>
                </div>
                <span style={{
                  padding: '4px 12px',
                  borderRadius: '20px',
                  backgroundColor: '#e8f5e9',
                  color: '#2e7d32',
                  fontSize: '12px',
                  fontWeight: '700',
                  border: '1px solid #4CAF50'
                }}>
                  🔴 LIVE
                </span>
              </div>

              <div style={{ flex: 1, overflowY: 'auto' }}>
                {activeTodayEmployees.length === 0 ? (
                  <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <div style={{ fontSize: '32px', marginBottom: '10px' }}>📭</div>
                    <div style={{ fontWeight: '600', color: 'var(--text-light)' }}>No attendance records yet today.</div>
                    <div style={{ fontSize: '13px', marginTop: '4px' }}>Tap an RFID card to begin.</div>
                  </div>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid var(--border)' }}>
                        <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Employee</th>
                        <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Dept.</th>
                        <th style={{ padding: '10px 12px', textAlign: 'center', fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Time In</th>
                        <th style={{ padding: '10px 12px', textAlign: 'center', fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Time Out</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeTodayEmployees.map((emp, idx) => (
                        <tr
                          key={emp.id}
                          style={{
                            borderBottom: '1px solid var(--border)',
                            backgroundColor: idx % 2 === 0 ? 'transparent' : '#fafafa',
                            transition: 'background-color 0.1s'
                          }}
                        >
                          <td style={{ padding: '12px' }}>
                            <div style={{ fontWeight: '600', fontSize: '13px', color: 'var(--text)' }}>{emp.name}</div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{emp.id}</div>
                          </td>
                          <td style={{ padding: '12px', fontSize: '13px', color: 'var(--text-light)' }}>
                            {emp.department}
                          </td>
                          <td style={{ padding: '12px', textAlign: 'center' }}>
                            {emp.timeIn && emp.timeIn !== '-' ? (
                              <span style={{
                                padding: '3px 10px',
                                borderRadius: '20px',
                                backgroundColor: '#e8f5e9',
                                color: '#2e7d32',
                                fontSize: '12px',
                                fontWeight: '600',
                                border: '1px solid #4CAF50'
                              }}>
                                {emp.timeIn}
                              </span>
                            ) : (
                              <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>—</span>
                            )}
                          </td>
                          <td style={{ padding: '12px', textAlign: 'center' }}>
                            {emp.timeOut && emp.timeOut !== '-' ? (
                              <span style={{
                                padding: '3px 10px',
                                borderRadius: '20px',
                                backgroundColor: '#fff5f5',
                                color: '#c62828',
                                fontSize: '12px',
                                fontWeight: '600',
                                border: '1px solid #f44336'
                              }}>
                                {emp.timeOut}
                              </span>
                            ) : (
                              <span style={{
                                padding: '3px 10px',
                                borderRadius: '20px',
                                backgroundColor: '#fff3e0',
                                color: '#e65100',
                                fontSize: '12px',
                                fontWeight: '600',
                                border: '1px solid #ff9800'
                              }}>
                                On Shift
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
