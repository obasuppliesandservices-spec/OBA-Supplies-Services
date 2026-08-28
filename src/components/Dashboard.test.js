import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import Dashboard from './Dashboard';
import Homepage from './homepage';

describe('Homepage feedback submission', () => {
  it('sends customer feedback to the admin feedback list', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const onAddFeedback = jest.fn();

    act(() => {
      createRoot(container).render(
        <Homepage
          isLoggedIn={true}
          user={{ name: 'Jane Doe', email: 'jane@example.com' }}
          cart={[]}
          onAddToCart={() => {}}
          onRemoveFromCart={() => {}}
          onViewCart={() => {}}
          onContinueShopping={() => {}}
          onClearCart={() => {}}
          onCheckout={() => {}}
          onSubmitOrder={() => {}}
          notifications={[]}
          setNotifications={() => {}}
          onAddFeedback={onAddFeedback}
        />
      );
    });

    const trigger = Array.from(container.querySelectorAll('button')).find(btn => btn.textContent.includes('Send Feedback'));
    expect(trigger).toBeTruthy();

    act(() => {
      trigger.click();
    });

    const textarea = container.querySelector('textarea');
    expect(textarea).toBeTruthy();

    act(() => {
      textarea.value = 'The service was great and the team was helpful.';
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
    });

    const sendButton = Array.from(container.querySelectorAll('button')).find(btn => btn.textContent.includes('Send'));
    expect(sendButton).toBeTruthy();

    act(() => {
      sendButton.click();
    });

    expect(onAddFeedback).toHaveBeenCalledTimes(1);
    expect(onAddFeedback.mock.calls[0][0]).toMatchObject({
      customerName: 'Jane Doe',
      message: 'The service was great and the team was helpful.'
    });

    act(() => {
      container.remove();
    });
  });
});

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

  it('keeps Job Order visible in the list when delivery is marked Done', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);

    act(() => {
      createRoot(container).render(
        <Dashboard
          events={[
            { id: 2, status: 'active', jobOrderId: 'order-1', name: 'Order 1 (Start)', time: '08:00 AM', date: '2026-08-28' }
          ]}
          doneDeliveries={[{ id: 1, status: 'done', jobOrderId: 'order-1', name: 'Trip 1' }]}
          unsuccessfulDeliveries={[]}
          jobOrders={[]}
          onNavigate={() => {}}
          onLogout={() => {}}
          onMarkDone={() => {}}
          onStartContract={() => {}}
        />
      );
    });

    expect(container.textContent).toContain('Order 1 (Start)');
    expect(container.textContent).toContain('Start Contract');

    act(() => {
      container.remove();
    });
  });

  it('removes Job Order from the list when delivery is marked Unsuccessful', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);

    act(() => {
      createRoot(container).render(
        <Dashboard
          events={[
            { id: 2, status: 'active', jobOrderId: 'order-1', name: 'Order 1 (Start)', time: '08:00 AM', date: '2026-08-28' }
          ]}
          doneDeliveries={[]}
          unsuccessfulDeliveries={[{ id: 1, status: 'unsuccessful', jobOrderId: 'order-1', name: 'Trip 1' }]}
          jobOrders={[]}
          onNavigate={() => {}}
          onLogout={() => {}}
          onMarkDone={() => {}}
          onStartContract={() => {}}
        />
      );
    });

    expect(container.textContent).not.toContain('Order 1 (Start)');
    expect(container.textContent).toContain('No Job Order Scheduled.');

    act(() => {
      container.remove();
    });
  });
});
