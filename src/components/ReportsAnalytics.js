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
  events = [],
  trips = [],
  doneDeliveries = [],
  unsuccessfulDeliveries = [],
  trucks = [],
  isSubView = false
}) {
  const [dateFilter, setDateFilter] = useState('All');
  const [reportDate, setReportDate] = useState('');

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

  const getDeliveryDate = (delivery) => delivery?.deliveredAt || delivery?.completionDate || delivery?.date || delivery?.createdAt;
  const isDateValueInReport = (dateValue) => {
    if (!dateValue) return !reportDate && dateFilter === 'All';
    if (!dateValue) return false;
    const deliveryDate = new Date(dateValue);
    if (Number.isNaN(deliveryDate.getTime())) return false;
    if (reportDate) return deliveryDate.toISOString().slice(0, 10) === reportDate;
    if (dateFilter === 'All') return true;
    const days = dateFilter === '30Days' ? 30 : 7;
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    return deliveryDate >= cutoff;
  };
  const isDateInReport = (delivery) => isDateValueInReport(getDeliveryDate(delivery));

  const filteredDoneDeliveries = useMemo(
    () => (doneDeliveries || []).filter(delivery => delivery?.status !== 'completion' && isDateInReport(delivery)),
    [doneDeliveries, dateFilter, reportDate]
  );
  const filteredUnsuccessfulDeliveries = useMemo(
    () => (unsuccessfulDeliveries || []).filter(isDateInReport),
    [unsuccessfulDeliveries, dateFilter, reportDate]
  );

  const includeDummyAnalyticsData = dateFilter === 'All' && !reportDate;
  const dummyOrdersByMonth = [140, 25, 110, 30, 180, 45, 70];
  const dummyCompletedByMonth = [90, 15, 75, 10, 120, 20, 40];
  const dummyUnsuccessfulByMonth = [2, 8, 1, 10, 3, 4, 2];
  const dummyCompletedCount = dummyCompletedByMonth.reduce((total, value) => total + value, 0);
  const dummyUnsuccessfulCount = dummyUnsuccessfulByMonth.reduce((total, value) => total + value, 0);

  // Overall KPIs
  const completedCount = filteredDoneDeliveries.length + (includeDummyAnalyticsData ? dummyCompletedCount : 0);
  const unsuccessfulCount = filteredUnsuccessfulDeliveries.length + (includeDummyAnalyticsData ? dummyUnsuccessfulCount : 0);
  const totalDeliveries = completedCount + unsuccessfulCount;
  const successRate = totalDeliveries > 0 ? Math.round((completedCount / totalDeliveries) * 100) : 100;
  const completedJobOrderIds = new Set((doneDeliveries || [])
    .filter(delivery => delivery?.status === 'done' || delivery?.status === 'completion')
    .filter(delivery => delivery?.jobOrderId !== undefined && delivery?.jobOrderId !== null)
    .map(delivery => String(delivery.jobOrderId)));
  const unsuccessfulJobOrderIds = new Set((unsuccessfulDeliveries || [])
    .filter(delivery => delivery?.jobOrderId !== undefined && delivery?.jobOrderId !== null)
    .map(delivery => String(delivery.jobOrderId)));
  const onTripJobOrderIds = new Set((events || [])
    .filter(event => event?.status === 'trip')
    .map(event => String(event.jobOrderId || event.id)));

  // Travel distance & length computations
  const travelReports = useMemo(() => {
    const reportOrders = [...filteredJobOrders];
    const existingOrderIds = new Set(reportOrders.map(order => String(order.id)));
    (events || [])
      .filter(event => event?.status === 'trip' && !existingOrderIds.has(String(event.jobOrderId || event.id)))
      .forEach(event => reportOrders.push({
        ...event,
        id: event.jobOrderId || event.id,
        customerName: event.customerName || event.name,
        address: event.address || event.deliveryData?.address,
        company: event.company,
        jobType: event.jobType || 'Delivery',
        startDate: event.date
      }));

    [...filteredDoneDeliveries, ...filteredUnsuccessfulDeliveries].forEach(delivery => {
      const deliveryId = delivery?.jobOrderId || delivery?.id;
      if (!deliveryId || existingOrderIds.has(String(deliveryId))) return;
      reportOrders.push({
        ...delivery,
        id: deliveryId,
        customerName: delivery.customerName || delivery.name,
        address: delivery.address || delivery.deliveryData?.address,
        startDate: getDeliveryDate(delivery)
      });
      existingOrderIds.add(String(deliveryId));
    });

    return reportOrders.filter(order => {
      const matchingCompletion = doneDeliveries.find(delivery => String(delivery.jobOrderId) === String(order.id));
      const matchingUnsuccessful = unsuccessfulDeliveries.find(delivery => String(delivery.jobOrderId) === String(order.id));
      const relevantDates = [
        order.startDate,
        matchingCompletion?.deliveredAt,
        matchingCompletion?.completionDate,
        matchingCompletion?.date,
        matchingUnsuccessful?.date
      ].filter(Boolean);
      return relevantDates.length > 0
        ? relevantDates.some(isDateValueInReport)
        : isDateInReport(order);
    }).map(order => {
      const matchingCompletion = doneDeliveries.find(delivery => String(delivery.jobOrderId) === String(order.id));
      const matchingUnsuccessful = unsuccessfulDeliveries.find(delivery => String(delivery.jobOrderId) === String(order.id));
      const deliveryDates = [
        matchingCompletion?.deliveredAt,
        matchingCompletion?.completionDate,
        matchingCompletion?.date,
        matchingUnsuccessful?.date
      ].filter(Boolean);
      const metrics = getTravelMetrics(order.address);
      const assignedTrip = trips.find(t => (t.selectedJobOrders || []).includes(order.id) || t.jobOrderId === order.id);
      
      return {
        id: order.id,
        customerName: order.customerName || 'Client',
        company: order.company || 'OBA Partner',
        address: order.address || 'Standard Location',
        jobType: order.jobType || 'Delivery',
        status: unsuccessfulJobOrderIds.has(String(order.id))
          ? 'Unsuccessful'
          : completedJobOrderIds.has(String(order.id))
            ? 'Complete'
            : onTripJobOrderIds.has(String(order.id))
              ? 'On Trip'
            : order.status || 'Pending',
        locationName: metrics.locationName,
        distance: metrics.distance,
        duration: metrics.duration,
        region: metrics.region,
        truckNumber: assignedTrip ? assignedTrip.truckNumber : 'TRK-001',
        driver: assignedTrip ? assignedTrip.driver : 'Assigned Driver',
        reportDate: reportDate
          ? deliveryDates.find(isDateValueInReport) || order.startDate
          : deliveryDates[0] || order.startDate
      };
    }).sort((firstReport, secondReport) => {
      const firstDate = new Date(firstReport.reportDate || 0).getTime();
      const secondDate = new Date(secondReport.reportDate || 0).getTime();
      const normalizedFirstDate = Number.isNaN(firstDate) ? 0 : firstDate;
      const normalizedSecondDate = Number.isNaN(secondDate) ? 0 : secondDate;
      return normalizedSecondDate - normalizedFirstDate;
    });
  }, [filteredJobOrders, events, trips, doneDeliveries, unsuccessfulDeliveries, filteredDoneDeliveries, filteredUnsuccessfulDeliveries, reportDate, completedJobOrderIds, unsuccessfulJobOrderIds, onTripJobOrderIds]);

  const totalShipments = travelReports.length + (includeDummyAnalyticsData ? dummyOrdersByMonth.reduce((total, value) => total + value, 0) : 0);

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
    const chartYear = reportDate ? new Date(`${reportDate}T00:00:00`).getFullYear() : new Date().getFullYear();
    const months = Array.from({ length: 12 }, (_, monthIndex) => {
      const d = new Date(chartYear, monthIndex, 1);
      return {
        label: d.toLocaleString('default', { month: 'short' }),
        key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
        shipments: includeDummyAnalyticsData && monthIndex < 7 ? dummyOrdersByMonth[monthIndex] : 0,
        deliveries: includeDummyAnalyticsData && monthIndex < 7
          ? dummyCompletedByMonth[monthIndex] + dummyUnsuccessfulByMonth[monthIndex]
          : 0,
        completed: includeDummyAnalyticsData && monthIndex < 7 ? dummyCompletedByMonth[monthIndex] : 0
      };
    });

    travelReports.forEach(report => {
      if (!report.reportDate) return;
      const d = new Date(report.reportDate);
      if (Number.isNaN(d.getTime())) return;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const m = months.find(item => item.key === key);
      if (m) {
        m.shipments += 1;
        if (report.status === 'Complete' || report.status === 'Unsuccessful') {
          m.deliveries += 1;
        }
        if (report.status === 'Complete') {
          m.completed += 1;
        }
      }
    });

    return months;
  }, [travelReports, reportDate]);

  const chartMaxValue = reportDate ? 25 : 200;
  const chartYTicks = reportDate ? [0, 5, 10, 15, 20, 25] : [0, 50, 100, 150, 200];

  const handleGenerateReport = async () => {
    const endedJobOrders = doneDeliveries.filter(delivery => delivery.status === 'completion' && isDateInReport(delivery));
    const filterLabel = dateFilter === 'All' ? 'All Time Overview' : dateFilter === '30Days' ? 'Last 30 Days' : 'Last 7 Days';
    const generatedOn = new Date().toLocaleString();

    const [{ jsPDF }, { autoTable }] = await Promise.all([
      import('jspdf'),
      import('jspdf-autotable')
    ]);
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Logo (loaded as a data URL so it can be embedded in the PDF)
    let logoDataUrl = null;
    try {
      logoDataUrl = await fetch('/logo.png')
        .then(res => res.blob())
        .then(blob => new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        }));
    } catch (logoError) {
      console.error('Unable to load logo for PDF report:', logoError);
    }

    // Header
    const textStartX = logoDataUrl ? 36 : 14;
    if (logoDataUrl) {
      doc.addImage(logoDataUrl, 'JPEG', 14, 10, 18, 18);
    }
    doc.setFontSize(18);
    doc.setTextColor(4, 171, 12);
    doc.text('OBA Supplies & Services', textStartX, 20);
    doc.setFontSize(13);
    doc.setTextColor(40, 40, 40);
    doc.text('Logistics Analytics & Deliveries Summary Report', textStartX, 27);
    doc.setFontSize(10);
    doc.setTextColor(110, 110, 110);
    doc.text(`Generated: ${generatedOn}`, 14, 34);
    doc.text(`Filter Window: ${filterLabel}${reportDate ? ` (Selected Date: ${reportDate})` : ''}`, 14, 39);

    // KPI Summary
    autoTable(doc, {
      startY: 45,
      head: [['Summary Metric', 'Value']],
      body: [
        ['Total Shipments', String(totalShipments)],
        ['Deliveries Handled', `${totalDeliveries} (${successRate}% success rate)`],
        ['Unsuccessful Deliveries', String(unsuccessfulCount)],
        ['Ended Job Orders', String(endedJobOrders.length)],
        ['Length of Travel', `${totalTravelKm} km total • avg ${avgTravelKm} km per shipment`],
        ['Client Locations', `${locationBreakdown.length} unique destination${locationBreakdown.length === 1 ? '' : 's'}`]
      ],
      theme: 'grid',
      headStyles: { fillColor: [4, 171, 12] },
      styles: { fontSize: 10 }
    });

    // Client Location Distribution
    let nextY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(12);
    doc.setTextColor(40, 40, 40);
    doc.text('Client Location Distribution', 14, nextY);
    autoTable(doc, {
      startY: nextY + 4,
      head: [['Location', 'Region', 'Shipments', 'Total Distance']],
      body: locationBreakdown.length > 0
        ? locationBreakdown.map(loc => [loc.name, loc.region, String(loc.count), `${loc.totalKm} km`])
        : [['No location data available for this filter.', '-', '-', '-']],
      theme: 'striped',
      headStyles: { fillColor: [156, 39, 176] },
      styles: { fontSize: 9 }
    });

    // Monthly Trends
    nextY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(12);
    doc.setTextColor(40, 40, 40);
    doc.text('Monthly Shipment & Delivery Trends', 14, nextY);
    autoTable(doc, {
      startY: nextY + 4,
      head: [['Month', 'Shipments', 'Deliveries', 'Completed']],
      body: monthData.map(m => [m.label, String(m.shipments), String(m.deliveries), String(m.completed)]),
      theme: 'striped',
      headStyles: { fillColor: [25, 118, 210] },
      styles: { fontSize: 9 }
    });

    // Shipment Travel Length & Delivery Log
    nextY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(12);
    doc.setTextColor(40, 40, 40);
    doc.text('Shipment Travel Length & Delivery Log', 14, nextY);
    autoTable(doc, {
      startY: nextY + 4,
      head: [['Customer', 'Company', 'Destination Hub', 'Distance', 'Travel Time', 'Vehicle', 'Status']],
      body: travelReports.length > 0
        ? travelReports.map(r => [r.customerName, r.company, r.locationName, `${r.distance} km`, r.duration, r.truckNumber, r.status])
        : [['No shipment reports available for this filter.', '', '', '', '', '', '']],
      theme: 'striped',
      headStyles: { fillColor: [237, 108, 2] },
      styles: { fontSize: 8 },
      columnStyles: { 0: { cellWidth: 28 }, 1: { cellWidth: 26 }, 2: { cellWidth: 26 } }
    });

    // Footer page numbers
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(`Page ${i} of ${pageCount}`, pageWidth - 30, doc.internal.pageSize.getHeight() - 10);
    }

    doc.save(`oba-logistics-analytics-report-${new Date().toISOString().slice(0, 10)}.pdf`);
    toast.success('PDF report generated and saved successfully.');
  };

  const mainContent = (
    <div style={{ padding: '20px 0', animation: 'fadeIn 0.2s' }}>
      {/* Top Filter and Actions Bar */}
      <div className="analytics-toolbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', backgroundColor: 'white', padding: '16px 24px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
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
          className="report-generate-button"
          onClick={handleGenerateReport}
          style={{ padding: '10px 20px', backgroundColor: '#04ab0c', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          📄 Generate Report (PDF)
        </button>
      </div>

      {/* KPI Cards Section */}
      <section className="stats-section analytics-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '24px' }}>
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
            {totalDeliveries} <span style={{ fontSize: '16px', color: '#4caf50', fontWeight: 'normal' }}>({successRate}% success)</span>
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
      <div className="analytics-highlights" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', marginBottom: '28px' }}>
        {/* Shipment & Delivery Volume Trends */}
        <div className="analytics-panel" style={{ backgroundColor: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '18px', color: '#333' }}>📊 Shipment & Delivery Trends</h3>
              <p style={{ margin: '4px 0 0', color: '#777', fontSize: '13px' }}>Monthly volume breakdown of scheduled shipments vs dispatches.</p>
            </div>
            <div style={{ display: 'flex', gap: '16px', fontSize: '12px', fontWeight: 'bold' }}>
              <span style={{ color: '#1976d2' }}>■ Total Orders</span>
              <span style={{ color: '#04ab0c' }}>■ {reportDate ? 'Deliveries Handled' : 'Success Rate'}</span>
            </div>
          </div>

          <div style={{ height: '220px', padding: '8px 0 0', borderBottom: '1px solid #eee' }}>
            <svg viewBox="0 0 960 220" preserveAspectRatio="none" style={{ width: '100%', height: '100%' }} role="img" aria-label="Monthly total shipments and deliveries handled">
              {chartYTicks.map((tick) => {
                const y = 190 - (tick / chartMaxValue) * 170;
                return (
                  <g key={tick}>
                    <line x1="42" y1={y} x2="890" y2={y} stroke="#e6edf5" strokeWidth="1" />
                    <text x="34" y={y + 4} textAnchor="end" fill="#5f6f82" fontSize="11">{tick}</text>
                  </g>
                );
              })}
              {[0, 20, 40, 60, 80, 100].map((percentage) => {
                const y = 190 - (percentage / 100) * 170;
                return <text key={percentage} x="915" y={y + 4} textAnchor="start" fill="#5f6f82" fontSize="11">{percentage}%</text>;
              })}
              {['deliveries', 'shipments'].map((series) => {
                const getChartValue = (month) => series === 'deliveries'
                  ? (reportDate
                    ? (month.shipments > 0 ? (month.deliveries / month.shipments) * 100 : 0)
                    : (month.deliveries > 0 ? (month.completed / month.deliveries) * 100 : 0))
                  : month.shipments;
                const points = monthData.map((month, index) => {
                  const value = getChartValue(month);
                  const maxValue = series === 'deliveries' ? 100 : chartMaxValue;
                  return `${index * (840 / 11) + 50},${190 - (Math.min(value, maxValue) / maxValue) * 170}`;
                }).join(' ');
                const color = series === 'shipments' ? '#3988f5' : '#04ab0c';
                return (
                  <g key={series}>
                    <polyline points={points} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                    {monthData.map((month, index) => (
                      <circle
                        key={month.key}
                        cx={index * (840 / 11) + 50}
                        cy={190 - (Math.min(getChartValue(month), series === 'deliveries' ? 100 : chartMaxValue) / (series === 'deliveries' ? 100 : chartMaxValue)) * 170}
                        r="5"
                        fill="white"
                        stroke={color}
                        strokeWidth="3"
                      >
                        <title>{series === 'deliveries'
                          ? `${month.label}: ${Math.round(getChartValue(month))}% ${reportDate ? 'deliveries handled' : 'success rate'}`
                          : `${month.label}: ${month.shipments} total shipments`}</title>
                      </circle>
                    ))}
                  </g>
                );
              })}
              {monthData.map((month, index) => <text key={month.key} x={index * (840 / 11) + 50} y="213" textAnchor="middle" fill="#5f6f82" fontSize="11">{month.label}</text>)}
            </svg>
          </div>
        </div>

        {/* Client Locations Distribution */}
        <div className="analytics-panel" style={{ backgroundColor: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
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
      <div className="analytics-report-panel" style={{ backgroundColor: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
        <div className="analytics-report-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '18px', color: '#333' }}>🛣️ Shipment Travel Length & Client Locations Report</h3>
            <p style={{ margin: '4px 0 0', color: '#777', fontSize: '13px' }}>Detailed breakdown of delivery distance, travel time, assigned vehicle, and destination location.</p>
          </div>
          <div className="analytics-report-controls" style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#555', fontWeight: '600' }}>
              Choose Date:
              <input
                type="date"
                value={reportDate}
                onChange={(e) => setReportDate(e.target.value)}
                style={{ padding: '8px 10px', border: '1px solid #d8dee6', borderRadius: '6px', color: '#333', backgroundColor: '#fff' }}
              />
              <button
                type="button"
                onClick={() => setReportDate('')}
                style={{ padding: '8px 10px', border: '1px solid #1976d2', borderRadius: '6px', color: '#1976d2', backgroundColor: reportDate ? '#fff' : '#e3f2fd', cursor: 'pointer', fontWeight: '600' }}
              >
                Overall View
              </button>
            </label>
            <span style={{ fontSize: '13px', color: '#555', fontWeight: 'bold' }}>{totalDeliveries} records analyzed</span>
          </div>
        </div>

        <div className="analytics-table-wrap" style={{ maxHeight: '420px', overflow: 'auto' }}>
          <table className="analytics-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ position: 'sticky', top: 0, zIndex: 1, backgroundColor: '#f9f9f9' }}>
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
                        backgroundColor: report.status === 'Complete' || report.status === 'completion' ? '#e8f5e9' : report.status === 'Unsuccessful' ? '#ffebee' : report.status === 'On Trip' || report.status === 'assigned' ? '#e3f2fd' : '#fff3e0',
                        color: report.status === 'Complete' || report.status === 'completion' ? '#2e7d32' : report.status === 'Unsuccessful' ? '#c62828' : report.status === 'On Trip' || report.status === 'assigned' ? '#1565c0' : '#e65100'
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
