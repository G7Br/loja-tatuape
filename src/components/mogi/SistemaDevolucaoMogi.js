import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { supabase } from '../../utils/supabase';
import { queryWithStoreMogi } from '../../utils/supabaseMogi';
import { createBrasiliaTimestamp, formatCurrency } from '../../utils/dateUtils';

const Container = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const Modal = styled.div`
  background: ${props => props.$darkMode ? '#1a1a1a' : '#ffffff'};
  border-radius: 1rem;
  padding: 2rem;
  max-width: 900px;
  width: 95%;
  max-height: 90vh;
  overflow-y: auto;
  border: 1px solid ${props => props.$darkMode ? '#333' : '#e5e7eb'};
`;

const Button = styled.button`
  padding: 0.75rem 1.5rem;
  background: ${props => {
    if (props.$variant === 'primary') return '#3b82f6';
    if (props.$variant === 'success') return '#10b981';
    if (props.$variant === 'danger') return '#ef4444';
    if (props.$variant === 'warning') return '#f59e0b';
    return props.$darkMode ? '#333' : '#f3f4f6';
  }};
  color: ${props => props.$variant ? 'white' : (props.$darkMode ? '#fff' : '#000')};
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s ease;
  
  &:hover {
    opacity: 0.9;
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export default function SistemaDevolucaoMogi({ user, darkMode, onClose }) {
  const [etapa, setEtapa] = useState('buscar'); // buscar, selecionar, processar
  const [vendas, setVendas] = useState([]);
  const [vendaSelecionada, setVendaSelecionada] = useState(null);
  const [itensVenda, setItensVenda] = useState([]);
  const [itensSelecionados, setItensSelecionados] = useState([]);
  const [tipoDevolucao, setTipoDevolucao] = useState(''); // integral, parcial, troca
  const [motivo, setMotivo] = useState('');
  const [produtos, setProdutos] = useState([]);
  const [produtosTroca, setProdutosTroca] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    carregarVendas();
    carregarProdutos();
  }, []);

  const carregarVendas = async () => {
    try {
      const { data } = await queryWithStoreMogi('vendas')
        .select('*')
        .neq('status', 'cancelada')
        .order('data_venda', { ascending: false })
        .limit(50);
      
      setVendas(data || []);
    } catch (error) {
      console.error('Erro ao carregar vendas:', error);
    }
  };

  const carregarProdutos = async () => {
    try {
      const { data } = await queryWithStoreMogi('produtos')
        .select('*')
        .eq('ativo', true)
        .gt('estoque_atual', 0);
      
      setProdutos(data || []);
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
    }
  };

  const selecionarVenda = async (venda) => {
    try {
      const { data: itens } = await queryWithStoreMogi('itens_venda')
        .select('*')
        .eq('venda_id', venda.id);
      
      setVendaSelecionada(venda);
      setItensVenda(itens || []);
      setEtapa('selecionar');
    } catch (error) {
      console.error('Erro ao carregar itens:', error);
    }
  };

  const toggleItemSelecionado = (item) => {
    const existe = itensSelecionados.find(i => i.id === item.id);
    if (existe) {
      setItensSelecionados(itensSelecionados.filter(i => i.id !== item.id));
    } else {
      setItensSelecionados([...itensSelecionados, { ...item, quantidade_devolver: 1 }]);
    }
  };

  const alterarQuantidadeDevolucao = (itemId, quantidade) => {
    setItensSelecionados(itensSelecionados.map(item =>
      item.id === itemId ? { ...item, quantidade_devolver: Math.max(1, Math.min(quantidade, item.quantidade)) } : item
    ));
  };

  const adicionarProdutoTroca = (produto) => {
    const existe = produtosTroca.find(p => p.id === produto.id);
    if (existe) {
      setProdutosTroca(produtosTroca.map(p =>
        p.id === produto.id ? { ...p, quantidade: p.quantidade + 1 } : p
      ));
    } else {
      setProdutosTroca([...produtosTroca, { ...produto, quantidade: 1 }]);
    }
  };

  const calcularValorDevolucao = () => {
    return itensSelecionados.reduce((sum, item) => 
      sum + (item.preco_unitario * item.quantidade_devolver), 0
    );
  };

  const calcularValorTroca = () => {
    return produtosTroca.reduce((sum, item) => 
      sum + (item.preco_venda * item.quantidade), 0
    );
  };

  const processarDevolucao = async () => {
    if (!tipoDevolucao || itensSelecionados.length === 0) {
      alert('Selecione o tipo de devolução e pelo menos um item!');
      return;
    }

    try {
      const numeroDevolucao = `DEV-MOG-${Date.now()}`;
      const valorDevolvido = calcularValorDevolucao();
      const timestamp = createBrasiliaTimestamp();

      // Criar devolução
      const { data: devolucao, error: devolucaoError } = await queryWithStoreMogi('devolucoes')
        .insert([{
          venda_original_id: vendaSelecionada.id,
          numero_devolucao: numeroDevolucao,
          tipo: tipoDevolucao,
          valor_devolvido: valorDevolvido,
          motivo: motivo,
          usuario_id: user.id,
          data_devolucao: timestamp
        }])
        .select()
        .single();

      if (devolucaoError) throw devolucaoError;

      // Criar itens de devolução
      const itensParaInserir = itensSelecionados.map(item => ({
        devolucao_id: devolucao.id,
        produto_id: item.produto_id,
        produto_codigo: item.produto_codigo,
        produto_nome: item.produto_nome,
        quantidade_devolvida: item.quantidade_devolver,
        preco_unitario: item.preco_unitario,
        subtotal_devolvido: item.preco_unitario * item.quantidade_devolver
      }));

      await queryWithStoreMogi('itens_devolucao').insert(itensParaInserir);

      // Repor estoque
      for (const item of itensSelecionados) {
        const { data: produto } = await queryWithStoreMogi('produtos')
          .select('estoque_atual')
          .eq('id', item.produto_id)
          .single();

        if (produto) {
          const novoEstoque = produto.estoque_atual + item.quantidade_devolver;
          await queryWithStoreMogi('produtos')
            .update({ estoque_atual: novoEstoque })
            .eq('id', item.produto_id);

          // Registrar movimentação
          await queryWithStoreMogi('movimentacoes_estoque')
            .insert([{
              produto_id: item.produto_id,
              tipo_movimentacao: 'devolucao',
              quantidade_movimentada: item.quantidade_devolver,
              motivo: `Devolução ${numeroDevolucao}`,
              usuario_id: user.id,
              devolucao_id: devolucao.id
            }]);
        }
      }

      // Processar troca se necessário
      if (tipoDevolucao === 'troca' && produtosTroca.length > 0) {
        await processarTroca(devolucao, valorDevolvido);
      }

      alert(`✅ ${tipoDevolucao === 'troca' ? 'Troca' : 'Devolução'} processada com sucesso!\nNúmero: ${numeroDevolucao}`);
      onClose();

    } catch (error) {
      console.error('Erro ao processar devolução:', error);
      alert('❌ Erro ao processar: ' + error.message);
    }
  };

  const processarTroca = async (devolucao, valorOriginal) => {
    const valorNovo = calcularValorTroca();
    const diferenca = valorNovo - valorOriginal;
    const timestamp = createBrasiliaTimestamp();

    if (diferenca > 0) {
      // Cliente deve pagar diferença - criar nova venda
      const numeroVenda = `TRC-MOG-${Date.now()}`;
      
      const { data: novaVenda } = await queryWithStoreMogi('vendas')
        .insert([{
          numero_venda: numeroVenda,
          vendedor_id: vendaSelecionada.vendedor_id,
          vendedor_nome: vendaSelecionada.vendedor_nome,
          valor_total: diferenca,
          valor_final: diferenca,
          forma_pagamento: 'pendente_caixa',
          cliente_nome: vendaSelecionada.cliente_nome,
          cliente_telefone: vendaSelecionada.cliente_telefone,
          status: 'pendente',
          data_venda: timestamp,
          observacoes: `Troca - Diferença a pagar da devolução ${devolucao.numero_devolucao}`
        }])
        .select()
        .single();

      // Inserir itens da nova venda
      const itensNovaVenda = produtosTroca.map(item => ({
        venda_id: novaVenda.id,
        produto_id: item.id,
        produto_codigo: item.codigo,
        produto_nome: item.nome,
        quantidade: item.quantidade,
        preco_unitario: item.preco_venda,
        subtotal: item.preco_venda * item.quantidade
      }));

      await queryWithStoreMogi('itens_venda').insert(itensNovaVenda);

      // Registrar troca
      await queryWithStoreMogi('trocas')
        .insert([{
          devolucao_id: devolucao.id,
          venda_nova_id: novaVenda.id,
          valor_original: valorOriginal,
          valor_novo: valorNovo,
          diferenca_valor: diferenca,
          tipo_diferenca: 'debito'
        }]);

    } else {
      // Registrar troca sem nova venda
      await queryWithStoreMogi('trocas')
        .insert([{
          devolucao_id: devolucao.id,
          valor_original: valorOriginal,
          valor_novo: valorNovo,
          diferenca_valor: Math.abs(diferenca),
          tipo_diferenca: diferenca === 0 ? 'igual' : 'credito'
        }]);
    }

    // Baixar estoque dos produtos de troca
    for (const item of produtosTroca) {
      const { data: produto } = await queryWithStoreMogi('produtos')
        .select('estoque_atual')
        .eq('id', item.id)
        .single();

      if (produto) {
        const novoEstoque = produto.estoque_atual - item.quantidade;
        await queryWithStoreMogi('produtos')
          .update({ estoque_atual: novoEstoque })
          .eq('id', item.id);
      }
    }
  };

  const renderBuscarVenda = () => (
    <div>
      <h2 style={{ color: darkMode ? '#fff' : '#000', marginBottom: '1rem' }}>
        🔍 Buscar Venda para Devolução
      </h2>
      
      <input
        type="text"
        placeholder="Buscar por cliente, número da venda..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        style={{
          width: '100%',
          padding: '0.75rem',
          marginBottom: '1rem',
          border: `1px solid ${darkMode ? '#333' : '#e5e7eb'}`,
          borderRadius: '0.5rem',
          background: darkMode ? '#2a2a2a' : '#ffffff',
          color: darkMode ? '#fff' : '#000'
        }}
      />

      <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
        {vendas.filter(v => 
          v.cliente_nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          v.numero_venda?.toLowerCase().includes(searchTerm.toLowerCase())
        ).map(venda => (
          <div
            key={venda.id}
            onClick={() => selecionarVenda(venda)}
            style={{
              padding: '1rem',
              background: darkMode ? '#2a2a2a' : '#f9fafb',
              border: `1px solid ${darkMode ? '#333' : '#e5e7eb'}`,
              borderRadius: '0.5rem',
              marginBottom: '0.5rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => e.target.style.background = darkMode ? '#333' : '#e5e7eb'}
            onMouseLeave={(e) => e.target.style.background = darkMode ? '#2a2a2a' : '#f9fafb'}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: '600', color: darkMode ? '#fff' : '#000' }}>
                  {venda.numero_venda}
                </div>
                <div style={{ color: '#888', fontSize: '0.9rem' }}>
                  {venda.cliente_nome} • {formatCurrency(venda.valor_final)}
                </div>
              </div>
              <div style={{ color: '#888', fontSize: '0.8rem' }}>
                {new Date(venda.data_venda).toLocaleDateString('pt-BR')}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderSelecionarItens = () => (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2 style={{ color: darkMode ? '#fff' : '#000', margin: 0 }}>
          📦 Selecionar Itens - {vendaSelecionada?.numero_venda}
        </h2>
        <Button onClick={() => setEtapa('buscar')} $darkMode={darkMode}>
          ← Voltar
        </Button>
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ color: darkMode ? '#fff' : '#000', marginBottom: '1rem' }}>Tipo de Devolução:</h3>
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
          {[
            { id: 'integral', label: 'Devolução Integral', icon: '💰' },
            { id: 'parcial', label: 'Devolução Parcial', icon: '📦' },
            { id: 'troca', label: 'Troca de Produtos', icon: '🔄' }
          ].map(tipo => (
            <Button
              key={tipo.id}
              onClick={() => {
                setTipoDevolucao(tipo.id);
                if (tipo.id === 'integral') {
                  setItensSelecionados(itensVenda.map(item => ({ ...item, quantidade_devolver: item.quantidade })));
                }
              }}
              $variant={tipoDevolucao === tipo.id ? 'primary' : ''}
              $darkMode={darkMode}
            >
              {tipo.icon} {tipo.label}
            </Button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ color: darkMode ? '#fff' : '#000', marginBottom: '1rem' }}>Itens da Venda:</h3>
        {itensVenda.map(item => {
          const selecionado = itensSelecionados.find(i => i.id === item.id);
          return (
            <div
              key={item.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '1rem',
                background: selecionado ? (darkMode ? '#1a3a1a' : '#f0f9ff') : (darkMode ? '#2a2a2a' : '#f9fafb'),
                border: `2px solid ${selecionado ? '#10b981' : (darkMode ? '#333' : '#e5e7eb')}`,
                borderRadius: '0.5rem',
                marginBottom: '0.5rem'
              }}
            >
              <input
                type="checkbox"
                checked={!!selecionado}
                onChange={() => toggleItemSelecionado(item)}
                disabled={tipoDevolucao === 'integral'}
                style={{ marginRight: '1rem' }}
              />
              
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: '600', color: darkMode ? '#fff' : '#000' }}>
                  {item.produto_nome}
                </div>
                <div style={{ color: '#888', fontSize: '0.9rem' }}>
                  Qtd: {item.quantidade} • Preço: {formatCurrency(item.preco_unitario)}
                </div>
              </div>

              {selecionado && tipoDevolucao !== 'integral' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ color: darkMode ? '#fff' : '#000' }}>Devolver:</span>
                  <input
                    type="number"
                    min="1"
                    max={item.quantidade}
                    value={selecionado.quantidade_devolver}
                    onChange={(e) => alterarQuantidadeDevolucao(item.id, parseInt(e.target.value))}
                    style={{
                      width: '60px',
                      padding: '0.25rem',
                      border: `1px solid ${darkMode ? '#333' : '#e5e7eb'}`,
                      borderRadius: '0.25rem',
                      background: darkMode ? '#333' : '#fff',
                      color: darkMode ? '#fff' : '#000'
                    }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {tipoDevolucao === 'troca' && (
        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ color: darkMode ? '#fff' : '#000', marginBottom: '1rem' }}>Produtos para Troca:</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
            {produtos.map(produto => (
              <div
                key={produto.id}
                onClick={() => adicionarProdutoTroca(produto)}
                style={{
                  padding: '1rem',
                  background: darkMode ? '#2a2a2a' : '#f9fafb',
                  border: `1px solid ${darkMode ? '#333' : '#e5e7eb'}`,
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  textAlign: 'center'
                }}
              >
                <div style={{ fontWeight: '600', color: darkMode ? '#fff' : '#000', marginBottom: '0.5rem' }}>
                  {produto.nome}
                </div>
                <div style={{ color: '#10b981', fontWeight: '600' }}>
                  {formatCurrency(produto.preco_venda)}
                </div>
              </div>
            ))}
          </div>

          {produtosTroca.length > 0 && (
            <div>
              <h4 style={{ color: darkMode ? '#fff' : '#000' }}>Produtos Selecionados:</h4>
              {produtosTroca.map(item => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0' }}>
                  <span style={{ color: darkMode ? '#fff' : '#000' }}>{item.quantidade}x {item.nome}</span>
                  <span style={{ color: '#10b981', fontWeight: '600' }}>
                    {formatCurrency(item.preco_venda * item.quantidade)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div style={{ marginBottom: '1.5rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem', color: darkMode ? '#fff' : '#000', fontWeight: '600' }}>
          Motivo da Devolução:
        </label>
        <textarea
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          rows={3}
          style={{
            width: '100%',
            padding: '0.75rem',
            border: `1px solid ${darkMode ? '#333' : '#e5e7eb'}`,
            borderRadius: '0.5rem',
            background: darkMode ? '#2a2a2a' : '#ffffff',
            color: darkMode ? '#fff' : '#000',
            resize: 'vertical'
          }}
          placeholder="Descreva o motivo da devolução..."
        />
      </div>

      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        padding: '1rem',
        background: darkMode ? '#2a2a2a' : '#f0f9ff',
        borderRadius: '0.5rem',
        marginBottom: '1.5rem'
      }}>
        <div>
          <div style={{ color: darkMode ? '#fff' : '#000', fontWeight: '600' }}>
            Valor a Devolver: {formatCurrency(calcularValorDevolucao())}
          </div>
          {tipoDevolucao === 'troca' && produtosTroca.length > 0 && (
            <>
              <div style={{ color: darkMode ? '#fff' : '#000' }}>
                Valor da Troca: {formatCurrency(calcularValorTroca())}
              </div>
              <div style={{ color: calcularValorTroca() - calcularValorDevolucao() > 0 ? '#ef4444' : '#10b981', fontWeight: '600' }}>
                Diferença: {formatCurrency(Math.abs(calcularValorTroca() - calcularValorDevolucao()))}
                {calcularValorTroca() - calcularValorDevolucao() > 0 ? ' (Cliente deve pagar)' : ' (Crédito para cliente)'}
              </div>
            </>
          )}
        </div>
        
        <Button
          onClick={processarDevolucao}
          $variant="success"
          disabled={itensSelecionados.length === 0}
        >
          ✅ Processar {tipoDevolucao === 'troca' ? 'Troca' : 'Devolução'}
        </Button>
      </div>
    </div>
  );

  return (
    <Container>
      <Modal $darkMode={darkMode}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h1 style={{ color: darkMode ? '#fff' : '#000', margin: 0 }}>
            🔄 Sistema de Devolução e Troca - Mogi
          </h1>
          <Button onClick={onClose} $variant="danger">
            ✕ Fechar
          </Button>
        </div>

        {etapa === 'buscar' && renderBuscarVenda()}
        {etapa === 'selecionar' && renderSelecionarItens()}
      </Modal>
    </Container>
  );
}