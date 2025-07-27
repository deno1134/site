import { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

function LicenseSystem() {
  const [licenseKey, setLicenseKey] = useState('');
  const [hwid, setHwid] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('home');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');

  // Admin states
  const [adminApiKey, setAdminApiKey] = useState('admin-api-key-change-this-in-production');
  const [licenseType, setLicenseType] = useState('30d');
  const [licenses, setLicenses] = useState([]);
  const [stats, setStats] = useState({
    totalAccounts: 1247,
    totalApplications: 89,
    totalLicenses: 15683,
    usersLoggedIn: 342
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
    // Simulate real-time stats updates
    const interval = setInterval(() => {
      setStats(prev => ({
        ...prev,
        usersLoggedIn: Math.floor(Math.random() * 100) + 300
      }));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const adminLogin = () => {
    if (adminPassword === 'admin123') {
      setIsLoggedIn(true);
      setActiveTab('dashboard');
      fetchLicenses();
    } else {
      setResult({ success: false, message: 'Invalid admin credentials!' });
    }
  };

  const verifyLicense = async () => {
    if (!licenseKey || !hwid) {
      setResult({ success: false, message: 'License key and HWID are required!' });
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
      setResult(error.response?.data || { success: false, message: 'Connection error!' });
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
      }
    } catch (error) {
      setResult(error.response?.data || { success: false, message: 'Connection error!' });
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
      console.error('Failed to fetch licenses:', error);
    }
    setLoading(false);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Lifetime';
    return new Date(parseInt(dateString)).toLocaleString('en-US');
  };

  return (
    <div style={{ 
      minHeight: '100vh',
      background: '#0a0a0a',
      color: 'white',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif"
    }}>
      {/* Navigation Header */}
      <nav style={{
        background: '#111111',
        borderBottom: '1px solid #333',
        padding: '0',
        position: 'sticky',
        top: 0,
        zIndex: 1000
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Logo */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            padding: '16px 20px',
            fontSize: '24px',
            fontWeight: '700',
            color: '#ff6b9d'
          }}>
            🌸 SakuraAuth
          </div>

          {/* Navigation Menu */}
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <button
              onClick={() => setActiveTab('home')}
              style={{
                background: 'none',
                border: 'none',
                color: activeTab === 'home' ? '#ff6b9d' : '#888',
                padding: '20px 16px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                borderBottom: activeTab === 'home' ? '2px solid #ff6b9d' : '2px solid transparent',
                transition: 'all 0.3s ease'
              }}
            >
              Home
            </button>
            <button
              onClick={() => setActiveTab('features')}
              style={{
                background: 'none',
                border: 'none',
                color: activeTab === 'features' ? '#ff6b9d' : '#888',
                padding: '20px 16px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                borderBottom: activeTab === 'features' ? '2px solid #ff6b9d' : '2px solid transparent',
                transition: 'all 0.3s ease'
              }}
            >
              Features
            </button>
            <button
              onClick={() => setActiveTab('pricing')}
              style={{
                background: 'none',
                border: 'none',
                color: activeTab === 'pricing' ? '#ff6b9d' : '#888',
                padding: '20px 16px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                borderBottom: activeTab === 'pricing' ? '2px solid #ff6b9d' : '2px solid transparent',
                transition: 'all 0.3s ease'
              }}
            >
              Plans
            </button>
            
            {!isLoggedIn ? (
              <button
                onClick={() => setActiveTab('login')}
                style={{
                  background: '#ff6b9d',
                  border: 'none',
                  color: 'white',
                  padding: '10px 20px',
                  margin: '0 20px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600'
                }}
              >
                Client Area
              </button>
            ) : (
              <button
                onClick={() => setActiveTab('dashboard')}
                style={{
                  background: '#ff6b9d',
                  border: 'none',
                  color: 'white',
                  padding: '10px 20px',
                  margin: '0 20px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600'
                }}
              >
                Dashboard
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main>
        {/* Home Page */}
        {activeTab === 'home' && (
          <div>
            {/* Hero Section */}
            <section style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #ff6b9d 100%)',
              padding: '100px 20px',
              textAlign: 'center'
            }}>
              <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                <h1 style={{
                  fontSize: '48px',
                  fontWeight: '700',
                  marginBottom: '20px',
                  lineHeight: '1.2'
                }}>
                  Effortless, Next-Level Authentication
                </h1>
                <p style={{
                  fontSize: '20px',
                  marginBottom: '40px',
                  opacity: 0.9,
                  lineHeight: '1.6'
                }}>
                  Get up and running fast with cloud‑native subscriptions, granular access controls and automated workflows—all driven by a single API.
                </p>
                <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => setActiveTab('pricing')}
                    style={{
                      background: 'white',
                      color: '#333',
                      border: 'none',
                      padding: '15px 30px',
                      borderRadius: '8px',
                      fontSize: '16px',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    Onboard Now
                  </button>
                  <button
                    onClick={() => setActiveTab('login')}
                    style={{
                      background: 'rgba(255,255,255,0.2)',
                      color: 'white',
                      border: '1px solid rgba(255,255,255,0.3)',
                      padding: '15px 30px',
                      borderRadius: '8px',
                      fontSize: '16px',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    Client Area
                  </button>
                </div>
              </div>
            </section>

            {/* Features Section */}
            <section style={{ padding: '80px 20px', background: '#111' }}>
              <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
                  gap: '40px',
                  marginBottom: '80px'
                }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{
                      width: '80px',
                      height: '80px',
                      background: '#ff6b9d',
                      borderRadius: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '32px',
                      margin: '0 auto 20px'
                    }}>
                      🔗
                    </div>
                    <h3 style={{ fontSize: '24px', marginBottom: '15px', color: '#ff6b9d' }}>
                      Server-Side Webhooks & Variables
                    </h3>
                    <p style={{ color: '#ccc', lineHeight: '1.6' }}>
                      Private Webhooks, Secure Server-side File Management, and Protected Variables.
                    </p>
                  </div>

                  <div style={{ textAlign: 'center' }}>
                    <div style={{
                      width: '80px',
                      height: '80px',
                      background: '#ff6b9d',
                      borderRadius: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '32px',
                      margin: '0 auto 20px'
                    }}>
                      🔒
                    </div>
                    <h3 style={{ fontSize: '24px', marginBottom: '15px', color: '#ff6b9d' }}>
                      Privacy First
                    </h3>
                    <p style={{ color: '#ccc', lineHeight: '1.6' }}>
                      We prioritize your needs, your users, and the sanctity of your data.
                    </p>
                  </div>

                  <div style={{ textAlign: 'center' }}>
                    <div style={{
                      width: '80px',
                      height: '80px',
                      background: '#ff6b9d',
                      borderRadius: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '32px',
                      margin: '0 auto 20px'
                    }}>
                      📱
                    </div>
                    <h3 style={{ fontSize: '24px', marginBottom: '15px', color: '#ff6b9d' }}>
                      Control Apps Anywhere
                    </h3>
                    <p style={{ color: '#ccc', lineHeight: '1.6' }}>
                      With our Seller API, you can control your application from anywhere!
                    </p>
                  </div>
                </div>

                {/* Stats Section */}
                <div style={{
                  background: '#1a1a1a',
                  borderRadius: '16px',
                  padding: '60px 40px',
                  textAlign: 'center'
                }}>
                  <h2 style={{ fontSize: '32px', marginBottom: '50px' }}>
                    Craft Secure and Reliable Applications with SakuraAuth
                  </h2>
                  <p style={{ fontSize: '18px', color: '#ccc', marginBottom: '50px' }}>
                    SakuraAuth is a cloud-based subscription authentication platform that allows you to implement authentication into your software, website, or application with ease.
                  </p>
                  
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                    gap: '40px'
                  }}>
                    <div>
                      <div style={{ fontSize: '48px', fontWeight: '700', color: '#ff6b9d', marginBottom: '10px' }}>
                        {stats.totalAccounts.toLocaleString()}
                      </div>
                      <div style={{ color: '#ccc' }}>Accounts</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '48px', fontWeight: '700', color: '#ff6b9d', marginBottom: '10px' }}>
                        {stats.totalApplications}
                      </div>
                      <div style={{ color: '#ccc' }}>Applications</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '48px', fontWeight: '700', color: '#ff6b9d', marginBottom: '10px' }}>
                        {stats.totalLicenses.toLocaleString()}
                      </div>
                      <div style={{ color: '#ccc' }}>Licenses</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '48px', fontWeight: '700', color: '#ff6b9d', marginBottom: '10px' }}>
                        {stats.usersLoggedIn}
                      </div>
                      <div style={{ color: '#ccc' }}>Users Logged In</div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* Features Page */}
        {activeTab === 'features' && (
          <div style={{ padding: '80px 20px', background: '#0a0a0a' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
              <h1 style={{ fontSize: '48px', textAlign: 'center', marginBottom: '60px' }}>
                SakuraAuth Features
              </h1>
              
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', 
                gap: '40px'
              }}>
                <div style={{
                  background: '#1a1a1a',
                  borderRadius: '16px',
                  padding: '40px',
                  border: '1px solid #333'
                }}>
                  <div style={{ fontSize: '48px', marginBottom: '20px' }}>🔐</div>
                  <h3 style={{ fontSize: '24px', marginBottom: '15px', color: '#ff6b9d' }}>
                    HMAC Signature Check
                  </h3>
                  <p style={{ color: '#ccc', lineHeight: '1.6' }}>
                    Ensuring data integrity, we employ HMAC signature checks to verify the authenticity of requests.
                  </p>
                </div>

                <div style={{
                  background: '#1a1a1a',
                  borderRadius: '16px',
                  padding: '40px',
                  border: '1px solid #333'
                }}>
                  <div style={{ fontSize: '48px', marginBottom: '20px' }}>🛡️</div>
                  <h3 style={{ fontSize: '24px', marginBottom: '15px', color: '#ff6b9d' }}>
                    Multi Layered Blacklist Options
                  </h3>
                  <p style={{ color: '#ccc', lineHeight: '1.6' }}>
                    Tailor your security with IP, HWID, and token blacklist options, providing a comprehensive shield against unauthorized access.
                  </p>
                </div>

                <div style={{
                  background: '#1a1a1a',
                  borderRadius: '16px',
                  padding: '40px',
                  border: '1px solid #333'
                }}>
                  <div style={{ fontSize: '48px', marginBottom: '20px' }}>🔒</div>
                  <h3 style={{ fontSize: '24px', marginBottom: '15px', color: '#ff6b9d' }}>
                    Data Protection & Encryption
                  </h3>
                  <p style={{ color: '#ccc', lineHeight: '1.6' }}>
                    We hash emails upon registration and never store passwords in plaintext, safeguarding your information.
                  </p>
                </div>

                <div style={{
                  background: '#1a1a1a',
                  borderRadius: '16px',
                  padding: '40px',
                  border: '1px solid #333'
                }}>
                  <div style={{ fontSize: '48px', marginBottom: '20px' }}>📱</div>
                  <h3 style={{ fontSize: '24px', marginBottom: '15px', color: '#ff6b9d' }}>
                    Mobile App Control
                  </h3>
                  <p style={{ color: '#ccc', lineHeight: '1.6' }}>
                    SakuraAuth's mobile app allows you to do anything from anywhere. Manage your users, view your logs, and more.
                  </p>
                </div>

                <div style={{
                  background: '#1a1a1a',
                  borderRadius: '16px',
                  padding: '40px',
                  border: '1px solid #333'
                }}>
                  <div style={{ fontSize: '48px', marginBottom: '20px' }}>⚡</div>
                  <h3 style={{ fontSize: '24px', marginBottom: '15px', color: '#ff6b9d' }}>
                    High Performance
                  </h3>
                  <p style={{ color: '#ccc', lineHeight: '1.6' }}>
                    Built with performance in mind, ensuring a smooth and responsive experience for all your users.
                  </p>
                </div>

                <div style={{
                  background: '#1a1a1a',
                  borderRadius: '16px',
                  padding: '40px',
                  border: '1px solid #333'
                }}>
                  <div style={{ fontSize: '48px', marginBottom: '20px' }}>🌐</div>
                  <h3 style={{ fontSize: '24px', marginBottom: '15px', color: '#ff6b9d' }}>
                    Global CDN
                  </h3>
                  <p style={{ color: '#ccc', lineHeight: '1.6' }}>
                    Our global content delivery network ensures fast response times worldwide for optimal user experience.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Pricing Page */}
        {activeTab === 'pricing' && (
          <div style={{ padding: '80px 20px', background: '#0a0a0a' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
              <h1 style={{ fontSize: '48px', textAlign: 'center', marginBottom: '20px' }}>
                Pricing Options
              </h1>
              <p style={{ textAlign: 'center', fontSize: '18px', color: '#ccc', marginBottom: '60px' }}>
                We offer a variety of plans to suit your needs.
              </p>
              
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
                gap: '30px'
              }}>
                {/* Tester Plan */}
                <div style={{
                  background: '#1a1a1a',
                  borderRadius: '16px',
                  padding: '40px',
                  border: '1px solid #333',
                  position: 'relative'
                }}>
                  <h3 style={{ fontSize: '24px', marginBottom: '10px', color: '#ff6b9d' }}>Tester</h3>
                  <div style={{ fontSize: '48px', fontWeight: '700', marginBottom: '10px' }}>Free</div>
                  <p style={{ color: '#ccc', marginBottom: '30px', fontSize: '14px' }}>
                    Limited Access for those looking to experiment implementing SakuraAuth
                  </p>
                  
                  <ul style={{ listStyle: 'none', padding: 0, marginBottom: '30px' }}>
                    <li style={{ padding: '8px 0', color: '#ccc' }}>• Users: 10</li>
                    <li style={{ padding: '8px 0', color: '#ccc' }}>• Upload Files: (10 MB)</li>
                    <li style={{ padding: '8px 0', color: '#ccc' }}>• Global Variables: 5</li>
                    <li style={{ padding: '8px 0', color: '#ccc' }}>• User Variables</li>
                    <li style={{ padding: '8px 0', color: '#ccc' }}>• Logs: 20</li>
                    <li style={{ padding: '8px 0', color: '#ccc' }}>• Hardware/IP Blacklist/Whitelist</li>
                    <li style={{ padding: '8px 0', color: '#ccc' }}>• Web Loader</li>
                    <li style={{ padding: '8px 0', color: '#ccc' }}>• Create Webhooks</li>
                  </ul>
                  
                  <button style={{
                    width: '100%',
                    background: '#333',
                    color: 'white',
                    border: '1px solid #555',
                    padding: '15px',
                    borderRadius: '8px',
                    fontSize: '16px',
                    cursor: 'pointer'
                  }}>
                    Start for Free
                  </button>
                  <p style={{ textAlign: 'center', fontSize: '12px', color: '#888', marginTop: '10px' }}>
                    No credit card required
                  </p>
                </div>

                {/* Developer Plan */}
                <div style={{
                  background: '#1a1a1a',
                  borderRadius: '16px',
                  padding: '40px',
                  border: '2px solid #ff6b9d',
                  position: 'relative'
                }}>
                  <div style={{
                    position: 'absolute',
                    top: '-12px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: '#ff6b9d',
                    color: 'white',
                    padding: '6px 20px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: '600'
                  }}>
                    POPULAR
                  </div>
                  
                  <h3 style={{ fontSize: '24px', marginBottom: '10px', color: '#ff6b9d' }}>Developer</h3>
                  <div style={{ fontSize: '48px', fontWeight: '700', marginBottom: '10px' }}>$19.99</div>
                  <p style={{ color: '#ccc', marginBottom: '30px', fontSize: '14px' }}>
                    Ample limits plus full access to reseller system. Most folks start here.
                  </p>
                  
                  <ul style={{ listStyle: 'none', padding: 0, marginBottom: '30px' }}>
                    <li style={{ padding: '8px 0', color: '#ccc' }}>• Users: Unlimited</li>
                    <li style={{ padding: '8px 0', color: '#ccc' }}>• Upload Files: (50 MB)</li>
                    <li style={{ padding: '8px 0', color: '#ccc' }}>• Global Variables: Unlimited</li>
                    <li style={{ padding: '8px 0', color: '#ccc' }}>• User Variables</li>
                    <li style={{ padding: '8px 0', color: '#ccc' }}>• Logs: Unlimited</li>
                    <li style={{ padding: '8px 0', color: '#ccc' }}>• Hardware/IP Blacklist/Whitelist</li>
                    <li style={{ padding: '8px 0', color: '#ccc' }}>• Web Loader</li>
                    <li style={{ padding: '8px 0', color: '#ccc' }}>• Reseller & Manager Access</li>
                    <li style={{ padding: '8px 0', color: '#ccc' }}>• SellerAPI Access</li>
                  </ul>
                  
                  <button style={{
                    width: '100%',
                    background: '#ff6b9d',
                    color: 'white',
                    border: 'none',
                    padding: '15px',
                    borderRadius: '8px',
                    fontSize: '16px',
                    cursor: 'pointer'
                  }}>
                    Purchase Developer Now
                  </button>
                </div>

                {/* Enterprise Plan */}
                <div style={{
                  background: '#1a1a1a',
                  borderRadius: '16px',
                  padding: '40px',
                  border: '1px solid #333',
                  position: 'relative'
                }}>
                  <h3 style={{ fontSize: '24px', marginBottom: '10px', color: '#ff6b9d' }}>Enterprise</h3>
                  <div style={{ fontSize: '48px', fontWeight: '700', marginBottom: '10px' }}>$79.99</div>
                  <p style={{ color: '#ccc', marginBottom: '30px', fontSize: '14px' }}>
                    Opt for large-scale projects at $79.99 one-time cost. Access paid SakuraAuth features' source code.
                  </p>
                  
                  <ul style={{ listStyle: 'none', padding: 0, marginBottom: '30px' }}>
                    <li style={{ padding: '8px 0', color: '#ccc' }}>• Cloud Hosted Subscription</li>
                    <li style={{ padding: '8px 0', color: '#ccc' }}>• Partial Source code</li>
                    <li style={{ padding: '8px 0', color: '#ccc' }}>• One-on-one setup support</li>
                    <li style={{ padding: '8px 0', color: '#ccc' }}>• Tutorial video hosting</li>
                    <li style={{ padding: '8px 0', color: '#ccc' }}>• Priority Support</li>
                    <li style={{ padding: '8px 0', color: '#ccc' }}>• Custom Branding</li>
                  </ul>
                  
                  <button style={{
                    width: '100%',
                    background: '#333',
                    color: 'white',
                    border: '1px solid #555',
                    padding: '15px',
                    borderRadius: '8px',
                    fontSize: '16px',
                    cursor: 'pointer'
                  }}>
                    Purchase Enterprise Now
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Login Page */}
        {activeTab === 'login' && !isLoggedIn && (
          <div style={{ padding: '80px 20px', background: '#0a0a0a', minHeight: '60vh' }}>
            <div style={{ maxWidth: '400px', margin: '0 auto' }}>
              <div style={{
                background: '#1a1a1a',
                borderRadius: '16px',
                padding: '40px',
                border: '1px solid #333'
              }}>
                <h2 style={{ textAlign: 'center', marginBottom: '30px', fontSize: '28px' }}>
                  Client Area Login
                </h2>
                
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '8px', 
                    color: '#ccc',
                    fontSize: '14px'
                  }}>
                    Password
                  </label>
                  <input
                    type="password"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="Enter your password"
                    style={{
                      width: '100%',
                      padding: '12px',
                      background: '#333',
                      border: '1px solid #555',
                      borderRadius: '8px',
                      color: 'white',
                      fontSize: '16px',
                      outline: 'none'
                    }}
                    onKeyPress={(e) => e.key === 'Enter' && adminLogin()}
                  />
                  <p style={{ fontSize: '12px', color: '#888', marginTop: '5px' }}>
                    Demo password: admin123
                  </p>
                </div>

                <button
                  onClick={adminLogin}
                  style={{
                    width: '100%',
                    background: '#ff6b9d',
                    color: 'white',
                    border: 'none',
                    padding: '12px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '16px',
                    fontWeight: '600'
                  }}
                >
                  Login
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Dashboard */}
        {activeTab === 'dashboard' && isLoggedIn && (
          <div style={{ padding: '40px 20px', background: '#0a0a0a' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
                <h1 style={{ fontSize: '32px' }}>Dashboard</h1>
                <button
                  onClick={() => {
                    setIsLoggedIn(false);
                    setActiveTab('home');
                  }}
                  style={{
                    background: '#333',
                    color: 'white',
                    border: '1px solid #555',
                    padding: '10px 20px',
                    borderRadius: '8px',
                    cursor: 'pointer'
                  }}
                >
                  Logout
                </button>
              </div>

              {/* License Verification Section */}
              <div style={{
                background: '#1a1a1a',
                borderRadius: '16px',
                padding: '30px',
                marginBottom: '30px',
                border: '1px solid #333'
              }}>
                <h3 style={{ marginBottom: '20px', color: '#ff6b9d' }}>License Verification</h3>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', color: '#ccc' }}>
                      License Key
                    </label>
                    <input
                      type="text"
                      value={licenseKey}
                      onChange={(e) => setLicenseKey(e.target.value)}
                      placeholder="Enter license key"
                      style={{
                        width: '100%',
                        padding: '12px',
                        background: '#333',
                        border: '1px solid #555',
                        borderRadius: '8px',
                        color: 'white',
                        fontFamily: 'monospace'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', color: '#ccc' }}>
                      Hardware ID
                    </label>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <input
                        type="text"
                        value={hwid}
                        onChange={(e) => setHwid(e.target.value)}
                        placeholder="Hardware ID"
                        style={{
                          flex: 1,
                          padding: '12px',
                          background: '#333',
                          border: '1px solid #555',
                          borderRadius: '8px',
                          color: 'white',
                          fontFamily: 'monospace'
                        }}
                      />
                      <button
                        onClick={generateHWID}
                        style={{
                          background: '#555',
                          border: 'none',
                          color: 'white',
                          padding: '12px',
                          borderRadius: '8px',
                          cursor: 'pointer'
                        }}
                      >
                        🎲
                      </button>
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={verifyLicense}
                  disabled={loading}
                  style={{
                    background: loading ? '#555' : '#ff6b9d',
                    color: 'white',
                    border: 'none',
                    padding: '12px 24px',
                    borderRadius: '8px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontSize: '16px'
                  }}
                >
                  {loading ? 'Verifying...' : 'Verify License'}
                </button>
              </div>

              {/* License Management */}
              <div style={{
                background: '#1a1a1a',
                borderRadius: '16px',
                padding: '30px',
                marginBottom: '30px',
                border: '1px solid #333'
              }}>
                <h3 style={{ marginBottom: '20px', color: '#ff6b9d' }}>License Management</h3>
                
                <div style={{ display: 'flex', gap: '20px', marginBottom: '20px', alignItems: 'end' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', color: '#ccc' }}>
                      License Type
                    </label>
                    <select
                      value={licenseType}
                      onChange={(e) => setLicenseType(e.target.value)}
                      style={{
                        padding: '12px',
                        background: '#333',
                        border: '1px solid #555',
                        borderRadius: '8px',
                        color: 'white',
                        minWidth: '150px'
                      }}
                    >
                      <option value="7d">7 Days</option>
                      <option value="30d">30 Days</option>
                      <option value="90d">90 Days</option>
                      <option value="365d">1 Year</option>
                      <option value="lifetime">Lifetime</option>
                    </select>
                  </div>
                  
                  <button
                    onClick={createLicense}
                    disabled={loading}
                    style={{
                      background: loading ? '#555' : '#ff6b9d',
                      color: 'white',
                      border: 'none',
                      padding: '12px 24px',
                      borderRadius: '8px',
                      cursor: loading ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {loading ? 'Creating...' : 'Create License'}
                  </button>
                  
                  <button
                    onClick={fetchLicenses}
                    style={{
                      background: '#333',
                      color: 'white',
                      border: '1px solid #555',
                      padding: '12px 24px',
                      borderRadius: '8px',
                      cursor: 'pointer'
                    }}
                  >
                    Refresh
                  </button>
                </div>

                {/* License List */}
                {licenses.length > 0 && (
                  <div>
                    <h4 style={{ marginBottom: '20px', color: '#ccc' }}>Your Licenses ({licenses.length})</h4>
                    <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                      {licenses.map((license, index) => (
                        <div
                          key={index}
                          style={{
                            background: '#333',
                            borderRadius: '8px',
                            padding: '20px',
                            marginBottom: '15px',
                            border: '1px solid #555'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                            <div>
                              <div style={{ 
                                fontFamily: 'monospace', 
                                fontSize: '16px',
                                color: '#ff6b9d',
                                marginBottom: '10px'
                              }}>
                                {license.key}
                              </div>
                              <div style={{ fontSize: '14px', color: '#ccc' }}>
                                <div>Status: <span style={{ color: license.status === 'active' ? '#4ade80' : '#f87171' }}>
                                  {license.isExpired ? 'Expired' : license.status}
                                </span></div>
                                <div>HWID: {license.hwid || 'Not bound'}</div>
                                <div>Expires: {formatDate(license.expiresAt)}</div>
                                <div>Usage: {license.usageCount}x</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer style={{
        background: '#111',
        borderTop: '1px solid #333',
        padding: '60px 20px 40px'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
          <div style={{ marginBottom: '30px' }}>
            <div style={{ fontSize: '24px', fontWeight: '700', color: '#ff6b9d', marginBottom: '10px' }}>
              🌸 SakuraAuth
            </div>
            <p style={{ color: '#ccc', fontSize: '16px' }}>
              SakuraAuth is a game-changing, affordable and easy to use licensing solution for your software.
            </p>
          </div>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: '40px',
            marginBottom: '40px'
          }}>
            <div>
              <h4 style={{ color: '#ff6b9d', marginBottom: '15px' }}>Links</h4>
              <div style={{ color: '#ccc', fontSize: '14px' }}>
                <div style={{ marginBottom: '8px' }}>Documentation</div>
                <div style={{ marginBottom: '8px' }}>GitHub</div>
                <div style={{ marginBottom: '8px' }}>Support</div>
                <div style={{ marginBottom: '8px' }}>Reviews</div>
              </div>
            </div>
            
            <div>
              <h4 style={{ color: '#ff6b9d', marginBottom: '15px' }}>Examples</h4>
              <div style={{ color: '#ccc', fontSize: '14px' }}>
                <div style={{ marginBottom: '8px' }}>C++ (CPP)</div>
                <div style={{ marginBottom: '8px' }}>C# (CSharp)</div>
                <div style={{ marginBottom: '8px' }}>JavaScript (JS)</div>
                <div style={{ marginBottom: '8px' }}>Python (PY)</div>
              </div>
            </div>
            
            <div>
              <h4 style={{ color: '#ff6b9d', marginBottom: '15px' }}>Support</h4>
              <div style={{ color: '#ccc', fontSize: '14px' }}>
                <div style={{ marginBottom: '8px' }}>Support Center</div>
                <div style={{ marginBottom: '8px' }}>Demo Accounts</div>
                <div style={{ marginBottom: '8px' }}>Telegram</div>
                <div style={{ marginBottom: '8px' }}>Discord</div>
              </div>
            </div>
            
            <div>
              <h4 style={{ color: '#ff6b9d', marginBottom: '15px' }}>Legal</h4>
              <div style={{ color: '#ccc', fontSize: '14px' }}>
                <div style={{ marginBottom: '8px' }}>Terms of Service</div>
                <div style={{ marginBottom: '8px' }}>Privacy Policy</div>
                <div style={{ marginBottom: '8px' }}>Licensing</div>
                <div style={{ marginBottom: '8px' }}>GDPR</div>
              </div>
            </div>
          </div>
          
          <div style={{ 
            borderTop: '1px solid #333', 
            paddingTop: '20px', 
            color: '#888', 
            fontSize: '14px' 
          }}>
            © 2025 SakuraAuth LLC. All Rights Reserved.
          </div>
        </div>
      </footer>

      {/* Notification */}
      {result && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            background: result.success ? '#16a34a' : '#dc2626',
            color: 'white',
            padding: '16px 20px',
            borderRadius: '8px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
            zIndex: 1000,
            maxWidth: '400px'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>{result.message}</span>
            <button
              onClick={() => setResult(null)}
              style={{
                background: 'none',
                border: 'none',
                color: 'white',
                fontSize: '18px',
                cursor: 'pointer',
                marginLeft: '10px'
              }}
            >
              ×
            </button>
          </div>
          
          {result.data && result.data.license && (
            <div style={{ 
              marginTop: '10px', 
              padding: '10px', 
              background: 'rgba(255,255,255,0.1)', 
              borderRadius: '4px',
              fontSize: '12px'
            }}>
              <div>License: {result.data.license.key}</div>
              <div>Status: {result.data.license.status}</div>
              <div>HWID: {result.data.license.hwid || 'Not bound'}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default LicenseSystem;