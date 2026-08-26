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
    description: 'Advanced LNG (Liquefied Natural Gas) pumps for efficient cryogenic fluid transfer. Designed to perform in extreme cold conditions with reliability and efficiency.',
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

const PRODUCT_STORAGE_KEY = 'adminProduct_products';

function loadProductsFromStorage() {
  try {
    const saved = localStorage.getItem(PRODUCT_STORAGE_KEY);
    return saved ? JSON.parse(saved) : initialProducts;
  } catch {
    return initialProducts;
  }
}

export default function Product() {
  const [products, setProducts] = useState(loadProductsFromStorage);

  useEffect(() => {
    const handleStorage = (event) => {
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

  return (
    <div style={{ padding: '20px 35px', maxWidth: '1400px', margin: '0 auto' }}>
      <h2 style={{
        textAlign: 'center',
        marginBottom: '48px',
        fontSize: '36px',
        fontWeight: '800',
        color: 'var(--text)',
        letterSpacing: '-1px'
      }}>
        Types Of Products
      </h2>

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
              border: '1px solid var(--border)'
            }}
          >
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
