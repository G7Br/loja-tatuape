import { useState, useEffect } from 'react';
import { authService } from '../../utils/supabase';
import { useTheme } from '../../contexts/ThemeContext';
import Login from '../../components/Login';
import VendedorOnline from '../../components/online/VendedorOnline';
import GerenteOnline from '../../components/online/GerenteOnline';
import SeparadorOnline from '../../components/online/SeparadorOnline';
import CaixaOnline from '../../components/online/CaixaOnline';

export default function OnlineSystem() {
  const { darkMode } = useTheme();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    if (currentUser) {
      const tiposOnline = ['vendedor_online', 'gerente_online', 'separador_online', 'caixa_online'];
      const userType = currentUser.tipo_usuario || currentUser.tipo || currentUser.cargo;
      if (tiposOnline.includes(userType)) {
        setUser(currentUser);
      } else {
        window.location.href = '/';
        return;
      }
    }
    setLoading(false);
  }, []);

  const handleLogin = (userData) => {
    const tiposOnline = ['vendedor_online', 'gerente_online', 'separador_online', 'caixa_online'];
    const userType = userData.tipo_usuario || userData.tipo || userData.cargo;
    if (tiposOnline.includes(userType)) {
      setUser(userData);
    } else {
      alert('Acesso negado. Esta área é restrita ao sistema online.');
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
        Carregando sistema online...
      </div>
    );
  }

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  const userType = user.tipo_usuario || user.cargo || user.tipo;
  
  switch (userType) {
    case 'vendedor_online':
      return <VendedorOnline user={user} onLogout={handleLogout} />;
    case 'gerente_online':
      return <GerenteOnline user={user} onLogout={handleLogout} />;
    case 'separador_online':
      return <SeparadorOnline user={user} onLogout={handleLogout} />;
    case 'caixa_online':
      return <CaixaOnline user={user} onLogout={handleLogout} />;
    default:
      return (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          background: '#000000',
          color: '#ffffff',
          flexDirection: 'column',
          gap: '20px'
        }}>
          <h1>Tipo de usuário online não reconhecido: {userType}</h1>
          <p>Tipos válidos: vendedor_online, gerente_online, separador_online, caixa_online</p>
          <button onClick={handleLogout}>Voltar ao Login</button>
        </div>
      );
  }
}