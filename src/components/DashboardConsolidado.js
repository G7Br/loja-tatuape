import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { MultiLojaService } from '../utils/multiLojaService';

const Container = styled.div`
  width: 100%;
  padding: 20px;
`;

const Card = styled.div`
  background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
  border: 1px solid #404040;
  border-radius: 16px;
  padding: 25px;
  margin-bottom: 20px;
  color: #ffffff;
`;

const MetricCard = styled.div`
  background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
  border: 1px solid ${props => props.color || '#404040'};
  border-radius: 12px;
  padding: 20px;
  text-align: center;
  color: #ffffff;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: ${props => props.color || '#404040'};
  }
`;

const Table = styled.table`
  width: 100%;
  background: #111111;
  border-radius: 8px;
  border-collapse: collapse;
  border: 1px solid #333333;
  margin-bottom: 20px;
  overflow: hidden;
`;

const Th = styled.th`
  background: #222222;
  color: #ffffff;
  font-weight: 600;
  text-transform: uppercase;
  font-size: 12px;
  letter-spacing: 1px;
  padding: 15px;
  text-align: left;
  border-bottom: 1px solid #333333;
`;

const Td = styled.td`
  padding: 15px;
  text-align: left;
  border-bottom: 1px solid #333333;
  font-size: 14px;
  color: #ffffff;
`;

const LoadingSpinner = styled.div`
  display: inline-block;
  width: 20px;
  height: 20px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const StatusIndicator = styled.div`
  display: inline-block;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: ${props => props.status === 'online' ? '#10b981' : '#ef4444'};
  margin-right: 8px;
