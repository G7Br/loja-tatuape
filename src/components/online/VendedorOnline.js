import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { onlineService } from '../../utils/onlineService';

const Container = styled.div`
  width: 100%;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  color: #ffffff;
  background: #000000;
`;

const Header = styled.div`
  background: #000000;
  border-bottom: 1px solid #333333;
  padding: 15px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Logo = styled.div`
  color: #ffffff;
  font-size: 1.5rem;
  font-weight: 700;
`;

const LogoutButton = styled.button`
  background: #333333;
  color: #ffffff;
  border: 1px solid #666666;
  padding: 12px 24px;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
  &:hover { background: #555555; }
`;

const TabContainer = styled.div`
  display: flex;
  padding: 0 20px;
  border-bottom: 1px solid #333333;
  background: #111111;
`;

const Tab = styled.button`
  padding: 15px 20px;
  background: ${props => props.$active ? '#333333' : 'transparent'};
  color: ${props => props.$active ? '#ffffff' : '#cccccc'};
  border: none;
  border-bottom: ${props => props.$active ? '3px solid #ffffff' : '3px solid transparent'};
  font-weight: 600;
  cursor: pointer;
  &:hover { background: #222222; color: #ffffff; }
`;

const Content = styled.div`
  flex: 1;
  padding: 20px;
`;

const Card = styled.div`
  background: #111111;
  border: 1px solid #333333;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
`;

const Button = styled.button`
  padding: 12px 24px;
  background: #ffffff;
  color: #000000;
  border: none;
  border-radius: 8px;
  font-weight: 700;
  cursor: pointer;
  margin-right: 10px;
  &:hover { background: #cccccc; }
  
  &.success { background: #10b981; color: #ffffff; }
  &.warning { background: #f59e0b; color: #ffffff; }
  &.danger { background: #ef4444; color: #ffffff; }
`;

export default function VendedorOnline({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState('catalogo');
  const [produtos, setProdutos] = useState([]);
  const [pedidos, setPedidos] = useState([]);
  const [carrinho, setCarrinho] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      const [produtosData, pedidosData] = await Promise.all([
        onlineService.getProdutosOnline({ disponivel: true }),
        onlineService.getPedidos({ vendedor_id: user.id })
      ]);
      
      setProdutos(produtosData);
      setPedidos(pedidosData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const adicionarAoCarrinho = (produto) => {
    setCarrinho(prev => {
      const existente = prev.find(item => item.produto_id === produto.produto_id);
      if (existente) {
        return prev.map(item => 
          item.produto_id === produto.produto_id 
            ? { ...item, quantidade: item.quantidade + 1 }
            : item
        );
      }
      return [...prev, {
        produto_id: produto.produto_id,
        produto_codigo: produto.produto_codigo,
        produto_nome: produto.produto_nome,
        produto_loja: produto.loja_origem,
        quantidade: 1,
        preco_unitario: produto.preco_online,
        subtotal: produto.preco_online
      }];
    });
  };

  const formatarValor = (valor) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor || 0);
  };

  if (loading) {
    return (
      <Container>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
          Carregando...
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <Header>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <img 
            src="/images/logo.png" 
            alt="VH Logo" 
            style={{ height: '60px', filter: 'brightness(0) invert(1)' }}
          />
          <div>
            <Logo>VENDAS ONLINE</Logo>
            <div style={{ color: '#cccccc', fontSize: '0.9rem' }}>
              Vendedor: {user.nome}
            </div>
          </div>
        </div>
        <LogoutButton onClick={onLogout}>Sair</LogoutButton>
      </Header>

      <TabContainer>
        <Tab $active={activeTab === 'catalogo'} onClick={() => setActiveTab('catalogo')}>
          Catálogo ({produtos.length})
        </Tab>
        <Tab $active={activeTab === 'estoque-tatuape'} onClick={() => setActiveTab('estoque-tatuape')}>
          Estoque Tatuapé ({produtos.filter(p => p.loja_origem === 'tatuape').length})
        </Tab>
        <Tab $active={activeTab === 'estoque-mogi'} onClick={() => setActiveTab('estoque-mogi')}>
          Estoque Mogi ({produtos.filter(p => p.loja_origem === 'mogi').length})
        </Tab>
        <Tab $active={activeTab === 'carrinho'} onClick={() => setActiveTab('carrinho')}>
          Carrinho ({carrinho.length})
        </Tab>
        <Tab $active={activeTab === 'pedidos'} onClick={() => setActiveTab('pedidos')}>
          Meus Pedidos
        </Tab>
      </TabContainer>

      <Content>
        {activeTab === 'catalogo' && (
          <>
            <h2>Catálogo Consolidado - Todas as Lojas</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
              {produtos.map(produto => (
                <Card key={`${produto.produto_id}-${produto.loja_origem}`}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                    <h3>{produto.produto_nome}</h3>
                    <span style={{
                      background: produto.loja_origem === 'tatuape' ? '#10b981' : '#3b82f6',
                      color: 'white',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '0.8rem',
                      fontWeight: 'bold'
                    }}>
                      {produto.loja_origem.toUpperCase()}
                    </span>
                  </div>
                  <p>Código: {produto.produto_codigo}</p>
                  <p>Categoria: {produto.categoria_online}</p>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    margin: '10px 0'
                  }}>
                    <span>Estoque:</span>
                    <span style={{
                      fontWeight: 'bold',
                      color: produto.estoque_disponivel > 0 ? '#10b981' : '#ef4444'
                    }}>
                      {produto.estoque_disponivel} unidades
                    </span>
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#10b981', margin: '10px 0' }}>
                    {formatarValor(produto.preco_online)}
                  </div>
                  <Button 
                    onClick={() => adicionarAoCarrinho(produto)}
                    disabled={produto.estoque_disponivel === 0}
                    style={{
                      opacity: produto.estoque_disponivel === 0 ? 0.5 : 1,
                      cursor: produto.estoque_disponivel === 0 ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {produto.estoque_disponivel === 0 ? 'Sem Estoque' : 'Adicionar ao Carrinho'}
                  </Button>
                </Card>
              ))}
            </div>
          </>
        )}

        {activeTab === 'estoque-tatuape' && (
          <>
            <h2>🏢 Estoque Loja Tatuapé</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
              {produtos.filter(p => p.loja_origem === 'tatuape').map(produto => (
                <Card key={produto.produto_id}>
                  <h3>{produto.produto_nome}</h3>
                  <p>Código: {produto.produto_codigo}</p>
                  <p>Categoria: {produto.categoria_online}</p>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    margin: '15px 0',
                    padding: '10px',
                    background: '#222222',
                    borderRadius: '8px'
                  }}>
                    <span style={{ fontWeight: 'bold' }}>Estoque Atual:</span>
                    <span style={{
                      fontSize: '1.2rem',
                      fontWeight: 'bold',
                      color: produto.estoque_disponivel > 5 ? '#10b981' : produto.estoque_disponivel > 0 ? '#f59e0b' : '#ef4444'
                    }}>
                      {produto.estoque_disponivel} unidades
                    </span>
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#10b981', margin: '10px 0' }}>
                    {formatarValor(produto.preco_online)}
                  </div>
                  <Button 
                    onClick={() => adicionarAoCarrinho(produto)}
                    disabled={produto.estoque_disponivel === 0}
                  >
                    {produto.estoque_disponivel === 0 ? 'Sem Estoque' : 'Adicionar ao Carrinho'}
                  </Button>
                </Card>
              ))}
            </div>
          </>
        )}

        {activeTab === 'estoque-mogi' && (
          <>
            <h2>🏪 Estoque Loja Mogi das Cruzes</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
              {produtos.filter(p => p.loja_origem === 'mogi').map(produto => (
                <Card key={produto.produto_id}>
                  <h3>{produto.produto_nome}</h3>
                  <p>Código: {produto.produto_codigo}</p>
                  <p>Categoria: {produto.categoria_online}</p>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    margin: '15px 0',
                    padding: '10px',
                    background: '#222222',
                    borderRadius: '8px'
                  }}>
                    <span style={{ fontWeight: 'bold' }}>Estoque Atual:</span>
                    <span style={{
                      fontSize: '1.2rem',
                      fontWeight: 'bold',
                      color: produto.estoque_disponivel > 5 ? '#10b981' : produto.estoque_disponivel > 0 ? '#f59e0b' : '#ef4444'
                    }}>
                      {produto.estoque_disponivel} unidades
                    </span>
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#10b981', margin: '10px 0' }}>
                    {formatarValor(produto.preco_online)}
                  </div>
                  <Button 
                    onClick={() => adicionarAoCarrinho(produto)}
                    disabled={produto.estoque_disponivel === 0}
                  >
                    {produto.estoque_disponivel === 0 ? 'Sem Estoque' : 'Adicionar ao Carrinho'}
                  </Button>
                </Card>
              ))}
            </div>
          </>
        )}

        {activeTab === 'carrinho' && (
          <>
            <h2>🛒 Carrinho de Compras</h2>
            {carrinho.length === 0 ? (
              <Card>
                <p>Carrinho vazio</p>
              </Card>
            ) : (
              <>
                {carrinho.map((item, index) => (
                  <Card key={index}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <h4>{item.produto_nome}</h4>
                        <p>Código: {item.produto_codigo}</p>
                        <p>Loja: {item.produto_loja.toUpperCase()}</p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div>Qtd: {item.quantidade}</div>
                        <div>{formatarValor(item.preco_unitario)}</div>
                        <div style={{ fontWeight: 'bold' }}>
                          {formatarValor(item.quantidade * item.preco_unitario)}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
                <Card>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3>Total: {formatarValor(carrinho.reduce((sum, item) => sum + (item.quantidade * item.preco_unitario), 0))}</h3>
                    <div>
                      <Button className="danger" onClick={() => setCarrinho([])}>
                        Limpar Carrinho
                      </Button>
                      <Button className="success">
                        Finalizar Pedido
                      </Button>
                    </div>
                  </div>
                </Card>
              </>
            )}
          </>
        )}

        {activeTab === 'pedidos' && (
          <>
            <h2>📋 Meus Pedidos</h2>
            {pedidos.map(pedido => (
              <Card key={pedido.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h4>Pedido {pedido.numero_pedido}</h4>
                    <p>Cliente: {pedido.cliente_nome}</p>
                    <p>Data: {new Date(pedido.data_pedido).toLocaleDateString('pt-BR')}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ 
                      background: onlineService.getCorStatus(pedido.status),
                      color: 'white',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '0.8rem',
                      marginBottom: '10px'
                    }}>
                      {onlineService.formatarStatus(pedido.status)}
                    </div>
                    <div style={{ fontWeight: 'bold' }}>
                      {formatarValor(pedido.valor_total)}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </>
        )}
      </Content>
    </Container>
  );
}