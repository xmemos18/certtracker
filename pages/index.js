import React, { useState, useEffect } from 'react';

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
  const [employees, setEmployees] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [showAuth, setShowAuth] = useState('login'); // 'login', 'register', or null
  const [authForm, setAuthForm] = useState({ email: '', password: '', name: '', role: 'admin' });
  const [demoMode, setDemoMode] = useState(false);

  const [showAddEmployee, setShowAddEmployee] = useState(false);
  const [newEmployee, setNewEmployee] = useState({ name: '', role: '', email: '' });
  const [showAddCert, setShowAddCert] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(null);
  const [newCert, setNewCert] = useState({ name: '', expiry: '', issuer: '' });
  const [editingCert, setEditingCert] = useState(null);

  // Load data from localStorage on component mount
  useEffect(() => {
    // Check for logged in user
    const savedUser = localStorage.getItem('certtracker-user');
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
      setShowAuth(null);
    }

    const savedEmployees = localStorage.getItem('certtracker-employees');
    if (savedEmployees) {
      setEmployees(JSON.parse(savedEmployees));
    } else {
      // Initialize with sample data if no saved data exists
      const sampleData = [
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
      ];
      setEmployees(sampleData);
      localStorage.setItem('certtracker-employees', JSON.stringify(sampleData));
    }
    setIsLoaded(true);
  }, []);

  // Save to localStorage whenever employees data changes
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('certtracker-employees', JSON.stringify(employees));
    }
  }, [employees, isLoaded]);

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

  const addCertification = () => {
    if (newCert.name && newCert.expiry && selectedEmployeeId) {
      setEmployees(employees.map(emp => 
        emp.id === selectedEmployeeId 
          ? {
              ...emp,
              certifications: [...emp.certifications, {
                id: Date.now(),
                ...newCert
              }]
            }
          : emp
      ));
      setNewCert({ name: '', expiry: '', issuer: '' });
      setShowAddCert(false);
      setSelectedEmployeeId(null);
    }
  };

  const editCertification = () => {
    if (editingCert && editingCert.name && editingCert.expiry) {
      setEmployees(employees.map(emp => ({
        ...emp,
        certifications: emp.certifications.map(cert =>
          cert.id === editingCert.id ? editingCert : cert
        )
      })));
      setEditingCert(null);
    }
  };

  const deleteCertification = (employeeId, certId) => {
    if (confirm('Are you sure you want to delete this certification?')) {
      setEmployees(employees.map(emp => 
        emp.id === employeeId 
          ? {
              ...emp,
              certifications: emp.certifications.filter(cert => cert.id !== certId)
            }
          : emp
      ));
    }
  };

  const deleteEmployee = (employeeId) => {
    if (confirm('Are you sure you want to delete this employee and all their certifications?')) {
      setEmployees(employees.filter(emp => emp.id !== employeeId));
    }
  };

  // Authentication functions
  const handleLogin = () => {
    const users = JSON.parse(localStorage.getItem('certtracker-users') || '[]');
    const user = users.find(u => u.email === authForm.email && u.password === authForm.password);
    
    if (user) {
      setCurrentUser(user);
      localStorage.setItem('certtracker-user', JSON.stringify(user));
      setShowAuth(null);
      setAuthForm({ email: '', password: '', name: '', role: 'admin' });
    } else {
      alert('Invalid email or password');
    }
  };

  const handleRegister = () => {
    if (!authForm.email || !authForm.password || !authForm.name) {
      alert('Please fill in all fields');
      return;
    }

    const users = JSON.parse(localStorage.getItem('certtracker-users') || '[]');
    
    if (users.find(u => u.email === authForm.email)) {
      alert('User with this email already exists');
      return;
    }

    const newUser = {
      id: Date.now(),
      email: authForm.email,
      password: authForm.password, // In production, this should be hashed
      name: authForm.name,
      role: authForm.role
    };

    users.push(newUser);
    localStorage.setItem('certtracker-users', JSON.stringify(users));
    
    setCurrentUser(newUser);
    localStorage.setItem('certtracker-user', JSON.stringify(newUser));
    setShowAuth(null);
    setAuthForm({ email: '', password: '', name: '', role: 'admin' });
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('certtracker-user');
    setShowAuth('login');
  };

  // Demo mode functions
  const enterDemoMode = () => {
    const demoUser = {
      id: 'demo',
      name: 'Demo Admin',
      email: 'demo@certtracker.com',
      role: 'admin'
    };
    setCurrentUser(demoUser);
    setDemoMode(true);
    setShowAuth(null);
  };

  const exitDemoMode = () => {
    setCurrentUser(null);
    setDemoMode(false);
    setShowAuth('login');
  };

  // Role-based permissions
  const canManageEmployees = () => demoMode || currentUser.role === 'admin' || currentUser.role === 'manager';
  const canManageCertifications = () => demoMode || currentUser.role === 'admin' || currentUser.role === 'manager';
  const canDeleteData = () => demoMode || currentUser.role === 'admin';

  const counts = getExpiringCount();

  // Show loading state until data is loaded
  if (!isLoaded) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        background: '#f5f5f5', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        fontFamily: 'system-ui'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            background: '#3b82f6', 
            color: 'white', 
            padding: '20px', 
            borderRadius: '50%', 
            width: '60px', 
            height: '60px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            margin: '0 auto 20px'
          }}>
            ✓
          </div>
          <h2 style={{ color: '#374151' }}>Loading CertTracker...</h2>
        </div>
      </div>
    );
  }

  // Show authentication screen if not logged in
  if (!currentUser) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        fontFamily: 'system-ui',
        padding: '20px'
      }}>
        <div style={{ 
          background: 'white', 
          padding: '40px', 
          borderRadius: '12px', 
          width: '100%', 
          maxWidth: '400px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <div style={{ 
              background: '#3b82f6', 
              color: 'white', 
              padding: '15px', 
              borderRadius: '50%', 
              width: '60px', 
              height: '60px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              margin: '0 auto 15px',
              fontSize: '24px'
            }}>
              ✓
            </div>
            <h1 style={{ margin: 0, color: '#1f2937' }}>CertTracker Pro</h1>
            <p style={{ color: '#6b7280', margin: '5px 0 0 0' }}>Healthcare Compliance Management</p>
          </div>

          {showAuth === 'login' ? (
            <div>
              <h2 style={{ textAlign: 'center', color: '#374151', marginBottom: '20px' }}>Sign In</h2>
              <input
                type="email"
                placeholder="Email"
                value={authForm.email}
                onChange={(e) => setAuthForm({...authForm, email: e.target.value})}
                style={{ 
                  width: '100%', 
                  padding: '12px', 
                  margin: '10px 0', 
                  border: '2px solid #e5e7eb', 
                  borderRadius: '8px',
                  fontSize: '16px'
                }}
              />
              <input
                type="password"
                placeholder="Password"
                value={authForm.password}
                onChange={(e) => setAuthForm({...authForm, password: e.target.value})}
                style={{ 
                  width: '100%', 
                  padding: '12px', 
                  margin: '10px 0', 
                  border: '2px solid #e5e7eb', 
                  borderRadius: '8px',
                  fontSize: '16px'
                }}
              />
              <button
                onClick={handleLogin}
                style={{ 
                  width: '100%', 
                  background: '#3b82f6', 
                  color: 'white', 
                  padding: '12px', 
                  border: 'none', 
                  borderRadius: '8px', 
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  marginTop: '20px'
                }}
              >
                Sign In
              </button>
              <p style={{ textAlign: 'center', marginTop: '20px', color: '#6b7280' }}>
                Don't have an account?{' '}
                <button
                  onClick={() => setShowAuth('register')}
                  style={{ 
                    background: 'none', 
                    border: 'none', 
                    color: '#3b82f6', 
                    cursor: 'pointer',
                    textDecoration: 'underline'
                  }}
                >
                  Sign up
                </button>
              </p>
              
              {/* Demo Mode Button */}
              <div style={{ textAlign: 'center', marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #e5e7eb' }}>
                <button
                  onClick={enterDemoMode}
                  style={{
                    background: '#f59e0b',
                    color: 'white',
                    padding: '12px 24px',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    width: '100%'
                  }}
                >
                  🚀 Try Demo Mode (No Login Required)
                </button>
                <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '8px' }}>
                  Test all features instantly • Full admin access • No registration needed
                </p>
              </div>
            </div>
          ) : (
            <div>
              <h2 style={{ textAlign: 'center', color: '#374151', marginBottom: '20px' }}>Create Account</h2>
              <input
                type="text"
                placeholder="Full Name"
                value={authForm.name}
                onChange={(e) => setAuthForm({...authForm, name: e.target.value})}
                style={{ 
                  width: '100%', 
                  padding: '12px', 
                  margin: '10px 0', 
                  border: '2px solid #e5e7eb', 
                  borderRadius: '8px',
                  fontSize: '16px'
                }}
              />
              <input
                type="email"
                placeholder="Email"
                value={authForm.email}
                onChange={(e) => setAuthForm({...authForm, email: e.target.value})}
                style={{ 
                  width: '100%', 
                  padding: '12px', 
                  margin: '10px 0', 
                  border: '2px solid #e5e7eb', 
                  borderRadius: '8px',
                  fontSize: '16px'
                }}
              />
              <input
                type="password"
                placeholder="Password"
                value={authForm.password}
                onChange={(e) => setAuthForm({...authForm, password: e.target.value})}
                style={{ 
                  width: '100%', 
                  padding: '12px', 
                  margin: '10px 0', 
                  border: '2px solid #e5e7eb', 
                  borderRadius: '8px',
                  fontSize: '16px'
                }}
              />
              <select
                value={authForm.role}
                onChange={(e) => setAuthForm({...authForm, role: e.target.value})}
                style={{ 
                  width: '100%', 
                  padding: '12px', 
                  margin: '10px 0', 
                  border: '2px solid #e5e7eb', 
                  borderRadius: '8px',
                  fontSize: '16px'
                }}
              >
                <option value="admin">Administrator</option>
                <option value="manager">Manager</option>
                <option value="employee">Employee</option>
              </select>
              <button
                onClick={handleRegister}
                style={{ 
                  width: '100%', 
                  background: '#10b981', 
                  color: 'white', 
                  padding: '12px', 
                  border: 'none', 
                  borderRadius: '8px', 
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  marginTop: '20px'
                }}
              >
                Create Account
              </button>
              <p style={{ textAlign: 'center', marginTop: '20px', color: '#6b7280' }}>
                Already have an account?{' '}
                <button
                  onClick={() => setShowAuth('login')}
                  style={{ 
                    background: 'none', 
                    border: 'none', 
                    color: '#3b82f6', 
                    cursor: 'pointer',
                    textDecoration: 'underline'
                  }}
                >
                  Sign in
                </button>
              </p>
              
              {/* Demo Mode Button */}
              <div style={{ textAlign: 'center', marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #e5e7eb' }}>
                <button
                  onClick={enterDemoMode}
                  style={{
                    background: '#f59e0b',
                    color: 'white',
                    padding: '12px 24px',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    width: '100%'
                  }}
                >
                  🚀 Try Demo Mode (No Login Required)
                </button>
                <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '8px' }}>
                  Test all features instantly • Full admin access • No registration needed
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

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
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            {/* Notifications */}
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
            
            {/* User Info & Logout */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#374151' }}>
                  {currentUser.name}
                  {demoMode && <span style={{ marginLeft: '8px', fontSize: '12px', background: '#f59e0b', color: 'white', padding: '2px 6px', borderRadius: '4px' }}>DEMO</span>}
                </div>
                <div style={{ fontSize: '12px', color: '#6b7280', textTransform: 'capitalize' }}>
                  {currentUser.role}
                </div>
              </div>
              <button
                onClick={demoMode ? exitDemoMode : handleLogout}
                style={{
                  background: demoMode ? '#f59e0b' : '#ef4444',
                  color: 'white',
                  padding: '8px 16px',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                {demoMode ? 'Exit Demo' : 'Logout'}
              </button>
            </div>
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
            {canManageEmployees() && (
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
            )}
          </div>

          {/* Employee List */}
          {employees.map(emp => (
            <div key={emp.id} style={{ background: '#f9fafb', padding: '20px', borderRadius: '8px', marginBottom: '15px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <h3 style={{ margin: 0 }}>{emp.name} - {emp.role}</h3>
                <div style={{ display: 'flex', gap: '10px' }}>
                  {canManageCertifications() && (
                    <button
                      onClick={() => {
                        setSelectedEmployeeId(emp.id);
                        setShowAddCert(true);
                      }}
                      style={{
                        background: '#10b981',
                        color: 'white',
                        padding: '8px 12px',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      + Add Cert
                    </button>
                  )}
                  {canDeleteData() && (
                    <button
                      onClick={() => deleteEmployee(emp.id)}
                      style={{
                        background: '#ef4444',
                        color: 'white',
                        padding: '8px 12px',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
              
              {emp.certifications.length === 0 ? (
                <div style={{ 
                  color: '#6b7280', 
                  fontStyle: 'italic', 
                  textAlign: 'center', 
                  padding: '20px',
                  background: '#f3f4f6',
                  borderRadius: '6px'
                }}>
                  No certifications added yet
                </div>
              ) : (
                emp.certifications.map(cert => {
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
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <div>
                        <div style={{ fontWeight: 'bold' }}>{cert.name}</div>
                        <div style={{ fontSize: '12px', opacity: 0.8 }}>Issued by: {cert.issuer || 'N/A'}</div>
                        <div style={{ fontSize: '12px', opacity: 0.8 }}>Expires: {cert.expiry}</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontWeight: 'bold' }}>
                          {days < 0 ? `Expired ${Math.abs(days)} days ago` : `${days} days`}
                        </span>
                        {(canManageCertifications() || canDeleteData()) && (
                          <div style={{ display: 'flex', gap: '5px' }}>
                            {canManageCertifications() && (
                              <button
                                onClick={() => setEditingCert({...cert})}
                                style={{
                                  background: '#3b82f6',
                                  color: 'white',
                                  padding: '4px 8px',
                                  border: 'none',
                                  borderRadius: '3px',
                                  cursor: 'pointer',
                                  fontSize: '10px'
                                }}
                              >
                                Edit
                              </button>
                            )}
                            {canDeleteData() && (
                              <button
                                onClick={() => deleteCertification(emp.id, cert.id)}
                                style={{
                                  background: '#ef4444',
                                  color: 'white',
                                  padding: '4px 8px',
                                  border: 'none',
                                  borderRadius: '3px',
                                  cursor: 'pointer',
                                  fontSize: '10px'
                                }}
                              >
                                Del
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
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

      {/* Add Certification Modal */}
      {showAddCert && (
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
            <h3>Add New Certification</h3>
            <input
              type="text"
              placeholder="Certification Name (e.g., CPR Certification)"
              value={newCert.name}
              onChange={(e) => setNewCert({...newCert, name: e.target.value})}
              style={{ width: '100%', padding: '10px', margin: '10px 0', border: '1px solid #ddd', borderRadius: '6px' }}
            />
            <input
              type="date"
              placeholder="Expiry Date"
              value={newCert.expiry}
              onChange={(e) => setNewCert({...newCert, expiry: e.target.value})}
              style={{ width: '100%', padding: '10px', margin: '10px 0', border: '1px solid #ddd', borderRadius: '6px' }}
            />
            <input
              type="text"
              placeholder="Issuer (e.g., Red Cross, State Board)"
              value={newCert.issuer}
              onChange={(e) => setNewCert({...newCert, issuer: e.target.value})}
              style={{ width: '100%', padding: '10px', margin: '10px 0', border: '1px solid #ddd', borderRadius: '6px' }}
            />
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button
                onClick={addCertification}
                style={{ flex: 1, background: '#10b981', color: 'white', padding: '10px', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
              >
                Add Certification
              </button>
              <button
                onClick={() => {
                  setShowAddCert(false);
                  setSelectedEmployeeId(null);
                  setNewCert({ name: '', expiry: '', issuer: '' });
                }}
                style={{ flex: 1, background: '#e5e7eb', padding: '10px', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Certification Modal */}
      {editingCert && (
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
            <h3>Edit Certification</h3>
            <input
              type="text"
              placeholder="Certification Name"
              value={editingCert.name}
              onChange={(e) => setEditingCert({...editingCert, name: e.target.value})}
              style={{ width: '100%', padding: '10px', margin: '10px 0', border: '1px solid #ddd', borderRadius: '6px' }}
            />
            <input
              type="date"
              value={editingCert.expiry}
              onChange={(e) => setEditingCert({...editingCert, expiry: e.target.value})}
              style={{ width: '100%', padding: '10px', margin: '10px 0', border: '1px solid #ddd', borderRadius: '6px' }}
            />
            <input
              type="text"
              placeholder="Issuer"
              value={editingCert.issuer || ''}
              onChange={(e) => setEditingCert({...editingCert, issuer: e.target.value})}
              style={{ width: '100%', padding: '10px', margin: '10px 0', border: '1px solid #ddd', borderRadius: '6px' }}
            />
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button
                onClick={editCertification}
                style={{ flex: 1, background: '#3b82f6', color: 'white', padding: '10px', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
              >
                Save Changes
              </button>
              <button
                onClick={() => setEditingCert(null)}
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
