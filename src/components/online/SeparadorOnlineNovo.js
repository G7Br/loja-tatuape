import React, { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabase';
import { supabaseMogi } from '../../utils/supabaseMogi';
import { useTheme } from '../../contexts/ThemeContext';

export default function SeparadorOnlineNovo({ user, onLogout }) {
  const { darkMode } = useTheme();
  const [pedidos, setPedidos] = useState([]);
  const [historico, setHistorico] = useState([]);
  const [pedidoSelecionado, setPedidoSelecionado] = useState(null);
  const [activeTab, setActiveTab] = useState('pendentes');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarPedidos();
    carregarHistorico();
  }, []);

  const carregarHistorico = async () => {
    try {
      // Buscar vendas finalizadas que foram separadas pelo usuário
      const [vendasTatuape, vendasMogi] = await Promise.all([
        supabase.from('vendas_tatuape').select('*').ilike('observacoes', `%SEPARADO POR: ${user.nome}%`).order('created_at', { ascending: false }),
        supabaseMogi.from('vendas_mogi').select('*').ilike('observacoes', `%SEPARADO POR: ${user.nome}%`).order('created_at', { ascending: false })
      ]);

      const todasVendas = [
        ...(vendasTatuape.data || []).map(v => ({ ...v, loja: 'tatuape' })),
        ...(vendasMogi.data || []).map(v => ({ ...v, loja: 'mogi' }))
      ];

      setHistorico(todasVendas);
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
    }
  };

  const carregarPedidos = async () => {
    try {
      setLoading(true);
      
      // Buscar pedidos online das duas lojas (vendas_standby)
      const [pedidosTatuape, pedidosMogi] = await Promise.all([
        supabase.from('vendas_standby_tatuape').select('*').order('created_at', { ascending: false }),
        supabaseMogi.from('vendas_standby_mogi').select('*').order('created_at', { ascending: false })
      ]);

      const todosPedidos = [
        ...(pedidosTatuape.data || []).map(p => ({ ...p, loja: 'tatuape' })),
        ...(pedidosMogi.data || []).map(p => ({ ...p, loja: 'mogi' }))
      ];

      // Filtrar apenas pedidos online
      const pedidosOnline = todosPedidos.filter(p => {
        // Verificar se é venda online pelas observações ou vendedor online
        const isVendaOnline = p.observacoes?.includes('VENDA ONLINE') || 
                             p.observacoes?.includes('Separador: PENDENTE') ||
                             p.vendedor_nome?.includes('online') ||
                             user.nome === 'Separador Mogi'; // Mostrar todos para o separador Mogi
        
        return isVendaOnline;
      });

      setPedidos(pedidosOnline);
    } catch (error) {
      console.error('Erro ao carregar pedidos:', error);
    } finally {
      setLoading(false);
    }
  };

  const selecionarPedido = (pedido) => {
    setPedidoSelecionado(pedido);
  };

  const finalizarSeparacao = async () => {
    if (!pedidoSelecionado) return;

    try {
      const confirmacao = confirm(`Finalizar separação do pedido ${pedidoSelecionado.cliente_nome}?`);
      if (!confirmacao) return;

      // Mover para vendas finalizadas
      const numeroVenda = `SEP-${Date.now()}`;
      const carrinho = JSON.parse(pedidoSelecionado.carrinho || '[]');

      const vendaData = {
        numero_venda: numeroVenda,
        vendedor_nome: pedidoSelecionado.vendedor_nome,
        cliente_nome: pedidoSelecionado.cliente_nome,
        cliente_telefone: pedidoSelecionado.cliente_telefone,
        cliente_cpf: pedidoSelecionado.cliente_cpf,
        cliente_cidade: pedidoSelecionado.cliente_cidade,
        valor_total: pedidoSelecionado.valor_total,
        valor_final: pedidoSelecionado.valor_total,
        forma_pagamento: 'separado_online',
        observacoes: `SEPARADO POR: ${user.nome} | ORIGINAL: ${pedidoSelecionado.observacoes || ''}`
      };

      // Determinar a loja de destino baseada nos produtos do carrinho
      const carrinhoDestino = JSON.parse(pedidoSelecionado.carrinho || '[]');
      let lojaDestino = 'tatuape'; // padrão
      
      // Se todos os produtos são de Mogi, direcionar para Mogi
      if (carrinhoDestino.length > 0) {
        const produtosMogi = carrinhoDestino.filter(item => item.loja_origem === 'mogi' || item.codigo?.includes('M'));
        const produtosTatuape = carrinhoDestino.filter(item => item.loja_origem === 'tatuape' || !item.codigo?.includes('M'));
        
        // Se a maioria dos produtos é de Mogi, direcionar para Mogi
        if (produtosMogi.length > produtosTatuape.length) {
          lojaDestino = 'mogi';
        }
      }
      
      // Inserir na tabela de vendas da loja correspondente
      const supabaseClient = lojaDestino === 'mogi' ? supabaseMogi : supabase;
      const tabelaVendas = `vendas_${lojaDestino}`;

      const { data: venda, error: vendaError } = await supabaseClient
        .from(tabelaVendas)
        .insert([vendaData])
        .select()
        .single();

      if (vendaError) throw vendaError;

      // Inserir itens da venda
      if (carrinhoDestino.length > 0) {
        const itens = carrinhoDestino.map(item => ({
          venda_id: venda.id,
          produto_codigo: item.codigo,
          produto_nome: item.nome,
          quantidade: item.quantidade,
          preco_unitario: item.preco_venda,
          subtotal: item.preco_venda * item.quantidade
        }));

        const { error: itensError } = await supabaseClient
          .from(`itens_venda_${lojaDestino}`)
          .insert(itens);

        if (itensError) throw itensError;

        // Baixar estoque apenas dos produtos da mesma loja
        for (const item of carrinhoDestino) {
          if (item.loja_origem === lojaDestino || (lojaDestino === 'mogi' && item.codigo?.includes('M')) || (lojaDestino === 'tatuape' && !item.codigo?.includes('M'))) {
            const novoEstoque = item.estoque_atual - item.quantidade;
            await supabaseClient
              .from(`produtos_${lojaDestino}`)
              .update({ estoque_atual: novoEstoque })
              .eq('id', item.id);
          }
        }
      }

      // Remover do standby da loja original
      const supabaseOriginal = pedidoSelecionado.loja === 'mogi' ? supabaseMogi : supabase;
      await supabaseOriginal
        .from(`vendas_standby_${pedidoSelecionado.loja}`)
        .delete()
        .eq('id', pedidoSelecionado.id);

      alert(`Separação finalizada! Venda ${numeroVenda} criada na loja ${lojaDestino.toUpperCase()}.`);
      
      setPedidoSelecionado(null);
      carregarPedidos();
      carregarHistorico();
    } catch (error) {
      console.error('Erro ao finalizar separação:', error);
      alert('Erro ao finalizar separação!');
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: darkMode ? '#0a0a0a' : '#ffffff',
        color: darkMode ? '#ffffff' : '#000000'
      }}>
        Carregando...
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: darkMode ? '#0a0a0a' : '#ffffff',
      color: darkMode ? '#ffffff' : '#000000'
    }}>
      {/* Header */}
      <div style={{
        background: darkMode ? '#1a1a1a' : '#f8f9fa',
        borderBottom: `1px solid ${darkMode ? '#333' : '#e5e7eb'}`,
        padding: '1rem 2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.5rem' }}>Sistema de Separação Online</h1>
          <p style={{ margin: '0.25rem 0 0 0', color: '#888' }}>Separador: {user.nome}</p>
        </div>
        <button
          onClick={onLogout}
          style={{
            padding: '0.5rem 1rem',
            background: '#ef4444',
            color: 'white',
            border: 'none',
            borderRadius: '0.5rem',
            cursor: 'pointer'
          }}
        >
          Sair
        </button>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        background: darkMode ? '#1a1a1a' : '#f8f9fa',
        borderBottom: `1px solid ${darkMode ? '#333' : '#e5e7eb'}`
      }}>
        <button
          onClick={() => setActiveTab('pendentes')}
          style={{
            flex: 1,
            padding: '1rem',
            background: activeTab === 'pendentes' ? (darkMode ? '#0a0a0a' : '#ffffff') : 'transparent',
            color: activeTab === 'pendentes' ? '#10b981' : (darkMode ? '#888' : '#666'),
            border: 'none',
            borderBottom: activeTab === 'pendentes' ? '2px solid #10b981' : 'none',
            cursor: 'pointer',
            fontSize: '0.9rem',
            fontWeight: activeTab === 'pendentes' ? '600' : '400'
          }}
        >
          Pendentes ({pedidos.length})
        </button>
        <button
          onClick={() => setActiveTab('historico')}
          style={{
            flex: 1,
            padding: '1rem',
            background: activeTab === 'historico' ? (darkMode ? '#0a0a0a' : '#ffffff') : 'transparent',
            color: activeTab === 'historico' ? '#10b981' : (darkMode ? '#888' : '#666'),
            border: 'none',
            borderBottom: activeTab === 'historico' ? '2px solid #10b981' : 'none',
            cursor: 'pointer',
            fontSize: '0.9rem',
            fontWeight: activeTab === 'historico' ? '600' : '400'
          }}
        >
          Histórico ({historico.length})
        </button>
      </div>

      <div style={{ display: 'flex', height: 'calc(100vh - 140px)' }}>
        <div style={{
          flex: 1,
          padding: '1rem',
          borderRight: `1px solid ${darkMode ? '#333' : '#e5e7eb'}`,
          overflowY: 'auto'
        }}>
          {activeTab === 'pendentes' ? (
            <>
              <h2>Pedidos Online para Separação ({pedidos.length})</h2>
              
              {pedidos.length === 0 ? (
                <div style={{
                  background: darkMode ? '#1a1a1a' : '#f8f9fa',
                  border: `1px solid ${darkMode ? '#333' : '#e5e7eb'}`,
                  borderRadius: '0.5rem',
                  padding: '2rem',
                  textAlign: 'center',
                  color: '#888'
                }}>
                  Nenhum pedido online aguardando separação
                </div>
              ) : (
                <div style={{ display: 'grid', gap: '1rem' }}>
                  {pedidos.map(pedido => (
                    <div
                      key={pedido.id}
                      onClick={() => selecionarPedido(pedido)}
                      style={{
                        background: pedidoSelecionado?.id === pedido.id 
                          ? (darkMode ? '#2a2a2a' : '#e5e7eb') 
                          : (darkMode ? '#1a1a1a' : '#f8f9fa'),
                        border: `2px solid ${pedidoSelecionado?.id === pedido.id ? '#10b981' : (darkMode ? '#333' : '#e5e7eb')}`,
                        borderRadius: '0.5rem',
                        padding: '1rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <h4 style={{ margin: '0 0 0.5rem 0' }}>Cliente: {pedido.cliente_nome}</h4>
                          <p style={{ margin: '0.25rem 0', color: '#888' }}>Vendedor: {pedido.vendedor_nome}</p>
                          <p style={{ margin: '0.25rem 0', color: '#888' }}>Loja: ONLINE</p>
                          <p style={{ margin: '0.25rem 0', fontSize: '0.8rem', color: '#888' }}>
                            {new Date(pedido.created_at).toLocaleString('pt-BR')}
                          </p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{
                            background: '#f59e0b',
                            color: 'white',
                            padding: '0.25rem 0.5rem',
                            borderRadius: '0.25rem',
                            fontSize: '0.8rem',
                            marginBottom: '0.5rem'
                          }}>
                            AGUARDANDO
                          </div>
                          <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
                            {formatCurrency(pedido.valor_total)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <>
              <h2>Histórico de Separações ({historico.length})</h2>
              
              {historico.length === 0 ? (
                <div style={{
                  background: darkMode ? '#1a1a1a' : '#f8f9fa',
                  border: `1px solid ${darkMode ? '#333' : '#e5e7eb'}`,
                  borderRadius: '0.5rem',
                  padding: '2rem',
                  textAlign: 'center',
                  color: '#888'
                }}>
                  Nenhuma separação realizada ainda
                </div>
              ) : (
                <div style={{ display: 'grid', gap: '1rem' }}>
                  {historico.map(venda => (
                    <div
                      key={venda.id}
                      style={{
                        background: darkMode ? '#1a1a1a' : '#f8f9fa',
                        border: `1px solid ${darkMode ? '#333' : '#e5e7eb'}`,
                        borderRadius: '0.5rem',
                        padding: '1rem'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <h4 style={{ margin: '0 0 0.5rem 0' }}>Cliente: {venda.cliente_nome}</h4>
                          <p style={{ margin: '0.25rem 0', color: '#888' }}>Venda: {venda.numero_venda}</p>
                          <p style={{ margin: '0.25rem 0', color: '#888' }}>Vendedor: {venda.vendedor_nome}</p>
                          <p style={{ margin: '0.25rem 0', fontSize: '0.8rem', color: '#888' }}>
                            Separado em: {new Date(venda.created_at).toLocaleString('pt-BR')}
                          </p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{
                            background: '#10b981',
                            color: 'white',
                            padding: '0.25rem 0.5rem',
                            borderRadius: '0.25rem',
                            fontSize: '0.8rem',
                            marginBottom: '0.5rem'
                          }}>
                            SEPARADO
                          </div>
                          <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
                            {formatCurrency(venda.valor_final)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Detalhes do Pedido */}
        <div style={{ flex: 1, padding: '1rem', overflowY: 'auto' }}>
          {!pedidoSelecionado ? (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: '100%',
              color: '#888',
              textAlign: 'center'
            }}>
              <div>
                <h3>Selecione um pedido</h3>
                <p>Clique em um pedido da lista para iniciar a separação</p>
              </div>
            </div>
          ) : (
            <>
              {/* Informações do Pedido */}
              <div style={{
                background: darkMode ? '#1a1a1a' : '#f8f9fa',
                border: `1px solid ${darkMode ? '#333' : '#e5e7eb'}`,
                borderRadius: '0.5rem',
                padding: '1rem',
                marginBottom: '1rem'
              }}>
                <h3>Detalhes do Pedido</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <p><strong>Cliente:</strong> {pedidoSelecionado.cliente_nome}</p>
                    <p><strong>Telefone:</strong> {pedidoSelecionado.cliente_telefone}</p>
                    <p><strong>CPF:</strong> {pedidoSelecionado.cliente_cpf || 'Não informado'}</p>
                  </div>
                  <div>
                    <p><strong>Vendedor:</strong> {pedidoSelecionado.vendedor_nome}</p>
                    <p><strong>Loja:</strong> ONLINE</p>
                    <p><strong>Total:</strong> {formatCurrency(pedidoSelecionado.valor_total)}</p>
                  </div>
                </div>
                {pedidoSelecionado.observacoes && (
                  <div style={{ marginTop: '1rem' }}>
                    <p><strong>Observações:</strong></p>
                    <p style={{ 
                      background: darkMode ? '#2a2a2a' : '#ffffff',
                      padding: '0.5rem',
                      borderRadius: '0.25rem',
                      border: `1px solid ${darkMode ? '#333' : '#e5e7eb'}`
                    }}>
                      {pedidoSelecionado.observacoes}
                    </p>
                  </div>
                )}
              </div>

              {/* Lista de Itens */}
              <div style={{
                background: darkMode ? '#1a1a1a' : '#f8f9fa',
                border: `1px solid ${darkMode ? '#333' : '#e5e7eb'}`,
                borderRadius: '0.5rem',
                padding: '1rem',
                marginBottom: '1rem'
              }}>
                <h3>Itens para Separar</h3>
                {(() => {
                  try {
                    const carrinho = JSON.parse(pedidoSelecionado.carrinho || '[]');
                    return (
                      <div style={{ display: 'grid', gap: '0.5rem' }}>
                        {carrinho.map((item, index) => (
                          <div
                            key={index}
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              padding: '1rem',
                              background: darkMode ? '#2a2a2a' : '#ffffff',
                              border: `1px solid ${darkMode ? '#333' : '#e5e7eb'}`,
                              borderRadius: '0.5rem'
                            }}
                          >
                            <div>
                              <h4 style={{ margin: '0 0 0.25rem 0' }}>{item.nome}</h4>
                              <p style={{ margin: '0.25rem 0', color: '#888' }}>Código: {item.codigo}</p>
                              <p style={{ margin: '0.25rem 0', color: '#888' }}>
                                Quantidade: <strong>{item.quantidade}</strong>
                              </p>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontWeight: 'bold' }}>
                                {formatCurrency(item.preco_venda * item.quantidade)}
                              </div>
                              <div style={{ fontSize: '0.8rem', color: '#888' }}>
                                {formatCurrency(item.preco_venda)} cada
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  } catch (error) {
                    return <p style={{ color: '#ef4444' }}>Erro ao carregar itens do carrinho</p>;
                  }
                })()}
              </div>

              {/* Botão Finalizar */}
              <button
                onClick={finalizarSeparacao}
                style={{
                  width: '100%',
                  padding: '1rem',
                  background: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  fontSize: '1.1rem',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                Finalizar Separação
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}