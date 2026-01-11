import React, { useEffect, useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  TimeScale,
  Filler
} from 'chart.js';
import { Line, Bar, Doughnut, Pie } from 'react-chartjs-2';
import 'chartjs-adapter-date-fns';
import styled from 'styled-components';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  TimeScale,
  Filler
);

const ChartContainer = styled.div`
  background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
  border: 1px solid #404040;
  border-radius: 16px;
  padding: 25px;
  margin-bottom: 20px;
  color: #ffffff;
  height: ${props => props.height || '400px'};
  
  canvas {
    max-height: 100% !important;
  }
`;

const ChartTitle = styled.h3`
  color: #ffffff;
  margin-bottom: 20px;
  font-size: 1.2rem;
  font-weight: 600;
  text-align: center;
`;

const GridContainer = styled.div`
  display: grid;
  grid-template-columns: ${props => props.columns || 'repeat(auto-fit, minmax(400px, 1fr))'};
  gap: 20px;
  margin-bottom: 30px;
`;

// Configurações padrão para todos os gráficos
const defaultOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      labels: {
        color: '#ffffff',
        font: {
          size: 12
        }
      }
    },
    tooltip: {
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      titleColor: '#ffffff',
      bodyColor: '#ffffff',
      borderColor: '#404040',
      borderWidth: 1
    }
  },
  scales: {
    x: {
      ticks: {
        color: '#cccccc'
      },
      grid: {
        color: 'rgba(255, 255, 255, 0.1)'
      }
    },
    y: {
      ticks: {
        color: '#cccccc',
        callback: function(value) {
          return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
          }).format(value);
        }
      },
      grid: {
        color: 'rgba(255, 255, 255, 0.1)'
      }
    }
  }
};

