import React, { useEffect, useState } from 'react';

const initialProducts = [
  {
    name: 'Centrifugal compressor(Industrial air)',
    img: '/images/CPIA.jpg',
    description: 'High-performance centrifugal compressors designed for industrial air applications. Our units provide reliable and efficient air compression with minimal maintenance requirements for continuous operations.',
  },
  {
    name: 'Centrifugal compressor (Engineered air and process gas)',
    img: '/images/CPEI.jpg',
    description: 'Specialized centrifugal compressors for engineered air and process gas applications. These units deliver precision performance with optimized flow rates and pressure ratios for demanding industrial processes.',
  },
  {
    name: 'Reciprocating compressor (Process gas)',
    img: '/images/RC.jpg',
    description: 'Heavy-duty reciprocating compressors engineered for process gas compression. Designed to handle demanding conditions with high durability and exceptional reliability in challenging industrial environments.',
  },
  {
    name: 'Air ends for Water injected oil free screw compressor',
    img: '/images/AE.jpg',
    description: 'Premium air end components for water-injected oil-free screw compressors. These parts ensure clean, efficient compression with reduced energy consumption and minimal environmental impact.',
  },
  {
    name: 'Cryogenic Pumps',
    img: '/images/CP.jpeg',
    description: 'Specialized pumps for cryogenic fluid transfer including liquid nitrogen and liquid helium. Built to withstand extreme temperatures while maintaining precise flow control and system integrity.',
  },
  {
    name: 'Diaphragm Compressors',
    img: '/images/DC.jpg',
    description: 'Precision diaphragm compressors for sensitive gas applications. Ideal for handling corrosive, toxic, or pure gases with complete separation between compression chamber and drive mechanism.',
  },
  {
    name: 'Oxygen Compressor',
    img: '/images/OC.png',
    description: 'Purpose-built oxygen compressors meeting all safety and performance standards. Engineered for medical, industrial, and aerospace applications with reliability and precision.',
  },
  {
    name: 'LNG Pumps',
    img: '/images/LNG.jpg',
    description: 'Advanced LNG (Liquefied Natural Gas) pumps for efficient cryogenic fluid transfer. Designed for offshore and onshore applications with superior performance in extreme cold conditions.',
  },
  {
    name: 'Hydrogen Compressors',
    img: '/images/HC.jpg',
    description: 'Safety-certified hydrogen compressors for clean energy and industrial applications. Built to handle hydrogen\'s unique properties with maximum safety, durability, and performance.',
  },
  {
    name: 'Cylinder Filling Station',
    img: '/images/CFS.png',
    description: 'Complete cylinder filling station systems for gas distribution and refilling operations. Equipped with safety features, pressure regulators, and monitoring systems for reliable service.',
  }
];

export default function AdminProduct() {
  const [products, setProducts] = useState(() => {
    try {
      const saved = localStorage.getItem('adminProduct_products');
      return saved ? JSON.parse(saved) : initialProducts;
    } catch {
      return initialProducts;
    }
  });
  const [isAdding, setIsAdding] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [newProduct, setNewProduct] = useState({
    name: '',
    img: '',
    description: ''
  });

  useEffect(() => {
    localStorage.setItem('adminProduct_products', JSON.stringify(products));
  }, [products]);

  const handleAddProduct = () => {
    if (newProduct.name && newProduct.description) {
      setProducts([...products, {
        ...newProduct,
        img: newProduct.img || '/images/default.jpg'
      }]);
      setNewProduct({ name: '', img: '', description: '' });
      setIsAdding(false);
    }
  };

  const handleDeleteProduct = (index) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      const updatedProducts = products.filter((_, i) => i !== index);
      setProducts(updatedProducts);
    }
  };

  const handleEditProduct = (index) => {
    setEditingIndex(index);
    setNewProduct(products[index]);
  };

  const handleUpdateProduct = () => {
    if (newProduct.name && newProduct.description) {
      const updatedProducts = [...products];
      updatedProducts[editingIndex] = {
        ...newProduct,
        img: newProduct.img || '/images/default.jpg'
      };
      setProducts(updatedProducts);
      setEditingIndex(null);
      setNewProduct({ name: '', img: '', description: '' });
    }
  };

  const handleImageFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setNewProduct((prev) => ({ ...prev, img: reader.result }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingIndex(null);
    setNewProduct({ name: '', img: '', description: '' });
  };

  return (
    <div style={{ padding: '20px 35px', maxWidth: '1400px', margin: '0 auto' }}>
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
          onClick={() => setIsAdding(true)}
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

      {(isAdding || editingIndex !== null) && (
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
              {isAdding ? 'Add New Product' : 'Edit Product'}
            </h3>
            <div style={{ display: 'grid', gap: '16px' }}>
              <input
                type="text"
                placeholder="Product Name"
                value={newProduct.name}
                onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
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
              {newProduct.img && (
                <img
                  src={newProduct.img}
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
              <textarea
                placeholder="Product Description"
                value={newProduct.description}
                onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                rows="4"
                style={{
                  padding: '14px',
                  borderRadius: '12px',
                  border: '1px solid #d1d5db',
                  fontSize: '16px',
                  width: '100%',
                  resize: 'vertical'
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                <button
                  onClick={isAdding ? handleAddProduct : handleUpdateProduct}
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
                  {isAdding ? 'Add Product' : 'Update Product'}
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

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '32px',
        alignItems: 'stretch'
      }}>
        {products.map((product, idx) => (
          <div
            key={idx}
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
            <div style={{
              position: 'absolute',
              top: '12px',
              right: '12px',
              display: 'flex',
              gap: '8px',
              zIndex: 10
            }}>
              <button
                onClick={() => handleEditProduct(idx)}
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
                onClick={() => handleDeleteProduct(idx)}
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

            <div style={{ height: '220px', overflow: 'hidden', backgroundColor: '#f8fafc' }}>
              <img
                src={product.img}
                alt={product.name}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  transition: 'transform 0.5s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
              />
            </div>

            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
              <h3 style={{
                margin: '0 0 16px 0',
                fontSize: '18px',
                fontWeight: '700',
                color: 'var(--green)',
                lineHeight: '1.4'
              }}>
                {product.name}
              </h3>
              <p style={{
                margin: '0',
                color: 'var(--text-light)',
                lineHeight: '1.7',
                fontSize: '15px',
                flexGrow: 1
              }}>
                {product.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}