import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';

const initialInventory = [
  { name: 'compressor', quantity: 1, price: 100.00 },
  { name: 'insulation', quantity: 1, price: 50.00 },
  { name: 'cladding', quantity: 1, price: 75.00 },
  { name: 'crack detection test', quantity: 1, price: 25.00 }
];

function InventoryItem({ item }) {
  return (
    <div className="meeting-item">
      <span className="meeting-name">{item.name}</span>
      <span className="meeting-time">Qty: {item.quantity}</span>
      <span className="meeting-date">Price: ${item.price}</span>
    </div>
  );
}

export default function Inventory({ user, onLogout, onNavigate, inventory, onAddItem, onOpenJobOrderModal }) {
  const [newItem, setNewItem] = useState({ name: '', quantity: '', price: '' });
  const [showModal, setShowModal] = useState(false);
  const [warehouseB, setWarehouseB] = useState(initialInventory);
  const [showModalWarehouseB, setShowModalWarehouseB] = useState(false);
  const [newItemWarehouseB, setNewItemWarehouseB] = useState({ name: '', quantity: '', price: '' });
  const [selectedQrItem, setSelectedQrItem] = useState(null);

  const currentInventory = inventory.length > 0 ? inventory : initialInventory;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (newItem.name && newItem.quantity && newItem.price) {
      onAddItem({
        ...newItem,
        quantity: parseInt(newItem.quantity),
        price: parseFloat(newItem.price)
      });
      setNewItem({ name: '', quantity: '', price: '' });
      setShowModal(false);
    }
  };

  const handleSubmitWarehouseB = (e) => {
    e.preventDefault();
    if (newItemWarehouseB.name && newItemWarehouseB.quantity && newItemWarehouseB.price) {
      setWarehouseB([...warehouseB, {
        ...newItemWarehouseB,
        quantity: parseInt(newItemWarehouseB.quantity),
        price: parseFloat(newItemWarehouseB.price)
      }]);
      setNewItemWarehouseB({ name: '', quantity: '', price: '' });
      setShowModalWarehouseB(false);
    }
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
              <li className="nav-item active" onClick={() => onNavigate('inventory')}>Inventory</li>
              <li className="nav-item" onClick={() => onNavigate('employees')}>Employees</li>
            </ul>
          </div>
          <div className="nav-section">
            <div className="nav-title">Management</div>
            <ul>
              <li className="nav-item" onClick={() => onNavigate('calendar')}>Calendar</li>
              <li className="nav-item" onClick={() => onNavigate('joborder')}>Orders / Job Order</li>
            </ul>
          </div>
          <div className="nav-section">
            <div className="nav-title">Support</div>
            <ul>
              <li className="nav-item" onClick={() => onNavigate('feedback')}>Feedbacks</li>
              <li className="nav-item disabled">Settings</li>
              
            </ul>
          </div>
        </nav>

       
      </aside>

      <main className="dashboard-main">
        <div className="dashboard-header-bar"></div>
        <div className="dashboard-content">
          <header className="dashboard-header">
            <h1>Inventory</h1>
            <div className="header-right">
              <div className="user-greeting">
                <span className="avatar-icon">👤</span>
                <span>Hello {user.name}</span>
              </div>
              <button className="btn-logout" onClick={onLogout}>Logout</button>
            </div>
          </header>

          <section className="meetings-section">
            <div className="meetings-header">
              <h3>📦 Warehouse A ({currentInventory.length})</h3>
              <button className="btn-add" onClick={() => setShowModal(true)}>Add New Item</button>
            </div>
            <div className="inventory-table-container">
              <table className="inventory-table">
                <thead>
                  <tr>
                    <th>Products</th>
                    <th>Quantity</th>
                    <th>Price</th>
                    <th>Total</th>
                    <th>QR Code</th>
                  </tr>
                </thead>
                <tbody>
                  {currentInventory.map((item, index) => (
                    <tr key={index}>
                      <td>{item.name}</td>
                      <td>{item.quantity}</td>
                      <td>${item.price.toFixed(2)}</td>
                      <td>${(item.quantity * item.price).toFixed(2)}</td>
                      <td>
                        <button 
                          onClick={() => setSelectedQrItem(item)}
                          style={{ padding: '6px 12px', backgroundColor: '#e3f2fd', color: '#1976d2', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                        >
                          View QR
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="meetings-section">
            <div className="meetings-header">
              <h3>📦 Warehouse B ({warehouseB.length})</h3>
              <button className="btn-add" onClick={() => setShowModalWarehouseB(true)}>Add New Item</button>
            </div>
            <div className="inventory-table-container">
              <table className="inventory-table">
                <thead>
                  <tr>
                    <th>Products</th>
                    <th>Quantity</th>
                    <th>Price</th>
                    <th>Total</th>
                    <th>QR Code</th>
                  </tr>
                </thead>
                <tbody>
                  {warehouseB.map((item, index) => (
                    <tr key={index}>
                      <td>{item.name}</td>
                      <td>{item.quantity}</td>
                      <td>${item.price.toFixed(2)}</td>
                      <td>${(item.quantity * item.price).toFixed(2)}</td>
                      <td>
                        <button 
                          onClick={() => setSelectedQrItem(item)}
                          style={{ padding: '6px 12px', backgroundColor: '#e3f2fd', color: '#1976d2', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                        >
                          View QR
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </main>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Add New Item</h3>
            <form onSubmit={handleSubmit} className="inventory-form">
              <div className="form-group">
                <label>Item Name:</label>
                <input
                  type="text"
                  value={newItem.name}
                  onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                  placeholder="Enter item name"
                  required
                />
              </div>
              <div className="form-group">
                <label>Quantity:</label>
                <input
                  type="number"
                  value={newItem.quantity}
                  onChange={(e) => setNewItem({ ...newItem, quantity: e.target.value })}
                  placeholder="Enter quantity"
                  min="1"
                  required
                />
              </div>
              <div className="form-group">
                <label>Price ($):</label>
                <input
                  type="number"
                  step="0.01"
                  value={newItem.price}
                  onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
                  placeholder="Enter price"
                  min="0.01"
                  required
                />
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-add">Add Item</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showModalWarehouseB && (
        <div className="modal-overlay" onClick={() => setShowModalWarehouseB(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Add New Item (Warehouse B)</h3>
            <form onSubmit={handleSubmitWarehouseB} className="inventory-form">
              <div className="form-group">
                <label>Item Name:</label>
                <input
                  type="text"
                  value={newItemWarehouseB.name}
                  onChange={(e) => setNewItemWarehouseB({ ...newItemWarehouseB, name: e.target.value })}
                  placeholder="Enter item name"
                  required
                />
              </div>
              <div className="form-group">
                <label>Quantity:</label>
                <input
                  type="number"
                  value={newItemWarehouseB.quantity}
                  onChange={(e) => setNewItemWarehouseB({ ...newItemWarehouseB, quantity: e.target.value })}
                  placeholder="Enter quantity"
                  min="1"
                  required
                />
              </div>
              <div className="form-group">
                <label>Price ($):</label>
                <input
                  type="number"
                  step="0.01"
                  value={newItemWarehouseB.price}
                  onChange={(e) => setNewItemWarehouseB({ ...newItemWarehouseB, price: e.target.value })}
                  placeholder="Enter price"
                  min="0.01"
                  required
                />
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setShowModalWarehouseB(false)}>Cancel</button>
                <button type="submit" className="btn-add">Add Item</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedQrItem && (
        <div className="modal-overlay" onClick={() => setSelectedQrItem(null)}>
          <div className="modal-content" style={{ textAlign: 'center', width: '300px' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginBottom: '20px' }}>{selectedQrItem.name}</h3>
            <div style={{ background: 'white', padding: '16px', display: 'inline-block', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
              <QRCodeSVG value={selectedQrItem.name} size={200} level="H" />
            </div>
            <p style={{ marginTop: '16px', color: '#666', fontSize: '14px' }}>Scan this code to automatically add the item to your active job order.</p>
            <div className="modal-actions" style={{ justifyContent: 'center', marginTop: '24px' }}>
              <button type="button" onClick={() => setSelectedQrItem(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
