import React, { useState, useMemo } from 'react';
import toast from 'react-hot-toast';

const LOCATION_DISTANCES = {
  'manila': { distance: 15, duration: '45 mins', region: 'Metro Manila' },
  'quezon city': { distance: 22, duration: '55 mins', region: 'Metro Manila' },
  'makati': { distance: 12, duration: '35 mins', region: 'Metro Manila' },
  'pasig': { distance: 18, duration: '45 mins', region: 'Metro Manila' },
  'taguig': { distance: 16, duration: '40 mins', region: 'Metro Manila' },
  'mandaluyong': { distance: 14, duration: '35 mins', region: 'Metro Manila' },
  'pasay': { distance: 10, duration: '30 mins', region: 'Metro Manila' },
  'paranaque': { distance: 18, duration: '40 mins', region: 'Metro Manila' },
  'las pinas': { distance: 24, duration: '50 mins', region: 'Metro Manila' },
  'muntinlupa': { distance: 28, duration: '55 mins', region: 'Metro Manila' },
  'caloocan': { distance: 26, duration: '1 hr 10 mins', region: 'Metro Manila' },
  'valenzuela': { distance: 28, duration: '1 hr 15 mins', region: 'Metro Manila' },
  'cavite': { distance: 45, duration: '1 hr 30 mins', region: 'Calabarzon' },
  'bacoor': { distance: 32, duration: '1 hr 10 mins', region: 'Calabarzon' },
  'dasmarinas': { distance: 48, duration: '1 hr 35 mins', region: 'Calabarzon' },
  'laguna': { distance: 55, duration: '1 hr 40 mins', region: 'Calabarzon' },
  'santa rosa': { distance: 42, duration: '1 hr 20 mins', region: 'Calabarzon' },
  'calamba': { distance: 58, duration: '1 hr 45 mins', region: 'Calabarzon' },
  'batangas': { distance: 95, duration: '2 hrs 30 mins', region: 'Calabarzon' },
  'lipa': { distance: 82, duration: '2 hrs 10 mins', region: 'Calabarzon' },
  'bulacan': { distance: 40, duration: '1 hr 20 mins', region: 'Central Luzon' },
  'meycauayan': { distance: 32, duration: '1 hr 05 mins', region: 'Central Luzon' },
  'malolos': { distance: 46, duration: '1 hr 30 mins', region: 'Central Luzon' },
  'pampanga': { distance: 80, duration: '2 hrs 15 mins', region: 'Central Luzon' },
  'angeles': { distance: 85, duration: '2 hrs 20 mins', region: 'Central Luzon' },
  'san fernando': { distance: 75, duration: '2 hrs 00 mins', region: 'Central Luzon' }
};

export const getTravelMetrics = (address = '') => {
  if (!address) return { locationName: 'Metro Manila Hub', distance: 15, duration: '40 mins', region: 'Metro Manila' };
  const lower = address.toLowerCase();
  
  for (const [key, val] of Object.entries(LOCATION_DISTANCES)) {
    if (lower.includes(key)) {
      const formattedKey = key.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      return { locationName: formattedKey, ...val };
    }
  }
  
  // Deterministic fallback for custom addresses
  let hash = 0;
  for (let i = 0; i < address.length; i++) {
    hash = (hash << 5) - hash + address.charCodeAt(i);
    hash |= 0;
  }
  const calcDist = Math.abs(hash % 65) + 12;
  const hours = Math.floor(calcDist / 35);
  const mins = (calcDist % 35) + 15;
  const durStr = hours > 0 ? `${hours} hr ${mins} mins` : `${mins} mins`;
  
  const parts = address.split(',').map(w => w.trim()).filter(Boolean);
  const locName = parts[parts.length - 1] || parts[0] || 'Client Destination';
  
  return { locationName: locName, distance: calcDist, duration: durStr, region: 'Regional' };
};

