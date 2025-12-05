import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { supabase, queryWithStoreMogi } from '../../utils/supabaseMogi';
import { createBrasiliaTimestamp } from '../../utils/dateUtils';
import { useTheme } from '../../contexts/ThemeContext';
import VendedorMobileMogi from './VendedorMobileMogi';
import VendedorProfileMogi from './VendedorProfileMogi';

const Container = styled.div.withConfig({
  shouldForwardProp: (prop) => !['darkMode'].includes(prop)
})`
  width: 100vw;
  height: 100vh;
  background: ${props => props.darkMode ? '#0f0f0f' : '#f8fafc'};
  color: ${props => props.darkMode ? '#ffffff' : '#1a1a1a'};
  display: flex;
  flex-direction: column;
`;

const Header = styled.div.withConfig({
  shouldForwardProp: (prop) => !['darkMode'].includes(prop)
})`
  padding: 1rem 2rem;
  background: ${props => props.darkMode ? '#1a1a1a' : '#ffffff'};
  border-bottom: 1px solid ${props => props.darkMode ? '#333' : '#e5e7eb'};
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const MainContent = styled.div`
  flex: 1;
  padding: 2rem;
  overflow-y: auto;
`;

const ProductGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`;

const ProductCard = styled.div.withConfig({
  shouldForwardProp: (prop) => !['darkMode'].includes(prop)
})`
  background: ${props => props.darkMode ? '#1a1a1a' : '#ffffff'};
  border: 1px solid ${props => props.darkMode ? '#333' : '#e5e7eb'};
  border-radius: 0.75rem;
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  }
`;

