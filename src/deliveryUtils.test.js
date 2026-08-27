import { cleanupCompletedTrips, removeCompletedEvent, getVisibleJobOrderEvents } from './deliveryUtils';

describe('cleanupCompletedTrips', () => {
  it('keeps truck info trips visible when deliveries are marked done', () => {
    const trips = [{ id: 'trip-1', selectedJobOrders: ['order-1'] }];
    const doneDeliveries = [{ jobOrderId: 'order-1' }];

    expect(cleanupCompletedTrips(trips, doneDeliveries)).toEqual(trips);
  });

  it('keeps job order events when a delivery is marked done', () => {
    const events = [
      { id: 1, status: 'trip', jobOrderId: 'order-1' },
      { id: 2, status: 'active', jobOrderId: 'order-1' },
      { id: 3, status: 'completion', jobOrderId: 'order-1' }
    ];

    expect(removeCompletedEvent(events, events[0])).toEqual(events.slice(1));
  });

  it('removes the contract events when the contract is ended', () => {
    const events = [
      { id: 1, status: 'active', jobOrderId: 'order-1' },
      { id: 2, status: 'completion', jobOrderId: 'order-1' },
      { id: 3, status: 'active', jobOrderId: 'order-2' }
    ];

    expect(removeCompletedEvent(events, events[1])).toEqual([events[2]]);
  });
});

describe('getVisibleJobOrderEvents', () => {
  it('keeps the Job Order visible when a delivery is marked Done', () => {
    const events = [
      { id: 2, status: 'active', jobOrderId: 'order-1', name: 'Customer A (Start)' },
      { id: 3, status: 'completion', jobOrderId: 'order-1', name: 'Customer A (End)' }
    ];
    const doneDeliveries = [
      { id: 1, status: 'done', jobOrderId: 'order-1' }
    ];
    const unsuccessfulDeliveries = [];

    const visible = getVisibleJobOrderEvents({ events, doneDeliveries, unsuccessfulDeliveries });
    expect(visible).toEqual(events);
  });

  it('removes the Job Order when a delivery is marked Unsuccessful', () => {
    const events = [
      { id: 2, status: 'active', jobOrderId: 'order-1', name: 'Customer A (Start)' },
      { id: 3, status: 'completion', jobOrderId: 'order-1', name: 'Customer A (End)' },
      { id: 4, status: 'active', jobOrderId: 'order-2', name: 'Customer B (Start)' }
    ];
    const doneDeliveries = [
      { id: 10, status: 'done', jobOrderId: 'order-2' }
    ];
    const unsuccessfulDeliveries = [
      { id: 1, status: 'unsuccessful', jobOrderId: 'order-1' }
    ];

    const visible = getVisibleJobOrderEvents({ events, doneDeliveries, unsuccessfulDeliveries });
    expect(visible).toEqual([events[2]]);
  });

  it('restores the Job Order if an unsuccessful delivery is undone', () => {
    const events = [
      { id: 1, status: 'trip', jobOrderId: 'order-1' },
      { id: 2, status: 'active', jobOrderId: 'order-1' }
    ];
    const doneDeliveries = [];
    const unsuccessfulDeliveries = [];

    const visible = getVisibleJobOrderEvents({ events, doneDeliveries, unsuccessfulDeliveries });
    expect(visible).toEqual([events[1]]);
  });

  it('does not show the Job Order before a trip is created', () => {
    const events = [
      { id: 2, status: 'active', jobOrderId: 'order-1', name: 'Order 1 (Start)' },
      { id: 3, status: 'completion', jobOrderId: 'order-1', name: 'Order 1 (End)' }
    ];
    const doneDeliveries = [];
    const unsuccessfulDeliveries = [];
    const trips = [];

    const visible = getVisibleJobOrderEvents({ events, doneDeliveries, unsuccessfulDeliveries, trips });
    expect(visible).toEqual([]);
  });
});
