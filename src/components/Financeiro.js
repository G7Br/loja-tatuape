import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { supabase } from '../utils/supabase';
import { financeiroService } from '../utils/financeiroService';
import * as XLSX from 'xlsx';

// ESTILOS CORPORATIVOS - PADRÃO PRETO/BRANCO/CINZA
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
  
  &.danger {
    background: #dc2626;
    color: #ffffff;
    
    &:hover {
      background: #b91c1c;
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

const Input = styled.input`
  width: 100%;
  padding: 15px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid #333333;
  border-radius: 8px;
  color: #ffffff;
  font-size: 16px;
  margin-bottom: 15px;
  
  &::placeholder {
    color: #888888;
  }
  
  &:focus {
    outline: none;
    border-color: #555555;
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 15px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid #333333;
  border-radius: 8px;
  color: #ffffff;
  font-size: 16px;
  margin-bottom: 15px;
  
  option {
    background: #333333;
    color: #ffffff;
  }
  
  &:focus {
    outline: none;
    border-color: #555555;
  }
`;

const Modal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: #1a1a1a;
  border: 1px solid #333;
  border-radius: 12px;
  padding: 30px;
  width: 90%;
  max-width: 600px;
  color: white;
  max-height: 80vh;
  overflow-y: auto;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  
  h3 {
    margin: 0;
    color: #ffffff;
  }
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: #999;
  font-size: 24px;
  cursor: pointer;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    color: #fff;
  }
`;

export default function Financeiro({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState('visao-geral');
  const [loading, setLoading] = useState(true);
  const [modalAberto, setModalAberto] = useState(null);
  
  // Estados para dados consolidados
  const [dadosConsolidados, setDadosConsolidados] = useState({
    tatuape: { vendas: [], funcionarios: [], caixa: [], estoque: [] },
    mogi: { vendas: [], funcionarios: [], caixa: [], estoque: [] }
  });
  
  // Estados para pagamentos de funcionários
  const [pagamentosFuncionarios, setPagamentosFuncionarios] = useState([]);
  const [novoPagamento, setNovoPagamento] = useState({
    funcionario_id: '',
    loja: '',
    salario: 0,
    meta_funcionario: 0,
    vendas_realizadas: 0,
    percentual_comissao: 30.00,
    comissao_calculada: 0,
    bonus: 0,
    descontos: 0,
    mes_referencia: new Date().toISOString().slice(0, 7)
  });
  
  // Estados para configurações de metas
  const [metasFuncionarios, setMetasFuncionarios] = useState([]);
  const [editandoMeta, setEditandoMeta] = useState(null);
  const [lancamentos, setLancamentos] = useState([]);
  const [novoLancamento, setNovoLancamento] = useState({
    tipo: 'entrada',
    categoria: '',
    valor: 0,
    descricao: '',
    loja: 'tatuape',
    data: new Date().toISOString().slice(0, 10)
  });

  useEffect(() => {
    carregarDadosFinanceiros();
  }, []);

  const carregarDadosFinanceiros = async () => {
    setLoading(true);
    try {
      // Carregar dados de ambas as lojas
      await Promise.all([
        carregarDadosLoja('tatuape'),
        carregarDadosLoja('mogi'),
        carregarPagamentosFuncionarios(),
        carregarLancamentosFinanceiros()
      ]);
    } catch (error) {
      console.error('Erro ao carregar dados financeiros:', error);
    } finally {
      setLoading(false);
    }
  };

  const carregarDadosLoja = async (loja) => {
    // Agora todas as lojas usam o mesmo cliente supabase
    const client = supabase;
    
    try {
      // Vendas
      const { data: vendas } = await client
        .from(`vendas_${loja}`)
        .select('*')
        .neq('forma_pagamento', 'pendente_caixa')
        .order('data_venda', { ascending: false });
      
      // Funcionários
      const { data: funcionarios } = await client
        .from(`usuarios_${loja}`)
        .select('*')
        .eq('ativo', true);
      
      // Movimentações de caixa
      const { data: caixa } = await client
        .from(`caixa_${loja}`)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      
      // Produtos/Estoque
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

  const carregarPagamentosFuncionarios = async () => {
    try {
      // Simular dados de pagamentos (implementar tabela real depois)
      const pagamentos = [];
      setPagamentosFuncionarios(pagamentos);
    } catch (error) {
      console.error('Erro ao carregar pagamentos:', error);
    }
  };

  const carregarLancamentosFinanceiros = async () => {
    try {
      // Simular dados de lançamentos (implementar tabela real depois)
      const lancamentosData = [];
      setLancamentos(lancamentosData);
    } catch (error) {
      console.error('Erro ao carregar lançamentos:', error);
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
      
      // Vendas do mês
      const vendasMes = dados.vendas.filter(v => 
        new Date(v.data_venda) >= inicioMes
      );
      totalVendasMes += vendasMes.reduce((sum, v) => sum + parseFloat(v.valor_final || 0), 0);
      
      // Vendas de hoje
      const vendasHoje = dados.vendas.filter(v => 
        new Date(v.data_venda).toDateString() === hoje.toDateString()
      );
      totalVendasHoje += vendasHoje.reduce((sum, v) => sum + parseFloat(v.valor_final || 0), 0);
      
      // Funcionários
      totalFuncionarios += dados.funcionarios.length;
      
      // Valor do estoque
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

  const calcularComissao = () => {
    const { vendas_realizadas, meta_funcionario, percentual_comissao } = novoPagamento;
    
    if (vendas_realizadas < meta_funcionario) {
      return 0;
    }
    
    return (vendas_realizadas / meta_funcionario) * (percentual_comissao / 100) * meta_funcionario;
  };

  const atualizarComissaoCalculada = () => {
    const comissaoCalculada = calcularComissao();
    setNovoPagamento(prev => ({
      ...prev,
      comissao_calculada: comissaoCalculada
    }));
  };

  // Recalcular comissão quando valores mudarem
  useEffect(() => {
    if (novoPagamento.vendas_realizadas && novoPagamento.meta_funcionario && novoPagamento.percentual_comissao) {
      atualizarComissaoCalculada();
    }
  }, [novoPagamento.vendas_realizadas, novoPagamento.meta_funcionario, novoPagamento.percentual_comissao]);
  const atualizarMetaFuncionario = async (funcionarioId, loja, novaMeta) => {
    try {
      // Agora todas as lojas usam o mesmo cliente supabase
      const client = supabase;
      const { error } = await client
        .from(`usuarios_${loja}`)
        .update({ meta_mensal: parseFloat(novaMeta) })
        .eq('id', funcionarioId);
      
      if (error) throw error;
      
      setDadosConsolidados(prev => ({
        ...prev,
        [loja]: {
          ...prev[loja],
          funcionarios: prev[loja].funcionarios.map(f => 
            f.id === funcionarioId ? { ...f, meta_mensal: parseFloat(novaMeta) } : f
          )
        }
      }));
      
      alert('Meta atualizada com sucesso!');
      setEditandoMeta(null);
    } catch (error) {
      alert('Erro ao atualizar meta: ' + error.message);
    }
  };

  const registrarPagamentoFuncionario = async () => {
    if (!novoPagamento.funcionario_id || !novoPagamento.loja) {
      alert('Selecione um funcionário e a loja');
      return;
    }
    
    try {
      // Implementar lógica de pagamento
      alert('Pagamento registrado com sucesso!');
      setModalAberto(null);
      setNovoPagamento({
        funcionario_id: '',
        loja: '',
        salario: 0,
        meta_funcionario: 0,
        vendas_realizadas: 0,
        percentual_comissao: 30.00,
        comissao_calculada: 0,
        bonus: 0,
        descontos: 0,
        mes_referencia: new Date().toISOString().slice(0, 7)
      });
      carregarPagamentosFuncionarios();
    } catch (error) {
      alert('Erro ao registrar pagamento: ' + error.message);
    }
  };

  const adicionarLancamento = async () => {
    if (!novoLancamento.categoria || !novoLancamento.valor || !novoLancamento.descricao) {
      alert('Preencha todos os campos obrigatórios');
      return;
    }
    
    try {
      // Implementar lógica de lançamento
      alert('Lançamento adicionado com sucesso!');
      setModalAberto(null);
      setNovoLancamento({
        tipo: 'entrada',
        categoria: '',
        valor: 0,
        descricao: '',
        loja: 'tatuape',
        data: new Date().toISOString().slice(0, 10)
      });
      carregarLancamentosFinanceiros();
    } catch (error) {
      alert('Erro ao adicionar lançamento: ' + error.message);
    }
  };

  const exportarRelatorio = (tipo) => {
    const metricas = calcularMetricasGerais();
    
    let dados = [];
    
    switch (tipo) {
      case 'vendas':
        dados = [
          ['Loja', 'Data', 'Vendedor', 'Cliente', 'Valor', 'Pagamento'],
          ...dadosConsolidados.tatuape.vendas.map(v => [
            'Tatuapé', v.data_venda, v.vendedor_nome, v.cliente_nome, v.valor_final, v.forma_pagamento
          ]),
          ...dadosConsolidados.mogi.vendas.map(v => [
            'Mogi', v.data_venda, v.vendedor_nome, v.cliente_nome, v.valor_final, v.forma_pagamento
          ])
        ];
        break;
      case 'funcionarios':
        dados = [
          ['Loja', 'Nome', 'Tipo', 'Meta Mensal', 'Ativo'],
          ...dadosConsolidados.tatuape.funcionarios.map(f => [
            'Tatuapé', f.nome, f.tipo, f.meta_mensal, f.ativo ? 'Sim' : 'Não'
          ]),
          ...dadosConsolidados.mogi.funcionarios.map(f => [
            'Mogi', f.nome, f.tipo, f.meta_mensal, f.ativo ? 'Sim' : 'Não'
          ])
        ];
        break;
      case 'consolidado':
        dados = [
          ['Métrica', 'Valor'],
          ['Total Vendas Mês', formatarValor(metricas.totalVendasMes)],
          ['Total Vendas Hoje', formatarValor(metricas.totalVendasHoje)],
          ['Total Funcionários', metricas.totalFuncionarios],
          ['Valor Total Estoque', formatarValor(metricas.totalEstoque)]
        ];
        break;
    }
    
    const ws = XLSX.utils.aoa_to_sheet(dados);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Relatório');
    XLSX.writeFile(wb, `relatorio_${tipo}_${new Date().toISOString().slice(0, 10)}.xlsx`);
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
            
            {/* Indicadores Principais */}
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

            {/* Resumo por Loja */}
            <Card>
              <h3 style={{marginBottom: '20px'}}>Resumo por Loja</h3>
              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px'}}>
                {['tatuape', 'mogi'].map(loja => {
                  const dados = dadosConsolidados[loja];
                  const hoje = new Date();
                  const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
                  
                  const vendasMes = dados.vendas.filter(v => 
                    new Date(v.data_venda) >= inicioMes
                  );
                  const totalMes = vendasMes.reduce((sum, v) => sum + parseFloat(v.valor_final || 0), 0);
                  
                  return (
                    <div key={loja} style={{
                      background: '#111111',
                      padding: '20px',
                      borderRadius: '8px',
                      border: '1px solid #333333'
                    }}>
                      <h4 style={{
                        textTransform: 'uppercase',
                        marginBottom: '15px',
                        color: loja === 'tatuape' ? '#10b981' : '#3b82f6'
                      }}>
                        {loja === 'tatuape' ? '🏢 TATUAPÉ' : '🏪 MOGI DAS CRUZES'}
                      </h4>
                      
                      <div style={{marginBottom: '10px'}}>
                        <strong>Vendas do Mês:</strong> {formatarValor(totalMes)}
                      </div>
                      <div style={{marginBottom: '10px'}}>
                        <strong>Funcionários:</strong> {dados.funcionarios.length}
                      </div>
                      <div style={{marginBottom: '10px'}}>
                        <strong>Produtos:</strong> {dados.estoque.length}
                      </div>
                      <div>
                        <strong>Última Venda:</strong> {
                          dados.vendas.length > 0 
                            ? new Date(dados.vendas[0].data_venda).toLocaleDateString('pt-BR')
                            : 'Nenhuma venda'
                        }
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Ações Rápidas */}
            <Card>
              <h3 style={{marginBottom: '20px'}}>Ações Rápidas</h3>
              <div style={{display: 'flex', flexWrap: 'wrap', gap: '10px'}}>
                <Button onClick={() => setModalAberto('novo-pagamento')}>
                  💰 Novo Pagamento
                </Button>
                <Button onClick={() => setModalAberto('novo-lancamento')} className="secondary">
                  📝 Novo Lançamento
                </Button>
                <Button onClick={() => exportarRelatorio('consolidado')} className="success">
                  📊 Exportar Consolidado
                </Button>
                <Button onClick={() => setActiveTab('fechamento')} className="secondary">
                  🔒 Fechamento Mensal
                </Button>
              </div>
            </Card>
          </>
        )}

        {activeTab === 'resultado-lojas' && (
          <>
            <h2 style={{marginBottom: '30px', color: '#ffffff'}}>🏢 Resultado por Loja</h2>
            
            {['tatuape', 'mogi'].map(loja => {
              const dados = dadosConsolidados[loja];
              const hoje = new Date();
              const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
              
              const vendasMes = dados.vendas.filter(v => 
                new Date(v.data_venda) >= inicioMes
              );
              const totalMes = vendasMes.reduce((sum, v) => sum + parseFloat(v.valor_final || 0), 0);
              const ticketMedio = vendasMes.length > 0 ? totalMes / vendasMes.length : 0;
              
              return (
                <Card key={loja}>
                  <h3 style={{
                    color: loja === 'tatuape' ? '#10b981' : '#3b82f6',
                    marginBottom: '20px'
                  }}>
                    {loja === 'tatuape' ? '🏢 LOJA TATUAPÉ' : '🏪 LOJA MOGI DAS CRUZES'}
                  </h3>
                  
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '20px',
                    marginBottom: '20px'
                  }}>
                    <div style={{background: '#111111', padding: '15px', borderRadius: '8px'}}>
                      <div style={{fontSize: '1.5rem', fontWeight: 'bold', color: '#10b981'}}>
                        {formatarValor(totalMes)}
                      </div>
                      <div style={{fontSize: '0.9rem', color: '#ccc'}}>Vendas do Mês</div>
                    </div>
                    
                    <div style={{background: '#111111', padding: '15px', borderRadius: '8px'}}>
                      <div style={{fontSize: '1.5rem', fontWeight: 'bold', color: '#3b82f6'}}>
                        {vendasMes.length}
                      </div>
                      <div style={{fontSize: '0.9rem', color: '#ccc'}}>Quantidade de Vendas</div>
                    </div>
                    
                    <div style={{background: '#111111', padding: '15px', borderRadius: '8px'}}>
                      <div style={{fontSize: '1.5rem', fontWeight: 'bold', color: '#8b5cf6'}}>
                        {formatarValor(ticketMedio)}
                      </div>
                      <div style={{fontSize: '0.9rem', color: '#ccc'}}>Ticket Médio</div>
                    </div>
                    
                    <div style={{background: '#111111', padding: '15px', borderRadius: '8px'}}>
                      <div style={{fontSize: '1.5rem', fontWeight: 'bold', color: '#f59e0b'}}>
                        {dados.funcionarios.length}
                      </div>
                      <div style={{fontSize: '0.9rem', color: '#ccc'}}>Funcionários</div>
                    </div>
                  </div>
                  
                  {/* Top 5 Vendas Recentes */}
                  <h4>Vendas Recentes</h4>
                  <Table>
                    <thead>
                      <tr>
                        <Th>Data</Th>
                        <Th>Vendedor</Th>
                        <Th>Cliente</Th>
                        <Th>Valor</Th>
                        <Th>Pagamento</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {dados.vendas.slice(0, 5).map(venda => (
                        <tr key={venda.id}>
                          <Td>{new Date(venda.data_venda).toLocaleDateString('pt-BR')}</Td>
                          <Td>{venda.vendedor_nome}</Td>
                          <Td>{venda.cliente_nome || '-'}</Td>
                          <Td>{formatarValor(venda.valor_final)}</Td>
                          <Td>{venda.forma_pagamento}</Td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </Card>
              );
            })}
          </>
        )}

        {activeTab === 'fluxo-caixa' && (
          <>
            <h2 style={{marginBottom: '30px', color: '#ffffff'}}>💳 Fluxo de Caixa Consolidado</h2>
            
            <Card>
              <h3>Movimentações Recentes</h3>
              <Table>
                <thead>
                  <tr>
                    <Th>Data</Th>
                    <Th>Loja</Th>
                    <Th>Tipo</Th>
                    <Th>Valor</Th>
                    <Th>Descrição</Th>
                  </tr>
                </thead>
                <tbody>
                  {[...dadosConsolidados.tatuape.caixa.map(c => ({...c, loja: 'Tatuapé'})),
                    ...dadosConsolidados.mogi.caixa.map(c => ({...c, loja: 'Mogi'}))]
                    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                    .slice(0, 20)
                    .map(mov => (
                    <tr key={`${mov.loja}-${mov.id}`}>
                      <Td>{new Date(mov.created_at).toLocaleDateString('pt-BR')}</Td>
                      <Td>{mov.loja}</Td>
                      <Td style={{
                        color: mov.tipo === 'entrada' ? '#10b981' : '#ef4444'
                      }}>
                        {mov.tipo === 'entrada' ? '⬆️ Entrada' : '⬇️ Saída'}
                      </Td>
                      <Td>{formatarValor(mov.valor)}</Td>
                      <Td>{mov.descricao}</Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card>
          </>
        )}

        {activeTab === 'lancamentos' && (
          <>
            <h2 style={{marginBottom: '30px', color: '#ffffff'}}>📝 Lançamentos Financeiros</h2>
            
            <Card>
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
                <h3>Lançamentos</h3>
                <Button onClick={() => setModalAberto('novo-lancamento')}>
                  ➕ Novo Lançamento
                </Button>
              </div>
              
              <Table>
                <thead>
                  <tr>
                    <Th>Data</Th>
                    <Th>Tipo</Th>
                    <Th>Categoria</Th>
                    <Th>Valor</Th>
                    <Th>Loja</Th>
                    <Th>Descrição</Th>
                  </tr>
                </thead>
                <tbody>
                  {lancamentos.length === 0 ? (
                    <tr>
                      <Td colSpan="6" style={{textAlign: 'center', color: '#999'}}>
                        Nenhum lançamento registrado
                      </Td>
                    </tr>
                  ) : (
                    lancamentos.map(lancamento => (
                      <tr key={lancamento.id}>
                        <Td>{new Date(lancamento.data).toLocaleDateString('pt-BR')}</Td>
                        <Td style={{
                          color: lancamento.tipo === 'entrada' ? '#10b981' : '#ef4444'
                        }}>
                          {lancamento.tipo === 'entrada' ? '⬆️ Entrada' : '⬇️ Saída'}
                        </Td>
                        <Td>{lancamento.categoria}</Td>
                        <Td>{formatarValor(lancamento.valor)}</Td>
                        <Td>{lancamento.loja.toUpperCase()}</Td>
                        <Td>{lancamento.descricao}</Td>
                      </tr>
                    ))
                  )}
                </tbody>
              </Table>
            </Card>
          </>
        )}

        {activeTab === 'pagamentos' && (
          <>
            <h2 style={{marginBottom: '30px', color: '#ffffff'}}>💰 Pagamentos de Funcionários</h2>
            
            <Card>
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
                <h3>Funcionários por Loja</h3>
                <Button onClick={() => setModalAberto('novo-pagamento')}>
                  💰 Registrar Pagamento
                </Button>
              </div>
              
              {['tatuape', 'mogi'].map(loja => (
                <div key={loja} style={{marginBottom: '30px'}}>
                  <h4 style={{
                    color: loja === 'tatuape' ? '#10b981' : '#3b82f6',
                    marginBottom: '15px'
                  }}>
                    {loja === 'tatuape' ? '🏢 FUNCIONÁRIOS TATUAPÉ' : '🏪 FUNCIONÁRIOS MOGI'}
                  </h4>
                  
                  <Table>
                    <thead>
                      <tr>
                        <Th>Nome</Th>
                        <Th>Cargo</Th>
                        <Th>Salário Base</Th>
                        <Th>Meta Mensal</Th>
                        <Th>% Comissão</Th>
                        <Th>Status</Th>
                        <Th>Ações</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {dadosConsolidados[loja].funcionarios
                        .filter(funcionario => funcionario.tipo === 'vendedor' || funcionario.tipo === 'gerente')
                        .map(funcionario => {
                        // Calcular vendas do funcionário no mês atual
                        const hoje = new Date();
                        const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
                        const vendasFuncionario = dadosConsolidados[loja].vendas.filter(v => 
                          v.vendedor_nome === funcionario.nome && 
                          new Date(v.data_venda) >= inicioMes
                        );
                        const totalVendas = vendasFuncionario.reduce((sum, v) => sum + parseFloat(v.valor_final || 0), 0);
                        const metaAtingida = funcionario.meta_mensal > 0 ? (totalVendas / funcionario.meta_mensal * 100).toFixed(1) : 0;
                        
                        return (
                          <tr key={funcionario.id}>
                            <Td>
                              <div>
                                <strong>{funcionario.nome}</strong>
                                <div style={{fontSize: '0.8rem', color: '#999'}}>
                                  Vendas: {formatarValor(totalVendas)} ({metaAtingida}% da meta)
                                </div>
                              </div>
                            </Td>
                            <Td>{funcionario.tipo}</Td>
                            <Td>
                              <div style={{color: '#10b981', fontWeight: 'bold'}}>
                                R$ 1.500,00
                              </div>
                              <div style={{fontSize: '0.8rem', color: '#999'}}>Base</div>
                            </Td>
                            <Td>
                              <div style={{color: '#3b82f6', fontWeight: 'bold'}}>
                                {formatarValor(funcionario.meta_mensal || 0)}
                              </div>
                              <div style={{fontSize: '0.8rem', color: metaAtingida >= 100 ? '#10b981' : '#ef4444'}}>
                                {metaAtingida}% atingido
                              </div>
                            </Td>
                            <Td>
                              <div style={{color: '#f59e0b', fontWeight: 'bold'}}>
                                30%
                              </div>
                              <div style={{fontSize: '0.8rem', color: '#999'}}>da meta</div>
                            </Td>
                            <Td style={{
                              color: funcionario.ativo ? '#10b981' : '#ef4444'
                            }}>
                              {funcionario.ativo ? '✅ Ativo' : '❌ Inativo'}
                            </Td>
                            <Td>
                              <Button 
                                style={{padding: '8px 12px', fontSize: '12px'}}
                                onClick={() => {
                                  setNovoPagamento({
                                    ...novoPagamento,
                                    funcionario_id: funcionario.id,
                                    loja: loja,
                                    salario: 1500.00, // Salário base padrão
                                    meta_funcionario: funcionario.meta_mensal || 0,
                                    vendas_realizadas: totalVendas
                                  });
                                  setModalAberto('novo-pagamento');
                                }}
                              >
                                💰 Calcular Pagamento
                              </Button>
                            </Td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </Table>
                </div>
              ))}
            </Card>
          </>
        )}

        {activeTab === 'fechamento' && (
          <>
            <h2 style={{marginBottom: '30px', color: '#ffffff'}}>🔒 Fechamento Financeiro</h2>
            
            <Card>
              <h3>Fechamento Mensal</h3>
              <p style={{color: '#ccc', marginBottom: '20px'}}>
                Realize o fechamento financeiro consolidado de todas as lojas
              </p>
              
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '20px',
                marginBottom: '30px'
              }}>
                <div style={{background: '#111111', padding: '20px', borderRadius: '8px'}}>
                  <h4 style={{color: '#10b981'}}>Total Vendas</h4>
                  <div style={{fontSize: '1.8rem', fontWeight: 'bold'}}>
                    {formatarValor(metricas.totalVendasMes)}
                  </div>
                </div>
                
                <div style={{background: '#111111', padding: '20px', borderRadius: '8px'}}>
                  <h4 style={{color: '#3b82f6'}}>Total Funcionários</h4>
                  <div style={{fontSize: '1.8rem', fontWeight: 'bold'}}>
                    {metricas.totalFuncionarios}
                  </div>
                </div>
                
                <div style={{background: '#111111', padding: '20px', borderRadius: '8px'}}>
                  <h4 style={{color: '#8b5cf6'}}>Valor Estoque</h4>
                  <div style={{fontSize: '1.8rem', fontWeight: 'bold'}}>
                    {formatarValor(metricas.totalEstoque)}
                  </div>
                </div>
              </div>
              
              <div style={{display: 'flex', gap: '10px'}}>
                <Button onClick={() => exportarRelatorio('vendas')}>
                  📊 Exportar Vendas
                </Button>
                <Button onClick={() => exportarRelatorio('funcionarios')} className="secondary">
                  👥 Exportar Funcionários
                </Button>
                <Button onClick={() => exportarRelatorio('consolidado')} className="success">
                  📈 Relatório Consolidado
                </Button>
              </div>
            </Card>
          </>
        )}
        {activeTab === 'configuracoes' && (
          <>
            <h2 style={{marginBottom: '30px', color: '#ffffff'}}>⚙️ Configurações de Metas</h2>
            
            {['tatuape', 'mogi'].map(loja => (
              <Card key={loja}>
                <h3 style={{
                  color: loja === 'tatuape' ? '#10b981' : '#3b82f6',
                  marginBottom: '20px'
                }}>
                  {loja === 'tatuape' ? '🏢 METAS TATUAPÉ' : '🏪 METAS MOGI DAS CRUZES'}
                </h3>
                
                <Table>
                  <thead>
                    <tr>
                      <Th>Nome</Th>
                      <Th>Cargo</Th>
                      <Th>Meta Atual</Th>
                      <Th>Vendas Mês</Th>
                      <Th>% Atingido</Th>
                      <Th>Ações</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {dadosConsolidados[loja].funcionarios
                      .filter(f => f.tipo === 'vendedor' || f.tipo === 'gerente')
                      .map(funcionario => {
                        const hoje = new Date();
                        const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
                        const vendasFuncionario = dadosConsolidados[loja].vendas.filter(v => 
                          v.vendedor_nome === funcionario.nome && 
                          new Date(v.data_venda) >= inicioMes
                        );
                        const totalVendas = vendasFuncionario.reduce((sum, v) => sum + parseFloat(v.valor_final || 0), 0);
                        const percentualMeta = funcionario.meta_mensal > 0 ? (totalVendas / funcionario.meta_mensal * 100) : 0;
                        
                        return (
                          <tr key={funcionario.id}>
                            <Td>{funcionario.nome}</Td>
                            <Td>
                              <span style={{
                                background: funcionario.tipo === 'gerente' ? '#8b5cf6' : '#3b82f6',
                                color: 'white',
                                padding: '4px 8px',
                                borderRadius: '4px',
                                fontSize: '0.8rem',
                                textTransform: 'uppercase'
                              }}>
                                {funcionario.tipo}
                              </span>
                            </Td>
                            <Td>
                              {editandoMeta === `${funcionario.id}-${loja}` ? (
                                <div style={{display: 'flex', gap: '5px', alignItems: 'center'}}>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    defaultValue={funcionario.meta_mensal || 0}
                                    style={{marginBottom: 0, width: '120px'}}
                                    onKeyPress={(e) => {
                                      if (e.key === 'Enter') {
                                        atualizarMetaFuncionario(funcionario.id, loja, e.target.value);
                                      }
                                    }}
                                  />
                                  <Button
                                    style={{padding: '8px 12px', fontSize: '12px'}}
                                    onClick={(e) => {
                                      const input = e.target.parentElement.querySelector('input');
                                      atualizarMetaFuncionario(funcionario.id, loja, input.value);
                                    }}
                                  >
                                    ✓
                                  </Button>
                                  <Button
                                    className="secondary"
                                    style={{padding: '8px 12px', fontSize: '12px'}}
                                    onClick={() => setEditandoMeta(null)}
                                  >
                                    ✕
                                  </Button>
                                </div>
                              ) : (
                                <div>
                                  <div style={{fontWeight: 'bold', color: '#10b981'}}>
                                    {formatarValor(funcionario.meta_mensal || 0)}
                                  </div>
                                  <div style={{fontSize: '0.8rem', color: '#999'}}>
                                    {funcionario.tipo === 'gerente' ? 'Meta Gerencial' : 'Meta Individual'}
                                  </div>
                                </div>
                              )}
                            </Td>
                            <Td>
                              <div style={{fontWeight: 'bold', color: '#3b82f6'}}>
                                {formatarValor(totalVendas)}
                              </div>
                              <div style={{fontSize: '0.8rem', color: '#999'}}>
                                {vendasFuncionario.length} vendas
                              </div>
                            </Td>
                            <Td>
                              <div style={{
                                fontWeight: 'bold',
                                color: percentualMeta >= 100 ? '#10b981' : percentualMeta >= 70 ? '#f59e0b' : '#ef4444'
                              }}>
                                {percentualMeta.toFixed(1)}%
                              </div>
                              <div style={{fontSize: '0.8rem', color: '#999'}}>
                                {percentualMeta >= 100 ? '🎯 Meta atingida' : `Faltam ${formatarValor((funcionario.meta_mensal || 0) - totalVendas)}`}
                              </div>
                            </Td>
                            <Td>
                              <Button
                                style={{padding: '8px 12px', fontSize: '12px'}}
                                onClick={() => setEditandoMeta(`${funcionario.id}-${loja}`)}
                                disabled={editandoMeta === `${funcionario.id}-${loja}`}
                              >
                                ✏️ Editar Meta
                              </Button>
                            </Td>
                          </tr>
                        );
                      })
                    }
                  </tbody>
                </Table>
                
                {/* Resumo da Loja */}
                <div style={{
                  background: '#111111',
                  padding: '15px',
                  borderRadius: '8px',
                  marginTop: '20px',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '15px'
                }}>
                  {(() => {
                    const funcionariosAtivos = dadosConsolidados[loja].funcionarios.filter(f => f.tipo === 'vendedor' || f.tipo === 'gerente');
                    const totalMetas = funcionariosAtivos.reduce((sum, f) => sum + (f.meta_mensal || 0), 0);
                    
                    const hoje = new Date();
                    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
                    const totalVendas = dadosConsolidados[loja].vendas
                      .filter(v => new Date(v.data_venda) >= inicioMes)
                      .reduce((sum, v) => sum + parseFloat(v.valor_final || 0), 0);
                    
                    const percentualGeral = totalMetas > 0 ? (totalVendas / totalMetas * 100) : 0;
                    
                    return [
                      {
                        titulo: 'Meta Total da Loja',
                        valor: formatarValor(totalMetas),
                        cor: '#8b5cf6'
                      },
                      {
                        titulo: 'Vendas Realizadas',
                        valor: formatarValor(totalVendas),
                        cor: '#3b82f6'
                      },
                      {
                        titulo: '% da Meta Geral',
                        valor: `${percentualGeral.toFixed(1)}%`,
                        cor: percentualGeral >= 100 ? '#10b981' : percentualGeral >= 70 ? '#f59e0b' : '#ef4444'
                      },
                      {
                        titulo: 'Funcionários com Meta',
                        valor: funcionariosAtivos.length,
                        cor: '#10b981'
                      }
                    ].map((item, index) => (
                      <div key={index} style={{textAlign: 'center'}}>
                        <div style={{
                          fontSize: '1.5rem',
                          fontWeight: 'bold',
                          color: item.cor,
                          marginBottom: '5px'
                        }}>
                          {item.valor}
                        </div>
                        <div style={{fontSize: '0.8rem', color: '#ccc'}}>
                          {item.titulo}
                        </div>
                      </div>
                    ));
                  })()
                  }
                </div>
              </Card>
            ))}
            
            {/* Ações Rápidas */}
            <Card>
              <h3 style={{marginBottom: '20px'}}>🚀 Ações Rápidas</h3>
              <div style={{display: 'flex', flexWrap: 'wrap', gap: '10px'}}>
                <Button onClick={() => {
                  const novaMetaVendedores = prompt('Nova meta para TODOS os vendedores (R$):');
                  if (novaMetaVendedores) {
                    ['tatuape', 'mogi'].forEach(loja => {
                      dadosConsolidados[loja].funcionarios
                        .filter(f => f.tipo === 'vendedor')
                        .forEach(f => atualizarMetaFuncionario(f.id, loja, novaMetaVendedores));
                    });
                  }
                }}>
                  👥 Definir Meta Geral - Vendedores
                </Button>
                
                <Button className="secondary" onClick={() => {
                  const novaMetaGerentes = prompt('Nova meta para TODOS os gerentes (R$):');
                  if (novaMetaGerentes) {
                    ['tatuape', 'mogi'].forEach(loja => {
                      dadosConsolidados[loja].funcionarios
                        .filter(f => f.tipo === 'gerente')
                        .forEach(f => atualizarMetaFuncionario(f.id, loja, novaMetaGerentes));
                    });
                  }
                }}>
                  👔 Definir Meta Geral - Gerentes
                </Button>
                
                <Button className="success" onClick={() => {
                  const dados = [];
                  ['tatuape', 'mogi'].forEach(loja => {
                    dadosConsolidados[loja].funcionarios
                      .filter(f => f.tipo === 'vendedor' || f.tipo === 'gerente')
                      .forEach(f => {
                        const hoje = new Date();
                        const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
                        const vendas = dadosConsolidados[loja].vendas
                          .filter(v => v.vendedor_nome === f.nome && new Date(v.data_venda) >= inicioMes)
                          .reduce((sum, v) => sum + parseFloat(v.valor_final || 0), 0);
                        
                        dados.push([
                          loja.toUpperCase(),
                          f.nome,
                          f.tipo,
                          f.meta_mensal || 0,
                          vendas,
                          f.meta_mensal > 0 ? ((vendas / f.meta_mensal) * 100).toFixed(1) + '%' : '0%'
                        ]);
                      });
                  });
                  
                  const ws = XLSX.utils.aoa_to_sheet([
                    ['Loja', 'Nome', 'Cargo', 'Meta', 'Vendas', '% Atingido'],
                    ...dados
                  ]);
                  const wb = XLSX.utils.book_new();
                  XLSX.utils.book_append_sheet(wb, ws, 'Metas');
                  XLSX.writeFile(wb, `metas_funcionarios_${new Date().toISOString().slice(0, 10)}.xlsx`);
                }}>
                  📊 Exportar Relatório de Metas
                </Button>
              </div>
            </Card>
          </>
        )}
      </ContentArea>

      {/* Modal Novo Pagamento */}
      {modalAberto === 'novo-pagamento' && (
        <Modal onClick={() => setModalAberto(null)}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <h3>💰 Calcular Pagamento de Funcionário</h3>
              <CloseButton onClick={() => setModalAberto(null)}>×</CloseButton>
            </ModalHeader>
            
            <Select
              value={novoPagamento.loja}
              onChange={(e) => setNovoPagamento({...novoPagamento, loja: e.target.value})}
            >
              <option value="">Selecione a loja</option>
              <option value="tatuape">Tatuapé</option>
              <option value="mogi">Mogi das Cruzes</option>
            </Select>
            
            {novoPagamento.loja && (
              <Select
                value={novoPagamento.funcionario_id}
                onChange={(e) => {
                  const funcionario = dadosConsolidados[novoPagamento.loja].funcionarios.find(f => f.id === e.target.value);
                  if (funcionario) {
                    // Calcular vendas do funcionário
                    const hoje = new Date();
                    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
                    const vendasFuncionario = dadosConsolidados[novoPagamento.loja].vendas.filter(v => 
                      v.vendedor_nome === funcionario.nome && 
                      new Date(v.data_venda) >= inicioMes
                    );
                    const totalVendas = vendasFuncionario.reduce((sum, v) => sum + parseFloat(v.valor_final || 0), 0);
                    
                    setNovoPagamento({
                      ...novoPagamento,
                      funcionario_id: e.target.value,
                      meta_funcionario: funcionario.meta_mensal || 0,
                      vendas_realizadas: totalVendas
                    });
                  }
                }}
              >
                <option value="">Selecione o funcionário</option>
                {dadosConsolidados[novoPagamento.loja].funcionarios.map(func => (
                  <option key={func.id} value={func.id}>{func.nome} - {func.tipo}</option>
                ))}
              </Select>
            )}
            
            <Input
              type="month"
              value={novoPagamento.mes_referencia}
              onChange={(e) => setNovoPagamento({...novoPagamento, mes_referencia: e.target.value})}
            />
            
            {/* Informações do Funcionário */}
            {novoPagamento.funcionario_id && (
              <div style={{background: '#111111', padding: '15px', borderRadius: '8px', marginBottom: '15px'}}>
                <h4 style={{marginBottom: '10px', color: '#10b981'}}>📈 Informações do Funcionário</h4>
                <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.9rem'}}>
                  <div>
                    <strong>Meta Mensal:</strong><br/>
                    <span style={{color: '#3b82f6'}}>{formatarValor(novoPagamento.meta_funcionario)}</span>
                  </div>
                  <div>
                    <strong>Vendas Realizadas:</strong><br/>
                    <span style={{color: novoPagamento.vendas_realizadas >= novoPagamento.meta_funcionario ? '#10b981' : '#ef4444'}}>
                      {formatarValor(novoPagamento.vendas_realizadas)}
                    </span>
                  </div>
                  <div>
                    <strong>% da Meta Atingida:</strong><br/>
                    <span style={{color: novoPagamento.vendas_realizadas >= novoPagamento.meta_funcionario ? '#10b981' : '#ef4444'}}>
                      {novoPagamento.meta_funcionario > 0 ? ((novoPagamento.vendas_realizadas / novoPagamento.meta_funcionario) * 100).toFixed(1) : 0}%
                    </span>
                  </div>
                  <div>
                    <strong>Status Meta:</strong><br/>
                    <span style={{color: novoPagamento.vendas_realizadas >= novoPagamento.meta_funcionario ? '#10b981' : '#ef4444'}}>
                      {novoPagamento.vendas_realizadas >= novoPagamento.meta_funcionario ? '✅ Atingida' : '❌ Não Atingida'}
                    </span>
                  </div>
                </div>
              </div>
            )}
            
            {/* Configuração de Pagamento */}
            <div style={{background: '#111111', padding: '15px', borderRadius: '8px', marginBottom: '15px'}}>
              <h4 style={{marginBottom: '15px', color: '#f59e0b'}}>⚙️ Configuração de Pagamento</h4>
              
              <label style={{display: 'block', marginBottom: '5px', color: '#ccc', fontSize: '0.9rem'}}>Salário Base (R$)</label>
              <Input
                type="number"
                step="0.01"
                placeholder="Salário base"
                value={novoPagamento.salario}
                onChange={(e) => setNovoPagamento({...novoPagamento, salario: parseFloat(e.target.value) || 0})}
              />
              
              <label style={{display: 'block', marginBottom: '5px', color: '#ccc', fontSize: '0.9rem'}}>% de Comissão sobre Meta</label>
              <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  placeholder="30.00"
                  value={novoPagamento.percentual_comissao}
                  onChange={(e) => setNovoPagamento({...novoPagamento, percentual_comissao: parseFloat(e.target.value) || 0})}
                  style={{marginBottom: 0}}
                />
                <span style={{color: '#ccc', fontSize: '0.9rem'}}>%</span>
              </div>
              <div style={{fontSize: '0.8rem', color: '#999', marginTop: '5px'}}>
                💡 Funcionário recebe comissão apenas se atingir a meta
              </div>
            </div>
            
            {/* Cálculo da Comissão */}
            <div style={{background: '#0a0a0a', padding: '15px', borderRadius: '8px', marginBottom: '15px', border: '1px solid #333'}}>
              <h4 style={{marginBottom: '10px', color: '#8b5cf6'}}>🧮 Cálculo da Comissão</h4>
              <div style={{fontSize: '0.9rem', lineHeight: '1.4'}}>
                <div style={{marginBottom: '10px'}}>
                  <strong>Comissão se atingir meta:</strong> <span style={{color: '#10b981'}}>{formatarValor((novoPagamento.percentual_comissao / 100) * novoPagamento.meta_funcionario)}</span>
                </div>
                {novoPagamento.vendas_realizadas < novoPagamento.meta_funcionario ? (
                  <div style={{color: '#ef4444'}}>
                    ❌ Meta não atingida - Sem comissão<br/>
                    <small>Precisa vender mais {formatarValor(novoPagamento.meta_funcionario - novoPagamento.vendas_realizadas)}</small>
                  </div>
                ) : (
                  <div style={{color: '#10b981'}}>
                    ✅ Meta atingida - Comissão calculada:<br/>
                    <strong>Fórmula:</strong> (Vendas / Meta) × {novoPagamento.percentual_comissao}% × Meta<br/>
                    <strong>Cálculo:</strong> ({formatarValor(novoPagamento.vendas_realizadas)} / {formatarValor(novoPagamento.meta_funcionario)}) × {novoPagamento.percentual_comissao}% × {formatarValor(novoPagamento.meta_funcionario)}<br/>
                    <strong>Resultado:</strong> <span style={{fontSize: '1.1rem'}}>{formatarValor(novoPagamento.comissao_calculada)}</span>
                  </div>
                )}
              </div>
            </div>
            
            <Input
              type="number"
              step="0.01"
              placeholder="Bônus adicional"
              value={novoPagamento.bonus}
              onChange={(e) => setNovoPagamento({...novoPagamento, bonus: parseFloat(e.target.value) || 0})}
            />
            
            <Input
              type="number"
              step="0.01"
              placeholder="Descontos"
              value={novoPagamento.descontos}
              onChange={(e) => setNovoPagamento({...novoPagamento, descontos: parseFloat(e.target.value) || 0})}
            />
            
            {/* Total a Pagar */}
            <div style={{marginBottom: '20px', padding: '20px', background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)', borderRadius: '8px', border: '2px solid #10b981'}}>
              <div style={{textAlign: 'center'}}>
                <div style={{fontSize: '0.9rem', color: '#ccc', marginBottom: '5px'}}>TOTAL A PAGAR</div>
                <div style={{fontSize: '2rem', fontWeight: 'bold', color: '#10b981'}}>
                  {formatarValor(novoPagamento.salario + novoPagamento.comissao_calculada + novoPagamento.bonus - novoPagamento.descontos)}
                </div>
                <div style={{fontSize: '0.8rem', color: '#999', marginTop: '5px'}}>
                  Salário: {formatarValor(novoPagamento.salario)} + Comissão: {formatarValor(novoPagamento.comissao_calculada)} + Bônus: {formatarValor(novoPagamento.bonus)} - Descontos: {formatarValor(novoPagamento.descontos)}
                </div>
              </div>
            </div>
            
            <div style={{display: 'flex', gap: '10px', justifyContent: 'flex-end'}}>
              <Button className="secondary" onClick={() => setModalAberto(null)}>
                Cancelar
              </Button>
              <Button onClick={registrarPagamentoFuncionario}>
                Registrar Pagamento
              </Button>
            </div>
          </ModalContent>
        </Modal>
      )}

      {/* Modal Novo Lançamento */}
      {modalAberto === 'novo-lancamento' && (
        <Modal onClick={() => setModalAberto(null)}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <h3>📝 Novo Lançamento Financeiro</h3>
              <CloseButton onClick={() => setModalAberto(null)}>×</CloseButton>
            </ModalHeader>
            
            <Select
              value={novoLancamento.tipo}
              onChange={(e) => setNovoLancamento({...novoLancamento, tipo: e.target.value})}
            >
              <option value="entrada">⬆️ Entrada</option>
              <option value="saida">⬇️ Saída</option>
            </Select>
            
            <Select
              value={novoLancamento.loja}
              onChange={(e) => setNovoLancamento({...novoLancamento, loja: e.target.value})}
            >
              <option value="tatuape">Tatuapé</option>
              <option value="mogi">Mogi das Cruzes</option>
            </Select>
            
            <Input
              placeholder="Categoria (ex: Vendas, Despesas, Investimentos)"
              value={novoLancamento.categoria}
              onChange={(e) => setNovoLancamento({...novoLancamento, categoria: e.target.value})}
            />
            
            <Input
              type="number"
              step="0.01"
              placeholder="Valor"
              value={novoLancamento.valor}
              onChange={(e) => setNovoLancamento({...novoLancamento, valor: parseFloat(e.target.value) || 0})}
            />
            
            <Input
              type="date"
              value={novoLancamento.data}
              onChange={(e) => setNovoLancamento({...novoLancamento, data: e.target.value})}
            />
            
            <Input
              placeholder="Descrição detalhada"
              value={novoLancamento.descricao}
              onChange={(e) => setNovoLancamento({...novoLancamento, descricao: e.target.value})}
            />
            
            <div style={{display: 'flex', gap: '10px', justifyContent: 'flex-end'}}>
              <Button className="secondary" onClick={() => setModalAberto(null)}>
                Cancelar
              </Button>
              <Button onClick={adicionarLancamento}>
                Adicionar Lançamento
              </Button>
            </div>
          </ModalContent>
        </Modal>
      )}
    </Container>
  );
}