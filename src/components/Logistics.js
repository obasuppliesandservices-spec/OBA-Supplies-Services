import React, { useState, useEffect } from 'react';
import EventModal from './EventModal';
import CompletedDeliveries from './CompletedDeliveries';
import { database } from '../firebase';
import { ref, onValue, set } from 'firebase/database';
import toast from 'react-hot-toast';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { useFirebaseSync } from '../useFirebaseSync';
import useStickyState from '../useStickyState';
import { QRCodeSVG } from 'qrcode.react';
import TruckManagement from './TruckManagement';
import ReportsAnalytics from './ReportsAnalytics';
import { getVisibleJobOrderEvents } from '../deliveryUtils';

const ScannerPlugin = ({ onScanSuccess, onScanFailure }) => {
  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      "qr-reader",
      { fps: 10, qrbox: { width: 250, height: 250 } },
      false
    );
    scanner.render(onScanSuccess, onScanFailure);
    return () => {
      scanner.clear().catch(error => console.error("Failed to clear scanner.", error));
    };
  }, [onScanSuccess, onScanFailure]);

  return <div id="qr-reader" style={{ width: '100%', maxWidth: '400px', margin: '0 auto' }}></div>;
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

const getValidJobOrders = (jobOrders) => (
  Array.isArray(jobOrders)
    ? jobOrders.filter(order => order && typeof order === 'object')
    : []
);

