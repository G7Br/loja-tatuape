import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { supabase } from '../utils/supabase';
import { useTheme } from '../contexts/ThemeContext';
import { renderEstoquePage, renderSaidaValoresPage, renderVendedoresPage } from './CaixaPages';
import ComprovanteVenda from './ComprovanteVenda';
import CaixaController from './CaixaController';
import SistemaVendas from './SistemaVendas';

const Container = styled.div`
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: ${props => props.darkMode ? '#0f0f0f' : '#f8fafc'};
  color: ${props => props.darkMode ? '#ffffff' : '#1a1a1a'};
  transition: all 0.3s ease;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 2rem;
  background: ${props => props.darkMode ? '#1a1a1a' : '#ffffff'};
  border-bottom: 1px solid ${props => props.darkMode ? '#333' : '#e5e7eb'};
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
`;

const SearchBar = styled.input`
  flex: 1;
  max-width: 400px;
  padding: 0.75rem 1rem;
  margin: 0 2rem;
  border: 2px solid ${props => props.darkMode ? '#333' : '#e5e7eb'};
  border-radius: 0.5rem;
  background: ${props => props.darkMode ? '#2a2a2a' : '#ffffff'};
  color: ${props => props.darkMode ? '#ffffff' : '#1a1a1a'};
  font-size: 1rem;
  
  &:focus {
    outline: none;
    border-color: ${props => props.darkMode ? '#4f46e5' : '#3b82f6'};
  }
  
  &::placeholder {
    color: ${props => props.darkMode ? '#888' : '#6b7280'};
  }
`;

const ThemeToggle = styled.button`
  padding: 0.75rem;
  border: none;
  border-radius: 0.5rem;
  background: ${props => props.darkMode ? '#333' : '#f3f4f6'};
  color: ${props => props.darkMode ? '#ffffff' : '#1a1a1a'};
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background: ${props => props.darkMode ? '#444' : '#e5e7eb'};
  }
`;

const MainContent = styled.div`
  display: flex;
  flex: 1;
  overflow: hidden;
`;

const Sidebar = styled.div`
  width: 250px;
  background: ${props => props.darkMode ? '#1a1a1a' : '#ffffff'};
  border-right: 1px solid ${props => props.darkMode ? '#333' : '#e5e7eb'};
  display: flex;
  flex-direction: column;
  position: relative;
`;

const MenuToggle = styled.button`
  padding: 1rem;
  border: none;
  background: transparent;
  color: ${props => props.darkMode ? '#ffffff' : '#1a1a1a'};
  cursor: pointer;
  font-size: 1.2rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  position: relative;
  
  &:hover {
    background: ${props => props.darkMode ? '#333' : '#f3f4f6'};
  }
  
  &:hover + div {
    opacity: 1;
    visibility: visible;
    transform: translateY(0);
  }
`;

const MenuDropdown = styled.div`
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: ${props => props.darkMode ? '#1a1a1a' : '#ffffff'};
  border: 1px solid ${props => props.darkMode ? '#333' : '#e5e7eb'};
  border-top: none;
  opacity: 0;
  visibility: hidden;
  transform: translateY(-10px);
  transition: all 0.3s ease;
  z-index: 1000;
  
  &:hover {
    opacity: 1;
    visibility: visible;
    transform: translateY(0);
  }
`;

const DateTime = styled.div`
  padding: 0.5rem 1rem;
  font-size: 0.8rem;
  color: ${props => props.darkMode ? '#888' : '#6b7280'};
  border-bottom: 1px solid ${props => props.darkMode ? '#333' : '#e5e7eb'};
`;

const MenuItem = styled.button`
  padding: 1rem 1.25rem;
  border: none;
  background: ${props => props.active ? (props.darkMode ? '#2563eb' : '#3b82f6') : 'transparent'};
  color: ${props => props.active ? '#ffffff' : (props.darkMode ? '#d1d5db' : '#374151')};
  text-align: left;
  cursor: pointer;
  transition: all 0.2s ease;
  border-radius: 0.5rem;
  margin: 0.25rem 0.75rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  white-space: nowrap;
  font-weight: ${props => props.active ? '600' : '500'};
  font-size: 0.9rem;
  
  &:hover {
    background: ${props => props.active ? (props.darkMode ? '#2563eb' : '#3b82f6') : (props.darkMode ? '#374151' : '#f3f4f6')};
    color: ${props => props.active ? '#ffffff' : (props.darkMode ? '#ffffff' : '#1f2937')};
    transform: translateX(4px);
  }
`;

const SidebarFooter = styled.div`
  margin-top: auto;
  padding: 1rem;
  display: flex;
  gap: 0.5rem;
`;

const IconButton = styled.button`
  padding: 0.5rem;
  border: none;
  border-radius: 0.375rem;
  background: ${props => props.darkMode ? '#333' : '#f3f4f6'};
  color: ${props => props.darkMode ? '#ffffff' : '#1a1a1a'};
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background: ${props => props.darkMode ? '#444' : '#e5e7eb'};
  }
`;

const CenterArea = styled.div`
  flex: 1;
  padding: 2rem;
  overflow-y: auto;
`;

const TableContainer = styled.div`
  background: ${props => props.darkMode ? '#1a1a1a' : '#ffffff'};
  border-radius: 0.5rem;
  border: 1px solid ${props => props.darkMode ? '#333' : '#e5e7eb'};
  overflow: hidden;
`;

const TableHeader = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1fr 1fr;
  gap: 1rem;
  padding: 1rem;
  background: ${props => props.darkMode ? '#2a2a2a' : '#f9fafb'};
  font-weight: 600;
  border-bottom: 1px solid ${props => props.darkMode ? '#333' : '#e5e7eb'};
`;

const TableRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1fr 1fr;
  gap: 1rem;
  padding: 1rem;
  border-bottom: 1px solid ${props => props.darkMode ? '#333' : '#e5e7eb'};
  transition: background 0.2s ease;
  cursor: pointer;
  
  &:hover {
    background: ${props => props.darkMode ? '#2a2a2a' : '#f9fafb'};
  }
  
  &:last-child {
    border-bottom: none;
  }
`;

const CaixaStatus = styled.div`
  background: ${props => props.aberto ? '#10b981' : '#ef4444'};
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  font-weight: 600;
  text-align: center;
  margin-bottom: 1rem;
`;

const RightSidebar = styled.div`
  width: 200px;
  padding: 2rem 1rem;
  background: ${props => props.darkMode ? '#1a1a1a' : '#ffffff'};
  border-left: 1px solid ${props => props.darkMode ? '#333' : '#e5e7eb'};
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const CategoryButton = styled.button`
  padding: 1rem;
  border: none;
  border-radius: 0.75rem;
  background: ${props => props.darkMode ? '#333' : '#f3f4f6'};
  color: ${props => props.darkMode ? '#ffffff' : '#1a1a1a'};
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background: ${props => props.darkMode ? '#444' : '#e5e7eb'};
    transform: translateY(-2px);
  }
`;

const Footer = styled.div`
  padding: 1rem 2rem;
  background: ${props => props.darkMode ? '#1a1a1a' : '#ffffff'};
  border-top: 1px solid ${props => props.darkMode ? '#333' : '#e5e7eb'};
  display: flex;
  justify-content: center;
  gap: 2rem;
  color: ${props => props.darkMode ? '#888' : '#6b7280'};
`;

const PaymentCounter = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  font-weight: 600;
`;

