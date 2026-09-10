import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import Logistics, { 
  getTripPrefillData, 
  getTruckArrivalTrips, 
  buildArrivalHistoryEntry, 
  getAutoAssignedManpower,
  getSuggestedTruckForWeight,
  getNextHigherCapacityTruck,
  getAvailableDriverPahinanteOptions
} from './Logistics';

describe('Logistics default tab', () => {
  it('uses the dashboard tab when no initialActiveTab prop is provided', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);

    expect(() => {
      act(() => {
        createRoot(container).render(
          <Logistics
            user={{}}
            onLogout={() => {}}
            onNavigate={() => {}}
            events={[]}
            onMarkDone={() => {}}
            onStartContract={() => {}}
            doneDeliveries={[]}
            onUndoDone={() => {}}
            unsuccessfulDeliveries={[]}
            onMarkUnsuccessful={() => {}}
            onUndoUnsuccessful={() => {}}
            onAddEvent={() => {}}
            onOpenJobOrderModal={() => {}}
            jobOrders={[]}
            onRemoveEvent={() => {}}
            onRemoveDoneEvent={() => {}}
            onRemoveUnsuccessfulEvent={() => {}}
            onRemoveJobOrder={() => {}}
            adminNotifications={[]}
            setAdminNotifications={() => {}}
            trips={[]}
            onAddTrip={() => {}}
            onUpdateJobOrderStatus={() => {}}
            trucks={[]}
            onUpdateTrucks={() => {}}
            employees={[]}
          />
        );
      });
    }).not.toThrow();

    act(() => {
      container.remove();
    });
  });
});

describe('getSuggestedTruckForWeight', () => {
  const mockTrucks = [
    { id: 'TRK-001', name: 'TRK-001 (Faw 6 Wheeler)', maxWeight: 5000, status: 'Active' },
    { id: 'TRK-002', name: 'TRK-002 (Isuzu ELF)', maxWeight: 3000, status: 'Active' },
    { id: 'TRK-003', name: 'TRK-003 (Fuso Fighter)', maxWeight: 8000, status: 'Active' },
    { id: 'TRK-004', name: 'TRK-004 (Delivery Van)', maxWeight: 1500, status: 'Active' }
  ];

  it('suggests smallest truck for lightweight payload (<= 1500 kg)', () => {
    const truck = getSuggestedTruckForWeight(800, mockTrucks);
    expect(truck.id).toBe('TRK-004');
    expect(truck.maxWeight).toBe(1500);
  });

  it('suggests next higher capacity truck when weight exceeds 1500 kg', () => {
    const truck = getSuggestedTruckForWeight(2200, mockTrucks);
    expect(truck.id).toBe('TRK-002');
    expect(truck.maxWeight).toBe(3000);
  });

  it('suggests 5000 kg truck when weight exceeds 3000 kg', () => {
    const truck = getSuggestedTruckForWeight(4200, mockTrucks);
    expect(truck.id).toBe('TRK-001');
    expect(truck.maxWeight).toBe(5000);
  });

  it('suggests 8000 kg truck when weight exceeds 5000 kg', () => {
    const truck = getSuggestedTruckForWeight(6500, mockTrucks);
    expect(truck.id).toBe('TRK-003');
    expect(truck.maxWeight).toBe(8000);
  });

  it('returns highest capacity truck when payload exceeds all trucks in fleet', () => {
    const truck = getSuggestedTruckForWeight(12000, mockTrucks);
    expect(truck.id).toBe('TRK-003');
    expect(truck.maxWeight).toBe(8000);
  });

  it('skips trucks that are under maintenance', () => {
    const trucksWithMaintenance = [
      { id: 'TRK-004', name: 'TRK-004 (Delivery Van)', maxWeight: 1500, status: 'Active' },
      { id: 'TRK-002', name: 'TRK-002 (Isuzu ELF)', maxWeight: 3000, status: 'Maintenance' },
      { id: 'TRK-001', name: 'TRK-001 (Faw 6 Wheeler)', maxWeight: 5000, status: 'Active' }
    ];
    // For 2500 kg, TRK-002 is 3000 kg but under maintenance, so it should suggest TRK-001 (5000 kg)
    const truck = getSuggestedTruckForWeight(2500, trucksWithMaintenance);
    expect(truck.id).toBe('TRK-001');
  });
});