const Button = styled.button.withConfig({
  shouldForwardProp: (prop) => !['variant'].includes(prop)
})`
  padding: 0.75rem 1.5rem;
  background: ${props => {
    if (props.variant === 'primary') return '#3b82f6';
    if (props.variant === 'success') return '#10b981';
    if (props.variant === 'danger') return '#ef4444';
    return '#6b7280';
  }};
  color: white;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s ease;
  
  &:hover {
    opacity: 0.9;
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export default function VendedorMogi({ user, onLogout }) {
  const { darkMode, toggleTheme } = useTheme();
  const [isMobile, setIsMobile] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [produtos, setProdutos] = useState([]);
  const [carrinho, setCarrinho] = useState([]);
  const [cliente, setCliente] = useState({
    nome_completo: '',
    telefone: ''
  });

  useEffect(() => {
    carregarProdutos();
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const carregarProdutos = async () => {
    try {
      const { data } = await queryWithStoreMogi('produtos')
        .select('*')
        .eq('ativo', true)
        .gt('estoque_atual', 0);
      
      setProdutos(data || []);
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
    }
  };

  const adicionarProduto = (produto) => {
    const itemExistente = carrinho.find(item => item.id === produto.id);
    
    if (itemExistente) {
      if (itemExistente.quantidade >= produto.estoque_atual) {
        alert('Estoque insuficiente!');
        return;
      }
      setCarrinho(carrinho.map(item =>
        item.id === produto.id 
          ? { ...item, quantidade: item.quantidade + 1 }
          : item
      ));
    } else {
      setCarrinho([...carrinho, { ...produto, quantidade: 1 }]);
    }
  };

  const finalizarVenda = async () => {
    if (carrinho.length === 0) {
      alert('Adicione produtos ao carrinho!');
      return;
    }

    if (!cliente.nome_completo.trim()) {
      alert('Nome do cliente é obrigatório!');
      return;
    }

    if (!cliente.telefone.trim()) {
      alert('Telefone do cliente é obrigatório!');
      return;
    }

    try {
      const numeroVenda = `MOG-${Date.now()}`;
      const valorTotal = carrinho.reduce((sum, item) => sum + (item.preco_venda * item.quantidade), 0);
      
      const { data: venda, error: vendaError } = await queryWithStoreMogi('vendas')
        .insert([{
          numero_venda: numeroVenda,
          vendedor_id: user.id,
          vendedor_nome: user.nome,
          valor_total: valorTotal,
          valor_final: valorTotal,
          forma_pagamento: 'pendente_caixa',
          cliente_nome: cliente.nome_completo,
          cliente_telefone: cliente.telefone,
          status: 'pendente',
          data_venda: createBrasiliaTimestamp()
        }])
        .select()
        .single();

      if (vendaError) throw vendaError;

      const itens = carrinho.map(item => ({
        venda_id: venda.id,
        produto_id: item.id,
        produto_codigo: item.codigo,
        produto_nome: item.nome,
        quantidade: item.quantidade,
        preco_unitario: item.preco_venda,
        subtotal: item.preco_venda * item.quantidade
      }));

      await queryWithStoreMogi('itens_venda').insert(itens);

      alert(`✅ Venda criada com sucesso!\n\nNúmero: ${numeroVenda}\nTotal: R$ ${valorTotal.toFixed(2)}\n\nDirecione o cliente ao caixa para finalizar o pagamento.`);
      
      setCarrinho([]);
      setCliente({ nome_completo: '', telefone: '' });
      
    } catch (error) {
      console.error('Erro ao finalizar venda:', error);
      alert('❌ Erro ao criar venda: ' + error.message);
    }
  };

  const calcularTotal = () => {
    return carrinho.reduce((sum, item) => sum + (item.preco_venda * item.quantidade), 0);
  };

  if (isMobile) {
    return <VendedorMobileMogi user={user} onLogout={onLogout} />;
  }

  if (showProfile) {
    return <VendedorProfileMogi user={user} onBack={() => setShowProfile(false)} />;
  }

  return (
    <Container darkMode={darkMode}>
      <Header darkMode={darkMode}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.5rem' }}>
            🛍️ Vendedor - {user.nome} (Mogi)
          </h1>
          <p style={{ margin: '0.25rem 0 0 0', color: '#888', fontSize: '0.9rem' }}>
            Crie vendas e direcione clientes ao caixa
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{
            background: darkMode ? '#2a2a2a' : '#f0f9ff',
            padding: '0.75rem 1rem',
            borderRadius: '0.5rem',
            border: '1px solid #3b82f6'
          }}>
            <strong>Carrinho: R$ {calcularTotal().toFixed(2)}</strong>
          </div>
          <button onClick={toggleTheme} style={{
            padding: '8px',
            background: darkMode ? '#2a2a2a' : '#f8f9fa',
            color: darkMode ? '#ffffff' : '#000000',
            border: `1px solid ${darkMode ? '#333' : '#e5e7eb'}`,
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '1.2rem'
          }}>
            {darkMode ? '☀️' : '🌙'}
          </button>
          <Button onClick={() => setShowProfile(true)}>
            👤 Perfil
          </Button>
          <Button variant="danger" onClick={onLogout}>
            🚪 Sair
          </Button>
        </div>
      </Header>

      <MainContent>
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ color: darkMode ? '#fff' : '#000', marginBottom: '1rem' }}>
            Dados do Cliente
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem', maxWidth: '600px' }}>
            <input
              type="text"
              placeholder="Nome completo do cliente *"
              value={cliente.nome_completo}
              onChange={(e) => setCliente({...cliente, nome_completo: e.target.value})}
              style={{
                padding: '0.75rem',
                border: `1px solid ${darkMode ? '#333' : '#e5e7eb'}`,
                borderRadius: '0.5rem',
                background: darkMode ? '#2a2a2a' : '#ffffff',
                color: darkMode ? '#fff' : '#000'
              }}
            />
            <input
              type="tel"
              placeholder="Telefone *"
              value={cliente.telefone}
              onChange={(e) => setCliente({...cliente, telefone: e.target.value})}
              style={{
                padding: '0.75rem',
                border: `1px solid ${darkMode ? '#333' : '#e5e7eb'}`,
                borderRadius: '0.5rem',
                background: darkMode ? '#2a2a2a' : '#ffffff',
                color: darkMode ? '#fff' : '#000'
              }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3 style={{ color: darkMode ? '#fff' : '#000', margin: 0 }}>
            Produtos Disponíveis
          </h3>
          <Button
            variant="success"
            onClick={finalizarVenda}
            disabled={carrinho.length === 0 || !cliente.nome_completo.trim() || !cliente.telefone.trim()}
          >
            ✅ Finalizar Venda ({carrinho.length} itens)
          </Button>
        </div>

        <ProductGrid>
          {produtos.map(produto => (
            <ProductCard key={produto.id} darkMode={darkMode}>
              <div style={{
                height: '150px',
                background: darkMode ? '#2a2a2a' : '#f8f9fa',
                borderRadius: '0.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1rem',
                fontSize: '3rem'
              }}>
                📦
              </div>
              
              <h4 style={{ 
                color: darkMode ? '#fff' : '#000', 
                marginBottom: '0.5rem',
                fontSize: '1.1rem'
              }}>
                {produto.nome}
              </h4>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ color: '#888', fontSize: '0.9rem' }}>{produto.codigo}</span>
                <span style={{
                  background: produto.estoque_atual < 5 ? '#f59e0b' : '#10b981',
                  color: 'white',
                  padding: '0.25rem 0.5rem',
                  borderRadius: '0.25rem',
                  fontSize: '0.8rem',
                  fontWeight: '600'
                }}>
                  {produto.estoque_atual} unid.
                </span>
              </div>
              
              <div style={{
                fontSize: '1.3rem',
                fontWeight: '700',
                color: '#10b981',
                textAlign: 'center',
                marginBottom: '1rem'
              }}>
                R$ {produto.preco_venda.toFixed(2)}
              </div>
              
              <Button
                variant="primary"
                onClick={() => adicionarProduto(produto)}
                style={{ width: '100%' }}
              >
                ➕ Adicionar ao Carrinho
              </Button>
              
              {carrinho.find(item => item.id === produto.id) && (
                <div style={{
                  marginTop: '0.5rem',
                  padding: '0.5rem',
                  background: '#10b981',
                  color: 'white',
                  borderRadius: '0.25rem',
                  textAlign: 'center',
                  fontSize: '0.9rem',
                  fontWeight: '600'
                }}>
                  {carrinho.find(item => item.id === produto.id).quantidade} no carrinho
                </div>
              )}
            </ProductCard>
          ))}
        </ProductGrid>

        {produtos.length === 0 && (
          <div style={{ textAlign: 'center', padding: '4rem', color: '#888' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📦</div>
            <h3>Nenhum produto disponível</h3>
            <p>Não há produtos com estoque no momento.</p>
          </div>
        )}
      </MainContent>
    </Container>
  );
}