import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { caixaOnlineService } from '../../utils/caixaOnlineService';

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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarPedidos();
  }, []);

  const carregarPedidos = async () => {
    try {
      const pedidos = await caixaOnlineService.buscarPedidosParaSeparacao();
      setPedidosParaSeparar(pedidos);
    } catch (error) {
      console.error('Erro ao carregar pedidos:', error);
    } finally {
      setLoading(false);
    }
  };

  const marcarComoSeparado = async (pedido) => {
    try {
      await caixaOnlineService.marcarPedidoSeparado(pedido.id, user.id, user.email);
      alert('Pedido marcado como separado!');
      carregarPedidos();
    } catch (error) {
      alert('Erro ao marcar como separado: ' + error.message);
    }
  };

  const marcarComoEnviado = async (pedido) => {
    const observacoes = prompt('Observações sobre o envio (opcional):');
    try {
      await caixaOnlineService.marcarPedidoEnviado(pedido.id, user.id, user.email, observacoes);
      alert('Pedido marcado como enviado!');
      carregarPedidos();
    } catch (error) {
      alert('Erro ao marcar como enviado: ' + error.message);
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
            <Logo>📦 SEPARAÇÃO ONLINE</Logo>
            <div style={{ color: '#cccccc', fontSize: '0.9rem' }}>
              Separador: {user.nome} | Fluxo: Vendedor → Separador → Caixa Online
            </div>
          </div>
        </div>
        <LogoutButton onClick={onLogout}>Sair</LogoutButton>
      </Header>

      <Content>
        <Card>
          <div style={{ background: '#1f2937', border: '1px solid #374151', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
            <h3 style={{ color: '#fbbf24', marginBottom: '10px' }}>⚠️ REGRAS DO SEPARADOR:</h3>
            <ul style={{ color: '#d1d5db', fontSize: '0.9rem', lineHeight: '1.5' }}>
              <li>• Apenas o separador pode marcar pedidos como <strong>SEPARADO</strong> e <strong>ENVIADO</strong></li>
              <li>• Pedidos devem estar no status <strong>CRIADA</strong> para serem separados</li>
              <li>• Após separar, marque como <strong>ENVIADO</strong> para liberar para o caixa online</li>
              <li>• Somente pedidos com separado=SIM e enviado=SIM aparecem no caixa</li>
            </ul>
          </div>
        </Card>

        <h2>📦 Pedidos para Separação</h2>
        
        {pedidosParaSeparar.length === 0 ? (
          <Card>
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <h3>🎉 Nenhum pedido para separar</h3>
              <p style={{ color: '#999' }}>Todos os pedidos estão em dia!</p>
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
                  <p><strong>Data:</strong> {new Date(pedido.created_at).toLocaleDateString('pt-BR')}</p>
                  <div style={{
                    background: caixaOnlineService.getCorStatus(pedido.status),
                    color: 'white',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '0.8rem',
                    display: 'inline-block',
                    marginTop: '10px'
                  }}>
                    {caixaOnlineService.formatarStatus(pedido.status)}
                  </div>
                  <div style={{ marginTop: '10px', fontSize: '0.8rem' }}>
                    <div style={{ color: pedido.pedido_separado === 'SIM' ? '#10b981' : '#ef4444' }}>
                      {pedido.pedido_separado === 'SIM' ? '✅' : '❌'} Separado: {pedido.pedido_separado}
                    </div>
                    <div style={{ color: pedido.enviado === 'SIM' ? '#10b981' : '#ef4444' }}>
                      {pedido.enviado === 'SIM' ? '✅' : '❌'} Enviado: {pedido.enviado}
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#10b981', marginBottom: '10px' }}>
                    {formatarValor(pedido.valor_total)}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {pedido.status === 'CRIADA' && (
                      <Button 
                        className="success" 
                        onClick={() => marcarComoSeparado(pedido)}
                      >
                        ✅ Marcar como Separado
                      </Button>
                    )}
                    {pedido.status === 'SEPARADO' && pedido.pedido_separado === 'SIM' && (
                      <Button 
                        className="warning" 
                        onClick={() => marcarComoEnviado(pedido)}
                      >
                        🚚 Marcar como Enviado
                      </Button>
                    )}
                    {pedido.status === 'ENVIADO' && (
                      <div style={{ color: '#10b981', fontSize: '0.9rem', fontWeight: 'bold' }}>
                        ✅ Pronto para Caixa Online
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </Content>
    </Container>
  );
}