export default function ReportsAnalytics({
  user,
  onLogout,
  onNavigate,
  jobOrders = [],
  trips = [],
  doneDeliveries = [],
  unsuccessfulDeliveries = [],
  trucks = [],
  isSubView = false
}) {
  const [dateFilter, setDateFilter] = useState('All');

  // Filtered dataset based on selected time window
  const filteredJobOrders = useMemo(() => {
    if (dateFilter === 'All') return jobOrders;
    const now = new Date();
    const days = dateFilter === '30Days' ? 30 : dateFilter === '7Days' ? 7 : 365;
    const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    return jobOrders.filter(order => {
      if (!order.startDate) return true;
      return new Date(order.startDate) >= cutoff;
    });
  }, [jobOrders, dateFilter]);

  // Overall KPIs
  const totalShipments = trips.length || filteredJobOrders.filter(o => o.status === 'assigned' || o.status === 'ready_for_dispatch').length;
  const completedCount = doneDeliveries.filter(d => d.status !== 'completion').length;
  const unsuccessfulCount = unsuccessfulDeliveries.length;
  const totalDeliveries = completedCount + unsuccessfulCount;
  const successRate = totalDeliveries > 0 ? Math.round((completedCount / totalDeliveries) * 100) : 100;

  // Travel distance & length computations
  const travelReports = useMemo(() => {
    return filteredJobOrders.map(order => {
      const metrics = getTravelMetrics(order.address);
      const assignedTrip = trips.find(t => (t.selectedJobOrders || []).includes(order.id) || t.jobOrderId === order.id);
      
      return {
        id: order.id,
        customerName: order.customerName || 'Client',
        company: order.company || 'OBA Partner',
        address: order.address || 'Standard Location',
        jobType: order.jobType || 'Delivery',
        status: order.status || 'Pending',
        locationName: metrics.locationName,
        distance: metrics.distance,
        duration: metrics.duration,
        region: metrics.region,
        truckNumber: assignedTrip ? assignedTrip.truckNumber : 'TRK-001',
        driver: assignedTrip ? assignedTrip.driver : 'Assigned Driver'
      };
    });
  }, [filteredJobOrders, trips]);

  const totalTravelKm = useMemo(() => {
    return travelReports.reduce((sum, item) => sum + item.distance, 0);
  }, [travelReports]);

  const avgTravelKm = travelReports.length > 0 ? Math.round(totalTravelKm / travelReports.length) : 0;

  // Client Locations breakdown
  const locationBreakdown = useMemo(() => {
    const counts = {};
    travelReports.forEach(item => {
      const loc = item.locationName;
      if (!counts[loc]) {
        counts[loc] = { name: loc, region: item.region, count: 0, totalKm: 0, clients: new Set() };
      }
      counts[loc].count += 1;
      counts[loc].totalKm += item.distance;
      counts[loc].clients.add(item.customerName);
    });

    return Object.values(counts).sort((a, b) => b.count - a.count);
  }, [travelReports]);

  // Monthly trends calculation
  const monthData = useMemo(() => {
    const months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - (5 - i));
      return {
        label: d.toLocaleString('default', { month: 'short' }),
        key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
        shipments: 0,
        deliveries: 0
      };
    });

    filteredJobOrders.forEach(order => {
      const d = order.startDate ? new Date(order.startDate) : new Date();
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const m = months.find(item => item.key === key);
      if (m) {
        m.shipments += 1;
        if (order.status === 'assigned' || order.status === 'ready_for_dispatch' || order.status === 'approved') {
          m.deliveries += 1;
        }
      }
    });

    return months;
  }, [filteredJobOrders]);

  const maxMonthValue = Math.max(...monthData.map(m => Math.max(m.shipments, m.deliveries)), 1);

  const handleGenerateReport = () => {
    const completedDeliveries = doneDeliveries.filter(delivery => delivery.status !== 'completion');
    const endedJobOrders = doneDeliveries.filter(delivery => delivery.status === 'completion');
    const totalDeliveryItems = [...completedDeliveries, ...unsuccessfulDeliveries];
    const getItemType = (item) => item.jobType || item.type || item.serviceType || 'Delivery';
    const escapeCell = (value) => String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const maxItems = Math.max(totalDeliveryItems.length, completedDeliveries.length, unsuccessfulDeliveries.length, endedJobOrders.length, 1);
    const itemRows = Array.from({ length: maxItems }, (_, index) => {
      const getCells = (items) => items[index]
        ? `<td>${index + 1}. ${escapeCell(getItemType(items[index]))}</td>`
        : '<td></td>';
      return `<tr>${getCells(totalDeliveryItems)}${getCells(completedDeliveries)}${getCells(unsuccessfulDeliveries)}${getCells(endedJobOrders)}</tr>`;
    }).join('');
    const reportDate = new Date().toLocaleDateString();
    const report = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head><meta charset="UTF-8" /></head>
        <body>
          <table border="1" cellspacing="0" cellpadding="2">
            <tr><th colspan="4">OBA Supplies&amp;Services Overview Report</th></tr>
            <tr><td>Report Date</td><td colspan="3">${escapeCell(reportDate)}</td></tr>
            <tr><td>Filter Window</td><td colspan="3">${escapeCell(dateFilter === 'All' ? 'All Time Overview' : dateFilter === '30Days' ? 'Last 30 Days' : 'Last 7 Days')}</td></tr>
            <tr><th>Total Deliveries:</th><th>Delivery Completed:</th><th>Unsuccessful Deliveries:</th><th>Ended Job Orders:</th></tr>
            ${itemRows}
          </table>
        </body>
      </html>`;
    const blob = new Blob([report], { type: 'application/vnd.ms-excel' });
    const downloadUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `oba-overview-report-${new Date().toISOString().slice(0, 10)}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(downloadUrl);
    toast.success('Excel report generated successfully.');
  };

  const mainContent = (
    <div style={{ padding: '20px 0', animation: 'fadeIn 0.2s' }}>
      {/* Top Filter and Actions Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', backgroundColor: 'white', padding: '16px 24px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontWeight: 'bold', color: '#333', fontSize: '14px' }}>📅 Filter Window:</span>
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            style={{ padding: '8px 14px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '13px', backgroundColor: '#fdfdfd', fontWeight: '500' }}
          >
            <option value="All">All Time Overview</option>
            <option value="30Days">Last 30 Days</option>
            <option value="7Days">Last 7 Days</option>
          </select>
        </div>

        <button
          onClick={handleGenerateReport}
          style={{ padding: '10px 20px', backgroundColor: '#04ab0c', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          📄 Generate Report
        </button>
      </div>

      {/* KPI Cards Section */}
      <section className="stats-section" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '24px' }}>
        <div className="stat-card" style={{ backgroundColor: '#fff', borderRadius: '14px', padding: '22px', boxShadow: '0 4px 16px rgba(0,0,0,0.04)', borderLeft: '4px solid #1976d2' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '14px', color: '#666', fontWeight: '600' }}>Total Shipments</span>
            <span style={{ fontSize: '26px' }}>📦</span>
          </div>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#1976d2', marginTop: '8px' }}>{totalShipments}</div>
          <div style={{ fontSize: '12px', color: '#888', marginTop: '6px' }}>Active and completed dispatches</div>
        </div>

        <div className="stat-card" style={{ backgroundColor: '#fff', borderRadius: '14px', padding: '22px', boxShadow: '0 4px 16px rgba(0,0,0,0.04)', borderLeft: '4px solid #2e7d32' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '14px', color: '#666', fontWeight: '600' }}>Deliveries Handled</span>
            <span style={{ fontSize: '26px' }}>🚚</span>
          </div>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#2e7d32', marginTop: '8px' }}>
            {completedCount} <span style={{ fontSize: '16px', color: '#4caf50', fontWeight: 'normal' }}>({successRate}% success)</span>
          </div>
          <div style={{ fontSize: '12px', color: '#888', marginTop: '6px' }}>{unsuccessfulCount} marked unsuccessful</div>
        </div>

        <div className="stat-card" style={{ backgroundColor: '#fff', borderRadius: '14px', padding: '22px', boxShadow: '0 4px 16px rgba(0,0,0,0.04)', borderLeft: '4px solid #ed6c02' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '14px', color: '#666', fontWeight: '600' }}>Length of Travel</span>
            <span style={{ fontSize: '26px' }}>🛣️</span>
          </div>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#ed6c02', marginTop: '8px' }}>{totalTravelKm} km</div>
          <div style={{ fontSize: '12px', color: '#888', marginTop: '6px' }}>Avg {avgTravelKm} km per shipment trip</div>
        </div>

        <div className="stat-card" style={{ backgroundColor: '#fff', borderRadius: '14px', padding: '22px', boxShadow: '0 4px 16px rgba(0,0,0,0.04)', borderLeft: '4px solid #9c27b0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '14px', color: '#666', fontWeight: '600' }}>Client Locations</span>
            <span style={{ fontSize: '26px' }}>📍</span>
          </div>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#9c27b0', marginTop: '8px' }}>{locationBreakdown.length}</div>
          <div style={{ fontSize: '12px', color: '#888', marginTop: '6px' }}>Unique delivery destinations</div>
        </div>
      </section>

      {/* Main Charts & Visual Highlights */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', marginBottom: '28px' }}>
        {/* Shipment & Delivery Volume Trends */}
        <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '18px', color: '#333' }}>📊 Shipment & Delivery Trends</h3>
              <p style={{ margin: '4px 0 0', color: '#777', fontSize: '13px' }}>Monthly volume breakdown of scheduled shipments vs dispatches.</p>
            </div>
            <div style={{ display: 'flex', gap: '16px', fontSize: '12px', fontWeight: 'bold' }}>
              <span style={{ color: '#1976d2' }}>■ Total Orders</span>
              <span style={{ color: '#04ab0c' }}>■ Active Dispatches</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-end', height: '220px', padding: '20px 10px 10px 10px', borderBottom: '1px solid #eee' }}>
            {monthData.map(m => {
              const hShip = Math.max((m.shipments / maxMonthValue) * 170, 8);
              const hDeliv = Math.max((m.deliveries / maxMonthValue) * 170, 8);
              return (
                <div key={m.key} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'flex-end', width: '100%', justifyContent: 'center' }}>
                    <div style={{ width: '18px', height: `${hShip}px`, backgroundColor: '#1976d2', borderRadius: '4px 4px 0 0' }} title={`${m.shipments} total orders`} />
                    <div style={{ width: '18px', height: `${hDeliv}px`, backgroundColor: '#04ab0c', borderRadius: '4px 4px 0 0' }} title={`${m.deliveries} dispatches`} />
                  </div>
                  <span style={{ marginTop: '12px', fontSize: '12px', color: '#666', fontWeight: '500' }}>{m.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Client Locations Distribution */}
        <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
          <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', color: '#333' }}>📍 Client Location Distribution</h3>
          <p style={{ margin: '0 0 20px 0', color: '#777', fontSize: '13px' }}>Most active delivery destinations.</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxHeight: '240px', overflowY: 'auto' }}>
            {locationBreakdown.slice(0, 5).map(loc => {
              const maxCount = locationBreakdown[0]?.count || 1;
              const pct = Math.round((loc.count / maxCount) * 100);

              return (
                <div key={loc.name}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 'bold', marginBottom: '4px' }}>
                    <span>{loc.name} ({loc.region})</span>
                    <span style={{ color: '#04ab0c' }}>{loc.count} shipment{loc.count > 1 ? 's' : ''}</span>
                  </div>
                  <div style={{ width: '100%', height: '8px', backgroundColor: '#f0f0f0', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', backgroundColor: '#04ab0c', borderRadius: '4px' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Length of Travel & Destination Log Table */}
      <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '18px', color: '#333' }}>🛣️ Shipment Travel Length & Client Locations Report</h3>
            <p style={{ margin: '4px 0 0', color: '#777', fontSize: '13px' }}>Detailed breakdown of delivery distance, travel time, assigned vehicle, and destination location.</p>
          </div>
          <span style={{ fontSize: '13px', color: '#555', fontWeight: 'bold' }}>{travelReports.length} records analyzed</span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: '#f9f9f9', borderBottom: '2px solid #eee' }}>
                <th style={{ padding: '12px 14px', color: '#555', fontSize: '13px' }}>Client / Customer</th>
                <th style={{ padding: '12px 14px', color: '#555', fontSize: '13px' }}>Delivery Address</th>
                <th style={{ padding: '12px 14px', color: '#555', fontSize: '13px' }}>Destination Hub</th>
                <th style={{ padding: '12px 14px', color: '#555', fontSize: '13px' }}>Length of Travel</th>
                <th style={{ padding: '12px 14px', color: '#555', fontSize: '13px' }}>Est. Travel Time</th>
                <th style={{ padding: '12px 14px', color: '#555', fontSize: '13px' }}>Vehicle</th>
                <th style={{ padding: '12px 14px', color: '#555', fontSize: '13px' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {travelReports.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ padding: '24px', textAlign: 'center', color: '#999' }}>No shipment reports available for this filter.</td>
                </tr>
              ) : (
                travelReports.map((report, idx) => (
                  <tr key={report.id || idx} style={{ borderBottom: '1px solid #f0f0f0' }}>
                    <td style={{ padding: '14px', fontWeight: 'bold', color: '#333' }}>
                      {report.customerName}
                      <div style={{ fontSize: '12px', color: '#777', fontWeight: 'normal' }}>{report.company}</div>
                    </td>
                    <td style={{ padding: '14px', fontSize: '13px', color: '#555', maxWidth: '220px' }}>
                      📍 {report.address}
                    </td>
                    <td style={{ padding: '14px', fontSize: '13px', color: '#333', fontWeight: '600' }}>
                      {report.locationName}
                    </td>
                    <td style={{ padding: '14px', fontSize: '13px', fontWeight: 'bold', color: '#ed6c02' }}>
                      🛣️ {report.distance} km
                    </td>
                    <td style={{ padding: '14px', fontSize: '13px', color: '#555' }}>
                      ⏱️ {report.duration}
                    </td>
                    <td style={{ padding: '14px', fontSize: '13px', color: '#1976d2', fontWeight: '600' }}>
                      🚚 {report.truckNumber}
                    </td>
                    <td style={{ padding: '14px' }}>
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontWeight: 'bold',
                        backgroundColor: report.status === 'assigned' ? '#e3f2fd' : report.status === 'completion' ? '#e8f5e9' : '#fff3e0',
                        color: report.status === 'assigned' ? '#1565c0' : report.status === 'completion' ? '#2e7d32' : '#e65100'
                      }}>
                        {report.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  if (isSubView) {
    return mainContent;
  }

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
              <li className="nav-item" onClick={() => onNavigate('settings')}>Settings</li>
            </ul>
          </div>
        </nav>
      </aside>

      <main className="dashboard-main">
        <div className="dashboard-header-bar"></div>
        <div className="dashboard-content">
          <header className="dashboard-header">
            <h1>📈 Reports & Logistics Analytics</h1>
            <div className="header-right">
              <div className="user-greeting">
                <span className="avatar-icon">👤</span>
                <span>Hello {user ? user.name : 'Admin'}</span>
              </div>
              <button className="btn-logout" onClick={onLogout}>Logout</button>
            </div>
          </header>

          {mainContent}
        </div>
      </main>
    </div>
  );
}
