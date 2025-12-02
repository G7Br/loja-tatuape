import { useState, useEffect } from 'react';
import { ThemeProvider } from '../../contexts/ThemeContext';
import { authService } from '../../utils/supabase';
import LoginMogi from '../../components/mogi/LoginMogi';
import GerenteMogi from '../../components/mogi/GerenteMogi';

export default function GerenteMogiPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    if (currentUser && currentUser.loja === 'mogi') {
      const userRole = currentUser.cargo || currentUser.tipo;
      if (userRole === 'gerente') {
        setUser(currentUser);
      } else {
        // Redirecionar para a página correta baseada no cargo
        if (userRole === 'vendedor') {
          window.location.href = '/mogi/vendedor';
        } else {
          window.location.href = '/mogi';
        }
        return;
      }
    } else if (currentUser && currentUser.loja === 'tatuape') {
      // Usuário de Tatuapé tentando acessar Mogi
      window.location.href = '/';
      return;
    }
    setLoading(false);
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = async () => {
    await authService.signOut();
    window.location.href = '/';
    setUser(null);
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: '#0f0f0f',
        color: '#fff'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⏳</div>
          <h2>Carregando Sistema Gerente Mogi...</h2>
        </div>
      </div>
    );
  }

  return (
    <ThemeProvider>
      {!user ? (
        <LoginMogi onLogin={handleLogin} />
      ) : (
        <GerenteMogi user={user} onLogout={handleLogout} />
      )}
    </ThemeProvider>
  );
}