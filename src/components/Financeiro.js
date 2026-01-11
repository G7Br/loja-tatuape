import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { supabase } from '../utils/supabase';
import * as XLSX from 'xlsx';
import DashboardCharts from './DashboardCharts';

const Container = styled.div`
  width: 100%;
  max-width: 100vw;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  color: #ffffff;
  background: #000000;
  overflow-x: hidden;
  position: relative;
`;

const Header = styled.div`
  background: #000000;
  border-bottom: 1px solid #333333;
  padding: 15px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
  z-index: 10;
`;

const Logo = styled.div`
  color: #ffffff;
  font-size: 1.5rem;
  font-weight: 700;
  letter-spacing: 1px;
`;

const UserInfo = styled.div`
  color: #ffffff;
  margin-top: 5px;
`;

const LogoutButton = styled.button`
  background: #333333;
  color: #ffffff;
  border: 1px solid #666666;
  padding: 12px 24px;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
  &:hover { 
    background: #555555;
  }
`;

const TabContainer = styled.div`
  display: flex;
  padding: 0 20px;
  margin-bottom: 0;
  border-bottom: 1px solid #333333;
  background: #111111;
  overflow-x: auto;
`;

const Tab = styled.button`
  padding: 15px 20px;
  background: ${props => props.$active ? '#333333' : 'transparent'};
  color: ${props => props.$active ? '#ffffff' : '#cccccc'};
  border: none;
  border-bottom: ${props => props.$active ? '3px solid #ffffff' : '3px solid transparent'};
  font-weight: 600;
  cursor: pointer;
  margin-right: 0;
  transition: all 0.3s ease;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 1px;
  white-space: nowrap;
  
  &:hover {
    background: #222222;
    color: #ffffff;
  }
`;

const ContentArea = styled.div`
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  width: 100%;
  
  &::-webkit-scrollbar {
    width: 8px;
  }
  
  &::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.05);
  }
  
  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 4px;
  }
`;

const Card = styled.div`
  background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
  border: 1px solid #404040;
  border-radius: 16px;
  padding: 25px;
  margin-bottom: 20px;
  color: #ffffff;
`;

const Button = styled.button`
  padding: 15px 30px;
  background: #ffffff;
  color: #000000;
  border: none;
  border-radius: 8px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-right: 10px;
  margin-bottom: 10px;
  
  &:hover { 
    background: #cccccc;
  }
  
  &.secondary {
    background: #333333;
    color: #ffffff;
    border: 1px solid #666666;
    
    &:hover {
      background: #555555;
    }
  }
  
  &.success {
    background: #16a34a;
    color: #ffffff;
    
    &:hover {
      background: #15803d;
    }
  }
`;

