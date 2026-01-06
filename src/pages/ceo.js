import { useState, useEffect } from 'react';
import { authService } from '../utils/supabase';
import { useTheme } from '../contexts/ThemeContext';
import Login from '../components/Login';
import CEOComponent from '../components/CEO';

export default function CEOPage() {
  const { darkMode } = useTheme();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    if (currentUser) {
      // Verificar se é usuário CEO
      if (currentUser.tipo === 'ceo' || currentUser.cargo === 'ceo' || currentUser.email === 'ceo@vh.com') {
        setUser(currentUser);
      } else {
        // Redirecionar para página apropriada se não for CEO
        window.location.href = '/';
        return;
      }
    }
    setLoading(false);
  }, []);

  const handleLogin = (userData) => {
    if (userData.tipo === 'ceo' || userData.cargo === 'ceo' || userData.email === 'ceo@vh.com') {
      setUser(userData);
    } else {
      alert('Acesso negado. Esta área é restrita ao CEO.');
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
        background: darkMode ? '#1a1a1a' : '#ffffff',
        color: darkMode ? '#ffffff' : '#000000',
        fontSize: '1.5rem'
      }}>
        Carregando área do CEO...
      </div>
    );
  }

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return <CEOComponent user={user} onLogout={handleLogout} />;
}