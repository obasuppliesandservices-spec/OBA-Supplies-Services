import React, { useState, useEffect } from 'react';
import useStickyState from './useStickyState';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Calendar from './components/Calendar';
import Feedback from './components/Feedback';
import TripManager from './components/TripManager';
import JobOrder from './components/JobOrder';
import JobOrderModal from './components/JobOrderModal';
import Logistics from './components/Logistics';
import Customer from './components/Customer';
import Homepage from './components/homepage';
import WelcomePage from './components/Welcomepage';
import Cart from './components/Cart';
import Settings from './components/Settings';
import CustomerAcc from './components/CustomerAcc';
import Employees from './components/Employees';
import AdminAddDelete from './components/AdminAddDelete';
import { Toaster } from 'react-hot-toast';
import { useFirebaseSync } from './useFirebaseSync';
import { cleanupCompletedTrips, removeCompletedEvent } from './deliveryUtils';
import TruckManagement from './components/TruckManagement';
import ReportsAnalytics from './components/ReportsAnalytics';
import RfidKiosk from './components/RfidKiosk';
import { database } from './firebase';
import { ref, onValue, update } from 'firebase/database';

export default function App() {
  const [user, setUser] = useStickyState(null, 'app_user');
  const [role, setRole] = useStickyState(null, 'app_role');
  const [currentPage, setCurrentPage] = useStickyState('dashboard', 'app_currentPage');
  const [isRfidKioskMode, setIsRfidKioskMode] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [customerCarts, setCustomerCarts] = useState(() => {
    try {
      const saved = localStorage.getItem('customerCarts');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const [showCart, setShowCart] = useState(false);
  const [events, setEvents] = useState(() => {
    try {
      const saved = localStorage.getItem('app_events');
      return saved ? JSON.parse(saved) : [
        { id: 1, name: 'Team Meeting', time: '10:00 AM', date: '2023-10-15' },
        { id: 2, name: 'Client Presentation', time: '2:00 PM', date: '2023-10-16' },
        { id: 3, name: 'Company Event', time: '6:00 PM', date: '2023-10-17' }
      ];
    } catch {
      return [
        { id: 1, name: 'Team Meeting', time: '10:00 AM', date: '2023-10-15' },
        { id: 2, name: 'Client Presentation', time: '2:00 PM', date: '2023-10-16' },
        { id: 3, name: 'Company Event', time: '6:00 PM', date: '2023-10-17' }
      ];
    }
  });

  const [doneDeliveries, setDoneDeliveries] = useState(() => {
    try {
      const saved = localStorage.getItem('app_doneDeliveries');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [unsuccessfulDeliveries, setUnsuccessfulDeliveries] = useState(() => {
    try {
      const saved = localStorage.getItem('app_unsuccessfulDeliveries');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [feedbacks, setFeedbacks] = useState(() => {
    try {
      const saved = localStorage.getItem('app_feedbacks');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [inventory, setInventory] = useState([
    { name: 'compressor', quantity: 1, price: 100.00 },
    { name: 'insulation', quantity: 1, price: 50.00 },
    { name: 'cladding', quantity: 1, price: 75.00 },
    { name: 'crack detection test', quantity: 1, price: 25.00 }
  ]);

  const [jobOrders, setJobOrders] = useFirebaseSync('global/jobOrders', []);

  const defaultTrucks = [
    { id: 'TRK-001', name: 'TRK-001 (Faw 6 Wheeler)', maxWeight: 5000, gridZones: 50, status: 'Active', maintenanceLogs: [] },
    { id: 'TRK-002', name: 'TRK-002 (Isuzu ELF)', maxWeight: 3000, gridZones: 30, status: 'Active', maintenanceLogs: [] },
    { id: 'TRK-003', name: 'TRK-003 (Fuso Fighter)', maxWeight: 8000, gridZones: 80, status: 'Active', maintenanceLogs: [] },
    { id: 'TRK-004', name: 'TRK-004 (Delivery Van)', maxWeight: 1500, gridZones: 15, status: 'Active', maintenanceLogs: [] }
  ];
  const [trucks, setTrucks] = useFirebaseSync('global/trucks', defaultTrucks);

  const [trips, setTrips] = useState(() => {
    try {
      const saved = localStorage.getItem('app_trips');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [jobOrderModalOpen, setJobOrderModalOpen] = useState(false);
  const [customerNotificationsByUser, setCustomerNotificationsByUser] = useState(() => {
    try {
      const saved = localStorage.getItem('customerNotificationsByUser');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const [adminNotifications, setAdminNotifications] = useState(() => {
    try {
      const saved = localStorage.getItem('app_adminNotifications');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('customerCarts', JSON.stringify(customerCarts));
    } catch (error) {
      console.error('Unable to persist customer carts:', error);
    }
  }, [customerCarts]);

  useEffect(() => {
    try {
      localStorage.setItem('customerNotificationsByUser', JSON.stringify(customerNotificationsByUser));
    } catch (error) {
      console.error('Unable to persist customer notifications:', error);
    }
  }, [customerNotificationsByUser]);

  useEffect(() => {
    try {
      localStorage.setItem('app_events', JSON.stringify(events));
    } catch (error) {
      console.error('Unable to persist events:', error);
    }
  }, [events]);

  useEffect(() => {
    try {
      localStorage.setItem('app_doneDeliveries', JSON.stringify(doneDeliveries));
    } catch (error) {
      console.error('Unable to persist done deliveries:', error);
    }
  }, [doneDeliveries]);

  useEffect(() => {
    try {
      localStorage.setItem('app_unsuccessfulDeliveries', JSON.stringify(unsuccessfulDeliveries));
    } catch (error) {
      console.error('Unable to persist unsuccessful deliveries:', error);
    }
  }, [unsuccessfulDeliveries]);

  useEffect(() => {
    try {
      localStorage.setItem('app_feedbacks', JSON.stringify(feedbacks));
    } catch (error) {
      console.error('Unable to persist feedbacks:', error);
    }
  }, [feedbacks]);

  useEffect(() => {
    try {
      localStorage.setItem('app_trips', JSON.stringify(trips));
    } catch (error) {
      console.error('Unable to persist trips:', error);
    }
  }, [trips]);

  useEffect(() => {
    try {
      if (jobOrders && jobOrders.length > 0) {
        localStorage.setItem('app_jobOrders_cache', JSON.stringify(jobOrders));
      }
    } catch (error) {
      console.error('Unable to persist job orders:', error);
    }
  }, [jobOrders]);

  const [employees, setEmployees] = useState(() => {
    try {
      const cached = localStorage.getItem('app_employees_cache');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return [];
  });

  useEffect(() => {
    const employeesRef = ref(database, 'employees');
    const unsubscribe = onValue(employeesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.keys(data).map(key => ({
          ...data[key],
          id: key
        }));
        setEmployees(list);
        try {
          localStorage.setItem('app_employees_cache', JSON.stringify(list));
        } catch (e) {}
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('app_adminNotifications', JSON.stringify(adminNotifications));
    } catch (error) {
      console.error('Unable to persist admin notifications:', error);
    }
  }, [adminNotifications]);

  const currentCustomerKey = user?.email || 'guest';
  const activeCart = customerCarts[currentCustomerKey] || [];
  const activeNotifications = customerNotificationsByUser[currentCustomerKey] || [];

  const updateActiveCart = (newCart) => {
    setCustomerCarts(prev => ({ ...prev, [currentCustomerKey]: newCart }));
  };

  const updateActiveNotifications = (newNotifications) => {
    setCustomerNotificationsByUser(prev => ({ ...prev, [currentCustomerKey]: newNotifications }));
  };

  function handleLogin({ email, role, name }) {
    setUser({ name: name || (role === 'logistics' ? 'Logistics' : role === 'admin' ? 'Admin' : email), email });
    setRole(role);
    // Route admin users to the admin panel, others to dashboard
    setCurrentPage(role === 'admin' ? 'adminadddelete' : 'dashboard');
    window.localStorage.removeItem('homepage_currentPage');
    window.localStorage.removeItem('welcome_currentPage');
  }

  function handleLogout() {
    setShowLogoutConfirm(true);
  }

  function confirmLogout() {
    setUser(null);
    setRole(null);
    setCurrentPage('dashboard');
    window.localStorage.removeItem('app_user');
    window.localStorage.removeItem('app_role');
    window.localStorage.removeItem('app_currentPage');
    window.localStorage.removeItem('homepage_currentPage');
    window.localStorage.removeItem('welcome_currentPage');
    setShowLogoutConfirm(false);
  }

  function addEvent(event) {
    const newEvent = { ...event, id: Date.now() };
    const firstIndex = events.findIndex(e => e.date === newEvent.date);
    if (firstIndex === -1) {
      setEvents([...events, newEvent]);
    } else {
      const copy = events.slice();
      copy.splice(firstIndex + 1, 0, newEvent);
      setEvents(copy);
    }
  }

  function editEvent(id, updatedEvent) {
    setEvents(events.map(event => event.id === id ? { ...event, ...updatedEvent } : event));
  }

  function markEventDone(id) {
    const ev = events.find(event => event.id === id);
    if (!ev) return;

    const assignedNames = ev.deliveryData?.assignedManpower
      || jobOrders.find(order => order.id === ev.jobOrderId)?.deliveryData?.assignedManpower
      || [];
    if (ev.status === 'completion' && assignedNames.length > 0) {
      const assignedEmployees = employees.filter(employee => assignedNames.includes(employee.name));
      setEmployees(prevEmployees => prevEmployees.map(employee => (
        assignedNames.includes(employee.name) ? { ...employee, status: 'Absent' } : employee
      )));
      assignedEmployees.forEach(employee => {
        update(ref(database, `employees/${employee.id}`), { status: 'Absent' })
          .catch(error => console.error('Unable to update employee status:', error));
      });
    }

    setEvents(prevEvents => removeCompletedEvent(prevEvents, ev));

    setDoneDeliveries(prevDone => {
      const timestamp = new Date();
      const doneEvent = { ...ev, status: ev.status === 'completion' ? 'completion' : 'done', deliveredAt: timestamp.toISOString(), deliveredTime: timestamp.toLocaleTimeString() };
      const nextDone = [...prevDone, doneEvent];
      setTrips(prevTrips => cleanupCompletedTrips(prevTrips, nextDone));
      return nextDone;
    });
  }

  function markDeliveryDone(id) {
    const ev = events.find(event => event.id === id);
    if (!ev) return;

    setEvents(prevEvents => prevEvents.filter(event => event.id !== id));
    setDoneDeliveries(prevDone => {
      const timestamp = new Date();
      const doneEvent = { ...ev, status: 'done', deliveredAt: timestamp.toISOString(), deliveredTime: timestamp.toLocaleTimeString() };
      const nextDone = [...prevDone, doneEvent];
      setTrips(prevTrips => cleanupCompletedTrips(prevTrips, nextDone));
      return nextDone;
    });
  }

  function markEventStarted(id) {
    const ev = events.find(event => event.id === id);
    if (!ev) return;

    const assignedNames = ev.deliveryData?.assignedManpower
      || jobOrders.find(order => order.id === ev.jobOrderId)?.deliveryData?.assignedManpower
      || [];
    if (assignedNames.length > 0) {
      const assignedEmployees = employees.filter(employee => assignedNames.includes(employee.name));
      setEmployees(prevEmployees => prevEmployees.map(employee => (
        assignedNames.includes(employee.name) ? { ...employee, status: 'Under Contract' } : employee
      )));
      assignedEmployees.forEach(employee => {
        update(ref(database, `employees/${employee.id}`), { status: 'Under Contract' })
          .catch(error => console.error('Unable to update employee status:', error));
      });
    }

    setEvents(prevEvents => prevEvents.map(event =>
      event.id === id ? { ...event, status: 'started' } : event
    ));
  }

  function markEventUnsuccessful(id) {
    const ev = events.find(event => event.id === id);
    if (!ev) return;
    setEvents(prevEvents => prevEvents.filter(event => event.id !== id));
    setUnsuccessfulDeliveries(prevUnsuccessful => [...prevUnsuccessful, ev]);
    setTrips(prevTrips => prevTrips.map(trip => {
      const matchesTrip = ev.tripId && String(trip.id) === String(ev.tripId);
      const matchesJobOrder = ev.jobOrderId && (trip.jobOrderId === ev.jobOrderId || (trip.selectedJobOrders || []).includes(ev.jobOrderId));
      if (!matchesTrip && !matchesJobOrder) return trip;
      return {
        ...trip,
        tripStatus: 'unsuccessful',
        completedReason: 'Unsuccessful Delivery',
        completedAt: new Date().toLocaleString()
      };
    }));
  }

  function undoDoneEvent(id) {
    const done = doneDeliveries.find(d => d.id === id);
    if (!done) return;
    setDoneDeliveries(doneDeliveries.filter(d => d.id !== id));
    setEvents([...events, done]);
  }

  function undoUnsuccessfulEvent(id) {
    const item = unsuccessfulDeliveries.find(d => d.id === id);
    if (!item) return;
    setUnsuccessfulDeliveries(unsuccessfulDeliveries.filter(d => d.id !== id));
    setEvents([...events, item]);
  }

  function removeEvent(id) {
    setEvents(events.filter(event => event.id !== id));
  }

  function removeDoneEvent(id) {
    setDoneDeliveries(doneDeliveries.filter(d => d.id !== id));
  }

  function removeUnsuccessfulEvent(id) {
    setUnsuccessfulDeliveries(unsuccessfulDeliveries.filter(d => d.id !== id));
  }

  function processJobOrder(jobOrder) {
    // Update the job order status to approved
    const updatedJobOrders = jobOrders.map(order => 
      order.id === jobOrder.id ? { ...order, status: 'approved' } : order
    );
    setJobOrders(updatedJobOrders);

    // Create calendar events for start and end of contract
    const startEvent = {
      id: Date.now(),
      jobOrderId: jobOrder.id,
      name: `${jobOrder.customerName} - ${jobOrder.jobType} (Start) - ${jobOrder.manpower} workers`,
      time: '08:00 AM',
      date: jobOrder.startDate,
      jobType: jobOrder.jobType,
      manpower: jobOrder.manpower,
      status: 'active'
    };

    const endEvent = {
      id: Date.now() + 1,
      jobOrderId: jobOrder.id,
      name: `${jobOrder.customerName} - ${jobOrder.jobType} (End) - ${jobOrder.manpower} workers`,
      time: '05:00 PM',
      date: jobOrder.endDate,
      jobType: jobOrder.jobType,
      manpower: jobOrder.manpower,
      status: 'completion'
    };

    setEvents(prevEvents => [...prevEvents, startEvent, endEvent]);

    const newNotification = {
      id: Date.now() + 2,
      type: 'approval',
      message: `Your order for ${jobOrder.jobType} has been approved.`,
      jobOrder: jobOrder,
      read: false,
      date: new Date().toISOString()
    };

    const customerKey = jobOrder.customerEmail;
    if (customerKey) {
      setCustomerNotificationsByUser(prev => ({
        ...prev,
        [customerKey]: [newNotification, ...(prev[customerKey] || [])]
      }));
    }
  }

  function addFeedback(feedback) {
    setFeedbacks([...feedbacks, feedback]);
  }

  function addItem(item) {
    setInventory([...inventory, item]);
  }

  function addJobOrder(jobOrder) {
    const newJobOrder = { ...jobOrder, id: Date.now() };
    setJobOrders([...jobOrders, newJobOrder]);
  }

  function addTrip(trip) {
    setTrips([...trips, trip]);
    // Update job orders status to 'assigned'
    const updatedJobOrders = jobOrders.map(order => 
      trip.selectedJobOrders.includes(order.id) ? { ...order, status: 'assigned' } : order
    );
    setJobOrders(updatedJobOrders);
  }

  function rejectJobOrder(orderId) {
    // Remove the order with the specified ID from the jobOrders list
    setJobOrders(jobOrders.filter(order => order.id !== orderId));
  }

  function removeJobOrder(orderId) {
    setJobOrders(jobOrders.filter(order => order.id !== orderId));
  }

  function updateJobOrderStatus(orderId, newStatus, additionalData = null) {
    let targetOrder = null;
    const updatedJobOrders = jobOrders.map(order => {
      if (order.id === orderId) {
        targetOrder = { ...order, status: newStatus, ...additionalData };
        return targetOrder;
      }
      return order;
    });
    setJobOrders(updatedJobOrders);

    if (additionalData?.deliveryData) {
      setEvents(prevEvents => prevEvents.map(event => (
        event.jobOrderId === orderId && ['active', 'completion'].includes(event.status)
          ? { ...event, deliveryData: additionalData.deliveryData }
          : event
      )));
    }

    if (newStatus === 'ready_for_dispatch' && targetOrder && targetOrder.customerEmail) {
      const newNotification = {
        id: Date.now() + 3,
        type: 'dispatch',
        title: '🚚 Order Dispatched',
        message: `Your order for ${targetOrder.jobType} has been assigned to a truck and is ready for dispatch!`,
        jobOrder: targetOrder,
        read: false,
        date: new Date().toISOString()
      };

      setCustomerNotificationsByUser(prev => ({
        ...prev,
        [targetOrder.customerEmail]: [newNotification, ...(prev[targetOrder.customerEmail] || [])]
      }));
    }
  }

  function openJobOrderModal() {
    setJobOrderModalOpen(true);
  }

  function closeJobOrderModal() {
    setJobOrderModalOpen(false);
  }

  function addToCart(item) {
    const newCart = [...activeCart, item];
    updateActiveCart(newCart);
  }

  function removeFromCart(index) {
    const newCart = [...activeCart];
    newCart.splice(index, 1);
    updateActiveCart(newCart);
  }

  function clearCart() {
    updateActiveCart([]);
  }

  function handleViewCart() {
    setShowCart(true);
  }

  function handleContinueShopping() {
    setShowCart(false);
  }

  function handleCheckout() {
    // This just handles the navigation/state, actual order creation happens when customer submits details
    return true;
  }

  function handleSubmitOrder(orderData) {
    // Create job orders from the order details filled by customer
    // orderData contains { orderItems: [...], customerInfo: {...} }
    const { orderItems, customerInfo } = orderData;
    
    if (orderItems && orderItems.length > 0) {
      const newOrders = orderItems.map((item, index) => ({
        customerName: customerInfo.name || user.name,
        position: 'Customer',
        company: customerInfo.company || 'OBA',
        address: customerInfo.address || 'Customer Service Order',
        contactNumber: customerInfo.contactNumber,
        jobType: item.name || item.title,
        manpower: item.manpower || 1,
        contractLength: item.contractLength || '1 Month',
        startDate: item.startDate || new Date().toISOString().split('T')[0],
        endDate: item.endDate || new Date(new Date().getTime() + 30*24*60*60*1000).toISOString().split('T')[0],
        companyId: customerInfo.companyId ? customerInfo.companyId.data : null,
        businessLicense: customerInfo.businessLicense ? customerInfo.businessLicense.data : null,
        customerEmail: user.email,
        id: Date.now() + index,
        price: item.price,
        quantity: item.quantity || 1,
        status: 'pending'
      }));
      
      setJobOrders([...jobOrders, ...newOrders]);
      clearCart();
      
      // Notify admin of new order
      const notification = {
        id: Date.now(),
        title: 'New Order Received',
        message: `New order from ${customerInfo.name || user.name} for ${orderItems.length} item(s).`,
        date: new Date().toISOString(),
        read: false
      };
      setAdminNotifications(prev => [...prev, notification]);
    }
  }

  return (
    <div className="app-root">
      <Toaster position="top-center" reverseOrder={false} />
      {!user && !showLogin ? (
        // use welcome page for a static introduction (Homepage kept for shopping flows)
        <WelcomePage
          onSignInClick={() => setShowLogin(true)}
          user={user}
          onAddFeedback={addFeedback}
        />
        /*
        <Homepage 
          onLoginClick={() => setShowLogin(true)} 
          user={user}
          cart={cart}
          onAddToCart={addToCart}
          onRemoveFromCart={removeFromCart}
          onViewCart={handleViewCart}
          onContinueShopping={handleContinueShopping}
          onClearCart={clearCart}
          showCart={showCart}
        />
        */
      ) : user ? (
        role === 'customer' ? (
          <Customer 
            user={user} 
            onLogout={handleLogout} 
            cart={activeCart}
            onAddToCart={addToCart}
            onRemoveFromCart={removeFromCart}
            onCheckout={handleCheckout}
            onSubmitOrder={handleSubmitOrder}
            notifications={activeNotifications}
            setNotifications={updateActiveNotifications}
            onAddFeedback={addFeedback}
          />
        ) : (
          currentPage === 'dashboard' ? (
            role === 'logistics' ? (
              <Logistics
                user={user}
                onLogout={handleLogout}
                onNavigate={setCurrentPage}
                trips={trips}
                events={events}
                onMarkDone={markEventDone}
                onMarkDeliveryDone={markDeliveryDone}
                onStartContract={markEventStarted}
                doneDeliveries={doneDeliveries}
                onUndoDone={undoDoneEvent}
                unsuccessfulDeliveries={unsuccessfulDeliveries}
                onMarkUnsuccessful={markEventUnsuccessful}
                onUndoUnsuccessful={undoUnsuccessfulEvent}
                onAddEvent={addEvent}
                onOpenJobOrderModal={openJobOrderModal}
                jobOrders={jobOrders}
                onRemoveEvent={removeEvent}
                onRemoveDoneEvent={removeDoneEvent}
                onRemoveJobOrder={removeJobOrder}
                adminNotifications={adminNotifications}
                setAdminNotifications={setAdminNotifications}
                onAddTrip={addTrip}
                onUpdateJobOrderStatus={updateJobOrderStatus}
                trucks={trucks}
                onUpdateTrucks={setTrucks}
                employees={employees}
              />
            ) : (
              <Dashboard
                user={user}
                onLogout={handleLogout}
                onNavigate={setCurrentPage}
                events={events}
                onMarkDone={markEventDone}
                onMarkDeliveryDone={markDeliveryDone}
                onStartContract={markEventStarted}
                doneDeliveries={doneDeliveries}
                onUndoDone={undoDoneEvent}
                unsuccessfulDeliveries={unsuccessfulDeliveries}
                onMarkUnsuccessful={markEventUnsuccessful}
                onUndoUnsuccessful={undoUnsuccessfulEvent}
                onAddEvent={addEvent}
                onOpenJobOrderModal={openJobOrderModal}
                jobOrders={jobOrders}
                onRemoveEvent={removeEvent}
                onRemoveDoneEvent={removeDoneEvent}
                onRemoveUnsuccessfulEvent={removeUnsuccessfulEvent}
                onRemoveJobOrder={removeJobOrder}
                adminNotifications={adminNotifications}
                setAdminNotifications={setAdminNotifications}
                trucks={trucks}
                trips={trips}
              />
            )
          ) : currentPage === 'calendar' ? (
            <Calendar onNavigate={setCurrentPage} events={events} onAddEvent={addEvent} onEditEvent={editEvent} onOpenJobOrderModal={openJobOrderModal} />
          ) : currentPage === 'feedback' ? (
            <Feedback user={user} onLogout={handleLogout} onNavigate={setCurrentPage} feedbacks={feedbacks} onAddFeedback={addFeedback} onOpenJobOrderModal={openJobOrderModal} />
          ) : currentPage === 'inventory' ? (
            <TripManager user={user} onLogout={handleLogout} onNavigate={setCurrentPage} jobOrders={jobOrders} trips={trips} onAddTrip={addTrip} onAddEvent={addEvent} trucks={trucks} doneDeliveries={doneDeliveries} employees={employees} />
          ) : currentPage === 'trucks' ? (
            <TruckManagement user={user} onLogout={handleLogout} onNavigate={setCurrentPage} trucks={trucks} onUpdateTrucks={setTrucks} />
          ) : currentPage === 'analytics' ? (
            <ReportsAnalytics user={user} onLogout={handleLogout} onNavigate={setCurrentPage} jobOrders={jobOrders} events={events} trips={trips} doneDeliveries={doneDeliveries} unsuccessfulDeliveries={unsuccessfulDeliveries} trucks={trucks} />
          ) : currentPage === 'joborder' ? (
            <JobOrder user={user} onLogout={handleLogout} onNavigate={setCurrentPage} jobOrders={jobOrders} onAddJobOrder={addJobOrder} onRejectOrder={rejectJobOrder} onProcessJobOrder={processJobOrder} />
          ) : currentPage === 'settings' ? (
            <Settings user={user} onLogout={handleLogout} onNavigate={setCurrentPage} />
          ) : currentPage === 'customersacc' ? (
            <CustomerAcc user={user} onLogout={handleLogout} onNavigate={setCurrentPage} />
          ) : currentPage === 'employees' ? (
            <Employees user={user} onLogout={handleLogout} onNavigate={setCurrentPage} initialEmployees={employees} />
          ) : currentPage === 'rfidkiosk' ? (
            <RfidKiosk onBackToLogin={() => setCurrentPage('dashboard')} />
          ) : currentPage === 'adminadddelete' ? (
            <AdminAddDelete
              onLogout={handleLogout}
              events={events}
              onMarkDone={markEventDone}
              onStartContract={markEventStarted}
              doneDeliveries={doneDeliveries}
              onUndoDone={undoDoneEvent}
              unsuccessfulDeliveries={unsuccessfulDeliveries}
              onMarkUnsuccessful={markEventUnsuccessful}
              onUndoUnsuccessful={undoUnsuccessfulEvent}
              onAddEvent={addEvent}
              onOpenJobOrderModal={openJobOrderModal}
              jobOrders={jobOrders}
              onRemoveEvent={removeEvent}
              onRemoveDoneEvent={removeDoneEvent}
              onRemoveUnsuccessfulEvent={removeUnsuccessfulEvent}
              onRemoveJobOrder={removeJobOrder}
              adminNotifications={adminNotifications}
              setAdminNotifications={setAdminNotifications}
              trips={trips}
              onAddTrip={addTrip}
              trucks={trucks}
              onUpdateJobOrderStatus={updateJobOrderStatus}
              employees={employees}
            />
          ) : null
        )
      ) : isRfidKioskMode || role === 'rfidkiosk' ? (
        <RfidKiosk onBackToLogin={() => { setIsRfidKioskMode(false); setRole(null); }} />
      ) : (
        <Login
          onLogin={(credentials) => {
            if (credentials && credentials.role === 'rfidkiosk') {
              setIsRfidKioskMode(true);
            } else {
              handleLogin(credentials);
              setShowLogin(false);
            }
          }}
          onOpenRfidKiosk={() => setIsRfidKioskMode(true)}
        />
      )}

      {jobOrderModalOpen && (
        <JobOrderModal
          isOpen={jobOrderModalOpen}
          onClose={closeJobOrderModal}
          onSave={addJobOrder}
          jobOrderToEdit={null}
        />
      )}

      {showLogoutConfirm && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          backdropFilter: 'blur(4px)',
          zIndex: 9999
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            padding: '32px',
            width: '400px',
            maxWidth: '90%',
            boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
            textAlign: 'center',
            animation: 'fadeIn 0.2s ease-out'
          }}>
            <div style={{
              width: '64px', height: '64px', borderRadius: '50%',
              backgroundColor: '#fff0f0', color: '#ff4444',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '32px', margin: '0 auto 24px auto'
            }}>
              👋
            </div>
            <h2 style={{ margin: '0 0 12px 0', color: '#333', fontSize: '24px' }}>Confirm Logout</h2>
            <p style={{ color: '#666', margin: '0 0 32px 0', fontSize: '15px', lineHeight: '1.5' }}>
              Are you sure you want to end your session? You will be securely logged out of your account.
            </p>
            <div style={{ display: 'flex', gap: '16px' }}>
              <button 
                onClick={() => setShowLogoutConfirm(false)}
                style={{
                  flex: 1, padding: '12px', border: '1px solid #ddd', borderRadius: '8px',
                  backgroundColor: 'white', color: '#555', fontWeight: 'bold', fontSize: '15px',
                  cursor: 'pointer', transition: 'all 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f5f5f5'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'white'}
              >
                Cancel
              </button>
              <button 
                onClick={confirmLogout}
                style={{
                  flex: 1, padding: '12px', border: 'none', borderRadius: '8px',
                  backgroundColor: '#ff4444', color: 'white', fontWeight: 'bold', fontSize: '15px',
                  cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(255, 68, 68, 0.2)'
                }}
                onMouseEnter={e => Object.assign(e.currentTarget.style, { backgroundColor: '#e60000', transform: 'translateY(-1px)' })}
                onMouseLeave={e => Object.assign(e.currentTarget.style, { backgroundColor: '#ff4444', transform: 'none' })}
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
