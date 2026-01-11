import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';

const pulse = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
`;

const slideIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const MetricCard = styled.div`
  background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
  border: 1px solid ${props => props.borderColor || '#404040'};
  border-radius: 16px;
  padding: 25px;
  color: #ffffff;
  position: relative;
  overflow: hidden;
  animation: ${slideIn} 0.6s ease-out;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  }
  
  &.pulsing {
    animation: ${pulse} 2s infinite;
  }
`;

const MetricIcon = styled.div`
  position: absolute;
  top: 15px;
  right: 20px;
  font-size: 2rem;
  opacity: 0.3;
`;

const MetricValue = styled.div`
  font-size: 2.5rem;
  font-weight: 800;
  color: ${props => props.color || '#ffffff'};
  margin-bottom: 8px;
  line-height: 1;
`;

const MetricTitle = styled.div`
  font-size: 0.85rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 8px;
  color: #ffffff;
`;

const MetricSubtitle = styled.div`
  font-size: 0.9rem;
  color: #999;
  display: flex;
  align-items: center;
  gap: 5px;
`;

const TrendIndicator = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 0.8rem;
  font-weight: 600;
  color: ${props => props.positive ? '#10b981' : '#ef4444'};
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 4px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
  margin-top: 10px;
  overflow: hidden;
`;

const ProgressFill = styled.div`
  height: 100%;
  background: ${props => props.color || '#10b981'};
  width: ${props => props.percentage || 0}%;
  transition: width 1s ease-out;
  border-radius: 2px;
`;

const LiveIndicator = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 0.7rem;
  color: #10b981;
  margin-top: 5px;
  
  &::before {
    content: '';
    width: 6px;
    height: 6px;
    background: #10b981;
    border-radius: 50%;
    animation: ${pulse} 1.5s infinite;
  }
