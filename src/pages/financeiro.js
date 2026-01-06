import { useState, useEffect } from 'react';
import { authService } from '../utils/supabase';
import { useTheme } from '../contexts/ThemeContext';
import Login from '../components/Login';
import FinanceiroPage from '../components/Financeiro';

export default function Financeiro() {
  const { darkMode } = useTheme();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    if (currentUser) {
      // Verificar se é usuário financeiro
      if (currentUser.tipo === 'financeiro' || currentUser.cargo === 'financeiro') {
        setUser(currentUser);
      } else {
        // Redirecionar para página apropriada se não for financeiro
        window.location.href = '/';
        return;
      }
    }
    setLoading(false);
  }, []);

  const handleLogin = (userData) => {
    if (userData.tipo === 'financeiro' || userData.cargo === 'financeiro') {
      setUser(userData);
    } else {
      alert('Acesso negado. Esta área é restrita ao setor financeiro.');
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
        Carregando sistema financeiro...
      </div>
    );
  }

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return <FinanceiroPage user={user} onLogout={handleLogout} />;
}