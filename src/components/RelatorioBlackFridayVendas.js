import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';

const RelatorioBlackFridayVendas = () => {
  const [vendas, setVendas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [relatorio, setRelatorio] = useState(null);

  useEffect(() => {
    carregarVendasBlackFriday();
  }, []);

  const carregarVendasBlackFriday = async () => {
    try {
      const { data, error } = await supabase
        .from('vendas_tatuape')
        .select('*')
        .gte('data_venda', '2025-11-28')
        .lte('data_venda', '2025-11-29')
        .neq('status', 'cancelada')
        .neq('forma_pagamento', 'pendente_caixa')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setVendas(data || []);
      gerarRelatorio(data || []);
    } catch (error) {
      console.error('Erro ao carregar vendas:', error);
    } finally {
      setLoading(false);
    }
  };

  const gerarRelatorio = (vendas) => {
    const totalFaturamento = vendas.reduce((sum, v) => sum + v.valor_final, 0);
    const totalVendas = vendas.length;
    const ticketMedio = totalVendas > 0 ? totalFaturamento / totalVendas : 0;

    // Vendedores
    const vendedores = {};
    vendas.forEach(venda => {
      const vendedor = venda.vendedor_nome || 'Não informado';
      if (!vendedores[vendedor]) {
        vendedores[vendedor] = { vendas: 0, faturamento: 0 };
      }
      vendedores[vendedor].vendas += 1;
      vendedores[vendedor].faturamento += venda.valor_final;
    });

    // Formas de pagamento
    const pagamentos = {};
    vendas.forEach(venda => {
      const forma = venda.forma_pagamento;
      if (!pagamentos[forma]) {
        pagamentos[forma] = { qtd: 0, valor: 0 };
      }
      pagamentos[forma].qtd += 1;
      pagamentos[forma].valor += venda.valor_final;
    });

    setRelatorio({
      totalFaturamento,
      totalVendas,
      ticketMedio,
      vendedores,
      pagamentos
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg">
      <h1 className="text-3xl font-bold text-center mb-6 text-gray-800">
        🛍️ BLACK FRIDAY 2025 - SÁBADO - RELATÓRIO DE VENDAS
      </h1>

      {relatorio && (
        <>
          {/* Resumo Executivo */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-green-100 p-4 rounded-lg text-center">
              <h3 className="text-lg font-semibold text-green-800">Faturamento Total</h3>
              <p className="text-2xl font-bold text-green-600">
                R$ {relatorio.totalFaturamento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="bg-blue-100 p-4 rounded-lg text-center">
              <h3 className="text-lg font-semibold text-blue-800">Total de Vendas</h3>
              <p className="text-2xl font-bold text-blue-600">{relatorio.totalVendas}</p>
            </div>
            <div className="bg-purple-100 p-4 rounded-lg text-center">
              <h3 className="text-lg font-semibold text-purple-800">Ticket Médio</h3>
              <p className="text-2xl font-bold text-purple-600">
                R$ {relatorio.ticketMedio.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>

          {/* Performance dos Vendedores */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">👥 Performance dos Vendedores</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vendedor</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vendas</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Faturamento</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ticket Médio</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {Object.entries(relatorio.vendedores)
                    .sort(([,a], [,b]) => b.faturamento - a.faturamento)
                    .map(([vendedor, dados]) => (
                      <tr key={vendedor}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {vendedor}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {dados.vendas}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          R$ {dados.faturamento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          R$ {(dados.faturamento / dados.vendas).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Formas de Pagamento */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">💳 Formas de Pagamento</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {Object.entries(relatorio.pagamentos).map(([forma, dados]) => (
                <div key={forma} className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-800 capitalize">
                    {forma.replace('_', ' ')}
                  </h3>
                  <p className="text-sm text-gray-600">{dados.qtd} vendas</p>
                  <p className="text-lg font-bold text-gray-800">
                    R$ {dados.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-xs text-gray-500">
                    {((dados.qtd / relatorio.totalVendas) * 100).toFixed(1)}%
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Lista de Vendas */}
          <div>
            <h2 className="text-2xl font-bold mb-4 text-gray-800">📋 Detalhes das Vendas</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data/Hora</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vendedor</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valor</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pagamento</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {vendas.slice(0, 20).map((venda) => (
                    <tr key={venda.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(venda.data_venda).toLocaleString('pt-BR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {venda.vendedor_nome || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {venda.cliente_nome || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        R$ {venda.valor_final.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                        {venda.forma_pagamento.replace('_', ' ')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {vendas.length > 20 && (
              <p className="text-center text-gray-500 mt-4">
                Mostrando 20 de {vendas.length} vendas
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default RelatorioBlackFridayVendas;