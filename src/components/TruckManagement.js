import React, { useState, useMemo } from 'react';
import toast from 'react-hot-toast';

const FIX_SUGGESTIONS = {
  brake: [
    'Inspect brake pads and replace if thickness is below 3mm.',
    'Check brake fluid level and top up or flush if contaminated.',
    'Inspect brake calipers and rotors for wear or heat damage.',
    'Bleed brake lines to remove air bubbles.'
  ],
  tire: [
    'Perform tire rotation and balance.',
    'Check tire pressure and inflate to manufacturer specification (usually 35-45 PSI).',
    'Inspect tire tread depth and replace if below 2/32 inch.',
    'Perform wheel alignment to prevent uneven wear.'
  ],
  tyre: [
    'Perform tire rotation and balance.',
    'Check tire pressure and inflate to manufacturer specification (usually 35-45 PSI).',
    'Inspect tire tread depth and replace if below 2/32 inch.',
    'Perform wheel alignment to prevent uneven wear.'
  ],
  wheel: [
    'Check wheel bearing for play or noise and replace if necessary.',
    'Inspect wheel rim for cracks or structural damage.',
    'Check lug nut torque and tighten to specification.'
  ],
  engine: [
    'Perform oil and filter change.',
    'Inspect spark plugs or glow plugs and replace if fouled.',
    'Check engine air filter and replace if dirty.',
    'Inspect drive belts (serpentine/timing belt) for cracking or tension.'
  ],
  oil: [
    'Check engine oil level and inspect oil pan for leaks.',
    'Replace oil filter and refill with standard weight oil.',
    'Inspect valve cover gasket and oil seals for leaks.'
  ],
  leak: [
    'Inspect hose clamps and lines (coolant, oil, brake, power steering) for punctures.',
    'Perform pressure test on the cooling system to locate radiator/hose leaks.',
    'Replace worn gaskets, O-rings, or seals at the leak source.'
  ],
  coolant: [
    'Top up engine coolant level in the expansion tank.',
    'Perform coolant flush and inspect radiator cap seal.',
    'Inspect radiator hoses for swelling or cracks.'
  ],
  overheat: [
    'Inspect radiator cooling fan operation.',
    'Test thermostat function and replace if stuck closed.',
    'Check water pump for leaks or bearing failure.',
    'Inspect radiator core for debris blockage.'
  ],
  ac: [
    'Perform AC system pressure check and inspect for refrigerant leaks.',
    'Recharge AC system with R134a refrigerant.',
    'Replace cabin air filter.',
    'Check AC compressor clutch engagement.'
  ],
  aircon: [
    'Perform AC system pressure check and inspect for refrigerant leaks.',
    'Recharge AC system with R134a refrigerant.',
    'Replace cabin air filter.',
    'Check AC compressor clutch engagement.'
  ],
  battery: [
    'Clean corrosion from battery terminals and apply protective spray.',
    'Test battery cold cranking amps (CCA) and voltage.',
    'Check alternator output voltage (should be 13.5V to 14.5V).',
    'Tighten battery hold-down bracket.'
  ],
  light: [
    'Replace defective headlight, taillight, or turn signal bulb.',
    'Check light fuse in the engine bay fuse box.',
    'Clean electrical connector contacts and check ground wires.'
  ],
  wiper: [
    'Replace wiper blade refills.',
    'Refill windshield washer fluid reservoir.',
    'Inspect wiper motor linkage and nozzle spray pattern.'
  ]
};

