import React, { useState } from 'react';
import EventModal from './EventModal';

export default function Calendar({ onNavigate, events = [], onAddEvent, onEditEvent, onOpenJobOrderModal }) {
  const [date, setDate] = useState(new Date());
  const [modalOpen, setModalOpen] = useState(false);
  const [dayModalOpen, setDayModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [eventToEdit, setEventToEdit] = useState(null);
  const [selectedCalendar, setSelectedCalendar] = useState('delivery');

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const currentMonth = date.getMonth();
  const currentYear = date.getFullYear();
  const firstDay = new Date(currentYear, currentMonth, 1).getDay(); // Sunday = 0
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  const prevMonth = () => setDate(new Date(currentYear, currentMonth - 1, 1));
  const nextMonth = () => setDate(new Date(currentYear, currentMonth + 1, 1));

  const formatDate = (day) =>
    `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  const deliveryEvents = events.filter(event => event.status === 'trip');
  const jobOrderEvents = events.filter(event => ['active', 'started', 'completion'].includes(event.status));

  const hasDeliveryEvent = (day) => {
    if (!day) return false;
    const dateStr = formatDate(day);
    return deliveryEvents.some(event => event.date === dateStr);
  };

  const hasJobOrderEvent = (day) => {
    if (!day) return false;
    const dateStr = formatDate(day);
    return jobOrderEvents.some(event => event.date === dateStr);
  };

  const handleDayClick = (day, calendarType) => {
    if (!day) return;
    const dateStr = formatDate(day);
    setSelectedDate(dateStr);
    setSelectedCalendar(calendarType);
    setEventToEdit(null);
    setDayModalOpen(true);
  };

  const openEventEditor = (event) => {
    setEventToEdit(event || null);
    setDayModalOpen(false);
    setModalOpen(true);
  };

  const handleSaveEvent = (eventData) => {
    if (eventToEdit) {
      onEditEvent(eventToEdit.id, eventData);
    } else {
      onAddEvent({ ...eventData, date: selectedDate });
    }
    setModalOpen(false);
  };

  const getModalEvents = () => {
    if (selectedCalendar === 'delivery') {
      return deliveryEvents.filter(event => event.date === selectedDate);
    }
    return jobOrderEvents.filter(event => event.date === selectedDate);
  };

  const days = [];
  const adjustedFirstDay = firstDay === 0 ? 6 : firstDay - 1;
  for (let i = 0; i < adjustedFirstDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  const renderEventCard = (event) => {
    const isTrip = event.status === 'trip';
    const eventStyle = {
      backgroundColor: isTrip ? '#c3e5ff' : event.status === 'started' ? '#ffcc80' : event.status === 'completion' ? '#c8e6c9' : '#c3d6e5',
      border: `1px solid ${isTrip ? '#2196f3' : event.status === 'started' ? '#fb8c00' : event.status === 'completion' ? '#66bb6a' : '#20ae50'}`,
      padding: '6px',
      borderRadius: '4px',
      fontSize: '10px',
      lineHeight: '1.4'
    };

    return (
      <div key={event.id} className="event-name" style={eventStyle}>
        <div style={{ fontWeight: 600, color: '#333', marginBottom: '2px' }}>
          {isTrip ? '🚚 Delivery Today:' : event.status === 'completion' ? '✓ End of Contract:' : '▶ Start of Contract:'} {event.jobType}
        </div>
        <div style={{ fontSize: '9px', color: '#666' }}>
          {isTrip ? (
            <>
            
              {event.driver && <span>Driver: {event.driver}</span>}<br />
              {event.truckNumber && <span>Truck: {event.truckNumber}</span>}
            </>
          ) : (
            event.manpower && <span>👥 {event.manpower} workers</span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="calendar-page">
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
              <li className="nav-item active">Calendar</li>
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

      <main className="calendar-main">
        <div className="calendar-header-bar"></div>

        <div className="calendar-container">
          <div className="calendar-title-section">
            <h2>Calendar</h2>
          </div>

          <div className="calendar-content">
            <div className="calendar-label">Delivery Calendar</div>

            <div className="month-nav">
              <span className="month-info">Today</span>
              <button onClick={prevMonth} className="nav-btn">{'<'}</button>
              <h3>{monthNames[currentMonth]} {currentYear}</h3>
              <button onClick={nextMonth} className="nav-btn">{'>'}</button>
            </div>

            <div className="calendar-grid">
              <div className="weekdays">
                {dayNames.map((day) => (
                  <div key={day} className="weekday">{day}</div>
                ))}
              </div>
              <div className="days-grid">
                {days.map((day, idx) => {
                  const dayEvents = day ? deliveryEvents.filter(e => e.date === formatDate(day)) : [];
                  const displayLimit = 2;
                  const displayedEvents = dayEvents.slice(0, displayLimit);
                  const hiddenCount = dayEvents.length > displayLimit ? dayEvents.length - displayLimit : 0;

                  return (
                    <div
                      key={idx}
                      className={`day ${day === null ? 'empty' : ''} ${hasDeliveryEvent(day) ? 'event' : ''}`}
                      onClick={() => handleDayClick(day, 'delivery')}
                      style={{
                        position: 'relative',
                        minHeight: dayEvents.length > 0 ? '140px' : 'auto'
                      }}
                    >
                      {day}
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px',
                        marginTop: '4px'
                      }}>
                        {displayedEvents.map(renderEventCard)}
                        {hiddenCount > 0 && (
                          <div style={{
                            padding: '6px',
                            backgroundColor: '#e9ecef',
                            borderRadius: '4px',
                            fontSize: '10px',
                            fontWeight: '600',
                            color: '#666',
                            textAlign: 'center',
                            cursor: 'pointer'
                          }}>
                            +{hiddenCount} more
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="calendar-container">
          <div className="calendar-title-section">
            <h2>Job Order Calendar</h2>
          </div>

          <div className="calendar-content">
            <div className="calendar-label">Job Order Calendar</div>

            <div className="month-nav">
              <span className="month-info">Today</span>
              <button onClick={prevMonth} className="nav-btn">{'<'}</button>
              <h3>{monthNames[currentMonth]} {currentYear}</h3>
              <button onClick={nextMonth} className="nav-btn">{'>'}</button>
            </div>

            <div className="calendar-grid">
              <div className="weekdays">
                {dayNames.map((day) => (
                  <div key={day} className="weekday">{day}</div>
                ))}
              </div>
              <div className="days-grid">
                {days.map((day, idx) => {
                  const dayEvents = day ? jobOrderEvents.filter(e => e.date === formatDate(day)) : [];
                  const displayLimit = 2;
                  const displayedEvents = dayEvents.slice(0, displayLimit);
                  const hiddenCount = dayEvents.length > displayLimit ? dayEvents.length - displayLimit : 0;

                  return (
                    <div
                      key={idx}
                      className={`day ${day === null ? 'empty' : ''} ${hasJobOrderEvent(day) ? 'event' : ''}`}
                      onClick={() => handleDayClick(day, 'jobOrder')}
                      style={{
                        position: 'relative',
                        minHeight: dayEvents.length > 0 ? '140px' : 'auto'
                      }}
                    >
                      {day}
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px',
                        marginTop: '4px'
                      }}>
                        {displayedEvents.map(renderEventCard)}
                        {hiddenCount > 0 && (
                          <div style={{
                            padding: '6px',
                            backgroundColor: '#e9ecef',
                            borderRadius: '4px',
                            fontSize: '10px',
                            fontWeight: '600',
                            color: '#666',
                            textAlign: 'center',
                            cursor: 'pointer'
                          }}>
                            +{hiddenCount} more
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </main>

      {dayModalOpen && (
        <div className="modal-overlay" onClick={() => setDayModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>{selectedCalendar === 'delivery' ? 'Scheduled Deliveries' : 'Scheduled Job Orders'} for {new Date(selectedDate).toLocaleDateString()}</h3>
            <div style={{maxHeight: '400px', overflowY: 'auto'}}>
              {getModalEvents().length === 0 ? (
                <p style={{textAlign: 'center', color: '#999', padding: '20px'}}>
                  {selectedCalendar === 'delivery' ? 'No deliveries scheduled for this date.' : 'No job orders scheduled for this date.'}
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {getModalEvents().map((e) => (
                    <div key={e.id} style={{
                      padding: '12px',
                      backgroundColor: e.status === 'completion' ? '#e8f5e9' : e.status === 'trip' ? '#e3f2fd' : '#fff3cd',
                      border: `2px solid ${e.status === 'completion' ? '#81c784' : e.status === 'trip' ? '#2196f3' : '#ffc107'}`,
                      borderRadius: '6px'
                    }}>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'start',
                        marginBottom: '8px'
                      }}>
                        <div style={{fontWeight: '700', color: '#333', fontSize: '14px'}}>
                          {e.status === 'trip' ? '🚚 Delivery Today' : e.status === 'completion' ? '✓ End Date' : '▶ Start Date'}: {e.jobType}
                        </div>
                        <span style={{
                          fontSize: '11px',
                          backgroundColor: e.status === 'trip' ? '#2196f3' : e.status === 'completion' ? '#81c784' : '#ff9800',
                          color: 'white',
                          padding: '3px 8px',
                          borderRadius: '12px'
                        }}>
                          {e.status === 'trip' ? 'Delivery' : e.status === 'completion' ? 'Completion' : 'Start'}
                        </span>
                      </div>
                      <div style={{fontSize: '13px', color: '#555', lineHeight: '1.6'}}>
                        <strong> {e.name.split(' - ')[0]}</strong><br />
                        
                        {e.time && <span style={{marginRight: '15px'}}>⏰ {e.time}</span>}
                        {e.status !== 'trip' && e.manpower && <span>👥 {e.manpower} workers</span>}
                        {e.driverName && <span style={{display: 'block', marginTop: '4px'}}>Driver: {e.driverName}</span>}
                        
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div style={{marginTop: '16px', display: 'flex', gap: '8px', borderTop: '1px solid #eee', paddingTop: '12px'}}>
            </div>
          </div>
        </div>
      )}

      {modalOpen && (
        <EventModal
          isOpen={modalOpen}
          onClose={() => { setModalOpen(false); setDayModalOpen(true); }}
          onSave={handleSaveEvent}
          eventToEdit={eventToEdit}
          events={events}
        />
      )}
    </div>
  );
}
