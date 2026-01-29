import { supabase } from './supabase';

/**
 * Utilitário para gerenciar múltiplas lojas no sistema
 */
export class MultiLojaService {
  
  /**
   * Busca todas as lojas ativas do sistema
   */
  static async buscarLojasAtivas() {
    try {
      const { data, error } = await supabase
        .from('lojas_sistema')
        .select('*')
        .eq('status', 'ativa')
        .order('nome_loja');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar lojas ativas:', error);
      return [];
    }
  }

  /**
   * Busca uma loja específica pelo código
   */
  static async buscarLojaPorCodigo(codigo) {
    try {
      const { data, error } = await supabase
        .from('lojas_sistema')
        .select('*')
        .eq('codigo_loja', codigo)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao buscar loja:', error);
      return null;
    }
  }

  /**
   * Cria uma nova loja com todas as tabelas necessárias
   */
  static async criarNovaLoja(dadosLoja) {
    try {
      // 1. Validar dados obrigatórios
      if (!dadosLoja.codigo_loja || !dadosLoja.nome_loja) {
        throw new Error('Código e nome da loja são obrigatórios');
      }

      // 2. Limpar código da loja
      const codigoLimpo = dadosLoja.codigo_loja
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '')
        .substring(0, 20);

      // 3. Verificar se já existe
      const lojaExistente = await this.buscarLojaPorCodigo(codigoLimpo);
      if (lojaExistente) {
        throw new Error('Já existe uma loja com este código');
      }

      // 4. Inserir loja no sistema
      const { data: lojaData, error: lojaError } = await supabase
        .from('lojas_sistema')
        .insert([{
          codigo_loja: codigoLimpo,
          nome_loja: dadosLoja.nome_loja,
          endereco: dadosLoja.endereco || '',
          telefone: dadosLoja.telefone || '',
          email: dadosLoja.email || '',
          gerente_responsavel: dadosLoja.gerente_responsavel || '',
          status: 'ativa'
        }])
        .select()
        .single();

      if (lojaError) throw lojaError;

      // 5. Criar todas as tabelas da loja
      const { error: tabelasError } = await supabase.rpc('criar_tabelas_loja', {
        codigo_loja: codigoLimpo
      });

      if (tabelasError) throw tabelasError;

      // 6. Criar configurações padrão
      await this.criarConfiguracoesPadrao(lojaData.id);

      return lojaData;

    } catch (error) {
      console.error('Erro ao criar loja:', error);
      throw error;
    }
  }

  /**
   * Cria configurações padrão para uma nova loja
   */
  static async criarConfiguracoesPadrao(lojaId) {
    const configuracoes = [
      { chave: 'meta_mensal_loja', valor: '50000', tipo: 'number', descricao: 'Meta mensal da loja em R$' },
      { chave: 'horario_funcionamento', valor: '08:00-18:00', tipo: 'string', descricao: 'Horário de funcionamento' },
      { chave: 'comissao_vendedor', valor: '5', tipo: 'number', descricao: 'Percentual de comissão dos vendedores' },
      { chave: 'desconto_maximo', valor: '20', tipo: 'number', descricao: 'Desconto máximo permitido (%)' },
      { chave: 'valor_minimo_venda', valor: '10', tipo: 'number', descricao: 'Valor mínimo para venda em R$' },
      { chave: 'backup_automatico', valor: 'true', tipo: 'boolean', descricao: 'Realizar backup automático diário' },
      { chave: 'notificar_estoque_baixo', valor: 'true', tipo: 'boolean', descricao: 'Notificar quando estoque baixo' }
    ];

    for (const config of configuracoes) {
      try {
        await supabase
          .from('configuracoes_loja')
          .insert([{
            loja_id: lojaId,
            ...config
          }]);
      } catch (error) {
        console.error('Erro ao criar configuração:', config.chave, error);
      }
    }
  }

  /**
   * Remove uma loja e todas suas tabelas
   */
  static async removerLoja(codigoLoja) {
    try {
      // 1. Buscar dados da loja
      const loja = await this.buscarLojaPorCodigo(codigoLoja);
      if (!loja) {
        throw new Error('Loja não encontrada');
      }

      // 2. Remover todas as tabelas da loja
      const { error: tabelasError } = await supabase.rpc('remover_tabelas_loja', {
        codigo_loja: codigoLoja
      });

      if (tabelasError) throw tabelasError;

      // 3. Remover configurações da loja
      await supabase
        .from('configuracoes_loja')
        .delete()
        .eq('loja_id', loja.id);

      // 4. Remover registro da loja
      const { error: lojaError } = await supabase
        .from('lojas_sistema')
        .delete()
        .eq('id', loja.id);

      if (lojaError) throw lojaError;

      return true;

    } catch (error) {
      console.error('Erro ao remover loja:', error);
      throw error;
    }
  }

  /**
   * Busca dados consolidados de todas as lojas
   */
  static async buscarDadosConsolidados() {
    try {
      const lojas = await this.buscarLojasAtivas();
      const dadosConsolidados = {};

      for (const loja of lojas) {
        try {
          const [vendas, funcionarios, produtos, caixa] = await Promise.all([
            supabase.from(`vendas_${loja.codigo_loja}`).select('*').order('data_venda', { ascending: false }),
            supabase.from(`usuarios_${loja.codigo_loja}`).select('*').eq('ativo', true),
            supabase.from(`produtos_${loja.codigo_loja}`).select('*').eq('ativo', true),
            supabase.from(`caixa_${loja.codigo_loja}`).select('*').order('created_at', { ascending: false }).limit(100)
          ]);

          dadosConsolidados[loja.codigo_loja] = {
            loja: loja,
            vendas: vendas.data || [],
            funcionarios: funcionarios.data || [],
            produtos: produtos.data || [],
            caixa: caixa.data || []
          };

        } catch (error) {
          console.error(`Erro ao carregar dados da loja ${loja.codigo_loja}:`, error);
          dadosConsolidados[loja.codigo_loja] = {
            loja: loja,
            vendas: [],
            funcionarios: [],
            produtos: [],
            caixa: [],
            erro: error.message
          };
        }
      }

      return dadosConsolidados;

    } catch (error) {
      console.error('Erro ao buscar dados consolidados:', error);
      return {};
    }
  }

  /**
   * Busca configurações de uma loja
   */
  static async buscarConfiguracoes(lojaId) {
    try {
      const { data, error } = await supabase
        .from('configuracoes_loja')
        .select('*')
        .eq('loja_id', lojaId);

      if (error) throw error;

      // Converter para objeto chave-valor
      const configuracoes = {};
      (data || []).forEach(config => {
        let valor = config.valor;
        
        // Converter tipos
        if (config.tipo === 'number') {
          valor = parseFloat(valor) || 0;
        } else if (config.tipo === 'boolean') {
          valor = valor === 'true';
        } else if (config.tipo === 'json') {
          try {
            valor = JSON.parse(valor);
          } catch (e) {
            valor = {};
          }
        }

        configuracoes[config.chave] = valor;
      });

      return configuracoes;

    } catch (error) {
      console.error('Erro ao buscar configurações:', error);
      return {};
    }
  }

  /**
   * Atualiza configuração de uma loja
   */
  static async atualizarConfiguracao(lojaId, chave, valor) {
    try {
      const { error } = await supabase
        .from('configuracoes_loja')
        .upsert([{
          loja_id: lojaId,
          chave: chave,
          valor: String(valor)
        }]);

      if (error) throw error;
      return true;

    } catch (error) {
      console.error('Erro ao atualizar configuração:', error);
      throw error;
    }
  }

  /**
   * Calcula métricas consolidadas de todas as lojas
   */
  static calcularMetricasConsolidadas(dadosConsolidados) {
    const hoje = new Date();
    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    const inicioAno = new Date(hoje.getFullYear(), 0, 1);

    let metricas = {
      totalLojas: 0,
      vendasHoje: 0,
      vendasMes: 0,
      vendasAno: 0,
      totalFuncionarios: 0,
      valorEstoque: 0,
      lojasMelhorPerformance: [],
      resumoPorLoja: {}
    };

    Object.entries(dadosConsolidados).forEach(([codigoLoja, dados]) => {
      if (dados.erro) return;

      metricas.totalLojas++;

      // Vendas hoje
      const vendasHoje = dados.vendas.filter(v => 
        new Date(v.data_venda).toDateString() === hoje.toDateString()
      );
      const valorHoje = vendasHoje.reduce((sum, v) => sum + parseFloat(v.valor_final || 0), 0);
      metricas.vendasHoje += valorHoje;

      // Vendas mês
      const vendasMes = dados.vendas.filter(v => 
        new Date(v.data_venda) >= inicioMes
      );
      const valorMes = vendasMes.reduce((sum, v) => sum + parseFloat(v.valor_final || 0), 0);
      metricas.vendasMes += valorMes;

      // Vendas ano
      const vendasAno = dados.vendas.filter(v => 
        new Date(v.data_venda) >= inicioAno
      );
      const valorAno = vendasAno.reduce((sum, v) => sum + parseFloat(v.valor_final || 0), 0);
      metricas.vendasAno += valorAno;

      // Funcionários
      metricas.totalFuncionarios += dados.funcionarios.length;

      // Estoque
      const valorEstoqueLoja = dados.produtos.reduce((sum, p) => 
        sum + ((p.estoque_atual || 0) * (p.preco_venda || 0)), 0
      );
      metricas.valorEstoque += valorEstoqueLoja;

      // Resumo por loja
      metricas.resumoPorLoja[codigoLoja] = {
        nome: dados.loja.nome_loja,
        vendasHoje: valorHoje,
        vendasMes: valorMes,
        vendasAno: valorAno,
        funcionarios: dados.funcionarios.length,
        produtos: dados.produtos.length,
        valorEstoque: valorEstoqueLoja
      };
    });

    // Ranking de lojas por performance mensal
    metricas.lojasMelhorPerformance = Object.entries(metricas.resumoPorLoja)
      .sort(([,a], [,b]) => b.vendasMes - a.vendasMes)
      .slice(0, 5);

    return metricas;
  }

  /**
   * Verifica se uma loja existe e está ativa
   */
  static async verificarLojaAtiva(codigoLoja) {
    try {
      const { data, error } = await supabase
        .from('lojas_sistema')
        .select('status')
        .eq('codigo_loja', codigoLoja)
        .single();

      if (error) return false;
      return data.status === 'ativa';

    } catch (error) {
      return false;
    }
  }

  /**
   * Lista todas as tabelas de uma loja
   */
  static getTabelasLoja(codigoLoja) {
    return [
      `usuarios_${codigoLoja}`,
      `produtos_${codigoLoja}`,
      `vendas_${codigoLoja}`,
      `itens_venda_${codigoLoja}`,
      `movimentacoes_estoque_${codigoLoja}`,
      `caixa_${codigoLoja}`,
      `fechamentos_caixa_${codigoLoja}`,
      `saidas_caixa_${codigoLoja}`,
      `clientes_${codigoLoja}`,
      `dashboard_caixa_${codigoLoja}`
    ];
  }
}