`;

export default function RealTimeMetrics({ dadosConsolidados }) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isLive, setIsLive] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatarValor = (valor) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor || 0);
  };

  const calcularMetricasTempoReal = () => {
    const hoje = new Date();
    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    const ontem = new Date(hoje);
    ontem.setDate(ontem.getDate() - 1);
    
    // Vendas de hoje
    const vendasHoje = [...dadosConsolidados.tatuape.vendas, ...dadosConsolidados.mogi.vendas]
      .filter(v => new Date(v.data_venda).toDateString() === hoje.toDateString());
    
    const totalHoje = vendasHoje.reduce((sum, v) => sum + parseFloat(v.valor_final || 0), 0);
    
    // Vendas de ontem
    const vendasOntem = [...dadosConsolidados.tatuape.vendas, ...dadosConsolidados.mogi.vendas]
      .filter(v => new Date(v.data_venda).toDateString() === ontem.toDateString());
    
    const totalOntem = vendasOntem.reduce((sum, v) => sum + parseFloat(v.valor_final || 0), 0);
    
    // Crescimento diário
    const crescimentoDiario = totalOntem > 0 ? ((totalHoje - totalOntem) / totalOntem * 100) : 0;
    
    // Vendas do mês
    const vendasMes = [...dadosConsolidados.tatuape.vendas, ...dadosConsolidados.mogi.vendas]
      .filter(v => new Date(v.data_venda) >= inicioMes);
    
    const totalMes = vendasMes.reduce((sum, v) => sum + parseFloat(v.valor_final || 0), 0);
    
    // Meta mensal (simulada - 50k por mês)
    const metaMensal = 50000;
    const progressoMeta = (totalMes / metaMensal) * 100;
    
    // Ticket médio hoje
    const ticketMedioHoje = vendasHoje.length > 0 ? totalHoje / vendasHoje.length : 0;
    
    // Última venda
    const ultimaVenda = [...dadosConsolidados.tatuape.vendas, ...dadosConsolidados.mogi.vendas]
      .sort((a, b) => new Date(b.data_venda) - new Date(a.data_venda))[0];
    
    // Vendas por loja hoje
    const vendasTatuapeHoje = dadosConsolidados.tatuape.vendas
      .filter(v => new Date(v.data_venda).toDateString() === hoje.toDateString())
      .reduce((sum, v) => sum + parseFloat(v.valor_final || 0), 0);
    
    const vendasMogiHoje = dadosConsolidados.mogi.vendas
      .filter(v => new Date(v.data_venda).toDateString() === hoje.toDateString())
      .reduce((sum, v) => sum + parseFloat(v.valor_final || 0), 0);

    return {
      totalHoje,
      totalOntem,
      crescimentoDiario,
      totalMes,
      metaMensal,
      progressoMeta,
      ticketMedioHoje,
      ultimaVenda,
      vendasTatuapeHoje,
      vendasMogiHoje,
      quantidadeVendasHoje: vendasHoje.length
    };
  };

  const metricas = calcularMetricasTempoReal();

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
      gap: '20px',
      marginBottom: '30px'
    }}>
      {/* Vendas de Hoje */}
      <MetricCard borderColor="#10b981" className={metricas.totalHoje > metricas.totalOntem ? 'pulsing' : ''}>
        <MetricIcon>💰</MetricIcon>
        <MetricValue color="#10b981">{formatarValor(metricas.totalHoje)}</MetricValue>
        <MetricTitle>Vendas de Hoje</MetricTitle>
        <MetricSubtitle>
          {metricas.quantidadeVendasHoje} vendas realizadas
          <TrendIndicator positive={metricas.crescimentoDiario >= 0}>
            {metricas.crescimentoDiario >= 0 ? '↗️' : '↘️'}
            {Math.abs(metricas.crescimentoDiario).toFixed(1)}%
          </TrendIndicator>
        </MetricSubtitle>
        <LiveIndicator>AO VIVO</LiveIndicator>
      </MetricCard>

      {/* Progresso da Meta */}
      <MetricCard borderColor="#3b82f6">
        <MetricIcon>🎯</MetricIcon>
        <MetricValue color="#3b82f6">{metricas.progressoMeta.toFixed(1)}%</MetricValue>
        <MetricTitle>Meta Mensal</MetricTitle>
        <MetricSubtitle>
          {formatarValor(metricas.totalMes)} de {formatarValor(metricas.metaMensal)}
        </MetricSubtitle>
        <ProgressBar>
          <ProgressFill 
            percentage={Math.min(metricas.progressoMeta, 100)} 
            color={metricas.progressoMeta >= 100 ? '#10b981' : '#3b82f6'}
          />
        </ProgressBar>
      </MetricCard>

      {/* Ticket Médio Hoje */}
      <MetricCard borderColor="#8b5cf6">
        <MetricIcon>🧾</MetricIcon>
        <MetricValue color="#8b5cf6">{formatarValor(metricas.ticketMedioHoje)}</MetricValue>
        <MetricTitle>Ticket Médio Hoje</MetricTitle>
        <MetricSubtitle>
          Por venda realizada
        </MetricSubtitle>
      </MetricCard>

      {/* Última Venda */}
      <MetricCard borderColor="#f59e0b">
        <MetricIcon>⏰</MetricIcon>
        <MetricValue color="#f59e0b" style={{fontSize: '1.8rem'}}>
          {metricas.ultimaVenda ? 
            new Date(metricas.ultimaVenda.data_venda).toLocaleTimeString('pt-BR', {
              hour: '2-digit',
              minute: '2-digit'
            }) : 
            '--:--'
          }
        </MetricValue>
        <MetricTitle>Última Venda</MetricTitle>
        <MetricSubtitle>
          {metricas.ultimaVenda ? 
            `${metricas.ultimaVenda.vendedor_nome} - ${formatarValor(metricas.ultimaVenda.valor_final)}` :
            'Nenhuma venda hoje'
          }
        </MetricSubtitle>
      </MetricCard>

      {/* Comparativo Lojas */}
      <MetricCard borderColor="#06b6d4">
        <MetricIcon>🏢</MetricIcon>
        <MetricValue color="#06b6d4" style={{fontSize: '1.5rem'}}>
          {metricas.vendasTatuapeHoje > metricas.vendasMogiHoje ? 'TATUAPÉ' : 'MOGI'}
        </MetricValue>
        <MetricTitle>Loja Líder Hoje</MetricTitle>
        <MetricSubtitle>
          Tatuapé: {formatarValor(metricas.vendasTatuapeHoje)} | 
          Mogi: {formatarValor(metricas.vendasMogiHoje)}
        </MetricSubtitle>
      </MetricCard>

      {/* Relógio em Tempo Real */}
      <MetricCard borderColor="#ec4899">
        <MetricIcon>🕐</MetricIcon>
        <MetricValue color="#ec4899" style={{fontSize: '1.8rem'}}>
          {currentTime.toLocaleTimeString('pt-BR')}
        </MetricValue>
        <MetricTitle>Horário Atual</MetricTitle>
        <MetricSubtitle>
          {currentTime.toLocaleDateString('pt-BR', {
            weekday: 'long',
            day: 'numeric',
            month: 'long'
          })}
        </MetricSubtitle>
        <LiveIndicator>TEMPO REAL</LiveIndicator>
      </MetricCard>
    </div>
  );
}