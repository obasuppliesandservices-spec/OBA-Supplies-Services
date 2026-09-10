import React, { useEffect, useState } from 'react';
import { persistItemList, readImageAsDataUrl } from '../storageUtils';

const initialServices = [
  { title: 'Insulation and Cladding', img: '/images/cladding.jpg', price: 299.99 },
  { title: 'Cold Box Insulation and Cladding', img: '/images/cbiac.jpg', price: 349.99 },
  { title: 'Equipment Foundation Coating', img: '/images/equipment foundation coating.png', price: 279.99 },
  { title: 'Welding and Fabrication', img: '/images/wf.jpg', price: 449.99 },
  { title: 'Cooler Tube Replacement', img: '/images/ctr.jpg', price: 379.99 },
  { title: 'Vacuum Insulated Piping Installation (VIP)', img: '/images/vip.jpg', price: 599.99 },
  { title: 'Liquid Nitrogen Piping', img: '/images/lnp.jpg', price: 499.99 },
  { title: 'Crack Detection Test', img: '/images/cdt.jpg', price: 329.99 },
  { title: 'Repainting', img: '/images/repainting.jpg', price: 249.99 },
  { title: 'Professional Mechanical Engineer Consultancy', img: '/images/pmec.jpg', price: 799.99 }
];

const initialProducts = [
  { title: 'IHI Realize your Dreams', img: '/images/IHI.png', price: 149.99 },
  { title: 'Indian Compressors Ltd', img: '/images/Indianltd.png', price: 199.99 },
  { title: 'Centrifugal compressor(Industrial air)', img: '/images/CPIA.jpg', price: 149.99 },
  { title: 'Centrifugal compressor (Engineered air and process gas)', img: '/images/CPEI.jpg', price: 199.99 },
  { title: 'Reciprocating compressor (Process gas)', img: '/images/RC.jpg', price: 799.99 },
  { title: 'Air ends for Water injected oil free screw compressor', img: '/images/AE.jpg', price: 899.99 },
  { title: 'Cryogenic Pumps', img: '/images/CP.jpeg', price: 249.99 },
  { title: 'Diaphragm Compressors', img: '/images/DC.jpg', price: 89.99 },
  { title: 'Oxygen Compressor', img: '/images/OC.png', price: 169.99 },
  { title: 'LNG Pumps', img: '/images/LNG.jpg', price: 129.99 },
  { title: 'Hydrogen Compressors', img: '/images/HC.jpg', price: 79.99 },
  { title: 'Cylinder Filling Station', img: '/images/CFS.png', price: 199.99 }
];

