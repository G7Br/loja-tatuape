import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { authService } from '../../utils/supabase';
import LoadingScreen from '../LoadingScreen';

const LoginScreen = styled.div`
  display: flex;
  width: 100vw;
  min-height: 100vh;
  background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #000000 100%);
  position: relative;
  margin: 0;
  padding: 0;
  
  @media (max-width: 768px) {
    flex-direction: column;
  }
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: radial-gradient(circle at 30% 20%, rgba(255, 255, 255, 0.08) 0%, transparent 60%),
                radial-gradient(circle at 70% 80%, rgba(255, 255, 255, 0.05) 0%, transparent 60%);
    pointer-events: none;
  }
`;

const LeftPanel = styled.div`
  flex: 1.2;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 60px 40px;
  position: relative;
  z-index: 2;
  
  @media (max-width: 768px) {
    flex: none;
    padding: 40px 20px;
    min-height: 40vh;
  }
`;

const RightPanel = styled.div`
  flex: 0.8;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 60px 40px;
  position: relative;
  z-index: 2;
  
  @media (max-width: 768px) {
    flex: none;
    padding: 20px;
    min-height: 60vh;
  }
`;

const LogoContainer = styled.div`
  text-align: center;
  margin-bottom: 40px;
  
  @media (max-width: 768px) {
    margin-bottom: 20px;
  }
`;

const Subtitle = styled.div`
  font-size: 1.4rem;
  color: rgba(255, 255, 255, 0.8);
  font-weight: 300;
  letter-spacing: 2px;
  text-transform: uppercase;
  
  @media (max-width: 450px) {
    font-size: 1.1rem;
    letter-spacing: 1px;
  }
`;

const LoginForm = styled.div`
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(25px);
  padding: 60px 50px;
  border-radius: 28px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 40px 80px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.05);
  width: 100%;
  max-width: 480px;
  position: relative;
  
  @media (max-width: 768px) {
    padding: 40px 30px;
    border-radius: 20px;
    max-width: 100%;
    margin: 0 20px;
  }
`;

const FormTitle = styled.h2`
  text-align: center;
  margin-bottom: 40px;
  color: #ffffff;
  font-weight: 600;
  font-size: 1.8rem;
  
  @media (max-width: 450px) {
    font-size: 1.5rem;
    margin-bottom: 30px;
  }
`;

const Label = styled.label`
  display: block;
  margin-bottom: 12px;
  color: #ffffff;
  font-weight: 600;
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 1px;
  
  @media (max-width: 450px) {
    margin-bottom: 8px;
    font-size: 0.85rem;
  }
`;

const Input = styled.input`
  width: 100%;
  padding: 20px;
  margin-bottom: 30px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 18px;
  color: #ffffff;
  font-size: 16px;
  transition: all 0.3s ease;
  box-sizing: border-box;
  
  @media (max-width: 768px) {
    padding: 18px;
    margin-bottom: 25px;
    border-radius: 14px;
  }
  
  &:focus { 
    outline: none; 
    background: rgba(255, 255, 255, 0.15);
    border-color: rgba(255, 255, 255, 0.3);
    box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.1), 0 8px 25px rgba(0, 0, 0, 0.3);
    transform: translateY(-3px);
  }
  &::placeholder { color: rgba(255, 255, 255, 0.6); }
`;

const Button = styled.button`
  width: 100%;
  padding: 22px;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: #ffffff;
  border: none;
  border-radius: 18px;
  font-weight: 700;
  font-size: 17px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 12px 30px rgba(16, 185, 129, 0.25);
  text-transform: uppercase;
  letter-spacing: 1.5px;
  box-sizing: border-box;
  margin-top: 10px;
  
  @media (max-width: 768px) {
    padding: 20px;
    border-radius: 14px;
    font-size: 16px;
  }
  
  &:hover { 
    transform: translateY(-4px);
    box-shadow: 0 16px 40px rgba(16, 185, 129, 0.35);
    background: linear-gradient(135deg, #059669 0%, #047857 100%);
  }
  &:active { transform: translateY(-2px); }
  &:disabled { opacity: 0.7; cursor: not-allowed; transform: none; }
`;

const Error = styled.div`
  color: #ff6b6b;
  text-align: center;
  margin-top: 20px;
  padding: 12px;
  background: rgba(255, 107, 107, 0.1);
  border-radius: 8px;
  border: none;
`;

const ResponsiveImage = styled.img`
  width: 100px;
  height: auto;
  margin-bottom: 30px;
  filter: brightness(0) invert(1) drop-shadow(0 0 20px rgba(255, 255, 255, 0.3));
  transition: transform 0.3s ease;
  cursor: pointer;
  
  &:hover {
    transform: scale(1.05);
    animation: logoFloat 0.6s ease-in-out;
  }
  
  @media (max-width: 768px) {
    width: 150px;
    margin-bottom: 40px;
  }
  
  @keyframes logoFloat {
    0%, 100% { transform: translateY(0px) rotate(0deg) scale(1.05); }
    25% { transform: translateY(-8px) rotate(2deg) scale(1.08); }
    50% { transform: translateY(-4px) rotate(-1deg) scale(1.1); }
    75% { transform: translateY(-6px) rotate(1deg) scale(1.07); }
  }
`;

const StoreIndicator = styled.div`
  position: absolute;
  top: 20px;
  right: 20px;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 2rem;
  font-weight: 700;
  font-size: 0.9rem;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
  z-index: 1000;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

export default function LoginMogi({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setInitialLoading(false);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  if (initialLoading) {
    return <LoadingScreen />;
  }

  const handleLogin = async () => {
    setError('');
    setLoading(true);
    
    if (!username || !password) {
      setError('Preencha todos os campos');
      setLoading(false);
      return;
    }
    
    try {
      const { user, error, redirectPath } = await authService.login(username, password);
      
      if (error) {
        setError(error);
      } else {
        // Se o usuário é de Mogi, redirecionar para a página correta
        if (user && user.loja === 'mogi' && redirectPath) {
          window.location.href = redirectPath;
        } else {
          onLogin(user);
        }
      }
    } catch (error) {
      console.error('Erro no login:', error);
      setError('Erro ao conectar com o servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LoginScreen>
      <StoreIndicator>
        🏪 LOJA MOGI DAS CRUZES
      </StoreIndicator>
      
      <LeftPanel>
        <LogoContainer>
          <ResponsiveImage 
            src="/images/logo.png" 
            alt="VH Alfaiataria" 
          />
          <Subtitle>Sistema de Gestão - Mogi</Subtitle>
        </LogoContainer>
      </LeftPanel>
      
      <RightPanel>
        <LoginForm>
          <FormTitle>Acesso ao Sistema</FormTitle>
          
          <Label>Email</Label>
          <Input
            type="email"
            placeholder="Digite seu email"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <Label>Senha</Label>
          <Input
            type="password"
            placeholder="Digite sua senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button onClick={handleLogin} disabled={loading}>
            {loading ? 'ENTRANDO...' : 'ENTRAR'}
          </Button>

          {error && <Error>{error}</Error>}
        </LoginForm>
      </RightPanel>
    </LoginScreen>
  );
}