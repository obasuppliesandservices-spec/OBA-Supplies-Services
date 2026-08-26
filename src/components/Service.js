import React, { useEffect, useState } from 'react';

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

const SERVICE_STORAGE_KEY = 'adminService_services';

function loadServicesFromStorage() {
  try {
    const saved = localStorage.getItem(SERVICE_STORAGE_KEY);
    return saved ? JSON.parse(saved) : initialServicesData;
  } catch {
    return initialServicesData;
  }
}

export default function Service() {
  const [servicesData, setServicesData] = useState(loadServicesFromStorage);

  useEffect(() => {
    const handleStorage = (event) => {
      if (event.key === SERVICE_STORAGE_KEY && event.newValue) {
        try {
          setServicesData(JSON.parse(event.newValue));
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
        Types Of Services We Offer
      </h2>

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
              border: '1px solid var(--border)'
            }}
          >
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