export default function AdminOrderspage() {
  const [services, setServices] = useState(() => {
    try {
      const saved = localStorage.getItem('adminOrderspage_services');
      return saved ? JSON.parse(saved) : initialServices;
    } catch {
      return initialServices;
    }
  });
  const [products, setProducts] = useState(() => {
    try {
      const saved = localStorage.getItem('adminOrderspage_products');
      return saved ? JSON.parse(saved) : initialProducts;
    } catch {
      return initialProducts;
    }
  });
  const [isAddingService, setIsAddingService] = useState(false);
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [editingServiceIndex, setEditingServiceIndex] = useState(null);
  const [editingProductIndex, setEditingProductIndex] = useState(null);
  const [newItem, setNewItem] = useState({
    title: '',
    img: '',
    price: ''
  });

  useEffect(() => {
    persistItemList('adminOrderspage_services', services);
  }, [services]);

  useEffect(() => {
    persistItemList('adminOrderspage_products', products);
  }, [products]);

  const handleAddService = () => {
    if (newItem.title && newItem.price) {
      setServices([...services, {
        title: newItem.title,
        img: newItem.img || '/images/default.jpg',
        price: parseFloat(newItem.price)
      }]);
      setNewItem({ title: '', img: '', price: '' });
      setIsAddingService(false);
    }
  };

  const handleAddProduct = () => {
    if (newItem.title && newItem.price) {
      setProducts([...products, {
        title: newItem.title,
        img: newItem.img || '/images/default.jpg',
        price: parseFloat(newItem.price)
      }]);
      setNewItem({ title: '', img: '', price: '' });
      setIsAddingProduct(false);
    }
  };

  const handleDeleteService = (index) => {
    if (window.confirm('Are you sure you want to delete this service?')) {
      const updatedServices = services.filter((_, i) => i !== index);
      setServices(updatedServices);
    }
  };

  const handleDeleteProduct = (index) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      const updatedProducts = products.filter((_, i) => i !== index);
      setProducts(updatedProducts);
    }
  };

  const handleEditService = (index) => {
    setEditingServiceIndex(index);
    setNewItem({
      title: services[index].title,
      img: services[index].img,
      price: services[index].price.toString()
    });
  };

  const handleEditProduct = (index) => {
    setEditingProductIndex(index);
    setNewItem({
      title: products[index].title,
      img: products[index].img,
      price: products[index].price.toString()
    });
  };

  const handleUpdateService = () => {
    if (newItem.title && newItem.price) {
      const updatedServices = [...services];
      updatedServices[editingServiceIndex] = {
        title: newItem.title,
        img: newItem.img || '/images/default.jpg',
        price: parseFloat(newItem.price)
      };
      setServices(updatedServices);
      setEditingServiceIndex(null);
      setNewItem({ title: '', img: '', price: '' });
    }
  };

  const handleUpdateProduct = () => {
    if (newItem.title && newItem.price) {
      const updatedProducts = [...products];
      updatedProducts[editingProductIndex] = {
        title: newItem.title,
        img: newItem.img || '/images/default.jpg',
        price: parseFloat(newItem.price)
      };
      setProducts(updatedProducts);
      setEditingProductIndex(null);
      setNewItem({ title: '', img: '', price: '' });
    }
  };

  const handleCancel = () => {
    setIsAddingService(false);
    setIsAddingProduct(false);
    setEditingServiceIndex(null);
    setEditingProductIndex(null);
    setNewItem({ title: '', img: '', price: '' });
  };

  const handleImageFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    readImageAsDataUrl(file).then((image) => {
      setNewItem((prev) => ({ ...prev, img: image }));
    }).catch(() => {});
  };

  const isFormOpen = isAddingService || isAddingProduct || editingServiceIndex !== null || editingProductIndex !== null;

  const formTitle = isAddingService
    ? 'Add New Service'
    : editingServiceIndex !== null
    ? 'Edit Service'
    : isAddingProduct
    ? 'Add New Product'
    : 'Edit Product';

  const submitAction = isAddingService
    ? handleAddService
    : editingServiceIndex !== null
    ? handleUpdateService
    : isAddingProduct
    ? handleAddProduct
    : handleUpdateProduct;

  const submitLabel = isAddingService
    ? 'Add Service'
    : editingServiceIndex !== null
    ? 'Update Service'
    : isAddingProduct
    ? 'Add Product'
    : 'Update Product';

  const renderItemCard = (item, index, type, onEdit, onDelete) => (
    <div
      key={index}
      className="modern-shadow hover-lift"
      style={{
        background: 'var(--card-bg)',
        borderRadius: '16px',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        border: '1px solid var(--border)',
        position: 'relative'
      }}
    >
      {item.title !== 'IHI Realize your Dreams' && item.title !== 'Indian Compressors Ltd' && (
      <div style={{
        position: 'absolute',
        top: '12px',
        right: '12px',
        display: 'flex',
        gap: '8px',
        zIndex: 10
      }}>
        <button
          onClick={() => onEdit(index)}
          style={{
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            padding: '6px 12px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: '600'
          }}
          title="Edit"
        >
          Edit
        </button>
        <button
          onClick={() => onDelete(index)}
          style={{
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            padding: '6px 12px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: '600'
          }}
          title="Delete"
        >
          Delete
        </button>
      </div>
      )}

      <div style={{ height: '200px', overflow: 'hidden', backgroundColor: '#f8fafc' }}>
        <img
          src={item.img}
          alt={item.title}
          style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s ease' }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        />
      </div>
      <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', flexGrow: 1, alignItems: 'center' }}>
        <h3 style={{ margin: '0 0 12px 0', fontSize: '18px', fontWeight: '700', color: 'var(--text)', textAlign: 'center', lineHeight: '1.4' }}>
          {item.title}
        </h3>
        {item.title !== 'IHI Realize your Dreams' && item.title !== 'Indian Compressors Ltd' && (
        <p style={{ fontSize: '24px', fontWeight: '800', color: 'var(--green)', margin: '0 0 24px 0' }}>
          ₱ {item.price.toFixed(2)}
        </p>
        )}
      </div>
    </div>
  );

  return (
    <div style={{ padding: '20px 32px', maxWidth: '1400px', margin: '0 auto', position: 'relative', display: 'flex', flexDirection: 'column' }}>

      {/* Services Section */}
      <div style={{ marginBottom: '64px', order: 2 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '48px' }}>
          <h2 style={{
            textAlign: 'center',
            margin: '0',
            fontSize: '36px',
            fontWeight: '800',
            color: 'var(--text)',
            letterSpacing: '-1px'
          }}>
            Admin - Services Management
          </h2>
          <button
            onClick={() => setIsAddingService(true)}
            style={{
              backgroundColor: '#04ab0c',
              color: 'white',
              border: 'none',
              padding: '12px 28px',
              borderRadius: '10px',
              cursor: 'pointer',
              fontSize: '15px',
              fontWeight: '600',
              boxShadow: '0 4px 15px rgba(4, 171, 12, 0.3)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
            onMouseEnter={(e) => {
              e.target.style.boxShadow = '0 8px 25px rgba(4, 171, 12, 0.4)';
              e.target.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.target.style.boxShadow = '0 4px 15px rgba(4, 171, 12, 0.3)';
              e.target.style.transform = 'translateY(0)';
            }}
          >
            Add New Service
          </button>
        </div>


        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '32px',
          alignItems: 'stretch'
        }}>
          {services.map((service, idx) =>
            renderItemCard(service, idx, 'service', handleEditService, handleDeleteService)
          )}
        </div>
      </div>

      {/* Products Section */}
      <div style={{ order: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '48px' }}>
          <h2 style={{
            textAlign: 'center',
            margin: '0',
            fontSize: '36px',
            fontWeight: '800',
            color: 'var(--text)',
            letterSpacing: '-1px'
          }}>
            Admin - Products Management
          </h2>
          <button
            onClick={() => setIsAddingProduct(true)}
            style={{
              backgroundColor: '#04ab0c',
              color: 'white',
              border: 'none',
              padding: '12px 28px',
              borderRadius: '10px',
              cursor: 'pointer',
              fontSize: '15px',
              fontWeight: '600',
              boxShadow: '0 4px 15px rgba(4, 171, 12, 0.3)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
            onMouseEnter={(e) => {
              e.target.style.boxShadow = '0 8px 25px rgba(4, 171, 12, 0.4)';
              e.target.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.target.style.boxShadow = '0 4px 15px rgba(4, 171, 12, 0.3)';
              e.target.style.transform = 'translateY(0)';
            }}
          >
            Add New Product
          </button>
        </div>


        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '32px',
          alignItems: 'stretch',
          paddingBottom: '48px'
        }}>
          {products.slice(0, 2).map((product, idx) =>
            renderItemCard(product, idx, 'product', handleEditProduct, handleDeleteProduct)
          )}
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '32px',
          alignItems: 'stretch'
        }}>
          {products.slice(2).map((product, idx) =>
            renderItemCard(product, idx + 2, 'product', handleEditProduct, handleDeleteProduct)
          )}
        </div>
      </div>

      {isFormOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            zIndex: 1200
          }}
          onClick={handleCancel}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '540px',
              backgroundColor: 'white',
              borderRadius: '24px',
              boxShadow: '0 24px 80px rgba(15, 23, 42, 0.25)',
              padding: '32px',
              position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={handleCancel}
              style={{
                position: 'absolute',
                top: '18px',
                right: '18px',
                background: 'transparent',
                border: 'none',
                color: '#475569',
                fontSize: '22px',
                cursor: 'pointer',
                padding: '8px',
                borderRadius: '999px',
                transition: 'background 0.2s ease'
              }}
              onMouseEnter={(e) => { e.target.style.background = 'rgba(15, 23, 42, 0.08)'; }}
              onMouseLeave={(e) => { e.target.style.background = 'transparent'; }}
              aria-label="Close form"
            >
              ×
            </button>
            <h3 style={{ marginBottom: '24px', color: '#111827', fontSize: '24px', fontWeight: '700' }}>
              {formTitle}
            </h3>
            <div style={{ display: 'grid', gap: '16px' }}>
              <input
                type="text"
                placeholder="Title"
                value={newItem.title}
                onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
                style={{
                  padding: '14px',
                  borderRadius: '12px',
                  border: '1px solid #d1d5db',
                  fontSize: '16px',
                  width: '100%'
                }}
              />
              <input
                type="file"
                accept="image/*"
                onChange={handleImageFileChange}
                style={{
                  padding: '10px 14px',
                  borderRadius: '12px',
                  border: '1px solid #d1d5db',
                  fontSize: '16px',
                  width: '100%'
                }}
              />
              {newItem.img && (
                <img
                  src={newItem.img}
                  alt="Preview"
                  style={{
                    width: '100%',
                    maxHeight: '220px',
                    objectFit: 'cover',
                    borderRadius: '12px',
                    marginTop: '8px'
                  }}
                />
              )}
              <input
                type="number"
                placeholder="Price"
                value={newItem.price}
                onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
                step="0.01"
                style={{
                  padding: '14px',
                  borderRadius: '12px',
                  border: '1px solid #d1d5db',
                  fontSize: '16px',
                  width: '100%'
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                <button
                  onClick={submitAction}
                  style={{
                    backgroundColor: '#04ab0c',
                    color: 'white',
                    border: 'none',
                    padding: '14px 24px',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    fontSize: '15px',
                    fontWeight: '700',
                    boxShadow: '0 10px 25px rgba(4, 171, 12, 0.2)',
                    flex: '1 1 auto',
                    minWidth: '140px'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.boxShadow = '0 14px 28px rgba(4, 171, 12, 0.24)';
                    e.target.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.boxShadow = '0 10px 25px rgba(4, 171, 12, 0.2)';
                    e.target.style.transform = 'translateY(0)';
                  }}
                >
                  {submitLabel}
                </button>
                <button
                  onClick={handleCancel}
                  style={{
                    backgroundColor: '#f8fafc',
                    color: '#334155',
                    border: '1px solid #cbd5e1',
                    padding: '14px 24px',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    fontSize: '15px',
                    fontWeight: '700',
                    flex: '1 1 auto',
                    minWidth: '140px'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = '#e2e8f0';
                    e.target.style.boxShadow = '0 8px 18px rgba(15, 23, 42, 0.08)';
                    e.target.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = '#f8fafc';
                    e.target.style.boxShadow = 'none';
                    e.target.style.transform = 'translateY(0)';
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}