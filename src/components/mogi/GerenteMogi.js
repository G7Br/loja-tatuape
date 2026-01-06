// CÓDIGO COPIADO EXATAMENTE DO SISTEMA PRINCIPAL
// Apenas adaptado para usar tabelas independentes _mogi

import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { supabase } from '../../utils/supabase';
import * as XLSX from 'xlsx';
import GerenciarFotosVendedores from '../GerenciarFotosVendedores';
import GeradorQRCode from '../GeradorQRCode';
import GeradorQRCodeLote from '../GeradorQRCodeLote';
import RelatorioBlackFridayMogi from './RelatorioBlackFridayMogi';
import TrocarSenhaUsuarios from '../../../ferramentas/TrocarSenhaUsuarios';

// Helper para queries Mogi
const queryWithStoreMogi = (table) => supabase.from(`${table}_mogi`);

// MESMOS ESTILOS DO SISTEMA PRINCIPAL
const Container = styled.div`
  width: 100%;
  max-width: 100vw;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  color: #ffffff;
  background: #000000;
  overflow-x: hidden;
  position: relative;
`;

const Header = styled.div`
  background: #000000;
  border-bottom: 1px solid #333333;
  padding: 15px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
  z-index: 10;
`;

const Logo = styled.div`
  color: #ffffff;
  font-size: 1.5rem;
  font-weight: 700;
  letter-spacing: 1px;
`;

const UserInfo = styled.div`
  color: #ffffff;
  margin-top: 5px;
`;

const LogoutButton = styled.button`
  background: #333333;
  color: #ffffff;
  border: 1px solid #666666;
  padding: 12px 24px;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
  &:hover { 
    background: #555555;
  }
`;

const TabContainer = styled.div`
  display: flex;
  padding: 0 20px;
  margin-bottom: 0;
  border-bottom: 1px solid #333333;
  background: #111111;
  overflow-x: auto;
`;

const Tab = styled.button`
  padding: 15px 20px;
  background: ${props => props.$active ? '#333333' : 'transparent'};
  color: ${props => props.$active ? '#ffffff' : '#cccccc'};
  border: none;
  border-bottom: ${props => props.$active ? '3px solid #ffffff' : '3px solid transparent'};
  font-weight: 600;
  cursor: pointer;
  margin-right: 0;
  transition: all 0.3s ease;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 1px;
  white-space: nowrap;
  
  &:hover {
    background: #222222;
    color: #ffffff;
  }
`;

const ContentArea = styled.div`
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  width: 100%;
  
  &::-webkit-scrollbar {
    width: 8px;
  }
  
  &::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.05);
  }
  
  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 4px;
  }
  
  @media (max-width: 768px) {
    padding: 15px 10px;
    
    .mobile-show {
      display: block !important;
      line-height: 1.3;
    }
    
    .mobile-hide {
      display: none !important;
    }
    
    h3 {
      font-size: 1.1rem !important;
    }
  }
`;

const Table = styled.table`
  width: 100%;
  background: #111111;
  border-radius: 8px;
  border-collapse: collapse;
  border: 1px solid #333333;
  margin-bottom: 30px;
  overflow: hidden;
  
  @media (max-width: 768px) {
    font-size: 12px;
  }
`;

const TableContainer = styled.div`
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  
  &::-webkit-scrollbar {
    height: 8px;
  }
  
  &::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.05);
  }
  
  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 4px;
  }
`;

const Th = styled.th`
  background: #222222;
  color: #ffffff;
  font-weight: 600;
  text-transform: uppercase;
  font-size: 12px;
  letter-spacing: 1px;
  padding: 15px;
  text-align: left;
  border-bottom: 1px solid #333333;
  white-space: nowrap;
  
  @media (max-width: 768px) {
    padding: 10px 8px;
    font-size: 10px;
    
    &.mobile-hide {
      display: none;
    }
  }
`;

const Td = styled.td`
  padding: 15px;
  text-align: left;
  border-bottom: 1px solid #333333;
  font-size: 14px;
  color: #ffffff;
  
  @media (max-width: 768px) {
    padding: 10px 8px;
    font-size: 12px;
    
    &.mobile-hide {
      display: none;
    }
  }
`;

const Input = styled.input`
  width: 100%;
  padding: 15px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid #333333;
  border-radius: 8px;
  color: #ffffff;
  font-size: 16px;
  margin-bottom: 15px;
  
  &::placeholder {
    color: #888888;
  }
  
  &:focus {
    outline: none;
    border-color: #555555;
  }
  
  @media (max-width: 768px) {
    padding: 18px;
    font-size: 16px;
    border-radius: 12px;
  }
`;

const Button = styled.button`
  padding: 15px 30px;
  background: #ffffff;
  color: #000000;
  border: none;
  border-radius: 8px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
  &:hover { 
    background: #cccccc;
  }
`;

const ActionButton = styled.button`
  padding: 8px 12px;
  margin: 2px;
  border: none;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &.primary {
    background: #3b82f6;
    color: white;
    &:hover { background: #2563eb; }
  }
  
  &.success {
    background: #10b981;
    color: white;
    &:hover { background: #059669; }
  }
  
  &.warning {
    background: #f59e0b;
    color: white;
    &:hover { background: #d97706; }
  }
  
  &.danger {
    background: #ef4444;
    color: white;
    &:hover { background: #dc2626; }
  }
  
  &.secondary {
    background: #6b7280;
    color: white;
    &:hover { background: #4b5563; }
  }
`;

const ActionsDropdown = styled.div`
  position: relative;
  display: inline-block;
`;

const DropdownButton = styled.button`
  background: #333;
  color: white;
  border: 1px solid #555;
  border-radius: 6px;
  padding: 8px 12px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 5px;
  transition: all 0.3s ease;
  min-width: 80px;
  justify-content: center;
  
  &:hover {
    background: #444;
  }
  
  @media (max-width: 768px) {
    padding: 12px 16px;
    font-size: 14px;
    min-width: 100px;
  }
`;

const DropdownMenu = styled.div`
  position: absolute;
  top: 100%;
  right: 0;
  background: #1a1a1a;
  border: 1px solid #333;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
  z-index: 100;
  min-width: 180px;
  overflow: hidden;
  
  @media (max-width: 768px) {
    min-width: 220px;
    right: -40px;
    border-radius: 12px;
  }
`;

const DropdownItem = styled.button`
  width: 100%;
  padding: 12px 16px;
  background: none;
  border: none;
  color: white;
  text-align: left;
  cursor: pointer;
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: background 0.2s ease;
  
  &:hover {
    background: #333;
  }
  
  &.danger:hover {
    background: #dc2626;
  }
  
  &.warning:hover {
    background: #d97706;
  }
  
  &.success:hover {
    background: #059669;
  }
  
  @media (max-width: 768px) {
    padding: 18px 24px;
    font-size: 16px;
    gap: 12px;
  }
`;

const Modal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: #1a1a1a;
  border: 1px solid #333;
  border-radius: 12px;
  padding: 30px;
  width: 90%;
  max-width: 500px;
  color: white;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  
  h3 {
    margin: 0;
    color: #ffffff;
  }
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: #999;
  font-size: 24px;
  cursor: pointer;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    color: #fff;
  }
