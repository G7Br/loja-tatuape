import { supabase } from './supabase';

export const onlineService = {
  
  // ===== PRODUTOS =====
  async getProdutosOnline(filtros = {}) {
    try {
      let query = supabase
        .from('produtos_online')
        .select('*')
        .eq('disponivel', true);
      
      if (filtros.loja) {
        query = query.eq('loja_origem', filtros.loja);
      }
      
      if (filtros.disponivel) {
        query = query.gt('estoque_disponivel', 0);
      }
      
      const { data, error } = await query.order('produto_nome');
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
      throw error;
    }
  },

  // ===== PEDIDOS =====
  async criarPedido(dadosPedido) {
    try {
      // Criar pedido
      const { data: pedido, error: pedidoError } = await supabase
        .from('pedidos_online')
        .insert([{
          vendedor_id: dadosPedido.vendedor_id,
          vendedor_nome: dadosPedido.vendedor_nome,
          cliente_nome: dadosPedido.cliente_nome,
          cliente_cpf: dadosPedido.cliente_cpf,
          cliente_telefone: dadosPedido.cliente_telefone,
          cliente_endereco: dadosPedido.cliente_endereco,
          tipo_envio: dadosPedido.tipo_envio,
          valor_total: dadosPedido.valor_total,
          status: 'separando'
        }])
        .select()
        .single();

      if (pedidoError) throw pedidoError;

      // Inserir itens
      if (dadosPedido.itens && dadosPedido.itens.length > 0) {
        const itens = dadosPedido.itens.map(item => ({
          pedido_id: pedido.id,
          produto_id: item.produto_id,
          produto_codigo: item.produto_codigo,
          produto_nome: item.produto_nome,
          quantidade: item.quantidade,
          preco_unitario: item.preco_unitario,
          subtotal: item.quantidade * item.preco_unitario,
          loja_origem: item.loja_origem
        }));

        const { error: itensError } = await supabase
          .from('itens_pedido_online')
          .insert(itens);

        if (itensError) throw itensError;
      }

      return pedido;
    } catch (error) {
      console.error('Erro ao criar pedido:', error);
      throw error;
    }
  },

  async getPedidos(filtros = {}) {
    try {
      let query = supabase
        .from('pedidos_online')
        .select(`
          *,
          itens_pedido_online(*)
        `);
      
      if (filtros.vendedor_id) {
        query = query.eq('vendedor_id', filtros.vendedor_id);
      }
      
      if (filtros.status) {
        query = query.eq('status', filtros.status);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao carregar pedidos:', error);
      throw error;
    }
  },

  async atualizarStatusPedido(pedidoId, novoStatus, separadorId = null, separadorNome = null) {
    try {
      const updateData = { status: novoStatus };
      
      if (separadorId && separadorNome) {
        updateData.separador_id = separadorId;
        updateData.separador_nome = separadorNome;
      }
      
      if (novoStatus === 'separado') {
        updateData.data_separacao = new Date().toISOString();
      }
      
      const { data, error } = await supabase
        .from('pedidos_online')
        .update(updateData)
        .eq('id', pedidoId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      throw error;
    }
  },

  async marcarItemSeparado(itemId, separado = true) {
    try {
      const { data, error } = await supabase
        .from('itens_pedido_online')
        .update({ separado })
        .eq('id', itemId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao marcar item como separado:', error);
      throw error;
    }
  },

  // ===== SEPARAÇÃO =====
  async getPedidosParaSeparacao() {
    try {
      const { data, error } = await supabase
        .from('view_pedidos_separacao')
        .select('*')
        .eq('status', 'separando')
        .order('created_at');
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao carregar pedidos para separação:', error);
      throw error;
    }
  },

  async getItensPedido(pedidoId) {
    try {
      const { data, error } = await supabase
        .from('itens_pedido_online')
        .select('*')
        .eq('pedido_id', pedidoId)
        .order('produto_nome');
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao carregar itens do pedido:', error);
      throw error;
    }
  },

  // ===== UTILITÁRIOS =====
  formatarValor(valor) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor || 0);
  },

  formatarStatus(status) {
    const statusMap = {
      'separando': 'Separando',
      'separado': 'Separado',
      'enviado': 'Enviado',
      'entregue': 'Entregue',
      'cancelado': 'Cancelado'
    };
    return statusMap[status] || status;
  },

  getCorStatus(status) {
    const coresMap = {
      'separando': '#f59e0b',
      'separado': '#10b981',
      'enviado': '#3b82f6',
      'entregue': '#10b981',
      'cancelado': '#ef4444'
    };
    return coresMap[status] || '#6b7280';
  }
};