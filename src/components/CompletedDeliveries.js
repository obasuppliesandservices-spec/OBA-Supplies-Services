import React, { useState } from 'react';

export default function CompletedDeliveries({ title = 'List', items = [], onClose, onUndo }) {
  const [filterMonth, setFilterMonth] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const list = (items || []);
  const showFilters = title === 'Total Deliveries';

  const filteredItems = list.filter(d => {
    const rawDate = d.deliveredAt || d.date || d.endDate || '';
    const itemDate = rawDate ? new Date(rawDate) : null;
    if (!itemDate || Number.isNaN(itemDate.getTime())) return false;
    const itemMonth = itemDate.toISOString().slice(0, 7);
    const itemDay = itemDate.toISOString().slice(0, 10);
    if (filterMonth && itemMonth !== filterMonth) return false;
    if (filterDate && itemDay !== filterDate) return false;
    return true;
  });

  const hasItems = filteredItems.length > 0;

  const getEndInfo = (item) => {
    const isEndedOrder = title === 'Ended Job Orders' || item?.status === 'completion';
    const label = isEndedOrder ? 'End Contract:' : 'Time Delivered:';
    const rawDate = item?.endDate || item?.deliveredAt || item?.date || '';
    if (!rawDate) return null;
    const showTimeOnly = title === 'Total Deliveries' || title === 'Completed Deliveries';
    const parsedDate = new Date(rawDate);
    const formattedDate = Number.isNaN(parsedDate.getTime()) ? rawDate : (showTimeOnly ? '' : parsedDate.toLocaleDateString());
    const formattedTime = item?.deliveredTime ? item.deliveredTime : (item?.deliveredAt ? new Date(item.deliveredAt).toLocaleTimeString() : '');
    return { label, formattedDate, formattedTime };
  };

  return (
    <div className="modal-overlay" style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
      <div className="modal-content" style={{ background: '#fff', borderRadius: '8px', padding: '18px', width: '640px', maxHeight: '75vh', overflowY: 'auto' }}>
        <h3 style={{ marginTop: 0 }}>{title}</h3>
        {showFilters && (
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '14px', alignItems: 'center' }}>
            <label style={{ display: 'flex', flexDirection: 'column', fontSize: '13px', color: '#333' }}>
              Month
              <input
                type="month"
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
                style={{ marginTop: '6px', padding: '8px', borderRadius: '6px', border: '1px solid #ccc' }}
              />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', fontSize: '13px', color: '#333' }}>
              Date
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                style={{ marginTop: '6px', padding: '8px', borderRadius: '6px', border: '1px solid #ccc' }}
              />
            </label>
            <button
              onClick={() => {
                setFilterMonth('');
                setFilterDate('');
              }}
              style={{ marginTop: '24px', padding: '10px 14px', borderRadius: '6px', border: '1px solid #ccc', background: '#f8f9fa', color: '#333', cursor: 'pointer' }}
            >
              Clear
            </button>
          </div>
        )}
        <div className="completed-list">
          {!hasItems ? (
            <p style={{ padding: '12px' }}>No items to show.</p>
          ) : (
            filteredItems.map(d => (
              <div key={d.id || d._id || JSON.stringify(d)} className="completed-item" style={{ padding: '10px 0', borderBottom: '1px solid #eee' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{d.name || d.title || d.jobName || 'Unnamed'}</div>
                    <div style={{ fontSize: '13px', color: '#666' }}>{d.driver ? `Driver: ${d.driver}` : ''}{d.truckNumber ? ` • Truck: ${d.truckNumber}` : ''}</div>
                    <div style={{ fontSize: '12px', color: '#999' }}>
                      {d.date ? new Date(d.date).toLocaleDateString() : ''}{d.time ? ` • ${d.time}` : ''}
                      {(() => {
                        const endInfo = getEndInfo(d);
                        if (!endInfo) return null;
                        return (
                          <div style={{ color: '#555', marginTop: '4px', fontSize: '12px' }}>
                            {endInfo.label} {endInfo.formattedDate}{endInfo.formattedTime ? ` ${endInfo.formattedTime}` : ''}
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                  <div />
                </div>
              </div>
            ))
          )}
        </div>
        <div style={{ marginTop: '12px', textAlign: 'right' }}>
          <button className="btn-close" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
