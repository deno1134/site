import { useState } from 'react';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

function LicenseSystem() {
  const [licenseKey, setLicenseKey] = useState('');
  const [hwid, setHwid] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('verify');

  // Admin states
  const [adminApiKey, setAdminApiKey] = useState('admin-api-key-change-this-in-production');
  const [licenseType, setLicenseType] = useState('30d');
  const [licenses, setLicenses] = useState([]);

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
        fetchLicenses(); // Refresh license list
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
        fetchLicenses(); // Refresh license list
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

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h1 style={{ color: '#333', marginBottom: '10px' }}>🔐 Lisans Yönetim Sistemi</h1>
        <p style={{ color: '#666' }}>API tabanlı lisans doğrulama ve yönetim paneli</p>
      </div>

      {/* Tab Navigation */}
      <div style={{ display: 'flex', marginBottom: '20px', borderBottom: '2px solid #eee' }}>
        <button
          onClick={() => setActiveTab('verify')}
          style={{
            padding: '10px 20px',
            border: 'none',
            background: activeTab === 'verify' ? '#007bff' : '#f8f9fa',
            color: activeTab === 'verify' ? 'white' : '#333',
            cursor: 'pointer',
            borderRadius: '5px 5px 0 0'
          }}
        >
          🔍 Lisans Doğrula
        </button>
        <button
          onClick={() => setActiveTab('admin')}
          style={{
            padding: '10px 20px',
            border: 'none',
            background: activeTab === 'admin' ? '#007bff' : '#f8f9fa',
            color: activeTab === 'admin' ? 'white' : '#333',
            cursor: 'pointer',
            borderRadius: '5px 5px 0 0',
            marginLeft: '5px'
          }}
        >
          👨‍💼 Admin Panel
        </button>
      </div>

      {/* License Verification Tab */}
      {activeTab === 'verify' && (
        <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
          <h3 style={{ marginTop: 0, color: '#333' }}>Lisans Doğrulama</h3>
          
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', color: '#555' }}>
              Lisans Anahtarı:
            </label>
            <input
              type="text"
              value={licenseKey}
              onChange={(e) => setLicenseKey(e.target.value)}
              placeholder="XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX"
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px'
              }}
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', color: '#555' }}>
              Hardware ID (HWID):
            </label>
            <input
              type="text"
              value={hwid}
              onChange={(e) => setHwid(e.target.value)}
              placeholder="unique-hardware-identifier"
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px'
              }}
            />
          </div>

          <button
            onClick={verifyLicense}
            disabled={loading}
            style={{
              background: '#28a745',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '16px',
              opacity: loading ? 0.6 : 1
            }}
          >
            {loading ? '⏳ Doğrulanıyor...' : '✅ Lisansı Doğrula'}
          </button>
        </div>
      )}

      {/* Admin Panel Tab */}
      {activeTab === 'admin' && (
        <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
          <h3 style={{ marginTop: 0, color: '#333' }}>Admin Paneli</h3>
          
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', color: '#555' }}>
              Admin API Key:
            </label>
            <input
              type="password"
              value={adminApiKey}
              onChange={(e) => setAdminApiKey(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '5px', color: '#555' }}>
                Lisans Türü:
              </label>
              <select
                value={licenseType}
                onChange={(e) => setLicenseType(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              >
                <option value="7d">7 Gün</option>
                <option value="30d">30 Gün</option>
                <option value="90d">90 Gün</option>
                <option value="365d">1 Yıl</option>
                <option value="lifetime">Süresiz</option>
              </select>
            </div>
            <div style={{ flex: 1, display: 'flex', alignItems: 'end' }}>
              <button
                onClick={createLicense}
                disabled={loading}
                style={{
                  background: '#007bff',
                  color: 'white',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '4px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontSize: '16px',
                  opacity: loading ? 0.6 : 1,
                  width: '100%'
                }}
              >
                {loading ? '⏳ Oluşturuluyor...' : '🔑 Lisans Oluştur'}
              </button>
            </div>
          </div>

          <button
            onClick={fetchLicenses}
            disabled={loading}
            style={{
              background: '#6c757d',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              opacity: loading ? 0.6 : 1,
              marginBottom: '15px'
            }}
          >
            {loading ? '⏳ Yükleniyor...' : '📋 Lisansları Yükle'}
          </button>

          {/* License List */}
          {licenses.length > 0 && (
            <div style={{ marginTop: '20px' }}>
              <h4 style={{ color: '#333' }}>Mevcut Lisanslar:</h4>
              <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {licenses.map((license, index) => (
                  <div
                    key={index}
                    style={{
                      background: 'white',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      padding: '15px',
                      marginBottom: '10px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <strong style={{ color: '#333' }}>{license.key}</strong>
                        <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                          Durum: <span style={{ 
                            color: license.status === 'active' ? '#28a745' : '#dc3545',
                            fontWeight: 'bold'
                          }}>
                            {license.status}
                          </span>
                          {license.isExpired && <span style={{ color: '#dc3545' }}> (Süresi Dolmuş)</span>}
                        </div>
                        <div style={{ fontSize: '12px', color: '#666' }}>
                          HWID: {license.hwid || 'Bağlanmamış'}
                        </div>
                        <div style={{ fontSize: '12px', color: '#666' }}>
                          Bitiş: {formatDate(license.expiresAt)}
                        </div>
                        <div style={{ fontSize: '12px', color: '#666' }}>
                          Kullanım: {license.usageCount} kez
                        </div>
                      </div>
                      <button
                        onClick={() => resetHWID(license.key)}
                        disabled={loading || !license.hwid}
                        style={{
                          background: '#ffc107',
                          color: '#212529',
                          border: 'none',
                          padding: '8px 12px',
                          borderRadius: '4px',
                          cursor: loading || !license.hwid ? 'not-allowed' : 'pointer',
                          fontSize: '12px',
                          opacity: loading || !license.hwid ? 0.6 : 1
                        }}
                      >
                        🔄 HWID Sıfırla
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Result Display */}
      {result && (
        <div
          style={{
            background: result.success ? '#d4edda' : '#f8d7da',
            border: `1px solid ${result.success ? '#c3e6cb' : '#f5c6cb'}`,
            color: result.success ? '#155724' : '#721c24',
            padding: '15px',
            borderRadius: '8px',
            marginTop: '20px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontSize: '20px', marginRight: '10px' }}>
              {result.success ? '✅' : '❌'}
            </span>
            <strong>{result.message}</strong>
          </div>
          
          {result.data && result.data.license && (
            <div style={{ 
              background: 'rgba(255,255,255,0.7)', 
              padding: '10px', 
              borderRadius: '4px',
              fontSize: '14px'
            }}>
              <div><strong>Lisans:</strong> {result.data.license.key}</div>
              <div><strong>HWID:</strong> {result.data.license.hwid || 'Bağlanmamış'}</div>
              <div><strong>Durum:</strong> {result.data.license.status}</div>
              <div><strong>Bitiş Tarihi:</strong> {formatDate(result.data.license.expiresAt)}</div>
              <div><strong>Kullanım Sayısı:</strong> {result.data.license.usageCount}</div>
              {result.data.server_time && (
                <div><strong>Sunucu Zamanı:</strong> {new Date(result.data.server_time).toLocaleString('tr-TR')}</div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div style={{ 
        textAlign: 'center', 
        marginTop: '40px', 
        padding: '20px', 
        borderTop: '1px solid #eee',
        color: '#666',
        fontSize: '14px'
      }}>
        <p>🔐 Güvenli Lisans Sistemi v1.0</p>
        <p>API Endpoint: {API_BASE_URL}</p>
      </div>
    </div>
  );
}

export default LicenseSystem;