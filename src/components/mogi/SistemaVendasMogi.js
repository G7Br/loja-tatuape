import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { supabase, queryWithStore } from '../../utils/supabase';
import SeletorProdutosMogi from './SeletorProdutosMogi';
import { createBrasiliaTimestamp } from '../../utils/dateUtils';
import StoreIndicatorMogi from './StoreIndicatorMogi';

const Container = styled.div.withConfig({
  shouldForwardProp: (prop) => !['darkMode'].includes(prop)
})`
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: ${props => props.darkMode ? '#0f0f0f' : '#f8fafc'};
  color: ${props => props.darkMode ? '#ffffff' : '#1a1a1a'};
`;

const Header = styled.div.withConfig({
  shouldForwardProp: (prop) => !['darkMode'].includes(prop)
})`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  background: ${props => props.darkMode ? '#1a1a1a' : '#ffffff'};
  border-bottom: 1px solid ${props => props.darkMode ? '#333' : '#e5e7eb'};
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
`;

const MainContent = styled.div`
  display: flex;
  flex: 1;
  overflow: hidden;
`;

const LeftPanel = styled.div.withConfig({
  shouldForwardProp: (prop) => !['darkMode'].includes(prop)
})`
  width: 300px;
  background: ${props => props.darkMode ? '#1a1a1a' : '#ffffff'};
  border-right: 1px solid ${props => props.darkMode ? '#333' : '#e5e7eb'};
  display: flex;
  flex-direction: column;
`;

const CenterPanel = styled.div`
  flex: 1;
  padding: 1.5rem;
  overflow-y: auto;
`;

const RightPanel = styled.div.withConfig({
  shouldForwardProp: (prop) => !['darkMode'].includes(prop)
})`
  width: 350px;
  background: ${props => props.darkMode ? '#1a1a1a' : '#ffffff'};
  border-left: 1px solid ${props => props.darkMode ? '#333' : '#e5e7eb'};
  display: flex;
  flex-direction: column;
`;

const Button = styled.button.withConfig({
  shouldForwardProp: (prop) => !['size', 'variant', 'darkMode'].includes(prop)
})`
  padding: ${props => props.size === 'large' ? '1rem 2rem' : '0.75rem 1.5rem'};
  background: ${props => {
    if (props.variant === 'primary') return '#3b82f6';
    if (props.variant === 'success') return '#10b981';
    if (props.variant === 'danger') return '#ef4444';
    if (props.variant === 'warning') return '#f59e0b';
    return props.darkMode ? '#333' : '#f3f4f6';
  }};
  color: ${props => props.variant ? 'white' : (props.darkMode ? '#fff' : '#000')};
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  font-weight: 600;
  font-size: ${props => props.size === 'large' ? '1.1rem' : '0.9rem'};
  transition: all 0.2s ease;
  
  &:hover {
    opacity: 0.9;
    transform: translateY(-1px);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

const CartItem = styled.div.withConfig({
  shouldForwardProp: (prop) => !['darkMode'].includes(prop)
})`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background: ${props => props.darkMode ? '#2a2a2a' : '#f9fafb'};
  border-radius: 0.5rem;
  margin-bottom: 0.5rem;
