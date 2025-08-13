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
  const [authForm, setAuthForm] = useState({ email: '', password: '', name: '', role: 'employee', companyCode: '', managerCode: '' });
  const [demoMode, setDemoMode] = useState(false);

  const [showAddEmployee, setShowAddEmployee] = useState(false);
  const [newEmployee, setNewEmployee] = useState({ name: '', role: '', email: '' });
  const [showAddCert, setShowAddCert] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(null);
  const [newCert, setNewCert] = useState({ name: '', initialDate: '', expiry: '', issuer: '', licenseNumber: '' });
  const [editingCert, setEditingCert] = useState(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [companies, setCompanies] = useState([]);
  const [managerCodes, setManagerCodes] = useState([]);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [isCreatingCompany, setIsCreatingCompany] = useState(false);
  const [newManagerCode, setNewManagerCode] = useState({ name: '', code: '' });
  const [companyUsers, setCompanyUsers] = useState([]);
  const [showUserManagement, setShowUserManagement] = useState(false);

  // Load data from localStorage on component mount
  useEffect(() => {
    // Check for logged in user
    const savedUser = localStorage.getItem('certtracker-user');
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
      setShowAuth(null);
    }

    // Load companies and manager codes
    const savedCompanies = localStorage.getItem('certtracker-companies');
    if (savedCompanies) {
      setCompanies(JSON.parse(savedCompanies));
    }

    const savedManagerCodes = localStorage.getItem('certtracker-manager-codes');
    if (savedManagerCodes) {
      setManagerCodes(JSON.parse(savedManagerCodes));
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
          companyCode: "DEMO-CLINIC",
          managerCode: "MGR-DEMO",
          managerId: "demo-manager",
          certifications: [
            { id: 1, name: "CPR Certification", initialDate: "2023-09-15", expiry: "2025-09-15", issuer: "Red Cross", licenseNumber: "CPR123456" },
            { id: 2, name: "RN License", initialDate: "2023-08-30", expiry: "2025-08-30", issuer: "State Board", licenseNumber: "RN789012" }
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

  // Close notifications when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showNotifications && !event.target.closest('[data-notifications]')) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showNotifications]);

  // Load company-specific data when user changes
  useEffect(() => {
    if (currentUser && currentUser.role === 'admin') {
      loadCompanyUsers();
      
      // Load company-specific manager codes
      const allManagerCodes = JSON.parse(localStorage.getItem('certtracker-manager-codes') || '[]');
      const companyManagerCodes = allManagerCodes.filter(m => m.companyCode === currentUser.companyCode);
      setManagerCodes(companyManagerCodes);
    }
  }, [currentUser]);

  const getDaysUntilExpiry = (date) => {
    const today = new Date();
    const expiry = new Date(date);
    const diffTime = expiry - today;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getExpiringCount = (employeesToCheck = null) => {
    let expired = 0;
    let critical = 0;
    const employeeList = employeesToCheck || getFilteredEmployees();
    employeeList.forEach(emp => {
      emp.certifications.forEach(cert => {
        const days = getDaysUntilExpiry(cert.expiry);
        if (days < 0) expired++;
        else if (days <= 30) critical++;
      });
    });
    return { expired, critical };
  };

  const getExpiringCertifications = (employeesToCheck = null) => {
    const expiring = [];
    const employeeList = employeesToCheck || getFilteredEmployees();
    employeeList.forEach(emp => {
      emp.certifications.forEach(cert => {
        const days = getDaysUntilExpiry(cert.expiry);
        if (days <= 30) {
          expiring.push({
            ...cert,
            employeeName: emp.name,
            employeeRole: emp.role,
            days,
            status: days < 0 ? 'expired' : 'critical'
          });
        }
      });
    });
    return expiring.sort((a, b) => a.days - b.days);
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
      setNewCert({ name: '', initialDate: '', expiry: '', issuer: '', licenseNumber: '' });
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

    // Check if creating a new company
    if (isCreatingCompany) {
      if (!authForm.companyCode) {
        alert('Please enter a company code');
        return;
      }

      const companies = JSON.parse(localStorage.getItem('certtracker-companies') || '[]');
      if (companies.find(c => c.code === authForm.companyCode)) {
        alert('Company code already exists');
        return;
      }

      // Create new company
      const newCompany = {
        id: Date.now(),
        code: authForm.companyCode,
        name: authForm.name + "'s Company",
        createdBy: authForm.email,
        createdAt: new Date().toISOString()
      };

      companies.push(newCompany);
      localStorage.setItem('certtracker-companies', JSON.stringify(companies));
    } else {
      // Validate company and manager codes for existing company
      if (!authForm.companyCode) {
        alert('Please enter a company code');
        return;
      }

      const companies = JSON.parse(localStorage.getItem('certtracker-companies') || '[]');
      const company = companies.find(c => c.code === authForm.companyCode);
      if (!company) {
        alert('Invalid company code');
        return;
      }

      if (authForm.role === 'manager' && !authForm.managerCode) {
        alert('Please enter a manager code');
        return;
      }

      if (authForm.role === 'employee' && !authForm.managerCode) {
        alert('Please enter your manager code');
        return;
      }

      // Validate manager code exists
      if (authForm.managerCode) {
        const managerCodes = JSON.parse(localStorage.getItem('certtracker-manager-codes') || '[]');
        const managerCode = managerCodes.find(m => m.code === authForm.managerCode && m.companyCode === authForm.companyCode);
        if (!managerCode) {
          alert('Invalid manager code for this company');
          return;
        }
      }
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
      role: isCreatingCompany ? 'admin' : authForm.role,
      companyCode: authForm.companyCode,
      managerCode: authForm.managerCode || null,
      createdAt: new Date().toISOString()
    };

    users.push(newUser);
    localStorage.setItem('certtracker-users', JSON.stringify(users));
    
    setCurrentUser(newUser);
    localStorage.setItem('certtracker-user', JSON.stringify(newUser));
    setShowAuth(null);
    setAuthForm({ email: '', password: '', name: '', role: 'employee', companyCode: '', managerCode: '' });
    setIsCreatingCompany(false);
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
  const isAdmin = () => demoMode || currentUser.role === 'admin';

  // Filter employees based on user role and company
  const getFilteredEmployees = () => {
    if (demoMode) return employees;
    
    if (!currentUser) return [];

    // Admin sees all employees in their company
    if (currentUser.role === 'admin') {
      return employees.filter(emp => emp.companyCode === currentUser.companyCode);
    }

    // Manager sees only employees assigned to their manager code
    if (currentUser.role === 'manager') {
      return employees.filter(emp => 
        emp.companyCode === currentUser.companyCode && 
        emp.managerCode === currentUser.managerCode
      );
    }

    // Employee sees only themselves
    if (currentUser.role === 'employee') {
      return employees.filter(emp => emp.email === currentUser.email);
    }

    return [];
  };

  // Admin functions
  const loadCompanyUsers = () => {
    if (!currentUser || currentUser.role !== 'admin') return;
    
    const users = JSON.parse(localStorage.getItem('certtracker-users') || '[]');
    const companyUsers = users.filter(user => user.companyCode === currentUser.companyCode);
    setCompanyUsers(companyUsers);
  };

  const createManagerCode = () => {
    if (!newManagerCode.name || !newManagerCode.code) {
      alert('Please fill in both manager name and code');
      return;
    }

    const existingCodes = JSON.parse(localStorage.getItem('certtracker-manager-codes') || '[]');
    
    if (existingCodes.find(m => m.code === newManagerCode.code && m.companyCode === currentUser.companyCode)) {
      alert('Manager code already exists in your company');
      return;
    }

    const newCode = {
      id: Date.now(),
      name: newManagerCode.name,
      code: newManagerCode.code.toUpperCase(),
      companyCode: currentUser.companyCode,
      createdBy: currentUser.id,
      createdAt: new Date().toISOString()
    };

    existingCodes.push(newCode);
    localStorage.setItem('certtracker-manager-codes', JSON.stringify(existingCodes));
    setManagerCodes(existingCodes.filter(m => m.companyCode === currentUser.companyCode));
    setNewManagerCode({ name: '', code: '' });
  };

  const changeUserRole = (userId, newRole, newManagerCode = null) => {
    const users = JSON.parse(localStorage.getItem('certtracker-users') || '[]');
    const updatedUsers = users.map(user => {
      if (user.id === userId) {
        return {
          ...user,
          role: newRole,
          managerCode: newManagerCode
        };
      }
      return user;
    });

    localStorage.setItem('certtracker-users', JSON.stringify(updatedUsers));
    loadCompanyUsers();
  };

  const filteredEmployees = getFilteredEmployees();
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
              <h2 style={{ textAlign: 'center', color: '#374151', marginBottom: '20px' }}>
                {isCreatingCompany ? 'Create New Company' : 'Join Company'}
              </h2>
              
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
              
              <input
                type="text"
                placeholder={isCreatingCompany ? "Company Code (e.g., CLINIC-2024-ABC)" : "Company Code"}
                value={authForm.companyCode}
                onChange={(e) => setAuthForm({...authForm, companyCode: e.target.value.toUpperCase()})}
                style={{ 
                  width: '100%', 
                  padding: '12px', 
                  margin: '10px 0', 
                  border: '2px solid #e5e7eb', 
                  borderRadius: '8px',
                  fontSize: '16px'
                }}
              />

              {!isCreatingCompany && (
                <>
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
                    <option value="employee">Employee</option>
                    <option value="manager">Manager</option>
                  </select>

                  <input
                    type="text"
                    placeholder="Manager Code (from your manager)"
                    value={authForm.managerCode}
                    onChange={(e) => setAuthForm({...authForm, managerCode: e.target.value.toUpperCase()})}
                    style={{ 
                      width: '100%', 
                      padding: '12px', 
                      margin: '10px 0', 
                      border: '2px solid #e5e7eb', 
                      borderRadius: '8px',
                      fontSize: '16px'
                    }}
                  />
                </>
              )}
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
                {isCreatingCompany ? 'Create Company & Admin Account' : 'Join Company'}
              </button>
              
              <div style={{ textAlign: 'center', marginTop: '15px' }}>
                <button
                  onClick={() => setIsCreatingCompany(!isCreatingCompany)}
                  style={{ 
                    background: 'none', 
                    border: 'none', 
                    color: '#3b82f6', 
                    cursor: 'pointer',
                    textDecoration: 'underline',
                    fontSize: '14px'
                  }}
                >
                  {isCreatingCompany ? 'Join existing company instead' : 'Create new company instead'}
                </button>
              </div>

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
            <div style={{ position: 'relative' }} data-notifications>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  position: 'relative'
                }}
              >
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
              </button>

              {/* Notifications Dropdown */}
              {showNotifications && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: '8px',
                  background: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                  width: '320px',
                  maxHeight: '400px',
                  overflowY: 'auto',
                  zIndex: 50
                }}>
                  <div style={{ padding: '16px', borderBottom: '1px solid #e5e7eb' }}>
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold' }}>
                      Certification Alerts
                    </h3>
                  </div>
                  
                  {getExpiringCertifications().length === 0 ? (
                    <div style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>
                      <div style={{ marginBottom: '8px' }}>✅</div>
                      <div>All certifications are up to date!</div>
                    </div>
                  ) : (
                    <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                      {getExpiringCertifications().map((cert, index) => (
                        <div key={index} style={{
                          padding: '12px 16px',
                          borderBottom: index < getExpiringCertifications().length - 1 ? '1px solid #f3f4f6' : 'none',
                          background: cert.status === 'expired' ? '#fef2f2' : '#fef3c7'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#374151' }}>
                                {cert.name}
                              </div>
                              <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>
                                {cert.employeeName} ({cert.employeeRole})
                              </div>
                              <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>
                                Expires: {cert.expiry}
                              </div>
                            </div>
                            <div style={{
                              fontSize: '12px',
                              fontWeight: 'bold',
                              color: cert.status === 'expired' ? '#dc2626' : '#d97706',
                              textAlign: 'right'
                            }}>
                              {cert.days < 0 ? `${Math.abs(cert.days)} days ago` : `${cert.days} days left`}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
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
              
              {isAdmin() && (
                <button
                  onClick={() => setShowAdminPanel(true)}
                  style={{
                    background: '#8b5cf6',
                    color: 'white',
                    padding: '8px 16px',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  Admin Panel
                </button>
              )}
              
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
          {getFilteredEmployees().map(emp => (
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
                        <div style={{ fontSize: '12px', opacity: 0.8 }}>License: {cert.licenseNumber || 'N/A'}</div>
                        <div style={{ fontSize: '12px', opacity: 0.8 }}>Issued: {cert.initialDate || 'N/A'} | Expires: {cert.expiry}</div>
                        <div style={{ fontSize: '12px', opacity: 0.8 }}>Issuer: {cert.issuer || 'N/A'}</div>
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
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#374151' }}>
                Full Name *
              </label>
              <input
                type="text"
                placeholder="e.g., Sarah Johnson"
                value={newEmployee.name}
                onChange={(e) => setNewEmployee({...newEmployee, name: e.target.value})}
                style={{ width: '100%', padding: '12px', border: '2px solid #e5e7eb', borderRadius: '6px', fontSize: '14px' }}
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#374151' }}>
                Job Role *
              </label>
              <input
                type="text"
                placeholder="e.g., RN, CNA, Medical Assistant"
                value={newEmployee.role}
                onChange={(e) => setNewEmployee({...newEmployee, role: e.target.value})}
                style={{ width: '100%', padding: '12px', border: '2px solid #e5e7eb', borderRadius: '6px', fontSize: '14px' }}
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#374151' }}>
                Email Address
              </label>
              <input
                type="email"
                placeholder="e.g., sarah.johnson@clinic.com"
                value={newEmployee.email}
                onChange={(e) => setNewEmployee({...newEmployee, email: e.target.value})}
                style={{ width: '100%', padding: '12px', border: '2px solid #e5e7eb', borderRadius: '6px', fontSize: '14px' }}
              />
            </div>
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
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#374151' }}>
                Certification Name *
              </label>
              <input
                type="text"
                placeholder="e.g., CPR Certification, RN License"
                value={newCert.name}
                onChange={(e) => setNewCert({...newCert, name: e.target.value})}
                style={{ width: '100%', padding: '12px', border: '2px solid #e5e7eb', borderRadius: '6px', fontSize: '14px' }}
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#374151' }}>
                License/Certificate Number
              </label>
              <input
                type="text"
                placeholder="e.g., RN123456, CPR789012, CNA456789"
                value={newCert.licenseNumber}
                onChange={(e) => setNewCert({...newCert, licenseNumber: e.target.value})}
                style={{ width: '100%', padding: '12px', border: '2px solid #e5e7eb', borderRadius: '6px', fontSize: '14px' }}
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#374151' }}>
                Initial Date *
              </label>
              <input
                type="date"
                value={newCert.initialDate}
                onChange={(e) => setNewCert({...newCert, initialDate: e.target.value})}
                style={{ width: '100%', padding: '12px', border: '2px solid #e5e7eb', borderRadius: '6px', fontSize: '14px' }}
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#374151' }}>
                Expiration Date *
              </label>
              <input
                type="date"
                value={newCert.expiry}
                onChange={(e) => setNewCert({...newCert, expiry: e.target.value})}
                style={{ width: '100%', padding: '12px', border: '2px solid #e5e7eb', borderRadius: '6px', fontSize: '14px' }}
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#374151' }}>
                Issuing Organization
              </label>
              <input
                type="text"
                placeholder="e.g., American Red Cross, State Board of Nursing"
                value={newCert.issuer}
                onChange={(e) => setNewCert({...newCert, issuer: e.target.value})}
                style={{ width: '100%', padding: '12px', border: '2px solid #e5e7eb', borderRadius: '6px', fontSize: '14px' }}
              />
            </div>
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
                  setNewCert({ name: '', initialDate: '', expiry: '', issuer: '', licenseNumber: '' });
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
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#374151' }}>
                Certification Name *
              </label>
              <input
                type="text"
                placeholder="e.g., CPR Certification, RN License"
                value={editingCert.name}
                onChange={(e) => setEditingCert({...editingCert, name: e.target.value})}
                style={{ width: '100%', padding: '12px', border: '2px solid #e5e7eb', borderRadius: '6px', fontSize: '14px' }}
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#374151' }}>
                License/Certificate Number
              </label>
              <input
                type="text"
                placeholder="e.g., RN123456, CPR789012, CNA456789"
                value={editingCert.licenseNumber || ''}
                onChange={(e) => setEditingCert({...editingCert, licenseNumber: e.target.value})}
                style={{ width: '100%', padding: '12px', border: '2px solid #e5e7eb', borderRadius: '6px', fontSize: '14px' }}
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#374151' }}>
                Initial Date *
              </label>
              <input
                type="date"
                value={editingCert.initialDate || ''}
                onChange={(e) => setEditingCert({...editingCert, initialDate: e.target.value})}
                style={{ width: '100%', padding: '12px', border: '2px solid #e5e7eb', borderRadius: '6px', fontSize: '14px' }}
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#374151' }}>
                Expiration Date *
              </label>
              <input
                type="date"
                value={editingCert.expiry}
                onChange={(e) => setEditingCert({...editingCert, expiry: e.target.value})}
                style={{ width: '100%', padding: '12px', border: '2px solid #e5e7eb', borderRadius: '6px', fontSize: '14px' }}
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#374151' }}>
                Issuing Organization
              </label>
              <input
                type="text"
                placeholder="e.g., American Red Cross, State Board of Nursing"
                value={editingCert.issuer || ''}
                onChange={(e) => setEditingCert({...editingCert, issuer: e.target.value})}
                style={{ width: '100%', padding: '12px', border: '2px solid #e5e7eb', borderRadius: '6px', fontSize: '14px' }}
              />
            </div>
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

      {/* Admin Panel Modal */}
      {showAdminPanel && isAdmin() && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100
        }}>
          <div style={{ 
            background: 'white', 
            padding: '30px', 
            borderRadius: '12px', 
            width: '90%', 
            maxWidth: '800px',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
              <h2 style={{ margin: 0, color: '#374151' }}>Admin Panel - {currentUser.companyCode}</h2>
              <button
                onClick={() => setShowAdminPanel(false)}
                style={{
                  background: '#e5e7eb',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '8px 12px',
                  cursor: 'pointer'
                }}
              >
                ✕ Close
              </button>
            </div>

            <div style={{ display: 'flex', gap: '20px', marginBottom: '30px' }}>
              <button
                onClick={() => setShowUserManagement(false)}
                style={{
                  padding: '10px 20px',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  background: !showUserManagement ? '#8b5cf6' : '#e5e7eb',
                  color: !showUserManagement ? 'white' : '#374151'
                }}
              >
                Manager Codes
              </button>
              <button
                onClick={() => setShowUserManagement(true)}
                style={{
                  padding: '10px 20px',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  background: showUserManagement ? '#8b5cf6' : '#e5e7eb',
                  color: showUserManagement ? 'white' : '#374151'
                }}
              >
                User Management
              </button>
            </div>

            {!showUserManagement ? (
              // Manager Codes Tab
              <div>
                <h3 style={{ color: '#374151', marginBottom: '20px' }}>Create Manager Code</h3>
                <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
                  <input
                    type="text"
                    placeholder="Manager Name"
                    value={newManagerCode.name}
                    onChange={(e) => setNewManagerCode({...newManagerCode, name: e.target.value})}
                    style={{ 
                      flex: 1, 
                      padding: '12px', 
                      border: '2px solid #e5e7eb', 
                      borderRadius: '6px' 
                    }}
                  />
                  <input
                    type="text"
                    placeholder="Manager Code (e.g., MGR-TEAM1)"
                    value={newManagerCode.code}
                    onChange={(e) => setNewManagerCode({...newManagerCode, code: e.target.value.toUpperCase()})}
                    style={{ 
                      flex: 1, 
                      padding: '12px', 
                      border: '2px solid #e5e7eb', 
                      borderRadius: '6px' 
                    }}
                  />
                  <button
                    onClick={createManagerCode}
                    style={{
                      background: '#10b981',
                      color: 'white',
                      padding: '12px 20px',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer'
                    }}
                  >
                    Create Code
                  </button>
                </div>

                <h3 style={{ color: '#374151', marginBottom: '15px' }}>Existing Manager Codes</h3>
                {managerCodes.length === 0 ? (
                  <p style={{ color: '#6b7280', fontStyle: 'italic' }}>No manager codes created yet</p>
                ) : (
                  <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden' }}>
                    {managerCodes.map((code, index) => (
                      <div key={code.id} style={{
                        padding: '15px',
                        borderBottom: index < managerCodes.length - 1 ? '1px solid #f3f4f6' : 'none',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <div>
                          <div style={{ fontWeight: 'bold', color: '#374151' }}>{code.name}</div>
                          <div style={{ fontSize: '14px', color: '#6b7280' }}>Code: {code.code}</div>
                          <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                            Created: {new Date(code.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              // User Management Tab
              <div>
                <h3 style={{ color: '#374151', marginBottom: '20px' }}>Company Users</h3>
                {companyUsers.length === 0 ? (
                  <p style={{ color: '#6b7280', fontStyle: 'italic' }}>No users found</p>
                ) : (
                  <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden' }}>
                    {companyUsers.map((user, index) => (
                      <div key={user.id} style={{
                        padding: '15px',
                        borderBottom: index < companyUsers.length - 1 ? '1px solid #f3f4f6' : 'none',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <div>
                          <div style={{ fontWeight: 'bold', color: '#374151' }}>{user.name}</div>
                          <div style={{ fontSize: '14px', color: '#6b7280' }}>{user.email}</div>
                          <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                            Role: {user.role} | Manager Code: {user.managerCode || 'None'}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '10px' }}>
                          {user.role === 'employee' && (
                            <button
                              onClick={() => {
                                const managerCode = prompt('Enter manager code for promotion:', '');
                                if (managerCode && managerCodes.find(m => m.code === managerCode.toUpperCase())) {
                                  changeUserRole(user.id, 'manager', managerCode.toUpperCase());
                                } else if (managerCode) {
                                  alert('Invalid manager code');
                                }
                              }}
                              style={{
                                background: '#3b82f6',
                                color: 'white',
                                padding: '6px 12px',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '12px'
                              }}
                            >
                              Promote to Manager
                            </button>
                          )}
                          {user.role === 'manager' && (
                            <button
                              onClick={() => changeUserRole(user.id, 'employee', null)}
                              style={{
                                background: '#f59e0b',
                                color: 'white',
                                padding: '6px 12px',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '12px'
                              }}
                            >
                              Demote to Employee
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