export default function TruckManagement({ user, onLogout, onNavigate, trucks = [], onUpdateTrucks, isSubView = false }) {
  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [editingTruck, setEditingTruck] = useState(null);
  const [truckFormData, setTruckFormData] = useState({
    id: '',
    type: '',
    maxWeight: '',
    status: 'Active'
  });

  const [activeMaintenanceTruck, setActiveMaintenanceTruck] = useState(null);
  const [maintenanceIssue, setMaintenanceIssue] = useState('');
  const [maintenanceSuggestion, setMaintenanceSuggestion] = useState('');

  // Auto suggestions based on typed issue description
  const activeSuggestions = useMemo(() => {
    const text = maintenanceIssue.toLowerCase();
    const suggestions = [];

    Object.keys(FIX_SUGGESTIONS).forEach(key => {
      if (text.includes(key)) {
        suggestions.push(...FIX_SUGGESTIONS[key]);
      }
    });

    // De-duplicate suggestions
    return [...new Set(suggestions)];
  }, [maintenanceIssue]);

  const handleOpenAdd = () => {
    setEditingTruck(null);
    setTruckFormData({
      id: '',
      type: '',
      maxWeight: '',
      status: 'Active'
    });
    setShowAddEditModal(true);
  };

  const handleOpenEdit = (truck) => {
    setEditingTruck(truck);
    // Parse name TRK-001 (Faw 6 Wheeler) to id TRK-001 and type Faw 6 Wheeler
    const match = truck.name.match(/^(.*?)\s*\(([^)]+)\)$/);
    const typeVal = match ? match[2] : '';
    setTruckFormData({
      id: truck.id,
      type: typeVal,
      maxWeight: truck.maxWeight,
      status: truck.status || 'Active'
    });
    setShowAddEditModal(true);
  };

  const handleSaveTruck = (e) => {
    e.preventDefault();
    const { id, type, maxWeight, status } = truckFormData;
    if (!id.trim() || !type.trim() || !maxWeight) {
      toast.error('Please fill in all fields.');
      return;
    }

    const formattedName = `${id.trim()} (${type.trim()})`;
    const maxW = parseInt(maxWeight, 10);
    const zones = Math.floor(maxW / 100);

    const updatedTrucks = [...trucks];
    const index = updatedTrucks.findIndex(t => t.id === id.trim());

    if (editingTruck) {
      if (index !== -1) {
        updatedTrucks[index] = {
          ...updatedTrucks[index],
          name: formattedName,
          maxWeight: maxW,
          gridZones: zones,
          status: status
        };
      }
      toast.success('Truck updated successfully!');
    } else {
      if (index !== -1) {
        toast.error('Truck ID already exists!');
        return;
      }
      updatedTrucks.push({
        id: id.trim(),
        name: formattedName,
        maxWeight: maxW,
        gridZones: zones,
        status: status,
        maintenanceLogs: []
      });
      toast.success('Truck added successfully!');
    }

    onUpdateTrucks(updatedTrucks);
    setShowAddEditModal(false);
  };

  const handleDeleteTruck = (id) => {
    if (window.confirm(`Are you sure you want to delete truck ${id}?`)) {
      const updatedTrucks = trucks.filter(t => t.id !== id);
      onUpdateTrucks(updatedTrucks);
      toast.success('Truck deleted successfully!');
    }
  };

  const handleAddMaintenance = (e) => {
    e.preventDefault();
    if (!maintenanceIssue.trim()) {
      toast.error('Please fill in the maintenance issue.');
      return;
    }

    const logEntry = {
      id: Date.now(),
      date: new Date().toLocaleDateString(),
      issue: maintenanceIssue,
      suggestion: maintenanceSuggestion || 'General maintenance check.',
      status: 'Pending',
      loggedBy: user ? user.name : 'System'
    };

    const updatedTrucks = trucks.map(t => {
      if (t.id === activeMaintenanceTruck.id) {
        const logs = t.maintenanceLogs ? [...t.maintenanceLogs] : [];
        return {
          ...t,
          status: 'Maintenance',
          maintenanceLogs: [logEntry, ...logs]
        };
      }
      return t;
    });

    onUpdateTrucks(updatedTrucks);
    setMaintenanceIssue('');
    setMaintenanceSuggestion('');
    setActiveMaintenanceTruck(null);
    toast.success('Maintenance log recorded. Truck status updated to Maintenance.');
  };

  const handleResolveMaintenance = (truckId, logId) => {
    const updatedTrucks = trucks.map(t => {
      if (t.id === truckId) {
        const updatedLogs = (t.maintenanceLogs || []).map(log => {
          if (log.id === logId) {
            return { ...log, status: 'Resolved', resolvedDate: new Date().toLocaleDateString() };
          }
          return log;
        });

        // Determine if there are still any pending logs
        const hasPending = updatedLogs.some(log => log.status === 'Pending');
        return {
          ...t,
          status: hasPending ? 'Maintenance' : 'Active',
          maintenanceLogs: updatedLogs
        };
      }
      return t;
    });

    onUpdateTrucks(updatedTrucks);
    toast.success('Maintenance task marked as Resolved.');
  };

  const getStatusBadgeStyle = (status) => {
    switch (status) {
      case 'Active':
        return { backgroundColor: '#e8f5e9', color: '#2e7d32', padding: '6px 12px', borderRadius: '20px', fontWeight: 'bold', fontSize: '12px' };
      case 'Maintenance':
        return { backgroundColor: '#ffebee', color: '#c62828', padding: '6px 12px', borderRadius: '20px', fontWeight: 'bold', fontSize: '12px' };
      case 'In Transit':
        return { backgroundColor: '#e3f2fd', color: '#1565c0', padding: '6px 12px', borderRadius: '20px', fontWeight: 'bold', fontSize: '12px' };
      default:
        return { backgroundColor: '#f5f5f5', color: '#616161', padding: '6px 12px', borderRadius: '20px', fontWeight: 'bold', fontSize: '12px' };
    }
  };

  const mainContent = (
    <div style={{ padding: '20px 0' }}>
      {/* Fleet Stats cards */}
      <section className="stats-section truck-fleet-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '24px' }}>
        <div className="stat-card" style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '14px', color: '#666', fontWeight: '500' }}>Total Fleet</span>
            <span style={{ fontSize: '24px' }}>🚛</span>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#333', marginTop: '8px' }}>{trucks.length}</div>
        </div>
        <div className="stat-card" style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '14px', color: '#666', fontWeight: '500' }}>Active</span>
            <span style={{ fontSize: '24px', color: '#2e7d32' }}>●</span>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#2e7d32', marginTop: '8px' }}>
            {trucks.filter(t => t.status === 'Active' || !t.status).length}
          </div>
        </div>
        <div className="stat-card" style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '14px', color: '#666', fontWeight: '500' }}>In Maintenance</span>
            <span style={{ fontSize: '24px', color: '#c62828' }}>🔧</span>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#c62828', marginTop: '8px' }}>
            {trucks.filter(t => t.status === 'Maintenance').length}
          </div>
        </div>
        <div className="stat-card" style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '14px', color: '#666', fontWeight: '500' }}>In Transit</span>
            <span style={{ fontSize: '24px', color: '#1565c0' }}>⚡</span>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#1565c0', marginTop: '8px' }}>
            {trucks.filter(t => t.status === 'In Transit').length}
          </div>
        </div>
      </section>

      {/* Main Grid: Left is Fleet, Right is Active Maintenance Logs */}
      <div className="truck-fleet-layout" style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: '24px' }}>

        {/* Fleet List Card */}
        <div className="truck-fleet-panel" style={{ backgroundColor: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ margin: 0, fontSize: '18px', color: '#333' }}>Truck Fleet</h3>
            <button className="btn-add" onClick={handleOpenAdd} style={{ padding: '8px 16px', backgroundColor: '#04ab0c', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
              + Add Truck
            </button>
          </div>

          <div className="truck-fleet-table-wrap" style={{ overflowX: 'auto' }}>
            <table className="truck-fleet-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #f0f0f0', paddingBottom: '12px' }}>
                  <th style={{ padding: '12px 8px', color: '#666', fontSize: '14px', fontWeight: '600' }}>Truck Number</th>
                  <th style={{ padding: '12px 8px', color: '#666', fontSize: '14px', fontWeight: '600' }}>Type/Model</th>
                  <th style={{ padding: '12px 8px', color: '#666', fontSize: '14px', fontWeight: '600' }}>Capacity</th>
                  <th style={{ padding: '12px 8px', color: '#666', fontSize: '14px', fontWeight: '600' }}>Status</th>
                  <th style={{ padding: '12px 8px', color: '#666', fontSize: '14px', fontWeight: '600', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {trucks.map(truck => {
                  const match = truck.name.match(/^(.*?)\s*\(([^)]+)\)$/);
                  const displayId = match ? match[1] : truck.id;
                  const displayType = match ? match[2] : 'Standard';

                  return (
                    <tr key={truck.id} style={{ borderBottom: '1px solid #f9f9f9' }}>
                      <td style={{ padding: '16px 8px', fontWeight: 'bold', color: '#333' }}>
                        🚚 {displayId}
                      </td>
                      <td style={{ padding: '16px 8px', color: '#555' }}>
                        {displayType}
                      </td>
                      <td style={{ padding: '16px 8px', color: '#555', fontWeight: '500' }}>
                        {truck.maxWeight} kg
                      </td>
                      <td style={{ padding: '16px 8px' }}>
                        <span style={getStatusBadgeStyle(truck.status || 'Active')}>
                          {truck.status || 'Active'}
                        </span>
                      </td>
                      <td style={{ padding: '16px 8px', textAlign: 'right', display: 'flex', gap: '8px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                        <button
                          onClick={() => handleOpenEdit(truck)}
                          style={{ padding: '6px 12px', border: '1px solid #ddd', borderRadius: '6px', backgroundColor: 'white', color: '#555', cursor: 'pointer', fontSize: '12px', fontWeight: '500' }}
                        >
                          Edit
                        </button>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '8px' }}>
                          <button
                            onClick={() => setActiveMaintenanceTruck(truck)}
                            style={{ padding: '6px 12px', border: 'none', borderRadius: '6px', backgroundColor: '#e2f0fe', color: '#1976d2', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}
                          >
                            🔧 Repair Log
                          </button>
                          <button
                            onClick={() => handleDeleteTruck(truck.id)}
                            style={{ padding: '6px 12px', border: 'none', borderRadius: '6px', backgroundColor: '#ffebee', color: '#c62828', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Maintenance / Repair Panel */}
        <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h3 style={{ margin: 0, fontSize: '18px', color: '#333', display: 'flex', alignItems: 'center', gap: '8px' }}>
            🛠️ Maintenance & Repair Center
          </h3>

          {activeMaintenanceTruck ? (
            <div style={{ animation: 'fadeIn 0.2s', border: '1px solid #bbdefb', borderRadius: '10px', padding: '20px', backgroundColor: '#e3f2fd' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '14px' }}>
                <span style={{ fontWeight: 'bold', color: '#0d47a1', fontSize: '15px' }}>
                  Log Repair: {activeMaintenanceTruck.name.split(' ')[0]}
                </span>
                <button
                  onClick={() => { setActiveMaintenanceTruck(null); setMaintenanceIssue(''); setMaintenanceSuggestion(''); }}
                  style={{ border: 'none', background: 'none', color: '#666', cursor: 'pointer', fontSize: '13px' }}
                >
                  Cancel
                </button>
              </div>

              <form onSubmit={handleAddMaintenance} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '6px', color: '#444' }}>
                    What needs fixing? (Issue Description) *
                  </label>
                  <textarea
                    rows="3"
                    value={maintenanceIssue}
                    onChange={(e) => setMaintenanceIssue(e.target.value)}
                    placeholder="e.g. Brake squeaking, oil change needed, ac compressor not kicking in..."
                    required
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box', fontSize: '13px' }}
                  />
                </div>

                {/* Intelligent Fix Suggestions Box */}
                {activeSuggestions.length > 0 && (
                  <div style={{ backgroundColor: '#fff', border: '1px solid #b3e5fc', borderRadius: '8px', padding: '12px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#0288d1', marginBottom: '8px' }}>
                      💡 Recommended Fixes based on issue:
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {activeSuggestions.map((suggestion, index) => (
                        <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', fontSize: '11px', color: '#555', backgroundColor: '#f1f8fe', padding: '6px 8px', borderRadius: '4px' }}>
                          <span>{suggestion}</span>
                          <button
                            type="button"
                            onClick={() => {
                              const spacer = maintenanceSuggestion ? '\n' : '';
                              setMaintenanceSuggestion(prev => prev + spacer + suggestion);
                            }}
                            style={{ padding: '2px 6px', border: '1px solid #0288d1', borderRadius: '4px', backgroundColor: 'white', color: '#0288d1', cursor: 'pointer', fontSize: '10px', fontWeight: 'bold' }}
                          >
                            + Use
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '6px', color: '#444' }}>
                    Repair Suggestions / Plan to Fix
                  </label>
                  <textarea
                    rows="3"
                    value={maintenanceSuggestion}
                    onChange={(e) => setMaintenanceSuggestion(e.target.value)}
                    placeholder="Click on the smart suggestions above or type custom fix plan..."
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box', fontSize: '13px' }}
                  />
                </div>

                <button
                  type="submit"
                  style={{ width: '100%', padding: '10px', backgroundColor: '#1976d2', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  Log Maintenance & Disable Truck
                </button>
              </form>
            </div>
          ) : (
            <div style={{ padding: '20px', border: '1px dashed #ddd', borderRadius: '10px', textAlign: 'center', color: '#777', backgroundColor: '#fafafa' }}>
              Select a truck and click <strong>Repair Log</strong> to log a maintenance ticket and update its status.
            </div>
          )}

          {/* Active Maintenance Logs */}
          <div style={{ flex: 1, overflowY: 'auto', maxHeight: '400px' }}>
            <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#555' }}>
              🔧 Ongoing Maintenance Tasks
            </h4>

            {(() => {
              const pendingLogs = [];
              trucks.forEach(t => {
                if (t.maintenanceLogs) {
                  t.maintenanceLogs.forEach(log => {
                    if (log.status === 'Pending') {
                      pendingLogs.push({ ...log, truckId: t.id, truckName: t.name });
                    }
                  });
                }
              });

              if (pendingLogs.length === 0) {
                return (
                  <div style={{ padding: '20px', textAlign: 'center', color: '#aaa', fontSize: '13px' }}>
                    🎉 No active maintenance needed. All trucks are ready to roll!
                  </div>
                );
              }

              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {pendingLogs.map(log => (
                    <div key={log.id} style={{ border: '1px solid #ffcdd2', borderRadius: '8px', padding: '14px', backgroundColor: '#fff8f8' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                        <div>
                          <strong style={{ fontSize: '13px', color: '#c62828' }}>{log.truckName.split(' ')[0]}</strong>
                          <span style={{ fontSize: '11px', color: '#999', marginLeft: '8px' }}>{log.date}</span>
                        </div>
                        <button
                          onClick={() => handleResolveMaintenance(log.truckId, log.id)}
                          style={{ padding: '4px 8px', border: 'none', borderRadius: '4px', backgroundColor: '#2e7d32', color: 'white', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}
                        >
                          Resolve & Enable
                        </button>
                      </div>
                      <div style={{ fontSize: '13px', color: '#333', marginBottom: '6px' }}>
                        <strong>Issue:</strong> {log.issue}
                      </div>
                      <div style={{ fontSize: '12px', color: '#666', fontStyle: 'italic', backgroundColor: '#fcfcfc', padding: '6px 8px', borderRadius: '4px', borderLeft: '3px solid #1976d2' }}>
                        <strong>Suggested Fix:</strong> {log.suggestion}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        </div>

      </div>

      {/* Add / Edit Truck Modal */}
      {showAddEditModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000 }}>
          <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '32px', width: '400px', maxWidth: '90%', boxShadow: '0 10px 40px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '20px', color: '#333' }}>
              {editingTruck ? '✏️ Edit Truck Details' : '🚛 Add New Truck'}
            </h3>

            <form onSubmit={handleSaveTruck} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '6px', color: '#444' }}>
                  Truck ID / Number *
                </label>
                <input
                  type="text"
                  value={truckFormData.id}
                  onChange={(e) => setTruckFormData({ ...truckFormData, id: e.target.value })}
                  placeholder="e.g. TRK-005"
                  disabled={!!editingTruck}
                  required
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '6px', color: '#444' }}>
                  Truck Model / Type *
                </label>
                <input
                  type="text"
                  value={truckFormData.type}
                  onChange={(e) => setTruckFormData({ ...truckFormData, type: e.target.value })}
                  placeholder="e.g. Faw 6 Wheeler, Flatbed, Van"
                  required
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '6px', color: '#444' }}>
                  Maximum Load Capacity (kg) *
                </label>
                <input
                  type="number"
                  value={truckFormData.maxWeight}
                  onChange={(e) => setTruckFormData({ ...truckFormData, maxWeight: e.target.value })}
                  placeholder="e.g. 5000"
                  required
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '6px', color: '#444' }}>
                  Initial Status
                </label>
                <select
                  value={truckFormData.status}
                  onChange={(e) => setTruckFormData({ ...truckFormData, status: e.target.value })}
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box' }}
                >
                  <option value="Active">Active</option>
                  <option value="Maintenance">Maintenance</option>
                  <option value="In Transit">In Transit</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowAddEditModal(false)}
                  style={{ flex: 1, padding: '12px', border: '1px solid #ccc', borderRadius: '6px', backgroundColor: 'white', color: '#555', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ flex: 1, padding: '12px', border: 'none', borderRadius: '6px', backgroundColor: '#04ab0c', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  {editingTruck ? 'Update Truck' : 'Add Truck'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );

  // If sub-view (inside Logistics), render without outer sidebar/layout
  if (isSubView) {
    return mainContent;
  }

  // Otherwise, render full screen with sidebar navigation (for Admin role)
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
            <h1>🚚 Truck Fleet Management</h1>
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
