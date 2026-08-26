import React, { useState, useEffect } from 'react';

export default function JobOrderModal({ isOpen, onClose, onSave, jobOrderToEdit }) {
  const [customerName, setCustomerName] = useState('');
  const [position, setPosition] = useState('');
  const [company, setCompany] = useState('');
  const [address, setAddress] = useState('');
  const [jobType, setJobType] = useState('');
  const [manpower, setManpower] = useState('');
  const [contractLength, setContractLength] = useState('');
  const [companyId, setCompanyId] = useState(null);
  const [businessLicense, setBusinessLicense] = useState(null);

  useEffect(() => {
    if (jobOrderToEdit) {
      setCustomerName(jobOrderToEdit.customerName || '');
      setPosition(jobOrderToEdit.position || '');
      setCompany(jobOrderToEdit.company || '');
      setAddress(jobOrderToEdit.address || '');
      setJobType(jobOrderToEdit.jobType || '');
      setManpower(jobOrderToEdit.manpower || '');
      setContractLength(jobOrderToEdit.contractLength || '');
      setCompanyId(jobOrderToEdit.companyId || null);
      setBusinessLicense(jobOrderToEdit.businessLicense || null);
    } else {
      setCustomerName('');
      setPosition('');
      setCompany('');
      setAddress('');
      setJobType('');
      setManpower('');
      setContractLength('');
      setCompanyId(null);
      setBusinessLicense(null);
    }
  }, [jobOrderToEdit]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (customerName && position && company && address && jobType && manpower && contractLength) {
      onSave({
        customerName,
        position,
        company,
        address,
        jobType,
        manpower: parseInt(manpower),
        contractLength,
        companyId: companyId ? (typeof companyId === 'string' ? companyId : companyId.data) : null,
        businessLicense: businessLicense ? (typeof businessLicense === 'string' ? businessLicense : businessLicense.data) : null
      });
      onClose();
    }
  };

  const handleFileChange = (e, setter) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setter({ name: file.name, data: reader.result });
      };
      reader.readAsDataURL(file);
    } else {
      setter(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content job-order-modal" onClick={(e) => e.stopPropagation()}>
        <h3>{jobOrderToEdit ? 'Edit Job Order' : 'Add Job Order'}</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Customer Name: </label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Position:  </label>
            <input
              type="text"
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Company: </label>
            <input
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Address:</label>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Type of Job Order:</label>
            <select
              value={jobType}
              onChange={(e) => setJobType(e.target.value)}
              required
            >
              <option value="">Select Job Type</option>
              <option value="Construction">Construction</option>
              <option value="Maintenance">Maintenance</option>
              <option value="Installation">Installation</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div className="form-group">
            <label>Number of Manpower:</label>
            <input
              type="number"
              value={manpower}
              onChange={(e) => setManpower(e.target.value)}
              min="1"
              required
            />
          </div>
          <div className="form-group">
            <label>Length of Contract:</label>
            <input
              type="text"
              value={contractLength}
              onChange={(e) => setContractLength(e.target.value)}
              placeholder="e.g., 6 months, 1 year"
              required
            />
          </div>
          <div className="form-group">
            <label>Company ID:</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleFileChange(e, setCompanyId)}
            />
            {companyId && <span>{companyId.name}</span>}
          </div>
          <div className="form-group">
            <label>Business License:</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleFileChange(e, setBusinessLicense)}
            />
            {businessLicense && <span>{businessLicense.name}</span>}
          </div>
          <div className="modal-actions">
            <button type="button" onClick={onClose}>Cancel</button>
            <button type="submit">{jobOrderToEdit ? 'Update' : 'Add'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
