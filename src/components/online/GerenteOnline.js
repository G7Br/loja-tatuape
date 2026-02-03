import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { onlineService } from '../../utils/onlineService';
import GerenciarFotosOnline from './GerenciarFotosOnline';

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

const Table = styled.table`
  width: 100%;
  background: #111111;
  border-radius: 8px;
  border-collapse: collapse;
  border: 1px solid #333333;
`;

const Th = styled.th`
  background: #222222;
  color: #ffffff;
  font-weight: 600;
  padding: 15px;
  text-align: left;
  border-bottom: 1px solid #333333;
`;

const Td = styled.td`
  padding: 15px;
  border-bottom: 1px solid #333333;
  color: #ffffff;
`;

const Button = styled.button`
  padding: 8px 16px;
  background: #ffffff;
  color: #000000;
  border: none;
  border-radius: 4px;
  font-weight: 600;
  cursor: pointer;
  margin-right: 5px;
  &:hover { background: #cccccc; }
  
  &.success { background: #10b981; color: #ffffff; }
  &.warning { background: #f59e0b; color: #ffffff; }
  &.danger { background: #ef4444; color: #ffffff; }
`;

export default function GerenteOnline({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dashboard, setDashboard] = useState({});
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFotos, setStatusFotos] = useState([]);

  useEffect(() => {
    carregarDados();
    verificarStatusFotos();
  }, []);

  const carregarDados = async () => {
    try {
      const [dashboardData, pedidosData] = await Promise.all([
        onlineService.getDashboardGerente(),
        onlineService.getPedidos()
      ]);
      
      setDashboard(dashboardData);
      setPedidos(pedidosData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const sincronizarFotos = async () => {
    try {
      setLoading(true);
      const resultado = await onlineService.sincronizarFotosComLojas();
      alert(`Fotos sincronizadas! ${resultado.produtosSincronizados} produtos atualizados (Tatuapé: ${resultado.tatuapeCount}, Mogi: ${resultado.mogiCount})`);
      await verificarStatusFotos();
    } catch (error) {
      alert('Erro ao sincronizar fotos: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const verificarStatusFotos = async () => {
    try {
      const status = await onlineService.verificarStatusFotos();
      setStatusFotos(status);
    } catch (error) {
      console.error('Erro ao verificar status das fotos:', error);
    }
  };

  const sincronizarEstoque = async () => {
    try {
      setLoading(true);
      await onlineService.sincronizarEstoqueComLojas();
      alert('Estoque sincronizado com sucesso!');
      carregarDados();
    } catch (error) {
      alert('Erro ao sincronizar estoque: ' + error.message);
    } finally {
      setLoading(false);
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
            <Logo>GERÊNCIA ONLINE</Logo>
            <div style={{ color: '#cccccc', fontSize: '0.9rem' }}>
              Gerente: {user.nome}
            </div>
          </div>
        </div>
        <LogoutButton onClick={onLogout}>Sair</LogoutButton>
      </Header>

      <TabContainer>
        <Tab $active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')}>
          Dashboard
        </Tab>
        <Tab $active={activeTab === 'pedidos'} onClick={() => setActiveTab('pedidos')}>
          Pedidos
        </Tab>
        <Tab $active={activeTab === 'estoque'} onClick={() => setActiveTab('estoque')}>
          Estoque Online
        </Tab>
        <Tab $active={activeTab === 'fotos'} onClick={() => setActiveTab('fotos')}>
          Fotos
        </Tab>
        <Tab $active={activeTab === 'relatorios'} onClick={() => setActiveTab('relatorios')}>
          Relatórios
        </Tab>
      </TabContainer>

      <Content>
        {activeTab === 'dashboard' && (
          <>
            <h2>Dashboard Online</h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
              <Card style={{ textAlign: 'center', border: '1px solid #10b981' }}>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#10b981' }}>
                  {dashboard.pedidosHoje || 0}
                </div>
                <div>Pedidos Hoje</div>
                <div style={{ fontSize: '0.9rem', color: '#999' }}>
                  {formatarValor(dashboard.valorHoje)}
                </div>
              </Card>
              
              <Card style={{ textAlign: 'center', border: '1px solid #3b82f6' }}>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#3b82f6' }}>
                  {dashboard.pedidosMes || 0}
                </div>
                <div>Pedidos do Mês</div>
                <div style={{ fontSize: '0.9rem', color: '#999' }}>
                  {formatarValor(dashboard.valorMes)}
                </div>
              </Card>
              
              <Card style={{ textAlign: 'center', border: '1px solid #f59e0b' }}>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f59e0b' }}>
                  {dashboard.pedidosPendentes || 0}
                </div>
                <div>Pedidos Pendentes</div>
                <div style={{ fontSize: '0.9rem', color: '#999' }}>
                  Aguardando ação
                </div>
              </Card>
              
              <Card style={{ textAlign: 'center', border: '1px solid #8b5cf6' }}>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#8b5cf6' }}>
                  {formatarValor(dashboard.ticketMedioMes)}
                </div>
                <div>Ticket Médio</div>
                <div style={{ fontSize: '0.9rem', color: '#999' }}>
                  Este mês
                </div>
              </Card>
            </div>

            <Card>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3>Ações Rápidas</h3>
                <Button className="success" onClick={sincronizarEstoque}>
                  🔄 Sincronizar Estoque
                </Button>
              </div>
              <p style={{ color: '#999' }}>
                Sincronize o estoque online com as lojas físicas para manter os produtos atualizados.
              </p>
            </Card>
          </>
        )}

        {activeTab === 'pedidos' && (
          <>
            <h2>Gestão de Pedidos</h2>
            
            <Table>
              <thead>
                <tr>
                  <Th>Pedido</Th>
                  <Th>Cliente</Th>
                  <Th>Vendedor</Th>
                  <Th>Valor</Th>
                  <Th>Status</Th>
                  <Th>Data</Th>
                  <Th>Ações</Th>
                </tr>
              </thead>
              <tbody>
                {pedidos.map(pedido => (
                  <tr key={pedido.id}>
                    <Td>{pedido.numero_pedido}</Td>
                    <Td>{pedido.cliente_nome}</Td>
                    <Td>{pedido.vendedor_nome}</Td>
                    <Td>{formatarValor(pedido.valor_total)}</Td>
                    <Td>
                      <span style={{
                        background: onlineService.getCorStatus(pedido.status),
                        color: 'white',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '0.8rem'
                      }}>
                        {onlineService.formatarStatus(pedido.status)}
                      </span>
                    </Td>
                    <Td>{new Date(pedido.data_pedido).toLocaleDateString('pt-BR')}</Td>
                    <Td>
                      <Button onClick={() => alert('Ver detalhes do pedido')}>
                        Ver
                      </Button>
                      {pedido.status === 'aguardando_pagamento' && (
                        <Button className="success" onClick={() => {
                          onlineService.atualizarStatusPedido(pedido.id, 'pago');
                          carregarDados();
                        }}>
                          Confirmar Pagamento
                        </Button>
                      )}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </>
        )}

        {activeTab === 'estoque' && (
          <>
            <h2>Controle de Estoque Online</h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '30px' }}>
              <Card style={{ border: '1px solid #10b981' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                  <h3 style={{ margin: 0 }}>Sincronização de Estoque</h3>
                  <Button className="success" onClick={sincronizarEstoque}>
                    🔄 Sincronizar
                  </Button>
                </div>
                <p style={{ color: '#999', marginBottom: '15px' }}>
                  Sincronize produtos, preços e estoque das lojas físicas com o catálogo online.
                </p>
              </Card>
              
              <Card style={{ border: '1px solid #3b82f6' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                  <h3 style={{ margin: 0 }}>Sincronização de Fotos</h3>
                  <Button className="primary" onClick={sincronizarFotos}>
                    📷 Sincronizar Fotos
                  </Button>
                </div>
                <p style={{ color: '#999', marginBottom: '15px' }}>
                  Sincronize automaticamente as fotos dos produtos das lojas com o catálogo online.
                </p>
              </Card>
            </div>
            
            <Card>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3>Status das Fotos por Loja</h3>
                <Button onClick={verificarStatusFotos}>
                  🔍 Verificar Status
                </Button>
              </div>
              
              {statusFotos.length > 0 && (
                <Table>
                  <thead>
                    <tr>
                      <Th>Loja</Th>
                      <Th>Total Produtos</Th>
                      <Th>Com Foto</Th>
                      <Th>Sem Foto</Th>
                      <Th>% Com Foto</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {statusFotos.map((status, index) => (
                      <tr key={index}>
                        <Td style={{ textTransform: 'capitalize', fontWeight: 'bold' }}>
                          {status.loja === 'tatuape' ? 'Tatuapé' : status.loja === 'mogi' ? 'Mogi' : 'Online'}
                        </Td>
                        <Td>{status.total_produtos}</Td>
                        <Td style={{ color: '#10b981' }}>{status.com_foto}</Td>
                        <Td style={{ color: status.sem_foto > 0 ? '#ef4444' : '#10b981' }}>{status.sem_foto}</Td>
                        <Td>
                          <span style={{
                            color: status.percentual_com_foto >= 80 ? '#10b981' : 
                                   status.percentual_com_foto >= 50 ? '#f59e0b' : '#ef4444',
                            fontWeight: 'bold'
                          }}>
                            {status.percentual_com_foto}%
                          </span>
                        </Td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
              
              <div style={{ 
                marginTop: '20px', 
                padding: '15px', 
                background: '#0a0a0a', 
                borderRadius: '8px',
                fontSize: '12px',
                color: '#ccc'
              }}>
                <strong>💡 Sobre a Sincronização Automática:</strong><br/>
                • As fotos são sincronizadas automaticamente quando os gerentes das lojas definem/alteram fotos<br/>
                • Use "Sincronizar Fotos" para forçar uma sincronização manual de todas as fotos<br/>
                • O sistema mantém um log de todas as sincronizações realizadas<br/>
                • Produtos sem foto aparecerão sem imagem no catálogo online
              </div>
            </Card>
          </>
        )}

        {activeTab === 'fotos' && (
          <>
            <h2>Gerenciamento de Fotos</h2>
            <GerenciarFotosOnline />
          </>
        )}

        {activeTab === 'relatorios' && (
          <>
            <h2>Relatórios Online</h2>
            <Card>
              <p>Relatórios detalhados em desenvolvimento...</p>
            </Card>
          </>
        )}
      </Content>
    </Container>
  );
}