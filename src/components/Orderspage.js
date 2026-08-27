import React, { useEffect, useState } from 'react';
import AddItemModal from './AddItemModal';
import toast from 'react-hot-toast';

const initialServices = [
  { title: 'Insulation and Cladding', img: '/images/cladding.jpg', price: 299.99 },
  { title: 'Cold Box Insulation and Cladding', img: '/images/cbiac.jpg', price: 349.99 },
  { title: 'Equipment Foundation Coating', img: '/images/equipment foundation coating.png', price: 279.99 },
  { title: 'Welding and Fabrication', img: '/images/wf.jpg', price: 449.99 },
  { title: 'Cooler Tube Replacement', img: '/images/ctr.jpg', price: 379.99 },
  { title: 'Vacuum Insulated Piping Installation (VIP)', img: '/images/VIP.jpg', price: 599.99 },
  { title: 'Liquid Nitrogen Piping', img: '/images/lnp.jpg', price: 499.99 },
  { title: 'Crack Detection Test', img: '/images/cdt.jpg', price: 329.99 },
  { title: 'Repainting', img: '/images/Repainting.jpg', price: 249.99 },
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

const SERVICE_STORAGE_KEY = 'adminOrderspage_services';
const PRODUCT_STORAGE_KEY = 'adminOrderspage_products';

function loadServicesFromStorage() {
  try {
    const saved = localStorage.getItem(SERVICE_STORAGE_KEY);
    return saved ? JSON.parse(saved) : initialServices;
  } catch {
    return initialServices;
  }
}

function loadProductsFromStorage() {
  try {
    const saved = localStorage.getItem(PRODUCT_STORAGE_KEY);
    return saved ? JSON.parse(saved) : initialProducts;
  } catch {
    return initialProducts;
  }
}

export default function Orderspage({ user, onAddToCart }) {
  const [services, setServices] = useState(loadServicesFromStorage);
  const [products, setProducts] = useState(loadProductsFromStorage);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    const handleStorage = (event) => {
      if (event.key === SERVICE_STORAGE_KEY && event.newValue) {
        try {
          setServices(JSON.parse(event.newValue));
        } catch {
          // ignore invalid JSON
        }
      }

      if (event.key === PRODUCT_STORAGE_KEY && event.newValue) {
        try {
          setProducts(JSON.parse(event.newValue));
        } catch {
          // ignore invalid JSON
        }
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const handleAddToCart = (item) => {
    if (!user) {
      toast.error('Please login to add items to cart');
      return;
    }
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  const handleConfirmAddToCart = (itemWithQuantity) => {
    onAddToCart(itemWithQuantity);
    setIsModalOpen(false);
    setSelectedItem(null);
    setToastMessage(`Added to cart successfully!`);
    setTimeout(() => setToastMessage(''), 3500);
  };

  const GreenButton = ({ onClick }) => (
    <button
      onClick={onClick}
      style={{
        background: 'var(--green)',
        border: 'none',
        color: 'white',
        width: '100%',
        padding: '12px',
        borderRadius: '8px',
        cursor: 'pointer',
        fontSize: '15px',
        fontWeight: 'bold',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'background-color 0.2s',
        marginTop: 'auto'
      }}
      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--green-hover)'}
      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--green)'}
      title="Add to cart"
    >
      Add to Cart
    </button>
  );

  return (
    <div style={{ padding: '20px 32px', maxWidth: '1400px', margin: '0 auto', position: 'relative' }}>

      {/* Services Section */}
      <div style={{ marginBottom: '64px' }}>
        <h2 style={{
          textAlign: 'center',
          marginBottom: '48px',
          fontSize: '36px',
          fontWeight: '800',
          color: 'var(--text)',
          letterSpacing: '-1px'
        }}>
          Services
        </h2>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '32px',
          alignItems: 'stretch'
        }}>
          {services.map((service, idx) => (
            <div
              key={idx}
              className="modern-shadow hover-lift"
              style={{
                background: 'var(--card-bg)',
                borderRadius: '16px',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                border: '1px solid var(--border)'
              }}>
              <div style={{ height: '200px', overflow: 'hidden', backgroundColor: '#f8fafc' }}>
                <img
                  src={service.img}
                  alt={service.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s ease' }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                />
              </div>
              <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', flexGrow: 1, alignItems: 'center' }}>
                <h3 style={{ margin: '0 0 12px 0', fontSize: '18px', fontWeight: '700', color: 'var(--text)', textAlign: 'center', lineHeight: '1.4' }}>{service.title}</h3>
                <p style={{ fontSize: '24px', fontWeight: '800', color: 'var(--green)', margin: '0 0 24px 0' }}>₱ {service.price.toFixed(2)}</p>
                <GreenButton onClick={() => handleAddToCart({ title: service.title, description: 'Service', img: service.img, price: service.price })} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Products Section */}
      <div>
        <h2 style={{
          textAlign: 'center',
          marginBottom: '48px',
          fontSize: '36px',
          fontWeight: '800',
          color: 'var(--text)',
          letterSpacing: '-1px'
        }}>
          Products
        </h2>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '32px',
          alignItems: 'stretch',
          paddingBottom: '48px'
        }}>
          {products.slice(0, 2).map((product, idx) => (
            <div
              key={idx}
              className="modern-shadow hover-lift"
              style={{
                background: 'var(--card-bg)',
                borderRadius: '16px',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                border: '1px solid var(--border)'
              }}>
              <div style={{ height: '200px', overflow: 'hidden', backgroundColor: '#f8fafc' }}>
                <img
                  src={product.img}
                  alt={product.title}
                  style={{ width: '100%', height: '100%', objectFit: '', transition: 'transform 0.5s ease' }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                />
              </div>
              <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', flexGrow: 1, alignItems: 'center' }}>
                <h3 style={{ margin: '0 0 12px 0', fontSize: '25px', fontWeight: '700', color: 'var(--text)', textAlign: 'center', lineHeight: '1.4' }}>{product.title}</h3>

              </div>
            </div>
          ))}
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '32px',
          alignItems: 'stretch'
        }}>
          {products.slice(2).map((product, idx) => (
            <div
              key={idx}
              className="modern-shadow hover-lift"
              style={{
                background: 'var(--card-bg)',
                borderRadius: '16px',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                border: '1px solid var(--border)'
              }}>
              <div style={{ height: '200px', overflow: 'hidden', backgroundColor: '#f8fafc' }}>
                <img
                  src={product.img}
                  alt={product.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s ease' }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                />
              </div>
              <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', flexGrow: 1, alignItems: 'center' }}>
                <h3 style={{ margin: '0 0 12px 0', fontSize: '18px', fontWeight: '700', color: 'var(--text)', textAlign: 'center', lineHeight: '1.4' }}>{product.title}</h3>
                <p style={{ fontSize: '24px', fontWeight: '800', color: 'var(--green)', margin: '0 0 24px 0' }}>₱ {product.price.toFixed(2)}</p>
                <GreenButton onClick={() => handleAddToCart({ title: product.title, description: 'Product', img: product.img, price: product.price })} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <AddItemModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedItem(null);
        }}
        item={selectedItem}
        onAddToCart={handleConfirmAddToCart}
      />

      {/* Modern Toast Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          bottom: '32px',
          right: '32px',
          background: 'var(--green)',
          color: 'white',
          padding: '16px 24px',
          borderRadius: '12px',
          boxShadow: '0 10px 30px rgba(4, 171, 12, 0.4)',
          zIndex: 9999,
          fontWeight: '700',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          fontSize: '16px'
        }}>
          <span style={{ fontSize: '22px' }}>✅</span>
          {toastMessage}
        </div>
      )}
    </div>
  );
}
