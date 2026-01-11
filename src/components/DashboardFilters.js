import React, { useState } from 'react';
import styled from 'styled-components';

const FilterContainer = styled.div`
  background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
  border: 1px solid #404040;
  border-radius: 16px;
  padding: 25px;
  margin-bottom: 20px;
  color: #ffffff;
`;

const FilterGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
  margin-bottom: 20px;
`;

const FilterGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const FilterLabel = styled.label`
  font-size: 0.9rem;
  font-weight: 600;
  color: #cccccc;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const FilterSelect = styled.select`
  padding: 12px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid #333333;
  border-radius: 8px;
  color: #ffffff;
  font-size: 14px;
  
  option {
    background: #333333;
    color: #ffffff;
  }
  
  &:focus {
    outline: none;
    border-color: #555555;
  }
`;

const FilterInput = styled.input`
  padding: 12px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid #333333;
  border-radius: 8px;
  color: #ffffff;
  font-size: 14px;
  
  &::placeholder {
    color: #888888;
  }
  
  &:focus {
    outline: none;
    border-color: #555555;
  }
`;

const FilterButton = styled.button`
  padding: 12px 20px;
  background: ${props => props.active ? '#10b981' : '#333333'};
  color: #ffffff;
  border: 1px solid ${props => props.active ? '#10b981' : '#666666'};
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
  font-size: 12px;
  text-transform: uppercase;
  
  &:hover {
    background: ${props => props.active ? '#0d9668' : '#555555'};
  }
`;

const FilterActions = styled.div`
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  padding-top: 15px;
  border-top: 1px solid #333333;
