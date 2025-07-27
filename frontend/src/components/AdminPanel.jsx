import React, { useEffect, useState } from 'react';
import axios from 'axios';

function AdminPanel() {
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [keys, setKeys] = useState([]);
  const [newKey, setNewKey] = useState('');
  const [newProduct, setNewProduct] = useState({ name: '', description: '' });

  const token = localStorage.getItem('token');

  useEffect(() => {
    axios.get('http://localhost:3001/api/products')
      .then(res => setProducts(res.data));
  }, []);

  useEffect(() => {
    if (selectedProduct) {
      axios.get(`http://localhost:3001/api/keys/${selectedProduct}`, {
        headers: { Authorization: `Bearer ${token}` }
      }).then(res => setKeys(res.data));
    } else {
      setKeys([]);
    }
  }, [selectedProduct, token]);

  const handleAddKey = async () => {
    if (!newKey || !selectedProduct) return;
    try {
      await axios.post('http://localhost:3001/api/keys', {
        product_id: selectedProduct,
        key: newKey
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNewKey('');
      // Refresh keys
      const res = await axios.get(`http://localhost:3001/api/keys/${selectedProduct}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setKeys(res.data);
    } catch (error) {
      alert('Error adding key: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleAddProduct = async () => {
    if (!newProduct.name) return;
    try {
      await axios.post('http://localhost:3001/api/products', newProduct, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNewProduct({ name: '', description: '' });
      // Refresh products
      const res = await axios.get('http://localhost:3001/api/products');
      setProducts(res.data);
    } catch (error) {
      alert('Error adding product: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleResetKey = async (keyValue) => {
    try {
      await axios.post('http://localhost:3001/api/reset-key', { key: keyValue }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Refresh keys
      if (selectedProduct) {
        const res = await axios.get(`http://localhost:3001/api/keys/${selectedProduct}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setKeys(res.data);
      }
    } catch (error) {
      alert('Error resetting key: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleDeleteKey = async (keyId) => {
    if (!confirm('Are you sure you want to delete this key?')) return;
    try {
      await axios.delete(`http://localhost:3001/api/keys/${keyId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Refresh keys
      if (selectedProduct) {
        const res = await axios.get(`http://localhost:3001/api/keys/${selectedProduct}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setKeys(res.data);
      }
    } catch (error) {
      alert('Error deleting key: ' + (error.response?.data?.message || error.message));
    }
  };

  const generateRandomKey = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 16; i++) {
      if (i > 0 && i % 4 === 0) result += '-';
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewKey(result);
  };

  return (
    <div>
      <h2>Admin Panel</h2>
      
      <div style={{ marginBottom: 20 }}>
        <select onChange={e => setSelectedProduct(e.target.value)} value={selectedProduct || ''}>
          <option value="">Select Product</option>
          {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      {selectedProduct && (
        <div style={{ marginBottom: 20 }}>
          <h3>Keys for {products.find(p => p.id == selectedProduct)?.name}</h3>
          <div style={{ marginBottom: 10 }}>
            <strong>Total Keys:</strong> {keys.length} | 
            <strong> Used:</strong> {keys.filter(k => k.is_used).length} | 
            <strong> Available:</strong> {keys.filter(k => !k.is_used).length}
          </div>
          
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 15 }}>
            <thead>
              <tr style={{ backgroundColor: '#f5f5f5' }}>
                <th style={{ border: '1px solid #ddd', padding: 8 }}>Key</th>
                <th style={{ border: '1px solid #ddd', padding: 8 }}>Status</th>
                <th style={{ border: '1px solid #ddd', padding: 8 }}>HWID</th>
                <th style={{ border: '1px solid #ddd', padding: 8 }}>Created</th>
                <th style={{ border: '1px solid #ddd', padding: 8 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {keys.map(k => (
                <tr key={k.id}>
                  <td style={{ border: '1px solid #ddd', padding: 8, fontFamily: 'monospace' }}>
                    {k.key}
                  </td>
                  <td style={{ border: '1px solid #ddd', padding: 8 }}>
                    <span style={{ 
                      color: k.is_used ? 'red' : 'green',
                      fontWeight: 'bold'
                    }}>
                      {k.is_used ? 'USED' : 'AVAILABLE'}
                    </span>
                  </td>
                  <td style={{ border: '1px solid #ddd', padding: 8, fontFamily: 'monospace', fontSize: '12px' }}>
                    {k.hwid || 'Not bound'}
                  </td>
                  <td style={{ border: '1px solid #ddd', padding: 8 }}>
                    {k.created_at ? new Date(k.created_at).toLocaleDateString() : 'Unknown'}
                  </td>
                  <td style={{ border: '1px solid #ddd', padding: 8 }}>
                    {k.is_used && (
                      <button 
                        style={{ marginRight: 5, padding: '2px 8px' }}
                        onClick={() => handleResetKey(k.key)}
                      >
                        Reset HWID
                      </button>
                    )}
                    <button 
                      style={{ padding: '2px 8px', backgroundColor: '#ff4444', color: 'white' }}
                      onClick={() => handleDeleteKey(k.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          <div>
            <input 
              placeholder="New Key" 
              value={newKey} 
              onChange={e => setNewKey(e.target.value)}
              style={{ marginRight: 10, padding: 5, width: 200 }}
            />
            <button onClick={generateRandomKey} style={{ marginRight: 10, padding: 5 }}>
              Generate Random
            </button>
            <button onClick={handleAddKey} style={{ padding: 5 }}>
              Add Key
            </button>
          </div>
        </div>
      )}
      
      <div style={{ marginTop: 30, borderTop: '1px solid #ddd', paddingTop: 20 }}>
        <h3>Add Product</h3>
        <div>
          <input 
            placeholder="Product Name" 
            value={newProduct.name} 
            onChange={e => setNewProduct(p => ({...p, name: e.target.value}))}
            style={{ marginRight: 10, padding: 5 }}
          />
          <input 
            placeholder="Description" 
            value={newProduct.description} 
            onChange={e => setNewProduct(p => ({...p, description: e.target.value}))}
            style={{ marginRight: 10, padding: 5 }}
          />
          <button onClick={handleAddProduct} style={{ padding: 5 }}>
            Add Product
          </button>
        </div>
      </div>
    </div>
  );
}

export default AdminPanel;