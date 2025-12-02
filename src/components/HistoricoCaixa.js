import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { supabase } from '../utils/supabase';
import { formatBrasiliaDateTime, formatBrasiliaTime, formatCurrency } from '../utils/dateUtils';

const Container = styled.div`
  padding: 2rem;
  background: ${props => props.$darkMode ? '#1a1a1a' : '#ffffff'};
  border-radius: 1rem;
  border: 1px solid ${props => props.$darkMode ? '#333' : '#e5e7eb'};
`;

const TableContainer = styled.div`
  background: ${props => props.$darkMode ? '#1a1a1a' : '#ffffff'};
  border-radius: 0.5rem;
  border: 1px solid ${props => props.$darkMode ? '#333' : '#e5e7eb'};
  overflow: hidden;
  margin-bottom: 2rem;
`;

const TableHeader = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1fr 1fr;
  gap: 1rem;
  padding: 1rem;
  background: ${props => props.$darkMode ? '#2a2a2a' : '#f9fafb'};
  font-weight: 600;
  border-bottom: 1px solid ${props => props.$darkMode ? '#333' : '#e5e7eb'};
`;

const TableRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1fr 1fr;
  gap: 1rem;
  padding: 1rem;
  border-bottom: 1px solid ${props => props.$darkMode ? '#333' : '#e5e7eb'};
  cursor: pointer;
  
  &:hover {
    background: ${props => props.$darkMode ? '#2a2a2a' : '#f9fafb'};
  }
  
  &:last-child {
    border-bottom: none;
  }
`;

const DetalhesCard = styled.div`
  background: ${props => props.$darkMode ? '#2a2a2a' : '#f8f9fa'};
  border-radius: 0.75rem;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
`;