`;

export default function SistemaVendasMogi({ user, darkMode, onClose }) {
  const [etapa, setEtapa] = useState('vendedor');
  const [vendedorSelecionado, setVendedorSelecionado] = useState(null);
  const [produtos, setProdutos] = useState([]);
  const [carrinho, setCarrinho] = useState([]);
  const [cliente, setCliente] = useState({
    nome_completo: '',
    telefone: '',
    cpf: '',
    cidade: '',
    onde_conheceu: '',
    observacoes: ''
  });
  const [vendedores, setVendedores] = useState([]);
  const [metodoPagamento, setMetodoPagamento] = useState('');
  const [valorPago, setValorPago] = useState(0);
  const [desconto, setDesconto] = useState(0);
  const [observacoes, setObservacoes] = useState('');

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      const [produtosRes, vendedoresRes] = await Promise.all([
        queryWithStoreMogi('produtos').select('*').eq('ativo', true).gt('estoque_atual', 0),
        queryWithStoreMogi('usuarios').select('*').eq('tipo', 'vendedor').eq('ativo', true)
      ]);
      
      setProdutos(produtosRes.data || []);
      setVendedores(vendedoresRes.data || []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    }
  };

  const selecionarVendedor = (vendedor) => {
    setVendedorSelecionado(vendedor);
    setEtapa('produtos');
  };

  const adicionarProduto = (produto) => {
    const itemExistente = carrinho.find(item => item.id === produto.id);
    
    if (itemExistente) {
      if (itemExistente.quantidade >= produto.estoque_atual) {
        alert('Estoque insuficiente!');
        return;
      }
      setCarrinho(carrinho.map(item =>
        item.id === produto.id 
          ? { ...item, quantidade: item.quantidade + 1 }
          : item
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
      alert('Estoque insuficiente!');
      return;
    }
    
    setCarrinho(carrinho.map(item =>
      item.id === produtoId 
        ? { ...item, quantidade: novaQuantidade }
        : item
    ));
  };

  const calcularSubtotal = () => {
    return carrinho.reduce((sum, item) => sum + (item.preco_venda * item.quantidade), 0);
  };

  const calcularTotal = () => {
    return Math.max(0, calcularSubtotal() - desconto);
  };

  const finalizarVenda = async () => {
    if (!metodoPagamento) {
      alert('Selecione um mÃ©todo de pagamento!');
      return;
    }

    if (metodoPagamento === 'dinheiro' && valorPago < calcularTotal()) {
      alert('Valor pago Ã© insuficiente!');
      return;
    }

    if (!cliente.nome_completo.trim()) {
      alert('Dados do cliente sÃ£o obrigatÃ³rios!');
      return;
    }

    try {
      const numeroVenda = `MOG-${Date.now()}`;
      const valorTotal = calcularTotal();
      const troco = metodoPagamento === 'dinheiro' && valorPago > valorTotal ? valorPago - valorTotal : 0;
      
      const timestampBrasilia = createBrasiliaTimestamp();
      
      const { data: venda, error: vendaError } = await queryWithStoreMogi('vendas')
        .insert([{
          numero_venda: numeroVenda,
          vendedor_id: vendedorSelecionado.id,
          vendedor_nome: vendedorSelecionado.nome,
          valor_total: calcularSubtotal(),
          desconto: desconto,
          valor_final: valorTotal,
          forma_pagamento: metodoPagamento,
          valor_recebido: metodoPagamento === 'dinheiro' ? valorPago : valorTotal,
          cliente_nome: cliente.nome_completo,
          cliente_telefone: cliente.telefone,
          cliente_cpf: cliente.cpf,
          cliente_cidade: cliente.cidade,
          onde_conheceu: cliente.onde_conheceu,
          observacoes: observacoes,
          status: 'finalizada',
          data_venda: timestampBrasilia,
          created_at: timestampBrasilia
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

      const { error: itensError } = await queryWithStoreMogi('itens_venda')
        .insert(itens);

      if (itensError) throw itensError;

      for (const item of carrinho) {
        const novoEstoque = item.estoque_atual - item.quantidade;
        
        await queryWithStoreMogi('produtos')
          .update({ estoque_atual: novoEstoque })
          .eq('id', item.id);

        await queryWithStoreMogi('movimentacoes_estoque')
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

      await queryWithStoreMogi('caixa')
        .insert([{
          tipo: 'entrada',
          valor: valorTotal,
          valor_pago: metodoPagamento === 'dinheiro' ? valorPago : valorTotal,
          troco: troco,
          forma_pagamento: metodoPagamento,
          descricao: `Venda ${numeroVenda}${troco > 0 ? ` (Troco: R$ ${troco.toFixed(2)})` : ''}`,
          venda_id: venda.id,
          usuario_id: user.id,
          data_movimentacao: timestampBrasilia,
          created_at: timestampBrasilia
        }]);

      let mensagem = `âœ… Venda finalizada com sucesso!\n\nðŸ§¾ NÃºmero: ${numeroVenda}\nðŸ’° Total: R$ ${valorTotal.toFixed(2)}`;
      
      if (troco > 0) {
        mensagem += `\nðŸ’µ Pago: R$ ${valorPago.toFixed(2)}\nðŸ”„ Troco: R$ ${troco.toFixed(2)}`;
      }

      alert(mensagem);
      
      setEtapa('vendedor');
      setVendedorSelecionado(null);
      setCarrinho([]);
      setCliente({
        nome_completo: '',
        telefone: '',
        cpf: '',
        cidade: '',
        onde_conheceu: '',
        observacoes: ''
      });
      setMetodoPagamento('');
      setValorPago(0);
      setDesconto(0);
      setObservacoes('');
      
      carregarDados();

    } catch (error) {
      console.error('Erro ao finalizar venda:', error);
      alert('âŒ Erro ao finalizar venda: ' + error.message);
    }
  };

  const renderEtapaVendedor = () => (
    <CenterPanel>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h2 style={{ color: darkMode ? '#fff' : '#000', marginBottom: '0.5rem' }}>
          Selecionar Vendedor - Mogi
        </h2>
        <p style={{ color: '#888' }}>
          Escolha o vendedor responsÃ¡vel por esta venda
        </p>
      </div>
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
        gap: '1rem',
        maxWidth: '800px',
        margin: '0 auto'
      }}>
        {vendedores.map(vendedor => (
          <div
            key={vendedor.id}
            onClick={() => selecionarVendedor(vendedor)}
            style={{
              background: darkMode ? '#2a2a2a' : '#ffffff',
              border: `2px solid ${darkMode ? '#333' : '#e5e7eb'}`,
              borderRadius: '1rem',
              padding: '1.5rem',
              cursor: 'pointer',
              textAlign: 'center',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.borderColor = '#3b82f6';
              e.target.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.target.style.borderColor = darkMode ? '#333' : '#e5e7eb';
              e.target.style.transform = 'translateY(0)';
            }}
          >
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>ðŸ‘¤</div>
            <h3 style={{ color: darkMode ? '#fff' : '#000', marginBottom: '0.5rem' }}>
              {vendedor.nome}
            </h3>
            <p style={{ color: '#888', fontSize: '0.9rem' }}>
              {vendedor.email}
            </p>
            {vendedor.meta_mensal > 0 && (
              <p style={{ color: '#10b981', fontSize: '0.8rem', marginTop: '0.5rem' }}>
                Meta: R$ {vendedor.meta_mensal.toFixed(2)}
              </p>
            )}
          </div>
        ))}
      </div>
    </CenterPanel>
  );

  const renderEtapaProdutos = () => (
    <>
      <CenterPanel>
        <div style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ color: darkMode ? '#fff' : '#000', marginBottom: '0.5rem' }}>
            Selecionar Produtos - Mogi
          </h2>
          <p style={{ color: '#888' }}>
            Vendedor: <strong>{vendedorSelecionado?.nome}</strong>
          </p>
        </div>
        
        <SeletorProdutosMogi 
          produtos={produtos}
          onSelectProduct={adicionarProduto}
          darkMode={darkMode}
        />
      </CenterPanel>
      
      <RightPanel darkMode={darkMode}>
        <div style={{ padding: '1.5rem', borderBottom: `1px solid ${darkMode ? '#333' : '#e5e7eb'}` }}>
          <h3 style={{ color: darkMode ? '#fff' : '#000', marginBottom: '1rem' }}>
            Carrinho ({carrinho.length})
          </h3>
          
          <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
            {carrinho.length === 0 ? (
              <p style={{ color: '#888', textAlign: 'center', padding: '2rem' }}>
                Carrinho vazio
              </p>
            ) : (
              carrinho.map(item => (
                <CartItem key={item.id} darkMode={darkMode}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>
                      {item.nome}
                    </div>
                    <div style={{ color: '#888', fontSize: '0.8rem' }}>
                      R$ {item.preco_venda.toFixed(2)} cada
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <button
                      onClick={() => alterarQuantidade(item.id, item.quantidade - 1)}
                      style={{
                        width: '30px',
                        height: '30px',
                        background: darkMode ? '#333' : '#f3f4f6',
                        border: 'none',
                        borderRadius: '0.25rem',
                        cursor: 'pointer',
                        color: darkMode ? '#fff' : '#000'
                      }}
                    >
                      -
                    </button>
                    <span style={{ minWidth: '30px', textAlign: 'center' }}>
                      {item.quantidade}
                    </span>
                    <button
                      onClick={() => alterarQuantidade(item.id, item.quantidade + 1)}
                      style={{
                        width: '30px',
                        height: '30px',
                        background: darkMode ? '#333' : '#f3f4f6',
                        border: 'none',
                        borderRadius: '0.25rem',
                        cursor: 'pointer',
                        color: darkMode ? '#fff' : '#000'
                      }}
                    >
                      +
                    </button>
                  </div>
                </CartItem>
              ))
            )}
          </div>
        </div>
        
        <div style={{ padding: '1.5rem' }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            marginBottom: '1rem',
            fontSize: '1.2rem',
            fontWeight: '700'
          }}>
            <span>Total:</span>
            <span style={{ color: '#10b981' }}>
              R$ {calcularSubtotal().toFixed(2)}
            </span>
          </div>
          
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Button
              darkMode={darkMode}
              onClick={() => setEtapa('vendedor')}
              style={{ flex: 1 }}
            >
              â† Voltar
            </Button>
            <Button
              variant="primary"
              onClick={() => setEtapa('cliente')}
              disabled={carrinho.length === 0}
              style={{ flex: 2 }}
            >
              Continuar â†’
            </Button>
          </div>
        </div>
      </RightPanel>
    </>
  );

  const renderEtapaCliente = () => (
    <CenterPanel>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ color: darkMode ? '#fff' : '#000', marginBottom: '0.5rem' }}>
            Dados do Cliente - Mogi
          </h2>
          <p style={{ color: '#888' }}>
            Preencha as informaÃ§Ãµes do cliente
          </p>
        </div>
        
        <div style={{ display: 'grid', gap: '1rem', marginBottom: '2rem' }}>
          <div>
            <label style={{ 
              display: 'block', 
              marginBottom: '0.5rem',
              color: darkMode ? '#fff' : '#000',
              fontWeight: '600'
            }}>
              Nome Completo *
            </label>
            <input
              type="text"
              value={cliente.nome_completo}
              onChange={(e) => setCliente({...cliente, nome_completo: e.target.value})}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: `1px solid ${darkMode ? '#333' : '#e5e7eb'}`,
                borderRadius: '0.5rem',
                background: darkMode ? '#2a2a2a' : '#ffffff',
                color: darkMode ? '#fff' : '#000',
                fontSize: '1rem'
              }}
              placeholder="Digite o nome completo do cliente"
            />
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: '0.5rem',
                color: darkMode ? '#fff' : '#000',
                fontWeight: '600'
              }}>
                Telefone
              </label>
              <input
                type="tel"
                value={cliente.telefone}
                onChange={(e) => setCliente({...cliente, telefone: e.target.value})}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: `1px solid ${darkMode ? '#333' : '#e5e7eb'}`,
                  borderRadius: '0.5rem',
                  background: darkMode ? '#2a2a2a' : '#ffffff',
                  color: darkMode ? '#fff' : '#000',
                  fontSize: '1rem'
                }}
                placeholder="(11) 99999-9999"
              />
            </div>
            
            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: '0.5rem',
                color: darkMode ? '#fff' : '#000',
                fontWeight: '600'
              }}>
                CPF
              </label>
              <input
                type="text"
                value={cliente.cpf}
                onChange={(e) => setCliente({...cliente, cpf: e.target.value})}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: `1px solid ${darkMode ? '#333' : '#e5e7eb'}`,
                  borderRadius: '0.5rem',
                  background: darkMode ? '#2a2a2a' : '#ffffff',
                  color: darkMode ? '#fff' : '#000',
                  fontSize: '1rem'
                }}
                placeholder="000.000.000-00"
              />
            </div>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <Button
            darkMode={darkMode}
            onClick={() => setEtapa('produtos')}
            size="large"
          >
            â† Voltar
          </Button>
          <Button
            variant="primary"
            onClick={() => setEtapa('pagamento')}
            disabled={!cliente.nome_completo.trim()}
            size="large"
          >
            Continuar â†’
          </Button>
        </div>
      </div>
    </CenterPanel>
  );

  const renderEtapaPagamento = () => (
    <CenterPanel>
      <div style={{ maxWidth: '700px', margin: '0 auto' }}>
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ color: darkMode ? '#fff' : '#000', marginBottom: '0.5rem' }}>
            Finalizar Pagamento - Mogi
          </h2>
          <p style={{ color: '#888' }}>
            Cliente: <strong>{cliente.nome_completo}</strong> â€¢ 
            Vendedor: <strong>{vendedorSelecionado?.nome}</strong>
          </p>
        </div>
        
        <div style={{
          background: darkMode ? '#2a2a2a' : '#f9fafb',
          border: `1px solid ${darkMode ? '#333' : '#e5e7eb'}`,
          borderRadius: '0.75rem',
          padding: '1.5rem',
          marginBottom: '2rem'
        }}>
          <h3 style={{ color: darkMode ? '#fff' : '#000', marginBottom: '1rem' }}>
            Resumo da Venda
          </h3>
          
          <div style={{ marginBottom: '1rem' }}>
            {carrinho.map(item => (
              <div key={item.id} style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '0.5rem',
                color: darkMode ? '#fff' : '#000'
              }}>
                <span>{item.quantidade}x {item.nome}</span>
                <span>R$ {(item.preco_venda * item.quantidade).toFixed(2)}</span>
              </div>
            ))}
          </div>
          
          <div style={{
            borderTop: `1px solid ${darkMode ? '#333' : '#e5e7eb'}`,
            paddingTop: '1rem'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '0.5rem',
              color: darkMode ? '#fff' : '#000'
            }}>
              <span>Subtotal:</span>
              <span>R$ {calcularSubtotal().toFixed(2)}</span>
            </div>
            
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '0.5rem'
            }}>
              <span style={{ color: darkMode ? '#fff' : '#000' }}>Desconto:</span>
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
            
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '1.2rem',
              fontWeight: '700',
              color: '#10b981'
            }}>
              <span>Total:</span>
              <span>R$ {calcularTotal().toFixed(2)}</span>
            </div>
          </div>
        </div>
        
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ color: darkMode ? '#fff' : '#000', marginBottom: '1rem' }}>
            MÃ©todo de Pagamento
          </h3>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '1rem',
            marginBottom: '1rem'
          }}>
            {[
              { id: 'dinheiro', label: 'Dinheiro', icon: 'ðŸ’µ', color: '#10b981' },
              { id: 'cartao_credito', label: 'CrÃ©dito', icon: 'ðŸ’³', color: '#3b82f6' },
              { id: 'cartao_debito', label: 'DÃ©bito', icon: 'ðŸ’³', color: '#8b5cf6' },
              { id: 'pix', label: 'PIX', icon: 'ðŸ“±', color: '#f59e0b' }
            ].map(metodo => (
              <button
                key={metodo.id}
                onClick={() => {
                  setMetodoPagamento(metodo.id);
                  if (metodo.id !== 'dinheiro') {
                    setValorPago(calcularTotal());
                  } else {
                    setValorPago(0);
                  }
                }}
                style={{
                  padding: '1rem',
                  background: metodoPagamento === metodo.id ? metodo.color : (darkMode ? '#333' : '#f3f4f6'),
                  color: metodoPagamento === metodo.id ? 'white' : (darkMode ? '#fff' : '#000'),
                  border: `2px solid ${metodoPagamento === metodo.id ? metodo.color : (darkMode ? '#555' : '#d1d5db')}`,
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  fontWeight: '600',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.5rem',
                  transition: 'all 0.2s ease'
                }}
              >
                <span style={{ fontSize: '1.5rem' }}>{metodo.icon}</span>
                <span>{metodo.label}</span>
              </button>
            ))}
          </div>
          
          {metodoPagamento === 'dinheiro' && (
            <div style={{
              background: darkMode ? '#2a2a2a' : '#f0f9ff',
              border: '1px solid #3b82f6',
              borderRadius: '0.5rem',
              padding: '1rem'
            }}>
              <label style={{
                display: 'block',
                marginBottom: '0.5rem',
                color: darkMode ? '#fff' : '#000',
                fontWeight: '600'
              }}>
                Valor Pago (R$) *:
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={valorPago || ''}
                onChange={(e) => setValorPago(parseFloat(e.target.value) || 0)}
                style={{
                  width: '200px',
                  padding: '0.75rem',
                  border: `2px solid ${valorPago < calcularTotal() ? '#ef4444' : (darkMode ? '#333' : '#e5e7eb')}`,
                  borderRadius: '0.5rem',
                  background: darkMode ? '#333' : '#fff',
                  color: darkMode ? '#fff' : '#000',
                  fontSize: '1rem',
                  fontWeight: '600'
                }}
                placeholder="0,00"
              />
              
              {valorPago > 0 && valorPago < calcularTotal() && (
                <div style={{
                  marginTop: '0.5rem',
                  padding: '0.5rem',
                  background: '#ef4444',
                  color: 'white',
                  borderRadius: '0.25rem',
                  fontWeight: '600'
                }}>
                  âš ï¸ Valor insuficiente! Faltam: R$ {(calcularTotal() - valorPago).toFixed(2)}
                </div>
              )}
              
              {valorPago > calcularTotal() && (
                <div style={{
                  marginTop: '0.5rem',
                  padding: '0.5rem',
                  background: '#10b981',
                  color: 'white',
                  borderRadius: '0.25rem',
                  fontWeight: '600'
                }}>
                  ðŸ’° Troco: R$ {(valorPago - calcularTotal()).toFixed(2)}
                </div>
              )}
            </div>
          )}
        </div>
        
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <Button
            darkMode={darkMode}
            onClick={() => setEtapa('cliente')}
            size="large"
          >
            â† Voltar
          </Button>
          <Button
            variant="success"
            onClick={finalizarVenda}
            disabled={!metodoPagamento || (metodoPagamento === 'dinheiro' && (!valorPago || valorPago < calcularTotal()))}
            size="large"
          >
            âœ… FINALIZAR VENDA
          </Button>
        </div>
      </div>
    </CenterPanel>
  );

  return (
    <Container darkMode={darkMode}>
      <StoreIndicatorMogi />
      <Header darkMode={darkMode}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '700' }}>
            ðŸ›ï¸ Sistema de Vendas - Mogi das Cruzes
          </h1>
          <p style={{ margin: '0.25rem 0 0 0', color: '#888', fontSize: '0.9rem' }}>
            Etapa {etapa === 'vendedor' ? '1' : etapa === 'produtos' ? '2' : etapa === 'cliente' ? '3' : '4'} de 4: {
              etapa === 'vendedor' ? 'Selecionar Vendedor' :
              etapa === 'produtos' ? 'Escolher Produtos' :
              etapa === 'cliente' ? 'Dados do Cliente' :
              'Finalizar Pagamento'
            }
          </p>
        </div>
        
        <Button
          variant="danger"
          onClick={onClose}
        >
          âœ• Fechar
        </Button>
      </Header>

      <MainContent>
        {etapa === 'vendedor' && renderEtapaVendedor()}
        {etapa === 'produtos' && renderEtapaProdutos()}
        {etapa === 'cliente' && renderEtapaCliente()}
        {etapa === 'pagamento' && renderEtapaPagamento()}
      </MainContent>
    </Container>
  );
}
