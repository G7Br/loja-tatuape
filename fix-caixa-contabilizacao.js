/**
 * CORREÇÃO DO SISTEMA DE CONTABILIZAÇÃO DO CAIXA
 * 
 * Problema identificado: O sistema não está contabilizando corretamente as vendas
 * com pagamentos mistos e link de pagamento com taxa.
 * 
 * Dados do problema:
 * - Total mostrado: R$ 13.150,00
 * - Dinheiro contabilizado: R$ 8.650,00
 * - Cartões: R$ 0,00
 * - PIX: R$ 0,00
 * 
 * Vendas analisadas:
 * - Bianca merchias: R$ 1.800,00 (link_pagamento:taxa_10%)
 * - Gabriel Rafael: R$ 900,00 (dinheiro)
 * - flavio urias da silva: R$ 600,00 (dinheiro)
 * - flavio urias da silva: R$ 1.200,00 (dinheiro)
 * - Flavio urias da silva: R$ 600,00 (dinheiro)
 * - gabr: R$ 600,00 (dinheiro)
 * - Gabriel Rafael: R$ 1.000,00 (dinheiro)
 * - gabr: R$ 450,00 (dinheiro)
 * - gabriel pereira santos: R$ 600,00 (dinheiro)
 * - Gabriel Merchias: R$ 1.800,00 (dinheiro)
 * - gabriel pereira santos: R$ 2.700,00 (dinheiro:2000.00|cartao_debito:700.00)
 * - GABRIEL MERCHIAS PEREIRA: R$ 900,00 (dinheiro)
 * 
 * Total real em dinheiro: R$ 10.350,00
 * Total real em cartão débito: R$ 700,00
 * Total real em link de pagamento: R$ 1.800,00
 * Total geral: R$ 12.850,00
 */

const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase (substitua pelas suas credenciais)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Função para processar forma de pagamento corretamente
 */
function processarFormaPagamento(formaPagamento, valorFinal) {
  const resultado = {
    dinheiro: 0,
    cartao_credito: 0,
    cartao_debito: 0,
    pix: 0,
    link_pagamento: 0,
    total: valorFinal
  };

  if (!formaPagamento) {
    return resultado;
  }

  const forma = formaPagamento.toLowerCase();

  // Verificar se é pagamento misto (contém |)
  if (forma.includes('|')) {
    const formas = forma.split('|');
    formas.forEach(f => {
      const [tipo, valor] = f.split(':');
      const valorNumerico = parseFloat(valor) || 0;
      
      switch (tipo.trim()) {
        case 'dinheiro':
          resultado.dinheiro += valorNumerico;
          break;
        case 'cartao_credito':
          resultado.cartao_credito += valorNumerico;
          break;
        case 'cartao_debito':
          resultado.cartao_debito += valorNumerico;
          break;
        case 'pix':
          resultado.pix += valorNumerico;
          break;
        case 'link_pagamento':
          resultado.link_pagamento += valorNumerico;
          break;
      }
    });
  } else if (forma.includes('link_pagamento')) {
    // Link de pagamento com taxa
    if (forma.includes('taxa_')) {
      const taxaMatch = forma.match(/taxa_(\d+)%/);
      const taxa = taxaMatch ? parseFloat(taxaMatch[1]) : 0;
      // O valor final já inclui a taxa, então contabilizamos o valor total
      resultado.link_pagamento = valorFinal;
    } else {
      resultado.link_pagamento = valorFinal;
    }
  } else {
    // Pagamento simples
    switch (forma) {
      case 'dinheiro':
        resultado.dinheiro = valorFinal;
        break;
      case 'cartao_credito':
      case 'credito':
        resultado.cartao_credito = valorFinal;
        break;
      case 'cartao_debito':
      case 'debito':
        resultado.cartao_debito = valorFinal;
        break;
      case 'pix':
        resultado.pix = valorFinal;
        break;
      default:
        // Se não reconhecer, assumir como dinheiro
        resultado.dinheiro = valorFinal;
        break;
    }
  }

  return resultado;
}

/**
 * Função para recalcular totais do caixa
 */
