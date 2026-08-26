import { cleanupCompletedTrips } from './deliveryUtils';

describe('cleanupCompletedTrips', () => {
  it('keeps truck info trips visible when deliveries are marked done', () => {
    const trips = [{ id: 'trip-1', selectedJobOrders: ['order-1'] }];
    const doneDeliveries = [{ jobOrderId: 'order-1' }];

    expect(cleanupCompletedTrips(trips, doneDeliveries)).toEqual(trips);
  });
});
