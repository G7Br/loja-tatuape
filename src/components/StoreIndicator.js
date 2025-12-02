import styled from 'styled-components';
import { authService } from '../utils/supabase';

const StoreIndicatorContainer = styled.div`
  position: fixed;
  top: 20px;
  right: 20px;
  background: ${props => props.store === 'tatuape' ? 'linear-gradient(135deg, #4CAF50, #45a049)' : 'linear-gradient(135deg, #2196F3, #1976D2)'};
  color: white;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 1px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.3);
  z-index: 1000;
  
  @media (max-width: 768px) {
    top: 10px;
    right: 10px;
    font-size: 10px;
    padding: 6px 12px;
  }
`;

export default function StoreIndicator() {
  const currentStore = authService.getCurrentStore();
  const storeName = currentStore === 'tatuape' ? 'Loja Tatuapé' : 'Loja Mogi';
  
  return (
    <StoreIndicatorContainer store={currentStore}>
      {storeName}
    </StoreIndicatorContainer>
  );
}