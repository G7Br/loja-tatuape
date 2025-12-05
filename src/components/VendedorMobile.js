import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';
import { useTheme } from '../contexts/ThemeContext';
import VendedorProfile from './VendedorProfile';
import QRScanner from './QRScannerTest';
import ModalProdutoAdicionado from './ModalProdutoAdicionado';
import ModalProdutoNaoEncontrado from './ModalProdutoNaoEncontrado';
import ModalClienteObrigatorio from './ModalClienteObrigatorio';

export default function VendedorMobile({ user, onLogout }) {
  const { darkMode, toggleTheme } = useTheme();
  const [produtos, setProdutos] = useState([]);
  const [produtosAgrupados, setProdutosAgrupados] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [categoriaFiltro, setCategoriaFiltro] = useState('');
  const [carrinho, setCarrinho] = useState([]);
  const [busca, setBusca] = useState('');
  const [produtoSelecionado, setProdutoSelecionado] = useState(null);
  const [clienteNome, setClienteNome] = useState('');
  const [clienteTelefone, setClienteTelefone] = useState('');
  const [clienteCidade, setClienteCidade] = useState('');
  const [clienteCpf, setClienteCpf] = useState('');
  const [ondeConheceu, setOndeConheceu] = useState('');
  const [ondeConheceuOutro, setOndeConheceuOutro] = useState('');
  const [vendasMes, setVendasMes] = useState(0);
  const [activeTab, setActiveTab] = useState('produtos');
  const [showProfile, setShowProfile] = useState(false);
  const [vendasStandby, setVendasStandby] = useState([]);
  const [processandoVenda, setProcessandoVenda] = useState(false);
  const [clienteEmStandby, setClienteEmStandby] = useState(null);
  const [cpfJaExiste, setCpfJaExiste] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [produtoAdicionado, setProdutoAdicionado] = useState(null);
  const [showModalProduto, setShowModalProduto] = useState(false);
  const [codigoErro, setCodigoErro] = useState('');
  const [showModalErro, setShowModalErro] = useState(false);
  const [showModalCliente, setShowModalCliente] = useState(false);

  useEffect(() => {
    carregarProdutos();
    carregarVendasMes();
    carregarVendasStandby();
  }, []);

  const carregarVendasStandby = async () => {
    const { data } = await supabase
      .from('vendas_standby_tatuape')
      .select('*')
      .order('created_at', { ascending: false });
    setVendasStandby(data || []);
  };

  const verificarClienteStandby = async (telefone) => {
    if (!telefone || telefone.length < 10) return null;
    
    const { data } = await supabase
      .from('vendas_standby_tatuape')
      .select('vendedor_nome')
      .eq('cliente_telefone', telefone)
      .neq('vendedor_nome', user.nome)
      .single();
    
    return data;
  };

  const cadastrarCliente = async (dadosCliente) => {
    if (!dadosCliente.nome) return;
    
    const { error } = await supabase
      .from('clientes_tatuape')
      .upsert({
        nome_completo: dadosCliente.nome,
        telefone: dadosCliente.telefone || null,
        cpf: dadosCliente.cpf || null,
        cidade: dadosCliente.cidade || null,
        onde_conheceu: dadosCliente.ondeConheceu === 'outros' ? dadosCliente.ondeConheceuOutro : dadosCliente.ondeConheceu || null
      }, { onConflict: 'telefone' });
    
    if (error) console.error('Erro ao cadastrar cliente:', error);
  };

  const carregarProdutos = async () => {
    const { data } = await supabase
      .from('produtos_tatuape')
      .select('*')
      .eq('ativo', true)
      .gt('estoque_atual', 0)
      .order('nome');
    
    setProdutos(data || []);
    
    // Agrupar produtos por nome
    const agrupados = {};
    const tiposUnicos = new Set();
    
    (data || []).forEach(produto => {
      if (produto.tipo) tiposUnicos.add(produto.tipo);
      
      if (!agrupados[produto.nome]) {
        agrupados[produto.nome] = {
          nome: produto.nome,
          tipo: produto.tipo,
          preco_venda: produto.preco_venda,
          variacoes: []
        };
      }
      
      agrupados[produto.nome].variacoes.push({
        id: produto.id,
        codigo: produto.codigo,
        cor: produto.cor,
        tamanho: produto.tamanho,
        estoque_atual: produto.estoque_atual,
        preco_venda: produto.preco_venda
      });
    });
    
    setProdutosAgrupados(Object.values(agrupados));
    setCategorias(['Todos', ...Array.from(tiposUnicos)]);
  };

  const carregarVendasMes = async () => {
    const hoje = new Date();
    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    
    const { data } = await supabase
      .from('vendas_tatuape')
      .select('valor_final')
      .eq('vendedor_nome', user.nome)
      .gte('data_venda', inicioMes.toISOString())
      .neq('forma_pagamento', 'pendente_caixa');
    
    const total = data?.reduce((sum, v) => sum + parseFloat(v.valor_final), 0) || 0;
    setVendasMes(total);
  };

  const adicionarAoCarrinho = (produto) => {
    const itemExistente = carrinho.find(item => item.id === produto.id);
    
    if (itemExistente) {
      if (itemExistente.quantidade >= produto.estoque_atual) {
        alert('Estoque insuficiente');
        return;
      }
      setCarrinho(carrinho.map(item =>
        item.id === produto.id ? { ...item, quantidade: item.quantidade + 1 } : item
      ));
    } else {
      setCarrinho([...carrinho, { ...produto, quantidade: 1 }]);
    }
  };

  const handleQRScan = async (data) => {
    try {
      setShowQRScanner(false);
      
      // Buscar produto pelo código QR
      const { data: produto, error } = await supabase
        .from('produtos_tatuape')
        .select('*')
        .eq('codigo', data)
        .eq('ativo', true)
        .gt('estoque_atual', 0)
        .single();
      
      if (error || !produto) {
        setCodigoErro(data);
        setShowModalErro(true);
        return;
      }
      
      adicionarAoCarrinho(produto);
      
      // Mostrar modal customizado
      setProdutoAdicionado(produto);
      setShowModalProduto(true);
      
    } catch (error) {
      console.error('Erro ao processar QR code:', error);
      alert('Erro ao processar QR code');
    }
  };

  const alterarQuantidade = (produtoId, novaQuantidade) => {
    if (novaQuantidade <= 0) {
      setCarrinho(carrinho.filter(item => item.id !== produtoId));
      return;
    }
    
    const produto = produtos.find(p => p.id === produtoId);
    if (novaQuantidade > produto.estoque_atual) {
      alert('Estoque insuficiente');
      return;
    }
    
    setCarrinho(carrinho.map(item =>
      item.id === produtoId ? { ...item, quantidade: novaQuantidade } : item
    ));
  };

  const calcularTotal = () => {
    return carrinho.reduce((sum, item) => sum + (item.preco_venda * item.quantidade), 0);
  };

  const enviarParaStandby = async () => {
    if (carrinho.length === 0) {
      alert('Adicione produtos ao carrinho');
      return;
    }

    if (!clienteNome.trim()) {
      setShowModalCliente(true);
      return;
    }

    try {
      // Cadastrar cliente
      await cadastrarCliente({
        nome: clienteNome,
        telefone: clienteTelefone,
        cpf: clienteCpf,
        cidade: clienteCidade,
        ondeConheceu,
        ondeConheceuOutro
      });

      // Salvar no banco
      const { error } = await supabase
        .from('vendas_standby_tatuape')
        .insert([{
          vendedor_nome: user.nome,
          cliente_nome: clienteNome,
          cliente_telefone: clienteTelefone || null,
          cliente_cidade: clienteCidade || null,
          cliente_cpf: clienteCpf || null,
          onde_conheceu: ondeConheceu === 'outros' ? ondeConheceuOutro : ondeConheceu || null,
          carrinho: JSON.stringify(carrinho),
          valor_total: calcularTotal()
        }]);

      if (error) throw error;
    
    setCarrinho([]);
    setClienteNome('');
    setClienteTelefone('');
    setClienteCidade('');
    setClienteCpf('');
    setOndeConheceu('');
    setOndeConheceuOutro('');
    setActiveTab('produtos');

      await carregarVendasStandby();
      alert('Venda enviada para Standby!');
    } catch (error) {
      alert('Erro ao enviar para standby: ' + error.message);
    }
  };

  const editarVendaStandby = async (venda) => {
    try {
      setCarrinho(JSON.parse(venda.carrinho));
      setClienteNome(venda.cliente_nome);
      setClienteTelefone(venda.cliente_telefone || '');
      setClienteCidade(venda.cliente_cidade || '');
      setClienteCpf(venda.cliente_cpf || '');
      setOndeConheceu(venda.onde_conheceu || '');
      setOndeConheceuOutro('');
      setActiveTab('cliente');
      
      // Remove do banco
      await supabase
        .from('vendas_standby_tatuape')
        .delete()
        .eq('id', venda.id);
      
      await carregarVendasStandby();
    } catch (error) {
      alert('Erro ao editar venda: ' + error.message);
    }
  };

  const cancelarVendaStandby = async (vendaId) => {
    if (confirm('Tem certeza que deseja cancelar esta venda?')) {
      try {
        await supabase
          .from('vendas_standby_tatuape')
          .delete()
          .eq('id', vendaId);
        
        await carregarVendasStandby();
      } catch (error) {
        alert('Erro ao cancelar venda: ' + error.message);
      }
    }
  };

  const finalizarVendaStandby = async (venda) => {
    if (processandoVenda) return;
    setProcessandoVenda(true);

    const numeroVenda = `TAT-${Date.now()}`;
    const valorTotal = venda.valor_total;
    const carrinho = JSON.parse(venda.carrinho);

    try {
      const { data: vendaData, error: vendaError } = await supabase
        .from('vendas_tatuape')
        .insert([{
          numero_venda: numeroVenda,
          vendedor_nome: user.nome,
          valor_total: valorTotal,
          valor_final: valorTotal,
          forma_pagamento: 'pendente_caixa',
          cliente_nome: venda.cliente_nome || null,
          cliente_telefone: venda.cliente_telefone || null
        }])
        .select()
        .single();

      if (vendaError) throw vendaError;

      const itens = carrinho.map(item => ({
        venda_id: vendaData.id,
        produto_id: item.id,
        produto_codigo: item.codigo,
        produto_nome: item.nome,
        quantidade: item.quantidade,
        preco_unitario: item.preco_venda,
        subtotal: item.preco_venda * item.quantidade
      }));

      const { error: itensError } = await supabase
        .from('itens_venda_tatuape')
        .insert(itens);

      if (itensError) throw itensError;

      for (const item of carrinho) {
        const novoEstoque = item.estoque_atual - item.quantidade;
        await supabase
          .from('produtos_tatuape')
          .update({ estoque_atual: novoEstoque })
          .eq('id', item.id);

        await supabase
          .from('movimentacoes_estoque_tatuape')
          .insert([{
            produto_id: item.id,
            tipo_movimentacao: 'venda',
            quantidade_anterior: item.estoque_atual,
            quantidade_movimentada: -item.quantidade,
            quantidade_atual: novoEstoque,
            motivo: `Venda ${numeroVenda}`,
            usuario_id: user.id,
            venda_id: vendaData.id
          }]);
      }

      // Remove do standby
      await supabase
        .from('vendas_standby_tatuape')
        .delete()
        .eq('id', venda.id);

      alert(`Venda ${numeroVenda} enviada para o caixa!\nTotal: R$ ${valorTotal.toFixed(2)}`);
      
      await carregarVendasStandby();
      carregarProdutos();
      carregarVendasMes();
    } catch (error) {
      alert('Erro ao finalizar venda: ' + error.message);
    } finally {
      setProcessandoVenda(false);
    }
  };

  const finalizarVenda = async () => {
    if (processandoVenda) return;
    
    if (carrinho.length === 0) {
      alert('Adicione produtos ao carrinho');
      return;
    }

    if (!clienteNome.trim()) {
      setShowModalCliente(true);
      return;
    }

    setProcessandoVenda(true);
    const numeroVenda = `TAT-${Date.now()}`;
    const valorTotal = calcularTotal();

    try {
      // Cadastrar cliente
      await cadastrarCliente({
        nome: clienteNome,
        telefone: clienteTelefone,
        cpf: clienteCpf,
        cidade: clienteCidade,
        ondeConheceu,
        ondeConheceuOutro
      });
      const { data: venda, error: vendaError } = await supabase
        .from('vendas_tatuape')
        .insert([{
          numero_venda: numeroVenda,
          vendedor_nome: user.nome,
          valor_total: valorTotal,
          valor_final: valorTotal,
          forma_pagamento: 'pendente_caixa',
          cliente_nome: clienteNome || null,
          cliente_telefone: clienteTelefone || null,
          cliente_cidade: clienteCidade || null,
          cliente_cpf: clienteCpf || null,
          onde_conheceu: ondeConheceu === 'outros' ? ondeConheceuOutro : ondeConheceu || null
        }])
        .select()
        .single();

      if (vendaError) throw vendaError;

      const itens = carrinho.map(item => ({
        venda_id: venda.id,
        produto_id: item.id,
        produto_codigo: item.codigo,
        produto_nome: item.nome,
        quantidade: item.quantidade,
        preco_unitario: item.preco_venda,
        subtotal: item.preco_venda * item.quantidade
      }));

      const { error: itensError } = await supabase
        .from('itens_venda_tatuape')
        .insert(itens);

      if (itensError) throw itensError;

      for (const item of carrinho) {
        const novoEstoque = item.estoque_atual - item.quantidade;
        await supabase
          .from('produtos_tatuape')
          .update({ estoque_atual: novoEstoque })
          .eq('id', item.id);

        await supabase
          .from('movimentacoes_estoque_tatuape')
          .insert([{
            produto_id: item.id,
            tipo_movimentacao: 'venda',
            quantidade_anterior: item.estoque_atual,
            quantidade_movimentada: -item.quantidade,
            quantidade_atual: novoEstoque,
            motivo: `Venda ${numeroVenda}`,
            usuario_id: user.id,
            venda_id: venda.id
          }]);
      }

      alert(`Venda ${numeroVenda} enviada para o caixa!\nTotal: R$ ${valorTotal.toFixed(2)}`);
      
      setCarrinho([]);
      setClienteNome('');
      setClienteTelefone('');
      setClienteCidade('');
      setClienteCpf('');
      setOndeConheceu('');
      setOndeConheceuOutro('');
      setActiveTab('produtos');
      carregarProdutos();
      carregarVendasMes();
    } catch (error) {
      alert('Erro ao finalizar venda: ' + error.message);
    } finally {
      setProcessandoVenda(false);
    }
  };

  const produtosFiltrados = produtosAgrupados.filter(p => {
    const matchBusca = p.nome.toLowerCase().includes(busca.toLowerCase()) ||
      p.variacoes.some(v => v.codigo.toLowerCase().includes(busca.toLowerCase()));
    
    const matchCategoria = categoriaFiltro === '' || categoriaFiltro === 'Todos' || p.tipo === categoriaFiltro;
    
    return matchBusca && matchCategoria;
  });

  const metaMensal = user.meta_mensal || 0;
  const percentualMeta = metaMensal > 0 ? (vendasMes / metaMensal) * 100 : 0;

  if (showProfile) {
    return <VendedorProfile user={user} onBack={() => setShowProfile(false)} />;
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: darkMode ? '#0a0a0a' : '#ffffff', 
      color: darkMode ? '#ffffff' : '#000000',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header */}
      <div style={{
        background: darkMode ? '#1a1a1a' : '#f8f9fa',
        borderBottom: `1px solid ${darkMode ? '#333' : '#e5e7eb'}`,
        padding: '1rem',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
            <img 
              src="/images/logo.png" 
              alt="VH Logo" 
              style={{
                height: '40px', 
                width: 'auto',
                filter: darkMode ? 'brightness(0) invert(1)' : 'none',
                objectFit: 'contain'
              }}
            />
            <div>
              <h1 style={{ fontSize: '1.2rem', fontWeight: '700', margin: 0 }}>VENDAS</h1>
              <p style={{ fontSize: '0.8rem', opacity: 0.8, margin: '0.25rem 0 0 0' }}>
                {user.nome}
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <button onClick={toggleTheme} style={{
              padding: '8px',
              background: darkMode ? '#1a1a1a' : '#f8f9fa',
              color: darkMode ? '#ffffff' : '#000000',
              border: `1px solid ${darkMode ? '#333' : '#e5e7eb'}`,
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '1.2rem'
            }}>
              {darkMode ? '☀️' : '🌙'}
            </button>
            <button onClick={() => setShowProfile(true)} style={{
              padding: '8px 12px',
              background: darkMode ? '#1a1a1a' : '#f8f9fa',
              color: darkMode ? '#ffffff' : '#000000',
              border: `1px solid ${darkMode ? '#333' : '#e5e7eb'}`,
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.9rem'
            }}>
              👤
            </button>
            <button onClick={onLogout} style={{
              padding: '8px 12px',
              background: darkMode ? '#1a1a1a' : '#f8f9fa',
              color: darkMode ? '#ffffff' : '#000000',
              border: `1px solid ${darkMode ? '#333' : '#e5e7eb'}`,
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.9rem'
            }}>
              Sair
            </button>
          </div>
        </div>

        {/* Meta */}
        {metaMensal > 0 && (
          <div style={{ marginTop: '1rem' }}>
            <div style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>
              Meta: R$ {vendasMes.toFixed(2)} / R$ {metaMensal.toFixed(2)} ({percentualMeta.toFixed(1)}%)
            </div>
            <div style={{
              width: '100%',
              height: '6px',
              background: darkMode ? '#333' : '#e5e7eb',
              borderRadius: '3px',
              overflow: 'hidden'
            }}>
              <div style={{
                height: '100%',
                background: percentualMeta >= 100 ? '#10b981' : '#3b82f6',
                width: `${Math.min(percentualMeta, 100)}%`,
                transition: 'width 0.3s ease'
              }}></div>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        background: darkMode ? '#1a1a1a' : '#f8f9fa',
        borderBottom: `1px solid ${darkMode ? '#333' : '#e5e7eb'}`
      }}>
        {['produtos', 'carrinho', 'cliente', 'standby'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              flex: 1,
              padding: '1rem',
              background: activeTab === tab ? (darkMode ? '#0a0a0a' : '#ffffff') : 'transparent',
              color: activeTab === tab ? '#3b82f6' : (darkMode ? '#888' : '#666'),
              border: 'none',
              borderBottom: activeTab === tab ? '2px solid #3b82f6' : 'none',
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontWeight: activeTab === tab ? '600' : '400'
            }}
          >
            {tab === 'produtos' && `Produtos${carrinho.length > 0 ? ` (${carrinho.length})` : ''}`}
            {tab === 'carrinho' && `Carrinho (${carrinho.length})`}
            {tab === 'cliente' && 'Cliente'}
            {tab === 'standby' && `Standby (${vendasStandby.length})`}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, padding: '1rem', paddingBottom: '5rem' }}>
        {activeTab === 'produtos' && (
          <>
            {/* BUSCA E QR SCANNER */}
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ position: 'relative', marginBottom: '0.5rem' }}>
                <div style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: darkMode ? '#888' : '#666',
                  fontSize: '1rem'
                }}>
                  🔍
                </div>
                <input
                  placeholder="Buscar produto..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 12px 12px 35px',
                    background: darkMode ? '#2a2a2a' : '#f8f9fa',
                    border: `2px solid ${busca ? '#3b82f6' : (darkMode ? '#333' : '#e5e7eb')}`,
                    borderRadius: '8px',
                    color: darkMode ? '#ffffff' : '#000000',
                    fontSize: '16px'
                  }}
                />
              </div>
              
              <button
                onClick={() => setShowQRScanner(true)}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: '#10b981',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                📱 Escanear QR Code
              </button>
            </div>
            
            {/* FILTROS */}
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', gap: '6px', marginBottom: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
                {categorias.map(categoria => {
                  const isActive = (categoriaFiltro === categoria || (categoria === 'Todos' && categoriaFiltro === ''));
                  return (
                    <button
                      key={categoria}
                      onClick={() => setCategoriaFiltro(categoria === 'Todos' ? '' : categoria)}
                      style={{
                        padding: '6px 12px',
                        background: isActive ? '#3b82f6' : (darkMode ? '#2a2a2a' : '#f8f9fa'),
                        color: isActive ? '#ffffff' : (darkMode ? '#ffffff' : '#000000'),
                        border: `1px solid ${isActive ? '#3b82f6' : (darkMode ? '#444' : '#d1d5db')}`,
                        borderRadius: '16px',
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                        fontWeight: isActive ? '600' : '500',
                        whiteSpace: 'nowrap',
                        minWidth: 'fit-content'
                      }}
                    >
                      {categoria}
                    </button>
                  );
                })}
              </div>
              {(busca || categoriaFiltro) && (
                <button
                  onClick={() => {
                    setBusca('');
                    setCategoriaFiltro('');
                    setProdutoSelecionado(null);
                  }}
                  style={{
                    padding: '4px 8px',
                    background: 'transparent',
                    color: '#ef4444',
                    border: '1px solid #ef4444',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    fontSize: '0.7rem'
                  }}
                >
                  ✕ Limpar
                </button>
              )}
            </div>
            
            {/* PRODUTOS */}
            <div style={{ display: 'grid', gap: '0.5rem' }}>
              {produtosFiltrados.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: darkMode ? '#888' : '#666' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🔍</div>
                  <p style={{ margin: 0, fontSize: '0.9rem' }}>
                    {busca ? `Nenhum produto encontrado para "${busca}"` : 'Nenhum produto nesta categoria'}
                  </p>
                </div>
              ) : (
                produtosFiltrados.map(produto => (
                  <div key={produto.nome} style={{
                    background: darkMode ? '#2a2a2a' : '#f8f9fa',
                    border: `1px solid ${darkMode ? '#333' : '#e5e7eb'}`,
                    borderRadius: '8px',
                    overflow: 'hidden'
                  }}>
                    {/* CABEÇALHO */}
                    <div 
                      onClick={() => setProdutoSelecionado(produtoSelecionado === produto.nome ? null : produto.nome)}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '1rem',
                        cursor: 'pointer',
                        background: produtoSelecionado === produto.nome ? (darkMode ? '#333' : '#e5e7eb') : 'transparent'
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>{produto.nome}</div>
                        <div style={{ fontSize: '0.8rem', color: darkMode ? '#888' : '#666' }}>
                          {produto.tipo} • {produto.variacoes.length} opção{produto.variacoes.length > 1 ? 'ões' : ''}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '1rem', fontWeight: '600', color: '#10b981' }}>
                          R$ {parseFloat(produto.preco_venda).toFixed(2)}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: darkMode ? '#888' : '#666' }}>
                          {produtoSelecionado === produto.nome ? '▲' : '▼'}
                        </div>
                      </div>
                    </div>
                    
                    {/* VARIAÇÕES */}
                    {produtoSelecionado === produto.nome && (
                      <div style={{
                        borderTop: `1px solid ${darkMode ? '#444' : '#d1d5db'}`,
                        padding: '0.5rem'
                      }}>
                        {produto.variacoes.map(variacao => (
                          <div 
                            key={variacao.id}
                            onClick={() => {
                              const produtoCompleto = produtos.find(p => p.id === variacao.id);
                              if (produtoCompleto) adicionarAoCarrinho(produtoCompleto);
                            }}
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              padding: '0.75rem',
                              margin: '0.25rem',
                              background: carrinho.find(item => item.id === variacao.id) 
                                ? (darkMode ? '#1e3a8a' : '#dbeafe') 
                                : (darkMode ? '#1a1a1a' : '#ffffff'),
                              borderRadius: '6px',
                              cursor: 'pointer',
                              border: carrinho.find(item => item.id === variacao.id)
                                ? '1px solid #3b82f6'
                                : `1px solid ${darkMode ? '#333' : '#e5e7eb'}`
                            }}
                          >
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: '500', fontSize: '0.85rem' }}>
                                {variacao.cor && `${variacao.cor}`}
                                {variacao.cor && variacao.tamanho && ' • '}
                                {variacao.tamanho && `Tam. ${variacao.tamanho}`}
                              </div>
                              <div style={{ fontSize: '0.7rem', color: darkMode ? '#888' : '#666' }}>
                                {variacao.codigo} • Estoque: {variacao.estoque_atual}
                              </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <div style={{ textAlign: 'right' }}>
                                <div style={{ fontWeight: '600', color: '#10b981', fontSize: '0.9rem' }}>
                                  R$ {parseFloat(variacao.preco_venda).toFixed(2)}
                                </div>
                              </div>
                              {carrinho.find(item => item.id === variacao.id) && (
                                <div style={{
                                  background: '#10b981',
                                  color: '#ffffff',
                                  borderRadius: '50%',
                                  width: '20px',
                                  height: '20px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '0.7rem',
                                  fontWeight: '600'
                                }}>
                                  {carrinho.find(item => item.id === variacao.id)?.quantidade}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </>
        )}

        {activeTab === 'carrinho' && (
          <div style={{ display: 'grid', gap: '0.5rem' }}>
            {carrinho.length === 0 ? (
              <p style={{ textAlign: 'center', color: darkMode ? '#888' : '#666', padding: '2rem' }}>
                Carrinho vazio
              </p>
            ) : (
              carrinho.map(item => (
                <div key={item.id} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '1rem',
                  background: darkMode ? '#2a2a2a' : '#f8f9fa',
                  border: `1px solid ${darkMode ? '#333' : '#e5e7eb'}`,
                  borderRadius: '8px'
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>{item.nome}</div>
                    <div style={{ fontSize: '0.8rem', color: darkMode ? '#888' : '#666' }}>
                      R$ {parseFloat(item.preco_venda).toFixed(2)} cada
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <button onClick={() => alterarQuantidade(item.id, item.quantidade - 1)} style={{
                      width: '32px',
                      height: '32px',
                      background: darkMode ? '#2a2a2a' : '#f8f9fa',
                      border: `1px solid ${darkMode ? '#333' : '#e5e7eb'}`,
                      borderRadius: '4px',
                      cursor: 'pointer',
                      color: darkMode ? '#ffffff' : '#000000'
                    }}>
                      -
                    </button>
                    <span style={{ minWidth: '30px', textAlign: 'center' }}>{item.quantidade}</span>
                    <button onClick={() => alterarQuantidade(item.id, item.quantidade + 1)} style={{
                      width: '32px',
                      height: '32px',
                      background: darkMode ? '#2a2a2a' : '#f8f9fa',
                      border: `1px solid ${darkMode ? '#333' : '#e5e7eb'}`,
                      borderRadius: '4px',
                      cursor: 'pointer',
                      color: darkMode ? '#ffffff' : '#000000'
                    }}>
                      +
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'cliente' && (
          <div style={{ display: 'grid', gap: '1rem' }}>
            <input
              placeholder="Nome do cliente *"
              value={clienteNome}
              onChange={(e) => setClienteNome(e.target.value)}
              readOnly={clienteTelefone.length >= 10 && clienteNome && !clienteNome.includes('Digite')}
              style={{
                width: '100%',
                padding: '12px',
                background: (clienteTelefone.length >= 10 && clienteNome && !clienteNome.includes('Digite')) 
                  ? (darkMode ? '#1a4d1a' : '#f0f9ff') 
                  : (darkMode ? '#2a2a2a' : '#f8f9fa'),
                border: `1px solid ${darkMode ? '#333' : '#e5e7eb'}`,
                borderRadius: '8px',
                color: darkMode ? '#ffffff' : '#000000',
                fontSize: '16px'
              }}
            />
            <input
              placeholder="Telefone (opcional)"
              value={clienteTelefone}
              onChange={async (e) => {
                setClienteTelefone(e.target.value);
                if (e.target.value.length >= 10) {
                  // Verificar se cliente já existe
                  const { data: clienteExistente } = await supabase
                    .from('clientes_tatuape')
                    .select('*')
                    .eq('telefone', e.target.value)
                    .single();
                  
                  if (clienteExistente) {
                    setClienteNome(clienteExistente.nome_completo || '');
                    setClienteCidade(clienteExistente.cidade || '');
                    setClienteCpf(clienteExistente.cpf || '');
                    setOndeConheceu(clienteExistente.onde_conheceu || '');
                  }
                  
                  const clienteStandby = await verificarClienteStandby(e.target.value);
                  setClienteEmStandby(clienteStandby);
                }
              }}
              style={{
                width: '100%',
                padding: '12px',
                background: darkMode ? '#2a2a2a' : '#f8f9fa',
                border: `1px solid ${clienteEmStandby ? '#ef4444' : (darkMode ? '#333' : '#e5e7eb')}`,
                borderRadius: '8px',
                color: darkMode ? '#ffffff' : '#000000',
                fontSize: '16px'
              }}
            />
            {clienteEmStandby && (
              <div style={{
                background: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '8px',
                padding: '12px',
                marginBottom: '15px',
                color: '#dc2626',
                fontSize: '0.9rem'
              }}>
                ⚠️ Cliente já está em standby com {clienteEmStandby.vendedor_nome}
              </div>
            )}
            {cpfJaExiste && (
              <div style={{
                background: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '8px',
                padding: '12px',
                marginBottom: '15px',
                color: '#dc2626',
                fontSize: '0.9rem'
              }}>
                ⚠️ CPF já cadastrado para outro cliente
              </div>
            )}
            <input
              placeholder="Cidade (opcional)"
              value={clienteCidade}
              onChange={(e) => setClienteCidade(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                background: darkMode ? '#2a2a2a' : '#f8f9fa',
                border: `1px solid ${darkMode ? '#333' : '#e5e7eb'}`,
                borderRadius: '8px',
                color: darkMode ? '#ffffff' : '#000000',
                fontSize: '16px'
              }}
            />
            <input
              placeholder="CPF (opcional)"
              value={clienteCpf}
              onChange={async (e) => {
                setClienteCpf(e.target.value);
                if (e.target.value.length >= 11) {
                  const { data: cpfExistente } = await supabase
                    .from('clientes_tatuape')
                    .select('nome_completo')
                    .eq('cpf', e.target.value)
                    .neq('telefone', clienteTelefone)
                    .single();
                  
                  setCpfJaExiste(!!cpfExistente);
                } else {
                  setCpfJaExiste(false);
                }
              }}
              style={{
                width: '100%',
                padding: '12px',
                background: cpfJaExiste ? '#fef2f2' : (darkMode ? '#2a2a2a' : '#f8f9fa'),
                border: `1px solid ${cpfJaExiste ? '#ef4444' : (darkMode ? '#333' : '#e5e7eb')}`,
                borderRadius: '8px',
                color: darkMode ? '#ffffff' : '#000000',
                fontSize: '16px'
              }}
            />
            <select
              value={ondeConheceu}
              onChange={(e) => setOndeConheceu(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                background: darkMode ? '#2a2a2a' : '#f8f9fa',
                border: `1px solid ${darkMode ? '#333' : '#e5e7eb'}`,
                borderRadius: '8px',
                color: darkMode ? '#ffffff' : '#000000',
                fontSize: '16px'
              }}
            >
              <option value="">Onde conheceu a VH? (opcional)</option>
              <option value="amigos">Amigos</option>
              <option value="instagram">Instagram</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="facebook">Facebook</option>
              <option value="outros">Outros</option>
            </select>
            {ondeConheceu === 'outros' && (
              <input
                placeholder="Especifique onde conheceu..."
                value={ondeConheceuOutro}
                onChange={(e) => setOndeConheceuOutro(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: darkMode ? '#2a2a2a' : '#f8f9fa',
                  border: `1px solid ${darkMode ? '#333' : '#e5e7eb'}`,
                  borderRadius: '8px',
                  color: darkMode ? '#ffffff' : '#000000',
                  fontSize: '16px'
                }}
              />
            )}
          </div>
        )}

        {activeTab === 'standby' && (
          <div>
            {vendasStandby.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: darkMode ? '#888' : '#666' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📋</div>
                <h3>Nenhuma venda em standby</h3>
                <p>As vendas enviadas para standby aparecerão aqui</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '1rem' }}>
                {vendasStandby.map(venda => (
                  <div key={venda.id} style={{
                    background: darkMode ? '#2a2a2a' : '#f8f9fa',
                    border: `1px solid ${darkMode ? '#333' : '#e5e7eb'}`,
                    borderRadius: '8px',
                    padding: '1rem'
                  }}>
                    <div style={{ marginBottom: '1rem' }}>
                      <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem' }}>{venda.cliente_nome}</h4>
                      <p style={{ margin: '0 0 0.5rem 0', color: darkMode ? '#888' : '#666', fontSize: '0.8rem' }}>
                        {new Date(venda.created_at).toLocaleString('pt-BR')}
                      </p>
                      <p style={{ margin: 0, fontSize: '1.1rem', fontWeight: '700', color: '#10b981' }}>
                        Total: R$ {venda.valor_total.toFixed(2)}
                      </p>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                      <button onClick={() => editarVendaStandby(venda)} style={{
                        flex: 1,
                        padding: '8px',
                        background: '#3b82f6',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '0.8rem'
                      }}>
                        ✏️ Editar
                      </button>
                      <button onClick={() => finalizarVendaStandby(venda)} disabled={processandoVenda} style={{
                        flex: 1,
                        padding: '8px',
                        background: processandoVenda ? '#666' : '#10b981',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: processandoVenda ? 'not-allowed' : 'pointer',
                        fontSize: '0.8rem'
                      }}>
                        ✅ Enviar
                      </button>
                      <button onClick={() => cancelarVendaStandby(venda.id)} style={{
                        flex: 1,
                        padding: '8px',
                        background: '#ef4444',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '0.8rem'
                      }}>
                        ❌ Cancelar
                      </button>
                    </div>
                    
                    <div style={{ borderTop: `1px solid ${darkMode ? '#444' : '#d1d5db'}`, paddingTop: '0.5rem' }}>
                      <h5 style={{ margin: '0 0 0.5rem 0', fontSize: '0.8rem', color: darkMode ? '#888' : '#666' }}>Produtos:</h5>
                      {JSON.parse(venda.carrinho).map(item => (
                        <div key={item.id} style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          fontSize: '0.8rem',
                          marginBottom: '0.25rem'
                        }}>
                          <span>{item.nome} x{item.quantidade}</span>
                          <span>R$ {(item.preco_venda * item.quantidade).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Bar */}
      {carrinho.length > 0 && (
        <div style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          background: darkMode ? '#1a1a1a' : '#f8f9fa',
          borderTop: `1px solid ${darkMode ? '#333' : '#e5e7eb'}`,
          padding: '1rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <div style={{ fontSize: '1.2rem', fontWeight: '700' }}>
              R$ {calcularTotal().toFixed(2)}
            </div>
            <div style={{ fontSize: '0.8rem', color: darkMode ? '#888' : '#666' }}>
              {carrinho.length} {carrinho.length === 1 ? 'item' : 'itens'}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={enviarParaStandby} disabled={clienteEmStandby || cpfJaExiste || processandoVenda} style={{
              flex: 1,
              padding: '12px 16px',
              background: (clienteEmStandby || cpfJaExiste || processandoVenda) ? '#666' : '#f59e0b',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              cursor: (clienteEmStandby || cpfJaExiste || processandoVenda) ? 'not-allowed' : 'pointer',
              fontWeight: '600',
              fontSize: '0.9rem'
            }}>
              Standby
            </button>
            <button onClick={finalizarVenda} disabled={clienteEmStandby || processandoVenda} style={{
              flex: 1,
              padding: '12px 16px',
              background: (clienteEmStandby || processandoVenda) ? '#666' : '#10b981',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              cursor: (clienteEmStandby || processandoVenda) ? 'not-allowed' : 'pointer',
              fontWeight: '600',
              fontSize: '0.9rem'
            }}>
              Enviar ao Caixa
            </button>
          </div>
        </div>
      )}
      
      <QRScanner 
        isOpen={showQRScanner}
        onScan={handleQRScan}
        onClose={() => setShowQRScanner(false)}
      />
      
      <ModalProdutoAdicionado
        produto={produtoAdicionado}
        isOpen={showModalProduto}
        onContinuar={() => {
          setShowModalProduto(false);
          setShowQRScanner(true);
        }}
        onFechar={() => {
          setShowModalProduto(false);
          setProdutoAdicionado(null);
        }}
      />
      
      <ModalProdutoNaoEncontrado
        isOpen={showModalErro}
        codigo={codigoErro}
        onTentarNovamente={() => {
          setShowModalErro(false);
          setShowQRScanner(true);
        }}
        onFechar={() => {
          setShowModalErro(false);
          setCodigoErro('');
        }}
      />
      
      <ModalClienteObrigatorio
        isOpen={showModalCliente}
        onIrParaCliente={() => {
          setShowModalCliente(false);
          setActiveTab('cliente');
        }}
        onFechar={() => setShowModalCliente(false)}
      />
    </div>
  );
}