export default function HistoricoCaixa({ user, darkMode }) {
  const [fechamentos, setFechamentos] = useState([]);
  const [fechamentoSelecionado, setFechamentoSelecionado] = useState(null);
  const [vendasDetalhes, setVendasDetalhes] = useState([]);
  const [saidasDetalhes, setSaidasDetalhes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarHistorico();
  }, []);

  const carregarHistorico = async () => {
    try {
      const loja = user.loja || 'tatuape';
      const { data } = await supabase
        .from(`fechamentos_caixa_${loja}`)
        .select('*')
        .eq('usuario_id', user.id)
        .order('data_fechamento', { ascending: false })
        .limit(30);
      
      setFechamentos(data || []);
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
    } finally {
      setLoading(false);
    }
  };

  const carregarDetalhes = async (fechamento) => {
    try {
      setFechamentoSelecionado(fechamento);
      
      const dataFechamento = fechamento.data_fechamento;
      
      const loja = user.loja || 'tatuape';
      
      // Buscar vendas do dia
      const { data: vendas } = await supabase
        .from(`vendas_${loja}`)
        .select('*')
        .gte('data_venda', dataFechamento)
        .lt('data_venda', new Date(new Date(dataFechamento).getTime() + 24*60*60*1000).toISOString().split('T')[0])
        .neq('forma_pagamento', 'pendente_caixa')
        .order('data_venda', { ascending: false });
      
      // Buscar saídas do dia
      const { data: saidas } = await supabase
        .from(`saidas_caixa_${loja}`)
        .select('*')
        .eq('data', dataFechamento)
        .order('created_at', { ascending: false });
      
      setVendasDetalhes(vendas || []);
      setSaidasDetalhes(saidas || []);
    } catch (error) {
      console.error('Erro ao carregar detalhes:', error);
    }
  };

  // Função para processar forma de pagamento corretamente
  const processarFormaPagamento = (formaPagamento, valorFinal) => {
    const resultado = {
      dinheiro: 0,
      credito: 0,
      debito: 0,
      pix: 0,
      link_pagamento: 0
    };

    if (!formaPagamento) {
      return resultado;
    }

    const forma = formaPagamento.toLowerCase();

    // Verificar se é pagamento misto (contém |)
    if (forma.includes('|')) {
      const formas = forma.split('|');
      formas.forEach(f => {
        const [tipo, valor] = f.split(':');
        const valorNumerico = parseFloat(valor) || 0;
        
        switch (tipo.trim()) {
          case 'dinheiro':
            resultado.dinheiro += valorNumerico;
            break;
          case 'cartao_credito':
            resultado.credito += valorNumerico;
            break;
          case 'cartao_debito':
            resultado.debito += valorNumerico;
            break;
          case 'pix':
            resultado.pix += valorNumerico;
            break;
          case 'link_pagamento':
            resultado.link_pagamento += valorNumerico;
            break;
        }
      });
    } else if (forma.includes('link_pagamento')) {
      // Link de pagamento com taxa
      if (forma.includes('taxa_')) {
        // O valor final já inclui a taxa, então contabilizamos o valor total
        resultado.link_pagamento = valorFinal;
      } else {
        resultado.link_pagamento = valorFinal;
      }
    } else {
      // Pagamento simples
      switch (forma) {
        case 'dinheiro':
          resultado.dinheiro = valorFinal;
          break;
        case 'cartao_credito':
        case 'credito':
          resultado.credito = valorFinal;
          break;
        case 'cartao_debito':
        case 'debito':
          resultado.debito = valorFinal;
          break;
        case 'pix':
          resultado.pix = valorFinal;
          break;
        default:
          // Se não reconhecer, assumir como dinheiro
          resultado.dinheiro = valorFinal;
          break;
      }
    }

    return resultado;
  };

  const calcularResumo = () => {
    const resumo = {
      dinheiro: 0,
      credito: 0,
      debito: 0,
      pix: 0,
      link_pagamento: 0,
      total: 0,
      qtd: vendasDetalhes.length,
      total_saidas: 0,
      qtd_saidas: saidasDetalhes.length
    };

    vendasDetalhes.forEach(venda => {
      const valor = parseFloat(venda.valor_final || 0);
      const processamento = processarFormaPagamento(venda.forma_pagamento, valor);
      
      resumo.total += valor;
      resumo.dinheiro += processamento.dinheiro;
      resumo.credito += processamento.credito;
      resumo.debito += processamento.debito;
      resumo.pix += processamento.pix;
      resumo.link_pagamento += processamento.link_pagamento;
    });

    // Calcular saídas
    saidasDetalhes.forEach(saida => {
      resumo.total_saidas += parseFloat(saida.valor || 0);
    });

    return resumo;
  };

  if (loading) {
    return (
      <Container $darkMode={darkMode}>
        <div style={{ textAlign: 'center', padding: '2rem', color: darkMode ? '#fff' : '#000' }}>
          Carregando histórico...
        </div>
      </Container>
    );
  }

  return (
    <Container $darkMode={darkMode}>
      <h2 style={{ color: darkMode ? '#fff' : '#000', marginBottom: '2rem' }}>
        📊 Histórico de Fechamentos
      </h2>

      {fechamentos.length > 0 ? (
        <TableContainer $darkMode={darkMode}>
          <TableHeader $darkMode={darkMode}>
            <div>DATA</div>
            <div>VALOR INICIAL</div>
            <div>STATUS</div>
            <div>FECHADO EM</div>
            <div>AÇÃO</div>
          </TableHeader>
          {fechamentos.map(fechamento => (
            <TableRow 
              key={fechamento.id} 
              $darkMode={darkMode}
              onClick={() => carregarDetalhes(fechamento)}
            >
              <div>{formatBrasiliaDateTime(fechamento.data_fechamento).split(' ')[0]}</div>
              <div>{formatCurrency(fechamento.valor_inicial)}</div>
              <div>
                <span style={{
                  padding: '0.25rem 0.5rem',
                  borderRadius: '0.25rem',
                  fontSize: '0.8rem',
                  fontWeight: '600',
                  background: fechamento.status === 'aberto' ? '#10b981' : '#ef4444',
                  color: 'white'
                }}>
                  {fechamento.status}
                </span>
              </div>
              <div>
                {fechamento.fechado_em ? 
                  formatBrasiliaDateTime(fechamento.fechado_em) : 
                  '-'
                }
              </div>
              <div>
                <button
                  style={{
                    padding: '0.5rem 1rem',
                    background: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.375rem',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    fontWeight: '600'
                  }}
                >
                  Ver Detalhes
                </button>
              </div>
            </TableRow>
          ))}
        </TableContainer>
      ) : (
        <div style={{ textAlign: 'center', padding: '4rem', color: '#888' }}>
          <h3>Nenhum fechamento encontrado</h3>
        </div>
      )}

      {fechamentoSelecionado && (
        <DetalhesCard $darkMode={darkMode}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ color: darkMode ? '#fff' : '#000', margin: 0 }}>
              Detalhes - {formatBrasiliaDateTime(fechamentoSelecionado.data_fechamento).split(' ')[0]}
            </h3>
            <button
              onClick={() => setFechamentoSelecionado(null)}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '1.5rem',
                cursor: 'pointer',
                color: darkMode ? '#fff' : '#000'
              }}
            >
              ✕
            </button>
          </div>

          {vendasDetalhes.length > 0 && (
            <>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
                gap: '1rem',
                marginBottom: '2rem'
              }}>
                {(() => {
                  const resumo = calcularResumo();
                  return (
                    <>
                      <div style={{ textAlign: 'center', padding: '1rem', background: darkMode ? '#333' : '#fff', borderRadius: '0.5rem' }}>
                        <div style={{ fontSize: '1.2rem', fontWeight: '700', color: '#10b981' }}>
                          {formatCurrency(resumo.total)}
                        </div>
                        <div style={{ fontSize: '0.9rem', color: '#666' }}>Total</div>
                      </div>
                      <div style={{ textAlign: 'center', padding: '1rem', background: darkMode ? '#333' : '#fff', borderRadius: '0.5rem' }}>
                        <div style={{ fontSize: '1.2rem', fontWeight: '700', color: '#10b981' }}>
                          {formatCurrency(resumo.dinheiro)}
                        </div>
                        <div style={{ fontSize: '0.9rem', color: '#666' }}>Dinheiro</div>
                      </div>
                      <div style={{ textAlign: 'center', padding: '1rem', background: darkMode ? '#333' : '#fff', borderRadius: '0.5rem' }}>
                        <div style={{ fontSize: '1.2rem', fontWeight: '700', color: '#3b82f6' }}>
                          {formatCurrency(resumo.credito + resumo.debito)}
                        </div>
                        <div style={{ fontSize: '0.9rem', color: '#666' }}>Cartões</div>
                      </div>
                      <div style={{ textAlign: 'center', padding: '1rem', background: darkMode ? '#333' : '#fff', borderRadius: '0.5rem' }}>
                        <div style={{ fontSize: '1.2rem', fontWeight: '700', color: '#f59e0b' }}>
                          {formatCurrency(resumo.pix)}
                        </div>
                        <div style={{ fontSize: '0.9rem', color: '#666' }}>PIX</div>
                      </div>
                      <div style={{ textAlign: 'center', padding: '1rem', background: darkMode ? '#333' : '#fff', borderRadius: '0.5rem' }}>
                        <div style={{ fontSize: '1.2rem', fontWeight: '700', color: '#6366f1' }}>
                          {formatCurrency(resumo.link_pagamento)}
                        </div>
                        <div style={{ fontSize: '0.9rem', color: '#666' }}>Link Pagamento</div>
                      </div>
                      <div style={{ textAlign: 'center', padding: '1rem', background: darkMode ? '#333' : '#fff', borderRadius: '0.5rem' }}>
                        <div style={{ fontSize: '1.2rem', fontWeight: '700', color: '#ef4444' }}>
                          {formatCurrency(resumo.total_saidas)}
                        </div>
                        <div style={{ fontSize: '0.9rem', color: '#666' }}>Saídas ({resumo.qtd_saidas})</div>
                      </div>
                      <div style={{ textAlign: 'center', padding: '1rem', background: darkMode ? '#333' : '#fff', borderRadius: '0.5rem' }}>
                        <div style={{ fontSize: '1.2rem', fontWeight: '700', color: resumo.total - resumo.total_saidas >= 0 ? '#10b981' : '#ef4444' }}>
                          {formatCurrency(resumo.total - resumo.total_saidas)}
                        </div>
                        <div style={{ fontSize: '0.9rem', color: '#666' }}>Saldo Líquido</div>
                      </div>
                    </>
                  );
                })()}
              </div>

              <TableContainer $darkMode={darkMode}>
                <TableHeader $darkMode={darkMode}>
                  <div>HORA</div>
                  <div>CLIENTE</div>
                  <div>VENDEDOR</div>
                  <div>VALOR</div>
                  <div>PAGAMENTO</div>
                </TableHeader>
                {vendasDetalhes.map(venda => (
                  <TableRow key={venda.id} $darkMode={darkMode}>
                    <div>{formatBrasiliaTime(venda.data_venda)}</div>
                    <div>{venda.cliente_nome}</div>
                    <div>{venda.vendedor_nome}</div>
                    <div style={{ fontWeight: '600', color: '#10b981' }}>
                      {formatCurrency(venda.valor_final)}
                    </div>
                    <div>
                      <span style={{
                        padding: '0.25rem 0.5rem',
                        borderRadius: '0.25rem',
                        fontSize: '0.8rem',
                        fontWeight: '600',
                        background: venda.forma_pagamento === 'dinheiro' ? '#10b981' : 
                                   venda.forma_pagamento?.includes('cartao') ? '#3b82f6' :
                                   venda.forma_pagamento === 'pix' ? '#f59e0b' :
                                   venda.forma_pagamento?.includes('link_pagamento') ? '#6366f1' :
                                   venda.forma_pagamento?.includes('|') ? '#8b5cf6' : '#666',
                        color: 'white'
                      }}>
                        {venda.forma_pagamento?.includes('|') ? 'MISTO' : 
                         venda.forma_pagamento?.includes('link_pagamento') ? 'LINK' :
                         venda.forma_pagamento}
                      </span>
                    </div>
                  </TableRow>
                ))}
              </TableContainer>
            </>
          )}
        </DetalhesCard>
      )}
    </Container>
  );
}