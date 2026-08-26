import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import Dashboard from './Dashboard';

describe('Dashboard ended job orders', () => {
  it('shows the ended job orders count when a completion event has been marked done', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);

    act(() => {
      createRoot(container).render(
        <Dashboard
          events={[]}
          doneDeliveries={[{ id: 10, name: 'Contract End', status: 'completion' }]}
          unsuccessfulDeliveries={[]}
          jobOrders={[]}
          onNavigate={() => {}}
          onLogout={() => {}}
          onMarkDone={() => {}}
          onStartContract={() => {}}
        />
      );
    });

    expect(container.textContent).toContain('Ended Job Orders');
    expect(container.textContent).toContain('1');
    expect(container.textContent).toContain('Delivery Completed');
    expect(container.textContent).toContain('0');

    act(() => {
      container.remove();
    });
  });
});
