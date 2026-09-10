import React, { useEffect, useState } from 'react';
import { persistItemList, readImageAsDataUrl } from '../storageUtils';

const initialServicesData = [
  {
    title: "Insulation and Cladding",
    img: "/images/cladding.jpg",
    desc: "Insulation and cladding involve installing thermal insulating materials around pipes, tanks, and equipment to control temperature and improve energy efficiency. Cladding is the protective outer covering (usually metal sheets) that shields the insulation from weather, moisture, and mechanical damage."
  },
  {
    title: "Cold Box Insulation and Cladding",
    img: "/images/cbiac.jpg",
    desc: "Cold box insulation and cladding refer to insulating and protecting cryogenic systems used in low-temperature processes. Proper insulation minimizes heat gain, prevents condensation, and ensures efficient operation of equipment handling extremely cold fluids."
  },
  {
    title: "Equipment Foundation Coating",
    img: "/images/equipment foundation coating.png",
    desc: "Equipment foundation coating involves applying protective coatings to concrete or steel foundations that support machinery. This protects against corrosion, chemical exposure, moisture penetration, and structural deterioration, extending the lifespan of the foundation."
  },
  {
    title: "Welding and Fabrication",
    img: "/images/wf.jpg",
    desc: "Welding and fabrication include cutting, shaping, assembling, and joining metal components to build or repair structures and mechanical systems. This service ensures strong, precise, and durable metal constructions for industrial applications."
  },
  {
    title: "Cooler Tube Replacement",
    img: "/images/ctr.jpg",
    desc: "Cooler tube replacement is the process of removing worn or damaged tubes in heat exchangers or cooling units and installing new ones. This restores efficient heat transfer and prevents leakage or system failure."
  },
  {
    title: "Vacuum Insulated Piping Installation (VIP)",
    img: "/images/vip.jpg",
    desc: "Vacuum insulated piping (VIP) installation involves setting up specialized piping systems designed to reduce heat transfer using a vacuum layer. These systems are commonly used for transporting cryogenic liquids while maintaining extremely low temperatures."
  },
  {
    title: "Liquid Nitrogen Piping",
    img: "/images/lnp.jpg",
    desc: "Liquid nitrogen piping involves designing and installing pipelines that safely transport liquid nitrogen at very low temperatures. These systems require special materials and insulation to handle cryogenic conditions safely and efficiently."
  },
  {
    title: "Crack Detection Test",
    img: "/images/cdt.jpg",
    desc: "Crack detection testing is a non-destructive testing (NDT) method used to identify surface or internal cracks in materials. Techniques such as ultrasonic, magnetic particle, or dye penetrant testing help ensure structural safety and reliability."
  },
  {
    title: "Repainting",
    img: "/images/repainting.jpg",
    desc: "Repainting involves applying protective and decorative coatings to equipment, structures, or pipelines. It helps prevent corrosion, improve appearance, and extend the service life of industrial assets."
  },
  {
    title: "Professional Mechanical Engineer Consultancy",
    img: "/images/pmec.jpg",
    desc: "Professional Mechanical Engineer consultancy provides expert guidance in designing, evaluating, and troubleshooting mechanical systems. It ensures projects meet safety standards, technical requirements, and operational efficiency."
  }
];

export default function AdminService() {
  const [servicesData, setServicesData] = useState(() => {
    try {
      const saved = localStorage.getItem('adminService_services');
      return saved ? JSON.parse(saved) : initialServicesData;
    } catch {
      return initialServicesData;
    }
  });
  const [isAdding, setIsAdding] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [newService, setNewService] = useState({
    title: '',
    img: '',
    desc: ''
  });

  useEffect(() => {
    persistItemList('adminService_services', servicesData);
  }, [servicesData]);

  const handleAddService = () => {
    if (newService.title && newService.desc) {
      const serviceToAdd = {
        ...newService,
        img: newService.img || '/images/default.jpg'
      };
      setServicesData([...servicesData, serviceToAdd]);
      setNewService({ title: '', img: '', desc: '' });
      setIsAdding(false);
    }
  };

  const handleDeleteService = (index) => {
    if (window.confirm('Are you sure you want to delete this service?')) {
      const updatedServices = servicesData.filter((_, i) => i !== index);
      setServicesData(updatedServices);
    }
  };

  const handleEditService = (index) => {
    setEditingIndex(index);
    setNewService(servicesData[index]);
  };

  const handleUpdateService = () => {
    if (newService.title && newService.desc) {
      const updatedServices = [...servicesData];
      updatedServices[editingIndex] = {
        ...newService,
        img: newService.img || '/images/default.jpg'
      };
      setServicesData(updatedServices);
      setEditingIndex(null);
      setNewService({ title: '', img: '', desc: '' });
    }
  };

  const handleImageFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    readImageAsDataUrl(file).then((image) => {
      setNewService((prev) => ({ ...prev, img: image }));
    }).catch(() => {});
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingIndex(null);
    setNewService({ title: '', img: '', desc: '' });
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
          Admin - Services Management
        </h2>
        <button
          onClick={() => setIsAdding(true)}
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
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
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
          Add New Service
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
              {isAdding ? 'Add New Service' : 'Edit Service'}
            </h3>
            <div style={{ display: 'grid', gap: '16px' }}>
              <input
                type="text"
                placeholder="Service Title"
                value={newService.title}
                onChange={(e) => setNewService({ ...newService, title: e.target.value })}
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
              {newService.img && (
                <img
                  src={newService.img}
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
                placeholder="Service Description"
                value={newService.desc}
                onChange={(e) => setNewService({ ...newService, desc: e.target.value })}
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
                  onClick={isAdding ? handleAddService : handleUpdateService}
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
                  {isAdding ? 'Add Service' : 'Update Service'}
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
        {servicesData.map((service, index) => (
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
            <div style={{
              position: 'absolute',
              top: '12px',
              right: '12px',
              display: 'flex',
              gap: '8px',
              zIndex: 10
            }}>
              <button
                onClick={() => handleEditService(index)}
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
                onClick={() => handleDeleteService(index)}
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
                src={service.img}
                alt={service.title}
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
                {service.title}
              </h3>
              <p style={{
                margin: '0',
                color: 'var(--text-light)',
                lineHeight: '1.7',
                fontSize: '15px',
                flexGrow: 1
              }}>
                {service.desc}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}