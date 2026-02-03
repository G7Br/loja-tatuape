import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { onlineService } from '../../utils/onlineService';
import { caixaOnlineService } from '../../utils/caixaOnlineService';
import AtualizarImagemProduto from './AtualizarImagemProduto';

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
  const [clienteData, setClienteData] = useState({
    cliente_nome: '',
    cliente_cpf: '',
    cliente_telefone: '',
    cliente_endereco: '',
    tipo_envio: 'retirada',
    observacoes: ''
  });
  const [modalFinalizacao, setModalFinalizacao] = useState(false);
  const [modalImagem, setModalImagem] = useState(null);

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      const [produtosData, pedidosData] = await Promise.all([
        onlineService.getProdutosOnline({ disponivel: true }),
        caixaOnlineService.buscarVendasVendedor(user.id)
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

  const finalizarPedido = async () => {
    if (!clienteData.cliente_nome || !clienteData.cliente_cpf || !clienteData.cliente_telefone) {
      alert('Preencha todos os campos obrigatórios do cliente');
      return;
    }

    if (carrinho.length === 0) {
      alert('Carrinho está vazio');
      return;
    }

    try {
      const valorTotal = carrinho.reduce((sum, item) => sum + (item.quantidade * item.preco_unitario), 0);
      
      const dadosVenda = {
        ...clienteData,
        valor_total: valorTotal,
        itens: carrinho
      };

      await caixaOnlineService.criarVenda(dadosVenda, user.id, user.email);
      
      alert('Venda criada com sucesso! Status: CRIADA');
      setCarrinho([]);
      setClienteData({
        cliente_nome: '',
        cliente_cpf: '',
        cliente_telefone: '',
        cliente_endereco: '',
        tipo_envio: 'retirada',
        observacoes: ''
      });
      setModalFinalizacao(false);
      carregarDados();
    } catch (error) {
      alert('Erro ao criar venda: ' + error.message);
    }
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
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
              {produtos.map(produto => (
                <Card key={`${produto.produto_id}-${produto.loja_origem}`} style={{ padding: '15px', position: 'relative' }}>
                  {/* Foto grande do produto */}
                  <div style={{
                    width: '100%',
                    height: '250px',
                    backgroundColor: '#222',
                    borderRadius: '12px',
                    marginBottom: '15px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    border: '2px solid #333',
                    position: 'relative'
                  }}>
                    {/* Botão atualizar imagem */}
                    <button
                      onClick={() => setModalImagem(produto)}
                      style={{
                        position: 'absolute',
                        top: '10px',
                        right: '10px',
                        background: 'rgba(0,0,0,0.7)',
                        border: 'none',
                        borderRadius: '50%',
                        width: '35px',
                        height: '35px',
                        color: 'white',
                        cursor: 'pointer',
                        fontSize: '16px',
                        zIndex: 10
                      }}
                      title="Atualizar imagem"
                    >
                      📷
                    </button>
                    {produto.foto_url ? (
                      <img 
                        src={produto.foto_url} 
                        alt={produto.produto_nome}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }}
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div style={{
                      width: '100%',
                      height: '100%',
                      display: produto.foto_url ? 'none' : 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexDirection: 'column',
                      fontSize: '4rem',
                      color: '#666'
                    }}>
                      📷
                      <div style={{ fontSize: '0.8rem', marginTop: '10px' }}>Sem foto</div>
                    </div>
                  </div>
                  
                  {/* Badge da loja */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', lineHeight: '1.3' }}>{produto.produto_nome}</h3>
                    <span style={{
                      background: produto.loja_origem === 'tatuape' ? '#10b981' : '#3b82f6',
                      color: 'white',
                      padding: '4px 10px',
                      borderRadius: '20px',
                      fontSize: '0.75rem',
                      fontWeight: 'bold',
                      minWidth: '60px',
                      textAlign: 'center'
                    }}>
                      {produto.loja_origem.toUpperCase()}
                    </span>
                  </div>
                  
                  {/* Informações do produto */}
                  <div style={{ marginBottom: '15px', fontSize: '0.9rem', color: '#ccc' }}>
                    <div style={{ marginBottom: '5px' }}><strong>Código:</strong> {produto.produto_codigo}</div>
                    <div style={{ marginBottom: '5px' }}><strong>Categoria:</strong> {produto.categoria_online}</div>
                  </div>
                  
                  {/* Estoque */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    margin: '15px 0',
                    padding: '10px',
                    background: '#222222',
                    borderRadius: '8px'
                  }}>
                    <span style={{ fontWeight: 'bold' }}>Estoque:</span>
                    <span style={{
                      fontSize: '1.1rem',
                      fontWeight: 'bold',
                      color: produto.estoque_disponivel > 5 ? '#10b981' : produto.estoque_disponivel > 0 ? '#f59e0b' : '#ef4444'
                    }}>
                      {produto.estoque_disponivel} un.
                    </span>
                  </div>
                  
                  {/* Preço */}
                  <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#10b981', margin: '15px 0', textAlign: 'center' }}>
                    {formatarValor(produto.preco_online)}
                  </div>
                  
                  {/* Botão */}
                  <Button 
                    onClick={() => adicionarAoCarrinho(produto)}
                    disabled={produto.estoque_disponivel === 0}
                    style={{
                      width: '100%',
                      opacity: produto.estoque_disponivel === 0 ? 0.5 : 1,
                      cursor: produto.estoque_disponivel === 0 ? 'not-allowed' : 'pointer',
                      padding: '12px',
                      fontSize: '0.9rem'
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
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
              {produtos.filter(p => p.loja_origem === 'tatuape').map(produto => (
                <Card key={produto.produto_id} style={{ padding: '15px' }}>
                  {/* Foto grande do produto */}
                  <div style={{
                    width: '100%',
                    height: '250px',
                    backgroundColor: '#222',
                    borderRadius: '12px',
                    marginBottom: '15px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    border: '2px solid #10b981'
                  }}>
                    {produto.foto_url ? (
                      <img 
                        src={produto.foto_url} 
                        alt={produto.produto_nome}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }}
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div style={{
                      width: '100%',
                      height: '100%',
                      display: produto.foto_url ? 'none' : 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexDirection: 'column',
                      fontSize: '4rem',
                      color: '#666'
                    }}>
                      📷
                      <div style={{ fontSize: '0.8rem', marginTop: '10px' }}>Sem foto</div>
                    </div>
                  </div>
                  
                  <h3 style={{ margin: '0 0 12px 0', fontSize: '1.1rem', lineHeight: '1.3' }}>{produto.produto_nome}</h3>
                  
                  {/* Informações do produto */}
                  <div style={{ marginBottom: '15px', fontSize: '0.9rem', color: '#ccc' }}>
                    <div style={{ marginBottom: '5px' }}><strong>Código:</strong> {produto.produto_codigo}</div>
                    <div style={{ marginBottom: '5px' }}><strong>Categoria:</strong> {produto.categoria_online}</div>
                  </div>
                  
                  {/* Estoque destacado */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    margin: '15px 0',
                    padding: '12px',
                    background: '#222222',
                    borderRadius: '8px',
                    border: '1px solid #10b981'
                  }}>
                    <span style={{ fontWeight: 'bold', color: '#10b981' }}>Estoque Atual:</span>
                    <span style={{
                      fontSize: '1.3rem',
                      fontWeight: 'bold',
                      color: produto.estoque_disponivel > 5 ? '#10b981' : produto.estoque_disponivel > 0 ? '#f59e0b' : '#ef4444'
                    }}>
                      {produto.estoque_disponivel} unidades
                    </span>
                  </div>
                  
                  {/* Preço */}
                  <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#10b981', margin: '15px 0', textAlign: 'center' }}>
                    {formatarValor(produto.preco_online)}
                  </div>
                  
                  {/* Botão */}
                  <Button 
                    onClick={() => adicionarAoCarrinho(produto)}
                    disabled={produto.estoque_disponivel === 0}
                    style={{
                      width: '100%',
                      padding: '12px',
                      fontSize: '0.9rem'
                    }}
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
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
              {produtos.filter(p => p.loja_origem === 'mogi').map(produto => (
                <Card key={produto.produto_id} style={{ padding: '15px' }}>
                  {/* Foto grande do produto */}
                  <div style={{
                    width: '100%',
                    height: '250px',
                    backgroundColor: '#222',
                    borderRadius: '12px',
                    marginBottom: '15px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    border: '2px solid #3b82f6'
                  }}>
                    {produto.foto_url ? (
                      <img 
                        src={produto.foto_url} 
                        alt={produto.produto_nome}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }}
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div style={{
                      width: '100%',
                      height: '100%',
                      display: produto.foto_url ? 'none' : 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexDirection: 'column',
                      fontSize: '4rem',
                      color: '#666'
                    }}>
                      📷
                      <div style={{ fontSize: '0.8rem', marginTop: '10px' }}>Sem foto</div>
                    </div>
                  </div>
                  
                  <h3 style={{ margin: '0 0 12px 0', fontSize: '1.1rem', lineHeight: '1.3' }}>{produto.produto_nome}</h3>
                  
                  {/* Informações do produto */}
                  <div style={{ marginBottom: '15px', fontSize: '0.9rem', color: '#ccc' }}>
                    <div style={{ marginBottom: '5px' }}><strong>Código:</strong> {produto.produto_codigo}</div>
                    <div style={{ marginBottom: '5px' }}><strong>Categoria:</strong> {produto.categoria_online}</div>
                  </div>
                  
                  {/* Estoque destacado */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    margin: '15px 0',
                    padding: '12px',
                    background: '#222222',
                    borderRadius: '8px',
                    border: '1px solid #3b82f6'
                  }}>
                    <span style={{ fontWeight: 'bold', color: '#3b82f6' }}>Estoque Atual:</span>
                    <span style={{
                      fontSize: '1.3rem',
                      fontWeight: 'bold',
                      color: produto.estoque_disponivel > 5 ? '#10b981' : produto.estoque_disponivel > 0 ? '#f59e0b' : '#ef4444'
                    }}>
                      {produto.estoque_disponivel} unidades
                    </span>
                  </div>
                  
                  {/* Preço */}
                  <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#10b981', margin: '15px 0', textAlign: 'center' }}>
                    {formatarValor(produto.preco_online)}
                  </div>
                  
                  {/* Botão */}
                  <Button 
                    onClick={() => adicionarAoCarrinho(produto)}
                    disabled={produto.estoque_disponivel === 0}
                    style={{
                      width: '100%',
                      padding: '12px',
                      fontSize: '0.9rem'
                    }}
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
                      <Button className="success" onClick={() => setModalFinalizacao(true)}>
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
                      background: caixaOnlineService.getCorStatus(pedido.status),
                      color: 'white',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '0.8rem',
                      marginBottom: '10px'
                    }}>
                      {caixaOnlineService.formatarStatus(pedido.status)}
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

      {/* Modal de Atualização de Imagem */}
      {modalImagem && (
        <AtualizarImagemProduto
          produto={modalImagem}
          onClose={() => setModalImagem(null)}
          onUpdate={carregarDados}
        />
      )}

      {/* Modal de Finalização */}
      {modalFinalizacao && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: '#111111',
            border: '1px solid #333333',
            borderRadius: '8px',
            padding: '30px',
            width: '90%',
            maxWidth: '500px',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <h2 style={{ marginBottom: '20px' }}>📋 Finalizar Pedido</h2>
            
            <div style={{ marginBottom: '20px' }}>
              <h3>Resumo do Carrinho:</h3>
              {carrinho.map((item, index) => (
                <div key={index} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '8px 0',
                  borderBottom: '1px solid #333'
                }}>
                  <span>{item.produto_nome} ({item.quantidade}x)</span>
                  <span>{formatarValor(item.quantidade * item.preco_unitario)}</span>
                </div>
              ))}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '12px 0',
                fontSize: '1.2rem',
                fontWeight: 'bold',
                borderTop: '2px solid #333',
                marginTop: '10px'
              }}>
                <span>Total:</span>
                <span>{formatarValor(carrinho.reduce((sum, item) => sum + (item.quantidade * item.preco_unitario), 0))}</span>
              </div>
            </div>

            <div style={{ display: 'grid', gap: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Nome do Cliente *</label>
                <input
                  type="text"
                  value={clienteData.cliente_nome}
                  onChange={(e) => setClienteData({...clienteData, cliente_nome: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '10px',
                    backgroundColor: '#222',
                    border: '1px solid #444',
                    borderRadius: '4px',
                    color: 'white'
                  }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>CPF *</label>
                <input
                  type="text"
                  value={clienteData.cliente_cpf}
                  onChange={(e) => setClienteData({...clienteData, cliente_cpf: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '10px',
                    backgroundColor: '#222',
                    border: '1px solid #444',
                    borderRadius: '4px',
                    color: 'white'
                  }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Telefone *</label>
                <input
                  type="text"
                  value={clienteData.cliente_telefone}
                  onChange={(e) => setClienteData({...clienteData, cliente_telefone: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '10px',
                    backgroundColor: '#222',
                    border: '1px solid #444',
                    borderRadius: '4px',
                    color: 'white'
                  }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Endereço</label>
                <textarea
                  value={clienteData.cliente_endereco}
                  onChange={(e) => setClienteData({...clienteData, cliente_endereco: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '10px',
                    backgroundColor: '#222',
                    border: '1px solid #444',
                    borderRadius: '4px',
                    color: 'white',
                    minHeight: '80px'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Tipo de Envio</label>
                <select
                  value={clienteData.tipo_envio}
                  onChange={(e) => setClienteData({...clienteData, tipo_envio: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '10px',
                    backgroundColor: '#222',
                    border: '1px solid #444',
                    borderRadius: '4px',
                    color: 'white'
                  }}
                >
                  <option value="retirada">Retirada na Loja</option>
                  <option value="entrega">Entrega</option>
                  <option value="correios">Correios</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Observações</label>
                <textarea
                  value={clienteData.observacoes}
                  onChange={(e) => setClienteData({...clienteData, observacoes: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '10px',
                    backgroundColor: '#222',
                    border: '1px solid #444',
                    borderRadius: '4px',
                    color: 'white',
                    minHeight: '60px'
                  }}
                  placeholder="Observações sobre o pedido..."
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '20px', justifyContent: 'flex-end' }}>
              <Button className="danger" onClick={() => setModalFinalizacao(false)}>
                Cancelar
              </Button>
              <Button className="success" onClick={finalizarPedido}>
                Criar Venda (Status: CRIADA)
              </Button>
            </div>
          </div>
        </div>
      )}
    </Container>
  );
}