async function recalcularTotaisCaixa(dataInicio, dataFim) {
  try {
    console.log(`🔄 Recalculando totais do caixa de ${dataInicio} até ${dataFim}...`);

    // Buscar todas as vendas do período
    const { data: vendas, error } = await supabase
      .from('vendas_tatuape')
      .select('*')
      .gte('data_venda', dataInicio)
      .lte('data_venda', dataFim + 'T23:59:59')
      .neq('forma_pagamento', 'pendente_caixa')
      .neq('status', 'cancelada');

    if (error) {
      throw error;
    }

    console.log(`📊 Encontradas ${vendas.length} vendas para processar`);

    const totais = {
      dinheiro: 0,
      cartao_credito: 0,
      cartao_debito: 0,
      pix: 0,
      link_pagamento: 0,
      total_geral: 0,
      quantidade_vendas: vendas.length
    };

    const detalhesVendas = [];

    vendas.forEach(venda => {
      const valorFinal = parseFloat(venda.valor_final || 0);
      const processamento = processarFormaPagamento(venda.forma_pagamento, valorFinal);
      
      totais.dinheiro += processamento.dinheiro;
      totais.cartao_credito += processamento.cartao_credito;
      totais.cartao_debito += processamento.cartao_debito;
      totais.pix += processamento.pix;
      totais.link_pagamento += processamento.link_pagamento;
      totais.total_geral += valorFinal;

      detalhesVendas.push({
        numero_venda: venda.numero_venda,
        cliente: venda.cliente_nome,
        vendedor: venda.vendedor_nome,
        valor: valorFinal,
        forma_pagamento: venda.forma_pagamento,
        processamento: processamento
      });
    });

    console.log('\n📋 RELATÓRIO DE CONTABILIZAÇÃO CORRIGIDA:');
    console.log('═══════════════════════════════════════════');
    console.log(`💵 Dinheiro: R$ ${totais.dinheiro.toFixed(2)}`);
    console.log(`💳 Cartão Crédito: R$ ${totais.cartao_credito.toFixed(2)}`);
    console.log(`💳 Cartão Débito: R$ ${totais.cartao_debito.toFixed(2)}`);
    console.log(`📱 PIX: R$ ${totais.pix.toFixed(2)}`);
    console.log(`🔗 Link Pagamento: R$ ${totais.link_pagamento.toFixed(2)}`);
    console.log('───────────────────────────────────────────');
    console.log(`💰 TOTAL GERAL: R$ ${totais.total_geral.toFixed(2)}`);
    console.log(`📊 Quantidade de Vendas: ${totais.quantidade_vendas}`);
    console.log('═══════════════════════════════════════════\n');

    console.log('📝 DETALHES DAS VENDAS:');
    detalhesVendas.forEach(venda => {
      console.log(`• ${venda.numero_venda} - ${venda.cliente} (${venda.vendedor})`);
      console.log(`  Valor: R$ ${venda.valor.toFixed(2)} | Forma: ${venda.forma_pagamento}`);
      console.log(`  Processado: Dinheiro R$ ${venda.processamento.dinheiro.toFixed(2)}, Cartões R$ ${(venda.processamento.cartao_credito + venda.processamento.cartao_debito).toFixed(2)}, PIX R$ ${venda.processamento.pix.toFixed(2)}, Link R$ ${venda.processamento.link_pagamento.toFixed(2)}`);
      console.log('');
    });

    return totais;

  } catch (error) {
    console.error('❌ Erro ao recalcular totais:', error);
    throw error;
  }
}

/**
 * Função para corrigir o histórico de caixa
 */
async function corrigirHistoricoCaixa(data) {
  try {
    console.log(`🔧 Corrigindo histórico de caixa para ${data}...`);

    const totais = await recalcularTotaisCaixa(data, data);

    // Atualizar ou criar registro no histórico
    const { error } = await supabase
      .from('historico_caixa_diario_tatuape')
      .upsert({
        data_operacao: data,
        vendas_dinheiro: totais.dinheiro,
        vendas_credito: totais.cartao_credito,
        vendas_debito: totais.cartao_debito,
        vendas_pix: totais.pix,
        vendas_link_pagamento: totais.link_pagamento,
        total_entradas: totais.total_geral,
        qtd_vendas_dinheiro: 0, // Será calculado separadamente se necessário
        qtd_vendas_credito: 0,
        qtd_vendas_debito: 0,
        qtd_vendas_pix: 0,
        updated_at: new Date().toISOString()
      });

    if (error) {
      throw error;
    }

    console.log('✅ Histórico de caixa corrigido com sucesso!');
    return totais;

  } catch (error) {
    console.error('❌ Erro ao corrigir histórico:', error);
    throw error;
  }
}

/**
 * Função principal para executar a correção
 */
async function executarCorrecao() {
  try {
    console.log('🚀 Iniciando correção do sistema de contabilização...\n');

    // Data do problema (30/11/2025 - ajustar conforme necessário)
    const dataProblema = '2024-11-30'; // Ajuste para a data correta

    console.log(`📅 Processando data: ${dataProblema}`);

    const totaisCorrigidos = await corrigirHistoricoCaixa(dataProblema);

    console.log('\n🎉 CORREÇÃO CONCLUÍDA COM SUCESSO!');
    console.log('\n📊 RESUMO DA CORREÇÃO:');
    console.log(`💵 Dinheiro: R$ ${totaisCorrigidos.dinheiro.toFixed(2)}`);
    console.log(`💳 Cartões: R$ ${(totaisCorrigidos.cartao_credito + totaisCorrigidos.cartao_debito).toFixed(2)}`);
    console.log(`📱 PIX: R$ ${totaisCorrigidos.pix.toFixed(2)}`);
    console.log(`🔗 Link Pagamento: R$ ${totaisCorrigidos.link_pagamento.toFixed(2)}`);
    console.log(`💰 Total: R$ ${totaisCorrigidos.total_geral.toFixed(2)}`);

  } catch (error) {
    console.error('❌ Erro na execução da correção:', error);
    process.exit(1);
  }
}

// Executar apenas se chamado diretamente
if (require.main === module) {
  executarCorrecao();
}

module.exports = {
  processarFormaPagamento,
  recalcularTotaisCaixa,
  corrigirHistoricoCaixa,
  executarCorrecao
};