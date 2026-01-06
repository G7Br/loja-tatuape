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

export default function RelatorioBlackFridayMogi() {
  const [dados, setDados] = useState({
    vendas: [],
    metricas: {
      totalVendas: 0,
      totalItens: 0,
      valorTotal: 0,
      ticketMedio: 0
    },
    rankingVendedores: [],
    produtosMaisVendidos: []
  });
  const [loading, setLoading] = useState(true);
  const [diasDisponiveis, setDiasDisponiveis] = useState([]);
  const [dataSelecionada, setDataSelecionada] = useState('');

  useEffect(() => {
    carregarDiasDisponiveis();
  }, []);

  useEffect(() => {
    if (dataSelecionada) {
      carregarDados();
    }
  }, [dataSelecionada]);

  const carregarDiasDisponiveis = async () => {
    try {
      const { data: vendas, error } = await supabase
        .from('vendas_mogi')
        .select('data_venda')
        .neq('status', 'cancelada')
        .neq('forma_pagamento', 'pendente_caixa')
        .order('data_venda', { ascending: false });

      if (error) throw error;

      const diasUnicos = [...new Set(vendas.map(v => v.data_venda.split('T')[0]))]
        .sort((a, b) => new Date(b) - new Date(a));
      
      setDiasDisponiveis(diasUnicos);
      if (diasUnicos.length > 0) {
        setDataSelecionada(diasUnicos[0]);
      }
    } catch (error) {
      console.error('Erro ao carregar dias:', error);
    }
  };

  const carregarDados = async () => {
    try {
      setLoading(true);
      
      if (!dataSelecionada) return;
      
      const inicioData = `${dataSelecionada} 00:00:00`;
      const fimData = `${dataSelecionada} 23:59:59`;

      // Buscar vendas do dia
      const { data: vendas, error: vendasError } = await supabase
        .from('vendas_mogi')
        .select(`
          *,
          itens_venda_mogi(*)
        `)
        .gte('data_venda', inicioData)
        .lte('data_venda', fimData)
        .neq('status', 'cancelada')
        .neq('forma_pagamento', 'pendente_caixa');

      if (vendasError) throw vendasError;

      // Buscar dados dos vendedores (incluindo fotos)
      const { data: vendedoresData } = await supabase
        .from('usuarios_mogi')
        .select('nome, foto_url')
        .eq('tipo', 'vendedor');

      // Calcular métricas
      const totalVendas = vendas.length;
      const valorTotal = vendas.reduce((sum, v) => sum + parseFloat(v.valor_final || 0), 0);
      const totalItens = vendas.reduce((sum, v) => 
        sum + (v.itens_venda_mogi?.reduce((itemSum, item) => itemSum + item.quantidade, 0) || 0), 0
      );
      const ticketMedio = totalVendas > 0 ? valorTotal / totalVendas : 0;

      // Ranking de vendedores
      const vendedoresMap = {};
      vendas.forEach(venda => {
        const vendedor = venda.vendedor_nome || 'Sem vendedor';
        if (!vendedoresMap[vendedor]) {
          // Buscar foto do vendedor
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
      vendas.forEach(venda => {
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
        .slice(0, 10);

      setDados({
        vendas,
        metricas: {
          totalVendas,
          totalItens,
          valorTotal,
          ticketMedio
        },
        rankingVendedores,
        produtosMaisVendidos
      });

    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      alert('Erro ao carregar relatório: ' + error.message);
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

  if (loading) {
    return (
      <Container>
        <LoadingSpinner>
          🔄 Carregando relatório...
        </LoadingSpinner>
      </Container>
    );
  }

  return (
    <Container>
      <Header>
        <Title>🛍️ RELATÓRIO DE VENDAS - MOGI</Title>
        <PrintButton onClick={() => window.print()}>
          🖨️ Imprimir Relatório
        </PrintButton>
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '10px', color: '#000000' }}>Selecionar Data:</label>
          <select
            value={dataSelecionada}
            onChange={(e) => setDataSelecionada(e.target.value)}
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
            <option value="">Escolha uma data...</option>
            {diasDisponiveis.map(dia => {
              const data = new Date(dia + 'T12:00:00');
              const diaSemana = data.toLocaleDateString('pt-BR', { weekday: 'long' });
              const dataFormatada = data.toLocaleDateString('pt-BR');
              return (
                <option key={dia} value={dia}>
                  {dataFormatada} ({diaSemana})
                </option>
              );
            })}
          </select>
        </div>
        {dataSelecionada && (
          <Subtitle>
            Vendas do dia {new Date(dataSelecionada + 'T12:00:00').toLocaleDateString('pt-BR', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
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
            </tr>
          </thead>
          <tbody>
            {dados.produtosMaisVendidos.map((produto, index) => (
              <tr key={produto.nome}>
                <Td style={{ fontWeight: 'bold', color: '#000000' }}>{index + 1}º</Td>
                <Td>{produto.nome}</Td>
                <Td>{produto.quantidade}</Td>
                <Td>{formatarMoeda(produto.valor)}</Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>

      {/* Todas as Vendas */}
      <div>
        <h3 style={{ color: '#000000', marginBottom: '20px' }}>📋 TODAS AS VENDAS DO DIA</h3>
        <Table>
          <thead>
            <tr>
              <Th>Venda</Th>
              <Th>Vendedor</Th>
              <Th>Cliente</Th>
              <Th>Produtos</Th>
              <Th>Valor</Th>
            </tr>
          </thead>
          <tbody>
            {dados.vendas
              .sort((a, b) => (a.cliente_nome || 'ZZZ').localeCompare(b.cliente_nome || 'ZZZ'))
              .map((venda) => (
              <tr key={venda.id}>
                <Td>{venda.numero_venda}</Td>
                <Td>{venda.vendedor_nome || 'N/A'}</Td>
                <Td>{venda.cliente_nome || 'N/A'}</Td>
                <Td>
                  {venda.itens_venda_mogi?.map(item => 
                    `${item.quantidade}x ${item.produto_nome}`
                  ).join(', ') || 'N/A'}
                </Td>
                <Td style={{ fontWeight: 'bold', color: '#000000' }}>
                  {formatarMoeda(venda.valor_final)}
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
    </Container>
  );
}