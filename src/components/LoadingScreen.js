import { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
`;

const pulse = keyframes`
  0%, 100% { opacity: 0.4; transform: scale(0.8); }
  50% { opacity: 1; transform: scale(1.2); }
`;

const LoadingContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #000000 100%);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 9999;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.08) 0%, transparent 70%);
    pointer-events: none;
  }
`;

const LogoSection = styled.div`
  text-align: center;
  margin-bottom: 60px;
  animation: ${fadeIn} 1.2s ease-out;
  z-index: 2;
`;

const Logo = styled.img`
  width: 120px;
  height: auto;
  margin-bottom: 30px;
  filter: brightness(0) invert(1) drop-shadow(0 0 25px rgba(255, 255, 255, 0.4));
  
  @media (max-width: 768px) {
    width: 100px;
  }
`;

const BrandText = styled.div`
  font-size: 3rem;
  font-weight: 800;
  color: #ffffff;
  letter-spacing: 4px;
  text-shadow: 0 0 30px rgba(255, 255, 255, 0.4);
  margin-bottom: 15px;
  
  @media (max-width: 768px) {
    font-size: 2.2rem;
    letter-spacing: 3px;
  }
`;

const Subtitle = styled.div`
  font-size: 1.3rem;
  color: rgba(255, 255, 255, 0.8);
  font-weight: 300;
  letter-spacing: 3px;
  text-transform: uppercase;
  
  @media (max-width: 768px) {
    font-size: 1.1rem;
    letter-spacing: 2px;
  }
`;

const ProgressSection = styled.div`
  width: 350px;
  max-width: 80%;
  text-align: center;
  z-index: 2;
  
  @media (max-width: 768px) {
    width: 280px;
  }
`;

const ProgressTrack = styled.div`
  width: 100%;
  height: 6px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 20px;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.3);
`;

const ProgressBar = styled.div`
  width: ${props => props.progress}%;
  height: 100%;
  background: linear-gradient(90deg, #ffffff 0%, #f5f5f5 50%, #ffffff 100%);
  border-radius: 3px;
  transition: width 0.3s ease;
  box-shadow: 0 0 15px rgba(255, 255, 255, 0.6);
`;

const LoadingText = styled.div`
  color: rgba(255, 255, 255, 0.8);
  font-size: 15px;
  font-weight: 500;
  letter-spacing: 1px;
  margin-bottom: 30px;
`;

const DotsContainer = styled.div`
  display: flex;
  gap: 10px;
  justify-content: center;
`;

const Dot = styled.div`
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.6);
  animation: ${pulse} 1.8s ease-in-out ${props => props.delay}s infinite;
`;

export default function LoadingScreen() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 4;
      });
    }, 100);

    return () => clearInterval(interval);
  }, []);

  return (
    <LoadingContainer>
      <LogoSection>
        <Logo src="/images/logo.png" alt="VH Alfaiataria" />
        <Subtitle>Sistema de Gestão</Subtitle>
      </LogoSection>

      <ProgressSection>
        <ProgressTrack>
          <ProgressBar progress={progress} />
        </ProgressTrack>
        <LoadingText>Carregando sistema... {progress}%</LoadingText>
        <DotsContainer>
          <Dot delay={0} />
          <Dot delay={0.3} />
          <Dot delay={0.6} />
        </DotsContainer>
      </ProgressSection>
    </LoadingContainer>
  );
}