import { useState } from 'react';
import ProductList from './components/ProductList';
import Login from './components/Login';
import AdminPanel from './components/AdminPanel';

function App() {
  const [isAdmin, setIsAdmin] = useState(!!localStorage.getItem('token'));

  const handleLogin = (admin) => {
    setIsAdmin(admin);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsAdmin(false);
  };

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: 20 }}>
      <h1>Digital Product Key Store</h1>
      <ProductList />
      {isAdmin ? (
        <>
          <button onClick={handleLogout}>Logout</button>
          <AdminPanel />
        </>
      ) : (
        <Login onLogin={handleLogin} />
      )}
    </div>
  );
}

export default App;
