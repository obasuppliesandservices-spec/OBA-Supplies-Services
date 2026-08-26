import React, { useState, useEffect } from 'react';

export default function EventModal({ isOpen, onClose, onSave, eventToEdit, events }) {
  const [name, setName] = useState('');
  const [time, setTime] = useState('');
  const [date, setDate] = useState('');
  const [driverName, setDriverName] = useState('');
  const [plateNumber, setPlateNumber] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (eventToEdit) {
      setName(eventToEdit.name || '');
      setTime(eventToEdit.time || '');
      setDate(eventToEdit.date || '');
      setDriverName(eventToEdit.driverName || '');
      setPlateNumber(eventToEdit.plateNumber || '');
    } else {
      setName('');
      setTime('');
      setDate('');
      setDriverName('');
      setPlateNumber('');
    }
    setError('');
  }, [eventToEdit]);

  const getDeliveriesForDate = (selectedDate) => {
    if (!events) return 0;
    return events.filter(event => event.date === selectedDate).length;
  };

  const isDatePast = (d) => {
    if (!d) return false;
    const selected = new Date(d + 'T00:00:00');
    selected.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return selected < today;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (isDatePast(date) && !eventToEdit) {
      setError('Cannot add events for past dates.');
      return;
    }

    if (name && time && date) {
      // Only check limit if adding new event (not editing)
      if (!eventToEdit) {
        const deliveriesForDate = getDeliveriesForDate(date);
        if (deliveriesForDate >= 3) {
          setError('You can only add 3 deliveries per day. Limit reached for ' + new Date(date).toLocaleDateString());
          return;
        }
      }

      onSave({ name, time, date, driverName, plateNumber });
      onClose();
    }
  };

  const deliveriesForSelectedDate = getDeliveriesForDate(date);
  const isLimitReached = deliveriesForSelectedDate >= 3;
  const isPast = isDatePast(date);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h3>{eventToEdit ? 'Edit Delivery' : 'Set Delivery Date'}</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Place of Delivery: </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Driver Name:</label>
            <input
              type="text"
              value={driverName}
              onChange={(e) => setDriverName(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Plate Number:</label>
            <input
              type="text"
              value={plateNumber}
              onChange={(e) => setPlateNumber(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Time:</label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Date:</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          {date && (
            <div style={{
              padding: '10px',
              marginBottom: '10px',
              borderRadius: '4px',
              fontSize: '12px',
              backgroundColor: isLimitReached ? '#fee' : '#efe',
              color: isLimitReached ? '#c33' : '#3c3',
              border: `1px solid ${isLimitReached ? '#fcc' : '#cfc'}`
            }}>
              Deliveries for {new Date(date).toLocaleDateString()}: {deliveriesForSelectedDate}/3
              {isLimitReached && ' (Limit reached - cannot add more)'}
            </div>
          )}

          {isPast && (
            <div style={{
              padding: '10px',
              marginBottom: '10px',
              borderRadius: '4px',
              fontSize: '12px',
              backgroundColor: '#fff4e5',
              color: '#8a6d3b',
              border: '1px solid #f0c36d'
            }}>
              Warning: selected date is in the past. You cannot add a delivery for a past date.
            </div>
          )}

          {error && (
            <div style={{
              padding: '10px',
              marginBottom: '10px',
              borderRadius: '4px',
              fontSize: '12px',
              backgroundColor: '#fee',
              color: '#c33',
              border: '1px solid #fcc'
            }}>
              {error}
            </div>
          )}

          <div className="modal-actions">
            <button type="button" onClick={onClose}>Cancel</button>
            <button type="submit" disabled={(isLimitReached && !eventToEdit) || (isPast && !eventToEdit)}>{eventToEdit ? 'Update' : 'Add'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
