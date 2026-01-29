import React, { useState, useEffect } from 'react';
import { queryWithStoreMogi } from '../../utils/supabaseMogi';
import { formatCurrency, formatBrasiliaDateTime } from '../../utils/dateUtils';

export default function HistoricoDevolucoesMogi({ darkMode }) {
  const [devolucoes, setDevolucoes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarDevolucoes();
  }, []);

  const carregarDevolucoes = async () => {
    try {
      const { data } = await queryWithStoreMogi('devolucoes')
        .select(`
          *,
          itens_devolucao_mogi (*)
        `)
        .order('data_devolucao', { ascending: false })
        .limit(50);
      
      setDevolucoes(data || []);
    } catch (error) {
      console.error('Erro ao carregar devoluções:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem', color: '#888' }}>
        Carregando histórico de devoluções...
      </div>
    );
  }

  return (
    <div>
      <h3 style={{ color: darkMode ? '#fff' : '#000', marginBottom: '1rem' }}>
        📋 Histórico de Devoluções - Mogi
      </h3>
      
      {devolucoes.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#888' }}>
          Nenhuma devolução encontrada
        </div>
      ) : (
        <div style={{
          background: darkMode ? '#1a1a1a' : '#ffffff',
          borderRadius: '0.5rem',
          border: `1px solid ${darkMode ? '#333' : '#e5e7eb'}`,
          overflow: 'hidden'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr 1fr',
            gap: '1rem',
            padding: '1rem',
            background: darkMode ? '#2a2a2a' : '#f9fafb',
            fontWeight: '600',
            borderBottom: `1px solid ${darkMode ? '#333' : '#e5e7eb'}`
          }}>
            <div>NÚMERO</div>
            <div>TIPO</div>
            <div>VALOR</div>
            <div>ITENS</div>
            <div>DATA</div>
            <div>STATUS</div>
          </div>
          
          {devolucoes.map(devolucao => (
            <div
              key={devolucao.id}
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr 1fr',
                gap: '1rem',
                padding: '1rem',
                borderBottom: `1px solid ${darkMode ? '#333' : '#e5e7eb'}`,
                transition: 'background 0.2s ease'
              }}
              onMouseEnter={(e) => e.target.style.background = darkMode ? '#2a2a2a' : '#f9fafb'}
              onMouseLeave={(e) => e.target.style.background = 'transparent'}
            >
              <div style={{ color: darkMode ? '#fff' : '#000', fontWeight: '600' }}>
                {devolucao.numero_devolucao}
              </div>
              <div>
                <span style={{
                  padding: '0.25rem 0.5rem',
                  borderRadius: '0.25rem',
                  fontSize: '0.8rem',
                  fontWeight: '600',
                  background: devolucao.tipo === 'integral' ? '#ef4444' : 
                           devolucao.tipo === 'parcial' ? '#f59e0b' : '#3b82f6',
                  color: 'white'
                }}>
                  {devolucao.tipo === 'integral' ? 'INTEGRAL' : 
                   devolucao.tipo === 'parcial' ? 'PARCIAL' : 'TROCA'}
                </span>
              </div>
              <div style={{ color: '#ef4444', fontWeight: '600' }}>
                {formatCurrency(devolucao.valor_devolvido)}
              </div>
              <div style={{ color: darkMode ? '#ccc' : '#666' }}>
                {devolucao.itens_devolucao_mogi?.length || 0} itens
              </div>
              <div style={{ color: darkMode ? '#ccc' : '#666', fontSize: '0.9rem' }}>
                {formatBrasiliaDateTime(devolucao.data_devolucao).split(' ')[0]}
              </div>
              <div>
                <span style={{
                  padding: '0.25rem 0.5rem',
                  borderRadius: '0.25rem',
                  fontSize: '0.8rem',
                  fontWeight: '600',
                  background: '#10b981',
                  color: 'white'
                }}>
                  PROCESSADA
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}