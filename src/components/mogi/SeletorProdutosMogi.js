import React, { useState } from 'react';
import styled from 'styled-components';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
`;

const SearchInput = styled.input.withConfig({
  shouldForwardProp: (prop) => !['darkMode'].includes(prop)
})`
  width: 100%;
  padding: 0.75rem;
  margin-bottom: 1rem;
  border: 1px solid ${props => props.darkMode ? '#333' : '#e5e7eb'};
  border-radius: 0.5rem;
  background: ${props => props.darkMode ? '#2a2a2a' : '#ffffff'};
  color: ${props => props.darkMode ? '#ffffff' : '#1a1a1a'};
  font-size: 1rem;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
  }
`;

const ProductGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
  overflow-y: auto;
  max-height: 500px;
`;

const ProductCard = styled.div.withConfig({
  shouldForwardProp: (prop) => !['darkMode'].includes(prop)
})`
  background: ${props => props.darkMode ? '#2a2a2a' : '#ffffff'};
  border: 1px solid ${props => props.darkMode ? '#333' : '#e5e7eb'};
  border-radius: 0.75rem;
  padding: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    border-color: #3b82f6;
  }
`;

const ProductImage = styled.div.withConfig({
  shouldForwardProp: (prop) => !['darkMode'].includes(prop)
})`
  height: 120px;
  background: ${props => props.darkMode ? '#1a1a1a' : '#f8f9fa'};
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 0.75rem;
  color: ${props => props.darkMode ? '#666' : '#999'};
  font-size: 2rem;
`;

const ProductName = styled.div.withConfig({
  shouldForwardProp: (prop) => !['darkMode'].includes(prop)
})`
  font-weight: 600;
  font-size: 0.9rem;
  color: ${props => props.darkMode ? '#ffffff' : '#111827'};
  margin-bottom: 0.5rem;
  line-height: 1.3;
`;

const ProductInfo = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
`;

const ProductCode = styled.span`
  color: #888;
  font-size: 0.8rem;
`;

const StockBadge = styled.span`
  background: ${props => props.stock === 0 ? '#ef4444' : props.stock < 5 ? '#f59e0b' : '#10b981'};
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.7rem;
  font-weight: 600;
`;

const ProductPrice = styled.div`
  font-size: 1.1rem;
  font-weight: 700;
  color: #10b981;
  text-align: center;
  margin-bottom: 0.75rem;
`;

const AddButton = styled.button`
  width: 100%;
  padding: 0.5rem;
  background: ${props => props.disabled ? '#666' : '#3b82f6'};
  color: white;
  border: none;
  border-radius: 0.5rem;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  font-weight: 600;
  font-size: 0.8rem;
  transition: all 0.2s ease;
  
  &:hover {
    background: ${props => props.disabled ? '#666' : '#2563eb'};
  }
`;

export default function SeletorProdutosMogi({ produtos, onSelectProduct, darkMode }) {
  const [busca, setBusca] = useState('');

  const produtosFiltrados = produtos.filter(p =>
    p.nome.toLowerCase().includes(busca.toLowerCase()) ||
    p.codigo.toLowerCase().includes(busca.toLowerCase()) ||
    p.tipo?.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <Container>
      <SearchInput
        darkMode={darkMode}
        placeholder="Buscar produtos por nome, código ou tipo..."
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
      />
      
      <ProductGrid>
        {produtosFiltrados.map(produto => (
          <ProductCard
            key={produto.id}
            darkMode={darkMode}
            onClick={() => produto.estoque_atual > 0 && onSelectProduct(produto)}
          >
            <ProductImage darkMode={darkMode}>
              📦
            </ProductImage>
            
            <ProductName darkMode={darkMode}>
              {produto.nome}
            </ProductName>
            
            <ProductInfo>
              <ProductCode>{produto.codigo}</ProductCode>
              <StockBadge stock={produto.estoque_atual}>
                {produto.estoque_atual} unid.
              </StockBadge>
            </ProductInfo>
            
            {produto.tipo && (
              <div style={{
                background: darkMode ? '#333' : '#e8e8e8',
                color: darkMode ? '#fff' : '#000',
                padding: '0.25rem 0.5rem',
                borderRadius: '0.25rem',
                fontSize: '0.7rem',
                fontWeight: '600',
                textTransform: 'uppercase',
                marginBottom: '0.5rem',
                textAlign: 'center'
              }}>
                {produto.tipo}
              </div>
            )}
            
            <ProductPrice>
              R$ {produto.preco_venda.toFixed(2)}
            </ProductPrice>
            
            <AddButton
              disabled={produto.estoque_atual === 0}
              onClick={(e) => {
                e.stopPropagation();
                if (produto.estoque_atual > 0) {
                  onSelectProduct(produto);
                }
              }}
            >
              {produto.estoque_atual === 0 ? '❌ SEM ESTOQUE' : '➕ ADICIONAR'}
            </AddButton>
          </ProductCard>
        ))}
      </ProductGrid>
      
      {produtosFiltrados.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '3rem',
          color: '#888'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
          <h3>Nenhum produto encontrado</h3>
          <p>
            {busca 
              ? `Nenhum produto encontrado para "${busca}"`
              : 'Nenhum produto disponível no momento'
            }
          </p>
        </div>
      )}
    </Container>
  );
}