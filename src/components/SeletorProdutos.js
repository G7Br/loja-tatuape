import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
`;

const CategoryTabs = styled.div.withConfig({
  shouldForwardProp: (prop) => !['darkMode'].includes(prop)
})`
  display: flex;
  background: ${props => props.darkMode ? '#2a2a2a' : '#f8f9fa'};
  border-bottom: 1px solid ${props => props.darkMode ? '#333' : '#e5e7eb'};
  overflow-x: auto;
`;

const CategoryTab = styled.button.withConfig({
  shouldForwardProp: (prop) => !['active', 'darkMode'].includes(prop)
})`
  padding: 0.75rem 1.5rem;
  background: ${props => props.active ? (props.darkMode ? '#3b82f6' : '#3b82f6') : 'transparent'};
  color: ${props => props.active ? 'white' : (props.darkMode ? '#fff' : '#000')};
  border: none;
  cursor: pointer;
  font-weight: ${props => props.active ? '600' : '400'};
  white-space: nowrap;
  transition: all 0.2s ease;
  
  &:hover {
    background: ${props => props.active ? (props.darkMode ? '#3b82f6' : '#3b82f6') : (props.darkMode ? '#333' : '#e5e7eb')};
  }
`;

const ProductsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 0.75rem;
  padding: 1rem;
  overflow-y: auto;
  flex: 1;
`;

const ProductCard = styled.div.withConfig({
  shouldForwardProp: (prop) => !['darkMode'].includes(prop)
})`
  background: ${props => props.darkMode ? '#2a2a2a' : '#ffffff'};
  border: 1px solid ${props => props.darkMode ? '#333' : '#e5e7eb'};
  border-radius: 0.5rem;
  padding: 0.75rem;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    border-color: #3b82f6;
  }
`;

const ProductImage = styled.div.withConfig({
  shouldForwardProp: (prop) => !['darkMode'].includes(prop)
})`
  height: 80px;
  background: ${props => props.darkMode ? '#333' : '#f3f4f6'};
  border-radius: 0.375rem;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 0.5rem;
  font-size: 1.5rem;
  position: relative;
`;

const StockBadge = styled.div.withConfig({
  shouldForwardProp: (prop) => !['stock'].includes(prop)
})`
  position: absolute;
  top: 0.25rem;
  right: 0.25rem;
  padding: 0.125rem 0.375rem;
  border-radius: 0.25rem;
  font-size: 0.7rem;
  font-weight: 600;
  background: ${props => {
    if (props.stock === 0) return '#ef4444';
    if (props.stock < 5) return '#f59e0b';
    return '#10b981';
  }};
  color: white;
`;

const ProductName = styled.div.withConfig({
  shouldForwardProp: (prop) => !['darkMode'].includes(prop)
})`
  font-weight: 600;
  font-size: 0.8rem;
  color: ${props => props.darkMode ? '#fff' : '#000'};
  margin-bottom: 0.25rem;
  line-height: 1.2;
  height: 2.4em;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
`;

const ProductInfo = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.7rem;
  color: #888;
  margin-bottom: 0.25rem;
`;

const ProductPrice = styled.div`
  font-weight: 700;
  font-size: 0.9rem;
  color: #10b981;
  text-align: center;
`;

const SearchBar = styled.input.withConfig({
  shouldForwardProp: (prop) => !['darkMode'].includes(prop)
})`
  width: 100%;
  padding: 0.75rem;
  margin: 1rem;
  margin-bottom: 0;
  border: 1px solid ${props => props.darkMode ? '#333' : '#e5e7eb'};
  border-radius: 0.5rem;
  background: ${props => props.darkMode ? '#2a2a2a' : '#ffffff'};
  color: ${props => props.darkMode ? '#ffffff' : '#1a1a1a'};
  font-size: 0.9rem;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
  }
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  color: #888;
  text-align: center;
`;

export default function SeletorProdutos({ produtos, onSelectProduct, darkMode }) {
  const [categoriaAtiva, setCategoriaAtiva] = useState('todos');
  const [busca, setBusca] = useState('');

  // Extrair categorias únicas dos produtos
  const categorias = [
    { id: 'todos', label: 'Todos', icon: '🛍️' },
    ...Array.from(new Set(produtos.map(p => p.tipo?.toLowerCase()).filter(Boolean)))
      .map(tipo => ({
        id: tipo,
        label: tipo.charAt(0).toUpperCase() + tipo.slice(1),
        icon: getIconForCategory(tipo)
      }))
  ];

  function getIconForCategory(tipo) {
    const iconMap = {
      'terno': '🤵',
      'camisa': '👔',
      'gravata': '👔',
      'costume': '🎭',
      'custom': '🎭',
      'calça': '👖',
      'blazer': '🧥',
      'colete': '🦺',
      'sapato': '👞',
      'cinto': '🔗',
      'acessorio': '💎',
      'acessórios': '💎'
    };
    return iconMap[tipo] || '📦';
  }

  // Filtrar produtos por categoria e busca
  const produtosFiltrados = produtos.filter(produto => {
    const matchCategoria = categoriaAtiva === 'todos' || 
      produto.tipo?.toLowerCase() === categoriaAtiva;
    
    const matchBusca = !busca || 
      produto.nome.toLowerCase().includes(busca.toLowerCase()) ||
      produto.codigo.toLowerCase().includes(busca.toLowerCase()) ||
      produto.tipo?.toLowerCase().includes(busca.toLowerCase());
    
    return matchCategoria && matchBusca && produto.estoque_atual > 0;
  });

  return (
    <Container>
      <SearchBar
        darkMode={darkMode}
        placeholder="Buscar produtos..."
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
      />
      
      <CategoryTabs darkMode={darkMode}>
        {categorias.map(categoria => (
          <CategoryTab
            key={categoria.id}
            active={categoriaAtiva === categoria.id}
            darkMode={darkMode}
            onClick={() => setCategoriaAtiva(categoria.id)}
          >
            <span style={{ marginRight: '0.5rem' }}>{categoria.icon}</span>
            {categoria.label}
          </CategoryTab>
        ))}
      </CategoryTabs>
      
      <ProductsGrid>
        {produtosFiltrados.length === 0 ? (
          <EmptyState>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📦</div>
            <h3>Nenhum produto encontrado</h3>
            <p>
              {busca 
                ? `Nenhum produto encontrado para "${busca}"`
                : `Nenhum produto disponível na categoria ${categorias.find(c => c.id === categoriaAtiva)?.label}`
              }
            </p>
          </EmptyState>
        ) : (
          produtosFiltrados.map(produto => (
            <ProductCard
              key={produto.id}
              darkMode={darkMode}
              onClick={() => onSelectProduct(produto)}
            >
              <ProductImage darkMode={darkMode}>
                {getIconForCategory(produto.tipo?.toLowerCase())}
                <StockBadge stock={produto.estoque_atual}>
                  {produto.estoque_atual}
                </StockBadge>
              </ProductImage>
              
              <ProductName darkMode={darkMode}>
                {produto.nome}
              </ProductName>
              
              <ProductInfo>
                <span>{produto.codigo}</span>
                <span>{produto.tipo}</span>
              </ProductInfo>
              
              <ProductPrice>
                R$ {produto.preco_venda.toFixed(2)}
              </ProductPrice>
            </ProductCard>
          ))
        )}
      </ProductsGrid>
    </Container>
  );
}