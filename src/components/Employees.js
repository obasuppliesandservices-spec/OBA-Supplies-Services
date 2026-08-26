import React, { useState, useMemo, useEffect, useRef } from 'react';
import { database } from '../firebase';
import { ref, onValue, set, remove, runTransaction, update } from 'firebase/database';
import toast from 'react-hot-toast';
import RfidReaderModal from './RfidReaderModal';

// Generate 200 sample employees (15 Driver/Pahinante, remaining divided between Logistics and Employee)
const generateEmployees = () => {
  const statuses = ['Present', 'Absent', 'Under Contract', 'On Leave'];
  const employees = [];

  const firstNames = ["James", "John", "Robert", "Michael", "William", "David", "Richard", "Joseph", "Charles", "Thomas", "Christopher", "Daniel", "Matthew", "Anthony", "Mark", "Donald", "Steven", "Paul", "Andrew", "Joshua", "Mary", "Patricia", "Jennifer", "Linda", "Elizabeth", "Barbara", "Susan", "Jessica", "Sarah", "Karen", "Lisa", "Nancy", "Betty", "Margaret", "Sandra", "Ashley", "Kimberly", "Emily", "Donna", "Michelle"];
  const lastNames = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin", "Lee", "Perez", "Thompson", "White", "Harris", "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson"];

  for (let i = 1; i <= 200; i++) {
    const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
    const hour = Math.floor(Math.random() * 12) + 7; // 7 to 18
    const minute = Math.floor(Math.random() * 60);
    const timeIn = randomStatus === 'Present' || randomStatus === 'Under Contract'
      ? `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
      : '-';

    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];

    let dept = 'Logistics';
    if (i <= 15) {
      dept = 'Driver/Pahinante';
    } else if (i % 2 === 0) {
      dept = 'Logistics';
    } else {
      dept = 'Employee';
    }

    const empId = `EMP${String(i).padStart(5, '0')}`;
    employees.push({
      id: empId,
      rfidTag: `RFID-${empId}`,
      name: `${firstName} ${lastName}`,
      department: dept,
      status: randomStatus,
      date: new Date().toISOString().split('T')[0],
      timeIn: timeIn,
      timeOut: '-'
    });
  }

  return employees;
};

export default function Employees({ user, onLogout, onNavigate, initialEmployees = [] }) {
  const [employees, setEmployees] = useState(() => {
    if (Array.isArray(initialEmployees) && initialEmployees.length > 0) return initialEmployees;
    try {
      const cached = localStorage.getItem('app_employees_cache');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return generateEmployees();
  });

  useEffect(() => {
    if (Array.isArray(initialEmployees) && initialEmployees.length > 0 && employees.length === 0) {
      setEmployees(initialEmployees);
    }
  }, [initialEmployees]);

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
      } else {
        // Init with mock data if completely empty
        const generated = generateEmployees();
        const updates = {};
        generated.forEach(emp => { updates[emp.id] = emp; });
        set(employeesRef, updates);
        setEmployees(generated);
        try {
          localStorage.setItem('app_employees_cache', JSON.stringify(generated));
        } catch (e) {}
      }
    });
    return () => unsubscribe();
  }, []);

  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showRfidModal, setShowRfidModal] = useState(false);
  const [lastTapResult, setLastTapResult] = useState(null);
  const [modalSearch, setModalSearch] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [newStatus, setNewStatus] = useState('');

  // Add / Edit Employee State
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [employeeForm, setEmployeeForm] = useState({
    id: '',
    name: '',
    department: 'Logistics',
    status: 'Present',
    rfidTag: '',
    timeIn: '-',
    timeOut: '-'
  });

  const itemsPerPage = 20;

  const handleOpenAddEmployee = () => {
    const maxNum = employees.reduce((max, emp) => {
      const match = emp.id.match(/\d+/);
      const num = match ? parseInt(match[0], 10) : 0;
      return num > max ? num : max;
    }, 0);
    const nextId = `EMP${String(maxNum + 1).padStart(5, '0')}`;

    setEditingEmployee(null);
    setEmployeeForm({
      id: nextId,
      name: '',
      department: 'Logistics',
      status: 'Present',
      rfidTag: `RFID-${nextId}`,
      timeIn: '-',
      timeOut: '-'
    });
    setShowEmployeeModal(true);
  };

  const handleOpenEditEmployee = (emp) => {
    setEditingEmployee(emp);
    setEmployeeForm({
      id: emp.id,
      name: emp.name || '',
      department: emp.department || 'Logistics',
      status: emp.status || 'Present',
      rfidTag: emp.rfidTag || `RFID-${emp.id}`,
      timeIn: emp.timeIn || '-',
      timeOut: emp.timeOut || '-'
    });
    setShowEmployeeModal(true);
  };

  const handleSaveEmployeeSubmit = (e) => {
    e.preventDefault();
    if (!employeeForm.name.trim()) {
      alert('Please enter employee name.');
      return;
    }
    if (!employeeForm.id.trim()) {
      alert('Please enter employee ID.');
      return;
    }

    const dateStr = new Date().toISOString().split('T')[0];
    const payload = {
      id: employeeForm.id.trim(),
      name: employeeForm.name.trim(),
      department: employeeForm.department,
      status: employeeForm.status,
      rfidTag: employeeForm.rfidTag.trim() || `RFID-${employeeForm.id.trim()}`,
      date: dateStr,
      timeIn: employeeForm.timeIn || '-',
      timeOut: employeeForm.timeOut || '-'
    };

    set(ref(database, 'employees/' + payload.id), payload)
      .then(() => {
        toast.success(editingEmployee ? `Updated employee: ${payload.name}` : `Added new employee: ${payload.name}`);
        setShowEmployeeModal(false);
      })
      .catch((err) => {
        console.error("Error saving employee:", err);
        toast.error("Failed to save employee record.");
      });
  };

  const handleDeleteEmployee = (emp) => {
    if (window.confirm(`Are you sure you want to delete ${emp.name} (${emp.id})?`)) {
      remove(ref(database, 'employees/' + emp.id))
        .then(() => {
          toast.success(`Deleted employee: ${emp.name}`);
        })
        .catch((err) => {
          console.error("Error deleting employee:", err);
          toast.error("Failed to delete employee.");
        });
    }
  };

  const handleRfidTap = (employee) => {
    if (!employee) return;

    // Optimistic UI update: reflect Time In/Time Out immediately in the table
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const hasTimedIn = employee.timeIn && employee.timeIn !== '-';
    const hasTimedOut = employee.timeOut && employee.timeOut !== '-';

    let optimistic = { ...employee };
    let optimisticAction = 'TIME_IN';
    if (!hasTimedIn || (hasTimedIn && hasTimedOut)) {
      optimisticAction = 'TIME_IN';
      optimistic = { ...employee, status: 'Present', date: dateStr, timeIn: timeStr, timeOut: '-' };
    } else {
      optimisticAction = 'TIME_OUT';
      optimistic = { ...employee, status: 'Present', timeOut: timeStr };
    }

    setEmployees(prev => prev.map(e => e.id === employee.id ? optimistic : e));
    setLastTapResult({ employee: optimistic, action: optimisticAction, timestamp: `${dateStr} ${timeStr}`, timeIn: optimistic.timeIn, timeOut: optimistic.timeOut });

    const empRef = ref(database, 'employees/' + employee.id);

    // Use a transaction to atomically decide whether this is TIME_IN or TIME_OUT
    runTransaction(empRef, (currentData) => {
      if (currentData === null) return currentData;

      const hasTimedIn = !!currentData.timeInTimestamp && currentData.timeInTimestamp !== 0;
      const hasTimedOut = !!currentData.timeOutTimestamp && currentData.timeOutTimestamp !== 0;

      if (!hasTimedIn || (hasTimedIn && hasTimedOut)) {
        // 1st tap -> TIME IN
        currentData.status = 'Present';
        currentData.date = new Date().toISOString().split('T')[0];
        currentData.timeInTimestamp = { '.sv': 'timestamp' };
        currentData.timeOutTimestamp = 0;
      } else {
        // 2nd tap -> TIME OUT
        currentData.status = 'Present';
        currentData.timeOutTimestamp = { '.sv': 'timestamp' };
      }

      return currentData;
    }).then((result) => {
      if (!result.committed) return;

      const updated = result.snapshot.val();

      // Extract server-resolved timestamps
      const timeInTs = updated.timeInTimestamp || 0;
      const timeOutTs = updated.timeOutTimestamp || 0;

      const formattedTimeIn = timeInTs ? new Date(timeInTs).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : (updated.timeIn || '-');
      const formattedTimeOut = timeOutTs ? new Date(timeOutTs).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : (updated.timeOut || '-');

      // Write human-readable fields back to the DB for UI convenience
      update(empRef, {
        timeIn: formattedTimeIn || '-',
        timeOut: formattedTimeOut || '-',
        status: updated.status || 'Present',
        date: updated.date || new Date().toISOString().split('T')[0]
      }).catch(err => {
        console.error('Failed to update formatted time fields:', err);
      });

      // Decide action type for UI
      const actionType = (timeOutTs && timeOutTs !== 0 && (!timeInTs || timeInTs === 0 || timeOutTs >= timeInTs)) ? 'TIME_OUT' : 'TIME_IN';

      const timestampStr = `${updated.date || new Date().toISOString().split('T')[0]} ${actionType === 'TIME_IN' ? formattedTimeIn : formattedTimeOut}`;

      // Success UI will be shown in the floating tap panel (no toast)

      setLastTapResult({
        employee: { ...employee, ...updated },
        action: actionType,
        timestamp: timestampStr,
        timeIn: formattedTimeIn,
        timeOut: formattedTimeOut
      });
    }).catch((error) => {
      console.error('Error saving RFID tap (transaction):', error);
      toast.error('Failed to save RFID tap in database.');
    });
  };

  // Global RFID scanner keyboard listener
  // Detects fast sequences of key events (typical of USB RFID scanners)
  const rfidBufferRef = useRef('');
  const lastKeyTimeRef = useRef(0);

  useEffect(() => {
    const onKeyDown = (e) => {
      const now = Date.now();
      const timeDiff = now - (lastKeyTimeRef.current || 0);

      // If slow typing, reset buffer
      if (timeDiff > 120) {
        rfidBufferRef.current = '';
      }

      lastKeyTimeRef.current = now;

      // If Enter pressed, process buffer
      if (e.key === 'Enter') {
        const raw = rfidBufferRef.current.trim();
        if (raw) {
          const query = raw.toLowerCase();
          const found = employees.find(emp => (
            emp.id.toLowerCase() === query ||
            (emp.rfidTag && emp.rfidTag.toLowerCase() === query) ||
            emp.name.toLowerCase().includes(query)
          ));

          if (found) {
            handleRfidTap(found);
          }
        }

        rfidBufferRef.current = '';
        return;
      }

      // Only record printable characters
      if (e.key.length === 1) {
        rfidBufferRef.current += e.key;
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [employees]);

  // Auto-hide the floating tap panel after 2 seconds
  useEffect(() => {
    if (!lastTapResult) return;
    const t = setTimeout(() => setLastTapResult(null), 2000);
    return () => clearTimeout(t);
  }, [lastTapResult]);

  // Filter employees
  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => {
      const matchesSearch = emp.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'All' || emp.status === statusFilter;
      const matchesDepartment = departmentFilter === 'All' || emp.department === departmentFilter;

      return matchesSearch && matchesStatus && matchesDepartment;
    });
  }, [searchTerm, statusFilter, departmentFilter, employees]);

  // Pagination
  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedEmployees = filteredEmployees.slice(startIndex, startIndex + itemsPerPage);

  // Statistics
  const stats = {
    total: employees.length,
    present: employees.filter(e => e.status === 'Present').length,
    absent: employees.filter(e => e.status === 'Absent').length,
    late: employees.filter(e => e.status === 'Late' || e.status === 'Under Contract').length,
    onLeave: employees.filter(e => e.status === 'On Leave').length
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Present':
        return '#4CAF50';
      case 'Absent':
        return '#f44336';
      case 'Late':
      case 'Under Contract':
        return '#ff9800';
      case 'On Leave':
        return '#2196F3';
      default:
        return '#999';
    }
  };

  // Search employees in modal
  const modalSearchResults = useMemo(() => {
    if (!modalSearch.trim()) return [];
    return employees.filter(emp =>
      emp.id.toLowerCase().includes(modalSearch.toLowerCase()) ||
      emp.name.toLowerCase().includes(modalSearch.toLowerCase())
    ).slice(0, 5); // Limit to 5 results
  }, [modalSearch, employees]);

  // Update employee status
  const handleUpdateStatus = () => {
    if (!selectedEmployee || !newStatus) {
      alert('Please select an employee and status');
      return;
    }

    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const mappedStatus = newStatus === 'Late' ? 'Under Contract' : newStatus;

    set(ref(database, 'employees/' + selectedEmployee.id), {
      ...selectedEmployee,
      status: mappedStatus,
      date: dateStr,
      timeIn: (mappedStatus === 'Present' || mappedStatus === 'Under Contract') ? timeStr : '-'
    })
      .then(() => {
        alert(`Status updated for ${selectedEmployee.name}`);
        handleCloseModal();
      })
      .catch((error) => {
        console.error("Error updating status: ", error);
        alert("Failed to update status");
      });
  };

  const handleOpenModal = () => {
    setShowStatusModal(true);
    setModalSearch('');
    setSelectedEmployee(null);
    setNewStatus('');
  };

  const handleCloseModal = () => {
    setShowStatusModal(false);
    setModalSearch('');
    setSelectedEmployee(null);
    setNewStatus('');
  };

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
              <li className="nav-item active" onClick={() => onNavigate('employees')}>Employees</li>
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
            <h1>Attendance Monitoring</h1>
            <div className="header-right">
              <div className="user-greeting">
                <span className="avatar-icon">👤</span>
                <span>Hello Admin</span>
              </div>
              <button className="btn-logout" onClick={onLogout}>Logout</button>
            </div>
          </header>

          {/* Statistics Section */}
          <section className="stats-section" style={{ marginBottom: '30px' }}>
            <div className="stat-card" style={{ backgroundColor: '#e8f5e9', borderLeft: '4px solid #4CAF50' }}>
              <div className="stat-value" style={{ color: '#4CAF50' }}>{stats.present}</div>
              <div className="stat-title">Present</div>
            </div>
            <div className="stat-card" style={{ backgroundColor: '#ffebee', borderLeft: '4px solid #f44336' }}>
              <div className="stat-value" style={{ color: '#f44336' }}>{stats.absent}</div>
              <div className="stat-title">Absent</div>
            </div>
            <div className="stat-card" style={{ backgroundColor: '#fff3e0', borderLeft: '4px solid #ff9800' }}>
              <div className="stat-value" style={{ color: '#ff9800' }}>{stats.late}</div>
              <div className="stat-title">Under Contract</div>
            </div>
            <div className="stat-card" style={{ backgroundColor: '#e3f2fd', borderLeft: '4px solid #2196F3' }}>
              <div className="stat-value" style={{ color: '#2196F3' }}>{stats.onLeave}</div>
              <div className="stat-title">On Leave</div>
            </div>

          </section>

          {/* Filters Section */}
          <section style={{
            backgroundColor: '#f9f9f9',
            padding: '20px',
            borderRadius: '8px',
            marginBottom: '20px',
            border: '1px solid #e8e8e8'
          }}>
            <div className="employee-filters-layout" style={{ marginBottom: '15px' }}>
              <div className="employee-filter-fields" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '15px', width: '100%' }}>
                {/* Search */}
                <div>
                  <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px', color: '#333' }}>
                    Search (ID or Name)
                  </label>
                  <input
                    type="text"
                    placeholder="Search employees..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1);
                    }}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '14px',
                      boxSizing: 'border-box'

                    }}
                  />
                </div>

                {/* Department Filter */}
                <div>
                  <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px', color: '#333' }}>
                    Filter by Department
                  </label>
                  <select
                    value={departmentFilter}
                    onChange={(e) => {
                      setDepartmentFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '14px',
                      boxSizing: 'border-box'
                    }}
                  >
                    <option value="All">All Departments</option>
                    <option value="Logistics">Logistics</option>
                    <option value="Employee">Employee</option>
                    <option value="Driver/Pahinante">Driver/Pahinante</option>
                  </select>
                </div>

                {/* Status Filter */}
                <div>
                  <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px', color: '#333' }}>
                    Filter by Status
                  </label>
                  <select
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '14px',
                      boxSizing: 'border-box'
                    }}
                  >
                    <option value="All">All Status</option>
                    <option value="Present">Present</option>
                    <option value="Absent">Absent</option>
                    <option value="Under Contract">Under Contract</option>
                    <option value="On Leave">On Leave</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '15px' }}>
                <button
                  onClick={handleOpenAddEmployee}
                  style={{
                    padding: '12px 20px',
                    backgroundColor: '#1565c0',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    fontSize: '14px',
                    whiteSpace: 'nowrap',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  ➕ Add New Employee
                </button>
                <button
                  onClick={() => setShowRfidModal(true)}
                  style={{
                    padding: '12px 20px',
                    backgroundColor: '#04ab0c',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    fontSize: '14px',
                    whiteSpace: 'nowrap',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  🎴 RFID Tap Reader (Time In/Out)
                </button>
                <button
                  onClick={handleOpenModal}
                  style={{
                    padding: '12px 20px',
                    backgroundColor: '#2196F3',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    fontSize: '14px',
                    whiteSpace: 'nowrap'
                  }}
                >
                  ✎ Update Status
                </button>
              </div>
            </div>

            <div style={{ marginTop: '10px', color: '#666', fontSize: '14px' }}>
              Showing {paginatedEmployees.length > 0 ? startIndex + 1 : 0} - {Math.min(startIndex + itemsPerPage, filteredEmployees.length)} of {filteredEmployees.length} employees
            </div>
          </section>

          {/* Employee Table */}
          <section style={{
            backgroundColor: '#fff',
            borderRadius: '8px',
            border: '1px solid #e8e8e8',
            overflow: 'hidden'
          }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                minWidth: '600px'
              }}>
                <thead>
                  <tr style={{ backgroundColor: '#e3f2fd', borderBottom: '2px solid #ddd' }}>
                    <th style={{
                      padding: '15px',
                      textAlign: 'left',
                      fontWeight: 'bold',
                      color: '#333',
                      borderRight: '1px solid #e0e0e0'
                    }}>Employee ID</th>
                    <th style={{
                      padding: '15px',
                      textAlign: 'left',
                      fontWeight: 'bold',
                      color: '#333',
                      borderRight: '1px solid #e0e0e0'
                    }}>Full Name</th>
                    <th style={{
                      padding: '15px',
                      textAlign: 'left',
                      fontWeight: 'bold',
                      color: '#333',
                      borderRight: '1px solid #e0e0e0'
                    }}>Status</th>
                    <th style={{
                      padding: '15px',
                      textAlign: 'center',
                      fontWeight: 'bold',
                      color: '#333',
                      borderRight: '1px solid #e0e0e0'
                    }}>Time In</th>
                    <th style={{
                      padding: '15px',
                      textAlign: 'center',
                      fontWeight: 'bold',
                      color: '#333',
                      borderRight: '1px solid #e0e0e0'
                    }}>Time Out</th>
                    <th style={{
                      padding: '15px',
                      textAlign: 'center',
                      fontWeight: 'bold',
                      color: '#333',
                      borderRight: '1px solid #e0e0e0'
                    }}>Quick RFID Tap</th>
                    <th style={{
                      padding: '15px',
                      textAlign: 'center',
                      fontWeight: 'bold',
                      color: '#333'
                    }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedEmployees.length > 0 ? (
                    paginatedEmployees.map((employee, index) => {
                      const isTimedIn = employee.timeIn && employee.timeIn !== '-';
                      const isTimedOut = employee.timeOut && employee.timeOut !== '-';

                      return (
                      <tr
                        key={employee.id}
                        style={{
                          backgroundColor: index % 2 === 0 ? '#fafafa' : '#fff',
                          borderBottom: '1px solid #e0e0e0',
                          transition: 'background-color 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f0f0f0'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = index % 2 === 0 ? '#fafafa' : '#fff'}
                      >
                        <td style={{
                          padding: '12px 15px',
                          color: '#333',
                          fontSize: '14px',
                          fontWeight: '500',
                          borderRight: '1px solid #e0e0e0'
                        }}>{employee.id}</td>
                        <td style={{
                          padding: '12px 15px',
                          color: '#333',
                          fontSize: '14px',
                          borderRight: '1px solid #e0e0e0'
                        }}>
                          {employee.name}
                          <div style={{ fontSize: '11px', color: '#888' }}>{employee.department}</div>
                        </td>
                        <td style={{
                          padding: '12px 15px',
                          borderRight: '1px solid #e0e0e0'
                        }}>
                          <span style={{
                            display: 'inline-block',
                            padding: '4px 12px',
                            backgroundColor: getStatusColor(employee.status),
                            color: 'white',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: 'bold'
                          }}>
                            {employee.status}
                          </span>
                        </td>
                        <td style={{
                          padding: '12px 15px',
                          textAlign: 'center',
                          color: '#2e7d32',
                          fontSize: '14px',
                          fontWeight: 'bold',
                          borderRight: '1px solid #e0e0e0'
                        }}>
                          {employee.timeIn || '-'}
                        </td>
                        <td style={{
                          padding: '12px 15px',
                          textAlign: 'center',
                          color: '#c62828',
                          fontSize: '14px',
                          fontWeight: 'bold',
                          borderRight: '1px solid #e0e0e0'
                        }}>
                          {employee.timeOut || '-'}
                        </td>
                        <td style={{
                          padding: '12px 15px',
                          textAlign: 'center',
                          borderRight: '1px solid #e0e0e0'
                        }}>
                          <button
                            onClick={() => handleRfidTap(employee)}
                            style={{
                              padding: '6px 12px',
                              backgroundColor: (isTimedIn && !isTimedOut) ? '#ffebee' : '#e8f5e9',
                              color: (isTimedIn && !isTimedOut) ? '#c62828' : '#2e7d32',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontWeight: 'bold',
                              fontSize: '12px'
                            }}
                          >
                            {(isTimedIn && !isTimedOut) ? '🔴 Tap Time Out' : '🟢 Tap Time In'}
                          </button>
                        </td>
                        <td style={{
                          padding: '12px 15px',
                          textAlign: 'center',
                          whiteSpace: 'nowrap'
                        }}>
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                            <button
                              onClick={() => handleOpenEditEmployee(employee)}
                              style={{
                                padding: '6px 10px',
                                backgroundColor: '#f0f4f8',
                                color: '#1565c0',
                                border: '1px solid #90caf9',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontWeight: 'bold',
                                fontSize: '12px'
                              }}
                              title="Edit Employee"
                            >
                              ✏️ Edit
                            </button>
                            <button
                              onClick={() => handleDeleteEmployee(employee)}
                              style={{
                                padding: '6px 10px',
                                backgroundColor: '#fff5f5',
                                color: '#c62828',
                                border: '1px solid #ef9a9a',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontWeight: 'bold',
                                fontSize: '12px'
                              }}
                              title="Delete Employee"
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                    })
                  ) : (
                    <tr>
                      <td colSpan="7" style={{
                        padding: '30px',
                        textAlign: 'center',
                        color: '#999',
                        fontSize: '14px'
                      }}>
                        No employees found matching your filters
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* Pagination */}
          {filteredEmployees.length > itemsPerPage && (
            <section style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '10px',
              marginTop: '20px',
              padding: '20px'
            }}>
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                style={{
                  padding: '8px 16px',
                  backgroundColor: currentPage === 1 ? '#ccc' : '#2196F3',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                  fontSize: '14px'
                }}
              >
                ← Previous
              </button>

              <div style={{
                display: 'flex',
                gap: '5px',
                alignItems: 'center'
              }}>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNumber;
                  if (totalPages <= 5) {
                    pageNumber = i + 1;
                  } else if (currentPage <= 3) {
                    pageNumber = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNumber = totalPages - 4 + i;
                  } else {
                    pageNumber = currentPage - 2 + i;
                  }

                  return (
                    <button
                      key={pageNumber}
                      onClick={() => setCurrentPage(pageNumber)}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: currentPage === pageNumber ? '#2196F3' : '#f0f0f0',
                        color: currentPage === pageNumber ? 'white' : '#333',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: currentPage === pageNumber ? 'bold' : 'normal'
                      }}
                    >
                      {pageNumber}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                style={{
                  padding: '8px 16px',
                  backgroundColor: currentPage === totalPages ? '#ccc' : '#2196F3',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                  fontSize: '14px'
                }}
              >
                Next →
              </button>

              <span style={{
                marginLeft: '10px',
                color: '#666',
                fontSize: '14px'
              }}>
                Page {currentPage} of {totalPages}
              </span>
            </section>
          )}
        </div>
      </main>

      {/* Status Update Modal */}
      {showStatusModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '24px',
            width: '400px',
            maxWidth: '90%',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)'
          }}>
            <h2 style={{ margin: '0 0 20px 0', fontSize: '20px', color: '#333' }}>
              Update Employee Status
            </h2>

            {/* Search Input */}
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px', color: '#333' }}>
                Search Employee
              </label>
              <input
                type="text"
                value={modalSearch}
                onChange={(e) => {
                  setModalSearch(e.target.value);
                  setSelectedEmployee(null);
                }}
                placeholder="Type ID or Name..."
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Search Results */}
            {modalSearch.trim() && (
              <div style={{
                marginBottom: '15px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                maxHeight: '150px',
                overflowY: 'auto'
              }}>
                {modalSearchResults.length > 0 ? (
                  modalSearchResults.map(emp => (
                    <div
                      key={emp.id}
                      onClick={() => {
                        setSelectedEmployee(emp);
                        setModalSearch(`${emp.name} (${emp.id})`);
                      }}
                      style={{
                        padding: '10px',
                        cursor: 'pointer',
                        backgroundColor: selectedEmployee?.id === emp.id ? '#e3f2fd' : 'white',
                        borderBottom: '1px solid #eee'
                      }}
                      onMouseEnter={(e) => {
                        if (selectedEmployee?.id !== emp.id) e.target.style.backgroundColor = '#f5f5f5';
                      }}
                      onMouseLeave={(e) => {
                        if (selectedEmployee?.id !== emp.id) e.target.style.backgroundColor = 'white';
                      }}
                    >
                      <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{emp.name}</div>
                      <div style={{ fontSize: '12px', color: '#666' }}>{emp.id} - {emp.department}</div>
                    </div>
                  ))
                ) : (
                  <div style={{ padding: '10px', color: '#999', fontSize: '13px' }}>
                    No matching employees found
                  </div>
                )}
              </div>
            )}

            {/* Selected Employee Info */}
            {selectedEmployee && (
              <div style={{
                marginBottom: '15px',
                padding: '10px',
                backgroundColor: '#f5f5f5',
                borderRadius: '4px',
                fontSize: '13px'
              }}>
                <div><strong>Selected:</strong> {selectedEmployee.name}</div>
                <div><strong>Current Status:</strong> {selectedEmployee.status}</div>
              </div>
            )}

            {/* Status Dropdown */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px', color: '#333' }}>
                New Status
              </label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              >
                <option value="">Select Status</option>
                <option value="Present">Present</option>
                <option value="Absent">Absent</option>
                <option value="Late">Under Contract</option>
                <option value="On Leave">On Leave</option>
              </select>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={handleUpdateStatus}
                style={{
                  flex: 1,
                  padding: '12px',
                  backgroundColor: '#4CAF50',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                Update
              </button>
              <button
                onClick={handleCloseModal}
                style={{
                  flex: 1,
                  padding: '12px',
                  backgroundColor: '#f44336',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showRfidModal && (
        <RfidReaderModal
          isOpen={showRfidModal}
          onClose={() => setShowRfidModal(false)}
          employees={employees}
          onTapEmployee={handleRfidTap}
          lastTapResult={lastTapResult}
        />
      )}

      {/* Add / Edit Employee Modal */}
      {showEmployeeModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 10000, padding: '20px'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            padding: '28px',
            width: '480px',
            maxWidth: '95%',
            boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #eee', paddingBottom: '12px' }}>
              <h2 style={{ margin: 0, fontSize: '20px', color: '#333' }}>
                {editingEmployee ? '✏️ Edit Employee Details' : '➕ Add New Employee'}
              </h2>
              <button onClick={() => setShowEmployeeModal(false)} style={{ border: 'none', background: 'none', fontSize: '20px', cursor: 'pointer', color: '#888' }}>✕</button>
            </div>

            <form onSubmit={handleSaveEmployeeSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#444', marginBottom: '6px' }}>Employee ID *</label>
                <input
                  type="text"
                  value={employeeForm.id}
                  onChange={(e) => setEmployeeForm(prev => ({ ...prev, id: e.target.value }))}
                  readOnly={!!editingEmployee}
                  placeholder="e.g. EMP00201"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '14px', backgroundColor: editingEmployee ? '#f5f5f5' : 'white' }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#444', marginBottom: '6px' }}>Full Name *</label>
                <input
                  type="text"
                  value={employeeForm.name}
                  onChange={(e) => setEmployeeForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter full name..."
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '14px' }}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#444', marginBottom: '6px' }}>Department</label>
                  <select
                    value={employeeForm.department}
                    onChange={(e) => setEmployeeForm(prev => ({ ...prev, department: e.target.value }))}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '14px' }}
                  >
                    <option value="Logistics">Logistics</option>
                    <option value="Employee">Employee</option>
                    <option value="Driver/Pahinante">Driver/Pahinante</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#444', marginBottom: '6px' }}>Status</label>
                  <select
                    value={employeeForm.status}
                    onChange={(e) => setEmployeeForm(prev => ({ ...prev, status: e.target.value }))}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '14px' }}
                  >
                    <option value="Present">Present</option>
                    <option value="Absent">Absent</option>
                    <option value="Under Contract">Under Contract</option>
                    <option value="On Leave">On Leave</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#444', marginBottom: '6px' }}>RFID Tag / Card ID</label>
                <input
                  type="text"
                  value={employeeForm.rfidTag}
                  onChange={(e) => setEmployeeForm(prev => ({ ...prev, rfidTag: e.target.value }))}
                  placeholder="e.g. RFID-EMP00201"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '14px' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#444', marginBottom: '6px' }}>Time In</label>
                  <input
                    type="text"
                    value={employeeForm.timeIn}
                    onChange={(e) => setEmployeeForm(prev => ({ ...prev, timeIn: e.target.value }))}
                    placeholder="e.g. 08:30 AM or -"
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '14px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#444', marginBottom: '6px' }}>Time Out</label>
                  <input
                    type="text"
                    value={employeeForm.timeOut}
                    onChange={(e) => setEmployeeForm(prev => ({ ...prev, timeOut: e.target.value }))}
                    placeholder="e.g. 05:00 PM or -"
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '14px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                <button
                  type="submit"
                  style={{ flex: 1, padding: '12px', backgroundColor: '#04ab0c', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' }}
                >
                  {editingEmployee ? 'Save Changes' : 'Create Employee'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowEmployeeModal(false)}
                  style={{ flex: 1, padding: '12px', backgroundColor: '#f5f5f5', color: '#555', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Floating Tap Result Panel (replaces toast notifications) */}
      {lastTapResult && (
        <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 20000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ width: '560px', maxWidth: '94%', backgroundColor: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 24px 80px rgba(0,0,0,0.24)', border: '1px solid #e6e6e6', transition: 'transform 180ms ease-out' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ fontWeight: 800, fontSize: '18px', color: lastTapResult.action === 'TIME_IN' ? '#2e7d32' : '#c62828' }}>
                {lastTapResult.action === 'TIME_IN' ? 'Time In' : 'Time Out'}
              </div>
              <button onClick={() => setLastTapResult(null)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '18px', color: '#666' }}>✕</button>
            </div>

            <div style={{ lineHeight: 1.8, color: '#222', fontSize: '15px' }}>
              <div style={{ marginBottom: '8px' }}><strong style={{ width: 120, display: 'inline-block' }}>Name:</strong> {lastTapResult.employee?.name}</div>
              <div style={{ marginBottom: '8px' }}><strong style={{ width: 120, display: 'inline-block' }}>Employee ID:</strong> {lastTapResult.employee?.id}</div>
              <div style={{ marginBottom: '8px' }}><strong style={{ width: 120, display: 'inline-block' }}>Status:</strong> {lastTapResult.employee?.status}</div>
              {lastTapResult.action === 'TIME_IN' ? (
                <div style={{ marginTop: '6px' }}><strong style={{ width: 120, display: 'inline-block' }}>Time In:</strong> {lastTapResult.timeIn || '-'}</div>
              ) : (
                <div style={{ marginTop: '6px' }}><strong style={{ width: 120, display: 'inline-block' }}>Time Out:</strong> {lastTapResult.timeOut || '-'}</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