export default function Caixa({ user, onLogout }) {
  const { theme, themeName, toggleTheme } = useTheme();
  const darkMode = themeName === 'dark';
  const [activeMenu, setActiveMenu] = useState('vendas');
  const [searchTerm, setSearchTerm] = useState('');
  const [vendas, setVendas] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [caixaAberto, setCaixaAberto] = useState(false);
  const [vendasDia, setVendasDia] = useState({ dinheiro: 0, credito: 0, debito: 0, pix: 0 });
  const [vendaSelecionada, setVendaSelecionada] = useState(null);
  const [itensVenda, setItensVenda] = useState([]);
  const [desconto, setDesconto] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [metodoPagamento, setMetodoPagamento] = useState('');
  const [valorPago, setValorPago] = useState(0);
  const [produtos, setProdutos] = useState([]);
  const [vendedores, setVendedores] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [historicoVendas, setHistoricoVendas] = useState([]);
  const [showCaixaModal, setShowCaixaModal] = useState(false);
  const [caixaAction, setCaixaAction] = useState('');
  const [senha, setSenha] = useState('');
  const [valorInicial, setValorInicial] = useState(0);
  const [registroCaixa, setRegistroCaixa] = useState(null);
  const [historicoRegistros, setHistoricoRegistros] = useState([]);
  const [showSaidaModal, setShowSaidaModal] = useState(false);
  const [valorSaida, setValorSaida] = useState(0);
  const [observacaoSaida, setObservacaoSaida] = useState('');
  const [historicoSaidas, setHistoricoSaidas] = useState([]);
  const [vendedoresTab, setVendedoresTab] = useState('lista');
  const [formCliente, setFormCliente] = useState({
    nome_completo: '',
    telefone: '',
    cpf: '',
    cidade: '',
    onde_conheceu: '',
    observacoes: ''
  });
  const [showPosVendaModal, setShowPosVendaModal] = useState(false);
  const [vendaFinalizada, setVendaFinalizada] = useState(null);
  const [showComprovante, setShowComprovante] = useState(false);
  const [relatorioFechamento, setRelatorioFechamento] = useState(null);
  const [showSistemaVendas, setShowSistemaVendas] = useState(false);

  // Função para obter placeholder da barra de pesquisa baseado na página ativa
  const getSearchPlaceholder = () => {
    switch(activeMenu) {
      case 'vendas': return 'Buscar por cliente, vendedor ou número da venda...';
      case 'estoque': return 'Buscar produtos por nome, código ou tipo...';
      case 'vendedores': return 'Buscar vendedores ou clientes...';
      case 'historico': return 'Buscar no histórico por cliente, vendedor...';
      case 'customes':
      case 'ternos':
      case 'camisas':
      case 'gravatas':
      case 'acessorios': return 'Buscar produtos por nome ou tipo...';
      default: return 'Buscar...';
    }
  };

  // Função para filtrar vendas
  const filtrarVendas = (vendas) => {
    if (!searchTerm) return vendas;
    const termo = searchTerm.toLowerCase();
    return vendas.filter(venda => 
      venda.cliente_nome?.toLowerCase().includes(termo) ||
      venda.vendedor_nome?.toLowerCase().includes(termo) ||
      venda.numero_venda?.toString().includes(termo)
    );
  };

  // Função para filtrar produtos
  const filtrarProdutos = (produtos) => {
    if (!searchTerm) return produtos;
    const termo = searchTerm.toLowerCase();
    return produtos.filter(produto => 
      produto.nome?.toLowerCase().includes(termo) ||
      produto.codigo?.toLowerCase().includes(termo) ||
      produto.tipo?.toLowerCase().includes(termo)
    );
  };

  // Função para filtrar vendedores
  const filtrarVendedores = (vendedores) => {
    if (!searchTerm) return vendedores;
    const termo = searchTerm.toLowerCase();
    return vendedores.filter(vendedor => 
      vendedor.nome?.toLowerCase().includes(termo) ||
      vendedor.email?.toLowerCase().includes(termo)
    );
  };

  // Função para filtrar clientes
  const filtrarClientes = (clientes) => {
    if (!searchTerm) return clientes;
    const termo = searchTerm.toLowerCase();
    return clientes.filter(cliente => 
      cliente.cliente_nome?.toLowerCase().includes(termo) ||
      cliente.cliente_telefone?.includes(termo)
    );
  };

  // Função para filtrar histórico
  const filtrarHistorico = (historico) => {
    if (!searchTerm) return historico;
    const termo = searchTerm.toLowerCase();
    return historico.filter(venda => 
      venda.cliente_nome?.toLowerCase().includes(termo) ||
      venda.vendedor_nome?.toLowerCase().includes(termo) ||
      venda.numero_venda?.toString().includes(termo) ||
      venda.forma_pagamento?.toLowerCase().includes(termo)
    );
  };

  useEffect(() => {
    carregarDados();
    verificarCaixaAberto();
    carregarHistoricoRegistros();
    carregarHistoricoSaidas();
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    
    const dataTimer = setInterval(() => {
      carregarDados();
    }, 30000);
    
    return () => {
      clearInterval(timer);
      clearInterval(dataTimer);
    };
  }, []);

  // Limpar busca ao mudar de página
  useEffect(() => {
    setSearchTerm('');
  }, [activeMenu]);

  const verificarCaixaAberto = async () => {
    try {
      const hoje = new Date().toISOString().split('T')[0];
      const { data } = await supabase
        .from('fechamentos_caixa_tatuape')
        .select('*')
        .eq('usuario_id', user.id)
        .eq('data_fechamento', hoje)
        .eq('status', 'aberto')
        .single();
      
      setCaixaAberto(!!data);
    } catch (error) {
      setCaixaAberto(false);
    }
  };

  const carregarHistoricoRegistros = async () => {
    try {
      const { data } = await supabase
        .from('fechamentos_caixa_tatuape')
        .select('*')
        .eq('usuario_id', user.id)
        .order('data_fechamento', { ascending: false })
        .limit(10);
      
      setHistoricoRegistros(data || []);
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
    }
  };

  const carregarHistoricoSaidas = async () => {
    try {
      const { data } = await supabase
        .from('saidas_caixa_tatuape')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);
      
      setHistoricoSaidas(data || []);
    } catch (error) {
      console.error('Erro ao carregar histórico de saídas:', error);
    }
  };

  const registrarSaida = async () => {
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
        .from('saidas_caixa_tatuape')
        .insert({
          usuario_id: user.id,
          valor: valorSaida,
          observacao: observacaoSaida,
          data: new Date().toISOString().split('T')[0],
          created_at: new Date().toISOString()
        });
      
      if (error) throw error;
      
      alert('✅ Saída registrada com sucesso!');
      setShowSaidaModal(false);
      setValorSaida(0);
      setObservacaoSaida('');
      carregarHistoricoSaidas();
    } catch (error) {
      alert('❌ Erro ao registrar saída: ' + error.message);
    }
  };

  const carregarDados = async () => {
    try {
      const hoje = new Date().toISOString().split('T')[0];
      
      // Carregar dados
      const [vendasRes, produtosRes, vendedoresRes, clientesRes, historicoRes] = await Promise.all([
        supabase.from('vendas_tatuape').select('*').eq('forma_pagamento', 'pendente_caixa').order('data_venda', { ascending: false }),
        supabase.from('produtos_tatuape').select('*').eq('ativo', true),
        supabase.from('usuarios_tatuape').select('*').eq('tipo', 'vendedor'),
        supabase.from('vendas_tatuape').select('cliente_nome, cliente_telefone, data_venda').neq('forma_pagamento', 'pendente_caixa').order('data_venda', { ascending: false }),
        supabase.from('vendas_tatuape').select('*').neq('forma_pagamento', 'pendente_caixa').order('data_venda', { ascending: false }).limit(100)
      ]);

      setVendas(vendasRes.data || []);
      setProdutos(produtosRes.data || []);
      setVendedores(vendedoresRes.data || []);
      setClientes(clientesRes.data || []);
      setHistoricoVendas(historicoRes.data || []);
      
      // Contar vendas por tipo de pagamento
      const { data: vendasDiaData } = await supabase
        .from('vendas_tatuape')
        .select('forma_pagamento')
        .neq('forma_pagamento', 'pendente_caixa')
        .gte('data_venda', hoje);
      
      const contadores = (vendasDiaData || []).reduce((acc, venda) => {
        if (venda.forma_pagamento === 'dinheiro') acc.dinheiro++;
        else if (venda.forma_pagamento === 'cartao_credito') acc.credito++;
        else if (venda.forma_pagamento === 'cartao_debito') acc.debito++;
        else if (venda.forma_pagamento?.includes('cartao')) acc.credito++;
        else if (venda.forma_pagamento === 'pix') acc.pix++;
        return acc;
      }, { dinheiro: 0, credito: 0, debito: 0, pix: 0 });
      
      setVendasDia(contadores);

    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    }
  };

  const abrirVenda = async (venda) => {
    setVendaSelecionada(venda);
    
    try {
      const { data: itens } = await supabase
        .from('itens_venda_tatuape')
        .select('*')
        .eq('venda_id', venda.id);
      
      setItensVenda(itens || []);
    } catch (error) {
      console.error('Erro ao carregar itens:', error);
      setItensVenda([]);
    }
    
    setDesconto(0);
    setMetodoPagamento('');
    setValorPago(0);
    setShowModal(true);
  };

  const calcularTotal = () => {
    return Math.max(0, parseFloat(vendaSelecionada?.valor_final || 0) - desconto);
  };

  const salvarComprovanteLocalStorage = (venda, itens) => {
    try {
      const comprovanteData = {
        venda: venda,
        itens: itens,
        timestamp: new Date().toISOString()
      };
      
      // Salvar comprovante individual
      localStorage.setItem(`comprovante_${venda.id}`, JSON.stringify(comprovanteData));
      
      // Manter lista de comprovantes salvos
      const comprovantesSalvos = JSON.parse(localStorage.getItem('comprovantes_salvos') || '[]');
      const novaLista = comprovantesSalvos.filter(c => c.venda_id !== venda.id);
      novaLista.unshift({ venda_id: venda.id, numero_venda: venda.numero_venda, cliente_nome: venda.cliente_nome, data_venda: venda.data_venda });
      
      // Manter apenas os últimos 50 comprovantes
      if (novaLista.length > 50) {
        const removidos = novaLista.splice(50);
        removidos.forEach(r => localStorage.removeItem(`comprovante_${r.venda_id}`));
      }
      
      localStorage.setItem('comprovantes_salvos', JSON.stringify(novaLista));
      
      console.log(`✅ Comprovante da venda ${venda.numero_venda} salvo com sucesso!`);
    } catch (error) {
      console.error('Erro ao salvar comprovante:', error);
    }
  };

  const carregarComprovanteLocalStorage = (vendaId) => {
    try {
      const comprovanteData = localStorage.getItem(`comprovante_${vendaId}`);
      if (comprovanteData) {
        const dados = JSON.parse(comprovanteData);
        return dados;
      }
      return null;
    } catch (error) {
      console.error('Erro ao carregar comprovante:', error);
      return null;
    }
  };

  const gerarComprovante = async () => {
    try {
      const { data: itensComprovante } = await supabase
        .from('itens_venda_tatuape')
        .select('*')
        .eq('venda_id', vendaFinalizada.id);
      
      const itensParaUsar = itensComprovante || [];
      setItensVenda(itensParaUsar);
      
      // Salvar comprovante no localStorage
      salvarComprovanteLocalStorage(vendaFinalizada, itensParaUsar);
      
      setShowComprovante(true);
    } catch (error) {
      console.error('Erro ao carregar itens:', error);
      setShowComprovante(true);
    }
  };

  const gerarNotaFiscal = () => {
    alert('📄 Funcionalidade em desenvolvimento!');
  };

  const enviarWhatsApp = () => {
    if (!vendaFinalizada?.cliente_telefone) {
      alert('⚠️ Cliente não possui telefone cadastrado!');
      return;
    }
    
    const telefone = vendaFinalizada.cliente_telefone.replace(/\D/g, '');
    const mensagem = `Olá ${vendaFinalizada.cliente_nome}! Sua compra na VH Alfaiataria foi finalizada.

Venda: ${vendaFinalizada.numero_venda}
Total: R$ ${parseFloat(vendaFinalizada.valor_final).toFixed(2)}

Obrigado pela preferência!`;
    
    const url = `https://wa.me/55${telefone}?text=${encodeURIComponent(mensagem)}`;
    window.open(url, '_blank');
  };

  const finalizarCompra = async () => {
    if (!metodoPagamento) {
      alert('Selecione um método de pagamento!');
      return;
    }
    
    // Validar pagamento em dinheiro
    if (metodoPagamento === 'dinheiro' && valorPago < calcularTotal()) {
      alert('Valor pago é insuficiente!');
      return;
    }
    
    try {
      const novoTotal = calcularTotal();
      const troco = metodoPagamento === 'dinheiro' && valorPago > novoTotal ? valorPago - novoTotal : 0;
      
      // Atualizar a venda
      const { error: vendaError } = await supabase
        .from('vendas_tatuape')
        .update({ 
          forma_pagamento: metodoPagamento,
          valor_final: novoTotal,
          valor_recebido: metodoPagamento === 'dinheiro' ? valorPago : novoTotal
        })
        .eq('id', vendaSelecionada.id);
      
      if (vendaError) throw vendaError;
      
      // Registrar no caixa (valor líquido da venda, já descontando o troco)
      const { error: caixaError } = await supabase
        .from('caixa_tatuape')
        .insert([{
          tipo: 'entrada',
          valor: novoTotal, // Sempre o valor da venda (líquido)
          valor_pago: metodoPagamento === 'dinheiro' ? valorPago : novoTotal,
          troco: troco,
          forma_pagamento: metodoPagamento,
          descricao: `Venda ${vendaSelecionada.numero_venda}${troco > 0 ? ` (Pago: R$ ${valorPago.toFixed(2)}, Troco: R$ ${troco.toFixed(2)})` : ''}`,
          venda_id: vendaSelecionada.id,
          usuario_id: user.id
        }]);
      
      if (caixaError) throw caixaError;
      
      const mensagemSucesso = troco > 0 
        ? `✅ Venda finalizada com sucesso!\n💰 Troco: R$ ${troco.toFixed(2)}`
        : '✅ Venda finalizada com sucesso!';
      
      alert(mensagemSucesso);
      
      // Armazenar dados da venda finalizada
      const vendaCompleta = {
        ...vendaSelecionada,
        valor_final: novoTotal,
        forma_pagamento: metodoPagamento,
        valor_recebido: metodoPagamento === 'dinheiro' ? valorPago : novoTotal
      };
      
      // Salvar comprovante automaticamente
      salvarComprovanteLocalStorage(vendaCompleta, itensVenda);
      
      setVendaFinalizada(vendaCompleta);
      
      setShowModal(false);
      setShowPosVendaModal(true);
      
      setVendaSelecionada(null);
      setItensVenda([]);
      setDesconto(0);
      setMetodoPagamento('');
      setValorPago(0);
      
      await carregarDados();

      
    } catch (error) {
      console.error('❌ ERRO:', error);
      alert('❌ Erro ao processar pagamento: ' + error.message);
    }
  };

  const menuItems = [
    { id: 'vendas', label: 'Vendas', icon: '💰' },
    { id: 'nova-venda', label: 'Nova Venda', icon: '🛍️' },
    { id: 'estoque', label: 'Estoque', icon: '📦' },
    { id: 'saida-valores', label: 'Saída de Valores', icon: '💸' },
    { id: 'vendedores', label: 'Vendedores', icon: '👥' },
    { id: 'historico', label: 'Histórico', icon: '📋' },
    { id: 'caixa', label: 'Controle de Caixa', icon: '💳' }
  ];

  const renderContent = () => {
    switch(activeMenu) {
      case 'vendas':
        if (!caixaAberto) {
          return (
            <div style={{padding: '4rem', textAlign: 'center'}}>
              <div style={{
                background: darkMode ? '#1a1a1a' : '#ffffff',
                border: '2px solid #ef4444',
                borderRadius: '1rem',
                padding: '3rem',
                maxWidth: '400px',
                margin: '0 auto'
              }}>
                <div style={{fontSize: '4rem', marginBottom: '1rem'}}>🔒</div>
                <h2 style={{color: '#ef4444', marginBottom: '1rem'}}>Caixa Fechado</h2>
                <p style={{color: darkMode ? '#888' : '#666', marginBottom: '2rem'}}>
                  Para processar vendas é necessário abrir o caixa primeiro.
                </p>
                <button
                  onClick={() => setActiveMenu('caixa')}
                  style={{
                    padding: '1rem 2rem',
                    background: '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    fontWeight: '600',
                    fontSize: '1rem'
                  }}
                >
                  Ir para Controle de Caixa
                </button>
              </div>
            </div>
          );
        }
        
        const vendasFiltradas = filtrarVendas(vendas);
        return (
          <div>
            {vendasFiltradas.length > 0 ? (
              <TableContainer darkMode={darkMode}>
                <TableHeader darkMode={darkMode}>
                  <div>VENDEDOR</div>
                  <div>CLIENTE</div>
                  <div>VALOR</div>
                  <div>HORA</div>
                  <div>AÇÃO</div>
                </TableHeader>
                {vendasFiltradas.map(venda => (
                  <TableRow key={venda.id} darkMode={darkMode}>
                    <div>{venda.vendedor_nome}</div>
                    <div>{venda.cliente_nome}</div>
                    <div>R$ {parseFloat(venda.valor_final || venda.valor_total || 0).toFixed(2)}</div>
                    <div>{new Date(venda.data_venda).toLocaleTimeString('pt-BR')}</div>
                    <div>
                      <button
                        onClick={() => abrirVenda(venda)}
                        style={{
                          padding: '0.5rem 1rem',
                          background: '#10b981',
                          color: 'white',
                          border: 'none',
                          borderRadius: '0.375rem',
                          cursor: 'pointer',
                          fontSize: '0.8rem',
                          fontWeight: '600'
                        }}
                      >
                        Finalizar Pagamento
                      </button>
                    </div>
                  </TableRow>
                ))}
              </TableContainer>
            ) : (
              <div style={{padding: '4rem', textAlign: 'center', color: '#888'}}>
                <h3>{searchTerm ? 'Nenhuma venda encontrada' : 'Nenhuma venda pendente'}</h3>
                <p>{searchTerm ? `Nenhuma venda encontrada para "${searchTerm}"` : 'As vendas dos vendedores aparecerão aqui para finalização do pagamento'}</p>
                {searchTerm ? (
                  <button 
                    onClick={() => setSearchTerm('')}
                    style={{
                      padding: '0.75rem 1.5rem',
                      background: '#ef4444',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.5rem',
                      cursor: 'pointer',
                      fontWeight: '600',
                      marginTop: '1rem'
                    }}
                  >
                    Limpar Busca
                  </button>
                ) : (
                  <button 
                    onClick={() => carregarDados()}
                    style={{
                      padding: '0.75rem 1.5rem',
                      background: '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.5rem',
                      cursor: 'pointer',
                      fontWeight: '600',
                      marginTop: '1rem'
                    }}
                  >
                    Atualizar Lista
                  </button>
                )}
              </div>
            )}
          </div>
        );
      
      case 'estoque':
        return renderEstoquePage(filtrarProdutos(produtos), searchTerm, darkMode, TableContainer, TableHeader, TableRow);
      
      case 'saida-valores':
        return renderSaidaValoresPage(darkMode, caixaAberto, setShowSaidaModal, historicoSaidas, TableContainer, TableHeader, TableRow);
      
      case 'vendedores':
        const salvarCliente = async () => {
          try {
            await supabase.from('clientes_tatuape').insert({
              ...formCliente,
              created_at: new Date().toISOString()
            });
            setFormCliente({
              nome_completo: '',
              telefone: '',
              cpf: '',
              cidade: '',
              onde_conheceu: '',
              observacoes: ''
            });
            alert('Cliente cadastrado com sucesso!');
          } catch (error) {
            alert('Erro ao cadastrar cliente');
          }
        };
        return renderVendedoresPage(darkMode, filtrarVendedores(vendedores), filtrarClientes(clientes), vendedoresTab, setVendedoresTab, formCliente, setFormCliente, salvarCliente, TableContainer, TableHeader, TableRow);
      
      case 'historico':
        const imprimirComprovanteHistorico = async (venda) => {
          // Primeiro, tentar carregar do localStorage
          const comprovanteLocal = carregarComprovanteLocalStorage(venda.id);
          
          if (comprovanteLocal) {
            console.log('💾 Carregando comprovante do cache local...');
            setVendaFinalizada(comprovanteLocal.venda);
            setItensVenda(comprovanteLocal.itens);
            setShowComprovante(true);
            return;
          }
          
          // Se não encontrou no localStorage, buscar no banco
          try {
            console.log('💾 Buscando dados no banco de dados...');
            const { data: itensHistorico } = await supabase
              .from('itens_venda_tatuape')
              .select('*')
              .eq('venda_id', venda.id);
            
            const itensParaUsar = itensHistorico || [];
            
            // Salvar comprovante no localStorage para próximas vezes
            salvarComprovanteLocalStorage(venda, itensParaUsar);
            
            setVendaFinalizada(venda);
            setItensVenda(itensParaUsar);
            setShowComprovante(true);
          } catch (error) {
            console.error('Erro ao carregar itens:', error);
            
            // Mesmo com erro, salvar o que temos
            salvarComprovanteLocalStorage(venda, []);
            
            setVendaFinalizada(venda);
            setItensVenda([]);
            setShowComprovante(true);
          }
        };
        
        const historicoFiltrado = filtrarHistorico(historicoVendas);
        return (
          <div>
            <h3 style={{marginBottom: '1rem', color: darkMode ? '#fff' : '#000'}}>Histórico de Vendas</h3>
            {historicoFiltrado.length > 0 ? (
              <TableContainer darkMode={darkMode}>
                <TableHeader darkMode={darkMode}>
                  <div>DATA</div>
                  <div>VENDEDOR</div>
                  <div>CLIENTE</div>
                  <div>VALOR</div>
                  <div>PAGAMENTO</div>
                  <div>AÇÃO</div>
                </TableHeader>
                {historicoFiltrado.map(venda => (
                  <TableRow key={venda.id} darkMode={darkMode}>
                    <div>{new Date(venda.data_venda).toLocaleDateString('pt-BR')}</div>
                    <div>{venda.vendedor_nome}</div>
                    <div>{venda.cliente_nome}</div>
                    <div>R$ {parseFloat(venda.valor_final || 0).toFixed(2)}</div>
                    <div style={{color: '#10b981', fontWeight: '600'}}>
                      {venda.forma_pagamento || 'N/A'}
                    </div>
                    <div>
                      <button
                        onClick={() => imprimirComprovanteHistorico(venda)}
                        style={{
                          padding: '0.5rem 1rem',
                          background: '#3b82f6',
                          color: 'white',
                          border: 'none',
                          borderRadius: '0.375rem',
                          cursor: 'pointer',
                          fontSize: '0.8rem',
                          fontWeight: '600',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem'
                        }}
                      >
                        🖨️ Imprimir
                      </button>
                    </div>
                  </TableRow>
                ))}
              </TableContainer>
            ) : (
              <div style={{padding: '4rem', textAlign: 'center', color: '#888'}}>
                <h3>{searchTerm ? 'Nenhuma venda encontrada' : 'Nenhuma venda no histórico'}</h3>
                {searchTerm && (
                  <div>
                    <p>Nenhuma venda encontrada para "{searchTerm}"</p>
                    <button 
                      onClick={() => setSearchTerm('')}
                      style={{
                        padding: '0.75rem 1.5rem',
                        background: '#ef4444',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.5rem',
                        cursor: 'pointer',
                        fontWeight: '600',
                        marginTop: '1rem'
                      }}
                    >
                      Limpar Busca
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      
      case 'nova-venda':
        if (!caixaAberto) {
          return (
            <div style={{padding: '4rem', textAlign: 'center'}}>
              <div style={{
                background: darkMode ? '#1a1a1a' : '#ffffff',
                border: '2px solid #ef4444',
                borderRadius: '1rem',
                padding: '3rem',
                maxWidth: '400px',
                margin: '0 auto'
              }}>
                <div style={{fontSize: '4rem', marginBottom: '1rem'}}>🔒</div>
                <h2 style={{color: '#ef4444', marginBottom: '1rem'}}>Caixa Fechado</h2>
                <p style={{color: darkMode ? '#888' : '#666', marginBottom: '2rem'}}>
                  Para criar vendas é necessário abrir o caixa primeiro.
                </p>
                <button
                  onClick={() => setActiveMenu('caixa')}
                  style={{
                    padding: '1rem 2rem',
                    background: '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    fontWeight: '600',
                    fontSize: '1rem'
                  }}
                >
                  Ir para Controle de Caixa
                </button>
              </div>
            </div>
          );
        }
        
        return (
          <div style={{ textAlign: 'center', padding: '4rem' }}>
            <div style={{
              background: darkMode ? '#1a1a1a' : '#ffffff',
              border: `2px solid #10b981`,
              borderRadius: '1rem',
              padding: '3rem',
              maxWidth: '500px',
              margin: '0 auto'
            }}>
              <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🛍️</div>
              <h2 style={{ color: '#10b981', marginBottom: '1rem' }}>Sistema de Vendas</h2>
              <p style={{ color: darkMode ? '#888' : '#666', marginBottom: '2rem' }}>
                Crie vendas completas: selecione vendedor, adicione produtos, cadastre cliente e finalize o pagamento.
              </p>
              <button
                onClick={() => setShowSistemaVendas(true)}
                style={{
                  padding: '1rem 2rem',
                  background: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '1.1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  margin: '0 auto'
                }}
              >
                🚀 Iniciar Nova Venda
              </button>
            </div>
          </div>
        );
      
      case 'caixa':
        return <CaixaController user={user} darkMode={darkMode} />;
      
      case 'customes':
      case 'ternos':
      case 'camisas':
      case 'gravatas':
      case 'acessorios':
        const categoria = activeMenu;
        const produtosFiltrados = filtrarProdutos(produtos);
        const produtosCategoria = produtosFiltrados.filter(p => {
          const tipo = p.tipo?.toLowerCase() || '';
          const nome = p.nome?.toLowerCase() || '';
          const searchLower = searchTerm.toLowerCase();
          
          const temEstoque = (p.estoque_atual || 0) > 0;
          if (!temEstoque) return false;
          
          let matchCategoria = false;
          switch(categoria) {
            case 'customes': matchCategoria = tipo.includes('costume') || tipo.includes('custom'); break;
            case 'ternos': matchCategoria = tipo.includes('terno'); break;
            case 'camisas': matchCategoria = tipo.includes('camisa'); break;
            case 'gravatas': matchCategoria = tipo.includes('gravata'); break;
            case 'acessorios': matchCategoria = !['terno', 'camisa', 'gravata', 'costume', 'custom'].some(t => tipo.includes(t)); break;
            default: matchCategoria = false;
          }
          
          // Já filtrado pela função filtrarProdutos
          const matchBusca = true;
          
          return matchCategoria && matchBusca;
        });
        
        return (
          <div>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem'}}>
              <h2 style={{color: darkMode ? '#fff' : '#000', margin: 0, textTransform: 'uppercase'}}>
                {categoria === 'acessorios' ? 'ACESSÓRIOS' : categoria}
              </h2>
              <div style={{fontSize: '0.9rem', color: darkMode ? '#888' : '#666'}}>
                {produtosCategoria.length} produtos {searchTerm ? 'encontrados' : 'disponíveis'}
                {searchTerm && ` para "${searchTerm}"`}
              </div>
            </div>
            
            {produtosCategoria.length > 0 ? (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '1.5rem'
              }}>
                {produtosCategoria.map(produto => {
                  const qtdDisponivel = produto.estoque_atual || 0;
                  const precoVenda = produto.preco_venda || produto.valor || 0;
                  
                  return (
                    <div key={produto.id} style={{
                      background: darkMode ? '#1a1a1a' : '#ffffff',
                      borderRadius: '0.75rem',
                      border: `1px solid ${darkMode ? '#333' : '#e5e7eb'}`,
                      overflow: 'hidden',
                      boxShadow: darkMode ? '0 4px 12px rgba(0,0,0,0.3)' : '0 4px 12px rgba(0,0,0,0.1)',
                      transition: 'transform 0.2s ease',
                      cursor: 'pointer'
                    }}>
                      <div style={{
                        height: '200px',
                        background: darkMode ? '#2a2a2a' : '#f8f9fa',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'relative',
                        borderBottom: `1px solid ${darkMode ? '#333' : '#e5e7eb'}`
                      }}>
                        <div style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '0.5rem',
                          color: darkMode ? '#666' : '#999'
                        }}>
                          <div style={{fontSize: '3rem'}}>📷</div>
                          <div style={{fontSize: '0.8rem'}}>Sem imagem</div>
                        </div>
                        
                        <div style={{
                          position: 'absolute',
                          top: '0.75rem',
                          right: '0.75rem',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '0.25rem',
                          fontSize: '0.7rem',
                          fontWeight: '600',
                          background: qtdDisponivel === 0 ? '#ef4444' : qtdDisponivel < 5 ? '#f59e0b' : '#10b981',
                          color: 'white'
                        }}>
                          {qtdDisponivel === 0 ? 'SEM ESTOQUE' : `${qtdDisponivel} unid.`}
                        </div>
                      </div>
                      
                      <div style={{padding: '1.25rem'}}>
                        <div style={{
                          fontWeight: '700',
                          fontSize: '1.1rem',
                          color: darkMode ? '#ffffff' : '#111827',
                          marginBottom: '0.5rem'
                        }}>
                          {produto.nome}
                        </div>
                        
                        <div style={{
                          display: 'flex',
                          gap: '0.5rem',
                          marginBottom: '0.75rem',
                          flexWrap: 'wrap'
                        }}>
                          <span style={{
                            padding: '0.25rem 0.5rem',
                            background: darkMode ? '#333' : '#e8e8e8',
                            color: darkMode ? '#fff' : '#000',
                            borderRadius: '0.25rem',
                            fontSize: '0.7rem',
                            fontWeight: '600',
                            textTransform: 'uppercase'
                          }}>
                            {produto.tipo}
                          </span>
                        </div>
                        
                        <div style={{
                          fontSize: '1.3rem',
                          fontWeight: '700',
                          color: '#10b981',
                          textAlign: 'center',
                          marginBottom: '1rem'
                        }}>
                          R$ {precoVenda.toFixed(2)}
                        </div>
                        
                        <button
                          disabled={qtdDisponivel === 0}
                          style={{
                            width: '100%',
                            padding: '0.75rem',
                            background: qtdDisponivel === 0 ? '#666' : '#3b82f6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '0.5rem',
                            cursor: qtdDisponivel === 0 ? 'not-allowed' : 'pointer',
                            fontWeight: '600',
                            fontSize: '0.9rem'
                          }}
                        >
                          {qtdDisponivel === 0 ? '❌ SEM ESTOQUE' : '🛍️ VER PRODUTO'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{
                padding: '4rem',
                textAlign: 'center',
                background: darkMode ? '#1a1a1a' : '#ffffff',
                borderRadius: '0.75rem',
                border: `1px solid ${darkMode ? '#333' : '#e5e7eb'}`
              }}>
                <div style={{fontSize: '4rem', marginBottom: '1rem'}}>📦</div>
                <h3 style={{color: darkMode ? '#fff' : '#000', marginBottom: '0.5rem'}}>
                  {searchTerm ? 'Nenhum produto encontrado' : 'Nenhum produto encontrado'}
                </h3>
                <p style={{color: '#888', marginBottom: '1.5rem'}}>
                  {searchTerm ? `Nenhum produto encontrado para "${searchTerm}" na categoria ${categoria === 'acessorios' ? 'ACESSÓRIOS' : categoria.toUpperCase()}` : `Não há produtos na categoria ${categoria === 'acessorios' ? 'ACESSÓRIOS' : categoria.toUpperCase()}`}
                </p>
                {searchTerm && (
                  <button 
                    onClick={() => setSearchTerm('')}
                    style={{
                      padding: '0.75rem 1.5rem',
                      background: '#ef4444',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.5rem',
                      cursor: 'pointer',
                      fontWeight: '600',
                      marginBottom: '1rem'
                    }}
                  >
                    Limpar Busca
                  </button>
                )}
                <button 
                  onClick={() => setActiveMenu('estoque')}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    fontWeight: '600'
                  }}
                >
                  📦 Ver Todo Estoque
                </button>
              </div>
            )}
          </div>
        );
      
      default:
        return (
          <div style={{textAlign: 'center', padding: '2rem', color: '#888'}}>
            Selecione uma opção do menu
          </div>
        );
    }
  };

  return (
    <Container darkMode={darkMode}>
      <Header darkMode={darkMode}>
        <div style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
          <div style={{
            fontSize: '1.2rem',
            fontWeight: '700',
            color: darkMode ? '#ffffff' : '#000000'
          }}>
            CAIXA - TATUAPÉ
          </div>
        </div>
        <div style={{
          position: 'relative', 
          flex: 1, 
          maxWidth: '600px',
          margin: '0 2rem'
        }}>
          <SearchBar 
            darkMode={darkMode}
            placeholder={getSearchPlaceholder()}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <ThemeToggle 
          darkMode={darkMode}
          onClick={toggleTheme}
        >
          {darkMode ? '☀️' : '🌙'}
        </ThemeToggle>
      </Header>

      <MainContent>
        <Sidebar darkMode={darkMode}>
          <div style={{position: 'relative'}}>
            <MenuToggle darkMode={darkMode}>
              <span>☰</span>
              <span>MENU</span>
            </MenuToggle>
            <MenuDropdown darkMode={darkMode}>
              {menuItems.map(item => (
                <MenuItem
                  key={item.id}
                  darkMode={darkMode}
                  active={activeMenu === item.id}
                  onClick={() => setActiveMenu(item.id)}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </MenuItem>
              ))}
            </MenuDropdown>
          </div>
          <DateTime darkMode={darkMode}>
            {currentTime.toLocaleString('pt-BR')}
          </DateTime>
          
          <SidebarFooter>
            <IconButton darkMode={darkMode}>⚙️</IconButton>
            <IconButton darkMode={darkMode} onClick={onLogout}>🚪</IconButton>
          </SidebarFooter>
        </Sidebar>

        <CenterArea>
          {renderContent()}
        </CenterArea>

        <RightSidebar darkMode={darkMode}>
          <CategoryButton 
            darkMode={darkMode}
            onClick={() => setActiveMenu('customes')}
          >
            CUSTOMES
          </CategoryButton>
          <CategoryButton 
            darkMode={darkMode}
            onClick={() => setActiveMenu('ternos')}
          >
            TERNOS
          </CategoryButton>
          <CategoryButton 
            darkMode={darkMode}
            onClick={() => setActiveMenu('camisas')}
          >
            CAMISAS
          </CategoryButton>
          <CategoryButton 
            darkMode={darkMode}
            onClick={() => setActiveMenu('gravatas')}
          >
            GRAVATAS
          </CategoryButton>
          <CategoryButton 
            darkMode={darkMode}
            onClick={() => setActiveMenu('acessorios')}
          >
            ACESSÓRIOS
          </CategoryButton>
        </RightSidebar>
      </MainContent>

      <Footer darkMode={darkMode}>
        <PaymentCounter>
          <span>💵</span>
          <span>Dinheiro: {vendasDia.dinheiro}</span>
        </PaymentCounter>
        <PaymentCounter>
          <span>💳</span>
          <span>Crédito: {vendasDia.credito || 0}</span>
        </PaymentCounter>
        <PaymentCounter>
          <span>💳</span>
          <span>Débito: {vendasDia.debito || 0}</span>
        </PaymentCounter>
        <PaymentCounter>
          <span>📱</span>
          <span>PIX: {vendasDia.pix}</span>
        </PaymentCounter>
      </Footer>

      {/* Modal de Finalização */}
      {showModal && vendaSelecionada && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: darkMode ? '#1a1a1a' : '#ffffff',
            borderRadius: '1rem',
            padding: '2rem',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '90vh',
            overflow: 'auto',
            border: `1px solid ${darkMode ? '#333' : '#e5e7eb'}`
          }}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem'}}>
              <h2 style={{color: darkMode ? '#fff' : '#000', margin: 0}}>Finalizar Compra</h2>
              <button 
                onClick={() => setShowModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  color: darkMode ? '#fff' : '#000'
                }}
              >
                ✕
              </button>
            </div>
            
            <div style={{marginBottom: '1rem', padding: '1rem', background: darkMode ? '#2a2a2a' : '#f9fafb', borderRadius: '0.5rem'}}>
              <div style={{color: darkMode ? '#fff' : '#000'}}><strong>Cliente:</strong> {vendaSelecionada.cliente_nome}</div>
              <div style={{color: darkMode ? '#fff' : '#000'}}><strong>Vendedor:</strong> {vendaSelecionada.vendedor_nome}</div>
              <div style={{color: darkMode ? '#fff' : '#000'}}><strong>Número:</strong> {vendaSelecionada.numero_venda}</div>
            </div>
            
            <div style={{marginBottom: '1.5rem', padding: '1rem', background: darkMode ? '#2a2a2a' : '#f9fafb', borderRadius: '0.5rem'}}>
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem'}}>
                <span style={{color: darkMode ? '#fff' : '#000'}}>Valor Original:</span>
                <span style={{color: darkMode ? '#fff' : '#000'}}>R$ {parseFloat(vendaSelecionada.valor_final || 0).toFixed(2)}</span>
              </div>
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem'}}>
                <span style={{color: darkMode ? '#fff' : '#000'}}>Desconto (R$):</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={desconto}
                  onChange={(e) => setDesconto(parseFloat(e.target.value) || 0)}
                  style={{
                    width: '100px',
                    padding: '0.5rem',
                    border: `1px solid ${darkMode ? '#333' : '#e5e7eb'}`,
                    borderRadius: '0.25rem',
                    background: darkMode ? '#333' : '#fff',
                    color: darkMode ? '#fff' : '#000',
                    textAlign: 'right'
                  }}
                  placeholder="0,00"
                />
              </div>
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '1.2rem', fontWeight: '700', borderTop: `1px solid ${darkMode ? '#333' : '#e5e7eb'}`, paddingTop: '0.5rem'}}>
                <span style={{color: darkMode ? '#fff' : '#000'}}>Total:</span>
                <span style={{color: '#10b981'}}>R$ {calcularTotal().toFixed(2)}</span>
              </div>
            </div>
            
            <div style={{marginBottom: '1.5rem'}}>
              <h3 style={{color: darkMode ? '#fff' : '#000', marginBottom: '1rem'}}>Método de Pagamento</h3>
              
              {metodoPagamento === 'dinheiro' && (
                <div style={{marginBottom: '1rem', padding: '1rem', background: darkMode ? '#2a2a2a' : '#f0f9ff', borderRadius: '0.5rem', border: '1px solid #3b82f6'}}>
                  <label style={{display: 'block', marginBottom: '0.5rem', color: darkMode ? '#fff' : '#000', fontWeight: '600'}}>Valor Pago (R$) *:</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={valorPago || ''}
                    onChange={(e) => setValorPago(parseFloat(e.target.value) || 0)}
                    style={{
                      width: '150px',
                      padding: '0.75rem',
                      border: `2px solid ${valorPago < calcularTotal() ? '#ef4444' : (darkMode ? '#333' : '#e5e7eb')}`,
                      borderRadius: '0.5rem',
                      background: darkMode ? '#333' : '#fff',
                      color: darkMode ? '#fff' : '#000',
                      fontSize: '1rem',
                      fontWeight: '600'
                    }}
                    placeholder="0,00"
                    required
                  />
                  {valorPago > 0 && valorPago < calcularTotal() && (
                    <div style={{marginTop: '0.5rem', padding: '0.5rem', background: '#ef4444', color: 'white', borderRadius: '0.25rem', fontWeight: '600'}}>
                      ⚠️ Valor insuficiente! Faltam: R$ {(calcularTotal() - valorPago).toFixed(2)}
                    </div>
                  )}
                  {valorPago > calcularTotal() && (
                    <div style={{marginTop: '0.5rem', padding: '0.5rem', background: '#10b981', color: 'white', borderRadius: '0.25rem', fontWeight: '600'}}>
                      💰 Troco: R$ {(valorPago - calcularTotal()).toFixed(2)}
                    </div>
                  )}
                  {valorPago === calcularTotal() && valorPago > 0 && (
                    <div style={{marginTop: '0.5rem', padding: '0.5rem', background: '#3b82f6', color: 'white', borderRadius: '0.25rem', fontWeight: '600'}}>
                      ✅ Valor exato!
                    </div>
                  )}
                </div>
              )}
              
              <div style={{display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem'}}>
                <button
                  onClick={() => {
                    setMetodoPagamento('dinheiro');
                    setValorPago(0);
                  }}
                  style={{
                    padding: '1rem',
                    background: metodoPagamento === 'dinheiro' ? '#10b981' : (darkMode ? '#333' : '#f3f4f6'),
                    color: metodoPagamento === 'dinheiro' ? 'white' : (darkMode ? '#fff' : '#000'),
                    border: `2px solid ${metodoPagamento === 'dinheiro' ? '#10b981' : (darkMode ? '#555' : '#d1d5db')}`,
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    fontWeight: '600',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <span style={{fontSize: '1.5rem'}}>💵</span>
                  <span>Dinheiro</span>
                </button>
                <button
                  onClick={() => {
                    setMetodoPagamento('cartao_credito');
                    setValorPago(0);
                  }}
                  style={{
                    padding: '1rem',
                    background: metodoPagamento === 'cartao_credito' ? '#3b82f6' : (darkMode ? '#333' : '#f3f4f6'),
                    color: metodoPagamento === 'cartao_credito' ? 'white' : (darkMode ? '#fff' : '#000'),
                    border: `2px solid ${metodoPagamento === 'cartao_credito' ? '#3b82f6' : (darkMode ? '#555' : '#d1d5db')}`,
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    fontWeight: '600',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <span style={{fontSize: '1.5rem'}}>💳</span>
                  <span>Crédito</span>
                </button>
                <button
                  onClick={() => {
                    setMetodoPagamento('cartao_debito');
                    setValorPago(0);
                  }}
                  style={{
                    padding: '1rem',
                    background: metodoPagamento === 'cartao_debito' ? '#8b5cf6' : (darkMode ? '#333' : '#f3f4f6'),
                    color: metodoPagamento === 'cartao_debito' ? 'white' : (darkMode ? '#fff' : '#000'),
                    border: `2px solid ${metodoPagamento === 'cartao_debito' ? '#8b5cf6' : (darkMode ? '#555' : '#d1d5db')}`,
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    fontWeight: '600',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <span style={{fontSize: '1.5rem'}}>💳</span>
                  <span>Débito</span>
                </button>
                <button
                  onClick={() => {
                    setMetodoPagamento('pix');
                    setValorPago(0);
                  }}
                  style={{
                    padding: '1rem',
                    background: metodoPagamento === 'pix' ? '#f59e0b' : (darkMode ? '#333' : '#f3f4f6'),
                    color: metodoPagamento === 'pix' ? 'white' : (darkMode ? '#fff' : '#000'),
                    border: `2px solid ${metodoPagamento === 'pix' ? '#f59e0b' : (darkMode ? '#555' : '#d1d5db')}`,
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    fontWeight: '600',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <span style={{fontSize: '1.5rem'}}>📱</span>
                  <span>PIX</span>
                </button>
              </div>
            </div>
            
            <div style={{display: 'flex', gap: '1rem', justifyContent: 'center'}}>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  padding: '0.75rem 2rem',
                  background: darkMode ? '#333' : '#f3f4f6',
                  color: darkMode ? '#fff' : '#000',
                  border: `1px solid ${darkMode ? '#555' : '#d1d5db'}`,
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                Cancelar
              </button>
              <button
                onClick={finalizarCompra}
                disabled={!metodoPagamento || (metodoPagamento === 'dinheiro' && (!valorPago || valorPago < calcularTotal()))}
                style={{
                  padding: '0.75rem 2rem',
                  background: (!metodoPagamento || (metodoPagamento === 'dinheiro' && (!valorPago || valorPago < calcularTotal()))) ? '#666' : '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  cursor: (!metodoPagamento || (metodoPagamento === 'dinheiro' && (!valorPago || valorPago < calcularTotal()))) ? 'not-allowed' : 'pointer',
                  fontWeight: '700',
                  fontSize: '1.1rem'
                }}
              >
                ✅ FINALIZAR PEDIDO
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal de Saída de Valores */}
      {showSaidaModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: darkMode ? '#1a1a1a' : '#ffffff',
            borderRadius: '1rem',
            padding: '2rem',
            maxWidth: '500px',
            width: '90%',
            border: `1px solid ${darkMode ? '#333' : '#e5e7eb'}`
          }}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem'}}>
              <h2 style={{color: darkMode ? '#fff' : '#000', margin: 0}}>Registrar Saída de Valores</h2>
              <button 
                onClick={() => {
                  setShowSaidaModal(false);
                  setValorSaida(0);
                  setObservacaoSaida('');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  color: darkMode ? '#fff' : '#000'
                }}
              >
                ✕
              </button>
            </div>
            
            <div style={{marginBottom: '1.5rem'}}>
              <label style={{display: 'block', marginBottom: '0.5rem', color: darkMode ? '#fff' : '#000', fontWeight: '600'}}>
                Valor da Saída (R$):
              </label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={valorSaida}
                onChange={(e) => setValorSaida(parseFloat(e.target.value) || 0)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: `1px solid ${darkMode ? '#333' : '#e5e7eb'}`,
                  borderRadius: '0.5rem',
                  background: darkMode ? '#333' : '#fff',
                  color: darkMode ? '#fff' : '#000',
                  fontSize: '1rem'
                }}
                placeholder="0,00"
              />
            </div>
            
            <div style={{marginBottom: '1.5rem'}}>
              <label style={{display: 'block', marginBottom: '0.5rem', color: darkMode ? '#fff' : '#000', fontWeight: '600'}}>
                Observação/Motivo:
              </label>
              <textarea
                value={observacaoSaida}
                onChange={(e) => setObservacaoSaida(e.target.value)}
                rows={3}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: `1px solid ${darkMode ? '#333' : '#e5e7eb'}`,
                  borderRadius: '0.5rem',
                  background: darkMode ? '#333' : '#fff',
                  color: darkMode ? '#fff' : '#000',
                  fontSize: '1rem',
                  resize: 'vertical'
                }}
                placeholder="Ex: Compra de material, pagamento de fornecedor, etc."
              />
            </div>
            
            <div style={{display: 'flex', gap: '1rem', justifyContent: 'center'}}>
              <button
                onClick={() => {
                  setShowSaidaModal(false);
                  setValorSaida(0);
                  setObservacaoSaida('');
                }}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: darkMode ? '#333' : '#f3f4f6',
                  color: darkMode ? '#fff' : '#000',
                  border: `1px solid ${darkMode ? '#555' : '#d1d5db'}`,
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                Cancelar
              </button>
              <button
                onClick={registrarSaida}
                disabled={!valorSaida || !observacaoSaida.trim()}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: (!valorSaida || !observacaoSaida.trim()) ? '#666' : '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  cursor: (!valorSaida || !observacaoSaida.trim()) ? 'not-allowed' : 'pointer',
                  fontWeight: '700',
                  fontSize: '1rem'
                }}
              >
                💸 REGISTRAR SAÍDA
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal Pós-Venda */}
      {showPosVendaModal && vendaFinalizada && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: darkMode ? '#1a1a1a' : '#ffffff',
            borderRadius: '1rem',
            padding: '2rem',
            maxWidth: '500px',
            width: '90%',
            border: `1px solid ${darkMode ? '#333' : '#e5e7eb'}`
          }}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem'}}>
              <h2 style={{color: darkMode ? '#fff' : '#000', margin: 0}}>🎉 Venda Finalizada!</h2>
              <button 
                onClick={() => {
                  setShowPosVendaModal(false);
                  setVendaFinalizada(null);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  color: darkMode ? '#fff' : '#000'
                }}
              >
                ✕
              </button>
            </div>
            
            <div style={{marginBottom: '1.5rem', padding: '1rem', background: darkMode ? '#2a2a2a' : '#f0f9ff', borderRadius: '0.5rem', border: '1px solid #10b981'}}>
              <div style={{color: darkMode ? '#fff' : '#000', marginBottom: '0.5rem'}}><strong>Cliente:</strong> {vendaFinalizada.cliente_nome}</div>
              <div style={{color: darkMode ? '#fff' : '#000', marginBottom: '0.5rem'}}><strong>Venda:</strong> {vendaFinalizada.numero_venda}</div>
              <div style={{color: '#10b981', fontSize: '1.2rem', fontWeight: '700'}}><strong>Total:</strong> R$ {parseFloat(vendaFinalizada.valor_final).toFixed(2)}</div>
            </div>
            
            <div style={{marginBottom: '1.5rem'}}>
              <h3 style={{color: darkMode ? '#fff' : '#000', marginBottom: '1rem'}}>O que deseja fazer agora?</h3>
              
              <div style={{display: 'flex', flexDirection: 'column', gap: '0.75rem'}}>
                <button
                  onClick={gerarComprovante}
                  style={{
                    padding: '1rem',
                    background: darkMode ? '#333' : '#f8f9fa',
                    color: darkMode ? '#fff' : '#000',
                    border: `1px solid ${darkMode ? '#555' : '#dee2e6'}`,
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = darkMode ? '#444' : '#e9ecef';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = darkMode ? '#333' : '#f8f9fa';
                  }}
                >
                  <span style={{fontSize: '1.5rem'}}>🧧</span>
                  <div>
                    <div>Gerar Comprovante de Pagamento</div>
                    <div style={{fontSize: '0.8rem', color: '#888'}}>Comprovante da venda (em desenvolvimento)</div>
                  </div>
                </button>
                
                <button
                  onClick={gerarNotaFiscal}
                  style={{
                    padding: '1rem',
                    background: darkMode ? '#333' : '#f8f9fa',
                    color: darkMode ? '#fff' : '#000',
                    border: `1px solid ${darkMode ? '#555' : '#dee2e6'}`,
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = darkMode ? '#444' : '#e9ecef';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = darkMode ? '#333' : '#f8f9fa';
                  }}
                >
                  <span style={{fontSize: '1.5rem'}}>📄</span>
                  <div>
                    <div>Gerar Nota Fiscal</div>
                    <div style={{fontSize: '0.8rem', color: '#888'}}>Emitir nota fiscal (em desenvolvimento)</div>
                  </div>
                </button>
                
                {vendaFinalizada.cliente_telefone && (
                  <button
                    onClick={enviarWhatsApp}
                    style={{
                      padding: '1rem',
                      background: '#25d366',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.5rem',
                      cursor: 'pointer',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = '#128c7e';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = '#25d366';
                    }}
                  >
                    <span style={{fontSize: '1.5rem'}}>📱</span>
                    <div>
                      <div>Enviar Comprovante por WhatsApp</div>
                      <div style={{fontSize: '0.8rem', opacity: 0.9}}>Enviar para {vendaFinalizada.cliente_telefone}</div>
                    </div>
                  </button>
                )}
              </div>
            </div>
            
            <div style={{display: 'flex', justifyContent: 'center'}}>
              <button
                onClick={() => {
                  setShowPosVendaModal(false);
                  setVendaFinalizada(null);
                }}
                style={{
                  padding: '0.75rem 2rem',
                  background: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  fontWeight: '700',
                  fontSize: '1rem'
                }}
              >
                ✓ Finalizar
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Comprovante de Venda */}
      {showComprovante && vendaFinalizada && (
        <ComprovanteVenda 
          venda={vendaFinalizada}
          itens={itensVenda}
          onClose={() => setShowComprovante(false)}
        />
      )}
      
      {/* Sistema de Vendas */}
      {showSistemaVendas && (
        <SistemaVendas 
          user={user}
          darkMode={darkMode}
          onClose={() => {
            setShowSistemaVendas(false);
            carregarDados(); // Recarregar dados após criar venda
          }}
        />
      )}
    </Container>
  );
}
