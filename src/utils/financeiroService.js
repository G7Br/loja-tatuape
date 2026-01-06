import { supabase } from './supabase';

// SERVIÇOS FINANCEIROS CENTRALIZADOS
// IMPORTANTE: Todas as tabelas financeiras ficam no projeto Tatuapé (supabase)
// Agora todas as lojas usam o mesmo banco com sufixos nas tabelas
export const financeiroService = {
  
  // ===== DADOS CONSOLIDADOS =====
  async getDadosConsolidados() {
    try {
      const [tatuapeData, mogiData] = await Promise.all([
        this.getDadosLoja('tatuape'),
        this.getDadosLoja('mogi')
      ]);
      
      return {
        tatuape: tatuapeData,
        mogi: mogiData,
        consolidado: this.consolidarDados(tatuapeData, mogiData)
      };
    } catch (error) {
      console.error('Erro ao carregar dados consolidados:', error);
      throw error;
    }
  },

  async getDadosLoja(loja) {
    // Agora todas as lojas usam o mesmo cliente supabase
    const client = supabase;
    
    try {
      const [vendas, funcionarios, caixa, estoque, saidas] = await Promise.all([
        // Vendas
        client.from(`vendas_${loja}`)
          .select('*')
          .neq('forma_pagamento', 'pendente_caixa')
          .order('data_venda', { ascending: false }),
        
        // Funcionários
        client.from(`usuarios_${loja}`)
          .select('*')
          .eq('ativo', true),
        
        // Movimentações de caixa
        client.from(`caixa_${loja}`)
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100),
        
        // Estoque
        client.from(`produtos_${loja}`)
          .select('*')
          .eq('ativo', true),
        
        // Saídas de caixa
        client.from(`saidas_caixa_${loja}`)
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50)
      ]);

      return {
        vendas: vendas.data || [],
        funcionarios: funcionarios.data || [],
        caixa: caixa.data || [],
        estoque: estoque.data || [],
        saidas: saidas.data || []
      };
    } catch (error) {
      console.error(`Erro ao carregar dados da loja ${loja}:`, error);
      throw error;
    }
  },

  consolidarDados(tatuapeData, mogiData) {
    const hoje = new Date();
    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    
    // Consolidar vendas
    const todasVendas = [...tatuapeData.vendas, ...mogiData.vendas];
    const vendasMes = todasVendas.filter(v => new Date(v.data_venda) >= inicioMes);
    const vendasHoje = todasVendas.filter(v => 
      new Date(v.data_venda).toDateString() === hoje.toDateString()
    );
    
    const totalVendasMes = vendasMes.reduce((sum, v) => sum + parseFloat(v.valor_final || 0), 0);
    const totalVendasHoje = vendasHoje.reduce((sum, v) => sum + parseFloat(v.valor_final || 0), 0);
    
    // Consolidar funcionários
    const todosFuncionarios = [...tatuapeData.funcionarios, ...mogiData.funcionarios];
    
    // Consolidar estoque
    const todoEstoque = [...tatuapeData.estoque, ...mogiData.estoque];
    const valorTotalEstoque = todoEstoque.reduce((sum, p) => 
      sum + ((p.estoque_atual || 0) * (p.preco_venda || 0)), 0
    );
    
    return {
      totalVendasMes,
      totalVendasHoje,
      totalFuncionarios: todosFuncionarios.length,
      valorTotalEstoque,
      ticketMedio: vendasMes.length > 0 ? totalVendasMes / vendasMes.length : 0,
      produtosAtivos: todoEstoque.length,
      estoqueBaixo: todoEstoque.filter(p => (p.estoque_atual || 0) < 5).length
    };
  },

  // ===== PAGAMENTOS DE FUNCIONÁRIOS =====
  async getPagamentosFuncionarios(filtros = {}) {
    try {
      let query = supabase.from('pagamentos_funcionarios').select('*');
      
      if (filtros.loja) query = query.eq('loja', filtros.loja);
      if (filtros.mes_referencia) query = query.eq('mes_referencia', filtros.mes_referencia);
      if (filtros.status) query = query.eq('status', filtros.status);
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao carregar pagamentos:', error);
      throw error;
    }
  },

  async registrarPagamento(dadosPagamento) {
    try {
      const valorTotal = dadosPagamento.salario + dadosPagamento.comissao + 
                        dadosPagamento.bonus - dadosPagamento.descontos;
      
      const { data, error } = await supabase
        .from('pagamentos_funcionarios')
        .insert([{
          ...dadosPagamento,
          valor_total: valorTotal,
          status: 'pendente'
        }])
        .select();
      
      if (error) throw error;
      
      // Registrar na auditoria
      await this.registrarAuditoria('pagamentos_funcionarios', data[0].id, 'INSERT', null, data[0]);
      
      return data[0];
    } catch (error) {
      console.error('Erro ao registrar pagamento:', error);
      throw error;
    }
  },

  async confirmarPagamento(pagamentoId, usuarioId) {
    try {
      const { data, error } = await supabase
        .from('pagamentos_funcionarios')
        .update({
          status: 'pago',
          data_pagamento: new Date().toISOString(),
          usuario_financeiro_id: usuarioId
        })
        .eq('id', pagamentoId)
        .select();
      
      if (error) throw error;
      return data[0];
    } catch (error) {
      console.error('Erro ao confirmar pagamento:', error);
      throw error;
    }
  },

  // ===== LANÇAMENTOS FINANCEIROS =====
  async getLancamentosFinanceiros(filtros = {}) {
    try {
      let query = supabase.from('lancamentos_financeiros').select('*');
      
      if (filtros.loja) query = query.eq('loja', filtros.loja);
      if (filtros.tipo) query = query.eq('tipo', filtros.tipo);
      if (filtros.categoria) query = query.eq('categoria', filtros.categoria);
      if (filtros.data_inicio) query = query.gte('data_lancamento', filtros.data_inicio);
      if (filtros.data_fim) query = query.lte('data_lancamento', filtros.data_fim);
      
      const { data, error } = await query.order('data_lancamento', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao carregar lançamentos:', error);
      throw error;
    }
  },

  async adicionarLancamento(dadosLancamento) {
    try {
      const { data, error } = await supabase
        .from('lancamentos_financeiros')
        .insert([dadosLancamento])
        .select();
      
      if (error) throw error;
      
      // Registrar na auditoria
      await this.registrarAuditoria('lancamentos_financeiros', data[0].id, 'INSERT', null, data[0]);
      
      return data[0];
    } catch (error) {
      console.error('Erro ao adicionar lançamento:', error);
      throw error;
    }
  },

  // ===== FECHAMENTOS FINANCEIROS =====
  async getFechamentos(filtros = {}) {
    try {
      let query = supabase.from('fechamentos_financeiros').select('*');
      
      if (filtros.loja) query = query.eq('loja', filtros.loja);
      if (filtros.status) query = query.eq('status', filtros.status);
      if (filtros.ano) {
        query = query.gte('periodo_inicio', `${filtros.ano}-01-01`)
                     .lte('periodo_fim', `${filtros.ano}-12-31`);
      }
      
      const { data, error } = await query.order('periodo_inicio', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao carregar fechamentos:', error);
      throw error;
    }
  },

  async gerarFechamentoMensal(loja, ano, mes, usuarioId) {
    try {
      const periodoInicio = new Date(ano, mes - 1, 1);
      const periodoFim = new Date(ano, mes, 0);
      
      // Buscar dados do período
      const dadosLoja = await this.getDadosLoja(loja);
      
      const vendasPeriodo = dadosLoja.vendas.filter(v => {
        const dataVenda = new Date(v.data_venda);
        return dataVenda >= periodoInicio && dataVenda <= periodoFim;
      });
      
      const totalVendas = vendasPeriodo.reduce((sum, v) => sum + parseFloat(v.valor_final || 0), 0);
      
      // Buscar lançamentos do período
      const lancamentos = await this.getLancamentosFinanceiros({
        loja,
        data_inicio: periodoInicio.toISOString().split('T')[0],
        data_fim: periodoFim.toISOString().split('T')[0]
      });
      
      const totalEntradas = lancamentos
        .filter(l => l.tipo === 'entrada')
        .reduce((sum, l) => sum + parseFloat(l.valor || 0), 0);
      
      const totalSaidas = lancamentos
        .filter(l => l.tipo === 'saida')
        .reduce((sum, l) => sum + parseFloat(l.valor || 0), 0);
      
      // Buscar pagamentos de funcionários do período
      const pagamentos = await this.getPagamentosFuncionarios({
        loja,
        mes_referencia: `${ano}-${mes.toString().padStart(2, '0')}-01`
      });
      
      const totalPagamentosFuncionarios = pagamentos
        .filter(p => p.status === 'pago')
        .reduce((sum, p) => sum + parseFloat(p.valor_total || 0), 0);
      
      const saldoPeriodo = totalVendas + totalEntradas - totalSaidas - totalPagamentosFuncionarios;
      
      // Criar fechamento
      const { data, error } = await supabase
        .from('fechamentos_financeiros')
        .insert([{
          periodo_inicio: periodoInicio.toISOString().split('T')[0],
          periodo_fim: periodoFim.toISOString().split('T')[0],
          loja,
          total_vendas: totalVendas,
          total_entradas: totalEntradas,
          total_saidas: totalSaidas,
          total_pagamentos_funcionarios: totalPagamentosFuncionarios,
          saldo_periodo: saldoPeriodo,
          status: 'fechado',
          usuario_fechamento_id: usuarioId,
          data_fechamento: new Date().toISOString()
        }])
        .select();
      
      if (error) throw error;
      return data[0];
    } catch (error) {
      console.error('Erro ao gerar fechamento:', error);
      throw error;
    }
  },

  // ===== METAS FINANCEIRAS =====
  async getMetasFinanceiras(filtros = {}) {
    try {
      let query = supabase.from('metas_financeiras').select('*');
      
      if (filtros.loja) query = query.eq('loja', filtros.loja);
      if (filtros.ano) query = query.eq('ano', filtros.ano);
      if (filtros.mes) query = query.eq('mes', filtros.mes);
      
      const { data, error } = await query.order('ano', { ascending: false })
                                        .order('mes', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao carregar metas:', error);
      throw error;
    }
  },

  async atualizarMeta(loja, ano, mes, dadosMeta) {
    try {
      const { data, error } = await supabase
        .from('metas_financeiras')
        .upsert([{
          loja,
          ano,
          mes,
          ...dadosMeta
        }])
        .select();
      
      if (error) throw error;
      return data[0];
    } catch (error) {
      console.error('Erro ao atualizar meta:', error);
      throw error;
    }
  },

  // ===== RELATÓRIOS =====
  async gerarRelatorioConsolidado(dataInicio, dataFim) {
    try {
      const [dadosConsolidados, lancamentos, pagamentos, fechamentos] = await Promise.all([
        this.getDadosConsolidados(),
        this.getLancamentosFinanceiros({ data_inicio: dataInicio, data_fim: dataFim }),
        this.getPagamentosFuncionarios(),
        this.getFechamentos()
      ]);
      
      return {
        periodo: { inicio: dataInicio, fim: dataFim },
        resumo: dadosConsolidados.consolidado,
        lojas: {
          tatuape: dadosConsolidados.tatuape,
          mogi: dadosConsolidados.mogi
        },
        lancamentos,
        pagamentos,
        fechamentos
      };
    } catch (error) {
      console.error('Erro ao gerar relatório consolidado:', error);
      throw error;
    }
  },

  // ===== AUDITORIA =====
  async registrarAuditoria(tabela, registroId, acao, dadosAnteriores, dadosNovos, usuarioId = null) {
    try {
      await supabase.from('auditoria_financeira').insert([{
        tabela_afetada: tabela,
        registro_id: registroId,
        acao,
        dados_anteriores: dadosAnteriores,
        dados_novos: dadosNovos,
        usuario_id: usuarioId
      }]);
    } catch (error) {
      console.error('Erro ao registrar auditoria:', error);
      // Não propagar erro de auditoria para não quebrar operação principal
    }
  },

  async getLogAuditoria(filtros = {}) {
    try {
      let query = supabase.from('auditoria_financeira').select('*');
      
      if (filtros.tabela) query = query.eq('tabela_afetada', filtros.tabela);
      if (filtros.registro_id) query = query.eq('registro_id', filtros.registro_id);
      if (filtros.usuario_id) query = query.eq('usuario_id', filtros.usuario_id);
      if (filtros.data_inicio) query = query.gte('created_at', filtros.data_inicio);
      if (filtros.data_fim) query = query.lte('created_at', filtros.data_fim);
      
      const { data, error } = await query.order('created_at', { ascending: false })
                                        .limit(1000);
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao carregar log de auditoria:', error);
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

  calcularPercentual(valor, total) {
    return total > 0 ? ((valor / total) * 100).toFixed(2) : '0.00';
  },

  obterPeriodoAtual() {
    const hoje = new Date();
    return {
      ano: hoje.getFullYear(),
      mes: hoje.getMonth() + 1,
      inicioMes: new Date(hoje.getFullYear(), hoje.getMonth(), 1),
      fimMes: new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0)
    };
  }
};