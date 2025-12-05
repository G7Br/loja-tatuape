import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';

const DashboardBlackFriday = () => {
  const [dadosBlackFriday, setDadosBlackFriday] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    carregarDadosBlackFriday();
  }, []);

  const carregarDadosBlackFriday = async () => {
    try {
      setLoading(true);
      
      // Buscar vendas da Black Friday (29/11/2024) - EXCLUINDO vendas pendentes no caixa
      const { data: vendas, error: errorVendas } = await supabase
        .from('vendas_tatuape')
        .select(`
          *,
          itens_venda_tatuape (
            produto_codigo,
            produto_nome,
            quantidade,
            preco_unitario,
            subtotal
          )
        `)
        .gte('data_venda', '2024-11-29 00:00:00')
        .lt('data_venda', '2024-11-30 00:00:00')
        .neq('status', 'cancelada')
        .neq('forma_pagamento', 'pendente_caixa')
        .order('data_venda', { ascending: false });

      if (errorVendas) throw errorVendas;

      // Processar dados
      const dadosProcessados = processarDadosBlackFriday(vendas || []);
      setDadosBlackFriday(dadosProcessados);
      
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const processarDadosBlackFriday = (vendas) => {
    const totalVendas = vendas.length;
    const valorTotal = vendas.reduce((sum, venda) => sum + (venda.valor_final || 0), 0);
    const ticketMedio = totalVendas > 0 ? valorTotal / totalVendas : 0;

    // Vendas por vendedor
    const vendasPorVendedor = vendas.reduce((acc, venda) => {
      const vendedor = venda.vendedor_nome || 'Sem vendedor';
      if (!acc[vendedor]) {
        acc[vendedor] = { vendas: 0, valor: 0 };
      }
      acc[vendedor].vendas += 1;
      acc[vendedor].valor += venda.valor_final || 0;
      return acc;
    }, {});

    // Produtos mais vendidos
    const produtosVendidos = {};
    vendas.forEach(venda => {
      if (venda.itens_venda_tatuape) {
        venda.itens_venda_tatuape.forEach(item => {
          const produto = item.produto_nome;
          if (!produtosVendidos[produto]) {
            produtosVendidos[produto] = { quantidade: 0, valor: 0 };
          }
          produtosVendidos[produto].quantidade += item.quantidade || 0;
          produtosVendidos[produto].valor += item.subtotal || 0;
        });
      }
    });

    // Formas de pagamento
    const formasPagamento = vendas.reduce((acc, venda) => {
      const forma = venda.forma_pagamento || 'Não informado';
      if (!acc[forma]) {
        acc[forma] = { vendas: 0, valor: 0 };
      }
      acc[forma].vendas += 1;
      acc[forma].valor += venda.valor_final || 0;
      return acc;
    }, {});

    // Vendas por hora
    const vendasPorHora = vendas.reduce((acc, venda) => {
      if (venda.data_venda) {
        const hora = new Date(venda.data_venda).getHours();
        if (!acc[hora]) acc[hora] = 0;
        acc[hora] += 1;
      }
      return acc;
    }, {});

    return {
      resumoGeral: {
        totalVendas,
        valorTotal,
        ticketMedio
      },
      vendasPorVendedor: Object.entries(vendasPorVendedor)
        .sort(([,a], [,b]) => b.valor - a.valor),
      produtosMaisVendidos: Object.entries(produtosVendidos)
        .sort(([,a], [,b]) => b.quantidade - a.quantidade)
        .slice(0, 10),
      formasPagamento: Object.entries(formasPagamento)
        .sort(([,a], [,b]) => b.valor - a.valor),
      vendasPorHora: Object.entries(vendasPorHora)
        .sort(([a], [b]) => parseInt(a) - parseInt(b)),
      vendasDetalhadas: vendas.slice(0, 20) // Últimas 20 vendas
    };
  };

  const formatarMoeda = (valor) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor || 0);
  };

  const formatarFormaPagamento = (forma) => {
    const formas = {
      'cartao_credito': 'Cartão de Crédito',
      'cartao_debito': 'Cartão de Débito',
      'pix': 'PIX',
      'dinheiro': 'Dinheiro',
      'pendente_caixa': 'Pendente Caixa'
    };
    return formas[forma] || forma;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-lg">Carregando dados da Black Friday...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        <strong>Erro:</strong> {error}
      </div>
    );
  }

  if (!dadosBlackFriday) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Nenhum dado encontrado para a Black Friday.</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-black to-gray-800 text-white p-6 rounded-lg mb-6">
          <h1 className="text-3xl font-bold mb-2">🛍️ Dashboard Black Friday 2024 - Sábado</h1>
          <p className="text-gray-300">VH Tatuapé - Análise de Performance</p>
        </div>

        {/* Cards de Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-full">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total de Vendas</p>
                <p className="text-2xl font-bold text-gray-900">{dadosBlackFriday.resumoGeral.totalVendas}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-full">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Faturamento Total</p>
                <p className="text-2xl font-bold text-green-600">{formatarMoeda(dadosBlackFriday.resumoGeral.valorTotal)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-full">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Ticket Médio</p>
                <p className="text-2xl font-bold text-purple-600">{formatarMoeda(dadosBlackFriday.resumoGeral.ticketMedio)}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Performance por Vendedor */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-bold mb-4 text-gray-800">👥 Performance por Vendedor</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Vendedor</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Vendas</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Faturamento</th>
                  </tr>
                </thead>
                <tbody>
                  {dadosBlackFriday.vendasPorVendedor.map(([vendedor, dados], index) => (
                    <tr key={vendedor} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-4 py-2 text-sm text-gray-900">{vendedor}</td>
                      <td className="px-4 py-2 text-sm text-gray-900">{dados.vendas}</td>
                      <td className="px-4 py-2 text-sm font-medium text-green-600">{formatarMoeda(dados.valor)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Produtos Mais Vendidos */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-bold mb-4 text-gray-800">🛒 Produtos Mais Vendidos</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Produto</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Qtd</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {dadosBlackFriday.produtosMaisVendidos.map(([produto, dados], index) => (
                    <tr key={produto} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-4 py-2 text-sm text-gray-900">{produto}</td>
                      <td className="px-4 py-2 text-sm text-gray-900">{dados.quantidade}</td>
                      <td className="px-4 py-2 text-sm font-medium text-green-600">{formatarMoeda(dados.valor)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Formas de Pagamento */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-bold mb-4 text-gray-800">💳 Formas de Pagamento</h2>
            <div className="space-y-3">
              {dadosBlackFriday.formasPagamento.map(([forma, dados]) => {
                const percentual = (dados.valor / dadosBlackFriday.resumoGeral.valorTotal * 100);
                return (
                  <div key={forma} className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium text-gray-700">{formatarFormaPagamento(forma)}</span>
                        <span className="text-sm text-gray-500">{percentual.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${percentual}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between mt-1">
                        <span className="text-xs text-gray-500">{dados.vendas} vendas</span>
                        <span className="text-xs font-medium text-green-600">{formatarMoeda(dados.valor)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Vendas por Hora */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-bold mb-4 text-gray-800">⏰ Vendas por Hora</h2>
            <div className="space-y-2">
              {dadosBlackFriday.vendasPorHora.map(([hora, quantidade]) => (
                <div key={hora} className="flex items-center">
                  <span className="w-12 text-sm text-gray-600">{hora}h</span>
                  <div className="flex-1 mx-3">
                    <div className="bg-gray-200 rounded-full h-4">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-purple-600 h-4 rounded-full flex items-center justify-center"
                        style={{ width: `${(quantidade / Math.max(...dadosBlackFriday.vendasPorHora.map(([,q]) => q))) * 100}%` }}
                      >
                        <span className="text-xs text-white font-medium">{quantidade}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Botão de Atualização */}
        <div className="mt-8 text-center">
          <button
            onClick={carregarDadosBlackFriday}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition duration-200"
          >
            🔄 Atualizar Dados
          </button>
        </div>
      </div>
    </div>
  );
};

export default DashboardBlackFriday;