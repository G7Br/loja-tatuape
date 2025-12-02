import { useState, useEffect } from 'react';
import { ThemeProvider } from '../../contexts/ThemeContext';
import { authService } from '../../utils/supabase';
import LoginMogi from '../../components/mogi/LoginMogi';
import CaixaMogi from '../../components/mogi/CaixaMogi';

export default function MogiPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    if (currentUser && currentUser.loja === 'mogi') {
      const userRole = currentUser.cargo || currentUser.tipo;
      // Redirecionar para a página específica do cargo se não for caixa
      if (userRole === 'vendedor') {
        window.location.href = '/mogi/vendedor';
        return;
      } else if (userRole === 'gerente') {
        window.location.href = '/mogi/gerente';
        return;
      }
      // Se for caixa ou outro cargo, manter na página atual
      setUser(currentUser);
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
          <h2>Carregando Sistema Mogi...</h2>
        </div>
      </div>
    );
  }

  return (
    <ThemeProvider>
      {!user ? (
        <LoginMogi onLogin={handleLogin} />
      ) : (
        <CaixaMogi user={user} onLogout={handleLogout} />
      )}
    </ThemeProvider>
  );
}