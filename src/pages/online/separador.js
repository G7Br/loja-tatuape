import { useState, useEffect } from 'react';
import { authService } from '../../utils/supabase';
import { useTheme } from '../../contexts/ThemeContext';
import Login from '../../components/Login';
import SeparadorOnlineNovo from '../../components/online/SeparadorOnlineNovo';

export default function SeparadorPage() {
  const { darkMode } = useTheme();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    if (currentUser) {
      if (currentUser.tipo === 'separador_online' || currentUser.cargo === 'separador_online') {
        setUser(currentUser);
      } else {
        window.location.href = '/';
        return;
      }
    }
    setLoading(false);
  }, []);

  const handleLogin = (userData) => {
    if (userData.tipo === 'separador_online' || userData.cargo === 'separador_online') {
      setUser(userData);
    } else {
      alert('Acesso negado. Esta área é restrita aos separadores.');
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

  return <SeparadorOnlineNovo user={user} onLogout={handleLogout} />;
}