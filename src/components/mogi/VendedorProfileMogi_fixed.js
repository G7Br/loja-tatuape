import React, { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabase';
import { useTheme } from '../../contexts/ThemeContext';

export default function VendedorProfileMogi({ user, onBack }) {
  const { darkMode } = useTheme();
  const [stats, setStats] = useState({
    vendasMes: 0,
    valorMes: 0,
    vendasHoje: 0,
    valorHoje: 0,
    ticketMedio: 0,
    produtosMaisVendidos: []
  });

  useEffect(() => {
    carregarEstatisticas();
  }, []);

  const carregarEstatisticas = async () => {
    try {
      const hoje = new Date();
      const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
      const inicioDia = new Date();
      inicioDia.setHours(0, 0, 0, 0);

      console.log('🔍 Carregando estatísticas para:', user.nome);

      // Vendas do mês (NÃO canceladas)
      const { data: vendasMes } = await supabase
        .from('vendas_mogi')
        .select('valor_final, forma_pagamento, status')
        .eq('vendedor_nome', user.nome)
        .gte('data_venda', inicioMes.toISOString())
        .neq('forma_pagamento', 'pendente_caixa')
        .neq('status', 'cancelada');

      // Vendas de hoje (NÃO canceladas)  
      const { data: vendasHoje } = await supabase
        .from('vendas_mogi')
        .select('valor_final, forma_pagamento, status')
        .eq('vendedor_nome', user.nome)
        .gte('data_venda', inicioDia.toISOString())
        .neq('forma_pagamento', 'pendente_caixa')
        .neq('status', 'cancelada');

      const valorMes = vendasMes?.reduce((sum, v) => sum + parseFloat(v.valor_final || 0), 0) || 0;
      const valorHoje = vendasHoje?.reduce((sum, v) => sum + parseFloat(v.valor_final || 0), 0) || 0;
      const ticketMedio = vendasMes?.length > 0 ? valorMes / vendasMes.length : 0;

      setStats({
        vendasMes: vendasMes?.length || 0,
        valorMes,
        vendasHoje: vendasHoje?.length || 0,
        valorHoje,
        ticketMedio,
        produtosMaisVendidos: []
      });

    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const metaMensal = user.meta_mensal || 15000;
  const percentualMeta = metaMensal > 0 ? (stats.valorMes / metaMensal) * 100 : 0;

  return (
    <div style={{
      minHeight: '100vh',
      background: darkMode ? '#0a0a0a' : '#ffffff',
      color: darkMode ? '#ffffff' : '#000000',
      padding: '1rem'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        marginBottom: '2rem',
        paddingBottom: '1rem',
        borderBottom: `1px solid ${darkMode ? '#333' : '#e5e7eb'}`
      }}>
        <button
          onClick={onBack}
          style={{
            padding: '0.5rem',
            background: 'transparent',
            border: 'none',
            color: darkMode ? '#ffffff' : '#000000',
            cursor: 'pointer',
            fontSize: '1.5rem',
            marginRight: '1rem'
          }}
        >
          ←
        </button>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.5rem' }}>Perfil do Vendedor - Mogi</h1>
          <p style={{ margin: '0.25rem 0 0 0', color: '#888' }}>{user.nome}</p>
        </div>
      </div>

      {/* Informações do Usuário */}
      <div style={{
        background: darkMode ? '#1a1a1a' : '#f8f9fa',
        border: `1px solid ${darkMode ? '#333' : '#e5e7eb'}`,
        borderRadius: '1rem',
        padding: '1.5rem',
        marginBottom: '2rem'
      }}>
        <h2 style={{ margin: '0 0 1rem 0', fontSize: '1.2rem' }}>Informações Pessoais</h2>
        <div style={{ display: 'grid', gap: '0.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#888' }}>Nome:</span>
            <span style={{ fontWeight: '600' }}>{user.nome}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#888' }}>Email:</span>
            <span style={{ fontWeight: '600' }}>{user.email}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#888' }}>Loja:</span>
            <span style={{ fontWeight: '600' }}>Mogi das Cruzes</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#888' }}>Tipo:</span>
            <span style={{ fontWeight: '600', textTransform: 'capitalize' }}>{user.tipo}</span>
          </div>
        </div>
      </div>

      {/* Meta Mensal */}
      <div style={{
        background: darkMode ? '#1a1a1a' : '#f8f9fa',
        border: `1px solid ${darkMode ? '#333' : '#e5e7eb'}`,
        borderRadius: '1rem',
        padding: '1.5rem',
        marginBottom: '2rem'
      }}>
        <h2 style={{ margin: '0 0 1rem 0', fontSize: '1.2rem' }}>Meta do Mês</h2>
        <div style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span>Progresso:</span>
            <span style={{ fontWeight: '600' }}>
              {formatCurrency(stats.valorMes)} / {formatCurrency(metaMensal)}
            </span>
          </div>
          <div style={{
            width: '100%',
            height: '8px',
            background: darkMode ? '#333' : '#e5e7eb',
            borderRadius: '4px',
            overflow: 'hidden'
          }}>
            <div style={{
              height: '100%',
              background: percentualMeta >= 100 ? '#10b981' : '#3b82f6',
              width: `${Math.min(percentualMeta, 100)}%`,
              transition: 'width 0.3s ease'
            }}></div>
          </div>
          <div style={{ 
            textAlign: 'center', 
            marginTop: '0.5rem',
            fontSize: '1.2rem',
            fontWeight: '700',
            color: percentualMeta >= 100 ? '#10b981' : '#3b82f6'
          }}>
            {percentualMeta.toFixed(1)}%
          </div>
        </div>
        {percentualMeta >= 100 && (
          <div style={{
            background: '#10b981',
            color: 'white',
            padding: '0.75rem',
            borderRadius: '0.5rem',
            textAlign: 'center',
            fontWeight: '600'
          }}>
            🎉 Parabéns! Meta atingida!
          </div>
        )}
      </div>

      {/* Estatísticas */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        <div style={{
          background: darkMode ? '#1a1a1a' : '#f8f9fa',
          border: `1px solid ${darkMode ? '#333' : '#e5e7eb'}`,
          borderRadius: '1rem',
          padding: '1.5rem',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📈</div>
          <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#3b82f6' }}>
            {stats.vendasMes}
          </div>
          <div style={{ fontSize: '0.9rem', color: '#888' }}>Vendas do Mês</div>
        </div>

        <div style={{
          background: darkMode ? '#1a1a1a' : '#f8f9fa',
          border: `1px solid ${darkMode ? '#333' : '#e5e7eb'}`,
          borderRadius: '1rem',
          padding: '1.5rem',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>💰</div>
          <div style={{ fontSize: '1.2rem', fontWeight: '700', color: '#10b981' }}>
            {formatCurrency(stats.valorMes)}
          </div>
          <div style={{ fontSize: '0.9rem', color: '#888' }}>Faturamento Mês</div>
        </div>

        <div style={{
          background: darkMode ? '#1a1a1a' : '#f8f9fa',
          border: `1px solid ${darkMode ? '#333' : '#e5e7eb'}`,
          borderRadius: '1rem',
          padding: '1.5rem',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📊</div>
          <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#f59e0b' }}>
            {stats.vendasHoje}
          </div>
          <div style={{ fontSize: '0.9rem', color: '#888' }}>Vendas Hoje</div>
        </div>

        <div style={{
          background: darkMode ? '#1a1a1a' : '#f8f9fa',
          border: `1px solid ${darkMode ? '#333' : '#e5e7eb'}`,
          borderRadius: '1rem',
          padding: '1.5rem',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🎯</div>
          <div style={{ fontSize: '1.2rem', fontWeight: '700', color: '#8b5cf6' }}>
            {formatCurrency(stats.ticketMedio)}
          </div>
          <div style={{ fontSize: '0.9rem', color: '#888' }}>Ticket Médio</div>
        </div>
      </div>
    </div>
  );
}