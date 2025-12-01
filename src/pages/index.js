import { useState, useEffect } from 'react';
import { authService } from '../utils/supabase';
import { useTheme } from '../contexts/ThemeContext';
import Login from '../components/Login';
import Gerente from '../components/Gerente';
import Vendedor from '../components/Vendedor';
import Caixa from '../components/Caixa';

export default function Home() {
  const { darkMode } = useTheme();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
    }
    setLoading(false);
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
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
        Carregando...
      </div>
    );
  }

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  // Renderizar componente baseado no tipo de usuário
  switch (user.tipo) {
    case 'gerente':
      return <Gerente user={user} onLogout={handleLogout} />;
    case 'vendedor':
      return <Vendedor user={user} onLogout={handleLogout} />;
    case 'caixa':
      return <Caixa user={user} onLogout={handleLogout} />;
    default:
      return (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          background: darkMode ? '#1a1a1a' : '#ffffff',
          color: darkMode ? '#ffffff' : '#000000',
          flexDirection: 'column',
          gap: '20px'
        }}>
          <h1>Tipo de usuário não reconhecido</h1>
          <button
            onClick={handleLogout}
            style={{
              padding: '12px 24px',
              background: darkMode ? '#ffffff' : '#000000',
              color: darkMode ? '#000000' : '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Voltar ao Login
          </button>
        </div>
      );
  }
}