function LogisticsAnalytics({ jobOrders = [], trips = [], doneDeliveries = [], unsuccessfulDeliveries = [], inventoryData = {} }) {
  const allInventory = Object.values(inventoryData).flat();
  const lowStockItems = allInventory.filter(item => Number(item.quantity) <= 50);
  const activeOrders = jobOrders.filter(order => !['completion', 'processed', 'assigned', 'rejected'].includes(order.status));
  const totalCompleted = doneDeliveries.filter(d => d.status !== 'completion').length;
  const totalUnsuccessful = unsuccessfulDeliveries.length;
  const totalDeliveries = totalCompleted + totalUnsuccessful;
  const successRate = totalDeliveries > 0 ? Math.round((totalCompleted / totalDeliveries) * 100) : 0;

  const jobTypeCounts = jobOrders.reduce((acc, order) => {
    const type = order.jobType || 'Other';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});
  const sortedJobTypes = Object.entries(jobTypeCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);

  const monthBuckets = Array.from({ length: 6 }, (_, index) => {
    const date = new Date();
    date.setMonth(date.getMonth() - (5 - index));
    return {
      label: date.toLocaleString('default', { month: 'short' }),
      key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
      completed: 0,
      unsuccessful: 0
    };
  });

  [...doneDeliveries, ...unsuccessfulDeliveries].forEach(item => {
    const dateValue = item.deliveredAt || item.date || item.createdAt;
    const date = new Date(dateValue);
    if (!dateValue || Number.isNaN(date.getTime())) return;
    const bucket = monthBuckets.find(b => b.key === `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
    if (bucket) {
      if (item.status !== 'completion') {
        bucket.completed += 1;
      } else {
        bucket.unsuccessful += 1;
      }
    }
  });
  const maxMonthValue = Math.max(...monthBuckets.map(b => b.completed + b.unsuccessful), 1);

  return (
    <div style={{ display: 'grid', gap: '22px' }}>
      <section className="stats-section">
        <StatCard title="Active Orders" value={activeOrders.length} icon="📦" />
        <StatCard title="Success Rate" value={`${successRate}%`} icon="✅" />
        <StatCard title="Open Trips" value={trips.length} icon="🚚" />
        <StatCard title="Low Stock SKUs" value={lowStockItems.length} icon="⚠️" />
      </section>

      <section style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', alignItems: 'start' }}>
        <div style={{ background: 'white', border: '1px solid #e6f4ea', borderRadius: '16px', padding: '24px', boxShadow: '0 14px 40px rgba(4, 171, 12, 0.08)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '20px', color: '#102a18' }}>Delivery Performance</h2>
              <p style={{ margin: '6px 0 0', color: '#5c7665', fontSize: '14px' }}>Recent completed and unsuccessful delivery activity.</p>

            </div>
            <span style={{ color: '#047857', fontWeight: '700' }}>{totalDeliveries} tracked</span>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end', height: '200px' }}>
            {monthBuckets.map(bucket => {
              const total = bucket.completed + bucket.unsuccessful;
              return (
                <div key={bucket.key} style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center' }}>
                  <div style={{ width: '100%', maxWidth: '40px', height: `${Math.max((total / maxMonthValue) * 160, 12)}px`, borderRadius: '12px', background: 'linear-gradient(180deg, #04ab0c, #047857)' }} title={`${bucket.completed} successful, ${bucket.unsuccessful} unsuccessful`} />
                  <span style={{ marginTop: '10px', fontSize: '12px', color: '#5c7665' }}>{bucket.label}</span>
                </div>
              );
            })}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '20px', color: '#6b7c6b', fontSize: '13px' }}>
            <span>✅ Completed: {totalCompleted}</span>
            <span style={{ color: '#bf4f00' }}>⚠️ Unsuccessful: {totalUnsuccessful}</span>
          </div>
        </div>

        <div style={{ background: 'white', border: '1px solid #e6f4ea', borderRadius: '16px', padding: '24px', boxShadow: '0 14px 40px rgba(4, 171, 12, 0.08)' }}>
          <h2 style={{ margin: 0, fontSize: '20px', color: '#102a18' }}>Job Order Mix</h2>
          <p style={{ margin: '6px 0 20px', color: '#5c7665', fontSize: '14px' }}>Most frequent order types in the system.</p>
          {sortedJobTypes.length === 0 ? (
            <p style={{ color: '#7a8b7c', fontSize: '14px' }}>No job order types are available yet.</p>
          ) : (
            <div style={{ display: 'grid', gap: '14px' }}>
              {sortedJobTypes.map(([type, count]) => (
                <div key={type} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '12px', alignItems: 'center' }}>
                  <div>
                    <div style={{ color: '#102a18', fontWeight: '700' }}>{type}</div>
                    <div style={{ color: '#6b7c6b', fontSize: '13px' }}>{count} orders</div>
                  </div>
                  <div style={{ minWidth: '100px', height: '10px', background: '#e9f5ee', borderRadius: '999px', overflow: 'hidden' }}>
                    <div style={{ width: `${Math.min((count / Math.max(...sortedJobTypes.map(([, c]) => c))) * 100, 100)}%`, height: '100%', background: '#04ab0c' }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '20px' }}>
        <div style={{ background: 'white', border: '1px solid #e6f4ea', borderRadius: '16px', padding: '22px', boxShadow: '0 14px 40px rgba(4, 171, 12, 0.08)' }}>
          <div style={{ fontSize: '13px', color: '#5c7665', marginBottom: '8px' }}>Inventory Readiness</div>
          <div style={{ fontSize: '32px', fontWeight: '700', color: '#047857' }}>{allInventory.length}</div>
          <div style={{ marginTop: '10px', color: '#6b7c6b', fontSize: '14px' }}>{lowStockItems.length} items need restock</div>
        </div>
        <div style={{ background: 'white', border: '1px solid #e6f4ea', borderRadius: '16px', padding: '22px', boxShadow: '0 14px 40px rgba(4, 171, 12, 0.08)' }}>
          <div style={{ fontSize: '13px', color: '#5c7665', marginBottom: '8px' }}>Trips in Progress</div>
          <div style={{ fontSize: '32px', fontWeight: '700', color: '#047857' }}>{trips.length}</div>
          <div style={{ marginTop: '10px', color: '#6b7c6b', fontSize: '14px' }}>Current truck assignments active</div>
        </div>
        <div style={{ background: 'white', border: '1px solid #e6f4ea', borderRadius: '16px', padding: '22px', boxShadow: '0 14px 40px rgba(4, 171, 12, 0.08)' }}>
          <div style={{ fontSize: '13px', color: '#5c7665', marginBottom: '8px' }}>Pending Orders</div>
          <div style={{ fontSize: '32px', fontWeight: '700', color: '#047857' }}>{activeOrders.length}</div>
          <div style={{ marginTop: '10px', color: '#6b7c6b', fontSize: '14px' }}>Orders still awaiting allocation</div>
        </div>
      </section>

      <section style={{ background: 'white', border: '1px solid #e6f4ea', borderRadius: '18px', padding: '24px', boxShadow: '0 14px 40px rgba(4, 171, 12, 0.08)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '20px', color: '#102a18' }}>Recent Logistics Orders</h2>
            <p style={{ margin: '6px 0 0', color: '#5c7665', fontSize: '14px' }}>Latest orders pulled from the current logistics system data.</p>
          </div>
          <span style={{ color: '#047857', fontWeight: '700' }}>{jobOrders.length} total orders</span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '760px' }}>
            <thead>
              <tr style={{ background: '#ecf7ed', color: '#1f4d2f', textAlign: 'left' }}>
                <th style={{ padding: '14px 16px', fontWeight: '700', borderBottom: '1px solid #dfede2' }}>Customer</th>
                <th style={{ padding: '14px 16px', fontWeight: '700', borderBottom: '1px solid #dfede2' }}>Service / Product</th>
                <th style={{ padding: '14px 16px', fontWeight: '700', borderBottom: '1px solid #dfede2' }}>Order Date</th>
                <th style={{ padding: '14px 16px', fontWeight: '700', borderBottom: '1px solid #dfede2' }}>Amount</th>
                <th style={{ padding: '14px 16px', fontWeight: '700', borderBottom: '1px solid #dfede2' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {jobOrders.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ padding: '20px', color: '#6b7c6b', textAlign: 'center' }}>No order records available yet.</td>
                </tr>
              ) : (
                [...jobOrders]
                  .sort((a, b) => {
                    const aTime = a.startDate ? new Date(a.startDate).getTime() : 0;
                    const bTime = b.startDate ? new Date(b.startDate).getTime() : 0;
                    return bTime - aTime;
                  })
                  .slice(0, 8)
                  .map((order, index) => {
                    const amountValue = order.price ? `₱ ${Number(order.price).toFixed(2)}` : order.quantity ? `${order.quantity} pcs` : '-';
                    const orderDate = order.startDate ? new Date(order.startDate).toLocaleDateString() : 'N/A';
                    const statusLabel = order.status ? order.status.charAt(0).toUpperCase() + order.status.slice(1) : 'Pending';
                    const statusColor = order.status === 'completion' ? '#046a21' : order.status === 'assigned' ? '#0e5f9f' : order.status === 'rejected' || order.status === 'cancelled' ? '#b91c1c' : '#6b7c6b';

                    return (
                      <tr key={`${order.id || index}-${order.customerName || index}`} style={{ borderBottom: '1px solid #eef5ef' }}>
                        <td style={{ padding: '14px 16px', color: '#23322a' }}>{order.customerName || 'Unknown'}</td>
                        <td style={{ padding: '14px 16px', color: '#344e3a' }}>{order.jobType || order.position || 'Service'}</td>
                        <td style={{ padding: '14px 16px', color: '#5d6e65' }}>{orderDate}</td>
                        <td style={{ padding: '14px 16px', color: '#5d6e65' }}>{amountValue}</td>
                        <td style={{ padding: '14px 16px' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minWidth: '90px', padding: '6px 10px', borderRadius: '999px', background: `${statusColor}20`, color: statusColor, fontWeight: '600', fontSize: '13px' }}>
                            {statusLabel}
                          </span>
                        </td>
                      </tr>
                    );
                  })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

const initialInventoryData = {
  warehouse1: [
    { id: 1, name: 'Rockwool Insulation Panels', category: 'Insulations and Cladding', quantity: 150, unit: 'pcs', weight: 15 },
    { id: 2, name: 'Aluminum Cladding Sheets', category: 'Insulations and Cladding', quantity: 300, unit: 'sheets', weight: 15 },
    { id: 3, name: 'Fiber Glass Insulation Rolls', category: 'Insulations and Cladding', quantity: 80, unit: 'rolls', weight: 15 },
    { id: 4, name: 'Stainless Steel Cladding', category: 'Insulations and Cladding', quantity: 120, unit: 'sheets', weight: 15 },
    { id: 5, name: 'Cladding Fasteners', category: 'Insulations and Cladding', quantity: 500, unit: 'boxes', weight: 5 },
    { id: 6, name: 'Perlite Powder', category: 'Cold Box Insulation', quantity: 50, unit: 'bags', weight: 50 },
    { id: 7, name: 'Polyurethane Foam', category: 'Cold Box Insulation', quantity: 75, unit: 'drums', weight: 10 },
    { id: 8, name: 'Cryogenic Insulation Blankets', category: 'Cold Box Insulation', quantity: 40, unit: 'rolls', weight: 10 },
    { id: 9, name: 'Cellular Glass Blocks', category: 'Cold Box Insulation', quantity: 200, unit: 'blocks', weight: 50 },
    { id: 10, name: 'Mastic Sealant', category: 'Cold Box Insulation', quantity: 30, unit: 'pails', weight: 15 },
    { id: 11, name: 'Epoxy Resin Coating', category: 'Equipment Foundation Coating', quantity: 40, unit: 'pails', weight: 20 },
    { id: 12, name: 'Anti-corrosion Primer', category: 'Equipment Foundation Coating', quantity: 60, unit: 'pails', weight: 20 },
    { id: 13, name: 'Epoxy Grout', category: 'Equipment Foundation Coating', quantity: 80, unit: 'bags', weight: 50 },
    { id: 14, name: 'Zinc Rich Primer', category: 'Equipment Foundation Coating', quantity: 45, unit: 'gallons', weight: 20 },
    { id: 15, name: 'Polyaspartic Topcoat', category: 'Equipment Foundation Coating', quantity: 25, unit: 'gallons', weight: 20 },
    { id: 16, name: 'Welding Electrodes (E6013)', category: 'Welding and Fabrication', quantity: 200, unit: 'boxes', weight: 5 },
    { id: 17, name: 'Mild Steel Plates', category: 'Welding and Fabrication', quantity: 120, unit: 'pcs', weight: 45 },
    { id: 18, name: 'Welding Electrodes (E7018)', category: 'Welding and Fabrication', quantity: 150, unit: 'boxes', weight: 5 },
    { id: 19, name: 'TIG Welding Wire', category: 'Welding and Fabrication', quantity: 60, unit: 'spools', weight: 5 },
    { id: 20, name: 'Steel Angle Bars', category: 'Welding and Fabrication', quantity: 300, unit: 'pcs', weight: 45 },
    { id: 21, name: 'Grinding Discs', category: 'Welding and Fabrication', quantity: 150, unit: 'boxes', weight: 15 },
    { id: 22, name: 'Seamless Copper Tubes', category: 'Cooler Tube Replacement', quantity: 80, unit: 'bundles', weight: 45 },
    { id: 23, name: 'Vacuum Insulated Panels (VIP)', category: 'VIP Installation', quantity: 250, unit: 'pcs', weight: 15 },
    { id: 24, name: 'Protective Foil Tape', category: 'VIP Installation', quantity: 100, unit: 'rolls', weight: 2 },
    { id: 25, name: 'Desiccant Packs', category: 'VIP Installation', quantity: 50, unit: 'boxes', weight: 2 },
    { id: 26, name: 'Vacuum Pump Oil', category: 'VIP Installation', quantity: 20, unit: 'liters', weight: 25 },
  ],
  warehouse2: [
    { id: 27, name: 'Stainless Steel Pipes 304', category: 'Liquid Nitrogen Piping', quantity: 100, unit: 'lengths', weight: 45 },
    { id: 28, name: 'Cryogenic Valves', category: 'Liquid Nitrogen Piping', quantity: 30, unit: 'pcs', weight: 25 },
    { id: 29, name: 'Cryogenic Globe Valves', category: 'Liquid Nitrogen Piping', quantity: 15, unit: 'pcs', weight: 25 },
    { id: 30, name: 'High-Pressure Flanges', category: 'Liquid Nitrogen Piping', quantity: 120, unit: 'pcs', weight: 25 },
    { id: 31, name: 'VJ Piping Segments', category: 'Liquid Nitrogen Piping', quantity: 40, unit: 'lengths', weight: 15 },
    { id: 32, name: 'Teflon Gaskets', category: 'Liquid Nitrogen Piping', quantity: 200, unit: 'packs', weight: 15 },
    { id: 33, name: 'Dye Penetrant Spray', category: 'Crack Detection Test', quantity: 45, unit: 'cans', weight: 15 },
    { id: 34, name: 'Developer Spray', category: 'Crack Detection Test', quantity: 45, unit: 'cans', weight: 15 },
    { id: 35, name: 'Magnetic Particle Inspection Kit', category: 'Crack Detection Test', quantity: 5, unit: 'kits', weight: 15 },
    { id: 36, name: 'Ultrasonic Couplant Gel', category: 'Crack Detection Test', quantity: 20, unit: 'bottles', weight: 2 },
    { id: 37, name: 'Radiographic Film', category: 'Crack Detection Test', quantity: 10, unit: 'boxes', weight: 15 },
    { id: 38, name: 'UV Inspection Lamps', category: 'Crack Detection Test', quantity: 3, unit: 'sets', weight: 15 },
    { id: 39, name: 'Industrial Polyurethane Paint (White)', category: 'Repainting', quantity: 100, unit: 'gallons', weight: 20 },
    { id: 40, name: 'Epoxy Primer', category: 'Repainting', quantity: 80, unit: 'gallons', weight: 20 },
    { id: 41, name: 'Paint Thinner / Solvent', category: 'Repainting', quantity: 50, unit: 'drums', weight: 20 },
    { id: 42, name: 'Polyurethane Topcoat', category: 'Repainting', quantity: 70, unit: 'gallons', weight: 20 },
    { id: 43, name: 'Abrasive Blasting Sand', category: 'Repainting', quantity: 140, unit: 'bags', weight: 50 },
    { id: 44, name: 'Measurement Toolkits', category: 'Professional ME Consultancy', quantity: 10, unit: 'sets', weight: 15 },
    { id: 45, name: 'Thermal Imaging Cameras', category: 'Professional ME Consultancy', quantity: 2, unit: 'units', weight: 15 },
    { id: 46, name: 'Vibration Analyzers', category: 'Professional ME Consultancy', quantity: 4, unit: 'units', weight: 15 },
    { id: 47, name: 'Digital Calipers', category: 'Professional ME Consultancy', quantity: 15, unit: 'sets', weight: 15 },
    { id: 48, name: 'Heat Exchanger Gaskets', category: 'Cooler Tube Replacement', quantity: 150, unit: 'pcs', weight: 15 },
    { id: 49, name: 'Tube Plugs', category: 'Cooler Tube Replacement', quantity: 300, unit: 'pcs', weight: 45 },
    { id: 50, name: 'Cupronickel Tubes', category: 'Cooler Tube Replacement', quantity: 120, unit: 'lengths', weight: 45 },
    { id: 51, name: 'Baffle Plates', category: 'Cooler Tube Replacement', quantity: 40, unit: 'pcs', weight: 45 },
    { id: 52, name: 'Sealant Tapes', category: 'VIP Installation', quantity: 300, unit: 'rolls', weight: 2 },
  ]
};

const getWarehouseCatalogItems = () => {
  const readCatalog = (key) => {
    try {
      const saved = localStorage.getItem(key);
      const parsed = saved ? JSON.parse(saved) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      return [];
    }
  };

  const services = readCatalog('adminService_services');
  const products = readCatalog('adminProduct_products');

  return [
    ...products.filter(product => product?.name).map((product, index) => ({
      id: `product-${index}-${product.name}`,
      name: product.name,
      category: 'Products',
      quantity: 0,
      unit: 'items',
      weight: 15
    })),
    ...services.filter(service => service?.title).map((service, index) => ({
      id: `service-${index}-${service.title}`,
      name: service.title,
      category: 'Services',
      quantity: 0,
      unit: 'items',
      weight: 15
    }))
  ];
};

const DEFAULT_TRUCKS = [
  { id: 'TRK-001', name: 'TRK-001 (Faw 6 Wheeler)', maxWeight: 5000, gridZones: Math.floor(5000 / 100) },
  { id: 'TRK-002', name: 'TRK-002 (Isuzu ELF)', maxWeight: 3000, gridZones: Math.floor(3000 / 100) },
  { id: 'TRK-003', name: 'TRK-003 (Fuso Fighter)', maxWeight: 8000, gridZones: Math.floor(8000 / 100) },
  { id: 'TRK-004', name: 'TRK-004 (Delivery Van)', maxWeight: 1500, gridZones: Math.floor(1500 / 100) }
];

export const getSuggestedTruckForWeight = (requiredWeight, truckList = DEFAULT_TRUCKS) => {
  const activeTrucks = (truckList || []).filter(t => t && t.status !== 'Maintenance');
  const pool = activeTrucks.length > 0 ? activeTrucks : (truckList || DEFAULT_TRUCKS);
  const sortedTrucks = [...pool].sort((a, b) => (Number(a.maxWeight) || 0) - (Number(b.maxWeight) || 0));
  if (sortedTrucks.length === 0) return DEFAULT_TRUCKS[0];
  return sortedTrucks.find(truck => (Number(truck.maxWeight) || 0) >= requiredWeight) || sortedTrucks[sortedTrucks.length - 1];
};

export const getNextHigherCapacityTruck = (currentTruckIdentifier, requiredWeight, truckList = DEFAULT_TRUCKS) => {
  const activeTrucks = (truckList || []).filter(t => t && t.status !== 'Maintenance');
  const pool = activeTrucks.length > 0 ? activeTrucks : (truckList || DEFAULT_TRUCKS);
  const sortedTrucks = [...pool].sort((a, b) => (Number(a.maxWeight) || 0) - (Number(b.maxWeight) || 0));
  if (sortedTrucks.length === 0) return DEFAULT_TRUCKS[0];

  const currentTruck = sortedTrucks.find(t => 
    t.name === currentTruckIdentifier || 
    t.id === currentTruckIdentifier || 
    (typeof currentTruckIdentifier === 'object' && currentTruckIdentifier !== null && (t.id === currentTruckIdentifier.id || t.name === currentTruckIdentifier.name))
  );

  const currentCapacity = currentTruck ? (Number(currentTruck.maxWeight) || 0) : 0;
  
  const higherTrucksThatFit = sortedTrucks.filter(t => (Number(t.maxWeight) || 0) > currentCapacity && (Number(t.maxWeight) || 0) >= requiredWeight);
  if (higherTrucksThatFit.length > 0) {
    return higherTrucksThatFit[0];
  }

  const higherTrucks = sortedTrucks.filter(t => (Number(t.maxWeight) || 0) > currentCapacity);
  if (higherTrucks.length > 0) {
    return higherTrucks[higherTrucks.length - 1];
  }

  return sortedTrucks[sortedTrucks.length - 1];
};

export const getTripPrefillData = ({ selectedTruck = '', assignedManpower = [], processingJobOrder = null, employees = [] } = {}) => {
  let empList = employees;
  if (!Array.isArray(empList) || empList.length === 0) {
    try {
      const cached = localStorage.getItem('app_employees_cache');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) empList = parsed;
      }
    } catch (e) {}
  }

  const truckMatch = selectedTruck.match(/^(.*?)\s*\(([^)]+)\)$/);
  const truckNumber = truckMatch ? truckMatch[1].trim() : selectedTruck.split(' ')[0] || '';
  const truckType = truckMatch ? truckMatch[2].trim() : selectedTruck.replace(truckNumber, '').trim().replace(/^\(|\)$/g, '') || '';

  // Only present employees in Driver/Pahinante department
  const presentDrivers = (empList || [])
    .filter(emp => emp && emp.name && emp.status === 'Present' && emp.department === 'Driver/Pahinante')
    .map(emp => emp.name);

  // Fallback to any present employees if no specific Driver/Pahinante department list
  const presentEmployees = (empList || [])
    .filter(emp => emp && emp.name && emp.status === 'Present')
    .map(emp => emp.name);

  const candidateNames = presentDrivers.length > 0 ? presentDrivers : presentEmployees;
  const driver = candidateNames[0] || '';
  const pahintate = candidateNames[1] || candidateNames[0] || '';

  return {
    truckNumber,
    truckType,
    driver,
    pahintate,
    selectedJobOrders: processingJobOrder?.id ? [processingJobOrder.id] : []
  };
};

export const getAvailableDriverPahinanteOptions = (employees = [], trips = [], arrivedTripIds = []) => {
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
    pahintateOptions: availableOptions,
    reservedNames: Array.from(reservedNames)
  };
};

export const getAutoSelectedDriverPahinante = (employees = [], trips = [], arrivedTripIds = [], currentDriver = '', currentPahinante = '') => {
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

const getAssistantName = (trip = {}) => trip.assistant || trip.pahintate || '';

export const getTruckArrivalTrips = (trips = [], arrivedTripIds = []) => {
  const normalizeTimestamp = (value) => {
    if (!value) return 0;
    const parsed = new Date(value).getTime();
    return Number.isNaN(parsed) ? 0 : parsed;
  };

  return [...(trips || [])]
    .sort((a, b) => normalizeTimestamp(b?.createdAt || b?.createdDate || b?.id) - normalizeTimestamp(a?.createdAt || a?.createdDate || a?.id))
    .map(trip => ({
      id: trip.id,
      truckNumber: trip.truckNumber || '',
      truckType: trip.truckType || 'Standard',
      driver: trip.driver || '',
      assistant: getAssistantName(trip),
      isArrived: (arrivedTripIds || []).includes(trip.id)
    }));
};

export const buildArrivalHistoryEntry = (trip = {}, arrivedAt = new Date()) => ({
  id: `${trip.id || 'trip'}-${arrivedAt.getTime()}`,
  tripId: trip.id,
  truckNumber: trip.truckNumber || '',
  truckType: trip.truckType || 'Standard',
  driver: trip.driver || '',
  assistant: getAssistantName(trip),
  arrivedAt: arrivedAt.toLocaleString()
});

export const getAutoAssignedManpower = (employees = [], requiredCount = 0) => {
  let empList = employees;
  if (!Array.isArray(empList) || empList.length === 0) {
    try {
      const cached = localStorage.getItem('app_employees_cache');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          empList = parsed;
        }
      }
    } catch (e) {}
  }

  // Manpower excludes employees reserved for driver/pahinante selection.
  const presentEmployees = (empList || [])
    .filter(emp => emp && emp.name && emp.status === 'Present' && emp.department !== 'Driver/Pahinante')
    .map(emp => emp.name);

  return presentEmployees.slice(0, Math.max(0, requiredCount || 0));
};

export default function Logistics({ user, onLogout, onNavigate, events, onMarkDone, onMarkDeliveryDone = onMarkDone, onStartContract, doneDeliveries = [], onUndoDone, unsuccessfulDeliveries = [], onMarkUnsuccessful, onUndoUnsuccessful, onAddEvent, onOpenJobOrderModal, jobOrders = [], onRemoveEvent, onRemoveDoneEvent, onRemoveUnsuccessfulEvent, onRemoveJobOrder, adminNotifications, setAdminNotifications, trips = [], onAddTrip, onUpdateJobOrderStatus, trucks = [], onUpdateTrucks, employees: propEmployees = [], initialActiveTab = 'dashboard' }) {
  const TRUCKS = trucks && trucks.length > 0 ? trucks : DEFAULT_TRUCKS;
  const [truckInfoSubTab, setTruckInfoSubTab] = useStickyState('management', 'logistics_truckInfoSubTab');
  const [inventoryData, setInventoryData] = useState(() => ({
    ...initialInventoryData,
    warehouse1: getWarehouseCatalogItems()
  }));
  const [restockItem, setRestockItem] = useState(null);
  const [restockQuantity, setRestockQuantity] = useState('');

  useEffect(() => {
    const syncWarehouseCatalog = () => {
      const catalogItems = getWarehouseCatalogItems();
      setInventoryData(prev => {
        const previousItems = prev.warehouse1 || [];
        const previousByName = new Map(previousItems.map(item => [item.name, item]));
        const mergedItems = catalogItems.map(item => ({
          ...item,
          quantity: previousByName.get(item.name)?.quantity || 0
        }));

        return { ...prev, warehouse1: mergedItems };
      });
    };

    window.addEventListener('storage', syncWarehouseCatalog);
    syncWarehouseCatalog();
    return () => window.removeEventListener('storage', syncWarehouseCatalog);
  }, []);
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
  const [arrivedTripIds, setArrivedTripIds] = useFirebaseSync('active_logistics_session/arrivedTripIds', []);
  const [arrivalHistory, setArrivalHistory] = useFirebaseSync('active_logistics_session/arrivalHistory', []);
  const [showArrivalHistory, setShowArrivalHistory] = useState(false);
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

    const effectiveJobOrders = getValidJobOrders((jobOrders && jobOrders.length > 0) ? jobOrders : cachedJobOrders);
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
    const effectiveJobOrders = getValidJobOrders((jobOrders && jobOrders.length > 0) ? jobOrders : cachedJobOrders);
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

  const handleRestock = (e) => {
    e.preventDefault();
    const quantityToAdd = parseInt(restockQuantity, 10);
    if (!isNaN(quantityToAdd) && quantityToAdd > 0) {
      setInventoryData(prev => {
        const newData = { ...prev };
        const warehouse = Object.keys(newData).find(w => newData[w].some(i => i.id === restockItem.id));
        if (warehouse) {
          newData[warehouse] = newData[warehouse].map(item => 
            item.id === restockItem.id ? { ...item, quantity: item.quantity + quantityToAdd } : item
          );
        }
        return newData;
      });
      toast.success(`Successfully restocked ${quantityToAdd} ${restockItem.unit} of ${restockItem.name}`);
      setRestockItem(null);
      setRestockQuantity('');
    }
  };

  const [activeTab, setActiveTab] = useStickyState(initialActiveTab, 'logistics_activeTab');
  const [activeWarehouse, setActiveWarehouse] = useState('warehouse1');
  const [selectedQrItem, setSelectedQrItem] = useState(null);

  const completedTripIds = new Set((tripHistory || []).map(entry => entry.id));
  const activeTrips = (trips || [])
    .filter(trip => !completedTripIds.has(trip.id) && trip.tripStatus !== 'unsuccessful')
    .sort((a, b) => {
      const timeA = new Date(a.createdAt || a.id || a.createdDate || 0).getTime();
      const timeB = new Date(b.createdAt || b.id || b.createdDate || 0).getTime();
      return timeB - timeA;
    });

  // Deliveries Process State
  const [processingJobOrder, setProcessingJobOrder] = useFirebaseSync('active_logistics_session/processingJobOrder', null);
  const [processStep, setProcessStep] = useFirebaseSync('active_logistics_session/processStep', 1);
  const [visualZoom, setVisualZoom] = useState(1.2);
  const [visualPan, setVisualPan] = useState({ x: 0, y: 0 });
  const [isDraggingTruck, setIsDraggingTruck] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [deliveryData, setDeliveryData] = useFirebaseSync('active_logistics_session/deliveryData', {
    assignedManpower: [],
    scannedEquipment: [],
    selectedTruck: '',
    maxWeight: 0,
    placedItems: {}
  });
  const [scannerState, setScannerState] = useState('disconnected'); // 'disconnected', 'connecting', 'connected', 'scanning'

  const [modalOpen, setModalOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [modalView, setModalView] = useState(null);

  // Trip Manager state
  const [newTrip, setNewTrip] = useState({
    truckNumber: '', truckType: '', driver: '', pahintate: '', selectedJobOrders: []
  });
  const [showTripModal, setShowTripModal] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showNotifications && !event.target.closest('.notifications-icon') && !event.target.closest('.notifications-dropdown')) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showNotifications]);

  useEffect(() => {
    if (!processingJobOrder || processStep !== 1) return;
    const currentAssigned = deliveryData?.assignedManpower || [];
    const activeEmployees = employees && employees.length > 0 ? employees : (() => {
      try {
        const cached = localStorage.getItem('app_employees_cache');
        if (cached) return JSON.parse(cached);
      } catch (e) {}
      return [];
    })();

    if (currentAssigned.length === 0 && activeEmployees.length > 0) {
      const autoAssigned = getAutoAssignedManpower(activeEmployees, processingJobOrder.manpower || 0);
      if (autoAssigned.length > 0) {
        setDeliveryData(prev => ({ ...(prev || {}), assignedManpower: autoAssigned }));
      }
    }
  }, [processingJobOrder, processStep, employees, deliveryData?.assignedManpower]);

  useEffect(() => {
    if (!processingJobOrder || processStep !== 2 || deliveryData?.selectedTruck) return;
    if (!deliveryData?.assignedManpower?.length) return;

    const scannedWeight = (deliveryData?.scannedEquipment || []).reduce((sum, item) => sum + ((item.weight || 15) * item.scanQty), 0);
    const preferredTruck = getSuggestedTruckForWeight(scannedWeight, TRUCKS);
    if (preferredTruck) {
      setDeliveryData(prev => ({
        ...(prev || {}),
        selectedTruck: preferredTruck.name,
        maxWeight: preferredTruck.maxWeight
      }));
    }
  }, [processingJobOrder, processStep, deliveryData?.assignedManpower, deliveryData?.scannedEquipment, deliveryData?.selectedTruck, TRUCKS]);

  useEffect(() => {
    if (!showTripModal) return;
    const { driver, pahintate } = getAutoSelectedDriverPahinante(employees, activeTrips, arrivedTripIds, newTrip.driver, newTrip.pahintate);
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
  }, [showTripModal, employees, activeTrips, arrivedTripIds, newTrip.driver, newTrip.pahintate]);

  const handleAddEvent = (eventData) => {
    onAddEvent(eventData);
    setModalOpen(false);
  };

  // Trip Manager Handlers
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewTrip({ ...newTrip, [name]: value });
  };

  const handleJobOrderSelect = (jobOrderId) => {
    const updated = newTrip.selectedJobOrders.includes(jobOrderId)
      ? newTrip.selectedJobOrders.filter(id => id !== jobOrderId)
      : [...newTrip.selectedJobOrders, jobOrderId];
    setNewTrip({ ...newTrip, selectedJobOrders: updated });
  };

  const handleTripSubmit = (e) => {
    e.preventDefault();
    if (newTrip.truckNumber && newTrip.driver && newTrip.pahintate && newTrip.selectedJobOrders.length > 0) {
      const effectiveJobOrders = getValidJobOrders((jobOrders && jobOrders.length > 0) ? jobOrders : cachedJobOrders);
      const totalManpower = (newTrip.selectedJobOrders || []).reduce((total, id) => {
        const order = effectiveJobOrders.find(o => o.id === id);
        return total + (order ? Number(order.manpower) || 0 : 0);
      }, 0);
      const tripData = {
        ...newTrip,
        id: Date.now(),
        totalManpower,
        createdAt: new Date().toISOString(),
        createdDate: new Date().toISOString().split('T')[0]
      };
      if (onAddTrip) {
        onAddTrip(tripData);
      }

      newTrip.selectedJobOrders.forEach((jobOrderId, index) => {
        const jobOrder = effectiveJobOrders.find(order => order.id === jobOrderId);
        if (jobOrder && onAddEvent) {
          const tripEvent = {
            id: Date.now() + index,
            name: `🚚 Trip: ${jobOrder.customerName} - ${jobOrder.jobType} (${newTrip.truckNumber})`,
            createdAt: new Date().toISOString(),
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
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
        truckNumber: '', truckType: '', driver: '', pahintate: '', selectedJobOrders: []
      });
      setShowTripModal(false);
      toast.success('Trip created successfully!');
    } else {
      toast.error('Please fill in all fields and select at least one job order.');
    }
  };

  const effectiveJobOrders = getValidJobOrders((jobOrders && jobOrders.length > 0) ? jobOrders : cachedJobOrders);

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
    const orders = effectiveJobOrders.filter(o => jobOrderIds.includes(o.id));
    if (orders.length === 0) return 'Loading loads...';
    return orders.map(o => o.jobType).join(', ');
  };

  const getDeliveryInfo = (jobOrderIds) => {
    if (!jobOrderIds || jobOrderIds.length === 0) return 'No deliveries';
    const orders = effectiveJobOrders.filter(o => jobOrderIds.includes(o.id));
    if (orders.length === 0) return 'Loading delivery info...';
    const deliveryInfo = orders.map(o => `${o.customerName} (${o.company}) - ${o.address}`);
    return deliveryInfo.join('; ');
  };

  const handleTripArrival = (trip) => {
    if (!trip || arrivedTripIds.includes(trip.id)) return;
    const arrivedAt = new Date();
    setArrivedTripIds(prev => [...prev, trip.id]);
    setArrivalHistory(prev => [buildArrivalHistoryEntry(trip, arrivedAt), ...prev]);
  };

  const handleTripUnsuccessful = (trip) => {
    if (!trip) return;
    setTripHistory(prev => {
      if (prev.some(entry => entry.id === trip.id)) return prev;
      return [{
        ...trip,
        completedAt: new Date().toLocaleString(),
        completedReason: 'Unsuccessful Delivery',
        tripStatus: 'unsuccessful'
      }, ...prev];
    });
    setShowTripHistory(true);
    toast.success('Trip moved to history as Unsuccessful Delivery.');
  };

  // Dynamic Chart Data Generation for Total Deliveries (Jan to Dec)
  const now = new Date();
  const currentYear = now.getFullYear();
  const chartData = [];

  for (let month = 0; month < 12; month++) {
    const d = new Date(currentYear, month, 1);
    chartData.push({
      label: d.toLocaleString('default', { month: 'short' }),
      monthKey: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      value: month < 7 ? dummyCompletedByMonth[month] + dummyUnsuccessfulByMonth[month] : 0
    });
  }

  // Aggregate completed deliveries by month
  (doneDeliveries || [])
    .filter(delivery => delivery?.status !== 'completion')
    .forEach(delivery => {
    if (delivery.date) {
      const deliveryDate = new Date(delivery.date);
      const deliveryMonth = `${deliveryDate.getFullYear()}-${String(deliveryDate.getMonth() + 1).padStart(2, '0')}`;
      const targetMonth = chartData.find(month => month.monthKey === deliveryMonth);
      if (targetMonth) targetMonth.value += 1;
    }
    });

  // Aggregate unsuccessful deliveries by month
  (unsuccessfulDeliveries || []).forEach(delivery => {
    if (delivery.date) {
      const deliveryDate = new Date(delivery.date);
      const deliveryMonth = `${deliveryDate.getFullYear()}-${String(deliveryDate.getMonth() + 1).padStart(2, '0')}`;
      const targetMonth = chartData.find(month => month.monthKey === deliveryMonth);
        if (targetMonth) {
          targetMonth.value += 1;
        }
    }
  });

  const maxValue = Math.max(...chartData.map(d => d.value), 200);
  const roundedMax = Math.ceil(maxValue / 50) * 50;
  const deliveryStatusTotal = completedDeliveriesCount + unsuccessfulDeliveriesCount;
  const completedShare = deliveryStatusTotal ? completedDeliveriesCount / deliveryStatusTotal : 0;
  const pieCircumference = 2 * Math.PI * 70;

  const endedJobOrderTrend = Array.from({ length: 12 }, (_, month) => ({
    label: new Date(currentYear, month, 1).toLocaleString('default', { month: 'short' }),
    value: month < 7 ? dummyEndedJobOrdersByMonth[month] : 0
  }));

  (doneDeliveries || [])
    .filter(delivery => delivery?.status === 'completion')
    .forEach(delivery => {
      const completionDate = new Date(delivery.deliveredAt || delivery.completionDate || delivery.date);
      if (!Number.isNaN(completionDate.getTime()) && completionDate.getFullYear() === currentYear) {
        endedJobOrderTrend[completionDate.getMonth()].value += 1;
      }
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

  const xOffsets = [42, 76, 110, 144, 178, 212, 246, 280, 314, 348, 382, 416];

  return (
    <>
      <style>{`
        @media (max-width: 768px) {
          .dashboard-page {
            display: block;
            min-height: 100vh;
            height: auto;
            overflow: visible;
          }
          .sidebar-left {
            width: 190px !important;
            height: 100vh !important;
            position: fixed;
            top: 0;
            bottom: 0;
            z-index: 1000;
            padding: 18px 10px;
            background: rgba(12, 136, 47, 0.9);
            box-shadow: 4px 0 18px rgba(15,23,42,0.12);
          }
          .sidebar-logo {
            display: block !important;
          }
          .sidebar-nav ul {
            display: block !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .nav-item {
            padding: 9px 8px !important;
            font-size: 12px !important;
            margin-bottom: 3px !important;
          }
          .dashboard-main {
            margin-left: 0 !important;
            width: 100% !important;
            padding-bottom: 24px !important;
            overflow: visible;
          }
          .stats-section {
            display: grid !important;
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
            gap: 10px !important;
          }
          .dashboard-header {
            flex-direction: column;
            align-items: flex-start !important;
            gap: 10px;
          }
          .header-right {
            width: 100%;
            justify-content: space-between;
          }
          .deliveries-section, .meetings-section, .chart-section {
            padding: 15px !important;
            overflow-x: auto;
          }
          /* Override inline flex/grid styles for process wizard */
          div[style*="grid-template-columns"] {
            grid-template-columns: 1fr !important;
          }
          div[style*="display: flex; gap: 32px;"] {
            flex-direction: column !important;
          }
          div[style*="display: flex; gap: 24px;"] {
            flex-direction: column !important;
          }
        }
      `}</style>
      <div className="dashboard-page">
        <aside className="sidebar-left">
        <div className="sidebar-logo">
          <img src="logo.png" alt="OBA Logo" className="logo-badge" />
        </div>
        <nav className="sidebar-nav">
          <div className="nav-section">
            <div className="nav-title">Logistics</div>
            <ul>
              <li className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>Dashboard</li>
              <li className={`nav-item ${activeTab === 'deliveries' ? 'active' : ''}`} onClick={() => setActiveTab('deliveries')}>Deliveries</li>
              <li className={`nav-item ${activeTab === 'tripmanager' ? 'active' : ''}`} onClick={() => setActiveTab('tripmanager')}>Trip Manager</li>
              <li className={`nav-item ${activeTab === 'inventory' ? 'active' : ''}`} onClick={() => setActiveTab('inventory')}>Inventory</li>
              <li className={`nav-item ${activeTab === 'truckinfo' ? 'active' : ''}`} onClick={() => setActiveTab('truckinfo')}>Truck Info</li>
              <li className={`nav-item ${activeTab === 'analytics' ? 'active' : ''}`} onClick={() => setActiveTab('analytics')}>Analytics</li>
            </ul>
          </div>
        </nav>
      </aside>
      {modalView && (
        <CompletedDeliveries title={modalView.title} items={modalView.items} onClose={() => setModalView(null)} onUndo={modalView.onUndo} />
      )}

      <main className="dashboard-main">
        <div className="dashboard-header-bar"></div>
        <div className="dashboard-content">
          <header className="dashboard-header">
            <h1>{activeTab === 'dashboard' ? 'Overview' : activeTab === 'tripmanager' ? 'Trip Manager' : activeTab === 'deliveries' ? 'Deliveries & Processing' : activeTab === 'truckinfo' ? 'Truck Info' : activeTab === 'analytics' ? 'Logistics Analytics' : 'Inventory'}</h1>
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
                <span>Hello {user ? user.name : 'Logistics'}</span>
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

          {activeTab === 'dashboard' ? (
            <>
              <section className="stats-section">
                <StatCard
                  title="Total Deliveries"
                  value={completedDeliveriesCount + unsuccessfulDeliveriesCount}
                  onView={() => setModalView({ title: 'Total Deliveries', items: [ ...(doneDeliveries || []).filter(d => d?.status !== 'completion'), ...(unsuccessfulDeliveries || []) ], onUndo: onUndoDone })}
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
                          <circle cx="90" cy="90" r="70" fill="none" stroke="#159ee8" strokeWidth="24" strokeDasharray={`${completedShare * pieCircumference} ${pieCircumference}`} transform="rotate(-90 90 90)">
                            <title>{`Completed: ${completedDeliveriesCount} of ${deliveryStatusTotal} total deliveries`}</title>
                          </circle>
                          <circle cx="90" cy="90" r="70" fill="none" stroke="#f5a623" strokeWidth="24" strokeDasharray={`${(1 - completedShare) * pieCircumference} ${pieCircumference}`} strokeDashoffset={-completedShare * pieCircumference} transform="rotate(-90 90 90)">
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
                      <linearGradient id="logisticsEndedOrdersLineBlue" x1="0" x2="1" y1="0" y2="0">
                        <stop offset="0%" stopColor="#2f7ef7" />
                        <stop offset="100%" stopColor="#5ab4ff" />
                      </linearGradient>
                    </defs>

                    {[0, 50, 100, 150, 200].map((tick) => {
                      const y = endedOrdersChartPadding.top + endedOrdersChartInnerHeight - (tick / endedOrdersChartMax) * endedOrdersChartInnerHeight;
                      return (
                        <g key={`logistics-tick-${tick}`}>
                          <line x1={endedOrdersChartPadding.left} x2={endedOrdersChartWidth - endedOrdersChartPadding.right} y1={y} y2={y} stroke="#e8eef5" strokeWidth="1" />
                          <text x={8} y={y + 4} fontSize="11" fill="#7b8795" fontWeight="600">{tick}</text>
                        </g>
                      );
                    })}

                    {endedOrdersActualPoints.map((point, index) => (
                      <g key={`logistics-month-label-${index}`}>
                        <line x1={point.x} x2={point.x} y1={endedOrdersChartPadding.top + endedOrdersChartInnerHeight} y2={endedOrdersChartPadding.top + endedOrdersChartInnerHeight + 5} stroke="#c8d2d9" strokeWidth="1" />
                        <text x={point.x} y={endedOrdersChartHeight - 8} textAnchor="middle" fontSize="11" fill="#7b8795" fontWeight="600">{endedOrdersChartMonths[index]?.label || ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][index]}</text>
                      </g>
                    ))}

                    <polyline
                      points={endedOrdersActualLine}
                      fill="none"
                      stroke="url(#logisticsEndedOrdersLineBlue)"
                      strokeWidth="3"
                      strokeLinejoin="round"
                      strokeLinecap="round"
                    />

                    {endedOrdersActualPoints.map((point, index) => (
                      <g key={`logistics-actual-dot-${index}`}>
                        <circle cx={point.x} cy={point.y} r="4.5" fill="#ffffff" stroke="#2f7ef7" strokeWidth="2.5" />
                        <title>{`${endedOrdersChartMonths[index]?.label || 'Month'}: ${point.value} ended job orders`}</title>
                      </g>
                    ))}
                  </svg>
                </div>
              </section>
            </>
          ) : activeTab === 'analytics' ? (
            <ReportsAnalytics
              user={user}
              onLogout={onLogout}
              onNavigate={onNavigate}
              jobOrders={jobOrders}
              events={events}
              trips={trips}
              doneDeliveries={doneDeliveries}
              unsuccessfulDeliveries={unsuccessfulDeliveries}
              trucks={TRUCKS}
              isSubView={true}
            />
          ) : activeTab === 'truckinfo' ? (
            <div style={{ minHeight: '600px', padding: '24px 0 0 0' }}>
              {/* Sub-tab selection */}
              <div style={{ display: 'flex', gap: '16px', marginBottom: '20px', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>
                <button
                  type="button"
                  onClick={() => setTruckInfoSubTab('management')}
                  style={{
                    padding: '8px 16px',
                    border: 'none',
                    background: truckInfoSubTab === 'management' ? '#04ab0c' : 'transparent',
                    color: truckInfoSubTab === 'management' ? 'white' : '#666',
                    fontWeight: 'bold',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  🚚 Fleet & Maintenance Management
                </button>
                <button
                  type="button"
                  onClick={() => setTruckInfoSubTab('arrivals')}
                  style={{
                    padding: '8px 16px',
                    border: 'none',
                    background: truckInfoSubTab === 'arrivals' ? '#04ab0c' : 'transparent',
                    color: truckInfoSubTab === 'arrivals' ? 'white' : '#666',
                    fontWeight: 'bold',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  🏁 Arrivals & History
                </button>
              </div>

              {truckInfoSubTab === 'arrivals' ? (
                <div style={{ minHeight: '520px', background: 'white', borderRadius: '16px', padding: '28px', boxShadow: '0 12px 28px rgba(0,0,0,0.08)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <div>
                      <h2 style={{ margin: 0, fontSize: '20px', color: '#333' }}>Truck Arrival</h2>
                      <p style={{ margin: '6px 0 0', color: '#666', fontSize: '14px' }}>Trips created from the logistics system will appear here with driver and assistant details.</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <button
                        type="button"
                        onClick={() => setShowArrivalHistory(true)}
                        style={{ background: 'none', border: 'none', padding: 0, color: '#1976d2', textDecoration: 'underline', cursor: 'pointer', fontSize: '14px' }}
                      >
                        History
                      </button>
                      <span style={{ fontSize: '14px', color: '#04ab0c', fontWeight: '600' }}>
                        {getTruckArrivalTrips(trips, arrivedTripIds).filter(trip => !trip.isArrived).length} active trip{getTruckArrivalTrips(trips, arrivedTripIds).filter(trip => !trip.isArrived).length === 1 ? '' : 's'}
                      </span>
                    </div>
                  </div>

                  {trips.length === 0 ? (
                    <div style={{ padding: '40px 20px', textAlign: 'center', border: '1px dashed #ddd', borderRadius: '10px', color: '#777' }}>
                      No trip information is available yet. Create a trip to see truck arrival details here.
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gap: '14px' }}>
                      {getTruckArrivalTrips(trips, arrivedTripIds)
                        .filter(trip => !trip.isArrived)
                        .map(trip => (
                          <div key={trip.id} style={{ border: '1px solid #e6e6e6', borderRadius: '10px', padding: '16px', display: 'flex', justifyContent: 'space-between', gap: '16px', alignItems: 'center', backgroundColor: '#f5fff7' }}>
                            <div>
                              <div style={{ fontWeight: '700', color: '#333', fontSize: '16px' }}>🚚 {trip.truckNumber || 'Truck'}</div>
                              <div style={{ fontSize: '13px', color: '#666', marginTop: '4px' }}>Type: {trip.truckType}</div>
                              <div style={{ fontSize: '13px', color: '#444', marginTop: '6px' }}>Driver: {trip.driver || 'Not assigned'}</div>
                              <div style={{ fontSize: '13px', color: '#444' }}>Assistant: {trip.assistant || 'Not assigned'}</div>
                            </div>
                            <button
                              onClick={() => handleTripArrival(trip)}
                              style={{ padding: '10px 16px', border: 'none', borderRadius: '6px', backgroundColor: '#2196F3', color: '#fff', cursor: 'pointer', fontWeight: '600' }}
                            >
                              Arrived
                            </button>
                          </div>
                        ))}
                    </div>
                  )}

                  {showArrivalHistory && (
                    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '20px' }} onClick={() => setShowArrivalHistory(false)}>
                      <div id="truck-arrival-history" onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: '520px', maxHeight: '80vh', overflowY: 'auto', background: '#fff', borderRadius: '16px', padding: '24px', boxShadow: '0 16px 48px rgba(0,0,0,0.2)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                          <div>
                            <div style={{ fontWeight: '700', color: '#1565c0', fontSize: '18px' }}>Arrival History</div>
                            <div style={{ fontSize: '13px', color: '#666', marginTop: '4px' }}>{arrivalHistory.length} recorded arrival{arrivalHistory.length === 1 ? '' : 's'}</div>
                          </div>
                          <button type="button" onClick={() => setShowArrivalHistory(false)} style={{ border: 'none', background: 'transparent', color: '#666', cursor: 'pointer', fontSize: '14px' }}>Close</button>
                        </div>
                        {arrivalHistory.length === 0 ? (
                          <div style={{ padding: '24px', border: '1px dashed #ddd', borderRadius: '12px', color: '#777', backgroundColor: '#fafafa', textAlign: 'center' }}>No arrivals recorded yet.</div>
                        ) : (
                          <div style={{ display: 'grid', gap: '12px' }}>
                            {arrivalHistory.map(entry => (
                              <div key={entry.id} style={{ border: '1px solid #e6e6e6', borderRadius: '12px', padding: '16px', display: 'flex', justifyContent: 'space-between', gap: '16px', alignItems: 'center', backgroundColor: '#f5fff7' }}>
                                <div>
                                  <div style={{ fontWeight: '700', color: '#333', fontSize: '16px' }}>🚚 {entry.truckNumber || 'Truck'}</div>
                                  <div style={{ fontSize: '13px', color: '#666', marginTop: '4px' }}>Type: {entry.truckType}</div>
                                  <div style={{ fontSize: '13px', color: '#444', marginTop: '6px' }}>Driver: {entry.driver || 'Not assigned'}</div>
                                  <div style={{ fontSize: '13px', color: '#444' }}>Assistant: {entry.assistant || 'Not assigned'}</div>
                                </div>
                                <div style={{ textAlign: 'right', color: '#666', fontSize: '13px' }}>
                                  <div style={{ fontWeight: '600', color: '#04ab0c' }}>Arrived</div>
                                  <div style={{ marginTop: '4px' }}>{entry.arrivedAt}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <TruckManagement
                  user={user}
                  onLogout={onLogout}
                  onNavigate={onNavigate}
                  trucks={trucks}
                  onUpdateTrucks={onUpdateTrucks}
                  isSubView={true}
                />
              )}
            </div>
          ) : activeTab === 'deliveries' ? (
            <div className="deliveries-section" style={{ minHeight: '600px', backgroundColor: '#fff', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
              {!processingJobOrder ? (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <h2 style={{ fontSize: '20px', color: '#333', margin: 0 }}>📦 Pending Job Orders</h2>
                    <span style={{ fontSize: '14px', color: '#666' }}>Select a job order to begin processing allocation.</span>
                  </div>
                  {(() => {
                    const approvedOrders = getValidJobOrders(jobOrders).filter(order => order.status === 'approved');
                    return !approvedOrders || approvedOrders.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>No pending orders to process.</div>
                    ) : (
                      <div style={{ display: 'grid', gap: '16px' }}>
                        {approvedOrders.map((order, idx) => (
                        <div key={order.id || idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', border: '1px solid #eee', borderRadius: '8px', transition: 'all 0.2s', backgroundColor: '#fdfdfd' }} onMouseEnter={e => e.currentTarget.style.borderColor = '#04ab0c'} onMouseLeave={e => e.currentTarget.style.borderColor = '#eee'}>
                          <div>
                            <div style={{ fontWeight: 'bold', fontSize: '16px', color: '#333', marginBottom: '4px' }}>{order.jobType}</div>
                            <div style={{ fontSize: '13px', color: '#666' }}>{order.customerName} - {order.company}</div>
                            <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>📅 {order.startDate || 'No date'} | 👥 {order.manpower} Workers Needed</div>
                          </div>
                          <button 
                            onClick={() => {
                              const activeEmployees = employees && employees.length > 0 ? employees : (() => {
                                try {
                                  const cached = localStorage.getItem('app_employees_cache');
                                  if (cached) return JSON.parse(cached);
                                } catch (e) {}
                                return [];
                              })();
                              const autoAssigned = getAutoAssignedManpower(activeEmployees, order.manpower || 0);
                              setProcessingJobOrder(order);
                              setProcessStep(1);
                              setDeliveryData({ assignedManpower: autoAssigned, scannedEquipment: [], selectedTruck: '', maxWeight: 0, placedItems: {} });
                              setScannerState('disconnected');
                              if (autoAssigned.length > 0) {
                                toast.success(`${autoAssigned.length} present worker${autoAssigned.length > 1 ? 's' : ''} auto-assigned for this delivery.`);
                              } else {
                                toast.error('No present employees are currently available for this delivery.');
                              }
                            }}
                            style={{ padding: '10px 20px', backgroundColor: '#04ab0c', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s' }}
                            onMouseEnter={e => Object.assign(e.currentTarget.style, { backgroundColor: '#038c0a', transform: 'translateY(-2px)', boxShadow: '0 4px 8px rgba(4,171,12,0.2)' })}
                            onMouseLeave={e => Object.assign(e.currentTarget.style, { backgroundColor: '#04ab0c', transform: 'none', boxShadow: 'none' })}
                          >
                            Process Allocation ➜
                          </button>
                        </div>
                      ))}
                    </div>
                  )})()}
                </>
              ) : (
                <div className="process-wizard">
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '32px', paddingBottom: '16px', borderBottom: '1px solid #eee' }}>
                    <button onClick={() => setProcessingJobOrder(null)} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', fontSize: '24px', marginRight: '16px', padding: '0 8px' }}>←</button>
                    <div>
                      <h2 style={{ margin: '0 0 4px 0', fontSize: '20px', color: '#333' }}>Processing: {processingJobOrder.jobType}</h2>
                      <div style={{ fontSize: '13px', color: '#666' }}>{processingJobOrder.customerName} - {processingJobOrder.company}</div>
                    </div>
                  </div>

                  {/* Stepper Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '40px', position: 'relative', padding: '0 20px' }}>
                    <div style={{ position: 'absolute', top: '15px', left: '40px', right: '40px', height: '3px', backgroundColor: '#eee', zIndex: 0 }}></div>
                    <div style={{ position: 'absolute', top: '15px', left: '40px', right: '40px', height: '3px', backgroundColor: '#04ab0c', zIndex: 0, width: `${(processStep - 1)* 23.3}%`, transition: 'width 0.3s ease' }}></div>
                    {['Manpower', 'Equipment', 'Truck', 'Draft', 'Receipt'].map((stepName, i) => (
                      <div key={stepName} style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: processStep > i + 1 ? '#04ab0c' : processStep === i + 1 ? '#2196F3' : '#fff', border: processStep >= i + 1 ? 'none' : '3px solid #ddd', color: processStep >= i + 1 ? '#fff' : '#999', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '14px', boxShadow: processStep === i + 1 ? '0 0 0 6px rgba(33, 150, 243, 0.15)' : 'none', transition: 'all 0.3s ease' }}>
                          {processStep > i + 1 ? '✓' : i + 1}
                        </div>
                        <span style={{ fontSize: '12px', fontWeight: processStep === i + 1 ? 'bold' : 'normal', color: processStep === i + 1 ? '#2196F3' : processStep > i + 1 ? '#04ab0c' : '#999' }}>{stepName}</span>
                      </div>
                    ))}
                  </div>

                  {/* Wizard Content */}
                  <div style={{ minHeight: '350px' }}>
                    {processStep === 1 && (
                      <div style={{ animation: 'fadeIn 0.3s' }}>
                        <h3 style={{ fontSize: '18px', marginBottom: '16px', color: '#333' }}>Step 1: Assign Manpower</h3>
                        <p style={{ color: '#666', fontSize: '14px', marginBottom: '24px' }}>This job order requires <strong>{processingJobOrder.manpower} workers</strong>. Present employees are auto-assigned first, and you can still add or remove workers manually below.</p>
                        <div style={{ display: 'flex', gap: '24px', marginBottom: '24px', minHeight: '300px' }}>
                          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', border: '1px solid #eee', borderRadius: '8px', overflow: 'hidden' }}>
                            <div style={{ padding: '12px', backgroundColor: '#f9f9f9', borderBottom: '1px solid #eee', fontWeight: 'bold' }}>Available Present Employees</div>
                            <div style={{ flex: 1, overflowY: 'auto', maxHeight: '300px' }}>
                              {(() => {
                                const activeEmployees = employees && employees.length > 0 ? employees : (() => {
                                  try {
                                    const cached = localStorage.getItem('app_employees_cache');
                                    if (cached) return JSON.parse(cached);
                                  } catch (e) {}
                                  return [];
                                })();
                                const assigned = deliveryData?.assignedManpower || [];
                                const availablePresent = activeEmployees.filter(emp => emp && emp.name && emp.status === 'Present' && emp.department !== 'Driver/Pahinante' && !assigned.includes(emp.name));

                                return availablePresent.length > 0 ? (
                                  availablePresent.map(emp => (
                                    <div key={emp.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', borderBottom: '1px solid #eee' }}>
                                      <div>
                                        <div style={{ fontWeight: 'bold', color: '#333' }}>{emp.name}</div>
                                        <div style={{ fontSize: '12px', color: '#4CAF50', fontWeight: '500' }}>
                                          ● Present
                                        </div>
                                      </div>
                                      <button 
                                        onClick={() => setDeliveryData(prev => ({ ...prev, assignedManpower: [...(prev?.assignedManpower || []), emp.name] }))}
                                        style={{ padding: '4px 12px', backgroundColor: '#2196F3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', transition: 'background-color 0.2s' }}
                                        onMouseEnter={e => e.currentTarget.style.backgroundColor = '#1976D2'}
                                        onMouseLeave={e => e.currentTarget.style.backgroundColor = '#2196F3'}
                                      >
                                        Add
                                      </button>
                                    </div>
                                  ))
                                ) : (
                                  <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>No present employees available.</div>
                                );
                              })()}
                            </div>
                          </div>
                          
                          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', border: '1px solid #eee', borderRadius: '8px', overflow: 'hidden' }}>
                            <div style={{ padding: '12px', backgroundColor: '#e8f5e9', borderBottom: '1px solid #eee', fontWeight: 'bold', color: '#04ab0c' }}>Selected Manpower</div>
                            <div style={{ flex: 1, overflowY: 'auto', maxHeight: '300px' }}>
                              {deliveryData.assignedManpower.length > 0 ? (
                                deliveryData.assignedManpower.map((name, idx) => {
                                  const emp = employees.find(e => e.name === name);
                                  return (
                                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', borderBottom: '1px solid #eee' }}>
                                      <div>
                                        <div style={{ fontWeight: 'bold', color: '#333' }}>{name}</div>
                                        <div style={{ fontSize: '12px', color: '#4CAF50', fontWeight: '500' }}>● Present</div>
                                      </div>
                                      <button 
                                        onClick={() => setDeliveryData({...deliveryData, assignedManpower: deliveryData.assignedManpower.filter(n => n !== name)})}
                                        style={{ padding: '4px 12px', backgroundColor: '#f44336', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', transition: 'background-color 0.2s' }}
                                        onMouseEnter={e => e.currentTarget.style.backgroundColor = '#d32f2f'}
                                        onMouseLeave={e => e.currentTarget.style.backgroundColor = '#f44336'}
                                      >
                                        Remove
                                      </button>
                                    </div>
                                  );
                                })
                              ) : (
                                <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>No manpower selected yet.</div>
                              )}
                            </div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #eee', paddingTop: '20px' }}>
                          <span style={{ fontSize: '14px', color: '#666', backgroundColor: '#f5f5f5', padding: '8px 16px', borderRadius: '20px' }}>Selected: <strong style={{ color: deliveryData.assignedManpower.length >= processingJobOrder.manpower ? '#04ab0c' : '#333' }}>{deliveryData.assignedManpower.length}</strong> / {processingJobOrder.manpower}</span>
                          <button onClick={() => setProcessStep(2)} style={{ padding: '12px 28px', backgroundColor: '#04ab0c', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '15px' }}>Next: Equipment Scanning ➜</button>
                        </div>
                      </div>
                    )}

                    {processStep === 2 && (() => {
                      const scannedList = deliveryData?.scannedEquipment || [];
                      const currentPayloadWeight = scannedList.reduce((sum, item) => sum + ((item.weight || 15) * item.scanQty), 0);
                      const allWarehouseItems = [...(inventoryData.warehouse1 || []), ...(inventoryData.warehouse2 || [])];

                      // Current active truck and capacity
                      const currentTruck = TRUCKS.find(truck => truck.name === deliveryData?.selectedTruck || truck.id === deliveryData?.selectedTruck)
                        || TRUCKS.find(truck => truck.maxWeight === deliveryData?.maxWeight)
                        || getSuggestedTruckForWeight(currentPayloadWeight, TRUCKS)
                        || TRUCKS[0];

                      const currentTruckCapacity = currentTruck ? (Number(currentTruck.maxWeight) || 0) : (Number(deliveryData?.maxWeight) || 1500);
                      const isExceeded = currentPayloadWeight > currentTruckCapacity;
                      const overloadWeight = Math.max(0, currentPayloadWeight - currentTruckCapacity);

                      // Suggested next higher capacity truck
                      const suggestedTruck = isExceeded
                        ? getNextHigherCapacityTruck(currentTruck?.name, currentPayloadWeight, TRUCKS)
                        : getSuggestedTruckForWeight(currentPayloadWeight, TRUCKS);

                      const canUpgrade = isExceeded && suggestedTruck && suggestedTruck.name !== currentTruck?.name && (Number(suggestedTruck.maxWeight) || 0) > currentTruckCapacity;
                      const maxFleetCapacity = Math.max(...TRUCKS.map(t => Number(t.maxWeight) || 0));
                      const isFleetExceeded = isExceeded && currentPayloadWeight > maxFleetCapacity;

                      const maxPayloadWeight = currentTruckCapacity > 0 ? currentTruckCapacity : 1;
                      const weightPercent = Math.round((currentPayloadWeight / maxPayloadWeight) * 100);
                      const barColor = isExceeded ? '#f44336' : weightPercent < 75 ? '#04ab0c' : '#ff9800';

                      // Handle adding/scanning items
                      const handleAddItem = (scannedItem, qtyToAdd = 1) => {
                        if (!scannedItem) return;

                        setDeliveryData(prev => {
                          const currentList = prev?.scannedEquipment || [];
                          const itemWeight = (scannedItem.weight || 15) * qtyToAdd;
                          const currentW = currentList.reduce((sum, item) => sum + ((item.weight || 15) * item.scanQty), 0);
                          const nextTotalWeight = currentW + itemWeight;

                          const activeTruck = TRUCKS.find(t => t.name === prev?.selectedTruck || t.id === prev?.selectedTruck)
                            || TRUCKS.find(t => t.maxWeight === prev?.maxWeight)
                            || getSuggestedTruckForWeight(currentW, TRUCKS);

                          const activeCapacity = activeTruck ? (Number(activeTruck.maxWeight) || 0) : (Number(prev?.maxWeight) || 1500);
                          const nextExceeds = nextTotalWeight > activeCapacity;
                          const nextSuggested = nextExceeds
                            ? getNextHigherCapacityTruck(activeTruck?.name, nextTotalWeight, TRUCKS)
                            : getSuggestedTruckForWeight(nextTotalWeight, TRUCKS);

                          let warningMsg = null;
                          if (nextExceeds) {
                            if (nextSuggested && nextSuggested.name !== activeTruck?.name && (Number(nextSuggested.maxWeight) || 0) > activeCapacity) {
                              warningMsg = `Payload capacity exceeded (${nextTotalWeight} kg / ${activeCapacity} kg). Please change type of truck to higher capacity: ${nextSuggested.name} (${nextSuggested.maxWeight} kg).`;
                              toast.error(`⚠️ Capacity exceeded! Please change type of truck to higher capacity: ${nextSuggested.name} (${nextSuggested.maxWeight} kg).`, { duration: 6000, id: 'capacity-exceeded-toast' });
                              if (setAdminNotifications) {
                                setAdminNotifications(prev => [
                                  {
                                    id: Date.now(),
                                    type: 'warning',
                                    title: '⚠️ Change Truck Type Required',
                                    message: `Payload of ${nextTotalWeight} kg exceeded ${activeTruck?.name || 'current truck'} capacity. Please change type of truck to higher capacity: ${nextSuggested.name} (${nextSuggested.maxWeight} kg).`,
                                    timestamp: new Date().toLocaleTimeString(),
                                    read: false
                                  },
                                  ...(prev || [])
                                ]);
                              }
                            } else {
                              warningMsg = `Fleet capacity limit reached (${nextTotalWeight} kg / max ${maxFleetCapacity} kg)!`;
                              toast.error(`⚠️ Payload exceeds maximum truck capacity (${maxFleetCapacity} kg)!`, { duration: 5000 });
                            }
                          } else {
                            toast.success(`Scanned: ${scannedItem.name}`);
                          }

                          const exists = currentList.findIndex(i => i.id === scannedItem.id);
                          let newlyScanned;
                          if (exists >= 0) {
                            newlyScanned = [...currentList];
                            newlyScanned[exists] = {
                              ...newlyScanned[exists],
                              scanQty: newlyScanned[exists].scanQty + qtyToAdd
                            };
                          } else {
                            newlyScanned = [...currentList, { ...scannedItem, scanQty: qtyToAdd }];
                          }

                          return {
                            ...(prev || {}),
                            selectedTruck: prev?.selectedTruck || (nextSuggested ? nextSuggested.name : ''),
                            maxWeight: prev?.maxWeight || (nextSuggested ? nextSuggested.maxWeight : 0),
                            scannedEquipment: newlyScanned,
                            scanWarning: warningMsg
                          };
                        });
                      };

                      const handleUpdateQty = (idx, delta) => {
                        setDeliveryData(prev => {
                          const list = [...(prev?.scannedEquipment || [])];
                          if (!list[idx]) return prev;
                          const newQty = list[idx].scanQty + delta;
                          if (newQty <= 0) {
                            list.splice(idx, 1);
                          } else {
                            list[idx] = { ...list[idx], scanQty: newQty };
                          }

                          const newWeight = list.reduce((sum, item) => sum + ((item.weight || 15) * item.scanQty), 0);
                          const activeTruck = TRUCKS.find(t => t.name === prev?.selectedTruck || t.id === prev?.selectedTruck) || TRUCKS[0];
                          const activeCap = activeTruck ? (Number(activeTruck.maxWeight) || 0) : (Number(prev?.maxWeight) || 1500);
                          const nextSug = newWeight > activeCap
                            ? getNextHigherCapacityTruck(activeTruck?.name, newWeight, TRUCKS)
                            : getSuggestedTruckForWeight(newWeight, TRUCKS);

                          let warn = null;
                          if (newWeight > activeCap) {
                            if (nextSug && nextSug.name !== activeTruck?.name) {
                              warn = `Payload capacity exceeded (${newWeight} kg / ${activeCap} kg). Please change type of truck to higher capacity: ${nextSug.name} (${nextSug.maxWeight} kg).`;
                              toast.error(`⚠️ Capacity exceeded! Please change type of truck to higher capacity: ${nextSug.name} (${nextSug.maxWeight} kg).`, { duration: 5000, id: 'qty-capacity-exceeded-toast' });
                            } else {
                              warn = `Fleet capacity limit reached (${newWeight} kg / max ${maxFleetCapacity} kg)!`;
                            }
                          }

                          return {
                            ...(prev || {}),
                            scannedEquipment: list,
                            scanWarning: warn
                          };
                        });
                      };

                      const handleSwitchTruck = (truck) => {
                        if (!truck) return;
                        setDeliveryData(prev => ({
                          ...(prev || {}),
                          selectedTruck: truck.name,
                          maxWeight: truck.maxWeight,
                          scanWarning: null
                        }));
                        toast.success(`🚚 Changed truck type to ${truck.name} (${truck.maxWeight} kg)`);
                      };

                      return (
                      <div style={{ animation: 'fadeIn 0.3s' }}>
                        <h3 style={{ fontSize: '18px', marginBottom: '16px', color: '#333' }}>Step 2: Equipment Scanning (Wireless Connection)</h3>
                        
                        <div style={{ display: 'flex', gap: '32px', marginBottom: '32px', minHeight: '300px' }}>
                          <div style={{ flex: 1, border: '1px solid #eee', borderRadius: '12px', padding: '24px', textAlign: 'center', backgroundColor: '#f9f9f9', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.02)' }}>
                            <div style={{ fontSize: '48px', marginBottom: '16px', display: 'inline-block', position: 'relative' }}>
                              📱
                              {scannerState === 'connected' && <span style={{ position: 'absolute', top: 0, right: '-10px', fontSize: '18px' }}>✨</span>}
                            </div>
                            
                            {scannerState === 'disconnected' && (
                              <>
                                <h4 style={{ margin: '0 0 12px 0', color: '#333', fontSize: '17px' }}>Camera Scanner</h4>
                                <button onClick={() => {
                                  setScannerState('connecting');
                                  setTimeout(() => setScannerState('connected'), 800);
                                }} style={{ padding: '10px 22px', backgroundColor: '#2196F3', color: 'white', border: 'none', borderRadius: '30px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(33, 150, 243, 0.3)' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseLeave={e => e.currentTarget.style.transform = 'none'}>
                                  <span style={{ fontSize: '16px' }}>📷</span> Open Camera Scanner
                                </button>
                                <p style={{ fontSize: '12px', color: '#999', marginTop: '12px', maxWidth: '240px', lineHeight: '1.4' }}>Use your device camera to scan equipment QR codes wirelessly.</p>
                              </>
                            )}
                            
                            {scannerState === 'connecting' && (
                              <>
                                <h4 style={{ margin: '0 0 16px 0', color: '#2196F3', fontSize: '17px' }}>Initializing Camera...</h4>
                                <div style={{ width: '32px', height: '32px', border: '4px solid #e3f2fd', borderTop: '4px solid #2196F3', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                                <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } } @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }`}</style>
                              </>
                            )}
                            
                            {(scannerState === 'connected' || scannerState === 'scanning') && (
                              <div style={{ animation: 'fadeIn 0.3s', width: '100%' }}>
                                <h4 style={{ margin: '0 0 8px 0', color: '#04ab0c', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '17px' }}>
                                  <div style={{ width: '10px', height: '10px', backgroundColor: '#04ab0c', borderRadius: '50%', boxShadow: '0 0 8px #04ab0c' }}></div>
                                  Camera Active
                                </h4>
                                <ScannerPlugin 
                                  onScanSuccess={(decodedText) => {
                                    const scannedItem = allWarehouseItems.find(i => i.name === decodedText || i.id.toString() === decodedText);
                                    if (scannedItem) {
                                      handleAddItem(scannedItem, 1);
                                    }
                                  }} 
                                  onScanFailure={() => {}} 
                                />
                                <button onClick={() => setScannerState('disconnected')} style={{ marginTop: '12px', padding: '6px 16px', backgroundColor: '#f5f5f5', color: '#666', border: 'none', borderRadius: '20px', cursor: 'pointer', fontSize: '13px' }}>Close Camera</button>
                              </div>
                            )}
                          </div>
                          
                          <div style={{ flex: 1.5, display: 'flex', flexDirection: 'column' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                              <h4 style={{ margin: 0, fontSize: '16px', color: '#333' }}>Scanned Items Manifest</h4>
                              <span style={{ fontSize: '13px', color: '#333', backgroundColor: '#e3f2fd', padding: '4px 12px', borderRadius: '16px', fontWeight: 'bold' }}>{scannedList.length} unique items ({scannedList.reduce((acc, item) => acc + item.scanQty, 0)} total units)</span>
                            </div>
                            
                            {/* Capacity Telemetry Bar */}
                            <div style={{ marginBottom: '14px', backgroundColor: '#fafafa', padding: '14px', borderRadius: '10px', border: isExceeded ? '1px solid #ffcdd2' : '1px solid #eee' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px', alignItems: 'center' }}>
                                <span style={{ color: '#555', fontWeight: '500' }}>
                                  Payload Capacity ({currentTruck?.name?.split(' ')[0] || deliveryData.selectedTruck.split(' ')[0] || 'Truck'}):
                                </span>
                                <div style={{ textAlign: 'right' }}>
                                  <strong style={{ color: barColor, fontSize: '14px' }}>{currentPayloadWeight} kg / {currentTruckCapacity} kg</strong>
                                  <span style={{ fontSize: '12px', marginLeft: '8px', color: isExceeded ? '#d32f2f' : '#666', fontWeight: isExceeded ? 'bold' : 'normal' }}>
                                    ({weightPercent}% {isExceeded ? 'OVERLOAD' : 'used'})
                                  </span>
                                </div>
                              </div>

                              <div style={{ height: '10px', backgroundColor: '#e0e0e0', borderRadius: '5px', overflow: 'hidden', position: 'relative' }}>
                                <div style={{ 
                                  width: `${Math.min(weightPercent, 100)}%`, 
                                  height: '100%', 
                                  backgroundColor: barColor, 
                                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                  boxShadow: isExceeded ? '0 0 8px rgba(244, 67, 54, 0.6)' : 'none'
                                }}></div>
                              </div>

                              {/* Capacity Exceeded Suggestion Banner */}
                              {isExceeded && (
                                <div style={{ 
                                  marginTop: '12px', 
                                  padding: '16px 18px', 
                                  backgroundColor: '#fff5f5', 
                                  border: '2px solid #f44336', 
                                  borderRadius: '8px', 
                                  boxShadow: '0 4px 14px rgba(244, 67, 54, 0.15)', 
                                  animation: 'fadeIn 0.3s' 
                                }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                    <span style={{ fontSize: '20px' }}>🚨</span>
                                    <strong style={{ color: '#c62828', fontSize: '15px' }}>Action Required: Change Type of Truck to Higher Capacity</strong>
                                    <span style={{ marginLeft: 'auto', backgroundColor: '#ffebee', color: '#c62828', fontSize: '11px', padding: '2px 8px', borderRadius: '10px', fontWeight: 'bold', border: '1px solid #ffcdd2' }}>
                                      +{overloadWeight} kg Overload
                                    </span>
                                  </div>

                                  <div style={{ fontSize: '13px', color: '#555', marginBottom: '12px', lineHeight: '1.4' }}>
                                    Current payload of <strong>{currentPayloadWeight} kg</strong> exceeds <strong>{currentTruck?.name || deliveryData.selectedTruck}</strong> capacity limit (<strong>{currentTruckCapacity} kg</strong>). Please change the type of truck to a higher capacity model.
                                  </div>

                                  {canUpgrade ? (
                                    <div style={{ backgroundColor: '#fff', border: '1px solid #a5d6a7', borderRadius: '8px', padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                                      <div>
                                        <div style={{ fontSize: '11px', color: '#2e7d32', textTransform: 'uppercase', fontWeight: 'bold', letterSpacing: '0.5px' }}>💡 Suggested Higher Capacity Truck</div>
                                        <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#1b5e20', marginTop: '2px' }}>
                                          {suggestedTruck.name}
                                        </div>
                                        <div style={{ fontSize: '12px', color: '#666' }}>
                                          Max Load: <strong>{suggestedTruck.maxWeight} kg</strong> • Headroom: <strong style={{ color: '#2e7d32' }}>+{suggestedTruck.maxWeight - currentPayloadWeight} kg available</strong>
                                        </div>
                                      </div>
                                      <button 
                                        onClick={() => handleSwitchTruck(suggestedTruck)}
                                        style={{ 
                                          padding: '10px 18px', 
                                          backgroundColor: '#04ab0c', 
                                          color: 'white', 
                                          border: 'none', 
                                          borderRadius: '6px', 
                                          fontWeight: 'bold', 
                                          cursor: 'pointer', 
                                          fontSize: '13px', 
                                          display: 'flex', 
                                          alignItems: 'center', 
                                          gap: '6px',
                                          boxShadow: '0 2px 8px rgba(4, 171, 12, 0.3)',
                                          transition: 'all 0.2s'
                                        }}
                                        onMouseEnter={e => e.currentTarget.style.backgroundColor = '#038c0a'}
                                        onMouseLeave={e => e.currentTarget.style.backgroundColor = '#04ab0c'}
                                      >
                                        <span>🚚</span> Change Type of Truck to {suggestedTruck.name.split(' ')[0]}
                                      </button>
                                    </div>
                                  ) : isFleetExceeded ? (
                                    <div style={{ backgroundColor: '#fff', border: '1px dashed #f44336', borderRadius: '6px', padding: '8px 12px', color: '#c62828', fontSize: '12px', fontWeight: 'bold' }}>
                                      ⚠️ Maximum fleet capacity exceeded ({maxFleetCapacity} kg). Please remove items or split the shipment across multiple trips.
                                    </div>
                                  ) : null}
                                </div>
                              )}
                            </div>
                            
                            <div style={{ border: '1px solid #eee', borderRadius: '12px', flex: 1, overflowY: 'auto', backgroundColor: '#fff', maxHeight: '350px', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)' }}>
                              {scannedList.length === 0 ? (
                                <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#999', minHeight: '200px' }}>
                                  <div style={{ fontSize: '40px', marginBottom: '12px', opacity: 0.5 }}>📷</div>
                                  <div style={{ fontSize: '14px' }}>No equipment scanned yet. Use device camera scanner on the left.</div>
                                </div>
                              ) : (
                                <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                                  {scannedList.map((item, idx) => (
                                    <li key={idx} style={{ padding: '12px 16px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center', animation: 'fadeIn 0.2s' }}>
                                      <div>
                                        <div style={{ fontWeight: 'bold', color: '#333', fontSize: '14px', marginBottom: '2px' }}>{item.name}</div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                          <span style={{ fontSize: '11px', color: '#666', backgroundColor: '#f5f5f5', display: 'inline-block', padding: '2px 6px', borderRadius: '4px' }}>{item.category}</span>
                                          <span style={{ fontSize: '11px', color: '#888' }}>
                                            {item.weight || 15} kg / unit • <strong>Total: {(item.weight || 15) * item.scanQty} kg</strong>
                                          </span>
                                        </div>
                                      </div>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#f5f5f5', padding: '2px 8px', borderRadius: '6px' }}>
                                          <button 
                                            onClick={() => handleUpdateQty(idx, -1)}
                                            style={{ border: 'none', background: '#e0e0e0', color: '#333', width: '22px', height: '22px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                          >-</button>
                                          <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#04ab0c', minWidth: '24px', textAlign: 'center' }}>{item.scanQty}</span>
                                          <span style={{ fontSize: '11px', color: '#666' }}>{item.unit}</span>
                                          <button 
                                            onClick={() => handleUpdateQty(idx, 1)}
                                            style={{ border: 'none', background: '#e0e0e0', color: '#333', width: '22px', height: '22px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                          >+</button>
                                        </div>
                                        <button onClick={() => {
                                          const newList = [...scannedList];
                                          newList.splice(idx, 1);
                                          setDeliveryData(prev => ({ ...(prev || {}), scannedEquipment: newList }));
                                        }} style={{ background: '#ffebee', border: 'none', color: '#f44336', borderRadius: '50%', width: '26px', height: '26px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '14px', transition: 'background-color 0.2s' }} onMouseEnter={e=>e.currentTarget.style.backgroundColor='#ffcdd2'} onMouseLeave={e=>e.currentTarget.style.backgroundColor='#ffebee'} title="Remove item">×</button>
                                      </div>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #eee', paddingTop: '20px' }}>
                          <button onClick={() => setProcessStep(1)} style={{ padding: '12px 24px', backgroundColor: '#f5f5f5', color: '#333', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '500', fontSize: '15px' }}>← Back</button>
                          <button 
                            onClick={() => {
                              if (isExceeded && canUpgrade) {
                                toast(`⚠️ Notice: Please change truck type to ${suggestedTruck.name} (${suggestedTruck.maxWeight} kg).`, { icon: '🚚', duration: 5000 });
                              }
                              setProcessStep(3);
                            }} 
                            style={{ padding: '12px 28px', backgroundColor: '#04ab0c', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '15px' }}
                          >
                            Next: Truck Selection ➜
                          </button>
                        </div>
                      </div>
                    )})()}

                    {processStep === 3 && (() => {
                      const currentPayloadWeight = (deliveryData?.scannedEquipment || []).reduce((sum, item) => sum + ((item.weight || 15) * item.scanQty), 0);
                      const recommendedTruck = getSuggestedTruckForWeight(currentPayloadWeight, TRUCKS);

                      return (
                      <div style={{ animation: 'fadeIn 0.3s' }}>
                        <h3 style={{ fontSize: '18px', marginBottom: '8px', color: '#333' }}>Step 3: Select Transport Truck</h3>
                        <p style={{ color: '#666', fontSize: '14px', marginBottom: '24px' }}>
                          Scanned Payload Weight: <strong style={{ color: '#04ab0c' }}>{currentPayloadWeight} kg</strong>. The transport truck is auto-suggested based on payload weight. You can select another truck below before moving to the allocation draft.
                        </p>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '40px' }}>
                          {TRUCKS.map((truck) => {
                            const isMaintenance = truck.status === 'Maintenance';
                            const isSelected = deliveryData?.selectedTruck === truck.name;
                            const isRecommended = recommendedTruck && recommendedTruck.name === truck.name && currentPayloadWeight > 0 && !isMaintenance;
                            const isUnderCapacity = !isMaintenance && currentPayloadWeight > truck.maxWeight;

                            return (
                              <div 
                                key={truck.id}
                                onClick={() => {
                                  if (isMaintenance) {
                                    toast.error(`${truck.name.split(' ')[0]} is under maintenance!`);
                                    return;
                                  }
                                  setDeliveryData(prev => ({
                                    ...(prev || {}),
                                    selectedTruck: truck.name,
                                    maxWeight: truck.maxWeight
                                  }));
                                }}
                                style={{ 
                                  padding: '20px', 
                                  border: isMaintenance ? '1px dashed #ffa4a4' : isSelected ? '2px solid #04ab0c' : isUnderCapacity ? '1px solid #ffcdd2' : '1px solid #ddd', 
                                  borderRadius: '12px', 
                                  cursor: isMaintenance ? 'not-allowed' : 'pointer', 
                                  backgroundColor: isMaintenance ? '#fff5f5' : isSelected ? '#f4fbf4' : isUnderCapacity ? '#fffbfb' : '#fff', 
                                  opacity: isMaintenance ? 0.75 : 1, 
                                  display: 'flex', 
                                  alignItems: 'center', 
                                  gap: '16px', 
                                  transition: 'all 0.2s', 
                                  boxShadow: isSelected && !isMaintenance ? '0 4px 12px rgba(4,171,12,0.1)' : 'none' 
                                }}
                                onMouseEnter={e => { if(!isSelected && !isMaintenance) e.currentTarget.style.borderColor = '#aaa' }}
                                onMouseLeave={e => { if(!isSelected && !isMaintenance) e.currentTarget.style.borderColor = isUnderCapacity ? '#ffcdd2' : '#ddd' }}
                              >
                                <div style={{ fontSize: '32px', backgroundColor: isMaintenance ? '#ffebee' : isSelected ? '#e8f5e9' : '#f5f5f5', width: '60px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%' }}>
                                  {isMaintenance ? '🔧' : '🚚'}
                                </div>
                                <div style={{ flex: 1 }}>
                                  <div style={{ fontWeight: 'bold', color: isMaintenance ? '#c62828' : '#333', fontSize: '16px', marginBottom: '4px', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '4px' }}>
                                    <span>{truck.name.split(' ')[0]}</span>
                                    {isMaintenance && <span style={{ fontSize: '11px', backgroundColor: '#c62828', color: 'white', padding: '2px 6px', borderRadius: '10px' }}>Maintenance</span>}
                                    {isRecommended && <span style={{ fontSize: '11px', backgroundColor: '#e8f5e9', color: '#04ab0c', padding: '2px 6px', borderRadius: '10px', border: '1px solid #c8e6c9' }}>⭐ Recommended</span>}
                                    {isUnderCapacity && <span style={{ fontSize: '11px', backgroundColor: '#ffebee', color: '#c62828', padding: '2px 6px', borderRadius: '10px', border: '1px solid #ffcdd2' }}>⚠️ Under-capacity</span>}
                                  </div>
                                  <div style={{ color: '#666', fontSize: '13px', display: 'flex', justifyContent: 'space-between' }}>
                                    <span>{truck.name.substring(truck.name.indexOf('(')+1, truck.name.indexOf(')'))}</span>
                                    <span style={{ fontWeight: 'bold', color: isMaintenance ? '#c62828' : isUnderCapacity ? '#c62828' : '#04ab0c' }}>Max: {truck.maxWeight} kg</span>
                                  </div>
                                </div>
                                {isSelected && !isMaintenance && <div style={{ marginLeft: 'auto', color: '#04ab0c', fontSize: '24px' }}>✓</div>}
                              </div>
                            );
                          })}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #eee', paddingTop: '20px' }}>
                          <button onClick={() => setProcessStep(2)} style={{ padding: '12px 24px', backgroundColor: '#f5f5f5', color: '#333', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '500', fontSize: '15px' }}>← Back</button>
                          <button onClick={() => setProcessStep(4)} disabled={!deliveryData?.selectedTruck} style={{ padding: '12px 28px', backgroundColor: !deliveryData?.selectedTruck ? '#ccc' : '#04ab0c', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: !deliveryData?.selectedTruck ? 'not-allowed' : 'pointer', fontSize: '15px' }}>Next: Allocation Draft ➜</button>
                        </div>
                      </div>
                    );
                    })()}

                    {processStep === 4 && (() => {
                      const activeTruck = TRUCKS.find(t => t.name === deliveryData.selectedTruck) || TRUCKS[3];
                      // Ensure there are always enough slots for the scanned equipment
                      const totalZones = Math.max(activeTruck.gridZones, deliveryData.scannedEquipment.length);
                      const placedItemsCount = Object.keys(deliveryData.placedItems || {}).length;
                      const isComplete = deliveryData.scannedEquipment.length === placedItemsCount;

                      return (
                      <div style={{ animation: 'fadeIn 0.3s' }}>
                        <h3 style={{ fontSize: '18px', marginBottom: '8px', color: '#333' }}>Step 4: Visual Load Planning</h3>
                        <p style={{ color: '#666', fontSize: '14px', marginBottom: '24px' }}>Drag and drop scanned items from the Staging Dock into the Trailer Configuration zones.</p>
                        
                        <div style={{ display: 'flex', gap: '24px', marginBottom: '40px', minHeight: '500px' }}>
                          {/* Staging Dock */}
                          <div style={{ flex: '0 0 350px', backgroundColor: '#f9f9f9', border: '1px solid #e0e0e0', borderRadius: '12px', padding: '24px', display: 'flex', flexDirection: 'column', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
                            <h4 style={{ margin: '0 0 16px 0', color: '#333', fontSize: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              Staging Dock
                              <span style={{ fontSize: '12px', backgroundColor: '#eee', padding: '4px 8px', borderRadius: '12px' }}>{deliveryData.scannedEquipment.length - placedItemsCount} Remaining</span>
                            </h4>
                            <div 
                              style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', padding: '10px' }}
                              onDragOver={e => e.preventDefault()}
                              onDrop={e => {
                                e.preventDefault();
                                const idxId = e.dataTransfer.getData('text/plain');
                                if (!idxId) return;
                                setDeliveryData(prev => {
                                  const newPlaced = { ...(prev.placedItems || {}) };
                                  Object.keys(newPlaced).forEach(k => { if (newPlaced[k] === idxId) delete newPlaced[k]; });
                                  return { ...prev, placedItems: newPlaced };
                                });
                              }}
                            >
                              {deliveryData.scannedEquipment.length === placedItemsCount && (
                                <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#04ab0c', textAlign: 'center' }}>
                                  <div style={{ fontSize: '40px', marginBottom: '12px' }}>✅</div>
                                  <div style={{ fontWeight: 'bold' }}>All Items Loaded</div>
                                </div>
                              )}
                              
                              {deliveryData.scannedEquipment.map((item, idx) => {
                                const idxStr = idx.toString();
                                const isPlaced = Object.values(deliveryData.placedItems || {}).includes(idxStr);
                                if (isPlaced) return null;
                                
                                return (
                                  <div 
                                    key={idx}
                                    draggable
                                    onDragStart={e => e.dataTransfer.setData('text/plain', idxStr)}
                                    style={{ 
                                      padding: '16px', 
                                      backgroundColor: '#e0e0e0', 
                                      backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 5px, rgba(0,0,0,0.05) 5px, rgba(0,0,0,0.05) 10px)', 
                                      border: '2px solid #9e9e9e', 
                                      borderRadius: '4px', 
                                      cursor: 'grab', 
                                      display: 'flex', 
                                      flexDirection: 'column', 
                                      gap: '6px', 
                                      boxShadow: '-1px 1px 0 #bdbdbd, -2px 2px 0 #9e9e9e, -3px 3px 0 #757575, -4px 4px 10px rgba(0,0,0,0.3)', 
                                      transition: 'all 0.1s' 
                                    }}
                                    onMouseDown={e => { e.currentTarget.style.transform = 'translate(1px, -1px)'; e.currentTarget.style.boxShadow = '-1px 1px 0 #bdbdbd, -2px 2px 5px rgba(0,0,0,0.2)'; }}
                                    onMouseUp={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '-1px 1px 0 #bdbdbd, -2px 2px 0 #9e9e9e, -3px 3px 0 #757575, -4px 4px 10px rgba(0,0,0,0.3)'; }}
                                    onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '-1px 1px 0 #bdbdbd, -2px 2px 0 #9e9e9e, -3px 3px 0 #757575, -4px 4px 10px rgba(0,0,0,0.3)'; }}
                                  >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                      <strong style={{ fontSize: '14px', color: '#333' }}>{item.name}</strong>
                                      <span style={{ fontSize: '13px', fontWeight: 'bold', backgroundColor: '#616161', color: '#fff', padding: '2px 8px', borderRadius: '4px', whiteSpace: 'nowrap', marginLeft: '8px' }}>x{item.scanQty}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#616161', fontWeight: 'bold' }}>
                                      <span>Payload: {(item.weight || 15) * item.scanQty} kg</span>
                                      <span style={{ opacity: 0.7 }}>ID: {item.id}</span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Trailer View (Isometric 3D) */}
                          <div style={{ flex: 1, backgroundColor: '#eceff1', borderRadius: '12px', padding: '10px', position: 'relative', boxShadow: 'inset 0 10px 40px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                            <div style={{ position: 'absolute', top: '16px', right: '16px', display: 'flex', flexDirection: 'column', gap: '8px', zIndex: 100 }}>
                              <button onClick={() => setVisualZoom(z => Math.min(z + 0.2, 3.0))} style={{ width: '36px', height: '36px', borderRadius: '8px', border: '1px solid #cfd8dc', backgroundColor: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', color: '#455a64', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', transition: 'all 0.2s', fontWeight: 'bold' }}>+</button>
                              <button onClick={() => setVisualZoom(z => Math.max(z - 0.2, 0.4))} style={{ width: '36px', height: '36px', borderRadius: '8px', border: '1px solid #cfd8dc', backgroundColor: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', color: '#455a64', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', transition: 'all 0.2s', fontWeight: 'bold' }}>-</button>
                            </div>
                            <div 
                              style={{ perspective: '1200px', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: isDraggingTruck ? 'grabbing' : 'grab' }}
                              onMouseDown={(e) => {
                                if (e.target.closest('[draggable="true"]')) return;
                                setIsDraggingTruck(true);
                                setDragStart({ x: e.clientX - visualPan.x, y: e.clientY - visualPan.y });
                              }}
                              onMouseMove={(e) => {
                                if (!isDraggingTruck) return;
                                setVisualPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
                              }}
                              onMouseUp={() => setIsDraggingTruck(false)}
                              onMouseLeave={() => setIsDraggingTruck(false)}
                            >
                              <div style={{ transform: `translate(${visualPan.x}px, ${visualPan.y}px) scale(${visualZoom}) rotateX(55deg) rotateZ(-35deg)`, transformStyle: 'preserve-3d', display: 'flex', flexDirection: 'column', alignItems: 'center', width: '250px', transition: isDraggingTruck ? 'none' : 'transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)', boxShadow: '-15px 15px 30px rgba(0,0,0,0.3)' }}>
                                
                                {/* Realistic Forward Cab Area */}
                                <div style={{ width: '130px', display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '2px', zIndex: 10, transform: 'translateZ(15px)' }}>
                                  {/* Engine Hood */}
                                  <div style={{ width: '90px', height: '30px', backgroundColor: '#e0e0e0', border: '2px solid #9e9e9e', borderBottom: 'none', borderRadius: '16px 16px 0 0', position: 'relative', boxShadow: 'inset -2px 2px 5px rgba(255,255,255,0.8), -2px 2px 0 #9e9e9e' }}>
                                     <div style={{ position: 'absolute', top: '10px', left: '20px', right: '20px', height: '5px', backgroundColor: '#9e9e9e', borderRadius: '2px' }}></div>
                                     {/* Headlights */}
                                     <div style={{ position: 'absolute', top: '5px', left: '5px', width: '10px', height: '8px', backgroundColor: '#fff', borderRadius: '4px', boxShadow: '0 0 5px #fff' }}></div>
                                     <div style={{ position: 'absolute', top: '5px', right: '5px', width: '10px', height: '8px', backgroundColor: '#fff', borderRadius: '4px', boxShadow: '0 0 5px #fff' }}></div>
                                  </div>
                                  {/* Cab Roof */}
                                  <div style={{ width: '130px', height: '50px', backgroundColor: '#f5f5f5', border: '2px solid #9e9e9e', borderRadius: '8px 8px 4px 4px', position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', boxShadow: 'inset -2px 2px 5px rgba(255,255,255,0.8), -3px 3px 0 #9e9e9e, -5px 5px 15px rgba(0,0,0,0.4)', transform: 'translateZ(10px)' }}>
                                     {/* Windshield */}
                                     <div style={{ width: '110px', height: '20px', backgroundColor: '#111', marginTop: '-10px', borderRadius: '4px 4px 0 0', opacity: 0.85, boxShadow: 'inset 0 0 8px #000, 0 2px 0 #9e9e9e', borderTop: '2px solid #616161' }}></div>
                                     {/* Cab Vent/Detail */}
                                     <div style={{ width: '80px', height: '10px', border: '1px solid #e0e0e0', marginTop: '10px', borderRadius: '2px' }}></div>
                                     {/* Side Mirrors */}
                                     <div style={{ position: 'absolute', top: '5px', left: '-12px', width: '8px', height: '25px', backgroundColor: '#424242', borderRadius: '4px', border: '2px solid #9e9e9e' }}></div>
                                     <div style={{ position: 'absolute', top: '5px', right: '-12px', width: '8px', height: '25px', backgroundColor: '#424242', borderRadius: '4px', border: '2px solid #9e9e9e' }}></div>
                                  </div>
                                </div>
                                
                                {/* Tractor Joint (Fifth-Wheel Link) */}
                                <div style={{ width: '40px', height: '15px', backgroundColor: '#424242', borderLeft: '2px solid #212121', borderRight: '2px solid #212121', boxShadow: '-2px 2px 0 #212121', transform: 'translateZ(5px)', marginBottom: '2px' }}></div>
                                
                                {/* The Trailer Chassis (Modern Box Truck Bed) */}
                                <div style={{ width: '100%', backgroundColor: '#b0bec5', backgroundImage: 'repeating-linear-gradient(0deg, #cfd8dc, #cfd8dc 20px, #b0bec5 20px, #b0bec5 24px)', padding: '16px', border: '6px solid #78909c', position: 'relative', boxShadow: '-1px 1px 0 #607d8b, -2px 2px 0 #607d8b, -3px 3px 0 #546e7a, -4px 4px 0 #546e7a, -6px 6px 0 #455a64, -12px 12px 25px rgba(0,0,0,0.6), inset 0 0 30px rgba(0,0,0,0.2)', zIndex: 1, display: 'flex', flexDirection: 'column', transformStyle: 'preserve-3d' }}>
                                  
                                  {/* Front Wheels (Cab) */}
                                  <div style={{ position: 'absolute', left: '-20px', top: '5%', width: '16px', height: '40px', backgroundColor: '#212121', borderRadius: '4px', boxShadow: '-2px 2px 5px rgba(0,0,0,0.8), inset -2px 0 5px #000', transform: 'translateZ(-15px)' }}></div>
                                  <div style={{ position: 'absolute', right: '-20px', top: '5%', width: '16px', height: '40px', backgroundColor: '#212121', borderRadius: '4px', boxShadow: '-2px 2px 5px rgba(0,0,0,0.8), inset 2px 0 5px #000', transform: 'translateZ(-15px)' }}></div>

                                  {/* Rear Wheels (Double axle) */}
                                  <div style={{ position: 'absolute', left: '-24px', bottom: '10%', width: '24px', height: '80px', backgroundColor: '#111', borderRadius: '4px', boxShadow: '-2px 2px 5px rgba(0,0,0,0.8), inset -5px 0 10px #000', transform: 'translateZ(-15px)' }}></div>
                                  <div style={{ position: 'absolute', right: '-24px', bottom: '10%', width: '24px', height: '80px', backgroundColor: '#111', borderRadius: '4px', boxShadow: '-2px 2px 5px rgba(0,0,0,0.8), inset 5px 0 10px #000', transform: 'translateZ(-15px)' }}></div>

                                  <div style={{ textAlign: 'center', color: '#111', fontWeight: '900', letterSpacing: '4px', marginBottom: '16px', textTransform: 'uppercase', fontSize: '11px', textShadow: '0 1px 1px rgba(255,255,255,0.8)', transform: 'translateZ(1px)' }}>Trailer Headwall</div>
                                  
                                  <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gridAutoRows: '60px', gap: '6px', paddingRight: '4px', transformStyle: 'preserve-3d' }}>
                                    {Array.from({ length: totalZones }).map((_, zoneId) => {
                                      const occupantIdxStr = (deliveryData.placedItems || {})[zoneId];
                                      const occupantIndex = occupantIdxStr !== undefined ? parseInt(occupantIdxStr, 10) : null;
                                      const occupant = occupantIndex !== null ? deliveryData.scannedEquipment[occupantIndex] : null;

                                      return (
                                        <div 
                                          key={zoneId}
                                          onDragOver={e => e.preventDefault()}
                                          onDrop={e => {
                                            e.preventDefault();
                                            const idxId = e.dataTransfer.getData('text/plain');
                                            if (!idxId) return;
                                            
                                            setDeliveryData(prev => {
                                              const newPlaced = { ...(prev.placedItems || {}) };
                                              
                                              // Block dropping if slot is full and it's a different item
                                              if (newPlaced[zoneId] && newPlaced[zoneId] !== idxId) {
                                                return prev; 
                                              }
                                              
                                              Object.keys(newPlaced).forEach(k => { if (newPlaced[k] === idxId) delete newPlaced[k]; });
                                              newPlaced[zoneId] = idxId;
                                              return { ...prev, placedItems: newPlaced };
                                            });
                                          }}
                                          draggable={!!occupant}
                                          onDragStart={e => {
                                            if (occupant) e.dataTransfer.setData('text/plain', occupantIdxStr);
                                          }}
                                          style={{ 
                                            backgroundColor: occupant ? '#e0e0e0' : 'rgba(0,0,0,0.2)', 
                                            backgroundImage: occupant ? 'repeating-linear-gradient(45deg, transparent, transparent 5px, rgba(0,0,0,0.05) 5px, rgba(0,0,0,0.05) 10px)' : 'repeating-linear-gradient(45deg, rgba(255,235,59,0.1) 25%, transparent 25%, transparent 50%, rgba(255,235,59,0.1) 50%, rgba(255,235,59,0.1) 75%, transparent 75%, transparent)',
                                            backgroundSize: occupant ? 'auto' : '20px 20px',
                                            border: occupant ? '2px solid #9e9e9e' : '2px dashed rgba(255,235,59,0.4)', 
                                            borderRadius: '2px', 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            justifyContent: 'center', 
                                            cursor: occupant ? 'grab' : 'default',
                                            padding: '2px',
                                            position: 'relative',
                                            boxShadow: occupant ? '-1px 1px 0 #bdbdbd, -2px 2px 0 #9e9e9e, -3px 3px 0 #757575, -4px 4px 0 #616161, -5px 5px 0 #424242, -10px 10px 15px rgba(0,0,0,0.6)' : 'inset 0 0 10px rgba(0,0,0,0.5)',
                                            transform: occupant ? 'translateZ(15px)' : 'translateZ(0)',
                                            transition: 'transform 0.1s'
                                          }}
                                          onMouseDown={e => {if(occupant) e.currentTarget.style.transform = 'translateZ(12px) translate(1px, -1px)'}}
                                          onMouseUp={e => {if(occupant) e.currentTarget.style.transform = 'translateZ(15px)'}}
                                          onMouseLeave={e => {if(occupant) e.currentTarget.style.transform = 'translateZ(15px)'}}
                                        >
                                          {!occupant && <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px', fontWeight: 'bold' }}>Z-{zoneId + 1}</span>}
                                          {occupant && (
                                            <div style={{ textAlign: 'center', width: '100%', pointerEvents: 'none' }}>
                                              <div style={{ fontSize: '10px', color: '#333', fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{occupant.name.substring(0, 11)}..</div>
                                              <div style={{ fontSize: '10px', color: '#fff', backgroundColor: '#616161', padding: '1px 3px', borderRadius: '3px', display: 'inline-block', marginTop: '2px' }}>x{occupant.scanQty}</div>
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                  
                                  <div style={{ textAlign: 'center', color: '#fff', fontWeight: 'bold', letterSpacing: '4px', marginTop: '16px', textTransform: 'uppercase', fontSize: '11px', textShadow: '0 2px 4px rgba(0,0,0,0.8)', transform: 'translateZ(1px)' }}>Loading Ramp</div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #eee', paddingTop: '20px' }}>
                          <button onClick={() => setProcessStep(3)} style={{ padding: '12px 24px', backgroundColor: '#f5f5f5', color: '#333', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '500', fontSize: '15px' }}>← Edit Equipment</button>
                          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                            <button
                              onClick={() => setProcessStep(5)}
                              style={{ padding: '14px 28px', backgroundColor: '#f0f0f0', color: '#333', border: '1px solid #ddd', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '16px', transition: 'all 0.2s' }}
                              onMouseEnter={e => e.currentTarget.style.backgroundColor='#e4e4e4'}
                              onMouseLeave={e => e.currentTarget.style.backgroundColor='#f0f0f0'}
                            >
                              Skip
                            </button>
                            <button
                              onClick={() => setProcessStep(5)}
                              disabled={!isComplete}
                              style={{ padding: '14px 36px', backgroundColor: isComplete ? '#04ab0c' : '#ccc', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: isComplete ? 'pointer' : 'not-allowed', fontSize: '16px', boxShadow: isComplete ? '0 6px 16px rgba(4,171,12,0.3)' : 'none', transition: 'all 0.2s' }}
                              onMouseEnter={e => {if(isComplete) e.currentTarget.style.transform = 'translateY(-2px)'}}
                              onMouseLeave={e => {if(isComplete) e.currentTarget.style.transform = 'none'}}
                            >
                              {isComplete ? 'Generate Receipt & Finalize' : 'Load Truck To Continue'}
                            </button>
                          </div>
                        </div>
                      </div>
                    )})()}

                    {processStep === 5 && (
                      <div style={{ textAlign: 'center', padding: '60px 0', animation: 'fadeIn 0.5s' }}>
                        <div style={{ width: '100px', height: '100px', backgroundColor: '#e8f5e9', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px auto', boxShadow: '0 0 0 10px rgba(4,171,12,0.1)' }}>
                          <span style={{ fontSize: '50px', color: '#04ab0c' }}>✓</span>
                        </div>
                        <h2 style={{ fontSize: '28px', color: '#333', marginBottom: '12px' }}>Delivery Processed!</h2>
                        <p style={{ color: '#666', marginBottom: '40px', fontSize: '16px' }}>Job order <strong>{processingJobOrder.jobType}</strong> has been successfully processed and allocated for dispatch.</p>
                        
                        <div style={{ display: 'inline-block', backgroundColor: '#fff', border: '2px dashed #04ab0c', padding: '32px', borderRadius: '12px', textAlign: 'left', marginBottom: '48px', minWidth: '350px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
                          <div style={{ fontSize: '11px', color: '#999', textAlign: 'center', marginBottom: '24px', letterSpacing: '2px', fontWeight: 'bold' }}>OBA LOGISTICS OFFICIAL RECEIPT</div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '15px' }}><span style={{color:'#666'}}>Receipt No:</span> <strong style={{color:'#333', fontFamily: 'monospace', fontSize: '16px'}}>RCPT-{Math.floor(100000 + Math.random() * 900000)}</strong></div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '15px' }}><span style={{color:'#666'}}>Date Processed:</span> <strong style={{color:'#333'}}>{new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}</strong></div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '15px' }}><span style={{color:'#666'}}>Transport:</span> <strong style={{color:'#333'}}>{deliveryData.selectedTruck.split(' ')[0]}</strong></div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', fontSize: '15px' }}><span style={{color:'#666'}}>Status:</span> <strong style={{color:'#04ab0c', backgroundColor: '#e8f5e9', padding: '2px 8px', borderRadius: '4px'}}>Ready for Dispatch</strong></div>
                          
                          <div style={{ borderTop: '1px solid #eee', paddingTop: '16px', display: 'flex', justifyContent: 'center' }}>
                            <div style={{ width: '80%', height: '40px', backgroundImage: 'repeating-linear-gradient(90deg, #333, #333 2px, transparent 2px, transparent 4px, #333 4px, #333 8px, transparent 8px, transparent 10px)', opacity: 0.6 }}></div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
                          <button onClick={() => {
                            if(onUpdateJobOrderStatus) onUpdateJobOrderStatus(processingJobOrder.id, 'ready_for_dispatch', { deliveryData });
                            setProcessingJobOrder(null);
                            setProcessStep(1);
                            setScannerState('disconnected');
                          }} style={{ padding: '14px 36px', backgroundColor: '#f0f0f0', color: '#333', border: '1px solid #ddd', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '16px', transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.backgroundColor='#e4e4e4'} onMouseLeave={e => e.currentTarget.style.backgroundColor='#f0f0f0'}>Return to Deliveries</button>
                          <button onClick={() => {
                            if(onUpdateJobOrderStatus) onUpdateJobOrderStatus(processingJobOrder.id, 'ready_for_dispatch', { deliveryData });
                            const prefill = getTripPrefillData({
                              selectedTruck: deliveryData.selectedTruck,
                              assignedManpower: deliveryData.assignedManpower,
                              processingJobOrder,
                              employees
                            });
                            setActiveTab('tripmanager');
                            setShowTripModal(true);
                            setNewTrip({
                              truckNumber: '',
                              truckType: '',
                              driver: '',
                              pahintate: '',
                              selectedJobOrders: [],
                              ...prefill
                            });
                            setProcessingJobOrder(null);
                            setProcessStep(1);
                            setScannerState('disconnected');
                            toast.success('Trip Manager opened with the trip details pre-filled.');
                          }} style={{ padding: '14px 36px', backgroundColor: '#04ab0c', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '16px', boxShadow: '0 6px 16px rgba(4,171,12,0.2)' }}>Go to Trip Manager</button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : activeTab === 'tripmanager' ? (
            <>
              {/* Trip Manager Section */}
              <section className="stats-section">
                <StatCard title="Active Trips" value={activeTrips.length} icon="🚚" />
                <StatCard title="Total Loads" value={activeTrips.reduce((sum, trip) => sum + (trip.selectedJobOrders || []).length, 0)} icon="📦" />
                <StatCard title="Total Manpower" value={activeTrips.reduce((sum, trip) => sum + getTotalManpower(trip.selectedJobOrders || [], trip), 0)} icon="👥" />
                <StatCard title="Available Orders" value={effectiveJobOrders.filter(order => order.status !== 'processed' && order.status !== 'assigned').length} icon="🚗" />
              </section>

              <section className="meetings-section">
                <div className="meetings-header">
                  <h3>Create New Trip</h3>
                  <button className="btn-add" onClick={() => setShowTripModal(true)}>+ New Trip</button>
                </div>
              </section>

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
                        <div style={{ backgroundColor: '#f9f9f9', padding: '16px', borderRadius: '8px' }}>
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

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            <div style={{ backgroundColor: '#e8f5e9', padding: '12px', borderRadius: '6px' }}>
                              <div style={{ fontSize: '11px', color: '#666', marginBottom: '4px' }}>Driver</div>
                              <div style={{ fontSize: '14px', fontWeight: '600', color: '#333' }}>👨‍💼 {trip.driver}</div>
                            </div>
                            <div style={{ backgroundColor: '#fff3e0', padding: '12px', borderRadius: '6px' }}>
                              <div style={{ fontSize: '11px', color: '#666', marginBottom: '4px' }}>Pahintate</div>
                              <div style={{ fontSize: '14px', fontWeight: '600', color: '#333' }}>👨‍🔧 {trip.pahintate}</div>
                            </div>
                          </div>
                          <div style={{ backgroundColor: '#e3f2fd', padding: '12px', borderRadius: '6px' }}>
                            <div style={{ fontSize: '11px', color: '#666', marginBottom: '4px' }}>Job Order Loads</div>
                            <div style={{ fontSize: '13px', color: '#333', lineHeight: '1.4' }}>{getLoadSummary(trip.selectedJobOrders)}</div>
                          </div>
                          <div style={{ backgroundColor: '#f0f8ff', padding: '12px', borderRadius: '6px' }}>
                            <div style={{ fontSize: '11px', color: '#666', marginBottom: '4px' }}>Deliver To:</div>
                            <div style={{ fontSize: '13px', color: '#333', lineHeight: '1.4' }}>{getDeliveryInfo(trip.selectedJobOrders)}</div>
                          </div>
                        </div>

                        <div style={{ backgroundColor: '#f5f5f5', padding: '16px', borderRadius: '8px', textAlign: 'center' }}>
                          <div style={{ fontSize: '12px', color: '#999', marginBottom: '8px' }}>Trip Summary</div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div>
                              <div style={{ fontSize: '24px', fontWeight: '700', color: '#04ab0c' }}>{trip.selectedJobOrders.length}</div>
                              <div style={{ fontSize: '11px', color: '#666' }}>Job Orders</div>
                            </div>
                            <div>
                              <div style={{ fontSize: '20px', fontWeight: '700', color: '#43a047' }}>{getTotalManpower(trip.selectedJobOrders, trip)}</div>
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
            </>
          ) : activeTab === 'inventory' ? (
            <>
              <section className="meetings-section" style={{ minHeight: '600px' }}>
                <div style={{ display: 'flex', borderBottom: '2px solid #eee', marginBottom: '20px' }}>
                  <button 
                    onClick={() => setActiveWarehouse('warehouse1')}
                    style={{ 
                      padding: '12px 24px', 
                      backgroundColor: 'transparent', 
                      border: 'none', 
                      borderBottom: activeWarehouse === 'warehouse1' ? '3px solid #04ab0c' : '3px solid transparent',
                      fontWeight: activeWarehouse === 'warehouse1' ? 'bold' : 'normal',
                      color: activeWarehouse === 'warehouse1' ? '#04ab0c' : '#666',
                      cursor: 'pointer',
                      fontSize: '16px',
                      transition: 'all 0.2s'
                    }}>
                    Warehouse 1
                  </button>
                  <button 
                    onClick={() => setActiveWarehouse('warehouse2')}
                    style={{ 
                      padding: '12px 24px', 
                      backgroundColor: 'transparent', 
                      border: 'none', 
                      borderBottom: activeWarehouse === 'warehouse2' ? '3px solid #04ab0c' : '3px solid transparent',
                      fontWeight: activeWarehouse === 'warehouse2' ? 'bold' : 'normal',
                      color: activeWarehouse === 'warehouse2' ? '#04ab0c' : '#666',
                      cursor: 'pointer',
                      fontSize: '16px',
                      transition: 'all 0.2s'
                    }}>
                    Warehouse 2
                  </button>
                </div>

                <div className="inventory-table-container">
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead style={{ backgroundColor: '#f9f9f9', borderBottom: '2px solid #eee' }}>
                      <tr>
                        <th style={{ padding: '16px', color: '#555', fontWeight: '600' }}>Product Name</th>
                        <th style={{ padding: '16px', color: '#555', fontWeight: '600' }}>Quantity</th>
                        <th style={{ padding: '16px', color: '#555', fontWeight: '600' }}>Unit</th>
                        <th style={{ padding: '16px', color: '#555', fontWeight: '600' }}>Status</th>
                        <th style={{ padding: '16px', color: '#555', fontWeight: '600' }}>Action</th>
                        <th style={{ padding: '16px', color: '#555', fontWeight: '600' }}>QR Code</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        const activeData = inventoryData[activeWarehouse];
                        const groupedData = activeData.reduce((acc, item) => {
                          if (!acc[item.category]) acc[item.category] = [];
                          acc[item.category].push(item);
                          return acc;
                        }, {});
                        return Object.entries(groupedData).map(([category, items]) => (
                          <React.Fragment key={category}>
                            <tr>
                              <td colSpan="6" style={{ padding: '12px 16px', backgroundColor: '#e3f2fd', color: '#1565C0', fontWeight: 'bold', fontSize: '15px' }}>
                                📁 {category}
                              </td>
                            </tr>
                            {items.map((item) => (
                              <tr key={item.id} style={{ borderBottom: '1px solid #eee', transition: 'background-color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fff8'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                                <td style={{ padding: '16px', paddingLeft: '32px', fontWeight: '700', color: '#333' }}>{item.name}</td>
                                <td style={{ padding: '16px', fontWeight: 'bold', fontSize: '16px', color: item.quantity > 50 ? '#04ab0c' : '#ff9800' }}>{item.quantity}</td>
                                <td style={{ padding: '16px', color: '#666', fontWeight: '500' }}>{item.unit}</td>
                                <td style={{ padding: '16px' }}>
                                  {item.quantity > 50 ? (
                                    <span style={{ color: '#04ab0c', fontWeight: 'bold', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#04ab0c', display: 'inline-block' }}></span> 
                                      In Stock
                                    </span>
                                  ) : (
                                    <span style={{ color: '#ff9800', fontWeight: 'bold', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#ff9800', display: 'inline-block' }}></span> 
                                      Low Stock
                                    </span>
                                  )}
                                </td>
                                <td style={{ padding: '16px' }}>
                                  <button onClick={() => setRestockItem(item)} style={{ padding: '6px 12px', backgroundColor: '#e8f5e9', color: '#04ab0c', border: '1px solid #04ab0c', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', transition: 'all 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#04ab0c'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#e8f5e9'} onMouseOver={(e) => e.currentTarget.style.color = 'white'} onMouseOut={(e) => e.currentTarget.style.color = '#04ab0c'}>
                                    + Restock
                                  </button>
                                </td>
                                <td style={{ padding: '16px' }}>
                                  <button 
                                    onClick={() => setSelectedQrItem(item)}
                                    style={{ padding: '6px 12px', backgroundColor: '#e3f2fd', color: '#1976d2', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                                  >
                                    View QR
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </React.Fragment>
                        ));
                      })()}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          ) : null}

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

      {/* Restock Modal */}
      {restockItem && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setRestockItem(null)}>
          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '32px', maxWidth: '400px', width: '90%', boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)' }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ margin: '0 0 16px 0', fontSize: '20px', fontWeight: '700', color: '#333' }}>📦 Restock Item</h2>
            <p style={{ marginBottom: '24px', color: '#666', lineHeight: '1.5' }}>
              You are restocking <strong>{restockItem.name}</strong>.<br/>
              Current Quantity: <strong>{restockItem.quantity} {restockItem.unit}</strong>
            </p>
            <form onSubmit={handleRestock} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: '#333' }}>Quantity to Add *</label>
                <input 
                  type="number" 
                  value={restockQuantity} 
                  onChange={(e) => setRestockQuantity(e.target.value)} 
                  placeholder={`e.g. 50`} 
                  required 
                  min="1"
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '14px', boxSizing: 'border-box' }} 
                />
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                <button type="submit" style={{ flex: 1, padding: '12px', backgroundColor: '#04ab0c', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '16px', fontWeight: '600' }}>Confirm Restock</button>
                <button type="button" onClick={() => setRestockItem(null)} style={{ flex: 1, padding: '12px', backgroundColor: '#f0f0f0', color: '#333', border: '1px solid #ddd', borderRadius: '6px', cursor: 'pointer', fontSize: '16px', fontWeight: '600' }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Trip Modal */}
      {showTripModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setShowTripModal(false)}>
          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '32px', maxWidth: '700px', width: '90%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)' }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ margin: '0 0 24px 0', fontSize: '24px', fontWeight: '700', color: '#333' }}>🚚 Create New Trip</h2>
            <form onSubmit={handleTripSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: '#333' }}>Truck Number *</label>
                  <input type="text" name="truckNumber" value={newTrip.truckNumber} onChange={handleInputChange} placeholder="e.g., TRK-001" required style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '14px', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: '#333' }}>Truck Type</label>
                  <input type="text" name="truckType" value={newTrip.truckType} onChange={handleInputChange} placeholder="e.g., Faw 6 Wheeler" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '14px', boxSizing: 'border-box' }} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: '#333' }}>Driver Name *</label>
                  <select name="driver" value={newTrip.driver} onChange={handleInputChange} required style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '14px', boxSizing: 'border-box' }}>
                    <option value="">Select Driver...</option>
                    {(() => {
                      const { driverOptions } = getAvailableDriverPahinanteOptions(employees, activeTrips, arrivedTripIds);
                      return driverOptions.map(emp => (
                        <option key={emp.id || emp.name} value={emp.name}>{emp.name}</option>
                      ));
                    })()}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: '#333' }}>Pahintate / Assistant *</label>
                  <select name="pahintate" value={newTrip.pahintate} onChange={handleInputChange} required style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '14px', boxSizing: 'border-box' }}>
                    <option value="">Select Assistant...</option>
                    {(() => {
                      const { pahintateOptions } = getAvailableDriverPahinanteOptions(employees, activeTrips, arrivedTripIds);
                      return pahintateOptions.map(emp => (
                        <option key={emp.id || emp.name} value={emp.name}>{emp.name}</option>
                      ));
                    })()}
                  </select>
                </div>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '12px', fontSize: '14px', fontWeight: '600', color: '#333' }}>Select Processed Job Orders to Load * ({newTrip.selectedJobOrders.length} selected)</label>
                <div style={{ border: '1px solid #ddd', borderRadius: '6px', maxHeight: '200px', overflowY: 'auto', padding: '12px' }}>
                  {jobOrders && jobOrders.filter(order => order.status === 'processed').length > 0 ? (
                    jobOrders.filter(order => order.status === 'processed').map((order) => (
                      <label key={order.id} style={{ display: 'flex', alignItems: 'center', padding: '10px', borderRadius: '6px', cursor: 'pointer', backgroundColor: newTrip.selectedJobOrders.includes(order.id) ? '#e8f5e9' : 'transparent', marginBottom: '8px' }}>
                        <input type="checkbox" checked={newTrip.selectedJobOrders.includes(order.id)} onChange={() => handleJobOrderSelect(order.id)} style={{ marginRight: '12px', cursor: 'pointer' }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '14px', fontWeight: '600', color: '#333' }}>{order.jobType}</div>
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
                    <div style={{ textAlign: 'center', color: '#999', padding: '20px' }}>No processed job orders available</div>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                <button type="submit" style={{ flex: 1, padding: '12px', backgroundColor: '#04ab0c', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '16px', fontWeight: '600' }}>Create Trip</button>
                <button type="button" onClick={() => setShowTripModal(false)} style={{ flex: 1, padding: '12px', backgroundColor: '#f0f0f0', color: '#333', border: '1px solid #ddd', borderRadius: '6px', cursor: 'pointer', fontSize: '16px', fontWeight: '600' }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedQrItem && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setSelectedQrItem(null)}>
          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '32px', textAlign: 'center', width: '300px', boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginBottom: '20px', color: '#333' }}>{selectedQrItem.name}</h3>
            <div style={{ background: 'white', padding: '16px', display: 'inline-block', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
              <QRCodeSVG value={selectedQrItem.name} size={200} level="H" />
            </div>
            <p style={{ marginTop: '16px', color: '#666', fontSize: '14px' }}>Scan this code to automatically add the item to your active job order.</p>
            <div style={{ marginTop: '24px' }}>
              <button type="button" onClick={() => setSelectedQrItem(null)} style={{ padding: '10px 24px', backgroundColor: '#eee', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Close</button>
            </div>
          </div>
        </div>
      )}

    </div>
    </>
  );
}
