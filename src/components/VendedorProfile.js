import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';
import { useTheme } from '../contexts/ThemeContext';

export default function VendedorProfile({ user, onBack }) {
  const { theme } = useTheme();
  const [vendas, setVendas] = useState([]);
  const [stats, setStats] = useState({
    totalMes: 0,
    totalDia: 0,
    vendasMes: 0,
    vendasDia: 0
  });

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    const hoje = new Date();
    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    const inicioDia = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());

    // Vendas do vendedor
    const { data: vendasData } = await supabase
      .from('vendas_tatuape')
      .select('*')
      .eq('vendedor_nome', user.nome)
      .gte('data_venda', inicioMes.toISOString())
      .order('data_venda', { ascending: false });

    setVendas(vendasData || []);

    // Estatísticas
    const vendasFinalizadas = vendasData?.filter(v => v.forma_pagamento !== 'pendente_caixa') || [];
    const totalMes = vendasFinalizadas.reduce((sum, v) => sum + parseFloat(v.valor_final), 0);
    const vendasDia = vendasFinalizadas.filter(v => new Date(v.data_venda) >= inicioDia);
    const totalDia = vendasDia.reduce((sum, v) => sum + parseFloat(v.valor_final), 0);

    setStats({
      totalMes,
      totalDia,
      vendasMes: vendasFinalizadas.length,
      vendasDia: vendasDia.length
    });
  };

  const metaMensal = user.meta_mensal || 0;
  const percentualMeta = metaMensal > 0 ? (stats.totalMes / metaMensal) * 100 : 0;

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: theme.background, 
      color: theme.text,
      padding: '1rem'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        marginBottom: '2rem',
        padding: '1rem 0'
      }}>
        <button onClick={onBack} style={{
          padding: '8px 16px',
          background: theme.surface,
          color: theme.text,
          border: `1px solid ${theme.border}`,
          borderRadius: '8px',
          cursor: 'pointer'
        }}>
          ← Voltar
        </button>
        <h1 style={{ fontSize: '1.5rem', fontWeight: '700' }}>Meu Perfil</h1>
      </div>

      {/* Stats Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        <div style={{
          background: theme.surfaceGradient,
          border: `1px solid ${theme.border}`,
          borderRadius: '12px',
          padding: '1.5rem'
        }}>
          <h3 style={{ margin: '0 0 0.5rem 0', color: theme.textSecondary }}>Hoje</h3>
          <div style={{ fontSize: '1.8rem', fontWeight: '700', color: theme.success }}>
            R$ {stats.totalDia.toFixed(2)}
          </div>
          <div style={{ fontSize: '0.9rem', color: theme.textSecondary }}>
            {stats.vendasDia} vendas
          </div>
        </div>

        <div style={{
          background: theme.surfaceGradient,
          border: `1px solid ${theme.border}`,
          borderRadius: '12px',
          padding: '1.5rem'
        }}>
          <h3 style={{ margin: '0 0 0.5rem 0', color: theme.textSecondary }}>Este Mês</h3>
          <div style={{ fontSize: '1.8rem', fontWeight: '700', color: theme.accent }}>
            R$ {stats.totalMes.toFixed(2)}
          </div>
          <div style={{ fontSize: '0.9rem', color: theme.textSecondary }}>
            {stats.vendasMes} vendas
          </div>
        </div>
      </div>

      {/* Meta */}
      {metaMensal > 0 && (
        <div style={{
          background: theme.surfaceGradient,
          border: `1px solid ${theme.border}`,
          borderRadius: '12px',
          padding: '1.5rem',
          marginBottom: '2rem'
        }}>
          <h3 style={{ margin: '0 0 1rem 0' }}>Meta Mensal</h3>
          <div style={{ fontSize: '1.2rem', fontWeight: '600', marginBottom: '1rem' }}>
            R$ {stats.totalMes.toFixed(2)} / R$ {metaMensal.toFixed(2)}
          </div>
          <div style={{
            width: '100%',
            height: '8px',
            background: theme.borderLight,
            borderRadius: '4px',
            overflow: 'hidden'
          }}>
            <div style={{
              height: '100%',
              background: percentualMeta >= 100 ? theme.success : theme.accent,
              width: `${Math.min(percentualMeta, 100)}%`,
              transition: 'width 0.3s ease'
            }}></div>
          </div>
          <div style={{ 
            marginTop: '0.5rem', 
            fontSize: '1.1rem', 
            color: percentualMeta >= 100 ? theme.success : theme.text 
          }}>
            {percentualMeta.toFixed(1)}%
          </div>
        </div>
      )}

      {/* Vendas */}
      <div style={{
        background: theme.surfaceGradient,
        border: `1px solid ${theme.border}`,
        borderRadius: '12px',
        padding: '1.5rem'
      }}>
        <h3 style={{ margin: '0 0 1rem 0' }}>Minhas Vendas</h3>
        <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
          {vendas.length === 0 ? (
            <p style={{ color: theme.textSecondary, textAlign: 'center', padding: '2rem' }}>
              Nenhuma venda encontrada
            </p>
          ) : (
            vendas.map(venda => (
              <div key={venda.id} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '1rem',
                marginBottom: '0.5rem',
                background: theme.surface,
                border: `1px solid ${theme.borderLight}`,
                borderRadius: '8px'
              }}>
                <div>
                  <div style={{ fontWeight: '600' }}>{venda.numero_venda}</div>
                  <div style={{ fontSize: '0.9rem', color: theme.textSecondary }}>
                    {new Date(venda.data_venda).toLocaleDateString('pt-BR')} às{' '}
                    {new Date(venda.data_venda).toLocaleTimeString('pt-BR', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </div>
                  {venda.cliente_nome && (
                    <div style={{ fontSize: '0.9rem', color: theme.textSecondary }}>
                      Cliente: {venda.cliente_nome}
                    </div>
                  )}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ 
                    fontSize: '1.1rem', 
                    fontWeight: '600',
                    color: venda.forma_pagamento === 'pendente_caixa' ? theme.warning : theme.success
                  }}>
                    R$ {parseFloat(venda.valor_final).toFixed(2)}
                  </div>
                  <div style={{ 
                    fontSize: '0.8rem',
                    color: venda.forma_pagamento === 'pendente_caixa' ? theme.warning : theme.success
                  }}>
                    {venda.forma_pagamento === 'pendente_caixa' ? 'Pendente' : 'Finalizada'}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}