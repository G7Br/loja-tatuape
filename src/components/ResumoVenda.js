import React from 'react';
import styled from 'styled-components';

const Container = styled.div`
  background: ${props => props.darkMode ? '#1a1a1a' : '#ffffff'};
  border: 1px solid ${props => props.darkMode ? '#333' : '#e5e7eb'};
  border-radius: 0.75rem;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid ${props => props.darkMode ? '#333' : '#e5e7eb'};
`;

const Title = styled.h3`
  color: ${props => props.darkMode ? '#fff' : '#000'};
  margin: 0;
  font-size: 1.1rem;
`;

const Badge = styled.span`
  padding: 0.25rem 0.75rem;
  background: ${props => {
    if (props.type === 'success') return '#10b981';
    if (props.type === 'warning') return '#f59e0b';
    if (props.type === 'info') return '#3b82f6';
    return '#6b7280';
  }};
  color: white;
  border-radius: 1rem;
  font-size: 0.8rem;
  font-weight: 600;
`;

const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1rem;
`;

const InfoItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const InfoLabel = styled.span`
  font-size: 0.8rem;
  color: #888;
  font-weight: 500;
`;

const InfoValue = styled.span`
  font-size: 0.9rem;
  color: ${props => props.darkMode ? '#fff' : '#000'};
  font-weight: 600;
`;

const ItemsList = styled.div`
  max-height: 200px;
  overflow-y: auto;
  margin-bottom: 1rem;
`;

const Item = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
  border-bottom: 1px solid ${props => props.darkMode ? '#333' : '#f3f4f6'};
  
  &:last-child {
    border-bottom: none;
  }
`;

const ItemInfo = styled.div`
  flex: 1;
`;

const ItemName = styled.div`
  font-size: 0.9rem;
  font-weight: 600;
  color: ${props => props.darkMode ? '#fff' : '#000'};
`;

const ItemDetails = styled.div`
  font-size: 0.8rem;
  color: #888;
`;

const ItemPrice = styled.div`
  font-size: 0.9rem;
  font-weight: 600;
  color: #10b981;
`;

const TotalSection = styled.div`
  border-top: 1px solid ${props => props.darkMode ? '#333' : '#e5e7eb'};
  padding-top: 1rem;
`;

const TotalRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
  font-size: ${props => props.highlight ? '1.2rem' : '0.9rem'};
  font-weight: ${props => props.highlight ? '700' : '500'};
  color: ${props => {
    if (props.highlight) return '#10b981';
    return props.darkMode ? '#fff' : '#000';
  }};
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 8px;
  background: ${props => props.darkMode ? '#333' : '#e5e7eb'};
  border-radius: 4px;
  overflow: hidden;
  margin-top: 1rem;
`;

const ProgressFill = styled.div`
  height: 100%;
  background: linear-gradient(90deg, #10b981, #3b82f6);
  width: ${props => props.progress}%;
  transition: width 0.3s ease;
`;

export default function ResumoVenda({ 
  vendedor, 
  carrinho, 
  cliente, 
  desconto = 0, 
  darkMode,
  etapa = 1 
}) {
  const calcularSubtotal = () => {
    return carrinho.reduce((sum, item) => sum + (item.preco_venda * item.quantidade), 0);
  };

  const calcularTotal = () => {
    return Math.max(0, calcularSubtotal() - desconto);
  };

  const totalItens = carrinho.reduce((sum, item) => sum + item.quantidade, 0);

  const getEtapaInfo = () => {
    const etapas = [
      { id: 1, label: 'Vendedor', icon: '👤' },
      { id: 2, label: 'Produtos', icon: '🛍️' },
      { id: 3, label: 'Cliente', icon: '📝' },
      { id: 4, label: 'Pagamento', icon: '💳' }
    ];
    
    return etapas.find(e => e.id === etapa) || etapas[0];
  };

  const progresso = (etapa / 4) * 100;
  const etapaAtual = getEtapaInfo();

  return (
    <Container darkMode={darkMode}>
      <Header darkMode={darkMode}>
        <Title darkMode={darkMode}>Resumo da Venda</Title>
        <Badge type="info">
          {etapaAtual.icon} {etapaAtual.label}
        </Badge>
      </Header>

      <InfoGrid>
        <InfoItem>
          <InfoLabel>Vendedor</InfoLabel>
          <InfoValue darkMode={darkMode}>
            {vendedor?.nome || 'Não selecionado'}
          </InfoValue>
        </InfoItem>
        
        <InfoItem>
          <InfoLabel>Cliente</InfoLabel>
          <InfoValue darkMode={darkMode}>
            {cliente?.nome_completo || 'Não informado'}
          </InfoValue>
        </InfoItem>
        
        <InfoItem>
          <InfoLabel>Total de Itens</InfoLabel>
          <InfoValue darkMode={darkMode}>
            {totalItens} {totalItens === 1 ? 'item' : 'itens'}
          </InfoValue>
        </InfoItem>
        
        <InfoItem>
          <InfoLabel>Produtos Únicos</InfoLabel>
          <InfoValue darkMode={darkMode}>
            {carrinho.length} {carrinho.length === 1 ? 'produto' : 'produtos'}
          </InfoValue>
        </InfoItem>
      </InfoGrid>

      {carrinho.length > 0 && (
        <>
          <InfoLabel style={{ marginBottom: '0.5rem', display: 'block' }}>
            Itens no Carrinho
          </InfoLabel>
          <ItemsList>
            {carrinho.map(item => (
              <Item key={item.id} darkMode={darkMode}>
                <ItemInfo>
                  <ItemName darkMode={darkMode}>{item.nome}</ItemName>
                  <ItemDetails>
                    {item.quantidade}x R$ {item.preco_venda.toFixed(2)} • {item.codigo}
                  </ItemDetails>
                </ItemInfo>
                <ItemPrice>
                  R$ {(item.preco_venda * item.quantidade).toFixed(2)}
                </ItemPrice>
              </Item>
            ))}
          </ItemsList>
        </>
      )}

      <TotalSection>
        <TotalRow darkMode={darkMode}>
          <span>Subtotal:</span>
          <span>R$ {calcularSubtotal().toFixed(2)}</span>
        </TotalRow>
        
        {desconto > 0 && (
          <TotalRow darkMode={darkMode}>
            <span>Desconto:</span>
            <span style={{ color: '#ef4444' }}>- R$ {desconto.toFixed(2)}</span>
          </TotalRow>
        )}
        
        <TotalRow darkMode={darkMode} highlight>
          <span>Total:</span>
          <span>R$ {calcularTotal().toFixed(2)}</span>
        </TotalRow>
      </TotalSection>

      <ProgressBar darkMode={darkMode}>
        <ProgressFill progress={progresso} />
      </ProgressBar>
      
      <div style={{ 
        textAlign: 'center', 
        marginTop: '0.5rem', 
        fontSize: '0.8rem', 
        color: '#888' 
      }}>
        Progresso: {progresso.toFixed(0)}% concluído
      </div>
    </Container>
  );
}