describe('getNextHigherCapacityTruck', () => {
  const mockTrucks = [
    { id: 'TRK-001', name: 'TRK-001 (Faw 6 Wheeler)', maxWeight: 5000, status: 'Active' },
    { id: 'TRK-002', name: 'TRK-002 (Isuzu ELF)', maxWeight: 3000, status: 'Active' },
    { id: 'TRK-003', name: 'TRK-003 (Fuso Fighter)', maxWeight: 8000, status: 'Active' },
    { id: 'TRK-004', name: 'TRK-004 (Delivery Van)', maxWeight: 1500, status: 'Active' }
  ];

  it('returns next higher capacity truck when Delivery Van (1500 kg) capacity is exceeded', () => {
    const nextTruck = getNextHigherCapacityTruck('TRK-004 (Delivery Van)', 1800, mockTrucks);
    expect(nextTruck.id).toBe('TRK-002');
    expect(nextTruck.maxWeight).toBe(3000);
  });

  it('jumps to Faw 6 Wheeler if weight exceeds 3000 kg immediately', () => {
    const nextTruck = getNextHigherCapacityTruck('TRK-004 (Delivery Van)', 4500, mockTrucks);
    expect(nextTruck.id).toBe('TRK-001');
    expect(nextTruck.maxWeight).toBe(5000);
  });

  it('returns Fuso Fighter when Faw 6 Wheeler (5000 kg) is exceeded', () => {
    const nextTruck = getNextHigherCapacityTruck('TRK-001 (Faw 6 Wheeler)', 5500, mockTrucks);
    expect(nextTruck.id).toBe('TRK-003');
    expect(nextTruck.maxWeight).toBe(8000);
  });

  it('returns highest truck when already on the largest truck or payload exceeds fleet', () => {
    const nextTruck = getNextHigherCapacityTruck('TRK-003 (Fuso Fighter)', 9000, mockTrucks);
    expect(nextTruck.id).toBe('TRK-003');
  });
});

describe('getAutoAssignedManpower', () => {
  it('only assigns employees who have status Present', () => {
    const employees = [
      { name: 'John Doe', status: 'Present' },
      { name: 'Jane Smith', status: 'Absent' },
      { name: 'Alex Cruz', status: 'Present' },
      { name: 'Sarah Connor', status: 'On Leave' }
    ];

    const result = getAutoAssignedManpower(employees, 3);
    expect(result).toEqual(['John Doe', 'Alex Cruz']);
  });

  it('does not assign present Driver/Pahinante employees as manpower', () => {
    const employees = [
      { name: 'John Doe', status: 'Present', department: 'Employee' },
      { name: 'Driver One', status: 'Present', department: 'Driver/Pahinante' },
      { name: 'Alex Cruz', status: 'Present', department: 'Logistics' }
    ];

    const result = getAutoAssignedManpower(employees, 3);
    expect(result).toEqual(['John Doe', 'Alex Cruz']);
  });
});

describe('getTripPrefillData', () => {
  it('prefills truck and staffing details from the selected truck and assigned manpower', () => {
    const result = getTripPrefillData({
      selectedTruck: 'TRK-003 (Fuso Fighter)',
      assignedManpower: ['John Doe', 'Jane Smith', 'Alex Cruz'],
      processingJobOrder: { id: 'job-1' },
      employees: [
        { name: 'John Doe', status: 'Present' },
        { name: 'Jane Smith', status: 'Present' },
        { name: 'Alex Cruz', status: 'Present' }
      ]
    });

    expect(result).toEqual({
      truckNumber: 'TRK-003',
      truckType: 'Fuso Fighter',
      driver: 'John Doe',
      pahintate: 'Jane Smith',
      selectedJobOrders: ['job-1']
    });
  });
});

