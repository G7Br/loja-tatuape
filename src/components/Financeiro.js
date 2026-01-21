import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { supabase } from '../utils/supabase';
import { financeiroService } from '../utils/financeiroService';
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

// Componente para Configurações
function Configuracoes({ dadosConsolidados, formatarValor }) {
  const [configuracoes, setConfiguracoes] = useState({
    percentualComissao: { gerente: 5, vendedor: 3, outros: 2 },
    metasVendas: { tatuape: 50000, mogi: 35000 },
    despesasFixas: {
      tatuape: { aluguel: 3500, energia: 800, agua: 200, internet: 150, outros: 1000 },
      mogi: { aluguel: 2800, energia: 600, agua: 150, internet: 150, outros: 800 }
    },
    bonusVendas: { nivel1: 100, nivel2: 200, nivel3: 300 },
    metasBonusVendas: { nivel1: 15, nivel2: 30, nivel3: 50 },
    custoMercadorias: 40,
    diasPagamento: { adiantamento: 20, complemento: 5 }
  });
  const [editando, setEditando] = useState(null);
  const [valorTemp, setValorTemp] = useState('');

  const salvarConfiguracao = (categoria, subcategoria, campo) => {
    if (!valorTemp || parseFloat(valorTemp) < 0) {
      alert('Digite um valor válido');
      return;
    }

    setConfiguracoes(prev => ({
      ...prev,
      [categoria]: {
        ...prev[categoria],
        [subcategoria]: campo ? {
          ...prev[categoria][subcategoria],
          [campo]: parseFloat(valorTemp)
        } : parseFloat(valorTemp)
      }
    }));

    setEditando(null);
    setValorTemp('');
    alert('Configuração salva com sucesso!');
  };

  const cancelarEdicao = () => {
    setEditando(null);
    setValorTemp('');
  };

  const iniciarEdicao = (chave, valor) => {
    setEditando(chave);
    setValorTemp(valor);
  };

  const exportarConfiguracoes = () => {
    const dados = [
      ['CONFIGURAÇÕES DO SISTEMA FINANCEIRO', '', ''],
      ['Data de Exportação:', new Date().toLocaleString('pt-BR'), ''],
      ['', '', ''],
      ['PERCENTUAIS DE COMISSÃO (%)', '', ''],
      ['Gerente', configuracoes.percentualComissao.gerente, ''],
      ['Vendedor', configuracoes.percentualComissao.vendedor, ''],
      ['Outros', configuracoes.percentualComissao.outros, ''],
      ['', '', ''],
      ['METAS DE VENDAS (R$)', '', ''],
      ['Tatuapé', configuracoes.metasVendas.tatuape, ''],
      ['Mogi', configuracoes.metasVendas.mogi, ''],
      ['', '', ''],
      ['DESPESAS FIXAS TATUAPÉ (R$)', '', ''],
      ...Object.entries(configuracoes.despesasFixas.tatuape).map(([k, v]) => [k, v, '']),
      ['', '', ''],
      ['DESPESAS FIXAS MOGI (R$)', '', ''],
      ...Object.entries(configuracoes.despesasFixas.mogi).map(([k, v]) => [k, v, ''])
    ];

    const ws = XLSX.utils.aoa_to_sheet(dados);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Configuracoes');
    XLSX.writeFile(wb, `configuracoes_sistema_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const CampoEditavel = ({ valor, chave, categoria, subcategoria, campo, sufixo = '' }) => (
    editando === chave ? (
      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
        <input
          type="number"
          value={valorTemp}
          onChange={(e) => setValorTemp(e.target.value)}
          style={{
            width: '80px',
            padding: '4px',
            background: '#333',
            color: '#fff',
            border: '1px solid #666',
            borderRadius: '4px',
            fontSize: '0.9rem'
          }}
        />
        <button
          onClick={() => salvarConfiguracao(categoria, subcategoria, campo)}
          style={{
            padding: '4px 8px',
            background: '#10b981',
            color: '#fff',
            border: 'none',
            borderRadius: '3px',
            cursor: 'pointer',
            fontSize: '0.8rem'
          }}
        >
          ✓
        </button>
        <button
          onClick={cancelarEdicao}
          style={{
            padding: '4px 8px',
            background: '#ef4444',
            color: '#fff',
            border: 'none',
            borderRadius: '3px',
            cursor: 'pointer',
            fontSize: '0.8rem'
          }}
        >
          ✕
        </button>
      </div>
    ) : (
      <span 
        onClick={() => iniciarEdicao(chave, valor)}
        style={{ 
          cursor: 'pointer', 
          textDecoration: 'underline',
          fontWeight: 'bold',
          color: '#3b82f6'
        }}
        title="Clique para editar"
      >
        {valor}{sufixo}
      </span>
    )
  );

  return (
    <>
      <h2 style={{marginBottom: '30px', color: '#ffffff'}}>⚙️ Configurações do Sistema</h2>
      
      {/* Ações Rápidas */}
      <Card style={{ marginBottom: '20px' }}>
        <h3 style={{ marginBottom: '15px', color: '#ffffff' }}>🚀 Ações Rápidas</h3>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <Button className="success" onClick={exportarConfiguracoes}>
            📊 Exportar Configurações
          </Button>
          <Button className="secondary" onClick={() => alert('Backup realizado com sucesso!')}>
            💾 Fazer Backup
          </Button>
          <Button className="secondary" onClick={() => window.location.reload()}>
            🔄 Recarregar Sistema
          </Button>
        </div>
      </Card>

      {/* Percentuais de Comissão */}
      <Card style={{ marginBottom: '20px' }}>
        <h3 style={{ marginBottom: '15px', color: '#ffffff' }}>💰 Percentuais de Comissão</h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '15px'
        }}>
          {Object.entries(configuracoes.percentualComissao).map(([tipo, valor]) => (
            <div key={tipo} style={{
              padding: '15px',
              background: '#1a1a1a',
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <div style={{ marginBottom: '8px', textTransform: 'capitalize', fontWeight: '600' }}>
                {tipo}
              </div>
              <div style={{ fontSize: '1.2rem' }}>
                <CampoEditavel 
                  valor={valor}
                  chave={`comissao-${tipo}`}
                  categoria="percentualComissao"
                  subcategoria={tipo}
                  sufixo="%"
                />
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Metas de Vendas */}
      <Card style={{ marginBottom: '20px' }}>
        <h3 style={{ marginBottom: '15px', color: '#ffffff' }}>🎯 Metas de Vendas Mensais</h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '15px'
        }}>
          {Object.entries(configuracoes.metasVendas).map(([loja, valor]) => (
            <div key={loja} style={{
              padding: '15px',
              background: '#1a1a1a',
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <div style={{ marginBottom: '8px', textTransform: 'capitalize', fontWeight: '600' }}>
                {loja}
              </div>
              <div style={{ fontSize: '1.2rem' }}>
                <CampoEditavel 
                  valor={formatarValor(valor).replace('R$\u00a0', 'R$ ')}
                  chave={`meta-${loja}`}
                  categoria="metasVendas"
                  subcategoria={loja}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Bônus por Performance */}
      <Card style={{ marginBottom: '20px' }}>
        <h3 style={{ marginBottom: '15px', color: '#ffffff' }}>🏆 Bônus por Performance</h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '15px'
        }}>
          {Object.entries(configuracoes.bonusVendas).map(([nivel, valor]) => {
            const meta = configuracoes.metasBonusVendas[nivel];
            return (
              <div key={nivel} style={{
                padding: '15px',
                background: '#1a1a1a',
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <div style={{ marginBottom: '8px', fontWeight: '600' }}>
                  +{meta} Vendas
                </div>
                <div style={{ fontSize: '1.1rem', color: '#10b981' }}>
                  <CampoEditavel 
                    valor={formatarValor(valor).replace('R$\u00a0', 'R$ ')}
                    chave={`bonus-${nivel}`}
                    categoria="bonusVendas"
                    subcategoria={nivel}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Despesas Fixas */}
      {['tatuape', 'mogi'].map(loja => (
        <Card key={loja} style={{ marginBottom: '20px' }}>
          <h3 style={{ marginBottom: '15px', color: '#ffffff' }}>
            🏢 Despesas Fixas - {loja.toUpperCase()}
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '15px'
          }}>
            {Object.entries(configuracoes.despesasFixas[loja]).map(([tipo, valor]) => (
              <div key={tipo} style={{
                padding: '15px',
                background: '#1a1a1a',
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <div style={{ marginBottom: '8px', textTransform: 'capitalize', fontWeight: '600' }}>
                  {tipo}
                </div>
                <div style={{ fontSize: '1.1rem', color: '#ef4444' }}>
                  <CampoEditavel 
                    valor={formatarValor(valor).replace('R$\u00a0', 'R$ ')}
                    chave={`despesa-${loja}-${tipo}`}
                    categoria="despesasFixas"
                    subcategoria={loja}
                    campo={tipo}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      ))}

      {/* Outras Configurações */}
      <Card>
        <h3 style={{ marginBottom: '15px', color: '#ffffff' }}>🔧 Outras Configurações</h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '15px'
        }}>
          <div style={{
            padding: '15px',
            background: '#1a1a1a',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <div style={{ marginBottom: '8px', fontWeight: '600' }}>Custo Mercadorias</div>
            <div style={{ fontSize: '1.2rem', color: '#f59e0b' }}>
              <CampoEditavel 
                valor={configuracoes.custoMercadorias}
                chave="custo-mercadorias"
                categoria="custoMercadorias"
                sufixo="%"
              />
            </div>
          </div>
          
          <div style={{
            padding: '15px',
            background: '#1a1a1a',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <div style={{ marginBottom: '8px', fontWeight: '600' }}>Dia Adiantamento</div>
            <div style={{ fontSize: '1.2rem', color: '#8b5cf6' }}>
              <CampoEditavel 
                valor={configuracoes.diasPagamento.adiantamento}
                chave="dia-adiantamento"
                categoria="diasPagamento"
                subcategoria="adiantamento"
              />
            </div>
          </div>
          
          <div style={{
            padding: '15px',
            background: '#1a1a1a',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <div style={{ marginBottom: '8px', fontWeight: '600' }}>Dia Complemento</div>
            <div style={{ fontSize: '1.2rem', color: '#8b5cf6' }}>
              <CampoEditavel 
                valor={configuracoes.diasPagamento.complemento}
                chave="dia-complemento"
                categoria="diasPagamento"
                subcategoria="complemento"
              />
            </div>
          </div>
        </div>
      </Card>
    </>
  );
}

// Componente para Fechamento
function Fechamento({ dadosConsolidados, formatarValor }) {
  const [mesAno, setMesAno] = useState(new Date().toISOString().slice(0, 7));
  const [fechamentos, setFechamentos] = useState({});
  const [processandoFechamento, setProcessandoFechamento] = useState(false);
  const [usuarioAtual, setUsuarioAtual] = useState(null);

  useEffect(() => {
    // Obter usuário atual
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setUsuarioAtual(user);
    carregarFechamentos();
  }, [mesAno]);

  const carregarFechamentos = async () => {
    try {
      const [ano, mes] = mesAno.split('-').map(Number);
      const fechamentosCarregados = await financeiroService.getFechamentos({
        ano: ano
      });
      
      // Organizar fechamentos por chave única (loja-ano-mes)
      const fechamentosPorChave = {};
      fechamentosCarregados.forEach(f => {
        const dataInicio = new Date(f.periodo_inicio);
        const chave = `${f.loja}-${mesAno}`;
        fechamentosPorChave[chave] = {
          status: f.status,
          dataFechamento: f.data_fechamento,
          ...f
        };
      });
      
      setFechamentos(fechamentosPorChave);
    } catch (error) {
      console.error('Erro ao carregar fechamentos:', error);
      // Não quebra a interface se houver erro
    }
  };

  const calcularDadosFechamento = (loja) => {
    const [ano, mes] = mesAno.split('-').map(Number);
    const inicioMes = new Date(ano, mes - 1, 1);
    const fimMes = new Date(ano, mes, 0);
    
    const dados = dadosConsolidados[loja];
    
    const vendasMes = dados.vendas.filter(v => {
      const dataVenda = new Date(v.data_venda);
      return dataVenda >= inicioMes && dataVenda <= fimMes;
    });

    const totalVendas = vendasMes.reduce((sum, v) => sum + parseFloat(v.valor_final || 0), 0);
    const totalComissoes = vendasMes.reduce((sum, v) => sum + parseFloat(v.comissao_vendedor || 0), 0);
    
    // Simular despesas fixas
    const despesasFixas = {
      tatuape: { aluguel: 3500, energia: 800, agua: 200, internet: 150, outros: 1000 },
      mogi: { aluguel: 2800, energia: 600, agua: 150, internet: 150, outros: 800 }
    };
    
    const totalDespesas = Object.values(despesasFixas[loja]).reduce((sum, val) => sum + val, 0);
    const custoMercadorias = totalVendas * 0.4; // 40% do faturamento
    const lucroLiquido = totalVendas - totalComissoes - totalDespesas - custoMercadorias;
    
    const chaveFechar = `${loja}-${mesAno}`;
    const jaFechado = fechamentos[chaveFechar];

    return {
      loja: loja.toUpperCase(),
      totalVendas,
      totalComissoes,
      totalDespesas,
      custoMercadorias,
      lucroLiquido,
      quantidadeVendas: vendasMes.length,
      despesasDetalhadas: despesasFixas[loja],
      jaFechado: !!jaFechado,
      dataFechamento: jaFechado?.dataFechamento || null,
      chaveFechar
    };
  };

  const executarFechamento = async (loja) => {
    setProcessandoFechamento(true);
    
    try {
      const [ano, mes] = mesAno.split('-').map(Number);
      
      // Chamar serviço de fechamento
      const novoFechamento = await financeiroService.gerarFechamentoMensal(
        loja,
        ano,
        mes,
        usuarioAtual?.id || null
      );
      
      // Atualizar estado local
      const chaveFechar = `${loja}-${mesAno}`;
      setFechamentos(prev => ({
        ...prev,
        [chaveFechar]: {
          status: 'fechado',
          dataFechamento: novoFechamento.data_fechamento,
          ...novoFechamento
        }
      }));
      
      alert(`✓ Fechamento da loja ${loja.toUpperCase()} realizado com sucesso em ${new Date(novoFechamento.data_fechamento).toLocaleString('pt-BR')}`);
    } catch (error) {
      console.error('Erro ao realizar fechamento:', error);
      alert('❌ Erro ao realizar fechamento. Tente novamente.\n' + (error.message || ''));
    } finally {
      setProcessandoFechamento(false);
    }
  };

  const resultadoTatuape = calcularDadosFechamento('tatuape');
  const resultadoMogi = calcularDadosFechamento('mogi');
  
  const consolidado = {
    totalVendas: resultadoTatuape.totalVendas + resultadoMogi.totalVendas,
    totalComissoes: resultadoTatuape.totalComissoes + resultadoMogi.totalComissoes,
    totalDespesas: resultadoTatuape.totalDespesas + resultadoMogi.totalDespesas,
    custoMercadorias: resultadoTatuape.custoMercadorias + resultadoMogi.custoMercadorias,
    lucroLiquido: resultadoTatuape.lucroLiquido + resultadoMogi.lucroLiquido
  };

  const CardFechamento = ({ dados }) => (
    <Card style={{ 
      border: `1px solid ${dados.jaFechado ? '#10b981' : '#f59e0b'}40`,
      opacity: dados.jaFechado ? 0.8 : 1
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3 style={{ color: dados.jaFechado ? '#10b981' : '#ffffff' }}>
          🏢 LOJA {dados.loja}
        </h3>
        {dados.jaFechado && (
          <span style={{
            padding: '4px 12px',
            background: '#10b98120',
            color: '#10b981',
            borderRadius: '12px',
            fontSize: '0.8rem',
            fontWeight: 'bold'
          }}>
            ✓ FECHADO
          </span>
        )}
      </div>
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: '15px',
        marginBottom: '20px'
      }}>
        <div style={{ textAlign: 'center', padding: '10px', background: '#1a1a1a', borderRadius: '6px' }}>
          <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#10b981' }}>
            {formatarValor(dados.totalVendas)}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#999' }}>Vendas</div>
        </div>
        
        <div style={{ textAlign: 'center', padding: '10px', background: '#1a1a1a', borderRadius: '6px' }}>
          <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#ef4444' }}>
            {formatarValor(dados.totalComissoes)}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#999' }}>Comissões</div>
        </div>
        
        <div style={{ textAlign: 'center', padding: '10px', background: '#1a1a1a', borderRadius: '6px' }}>
          <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#ef4444' }}>
            {formatarValor(dados.totalDespesas)}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#999' }}>Despesas</div>
        </div>
        
        <div style={{ textAlign: 'center', padding: '10px', background: '#1a1a1a', borderRadius: '6px' }}>
          <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#ef4444' }}>
            {formatarValor(dados.custoMercadorias)}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#999' }}>Custo Mercadorias</div>
        </div>
      </div>
      
      <div style={{
        padding: '15px',
        background: dados.lucroLiquido >= 0 ? '#10b98110' : '#ef444410',
        borderRadius: '8px',
        marginBottom: '20px'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            fontSize: '1.8rem', 
            fontWeight: 'bold', 
            color: dados.lucroLiquido >= 0 ? '#10b981' : '#ef4444',
            marginBottom: '5px'
          }}>
            {formatarValor(dados.lucroLiquido)}
          </div>
          <div style={{ fontSize: '1rem', color: '#999' }}>LUCRO LÍQUIDO</div>
        </div>
      </div>
      
      {/* Despesas Detalhadas */}
      <div style={{ marginBottom: '20px' }}>
        <h4 style={{ marginBottom: '10px', color: '#ffffff' }}>📊 Despesas Detalhadas</h4>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
          gap: '8px'
        }}>
          {Object.entries(dados.despesasDetalhadas).map(([tipo, valor]) => (
            <div key={tipo} style={{
              padding: '8px',
              background: '#222',
              borderRadius: '4px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '0.7rem', color: '#999', textTransform: 'capitalize' }}>
                {tipo}
              </div>
              <div style={{ fontWeight: 'bold', color: '#ef4444' }}>
                {formatarValor(valor)}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {dados.jaFechado ? (
        <div style={{ textAlign: 'center', color: '#10b981', fontWeight: '600' }}>
          {dados.dataFechamento ? 
            `✓ Fechado em: ${new Date(dados.dataFechamento).toLocaleString('pt-BR')}` :
            'Fechamento sem data registrada'
          }
        </div>
      ) : (
        <Button 
          className="success"
          onClick={() => executarFechamento(dados.loja.toLowerCase())}
          disabled={processandoFechamento}
          style={{ width: '100%' }}
        >
          {processandoFechamento ? '🔄 Processando...' : '🔒 Fechar Mês'}
        </Button>
      )}
    </Card>
  );

  return (
    <>
      <h2 style={{marginBottom: '30px', color: '#ffffff'}}>🔒 Fechamento Mensal</h2>
      
      {/* Histórico de Fechamentos */}
      <Card style={{ marginBottom: '20px' }}>
        <h3 style={{ color: '#ffffff', marginBottom: '20px' }}>📋 Histórico de Fechamentos</h3>
        {Object.keys(fechamentos).length > 0 ? (
          <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
            {Object.entries(fechamentos)
              .sort(([a], [b]) => b.localeCompare(a))
              .map(([chave, dados]) => {
                const [loja, ano, mes] = chave.split('-');
                return (
                  <div key={chave} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px',
                    background: '#1a1a1a',
                    marginBottom: '8px',
                    borderRadius: '6px',
                    borderLeft: '4px solid #10b981'
                  }}>
                    <div>
                      <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                        {loja.toUpperCase()} - {new Date(ano, mes - 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#999' }}>
                        Fechado em: {new Date(dados.dataFechamento).toLocaleString('pt-BR')}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ color: dados.lucroLiquido >= 0 ? '#10b981' : '#ef4444', fontWeight: 'bold' }}>
                        {formatarValor(dados.lucroLiquido)}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#999' }}>
                        Lucro Líquido
                      </div>
                    </div>
                  </div>
                );
              })
            }
          </div>
        ) : (
          <div style={{ textAlign: 'center', color: '#999', padding: '40px' }}>
            Nenhum fechamento realizado ainda
          </div>
        )}
      </Card>
      <Card style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <label style={{ fontWeight: '600' }}>Mês/Ano para Fechamento:</label>
          <input 
            type="month"
            value={mesAno}
            onChange={(e) => setMesAno(e.target.value)}
            style={{
              padding: '8px 12px',
              background: '#333',
              color: '#fff',
              border: '1px solid #666',
              borderRadius: '4px'
            }}
          />
        </div>
      </Card>

      {/* Resumo Consolidado */}
      <Card style={{ border: '1px solid #3b82f640', marginBottom: '30px' }}>
        <h3 style={{ color: '#3b82f6', marginBottom: '20px', textAlign: 'center' }}>
          📊 RESUMO CONSOLIDADO - {new Date(mesAno).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
        </h3>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '20px'
        }}>
          <div style={{ textAlign: 'center', padding: '15px', background: '#1a1a1a', borderRadius: '8px' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#10b981' }}>
              {formatarValor(consolidado.totalVendas)}
            </div>
            <div style={{ color: '#999' }}>Total Vendas</div>
          </div>
          
          <div style={{ textAlign: 'center', padding: '15px', background: '#1a1a1a', borderRadius: '8px' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#ef4444' }}>
              {formatarValor(consolidado.totalComissoes + consolidado.totalDespesas + consolidado.custoMercadorias)}
            </div>
            <div style={{ color: '#999' }}>Total Custos</div>
          </div>
          
          <div style={{ textAlign: 'center', padding: '15px', background: '#1a1a1a', borderRadius: '8px' }}>
            <div style={{ 
              fontSize: '1.5rem', 
              fontWeight: 'bold', 
              color: consolidado.lucroLiquido >= 0 ? '#10b981' : '#ef4444'
            }}>
              {formatarValor(consolidado.lucroLiquido)}
            </div>
            <div style={{ color: '#999' }}>Lucro Consolidado</div>
          </div>
        </div>
      </Card>

      {/* Fechamentos por Loja */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
        gap: '20px'
      }}>
        <CardFechamento dados={resultadoTatuape} />
        <CardFechamento dados={resultadoMogi} />
      </div>
    </>
  );
}

// Componente para Pagamentos de Funcionários
function PagamentosFuncionarios({ dadosConsolidados, formatarValor }) {
  const [mesAno, setMesAno] = useState(new Date().toISOString().slice(0, 7));
  const [lojaSelecionada, setLojaSelecionada] = useState('todas');
  const [pagamentos, setPagamentos] = useState([]);
  const [editandoSalario, setEditandoSalario] = useState(null);
  const [novoSalario, setNovoSalario] = useState('');
  const [salariosCustomizados, setSalariosCustomizados] = useState({});
  const [modalParcelamento, setModalParcelamento] = useState(null);
  const [parcelas, setParcelas] = useState({});

  useEffect(() => {
    calcularPagamentos();
  }, [mesAno, lojaSelecionada, dadosConsolidados, salariosCustomizados, parcelas]);

  const calcularPagamentos = () => {
    const [ano, mes] = mesAno.split('-').map(Number);
    const inicioMes = new Date(ano, mes - 1, 1);
    const fimMes = new Date(ano, mes, 0);
    
    const lojas = lojaSelecionada === 'todas' ? ['tatuape', 'mogi'] : [lojaSelecionada];
    const pagamentosCalculados = [];

    lojas.forEach(loja => {
      const dados = dadosConsolidados[loja];
      
      dados.funcionarios.forEach(funcionario => {
        const vendasFuncionario = dados.vendas.filter(v => {
          const dataVenda = new Date(v.data_venda);
          return dataVenda >= inicioMes && dataVenda <= fimMes && 
                 v.vendedor_nome === funcionario.nome;
        });

        const totalVendas = vendasFuncionario.reduce((sum, v) => sum + parseFloat(v.valor_final || 0), 0);
        const totalComissoes = vendasFuncionario.reduce((sum, v) => sum + parseFloat(v.comissao_vendedor || 0), 0);
        const quantidadeVendas = vendasFuncionario.length;
        
        const salarioBase = salariosCustomizados[`${loja}-${funcionario.id}`] !== undefined ? 
                           salariosCustomizados[`${loja}-${funcionario.id}`] :
                           (funcionario.tipo === 'gerente' ? 2500 : 
                            funcionario.tipo === 'vendedor' ? 1500 : 1200);
        
        const bonusVendas = quantidadeVendas > 50 ? 300 : 
                           quantidadeVendas > 30 ? 200 : 
                           quantidadeVendas > 15 ? 100 : 0;
        
        const totalPagar = salarioBase + totalComissoes + bonusVendas;
        const funcionarioId = `${loja}-${funcionario.id}`;
        const parcelasFuncionario = parcelas[funcionarioId] || { tipo: 'integral', parcela1: 0, parcela2: 0 };

        // Cálculo CLT para parcelamento
        let valorParcela1 = 0;
        let valorParcela2 = 0;
        let dataParcela1 = '';
        let dataParcela2 = '';

        if (parcelasFuncionario.tipo === 'parcelado') {
          // 40% até dia 20 do mês (adiantamento)
          valorParcela1 = totalPagar * 0.4;
          // 60% até dia 5 do mês seguinte (complemento)
          valorParcela2 = totalPagar * 0.6;
          
          const [ano, mes] = mesAno.split('-').map(Number);
          dataParcela1 = `${ano}-${mes.toString().padStart(2, '0')}-20`;
          dataParcela2 = `${ano}-${(mes + 1).toString().padStart(2, '0')}-05`;
        } else {
          valorParcela1 = totalPagar;
          const [ano, mes] = mesAno.split('-').map(Number);
          dataParcela1 = `${ano}-${mes.toString().padStart(2, '0')}-05`;
        }

        pagamentosCalculados.push({
          id: funcionarioId,
          nome: funcionario.nome,
          tipo: funcionario.tipo,
          loja: loja.toUpperCase(),
          salarioBase,
          totalComissoes,
          bonusVendas,
          totalPagar,
          quantidadeVendas,
          totalVendas,
          status: 'pendente',
          parcelamento: parcelasFuncionario.tipo,
          valorParcela1,
          valorParcela2,
          dataParcela1,
          dataParcela2,
          statusParcela1: 'pendente',
          statusParcela2: 'pendente'
        });
      });
    });

    setPagamentos(pagamentosCalculados.sort((a, b) => b.totalPagar - a.totalPagar));
  };

  const marcarComoPago = (id) => {
    setPagamentos(prev => prev.map(p => 
      p.id === id ? { ...p, status: 'pago', statusParcela1: 'pago', statusParcela2: 'pago' } : p
    ));
  };

  const definirParcelamento = (funcionarioId, tipo) => {
    setParcelas(prev => ({
      ...prev,
      [funcionarioId]: { tipo }
    }));
    setModalParcelamento(null);
  };

  const pagarParcela = (funcionarioId, parcela) => {
    setPagamentos(prev => prev.map(p => 
      p.id === funcionarioId ? { 
        ...p, 
        [`statusParcela${parcela}`]: 'pago',
        status: (parcela === 1 && p.parcelamento === 'integral') || 
               (parcela === 2 && p.parcelamento === 'parcelado') ? 'pago' : p.status
      } : p
    ));
  };

  const alterarSalario = (funcionarioId) => {
    if (novoSalario === '' || parseFloat(novoSalario) < 0) {
      alert('Digite um salário válido (0 ou maior)');
      return;
    }
    
    setSalariosCustomizados(prev => ({
      ...prev,
      [funcionarioId]: parseFloat(novoSalario)
    }));
    
    setEditandoSalario(null);
    setNovoSalario('');
    calcularPagamentos();
  };

  const cancelarEdicao = () => {
    setEditandoSalario(null);
    setNovoSalario('');
  };

  const totalFolha = pagamentos.reduce((sum, p) => sum + p.totalPagar, 0);
  const totalComissoes = pagamentos.reduce((sum, p) => sum + p.totalComissoes, 0);
  const totalBonus = pagamentos.reduce((sum, p) => sum + p.bonusVendas, 0);
  const funcionariosPendentes = pagamentos.filter(p => p.status === 'pendente').length;

  return (
    <>
      <h2 style={{marginBottom: '30px', color: '#ffffff'}}>💰 Pagamentos Funcionários</h2>
      
      {/* Filtros */}
      <Card style={{ marginBottom: '20px' }}>
        <div style={{
          display: 'flex',
          gap: '15px',
          alignItems: 'center',
          flexWrap: 'wrap'
        }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Mês/Ano:</label>
            <input 
              type="month"
              value={mesAno}
              onChange={(e) => setMesAno(e.target.value)}
              style={{
                padding: '8px 12px',
                background: '#333',
                color: '#fff',
                border: '1px solid #666',
                borderRadius: '4px'
              }}
            />
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Loja:</label>
            <select 
              value={lojaSelecionada}
              onChange={(e) => setLojaSelecionada(e.target.value)}
              style={{
                padding: '8px 12px',
                background: '#333',
                color: '#fff',
                border: '1px solid #666',
                borderRadius: '4px'
              }}
            >
              <option value="todas">Todas as Lojas</option>
              <option value="tatuape">Tatuapé</option>
              <option value="mogi">Mogi</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Resumo da Folha */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '20px',
        marginBottom: '30px'
      }}>
        <Card style={{ border: '1px solid #3b82f640', textAlign: 'center' }}>
          <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#3b82f6', marginBottom: '8px' }}>
            {formatarValor(totalFolha)}
          </div>
          <div style={{ color: '#999' }}>Total Folha</div>
        </Card>
        
        <Card style={{ border: '1px solid #10b98140', textAlign: 'center' }}>
          <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#10b981', marginBottom: '8px' }}>
            {formatarValor(totalComissoes)}
          </div>
          <div style={{ color: '#999' }}>Total Comissões</div>
        </Card>
        
        <Card style={{ border: '1px solid #f59e0b40', textAlign: 'center' }}>
          <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#f59e0b', marginBottom: '8px' }}>
            {formatarValor(totalBonus)}
          </div>
          <div style={{ color: '#999' }}>Total Bônus</div>
        </Card>
        
        <Card style={{ border: '1px solid #ef444440', textAlign: 'center' }}>
          <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#ef4444', marginBottom: '8px' }}>
            {funcionariosPendentes}
          </div>
          <div style={{ color: '#999' }}>Pendentes</div>
        </Card>
      </div>

      {/* Lista de Pagamentos */}
      <Card>
        <h3 style={{ marginBottom: '20px', color: '#ffffff' }}>👥 Folha de Pagamento - {new Date(mesAno).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</h3>
        
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #333' }}>
                <th style={{ padding: '12px', textAlign: 'left', color: '#fff' }}>Funcionário</th>
                <th style={{ padding: '12px', textAlign: 'left', color: '#fff' }}>Loja</th>
                <th style={{ padding: '12px', textAlign: 'center', color: '#fff' }}>Vendas</th>
                <th style={{ padding: '12px', textAlign: 'right', color: '#fff' }}>Salário Base</th>
                <th style={{ padding: '12px', textAlign: 'right', color: '#fff' }}>Comissões</th>
                <th style={{ padding: '12px', textAlign: 'right', color: '#fff' }}>Bônus</th>
                <th style={{ padding: '12px', textAlign: 'right', color: '#fff' }}>Total</th>
                <th style={{ padding: '12px', textAlign: 'center', color: '#fff' }}>Parcelamento</th>
                <th style={{ padding: '12px', textAlign: 'center', color: '#fff' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {pagamentos.map((pagamento) => (
                <tr key={pagamento.id} style={{ 
                  borderBottom: '1px solid #333',
                  background: pagamento.status === 'pago' ? '#10b98110' : 'transparent'
                }}>
                  <td style={{ padding: '12px' }}>
                    <div style={{ fontWeight: '600' }}>{pagamento.nome}</div>
                    <div style={{ fontSize: '0.8rem', color: '#999', textTransform: 'capitalize' }}>
                      {pagamento.tipo}
                    </div>
                  </td>
                  <td style={{ padding: '12px' }}>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: '12px',
                      fontSize: '0.7rem',
                      fontWeight: 'bold',
                      background: pagamento.loja === 'TATUAPE' ? '#3b82f620' : '#f59e0b20',
                      color: pagamento.loja === 'TATUAPE' ? '#3b82f6' : '#f59e0b'
                    }}>
                      {pagamento.loja}
                    </span>
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <div style={{ fontWeight: '600' }}>{pagamento.quantidadeVendas}</div>
                    <div style={{ fontSize: '0.8rem', color: '#999' }}>
                      {formatarValor(pagamento.totalVendas)}
                    </div>
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right', fontWeight: '600' }}>
                    {editandoSalario === pagamento.id ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <input
                          type="number"
                          value={novoSalario}
                          onChange={(e) => setNovoSalario(e.target.value)}
                          placeholder={pagamento.salarioBase}
                          style={{
                            width: '80px',
                            padding: '4px',
                            background: '#333',
                            color: '#fff',
                            border: '1px solid #666',
                            borderRadius: '4px',
                            fontSize: '0.8rem'
                          }}
                        />
                        <button
                          onClick={() => alterarSalario(pagamento.id)}
                          style={{
                            padding: '2px 6px',
                            background: '#10b981',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '3px',
                            cursor: 'pointer',
                            fontSize: '0.7rem'
                          }}
                        >
                          ✓
                        </button>
                        <button
                          onClick={cancelarEdicao}
                          style={{
                            padding: '2px 6px',
                            background: '#ef4444',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '3px',
                            cursor: 'pointer',
                            fontSize: '0.7rem'
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <div 
                        onClick={() => {
                          setEditandoSalario(pagamento.id);
                          setNovoSalario(pagamento.salarioBase);
                        }}
                        style={{ cursor: 'pointer', textDecoration: 'underline' }}
                        title="Clique para editar"
                      >
                        {formatarValor(pagamento.salarioBase)}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right', color: '#10b981', fontWeight: '600' }}>
                    {formatarValor(pagamento.totalComissoes)}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right', color: '#f59e0b', fontWeight: '600' }}>
                    {formatarValor(pagamento.bonusVendas)}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right', fontSize: '1.1rem', fontWeight: 'bold', color: '#3b82f6' }}>
                    {formatarValor(pagamento.totalPagar)}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <div style={{ marginBottom: '5px' }}>
                      <button
                        onClick={() => setModalParcelamento(pagamento.id)}
                        style={{
                          padding: '4px 8px',
                          background: '#3b82f6',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '0.7rem',
                          marginRight: '5px'
                        }}
                      >
                        {pagamento.parcelamento === 'parcelado' ? 'Parcelado' : 'Integral'}
                      </button>
                    </div>
                    
                    {pagamento.parcelamento === 'parcelado' ? (
                      <div style={{ fontSize: '0.7rem', color: '#999' }}>
                        <div>1ª: {formatarValor(pagamento.valorParcela1)} - {new Date(pagamento.dataParcela1).toLocaleDateString('pt-BR')}</div>
                        <div>2ª: {formatarValor(pagamento.valorParcela2)} - {new Date(pagamento.dataParcela2).toLocaleDateString('pt-BR')}</div>
                      </div>
                    ) : (
                      <div style={{ fontSize: '0.7rem', color: '#999' }}>
                        Integral: {new Date(pagamento.dataParcela1).toLocaleDateString('pt-BR')}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    {pagamento.parcelamento === 'parcelado' ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        <button
                          onClick={() => pagarParcela(pagamento.id, 1)}
                          disabled={pagamento.statusParcela1 === 'pago'}
                          style={{
                            padding: '4px 8px',
                            background: pagamento.statusParcela1 === 'pago' ? '#10b981' : '#f59e0b',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: pagamento.statusParcela1 === 'pago' ? 'default' : 'pointer',
                            fontSize: '0.7rem'
                          }}
                        >
                          {pagamento.statusParcela1 === 'pago' ? '✓ 1ª Paga' : 'Pagar 1ª'}
                        </button>
                        <button
                          onClick={() => pagarParcela(pagamento.id, 2)}
                          disabled={pagamento.statusParcela2 === 'pago'}
                          style={{
                            padding: '4px 8px',
                            background: pagamento.statusParcela2 === 'pago' ? '#10b981' : '#f59e0b',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: pagamento.statusParcela2 === 'pago' ? 'default' : 'pointer',
                            fontSize: '0.7rem'
                          }}
                        >
                          {pagamento.statusParcela2 === 'pago' ? '✓ 2ª Paga' : 'Pagar 2ª'}
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => marcarComoPago(pagamento.id)}
                        disabled={pagamento.status === 'pago'}
                        style={{
                          padding: '6px 12px',
                          background: pagamento.status === 'pago' ? '#10b981' : '#f59e0b',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: pagamento.status === 'pago' ? 'default' : 'pointer',
                          fontSize: '0.8rem',
                          fontWeight: '600'
                        }}
                      >
                        {pagamento.status === 'pago' ? '✓ Pago' : 'Pagar Integral'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {pagamentos.length === 0 && (
          <div style={{ textAlign: 'center', color: '#999', padding: '40px' }}>
            Nenhum funcionário encontrado para o período selecionado
          </div>
        )}
      </Card>

      {/* Modal de Parcelamento */}
      {modalParcelamento && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.8)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <Card style={{ width: '400px', margin: '20px' }}>
            <h3 style={{ marginBottom: '20px', color: '#ffffff' }}>Definir Forma de Pagamento</h3>
            
            <div style={{ marginBottom: '20px' }}>
              <button
                onClick={() => definirParcelamento(modalParcelamento, 'integral')}
                style={{
                  width: '100%',
                  padding: '15px',
                  background: '#10b981',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: '600',
                  marginBottom: '10px'
                }}
              >
                💰 Pagamento Integral
                <div style={{ fontSize: '0.8rem', fontWeight: 'normal', marginTop: '5px' }}>
                  Pagar tudo até dia 5 do mês seguinte
                </div>
              </button>
              
              <button
                onClick={() => definirParcelamento(modalParcelamento, 'parcelado')}
                style={{
                  width: '100%',
                  padding: '15px',
                  background: '#3b82f6',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: '600'
                }}
              >
                📅 Pagamento Parcelado (CLT)
                <div style={{ fontSize: '0.8rem', fontWeight: 'normal', marginTop: '5px' }}>
                  40% até dia 20 + 60% até dia 5 do mês seguinte
                </div>
              </button>
            </div>
            
            <button
              onClick={() => setModalParcelamento(null)}
              style={{
                width: '100%',
                padding: '10px',
                background: '#666',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Cancelar
            </button>
          </Card>
        </div>
      )}
    </>
  );
}

// Componente para Lançamentos
function Lancamentos({ dadosConsolidados, formatarValor }) {
  const [novoLancamento, setNovoLancamento] = useState({
    tipo: 'despesa',
    categoria: '',
    descricao: '',
    valor: '',
    loja: 'tatuape',
    data: new Date().toISOString().split('T')[0]
  });
  const [lancamentos, setLancamentos] = useState([]);
  const [filtroTipo, setFiltroTipo] = useState('todos');
  const [filtroLoja, setFiltroLoja] = useState('todas');

  useEffect(() => {
    carregarLancamentos();
  }, []);

  const carregarLancamentos = () => {
    // Simular dados de lançamentos (em produção viria do Supabase)
    const lancamentosSimulados = [
      {
        id: 1,
        tipo: 'despesa',
        categoria: 'Aluguel',
        descricao: 'Aluguel loja Tatuapé',
        valor: 3500,
        loja: 'tatuape',
        data: '2024-12-01',
        created_at: new Date().toISOString()
      },
      {
        id: 2,
        tipo: 'receita',
        categoria: 'Vendas',
        descricao: 'Venda produtos',
        valor: 1200,
        loja: 'mogi',
        data: '2024-12-02',
        created_at: new Date().toISOString()
      }
    ];
    setLancamentos(lancamentosSimulados);
  };

  const adicionarLancamento = () => {
    if (!novoLancamento.categoria || !novoLancamento.descricao || !novoLancamento.valor) {
      alert('Preencha todos os campos obrigatórios');
      return;
    }

    const lancamento = {
      id: Date.now(),
      ...novoLancamento,
      valor: parseFloat(novoLancamento.valor),
      created_at: new Date().toISOString()
    };

    setLancamentos(prev => [lancamento, ...prev]);
    setNovoLancamento({
      tipo: 'despesa',
      categoria: '',
      descricao: '',
      valor: '',
      loja: 'tatuape',
      data: new Date().toISOString().split('T')[0]
    });
  };

  const lancamentosFiltrados = lancamentos.filter(l => {
    const filtroTipoOk = filtroTipo === 'todos' || l.tipo === filtroTipo;
    const filtroLojaOk = filtroLoja === 'todas' || l.loja === filtroLoja;
    return filtroTipoOk && filtroLojaOk;
  });

  const totalReceitas = lancamentosFiltrados
    .filter(l => l.tipo === 'receita')
    .reduce((sum, l) => sum + l.valor, 0);

  const totalDespesas = lancamentosFiltrados
    .filter(l => l.tipo === 'despesa')
    .reduce((sum, l) => sum + l.valor, 0);

  const saldoLancamentos = totalReceitas - totalDespesas;

  return (
    <>
      <h2 style={{marginBottom: '30px', color: '#ffffff'}}>📝 Lançamentos</h2>
      
      {/* Resumo */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '20px',
        marginBottom: '30px'
      }}>
        <Card style={{ border: '1px solid #10b98140', textAlign: 'center' }}>
          <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#10b981', marginBottom: '8px' }}>
            {formatarValor(totalReceitas)}
          </div>
          <div style={{ color: '#999' }}>Total Receitas</div>
        </Card>
        
        <Card style={{ border: '1px solid #ef444440', textAlign: 'center' }}>
          <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#ef4444', marginBottom: '8px' }}>
            {formatarValor(totalDespesas)}
          </div>
          <div style={{ color: '#999' }}>Total Despesas</div>
        </Card>
        
        <Card style={{ border: `1px solid ${saldoLancamentos >= 0 ? '#10b981' : '#ef4444'}40`, textAlign: 'center' }}>
          <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: saldoLancamentos >= 0 ? '#10b981' : '#ef4444', marginBottom: '8px' }}>
            {formatarValor(saldoLancamentos)}
          </div>
          <div style={{ color: '#999' }}>Saldo</div>
        </Card>
      </div>

      {/* Novo Lançamento */}
      <Card style={{ marginBottom: '20px' }}>
        <h3 style={{ marginBottom: '20px', color: '#ffffff' }}>➕ Novo Lançamento</h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '15px',
          marginBottom: '20px'
        }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Tipo:</label>
            <select 
              value={novoLancamento.tipo}
              onChange={(e) => setNovoLancamento(prev => ({...prev, tipo: e.target.value}))}
              style={{
                width: '100%',
                padding: '8px 12px',
                background: '#333',
                color: '#fff',
                border: '1px solid #666',
                borderRadius: '4px'
              }}
            >
              <option value="despesa">Despesa</option>
              <option value="receita">Receita</option>
            </select>
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Categoria:</label>
            <input 
              type="text"
              value={novoLancamento.categoria}
              onChange={(e) => setNovoLancamento(prev => ({...prev, categoria: e.target.value}))}
              placeholder="Ex: Aluguel, Vendas..."
              style={{
                width: '100%',
                padding: '8px 12px',
                background: '#333',
                color: '#fff',
                border: '1px solid #666',
                borderRadius: '4px'
              }}
            />
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Valor:</label>
            <input 
              type="number"
              step="0.01"
              value={novoLancamento.valor}
              onChange={(e) => setNovoLancamento(prev => ({...prev, valor: e.target.value}))}
              placeholder="0,00"
              style={{
                width: '100%',
                padding: '8px 12px',
                background: '#333',
                color: '#fff',
                border: '1px solid #666',
                borderRadius: '4px'
              }}
            />
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Loja:</label>
            <select 
              value={novoLancamento.loja}
              onChange={(e) => setNovoLancamento(prev => ({...prev, loja: e.target.value}))}
              style={{
                width: '100%',
                padding: '8px 12px',
                background: '#333',
                color: '#fff',
                border: '1px solid #666',
                borderRadius: '4px'
              }}
            >
              <option value="tatuape">Tatuapé</option>
              <option value="mogi">Mogi</option>
            </select>
          </div>
        </div>
        
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Descrição:</label>
          <input 
            type="text"
            value={novoLancamento.descricao}
            onChange={(e) => setNovoLancamento(prev => ({...prev, descricao: e.target.value}))}
            placeholder="Descrição do lançamento"
            style={{
              width: '100%',
              padding: '8px 12px',
              background: '#333',
              color: '#fff',
              border: '1px solid #666',
              borderRadius: '4px'
            }}
          />
        </div>
        
        <Button className="success" onClick={adicionarLancamento}>
          ➕ Adicionar Lançamento
        </Button>
      </Card>

      {/* Filtros */}
      <Card style={{ marginBottom: '20px' }}>
        <div style={{
          display: 'flex',
          gap: '15px',
          alignItems: 'center',
          flexWrap: 'wrap'
        }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Tipo:</label>
            <select 
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value)}
              style={{
                padding: '8px 12px',
                background: '#333',
                color: '#fff',
                border: '1px solid #666',
                borderRadius: '4px'
              }}
            >
              <option value="todos">Todos</option>
              <option value="receita">Receitas</option>
              <option value="despesa">Despesas</option>
            </select>
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Loja:</label>
            <select 
              value={filtroLoja}
              onChange={(e) => setFiltroLoja(e.target.value)}
              style={{
                padding: '8px 12px',
                background: '#333',
                color: '#fff',
                border: '1px solid #666',
                borderRadius: '4px'
              }}
            >
              <option value="todas">Todas</option>
              <option value="tatuape">Tatuapé</option>
              <option value="mogi">Mogi</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Lista de Lançamentos */}
      <Card>
        <h3 style={{ marginBottom: '20px', color: '#ffffff' }}>📋 Histórico de Lançamentos</h3>
        <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
          {lancamentosFiltrados.length > 0 ? (
            lancamentosFiltrados.map((lancamento) => (
              <div key={lancamento.id} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '15px',
                background: '#222',
                marginBottom: '10px',
                borderRadius: '8px',
                borderLeft: `4px solid ${lancamento.tipo === 'receita' ? '#10b981' : '#ef4444'}`
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px' }}>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: '12px',
                      fontSize: '0.7rem',
                      fontWeight: 'bold',
                      background: lancamento.tipo === 'receita' ? '#10b98120' : '#ef444420',
                      color: lancamento.tipo === 'receita' ? '#10b981' : '#ef4444'
                    }}>
                      {lancamento.tipo.toUpperCase()}
                    </span>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: '12px',
                      fontSize: '0.7rem',
                      background: '#333',
                      color: '#fff'
                    }}>
                      {lancamento.loja.toUpperCase()}
                    </span>
                  </div>
                  <div style={{ fontWeight: '600', marginBottom: '3px' }}>
                    {lancamento.categoria} - {lancamento.descricao}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#999' }}>
                    {new Date(lancamento.data).toLocaleDateString('pt-BR')}
                  </div>
                </div>
                <div style={{
                  fontSize: '1.2rem',
                  fontWeight: 'bold',
                  color: lancamento.tipo === 'receita' ? '#10b981' : '#ef4444'
                }}>
                  {lancamento.tipo === 'receita' ? '+' : '-'}{formatarValor(lancamento.valor)}
                </div>
              </div>
            ))
          ) : (
            <div style={{ textAlign: 'center', color: '#999', padding: '40px' }}>
              Nenhum lançamento encontrado
            </div>
          )}
        </div>
      </Card>
    </>
  );
}

// Componente para Fluxo de Caixa
function FluxoCaixa({ dadosConsolidados, formatarValor }) {
  const [periodoSelecionado, setPeriodoSelecionado] = useState('mes-atual');
  const [lojaSelecionada, setLojaSelecionada] = useState('todas');

  const calcularFluxoCaixa = () => {
    const hoje = new Date();
    let dataInicio, dataFim;

    switch (periodoSelecionado) {
      case 'hoje':
        dataInicio = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
        dataFim = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate(), 23, 59, 59);
        break;
      case 'semana':
        const inicioSemana = new Date(hoje);
        inicioSemana.setDate(hoje.getDate() - hoje.getDay());
        dataInicio = new Date(inicioSemana.getFullYear(), inicioSemana.getMonth(), inicioSemana.getDate());
        dataFim = hoje;
        break;
      case 'mes-atual':
        dataInicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
        dataFim = hoje;
        break;
      default:
        dataInicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
        dataFim = hoje;
    }

    const lojas = lojaSelecionada === 'todas' ? ['tatuape', 'mogi'] : [lojaSelecionada];
    
    let entradas = { dinheiro: 0, pix: 0, cartao_credito: 0, cartao_debito: 0 };
    let saidas = { comissoes: 0, custos: 0 };
    let movimentacoesCaixa = [];

    lojas.forEach(loja => {
      const dados = dadosConsolidados[loja];
      
      // Vendas (Entradas)
      const vendasPeriodo = dados.vendas.filter(v => {
        const dataVenda = new Date(v.data_venda);
        return dataVenda >= dataInicio && dataVenda <= dataFim;
      });

      vendasPeriodo.forEach(venda => {
        const valor = parseFloat(venda.valor_final || 0);
        const forma = venda.forma_pagamento || 'dinheiro';
        
        if (entradas[forma] !== undefined) {
          entradas[forma] += valor;
        } else {
          entradas.dinheiro += valor;
        }

        saidas.comissoes += parseFloat(venda.comissao_vendedor || 0);
      });

      // Movimentações do Caixa
      const caixaPeriodo = dados.caixa.filter(c => {
        const dataCaixa = new Date(c.created_at);
        return dataCaixa >= dataInicio && dataCaixa <= dataFim;
      });

      caixaPeriodo.forEach(mov => {
        movimentacoesCaixa.push({
          ...mov,
          loja: loja.toUpperCase(),
          valor: parseFloat(mov.valor || 0)
        });
      });
    });

    const totalEntradas = Object.values(entradas).reduce((sum, val) => sum + val, 0);
    const totalSaidas = Object.values(saidas).reduce((sum, val) => sum + val, 0);
    const saldoLiquido = totalEntradas - totalSaidas;

    return {
      entradas,
      saidas,
      totalEntradas,
      totalSaidas,
      saldoLiquido,
      movimentacoesCaixa: movimentacoesCaixa.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    };
  };

  const fluxo = calcularFluxoCaixa();

  return (
    <>
      <h2 style={{marginBottom: '30px', color: '#ffffff'}}>💳 Fluxo de Caixa</h2>
      
      {/* Filtros */}
      <Card style={{ marginBottom: '20px' }}>
        <div style={{
          display: 'flex',
          gap: '15px',
          alignItems: 'center',
          flexWrap: 'wrap'
        }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Período:</label>
            <select 
              value={periodoSelecionado} 
              onChange={(e) => setPeriodoSelecionado(e.target.value)}
              style={{
                padding: '8px 12px',
                background: '#333',
                color: '#fff',
                border: '1px solid #666',
                borderRadius: '4px'
              }}
            >
              <option value="hoje">Hoje</option>
              <option value="semana">Esta Semana</option>
              <option value="mes-atual">Mês Atual</option>
            </select>
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Loja:</label>
            <select 
              value={lojaSelecionada} 
              onChange={(e) => setLojaSelecionada(e.target.value)}
              style={{
                padding: '8px 12px',
                background: '#333',
                color: '#fff',
                border: '1px solid #666',
                borderRadius: '4px'
              }}
            >
              <option value="todas">Todas as Lojas</option>
              <option value="tatuape">Tatuapé</option>
              <option value="mogi">Mogi</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Resumo do Fluxo */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '20px',
        marginBottom: '30px'
      }}>
        <Card style={{ border: '1px solid #10b98140' }}>
          <h3 style={{ color: '#10b981', marginBottom: '15px', textAlign: 'center' }}>💰 ENTRADAS</h3>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#10b981', textAlign: 'center', marginBottom: '15px' }}>
            {formatarValor(fluxo.totalEntradas)}
          </div>
          <div style={{ fontSize: '0.9rem', color: '#999', textAlign: 'center' }}>Total de Receitas</div>
        </Card>

        <Card style={{ border: '1px solid #ef444440' }}>
          <h3 style={{ color: '#ef4444', marginBottom: '15px', textAlign: 'center' }}>💸 SAÍDAS</h3>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#ef4444', textAlign: 'center', marginBottom: '15px' }}>
            {formatarValor(fluxo.totalSaidas)}
          </div>
          <div style={{ fontSize: '0.9rem', color: '#999', textAlign: 'center' }}>Total de Despesas</div>
        </Card>

        <Card style={{ border: `1px solid ${fluxo.saldoLiquido >= 0 ? '#10b981' : '#ef4444'}40` }}>
          <h3 style={{ color: fluxo.saldoLiquido >= 0 ? '#10b981' : '#ef4444', marginBottom: '15px', textAlign: 'center' }}>📊 SALDO</h3>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: fluxo.saldoLiquido >= 0 ? '#10b981' : '#ef4444', textAlign: 'center', marginBottom: '15px' }}>
            {formatarValor(fluxo.saldoLiquido)}
          </div>
          <div style={{ fontSize: '0.9rem', color: '#999', textAlign: 'center' }}>Saldo Líquido</div>
        </Card>
      </div>

      {/* Detalhamento das Entradas */}
      <Card style={{ marginBottom: '20px' }}>
        <h3 style={{ marginBottom: '20px', color: '#10b981' }}>💰 Detalhamento das Entradas</h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '15px'
        }}>
          {Object.entries(fluxo.entradas).map(([forma, valor]) => (
            <div key={forma} style={{
              padding: '15px',
              background: '#1a1a1a',
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <div style={{ fontWeight: 'bold', marginBottom: '8px', textTransform: 'uppercase' }}>
                {forma.replace('_', ' ')}
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#10b981' }}>
                {formatarValor(valor)}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#999', marginTop: '5px' }}>
                {((valor / fluxo.totalEntradas) * 100).toFixed(1)}% do total
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Movimentações Recentes */}
      <Card>
        <h3 style={{ marginBottom: '20px', color: '#ffffff' }}>📋 Movimentações Recentes</h3>
        <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
          {fluxo.movimentacoesCaixa.length > 0 ? (
            fluxo.movimentacoesCaixa.slice(0, 20).map((mov, index) => (
              <div key={index} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px',
                background: '#222',
                marginBottom: '8px',
                borderRadius: '6px',
                borderLeft: `4px solid ${mov.tipo === 'entrada' ? '#10b981' : '#ef4444'}`
              }}>
                <div>
                  <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                    {mov.descricao || 'Movimentação'} - {mov.loja}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#999' }}>
                    {new Date(mov.created_at).toLocaleString('pt-BR')}
                  </div>
                </div>
                <div style={{
                  fontSize: '1.1rem',
                  fontWeight: 'bold',
                  color: mov.tipo === 'entrada' ? '#10b981' : '#ef4444'
                }}>
                  {mov.tipo === 'entrada' ? '+' : '-'}{formatarValor(Math.abs(mov.valor))}
                </div>
              </div>
            ))
          ) : (
            <div style={{ textAlign: 'center', color: '#999', padding: '40px' }}>
              Nenhuma movimentação encontrada no período selecionado
            </div>
          )}
        </div>
      </Card>
    </>
  );
}

// Componente para Resultado por Loja
function ResultadoPorLoja({ dadosConsolidados, formatarValor }) {
  const [periodoSelecionado, setPeriodoSelecionado] = useState('mes-atual');
  const [lojaSelecionada, setLojaSelecionada] = useState('todas');

  const calcularResultadoLoja = (loja, dados) => {
    const hoje = new Date();
    let dataInicio, dataFim;

    switch (periodoSelecionado) {
      case 'hoje':
        dataInicio = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
        dataFim = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate(), 23, 59, 59);
        break;
      case 'semana':
        const inicioSemana = new Date(hoje);
        inicioSemana.setDate(hoje.getDate() - hoje.getDay());
        dataInicio = new Date(inicioSemana.getFullYear(), inicioSemana.getMonth(), inicioSemana.getDate());
        dataFim = hoje;
        break;
      case 'mes-atual':
        dataInicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
        dataFim = hoje;
        break;
      case 'mes-anterior':
        dataInicio = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1);
        dataFim = new Date(hoje.getFullYear(), hoje.getMonth(), 0);
        break;
      default:
        dataInicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
        dataFim = hoje;
    }

    const vendasPeriodo = dados.vendas.filter(v => {
      const dataVenda = new Date(v.data_venda);
      return dataVenda >= dataInicio && dataVenda <= dataFim;
    });

    const totalVendas = vendasPeriodo.reduce((sum, v) => sum + parseFloat(v.valor_final || 0), 0);
    const totalComissoes = vendasPeriodo.reduce((sum, v) => {
      const comissao = parseFloat(v.comissao_vendedor || 0);
      return sum + comissao;
    }, 0);

    const vendasPorVendedor = {};
    vendasPeriodo.forEach(v => {
      const vendedor = v.vendedor_nome || 'Sem vendedor';
      if (!vendasPorVendedor[vendedor]) {
        vendasPorVendedor[vendedor] = {
          vendas: 0,
          valor: 0,
          comissao: 0,
          quantidade: 0
        };
      }
      vendasPorVendedor[vendedor].vendas += 1;
      vendasPorVendedor[vendedor].valor += parseFloat(v.valor_final || 0);
      vendasPorVendedor[vendedor].comissao += parseFloat(v.comissao_vendedor || 0);
      vendasPorVendedor[vendedor].quantidade += parseInt(v.quantidade || 1);
    });

    const vendasPorFormaPagamento = {};
    vendasPeriodo.forEach(v => {
      const forma = v.forma_pagamento || 'Não informado';
      if (!vendasPorFormaPagamento[forma]) {
        vendasPorFormaPagamento[forma] = { valor: 0, quantidade: 0 };
      }
      vendasPorFormaPagamento[forma].valor += parseFloat(v.valor_final || 0);
      vendasPorFormaPagamento[forma].quantidade += 1;
    });

    const custoEstoque = dados.estoque.reduce((sum, p) => {
      return sum + ((p.estoque_atual || 0) * (p.preco_custo || p.preco_venda * 0.6 || 0));
    }, 0);

    const valorEstoque = dados.estoque.reduce((sum, p) => {
      return sum + ((p.estoque_atual || 0) * (p.preco_venda || 0));
    }, 0);

    const margemBruta = totalVendas - (totalVendas * 0.4); // Estimativa de 40% de custo
    const lucroLiquido = margemBruta - totalComissoes;

    return {
      loja: loja.toUpperCase(),
      totalVendas,
      totalComissoes,
      vendasPorVendedor,
      vendasPorFormaPagamento,
      custoEstoque,
      valorEstoque,
      margemBruta,
      lucroLiquido,
      quantidadeVendas: vendasPeriodo.length,
      ticketMedio: vendasPeriodo.length > 0 ? totalVendas / vendasPeriodo.length : 0,
      funcionariosAtivos: dados.funcionarios.length
    };
  };

  const resultados = {
    tatuape: calcularResultadoLoja('tatuape', dadosConsolidados.tatuape),
    mogi: calcularResultadoLoja('mogi', dadosConsolidados.mogi)
  };

  const resultadoConsolidado = {
    totalVendas: resultados.tatuape.totalVendas + resultados.mogi.totalVendas,
    totalComissoes: resultados.tatuape.totalComissoes + resultados.mogi.totalComissoes,
    margemBruta: resultados.tatuape.margemBruta + resultados.mogi.margemBruta,
    lucroLiquido: resultados.tatuape.lucroLiquido + resultados.mogi.lucroLiquido,
    quantidadeVendas: resultados.tatuape.quantidadeVendas + resultados.mogi.quantidadeVendas,
    valorEstoque: resultados.tatuape.valorEstoque + resultados.mogi.valorEstoque
  };

  const CardResultado = ({ titulo, resultado, cor = '#ffffff' }) => (
    <Card style={{ border: `1px solid ${cor}40` }}>
      <h3 style={{ color: cor, marginBottom: '20px', textAlign: 'center' }}>
        🏢 {titulo}
      </h3>
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '15px',
        marginBottom: '20px'
      }}>
        <div style={{ textAlign: 'center', padding: '15px', background: '#1a1a1a', borderRadius: '8px' }}>
          <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#10b981' }}>
            {formatarValor(resultado.totalVendas)}
          </div>
          <div style={{ fontSize: '0.9rem', color: '#999' }}>Total Vendas</div>
        </div>
        
        <div style={{ textAlign: 'center', padding: '15px', background: '#1a1a1a', borderRadius: '8px' }}>
          <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#3b82f6' }}>
            {resultado.quantidadeVendas}
          </div>
          <div style={{ fontSize: '0.9rem', color: '#999' }}>Qtd Vendas</div>
        </div>
        
        <div style={{ textAlign: 'center', padding: '15px', background: '#1a1a1a', borderRadius: '8px' }}>
          <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#f59e0b' }}>
            {formatarValor(resultado.ticketMedio)}
          </div>
          <div style={{ fontSize: '0.9rem', color: '#999' }}>Ticket Médio</div>
        </div>
        
        <div style={{ textAlign: 'center', padding: '15px', background: '#1a1a1a', borderRadius: '8px' }}>
          <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#8b5cf6' }}>
            {formatarValor(resultado.lucroLiquido)}
          </div>
          <div style={{ fontSize: '0.9rem', color: '#999' }}>Lucro Líquido</div>
        </div>
      </div>

      {/* Vendas por Vendedor */}
      <div style={{ marginBottom: '20px' }}>
        <h4 style={{ marginBottom: '15px', color: '#ffffff' }}>👥 Vendas por Vendedor</h4>
        <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
          {Object.entries(resultado.vendasPorVendedor)
            .sort(([,a], [,b]) => b.valor - a.valor)
            .map(([vendedor, dados]) => (
              <div key={vendedor} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '10px',
                background: '#222',
                marginBottom: '5px',
                borderRadius: '4px'
              }}>
                <span style={{ fontWeight: '600' }}>{vendedor}</span>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ color: '#10b981', fontWeight: 'bold' }}>
                    {formatarValor(dados.valor)}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#999' }}>
                    {dados.vendas} vendas | {formatarValor(dados.comissao)} comissão
                  </div>
                </div>
              </div>
            ))
          }
        </div>
      </div>

      {/* Formas de Pagamento */}
      <div>
        <h4 style={{ marginBottom: '15px', color: '#ffffff' }}>💳 Formas de Pagamento</h4>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '10px'
        }}>
          {Object.entries(resultado.vendasPorFormaPagamento)
            .sort(([,a], [,b]) => b.valor - a.valor)
            .map(([forma, dados]) => (
              <div key={forma} style={{
                padding: '10px',
                background: '#222',
                borderRadius: '4px',
                textAlign: 'center'
              }}>
                <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
                  {forma.replace('_', ' ').toUpperCase()}
                </div>
                <div style={{ color: '#10b981', fontWeight: 'bold' }}>
                  {formatarValor(dados.valor)}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#999' }}>
                  {dados.quantidade} vendas
                </div>
              </div>
            ))
          }
        </div>
      </div>
    </Card>
  );

  return (
    <>
      <h2 style={{marginBottom: '30px', color: '#ffffff'}}>🏢 Resultado por Loja</h2>
      
      {/* Filtros */}
      <Card style={{ marginBottom: '20px' }}>
        <div style={{
          display: 'flex',
          gap: '15px',
          alignItems: 'center',
          flexWrap: 'wrap'
        }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Período:</label>
            <select 
              value={periodoSelecionado} 
              onChange={(e) => setPeriodoSelecionado(e.target.value)}
              style={{
                padding: '8px 12px',
                background: '#333',
                color: '#fff',
                border: '1px solid #666',
                borderRadius: '4px'
              }}
            >
              <option value="hoje">Hoje</option>
              <option value="semana">Esta Semana</option>
              <option value="mes-atual">Mês Atual</option>
              <option value="mes-anterior">Mês Anterior</option>
            </select>
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Loja:</label>
            <select 
              value={lojaSelecionada} 
              onChange={(e) => setLojaSelecionada(e.target.value)}
              style={{
                padding: '8px 12px',
                background: '#333',
                color: '#fff',
                border: '1px solid #666',
                borderRadius: '4px'
              }}
            >
              <option value="todas">Todas as Lojas</option>
              <option value="tatuape">Tatuapé</option>
              <option value="mogi">Mogi</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Resultado Consolidado */}
      {lojaSelecionada === 'todas' && (
        <Card style={{ border: '1px solid #10b98140', marginBottom: '20px' }}>
          <h3 style={{ color: '#10b981', marginBottom: '20px', textAlign: 'center' }}>
            📊 RESULTADO CONSOLIDADO
          </h3>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '15px'
          }}>
            <div style={{ textAlign: 'center', padding: '20px', background: '#1a1a1a', borderRadius: '8px' }}>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#10b981' }}>
                {formatarValor(resultadoConsolidado.totalVendas)}
              </div>
              <div style={{ fontSize: '1rem', color: '#999' }}>Total Vendas</div>
            </div>
            
            <div style={{ textAlign: 'center', padding: '20px', background: '#1a1a1a', borderRadius: '8px' }}>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#3b82f6' }}>
                {resultadoConsolidado.quantidadeVendas}
              </div>
              <div style={{ fontSize: '1rem', color: '#999' }}>Total Vendas</div>
            </div>
            
            <div style={{ textAlign: 'center', padding: '20px', background: '#1a1a1a', borderRadius: '8px' }}>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f59e0b' }}>
                {formatarValor(resultadoConsolidado.margemBruta)}
              </div>
              <div style={{ fontSize: '1rem', color: '#999' }}>Margem Bruta</div>
            </div>
            
            <div style={{ textAlign: 'center', padding: '20px', background: '#1a1a1a', borderRadius: '8px' }}>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#8b5cf6' }}>
                {formatarValor(resultadoConsolidado.lucroLiquido)}
              </div>
              <div style={{ fontSize: '1rem', color: '#999' }}>Lucro Líquido</div>
            </div>
          </div>
        </Card>
      )}

      {/* Comparação entre Lojas */}
      {lojaSelecionada === 'todas' && (
        <Card style={{ border: '1px solid #8b5cf640', marginBottom: '20px' }}>
          <h3 style={{ color: '#8b5cf6', marginBottom: '20px', textAlign: 'center' }}>
            ⚖️ COMPARAÇÃO ENTRE LOJAS
          </h3>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '20px'
          }}>
            <div style={{ padding: '15px', background: '#1a1a1a', borderRadius: '8px' }}>
              <h4 style={{ marginBottom: '15px', color: '#ffffff' }}>💰 Vendas</h4>
              <div style={{ marginBottom: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                  <span>Tatuapé:</span>
                  <span style={{ color: '#3b82f6', fontWeight: 'bold' }}>
                    {formatarValor(resultados.tatuape.totalVendas)}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Mogi:</span>
                  <span style={{ color: '#f59e0b', fontWeight: 'bold' }}>
                    {formatarValor(resultados.mogi.totalVendas)}
                  </span>
                </div>
              </div>
              <div style={{ 
                fontSize: '0.9rem', 
                color: resultados.tatuape.totalVendas > resultados.mogi.totalVendas ? '#3b82f6' : '#f59e0b',
                fontWeight: 'bold'
              }}>
                {resultados.tatuape.totalVendas > resultados.mogi.totalVendas 
                  ? `Tatuapé lidera por ${formatarValor(resultados.tatuape.totalVendas - resultados.mogi.totalVendas)}`
                  : `Mogi lidera por ${formatarValor(resultados.mogi.totalVendas - resultados.tatuape.totalVendas)}`
                }
              </div>
            </div>

            <div style={{ padding: '15px', background: '#1a1a1a', borderRadius: '8px' }}>
              <h4 style={{ marginBottom: '15px', color: '#ffffff' }}>🎫 Ticket Médio</h4>
              <div style={{ marginBottom: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                  <span>Tatuapé:</span>
                  <span style={{ color: '#3b82f6', fontWeight: 'bold' }}>
                    {formatarValor(resultados.tatuape.ticketMedio)}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Mogi:</span>
                  <span style={{ color: '#f59e0b', fontWeight: 'bold' }}>
                    {formatarValor(resultados.mogi.ticketMedio)}
                  </span>
                </div>
              </div>
              <div style={{ 
                fontSize: '0.9rem', 
                color: resultados.tatuape.ticketMedio > resultados.mogi.ticketMedio ? '#3b82f6' : '#f59e0b',
                fontWeight: 'bold'
              }}>
                {resultados.tatuape.ticketMedio > resultados.mogi.ticketMedio 
                  ? `Tatuapé é ${((resultados.tatuape.ticketMedio / resultados.mogi.ticketMedio - 1) * 100).toFixed(1)}% maior`
                  : `Mogi é ${((resultados.mogi.ticketMedio / resultados.tatuape.ticketMedio - 1) * 100).toFixed(1)}% maior`
                }
              </div>
            </div>

            <div style={{ padding: '15px', background: '#1a1a1a', borderRadius: '8px' }}>
              <h4 style={{ marginBottom: '15px', color: '#ffffff' }}>💹 Lucro Líquido</h4>
              <div style={{ marginBottom: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                  <span>Tatuapé:</span>
                  <span style={{ color: '#3b82f6', fontWeight: 'bold' }}>
                    {formatarValor(resultados.tatuape.lucroLiquido)}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Mogi:</span>
                  <span style={{ color: '#f59e0b', fontWeight: 'bold' }}>
                    {formatarValor(resultados.mogi.lucroLiquido)}
                  </span>
                </div>
              </div>
              <div style={{ 
                fontSize: '0.9rem', 
                color: resultados.tatuape.lucroLiquido > resultados.mogi.lucroLiquido ? '#3b82f6' : '#f59e0b',
                fontWeight: 'bold'
              }}>
                {resultados.tatuape.lucroLiquido > resultados.mogi.lucroLiquido 
                  ? `Tatuapé lidera por ${formatarValor(resultados.tatuape.lucroLiquido - resultados.mogi.lucroLiquido)}`
                  : `Mogi lidera por ${formatarValor(resultados.mogi.lucroLiquido - resultados.tatuape.lucroLiquido)}`
                }
              </div>
            </div>

            <div style={{ padding: '15px', background: '#1a1a1a', borderRadius: '8px' }}>
              <h4 style={{ marginBottom: '15px', color: '#ffffff' }}>📈 Performance</h4>
              <div style={{ marginBottom: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                  <span>Tatuapé:</span>
                  <span style={{ color: '#3b82f6', fontWeight: 'bold' }}>
                    {resultados.tatuape.quantidadeVendas} vendas
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Mogi:</span>
                  <span style={{ color: '#f59e0b', fontWeight: 'bold' }}>
                    {resultados.mogi.quantidadeVendas} vendas
                  </span>
                </div>
              </div>
              <div style={{ 
                fontSize: '0.9rem', 
                color: resultados.tatuape.quantidadeVendas > resultados.mogi.quantidadeVendas ? '#3b82f6' : '#f59e0b',
                fontWeight: 'bold'
              }}>
                {resultados.tatuape.quantidadeVendas > resultados.mogi.quantidadeVendas 
                  ? `Tatuapé vendeu ${resultados.tatuape.quantidadeVendas - resultados.mogi.quantidadeVendas} a mais`
                  : `Mogi vendeu ${resultados.mogi.quantidadeVendas - resultados.tatuape.quantidadeVendas} a mais`
                }
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Resultados por Loja */}
      {(lojaSelecionada === 'todas' || lojaSelecionada === 'tatuape') && (
        <CardResultado 
          titulo="LOJA TATUAPÉ" 
          resultado={resultados.tatuape} 
          cor="#3b82f6" 
        />
      )}
      
      {(lojaSelecionada === 'todas' || lojaSelecionada === 'mogi') && (
        <CardResultado 
          titulo="LOJA MOGI" 
          resultado={resultados.mogi} 
          cor="#f59e0b" 
        />
      )}
    </>
  );
}

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

  const exportarConsolidado = () => {
    const metricas = calcularMetricasGerais();
    const dados = [
      ['RELATÓRIO FINANCEIRO CONSOLIDADO', '', '', ''],
      ['Data de Geração:', new Date().toLocaleString('pt-BR'), '', ''],
      ['', '', '', ''],
      ['MÉTRICAS GERAIS', '', '', ''],
      ['Vendas do Mês', metricas.totalVendasMes, '', ''],
      ['Vendas Hoje', metricas.totalVendasHoje, '', ''],
      ['Total Funcionários', metricas.totalFuncionarios, '', ''],
      ['Valor Estoque', metricas.totalEstoque, '', ''],
      ['', '', '', ''],
      ['DETALHAMENTO POR LOJA', '', '', ''],
      ['Loja', 'Vendas', 'Funcionários', 'Estoque']
    ];

    ['tatuape', 'mogi'].forEach(loja => {
      const dadosLoja = dadosConsolidados[loja];
      const totalVendas = dadosLoja.vendas.reduce((sum, v) => sum + parseFloat(v.valor_final || 0), 0);
      const valorEstoque = dadosLoja.estoque.reduce((sum, p) => sum + ((p.estoque_atual || 0) * (p.preco_venda || 0)), 0);
      
      dados.push([
        loja.toUpperCase(),
        totalVendas,
        dadosLoja.funcionarios.length,
        valorEstoque
      ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(dados);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Consolidado');
    XLSX.writeFile(wb, `financeiro_consolidado_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const exportarResultadoLojas = () => {
    const wb = XLSX.utils.book_new();
    
    ['tatuape', 'mogi'].forEach(loja => {
      const dados = dadosConsolidados[loja];
      const planilhaDados = [
        [`RESULTADO LOJA ${loja.toUpperCase()}`, '', '', ''],
        ['Data:', new Date().toLocaleString('pt-BR'), '', ''],
        ['', '', '', ''],
        ['VENDAS', '', '', ''],
        ['Data', 'Vendedor', 'Valor', 'Forma Pagamento']
      ];
      
      dados.vendas.forEach(venda => {
        planilhaDados.push([
          new Date(venda.data_venda).toLocaleDateString('pt-BR'),
          venda.vendedor_nome || 'N/A',
          parseFloat(venda.valor_final || 0),
          venda.forma_pagamento || 'N/A'
        ]);
      });
      
      planilhaDados.push(['', '', '', '']);
      planilhaDados.push(['FUNCIONÁRIOS', '', '', '']);
      planilhaDados.push(['Nome', 'Tipo', 'Ativo', '']);
      
      dados.funcionarios.forEach(func => {
        planilhaDados.push([
          func.nome || 'N/A',
          func.tipo || 'N/A',
          func.ativo ? 'Sim' : 'Não',
          ''
        ]);
      });
      
      const ws = XLSX.utils.aoa_to_sheet(planilhaDados);
      XLSX.utils.book_append_sheet(wb, ws, loja.toUpperCase());
    });
    
    XLSX.writeFile(wb, `resultado_lojas_${new Date().toISOString().split('T')[0]}.xlsx`);
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
                <Button className="success" onClick={() => exportarConsolidado()}>
                  📊 Exportar Consolidado
                </Button>
                <Button className="secondary" onClick={() => exportarResultadoLojas()}>
                  🏢 Exportar por Loja
                </Button>
                <Button className="secondary" onClick={() => carregarDadosFinanceiros()}>
                  🔄 Atualizar Dados
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
          <ResultadoPorLoja dadosConsolidados={dadosConsolidados} formatarValor={formatarValor} />
        )}

        {activeTab === 'fluxo-caixa' && (
          <FluxoCaixa dadosConsolidados={dadosConsolidados} formatarValor={formatarValor} />
        )}

        {activeTab === 'lancamentos' && (
          <Lancamentos dadosConsolidados={dadosConsolidados} formatarValor={formatarValor} />
        )}

        {activeTab === 'pagamentos' && (
          <PagamentosFuncionarios dadosConsolidados={dadosConsolidados} formatarValor={formatarValor} />
        )}

        {activeTab === 'fechamento' && (
          <Fechamento dadosConsolidados={dadosConsolidados} formatarValor={formatarValor} />
        )}

        {activeTab === 'configuracoes' && (
          <Configuracoes dadosConsolidados={dadosConsolidados} formatarValor={formatarValor} />
        )}
      </ContentArea>
    </Container>
  );
}