export function cleanupCompletedTrips(trips = [], doneDeliveries = []) {
  return trips;
}

export function removeCompletedEvent(events = [], completedEvent) {
  if (!completedEvent) return events;

  if (completedEvent.status === 'completion') {
    const targetOrderId = completedEvent.jobOrderId;
    const targetName = completedEvent.name ? completedEvent.name.replace(/ \(End\).*$/, '') : null;

    return events.filter(event => {
      if (targetOrderId && event.jobOrderId === targetOrderId) return false;
      if (!targetOrderId && targetName && event.name && event.name.startsWith(targetName)) return false;
      return event.id !== completedEvent.id;
    });
  }

  return events.filter(event => event.id !== completedEvent.id || event.status !== completedEvent.status);
}

export function getVisibleJobOrderEvents({
  events = [],
  doneDeliveries = [],
  unsuccessfulDeliveries = [],
  trips = []
} = {}) {
  const unsuccessfulOrderIds = new Set();
  (unsuccessfulDeliveries || []).forEach(d => {
    if (d?.jobOrderId) unsuccessfulOrderIds.add(String(d.jobOrderId));
  });
  (trips || []).forEach(t => {
    if (t?.tripStatus === 'unsuccessful') {
      if (t.jobOrderId) unsuccessfulOrderIds.add(String(t.jobOrderId));
      (t.selectedJobOrders || []).forEach(id => unsuccessfulOrderIds.add(String(id)));
    }
  });

  const tripCreatedOrderIds = new Set();
  (events || []).forEach(e => {
    if (e?.status === 'trip' && e.jobOrderId) {
      tripCreatedOrderIds.add(String(e.jobOrderId));
    }
  });
  (doneDeliveries || []).forEach(d => {
    if (d?.jobOrderId && d?.status !== 'completion') {
      tripCreatedOrderIds.add(String(d.jobOrderId));
    }
  });
  (trips || []).forEach(t => {
    if (t?.jobOrderId) tripCreatedOrderIds.add(String(t.jobOrderId));
    (t.selectedJobOrders || []).forEach(id => tripCreatedOrderIds.add(String(id)));
  });

  return (events || []).filter(event => {
    if (!['active', 'started', 'completion'].includes(event?.status)) return false;
    if (!event.jobOrderId) return false;
    const orderIdStr = String(event.jobOrderId);
    if (unsuccessfulOrderIds.has(orderIdStr)) return false;
    return tripCreatedOrderIds.has(orderIdStr);
  });
}