export default function Financeiro({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState('visao-geral');
  const [loading, setLoading] = useState(true);
  
  const [dadosConsolidados, setDadosConsolidados] = useState({
    tatuape: { vendas: [], funcionarios: [], caixa: [], estoque: [] },
    mogi: { vendas: [], funcionarios: [], caixa: [], estoque: [] }
  });

  useEffect(() => {
    carregarDadosFinanceiros();
  }, []);

  const carregarDadosFinanceiros = async () => {
    setLoading(true);
    try {
      await Promise.all([
        carregarDadosLoja('tatuape'),
        carregarDadosLoja('mogi')
      ]);
    } catch (error) {
      console.error('Erro ao carregar dados financeiros:', error);
    } finally {
      setLoading(false);
    }
  };

  const carregarDadosLoja = async (loja) => {
    const client = supabase;
    
    try {
      const { data: vendas } = await client
        .from(`vendas_${loja}`)
        .select('*')
        .neq('forma_pagamento', 'pendente_caixa')
        .order('data_venda', { ascending: false });
      
      const { data: funcionarios } = await client
        .from(`usuarios_${loja}`)
        .select('*')
        .eq('ativo', true);
      
      const { data: caixa } = await client
        .from(`caixa_${loja}`)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      
      const { data: estoque } = await client
        .from(`produtos_${loja}`)
        .select('*')
        .eq('ativo', true);
      
      setDadosConsolidados(prev => ({
        ...prev,
        [loja]: {
          vendas: vendas || [],
          funcionarios: funcionarios || [],
          caixa: caixa || [],
          estoque: estoque || []
        }
      }));
    } catch (error) {
      console.error(`Erro ao carregar dados da loja ${loja}:`, error);
    }
  };

  const formatarValor = (valor) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor || 0);
  };

  const calcularMetricasGerais = () => {
    const hoje = new Date();
    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    
    let totalVendasMes = 0;
    let totalVendasHoje = 0;
    let totalFuncionarios = 0;
    let totalEstoque = 0;
    
    ['tatuape', 'mogi'].forEach(loja => {
      const dados = dadosConsolidados[loja];
      
      const vendasMes = dados.vendas.filter(v => 
        new Date(v.data_venda) >= inicioMes
      );
      totalVendasMes += vendasMes.reduce((sum, v) => sum + parseFloat(v.valor_final || 0), 0);
      
      const vendasHoje = dados.vendas.filter(v => 
        new Date(v.data_venda).toDateString() === hoje.toDateString()
      );
      totalVendasHoje += vendasHoje.reduce((sum, v) => sum + parseFloat(v.valor_final || 0), 0);
      
      totalFuncionarios += dados.funcionarios.length;
      
      totalEstoque += dados.estoque.reduce((sum, p) => 
        sum + ((p.estoque_atual || 0) * (p.preco_venda || 0)), 0
      );
    });
    
    return {
      totalVendasMes,
      totalVendasHoje,
      totalFuncionarios,
      totalEstoque
    };
  };

  if (loading) {
    return (
      <Container>
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          fontSize: '1.5rem'
        }}>
          Carregando dados financeiros...
        </div>
      </Container>
    );
  }

  const metricas = calcularMetricasGerais();

  return (
    <Container>
      <Header>
        <div style={{display: 'flex', alignItems: 'center', gap: '15px'}}>
          <img 
            src="/images/logo.png" 
            alt="VH Logo" 
            style={{
              height: '60px', 
              width: 'auto',
              filter: 'brightness(0) invert(1)',
              objectFit: 'contain'
            }}
          />
          <div>
            <Logo>FINANCEIRO CORPORATIVO</Logo>
            <UserInfo>Controle Total das Lojas | {user.nome}</UserInfo>
          </div>
        </div>
        <LogoutButton onClick={onLogout}>Sair</LogoutButton>
      </Header>

      <TabContainer>
        <Tab $active={activeTab === 'visao-geral'} onClick={() => setActiveTab('visao-geral')}>
          Visão Geral
        </Tab>
        <Tab $active={activeTab === 'analytics'} onClick={() => setActiveTab('analytics')}>
          Analytics
        </Tab>
        <Tab $active={activeTab === 'resultado-lojas'} onClick={() => setActiveTab('resultado-lojas')}>
          Resultado por Loja
        </Tab>
        <Tab $active={activeTab === 'fluxo-caixa'} onClick={() => setActiveTab('fluxo-caixa')}>
          Fluxo de Caixa
        </Tab>
        <Tab $active={activeTab === 'lancamentos'} onClick={() => setActiveTab('lancamentos')}>
          Lançamentos
        </Tab>
        <Tab $active={activeTab === 'pagamentos'} onClick={() => setActiveTab('pagamentos')}>
          Pagamentos Funcionários
        </Tab>
        <Tab $active={activeTab === 'fechamento'} onClick={() => setActiveTab('fechamento')}>
          Fechamento
        </Tab>
        <Tab $active={activeTab === 'configuracoes'} onClick={() => setActiveTab('configuracoes')}>
          Configurações
        </Tab>
      </TabContainer>

      <ContentArea>
        {activeTab === 'visao-geral' && (
          <>
            <h2 style={{marginBottom: '30px', color: '#ffffff'}}>📊 Visão Geral Financeira</h2>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '20px',
              marginBottom: '30px'
            }}>
              {[
                {
                  titulo: 'VENDAS DO MÊS',
                  valor: formatarValor(metricas.totalVendasMes),
                  subtitulo: 'Todas as lojas',
                  cor: '#10b981'
                },
                {
                  titulo: 'VENDAS HOJE',
                  valor: formatarValor(metricas.totalVendasHoje),
                  subtitulo: 'Consolidado',
                  cor: '#3b82f6'
                },
                {
                  titulo: 'FUNCIONÁRIOS',
                  valor: metricas.totalFuncionarios,
                  subtitulo: 'Ativos no sistema',
                  cor: '#8b5cf6'
                },
                {
                  titulo: 'VALOR ESTOQUE',
                  valor: formatarValor(metricas.totalEstoque),
                  subtitulo: 'Total investido',
                  cor: '#f59e0b'
                }
              ].map((indicador, index) => (
                <Card key={index} style={{
                  border: `1px solid ${indicador.cor}40`,
                  textAlign: 'center'
                }}>
                  <div style={{
                    fontSize: '2.5rem',
                    fontWeight: '800',
                    marginBottom: '8px',
                    color: indicador.cor
                  }}>{indicador.valor}</div>
                  
                  <div style={{
                    fontSize: '0.85rem',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    marginBottom: '8px'
                  }}>{indicador.titulo}</div>
                  
                  <div style={{
                    fontSize: '0.9rem',
                    color: '#999'
                  }}>{indicador.subtitulo}</div>
                </Card>
              ))}
            </div>

            <Card>
              <h3 style={{marginBottom: '20px'}}>Ações Rápidas</h3>
              <div style={{display: 'flex', flexWrap: 'wrap', gap: '10px'}}>
                <Button className="success">
                  📊 Exportar Consolidado
                </Button>
              </div>
            </Card>
          </>
        )}

        {activeTab === 'analytics' && (
          <>
            <h2 style={{marginBottom: '30px', color: '#ffffff'}}>📊 Analytics Avançado</h2>
            <DashboardCharts dadosConsolidados={dadosConsolidados} />
          </>
        )}

        {activeTab === 'resultado-lojas' && (
          <>
            <h2 style={{marginBottom: '30px', color: '#ffffff'}}>🏢 Resultado por Loja</h2>
            <Card>
              <p>Funcionalidade em desenvolvimento...</p>
            </Card>
          </>
        )}

        {activeTab === 'fluxo-caixa' && (
          <>
            <h2 style={{marginBottom: '30px', color: '#ffffff'}}>💳 Fluxo de Caixa</h2>
            <Card>
              <p>Funcionalidade em desenvolvimento...</p>
            </Card>
          </>
        )}

        {activeTab === 'lancamentos' && (
          <>
            <h2 style={{marginBottom: '30px', color: '#ffffff'}}>📝 Lançamentos</h2>
            <Card>
              <p>Funcionalidade em desenvolvimento...</p>
            </Card>
          </>
        )}

        {activeTab === 'pagamentos' && (
          <>
            <h2 style={{marginBottom: '30px', color: '#ffffff'}}>💰 Pagamentos</h2>
            <Card>
              <p>Funcionalidade em desenvolvimento...</p>
            </Card>
          </>
        )}

        {activeTab === 'fechamento' && (
          <>
            <h2 style={{marginBottom: '30px', color: '#ffffff'}}>🔒 Fechamento</h2>
            <Card>
              <p>Funcionalidade em desenvolvimento...</p>
            </Card>
          </>
        )}

        {activeTab === 'configuracoes' && (
          <>
            <h2 style={{marginBottom: '30px', color: '#ffffff'}}>⚙️ Configurações</h2>
            <Card>
              <p>Funcionalidade em desenvolvimento...</p>
            </Card>
          </>
        )}
      </ContentArea>
    </Container>
  );
}