`;

const QuickFilters = styled.div`
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 20px;
`;

export default function DashboardFilters({ onFilterChange, dadosConsolidados }) {
  const [filtros, setFiltros] = useState({
    periodo: 'mes_atual',
    loja: 'todas',
    vendedor: 'todos',
    forma_pagamento: 'todas',
    data_inicio: '',
    data_fim: '',
    valor_minimo: '',
    valor_maximo: ''
  });

  const [filtroRapido, setFiltroRapido] = useState('mes_atual');

  const aplicarFiltro = () => {
    onFilterChange(filtros);
  };

  const limparFiltros = () => {
    const filtrosLimpos = {
      periodo: 'mes_atual',
      loja: 'todas',
      vendedor: 'todos',
      forma_pagamento: 'todas',
      data_inicio: '',
      data_fim: '',
      valor_minimo: '',
      valor_maximo: ''
    };
    setFiltros(filtrosLimpos);
    setFiltroRapido('mes_atual');
    onFilterChange(filtrosLimpos);
  };

  const aplicarFiltroRapido = (periodo) => {
    setFiltroRapido(periodo);
    const hoje = new Date();
    let novosFiltros = { ...filtros, periodo };

    switch (periodo) {
      case 'hoje':
        novosFiltros.data_inicio = hoje.toISOString().split('T')[0];
        novosFiltros.data_fim = hoje.toISOString().split('T')[0];
        break;
      case 'semana':
        const inicioSemana = new Date(hoje);
        inicioSemana.setDate(hoje.getDate() - hoje.getDay());
        novosFiltros.data_inicio = inicioSemana.toISOString().split('T')[0];
        novosFiltros.data_fim = hoje.toISOString().split('T')[0];
        break;
      case 'mes_atual':
        const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
        novosFiltros.data_inicio = inicioMes.toISOString().split('T')[0];
        novosFiltros.data_fim = hoje.toISOString().split('T')[0];
        break;
      case 'mes_passado':
        const inicioMesPassado = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1);
        const fimMesPassado = new Date(hoje.getFullYear(), hoje.getMonth(), 0);
        novosFiltros.data_inicio = inicioMesPassado.toISOString().split('T')[0];
        novosFiltros.data_fim = fimMesPassado.toISOString().split('T')[0];
        break;
      case 'ultimos_30':
        const inicio30Dias = new Date(hoje);
        inicio30Dias.setDate(hoje.getDate() - 30);
        novosFiltros.data_inicio = inicio30Dias.toISOString().split('T')[0];
        novosFiltros.data_fim = hoje.toISOString().split('T')[0];
        break;
      default:
        break;
    }

    setFiltros(novosFiltros);
    onFilterChange(novosFiltros);
  };

  // Extrair vendedores únicos
  const vendedores = [...new Set([
    ...dadosConsolidados.tatuape.vendas.map(v => v.vendedor_nome),
    ...dadosConsolidados.mogi.vendas.map(v => v.vendedor_nome)
  ])].filter(Boolean);

  // Extrair formas de pagamento únicas
  const formasPagamento = [...new Set([
    ...dadosConsolidados.tatuape.vendas.map(v => v.forma_pagamento),
    ...dadosConsolidados.mogi.vendas.map(v => v.forma_pagamento)
  ])].filter(Boolean);

  return (
    <FilterContainer>
      <h3 style={{ marginBottom: '20px', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '10px' }}>
        🔍 Filtros Avançados
        <span style={{ fontSize: '0.8rem', color: '#999', fontWeight: 'normal' }}>
          Personalize sua análise
        </span>
      </h3>

      {/* Filtros Rápidos */}
      <div style={{ marginBottom: '20px' }}>
        <FilterLabel style={{ marginBottom: '10px' }}>⚡ Filtros Rápidos</FilterLabel>
        <QuickFilters>
          {[
            { key: 'hoje', label: 'Hoje' },
            { key: 'semana', label: 'Esta Semana' },
            { key: 'mes_atual', label: 'Mês Atual' },
            { key: 'mes_passado', label: 'Mês Passado' },
            { key: 'ultimos_30', label: 'Últimos 30 Dias' }
          ].map(opcao => (
            <FilterButton
              key={opcao.key}
              active={filtroRapido === opcao.key}
              onClick={() => aplicarFiltroRapido(opcao.key)}
            >
              {opcao.label}
            </FilterButton>
          ))}
        </QuickFilters>
      </div>

      {/* Filtros Detalhados */}
      <FilterGrid>
        <FilterGroup>
          <FilterLabel>🏢 Loja</FilterLabel>
          <FilterSelect
            value={filtros.loja}
            onChange={(e) => setFiltros({ ...filtros, loja: e.target.value })}
          >
            <option value="todas">Todas as Lojas</option>
            <option value="tatuape">Tatuapé</option>
            <option value="mogi">Mogi das Cruzes</option>
          </FilterSelect>
        </FilterGroup>

        <FilterGroup>
          <FilterLabel>👤 Vendedor</FilterLabel>
          <FilterSelect
            value={filtros.vendedor}
            onChange={(e) => setFiltros({ ...filtros, vendedor: e.target.value })}
          >
            <option value="todos">Todos os Vendedores</option>
            {vendedores.map(vendedor => (
              <option key={vendedor} value={vendedor}>{vendedor}</option>
            ))}
          </FilterSelect>
        </FilterGroup>

        <FilterGroup>
          <FilterLabel>💳 Forma de Pagamento</FilterLabel>
          <FilterSelect
            value={filtros.forma_pagamento}
            onChange={(e) => setFiltros({ ...filtros, forma_pagamento: e.target.value })}
          >
            <option value="todas">Todas as Formas</option>
            {formasPagamento.map(forma => (
              <option key={forma} value={forma}>{forma}</option>
            ))}
          </FilterSelect>
        </FilterGroup>

        <FilterGroup>
          <FilterLabel>📅 Data Início</FilterLabel>
          <FilterInput
            type="date"
            value={filtros.data_inicio}
            onChange={(e) => setFiltros({ ...filtros, data_inicio: e.target.value })}
          />
        </FilterGroup>

        <FilterGroup>
          <FilterLabel>📅 Data Fim</FilterLabel>
          <FilterInput
            type="date"
            value={filtros.data_fim}
            onChange={(e) => setFiltros({ ...filtros, data_fim: e.target.value })}
          />
        </FilterGroup>

        <FilterGroup>
          <FilterLabel>💰 Valor Mínimo</FilterLabel>
          <FilterInput
            type="number"
            step="0.01"
            placeholder="R$ 0,00"
            value={filtros.valor_minimo}
            onChange={(e) => setFiltros({ ...filtros, valor_minimo: e.target.value })}
          />
        </FilterGroup>

        <FilterGroup>
          <FilterLabel>💰 Valor Máximo</FilterLabel>
          <FilterInput
            type="number"
            step="0.01"
            placeholder="R$ 999.999,99"
            value={filtros.valor_maximo}
            onChange={(e) => setFiltros({ ...filtros, valor_maximo: e.target.value })}
          />
        </FilterGroup>
      </FilterGrid>

      <FilterActions>
        <FilterButton onClick={limparFiltros}>
          🗑️ Limpar Filtros
        </FilterButton>
        <FilterButton active onClick={aplicarFiltro}>
          ✅ Aplicar Filtros
        </FilterButton>
      </FilterActions>
    </FilterContainer>
  );
}