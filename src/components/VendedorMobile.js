import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';
import { useTheme } from '../contexts/ThemeContext';
import VendedorProfile from './VendedorProfile';

export default function VendedorMobile({ user, onLogout }) {
  const { theme, themeName, toggleTheme } = useTheme();
  const [produtos, setProdutos] = useState([]);
  const [carrinho, setCarrinho] = useState([]);
  const [busca, setBusca] = useState('');
  const [clienteNome, setClienteNome] = useState('');
  const [clienteTelefone, setClienteTelefone] = useState('');
  const [clienteCidade, setClienteCidade] = useState('');
  const [clienteCpf, setClienteCpf] = useState('');
  const [ondeConheceu, setOndeConheceu] = useState('');
  const [ondeConheceuOutro, setOndeConheceuOutro] = useState('');
  const [vendasMes, setVendasMes] = useState(0);
  const [activeTab, setActiveTab] = useState('produtos');
  const [showProfile, setShowProfile] = useState(false);

  useEffect(() => {
    carregarProdutos();
    carregarVendasMes();
  }, []);

  const carregarProdutos = async () => {
    const { data } = await supabase
      .from('produtos_tatuape')
      .select('*')
      .eq('ativo', true)
      .gt('estoque_atual', 0)
      .order('nome');
    setProdutos(data || []);
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
    if (carrinho.length === 0) {
      alert('Adicione produtos ao carrinho');
      return;
    }

    if (!clienteNome.trim()) {
      alert('Nome do cliente é obrigatório');
      return;
    }

    const numeroVenda = `TAT-${Date.now()}`;
    const valorTotal = calcularTotal();

    try {
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

      alert(`Venda ${numeroVenda} registrada!\nTotal: R$ ${valorTotal.toFixed(2)}\n\nAguardando pagamento no caixa.`);
      
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
    }
  };

  const produtosFiltrados = produtos.filter(p =>
    p.nome.toLowerCase().includes(busca.toLowerCase()) ||
    p.codigo.toLowerCase().includes(busca.toLowerCase())
  );

  const metaMensal = user.meta_mensal || 0;
  const percentualMeta = metaMensal > 0 ? (vendasMes / metaMensal) * 100 : 0;

  if (showProfile) {
    return <VendedorProfile user={user} onBack={() => setShowProfile(false)} />;
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: theme.background, 
      color: theme.text,
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header */}
      <div style={{
        background: theme.surface,
        borderBottom: `1px solid ${theme.border}`,
        padding: '1rem',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '1.2rem', fontWeight: '700', margin: 0 }}>VENDAS</h1>
            <p style={{ fontSize: '0.8rem', opacity: 0.8, margin: '0.25rem 0 0 0' }}>
              {user.nome}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <button onClick={toggleTheme} style={{
              padding: '8px',
              background: theme.surface,
              color: theme.text,
              border: `1px solid ${theme.border}`,
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '1.2rem'
            }}>
              {themeName === 'dark' ? '☀️' : '🌙'}
            </button>
            <button onClick={() => setShowProfile(true)} style={{
              padding: '8px 12px',
              background: theme.surface,
              color: theme.text,
              border: `1px solid ${theme.border}`,
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.9rem'
            }}>
              👤
            </button>
            <button onClick={onLogout} style={{
              padding: '8px 12px',
              background: theme.surface,
              color: theme.text,
              border: `1px solid ${theme.border}`,
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
              background: theme.borderLight,
              borderRadius: '3px',
              overflow: 'hidden'
            }}>
              <div style={{
                height: '100%',
                background: percentualMeta >= 100 ? theme.success : theme.accent,
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
        background: theme.surface,
        borderBottom: `1px solid ${theme.border}`
      }}>
        {['produtos', 'carrinho', 'cliente'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              flex: 1,
              padding: '1rem',
              background: activeTab === tab ? theme.background : 'transparent',
              color: activeTab === tab ? theme.accent : theme.textSecondary,
              border: 'none',
              borderBottom: activeTab === tab ? `2px solid ${theme.accent}` : 'none',
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontWeight: activeTab === tab ? '600' : '400'
            }}
          >
            {tab === 'produtos' && `Produtos${carrinho.length > 0 ? ` (${carrinho.length})` : ''}`}
            {tab === 'carrinho' && `Carrinho (${carrinho.length})`}
            {tab === 'cliente' && 'Cliente'}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, padding: '1rem', paddingBottom: '5rem' }}>
        {activeTab === 'produtos' && (
          <>
            <input
              placeholder="Buscar produto..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                marginBottom: '1rem',
                background: theme.surface,
                border: `1px solid ${theme.border}`,
                borderRadius: '8px',
                color: theme.text,
                fontSize: '16px'
              }}
            />
            <div style={{ display: 'grid', gap: '0.5rem' }}>
              {produtosFiltrados.map(produto => (
                <div key={produto.id} onClick={() => adicionarAoCarrinho(produto)} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '1rem',
                  background: theme.surface,
                  border: `1px solid ${theme.border}`,
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>{produto.nome}</div>
                    <div style={{ fontSize: '0.8rem', color: theme.textSecondary }}>
                      {produto.codigo} • Estoque: {produto.estoque_atual}
                    </div>
                  </div>
                  <div style={{ fontSize: '1rem', fontWeight: '600', color: theme.success }}>
                    R$ {parseFloat(produto.preco_venda).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {activeTab === 'carrinho' && (
          <div style={{ display: 'grid', gap: '0.5rem' }}>
            {carrinho.length === 0 ? (
              <p style={{ textAlign: 'center', color: theme.textSecondary, padding: '2rem' }}>
                Carrinho vazio
              </p>
            ) : (
              carrinho.map(item => (
                <div key={item.id} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '1rem',
                  background: theme.surface,
                  border: `1px solid ${theme.border}`,
                  borderRadius: '8px'
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>{item.nome}</div>
                    <div style={{ fontSize: '0.8rem', color: theme.textSecondary }}>
                      R$ {parseFloat(item.preco_venda).toFixed(2)} cada
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <button onClick={() => alterarQuantidade(item.id, item.quantidade - 1)} style={{
                      width: '32px',
                      height: '32px',
                      background: theme.surface,
                      border: `1px solid ${theme.border}`,
                      borderRadius: '4px',
                      cursor: 'pointer',
                      color: theme.text
                    }}>
                      -
                    </button>
                    <span style={{ minWidth: '30px', textAlign: 'center' }}>{item.quantidade}</span>
                    <button onClick={() => alterarQuantidade(item.id, item.quantidade + 1)} style={{
                      width: '32px',
                      height: '32px',
                      background: theme.surface,
                      border: `1px solid ${theme.border}`,
                      borderRadius: '4px',
                      cursor: 'pointer',
                      color: theme.text
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
              style={{
                width: '100%',
                padding: '12px',
                background: theme.surface,
                border: `1px solid ${theme.border}`,
                borderRadius: '8px',
                color: theme.text,
                fontSize: '16px'
              }}
            />
            <input
              placeholder="Telefone (opcional)"
              value={clienteTelefone}
              onChange={(e) => setClienteTelefone(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                background: theme.surface,
                border: `1px solid ${theme.border}`,
                borderRadius: '8px',
                color: theme.text,
                fontSize: '16px'
              }}
            />
            <input
              placeholder="Cidade (opcional)"
              value={clienteCidade}
              onChange={(e) => setClienteCidade(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                background: theme.surface,
                border: `1px solid ${theme.border}`,
                borderRadius: '8px',
                color: theme.text,
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
                background: theme.surface,
                border: `1px solid ${theme.border}`,
                borderRadius: '8px',
                color: theme.text,
                fontSize: '16px'
              }}
            />
            <select
              value={ondeConheceu}
              onChange={(e) => setOndeConheceu(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                background: theme.surface,
                border: `1px solid ${theme.border}`,
                borderRadius: '8px',
                color: theme.text,
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
                  background: theme.surface,
                  border: `1px solid ${theme.border}`,
                  borderRadius: '8px',
                  color: theme.text,
                  fontSize: '16px'
                }}
              />
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
          background: theme.surface,
          borderTop: `1px solid ${theme.border}`,
          padding: '1rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <div style={{ fontSize: '1.2rem', fontWeight: '700' }}>
              R$ {calcularTotal().toFixed(2)}
            </div>
            <div style={{ fontSize: '0.8rem', color: theme.textSecondary }}>
              {carrinho.length} {carrinho.length === 1 ? 'item' : 'itens'}
            </div>
          </div>
          <button onClick={finalizarVenda} style={{
            padding: '12px 24px',
            background: theme.success,
            color: '#ffffff',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '1rem'
          }}>
            Finalizar Venda
          </button>
        </div>
      )}
    </div>
  );
}