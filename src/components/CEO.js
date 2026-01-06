import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { supabase } from '../utils/supabase';
import * as XLSX from 'xlsx';

const Container = styled.div`
  width: 100%;
  max-width: 100vw;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  color: #ffffff;
  background: #000000;
  overflow-x: hidden;
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
`;

const Card = styled.div`
  background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
  border: 1px solid #404040;
  border-radius: 16px;
  padding: 25px;
  margin-bottom: 20px;
  color: #ffffff;
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
  white-space: nowrap;
`;

const Td = styled.td`
  padding: 15px;
  text-align: left;
  border-bottom: 1px solid #333333;
  font-size: 14px;
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

const MetricCard = styled.div`
  background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
  border: 1px solid ${props => props.color || '#404040'};
  border-radius: 12px;
  padding: 20px;
  text-align: center;
  color: #ffffff;
`;

export default function CEO({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [dadosConsolidados, setDadosConsolidados] = useState({
    tatuape: { vendas: [], funcionarios: [], produtos: [], caixa: [] },
    mogi: { vendas: [], funcionarios: [], produtos: [], caixa: [] },
    online: { vendas: [], funcionarios: [], produtos: [], caixa: [] },
    clientes: []
  });

  useEffect(() => {
    carregarDadosCEO();
  }, []);

  const carregarDadosCEO = async () => {
    setLoading(true);
    try {
      await Promise.all([
        carregarDadosLoja('tatuape'),
        carregarDadosLoja('mogi'),
        carregarVendasOnline(),
        carregarClientes()
      ]);
    } catch (error) {
      console.error('Erro ao carregar dados do CEO:', error);
    } finally {
      setLoading(false);
    }
  };

  const carregarVendasOnline = async () => {
    try {
      const [vendasOnline, funcionariosOnline, vendasTatuapeOnline] = await Promise.all([
        supabase.from('pedidos_online').select('*').eq('status', 'finalizado').order('created_at', { ascending: false }),
        supabase.from('usuarios_tatuape').select('*').eq('ativo', true).in('tipo', ['vendedor_online', 'gerente_online', 'separador_online']),
        supabase.from('vendas_tatuape').select('*').ilike('vendedor_nome', '%online%').order('data_venda', { ascending: false })
      ]);

      const todasVendasOnline = [
        ...(vendasOnline.data || []).map(v => ({
          ...v,
          data_venda: v.created_at,
          valor_final: v.valor_total,
          vendedor_nome: 'Sistema Online'
        })),
        ...(vendasTatuapeOnline.data || [])
      ];

      setDadosConsolidados(prev => ({
        ...prev,
        online: {
          vendas: todasVendasOnline,
          funcionarios: funcionariosOnline.data || [],
          produtos: [],
          caixa: []
        }
      }));
    } catch (error) {
      console.error('Erro ao carregar vendas online:', error);
    }
  };

  const carregarClientes = async () => {
    try {
      const [clientesTatuape, clientesMogi, pedidosOnline] = await Promise.all([
        supabase.from('clientes_tatuape').select('*'),
        supabase.from('clientes_mogi').select('*'),
        supabase.from('pedidos_online').select('*')
      ]);

      const todosClientes = [
        ...(clientesTatuape.data || []).map(c => ({...c, loja: 'Tatuapé'})),
        ...(clientesMogi.data || []).map(c => ({...c, loja: 'Mogi'})),
        ...(pedidosOnline.data || []).map(p => ({
          nome_completo: p.cliente_nome,
          cpf: p.cliente_cpf,
          telefone: p.cliente_telefone,
          endereco: `${p.endereco_rua}, ${p.endereco_numero} - ${p.endereco_bairro}, ${p.endereco_cidade}`,
          loja: 'Online',
          created_at: p.created_at
        }))
      ];

      setDadosConsolidados(prev => ({
        ...prev,
        clientes: todosClientes
      }));
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
    }
  };

  const carregarDadosLoja = async (loja) => {
    try {
      const [vendas, funcionarios, produtos, caixa] = await Promise.all([
        supabase.from(`vendas_${loja}`).select('*').not('vendedor_nome', 'ilike', '%online%').order('data_venda', { ascending: false }),
        supabase.from(`usuarios_${loja}`).select('*').eq('ativo', true).not('tipo', 'in', '("vendedor_online","gerente_online","separador_online")'),
        supabase.from(`produtos_${loja}`).select('*').eq('ativo', true),
        supabase.from(`caixa_${loja}`).select('*').order('created_at', { ascending: false }).limit(100)
      ]);

      setDadosConsolidados(prev => ({
        ...prev,
        [loja]: {
          vendas: vendas.data || [],
          funcionarios: funcionarios.data || [],
          produtos: produtos.data || [],
          caixa: caixa.data || []
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
    const inicioAno = new Date(hoje.getFullYear(), 0, 1);
    
    let metricas = {
      vendasHoje: { tatuape: 0, mogi: 0, online: 0, total: 0 },
      vendasMes: { tatuape: 0, mogi: 0, online: 0, total: 0 },
      vendasAno: { tatuape: 0, mogi: 0, online: 0, total: 0 },
      estoqueTotal: { tatuape: 0, mogi: 0, total: 0 },
      funcionarios: { tatuape: 0, mogi: 0, online: 0, total: 0 }
    };

    ['tatuape', 'mogi'].forEach(loja => {
      const dados = dadosConsolidados[loja];
      
      const vendasHoje = dados.vendas.filter(v => 
        new Date(v.data_venda).toDateString() === hoje.toDateString()
      );
      metricas.vendasHoje[loja] = vendasHoje.reduce((sum, v) => sum + parseFloat(v.valor_final || 0), 0);
      
      const vendasMes = dados.vendas.filter(v => 
        new Date(v.data_venda) >= inicioMes
      );
      metricas.vendasMes[loja] = vendasMes.reduce((sum, v) => sum + parseFloat(v.valor_final || 0), 0);
      
      const vendasAno = dados.vendas.filter(v => 
        new Date(v.data_venda) >= inicioAno
      );
      metricas.vendasAno[loja] = vendasAno.reduce((sum, v) => sum + parseFloat(v.valor_final || 0), 0);
      
      metricas.estoqueTotal[loja] = dados.produtos.reduce((sum, p) => 
        sum + ((p.estoque_atual || 0) * (p.preco_venda || 0)), 0
      );
      
      metricas.funcionarios[loja] = dados.funcionarios.length;
    });

    // Vendas Online
    const dadosOnline = dadosConsolidados.online;
    const vendasOnlineHoje = dadosOnline.vendas.filter(v => 
      new Date(v.data_venda || v.created_at).toDateString() === hoje.toDateString()
    );
    metricas.vendasHoje.online = vendasOnlineHoje.reduce((sum, v) => sum + parseFloat(v.valor_final || v.valor_total || 0), 0);
    
    const vendasOnlineMes = dadosOnline.vendas.filter(v => 
      new Date(v.data_venda || v.created_at) >= inicioMes
    );
    metricas.vendasMes.online = vendasOnlineMes.reduce((sum, v) => sum + parseFloat(v.valor_final || v.valor_total || 0), 0);
    
    const vendasOnlineAno = dadosOnline.vendas.filter(v => 
      new Date(v.data_venda || v.created_at) >= inicioAno
    );
    metricas.vendasAno.online = vendasOnlineAno.reduce((sum, v) => sum + parseFloat(v.valor_final || v.valor_total || 0), 0);
    
    metricas.funcionarios.online = dadosOnline.funcionarios.length;

    metricas.vendasHoje.total = metricas.vendasHoje.tatuape + metricas.vendasHoje.mogi + metricas.vendasHoje.online;
    metricas.vendasMes.total = metricas.vendasMes.tatuape + metricas.vendasMes.mogi + metricas.vendasMes.online;
    metricas.vendasAno.total = metricas.vendasAno.tatuape + metricas.vendasAno.mogi + metricas.vendasAno.online;
    metricas.estoqueTotal.total = metricas.estoqueTotal.tatuape + metricas.estoqueTotal.mogi;
    metricas.funcionarios.total = metricas.funcionarios.tatuape + metricas.funcionarios.mogi + metricas.funcionarios.online;

    return metricas;
  };

  const calcularPerformanceVendedores = () => {
    const hoje = new Date();
    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    
    let vendedores = [];

    ['tatuape', 'mogi'].forEach(loja => {
      const dados = dadosConsolidados[loja];
      
      dados.funcionarios.filter(f => f.tipo === 'vendedor').forEach(vendedor => {
        const vendasVendedor = dados.vendas.filter(v => 
          v.vendedor_nome === vendedor.nome && 
          new Date(v.data_venda) >= inicioMes
        );
        
        const totalVendas = vendasVendedor.reduce((sum, v) => sum + parseFloat(v.valor_final || 0), 0);
        const quantidadeVendas = vendasVendedor.length;
        const ticketMedio = quantidadeVendas > 0 ? totalVendas / quantidadeVendas : 0;
        const metaAtingida = vendedor.meta_mensal > 0 ? (totalVendas / vendedor.meta_mensal * 100) : 0;

        vendedores.push({
          nome: vendedor.nome,
          loja: loja.toUpperCase(),
          totalVendas,
          quantidadeVendas,
          ticketMedio,
          meta: vendedor.meta_mensal || 0,
          metaAtingida
        });
      });
    });

    return vendedores.sort((a, b) => b.totalVendas - a.totalVendas);
  };

  const calcularClientesPorOrigem = () => {
    let origens = {};
    
    ['tatuape', 'mogi'].forEach(loja => {
      const dados = dadosConsolidados[loja];
      
      dados.vendas.forEach(venda => {
        if (venda.cliente_nome) {
          const origem = loja === 'tatuape' ? 'São Paulo' : 'Mogi das Cruzes';
          origens[origem] = (origens[origem] || 0) + 1;
        }
      });
    });

    return Object.entries(origens).map(([origem, quantidade]) => ({
      origem,
      quantidade
    })).sort((a, b) => b.quantidade - a.quantidade);
  };

  const exportarRelatorio = (tipo) => {
    const metricas = calcularMetricasGerais();
    let dados = [];
    
    switch (tipo) {
      case 'vendas-consolidado':
        dados = [
          ['Período', 'Tatuapé', 'Mogi', 'Total'],
          ['Hoje', formatarValor(metricas.vendasHoje.tatuape), formatarValor(metricas.vendasHoje.mogi), formatarValor(metricas.vendasHoje.total)],
          ['Mês', formatarValor(metricas.vendasMes.tatuape), formatarValor(metricas.vendasMes.mogi), formatarValor(metricas.vendasMes.total)],
          ['Ano', formatarValor(metricas.vendasAno.tatuape), formatarValor(metricas.vendasAno.mogi), formatarValor(metricas.vendasAno.total)]
        ];
        break;
      case 'performance-vendedores':
        const vendedores = calcularPerformanceVendedores();
        dados = [
          ['Vendedor', 'Loja', 'Total Vendas', 'Qtd Vendas', 'Ticket Médio', 'Meta', '% Meta'],
          ...vendedores.map(v => [
            v.nome, v.loja, formatarValor(v.totalVendas), v.quantidadeVendas, 
            formatarValor(v.ticketMedio), formatarValor(v.meta), `${v.metaAtingida.toFixed(1)}%`
          ])
        ];
        break;
      case 'estoque-consolidado':
        dados = [
          ['Loja', 'Produtos', 'Valor Total'],
          ['Tatuapé', dadosConsolidados.tatuape.produtos.length, formatarValor(metricas.estoqueTotal.tatuape)],
          ['Mogi', dadosConsolidados.mogi.produtos.length, formatarValor(metricas.estoqueTotal.mogi)],
          ['Total', dadosConsolidados.tatuape.produtos.length + dadosConsolidados.mogi.produtos.length, formatarValor(metricas.estoqueTotal.total)]
        ];
        break;
    }
    
    const ws = XLSX.utils.aoa_to_sheet(dados);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Relatório CEO');
    XLSX.writeFile(wb, `relatorio_ceo_${tipo}_${new Date().toISOString().slice(0, 10)}.xlsx`);
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
          Carregando dashboard executivo...
        </div>
      </Container>
    );
  }

  const metricas = calcularMetricasGerais();
  const vendedores = calcularPerformanceVendedores();
  const clientesOrigem = calcularClientesPorOrigem();

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
            <Logo>ÁREA DO CEO</Logo>
            <UserInfo>Dashboard Executivo | {user.nome}</UserInfo>
          </div>
        </div>
        <LogoutButton onClick={onLogout}>Sair</LogoutButton>
      </Header>

      <TabContainer>
        <Tab $active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')}>
          Dashboard
        </Tab>
        <Tab $active={activeTab === 'vendas-tatuape'} onClick={() => setActiveTab('vendas-tatuape')}>
          Vendas Tatuapé
        </Tab>
        <Tab $active={activeTab === 'vendas-mogi'} onClick={() => setActiveTab('vendas-mogi')}>
          Vendas Mogi
        </Tab>
        <Tab $active={activeTab === 'performance'} onClick={() => setActiveTab('performance')}>
          Performance Vendedores
        </Tab>
        <Tab $active={activeTab === 'comparativo'} onClick={() => setActiveTab('comparativo')}>
          Comparativo Lojas
        </Tab>
        <Tab $active={activeTab === 'clientes'} onClick={() => setActiveTab('clientes')}>
          Origem Clientes
        </Tab>
        <Tab $active={activeTab === 'vendas-online'} onClick={() => setActiveTab('vendas-online')}>
          Vendas Online
        </Tab>
        <Tab $active={activeTab === 'financeiro'} onClick={() => setActiveTab('financeiro')}>
          Financeiro
        </Tab>
      </TabContainer>

      <ContentArea>
        {activeTab === 'dashboard' && (
          <>
            <h2 style={{marginBottom: '30px', color: '#ffffff'}}>📊 Dashboard Executivo</h2>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '20px',
              marginBottom: '30px'
            }}>
              <MetricCard color="#10b981">
                <div style={{fontSize: '2.5rem', fontWeight: '800', marginBottom: '8px', color: '#10b981'}}>
                  {formatarValor(metricas.vendasHoje.total)}
                </div>
                <div style={{fontSize: '0.85rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px'}}>
                  VENDAS HOJE
                </div>
                <div style={{fontSize: '0.9rem', color: '#999', marginTop: '5px'}}>
                  Tatuapé: {formatarValor(metricas.vendasHoje.tatuape)} | Mogi: {formatarValor(metricas.vendasHoje.mogi)} | Online: {formatarValor(metricas.vendasHoje.online)}
                </div>
              </MetricCard>

              <MetricCard color="#3b82f6">
                <div style={{fontSize: '2.5rem', fontWeight: '800', marginBottom: '8px', color: '#3b82f6'}}>
                  {formatarValor(metricas.vendasMes.total)}
                </div>
                <div style={{fontSize: '0.85rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px'}}>
                  VENDAS DO MÊS
                </div>
                <div style={{fontSize: '0.9rem', color: '#999', marginTop: '5px'}}>
                  Tatuapé: {formatarValor(metricas.vendasMes.tatuape)} | Mogi: {formatarValor(metricas.vendasMes.mogi)} | Online: {formatarValor(metricas.vendasMes.online)}
                </div>
              </MetricCard>

              <MetricCard color="#8b5cf6">
                <div style={{fontSize: '2.5rem', fontWeight: '800', marginBottom: '8px', color: '#8b5cf6'}}>
                  {formatarValor(metricas.estoqueTotal.total)}
                </div>
                <div style={{fontSize: '0.85rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px'}}>
                  VALOR ESTOQUE
                </div>
                <div style={{fontSize: '0.9rem', color: '#999', marginTop: '5px'}}>
                  Tatuapé: {formatarValor(metricas.estoqueTotal.tatuape)} | Mogi: {formatarValor(metricas.estoqueTotal.mogi)}
                </div>
              </MetricCard>

              <MetricCard color="#f59e0b">
                <div style={{fontSize: '2.5rem', fontWeight: '800', marginBottom: '8px', color: '#f59e0b'}}>
                  {metricas.funcionarios.total}
                </div>
                <div style={{fontSize: '0.85rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px'}}>
                  FUNCIONÁRIOS
                </div>
                <div style={{fontSize: '0.9rem', color: '#999', marginTop: '5px'}}>
                  Tatuapé: {metricas.funcionarios.tatuape} | Mogi: {metricas.funcionarios.mogi} | Online: {metricas.funcionarios.online}
                </div>
              </MetricCard>
            </div>

            <Card>
              <h3 style={{marginBottom: '20px'}}>🏆 Top 5 Vendedores do Mês</h3>
              <Table>
                <thead>
                  <tr>
                    <Th>Posição</Th>
                    <Th>Vendedor</Th>
                    <Th>Loja</Th>
                    <Th>Total Vendas</Th>
                    <Th>Qtd Vendas</Th>
                    <Th>% Meta</Th>
                  </tr>
                </thead>
                <tbody>
                  {vendedores.slice(0, 5).map((vendedor, index) => (
                    <tr key={`${vendedor.nome}-${vendedor.loja}`}>
                      <Td>
                        <span style={{
                          background: index === 0 ? '#ffd700' : index === 1 ? '#c0c0c0' : index === 2 ? '#cd7f32' : '#666',
                          color: index < 3 ? '#000' : '#fff',
                          padding: '4px 8px',
                          borderRadius: '50%',
                          fontWeight: 'bold'
                        }}>
                          {index + 1}º
                        </span>
                      </Td>
                      <Td>{vendedor.nome}</Td>
                      <Td>{vendedor.loja}</Td>
                      <Td style={{color: '#10b981', fontWeight: 'bold'}}>{formatarValor(vendedor.totalVendas)}</Td>
                      <Td>{vendedor.quantidadeVendas}</Td>
                      <Td style={{
                        color: vendedor.metaAtingida >= 100 ? '#10b981' : vendedor.metaAtingida >= 70 ? '#f59e0b' : '#ef4444'
                      }}>
                        {vendedor.metaAtingida.toFixed(1)}%
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card>

            <Card>
              <h3 style={{marginBottom: '20px'}}>🚀 Ações Rápidas</h3>
              <div style={{display: 'flex', flexWrap: 'wrap', gap: '10px'}}>
                <Button onClick={() => exportarRelatorio('vendas-consolidado')}>
                  📊 Exportar Vendas
                </Button>
                <Button onClick={() => exportarRelatorio('performance-vendedores')} className="secondary">
                  👥 Performance Vendedores
                </Button>
                <Button onClick={() => exportarRelatorio('estoque-consolidado')} className="success">
                  📦 Relatório Estoque
                </Button>
              </div>
            </Card>
          </>
        )}

        {activeTab === 'vendas-tatuape' && (
          <>
            <h2>🏢 Vendas Tatuapé</h2>
            <Card>
              <h3>Vendas: {formatarValor(metricas.vendasMes.tatuape)}</h3>
              <Table>
                <thead><tr><Th>Data</Th><Th>Vendedor</Th><Th>Valor</Th></tr></thead>
                <tbody>
                  {dadosConsolidados.tatuape.vendas.slice(0, 10).map(v => (
                    <tr key={v.id}><Td>{new Date(v.data_venda).toLocaleDateString()}</Td><Td>{v.vendedor_nome}</Td><Td>{formatarValor(v.valor_final)}</Td></tr>
                  ))}
                </tbody>
              </Table>
            </Card>
          </>
        )}

        {activeTab === 'vendas-mogi' && (
          <>
            <h2>🏪 Vendas Mogi</h2>
            <Card>
              <h3>Vendas: {formatarValor(metricas.vendasMes.mogi)}</h3>
              <Table>
                <thead><tr><Th>Data</Th><Th>Vendedor</Th><Th>Valor</Th></tr></thead>
                <tbody>
                  {dadosConsolidados.mogi.vendas.slice(0, 10).map(v => (
                    <tr key={v.id}><Td>{new Date(v.data_venda).toLocaleDateString()}</Td><Td>{v.vendedor_nome}</Td><Td>{formatarValor(v.valor_final)}</Td></tr>
                  ))}
                </tbody>
              </Table>
            </Card>
          </>
        )}

        {activeTab === 'vendas-online' && (
          <>
            <h2>🌐 Vendas Online</h2>
            <Card>
              <h3>Vendas: {formatarValor(metricas.vendasMes.online)}</h3>
              <Table>
                <thead><tr><Th>Data</Th><Th>Vendedor</Th><Th>Cliente</Th><Th>Valor</Th><Th>Status</Th></tr></thead>
                <tbody>
                  {dadosConsolidados.online.vendas.slice(0, 15).map((v, index) => (
                    <tr key={index}>
                      <Td>{new Date(v.data_venda || v.created_at).toLocaleDateString()}</Td>
                      <Td>{v.vendedor_nome || 'Sistema Online'}</Td>
                      <Td>{v.cliente_nome || '-'}</Td>
                      <Td>{formatarValor(v.valor_final || v.valor_total)}</Td>
                      <Td>
                        <span style={{
                          background: v.status === 'finalizado' ? '#10b981' : '#f59e0b',
                          color: 'white',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '0.8rem'
                        }}>
                          {v.status || 'Concluída'}
                        </span>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card>
            
            <Card>
              <h3>Funcionários Online: {metricas.funcionarios.online}</h3>
              <Table>
                <thead><tr><Th>Nome</Th><Th>Tipo</Th><Th>Email</Th></tr></thead>
                <tbody>
                  {dadosConsolidados.online.funcionarios.map(f => (
                    <tr key={f.id}>
                      <Td>{f.nome}</Td>
                      <Td>{f.tipo}</Td>
                      <Td>{f.email}</Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card>
          </>
        )}

        {activeTab === 'performance' && (
          <>
            <h2>🏆 Performance Vendedores</h2>
            <Card>
              <Table>
                <thead><tr><Th>Vendedor</Th><Th>Loja</Th><Th>Vendas</Th><Th>Meta %</Th></tr></thead>
                <tbody>
                  {vendedores.map(v => (
                    <tr key={`${v.nome}-${v.loja}`}><Td>{v.nome}</Td><Td>{v.loja}</Td><Td>{formatarValor(v.totalVendas)}</Td><Td>{v.metaAtingida.toFixed(1)}%</Td></tr>
                  ))}
                </tbody>
              </Table>
            </Card>
          </>
        )}

        {activeTab === 'comparativo' && (
          <>
            <h2>⚖️ Comparativo</h2>
            <Card>
              <Table>
                <thead><tr><Th>Métrica</Th><Th>Tatuapé</Th><Th>Mogi</Th><Th>Online</Th></tr></thead>
                <tbody>
                  <tr><Td>Vendas Mês</Td><Td>{formatarValor(metricas.vendasMes.tatuape)}</Td><Td>{formatarValor(metricas.vendasMes.mogi)}</Td><Td>{formatarValor(metricas.vendasMes.online)}</Td></tr>
                  <tr><Td>Estoque</Td><Td>{formatarValor(metricas.estoqueTotal.tatuape)}</Td><Td>{formatarValor(metricas.estoqueTotal.mogi)}</Td><Td>-</Td></tr>
                  <tr><Td>Funcionários</Td><Td>{metricas.funcionarios.tatuape}</Td><Td>{metricas.funcionarios.mogi}</Td><Td>{metricas.funcionarios.online}</Td></tr>
                </tbody>
              </Table>
            </Card>
          </>
        )}

        {activeTab === 'clientes' && (
          <>
            <h2>👥 Todos os Clientes Cadastrados</h2>
            <Card>
              <h3>Total: {dadosConsolidados.clientes.length} clientes</h3>
              <Table>
                <thead>
                  <tr>
                    <Th>Nome</Th>
                    <Th>CPF</Th>
                    <Th>Telefone</Th>
                    <Th>Endereço</Th>
                    <Th>Loja</Th>
                    <Th>Data Cadastro</Th>
                  </tr>
                </thead>
                <tbody>
                  {dadosConsolidados.clientes.map((cliente, index) => (
                    <tr key={index}>
                      <Td>{cliente.nome_completo || '-'}</Td>
                      <Td>{cliente.cpf || '-'}</Td>
                      <Td>{cliente.telefone || '-'}</Td>
                      <Td>{cliente.endereco || cliente.cidade || '-'}</Td>
                      <Td>
                        <span style={{
                          background: cliente.loja === 'Tatuapé' ? '#10b981' : cliente.loja === 'Mogi' ? '#3b82f6' : '#8b5cf6',
                          color: 'white',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '0.8rem'
                        }}>
                          {cliente.loja}
                        </span>
                      </Td>
                      <Td>{new Date(cliente.created_at).toLocaleDateString('pt-BR')}</Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card>
          </>
        )}

        {activeTab === 'financeiro' && (
          <>
            <h2>💰 Financeiro</h2>
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px'}}>
              <MetricCard color="#10b981">
                <div style={{fontSize: '1.5rem', fontWeight: 'bold', color: '#10b981'}}>{formatarValor(metricas.vendasAno.total)}</div>
                <div>Receita Anual</div>
              </MetricCard>
              <MetricCard color="#3b82f6">
                <div style={{fontSize: '1.5rem', fontWeight: 'bold', color: '#3b82f6'}}>{formatarValor(metricas.vendasMes.total)}</div>
                <div>Receita Mensal</div>
              </MetricCard>
              <MetricCard color="#8b5cf6">
                <div style={{fontSize: '1.5rem', fontWeight: 'bold', color: '#8b5cf6'}}>{formatarValor(metricas.estoqueTotal.total)}</div>
                <div>Capital Investido</div>
              </MetricCard>
            </div>
          </>
        )}
      </ContentArea>
    </Container>
  );
}