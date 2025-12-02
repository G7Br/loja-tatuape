import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { supabase } from '../../utils/supabaseMogi';
import { formatBrasiliaDateTime, formatCurrency } from '../../utils/dateUtils';

const Container = styled.div`
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
`;

const Card = styled.div.withConfig({
  shouldForwardProp: (prop) => !['darkMode'].includes(prop)
})`
  background: ${props => props.darkMode ? '#1a1a1a' : '#ffffff'};
  border-radius: 1rem;
  padding: 2rem;
  margin-bottom: 2rem;
  border: 1px solid ${props => props.darkMode ? '#333' : '#e5e7eb'};
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
`;

const Table = styled.div.withConfig({
  shouldForwardProp: (prop) => !['darkMode'].includes(prop)
})`
  background: ${props => props.darkMode ? '#1a1a1a' : '#ffffff'};
  border-radius: 0.5rem;
  border: 1px solid ${props => props.darkMode ? '#333' : '#e5e7eb'};
  overflow: hidden;
`;

const TableHeader = styled.div.withConfig({
  shouldForwardProp: (prop) => !['darkMode'].includes(prop)
})`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1fr 1fr 1fr;
  gap: 1rem;
  padding: 1rem;
  background: ${props => props.darkMode ? '#2a2a2a' : '#f9fafb'};
  font-weight: 600;
  border-bottom: 1px solid ${props => props.darkMode ? '#333' : '#e5e7eb'};
`;

const TableRow = styled.div.withConfig({
  shouldForwardProp: (prop) => !['darkMode'].includes(prop)
})`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1fr 1fr 1fr;
  gap: 1rem;
  padding: 1rem;
  border-bottom: 1px solid ${props => props.darkMode ? '#333' : '#e5e7eb'};
  transition: background 0.2s ease;
  
  &:hover {
    background: ${props => props.darkMode ? '#2a2a2a' : '#f9fafb'};
  }
  
  &:last-child {
    border-bottom: none;
  }
`;

const StatusBadge = styled.span`
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.8rem;
  font-weight: 600;
  background: ${props => props.status === 'aberto' ? '#10b981' : '#6b7280'};
  color: white;
`;

export default function HistoricoCaixaMogi({ user, darkMode }) {
  const [historico, setHistorico] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarHistorico();
  }, []);

  const carregarHistorico = async () => {
    try {
      const { data, error } = await supabase
        .from('fechamentos_caixa_mogi')
        .select('*')
        .order('data_fechamento', { ascending: false })
        .limit(50);

      if (error) throw error;

      setHistorico(data || []);
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Container>
        <div style={{ textAlign: 'center', padding: '4rem', color: '#888' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⏳</div>
          <h3>Carregando histórico...</h3>
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <Card darkMode={darkMode}>
        <h2 style={{ color: darkMode ? '#fff' : '#000', marginBottom: '1.5rem' }}>
          📊 Histórico de Caixa - Mogi das Cruzes
        </h2>
        
        {historico.length > 0 ? (
          <Table darkMode={darkMode}>
            <TableHeader darkMode={darkMode}>
              <div>DATA</div>
              <div>VALOR INICIAL</div>
              <div>TOTAL VENDAS</div>
              <div>SAÍDAS</div>
              <div>VALOR FINAL</div>
              <div>STATUS</div>
            </TableHeader>
            
            {historico.map(registro => (
              <TableRow key={registro.id} darkMode={darkMode}>
                <div style={{ color: darkMode ? '#fff' : '#000' }}>
                  {formatBrasiliaDateTime(registro.data_fechamento).split(' ')[0]}
                </div>
                <div style={{ color: '#3b82f6', fontWeight: '600' }}>
                  {formatCurrency(registro.valor_inicial)}
                </div>
                <div style={{ color: '#10b981', fontWeight: '600' }}>
                  {formatCurrency(registro.total_vendas || 0)}
                </div>
                <div style={{ color: '#ef4444', fontWeight: '600' }}>
                  {formatCurrency(registro.sangrias || 0)}
                </div>
                <div style={{ color: '#f59e0b', fontWeight: '700' }}>
                  {formatCurrency(registro.valor_final || 0)}
                </div>
                <div>
                  <StatusBadge status={registro.status}>
                    {registro.status === 'aberto' ? '🔓 ABERTO' : '🔒 FECHADO'}
                  </StatusBadge>
                </div>
              </TableRow>
            ))}
          </Table>
        ) : (
          <div style={{ textAlign: 'center', padding: '4rem', color: '#888' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📋</div>
            <h3>Nenhum registro encontrado</h3>
            <p>O histórico de caixa aparecerá aqui conforme você usar o sistema.</p>
          </div>
        )}
      </Card>
    </Container>
  );
}