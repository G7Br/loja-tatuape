import React, { useState, useEffect } from 'react';
import { caixaOnlineService } from '../../utils/caixaOnlineService';

const CaixaOnline = ({ user, onLogout }) => {
  const [pedidos, setPedidos] = useState([]);
  const [pedidoSelecionado, setPedidoSelecionado] = useState(null);
  const [loading, setLoading] = useState(false);
  const [modalPagamento, setModalPagamento] = useState(false);
  const [dadosPagamento, setDadosPagamento] = useState({
    forma_pagamento: '',
    valor_pago: '',
    observacoes: ''
  });

  useEffect(() => {
    carregarPedidos();
  }, []);

  const carregarPedidos = async () => {
    try {
      setLoading(true);
      const pedidosData = await caixaOnlineService.buscarPedidosParaCaixa();
      setPedidos(pedidosData);
    } catch (error) {
      console.error('Erro ao carregar pedidos:', error);
    } finally {
      setLoading(false);
    }
  };

  const abrirModalPagamento = (pedido) => {
    setPedidoSelecionado(pedido);
    setDadosPagamento({
      forma_pagamento: '',
      valor_pago: pedido.valor_total,
      observacoes: ''
    });
    setModalPagamento(true);
  };

  const registrarPagamento = async () => {
    try {
      setLoading(true);
      await caixaOnlineService.registrarPagamento(pedidoSelecionado.id, dadosPagamento);
      alert('Pagamento registrado com sucesso!');
      setModalPagamento(false);
      setPedidoSelecionado(null);
      await carregarPedidos();
    } catch (error) {
      alert('Erro ao registrar pagamento: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const finalizarVenda = async (pedidoId) => {
    if (!confirm('Confirma a finalização desta venda?')) return;
    try {
      setLoading(true);
      await caixaOnlineService.finalizarVenda(pedidoId);
      alert('Venda finalizada com sucesso!');
      await carregarPedidos();
    } catch (error) {
      alert('Erro ao finalizar venda: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const formatarValor = (valor) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor || 0);
  };

  return (
    <div style={{
      width: '100%',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      color: '#ffffff',
      background: '#000000'
    }}>
      {/* Header */}
      <div style={{
        background: '#000000',
        borderBottom: '1px solid #333333',
        padding: '15px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <img 
            src="/images/logo.png" 
            alt="VH Logo" 
            style={{ height: '60px', filter: 'brightness(0) invert(1)' }}
          />
          <div>
            <div style={{ color: '#ffffff', fontSize: '1.5rem', fontWeight: '700' }}>
              CAIXA ONLINE
            </div>
            <div style={{ color: '#cccccc', fontSize: '0.9rem' }}>
              Usuário: {user?.nome} | Fluxo: Vendedor → Separador → Caixa
            </div>
          </div>
        </div>
        <button
          onClick={onLogout}
          style={{
            background: '#333333',
            color: '#ffffff',
            border: '1px solid #666666',
            padding: '12px 24px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: '600'
          }}
        >
          Sair
        </button>
      </div>

      {/* Content */}
      <div style={{ flex: 1, padding: '20px' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <h2 style={{ margin: 0 }}>Pedidos Online para Caixa</h2>
          <button
            onClick={carregarPedidos}
            disabled={loading}
            style={{
              padding: '12px 24px',
              background: '#ffffff',
              color: '#000000',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '700',
              cursor: 'pointer'
            }}
          >
Atualizar
          </button>
        </div>

        {/* Lista de Pedidos */}
        {loading ? (
          <div style={{
            background: '#111111',
            border: '1px solid #333333',
            borderRadius: '8px',
            padding: '40px',
            textAlign: 'center'
          }}>
            Carregando pedidos...
          </div>
        ) : pedidos.length === 0 ? (
          <div style={{
            background: '#111111',
            border: '1px solid #333333',
            borderRadius: '8px',
            padding: '40px',
            textAlign: 'center'
          }}>
            <h3>Nenhum pedido disponível</h3>
            <p style={{ color: '#999' }}>Aguardando pedidos separados e enviados</p>
          </div>
        ) : (
          pedidos.map((pedido) => (
            <div key={pedido.id} style={{
              background: '#111111',
              border: '1px solid #333333',
              borderRadius: '8px',
              padding: '20px',
              marginBottom: '20px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ margin: '0 0 10px 0' }}>
                    Pedido {pedido.numero_pedido}
                  </h3>
                  <p style={{ margin: '5px 0' }}>
                    <strong>Cliente:</strong> {pedido.cliente_nome}
                  </p>
                  <p style={{ margin: '5px 0' }}>
                    <strong>Vendedor:</strong> {pedido.vendedor_nome}
                  </p>
                  <p style={{ margin: '5px 0' }}>
                    <strong>Data:</strong> {new Date(pedido.created_at).toLocaleDateString('pt-BR')}
                  </p>
                  <div style={{
                    background: caixaOnlineService.getCorStatus(pedido.status),
                    color: 'white',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '0.8rem',
                    display: 'inline-block',
                    marginTop: '10px'
                  }}>
                    {caixaOnlineService.formatarStatus(pedido.status)}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{
                    fontSize: '1.5rem',
                    fontWeight: 'bold',
                    color: '#10b981',
                    marginBottom: '15px'
                  }}>
                    {formatarValor(pedido.valor_total)}
                  </div>
                  
                  {pedido.status === 'ENVIADO' && (
                    <button
                      onClick={() => abrirModalPagamento(pedido)}
                      style={{
                        padding: '12px 24px',
                        background: '#10b981',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '8px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        marginBottom: '10px',
                        display: 'block',
                        width: '100%'
                      }}
                    >
Registrar Pagamento
                    </button>
                  )}
                  
                  {pedido.status === 'PAGO' && (
                    <button
                      onClick={() => finalizarVenda(pedido.id)}
                      style={{
                        padding: '12px 24px',
                        background: '#3b82f6',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '8px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        display: 'block',
                        width: '100%'
                      }}
                    >
Finalizar Venda
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal de Pagamento */}
      {modalPagamento && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: '#111111',
            border: '1px solid #333333',
            borderRadius: '8px',
            padding: '30px',
            width: '90%',
            maxWidth: '500px'
          }}>
            <h3 style={{ marginBottom: '20px' }}>Registrar Pagamento</h3>
            
            <div style={{ marginBottom: '20px' }}>
              <p><strong>Pedido:</strong> {pedidoSelecionado?.numero_pedido}</p>
              <p><strong>Cliente:</strong> {pedidoSelecionado?.cliente_nome}</p>
              <p><strong>Valor:</strong> {formatarValor(pedidoSelecionado?.valor_total)}</p>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Forma de Pagamento *
              </label>
              <select
                value={dadosPagamento.forma_pagamento}
                onChange={(e) => setDadosPagamento({...dadosPagamento, forma_pagamento: e.target.value})}
                style={{
                  width: '100%',
                  padding: '10px',
                  backgroundColor: '#222',
                  border: '1px solid #444',
                  borderRadius: '4px',
                  color: 'white'
                }}
              >
                <option value="">Selecione...</option>
                <option value="PIX">PIX</option>
                <option value="CARTAO_CREDITO">Cartão de Crédito</option>
                <option value="CARTAO_DEBITO">Cartão de Débito</option>
                <option value="DINHEIRO">Dinheiro</option>
                <option value="TRANSFERENCIA">Transferência</option>
              </select>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Valor Pago *
              </label>
              <input
                type="number"
                step="0.01"
                value={dadosPagamento.valor_pago}
                onChange={(e) => setDadosPagamento({...dadosPagamento, valor_pago: e.target.value})}
                style={{
                  width: '100%',
                  padding: '10px',
                  backgroundColor: '#222',
                  border: '1px solid #444',
                  borderRadius: '4px',
                  color: 'white'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button
                onClick={() => setModalPagamento(false)}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Cancelar
              </button>
              <button
                onClick={registrarPagamento}
                disabled={!dadosPagamento.forma_pagamento || !dadosPagamento.valor_pago || loading}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  opacity: (!dadosPagamento.forma_pagamento || !dadosPagamento.valor_pago || loading) ? 0.5 : 1
                }}
              >
                {loading ? 'Registrando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CaixaOnline;