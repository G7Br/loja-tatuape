import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';
import { useTheme } from '../contexts/ThemeContext';
import VendedorMobile from './VendedorMobile';
import VendedorProfile from './VendedorProfile';

export default function Vendedor({ user, onLogout }) {
  const { darkMode, toggleTheme } = useTheme();
  const [isMobile, setIsMobile] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (isMobile) {
    return <VendedorMobile user={user} onLogout={onLogout} />;
  }

  if (showProfile) {
    return <VendedorProfile user={user} onBack={() => setShowProfile(false)} />;
  }

  return <VendedorDesktop user={user} onLogout={onLogout} showProfile={() => setShowProfile(true)} />;
}

function VendedorDesktop({ user, onLogout, showProfile }) {
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
  const [etapa, setEtapa] = useState(1);
  const [vendasStandby, setVendasStandby] = useState([]);
  const [processandoVenda, setProcessandoVenda] = useState(false);
  const [clienteEmStandby, setClienteEmStandby] = useState(null);
  const [telefoneJaExiste, setTelefoneJaExiste] = useState(false);
  const [cpfJaExiste, setCpfJaExiste] = useState(false);

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

  const removerDoCarrinho = (produtoId) => {
    setCarrinho(carrinho.filter(item => item.id !== produtoId));
  };

  const alterarQuantidade = (produtoId, novaQuantidade) => {
    if (novaQuantidade <= 0) {
      removerDoCarrinho(produtoId);
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
      alert('Nome do cliente é obrigatório');
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

      // Limpar formulário
      setCarrinho([]);
      setClienteNome('');
      setClienteTelefone('');
      setClienteCidade('');
      setClienteCpf('');
      setOndeConheceu('');
      setOndeConheceuOutro('');
      setEtapa(1);

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
      setEtapa(2);
      
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

      // Inserir itens da venda
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

      // Atualizar estoque
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
      alert('Nome do cliente é obrigatório');
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
      // Inserir venda
      const { data: venda, error: vendaError } = await supabase
        .from('vendas_tatuape')
        .insert([{
          numero_venda: numeroVenda,
          vendedor_nome: user.nome,
          valor_total: valorTotal,
          valor_final: valorTotal,
          forma_pagamento: 'pendente_caixa',
          cliente_nome: clienteNome || null,
          cliente_telefone: clienteTelefone || null
        }])
        .select()
        .single();

      // Salvar dados extras do cliente se fornecidos
      if (clienteCidade || clienteCpf || ondeConheceu) {
        await supabase
          .from('clientes_tatuape')
          .insert([{
            nome_completo: clienteNome,
            telefone: clienteTelefone || null,
            cpf: clienteCpf || null,
            cidade: clienteCidade || null,
            onde_conheceu: ondeConheceu === 'outros' ? ondeConheceuOutro : ondeConheceu || null
          }]);
      }

      if (vendaError) throw vendaError;

      // Inserir itens da venda
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

      // Atualizar estoque
      for (const item of carrinho) {
        const novoEstoque = item.estoque_atual - item.quantidade;
        await supabase
          .from('produtos_tatuape')
          .update({ estoque_atual: novoEstoque })
          .eq('id', item.id);

        // Registrar movimentação
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
      setEtapa(1);
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

  return (
    <div style={{ minHeight: '100vh', background: darkMode ? '#0a0a0a' : '#ffffff', color: darkMode ? '#ffffff' : '#000000', fontFamily: 'system-ui' }}>
      {/* HEADER */}
      <div style={{
        background: darkMode ? '#1a1a1a' : '#f8f9fa',
        borderBottom: `1px solid ${darkMode ? '#333' : '#e5e7eb'}`,
        padding: '1.5rem 2rem'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{display: 'flex', alignItems: 'center', gap: '15px'}}>
            <img 
              src="/images/logo.png" 
              alt="VH Logo" 
              style={{
                height: '60px', 
                width: 'auto',
                filter: darkMode ? 'brightness(0) invert(1)' : 'none',
                objectFit: 'contain'
              }}
            />
            <div>
              <h1 style={{ fontSize: '1.8rem', fontWeight: '800', margin: 0 }}>VENDAS - TATUAPÉ</h1>
              <p style={{ fontSize: '0.9rem', opacity: 0.8, margin: '0.25rem 0 0 0' }}>
                {user.nome} • {new Date().toLocaleDateString('pt-BR')}
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <button onClick={toggleTheme} style={{
              padding: '12px',
              background: darkMode ? '#1a1a1a' : '#f8f9fa',
              color: darkMode ? '#ffffff' : '#000000',
              border: `1px solid ${darkMode ? '#333' : '#e5e7eb'}`,
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '1.2rem'
            }}>
              {darkMode ? '☀️' : '🌙'}
            </button>
            <button onClick={showProfile} style={{
              padding: '12px 20px',
              background: darkMode ? '#1a1a1a' : '#f8f9fa',
              color: darkMode ? '#ffffff' : '#000000',
              border: `1px solid ${darkMode ? '#333' : '#e5e7eb'}`,
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600'
            }}>
              👤 Perfil
            </button>
            <button onClick={onLogout} style={{
              padding: '12px 24px',
              background: darkMode ? '#1a1a1a' : '#f8f9fa',
              color: darkMode ? '#ffffff' : '#000000',
              border: `1px solid ${darkMode ? '#333' : '#e5e7eb'}`,
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600'
            }}>
              Sair
            </button>
          </div>
        </div>
      </div>

      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1rem' }}>
        {/* META MENSAL */}
        {metaMensal > 0 && (
          <div style={{
            background: darkMode ? '#1a1a1a' : '#ffffff',
            border: `1px solid ${darkMode ? '#333' : '#e5e7eb'}`,
            borderRadius: '16px',
            padding: '2rem',
            marginBottom: '2rem'
          }}>
            <h3 style={{ margin: '0 0 1rem 0', color: darkMode ? '#ffffff' : '#000000' }}>Meta do Mês</h3>
            <div style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '1rem' }}>
              R$ {vendasMes.toFixed(2)} / R$ {metaMensal.toFixed(2)}
            </div>
            <div style={{
              width: '100%',
              height: '12px',
              background: darkMode ? '#333' : '#e5e7eb',
              borderRadius: '8px',
              overflow: 'hidden'
            }}>
              <div style={{
                height: '100%',
                background: percentualMeta >= 100 ? '#10b981' : '#3b82f6',
                width: `${Math.min(percentualMeta, 100)}%`,
                transition: 'width 0.3s ease'
              }}></div>
            </div>
            <div style={{ marginTop: '0.5rem', fontSize: '1.2rem', color: percentualMeta >= 100 ? '#10b981' : (darkMode ? '#ffffff' : '#000000') }}>
              {percentualMeta.toFixed(1)}%
            </div>
          </div>
        )}

        {etapa === 1 && (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: window.innerWidth > 1024 ? '2fr 1fr' : '1fr',
            gap: '2rem' 
          }}>
            {/* PRODUTOS */}
            <div style={{
              background: darkMode ? '#1a1a1a' : '#ffffff',
              border: `1px solid ${darkMode ? '#333' : '#e5e7eb'}`,
              borderRadius: '16px',
              padding: '2rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h2 style={{ margin: 0 }}>Produtos Disponíveis</h2>
                <div style={{ 
                  background: darkMode ? '#333' : '#e5e7eb',
                  padding: '4px 12px',
                  borderRadius: '12px',
                  fontSize: '0.9rem',
                  fontWeight: '600'
                }}>
                  {produtosFiltrados.length} produto{produtosFiltrados.length !== 1 ? 's' : ''}
                </div>
              </div>
              
              {/* BUSCA */}
              <div style={{ position: 'relative', marginBottom: '1rem' }}>
                <div style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: darkMode ? '#888' : '#666',
                  fontSize: '1.1rem',
                  pointerEvents: 'none'
                }}>
                  🔍
                </div>
                <input
                  placeholder="Buscar por nome ou código do produto..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 12px 12px 40px',
                    background: darkMode ? '#2a2a2a' : '#f8f9fa',
                    border: `2px solid ${busca ? '#3b82f6' : (darkMode ? '#444' : '#d1d5db')}`,
                    borderRadius: '12px',
                    color: darkMode ? '#ffffff' : '#000000',
                    fontSize: '16px',
                    transition: 'border-color 0.3s ease'
                  }}
                />
                {busca && (
                  <button
                    onClick={() => setBusca('')}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'transparent',
                      border: 'none',
                      color: darkMode ? '#888' : '#666',
                      cursor: 'pointer',
                      fontSize: '1.2rem',
                      padding: '4px'
                    }}
                  >
                    ✕
                  </button>
                )}
              </div>
              
              {/* FILTROS POR CATEGORIA */}
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.9rem', fontWeight: '500', color: darkMode ? '#888' : '#666' }}>
                    Filtrar por categoria:
                  </span>
                  {(busca || categoriaFiltro) && (
                    <button
                      onClick={() => {
                        setBusca('');
                        setCategoriaFiltro('');
                        setProdutoSelecionado(null);
                      }}
                      style={{
                        padding: '4px 12px',
                        background: 'transparent',
                        color: '#ef4444',
                        border: '1px solid #ef4444',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                        fontWeight: '500'
                      }}
                    >
                      ✕ Limpar filtros
                    </button>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {categorias.map(categoria => {
                    const isActive = (categoriaFiltro === categoria || (categoria === 'Todos' && categoriaFiltro === ''));
                    return (
                      <button
                        key={categoria}
                        onClick={() => setCategoriaFiltro(categoria === 'Todos' ? '' : categoria)}
                        style={{
                          padding: '8px 16px',
                          background: isActive ? '#3b82f6' : (darkMode ? '#2a2a2a' : '#f8f9fa'),
                          color: isActive ? '#ffffff' : (darkMode ? '#ffffff' : '#000000'),
                          border: `2px solid ${isActive ? '#3b82f6' : (darkMode ? '#444' : '#d1d5db')}`,
                          borderRadius: '20px',
                          cursor: 'pointer',
                          fontSize: '0.9rem',
                          fontWeight: isActive ? '600' : '500',
                          transition: 'all 0.3s ease',
                          transform: isActive ? 'scale(1.05)' : 'scale(1)',
                          boxShadow: isActive ? '0 2px 8px rgba(59, 130, 246, 0.3)' : 'none'
                        }}
                        onMouseEnter={(e) => {
                          if (!isActive) {
                            e.target.style.background = darkMode ? '#333' : '#e5e7eb';
                            e.target.style.transform = 'scale(1.02)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isActive) {
                            e.target.style.background = darkMode ? '#2a2a2a' : '#f8f9fa';
                            e.target.style.transform = 'scale(1)';
                          }
                        }}
                      >
                        {categoria}
                      </button>
                    );
                  })}
                </div>
              </div>
              
              {/* LISTA DE PRODUTOS */}
              <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
                {produtosFiltrados.length === 0 ? (
                  <div style={{ 
                    textAlign: 'center', 
                    padding: '3rem 1rem',
                    color: darkMode ? '#888' : '#666'
                  }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
                    <h3 style={{ margin: '0 0 0.5rem 0' }}>Nenhum produto encontrado</h3>
                    <p style={{ margin: 0, fontSize: '0.9rem' }}>
                      {busca ? `Nenhum produto encontrado para "${busca}"` : 'Nenhum produto disponível nesta categoria'}
                    </p>
                  </div>
                ) : (
                  produtosFiltrados.map(produto => (
                    <div key={produto.nome} style={{
                      background: darkMode ? '#2a2a2a' : '#f8f9fa',
                      borderRadius: '8px',
                      marginBottom: '10px',
                      border: `1px solid ${darkMode ? '#444' : '#d1d5db'}`,
                      overflow: 'hidden'
                    }}>
                      {/* CABEÇALHO DO PRODUTO */}
                      <div 
                        onClick={() => setProdutoSelecionado(produtoSelecionado === produto.nome ? null : produto.nome)}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          padding: '15px',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                          background: produtoSelecionado === produto.nome ? (darkMode ? '#333' : '#e5e7eb') : 'transparent'
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: '600', fontSize: '1.1rem' }}>{produto.nome}</div>
                          <div style={{ fontSize: '0.9rem', color: darkMode ? '#888' : '#666' }}>
                            {produto.tipo} • {produto.variacoes.length} variação{produto.variacoes.length > 1 ? 'ões' : ''}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontWeight: '700', fontSize: '1.1rem', color: '#10b981' }}>
                            R$ {parseFloat(produto.preco_venda).toFixed(2)}
                          </div>
                          <div style={{ fontSize: '0.8rem', color: darkMode ? '#888' : '#666' }}>
                            {produtoSelecionado === produto.nome ? '▲' : '▼'} Ver opções
                          </div>
                        </div>
                      </div>
                      
                      {/* VARIAÇÕES DO PRODUTO */}
                      {produtoSelecionado === produto.nome && (
                        <div style={{
                          borderTop: `1px solid ${darkMode ? '#444' : '#d1d5db'}`,
                          padding: '10px 15px'
                        }}>
                          <div style={{ display: 'grid', gap: '8px' }}>
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
                                  padding: '10px',
                                  background: carrinho.find(item => item.id === variacao.id) 
                                    ? (darkMode ? '#1e3a8a' : '#dbeafe') 
                                    : (darkMode ? '#1a1a1a' : '#ffffff'),
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  border: carrinho.find(item => item.id === variacao.id)
                                    ? '2px solid #3b82f6'
                                    : `1px solid ${darkMode ? '#333' : '#e5e7eb'}`,
                                  transition: 'all 0.2s ease',
                                  position: 'relative'
                                }}
                                onMouseEnter={(e) => {
                                  if (!carrinho.find(item => item.id === variacao.id)) {
                                    e.target.style.background = darkMode ? '#333' : '#f8f9fa';
                                  }
                                }}
                                onMouseLeave={(e) => {
                                  if (!carrinho.find(item => item.id === variacao.id)) {
                                    e.target.style.background = darkMode ? '#1a1a1a' : '#ffffff';
                                  }
                                }}
                              >
                                <div>
                                  <div style={{ fontWeight: '500', fontSize: '0.95rem' }}>
                                    {variacao.cor && `${variacao.cor}`}
                                    {variacao.cor && variacao.tamanho && ' • '}
                                    {variacao.tamanho && `Tam. ${variacao.tamanho}`}
                                  </div>
                                  <div style={{ fontSize: '0.8rem', color: darkMode ? '#888' : '#666' }}>
                                    Cód: {variacao.codigo}
                                  </div>
                                </div>
                                <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                  <div>
                                    <div style={{ fontWeight: '600', color: '#10b981' }}>
                                      R$ {parseFloat(variacao.preco_venda).toFixed(2)}
                                    </div>
                                    <div style={{ 
                                      fontSize: '0.8rem', 
                                      color: variacao.estoque_atual > 5 ? '#10b981' : '#f59e0b'
                                    }}>
                                      Estoque: {variacao.estoque_atual}
                                    </div>
                                  </div>
                                  {carrinho.find(item => item.id === variacao.id) && (
                                    <div style={{
                                      background: '#10b981',
                                      color: '#ffffff',
                                      borderRadius: '50%',
                                      width: '24px',
                                      height: '24px',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      fontSize: '0.8rem',
                                      fontWeight: '600'
                                    }}>
                                      {carrinho.find(item => item.id === variacao.id)?.quantidade}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* CARRINHO */}
            <div style={{
              background: darkMode ? '#1a1a1a' : '#ffffff',
              border: `1px solid ${darkMode ? '#333' : '#e5e7eb'}`,
              borderRadius: '16px',
              padding: '2rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h2 style={{ margin: 0 }}>Carrinho ({carrinho.length})</h2>
                {vendasStandby.length > 0 && (
                  <button onClick={() => setEtapa(3)} style={{
                    padding: '8px 16px',
                    background: '#f59e0b',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    fontWeight: '600'
                  }}>
                    Standby ({vendasStandby.length})
                  </button>
                )}
              </div>
              
              <div style={{ maxHeight: '300px', overflowY: 'auto', marginBottom: '1rem' }}>
                {carrinho.map(item => (
                  <div key={item.id} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '12px',
                    background: darkMode ? '#2a2a2a' : '#f8f9fa',
                    borderRadius: '8px',
                    marginBottom: '8px',
                    border: `1px solid ${darkMode ? '#444' : '#d1d5db'}`
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>{item.nome}</div>
                      <div style={{ fontSize: '0.8rem', color: darkMode ? '#888' : '#666' }}>
                        R$ {parseFloat(item.preco_venda).toFixed(2)} x {item.quantidade}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <button onClick={() => alterarQuantidade(item.id, item.quantidade - 1)} style={{
                        padding: '5px 10px',
                        background: darkMode ? '#2a2a2a' : '#f8f9fa',
                        color: darkMode ? '#ffffff' : '#000000',
                        border: `1px solid ${darkMode ? '#333' : '#e5e7eb'}`,
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}>-</button>
                      <span>{item.quantidade}</span>
                      <button onClick={() => alterarQuantidade(item.id, item.quantidade + 1)} style={{
                        padding: '5px 10px',
                        background: darkMode ? '#2a2a2a' : '#f8f9fa',
                        color: darkMode ? '#ffffff' : '#000000',
                        border: `1px solid ${darkMode ? '#333' : '#e5e7eb'}`,
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}>+</button>
                      <button onClick={() => removerDoCarrinho(item.id)} style={{
                        padding: '5px 10px',
                        background: '#ef4444',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}>X</button>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{
                padding: '20px',
                background: darkMode ? '#2a2a2a' : '#f8f9fa',
                borderRadius: '10px',
                marginBottom: '15px',
                border: `1px solid ${darkMode ? '#444' : '#d1d5db'}`
              }}>
                <div style={{ fontSize: '1.5rem', fontWeight: '700', textAlign: 'center', color: '#10b981' }}>
                  Total: R$ {calcularTotal().toFixed(2)}
                </div>
              </div>

              <button onClick={() => setEtapa(2)} disabled={carrinho.length === 0} style={{
                width: '100%',
                padding: '15px',
                background: carrinho.length === 0 ? (darkMode ? '#444' : '#d1d5db') : '#10b981',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '700',
                cursor: carrinho.length === 0 ? 'not-allowed' : 'pointer',
                fontSize: '16px'
              }}>
                Continuar
              </button>
            </div>
          </div>
        )}

        {etapa === 3 && (
          <div style={{
            background: darkMode ? '#1a1a1a' : '#ffffff',
            border: `1px solid ${darkMode ? '#333' : '#e5e7eb'}`,
            borderRadius: '16px',
            padding: '2rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <h2 style={{ margin: 0 }}>Vendas em Standby ({vendasStandby.length})</h2>
              <button onClick={() => setEtapa(1)} style={{
                padding: '12px 24px',
                background: darkMode ? '#2a2a2a' : '#f8f9fa',
                color: darkMode ? '#ffffff' : '#000000',
                border: `1px solid ${darkMode ? '#333' : '#e5e7eb'}`,
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '600'
              }}>
                Nova Venda
              </button>
            </div>

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
                    border: `1px solid ${darkMode ? '#444' : '#d1d5db'}`,
                    borderRadius: '12px',
                    padding: '1.5rem'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                      <div>
                        <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem' }}>{venda.cliente_nome}</h4>
                        <p style={{ margin: '0 0 0.5rem 0', color: darkMode ? '#888' : '#666', fontSize: '0.9rem' }}>
                          {new Date(venda.created_at).toLocaleString('pt-BR')}
                        </p>
                        <p style={{ margin: 0, fontSize: '1.2rem', fontWeight: '700', color: '#10b981' }}>
                          Total: R$ {venda.valor_total.toFixed(2)}
                        </p>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button onClick={() => editarVendaStandby(venda)} style={{
                          padding: '8px 16px',
                          background: '#3b82f6',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '0.9rem'
                        }}>
                          ✏️ Editar
                        </button>
                        <button onClick={() => finalizarVendaStandby(venda)} disabled={processandoVenda} style={{
                          padding: '8px 16px',
                          background: processandoVenda ? '#666' : '#10b981',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: processandoVenda ? 'not-allowed' : 'pointer',
                          fontSize: '0.9rem'
                        }}>
                          ✅ Enviar ao Caixa
                        </button>
                        <button onClick={() => cancelarVendaStandby(venda.id)} style={{
                          padding: '8px 16px',
                          background: '#ef4444',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '0.9rem'
                        }}>
                          ❌ Cancelar
                        </button>
                      </div>
                    </div>
                    
                    <div style={{ borderTop: `1px solid ${darkMode ? '#444' : '#d1d5db'}`, paddingTop: '1rem' }}>
                      <h5 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: darkMode ? '#888' : '#666' }}>Produtos:</h5>
                      {JSON.parse(venda.carrinho).map(item => (
                        <div key={item.id} style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          fontSize: '0.9rem',
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

        {etapa === 2 && (
          <div style={{
            background: darkMode ? '#1a1a1a' : '#ffffff',
            border: `1px solid ${darkMode ? '#333' : '#e5e7eb'}`,
            borderRadius: '16px',
            padding: '2rem',
            maxWidth: '600px',
            margin: '0 auto'
          }}>
            <h2 style={{ marginTop: 0 }}>Dados do Cliente</h2>
            
            <input
              type="text"
              placeholder="Nome completo *"
              value={clienteNome}
              onChange={(e) => setClienteNome(e.target.value)}
              readOnly={clienteTelefone.length >= 10 && clienteNome && !clienteNome.includes('Digite')}
              style={{
                width: '100%',
                padding: '12px',
                marginBottom: '15px',
                background: (clienteTelefone.length >= 10 && clienteNome && !clienteNome.includes('Digite')) 
                  ? (darkMode ? '#1a4d1a' : '#f0f9ff') 
                  : (darkMode ? '#2a2a2a' : '#f8f9fa'),
                border: `1px solid ${darkMode ? '#444' : '#d1d5db'}`,
                borderRadius: '8px',
                color: darkMode ? '#ffffff' : '#000000',
                fontSize: '16px'
              }}
              style={{
                width: '100%',
                padding: '12px',
                marginBottom: '15px',
                background: darkMode ? '#2a2a2a' : '#f8f9fa',
                border: `1px solid ${darkMode ? '#444' : '#d1d5db'}`,
                borderRadius: '8px',
                color: darkMode ? '#ffffff' : '#000000',
                fontSize: '16px'
              }}
            />
            
            <input
              type="tel"
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
                marginBottom: '15px',
                background: darkMode ? '#2a2a2a' : '#f8f9fa',
                border: `1px solid ${clienteEmStandby ? '#ef4444' : (darkMode ? '#444' : '#d1d5db')}`,
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
                color: '#dc2626'
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
                color: '#dc2626'
              }}>
                ⚠️ CPF já cadastrado para outro cliente
              </div>
            )}
            
            <input
              type="text"
              placeholder="Cidade (opcional)"
              value={clienteCidade}
              onChange={(e) => setClienteCidade(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                marginBottom: '15px',
                background: darkMode ? '#2a2a2a' : '#f8f9fa',
                border: `1px solid ${darkMode ? '#444' : '#d1d5db'}`,
                borderRadius: '8px',
                color: darkMode ? '#ffffff' : '#000000',
                fontSize: '16px'
              }}
            />
            
            <input
              type="text"
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
                marginBottom: '15px',
                background: cpfJaExiste ? '#fef2f2' : (darkMode ? '#2a2a2a' : '#f8f9fa'),
                border: `1px solid ${cpfJaExiste ? '#ef4444' : (darkMode ? '#444' : '#d1d5db')}`,
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
                marginBottom: '15px',
                background: darkMode ? '#2a2a2a' : '#f8f9fa',
                border: `1px solid ${darkMode ? '#444' : '#d1d5db'}`,
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
                type="text"
                placeholder="Especifique onde conheceu..."
                value={ondeConheceuOutro}
                onChange={(e) => setOndeConheceuOutro(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  marginBottom: '15px',
                  background: darkMode ? '#2a2a2a' : '#f8f9fa',
                  border: `1px solid ${darkMode ? '#444' : '#d1d5db'}`,
                  borderRadius: '8px',
                  color: darkMode ? '#ffffff' : '#000000',
                  fontSize: '16px'
                }}
              />
            )}

            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
              <button onClick={() => setEtapa(1)} style={{
                padding: '12px 24px',
                background: darkMode ? '#2a2a2a' : '#f8f9fa',
                color: darkMode ? '#ffffff' : '#000000',
                border: `1px solid ${darkMode ? '#333' : '#e5e7eb'}`,
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '600'
              }}>
                Voltar
              </button>
              <button onClick={() => setEtapa(3)} style={{
                padding: '12px 24px',
                background: '#f59e0b',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '600'
              }}>
                Ver Standby ({vendasStandby.length})
              </button>
              <button onClick={enviarParaStandby} disabled={!clienteNome.trim() || clienteEmStandby || cpfJaExiste || processandoVenda} style={{
                flex: 1,
                padding: '12px 24px',
                background: (!clienteNome.trim() || cpfJaExiste) ? (darkMode ? '#444' : '#d1d5db') : '#f59e0b',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                cursor: (!clienteNome.trim() || cpfJaExiste) ? 'not-allowed' : 'pointer',
                fontWeight: '700',
                fontSize: '16px'
              }}>
                Enviar para Standby
              </button>
              <button onClick={finalizarVenda} disabled={!clienteNome.trim() || clienteEmStandby || processandoVenda} style={{
                flex: 1,
                padding: '12px 24px',
                background: !clienteNome.trim() ? (darkMode ? '#444' : '#d1d5db') : '#10b981',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                cursor: !clienteNome.trim() ? 'not-allowed' : 'pointer',
                fontWeight: '700',
                fontSize: '16px',
                marginLeft: '1rem'
              }}>
                Enviar Direto ao Caixa
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
