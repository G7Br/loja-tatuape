import { useState, useEffect } from 'react';
import { authService } from '../../utils/supabase';
import { useTheme } from '../../contexts/ThemeContext';
import Login from '../../components/Login';
import VendedorOnlineNovo from '../../components/online/VendedorOnlineNovo';

export default function VendedorPage() {
  const { darkMode } = useTheme();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    if (currentUser) {
      if (currentUser.tipo === 'vendedor_online' || currentUser.cargo === 'vendedor_online') {
        setUser(currentUser);
      } else {
        window.location.href = '/';
        return;
      }
    }
    setLoading(false);
  }, []);

  const handleLogin = (userData) => {
    if (userData.tipo === 'vendedor_online' || userData.cargo === 'vendedor_online') {
      setUser(userData);
    } else {
      alert('Acesso negado. Esta área é restrita aos vendedores online.');
      authService.signOut();
    }
  };

  const handleLogout = async () => {
    await authService.signOut();
    setUser(null);
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: '#000000',
        color: '#ffffff',
        fontSize: '1.5rem'
      }}>
        Carregando...
      </div>
    );
  }

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return <VendedorOnlineNovo user={user} onLogout={handleLogout} />;
}