import React, { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabase';
import { supabaseMogi } from '../../utils/supabaseMogi';
import { useTheme } from '../../contexts/ThemeContext';

export default function VendedorOnlineNovo({ user, onLogout }) {
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
  const [clienteEndereco, setClienteEndereco] = useState('');
  const [tipoEnvio, setTipoEnvio] = useState('retirada');
  const [activeTab, setActiveTab] = useState('produtos');
  const [pedidos, setPedidos] = useState([]);
  const [processandoVenda, setProcessandoVenda] = useState(false);

  useEffect(() => {
    carregarProdutos();
    carregarPedidos();
  }, []);

  const carregarProdutos = async () => {
    try {
      const [produtosTatuape, produtosMogi] = await Promise.all([
        supabase.from('produtos_tatuape').select('*').eq('ativo', true).gt('estoque_atual', 0),
        supabaseMogi.from('produtos_mogi').select('*').eq('ativo', true).gt('estoque_atual', 0)
      ]);

      const produtosConsolidados = [
        ...(produtosTatuape.data || []).map(p => ({
          ...p,
          loja_origem: 'tatuape'
        })),
        ...(produtosMogi.data || []).map(p => ({
          ...p,
          loja_origem: 'mogi'
        }))
      ];

      setProdutos(produtosConsolidados);

      // Agrupar produtos por nome
      const agrupados = {};
      const tiposUnicos = new Set();

      produtosConsolidados.forEach(produto => {
        if (produto.tipo) tiposUnicos.add(produto.tipo);
        
        const chave = `${produto.nome}_${produto.loja_origem}`;
        if (!agrupados[chave]) {
          agrupados[chave] = {
            nome: produto.nome,
            tipo: produto.tipo,
            preco_venda: produto.preco_venda,
            loja_origem: produto.loja_origem,
            variacoes: []
          };
        }
        
        agrupados[chave].variacoes.push({
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
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
    }
  };

  const carregarPedidos = async () => {
    try {
      const [pedidosTatuape, pedidosMogi] = await Promise.all([
        supabase.from('vendas_standby_tatuape').select('*').eq('vendedor_nome', user.nome),
        supabaseMogi.from('vendas_standby_mogi').select('*').eq('vendedor_nome', user.nome)
      ]);

      const todosPedidos = [
        ...(pedidosTatuape.data || []).map(p => ({ ...p, loja: 'tatuape' })),
        ...(pedidosMogi.data || []).map(p => ({ ...p, loja: 'mogi' }))
      ];

      setPedidos(todosPedidos);
    } catch (error) {
      console.error('Erro ao carregar pedidos:', error);
    }
  };

  const buscarCliente = async (telefone) => {
    if (telefone.length < 10) return;

    try {
      const [clienteTatuape, clienteMogi] = await Promise.all([
        supabase.from('clientes_tatuape').select('*').eq('telefone', telefone).maybeSingle(),
        supabaseMogi.from('clientes_mogi').select('*').eq('telefone', telefone).maybeSingle()
      ]);

      const cliente = clienteTatuape.data || clienteMogi.data;
      
      if (cliente) {
        setClienteNome(cliente.nome_completo || cliente.nome || '');
        setClienteCpf(cliente.cpf || '');
        setClienteCidade(cliente.cidade || '');
        setClienteEndereco(cliente.endereco || '');
      }
    } catch (error) {
      // Cliente não encontrado
    }
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

  const finalizarVenda = async () => {
    if (processandoVenda) return;
    
    if (carrinho.length === 0) {
      alert('Adicione produtos ao carrinho');
      return;
    }

    if (!clienteNome.trim()) {
      alert('Nome do cliente é obrigatório!');
      return;
    }

    if (!clienteTelefone.trim()) {
      alert('Telefone do cliente é obrigatório!');
      return;
    }

    setProcessandoVenda(true);

    try {
      // Cadastrar cliente primeiro
      const clienteCompleto = {
        nome_completo: clienteNome,
        telefone: clienteTelefone,
        cpf: clienteCpf || null,
        cidade: clienteCidade || null,
        endereco: clienteEndereco || null
      };

      // Determinar a loja de destino baseada nos produtos do carrinho
      let lojaDestino = 'tatuape'; // padrão
      
      if (carrinho.length > 0) {
        const produtosMogi = carrinho.filter(item => item.loja_origem === 'mogi');
        const produtosTatuape = carrinho.filter(item => item.loja_origem === 'tatuape');
        
        // Se a maioria dos produtos é de Mogi, direcionar para Mogi
        if (produtosMogi.length > produtosTatuape.length) {
          lojaDestino = 'mogi';
        }
      }
      
      // Inserir/atualizar cliente na loja correspondente
      const supabaseClient = lojaDestino === 'mogi' ? supabaseMogi : supabase;
      await supabaseClient
        .from(`clientes_${lojaDestino}`)
        .upsert(clienteCompleto, { onConflict: 'telefone' });

      // Preparar dados da venda online
      const vendaData = {
        vendedor_nome: user.nome,
        cliente_nome: clienteNome,
        cliente_telefone: clienteTelefone,
        cliente_cpf: clienteCpf || null,
        cliente_cidade: clienteCidade || null,
        carrinho: JSON.stringify(carrinho),
        valor_total: calcularTotal(),
        observacoes: `VENDA ONLINE - Tipo: ${tipoEnvio} | Endereço: ${clienteEndereco} | Separador: PENDENTE | Loja: ${lojaDestino.toUpperCase()}`
      };

      const { error } = await supabaseClient
        .from(`vendas_standby_${lojaDestino}`)
        .insert([vendaData]);

      if (error) throw error;

      // Limpar formulários
      setCarrinho([]);
      setClienteNome('');
      setClienteTelefone('');
      setClienteCidade('');
      setClienteCpf('');
      setClienteEndereco('');
      setTipoEnvio('retirada');
      setActiveTab('produtos');
      
      alert(`Pedido enviado para separação na loja ${lojaDestino.toUpperCase()} com sucesso!`);
      carregarPedidos();
    } catch (error) {
      console.error('Erro ao finalizar venda:', error);
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
              <h1 style={{ fontSize: '1.2rem', fontWeight: '700', margin: 0 }}>VENDAS ONLINE</h1>
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
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        background: darkMode ? '#1a1a1a' : '#f8f9fa',
        borderBottom: `1px solid ${darkMode ? '#333' : '#e5e7eb'}`
      }}>
        {['produtos', 'carrinho', 'cliente', 'pedidos'].map(tab => (
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
            {tab === 'pedidos' && `Pedidos (${pedidos.length})`}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, padding: '1rem', paddingBottom: '5rem' }}>
        {activeTab === 'produtos' && (
          <>
            {/* BUSCA */}
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
                  <div key={`${produto.nome}_${produto.loja_origem}`} style={{
                    background: darkMode ? '#2a2a2a' : '#f8f9fa',
                    border: `1px solid ${darkMode ? '#333' : '#e5e7eb'}`,
                    borderRadius: '8px',
                    overflow: 'hidden'
                  }}>
                    {/* CABEÇALHO */}
                    <div 
                      onClick={() => setProdutoSelecionado(produtoSelecionado === `${produto.nome}_${produto.loja_origem}` ? null : `${produto.nome}_${produto.loja_origem}`)}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '1rem',
                        cursor: 'pointer',
                        background: produtoSelecionado === `${produto.nome}_${produto.loja_origem}` ? (darkMode ? '#333' : '#e5e7eb') : 'transparent'
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>{produto.nome}</div>
                        <div style={{ fontSize: '0.8rem', color: darkMode ? '#888' : '#666' }}>
                          {produto.tipo} • {produto.loja_origem.toUpperCase()} • {produto.variacoes.length} opção{produto.variacoes.length > 1 ? 'ões' : ''}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '1rem', fontWeight: '600', color: '#10b981' }}>
                          R$ {parseFloat(produto.preco_venda).toFixed(2)}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: darkMode ? '#888' : '#666' }}>
                          {produtoSelecionado === `${produto.nome}_${produto.loja_origem}` ? '▲' : '▼'}
                        </div>
                      </div>
                    </div>
                    
                    {/* VARIAÇÕES */}
                    {produtoSelecionado === `${produto.nome}_${produto.loja_origem}` && (
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
                      {item.loja_origem?.toUpperCase()} • R$ {parseFloat(item.preco_venda).toFixed(2)} cada
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
              placeholder="Telefone *"
              value={clienteTelefone}
              onChange={(e) => {
                setClienteTelefone(e.target.value);
                buscarCliente(e.target.value);
              }}
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
              placeholder="Nome do cliente *"
              value={clienteNome}
              onChange={(e) => setClienteNome(e.target.value)}
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
              onChange={(e) => setClienteCpf(e.target.value)}
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
            <textarea
              placeholder="Endereço completo"
              value={clienteEndereco}
              onChange={(e) => setClienteEndereco(e.target.value)}
              rows={3}
              style={{
                width: '100%',
                padding: '12px',
                background: darkMode ? '#2a2a2a' : '#f8f9fa',
                border: `1px solid ${darkMode ? '#333' : '#e5e7eb'}`,
                borderRadius: '8px',
                color: darkMode ? '#ffffff' : '#000000',
                fontSize: '16px',
                resize: 'vertical'
              }}
            />
            <select
              value={tipoEnvio}
              onChange={(e) => setTipoEnvio(e.target.value)}
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
              <option value="retirada">Retirada na Loja</option>
              <option value="entrega">Entrega</option>
              <option value="correios">Correios</option>
            </select>
          </div>
        )}

        {activeTab === 'pedidos' && (
          <div>
            {pedidos.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: darkMode ? '#888' : '#666' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📋</div>
                <h3>Nenhum pedido encontrado</h3>
                <p>Seus pedidos online aparecerão aqui</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '1rem' }}>
                {pedidos.map(pedido => (
                  <div key={pedido.id} style={{
                    background: darkMode ? '#2a2a2a' : '#f8f9fa',
                    border: `1px solid ${darkMode ? '#333' : '#e5e7eb'}`,
                    borderRadius: '8px',
                    padding: '1rem'
                  }}>
                    <div style={{ marginBottom: '1rem' }}>
                      <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem' }}>{pedido.cliente_nome}</h4>
                      <p style={{ margin: '0 0 0.5rem 0', color: darkMode ? '#888' : '#666', fontSize: '0.8rem' }}>
                        {pedido.numero_venda} - {pedido.loja?.toUpperCase()}
                      </p>
                      <p style={{ margin: '0 0 0.5rem 0', color: darkMode ? '#888' : '#666', fontSize: '0.8rem' }}>
                        {new Date(pedido.created_at).toLocaleString('pt-BR')}
                      </p>
                      <p style={{ margin: 0, fontSize: '1.1rem', fontWeight: '700', color: '#f59e0b' }}>
                        Status: SEPARANDO
                      </p>
                      <p style={{ margin: 0, fontSize: '1.1rem', fontWeight: '700', color: '#10b981' }}>
                        Total: R$ {pedido.valor_total?.toFixed(2)}
                      </p>
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
          <button onClick={finalizarVenda} disabled={processandoVenda || !clienteTelefone.trim() || !clienteNome.trim()} style={{
            padding: '12px 24px',
            background: (processandoVenda || !clienteTelefone.trim() || !clienteNome.trim()) ? '#666' : '#10b981',
            color: '#ffffff',
            border: 'none',
            borderRadius: '8px',
            cursor: (processandoVenda || !clienteTelefone.trim() || !clienteNome.trim()) ? 'not-allowed' : 'pointer',
            fontWeight: '600',
            fontSize: '1rem'
          }}>
            {processandoVenda ? 'Enviando...' : 'Enviar para Separação'}
          </button>
        </div>
      )}
    </div>
  );
}