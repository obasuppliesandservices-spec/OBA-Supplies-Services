import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { database } from '../firebase';
import { ref, onValue } from 'firebase/database';
import useStickyState from '../useStickyState';

const getAvailableDriverPahinanteOptions = (employees = [], trips = [], arrivedTripIds = []) => {
  const presentDP = (employees || []).filter(emp => emp && emp.name && emp.status === 'Present' && emp.department === 'Driver/Pahinante');
  const allPresentDP = presentDP.length > 0 ? presentDP : (employees || []).filter(emp => emp && emp.name && emp.status === 'Present');
  const arrivedSet = new Set((arrivedTripIds || []).map(id => String(id)));
  const reservedNames = new Set();

  (trips || []).forEach((trip) => {
    if (!trip || arrivedSet.has(String(trip.id))) return;
    if (trip.driver) reservedNames.add(trip.driver);
    if (trip.pahintate) reservedNames.add(trip.pahintate);
  });

  const availableOptions = allPresentDP.filter(emp => !reservedNames.has(emp.name));
  return {
    driverOptions: availableOptions,
    pahintateOptions: availableOptions
  };
};

const getAutoSelectedDriverPahinante = (employees = [], trips = [], arrivedTripIds = [], currentDriver = '', currentPahinante = '') => {
  const { driverOptions, pahintateOptions } = getAvailableDriverPahinanteOptions(employees, trips, arrivedTripIds);
  const driver = currentDriver && driverOptions.some(emp => emp.name === currentDriver)
    ? currentDriver
    : (driverOptions[0]?.name || '');

  const fallbackPahinante = pahintateOptions.find(emp => emp.name !== driver)?.name || driver || '';
  const pahintate = currentPahinante && pahintateOptions.some(emp => emp.name === currentPahinante)
    ? currentPahinante
    : fallbackPahinante;

  return { driver: driver || '', pahintate: (pahintate && pahintate !== driver) || !driver ? (pahintate || '') : '' };
};