`;

const RefreshButton = styled.button`
  background: #333333;
  color: #ffffff;
  border: 1px solid #666666;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.3s ease;
  
  &:hover {
    background: #555555;
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export default function DashboardConsolidado() {
  const [loading, setLoading] = useState(true);
  const [dadosConsolidados, setDadosConsolidados] = useState({});
  const [metricas, setMetricas] = useState(null);
  const [ultimaAtualizacao, setUltimaAtualizacao] = useState(null);

  useEffect(() => {
    carregarDados();
    
    // Atualizar a cada 5 minutos
    const interval = setInterval(carregarDados, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const carregarDados = async () => {
    try {
      setLoading(true);
      
      const dados = await MultiLojaService.buscarDadosConsolidados();
      const metricasCalculadas = MultiLojaService.calcularMetricasConsolidadas(dados);
      
      setDadosConsolidados(dados);
      setMetricas(metricasCalculadas);
      setUltimaAtualizacao(new Date());
      
    } catch (error) {
      console.error('Erro ao carregar dados consolidados:', error);
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

  const formatarHora = (data) => {
    return data.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const calcularCrescimento = (atual, anterior) => {
    if (!anterior || anterior === 0) return 0;
    return ((atual - anterior) / anterior * 100);
  };

  if (loading && !metricas) {
    return (
      <Container>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '200px',
          flexDirection: 'column',
          gap: '15px'
        }}>
          <LoadingSpinner />
          <span>Carregando dados de todas as lojas...</span>
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <Card>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '20px' 
        }}>
          <h2>📊 Dashboard Consolidado - Todas as Lojas</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            {ultimaAtualizacao && (
              <span style={{ fontSize: '12px', color: '#999999' }}>
                Última atualização: {formatarHora(ultimaAtualizacao)}
              </span>
            )}
            <RefreshButton onClick={carregarDados} disabled={loading}>
              {loading ? <LoadingSpinner style={{ width: '12px', height: '12px' }} /> : '🔄 Atualizar'}
            </RefreshButton>
          </div>
        </div>

        {metricas && (
          <>
            {/* Métricas Principais */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '20px',
              marginBottom: '30px'
            }}>
              <MetricCard color="#10b981">
                <div style={{ fontSize: '2.2rem', fontWeight: '800', marginBottom: '8px', color: '#10b981' }}>
                  {metricas.totalLojas}
                </div>
                <div style={{ fontSize: '0.85rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  LOJAS ATIVAS
                </div>
                <div style={{ fontSize: '0.8rem', color: '#999', marginTop: '5px' }}>
                  Sistema Multi-Loja
                </div>
              </MetricCard>

              <MetricCard color="#3b82f6">
                <div style={{ fontSize: '2.2rem', fontWeight: '800', marginBottom: '8px', color: '#3b82f6' }}>
                  {formatarValor(metricas.vendasHoje)}
                </div>
                <div style={{ fontSize: '0.85rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  VENDAS HOJE
                </div>
                <div style={{ fontSize: '0.8rem', color: '#999', marginTop: '5px' }}>
                  Todas as lojas
                </div>
              </MetricCard>

              <MetricCard color="#8b5cf6">
                <div style={{ fontSize: '2.2rem', fontWeight: '800', marginBottom: '8px', color: '#8b5cf6' }}>
                  {formatarValor(metricas.vendasMes)}
                </div>
                <div style={{ fontSize: '0.85rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  VENDAS DO MÊS
                </div>
                <div style={{ fontSize: '0.8rem', color: '#999', marginTop: '5px' }}>
                  Consolidado
                </div>
              </MetricCard>

              <MetricCard color="#f59e0b">
                <div style={{ fontSize: '2.2rem', fontWeight: '800', marginBottom: '8px', color: '#f59e0b' }}>
                  {metricas.totalFuncionarios}
                </div>
                <div style={{ fontSize: '0.85rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  FUNCIONÁRIOS
                </div>
                <div style={{ fontSize: '0.8rem', color: '#999', marginTop: '5px' }}>
                  Todas as lojas
                </div>
              </MetricCard>
            </div>

            {/* Ranking de Lojas */}
            <Card>
              <h3 style={{ marginBottom: '20px' }}>🏆 Ranking de Performance - Vendas do Mês</h3>
              <Table>
                <thead>
                  <tr>
                    <Th>Posição</Th>
                    <Th>Loja</Th>
                    <Th>Vendas do Mês</Th>
                    <Th>Vendas Hoje</Th>
                    <Th>Funcionários</Th>
                    <Th>Produtos</Th>
                    <Th>Status</Th>
                  </tr>
                </thead>
                <tbody>
                  {metricas.lojasMelhorPerformance.map(([codigoLoja, dados], index) => (
                    <tr key={codigoLoja}>
                      <Td>
                        <span style={{
                          background: index === 0 ? '#ffd700' : index === 1 ? '#c0c0c0' : index === 2 ? '#cd7f32' : '#666',
                          color: index < 3 ? '#000' : '#fff',
                          padding: '4px 8px',
                          borderRadius: '50%',
                          fontWeight: 'bold',
                          fontSize: '12px'
                        }}>
                          {index + 1}º
                        </span>
                      </Td>
                      <Td style={{ fontWeight: 'bold' }}>
                        {dados.nome}
                      </Td>
                      <Td style={{ color: '#10b981', fontWeight: 'bold' }}>
                        {formatarValor(dados.vendasMes)}
                      </Td>
                      <Td style={{ color: '#3b82f6' }}>
                        {formatarValor(dados.vendasHoje)}
                      </Td>
                      <Td>{dados.funcionarios}</Td>
                      <Td>{dados.produtos}</Td>
                      <Td>
                        <StatusIndicator status={dadosConsolidados[codigoLoja]?.erro ? 'offline' : 'online'} />
                        {dadosConsolidados[codigoLoja]?.erro ? 'Erro' : 'Online'}
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card>

            {/* Detalhes por Loja */}
            <Card>
              <h3 style={{ marginBottom: '20px' }}>📋 Resumo Detalhado por Loja</h3>
              <Table>
                <thead>
                  <tr>
                    <Th>Loja</Th>
                    <Th>Vendas Hoje</Th>
                    <Th>Vendas Mês</Th>
                    <Th>Vendas Ano</Th>
                    <Th>Estoque (R$)</Th>
                    <Th>Funcionários</Th>
                    <Th>Produtos</Th>
                    <Th>Status Sistema</Th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(metricas.resumoPorLoja).map(([codigoLoja, dados]) => (
                    <tr key={codigoLoja}>
                      <Td style={{ fontWeight: 'bold' }}>
                        {dados.nome}
                        <div style={{ fontSize: '11px', color: '#999', textTransform: 'uppercase' }}>
                          {codigoLoja}
                        </div>
                      </Td>
                      <Td style={{ color: dados.vendasHoje > 0 ? '#10b981' : '#999' }}>
                        {formatarValor(dados.vendasHoje)}
                      </Td>
                      <Td style={{ color: '#3b82f6', fontWeight: 'bold' }}>
                        {formatarValor(dados.vendasMes)}
                      </Td>
                      <Td style={{ color: '#8b5cf6' }}>
                        {formatarValor(dados.vendasAno)}
                      </Td>
                      <Td style={{ color: '#f59e0b' }}>
                        {formatarValor(dados.valorEstoque)}
                      </Td>
                      <Td>{dados.funcionarios}</Td>
                      <Td>{dados.produtos}</Td>
                      <Td>
                        <StatusIndicator status={dadosConsolidados[codigoLoja]?.erro ? 'offline' : 'online'} />
                        <span style={{ fontSize: '12px' }}>
                          {dadosConsolidados[codigoLoja]?.erro ? 'Erro de Conexão' : 'Operacional'}
                        </span>
                        {dadosConsolidados[codigoLoja]?.erro && (
                          <div style={{ fontSize: '10px', color: '#ef4444', marginTop: '2px' }}>
                            {dadosConsolidados[codigoLoja].erro}
                          </div>
                        )}
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card>

            {/* Resumo Financeiro */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '15px'
            }}>
              <MetricCard color="#10b981">
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#10b981' }}>
                  {formatarValor(metricas.vendasAno)}
                </div>
                <div style={{ fontSize: '0.8rem', textTransform: 'uppercase' }}>
                  Receita Anual Total
                </div>
              </MetricCard>

              <MetricCard color="#8b5cf6">
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#8b5cf6' }}>
                  {formatarValor(metricas.valorEstoque)}
                </div>
                <div style={{ fontSize: '0.8rem', textTransform: 'uppercase' }}>
                  Capital em Estoque
                </div>
              </MetricCard>

              <MetricCard color="#3b82f6">
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#3b82f6' }}>
                  {metricas.vendasMes > 0 ? formatarValor(metricas.vendasMes / metricas.totalLojas) : 'R$ 0,00'}
                </div>
                <div style={{ fontSize: '0.8rem', textTransform: 'uppercase' }}>
                  Média por Loja/Mês
                </div>
              </MetricCard>
            </div>
          </>
        )}
      </Card>
    </Container>
  );
}