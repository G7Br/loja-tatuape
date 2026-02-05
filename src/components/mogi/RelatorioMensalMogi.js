import React, { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabase';

export default function RelatorioMensalMogi() {
  const [loading, setLoading] = useState(true);
  const [dados, setDados] = useState({ vendas: [], metricas: { totalVendas: 0, valorTotal: 0 } });
  const [meses, setMeses] = useState([]);
  const [mesSelecionado, setMesSelecionado] = useState('');

  useEffect(() => {
    carregarMeses();
  }, []);

  const carregarMeses = async () => {
    try {
      const { data } = await supabase
        .from('vendas_mogi')
        .select('created_at')
        .order('created_at', { ascending: false })
        .limit(100);
      
      const mesesUnicos = [...new Set((data || []).map(v => {
        const d = new Date(v.created_at);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      }))].sort((a, b) => b.localeCompare(a));
      
      setMeses(mesesUnicos);
      if (mesesUnicos[0]) setMesSelecionado(mesesUnicos[0]);
    } catch (error) {
      console.error('Erro:', error);
      setMeses([]);
    }
  };

  const carregarDados = async () => {
    if (!mesSelecionado) return;
    
    try {
      setLoading(true);
      const [ano, mes] = mesSelecionado.split('-');
      const inicio = new Date(ano, mes - 1, 1).toISOString();
      const fim = new Date(ano, mes, 0, 23, 59, 59).toISOString();
      
      const { data: vendas } = await supabase
        .from('vendas_mogi')
        .select('*')
        .gte('created_at', inicio)
        .lte('created_at', fim)
        .neq('forma_pagamento', 'pendente_caixa');
      
      const totalVendas = (vendas || []).length;
      const valorTotal = (vendas || []).reduce((sum, v) => sum + parseFloat(v.valor_final || 0), 0);
      
      setDados({ vendas: vendas || [], metricas: { totalVendas, valorTotal } });
    } catch (error) {
      console.error('Erro:', error);
      setDados({ vendas: [], metricas: { totalVendas: 0, valorTotal: 0 } });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (mesSelecionado) carregarDados();
  }, [mesSelecionado]);

  const formatarMes = (mesAno) => {
    const [ano, mes] = mesAno.split('-');
    return new Date(ano, mes - 1).toLocaleDateString('pt-BR', { year: 'numeric', month: 'long' });
  };

  const formatarMoeda = (valor) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor || 0);
  };

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', background: '#fff', color: '#000', borderRadius: '8px' }}>
        <h2>🔄 Carregando relatório mensal...</h2>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', background: '#fff', color: '#000', borderRadius: '8px' }}>
      <div style={{ textAlign: 'center', marginBottom: '30px', padding: '20px', background: '#f8f9fa', borderRadius: '8px' }}>
        <h2 style={{ marginBottom: '20px' }}>📊 RELATÓRIO MENSAL - MOGI</h2>
        
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '10px' }}>Selecionar Mês:</label>
          <select
            value={mesSelecionado}
            onChange={(e) => setMesSelecionado(e.target.value)}
            style={{
              padding: '10px 15px',
              borderRadius: '8px',
              border: '2px solid #000',
              background: '#fff',
              fontSize: '16px',
              minWidth: '200px'
            }}
          >
            <option value="">Escolha um mês...</option>
            {meses.map(mes => (
              <option key={mes} value={mes}>{formatarMes(mes)}</option>
            ))}
          </select>
        </div>
        
        {mesSelecionado && (
          <p>Relatório de {formatarMes(mesSelecionado)}</p>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        <div style={{ background: '#fff', border: '2px solid #000', borderRadius: '10px', padding: '20px', textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '5px' }}>{dados.metricas.totalVendas}</div>
          <div style={{ color: '#666', fontSize: '0.9rem', textTransform: 'uppercase' }}>Total de Vendas</div>
        </div>
        <div style={{ background: '#fff', border: '2px solid #000', borderRadius: '10px', padding: '20px', textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '5px' }}>{formatarMoeda(dados.metricas.valorTotal)}</div>
          <div style={{ color: '#666', fontSize: '0.9rem', textTransform: 'uppercase' }}>Faturamento Total</div>
        </div>
      </div>

      <div style={{ marginBottom: '30px' }}>
        <h3 style={{ marginBottom: '20px' }}>📋 Vendas do Período</h3>
        <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000' }}>
            <thead>
              <tr style={{ background: '#000', color: '#fff' }}>
                <th style={{ padding: '15px', textAlign: 'left' }}>Data</th>
                <th style={{ padding: '15px', textAlign: 'left' }}>Cliente</th>
                <th style={{ padding: '15px', textAlign: 'left' }}>Valor</th>
              </tr>
            </thead>
            <tbody>
              {dados.vendas.slice(0, 50).map((venda, index) => (
                <tr key={venda.id || index}>
                  <td style={{ padding: '12px 15px', borderBottom: '1px solid #e5e7eb' }}>
                    {new Date(venda.created_at).toLocaleDateString('pt-BR')}
                  </td>
                  <td style={{ padding: '12px 15px', borderBottom: '1px solid #e5e7eb' }}>
                    {venda.cliente_nome || 'N/A'}
                  </td>
                  <td style={{ padding: '12px 15px', borderBottom: '1px solid #e5e7eb' }}>
                    {formatarMoeda(venda.valor_final)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}