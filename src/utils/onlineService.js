import { supabase } from './supabase';

// SERVIÇOS PARA VENDAS ONLINE
export const onlineService = {
  
  // ===== CATÁLOGO DE PRODUTOS =====
  async getProdutosOnline(filtros = {}) {
    try {
      console.log('Buscando produtos online...');
      
      // Buscar produtos diretamente das lojas físicas
      const [produtosTatuape, produtosMogi] = await Promise.all([
        supabase.from('produtos_tatuape').select('*').eq('ativo', true),
        supabase.from('produtos_mogi').select('*').eq('ativo', true)
      ]);

      console.log('Produtos Tatuapé:', produtosTatuape.data?.length || 0);
      console.log('Produtos Mogi:', produtosMogi.data?.length || 0);
      console.log('Erro Mogi:', produtosMogi.error);

      // Consolidar produtos de ambas as lojas
      const produtosConsolidados = [
        ...(produtosTatuape.data || []).map(p => ({
          produto_id: p.id,
          produto_codigo: p.codigo,
          produto_nome: p.nome,
          loja_origem: 'tatuape',
          estoque_disponivel: p.estoque_atual || 0,
          preco_online: p.preco_venda,
          categoria_online: p.tipo,
          ativo_online: p.ativo
        })),
        ...(produtosMogi.data || []).map(p => ({
          produto_id: p.id,
          produto_codigo: p.codigo,
          produto_nome: p.nome,
          loja_origem: 'mogi',
          estoque_disponivel: p.estoque_atual || 0,
          preco_online: p.preco_venda,
          categoria_online: p.tipo,
          ativo_online: p.ativo
        }))
      ];

      console.log('Produtos consolidados:', produtosConsolidados.length);

      // Aplicar filtros
      let produtosFiltrados = produtosConsolidados;
      
      if (filtros.categoria) {
        produtosFiltrados = produtosFiltrados.filter(p => p.categoria_online === filtros.categoria);
      }
      if (filtros.loja) {
        produtosFiltrados = produtosFiltrados.filter(p => p.loja_origem === filtros.loja);
      }
      if (filtros.disponivel) {
        produtosFiltrados = produtosFiltrados.filter(p => p.estoque_disponivel > 0);
      }
      
      return produtosFiltrados;
    } catch (error) {
      console.error('Erro ao carregar produtos online:', error);
      throw error;
    }
  },

  async sincronizarEstoqueComLojas() {
    try {
      // Buscar produtos de ambas as lojas
      const [produtosTatuape, produtosMogi] = await Promise.all([
        supabase.from('produtos_tatuape').select('*').eq('ativo', true),
        supabase.from('produtos_mogi').select('*').eq('ativo', true)
      ]);

      const produtosParaSincronizar = [
        ...(produtosTatuape.data || []).map(p => ({ ...p, loja_origem: 'tatuape' })),
        ...(produtosMogi.data || []).map(p => ({ ...p, loja_origem: 'mogi' }))
      ];

      // Sincronizar com estoque online
      for (const produto of produtosParaSincronizar) {
        await supabase.from('estoque_online').upsert({
          produto_id: produto.id,
          produto_codigo: produto.codigo,
          produto_nome: produto.nome,
          loja_origem: produto.loja_origem,
          estoque_fisico: produto.estoque_atual || 0,
          preco_online: produto.preco_venda,
          categoria_online: produto.tipo,
          ativo_online: produto.ativo
        }, { onConflict: 'produto_id,loja_origem' });
      }

      // Atualizar estoque disponível
      await supabase.rpc('sincronizar_estoque_online');
      
      return { success: true, sincronizados: produtosParaSincronizar.length };
    } catch (error) {
      console.error('Erro ao sincronizar estoque:', error);
      throw error;
    }
  },

  // ===== PEDIDOS ONLINE =====
  async criarPedido(dadosPedido) {
    try {
      const numeroPedido = await this.gerarNumeroPedido();
      
      const { data: pedido, error: pedidoError } = await supabase
        .from('pedidos_online')
        .insert([{
          numero_pedido: numeroPedido,
          ...dadosPedido,
          status: 'aguardando_pagamento'
        }])
        .select()
        .single();

      if (pedidoError) throw pedidoError;

      // Inserir itens do pedido
      if (dadosPedido.itens && dadosPedido.itens.length > 0) {
        const itensComPedidoId = dadosPedido.itens.map(item => ({
          ...item,
          pedido_id: pedido.id
        }));

        const { error: itensError } = await supabase
          .from('itens_pedido_online')
          .insert(itensComPedidoId);

        if (itensError) throw itensError;

        // Reservar estoque
        await this.reservarEstoque(pedido.id, dadosPedido.itens);
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
      
      if (filtros.status) query = query.eq('status', filtros.status);
      if (filtros.vendedor_id) query = query.eq('vendedor_id', filtros.vendedor_id);
      if (filtros.data_inicio) query = query.gte('data_pedido', filtros.data_inicio);
      if (filtros.data_fim) query = query.lte('data_pedido', filtros.data_fim);
      
      const { data, error } = await query.order('data_pedido', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao carregar pedidos:', error);
      throw error;
    }
  },

  async atualizarStatusPedido(pedidoId, novoStatus, dadosAdicionais = {}) {
    try {
      const updateData = {
        status: novoStatus,
        ...dadosAdicionais
      };

      // Adicionar timestamp baseado no status
      switch (novoStatus) {
        case 'pago':
          updateData.data_pagamento = new Date().toISOString();
          break;
        case 'separado':
          updateData.data_separacao = new Date().toISOString();
          break;
        case 'enviado':
          updateData.data_envio = new Date().toISOString();
          break;
        case 'entregue':
          updateData.data_entrega = new Date().toISOString();
          break;
      }

      const { data, error } = await supabase
        .from('pedidos_online')
        .update(updateData)
        .eq('id', pedidoId)
        .select()
        .single();

      if (error) throw error;

      // Se cancelado, liberar estoque reservado
      if (novoStatus === 'cancelado') {
        await this.liberarEstoqueReservado(pedidoId);
      }

      return data;
    } catch (error) {
      console.error('Erro ao atualizar status do pedido:', error);
      throw error;
    }
  },

  // ===== SEPARAÇÃO DE PEDIDOS =====
  async iniciarSeparacao(pedidoId, separadorId, separadorNome, lojaSeparacao) {
    try {
      const { data, error } = await supabase
        .from('separacao_pedidos')
        .insert([{
          pedido_id: pedidoId,
          separador_id: separadorId,
          separador_nome: separadorNome,
          loja_separacao: lojaSeparacao,
          status: 'iniciado'
        }])
        .select()
        .single();

      if (error) throw error;

      // Atualizar status do pedido
      await this.atualizarStatusPedido(pedidoId, 'separando');

      return data;
    } catch (error) {
      console.error('Erro ao iniciar separação:', error);
      throw error;
    }
  },

  async concluirSeparacao(separacaoId, itensSeparados, lojaSeparacao) {
    try {
      const { data, error } = await supabase
        .from('separacao_pedidos')
        .update({
          status: 'concluido',
          data_conclusao: new Date().toISOString(),
          itens_separados: itensSeparados
        })
        .eq('id', separacaoId)
        .select()
        .single();

      if (error) throw error;

      // Baixar estoque físico da loja para cada item separado
      for (const item of itensSeparados) {
        if (item.produto_loja === lojaSeparacao) {
          await supabase.rpc('baixar_estoque_fisico_separacao', {
            p_produto_id: item.produto_id,
            p_loja: lojaSeparacao,
            p_quantidade: item.quantidade_separada
          });
        }
      }

      // Verificar se todas as separações do pedido foram concluídas
      const { data: separacoes } = await supabase
        .from('separacao_pedidos')
        .select('status')
        .eq('pedido_id', data.pedido_id);

      const todasConcluidas = separacoes?.every(s => s.status === 'concluido');
      
      if (todasConcluidas) {
        await this.atualizarStatusPedido(data.pedido_id, 'separado');
      }

      return data;
    } catch (error) {
      console.error('Erro ao concluir separação:', error);
      throw error;
    }
  },

  async getPedidosParaSeparacao(separadorId = null, lojaSeparador = null) {
    try {
      let query = supabase
        .from('pedidos_online')
        .select(`
          *,
          itens_pedido_online(*),
          separacao_pedidos(*)
        `)
        .eq('status', 'pago');

      const { data, error } = await query.order('data_pedido');
      
      if (error) throw error;
      
      // Filtrar pedidos que têm itens da loja do separador
      const pedidosFiltrados = (data || []).filter(pedido => {
        if (!lojaSeparador) return true;
        
        // Verificar se o pedido tem itens da loja do separador
        const temItensDaLoja = pedido.itens_pedido_online?.some(item => 
          item.produto_loja === lojaSeparador
        );
        
        return temItensDaLoja;
      }).map(pedido => {
        // Filtrar apenas os itens da loja do separador
        if (lojaSeparador) {
          pedido.itens_pedido_online = pedido.itens_pedido_online?.filter(item => 
            item.produto_loja === lojaSeparador
          ) || [];
        }
        
        return pedido;
      });
      
      return pedidosFiltrados;
    } catch (error) {
      console.error('Erro ao carregar pedidos para separação:', error);
      throw error;
    }
  },

  // ===== CONTROLE DE ESTOQUE =====
  async reservarEstoque(pedidoId, itens) {
    try {
      for (const item of itens) {
        // Atualizar estoque reservado
        const { error } = await supabase
          .from('estoque_online')
          .update({
            estoque_reservado: supabase.raw('estoque_reservado + ?', [item.quantidade])
          })
          .eq('produto_id', item.produto_id)
          .eq('loja_origem', item.produto_loja);

        if (error) throw error;

        // Log da movimentação
        await supabase.from('log_estoque_online').insert({
          produto_id: item.produto_id,
          loja_origem: item.produto_loja,
          tipo_movimentacao: 'reserva',
          quantidade_movimentada: item.quantidade,
          pedido_id: pedidoId,
          motivo: `Reserva para pedido online`
        });
      }

      // Atualizar estoque disponível
      await supabase.rpc('sincronizar_estoque_online');
    } catch (error) {
      console.error('Erro ao reservar estoque:', error);
      throw error;
    }
  },

  async liberarEstoqueReservado(pedidoId) {
    try {
      // Buscar itens do pedido
      const { data: itens } = await supabase
        .from('itens_pedido_online')
        .select('*')
        .eq('pedido_id', pedidoId);

      if (!itens) return;

      for (const item of itens) {
        // Liberar estoque reservado
        const { error } = await supabase
          .from('estoque_online')
          .update({
            estoque_reservado: supabase.raw('GREATEST(0, estoque_reservado - ?)', [item.quantidade])
          })
          .eq('produto_id', item.produto_id)
          .eq('loja_origem', item.produto_loja);

        if (error) throw error;

        // Log da movimentação
        await supabase.from('log_estoque_online').insert({
          produto_id: item.produto_id,
          loja_origem: item.produto_loja,
          tipo_movimentacao: 'liberacao_reserva',
          quantidade_movimentada: -item.quantidade,
          pedido_id: pedidoId,
          motivo: 'Liberação por cancelamento'
        });
      }

      // Atualizar estoque disponível
      await supabase.rpc('sincronizar_estoque_online');
    } catch (error) {
      console.error('Erro ao liberar estoque reservado:', error);
      throw error;
    }
  },

  // ===== MÉTRICAS E RELATÓRIOS =====
  async getMetricasVendedor(vendedorId, dataInicio, dataFim) {
    try {
      const { data, error } = await supabase
        .from('pedidos_online')
        .select('*')
        .eq('vendedor_id', vendedorId)
        .gte('data_pedido', dataInicio)
        .lte('data_pedido', dataFim)
        .neq('status', 'cancelado');

      if (error) throw error;

      const pedidos = data || [];
      const totalPedidos = pedidos.length;
      const valorTotal = pedidos.reduce((sum, p) => sum + parseFloat(p.valor_total || 0), 0);
      const ticketMedio = totalPedidos > 0 ? valorTotal / totalPedidos : 0;

      return {
        totalPedidos,
        valorTotal,
        ticketMedio,
        pedidosCancelados: 0, // Calcular separadamente se necessário
        taxaConversao: 0 // Implementar lógica de conversão
      };
    } catch (error) {
      console.error('Erro ao calcular métricas:', error);
      throw error;
    }
  },

  async getDashboardGerente() {
    try {
      const hoje = new Date();
      const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);

      const [pedidosHoje, pedidosMes, pedidosPendentes] = await Promise.all([
        // Pedidos de hoje
        supabase
          .from('pedidos_online')
          .select('*')
          .gte('data_pedido', hoje.toISOString().split('T')[0])
          .neq('status', 'cancelado'),
        
        // Pedidos do mês
        supabase
          .from('pedidos_online')
          .select('*')
          .gte('data_pedido', inicioMes.toISOString())
          .neq('status', 'cancelado'),
        
        // Pedidos pendentes
        supabase
          .from('pedidos_online')
          .select('*')
          .in('status', ['aguardando_pagamento', 'pago', 'separando'])
      ]);

      const valorHoje = (pedidosHoje.data || []).reduce((sum, p) => sum + parseFloat(p.valor_total || 0), 0);
      const valorMes = (pedidosMes.data || []).reduce((sum, p) => sum + parseFloat(p.valor_total || 0), 0);

      return {
        pedidosHoje: pedidosHoje.data?.length || 0,
        valorHoje,
        pedidosMes: pedidosMes.data?.length || 0,
        valorMes,
        pedidosPendentes: pedidosPendentes.data?.length || 0,
        ticketMedioMes: pedidosMes.data?.length > 0 ? valorMes / pedidosMes.data.length : 0
      };
    } catch (error) {
      console.error('Erro ao carregar dashboard gerente:', error);
      throw error;
    }
  },

  // ===== UTILITÁRIOS =====
  async gerarNumeroPedido() {
    const { data } = await supabase.rpc('gerar_numero_pedido');
    return data;
  },

  formatarValor(valor) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor || 0);
  },

  formatarStatus(status) {
    const statusMap = {
      'aguardando_pagamento': 'Aguardando Pagamento',
      'pago': 'Pago',
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
      'aguardando_pagamento': '#f59e0b',
      'pago': '#10b981',
      'separando': '#3b82f6',
      'separado': '#8b5cf6',
      'enviado': '#06b6d4',
      'entregue': '#10b981',
      'cancelado': '#ef4444'
    };
    return coresMap[status] || '#6b7280';
  }
};