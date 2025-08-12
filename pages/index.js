import React, { useState } from 'react';

// Simple icon components
const BellIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);

const AlertIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

export default function CertTracker() {
  const [employees, setEmployees] = useState([
    {
      id: 1,
      name: "Sarah Johnson",
      role: "RN",
      email: "sarah.j@clinic.com",
      certifications: [
        { id: 1, name: "CPR Certification", expiry: "2025-09-15", issuer: "Red Cross" },
        { id: 2, name: "RN License", expiry: "2025-08-30", issuer: "State Board" }
      ]
    }
  ]);

  const [showAddEmployee, setShowAddEmployee] = useState(false);
  const [newEmployee, setNewEmployee] = useState({ name: '', role: '', email: '' });

  const getDaysUntilExpiry = (date) => {
    const today = new Date();
    const expiry = new Date(date);
    const diffTime = expiry - today;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getExpiringCount = () => {
    let expired = 0;
    let critical = 0;
    employees.forEach(emp => {
      emp.certifications.forEach(cert => {
        const days = getDaysUntilExpiry(cert.expiry);
        if (days < 0) expired++;
        else if (days <= 30) critical++;
      });
    });
    return { expired, critical };
  };

  const addEmployee = () => {
    if (newEmployee.name && newEmployee.role) {
      setEmployees([...employees, {
        id: Date.now(),
        ...newEmployee,
        certifications: []
      }]);
      setNewEmployee({ name: '', role: '', email: '' });
      setShowAddEmployee(false);
    }
  };

  const counts = getExpiringCount();

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5', fontFamily: 'system-ui' }}>
      {/* Header */}
      <div style={{ background: 'white', padding: '20px', borderBottom: '1px solid #e5e7eb' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{ background: '#3b82f6', color: 'white', padding: '10px', borderRadius: '8px' }}>
              ✓
            </div>
            <div>
              <h1 style={{ fontSize: '24px', margin: 0 }}>CertTracker Pro</h1>
              <p style={{ color: '#6b7280', fontSize: '14px', margin: 0 }}>Healthcare Compliance</p>
            </div>
          </div>
          <div style={{ position: 'relative' }}>
            <BellIcon />
            {(counts.expired + counts.critical) > 0 && (
              <span style={{
                position: 'absolute',
                top: '-8px',
                right: '-8px',
                background: '#ef4444',
                color: 'white',
                borderRadius: '50%',
                padding: '2px 6px',
                fontSize: '12px'
              }}>
                {counts.expired + counts.critical}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
        {/* Alert Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px', marginBottom: '20px' }}>
          <div style={{ background: 'white', padding: '20px', borderRadius: '8px', borderLeft: '4px solid #ef4444' }}>
            <p style={{ color: '#991b1b', fontSize: '14px' }}>Expired</p>
            <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#ef4444' }}>{counts.expired}</p>
          </div>
          <div style={{ background: 'white', padding: '20px', borderRadius: '8px', borderLeft: '4px solid #fb923c' }}>
            <p style={{ color: '#9a3412', fontSize: '14px' }}>Critical (30 days)</p>
            <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#fb923c' }}>{counts.critical}</p>
          </div>
        </div>

        {/* Employee Section */}
        <div style={{ background: 'white', borderRadius: '10px', padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '20px', margin: 0 }}>Employee Certifications</h2>
            <button
              onClick={() => setShowAddEmployee(true)}
              style={{
                background: '#3b82f6',
                color: 'white',
                padding: '10px 20px',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              + Add Employee
            </button>
          </div>

          {/* Employee List */}
          {employees.map(emp => (
            <div key={emp.id} style={{ background: '#f9fafb', padding: '20px', borderRadius: '8px', marginBottom: '15px' }}>
              <h3 style={{ margin: '0 0 10px 0' }}>{emp.name} - {emp.role}</h3>
              {emp.certifications.map(cert => {
                const days = getDaysUntilExpiry(cert.expiry);
                const bgColor = days < 0 ? '#fee2e2' : days <= 30 ? '#fed7aa' : '#dbeafe';
                const textColor = days < 0 ? '#991b1b' : days <= 30 ? '#9a3412' : '#1e3a8a';
                
                return (
                  <div key={cert.id} style={{ 
                    background: bgColor, 
                    color: textColor, 
                    padding: '12px', 
                    borderRadius: '6px', 
                    marginBottom: '8px',
                    display: 'flex',
                    justifyContent: 'space-between'
                  }}>
                    <span>{cert.name}</span>
                    <span style={{ fontWeight: 'bold' }}>
                      {days < 0 ? `Expired ${Math.abs(days)} days ago` : `${days} days`}
                    </span>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Add Employee Modal */}
      {showAddEmployee && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{ background: 'white', padding: '30px', borderRadius: '10px', width: '400px' }}>
            <h3>Add New Employee</h3>
            <input
              type="text"
              placeholder="Full Name"
              value={newEmployee.name}
              onChange={(e) => setNewEmployee({...newEmployee, name: e.target.value})}
              style={{ width: '100%', padding: '10px', margin: '10px 0', border: '1px solid #ddd', borderRadius: '6px' }}
            />
            <input
              type="text"
              placeholder="Role (RN, CNA, etc.)"
              value={newEmployee.role}
              onChange={(e) => setNewEmployee({...newEmployee, role: e.target.value})}
              style={{ width: '100%', padding: '10px', margin: '10px 0', border: '1px solid #ddd', borderRadius: '6px' }}
            />
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button
                onClick={addEmployee}
                style={{ flex: 1, background: '#3b82f6', color: 'white', padding: '10px', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
              >
                Add
              </button>
              <button
                onClick={() => setShowAddEmployee(false)}
                style={{ flex: 1, background: '#e5e7eb', padding: '10px', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