describe('getAvailableDriverPahinanteOptions', () => {
  it('hides driver and pahintate names already assigned to active trips until the truck arrives', () => {
    const employees = [
      { id: '1', name: 'Driver A', status: 'Present', department: 'Driver/Pahinante' },
      { id: '2', name: 'Driver B', status: 'Present', department: 'Driver/Pahinante' },
      { id: '3', name: 'Driver C', status: 'Present', department: 'Driver/Pahinante' },
      { id: '4', name: 'Driver D', status: 'Present', department: 'Driver/Pahinante' }
    ];

    const activeTrips = [
      { id: 'trip-1', driver: 'Driver A', pahintate: 'Driver B' },
      { id: 'trip-2', driver: 'Driver C', pahintate: 'Driver D' }
    ];

    const result = getAvailableDriverPahinanteOptions(employees, activeTrips, ['trip-2']);

    expect(result.driverOptions.map(emp => emp.name)).toEqual(['Driver C', 'Driver D']);
    expect(result.pahintateOptions.map(emp => emp.name)).toEqual(['Driver C', 'Driver D']);
  });

  it('keeps driver and pahintate unavailable until the trip has arrived', () => {
    const employees = [
      { id: '1', name: 'Driver A', status: 'Present', department: 'Driver/Pahinante' },
      { id: '2', name: 'Driver B', status: 'Present', department: 'Driver/Pahinante' }
    ];

    const activeTrips = [
      { id: 'trip-1', driver: 'Driver A', pahintate: 'Driver B' }
    ];

    const result = getAvailableDriverPahinanteOptions(employees, activeTrips, []);

    expect(result.driverOptions).toEqual([]);
    expect(result.pahintateOptions).toEqual([]);
  });
});

describe('getTruckArrivalTrips', () => {
  it('formats trip details for the truck arrival section', () => {
    const result = getTruckArrivalTrips([
      { id: 'trip-1', truckNumber: 'TRK-001', truckType: 'Faw 6 Wheeler', driver: 'Juan', pahintate: 'Marco' }
    ], ['trip-1']);

    expect(result).toEqual([
      {
        id: 'trip-1',
        truckNumber: 'TRK-001',
        truckType: 'Faw 6 Wheeler',
        driver: 'Juan',
        assistant: 'Marco',
        isArrived: true
      }
    ]);
  });

  it('shows the newest created trips first in the truck arrival list', () => {
    const result = getTruckArrivalTrips([
      { id: 'trip-1', truckNumber: 'TRK-001', createdAt: '2026-07-01T08:00:00.000Z' },
      { id: 'trip-2', truckNumber: 'TRK-002', createdAt: '2026-07-02T08:00:00.000Z' },
      { id: 'trip-3', truckNumber: 'TRK-003', createdAt: '2026-07-03T08:00:00.000Z' }
    ], []);

    expect(result.map(trip => trip.id)).toEqual(['trip-3', 'trip-2', 'trip-1']);
  });
});

describe('buildArrivalHistoryEntry', () => {
  it('adds a timestamped history entry when a trip is marked arrived', () => {
    const arrivedAt = new Date('2026-07-28T10:30:00');
    const result = buildArrivalHistoryEntry({ id: 'trip-1', truckNumber: 'TRK-001', driver: 'Juan', pahintate: 'Marco' }, arrivedAt);

    expect(result).toEqual({
      id: `trip-1-${arrivedAt.getTime()}`,
      tripId: 'trip-1',
      truckNumber: 'TRK-001',
      truckType: 'Standard',
      driver: 'Juan',
      assistant: 'Marco',
      arrivedAt: arrivedAt.toLocaleString()
    });
  });
});
