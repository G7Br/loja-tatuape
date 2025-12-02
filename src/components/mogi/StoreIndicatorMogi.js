import React from 'react';
import styled from 'styled-components';

const Indicator = styled.div`
  position: fixed;
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
  animation: pulse 2s infinite;
  
  @keyframes pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.05); }
  }
`;

export default function StoreIndicatorMogi() {
  return (
    <Indicator>
      🏪 LOJA MOGI DAS CRUZES
    </Indicator>
  );
}