function StatCard({ title, value, icon = '👥', onView }) {
  return (
    <div className="stat-card" style={{ position: 'relative', padding: '16px' }}>
      {onView && (
        <span
          onClick={onView}
          role="button"
          tabIndex={0}
          onKeyPress={(e) => { if (e.key === 'Enter' || e.key === ' ') onView(); }}
          style={{ position: 'absolute', top: '8px', right: '8px', color: '#007bff', textDecoration: 'underline', cursor: 'pointer' }}
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

export default function TripManager({ user, onLogout, onNavigate, jobOrders = [], trips = [], onAddTrip, onAddEvent, trucks = [], doneDeliveries = [], employees: propEmployees = [] }) {
  const [newTrip, setNewTrip] = useState({
    truckNumber: '',
    truckType: '',
    driver: '',
    pahintate: '',
    selectedJobOrders: []
  });

  const [showModal, setShowModal] = useState(false);
  const [cachedJobOrders, setCachedJobOrders] = useState(() => {
    if (Array.isArray(jobOrders) && jobOrders.length > 0) return jobOrders;
    try {
      const cached = localStorage.getItem('app_jobOrders_cache');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return [];
  });

  useEffect(() => {
    if (Array.isArray(jobOrders) && jobOrders.length > 0) {
      setCachedJobOrders(jobOrders);
      try {
        localStorage.setItem('app_jobOrders_cache', JSON.stringify(jobOrders));
      } catch (e) {}
    }
  }, [jobOrders]);

  const [employees, setEmployees] = useState(() => {
    if (Array.isArray(propEmployees) && propEmployees.length > 0) return propEmployees;
    try {
      const cached = localStorage.getItem('app_employees_cache');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return [];
  });
  const [tripHistory, setTripHistory] = useStickyState([], 'app_tripHistory');
  const [showTripHistory, setShowTripHistory] = useState(false);

  useEffect(() => {
    if (Array.isArray(propEmployees) && propEmployees.length > 0) {
      setEmployees(propEmployees);
    }
  }, [propEmployees]);

  useEffect(() => {
    const employeesRef = ref(database, 'employees');
    const unsubscribe = onValue(employeesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const employeesList = Object.keys(data).map(key => ({
          ...data[key],
          id: key
        }));
        setEmployees(employeesList);
        try {
          localStorage.setItem('app_employees_cache', JSON.stringify(employeesList));
        } catch (e) {}
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!Array.isArray(doneDeliveries) || doneDeliveries.length === 0 || !Array.isArray(trips)) return;

    const effectiveJobOrders = (jobOrders && jobOrders.length > 0) ? jobOrders : cachedJobOrders;
    const completedEntries = [];
    doneDeliveries.forEach((delivery) => {
      if (!delivery?.jobOrderId) return;

      trips.forEach((trip) => {
        const selectedJobIds = trip.selectedJobOrders || [];
        const isMatch = selectedJobIds.includes(delivery.jobOrderId) || trip.jobOrderId === delivery.jobOrderId;

        if (isMatch) {
          const tripManpower = (typeof trip.totalManpower === 'number' && trip.totalManpower > 0)
            ? trip.totalManpower
            : (trip.selectedJobOrders || []).reduce((total, id) => {
                const order = effectiveJobOrders.find(o => o.id === id);
                return total + (order ? Number(order.manpower) || 0 : 0);
              }, 0);

          completedEntries.push({
            ...trip,
            totalManpower: tripManpower,
            completedAt: delivery.deliveredAt || delivery.createdAt || new Date().toLocaleString(),
            completedReason: delivery.name || 'Completed delivery'
          });
        }
      });
    });

    if (completedEntries.length === 0) return;

    setTripHistory(prev => {
      const existingIds = new Set(prev.map(entry => entry.id));
      const uniqueEntries = completedEntries.filter(entry => !existingIds.has(entry.id));
      if (uniqueEntries.length === 0) return prev;
      return [...uniqueEntries, ...prev];
    });
  }, [doneDeliveries, trips, jobOrders, cachedJobOrders]);

  useEffect(() => {
    const effectiveJobOrders = (jobOrders && jobOrders.length > 0) ? jobOrders : cachedJobOrders;
    const unsuccessfulTrips = (trips || []).filter(trip => trip?.tripStatus === 'unsuccessful');
    if (unsuccessfulTrips.length === 0) return;

    setTripHistory(prev => {
      const existingIds = new Set(prev.map(entry => entry.id));
      const newEntries = unsuccessfulTrips
        .filter(trip => !existingIds.has(trip.id))
        .map(trip => ({
          ...trip,
          totalManpower: (typeof trip.totalManpower === 'number' && trip.totalManpower > 0)
            ? trip.totalManpower
            : (trip.selectedJobOrders || []).reduce((total, id) => {
                const order = effectiveJobOrders.find(o => o.id === id);
                return total + (order ? Number(order.manpower) || 0 : 0);
              }, 0),
          completedReason: 'Unsuccessful Delivery',
          completedAt: trip.completedAt || new Date().toLocaleString()
        }));
      return newEntries.length > 0 ? [...newEntries, ...prev] : prev;
    });
  }, [trips, jobOrders, cachedJobOrders]);

  useEffect(() => {
    if (!showModal) return;
    const { driver, pahintate } = getAutoSelectedDriverPahinante(employees, trips, [], newTrip.driver, newTrip.pahintate);
    if (!driver && !pahintate) return;

    setNewTrip(prev => {
      const nextDriver = driver && driver !== prev.driver ? driver : (prev.driver || driver);
      const nextPahinante = pahintate && pahintate !== prev.pahintate ? pahintate : (prev.pahintate || pahintate);

      if (prev.driver === nextDriver && prev.pahintate === nextPahinante) {
        return prev;
      }

      return {
        ...prev,
        driver: nextDriver,
        pahintate: nextPahinante
      };
    });
  }, [showModal, employees, trips, newTrip.driver, newTrip.pahintate]);

  const completedTripIds = new Set((tripHistory || []).map(entry => entry.id));
  const activeTrips = (trips || []).filter(trip => !completedTripIds.has(trip.id) && trip.tripStatus !== 'unsuccessful');

  const handleTruckSelectChange = (e) => {
    const selectedId = e.target.value;
    if (!selectedId) {
      setNewTrip(prev => ({ ...prev, truckNumber: '', truckType: '' }));
      return;
    }
    const truck = trucks.find(t => t.id === selectedId);
    if (truck) {
      const match = truck.name.match(/^(.*?)\s*\(([^)]+)\)$/);
      const typeVal = match ? match[2] : 'Standard';
      setNewTrip(prev => ({
        ...prev,
        truckNumber: truck.id,
        truckType: typeVal
      }));
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewTrip(prev => ({ ...prev, [name]: value }));
  };

  const handleJobOrderSelect = (jobOrderId) => {
    const updated = newTrip.selectedJobOrders.includes(jobOrderId)
      ? newTrip.selectedJobOrders.filter(id => id !== jobOrderId)
      : [...newTrip.selectedJobOrders, jobOrderId];
    setNewTrip(prev => ({ ...prev, selectedJobOrders: updated }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (newTrip.truckNumber && newTrip.driver && newTrip.pahintate && newTrip.selectedJobOrders.length > 0) {
      const effectiveJobOrders = (jobOrders && jobOrders.length > 0) ? jobOrders : cachedJobOrders;
      const totalManpower = (newTrip.selectedJobOrders || []).reduce((total, id) => {
        const order = effectiveJobOrders.find(o => o.id === id);
        return total + (order ? Number(order.manpower) || 0 : 0);
      }, 0);
      const tripData = {
        ...newTrip,
        id: Date.now(),
        totalManpower,
        createdDate: new Date().toISOString().split('T')[0]
      };
      onAddTrip(tripData);

      // Create calendar events for each job order in the trip
      newTrip.selectedJobOrders.forEach((jobOrderId, index) => {
        const jobOrder = effectiveJobOrders.find(order => order.id === jobOrderId);
        if (jobOrder && onAddEvent) {
          const tripEvent = {
            id: Date.now() + index,
            name: `🚚 Trip: ${jobOrder.customerName} - ${jobOrder.jobType} (${newTrip.truckNumber})`,
            time: '08:00 AM',
            date: jobOrder.startDate,
            jobType: jobOrder.jobType,
            manpower: jobOrder.manpower,
            customerName: jobOrder.customerName,
            company: jobOrder.company,
            address: jobOrder.address,
            truckNumber: newTrip.truckNumber,
            driver: newTrip.driver,
            pahintate: newTrip.pahintate,
            status: 'trip',
            jobOrderId: jobOrder.id,
            tripId: tripData.id
          };
          onAddEvent(tripEvent);
        }
      });

      setNewTrip({
        truckNumber: '',
        truckType: '',
        driver: '',
        pahintate: '',
        selectedJobOrders: []
      });
      setShowModal(false);
      toast.success('Trip created successfully!');
    } else {
      toast.error('Please fill in all fields and select at least one job order.');
    }
  };

  const effectiveJobOrders = (jobOrders && jobOrders.length > 0) ? jobOrders : cachedJobOrders;

  const getTotalManpower = (jobOrderIds, entryOrTrip = null) => {
    if (entryOrTrip && typeof entryOrTrip.totalManpower === 'number' && entryOrTrip.totalManpower > 0) {
      return entryOrTrip.totalManpower;
    }
    const calculated = (jobOrderIds || []).reduce((total, id) => {
      const order = effectiveJobOrders.find(o => o.id === id);
      return total + (order && typeof order.manpower === 'number' ? order.manpower : (order?.manpower ? Number(order.manpower) || 0 : 0));
    }, 0);
    if (calculated > 0) return calculated;
    if (entryOrTrip && typeof entryOrTrip.totalManpower === 'number') {
      return entryOrTrip.totalManpower;
    }
    return 0;
  };

  const getLoadSummary = (jobOrderIds) => {
    if (!jobOrderIds || jobOrderIds.length === 0) return 'No loads';
    const orders = effectiveJobOrders.filter(o => (jobOrderIds || []).includes(o.id));
    if (orders.length === 0) return 'Loading loads...';
    return orders.map(o => o.jobType).join(', ');
  };

  const getDeliveryInfo = (jobOrderIds) => {
    if (!jobOrderIds || jobOrderIds.length === 0) return 'No deliveries';
    const orders = effectiveJobOrders.filter(o => (jobOrderIds || []).includes(o.id));
    if (orders.length === 0) return 'Loading delivery info...';
    const deliveryInfo = orders.map(o => `${o.customerName} (${o.company}) - ${o.address}`);
    return deliveryInfo.join('; ');
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
              <li className="nav-item active" onClick={() => onNavigate('inventory')}>Trip Manager</li>
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
            <h1>Trip Manager</h1>
            <div className="header-right">
              <div className="user-greeting">
                <span className="avatar-icon">👤</span>
                <span>Hello {user ? user.name || 'Admin' : 'Admin'}</span>
              </div>
              <button className="btn-logout" onClick={onLogout}>Logout</button>
            </div>
          </header>

          {/* Stats Section */}
          <section className="stats-section">
            <StatCard title="Active Trips" value={activeTrips.length} icon="🚚" />
            <StatCard title="Total Loads" value={activeTrips.reduce((sum, trip) => sum + (trip.selectedJobOrders || []).length, 0)} icon="📦" />
            <StatCard title="Total Manpower" value={activeTrips.reduce((sum, trip) => sum + getTotalManpower(trip.selectedJobOrders || [], trip), 0)} icon="👥" />
            <StatCard title="Available Orders" value={effectiveJobOrders.filter(order => order.status !== 'processed' && order.status !== 'assigned').length} icon="🚗" />
          </section>

          {/* Create Trip Section */}
          <section className="meetings-section">
            <div className="meetings-header">
              <h3>Create New Trip</h3>
              <button className="btn-add" onClick={() => setShowModal(true)}>+ New Trip</button>
            </div>
          </section>

          {/* Trips List Section */}
          <section className="meetings-section">
            <div className="meetings-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
              <h3 style={{ margin: 0 }}>🚚 Current Trips ({activeTrips.length})</h3>
              <button
                type="button"
                onClick={() => setShowTripHistory(true)}
                style={{ background: 'none', border: 'none', padding: 0, color: '#1976d2', textDecoration: 'underline', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}
              >
                History
              </button>
            </div>
            {activeTrips.length === 0 ? (
              <div className="empty-inventory" style={{ padding: '40px 20px', textAlign: 'center' }}>
                <p>📭 No active trips at the moment.</p>
                <p style={{ fontSize: '12px', color: '#bbb' }}>Completed trips will appear in history.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
                {activeTrips.map((trip) => (
                  <div
                    key={trip.id}
                    style={{
                      backgroundColor: 'white',
                      borderRadius: '10px',
                      padding: '20px',
                      border: '2px solid #04ab0c',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                      display: 'grid',
                      gridTemplateColumns: '1fr 2fr 1fr',
                      gap: '20px',
                      alignItems: 'start'
                    }}
                  >
                    {/* Truck Info */}
                    <div style={{
                      backgroundColor: '#f9f9f9',
                      padding: '16px',
                      borderRadius: '8px'
                    }}>
                      <div style={{ fontSize: '12px', color: '#999', marginBottom: '4px' }}>Truck</div>
                      <div style={{ fontSize: '18px', fontWeight: '700', color: '#333', marginBottom: '8px' }}>
                        🚚 {trip.truckNumber}
                      </div>
                      <div style={{ fontSize: '12px', color: '#666' }}>
                        {trip.truckType || 'Standard'}
                      </div>
                      <div style={{ fontSize: '11px', color: '#999', marginTop: '8px' }}>
                        📅 {trip.createdDate}
                      </div>
                    </div>

                    {/* Driver & Pahintate & Job Orders Info */}
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px'
                    }}>
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '12px'
                      }}>
                        <div style={{
                          backgroundColor: '#e8f5e9',
                          padding: '12px',
                          borderRadius: '6px'
                        }}>
                          <div style={{ fontSize: '11px', color: '#666', marginBottom: '4px' }}>Driver</div>
                          <div style={{ fontSize: '14px', fontWeight: '600', color: '#333' }}>
                            👨‍💼 {trip.driver}
                          </div>
                        </div>
                        <div style={{
                          backgroundColor: '#fff3e0',
                          padding: '12px',
                          borderRadius: '6px'
                        }}>
                          <div style={{ fontSize: '11px', color: '#666', marginBottom: '4px' }}>Pahintate</div>
                          <div style={{ fontSize: '14px', fontWeight: '600', color: '#333' }}>
                            👨‍🔧 {trip.pahintate}
                          </div>
                        </div>
                      </div>
                      <div style={{
                        backgroundColor: '#e3f2fd',
                        padding: '12px',
                        borderRadius: '6px'
                      }}>
                        <div style={{ fontSize: '11px', color: '#666', marginBottom: '4px' }}>Job Order Loads</div>
                        <div style={{ fontSize: '13px', color: '#333', lineHeight: '1.4' }}>
                          {getLoadSummary(trip.selectedJobOrders)}
                        </div>
                      </div>
                      <div style={{
                        backgroundColor: '#f0f8ff',
                        padding: '12px',
                        borderRadius: '6px'
                      }}>
                        <div style={{ fontSize: '11px', color: '#666', marginBottom: '4px' }}>Deliver To:</div>
                        <div style={{ fontSize: '13px', color: '#333', lineHeight: '1.4' }}>
                          {getDeliveryInfo(trip.selectedJobOrders)}
                        </div>
                      </div>
                    </div>

                    {/* Stats */}
                    <div style={{
                      backgroundColor: '#f5f5f5',
                      padding: '16px',
                      borderRadius: '8px',
                      textAlign: 'center'
                    }}>
                      <div style={{ fontSize: '12px', color: '#999', marginBottom: '8px' }}>Trip Summary</div>
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px'
                      }}>
                        <div>
                          <div style={{ fontSize: '24px', fontWeight: '700', color: '#04ab0c' }}>
                            {(trip.selectedJobOrders || []).length}
                          </div>
                          <div style={{ fontSize: '11px', color: '#666' }}>Job Orders</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '20px', fontWeight: '700', color: '#43a047' }}>
                            {getTotalManpower(trip.selectedJobOrders || [], trip)}
                          </div>
                          <div style={{ fontSize: '11px', color: '#666' }}>Manpower</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {showTripHistory && (
              <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: '2000', padding: '20px' }} onClick={() => setShowTripHistory(false)}>
                <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: '560px', maxHeight: '80vh', overflowY: 'auto', background: '#fff', borderRadius: '16px', padding: '24px', boxShadow: '0 16px 48px rgba(0,0,0,0.2)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <div>
                      <div style={{ fontWeight: '700', color: '#1565c0', fontSize: '18px' }}>Trip History</div>
                      <div style={{ fontSize: '13px', color: '#666', marginTop: '4px' }}>{tripHistory.length} trip{tripHistory.length === 1 ? '' : 's'} recorded</div>
                    </div>
                    <button type="button" onClick={() => setShowTripHistory(false)} style={{ border: 'none', background: 'transparent', color: '#666', cursor: 'pointer', fontSize: '14px' }}>Close</button>
                  </div>
                  {tripHistory.length === 0 ? (
                    <div style={{ padding: '24px', border: '1px dashed #ddd', borderRadius: '12px', color: '#777', backgroundColor: '#fafafa', textAlign: 'center' }}>No trip history recorded yet.</div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
                      {tripHistory.map((entry) => (
                        <div
                          key={entry.id}
                          style={{
                            backgroundColor: 'white',
                            borderRadius: '10px',
                            padding: '20px',
                            border: '2px solid #04ab0c',
                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                            display: 'grid',
                            gridTemplateColumns: '1fr 2fr 1fr',
                            gap: '20px',
                            alignItems: 'start'
                          }}
                        >
                          <div style={{ backgroundColor: '#f9f9f9', padding: '16px', borderRadius: '8px' }}>
                            <div style={{ fontSize: '12px', color: '#999', marginBottom: '4px' }}>Truck</div>
                            <div style={{ fontSize: '18px', fontWeight: '700', color: '#333', marginBottom: '8px' }}>🚚 {entry.truckNumber || 'Truck'}</div>
                            <div style={{ fontSize: '12px', color: '#666' }}>{entry.truckType || 'Standard'}</div>
                            <div style={{ fontSize: '11px', color: '#999', marginTop: '8px' }}>📅 {entry.createdDate || 'Completed'}</div>
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                              <div style={{ backgroundColor: '#e8f5e9', padding: '12px', borderRadius: '6px' }}>
                                <div style={{ fontSize: '11px', color: '#666', marginBottom: '4px' }}>Driver</div>
                                <div style={{ fontSize: '14px', fontWeight: '600', color: '#333' }}>👨‍💼 {entry.driver || 'Not assigned'}</div>
                              </div>
                              <div style={{ backgroundColor: '#fff3e0', padding: '12px', borderRadius: '6px' }}>
                                <div style={{ fontSize: '11px', color: '#666', marginBottom: '4px' }}>Assistant</div>
                                <div style={{ fontSize: '14px', fontWeight: '600', color: '#333' }}>👨‍🔧 {entry.pahintate || entry.assistant || 'Not assigned'}</div>
                              </div>
                            </div>
                            <div style={{ backgroundColor: '#e3f2fd', padding: '12px', borderRadius: '6px' }}>
                              <div style={{ fontSize: '11px', color: '#666', marginBottom: '4px' }}>Status</div>
                              <div style={{ fontSize: '13px', color: entry.tripStatus === 'unsuccessful' ? '#bf4f00' : '#333', lineHeight: '1.4', fontWeight: entry.tripStatus === 'unsuccessful' ? '700' : '400' }}>{entry.tripStatus === 'unsuccessful' ? 'Unsuccessful Delivery' : 'Completed'}: {entry.completedAt || 'Recently completed'}</div>
                            </div>
                            <div style={{ backgroundColor: '#f0f8ff', padding: '12px', borderRadius: '6px' }}>
                              <div style={{ fontSize: '11px', color: '#666', marginBottom: '4px' }}>Reason</div>
                              <div style={{ fontSize: '13px', color: '#333', lineHeight: '1.4' }}>{entry.completedReason || 'Dashboard delivery marked done'}</div>
                            </div>
                          </div>

                          <div style={{ backgroundColor: '#f5f5f5', padding: '16px', borderRadius: '8px', textAlign: 'center' }}>
                            <div style={{ fontSize: '12px', color: '#999', marginBottom: '8px' }}>Trip Summary</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                              <div>
                                <div style={{ fontSize: '24px', fontWeight: '700', color: '#04ab0c' }}>{(entry.selectedJobOrders || []).length}</div>
                                <div style={{ fontSize: '11px', color: '#666' }}>Job Orders</div>
                              </div>
                              <div>
                                <div style={{ fontSize: '20px', fontWeight: '700', color: '#43a047' }}>{getTotalManpower(entry.selectedJobOrders || [], entry)}</div>
                                <div style={{ fontSize: '11px', color: '#666' }}>Manpower</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </section>
        </div>
      </main>

      {/* Create Trip Modal */}
      {showModal && (
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
          onClick={() => setShowModal(false)}
        >
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '32px',
              maxWidth: '700px',
              width: '90%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ margin: '0 0 24px 0', fontSize: '24px', fontWeight: '700', color: '#333' }}>
              🚚 Create New Trip
            </h2>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Registered Truck Dropdown */}
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: '#333' }}>
                  Select Registered Truck
                </label>
                <select
                  onChange={handleTruckSelectChange}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '6px',
                    border: '1px solid #ddd',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                    backgroundColor: 'white'
                  }}
                >
                  <option value="">-- Select a registered truck (or type details manually below) --</option>
                  {trucks.map(truck => {
                    const isMaintenance = truck.status === 'Maintenance';
                    return (
                      <option 
                        key={truck.id} 
                        value={truck.id} 
                        disabled={isMaintenance}
                      >
                        {truck.name} {isMaintenance ? ' (🔧 Under Maintenance)' : ''}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Truck Info */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: '#333' }}>
                    Truck Number *
                  </label>
                  <input
                    type="text"
                    name="truckNumber"
                    value={newTrip.truckNumber}
                    onChange={handleInputChange}
                    placeholder="e.g., TRK-001"
                    required
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: '6px',
                      border: '1px solid #ddd',
                      fontSize: '14px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: '#333' }}>
                    Truck Type
                  </label>
                  <input
                    type="text"
                    name="truckType"
                    value={newTrip.truckType}
                    onChange={handleInputChange}
                    placeholder="e.g., Faw 6 Wheeler"
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: '6px',
                      border: '1px solid #ddd',
                      fontSize: '14px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              {/* Driver & Pahintate */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: '#333' }}>
                    Driver Name *
                  </label>
                  <select
                    name="driver"
                    value={newTrip.driver}
                    onChange={handleInputChange}
                    required
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: '6px',
                      border: '1px solid #ddd',
                      fontSize: '14px',
                      boxSizing: 'border-box'
                    }}
                  >
                    <option value="">Select Driver...</option>
                    {(() => {
                      const { driverOptions } = getAvailableDriverPahinanteOptions(employees, trips, []);
                      return driverOptions.map(emp => (
                        <option key={emp.id || emp.name} value={emp.name}>{emp.name}</option>
                      ));
                    })()}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: '#333' }}>
                    Pahintate / Assistant *
                  </label>
                  <select
                    name="pahintate"
                    value={newTrip.pahintate}
                    onChange={handleInputChange}
                    required
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: '6px',
                      border: '1px solid #ddd',
                      fontSize: '14px',
                      boxSizing: 'border-box'
                    }}
                  >
                    <option value="">Select Assistant...</option>
                    {(() => {
                      const { pahintateOptions } = getAvailableDriverPahinanteOptions(employees, trips, []);
                      return pahintateOptions.map(emp => (
                        <option key={emp.id || emp.name} value={emp.name}>{emp.name}</option>
                      ));
                    })()}
                  </select>
                </div>
              </div>

              {/* Job Orders Selection */}
              <div>
                <label style={{ display: 'block', marginBottom: '12px', fontSize: '14px', fontWeight: '600', color: '#333' }}>
                  Select Processed Job Orders to Load * ({newTrip.selectedJobOrders.length} selected)
                </label>
                <div style={{
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  maxHeight: '200px',
                  overflowY: 'auto',
                  padding: '12px'
                }}>
                  {jobOrders && jobOrders.filter(order => order.status === 'processed').length > 0 ? (
                    jobOrders.filter(order => order.status === 'processed').map((order) => (
                      <label
                        key={order.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          padding: '10px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          backgroundColor: newTrip.selectedJobOrders.includes(order.id) ? '#e8f5e9' : 'transparent',
                          marginBottom: '8px'
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={newTrip.selectedJobOrders.includes(order.id)}
                          onChange={() => handleJobOrderSelect(order.id)}
                          style={{ marginRight: '12px', cursor: 'pointer' }}
                        />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '14px', fontWeight: '600', color: '#333' }}>
                            {order.jobType}
                          </div>
                          <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                            <div><strong>Customer:</strong> {order.customerName}</div>
                            <div><strong>Company:</strong> {order.company}</div>
                            <div><strong>Address:</strong> {order.address}</div>
                            <div><strong>Workers:</strong> {order.manpower}</div>
                          </div>
                        </div>
                      </label>
                    ))
                  ) : (
                    <div style={{ textAlign: 'center', color: '#999', padding: '20px' }}>
                      No processed job orders available
                    </div>
                  )}
                </div>
              </div>

              {/* Buttons */}
              <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    padding: '12px',
                    backgroundColor: '#04ab0c',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '16px',
                    fontWeight: '600',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#039a0a'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = '#04ab0c'}
                >
                  Create Trip
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{
                    flex: 1,
                    padding: '12px',
                    backgroundColor: '#f0f0f0',
                    color: '#333',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '16px',
                    fontWeight: '600',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = '#e0e0e0';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = '#f0f0f0';
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
