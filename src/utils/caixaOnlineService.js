import { supabase } from './supabase';

// SERVIÇO PARA SISTEMA DE CAIXA ONLINE COM FLUXO OBRIGATÓRIO
export const caixaOnlineService = {

  // ===== VALIDAÇÕES DE USUÁRIO =====
  async validarUsuario(email, tipoEsperado) {
    try {
      const { data: usuario, error } = await supabase
        .from('usuarios_tatuape')
        .select('*')
        .eq('email', email)
        .eq('tipo_usuario', tipoEsperado)
        .eq('ativo', true)
        .single();

      if (error || !usuario) {
        throw new Error(`Usuário não autorizado para ${tipoEsperado}`);
      }

      return usuario;
    } catch (error) {
      console.error('Erro na validação de usuário:', error);
      throw error;
    }
  },

  // ===== VENDEDOR ONLINE =====
  async criarVenda(dadosVenda, vendedorId, vendedorNome) {
    try {
      // Validar que é um vendedor online
      await this.validarUsuario(vendedorNome, 'vendedor_online');

      const { data: pedido, error } = await supabase
        .from('pedidos_online')
        .insert([{
          vendedor_id: vendedorId,
          vendedor_nome: vendedorNome,
          cliente_nome: dadosVenda.cliente_nome,
          cliente_cpf: dadosVenda.cliente_cpf,
          cliente_telefone: dadosVenda.cliente_telefone,
          cliente_endereco: dadosVenda.cliente_endereco,
          valor_total: dadosVenda.valor_total,
          tipo_envio: dadosVenda.tipo_envio || 'retirada',
          observacoes: dadosVenda.observacoes
          // status será automaticamente 'CRIADA' pelo trigger
        }])
        .select()
        .single();

      if (error) throw error;

      // Inserir itens do pedido
      if (dadosVenda.itens && dadosVenda.itens.length > 0) {
        const itensComPedidoId = dadosVenda.itens.map(item => ({
          pedido_id: pedido.id,
          produto_id: item.produto_id,
          produto_codigo: item.produto_codigo,
          produto_nome: item.produto_nome,
          quantidade: item.quantidade,
          preco_unitario: item.preco_unitario,
          loja_origem: item.loja_origem
        }));

        const { error: itensError } = await supabase
          .from('itens_pedido_online')
          .insert(itensComPedidoId);

        if (itensError) throw itensError;
      }

      // Registrar no histórico
      await this.registrarHistorico(
        pedido.id,
        vendedorId,
        vendedorNome,
        'vendedor_online',
        'CRIAR_VENDA',
        null,
        'CRIADA',
        'Venda criada pelo vendedor'
      );

      return pedido;
    } catch (error) {
      console.error('Erro ao criar venda:', error);
      throw error;
    }
  },

  async buscarVendasVendedor(vendedorId) {
    try {
      const { data, error } = await supabase
        .rpc('buscar_pedidos_por_usuario', {
          p_usuario_tipo: 'vendedor_online',
          p_usuario_id: vendedorId
        });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar vendas do vendedor:', error);
      throw error;
    }
  },

  // ===== SEPARADOR ONLINE =====
  async buscarPedidosParaSeparacao() {
    try {
      const { data, error } = await supabase
        .rpc('buscar_pedidos_por_usuario', {
          p_usuario_tipo: 'separador_online'
        });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar pedidos para separação:', error);
      throw error;
    }
  },

  async marcarPedidoSeparado(pedidoId, separadorId, separadorNome) {
    try {
      // Validar que é um separador
      await this.validarUsuario(separadorNome, 'separador_online');

      const { data, error } = await supabase
        .rpc('atualizar_status_pedido_validado', {
          p_pedido_id: pedidoId,
          p_usuario_id: separadorId,
          p_usuario_nome: separadorNome,
          p_usuario_tipo: 'separador_online',
          p_acao: 'MARCAR_SEPARADO',
          p_novo_status: 'SEPARADO',
          p_observacoes: 'Pedido separado e pronto para envio'
        });

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.error);
      }

      return data;
    } catch (error) {
      console.error('Erro ao marcar pedido como separado:', error);
      throw error;
    }
  },

  async marcarPedidoEnviado(pedidoId, separadorId, separadorNome, observacoes = '') {
    try {
      // Validar que é um separador
      await this.validarUsuario(separadorNome, 'separador_online');

      const { data, error } = await supabase
        .rpc('atualizar_status_pedido_validado', {
          p_pedido_id: pedidoId,
          p_usuario_id: separadorId,
          p_usuario_nome: separadorNome,
          p_usuario_tipo: 'separador_online',
          p_acao: 'MARCAR_ENVIADO',
          p_novo_status: 'ENVIADO',
          p_observacoes: observacoes || 'Pedido enviado'
        });

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.error);
      }

      return data;
    } catch (error) {
      console.error('Erro ao marcar pedido como enviado:', error);
      throw error;
    }
  },

  // ===== CAIXA ONLINE =====
  async buscarPedidosParaCaixa() {
    try {
      console.log('Buscando pedidos para caixa...');
      const { data, error } = await supabase
        .from('pedidos_online')
        .select('*')
        .eq('pedido_separado', 'SIM')
        .eq('enviado', 'SIM')
        .in('status', ['ENVIADO', 'PAGO'])
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Erro ao buscar pedidos:', error);
        throw error;
      }
      
      console.log('Pedidos encontrados:', data?.length || 0);
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar pedidos para caixa:', error);
      throw error;
    }
  },

  async registrarPagamento(pedidoId, dadosPagamento, caixaId = null) {
    try {
      console.log('Registrando pagamento para pedido:', pedidoId);
      
      // Buscar usuário caixa online diretamente
      const { data: caixa, error: caixaError } = await supabase
        .from('usuarios_tatuape')
        .select('*')
        .eq('email', 'caixa.online@vh.com')
        .eq('tipo', 'caixa_online')
        .single();

      if (caixaError || !caixa) {
        throw new Error('Usuário caixa online não encontrado');
      }

      const { data, error } = await supabase
        .rpc('atualizar_status_pedido_validado', {
          p_pedido_id: pedidoId,
          p_usuario_id: caixa.id,
          p_usuario_nome: 'Caixa Online',
          p_usuario_tipo: 'caixa_online',
          p_acao: 'REGISTRAR_PAGAMENTO',
          p_novo_status: 'PAGO',
          p_dados_extras: JSON.stringify({
            forma_pagamento: dadosPagamento.forma_pagamento,
            valor_pago: dadosPagamento.valor_pago
          }),
          p_observacoes: dadosPagamento.observacoes || 'Pagamento registrado pelo caixa online'
        });

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.error);
      }

      return data;
    } catch (error) {
      console.error('Erro ao registrar pagamento:', error);
      throw error;
    }
  },

  async finalizarVenda(pedidoId, observacoes = '') {
    try {
      // Validar que é o caixa online
      const caixaEmail = 'caixa.online@vh.com';
      const caixa = await this.validarUsuario(caixaEmail, 'caixa_online');

      const { data, error } = await supabase
        .rpc('atualizar_status_pedido_validado', {
          p_pedido_id: pedidoId,
          p_usuario_id: caixa.id,
          p_usuario_nome: 'Caixa Online',
          p_usuario_tipo: 'caixa_online',
          p_acao: 'FINALIZAR_VENDA',
          p_novo_status: 'FINALIZADO',
          p_observacoes: observacoes || 'Venda finalizada pelo caixa online'
        });

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.error);
      }

      return data;
    } catch (error) {
      console.error('Erro ao finalizar venda:', error);
      throw error;
    }
  },

  // ===== HISTÓRICO E RASTREABILIDADE =====
  async registrarHistorico(pedidoId, usuarioId, usuarioNome, usuarioTipo, acao, statusAnterior, statusNovo, observacoes) {
    try {
      const { data, error } = await supabase
        .from('historico_acoes_online')
        .insert([{
          pedido_id: pedidoId,
          usuario_id: usuarioId,
          usuario_nome: usuarioNome,
          usuario_tipo: usuarioTipo,
          acao: acao,
          status_anterior: statusAnterior,
          status_novo: statusNovo,
          observacoes: observacoes
        }]);

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao registrar histórico:', error);
      throw error;
    }
  },

  async buscarHistoricoPedido(pedidoId) {
    try {
      const { data, error } = await supabase
        .from('historico_acoes_online')
        .select('*')
        .eq('pedido_id', pedidoId)
        .order('data_acao', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar histórico do pedido:', error);
      throw error;
    }
  },

  // ===== RELATÓRIOS E MÉTRICAS =====
  async getMetricasCaixa(dataInicio, dataFim) {
    try {
      const { data: pedidos, error } = await supabase
        .from('pedidos_online')
        .select('*')
        .gte('created_at', dataInicio)
        .lte('created_at', dataFim)
        .neq('status', 'CANCELADO');

      if (error) throw error;

      const pedidosArray = pedidos || [];
      const totalPedidos = pedidosArray.length;
      const pedidosFinalizados = pedidosArray.filter(p => p.status === 'FINALIZADO').length;
      const valorTotal = pedidosArray.reduce((sum, p) => sum + parseFloat(p.valor_total || 0), 0);
      const valorFinalizado = pedidosArray
        .filter(p => p.status === 'FINALIZADO')
        .reduce((sum, p) => sum + parseFloat(p.valor_total || 0), 0);

      return {
        totalPedidos,
        pedidosFinalizados,
        pedidosPendentes: totalPedidos - pedidosFinalizados,
        valorTotal,
        valorFinalizado,
        ticketMedio: pedidosFinalizados > 0 ? valorFinalizado / pedidosFinalizados : 0,
        taxaFinalizacao: totalPedidos > 0 ? (pedidosFinalizados / totalPedidos) * 100 : 0
      };
    } catch (error) {
      console.error('Erro ao calcular métricas do caixa:', error);
      throw error;
    }
  },

  async getFluxoPedidos() {
    try {
      const { data, error } = await supabase
        .from('pedidos_online')
        .select('status')
        .neq('status', 'CANCELADO');

      if (error) throw error;

      const pedidos = data || [];
      const fluxo = {
        CRIADA: pedidos.filter(p => p.status === 'CRIADA').length,
        SEPARADO: pedidos.filter(p => p.status === 'SEPARADO').length,
        ENVIADO: pedidos.filter(p => p.status === 'ENVIADO').length,
        PAGO: pedidos.filter(p => p.status === 'PAGO').length,
        FINALIZADO: pedidos.filter(p => p.status === 'FINALIZADO').length
      };

      return fluxo;
    } catch (error) {
      console.error('Erro ao buscar fluxo de pedidos:', error);
      throw error;
    }
  },

  // ===== UTILITÁRIOS =====
  formatarStatus(status) {
    const statusMap = {
      'CRIADA': 'Criada',
      'SEPARANDO': 'Separando',
      'SEPARADO': 'Separado',
      'ENVIADO': 'Enviado',
      'PAGO': 'Pago',
      'FINALIZADO': 'Finalizado',
      'CANCELADO': 'Cancelado'
    };
    return statusMap[status] || status;
  },

  getCorStatus(status) {
    const coresMap = {
      'CRIADA': '#f59e0b',      // Amarelo
      'SEPARANDO': '#3b82f6',   // Azul
      'SEPARADO': '#8b5cf6',    // Roxo
      'ENVIADO': '#06b6d4',     // Ciano
      'PAGO': '#10b981',        // Verde
      'FINALIZADO': '#059669',  // Verde escuro
      'CANCELADO': '#ef4444'    // Vermelho
    };
    return coresMap[status] || '#6b7280';
  },

  formatarValor(valor) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor || 0);
  },

  formatarData(data) {
    if (!data) return '-';
    return new Date(data).toLocaleString('pt-BR');
  },

  // ===== VALIDAÇÕES DE FLUXO =====
  podeProcessarPedido(pedido, tipoUsuario) {
    switch (tipoUsuario) {
      case 'vendedor_online':
        return pedido.status === 'CRIADA';
      
      case 'separador_online':
        return ['CRIADA', 'SEPARANDO', 'SEPARADO'].includes(pedido.status);
      
      case 'caixa_online':
        return pedido.pedido_separado === 'SIM' && 
               pedido.enviado === 'SIM' && 
               ['ENVIADO', 'PAGO'].includes(pedido.status);
      
      default:
        return false;
    }
  },

  getProximaAcao(pedido, tipoUsuario) {
    if (!this.podeProcessarPedido(pedido, tipoUsuario)) {
      return null;
    }

    switch (tipoUsuario) {
      case 'separador_online':
        if (pedido.status === 'CRIADA') return 'MARCAR_SEPARADO';
        if (pedido.status === 'SEPARADO') return 'MARCAR_ENVIADO';
        return null;
      
      case 'caixa_online':
        if (pedido.status === 'ENVIADO') return 'REGISTRAR_PAGAMENTO';
        if (pedido.status === 'PAGO') return 'FINALIZAR_VENDA';
        return null;
      
      default:
        return null;
    }
  }
};