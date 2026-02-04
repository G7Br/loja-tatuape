import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import FinanceiroCompleto from '../components/FinanceiroCompleto';

export default function FinanceiroCompletoPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      if (parsedUser.tipo === 'ceo' || parsedUser.tipo === 'financeiro') {
        setUser(parsedUser);
      } else {
        router.push('/');
      }
    } else {
      router.push('/');
    }
    setLoading(false);
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    router.push('/');
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        background: '#000',
        color: '#fff'
      }}>
        Carregando...
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <FinanceiroCompleto user={user} onLogout={handleLogout} />;
}