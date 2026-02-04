import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { supabase } from '../../utils/supabase';

const Container = styled.div`
  padding: 20px;
  background: #ffffff;
  border-radius: 12px;
  color: #000000;
  margin-bottom: 20px;
  border: 1px solid #e5e7eb;
  
  @media print {
    background: white;
    color: black;
    border: none;
    box-shadow: none;
  }
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 30px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  
  @media print {
    background: white;
    border: 1px solid black;
  }
`;

const Title = styled.h2`
  color: #000000;
  font-size: 2rem;
  margin-bottom: 10px;
  font-weight: bold;
`;

const Subtitle = styled.p`
  color: #666666;
  font-size: 1.1rem;
`;

const MetricsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
`;

const MetricCard = styled.div`
  background: #ffffff;
  border: 2px solid #000000;
  border-radius: 10px;
  padding: 20px;
  text-align: center;
`;

const MetricValue = styled.div`
  font-size: 2rem;
  font-weight: bold;
  color: #000000;
  margin-bottom: 5px;
`;

const MetricLabel = styled.div`
  color: #666666;
  font-size: 0.9rem;
  text-transform: uppercase;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  background: #ffffff;
  border: 1px solid #000000;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 30px;
`;

const Th = styled.th`
  background: #000000;
  color: white;
  padding: 15px;
  text-align: left;
  font-weight: bold;
`;

const Td = styled.td`
  padding: 12px 15px;
  border-bottom: 1px solid #e5e7eb;
  color: #000000;
`;

const RankingCard = styled.div`
  background: #ffffff;
  border: 2px solid ${props => props.position === 1 ? '#000000' : props.position === 2 ? '#666666' : '#999999'};
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 15px;
  display: flex;
  align-items: center;
  gap: 20px;
`;

const Position = styled.div`
  font-size: 2rem;
  font-weight: bold;
  color: ${props => props.position === 1 ? '#000000' : props.position === 2 ? '#333333' : '#666666'};
  min-width: 50px;
`;

const VendedorInfo = styled.div`
  flex: 1;
`;

const VendedorNome = styled.div`
  font-size: 1.2rem;
  font-weight: bold;
  color: #000000;
  margin-bottom: 5px;
`;

const VendedorStats = styled.div`
  color: #666666;
  font-size: 0.9rem;
`;

const LoadingSpinner = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  font-size: 1.2rem;
  color: #666666;
`;

const PrintButton = styled.button`
  background: #000000;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: bold;
  cursor: pointer;
  margin-bottom: 20px;
  
  &:hover {
    background: #333333;
  }
  
  @media print {
    display: none;
  }
`;

