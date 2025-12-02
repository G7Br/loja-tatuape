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
      // Se o usuário é de Mogi, redirecionar para a página correta baseada no cargo
      if (currentUser.loja === 'mogi') {
        if (currentUser.cargo === 'vendedor') {
          window.location.href = '/mogi/vendedor';
        } else if (currentUser.cargo === 'gerente') {
          window.location.href = '/mogi/gerente';
        } else {
          window.location.href = '/mogi';
        }
        return;
      }
      // Usuário de Tatuapé
      setUser(currentUser);
    }
    setLoading(false);
  }, []);

  const handleLogin = (userData) => {
    // Se o usuário logado é de Mogi, será redirecionado automaticamente no componente Login
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

  // Renderizar componente baseado no cargo do usuário
  switch (user.cargo || user.tipo) {
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
          <h1>Cargo de usuário não reconhecido</h1>
          <p>Cargo: {user.cargo || user.tipo || 'Não definido'}</p>
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
