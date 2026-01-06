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

export default function SeparadorOnline({ user, onLogout }) {
  const [pedidosParaSeparar, setPedidosParaSeparar] = useState([]);
  const [pedidoAtual, setPedidoAtual] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Determinar loja do separador baseado no email
  const lojaSeparador = user.email.includes('tatuape') ? 'tatuape' : 'mogi';

  useEffect(() => {
    carregarPedidos();
  }, []);

  const carregarPedidos = async () => {
    try {
      const pedidos = await onlineService.getPedidosParaSeparacao(user.id, lojaSeparador);
      setPedidosParaSeparar(pedidos);
    } catch (error) {
      console.error('Erro ao carregar pedidos:', error);
    } finally {
      setLoading(false);
    }
  };

  const iniciarSeparacao = async (pedido) => {
    try {
      await onlineService.iniciarSeparacao(pedido.id, user.id, user.nome, lojaSeparador);
      setPedidoAtual(pedido);
      carregarPedidos();
    } catch (error) {
      alert('Erro ao iniciar separação: ' + error.message);
    }
  };

  const concluirSeparacao = async () => {
    try {
      // Apenas itens da loja do separador
      const itensSeparados = pedidoAtual.itens_pedido_online
        .filter(item => item.produto_loja === lojaSeparador)
        .map(item => ({
          produto_id: item.produto_id,
          produto_loja: item.produto_loja,
          quantidade_separada: item.quantidade,
          observacoes: ''
        }));

      await onlineService.concluirSeparacao(
        pedidoAtual.separacao_pedidos[0]?.id, 
        itensSeparados,
        lojaSeparador
      );
      
      setPedidoAtual(null);
      carregarPedidos();
      alert(`Separação da loja ${lojaSeparador.toUpperCase()} concluída com sucesso!`);
    } catch (error) {
      alert('Erro ao concluir separação: ' + error.message);
    }
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
            <Logo>SEPARAÇÃO ONLINE - {lojaSeparador.toUpperCase()}</Logo>
            <div style={{ color: '#cccccc', fontSize: '0.9rem' }}>
              Separador: {user.nome} | Loja: {lojaSeparador.toUpperCase()}
            </div>
          </div>
        </div>
        <LogoutButton onClick={onLogout}>Sair</LogoutButton>
      </Header>

      <Content>
        {pedidoAtual ? (
          <>
            <h2>🔄 Separando Pedido {pedidoAtual.numero_pedido} - Loja {lojaSeparador.toUpperCase()}</h2>
            
            <Card>
              <h3>Informações do Cliente</h3>
              <p><strong>Nome:</strong> {pedidoAtual.cliente_nome}</p>
              <p><strong>Telefone:</strong> {pedidoAtual.cliente_telefone}</p>
              <p><strong>Endereço:</strong> {pedidoAtual.cliente_endereco}</p>
              <p><strong>Valor Total:</strong> {formatarValor(pedidoAtual.valor_total)}</p>
            </Card>

            <Card>
              <h3>Itens para Separar</h3>
              {pedidoAtual.itens_pedido_online?.map((item, index) => (
                <div key={index} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '15px',
                  background: '#222222',
                  borderRadius: '8px',
                  marginBottom: '10px'
                }}>
                  <div>
                    <h4>{item.produto_nome}</h4>
                    <p>Código: {item.produto_codigo}</p>
                    <p>Loja: {item.produto_loja.toUpperCase()}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#10b981' }}>
                      {item.quantidade}x
                    </div>
                    <div>{formatarValor(item.preco_unitario)}</div>
                  </div>
                </div>
              ))}
            </Card>

            <Card>
              <div style={{ display: 'flex', gap: '10px' }}>
                <Button className="success" onClick={concluirSeparacao}>
                  ✅ Concluir Separação
                </Button>
                <Button className="danger" onClick={() => setPedidoAtual(null)}>
                  ❌ Cancelar
                </Button>
              </div>
            </Card>
          </>
        ) : (
          <>
            <h2>📦 Pedidos para Separação - Loja {lojaSeparador.toUpperCase()}</h2>
            
            {pedidosParaSeparar.length === 0 ? (
              <Card>
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <h3>🎉 Nenhum pedido para separar na loja {lojaSeparador.toUpperCase()}</h3>
                  <p style={{ color: '#999' }}>Todos os pedidos desta loja estão em dia!</p>
                </div>
              </Card>
            ) : (
              pedidosParaSeparar.map(pedido => (
                <Card key={pedido.id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h3>Pedido {pedido.numero_pedido}</h3>
                      <p><strong>Cliente:</strong> {pedido.cliente_nome}</p>
                      <p><strong>Itens:</strong> {pedido.itens_pedido_online?.length || 0}</p>
                      <p><strong>Data:</strong> {new Date(pedido.data_pedido).toLocaleDateString('pt-BR')}</p>
                      <div style={{
                        background: onlineService.getCorStatus(pedido.status),
                        color: 'white',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '0.8rem',
                        display: 'inline-block',
                        marginTop: '10px'
                      }}>
                        {onlineService.formatarStatus(pedido.status)}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#10b981', marginBottom: '10px' }}>
                        {formatarValor(pedido.valor_total)}
                      </div>
                      <Button 
                        className="success" 
                        onClick={() => iniciarSeparacao(pedido)}
                        disabled={pedido.status === 'separando' && pedido.separacao_pedidos?.[0]?.separador_id !== user.id}
                      >
                        {pedido.status === 'separando' && pedido.separacao_pedidos?.[0]?.separador_id === user.id
                          ? '🔄 Continuar Separação'
                          : '📦 Iniciar Separação'
                        }
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </>
        )}
      </Content>
    </Container>
  );
}