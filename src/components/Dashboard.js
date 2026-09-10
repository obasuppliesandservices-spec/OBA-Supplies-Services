import React, { useState, useEffect } from 'react';
import EventModal from './EventModal';
import CompletedDeliveries from './CompletedDeliveries';
import { getVisibleJobOrderEvents } from '../deliveryUtils';

function StatCard({ title, value, icon = '👥', onView }) {
  return (
    <div className="stat-card" style={{ position: 'relative', padding: '16px' }}>
      {onView && (
        <span
          onClick={onView}
          role="button"
          tabIndex={0}
          onKeyPress={(e) => { if (e.key === 'Enter' || e.key === ' ') onView(); }}
          style={{ position: 'absolute', top: '8px', right: '8px', color: '#007bff', textDecoration: 'underline', cursor: 'pointer', background: 'transparent', border: 'none', padding: 0 }}
        >
          View
        </span>
      )}
      <div className="stat-icon">{icon}</div>
      <div className="stat-value">{value}</div>
      <div className="stat-title">{title}</div>
    </div>
  );
}

export default function Dashboard({ user, onLogout, onNavigate, events, onMarkDone, onMarkDeliveryDone = onMarkDone, onStartContract, doneDeliveries = [], onUndoDone, unsuccessfulDeliveries = [], onMarkUnsuccessful, onUndoUnsuccessful, onAddEvent, onOpenJobOrderModal, jobOrders = [], onRemoveEvent, onRemoveDoneEvent, onRemoveUnsuccessfulEvent, onRemoveJobOrder, adminNotifications, setAdminNotifications, trips = [] }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalView, setModalView] = useState(null); // { title, items, onUndo }
  const [showNotifications, setShowNotifications] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showNotifications && !event.target.closest('.notifications-icon') && !event.target.closest('.notifications-dropdown')) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showNotifications]);

  const dummyCompletedByMonth = [90, 15, 75, 10, 120, 20, 40];
  const dummyUnsuccessfulByMonth = [2, 8, 1, 10, 3, 4, 2];
  const dummyEndedJobOrdersByMonth = [170, 30, 115, 20, 175, 45, 45];
  const dummyCompletedDeliveriesCount = dummyCompletedByMonth.reduce((total, value) => total + value, 0);
  const dummyUnsuccessfulDeliveriesCount = dummyUnsuccessfulByMonth.reduce((total, value) => total + value, 0);
  const dummyEndedJobOrdersCount = dummyEndedJobOrdersByMonth.reduce((total, value) => total + value, 0);
  const endedJobOrdersCount = dummyEndedJobOrdersCount + (doneDeliveries || []).filter(delivery => delivery?.status === 'completion').length;
  const completedDeliveriesCount = dummyCompletedDeliveriesCount + (doneDeliveries || []).filter(delivery => delivery?.status !== 'completion').length;
  const unsuccessfulDeliveriesCount = dummyUnsuccessfulDeliveriesCount + (unsuccessfulDeliveries || []).length;
  const dashboardJobOrderEvents = getVisibleJobOrderEvents({
    events,
    doneDeliveries,
    unsuccessfulDeliveries,
    trips
  });
  const currentDeliveries = (events || [])
    .filter(event => event.status === 'trip')
    .sort((firstEvent, secondEvent) => {
      const firstDate = new Date(firstEvent.createdAt || `${firstEvent.date || ''} ${firstEvent.time || ''}`).getTime();
      const secondDate = new Date(secondEvent.createdAt || `${secondEvent.date || ''} ${secondEvent.time || ''}`).getTime();
      const firstTimestamp = Number.isNaN(firstDate) ? Number(firstEvent.id) || 0 : firstDate;
      const secondTimestamp = Number.isNaN(secondDate) ? Number(secondEvent.id) || 0 : secondDate;
      return secondTimestamp - firstTimestamp;
    });
  const getDeliveryCreatedTime = (event) => {
    const createdDate = new Date(event.createdAt || event.id);
    return Number.isNaN(createdDate.getTime())
      ? event.time
      : createdDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleAddEvent = (eventData) => {
    onAddEvent(eventData);
    setModalOpen(false);
  };

  // Dynamic Chart Data Generation for Total Deliveries (Jan to Dec)
  const now = new Date();
  const currentYear = now.getFullYear();
  const chartData = [];

  // Initialize chart data for all 12 months of the current year
  for (let month = 0; month < 12; month++) {
    const d = new Date(currentYear, month, 1);
    chartData.push({
      label: d.toLocaleString('default', { month: 'short' }),
      monthKey: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      value: month < 7 ? dummyCompletedByMonth[month] + dummyUnsuccessfulByMonth[month] : 0
    });
  }

  // Aggregate completed deliveries by month
  if (doneDeliveries && doneDeliveries.length > 0) {
    doneDeliveries
      .filter(delivery => delivery?.status !== 'completion')
      .forEach(delivery => {
      if (delivery.date) {
        const deliveryDate = new Date(delivery.date);
        const deliveryMonth = `${deliveryDate.getFullYear()}-${String(deliveryDate.getMonth() + 1).padStart(2, '0')}`;
        const targetMonth = chartData.find(m => m.monthKey === deliveryMonth);
        if (targetMonth) {
          targetMonth.value += 1;
        }
      }
      });
  }

  // Aggregate unsuccessful deliveries by month
  if (unsuccessfulDeliveries && unsuccessfulDeliveries.length > 0) {
    unsuccessfulDeliveries.forEach(delivery => {
      if (delivery.date) {
        const deliveryDate = new Date(delivery.date);
        const deliveryMonth = `${deliveryDate.getFullYear()}-${String(deliveryDate.getMonth() + 1).padStart(2, '0')}`;
        const targetMonth = chartData.find(m => m.monthKey === deliveryMonth);
        if (targetMonth) {
          targetMonth.value += 1;
        }
      }
    });
  }

  const maxValue = Math.max(...chartData.map(d => d.value), 200);
  const roundedMax = Math.ceil(maxValue / 50) * 50;
  const deliveryStatusTotal = completedDeliveriesCount + unsuccessfulDeliveriesCount;
  const completedShare = deliveryStatusTotal ? completedDeliveriesCount / deliveryStatusTotal : 0;
  const pieCircumference = 2 * Math.PI * 70;

  const endedJobOrderTrend = Array.from({ length: 12 }, (_, month) => {
    const monthDate = new Date(currentYear, month, 1);
    return {
      label: monthDate.toLocaleString('default', { month: 'short' }),
      monthKey: `${currentYear}-${String(month + 1).padStart(2, '0')}`,
      value: month < 7 ? dummyEndedJobOrdersByMonth[month] : 0
    };
  });

  (doneDeliveries || [])
    .filter(delivery => delivery?.status === 'completion')
    .forEach(delivery => {
      const completionDate = new Date(delivery.deliveredAt || delivery.completionDate || delivery.date);
      if (Number.isNaN(completionDate.getTime()) || completionDate.getFullYear() !== currentYear) return;
      const month = endedJobOrderTrend[completionDate.getMonth()];
      if (month) month.value += 1;
    });

  const endedTrendMax = Math.max(...endedJobOrderTrend.map(month => month.value), 1);
  const endedTrendWidth = 760;
  const endedTrendHeight = 250;
  const endedTrendLeft = 42;
  const endedTrendRight = 22;
  const endedTrendTop = 28;
  const endedTrendBottom = 198;
  const endedTrendStep = (endedTrendWidth - endedTrendLeft - endedTrendRight) / 11;
  const endedTrendPoints = endedJobOrderTrend.map((month, index) => ({
    ...month,
    x: endedTrendLeft + index * endedTrendStep,
    y: endedTrendBottom - (month.value / endedTrendMax) * (endedTrendBottom - endedTrendTop)
  }));
  const endedTrendLine = endedTrendPoints.map(point => `${point.x},${point.y}`).join(' ');
  const endedTrendArea = `${endedTrendLeft},${endedTrendBottom} ${endedTrendLine} ${endedTrendWidth - endedTrendRight},${endedTrendBottom}`;
  const currentMonthIndex = new Date().getMonth();
  const currentTrendPoint = endedTrendPoints[currentMonthIndex];

  const endedOrdersChartMonths = endedJobOrderTrend;
  const endedOrdersChartMax = Math.max(200, ...endedOrdersChartMonths.map(month => month.value || 0));
  const endedOrdersChartWidth = 900;
  const endedOrdersChartHeight = 220;
  const endedOrdersChartPadding = { top: 16, right: 20, bottom: 30, left: 42 };
  const endedOrdersChartInnerWidth = endedOrdersChartWidth - endedOrdersChartPadding.left - endedOrdersChartPadding.right;
  const endedOrdersChartInnerHeight = endedOrdersChartHeight - endedOrdersChartPadding.top - endedOrdersChartPadding.bottom;
  const endedOrdersChartPoints = (values) => values.map((value, index) => {
    const x = endedOrdersChartPadding.left + (index * endedOrdersChartInnerWidth) / Math.max(values.length - 1, 1);
    const y = endedOrdersChartPadding.top + endedOrdersChartInnerHeight - (value / endedOrdersChartMax) * endedOrdersChartInnerHeight;
    return { x, y, value };
  });
  const endedOrdersActualPoints = endedOrdersChartPoints(endedOrdersChartMonths.map(month => Math.max(0, month.value || 0)));
  const endedOrdersActualLine = endedOrdersActualPoints.map(point => `${point.x},${point.y}`).join(' ');

  const graphBottom = 245;
  const graphTop = 25;
  const graphHeight = graphBottom - graphTop;
  const scale = graphHeight / roundedMax;

  // X-axis offsets for 12 months
  const xOffsets = [42, 76, 110, 144, 178, 212, 246, 280, 314, 348, 382, 416];

  return (
    <div className="dashboard-page">
      <aside className="sidebar-left">
        <div className="sidebar-logo">
          <img src="logo.png" alt="OBA Logo" className="logo-badge" />
        </div>
        <nav className="sidebar-nav">
          <div className="nav-section">
            <div className="nav-title">General</div>
            <ul>
              <li className="nav-item active" onClick={() => onNavigate('dashboard')}>Dashboard </li>
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
              <li className="nav-item" onClick={() => onNavigate('settings')}>Settings</li>
            </ul>
          </div>
        </nav>
      </aside>

      <main className="dashboard-main">
        <div className="dashboard-header-bar"></div>
        <div className="dashboard-content">
          <header className="dashboard-header">
            <h1>Overview</h1>
            <div className="header-right">
              <div className="notifications-icon mobile-header-notification" onClick={() => setShowNotifications(!showNotifications)} style={{ position: 'relative', cursor: 'pointer', marginRight: '16px' }}>
                🔔
                {adminNotifications && adminNotifications.filter(n => !n.read).length > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: '-8px',
                    right: '-8px',
                    backgroundColor: 'red',
                    color: 'white',
                    borderRadius: '50%',
                    width: '18px',
                    height: '18px',
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {adminNotifications.filter(n => !n.read).length}
                  </span>
                )}
              </div>
              <div className="user-greeting">
                <span className="avatar-icon">👤</span>
                <span>Hello Admin</span>
              </div>
              <button className="btn-logout" onClick={onLogout}>Logout</button>
            </div>
          </header>

          {showNotifications && (
            <div className="notifications-dropdown" style={{
              position: 'absolute',
              top: '60px',
              right: '20px',
              width: '300px',
              backgroundColor: 'white',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              zIndex: 1000,
              maxHeight: '400px',
              overflowY: 'auto'
            }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid #eee', fontWeight: 'bold' }}>Notifications</div>
              {(!adminNotifications || adminNotifications.length === 0) ? (
                <div style={{ padding: '16px', color: '#666', textAlign: 'center', fontSize: '14px' }}>No notifications</div>
              ) : (
                adminNotifications.map(notif => (
                  <div 
                    key={notif.id}
                    onClick={() => {
                      if (setAdminNotifications) {
                        setAdminNotifications(adminNotifications.map(n => n.id === notif.id ? { ...n, read: true } : n));
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
                    <div style={{ fontWeight: '600', marginBottom: '4px', fontSize: '14px' }}>{notif.title}</div>
                    <div style={{ fontSize: '13px', color: '#666' }}>{notif.message}</div>
                    <div style={{ fontSize: '11px', color: '#999', marginTop: '6px' }}>{new Date(notif.date).toLocaleString()}</div>
                  </div>
                ))
              )}
            </div>
          )}

          <section className="stats-section">
            <StatCard
              title="Total Deliveries"
              value={completedDeliveriesCount + unsuccessfulDeliveriesCount}
              onView={() => setModalView({ title: 'Total Deliveries', items: [
                ...(doneDeliveries || []).filter(d => d?.status !== 'completion'),
                ...(unsuccessfulDeliveries || [])
              ], onUndo: onUndoDone })}
            />
            <StatCard
              title="Delivery Completed"
              value={completedDeliveriesCount}
              onView={() => setModalView({ title: 'Completed Deliveries', items: (doneDeliveries || []).filter(d => d?.status !== 'completion'), onUndo: onUndoDone })}
            />
            <StatCard
              title="Unsuccessful Deliveries"
              value={unsuccessfulDeliveriesCount}
              onView={() => setModalView({ title: 'Unsuccessful Deliveries', items: unsuccessfulDeliveries || [], onUndo: onUndoUnsuccessful })}
            />
            <StatCard
              title="Ended Job Orders"
              value={endedJobOrdersCount}
              onView={() => setModalView({ title: 'Ended Job Orders', items: [ ...(jobOrders || []).filter(j => j.status === 'completion'), ...(doneDeliveries || []).filter(d => d?.status === 'completion') ], onUndo: null })}
            />
          </section>

        

          <div className="overview-sections">
          <section className="meetings-section">
          
              <div className="meetings-header">
                <h3>Deliveries</h3>
                
              </div>
              <div className="meeting-list deliveries-list">
                  {currentDeliveries.length === 0 ? (
                  <p style={{ padding: '12px' }}>No Deliveries scheduled.</p>
                ) : (
                    currentDeliveries.map(event => (
                    <div key={event.id} className="meeting-item">
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span className="meeting-name">{event.name}</span>
                        <div style={{ display: 'flex', gap: '8px', fontSize: '13px', color: '#555' }}>
                          {event.driver && <span className="meeting-driver">Driver: {event.driver}</span>}
                          
                          {event.truckNumber && <span className="meeting-plate">Truck: {event.truckNumber}</span>}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <span className="meeting-time">{getDeliveryCreatedTime(event)}</span>
                        <span className="meeting-date">📅{new Date(event.date).toLocaleDateString()}</span>
                        <button className="btn-remove" onClick={() => onMarkDeliveryDone(event.id)}>Done</button>
                        <button
                          className="btn-unsuccessful"
                          onClick={() => onMarkUnsuccessful && onMarkUnsuccessful(event.id)}
                          style={{ backgroundColor: '#8a2be2', color: '#fff', border: 'none', padding: '6px 10px', borderRadius: '4px', cursor: 'pointer' }}
                        >
                          Unsuccessful
                        </button>
                        
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

           
          

          <section className="meetings-section">
              <div className="meetings-header">
                <h3>Job Orders</h3>
              </div>

              <div className="meeting-list job-orders-list">
                {dashboardJobOrderEvents.length === 0 ? (
                  <p style={{ padding: '12px' }}>No Job Order Scheduled.</p>
                ) : (
                  dashboardJobOrderEvents.map(event => (
                    <div key={event.id} className="meeting-item">
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span className="meeting-name">{event.name}</span>
                        <div style={{ display: 'flex', gap: '8px', fontSize: '13px', color: '#555' }}>
                          {event.manpower && <span className="meeting-driver">👥 {event.manpower} workers</span>}
                          {event.jobType && <span className="meeting-plate">Type: {event.jobType}</span>}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <span className="meeting-time">{event.time}</span>
                        <span className="meeting-date">📅 {new Date(event.date).toLocaleDateString()}</span>
                        {event.status === 'active' && (
                          <button className="btn-start" onClick={() => onStartContract(event.id)}>Start Contract</button>
                          
                        )}
                        {event.status === 'started' && (
                          <button className="btn-started" disabled>Contract Started</button>
                        )}
                        {event.status === 'completion' && (
                          <button className="btn-end" onClick={() => onMarkDone(event.id)}>End Contract</button>
                        )}
                        
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
    





          <div className="dashboard-charts">
            <section className="chart-section">
              <h3>Total Delivery Chart</h3>
              <div className="chart-placeholder">
              <svg width="100%" height="320" viewBox="0 0 500 320" preserveAspectRatio="xMidYMid meet" style={{ display: 'block', marginTop: '0' }}>
                <style>
                  {`
                    .chart-bars rect {
                      transition: opacity 0.3s ease, y 0.3s ease;
                      cursor: pointer;
                    }
                    .chart-bars rect:hover {
                      opacity: 0.8;
                    }
                  `}
                </style>
                <defs>
                  {/* Subtle horizontal grid lines */}
                  <pattern id="grid" width="500" height="50" patternUnits="userSpaceOnUse">
                    <path d="M 500 0 L 0 0 0 50" fill="none" stroke="#e9ecef" strokeWidth="1" />
                  </pattern>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#159ee8" />
                    <stop offset="100%" stopColor="#d9f1ff" />
                  </linearGradient>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />

                {/* Y-axis labels positioned neatly outside */}
                <text x="492" y={graphBottom + 4} textAnchor="end" fontSize="11" fill="#a5acbb">0</text>
                <text x="492" y={graphBottom - (graphHeight * 0.25) + 4} textAnchor="end" fontSize="11" fill="#a5acbb">{roundedMax * 0.25}</text>
                <text x="492" y={graphBottom - (graphHeight * 0.5) + 4} textAnchor="end" fontSize="11" fill="#a5acbb">{roundedMax * 0.5}</text>
                <text x="492" y={graphBottom - (graphHeight * 0.75) + 4} textAnchor="end" fontSize="11" fill="#a5acbb">{roundedMax * 0.75}</text>
                <text x="492" y={graphTop + 4} textAnchor="end" fontSize="11" fill="#a5acbb">{roundedMax}</text>

                {/* Axes */}
                <line x1="42" y1={graphBottom} x2="460" y2={graphBottom} stroke="#edf0f5" strokeWidth="2" />

                {/* X-axis labels for months */}
                {chartData.map((data, idx) => (
                  <text key={`xl-${idx}`} x={xOffsets[idx] + 8} y="285" textAnchor="middle" fontSize="11" fill="#a5acbb" fontWeight="600">{data.label}</text>
                ))}

                {/* Interactive Bars */}
                <g className="chart-bars">
                  {chartData.map((data, idx) => {
                    const barHeight = data.value * scale;
                    const yPos = graphBottom - barHeight;
                    return (
                      <rect key={`bar-${idx}`} x={xOffsets[idx] + 5} y={yPos} width="16" height={barHeight} rx="8" fill="url(#barGradient)">
                        <title>{`${data.label}: ${data.value} total deliveries`}</title>
                      </rect>
                    );
                  })}
                </g>

              </svg>
              </div>
            </section>

            <section className="delivery-pie-section">
              <h3>Delivery Status</h3>
              <div className="delivery-pie-chart">
                <svg viewBox="0 0 180 180" role="img" aria-label="Completed and unsuccessful deliveries">
                  <circle cx="90" cy="90" r="70" fill="none" stroke="#edf3f8" strokeWidth="24" />
                  {deliveryStatusTotal > 0 && (
                    <>
                      <circle
                        cx="90"
                        cy="90"
                        r="70"
                        fill="none"
                        stroke="#159ee8"
                        strokeWidth="24"
                        strokeDasharray={`${completedShare * pieCircumference} ${pieCircumference}`}
                        transform="rotate(-90 90 90)"
                      >
                        <title>{`Completed: ${completedDeliveriesCount} of ${deliveryStatusTotal} total deliveries`}</title>
                      </circle>
                      <circle
                        cx="90"
                        cy="90"
                        r="70"
                        fill="none"
                        stroke="#f5a623"
                        strokeWidth="24"
                        strokeDasharray={`${(1 - completedShare) * pieCircumference} ${pieCircumference}`}
                        strokeDashoffset={-completedShare * pieCircumference}
                        transform="rotate(-90 90 90)"
                      >
                        <title>{`Unsuccessful: ${unsuccessfulDeliveriesCount} of ${deliveryStatusTotal} total deliveries`}</title>
                      </circle>
                    </>
                  )}
                  <text x="90" y="86" textAnchor="middle" className="pie-total">{deliveryStatusTotal}</text>
                  <text x="90" y="104" textAnchor="middle" className="pie-total-label">Total</text>
                </svg>
              </div>
              <div className="pie-legend">
                <span><i className="pie-dot completed-dot"></i>Completed <strong>{completedDeliveriesCount}</strong></span>
                <span><i className="pie-dot unsuccessful-dot"></i>Unsuccessful <strong>{unsuccessfulDeliveriesCount}</strong></span>
              </div>
            </section>
          </div>

          <section className="ended-orders-trend-section">
            <div className="ended-orders-trend-header">
              <div>
                <h3>Ended Job Orders</h3>
                <p>Monthly contract completions</p>
              </div>
              <strong>{endedJobOrdersCount}</strong>
            </div>
            <div className="ended-orders-trend-chart" style={{ width: '100%', overflow: 'hidden', padding: '0 0 8px' }}>
              <svg viewBox={`0 0 ${endedOrdersChartWidth} ${endedOrdersChartHeight}`} role="img" aria-label={`Ended job orders by month for ${currentYear}`} preserveAspectRatio="xMidYMid meet" style={{ width: '100%', height: '220px', display: 'block' }}>
                <defs>
                  <linearGradient id="endedOrdersLineBlue" x1="0" x2="1" y1="0" y2="0">
                    <stop offset="0%" stopColor="#2f7ef7" />
                    <stop offset="100%" stopColor="#5ab4ff" />
                  </linearGradient>
                </defs>

                {[0, 50, 100, 150, 200].map((tick) => {
                  const y = endedOrdersChartPadding.top + endedOrdersChartInnerHeight - (tick / endedOrdersChartMax) * endedOrdersChartInnerHeight;
                  return (
                    <g key={`tick-${tick}`}>
                      <line x1={endedOrdersChartPadding.left} x2={endedOrdersChartWidth - endedOrdersChartPadding.right} y1={y} y2={y} stroke="#e8eef5" strokeWidth="1" />
                      <text x={8} y={y + 4} fontSize="11" fill="#7b8795" fontWeight="600">{tick}</text>
                    </g>
                  );
                })}

                {endedOrdersActualPoints.map((point, index) => {
                  const x = point.x;
                  return (
                    <g key={`month-label-${index}`}>
                      <line x1={x} x2={x} y1={endedOrdersChartPadding.top + endedOrdersChartInnerHeight} y2={endedOrdersChartPadding.top + endedOrdersChartInnerHeight + 5} stroke="#c8d2d9" strokeWidth="1" />
                      <text x={x} y={endedOrdersChartHeight - 8} textAnchor="middle" fontSize="11" fill="#7b8795" fontWeight="600">{endedOrdersChartMonths[index]?.label || ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][index]}</text>
                    </g>
                  );
                })}

                <polyline
                  points={endedOrdersActualLine}
                  fill="none"
                  stroke="url(#endedOrdersLineBlue)"
                  strokeWidth="3"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />

                {endedOrdersActualPoints.map((point, index) => (
                  <g key={`actual-dot-${index}`}>
                    <circle cx={point.x} cy={point.y} r="4.5" fill="#ffffff" stroke="#2f7ef7" strokeWidth="2.5" />
                    <title>{`${endedOrdersChartMonths[index]?.label || 'Month'}: ${point.value} ended job orders`}</title>
                  </g>
                ))}
              </svg>
            </div>
          </section>
        </div>
      </main>

      {modalOpen && (
        <EventModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          onSave={handleAddEvent}
          eventToEdit={null}
          events={events}
        />
      )}
      {modalView && (
        <CompletedDeliveries title={modalView.title} items={modalView.items} onClose={() => setModalView(null)} onUndo={modalView.onUndo} />
      )}
    </div>
  );
}