export default function RelatorioMensalMogi() {
  const [dados, setDados] = useState({
    vendas: [],
    metricas: {
      totalVendas: 0,
      totalItens: 0,
      valorTotal: 0,
      ticketMedio: 0
    },
    rankingVendedores: [],
    produtosMaisVendidos: [],
    vendasPorDia: [],
    formasPagamento: {}
  });
  const [loading, setLoading] = useState(true);
  const [mesesDisponiveis, setMesesDisponiveis] = useState([]);
  const [mesSelecionado, setMesSelecionado] = useState('');

  useEffect(() => {
    carregarMesesDisponiveis();
  }, []);

  useEffect(() => {
    if (mesSelecionado) {
      carregarDados();
    }
  }, [mesSelecionado]);

  const carregarMesesDisponiveis = async () => {
    try {
      const { data: vendas, error } = await supabase
        .from('vendas_mogi')
        .select('created_at')
        .neq('status', 'cancelada')
        .neq('forma_pagamento', 'pendente_caixa')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const mesesUnicos = [...new Set(vendas.map(v => {
        const data = new Date(v.created_at);
        return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}`;
      }))].sort((a, b) => b.localeCompare(a));
      
      setMesesDisponiveis(mesesUnicos);
      if (mesesUnicos.length > 0) {
        setMesSelecionado(mesesUnicos[0]);
      }
    } catch (error) {
      console.error('Erro ao carregar meses:', error);
    }
  };

  const carregarDados = async () => {
    try {
      setLoading(true);
      
      if (!mesSelecionado) return;
      
      const [ano, mes] = mesSelecionado.split('-');
      const inicioMes = new Date(ano, mes - 1, 1);
      const fimMes = new Date(ano, mes, 0, 23, 59, 59);
      
      console.log('Carregando dados do mês Mogi:', inicioMes, 'até', fimMes);

      // Buscar vendas do mês - usando created_at para Mogi
      const { data: vendas, error: vendasError } = await supabase
        .from('vendas_mogi')
        .select('*')
        .gte('created_at', inicioMes.toISOString())
        .lte('created_at', fimMes.toISOString())
        .neq('status', 'cancelada')
        .neq('forma_pagamento', 'pendente_caixa');

      if (vendasError) throw vendasError;

      // Buscar itens das vendas separadamente
      const vendasIds = vendas?.map(v => v.id) || [];
      const { data: itensVenda, error: itensError } = await supabase
        .from('itens_venda_mogi')
        .select('*')
        .in('venda_id', vendasIds);

      if (itensError) console.error('Erro ao carregar itens:', itensError);

      // Associar itens às vendas
      const vendasComItens = vendas?.map(v => ({
        ...v,
        itens_venda_mogi: itensVenda?.filter(i => i.venda_id === v.id) || []
      })) || [];

      // Buscar dados dos vendedores (incluindo fotos)
      const { data: vendedoresData } = await supabase
        .from('usuarios_mogi')
        .select('nome, foto_url')
        .eq('tipo', 'vendedor');

      // Calcular métricas
      const totalVendas = vendasComItens.length;
      const valorTotal = vendasComItens.reduce((sum, v) => sum + parseFloat(v.valor_final || 0), 0);
      const totalItens = vendasComItens.reduce((sum, v) => 
        sum + (v.itens_venda_mogi?.reduce((itemSum, item) => itemSum + item.quantidade, 0) || 0), 0
      );
      const ticketMedio = totalVendas > 0 ? valorTotal / totalVendas : 0;

      // Ranking de vendedores
      const vendedoresMap = {};
      vendasComItens.forEach(venda => {
        const vendedor = venda.vendedor_nome || 'Sem vendedor';
        if (!vendedoresMap[vendedor]) {
          const vendedorInfo = vendedoresData?.find(v => v.nome === vendedor);
          vendedoresMap[vendedor] = {
            nome: vendedor,
            vendas: 0,
            valor: 0,
            itens: 0,
            foto_url: vendedorInfo?.foto_url || null
          };
        }
        vendedoresMap[vendedor].vendas++;
        vendedoresMap[vendedor].valor += parseFloat(venda.valor_final || 0);
        vendedoresMap[vendedor].itens += venda.itens_venda_mogi?.reduce((sum, item) => sum + item.quantidade, 0) || 0;
      });

      const rankingVendedores = Object.values(vendedoresMap)
        .sort((a, b) => b.valor - a.valor)
        .slice(0, 10);

      // Produtos mais vendidos
      const produtosMap = {};
      vendasComItens.forEach(venda => {
        venda.itens_venda_mogi?.forEach(item => {
          const produto = item.produto_nome;
          if (!produtosMap[produto]) {
            produtosMap[produto] = {
              nome: produto,
              quantidade: 0,
              valor: 0
            };
          }
          produtosMap[produto].quantidade += item.quantidade;
          produtosMap[produto].valor += parseFloat(item.subtotal || 0);
        });
      });

      const produtosMaisVendidos = Object.values(produtosMap)
        .sort((a, b) => b.quantidade - a.quantidade)
        .slice(0, 15);

      // Vendas por dia do mês
      const vendasPorDiaMap = {};
      vendasComItens.forEach(venda => {
        const dia = new Date(venda.created_at).getDate();
        if (!vendasPorDiaMap[dia]) {
          vendasPorDiaMap[dia] = { dia, vendas: 0, valor: 0 };
        }
        vendasPorDiaMap[dia].vendas++;
        vendasPorDiaMap[dia].valor += parseFloat(venda.valor_final || 0);
      });

      const vendasPorDia = Object.values(vendasPorDiaMap)
        .sort((a, b) => a.dia - b.dia);

      // Formas de pagamento
      const formasPagamento = {};
      vendasComItens.forEach(venda => {
        const forma = venda.forma_pagamento || 'Não informado';
        if (forma.includes('|')) {
          // Pagamento misto
          forma.split('|').forEach(f => {
            const [tipo, valor] = f.split(':');
            const valorNumerico = parseFloat(valor || 0);
            formasPagamento[tipo] = (formasPagamento[tipo] || 0) + valorNumerico;
          });
        } else {
          const valor = parseFloat(venda.valor_final || 0);
          formasPagamento[forma] = (formasPagamento[forma] || 0) + valor;
        }
      });

      setDados({
        vendas: vendasComItens,
        metricas: {
          totalVendas,
          totalItens,
          valorTotal,
          ticketMedio
        },
        rankingVendedores,
        produtosMaisVendidos,
        vendasPorDia,
        formasPagamento
      });

    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      setDados({
        vendas: [],
        metricas: { totalVendas: 0, totalItens: 0, valorTotal: 0, ticketMedio: 0 },
        rankingVendedores: [],
        produtosMaisVendidos: [],
        vendasPorDia: [],
        formasPagamento: {}
      });
    } finally {
      setLoading(false);
    }
  };

  const formatarMoeda = (valor) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor || 0);
  };

  const formatarMes = (mesAno) => {
    const [ano, mes] = mesAno.split('-');
    const data = new Date(ano, mes - 1);
    return data.toLocaleDateString('pt-BR', { year: 'numeric', month: 'long' });
  };

  if (loading) {
    return (
      <Container>
        <LoadingSpinner>
          🔄 Carregando relatório mensal...
        </LoadingSpinner>
      </Container>
    );
  }

  return (
    <Container>
      <Header>
        <Title>📊 RELATÓRIO MENSAL - MOGI</Title>
        <PrintButton onClick={() => window.print()}>
          🖨️ Imprimir Relatório
        </PrintButton>
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '10px', color: '#000000' }}>Selecionar Mês:</label>
          <select
            value={mesSelecionado}
            onChange={(e) => setMesSelecionado(e.target.value)}
            style={{
              padding: '10px 15px',
              borderRadius: '8px',
              border: '2px solid #000000',
              background: '#ffffff',
              color: '#000000',
              fontSize: '16px',
              minWidth: '200px'
            }}
          >
            <option value="">Escolha um mês...</option>
            {mesesDisponiveis.map(mes => (
              <option key={mes} value={mes}>
                {formatarMes(mes)}
              </option>
            ))}
          </select>
        </div>
        {mesSelecionado && (
          <Subtitle>
            Relatório completo de {formatarMes(mesSelecionado)}
          </Subtitle>
        )}
      </Header>

      {/* Métricas Principais */}
      <MetricsGrid>
        <MetricCard>
          <MetricValue>{dados.metricas.totalVendas}</MetricValue>
          <MetricLabel>Total de Vendas</MetricLabel>
        </MetricCard>
        <MetricCard>
          <MetricValue>{dados.metricas.totalItens}</MetricValue>
          <MetricLabel>Itens Vendidos</MetricLabel>
        </MetricCard>
        <MetricCard>
          <MetricValue>{formatarMoeda(dados.metricas.valorTotal)}</MetricValue>
          <MetricLabel>Faturamento Total</MetricLabel>
        </MetricCard>
        <MetricCard>
          <MetricValue>{formatarMoeda(dados.metricas.ticketMedio)}</MetricValue>
          <MetricLabel>Ticket Médio</MetricLabel>
        </MetricCard>
      </MetricsGrid>

      {/* Formas de Pagamento */}
      <div style={{ marginBottom: '30px' }}>
        <h3 style={{ color: '#000000', marginBottom: '20px' }}>💳 VENDAS POR FORMA DE PAGAMENTO</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
          {Object.entries(dados.formasPagamento)
            .sort(([,a], [,b]) => b - a)
            .map(([forma, valor]) => {
              const percentual = dados.metricas.valorTotal > 0 ? (valor / dados.metricas.valorTotal * 100) : 0;
              return (
                <div key={forma} style={{
                  background: '#f8f9fa',
                  border: '1px solid #000000',
                  borderRadius: '8px',
                  padding: '15px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#000000' }}>
                    {formatarMoeda(valor)}
                  </div>
                  <div style={{ fontSize: '0.9rem', color: '#666666', marginBottom: '5px' }}>
                    {forma.replace('_', ' ').toUpperCase()}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#999999' }}>
                    {percentual.toFixed(1)}% do total
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* Ranking de Vendedores */}
      <div style={{ marginBottom: '30px' }}>
        <h3 style={{ color: '#000000', marginBottom: '20px' }}>🏆 RANKING DE VENDEDORES</h3>
        {dados.rankingVendedores.map((vendedor, index) => (
          <RankingCard key={vendedor.nome} position={index + 1}>
            <Position position={index + 1}>{index + 1}º</Position>
            
            {/* Foto do vendedor */}
            <div style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              overflow: 'hidden',
              border: '2px solid #000000',
              marginRight: '15px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#f5f5f5',
              flexShrink: 0
            }}>
              {vendedor.foto_url ? (
                <img 
                  src={vendedor.foto_url} 
                  alt={vendedor.nome}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
              ) : null}
              <span style={{ 
                fontSize: '1.5rem', 
                color: '#666',
                display: vendedor.foto_url ? 'none' : 'flex'
              }}>👤</span>
            </div>
            
            <VendedorInfo>
              <VendedorNome>{vendedor.nome}</VendedorNome>
              <VendedorStats>
                {vendedor.vendas} vendas • {formatarMoeda(vendedor.valor)} • {vendedor.itens} itens
              </VendedorStats>
            </VendedorInfo>
          </RankingCard>
        ))}
      </div>

      {/* Produtos Mais Vendidos */}
      <div style={{ marginBottom: '30px' }}>
        <h3 style={{ color: '#000000', marginBottom: '20px' }}>📦 PRODUTOS MAIS VENDIDOS</h3>
        <Table>
          <thead>
            <tr>
              <Th>Posição</Th>
              <Th>Produto</Th>
              <Th>Quantidade</Th>
              <Th>Valor Total</Th>
              <Th>% do Faturamento</Th>
            </tr>
          </thead>
          <tbody>
            {dados.produtosMaisVendidos.map((produto, index) => {
              const percentual = dados.metricas.valorTotal > 0 ? (produto.valor / dados.metricas.valorTotal * 100) : 0;
              return (
                <tr key={produto.nome}>
                  <Td style={{ fontWeight: 'bold', color: '#000000' }}>{index + 1}º</Td>
                  <Td>{produto.nome}</Td>
                  <Td>{produto.quantidade}</Td>
                  <Td>{formatarMoeda(produto.valor)}</Td>
                  <Td>{percentual.toFixed(1)}%</Td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      </div>

      {/* Vendas por Dia */}
      <div style={{ marginBottom: '30px' }}>
        <h3 style={{ color: '#000000', marginBottom: '20px' }}>📅 VENDAS POR DIA DO MÊS</h3>
        <Table>
          <thead>
            <tr>
              <Th>Dia</Th>
              <Th>Vendas</Th>
              <Th>Valor</Th>
              <Th>Ticket Médio</Th>
            </tr>
          </thead>
          <tbody>
            {dados.vendasPorDia.map((dia) => (
              <tr key={dia.dia}>
                <Td style={{ fontWeight: 'bold' }}>Dia {dia.dia}</Td>
                <Td>{dia.vendas}</Td>
                <Td>{formatarMoeda(dia.valor)}</Td>
                <Td>{formatarMoeda(dia.vendas > 0 ? dia.valor / dia.vendas : 0)}</Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
    </Container>
  );
}