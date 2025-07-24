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
  };

  const handleAddProduct = async () => {
    if (!newProduct.name) return;
    await axios.post('http://localhost:3001/api/products', newProduct, {
      headers: { Authorization: `Bearer ${token}` }
    });
    setNewProduct({ name: '', description: '' });
    // Refresh products
    const res = await axios.get('http://localhost:3001/api/products');
    setProducts(res.data);
  };

  return (
    <div>
      <h2>Admin Panel</h2>
      <select onChange={e => setSelectedProduct(e.target.value)} value={selectedProduct || ''}>
        <option value="">Select Product</option>
        {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
      </select>
      {selectedProduct && (
        <div>
          <h3>Keys</h3>
          <ul>
            {keys.map(k => <li key={k.id}>{k.key} {k.is_used ? '(used)' : ''}</li>)}
          </ul>
          <input placeholder="New Key" value={newKey} onChange={e => setNewKey(e.target.value)} />
          <button onClick={handleAddKey}>Add Key</button>
        </div>
      )}
      <div style={{marginTop:20}}>
        <h3>Add Product</h3>
        <input placeholder="Name" value={newProduct.name} onChange={e => setNewProduct(p => ({...p, name: e.target.value}))} />
        <input placeholder="Description" value={newProduct.description} onChange={e => setNewProduct(p => ({...p, description: e.target.value}))} />
        <button onClick={handleAddProduct}>Add Product</button>
      </div>
    </div>
  );
}

export default AdminPanel;