`;

export default function Gerente({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [vendas, setVendas] = useState([]);
  const [estoque, setEstoque] = useState([]);
  const [vendedores, setVendedores] = useState([]);
  const [metricas, setMetricas] = useState({
    vendasMes: 0,
    metaLoja: 0,
    percentualMeta: 0,
    ticketMedio: 0,
    vendasHoje: 0,
    valorHoje: 0
  });
  const [formMeta, setFormMeta] = useState({
    vendedor_id: '', meta_mensal: '', meta_loja: ''
  });
  const [novoProduto, setNovoProduto] = useState({
    nome: '', tipo: '', cor: '', tamanho: '', preco_venda: '', estoque_atual: ''
  });
  const [modalAberto, setModalAberto] = useState(null);
  const [produtoEditando, setProdutoEditando] = useState(null);
  const [novoPreco, setNovoPreco] = useState('');
  const [filtroEstoque, setFiltroEstoque] = useState('');
  const [ordenacao, setOrdenacao] = useState('nome');
  const [filtroLote, setFiltroLote] = useState('todos');
  const [dropdownAberto, setDropdownAberto] = useState(null);
  const [showSaidaModal, setShowSaidaModal] = useState(false);
  const [valorSaida, setValorSaida] = useState(0);
  const [observacaoSaida, setObservacaoSaida] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);
  const [csvFile, setCsvFile] = useState(null);
  const [importLogs, setImportLogs] = useState([]);
  const [importing, setImporting] = useState(false);
  const [categorias, setCategorias] = useState(['terno', 'camisa', 'gravata', 'costume', 'acessorio', 'pre venda', 'Coleção Choseman']);
  const [novaCategoria, setNovaCategoria] = useState('');
  const [showCategoriaModal, setShowCategoriaModal] = useState(false);
  const [produtoQRCode, setProdutoQRCode] = useState(null);
  const [showQRCodeLote, setShowQRCodeLote] = useState(false);
  const [relatorios, setRelatorios] = useState({
    vendasDia: [],
    vendasSemana: [],
    vendasMes: [],
    produtosMaisVendidos: { dia: [], semana: [], mes: [] },
    metricas: { dia: {}, semana: {}, mes: {} },
    movimentacoesCaixa: []
  });
  
  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = () => setDropdownAberto(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);
  
  const registrarSaidaGerente = async () => {
    if (!valorSaida || valorSaida <= 0) {
      alert('Digite um valor válido!');
      return;
    }
    
    if (!observacaoSaida.trim()) {
      alert('Digite uma observação!');
      return;
    }
    
    try {
      const { error } = await supabase
        .from('saidas_caixa_mogi')
        .insert({
          usuario_id: user.id,
          valor: valorSaida,
          observacao: observacaoSaida,
          data: new Date().toISOString().split('T')[0],
          created_at: new Date().toISOString()
        });
      
      if (error) throw error;
      
      alert('Saída registrada com sucesso!');
      setShowSaidaModal(false);
      setValorSaida(0);
      setObservacaoSaida('');
      carregarRelatorios();
    } catch (error) {
      alert('Erro ao registrar saída: ' + error.message);
    }
  };

  useEffect(() => {
    carregarDados();
    carregarRelatorios();
  }, []);

  const carregarRelatorios = async () => {
    try {
      const hoje = new Date();
      const inicioDia = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
      // Corrigir cálculo da semana para não modificar a variável hoje
      const inicioSemana = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() - hoje.getDay());
      const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
      
      console.log('Carregando relatórios...', { inicioDia, inicioSemana, inicioMes });
      
      // Vendas por período - SEM expand que está falhando
      let { data: todasVendas, error: vendasError } = await supabase
        .from('vendas_mogi')
        .select('*')
        .neq('forma_pagamento', 'pendente_caixa')
        .order('created_at', { ascending: false });
      
      if (vendasError) {
        console.error('Erro ao carregar vendas para relatório:', vendasError);
        throw vendasError;
      }
      
      // Carregar itens de venda separadamente
      const { data: itensVenda, error: erroItens } = await supabase
        .from('itens_venda_mogi')
        .select('*');
      
      if (erroItens) {
        console.error('Erro ao carregar itens de venda:', erroItens);
      }
      
      // Associar itens às vendas manualmente
      if (todasVendas && itensVenda) {
        todasVendas = todasVendas.map(v => ({
          ...v,
          itens_venda_mogi: itensVenda.filter(i => i.venda_id === v.id)
        }));
      }
      
      console.log('Vendas carregadas para relatório:', todasVendas?.length || 0);
      console.log('Dados das vendas:', todasVendas);
      console.log('Forma pagamento das vendas:', todasVendas?.map(v => ({ id: v.id, forma_pagamento: v.forma_pagamento })));
      
      const vendasDia = todasVendas?.filter(v => {
        try {
          const dataVenda = new Date(v.created_at);
          return !isNaN(dataVenda.getTime()) && dataVenda >= inicioDia && dataVenda <= hoje && v.forma_pagamento !== 'pendente_caixa';
        } catch (e) {
          console.error('Erro ao fazer parse de data:', v.created_at, e);
          return false;
        }
      }) || [];
      
      const vendasSemana = todasVendas?.filter(v => {
        try {
          const dataVenda = new Date(v.created_at);
          return !isNaN(dataVenda.getTime()) && dataVenda >= inicioSemana && dataVenda <= hoje && v.forma_pagamento !== 'pendente_caixa';
        } catch (e) {
          console.error('Erro ao fazer parse de data:', v.created_at, e);
          return false;
        }
      }) || [];
      
      const vendasMes = todasVendas?.filter(v => {
        try {
          const dataVenda = new Date(v.created_at);
          return !isNaN(dataVenda.getTime()) && dataVenda >= inicioMes && dataVenda <= hoje && v.forma_pagamento !== 'pendente_caixa';
        } catch (e) {
          console.error('Erro ao fazer parse de data:', v.created_at, e);
          return false;
        }
      }) || [];
      
      console.log('Vendas filtradas:', { dia: vendasDia.length, semana: vendasSemana.length, mes: vendasMes.length });
      
      // Produtos mais vendidos
      const calcularProdutosMaisVendidos = (vendas) => {
        const contadorProdutos = {};
        vendas.forEach(venda => {
          if (venda.itens_venda_mogi) {
            venda.itens_venda_mogi.forEach(item => {
              const key = item.produto_nome;
              if (!contadorProdutos[key]) {
                contadorProdutos[key] = { nome: key, quantidade: 0, valor: 0 };
              }
              contadorProdutos[key].quantidade += item.quantidade;
              contadorProdutos[key].valor += item.subtotal;
            });
          }
        });
        return Object.values(contadorProdutos)
          .sort((a, b) => b.quantidade - a.quantidade)
          .slice(0, 10);
      };
      
      // Métricas por período
      const calcularMetricas = (vendas) => {
        const total = vendas.reduce((sum, v) => sum + parseFloat(v.valor_final || 0), 0);
        const quantidade = vendas.length;
        const ticketMedio = quantidade > 0 ? total / quantidade : 0;
        
        const porPagamento = vendas.reduce((acc, v) => {
          const forma = v.forma_pagamento || 'outros';
          const valor = parseFloat(v.valor_final || 0);
          
          if (forma.includes('|')) {
            // Pagamento misto - dividir pelos tipos
            forma.split('|').forEach(f => {
              const [tipo, valorParte] = f.split(':');
              const valorNumerico = parseFloat(valorParte || 0);
              acc[tipo] = (acc[tipo] || 0) + valorNumerico;
            });
          } else {
            // Pagamento único
            acc[forma] = (acc[forma] || 0) + valor;
          }
          
          return acc;
        }, {});
        
        console.log('Métricas calculadas:', { total, quantidade, ticketMedio, porPagamento });
        
        return { total, quantidade, ticketMedio, porPagamento };
      };
      
      // Movimentações do caixa - incluindo saídas
      const { data: movimentacoesCaixa, error: erroCaixa } = await supabase
        .from('caixa_mogi')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(25);
      
      if (erroCaixa) {
        console.error('Erro ao carregar caixa:', erroCaixa);
      }
      
      const { data: saidasCaixa, error: erroSaidas } = await supabase
        .from('saidas_caixa_mogi')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(25);
      
      if (erroSaidas) {
        console.error('Erro ao carregar saídas:', erroSaidas);
      }
      
      console.log('Caixa:', movimentacoesCaixa?.length || 0, 'Saídas:', saidasCaixa?.length || 0);
      
      // Combinar e formatar movimentações
      const todasMovimentacoes = [
        ...(movimentacoesCaixa || []).map(mov => ({
          ...mov,
          tipo: mov.tipo,
          descricao: mov.descricao,
          data_movimentacao: mov.created_at
        })),
        ...(saidasCaixa || []).map(saida => ({
          id: saida.id,
          tipo: 'saida',
          valor: saida.valor,
          descricao: saida.observacao,
          data_movimentacao: saida.created_at,
          created_at: saida.created_at
        }))
      ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 50);
      
      setRelatorios({
        vendasDia,
        vendasSemana,
        vendasMes,
        produtosMaisVendidos: {
          dia: calcularProdutosMaisVendidos(vendasDia),
          semana: calcularProdutosMaisVendidos(vendasSemana),
          mes: calcularProdutosMaisVendidos(vendasMes)
        },
        metricas: {
          dia: calcularMetricas(vendasDia),
          semana: calcularMetricas(vendasSemana),
          mes: calcularMetricas(vendasMes)
        },
        movimentacoesCaixa: todasMovimentacoes
      });
    } catch (error) {
      console.error('Erro ao carregar relatórios:', error);
    }
  };

  const carregarDados = async () => {
    try {
      // Carregar vendas da tabela independente
      const { data: vendasData, error: erroVendas } = await supabase
        .from('vendas_mogi')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (erroVendas) {
        console.error('Erro ao carregar vendas:', erroVendas);
        throw erroVendas;
      }
      
      console.log('Vendas carregadas:', vendasData?.length || 0, vendasData);
      
      // Carregar produtos da tabela independente
      const { data: produtosData, error: erroProdutos } = await supabase
        .from('produtos_mogi')
        .select('*')
        .order('nome');
      
      if (erroProdutos) {
        console.error('Erro ao carregar produtos:', erroProdutos);
        throw erroProdutos;
      }
      
      // Carregar vendedores da tabela independente
      const { data: vendedoresData, error: erroVendedores } = await supabase
        .from('usuarios_mogi')
        .select('*')
        .eq('tipo', 'vendedor');
      
      if (erroVendedores) {
        console.error('Erro ao carregar vendedores:', erroVendedores);
        throw erroVendedores;
      }
      
      // Calcular métricas
      const hoje = new Date();
      const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
      const inicioDia = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
      
      const vendasMes = (vendasData || []).filter(v => {
        try {
          const dataVenda = new Date(v.created_at);
          return !isNaN(dataVenda.getTime()) && dataVenda >= inicioMes && v.forma_pagamento !== 'pendente_caixa';
        } catch (e) {
          return false;
        }
      });
      
      const vendasHoje = (vendasData || []).filter(v => {
        try {
          const dataVenda = new Date(v.created_at);
          return !isNaN(dataVenda.getTime()) && dataVenda >= inicioDia && v.forma_pagamento !== 'pendente_caixa';
        } catch (e) {
          return false;
        }
      });
      
      const totalMes = vendasMes.reduce((sum, v) => sum + parseFloat(v.valor_final || 0), 0);
      const totalHoje = vendasHoje.reduce((sum, v) => sum + parseFloat(v.valor_final || 0), 0);
      const ticketMedio = vendasMes.length > 0 ? totalMes / vendasMes.length : 0;
      
      setVendas(vendasData || []);
      setEstoque(produtosData || []);
      setVendedores(vendedoresData || []);
      setMetricas({
        vendasMes: totalMes,
        metaLoja: 0,
        percentualMeta: 0,
        ticketMedio,
        vendasHoje: vendasHoje.length,
        valorHoje: totalHoje
      });
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      alert('Erro ao carregar dados: ' + error.message);
    }
  };

  const gerarCodigo = (tipo) => {
    const prefixos = {
      'terno': 'TER',
      'camisa': 'CAM', 
      'gravata': 'GRV',
      'costume': 'CST',
      'acessorio': 'ACS',
      'pre venda': 'PRV'
    };
    
    const prefixo = prefixos[tipo?.toLowerCase()] || 'PRD';
    const numero = Math.floor(Math.random() * 9000) + 1000;
    return `${prefixo}-${numero}`;
  };

  const adicionarProduto = async () => {
    if (!novoProduto.nome || !novoProduto.preco_venda || !novoProduto.tipo) {
      alert('Preencha os campos obrigatórios (nome, categoria e preço)');
      return;
    }
    
    const codigoGerado = gerarCodigo(novoProduto.tipo);
    
    try {
      const { error } = await supabase.from('produtos_mogi').insert([{
        codigo: codigoGerado,
        nome: novoProduto.nome,
        tipo: novoProduto.tipo,
        cor: novoProduto.cor,
        tamanho: novoProduto.tamanho,
        preco_venda: parseFloat(novoProduto.preco_venda),
        estoque_atual: parseInt(novoProduto.estoque_atual) || 0
      }]);
      
      if (error) throw error;
      
      alert('Produto adicionado com sucesso!');
      setNovoProduto({ nome: '', tipo: '', cor: '', tamanho: '', preco_venda: '', estoque_atual: '' });
      carregarDados();
    } catch (error) {
      alert('Erro ao adicionar produto: ' + error.message);
    }
  };

  const ajustarEstoque = async (produtoId, novaQuantidade) => {
    try {
      const { error } = await supabase
        .from('produtos_mogi')
        .update({ estoque_atual: parseInt(novaQuantidade) })
        .eq('id', produtoId);
      
      if (error) throw error;
      
      carregarDados();
      alert('Estoque atualizado!');
    } catch (error) {
      alert('Erro ao atualizar estoque: ' + error.message);
    }
  };

  const alterarPreco = async (produtoId, novoPreco) => {
    try {
      const { error } = await supabase
        .from('produtos_mogi')
        .update({ preco_venda: parseFloat(novoPreco) })
        .eq('id', produtoId);
      
      if (error) throw error;
      
      carregarDados();
      setModalAberto(null);
      alert('Preço atualizado com sucesso!');
    } catch (error) {
      alert('Erro ao atualizar preço: ' + error.message);
    }
  };

  const editarProduto = async (produto) => {
    try {
      const { error } = await supabase
        .from('produtos_mogi')
        .update({
          nome: produto.nome,
          tipo: produto.tipo,
          cor: produto.cor,
          tamanho: produto.tamanho,
          preco_venda: parseFloat(produto.preco_venda),
          estoque_atual: parseInt(produto.estoque_atual)
        })
        .eq('id', produto.id);
      
      if (error) throw error;
      
      carregarDados();
      setModalAberto(null);
      setProdutoEditando(null);
      alert('Produto atualizado com sucesso!');
    } catch (error) {
      alert('Erro ao atualizar produto: ' + error.message);
    }
  };

  const excluirProduto = async (produtoId) => {
    if (!confirm('Tem certeza que deseja excluir este produto?')) return;
    
    try {
      const { error } = await supabase
        .from('produtos_mogi')
        .delete()
        .eq('id', produtoId);
      
      if (error) throw error;
      
      carregarDados();
      alert('Produto excluído com sucesso!');
    } catch (error) {
      alert('Erro ao excluir produto: ' + error.message);
    }
  };

  const importarCSV = async () => {
    if (!csvFile) {
      alert('Selecione um arquivo!');
      return;
    }

    setImporting(true);
    setImportLogs(['Iniciando importação...']);

    try {
      let text;
      const fileName = csvFile.name.toLowerCase();
      
      if (fileName.endsWith('.xlsx')) {
        setImportLogs(prev => [...prev, 'Convertendo XLSX para CSV...']);
        const arrayBuffer = await csvFile.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer);
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        text = XLSX.utils.sheet_to_csv(worksheet);
        setImportLogs(prev => [...prev, 'XLSX convertido com sucesso!']);
      } else {
        text = await csvFile.text();
      }
      
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        throw new Error('Arquivo deve ter pelo menos 2 linhas (cabeçalho + dados)');
      }

      const header = lines[0].split(',').map(h => h.trim().toLowerCase());
      const expectedHeaders = ['codigo', 'nome', 'tipo', 'cor', 'tamanho', 'preco_venda', 'estoque_atual', 'estoque_minimo', 'ativo'];
      
      const missingHeaders = expectedHeaders.filter(h => !header.includes(h));
      if (missingHeaders.length > 0) {
        throw new Error(`Cabeçalhos obrigatórios ausentes: ${missingHeaders.join(', ')}`);
      }

      setImportLogs(prev => [...prev, `Cabeçalho validado: ${header.length} colunas`]);
      setImportLogs(prev => [...prev, `Processando ${lines.length - 1} produtos...`]);

      let sucessos = 0;
      let erros = 0;

      for (let i = 1; i < lines.length; i++) {
        try {
          const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
          
          if (values.length !== header.length) {
            throw new Error(`Linha ${i + 1}: Número de colunas incorreto`);
          }

          const produto = {};
          header.forEach((col, index) => {
            produto[col] = values[index];
          });

          if (!produto.codigo || !produto.nome || !produto.preco_venda) {
            throw new Error(`Linha ${i + 1}: Campos obrigatórios ausentes`);
          }

          const produtoFormatado = {
            codigo: produto.codigo,
            nome: produto.nome,
            tipo: produto.tipo || null,
            cor: produto.cor || null,
            tamanho: produto.tamanho || null,
            preco_venda: parseFloat(produto.preco_venda),
            estoque_atual: parseInt(produto.estoque_atual) || 0,
            estoque_minimo: parseInt(produto.estoque_minimo) || 5,
            ativo: ['true', 'sim', 'ativo'].includes(produto.ativo?.toLowerCase())
          };

          if (isNaN(produtoFormatado.preco_venda) || produtoFormatado.preco_venda <= 0) {
            throw new Error(`Linha ${i + 1}: Preço inválido`);
          }

          const { error } = await supabase
            .from('produtos_mogi')
            .upsert([produtoFormatado], { onConflict: 'codigo' });

          if (error) throw error;

          sucessos++;
          setImportLogs(prev => [...prev, `${produto.codigo} - ${produto.nome}`]);
        } catch (error) {
          erros++;
          setImportLogs(prev => [...prev, `Linha ${i + 1}: ${error.message}`]);
        }
      }

      setImportLogs(prev => [...prev, `\nImportação concluída!`]);
      setImportLogs(prev => [...prev, `Sucessos: ${sucessos}`]);
      setImportLogs(prev => [...prev, `Erros: ${erros}`]);
      
      if (sucessos > 0) {
        carregarDados();
      }

    } catch (error) {
      setImportLogs(prev => [...prev, `Erro geral: ${error.message}`]);
    } finally {
      setImporting(false);
    }
  };

  const alterarPrecoLote = async (filtro, novoPreco) => {
    if (!confirm(`Alterar preço de todos os produtos ${filtro} para R$ ${novoPreco}?`)) return;
    
    try {
      let query = supabase.from('produtos_mogi').update({ preco_venda: parseFloat(novoPreco) });
      
      if (filtro !== 'todos') {
        query = query.eq('tipo', filtro);
      }
      
      const { error } = await query;
      
      if (error) throw error;
      
      carregarDados();
      setModalAberto(null);
      alert('Preços atualizados em lote!');
    } catch (error) {
      alert('Erro ao atualizar preços: ' + error.message);
    }
  };

  const produtosFiltrados = estoque.filter(produto => {
    if (!filtroEstoque) return true;
    return produto.nome.toLowerCase().includes(filtroEstoque.toLowerCase()) ||
           produto.codigo.toLowerCase().includes(filtroEstoque.toLowerCase()) ||
           produto.tipo.toLowerCase().includes(filtroEstoque.toLowerCase());
  }).sort((a, b) => {
    switch (ordenacao) {
      case 'nome': return a.nome.localeCompare(b.nome);
      case 'codigo': return a.codigo.localeCompare(b.codigo);
      case 'preco': return parseFloat(b.preco_venda) - parseFloat(a.preco_venda);
      case 'estoque': return (b.estoque_atual || 0) - (a.estoque_atual || 0);
      default: return 0;
    }
  });

  const definirMeta = async () => {
    if (!formMeta.vendedor_id || !formMeta.meta_mensal) {
      alert('Selecione um vendedor e digite a meta');
      return;
    }
    
    try {
      const { error } = await supabase
        .from('usuarios_mogi')
        .update({ meta_mensal: parseFloat(formMeta.meta_mensal) })
        .eq('id', formMeta.vendedor_id);
      
      if (error) throw error;
      
      alert('Meta definida com sucesso!');
      setFormMeta({ vendedor_id: '', meta_mensal: '', meta_loja: '' });
      carregarDados();
    } catch (error) {
      alert('Erro ao definir meta: ' + error.message);
    }
  };

  const formatarValor = (valor) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor || 0);
  };

  const gerarFechamentoMes = () => {
    const hoje = new Date();
    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    const vendasMes = vendas.filter(v => 
      new Date(v.data_venda) >= inicioMes && v.forma_pagamento !== 'pendente_caixa'
    );
    
    const analise = { quantidade: {}, valores: {} };
    
    vendasMes.forEach(v => {
      const forma = v.forma_pagamento;
      const valor = parseFloat(v.valor_final || 0);
      
      if (forma?.includes('|')) {
        forma.split('|').forEach(f => {
          const [tipo, valorParte] = f.split(':');
          const valorNumerico = parseFloat(valorParte || 0);
          analise.quantidade[tipo] = (analise.quantidade[tipo] || 0) + 1;
          analise.valores[tipo] = (analise.valores[tipo] || 0) + valorNumerico;
        });
      } else {
        analise.quantidade[forma] = (analise.quantidade[forma] || 0) + 1;
        analise.valores[forma] = (analise.valores[forma] || 0) + valor;
      }
    });
    
    return { vendasMes, analise };
  };

  const gerarFechamentoDia = () => {
    const hoje = new Date();
    const inicioDia = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
    const vendasDia = vendas.filter(v => 
      new Date(v.data_venda) >= inicioDia && v.forma_pagamento !== 'pendente_caixa'
    );
    
    const analise = { quantidade: {}, valores: {} };
    
    vendasDia.forEach(v => {
      const forma = v.forma_pagamento;
      const valor = parseFloat(v.valor_final || 0);
      
      if (forma?.includes('|')) {
        forma.split('|').forEach(f => {
          const [tipo, valorParte] = f.split(':');
          const valorNumerico = parseFloat(valorParte || 0);
          analise.quantidade[tipo] = (analise.quantidade[tipo] || 0) + 1;
          analise.valores[tipo] = (analise.valores[tipo] || 0) + valorNumerico;
        });
      } else {
        analise.quantidade[forma] = (analise.quantidade[forma] || 0) + 1;
        analise.valores[forma] = (analise.valores[forma] || 0) + valor;
      }
    });
    
    return { vendasDia, analise };
  };

  return (
    <Container>
      <Header>
        <div style={{display: 'flex', alignItems: 'center', gap: '15px'}}>
          <img 
            src="/images/logo.png" 
            alt="VH Logo" 
            style={{
              height: '60px', 
              width: 'auto',
              filter: 'brightness(0) invert(1)',
              objectFit: 'contain'
            }}
          />
          <UserInfo>Gerente | {vendas.length} vendas | {vendedores.length} vendedores</UserInfo>
        </div>
        <LogoutButton onClick={onLogout}>Sair</LogoutButton>
      </Header>

      <TabContainer>
        <Tab $active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')}>Dashboard</Tab>
        <Tab $active={activeTab === 'estoque'} onClick={() => setActiveTab('estoque')}>Estoque</Tab>
        <Tab $active={activeTab === 'vendas'} onClick={() => setActiveTab('vendas')}>Vendas</Tab>
        <Tab $active={activeTab === 'metas'} onClick={() => setActiveTab('metas')}>Metas</Tab>
        <Tab $active={activeTab === 'fotos'} onClick={() => setActiveTab('fotos')}>Fotos</Tab>
        <Tab $active={activeTab === 'relatorios'} onClick={() => setActiveTab('relatorios')}>Relatórios</Tab>
        <Tab $active={activeTab === 'ferramentas'} onClick={() => setActiveTab('ferramentas')}>Ferramentas</Tab>
      </TabContainer>

      <ContentArea>
        {activeTab === 'dashboard' && (
          <>
            {/* Indicadores Principais */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '20px',
              marginBottom: '30px'
            }}>
              {(() => {
                const hoje = new Date();
                const inicioDia = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
                const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
                
                const vendasHoje = vendas.filter(v => 
                  new Date(v.data_venda) >= inicioDia && v.forma_pagamento !== 'pendente_caixa'
                );
                const vendasMes = vendas.filter(v => 
                  new Date(v.data_venda) >= inicioMes && v.forma_pagamento !== 'pendente_caixa'
                );
                
                const valorHoje = vendasHoje.reduce((sum, v) => sum + parseFloat(v.valor_final || 0), 0);
                const valorMes = vendasMes.reduce((sum, v) => sum + parseFloat(v.valor_final || 0), 0);
                
                const estoqueTotal = estoque.reduce((sum, p) => sum + (p.estoque_atual || 0), 0);
                const estoqueBaixo = estoque.filter(p => (p.estoque_atual || 0) < 5).length;
                const valorEstoque = estoque.reduce((sum, p) => sum + ((p.estoque_atual || 0) * (p.preco_venda || 0)), 0);
                
                const ticketMedio = vendasHoje.length > 0 ? valorHoje / vendasHoje.length : 0;
                
                return [
                  {
                    titulo: 'VENDAS HOJE',
                    valor: vendasHoje.length,
                    subtitulo: `${formatarValor(valorHoje)}`,
                    detalhe: `Ticket médio: ${formatarValor(ticketMedio)}`,
                    cor: '#10b981'
                  },
                  {
                    titulo: 'ESTOQUE TOTAL',
                    valor: estoqueTotal,
                    subtitulo: `${estoque.length} produtos`,
                    detalhe: `${estoqueBaixo} com estoque baixo`,
                    cor: estoqueBaixo > 10 ? '#ef4444' : '#3b82f6'
                  },
                  {
                    titulo: 'VENDAS DO MÊS',
                    valor: `${formatarValor(valorMes)}`,
                    subtitulo: `${vendasMes.length} vendas`,
                    detalhe: `Valor estoque: ${formatarValor(valorEstoque)}`,
                    cor: '#8b5cf6'
                  }
                ];
              })().map((indicador, index) => (
                <div 
                  key={index} 
                  onClick={() => {
                    if (index === 0) setActiveTab('vendas');
                    if (index === 1) setActiveTab('estoque');
                    if (index === 2) setActiveTab('relatorios');
                  }}
                  style={{
                    background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
                    border: `1px solid ${indicador.cor}40`,
                    borderRadius: '16px',
                    padding: '25px',
                    color: '#ffffff',
                    position: 'relative',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 8px 25px rgba(0,0,0,0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = 'none';
                  }}
                >

                  
                  <div style={{
                    fontSize: '2.5rem',
                    fontWeight: '800',
                    marginBottom: '8px',
                    color: indicador.cor
                  }}>{indicador.valor}</div>
                  
                  <div style={{
                    fontSize: '0.85rem',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    marginBottom: '8px'
                  }}>{indicador.titulo}</div>
                  
                  <div style={{
                    fontSize: '1.1rem',
                    fontWeight: '600',
                    marginBottom: '4px'
                  }}>{indicador.subtitulo}</div>
                  
                  <div style={{
                    fontSize: '0.8rem',
                    color: '#999',
                    fontStyle: 'italic'
                  }}>{indicador.detalhe}</div>
                </div>
              ))}
            </div>

            {/* TOP 3 VENDEDORES DO RANKING */}
            <div style={{
              background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
              border: '1px solid #404040',
              borderRadius: '16px',
              padding: '25px',
              marginBottom: '30px'
            }}>
              <h3 style={{margin: '0 0 20px 0', color: '#fff', fontSize: '1.3rem'}}>🏆 TOP 3 VENDEDORES DO MÊS</h3>
              <div style={{display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px'}}>
                {vendedores
                  .map(vendedor => {
                    const hoje = new Date();
                    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
                    const vendasVendedor = vendas.filter(v => 
                      v.vendedor_nome === vendedor.nome && 
                      new Date(v.data_venda) >= inicioMes &&
                      v.forma_pagamento !== 'pendente_caixa'
                    );
                    const totalVendedor = vendasVendedor.reduce((sum, v) => sum + parseFloat(v.valor_final || 0), 0);
                    const meta = parseFloat(vendedor.meta_mensal || 0);
                    const percentual = meta > 0 ? (totalVendedor / meta) * 100 : 0;
                    return { ...vendedor, totalVendedor, meta, percentual, quantidadeVendas: vendasVendedor.length };
                  })
                  .sort((a, b) => b.totalVendedor - a.totalVendedor)
                  .slice(0, 3)
                  .map((vendedor, index) => {
                    const posicoes = ['1°', '2°', '3°'];
                    const cores = ['#FFD700', '#C0C0C0', '#CD7F32'];
                    return (
                      <div key={vendedor.id} style={{
                        background: '#111111',
                        border: `2px solid ${cores[index]}`,
                        borderRadius: '12px',
                        padding: '20px',
                        textAlign: 'center',
                        position: 'relative',
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          position: 'absolute',
                          top: '-10px',
                          right: '-10px',
                          background: cores[index],
                          color: '#000',
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1.2rem',
                          fontWeight: 'bold'
                        }}>
                          {index + 1}
                        </div>
                        
                        {/* Foto do vendedor */}
                        <div style={{
                          width: '60px',
                          height: '60px',
                          borderRadius: '50%',
                          overflow: 'hidden',
                          border: '2px solid ' + cores[index],
                          marginBottom: '10px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: '#222'
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
                            />
                          ) : (
                            <span style={{ fontSize: '1.5rem', color: '#666' }}>👤</span>
                          )}
                        </div>
                        
                        <div style={{
                          fontSize: '1.1rem',
                          fontWeight: 'bold',
                          color: '#fff',
                          marginBottom: '8px'
                        }}>
                          {vendedor.nome}
                        </div>
                        
                        <div style={{
                          fontSize: '1.5rem',
                          fontWeight: '800',
                          color: cores[index],
                          marginBottom: '8px'
                        }}>
                          {formatarValor(vendedor.totalVendedor)}
                        </div>
                        
                        <div style={{
                          fontSize: '0.9rem',
                          color: '#ccc',
                          marginBottom: '5px'
                        }}>
                          {vendedor.quantidadeVendas} vendas
                        </div>
                        
                        <div style={{
                          fontSize: '0.8rem',
                          color: vendedor.percentual >= 100 ? '#10b981' : vendedor.percentual >= 70 ? '#f59e0b' : '#ef4444',
                          fontWeight: 'bold'
                        }}>
                          {vendedor.percentual.toFixed(1)}% da meta
                        </div>
                        
                        <div style={{
                          fontSize: '0.7rem',
                          color: '#999',
                          marginTop: '5px'
                        }}>
                          Ticket: {formatarValor(vendedor.quantidadeVendas > 0 ? vendedor.totalVendedor / vendedor.quantidadeVendas : 0)}
                        </div>
                      </div>
                    );
                  })
                }
              </div>
            </div>

          </>
        )}

        {activeTab === 'estoque' && (
          <div>
            <div style={{background: '#111111', padding: '20px', borderRadius: '8px', marginBottom: '20px'}}>
              <h3 style={{marginTop: 0}}>Adicionar Produto</h3>
              {novoProduto.tipo && (
                <div style={{padding: '10px', background: '#222', borderRadius: '4px', marginBottom: '15px', color: '#00ff88'}}>
                  Código que será gerado: {gerarCodigo(novoProduto.tipo)}
                </div>
              )}
              <Input placeholder="Nome *" value={novoProduto.nome} onChange={(e) => setNovoProduto({...novoProduto, nome: e.target.value})} />
              <select 
                value={novoProduto.tipo} 
                onChange={(e) => setNovoProduto({...novoProduto, tipo: e.target.value})}
                style={{
                  width: '100%',
                  padding: '15px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid #333333',
                  borderRadius: '8px',
                  color: '#ffffff',
                  fontSize: '16px',
                  marginBottom: '15px'
                }}
              >
                <option value="">Selecione a categoria *</option>
                {categorias.map(categoria => (
                  <option key={categoria} value={categoria} style={{background: '#333', color: '#fff'}}>
                    {categoria.charAt(0).toUpperCase() + categoria.slice(1)}
                  </option>
                ))}
              </select>
              <Input placeholder="Cor" value={novoProduto.cor} onChange={(e) => setNovoProduto({...novoProduto, cor: e.target.value})} />
              <Input placeholder="Tamanho" value={novoProduto.tamanho} onChange={(e) => setNovoProduto({...novoProduto, tamanho: e.target.value})} />
              <Input placeholder="Preço *" type="number" step="0.01" value={novoProduto.preco_venda} onChange={(e) => setNovoProduto({...novoProduto, preco_venda: e.target.value})} />
              <Input placeholder="Estoque Inicial" type="number" value={novoProduto.estoque_atual} onChange={(e) => setNovoProduto({...novoProduto, estoque_atual: e.target.value})} />
              <Button onClick={adicionarProduto}>Adicionar Produto</Button>
            </div>

            <div style={{marginBottom: '20px'}}>
              <h3 style={{margin: '0 0 15px 0', fontSize: '1.2rem'}}>Produtos ({produtosFiltrados.length})</h3>
              <div style={{display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap'}}>
                <ActionButton 
                  className="success" 
                  onClick={() => setShowImportModal(true)}
                  style={{fontSize: '12px', padding: '10px 14px'}}
                >
                  Importar CSV
                </ActionButton>
                <ActionButton 
                  className="warning" 
                  onClick={() => setModalAberto('precoLote')}
                  style={{fontSize: '12px', padding: '10px 14px'}}
                >
                  Preços Lote
                </ActionButton>
                <ActionButton 
                  className="primary" 
                  onClick={() => setShowCategoriaModal(true)}
                  style={{fontSize: '12px', padding: '10px 14px'}}
                >
                  Gerenciar Categorias
                </ActionButton>
                <ActionButton 
                  className="primary" 
                  onClick={() => setShowQRCodeLote(true)}
                  style={{fontSize: '12px', padding: '10px 14px'}}
                >
                  QR Codes Lote
                </ActionButton>
                <select 
                  value={ordenacao}
                  onChange={(e) => setOrdenacao(e.target.value)}
                  style={{
                    padding: '10px 12px',
                    background: '#333',
                    border: '1px solid #555',
                    borderRadius: '6px',
                    color: '#fff',
                    fontSize: '14px',
                    minWidth: '140px'
                  }}
                >
                  <option value="nome">Nome</option>
                  <option value="codigo">Código</option>
                  <option value="preco">Preço</option>
                  <option value="estoque">Estoque</option>
                </select>
              </div>
            </div>
            
            <Input 
              placeholder="Buscar produtos..."
              value={filtroEstoque}
              onChange={(e) => setFiltroEstoque(e.target.value)}
              style={{marginBottom: '20px', fontSize: '16px'}}
            />
            
            <Table>
              <thead>
                <tr>
                  <Th>Código</Th>
                  <Th>Nome</Th>
                  <Th>Categoria</Th>
                  <Th>Cor</Th>
                  <Th>Tamanho</Th>
                  <Th>Preço</Th>
                  <Th>Estoque</Th>
                  <Th style={{width: '120px', textAlign: 'center'}}>Ações</Th>
                </tr>
              </thead>
              <tbody>
                {produtosFiltrados.map(p => (
                  <tr key={p.id}>
                    <Td>{p.codigo}</Td>
                    <Td>{p.nome}</Td>
                    <Td>{p.tipo}</Td>
                    <Td>{p.cor}</Td>
                    <Td>{p.tamanho}</Td>
                    <Td>{formatarValor(parseFloat(p.preco_venda || 0))}</Td>
                    <Td style={{color: p.estoque_atual < 5 ? '#ff6b6b' : '#10b981', fontWeight: 'bold'}}>{p.estoque_atual}</Td>
                    <Td>
                      <ActionsDropdown>
                        <DropdownButton 
                          onClick={(e) => {
                            e.stopPropagation();
                            setDropdownAberto(dropdownAberto === p.id ? null : p.id);
                          }}
                        >
                          Ações
                          <span style={{fontSize: '10px'}}>▼</span>
                        </DropdownButton>
                        
                        {dropdownAberto === p.id && (
                          <DropdownMenu onClick={(e) => e.stopPropagation()}>
                            <DropdownItem 
                              className="success"
                              onClick={() => {
                                const nova = prompt('Nova quantidade:', p.estoque_atual);
                                if (nova !== null) ajustarEstoque(p.id, nova);
                                setDropdownAberto(null);
                              }}
                            >
                              Ajustar Estoque
                            </DropdownItem>
                            
                            <DropdownItem 
                              className="warning"
                              onClick={() => {
                                setNovoPreco(p.preco_venda);
                                setProdutoEditando(p);
                                setModalAberto('preco');
                                setDropdownAberto(null);
                              }}
                            >
                              Alterar Preço
                            </DropdownItem>
                            
                            <DropdownItem 
                              onClick={() => {
                                setProdutoEditando({...p});
                                setModalAberto('editar');
                                setDropdownAberto(null);
                              }}
                            >
                              Editar Produto
                            </DropdownItem>
                            
                            <DropdownItem 
                              onClick={() => {
                                const codigo = prompt('Novo código:', p.codigo);
                                if (codigo && codigo !== p.codigo) {
                                  supabase.from('produtos_mogi')
                                    .update({ codigo })
                                    .eq('id', p.id)
                                    .then(() => {
                                      carregarDados();
                                      alert('Código atualizado!');
                                    });
                                }
                                setDropdownAberto(null);
                              }}
                            >
                              Alterar Código
                            </DropdownItem>
                            
                            <DropdownItem 
                              onClick={() => {
                                setProdutoQRCode(p);
                                setDropdownAberto(null);
                              }}
                            >
                              Gerar QR Code
                            </DropdownItem>
                            
                            <DropdownItem 
                              className="danger"
                              onClick={() => {
                                excluirProduto(p.id);
                                setDropdownAberto(null);
                              }}
                            >
                              Excluir Produto
                            </DropdownItem>
                          </DropdownMenu>
                        )}
                      </ActionsDropdown>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        )}

        {activeTab === 'vendas' && (
          <div>
            <h3>Histórico de Vendas</h3>
            <Table>
              <thead>
                <tr>
                  <Th>Nº Venda</Th>
                  <Th>Data</Th>
                  <Th>Cliente</Th>
                  <Th>Valor</Th>
                  <Th>Pagamento</Th>
                </tr>
              </thead>
              <tbody>
                {vendas.filter(v => v.forma_pagamento !== 'pendente_caixa').map(v => (
                  <tr key={v.id}>
                    <Td>{v.numero_venda}</Td>
                    <Td>{new Date(v.created_at).toLocaleString('pt-BR')}</Td>
                    <Td>{v.cliente_nome || '-'}</Td>
                    <Td>{formatarValor(parseFloat(v.valor_final || 0))}</Td>
                    <Td>{v.forma_pagamento || 'Pendente'}</Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        )}

        {activeTab === 'fotos' && (
          <GerenciarFotosVendedores 
            vendedores={vendedores}
            onUpdateFoto={(vendedorId, fotoUrl) => {
              setVendedores(prev => prev.map(v => 
                v.id === vendedorId ? { ...v, foto_url: fotoUrl } : v
              ));
            }}
            supabase={supabase}
          />
        )}

        {activeTab === 'metas' && (
          <div>
            <div style={{background: '#111111', padding: '20px', borderRadius: '8px', marginBottom: '20px'}}>
              <h3 style={{marginTop: 0}}>Definir Meta de Vendedor</h3>
              <select 
                value={formMeta.vendedor_id} 
                onChange={(e) => setFormMeta({...formMeta, vendedor_id: e.target.value})}
                style={{
                  width: '100%',
                  padding: '15px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid #333333',
                  borderRadius: '8px',
                  color: '#ffffff',
                  fontSize: '16px',
                  marginBottom: '15px'
                }}
              >
                <option value="">Selecione um vendedor</option>
                {vendedores.map(v => (
                  <option key={v.id} value={v.id} style={{background: '#333', color: '#fff'}}>
                    {v.nome}
                  </option>
                ))}
              </select>
              <Input 
                type="number" 
                placeholder="Meta Mensal (R$)" 
                value={formMeta.meta_mensal}
                onChange={(e) => setFormMeta({...formMeta, meta_mensal: e.target.value})}
              />
              <Button onClick={definirMeta}>Definir Meta</Button>
            </div>

            {/* Ranking dos Vendedores */}
            <div style={{
              background: '#111111',
              border: '1px solid #333',
              borderRadius: '12px',
              padding: '25px',
              marginBottom: '30px'
            }}>
              <h3 style={{margin: '0 0 20px 0', color: '#fff'}}>Ranking dos Vendedores - Este Mês</h3>
              <div style={{display: 'flex', flexDirection: 'column', gap: '15px'}}>
                {vendedores
                  .map(vendedor => {
                    const hoje = new Date();
                    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
                    const vendasVendedor = vendas.filter(v => 
                      v.vendedor_nome === vendedor.nome && 
                      new Date(v.data_venda) >= inicioMes &&
                      v.forma_pagamento !== 'pendente_caixa'
                    );
                    const totalVendedor = vendasVendedor.reduce((sum, v) => sum + parseFloat(v.valor_final || 0), 0);
                    const meta = parseFloat(vendedor.meta_mensal || 0);
                    const percentual = meta > 0 ? (totalVendedor / meta) * 100 : 0;
                    return { ...vendedor, totalVendedor, meta, percentual };
                  })
                  .sort((a, b) => b.percentual - a.percentual)
                  .map((vendedor, index) => (
                    <div key={vendedor.id} style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '15px',
                      background: '#1a1a1a',
                      borderRadius: '8px',
                      border: '1px solid #333'
                    }}>
                      <div style={{
                        fontSize: '1.2rem',
                        fontWeight: 'bold',
                        color: '#fff',
                        minWidth: '30px',
                        marginRight: '15px'
                      }}>
                        {index + 1}
                      </div>
                      
                      {/* Foto do vendedor no ranking */}
                      <div style={{
                        width: '50px',
                        height: '50px',
                        borderRadius: '50%',
                        overflow: 'hidden',
                        border: '2px solid #333',
                        marginRight: '15px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: '#222'
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
                          />
                        ) : (
                          <span style={{ fontSize: '1.2rem', color: '#666' }}>👤</span>
                        )}
                      </div>
                      
                      <div style={{flex: 1}}>
                        <div style={{fontSize: '1rem', fontWeight: 'bold', color: '#fff'}}>
                          {vendedor.nome}
                        </div>
                        <div style={{fontSize: '0.9rem', color: '#999'}}>
                          Meta: {formatarValor(vendedor.meta)}
                        </div>
                      </div>
                      <div style={{
                        fontSize: '1.1rem',
                        fontWeight: 'bold',
                        color: vendedor.percentual >= 100 ? '#10b981' : vendedor.percentual >= 70 ? '#f59e0b' : '#ef4444'
                      }}>
                        {vendedor.percentual.toFixed(1)}%
                      </div>
                    </div>
                  ))
                }
              </div>
            </div>

            <h3>Tabela Resumo</h3>
            <Table>
              <thead>
                <tr>
                  <Th>Vendedor</Th>
                  <Th>Meta Mensal</Th>
                  <Th>Vendas Mês</Th>
                  <Th>% Atingido</Th>
                </tr>
              </thead>
              <tbody>
                {vendedores.map(vendedor => {
                  const hoje = new Date();
                  const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
                  const vendasMes = vendas.filter(v => 
                    v.vendedor_nome === vendedor.nome && 
                    new Date(v.data_venda) >= inicioMes &&
                    v.forma_pagamento !== 'pendente_caixa'
                  );
                  const totalMes = vendasMes.reduce((sum, v) => sum + parseFloat(v.valor_final || 0), 0);
                  const meta = parseFloat(vendedor.meta_mensal || 0);
                  const percentual = meta > 0 ? (totalMes / meta) * 100 : 0;
                  
                  return (
                    <tr key={vendedor.id}>
                      <Td>{vendedor.nome}</Td>
                      <Td>{meta > 0 ? formatarValor(meta) : 'Não definida'}</Td>
                      <Td>{formatarValor(totalMes)}</Td>
                      <Td style={{color: percentual >= 100 ? '#10b981' : percentual >= 70 ? '#f59e0b' : '#ff6b6b', fontWeight: 'bold'}}>
                        {percentual.toFixed(1)}%
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </div>
        )}

        {activeTab === 'relatorios' && (
          <div>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px'}}>
              <h2 style={{margin: 0, color: '#ffffff'}}>Relatórios Gerenciais</h2>
              <div style={{display: 'flex', gap: '10px'}}>
                <ActionButton 
                  className="danger" 
                  onClick={() => setShowSaidaModal(true)}
                  style={{fontSize: '14px', padding: '12px 16px'}}
                >
                  Nova Saída
                </ActionButton>
                <ActionButton 
                  className="primary" 
                  onClick={() => setModalAberto('fechamentoMes')}
                  style={{fontSize: '14px', padding: '12px 16px'}}
                >
                  Fechamento de Vendas do Mes
                </ActionButton>
                <ActionButton 
                  className="success" 
                  onClick={() => setModalAberto('fechamentoDia')}
                  style={{fontSize: '14px', padding: '12px 16px'}}
                >
                  Fechamento do Dia
                </ActionButton>
                <Button onClick={() => {
                  const relatorio = gerarRelatorioCompleto();
                  const janela = window.open('', '_blank', 'width=210mm,height=297mm');
                  janela.document.write(relatorio);
                  janela.document.close();
                  setTimeout(() => janela.print(), 500);
                }}>Imprimir Relatório Completo</Button>
              </div>
            </div>

            {/* Métricas por Período */}
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '30px'}}>
              {['dia', 'semana', 'mes'].map(periodo => (
                <div key={periodo} style={{
                  background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
                  border: '1px solid #404040',
                  borderRadius: '16px',
                  padding: '20px'
                }}>
                  <h3 style={{margin: '0 0 15px 0', textTransform: 'uppercase'}}>{periodo === 'dia' ? 'Hoje' : periodo === 'semana' ? 'Esta Semana' : 'Este Mês'}</h3>
                  <div style={{fontSize: '2rem', fontWeight: '800', color: '#00ff88', marginBottom: '10px'}}>
                    {formatarValor(relatorios.metricas[periodo]?.total || 0)}
                  </div>
                  <div style={{fontSize: '0.9rem', marginBottom: '5px'}}>
                    {relatorios.metricas[periodo]?.quantidade || 0} vendas
                  </div>
                  <div style={{fontSize: '0.9rem', color: '#cccccc'}}>
                    Ticket Médio: {formatarValor(relatorios.metricas[periodo]?.ticketMedio || 0)}
                  </div>
                </div>
              ))}
            </div>

            {/* Produtos Mais Vendidos */}
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '30px'}}>
              {['dia', 'semana', 'mes'].map(periodo => (
                <div key={periodo} style={{
                  background: '#111111',
                  border: '1px solid #333333',
                  borderRadius: '8px',
                  padding: '20px'
                }}>
                  <h4 style={{margin: '0 0 15px 0'}}>Top Produtos - {periodo === 'dia' ? 'Hoje' : periodo === 'semana' ? 'Semana' : 'Mês'}</h4>
                  {relatorios.produtosMaisVendidos[periodo]?.slice(0, 5).map((produto, index) => (
                    <div key={index} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      padding: '8px 0',
                      borderBottom: index < 4 ? '1px solid #333' : 'none'
                    }}>
                      <span style={{fontSize: '0.9rem'}}>{index + 1}. {produto.nome}</span>
                      <span style={{fontWeight: '600', color: '#00ff88'}}>{produto.quantidade}</span>
                    </div>
                  )) || <div style={{color: '#888', fontSize: '0.9rem'}}>Nenhuma venda</div>}
                </div>
              ))}
            </div>

            {/* Vendas por Forma de Pagamento */}
            <div style={{background: '#111111', border: '1px solid #333333', borderRadius: '8px', padding: '20px', marginBottom: '30px'}}>
              <h4 style={{margin: '0 0 20px 0'}}>Vendas por Forma de Pagamento - Este Mês</h4>
              <div style={{display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px'}}>
                {Object.entries(relatorios.metricas.mes?.porPagamento || {}).map(([tipo, valor]) => (
                  <div key={tipo} style={{textAlign: 'center'}}>
                    <div style={{fontSize: '1.5rem', fontWeight: '700', color: '#00ff88'}}>
                      {formatarValor(parseFloat(valor))}
                    </div>
                    <div style={{fontSize: '0.8rem', textTransform: 'uppercase', color: '#cccccc'}}>
                      {tipo.replace('_', ' ')}
                    </div>
                  </div>
                ))}
              </div>
            </div>



            {/* Relatório de Estoque Melhorado */}
            <div style={{background: '#111111', border: '1px solid #333333', borderRadius: '12px', padding: '25px'}}>
              <h4 style={{margin: '0 0 25px 0', color: '#fff', fontSize: '1.2rem'}}>Relatório de Estoque</h4>
              <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '25px'}}>
                {[
                  {
                    valor: estoque.length,
                    titulo: 'PRODUTOS ATIVOS',
                    cor: '#3b82f6',
                    icone: '🏷️',
                    detalhe: `${estoque.filter(p => p.ativo).length} ativos`
                  },
                  {
                    valor: estoque.reduce((sum, p) => sum + (p.estoque_atual || 0), 0),
                    titulo: 'TOTAL EM ESTOQUE',
                    cor: '#10b981',
                    icone: '📦',
                    detalhe: `Média: ${(estoque.reduce((sum, p) => sum + (p.estoque_atual || 0), 0) / estoque.length).toFixed(1)} por produto`
                  },
                  {
                    valor: estoque.filter(p => (p.estoque_atual || 0) < 5).length,
                    titulo: 'ESTOQUE BAIXO',
                    cor: '#ef4444',
                    icone: '⚠️',
                    detalhe: `${((estoque.filter(p => (p.estoque_atual || 0) < 5).length / estoque.length) * 100).toFixed(1)}% do total`
                  },
                  {
                    valor: formatarValor(estoque.reduce((sum, p) => sum + ((p.estoque_atual || 0) * (p.preco_venda || 0)), 0)),
                    titulo: 'VALOR TOTAL',
                    cor: '#8b5cf6',
                    detalhe: `Ticket médio: ${formatarValor(estoque.reduce((sum, p) => sum + (p.preco_venda || 0), 0) / estoque.length)}`
                  }
                ].map((item, index) => (
                  <div key={index} style={{
                    background: '#1a1a1a',
                    border: `1px solid ${item.cor}40`,
                    borderRadius: '10px',
                    padding: '20px',
                    textAlign: 'center',
                    position: 'relative'
                  }}>

                    
                    <div style={{
                      fontSize: '2.2rem',
                      fontWeight: '800',
                      color: item.cor,
                      marginBottom: '8px'
                    }}>{item.valor}</div>
                    
                    <div style={{
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      textTransform: 'uppercase',
                      letterSpacing: '1px',
                      color: '#ccc',
                      marginBottom: '8px'
                    }}>{item.titulo}</div>
                    
                    <div style={{
                      fontSize: '0.7rem',
                      color: '#999',
                      fontStyle: 'italic'
                    }}>{item.detalhe}</div>
                  </div>
                ))}
              </div>
              
              {/* Breakdown por Tipo */}
              <div style={{marginTop: '20px'}}>
                <h5 style={{margin: '0 0 15px 0', color: '#ccc'}}>Breakdown por Tipo:</h5>
                <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px'}}>
                  {Object.entries(
                    estoque.reduce((acc, p) => {
                      const tipo = p.tipo || 'Outros';
                      if (!acc[tipo]) acc[tipo] = { count: 0, stock: 0, value: 0 };
                      acc[tipo].count++;
                      acc[tipo].stock += p.estoque_atual || 0;
                      acc[tipo].value += (p.estoque_atual || 0) * (p.preco_venda || 0);
                      return acc;
                    }, {})
                  ).map(([tipo, data]) => (
                    <div key={tipo} style={{
                      background: '#222',
                      border: '1px solid #333',
                      borderRadius: '6px',
                      padding: '12px',
                      textAlign: 'center'
                    }}>
                      <div style={{fontWeight: 'bold', fontSize: '0.9rem', marginBottom: '4px'}}>{tipo}</div>
                      <div style={{fontSize: '0.8rem', color: '#999'}}>
                        {data.count} produtos | {data.stock} unidades
                      </div>
                      <div style={{fontSize: '0.7rem', color: '#10b981'}}>
                        {formatarValor(data.value)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'ferramentas' && (
          <div>
            <div style={{marginBottom: '30px'}}>
              <h2 style={{margin: 0, color: '#ffffff', marginBottom: '10px'}}>🔧 Ferramentas do Sistema</h2>
              <p style={{color: '#cccccc'}}>Relatórios especiais e ferramentas avançadas</p>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '20px',
              marginBottom: '30px'
            }}>
              <div style={{
                background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
                border: '2px solid #ff6b35',
                borderRadius: '12px',
                padding: '25px',
                cursor: 'pointer',
                transition: 'transform 0.2s ease'
              }}
              onClick={() => setActiveTab('blackfriday')}
              onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
              onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
              >
                <div style={{
                  fontSize: '3rem',
                  marginBottom: '15px',
                  textAlign: 'center'
                }}>📊</div>
                <h3 style={{
                  color: '#ff6b35',
                  marginBottom: '10px',
                  textAlign: 'center'
                }}>Relatório por Dia</h3>
                <p style={{
                  color: '#cccccc',
                  textAlign: 'center',
                  fontSize: '0.9rem'
                }}>Análise completa das vendas por dia com ranking de vendedores e produtos mais vendidos</p>
              </div>

              <div style={{
                background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
                border: '2px solid #10b981',
                borderRadius: '12px',
                padding: '25px',
                cursor: 'pointer',
                transition: 'transform 0.2s ease'
              }}
              onClick={() => setActiveTab('trocarsenha')}
              onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
              onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
              >
                <div style={{
                  fontSize: '3rem',
                  marginBottom: '15px',
                  textAlign: 'center'
                }}>🔐</div>
                <h3 style={{
                  color: '#10b981',
                  marginBottom: '10px',
                  textAlign: 'center'
                }}>Trocar Senha de Usuários</h3>
                <p style={{
                  color: '#cccccc',
                  textAlign: 'center',
                  fontSize: '0.9rem'
                }}>Ferramenta para alterar senhas de vendedores, gerentes e outros usuários do sistema</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'blackfriday' && (
          <div>
            <div style={{marginBottom: '20px'}}>
              <button
                onClick={() => setActiveTab('ferramentas')}
                style={{
                  background: '#333',
                  color: '#fff',
                  border: '1px solid #555',
                  borderRadius: '6px',
                  padding: '10px 15px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                ← Voltar para Ferramentas
              </button>
            </div>
            <RelatorioBlackFridayMogi />
          </div>
        )}

        {activeTab === 'trocarsenha' && (
          <div>
            <div style={{marginBottom: '20px'}}>
              <button
                onClick={() => setActiveTab('ferramentas')}
                style={{
                  background: '#333',
                  color: '#fff',
                  border: '1px solid #555',
                  borderRadius: '6px',
                  padding: '10px 15px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                ← Voltar para Ferramentas
              </button>
            </div>
            <TrocarSenhaUsuarios loja="mogi" />
          </div>
        )}
      </ContentArea>
      
      {/* Modal para Alterar Preço */}
      {modalAberto === 'preco' && (
        <Modal onClick={() => setModalAberto(null)}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <h3>Alterar Preço</h3>
              <CloseButton onClick={() => setModalAberto(null)}>×</CloseButton>
            </ModalHeader>
            
            <div style={{marginBottom: '20px'}}>
              <strong>Produto:</strong> {produtoEditando?.nome}<br/>
              <strong>Código:</strong> {produtoEditando?.codigo}<br/>
              <strong>Preço atual:</strong> {formatarValor(parseFloat(produtoEditando?.preco_venda || 0))}
            </div>
            
            <Input 
              type="number"
              step="0.01"
              placeholder="Novo preço"
              value={novoPreco}
              onChange={(e) => setNovoPreco(e.target.value)}
            />
            
            <div style={{display: 'flex', gap: '10px', justifyContent: 'flex-end'}}>
              <ActionButton className="secondary" onClick={() => setModalAberto(null)}>
                Cancelar
              </ActionButton>
              <ActionButton 
                className="warning" 
                onClick={() => alterarPreco(produtoEditando.id, novoPreco)}
              >
                Alterar Preço
              </ActionButton>
            </div>
          </ModalContent>
        </Modal>
      )}
      
      {/* Modal para Editar Produto */}
      {modalAberto === 'editar' && (
        <Modal onClick={() => setModalAberto(null)}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <h3>Editar Produto</h3>
              <CloseButton onClick={() => setModalAberto(null)}>×</CloseButton>
            </ModalHeader>
            
            <Input 
              placeholder="Nome"
              value={produtoEditando?.nome || ''}
              onChange={(e) => setProdutoEditando({...produtoEditando, nome: e.target.value})}
            />
            
            <select 
              value={produtoEditando?.tipo || ''}
              onChange={(e) => setProdutoEditando({...produtoEditando, tipo: e.target.value})}
              style={{
                width: '100%',
                padding: '15px',
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid #333333',
                borderRadius: '8px',
                color: '#ffffff',
                fontSize: '16px',
                marginBottom: '15px'
              }}
            >
              <option value="terno">Terno</option>
              <option value="camisa">Camisa</option>
              <option value="gravata">Gravata</option>
              <option value="costume">Costume</option>
              <option value="acessorio">Acessório</option>
              <option value="pre venda">Pré Venda</option>
            </select>
            
            <Input 
              placeholder="Cor"
              value={produtoEditando?.cor || ''}
              onChange={(e) => setProdutoEditando({...produtoEditando, cor: e.target.value})}
            />
            
            <Input 
              placeholder="Tamanho"
              value={produtoEditando?.tamanho || ''}
              onChange={(e) => setProdutoEditando({...produtoEditando, tamanho: e.target.value})}
            />
            
            <Input 
              type="number"
              step="0.01"
              placeholder="Preço"
              value={produtoEditando?.preco_venda || ''}
              onChange={(e) => setProdutoEditando({...produtoEditando, preco_venda: e.target.value})}
            />
            
            <Input 
              type="number"
              placeholder="Estoque"
              value={produtoEditando?.estoque_atual || ''}
              onChange={(e) => setProdutoEditando({...produtoEditando, estoque_atual: e.target.value})}
            />
            
            <div style={{display: 'flex', gap: '10px', justifyContent: 'flex-end'}}>
              <ActionButton className="secondary" onClick={() => setModalAberto(null)}>
                Cancelar
              </ActionButton>
              <ActionButton 
                className="primary" 
                onClick={() => editarProduto(produtoEditando)}
              >
                Salvar Alterações
              </ActionButton>
            </div>
          </ModalContent>
        </Modal>
      )}
      
      {/* Modal para Alterar Preços em Lote */}
      {modalAberto === 'precoLote' && (
        <Modal onClick={() => setModalAberto(null)}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <h3>Alterar Preços em Lote</h3>
              <CloseButton onClick={() => setModalAberto(null)}>×</CloseButton>
            </ModalHeader>
            
            <div style={{marginBottom: '20px'}}>
              <label style={{display: 'block', marginBottom: '10px', color: '#ccc'}}>Filtro:</label>
              <select 
                value={filtroLote}
                onChange={(e) => setFiltroLote(e.target.value)}
                style={{
                  width: '100%',
                  padding: '15px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid #333333',
                  borderRadius: '8px',
                  color: '#ffffff',
                  fontSize: '16px',
                  marginBottom: '15px'
                }}
              >
                <option value="todos" style={{background: '#333', color: '#000'}}>Todos os produtos</option>
                <option value="terno" style={{background: '#333', color: '#000'}}>Apenas Ternos</option>
                <option value="camisa" style={{background: '#333', color: '#000'}}>Apenas Camisas</option>
                <option value="gravata" style={{background: '#333', color: '#000'}}>Apenas Gravatas</option>
                <option value="costume" style={{background: '#333', color: '#000'}}>Apenas Costumes</option>
                <option value="acessorio" style={{background: '#333', color: '#000'}}>Apenas Acessórios</option>
                <option value="pre venda" style={{background: '#333', color: '#000'}}>Apenas Pré Vendas</option>
              </select>
            </div>
            
            <Input 
              type="number"
              step="0.01"
              placeholder="Novo preço para todos"
              value={novoPreco}
              onChange={(e) => setNovoPreco(e.target.value)}
            />
            
            <div style={{display: 'flex', gap: '10px', justifyContent: 'flex-end'}}>
              <ActionButton className="secondary" onClick={() => setModalAberto(null)}>
                Cancelar
              </ActionButton>
              <ActionButton 
                className="warning" 
                onClick={() => alterarPrecoLote(filtroLote, novoPreco)}
              >
                Alterar Preços
              </ActionButton>
            </div>
          </ModalContent>
        </Modal>
      )}
      
      {/* Modal para Registrar Saída - Gerente */}
      {showSaidaModal && (
        <Modal onClick={() => setShowSaidaModal(false)}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <h3>Registrar Saída de Caixa</h3>
              <CloseButton onClick={() => setShowSaidaModal(false)}>×</CloseButton>
            </ModalHeader>
            
            <div style={{marginBottom: '20px'}}>
              <label style={{display: 'block', marginBottom: '10px', color: '#ccc'}}>Valor da Saída (R$):</label>
              <Input
                type="number"
                min="0.01"
                step="0.01"
                placeholder="0,00"
                value={valorSaida}
                onChange={(e) => setValorSaida(parseFloat(e.target.value) || 0)}
              />
            </div>
            
            <div style={{marginBottom: '20px'}}>
              <label style={{display: 'block', marginBottom: '10px', color: '#ccc'}}>Observação/Motivo:</label>
              <textarea
                value={observacaoSaida}
                onChange={(e) => setObservacaoSaida(e.target.value)}
                rows={3}
                style={{
                  width: '100%',
                  padding: '15px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid #333333',
                  borderRadius: '8px',
                  color: '#ffffff',
                  fontSize: '16px',
                  resize: 'vertical'
                }}
                placeholder="Ex: Compra de material, pagamento de fornecedor, despesas operacionais, etc."
              />
            </div>
            
            <div style={{display: 'flex', gap: '10px', justifyContent: 'flex-end'}}>
              <ActionButton className="secondary" onClick={() => setShowSaidaModal(false)}>
                Cancelar
              </ActionButton>
              <ActionButton 
                className="danger" 
                onClick={registrarSaidaGerente}
                disabled={!valorSaida || !observacaoSaida.trim()}
                style={{opacity: (!valorSaida || !observacaoSaida.trim()) ? 0.5 : 1}}
              >
                Registrar Saída
              </ActionButton>
            </div>
          </ModalContent>
        </Modal>
      )}
      
      {/* Modal para Importar CSV */}
      {showImportModal && (
        <Modal onClick={() => setShowImportModal(false)}>
          <ModalContent onClick={(e) => e.stopPropagation()} style={{maxWidth: '600px'}}>
            <ModalHeader>
              <h3>Importar Produtos via CSV</h3>
              <CloseButton onClick={() => setShowImportModal(false)}>×</CloseButton>
            </ModalHeader>
            
            <div style={{marginBottom: '20px', padding: '15px', background: '#2a2a2a', borderRadius: '8px'}}>
              <h4 style={{margin: '0 0 10px 0', color: '#00ff88'}}>Formatos Aceitos:</h4>
              <div style={{fontSize: '12px', color: '#ccc', fontFamily: 'monospace'}}>
                codigo,nome,tipo,cor,tamanho,preco_venda,estoque_atual,estoque_minimo,ativo
              </div>
              <div style={{fontSize: '11px', color: '#999', marginTop: '8px'}}>
                ✅ CSV e XLSX: Importação automática<br/>
                ✅ XLSX é convertido para CSV automaticamente<br/>
                ✅ Use ponto para decimais (89.90)<br/>
                ✅ Campo ativo: true/false, sim/não
              </div>
            </div>
            
            <div style={{marginBottom: '20px'}}>
              <label style={{display: 'block', marginBottom: '10px', color: '#ccc'}}>Selecionar Arquivo (CSV recomendado):</label>
              <input
                type="file"
                accept=".csv,.xlsx"
                onChange={(e) => setCsvFile(e.target.files[0])}
                style={{
                  width: '100%',
                  padding: '15px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid #333333',
                  borderRadius: '8px',
                  color: '#ffffff',
                  fontSize: '16px'
                }}
              />
            </div>
            
            {importLogs.length > 0 && (
              <div style={{
                marginBottom: '20px',
                padding: '15px',
                background: '#0a0a0a',
                borderRadius: '8px',
                maxHeight: '200px',
                overflowY: 'auto',
                fontFamily: 'monospace',
                fontSize: '12px',
                border: '1px solid #333'
              }}>
                {importLogs.map((log, index) => (
                  <div key={index} style={{marginBottom: '4px', color: '#ccc'}}>
                    {log}
                  </div>
                ))}
              </div>
            )}
            
            <div style={{display: 'flex', gap: '10px', justifyContent: 'flex-end'}}>
              <ActionButton 
                className="secondary" 
                onClick={() => {
                  setShowImportModal(false);
                  setCsvFile(null);
                  setImportLogs([]);
                }}
              >
                Cancelar
              </ActionButton>
              <ActionButton 
                className="success" 
                onClick={importarCSV}
                disabled={!csvFile || importing}
                style={{opacity: (!csvFile || importing) ? 0.5 : 1}}
              >
                {importing ? 'Importando...' : 'Importar CSV'}
              </ActionButton>
            </div>
          </ModalContent>
        </Modal>
      )}
      
      {/* Modal Fechamento do Mês */}
      {modalAberto === 'fechamentoMes' && (() => {
        const { vendasMes, analise } = gerarFechamentoMes();
        const totalVendas = vendasMes.length;
        const totalValor = vendasMes.reduce((sum, v) => sum + parseFloat(v.valor_final || 0), 0);
        
        return (
          <Modal onClick={() => setModalAberto(null)}>
            <ModalContent onClick={(e) => e.stopPropagation()} style={{maxWidth: '700px'}}>
              <ModalHeader>
                <h3>Fechamento de Vendas do Mês</h3>
                <CloseButton onClick={() => setModalAberto(null)}>×</CloseButton>
              </ModalHeader>
              
              <div style={{marginBottom: '20px'}}>
                <h4>Resumo Geral</h4>
                <div style={{background: '#2a2a2a', padding: '15px', borderRadius: '8px'}}>
                  <div>Total de Vendas: {totalVendas}</div>
                  <div>Valor Total: {formatarValor(totalValor)}</div>
                  <div>Ticket Médio: {formatarValor(totalVendas > 0 ? totalValor / totalVendas : 0)}</div>
                </div>
              </div>
              
              <div style={{marginBottom: '20px'}}>
                <h4>Por Forma de Pagamento</h4>
                <div style={{background: '#2a2a2a', padding: '15px', borderRadius: '8px'}}>
                  {Object.entries(analise.valores)
                    .sort(([,a], [,b]) => b - a)
                    .map(([forma, valor]) => {
                      const qtd = analise.quantidade[forma] || 0;
                      const percentual = totalValor > 0 ? ((valor / totalValor) * 100).toFixed(1) : '0.0';
                      return (
                        <div key={forma} style={{marginBottom: '10px', padding: '10px', background: '#333', borderRadius: '4px'}}>
                          <div style={{fontWeight: 'bold'}}>{forma.replace('_', ' ').toUpperCase()}</div>
                          <div>{qtd} vendas - {formatarValor(valor)} ({percentual}%)</div>
                        </div>
                      );
                    })
                  }
                </div>
              </div>
              
              <div style={{display: 'flex', gap: '10px', justifyContent: 'flex-end'}}>
                <ActionButton className="secondary" onClick={() => setModalAberto(null)}>
                  Fechar
                </ActionButton>
              </div>
            </ModalContent>
          </Modal>
        );
      })()}
      
      {/* Modal Fechamento do Dia */}
      {modalAberto === 'fechamentoDia' && (() => {
        const { vendasDia, analise } = gerarFechamentoDia();
        const totalVendas = vendasDia.length;
        const totalValor = vendasDia.reduce((sum, v) => sum + parseFloat(v.valor_final || 0), 0);
        
        return (
          <Modal onClick={() => setModalAberto(null)}>
            <ModalContent onClick={(e) => e.stopPropagation()} style={{maxWidth: '700px'}}>
              <ModalHeader>
                <h3>Fechamento do Dia</h3>
                <CloseButton onClick={() => setModalAberto(null)}>×</CloseButton>
              </ModalHeader>
              
              <div style={{marginBottom: '20px'}}>
                <h4>Resumo do Dia</h4>
                <div style={{background: '#2a2a2a', padding: '15px', borderRadius: '8px'}}>
                  <div>Total de Vendas: {totalVendas}</div>
                  <div>Valor Total: {formatarValor(totalValor)}</div>
                  <div>Ticket Médio: {formatarValor(totalVendas > 0 ? totalValor / totalVendas : 0)}</div>
                </div>
              </div>
              
              <div style={{marginBottom: '20px'}}>
                <h4>Por Forma de Pagamento</h4>
                <div style={{background: '#2a2a2a', padding: '15px', borderRadius: '8px'}}>
                  {Object.entries(analise.valores).length > 0 ? 
                    Object.entries(analise.valores)
                      .sort(([,a], [,b]) => b - a)
                      .map(([forma, valor]) => {
                        const qtd = analise.quantidade[forma] || 0;
                        const percentual = totalValor > 0 ? ((valor / totalValor) * 100).toFixed(1) : '0.0';
                        return (
                          <div key={forma} style={{marginBottom: '10px', padding: '10px', background: '#333', borderRadius: '4px'}}>
                            <div style={{fontWeight: 'bold'}}>{forma.replace('_', ' ').toUpperCase()}</div>
                            <div>{qtd} vendas - {formatarValor(valor)} ({percentual}%)</div>
                          </div>
                        );
                      })
                    : <div style={{color: '#999'}}>Nenhuma venda hoje</div>
                  }
                </div>
              </div>
              
              <div style={{display: 'flex', gap: '10px', justifyContent: 'flex-end'}}>
                <ActionButton className="secondary" onClick={() => setModalAberto(null)}>
                  Fechar
                </ActionButton>
              </div>
            </ModalContent>
          </Modal>
        );
      })()}
      
      {/* Modal para Gerenciar Categorias */}
      {showCategoriaModal && (
        <Modal onClick={() => setShowCategoriaModal(false)}>
          <ModalContent onClick={(e) => e.stopPropagation()} style={{maxWidth: '500px'}}>
            <ModalHeader>
              <h3>Gerenciar Categorias</h3>
              <CloseButton onClick={() => setShowCategoriaModal(false)}>×</CloseButton>
            </ModalHeader>
            
            <div style={{marginBottom: '20px'}}>
              <h4>Categorias Existentes:</h4>
              <div style={{background: '#2a2a2a', padding: '15px', borderRadius: '8px', marginBottom: '15px'}}>
                {categorias.map((categoria, index) => (
                  <div key={index} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 0',
                    borderBottom: index < categorias.length - 1 ? '1px solid #333' : 'none'
                  }}>
                    <span>{categoria.charAt(0).toUpperCase() + categoria.slice(1)}</span>
                    <ActionButton 
                      className="danger"
                      onClick={() => {
                        if (confirm(`Excluir categoria "${categoria}"?`)) {
                          setCategorias(categorias.filter(c => c !== categoria));
                        }
                      }}
                      style={{fontSize: '10px', padding: '4px 8px'}}
                    >
                      Excluir
                    </ActionButton>
                  </div>
                ))}
              </div>
            </div>
            
            <div style={{marginBottom: '20px'}}>
              <h4>Adicionar Nova Categoria:</h4>
              <Input
                placeholder="Nome da categoria"
                value={novaCategoria}
                onChange={(e) => setNovaCategoria(e.target.value)}
              />
              <ActionButton 
                className="success"
                onClick={() => {
                  if (novaCategoria.trim() && !categorias.includes(novaCategoria.trim())) {
                    setCategorias([...categorias, novaCategoria.trim()]);
                    setNovaCategoria('');
                  }
                }}
                disabled={!novaCategoria.trim() || categorias.includes(novaCategoria.trim())}
              >
                Adicionar Categoria
              </ActionButton>
            </div>
            
            <div style={{display: 'flex', gap: '10px', justifyContent: 'flex-end'}}>
              <ActionButton className="secondary" onClick={() => setShowCategoriaModal(false)}>
                Fechar
              </ActionButton>
            </div>
          </ModalContent>
        </Modal>
      )}
      
      {/* Modal QR Code */}
      {produtoQRCode && (
        <GeradorQRCode 
          produto={produtoQRCode}
          onClose={() => setProdutoQRCode(null)}
        />
      )}
      
      {/* Modal QR Code Lote */}
      {showQRCodeLote && (
        <GeradorQRCodeLote 
          produtos={produtosFiltrados}
          onClose={() => setShowQRCodeLote(false)}
        />
      )}
    </Container>
  );

  function gerarRelatorioCompleto() {
    const hoje = new Date();
    const dataFormatada = hoje.toLocaleDateString('pt-BR', { 
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
    });
    const horaFormatada = hoje.toLocaleTimeString('pt-BR');
    
    // Cálculos para o relatório
    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    const mesAnterior = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1);
    const fimMesAnterior = new Date(hoje.getFullYear(), hoje.getMonth(), 0);
    
    const vendasMesAtual = vendas.filter(v => 
      new Date(v.data_venda) >= inicioMes && v.forma_pagamento !== 'pendente_caixa'
    );
    const vendasMesAnterior = vendas.filter(v => 
      new Date(v.data_venda) >= mesAnterior && new Date(v.data_venda) <= fimMesAnterior && v.forma_pagamento !== 'pendente_caixa'
    );
    
    const totalMesAtual = vendasMesAtual.reduce((sum, v) => sum + parseFloat(v.valor_final || 0), 0);
    const totalMesAnterior = vendasMesAnterior.reduce((sum, v) => sum + parseFloat(v.valor_final || 0), 0);
    const crescimento = totalMesAnterior > 0 ? ((totalMesAtual - totalMesAnterior) / totalMesAnterior * 100) : 0;
    
    // Performance por vendedor
    const performanceVendedores = vendedores.map(vendedor => {
      const vendasVendedor = vendasMesAtual.filter(v => v.vendedor_nome === vendedor.nome);
      const totalVendedor = vendasVendedor.reduce((sum, v) => sum + parseFloat(v.valor_final || 0), 0);
      const meta = parseFloat(vendedor.meta_mensal || 0);
      const ticketMedio = vendasVendedor.length > 0 ? totalVendedor / vendasVendedor.length : 0;
      
      return {
        nome: vendedor.nome,
        total: totalVendedor,
        meta,
        atingiuMeta: totalVendedor >= meta,
        percentualMeta: meta > 0 ? (totalVendedor / meta * 100) : 0,
        ticketMedio,
        quantidadeVendas: vendasVendedor.length
      };
    }).sort((a, b) => b.total - a.total);
    
    // Análise por categoria
    const vendasPorCategoria = estoque.reduce((acc, produto) => {
      const categoria = produto.tipo || 'Outros';
      if (!acc[categoria]) acc[categoria] = { quantidade: 0, valor: 0, produtos: 0 };
      
      // Buscar vendas deste produto nas vendas do mês
      relatorios.produtosMaisVendidos.mes?.forEach(produtoVendido => {
        if (produtoVendido.nome === produto.nome) {
          acc[categoria].quantidade += produtoVendido.quantidade;
          acc[categoria].valor += produtoVendido.valor;
        }
      });
      
      acc[categoria].produtos++;
      return acc;
    }, {});
    
    // Produtos com baixo giro
    const produtosBaixoGiro = estoque.filter(p => {
      const temVendas = relatorios.produtosMaisVendidos.mes?.some(produto => produto.nome === p.nome);
      return !temVendas && (p.estoque_atual || 0) > 0;
    });
    
    // Análise de caixa
    const totalEntradas = relatorios.movimentacoesCaixa
      .filter(m => m.tipo === 'entrada')
      .reduce((sum, m) => sum + parseFloat(m.valor || 0), 0);
    
    const totalSaidas = relatorios.movimentacoesCaixa
      .filter(m => m.tipo === 'saida')
      .reduce((sum, m) => sum + parseFloat(m.valor || 0), 0);
    
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Relatório Gerencial Completo - VH Tatuapé</title>
          <meta charset="UTF-8">
          <style>
            @page { size: A4; margin: 1.5cm; }
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: 'Arial', sans-serif; 
              line-height: 1.3; 
              color: #333; 
              background: #fff;
              font-size: 10pt;
            }
            .header {
              text-align: center;
              border-bottom: 2px solid #2c3e50;
              padding-bottom: 10mm;
              margin-bottom: 15mm;
            }
            .logo {
              font-size: 20pt;
              font-weight: bold;
              color: #2c3e50;
              margin-bottom: 3mm;
            }
            .section {
              margin-bottom: 15mm;
              page-break-inside: avoid;
            }
            .section-title {
              background: #34495e;
              color: white;
              padding: 6mm 8mm;
              font-size: 11pt;
              font-weight: bold;
              margin-bottom: 8mm;
              border-radius: 2mm;
            }
            .metrics-grid {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 5mm;
              margin-bottom: 10mm;
            }
            .metric-card {
              background: #f8f9fa;
              border: 1pt solid #e9ecef;
              border-radius: 2mm;
              padding: 6mm;
              text-align: center;
            }
            .metric-value {
              font-size: 14pt;
              font-weight: bold;
              color: #2c3e50;
              margin-bottom: 2mm;
            }
            .metric-label {
              font-size: 8pt;
              color: #666;
              text-transform: uppercase;
            }
            .table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 8mm;
              font-size: 8pt;
            }
            .table th {
              background: #34495e;
              color: white;
              padding: 3mm;
              text-align: left;
              font-weight: bold;
              font-size: 8pt;
            }
            .table td {
              padding: 2mm 3mm;
              border-bottom: 0.5pt solid #ecf0f1;
            }
            .highlight-positive { color: #27ae60; font-weight: bold; }
            .highlight-negative { color: #e74c3c; font-weight: bold; }
            .two-column {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 10mm;
            }
            .kpi-box {
              background: #ecf0f1;
              padding: 5mm;
              border-radius: 2mm;
              margin-bottom: 5mm;
            }
            .page-break { page-break-before: always; }
          </style>
        </head>
        <body>
          <div class="header">
            <img src="/images/relatorio logo.png" alt="Logo" style="height: 120px; margin-bottom: 5px;" />
            <div style="font-size: 12pt; margin-bottom: 2mm;">RELATÓRIO GERENCIAL COMPLETO</div>
            <div style="font-size: 9pt; color: #666;">Gerado em ${dataFormatada} às ${horaFormatada}</div>
          </div>
          
          <!-- 1. RESUMO EXECUTIVO -->
          <div class="section">
            <div class="section-title">📊 1. RESUMO EXECUTIVO</div>
            <div class="kpi-box">
              <strong>Resultado Geral do Período:</strong> R$ ${totalMesAtual.toFixed(2)} em ${vendasMesAtual.length} vendas<br>
              <strong>Crescimento:</strong> <span class="${crescimento >= 0 ? 'highlight-positive' : 'highlight-negative'}">
                ${crescimento >= 0 ? '+' : ''}${crescimento.toFixed(1)}%
              </span> em relação ao mês anterior<br>
              <strong>Meta da Loja:</strong> ${performanceVendedores.filter(v => v.atingiuMeta).length}/${performanceVendedores.length} vendedores atingiram suas metas<br>
              <strong>Ticket Médio:</strong> R$ ${vendasMesAtual.length > 0 ? (totalMesAtual / vendasMesAtual.length).toFixed(2) : '0.00'}
            </div>
          </div>
          
          <!-- 2. PERFORMANCE DE VENDAS -->
          <div class="section">
            <div class="section-title">💰 2. PERFORMANCE DE VENDAS</div>
            <div class="metrics-grid">
              <div class="metric-card">
                <div class="metric-value">R$ ${totalMesAtual.toFixed(0)}</div>
                <div class="metric-label">Total Vendido</div>
              </div>
              <div class="metric-card">
                <div class="metric-value">${vendasMesAtual.length}</div>
                <div class="metric-label">Vendas Realizadas</div>
              </div>
              <div class="metric-card">
                <div class="metric-value">R$ ${(totalMesAtual / Math.max(vendasMesAtual.length, 1)).toFixed(0)}</div>
                <div class="metric-label">Ticket Médio</div>
              </div>
              <div class="metric-card">
                <div class="metric-value">${crescimento >= 0 ? '+' : ''}${crescimento.toFixed(1)}%</div>
                <div class="metric-label">vs Mês Anterior</div>
              </div>
            </div>
            
            <h4>Vendas por Forma de Pagamento:</h4>
            <table class="table">
              <thead>
                <tr><th>Forma de Pagamento</th><th>Quantidade</th><th>Valor Total</th><th>%</th></tr>
              </thead>
              <tbody>
                ${Object.entries(relatorios.metricas.mes?.porPagamento || {}).map(([tipo, valor]) => {
                  const qtd = vendasMesAtual.filter(v => v.forma_pagamento === tipo).length;
                  const percentual = totalMesAtual > 0 ? (valor / totalMesAtual * 100) : 0;
                  return `<tr>
                    <td>${tipo.replace('_', ' ').toUpperCase()}</td>
                    <td>${qtd}</td>
                    <td>R$ ${parseFloat(valor).toFixed(2)}</td>
                    <td>${percentual.toFixed(1)}%</td>
                  </tr>`;
                }).join('')}
              </tbody>
            </table>
          </div>
          
          <!-- 3. PERFORMANCE POR CATEGORIA -->
          <div class="section">
            <div class="section-title">📦 3. VENDAS POR CATEGORIA</div>
            <table class="table">
              <thead>
                <tr><th>Categoria</th><th>Produtos</th><th>Qtd Vendida</th><th>Valor Total</th><th>% do Total</th></tr>
              </thead>
              <tbody>
                ${Object.entries(vendasPorCategoria).map(([categoria, dados]) => {
                  const percentual = totalMesAtual > 0 ? (dados.valor / totalMesAtual * 100) : 0;
                  return `<tr>
                    <td>${categoria}</td>
                    <td>${dados.produtos}</td>
                    <td>${dados.quantidade}</td>
                    <td>R$ ${dados.valor.toFixed(2)}</td>
                    <td>${percentual.toFixed(1)}%</td>
                  </tr>`;
                }).join('')}
              </tbody>
            </table>
          </div>
          
          <!-- 4. PERFORMANCE POR VENDEDOR -->
          <div class="section page-break">
            <div class="section-title">👥 4. PERFORMANCE POR VENDEDOR</div>
            <table class="table">
              <thead>
                <tr><th>Vendedor</th><th>Total Vendido</th><th>Meta</th><th>% Meta</th><th>Vendas</th><th>Ticket Médio</th><th>Status</th></tr>
              </thead>
              <tbody>
                ${performanceVendedores.map((vendedor, index) => `
                <tr>
                  <td>${index + 1}º ${vendedor.nome}</td>
                  <td>R$ ${vendedor.total.toFixed(2)}</td>
                  <td>R$ ${vendedor.meta.toFixed(2)}</td>
                  <td class="${vendedor.atingiuMeta ? 'highlight-positive' : 'highlight-negative'}">
                    ${vendedor.percentualMeta.toFixed(1)}%
                  </td>
                  <td>${vendedor.quantidadeVendas}</td>
                  <td>R$ ${vendedor.ticketMedio.toFixed(2)}</td>
                  <td>${vendedor.atingiuMeta ? '✅ Meta Atingida' : '❌ Abaixo da Meta'}</td>
                </tr>`).join('')}
              </tbody>
            </table>
          </div>
          
          <!-- 5. PRODUTOS MAIS VENDIDOS -->
          <div class="section">
            <div class="section-title">🏆 5. PRODUTOS MAIS VENDIDOS</div>
            <table class="table">
              <thead>
                <tr><th>Pos.</th><th>Produto</th><th>Quantidade</th><th>Valor Total</th><th>% do Total</th></tr>
              </thead>
              <tbody>
                ${relatorios.produtosMaisVendidos.mes?.slice(0, 15).map((produto, index) => {
                  const percentual = totalMesAtual > 0 ? (produto.valor / totalMesAtual * 100) : 0;
                  return `<tr>
                    <td>${index + 1}º</td>
                    <td>${produto.nome}</td>
                    <td>${produto.quantidade}</td>
                    <td>R$ ${produto.valor.toFixed(2)}</td>
                    <td>${percentual.toFixed(1)}%</td>
                  </tr>`;
                }).join('') || '<tr><td colspan="5">Nenhuma venda registrada</td></tr>'}
              </tbody>
            </table>
          </div>
          
          <!-- 6. CAIXA E FINANCEIRO -->
          <div class="section">
            <div class="section-title">💳 6. CAIXA E FINANCEIRO</div>
            <div class="metrics-grid">
              <div class="metric-card">
                <div class="metric-value">R$ ${totalEntradas.toFixed(2)}</div>
                <div class="metric-label">Total Entradas</div>
              </div>
              <div class="metric-card">
                <div class="metric-value">R$ ${totalSaidas.toFixed(2)}</div>
                <div class="metric-label">Total Saídas</div>
              </div>
              <div class="metric-card">
                <div class="metric-value">R$ ${(totalEntradas - totalSaidas).toFixed(2)}</div>
                <div class="metric-label">Saldo Líquido</div>
              </div>
              <div class="metric-card">
                <div class="metric-value">${relatorios.movimentacoesCaixa.length}</div>
                <div class="metric-label">Movimentações</div>
              </div>
            </div>
          </div>
          
          <!-- 7. INDICADORES DE DESEMPENHO -->
          <div class="section">
            <div class="section-title">📈 7. INDICADORES DE DESEMPENHO (KPIs)</div>
            <div class="two-column">
              <div>
                <div class="kpi-box">
                  <strong>Ticket Médio:</strong> R$ ${(totalMesAtual / Math.max(vendasMesAtual.length, 1)).toFixed(2)}<br>
                  <strong>Vendas por Dia:</strong> ${(vendasMesAtual.length / hoje.getDate()).toFixed(1)}<br>
                  <strong>Valor por Dia:</strong> R$ ${(totalMesAtual / hoje.getDate()).toFixed(2)}
                </div>
              </div>
              <div>
                <div class="kpi-box">
                  <strong>Metas Atingidas:</strong> ${performanceVendedores.filter(v => v.atingiuMeta).length}/${performanceVendedores.length} (${((performanceVendedores.filter(v => v.atingiuMeta).length / performanceVendedores.length) * 100).toFixed(1)}%)<br>
                  <strong>Crescimento:</strong> ${crescimento >= 0 ? '+' : ''}${crescimento.toFixed(1)}%<br>
                  <strong>Produtos Ativos:</strong> ${estoque.length}
                </div>
              </div>
            </div>
          </div>
          
          <!-- 8. ESTOQUE -->
          <div class="section page-break">
            <div class="section-title">📦 8. ANÁLISE DE ESTOQUE</div>
            <div class="metrics-grid">
              <div class="metric-card">
                <div class="metric-value">${estoque.length}</div>
                <div class="metric-label">Produtos Ativos</div>
              </div>
              <div class="metric-card">
                <div class="metric-value">${estoque.filter(p => (p.estoque_atual || 0) < 5).length}</div>
                <div class="metric-label">Estoque Baixo</div>
              </div>
              <div class="metric-card">
                <div class="metric-value">${produtosBaixoGiro.length}</div>
                <div class="metric-label">Sem Giro no Mês</div>
              </div>
              <div class="metric-card">
                <div class="metric-value">R$ ${(estoque.reduce((sum, p) => sum + ((p.estoque_atual || 0) * (p.preco_venda || 0)), 0) / 1000).toFixed(0)}K</div>
                <div class="metric-label">Valor Total</div>
              </div>
            </div>
            
            ${estoque.filter(p => (p.estoque_atual || 0) < 5 && (p.estoque_atual || 0) >= 0).length > 0 ? `
            <h4>Produtos com Estoque Baixo (< 5 unidades):</h4>
            <table class="table">
              <thead>
                <tr><th>Produto</th><th>Código</th><th>Estoque</th><th>Preço</th><th>Ação</th></tr>
              </thead>
              <tbody>
                ${estoque.filter(p => (p.estoque_atual || 0) < 5 && (p.estoque_atual || 0) >= 0).slice(0, 10).map(produto => `
                <tr>
                  <td>${produto.nome}</td>
                  <td>${produto.codigo}</td>
                  <td class="highlight-negative">${produto.estoque_atual}</td>
                  <td>R$ ${parseFloat(produto.preco_venda || 0).toFixed(2)}</td>
                  <td>Repor Urgente</td>
                </tr>`).join('')}
              </tbody>
            </table>` : ''}
          </div>
          
          <!-- 9. PROBLEMAS IDENTIFICADOS -->
          <div class="section">
            <div class="section-title">⚠️ 9. PROBLEMAS IDENTIFICADOS</div>
            <div class="kpi-box">
              <strong>Produtos sem Giro:</strong> ${produtosBaixoGiro.length} produtos não venderam no mês<br>
              <strong>Estoque Baixo:</strong> ${estoque.filter(p => (p.estoque_atual || 0) < 5).length} produtos precisam reposição<br>
              <strong>Vendedores Abaixo da Meta:</strong> ${performanceVendedores.filter(v => !v.atingiuMeta).length} vendedores não atingiram a meta<br>
              <strong>Vendas Pendentes:</strong> ${vendas.filter(v => v.forma_pagamento === 'pendente_caixa').length} vendas aguardando pagamento
            </div>
          </div>
          
          <!-- 10. PLANO DE AÇÃO -->
          <div class="section">
            <div class="section-title">🎯 10. PLANO DE AÇÃO RECOMENDADO</div>
            <div class="kpi-box">
              <strong>Ações Imediatas:</strong><br>
              • Repor ${estoque.filter(p => (p.estoque_atual || 0) < 5).length} produtos com estoque baixo<br>
              • Treinar ${performanceVendedores.filter(v => !v.atingiuMeta).length} vendedores que não atingiram meta<br>
              ${produtosBaixoGiro.length > 0 ? `• Promover ${produtosBaixoGiro.slice(0, 3).map(p => p.nome).join(', ')} (produtos parados)<br>` : ''}
              • Finalizar ${vendas.filter(v => v.forma_pagamento === 'pendente_caixa').length} vendas pendentes<br><br>
              <strong>Ações Estratégicas:</strong><br>
              • ${crescimento < 0 ? 'Implementar estratégias para reverter queda nas vendas' : 'Manter estratégias que geraram crescimento'}<br>
              • Focar em categorias com melhor performance<br>
              • Ajustar metas baseado na performance atual
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 15mm; color: #7f8c8d; font-size: 8pt; border-top: 1pt solid #ecf0f1; padding-top: 5mm;">
            <p><strong>VH Gravatas - Sistema de Gestão Comercial</strong></p>
            <p>Relatório gerado automaticamente • Dados atualizados até ${horaFormatada}</p>
            <p>Para dúvidas ou sugestões, contate o suporte técnico</p>
          </div>
        </body>
      </html>
    `;
  }
}

