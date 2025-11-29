import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';
import { useTheme } from '../contexts/ThemeContext';
import VendedorMobile from './VendedorMobile';
import VendedorProfile from './VendedorProfile';

export default function Vendedor({ user, onLogout }) {
  const { theme, themeName, toggleTheme } = useTheme();
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
  const [etapa, setEtapa] = useState(1);

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

      alert(`Venda ${numeroVenda} registrada!\nTotal: R$ ${valorTotal.toFixed(2)}\n\nAguardando pagamento no caixa.`);
      
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
    }
  };

  const produtosFiltrados = produtos.filter(p =>
    p.nome.toLowerCase().includes(busca.toLowerCase()) ||
    p.codigo.toLowerCase().includes(busca.toLowerCase())
  );

  const metaMensal = user.meta_mensal || 0;
  const percentualMeta = metaMensal > 0 ? (vendasMes / metaMensal) * 100 : 0;

  return (
    <div style={{ minHeight: '100vh', background: theme.background, color: theme.text, fontFamily: 'system-ui' }}>
      {/* HEADER */}
      <div style={{
        background: theme.surface,
        borderBottom: `1px solid ${theme.border}`,
        padding: '1.5rem 2rem'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: '800', margin: 0 }}>VENDAS - TATUAPÉ</h1>
            <p style={{ fontSize: '0.9rem', opacity: 0.8, margin: '0.25rem 0 0 0' }}>
              {user.nome} • {new Date().toLocaleDateString('pt-BR')}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <button onClick={toggleTheme} style={{
              padding: '12px',
              background: theme.surface,
              color: theme.text,
              border: `1px solid ${theme.border}`,
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '1.2rem'
            }}>
              {themeName === 'dark' ? '☀️' : '🌙'}
            </button>
            <button onClick={showProfile} style={{
              padding: '12px 20px',
              background: theme.surface,
              color: theme.text,
              border: `1px solid ${theme.border}`,
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600'
            }}>
              👤 Perfil
            </button>
            <button onClick={onLogout} style={{
              padding: '12px 24px',
              background: theme.surface,
              color: theme.text,
              border: `1px solid ${theme.border}`,
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
            background: theme.surfaceGradient,
            border: `1px solid ${theme.border}`,
            borderRadius: '16px',
            padding: '2rem',
            marginBottom: '2rem'
          }}>
            <h3 style={{ margin: '0 0 1rem 0', color: theme.text }}>Meta do Mês</h3>
            <div style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '1rem' }}>
              R$ {vendasMes.toFixed(2)} / R$ {metaMensal.toFixed(2)}
            </div>
            <div style={{
              width: '100%',
              height: '12px',
              background: theme.borderLight,
              borderRadius: '8px',
              overflow: 'hidden'
            }}>
              <div style={{
                height: '100%',
                background: percentualMeta >= 100 ? theme.success : theme.accent,
                width: `${Math.min(percentualMeta, 100)}%`,
                transition: 'width 0.3s ease'
              }}></div>
            </div>
            <div style={{ marginTop: '0.5rem', fontSize: '1.2rem', color: percentualMeta >= 100 ? theme.success : theme.text }}>
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
              background: theme.surfaceGradient,
              border: `1px solid ${theme.border}`,
              borderRadius: '16px',
              padding: '2rem'
            }}>
              <h2 style={{ margin: '0 0 1rem 0' }}>Produtos Disponíveis</h2>
              <input
                placeholder="Buscar produto..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  marginBottom: '1rem',
                  background: theme.surface,
                  border: `1px solid ${theme.borderLight}`,
                  borderRadius: '8px',
                  color: theme.text,
                  fontSize: '16px'
                }}
              />
              <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
                {produtosFiltrados.map(produto => (
                  <div key={produto.id} onClick={() => adicionarAoCarrinho(produto)} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '15px',
                    background: theme.surface,
                    borderRadius: '8px',
                    marginBottom: '10px',
                    cursor: 'pointer',
                    border: `1px solid ${theme.borderLight}`,
                    transition: 'all 0.3s ease'
                  }}>
                    <div>
                      <div style={{ fontWeight: '600' }}>{produto.nome}</div>
                      <div style={{ fontSize: '0.9rem', color: theme.textSecondary }}>
                        {produto.codigo} | {produto.cor || ''} | {produto.tamanho || ''}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontWeight: '700', fontSize: '1.1rem', color: theme.success }}>R$ {parseFloat(produto.preco_venda).toFixed(2)}</div>
                      <div style={{ fontSize: '0.8rem', color: theme.textSecondary }}>Estoque: {produto.estoque_atual}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* CARRINHO */}
            <div style={{
              background: theme.surfaceGradient,
              border: `1px solid ${theme.border}`,
              borderRadius: '16px',
              padding: '2rem'
            }}>
              <h2 style={{ margin: '0 0 1rem 0' }}>Carrinho ({carrinho.length})</h2>
              
              <div style={{ maxHeight: '300px', overflowY: 'auto', marginBottom: '1rem' }}>
                {carrinho.map(item => (
                  <div key={item.id} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '12px',
                    background: theme.surface,
                    borderRadius: '8px',
                    marginBottom: '8px',
                    border: `1px solid ${theme.borderLight}`
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>{item.nome}</div>
                      <div style={{ fontSize: '0.8rem', color: theme.textSecondary }}>
                        R$ {parseFloat(item.preco_venda).toFixed(2)} x {item.quantidade}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <button onClick={() => alterarQuantidade(item.id, item.quantidade - 1)} style={{
                        padding: '5px 10px',
                        background: theme.surface,
                        color: theme.text,
                        border: `1px solid ${theme.border}`,
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}>-</button>
                      <span>{item.quantidade}</span>
                      <button onClick={() => alterarQuantidade(item.id, item.quantidade + 1)} style={{
                        padding: '5px 10px',
                        background: theme.surface,
                        color: theme.text,
                        border: `1px solid ${theme.border}`,
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}>+</button>
                      <button onClick={() => removerDoCarrinho(item.id)} style={{
                        padding: '5px 10px',
                        background: theme.error,
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
                background: theme.surface,
                borderRadius: '10px',
                marginBottom: '15px',
                border: `1px solid ${theme.borderLight}`
              }}>
                <div style={{ fontSize: '1.5rem', fontWeight: '700', textAlign: 'center', color: theme.success }}>
                  Total: R$ {calcularTotal().toFixed(2)}
                </div>
              </div>

              <button onClick={() => setEtapa(2)} disabled={carrinho.length === 0} style={{
                width: '100%',
                padding: '15px',
                background: carrinho.length === 0 ? theme.borderLight : theme.success,
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

        {etapa === 2 && (
          <div style={{
            background: theme.surfaceGradient,
            border: `1px solid ${theme.border}`,
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
              style={{
                width: '100%',
                padding: '12px',
                marginBottom: '15px',
                background: theme.surface,
                border: `1px solid ${theme.borderLight}`,
                borderRadius: '8px',
                color: theme.text,
                fontSize: '16px'
              }}
            />
            
            <input
              type="tel"
              placeholder="Telefone (opcional)"
              value={clienteTelefone}
              onChange={(e) => setClienteTelefone(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                marginBottom: '15px',
                background: theme.surface,
                border: `1px solid ${theme.borderLight}`,
                borderRadius: '8px',
                color: theme.text,
                fontSize: '16px'
              }}
            />
            
            <input
              type="text"
              placeholder="Cidade (opcional)"
              value={clienteCidade}
              onChange={(e) => setClienteCidade(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                marginBottom: '15px',
                background: theme.surface,
                border: `1px solid ${theme.borderLight}`,
                borderRadius: '8px',
                color: theme.text,
                fontSize: '16px'
              }}
            />
            
            <input
              type="text"
              placeholder="CPF (opcional)"
              value={clienteCpf}
              onChange={(e) => setClienteCpf(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                marginBottom: '15px',
                background: theme.surface,
                border: `1px solid ${theme.borderLight}`,
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
                marginBottom: '15px',
                background: theme.surface,
                border: `1px solid ${theme.borderLight}`,
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
                type="text"
                placeholder="Especifique onde conheceu..."
                value={ondeConheceuOutro}
                onChange={(e) => setOndeConheceuOutro(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  marginBottom: '15px',
                  background: theme.surface,
                  border: `1px solid ${theme.borderLight}`,
                  borderRadius: '8px',
                  color: theme.text,
                  fontSize: '16px'
                }}
              />
            )}

            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
              <button onClick={() => setEtapa(1)} style={{
                padding: '12px 24px',
                background: theme.surface,
                color: theme.text,
                border: `1px solid ${theme.border}`,
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '600'
              }}>
                Voltar
              </button>
              <button onClick={finalizarVenda} disabled={!clienteNome.trim()} style={{
                flex: 1,
                padding: '12px 24px',
                background: !clienteNome.trim() ? theme.borderLight : theme.success,
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                cursor: !clienteNome.trim() ? 'not-allowed' : 'pointer',
                fontWeight: '700',
                fontSize: '16px'
              }}>
                Finalizar Venda
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