export default function DashboardCharts({ dadosConsolidados }) {
  // Processar dados para gráficos
  const processarDadosVendas = () => {
    const hoje = new Date();
    const ultimosMeses = [];
    
    // Últimos 6 meses
    for (let i = 5; i >= 0; i--) {
      const data = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
      ultimosMeses.push({
        mes: data.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }),
        data: data
      });
    }
    
    const vendasPorMes = ultimosMeses.map(periodo => {
      const inicioMes = new Date(periodo.data.getFullYear(), periodo.data.getMonth(), 1);
      const fimMes = new Date(periodo.data.getFullYear(), periodo.data.getMonth() + 1, 0);
      
      let totalTatuape = 0;
      let totalMogi = 0;
      
      // Vendas Tatuapé
      dadosConsolidados.tatuape.vendas.forEach(venda => {
        const dataVenda = new Date(venda.data_venda);
        if (dataVenda >= inicioMes && dataVenda <= fimMes) {
          totalTatuape += parseFloat(venda.valor_final || 0);
        }
      });
      
      // Vendas Mogi
      dadosConsolidados.mogi.vendas.forEach(venda => {
        const dataVenda = new Date(venda.data_venda);
        if (dataVenda >= inicioMes && dataVenda <= fimMes) {
          totalMogi += parseFloat(venda.valor_final || 0);
        }
      });
      
      return {
        mes: periodo.mes,
        tatuape: totalTatuape,
        mogi: totalMogi,
        total: totalTatuape + totalMogi
      };
    });
    
    return vendasPorMes;
  };

  const processarDadosUltimos30Dias = () => {
    const hoje = new Date();
    const ultimos30Dias = [];
    
    for (let i = 29; i >= 0; i--) {
      const data = new Date(hoje);
      data.setDate(data.getDate() - i);
      ultimos30Dias.push({
        data: data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        dataCompleta: data
      });
    }
    
    const vendasDiarias = ultimos30Dias.map(dia => {
      let totalDia = 0;
      
      // Somar vendas de ambas as lojas
      [...dadosConsolidados.tatuape.vendas, ...dadosConsolidados.mogi.vendas].forEach(venda => {
        const dataVenda = new Date(venda.data_venda);
        if (dataVenda.toDateString() === dia.dataCompleta.toDateString()) {
          totalDia += parseFloat(venda.valor_final || 0);
        }
      });
      
      return {
        data: dia.data,
        valor: totalDia
      };
    });
    
    return vendasDiarias;
  };

  const processarDadosFormasPagamento = () => {
    const formasPagamento = {};
    
    [...dadosConsolidados.tatuape.vendas, ...dadosConsolidados.mogi.vendas].forEach(venda => {
      const forma = venda.forma_pagamento || 'Não informado';
      if (!formasPagamento[forma]) {
        formasPagamento[forma] = 0;
      }
      formasPagamento[forma] += parseFloat(venda.valor_final || 0);
    });
    
    return Object.entries(formasPagamento).map(([forma, valor]) => ({
      forma,
      valor
    }));
  };

  const processarDadosVendedores = () => {
    const vendedores = {};
    
    // Processar vendas de ambas as lojas
    Object.entries(dadosConsolidados).forEach(([loja, dados]) => {
      dados.vendas.forEach(venda => {
        const vendedor = venda.vendedor_nome || 'Não informado';
        const chave = `${vendedor} (${loja})`;
        
        if (!vendedores[chave]) {
          vendedores[chave] = {
            nome: chave,
            valor: 0,
            quantidade: 0
          };
        }
        
        vendedores[chave].valor += parseFloat(venda.valor_final || 0);
        vendedores[chave].quantidade += 1;
      });
    });
    
    return Object.values(vendedores)
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 10); // Top 10 vendedores
  };

  const dadosVendasMensais = processarDadosVendas();
  const dadosVendasDiarias = processarDadosUltimos30Dias();
  const dadosFormasPagamento = processarDadosFormasPagamento();
  const dadosVendedores = processarDadosVendedores();

  // Configuração do gráfico de vendas mensais
  const vendasMensaisData = {
    labels: dadosVendasMensais.map(d => d.mes),
    datasets: [
      {
        label: 'Tatuapé',
        data: dadosVendasMensais.map(d => d.tatuape),
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        fill: true,
        tension: 0.4
      },
      {
        label: 'Mogi',
        data: dadosVendasMensais.map(d => d.mogi),
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4
      },
      {
        label: 'Total',
        data: dadosVendasMensais.map(d => d.total),
        borderColor: '#f59e0b',
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        fill: false,
        tension: 0.4,
        borderWidth: 3
      }
    ]
  };

  // Configuração do gráfico de vendas diárias
  const vendasDiariasData = {
    labels: dadosVendasDiarias.map(d => d.data),
    datasets: [
      {
        label: 'Vendas Diárias',
        data: dadosVendasDiarias.map(d => d.valor),
        borderColor: '#8b5cf6',
        backgroundColor: 'rgba(139, 92, 246, 0.2)',
        fill: true,
        tension: 0.4
      }
    ]
  };

  // Configuração do gráfico de formas de pagamento
  const formasPagamentoData = {
    labels: dadosFormasPagamento.map(d => d.forma),
    datasets: [
      {
        data: dadosFormasPagamento.map(d => d.valor),
        backgroundColor: [
          '#10b981',
          '#3b82f6',
          '#f59e0b',
          '#ef4444',
          '#8b5cf6',
          '#06b6d4',
          '#84cc16',
          '#f97316'
        ],
        borderColor: '#404040',
        borderWidth: 2
      }
    ]
  };

  // Configuração do gráfico de vendedores
  const vendedoresData = {
    labels: dadosVendedores.map(v => v.nome),
    datasets: [
      {
        label: 'Vendas por Vendedor',
        data: dadosVendedores.map(v => v.valor),
        backgroundColor: [
          '#10b981',
          '#3b82f6',
          '#f59e0b',
          '#ef4444',
          '#8b5cf6',
          '#06b6d4',
          '#84cc16',
          '#f97316',
          '#ec4899',
          '#6366f1'
        ],
        borderColor: '#404040',
        borderWidth: 1
      }
    ]
  };

  const vendedoresOptions = {
    ...defaultOptions,
    indexAxis: 'y',
    plugins: {
      ...defaultOptions.plugins,
      legend: {
        display: false
      }
    },
    scales: {
      x: {
        ticks: {
          color: '#cccccc',
          callback: function(value) {
            return new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL'
            }).format(value);
          }
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        }
      },
      y: {
        ticks: {
          color: '#cccccc'
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        }
      }
    }
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          color: '#ffffff',
          font: {
            size: 12
          },
          usePointStyle: true,
          padding: 20
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: '#404040',
        borderWidth: 1,
        callbacks: {
          label: function(context) {
            const value = context.parsed;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${context.label}: ${new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL'
            }).format(value)} (${percentage}%)`;
          }
        }
      }
    }
  };

  return (
    <>
      {/* Gráfico de Vendas Mensais - Linha */}
      <ChartContainer height="450px">
        <ChartTitle>📈 Evolução de Vendas - Últimos 6 Meses</ChartTitle>
        <Line data={vendasMensaisData} options={defaultOptions} />
      </ChartContainer>

      {/* Grid com 2 gráficos */}
      <GridContainer columns="1fr 1fr">
        {/* Gráfico de Vendas Diárias */}
        <ChartContainer height="350px">
          <ChartTitle>📊 Vendas Diárias - Últimos 30 Dias</ChartTitle>
          <Line data={vendasDiariasData} options={defaultOptions} />
        </ChartContainer>

        {/* Gráfico de Formas de Pagamento */}
        <ChartContainer height="350px">
          <ChartTitle>💳 Distribuição por Forma de Pagamento</ChartTitle>
          <Doughnut data={formasPagamentoData} options={doughnutOptions} />
        </ChartContainer>
      </GridContainer>

      {/* Gráfico de Top Vendedores */}
      <ChartContainer height="500px">
        <ChartTitle>🏆 Top 10 Vendedores - Ranking de Vendas</ChartTitle>
        <Bar data={vendedoresData} options={vendedoresOptions} />
      </ChartContainer>

      {/* Grid com métricas adicionais */}
      <GridContainer columns="repeat(auto-fit, minmax(300px, 1fr))">
        {/* Comparativo Lojas */}
        <ChartContainer height="300px">
          <ChartTitle>🏢 Comparativo entre Lojas</ChartTitle>
          <Pie 
            data={{
              labels: ['Tatuapé', 'Mogi das Cruzes'],
              datasets: [{
                data: [
                  dadosVendasMensais.reduce((sum, d) => sum + d.tatuape, 0),
                  dadosVendasMensais.reduce((sum, d) => sum + d.mogi, 0)
                ],
                backgroundColor: ['#10b981', '#3b82f6'],
                borderColor: '#404040',
                borderWidth: 2
              }]
            }}
            options={doughnutOptions}
          />
        </ChartContainer>

        {/* Tendência Semanal */}
        <ChartContainer height="300px">
          <ChartTitle>📅 Vendas por Dia da Semana</ChartTitle>
          <Bar 
            data={{
              labels: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'],
              datasets: [{
                label: 'Média de Vendas',
                data: (() => {
                  const vendasPorDia = [0, 0, 0, 0, 0, 0, 0];
                  const contadorPorDia = [0, 0, 0, 0, 0, 0, 0];
                  
                  [...dadosConsolidados.tatuape.vendas, ...dadosConsolidados.mogi.vendas].forEach(venda => {
                    const diaSemana = new Date(venda.data_venda).getDay();
                    vendasPorDia[diaSemana] += parseFloat(venda.valor_final || 0);
                    contadorPorDia[diaSemana]++;
                  });
                  
                  return vendasPorDia.map((total, index) => 
                    contadorPorDia[index] > 0 ? total / contadorPorDia[index] : 0
                  );
                })(),
                backgroundColor: 'rgba(139, 92, 246, 0.8)',
                borderColor: '#8b5cf6',
                borderWidth: 1
              }]
            }}
            options={{
              ...defaultOptions,
              plugins: {
                ...defaultOptions.plugins,
                legend: {
                  display: false
                }
              }
            }}
          />
        </ChartContainer>
      </GridContainer>
    </>
  );
}