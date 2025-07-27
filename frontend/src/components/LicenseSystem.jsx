import { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

function LicenseSystem() {
  const [licenseKey, setLicenseKey] = useState('');
  const [hwid, setHwid] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('verify');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');

  // Admin states
  const [adminApiKey, setAdminApiKey] = useState('admin-api-key-change-this-in-production');
  const [licenseType, setLicenseType] = useState('30d');
  const [licenses, setLicenses] = useState([]);
  const [stats, setStats] = useState({
    totalLicenses: 0,
    activeLicenses: 0,
    expiredLicenses: 0,
    totalUsage: 0
  });

  // Generate random HWID for demo
  const generateHWID = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 16; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setHwid(result);
  };

  useEffect(() => {
    generateHWID();
  }, []);

  const adminLogin = () => {
    if (adminPassword === 'admin123') {
      setIsLoggedIn(true);
      setActiveTab('dashboard');
      fetchLicenses();
      calculateStats();
    } else {
      setResult({ success: false, message: 'Yanlış admin şifresi!' });
    }
  };

  const calculateStats = () => {
    const total = licenses.length;
    const active = licenses.filter(l => l.status === 'active' && !l.isExpired).length;
    const expired = licenses.filter(l => l.isExpired).length;
    const totalUsage = licenses.reduce((sum, l) => sum + l.usageCount, 0);
    
    setStats({ totalLicenses: total, activeLicenses: active, expiredLicenses: expired, totalUsage });
  };

  const verifyLicense = async () => {
    if (!licenseKey || !hwid) {
      setResult({ success: false, message: 'Lisans anahtarı ve HWID gerekli!' });
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/api/verify`, {
        license_key: licenseKey,
        hwid: hwid
      });
      setResult(response.data);
    } catch (error) {
      setResult(error.response?.data || { success: false, message: 'Bağlantı hatası!' });
    }
    setLoading(false);
  };

  const createLicense = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/api/create`, {
        license_type: licenseType
      }, {
        headers: {
          'X-API-Key': adminApiKey
        }
      });
      setResult(response.data);
      if (response.data.success) {
        fetchLicenses();
        calculateStats();
      }
    } catch (error) {
      setResult(error.response?.data || { success: false, message: 'Bağlantı hatası!' });
    }
    setLoading(false);
  };

  const fetchLicenses = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/api/licenses`, {
        headers: {
          'X-API-Key': adminApiKey
        }
      });
      if (response.data.success) {
        setLicenses(response.data.data.licenses);
      }
    } catch (error) {
      console.error('Lisanslar getirilemedi:', error);
    }
    setLoading(false);
  };

  const resetHWID = async (key) => {
    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/api/reset-hwid`, {
        license_key: key
      }, {
        headers: {
          'X-API-Key': adminApiKey
        }
      });
      setResult(response.data);
      if (response.data.success) {
        fetchLicenses();
      }
    } catch (error) {
      setResult(error.response?.data || { success: false, message: 'HWID sıfırlanamadı!' });
    }
    setLoading(false);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Süresiz';
    return new Date(parseInt(dateString)).toLocaleString('tr-TR');
  };

  const getStatusColor = (status, isExpired) => {
    if (isExpired) return '#dc3545';
    switch(status) {
      case 'active': return '#28a745';
      case 'suspended': return '#ffc107';
      case 'banned': return '#dc3545';
      default: return '#6c757d';
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif"
    }}>
      {/* Header */}
      <header style={{
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        padding: '1rem 0'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                background: 'linear-gradient(45deg, #ff6b6b, #4ecdc4)',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px'
              }}>
                🔐
              </div>
              <div>
                <h1 style={{ color: 'white', margin: 0, fontSize: '24px', fontWeight: '700' }}>
                  LunixAuth
                </h1>
                <p style={{ color: 'rgba(255,255,255,0.7)', margin: 0, fontSize: '14px' }}>
                  Professional License Management
                </p>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '10px' }}>
              {!isLoggedIn ? (
                <>
                  <button
                    onClick={() => setActiveTab('verify')}
                    style={{
                      background: activeTab === 'verify' ? 'rgba(255,255,255,0.2)' : 'transparent',
                      color: 'white',
                      border: '1px solid rgba(255,255,255,0.3)',
                      padding: '8px 16px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '500'
                    }}
                  >
                    🔍 Verify License
                  </button>
                  <button
                    onClick={() => setActiveTab('admin-login')}
                    style={{
                      background: activeTab === 'admin-login' ? 'rgba(255,255,255,0.2)' : 'transparent',
                      color: 'white',
                      border: '1px solid rgba(255,255,255,0.3)',
                      padding: '8px 16px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '500'
                    }}
                  >
                    👨‍💼 Admin Login
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setActiveTab('dashboard')}
                    style={{
                      background: activeTab === 'dashboard' ? 'rgba(255,255,255,0.2)' : 'transparent',
                      color: 'white',
                      border: '1px solid rgba(255,255,255,0.3)',
                      padding: '8px 16px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '500'
                    }}
                  >
                    📊 Dashboard
                  </button>
                  <button
                    onClick={() => setActiveTab('manage')}
                    style={{
                      background: activeTab === 'manage' ? 'rgba(255,255,255,0.2)' : 'transparent',
                      color: 'white',
                      border: '1px solid rgba(255,255,255,0.3)',
                      padding: '8px 16px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '500'
                    }}
                  >
                    ⚙️ Manage
                  </button>
                  <button
                    onClick={() => {
                      setIsLoggedIn(false);
                      setActiveTab('verify');
                      setLicenses([]);
                    }}
                    style={{
                      background: 'rgba(255,255,255,0.1)',
                      color: 'white',
                      border: '1px solid rgba(255,255,255,0.3)',
                      padding: '8px 16px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '500'
                    }}
                  >
                    🚪 Logout
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px' }}>
        
        {/* License Verification */}
        {activeTab === 'verify' && (
          <div style={{
            background: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '20px',
            padding: '40px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.1)',
            backdropFilter: 'blur(10px)'
          }}>
            <div style={{ textAlign: 'center', marginBottom: '40px' }}>
              <div style={{
                width: '80px',
                height: '80px',
                background: 'linear-gradient(45deg, #667eea, #764ba2)',
                borderRadius: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '40px',
                margin: '0 auto 20px'
              }}>
                🔍
              </div>
              <h2 style={{ color: '#333', fontSize: '32px', fontWeight: '700', margin: '0 0 10px' }}>
                License Verification
              </h2>
              <p style={{ color: '#666', fontSize: '16px', margin: 0 }}>
                Enter your license key and hardware ID to verify access
              </p>
            </div>

            <div style={{ maxWidth: '500px', margin: '0 auto' }}>
              <div style={{ marginBottom: '25px' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  color: '#333',
                  fontSize: '14px',
                  fontWeight: '600'
                }}>
                  License Key
                </label>
                <input
                  type="text"
                  value={licenseKey}
                  onChange={(e) => setLicenseKey(e.target.value)}
                  placeholder="XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX"
                  style={{
                    width: '100%',
                    padding: '15px',
                    border: '2px solid #e1e5e9',
                    borderRadius: '12px',
                    fontSize: '16px',
                    outline: 'none',
                    transition: 'all 0.3s ease',
                    fontFamily: 'monospace'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#667eea'}
                  onBlur={(e) => e.target.style.borderColor = '#e1e5e9'}
                />
              </div>

              <div style={{ marginBottom: '25px' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  color: '#333',
                  fontSize: '14px',
                  fontWeight: '600'
                }}>
                  Hardware ID (HWID)
                </label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input
                    type="text"
                    value={hwid}
                    onChange={(e) => setHwid(e.target.value)}
                    placeholder="Hardware identifier"
                    style={{
                      flex: 1,
                      padding: '15px',
                      border: '2px solid #e1e5e9',
                      borderRadius: '12px',
                      fontSize: '16px',
                      outline: 'none',
                      transition: 'all 0.3s ease',
                      fontFamily: 'monospace'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#667eea'}
                    onBlur={(e) => e.target.style.borderColor = '#e1e5e9'}
                  />
                  <button
                    onClick={generateHWID}
                    style={{
                      background: '#f8f9fa',
                      border: '2px solid #e1e5e9',
                      borderRadius: '12px',
                      padding: '15px',
                      cursor: 'pointer',
                      fontSize: '16px'
                    }}
                    title="Generate Random HWID"
                  >
                    🎲
                  </button>
                </div>
              </div>

              <button
                onClick={verifyLicense}
                disabled={loading}
                style={{
                  width: '100%',
                  background: loading ? '#ccc' : 'linear-gradient(45deg, #667eea, #764ba2)',
                  color: 'white',
                  border: 'none',
                  padding: '18px',
                  borderRadius: '12px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontSize: '18px',
                  fontWeight: '600',
                  transition: 'all 0.3s ease',
                  transform: loading ? 'none' : 'translateY(0)',
                }}
                onMouseEnter={(e) => !loading && (e.target.style.transform = 'translateY(-2px)')}
                onMouseLeave={(e) => !loading && (e.target.style.transform = 'translateY(0)')}
              >
                {loading ? '🔄 Verifying...' : '✅ Verify License'}
              </button>
            </div>
          </div>
        )}

        {/* Admin Login */}
        {activeTab === 'admin-login' && !isLoggedIn && (
          <div style={{
            background: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '20px',
            padding: '40px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.1)',
            backdropFilter: 'blur(10px)',
            maxWidth: '400px',
            margin: '0 auto'
          }}>
            <div style={{ textAlign: 'center', marginBottom: '30px' }}>
              <div style={{
                width: '60px',
                height: '60px',
                background: 'linear-gradient(45deg, #ff6b6b, #4ecdc4)',
                borderRadius: '15px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '30px',
                margin: '0 auto 15px'
              }}>
                👨‍💼
              </div>
              <h2 style={{ color: '#333', fontSize: '24px', fontWeight: '700', margin: 0 }}>
                Admin Login
              </h2>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px', 
                color: '#333',
                fontSize: '14px',
                fontWeight: '600'
              }}>
                Admin Password
              </label>
              <input
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="Enter admin password"
                style={{
                  width: '100%',
                  padding: '15px',
                  border: '2px solid #e1e5e9',
                  borderRadius: '12px',
                  fontSize: '16px',
                  outline: 'none',
                  transition: 'all 0.3s ease'
                }}
                onKeyPress={(e) => e.key === 'Enter' && adminLogin()}
                onFocus={(e) => e.target.style.borderColor = '#667eea'}
                onBlur={(e) => e.target.style.borderColor = '#e1e5e9'}
              />
              <p style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                Demo password: admin123
              </p>
            </div>

            <button
              onClick={adminLogin}
              style={{
                width: '100%',
                background: 'linear-gradient(45deg, #ff6b6b, #4ecdc4)',
                color: 'white',
                border: 'none',
                padding: '15px',
                borderRadius: '12px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: '600'
              }}
            >
              🔓 Login
            </button>
          </div>
        )}

        {/* Dashboard */}
        {activeTab === 'dashboard' && isLoggedIn && (
          <div>
            <div style={{ marginBottom: '30px' }}>
              <h2 style={{ color: 'white', fontSize: '28px', fontWeight: '700', margin: '0 0 10px' }}>
                📊 Dashboard Overview
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.8)', margin: 0 }}>
                Monitor your license system performance
              </p>
            </div>

            {/* Stats Cards */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
              gap: '20px',
              marginBottom: '30px'
            }}>
              <div style={{
                background: 'rgba(255, 255, 255, 0.95)',
                borderRadius: '15px',
                padding: '25px',
                boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <div style={{
                    width: '50px',
                    height: '50px',
                    background: 'linear-gradient(45deg, #667eea, #764ba2)',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '24px'
                  }}>
                    📄
                  </div>
                  <div>
                    <h3 style={{ margin: 0, color: '#333', fontSize: '32px', fontWeight: '700' }}>
                      {licenses.length}
                    </h3>
                    <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>Total Licenses</p>
                  </div>
                </div>
              </div>

              <div style={{
                background: 'rgba(255, 255, 255, 0.95)',
                borderRadius: '15px',
                padding: '25px',
                boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <div style={{
                    width: '50px',
                    height: '50px',
                    background: 'linear-gradient(45deg, #28a745, #20c997)',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '24px'
                  }}>
                    ✅
                  </div>
                  <div>
                    <h3 style={{ margin: 0, color: '#333', fontSize: '32px', fontWeight: '700' }}>
                      {licenses.filter(l => l.status === 'active' && !l.isExpired).length}
                    </h3>
                    <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>Active Licenses</p>
                  </div>
                </div>
              </div>

              <div style={{
                background: 'rgba(255, 255, 255, 0.95)',
                borderRadius: '15px',
                padding: '25px',
                boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <div style={{
                    width: '50px',
                    height: '50px',
                    background: 'linear-gradient(45deg, #dc3545, #fd7e14)',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '24px'
                  }}>
                    ⏰
                  </div>
                  <div>
                    <h3 style={{ margin: 0, color: '#333', fontSize: '32px', fontWeight: '700' }}>
                      {licenses.filter(l => l.isExpired).length}
                    </h3>
                    <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>Expired Licenses</p>
                  </div>
                </div>
              </div>

              <div style={{
                background: 'rgba(255, 255, 255, 0.95)',
                borderRadius: '15px',
                padding: '25px',
                boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <div style={{
                    width: '50px',
                    height: '50px',
                    background: 'linear-gradient(45deg, #6f42c1, #e83e8c)',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '24px'
                  }}>
                    📊
                  </div>
                  <div>
                    <h3 style={{ margin: 0, color: '#333', fontSize: '32px', fontWeight: '700' }}>
                      {licenses.reduce((sum, l) => sum + l.usageCount, 0)}
                    </h3>
                    <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>Total Usage</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Licenses */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.95)',
              borderRadius: '15px',
              padding: '30px',
              boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
            }}>
              <h3 style={{ margin: '0 0 20px', color: '#333', fontSize: '20px', fontWeight: '600' }}>
                📋 Recent Licenses
              </h3>
              
              {licenses.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                  <div style={{ fontSize: '48px', marginBottom: '15px' }}>📄</div>
                  <p>No licenses found. Create your first license!</p>
                </div>
              ) : (
                <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                  {licenses.slice(0, 5).map((license, index) => (
                    <div
                      key={index}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '15px',
                        border: '1px solid #e1e5e9',
                        borderRadius: '10px',
                        marginBottom: '10px',
                        background: '#f8f9fa'
                      }}
                    >
                      <div>
                        <div style={{ fontFamily: 'monospace', fontWeight: '600', color: '#333' }}>
                          {license.key}
                        </div>
                        <div style={{ fontSize: '12px', color: '#666', marginTop: '2px' }}>
                          Created: {new Date(license.createdAt).toLocaleDateString('tr-TR')}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{
                          background: getStatusColor(license.status, license.isExpired),
                          color: 'white',
                          padding: '4px 8px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: '500'
                        }}>
                          {license.isExpired ? 'Expired' : license.status}
                        </span>
                        <div style={{ fontSize: '12px', color: '#666', marginTop: '2px' }}>
                          Usage: {license.usageCount}x
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* License Management */}
        {activeTab === 'manage' && isLoggedIn && (
          <div>
            <div style={{ marginBottom: '30px' }}>
              <h2 style={{ color: 'white', fontSize: '28px', fontWeight: '700', margin: '0 0 10px' }}>
                ⚙️ License Management
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.8)', margin: 0 }}>
                Create and manage your licenses
              </p>
            </div>

            {/* Create License Form */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.95)',
              borderRadius: '15px',
              padding: '30px',
              boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
              marginBottom: '30px'
            }}>
              <h3 style={{ margin: '0 0 20px', color: '#333', fontSize: '20px', fontWeight: '600' }}>
                🔑 Create New License
              </h3>
              
              <div style={{ display: 'flex', gap: '15px', alignItems: 'end', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '8px', 
                    color: '#333',
                    fontSize: '14px',
                    fontWeight: '600'
                  }}>
                    License Type
                  </label>
                  <select
                    value={licenseType}
                    onChange={(e) => setLicenseType(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '2px solid #e1e5e9',
                      borderRadius: '10px',
                      fontSize: '16px',
                      outline: 'none'
                    }}
                  >
                    <option value="7d">7 Days Trial</option>
                    <option value="30d">30 Days Standard</option>
                    <option value="90d">90 Days Premium</option>
                    <option value="365d">1 Year Pro</option>
                    <option value="lifetime">Lifetime</option>
                  </select>
                </div>
                
                <button
                  onClick={createLicense}
                  disabled={loading}
                  style={{
                    background: loading ? '#ccc' : 'linear-gradient(45deg, #28a745, #20c997)',
                    color: 'white',
                    border: 'none',
                    padding: '12px 24px',
                    borderRadius: '10px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontSize: '16px',
                    fontWeight: '600',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {loading ? '⏳ Creating...' : '✨ Create License'}
                </button>
                
                <button
                  onClick={fetchLicenses}
                  disabled={loading}
                  style={{
                    background: '#6c757d',
                    color: 'white',
                    border: 'none',
                    padding: '12px 24px',
                    borderRadius: '10px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontSize: '16px',
                    fontWeight: '600',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {loading ? '⏳ Loading...' : '🔄 Refresh'}
                </button>
              </div>
            </div>

            {/* License List */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.95)',
              borderRadius: '15px',
              padding: '30px',
              boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
            }}>
              <h3 style={{ margin: '0 0 20px', color: '#333', fontSize: '20px', fontWeight: '600' }}>
                📋 All Licenses ({licenses.length})
              </h3>
              
              {licenses.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px', color: '#666' }}>
                  <div style={{ fontSize: '64px', marginBottom: '20px' }}>🔑</div>
                  <h4 style={{ margin: '0 0 10px', fontSize: '18px' }}>No licenses yet</h4>
                  <p style={{ margin: 0 }}>Create your first license to get started!</p>
                </div>
              ) : (
                <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
                  {licenses.map((license, index) => (
                    <div
                      key={index}
                      style={{
                        background: 'white',
                        border: '1px solid #e1e5e9',
                        borderRadius: '12px',
                        padding: '20px',
                        marginBottom: '15px',
                        boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', flexWrap: 'wrap', gap: '15px' }}>
                        <div style={{ flex: 1, minWidth: '300px' }}>
                          <div style={{ 
                            fontFamily: 'monospace', 
                            fontSize: '16px',
                            fontWeight: '600', 
                            color: '#333',
                            marginBottom: '10px',
                            wordBreak: 'break-all'
                          }}>
                            🔑 {license.key}
                          </div>
                          
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px', fontSize: '14px' }}>
                            <div>
                              <strong>Status:</strong>
                              <span style={{
                                marginLeft: '8px',
                                background: getStatusColor(license.status, license.isExpired),
                                color: 'white',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                fontSize: '12px'
                              }}>
                                {license.isExpired ? 'Expired' : license.status}
                              </span>
                            </div>
                            <div>
                              <strong>HWID:</strong> {license.hwid || 'Not bound'}
                            </div>
                            <div>
                              <strong>Expires:</strong> {formatDate(license.expiresAt)}
                            </div>
                            <div>
                              <strong>Usage:</strong> {license.usageCount}x
                            </div>
                            <div>
                              <strong>Created:</strong> {new Date(license.createdAt).toLocaleDateString('tr-TR')}
                            </div>
                            <div>
                              <strong>Last Used:</strong> {license.lastUsedAt ? new Date(license.lastUsedAt).toLocaleDateString('tr-TR') : 'Never'}
                            </div>
                          </div>
                        </div>
                        
                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                          <button
                            onClick={() => resetHWID(license.key)}
                            disabled={loading || !license.hwid}
                            style={{
                              background: license.hwid ? '#ffc107' : '#e9ecef',
                              color: license.hwid ? '#212529' : '#6c757d',
                              border: 'none',
                              padding: '8px 12px',
                              borderRadius: '8px',
                              cursor: license.hwid && !loading ? 'pointer' : 'not-allowed',
                              fontSize: '12px',
                              fontWeight: '500',
                              whiteSpace: 'nowrap'
                            }}
                            title={license.hwid ? 'Reset HWID binding' : 'No HWID to reset'}
                          >
                            🔄 Reset HWID
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Result Display */}
        {result && (
          <div
            style={{
              position: 'fixed',
              top: '20px',
              right: '20px',
              background: result.success ? 
                'linear-gradient(45deg, #28a745, #20c997)' : 
                'linear-gradient(45deg, #dc3545, #fd7e14)',
              color: 'white',
              padding: '20px',
              borderRadius: '15px',
              boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
              maxWidth: '400px',
              zIndex: 1000,
              animation: 'slideIn 0.3s ease'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ fontSize: '24px', marginRight: '10px' }}>
                {result.success ? '✅' : '❌'}
              </span>
              <strong style={{ fontSize: '16px' }}>{result.message}</strong>
              <button
                onClick={() => setResult(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'white',
                  fontSize: '20px',
                  cursor: 'pointer',
                  marginLeft: 'auto',
                  padding: '0 5px'
                }}
              >
                ×
              </button>
            </div>
            
            {result.data && result.data.license && (
              <div style={{ 
                background: 'rgba(255,255,255,0.2)', 
                padding: '15px', 
                borderRadius: '10px',
                fontSize: '14px'
              }}>
                <div><strong>License:</strong> {result.data.license.key}</div>
                <div><strong>HWID:</strong> {result.data.license.hwid || 'Not bound'}</div>
                <div><strong>Status:</strong> {result.data.license.status}</div>
                <div><strong>Expires:</strong> {formatDate(result.data.license.expiresAt)}</div>
                <div><strong>Usage:</strong> {result.data.license.usageCount}x</div>
                {result.data.server_time && (
                  <div><strong>Server Time:</strong> {new Date(result.data.server_time).toLocaleString('tr-TR')}</div>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer style={{
        background: 'rgba(0, 0, 0, 0.2)',
        backdropFilter: 'blur(10px)',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        padding: '30px 0',
        marginTop: '60px'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px', textAlign: 'center' }}>
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ color: 'white', fontSize: '18px', fontWeight: '600', margin: '0 0 10px' }}>
              LunixAuth License System
            </h3>
            <p style={{ color: 'rgba(255,255,255,0.7)', margin: 0, fontSize: '14px' }}>
              Professional license management solution for your software
            </p>
          </div>
          
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            gap: '20px',
            flexWrap: 'wrap',
            fontSize: '14px',
            color: 'rgba(255,255,255,0.6)'
          }}>
            <span>🔐 Secure Authentication</span>
            <span>⚡ High Performance</span>
            <span>🛡️ HWID Protection</span>
            <span>📊 Real-time Analytics</span>
          </div>
          
          <div style={{ 
            marginTop: '20px', 
            paddingTop: '20px', 
            borderTop: '1px solid rgba(255,255,255,0.1)',
            color: 'rgba(255,255,255,0.5)',
            fontSize: '12px'
          }}>
            <p style={{ margin: 0 }}>
              © 2025 LunixAuth. All rights reserved. | API Endpoint: {API_BASE_URL}
            </p>
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        * {
          box-sizing: border-box;
        }
        
        body {
          margin: 0;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        }
      `}</style>
    </div>
  );
}

export default LicenseSystem;