// Configurações para o sistema de Black Friday
// VH Tatuapé - Sistema de Gestão

export const BLACK_FRIDAY_CONFIG = {
  // Data da Black Friday 2025
  DATA_BLACK_FRIDAY: '2025-11-29',
  
  // Horário de funcionamento
  HORARIO_INICIO: '08:00',
  HORARIO_FIM: '22:00',
  
  // Metas e objetivos
  METAS: {
    FATURAMENTO_DIA: 50000, // Meta de faturamento para o dia
    VENDAS_DIA: 100,        // Meta de número de vendas
    TICKET_MEDIO: 500       // Meta de ticket médio
  },
  
  // Cores para gráficos e visualizações
  CORES: {
    PRIMARY: '#1f2937',     // Preto/cinza escuro
    SECONDARY: '#f59e0b',   // Laranja/dourado
    SUCCESS: '#10b981',     // Verde
    WARNING: '#f59e0b',     // Amarelo/laranja
    DANGER: '#ef4444',      // Vermelho
    INFO: '#3b82f6'         // Azul
  },
  
  // Configurações de atualização
  REFRESH_INTERVAL: 30000, // 30 segundos
  
  // Queries SQL otimizadas
  QUERIES: {
    VENDAS_TEMPO_REAL: `
      SELECT 
        COUNT(*) as total_vendas,
        SUM(valor_final) as faturamento_total,
        AVG(valor_final) as ticket_medio
      FROM vendas_tatuape 
      WHERE DATE(data_venda) = $1
    `,
    
    VENDAS_POR_HORA: `
      SELECT 
        EXTRACT(HOUR FROM data_venda) as hora,
        COUNT(*) as vendas,
        SUM(valor_final) as faturamento
      FROM vendas_tatuape 
      WHERE DATE(data_venda) = $1
      GROUP BY EXTRACT(HOUR FROM data_venda)
      ORDER BY hora
    `,
    
    TOP_VENDEDORES: `
      SELECT 
        vendedor_nome,
        COUNT(*) as vendas,
        SUM(valor_final) as faturamento,
        AVG(valor_final) as ticket_medio
      FROM vendas_tatuape 
      WHERE DATE(data_venda) = $1 
        AND vendedor_nome IS NOT NULL
      GROUP BY vendedor_nome
      ORDER BY faturamento DESC
      LIMIT 10
    `,
    
    TOP_PRODUTOS: `
      SELECT 
        iv.produto_nome,
        SUM(iv.quantidade) as quantidade_total,
        SUM(iv.subtotal) as faturamento_produto,
        COUNT(DISTINCT iv.venda_id) as vendas_distintas
      FROM itens_venda_tatuape iv
      INNER JOIN vendas_tatuape v ON iv.venda_id = v.id
      WHERE DATE(v.data_venda) = $1
      GROUP BY iv.produto_nome
      ORDER BY quantidade_total DESC
      LIMIT 15
    `,
    
    FORMAS_PAGAMENTO: `
      SELECT 
        forma_pagamento,
        COUNT(*) as vendas,
        SUM(valor_final) as faturamento,
        ROUND(
          (SUM(valor_final) * 100.0 / (
            SELECT SUM(valor_final) 
            FROM vendas_tatuape 
            WHERE DATE(data_venda) = $1
          )), 2
        ) as percentual
      FROM vendas_tatuape 
      WHERE DATE(data_venda) = $1
        AND forma_pagamento IS NOT NULL
      GROUP BY forma_pagamento
      ORDER BY faturamento DESC
    `
  }
};

// Utilitários para formatação
export const formatarMoeda = (valor) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(valor || 0);
};

export const formatarPorcentagem = (valor) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
  }).format((valor || 0) / 100);
};

export const formatarNumero = (valor) => {
  return new Intl.NumberFormat('pt-BR').format(valor || 0);
};

export const formatarHora = (hora) => {
  return `${hora.toString().padStart(2, '0')}:00`;
};

// Função para calcular progresso das metas
export const calcularProgressoMetas = (dadosAtuais) => {
  const { METAS } = BLACK_FRIDAY_CONFIG;
  
  return {
    faturamento: {
      atual: dadosAtuais.faturamento_total || 0,
      meta: METAS.FATURAMENTO_DIA,
      progresso: ((dadosAtuais.faturamento_total || 0) / METAS.FATURAMENTO_DIA) * 100,
      restante: METAS.FATURAMENTO_DIA - (dadosAtuais.faturamento_total || 0)
    },
    vendas: {
      atual: dadosAtuais.total_vendas || 0,
      meta: METAS.VENDAS_DIA,
      progresso: ((dadosAtuais.total_vendas || 0) / METAS.VENDAS_DIA) * 100,
      restante: METAS.VENDAS_DIA - (dadosAtuais.total_vendas || 0)
    },
    ticketMedio: {
      atual: dadosAtuais.ticket_medio || 0,
      meta: METAS.TICKET_MEDIO,
      progresso: ((dadosAtuais.ticket_medio || 0) / METAS.TICKET_MEDIO) * 100,
      diferenca: (dadosAtuais.ticket_medio || 0) - METAS.TICKET_MEDIO
    }
  };
};

// Função para determinar cor baseada no progresso
export const getCorProgresso = (progresso) => {
  if (progresso >= 100) return BLACK_FRIDAY_CONFIG.CORES.SUCCESS;
  if (progresso >= 75) return BLACK_FRIDAY_CONFIG.CORES.WARNING;
  if (progresso >= 50) return BLACK_FRIDAY_CONFIG.CORES.INFO;
  return BLACK_FRIDAY_CONFIG.CORES.DANGER;
};

// Função para formatar forma de pagamento
export const formatarFormaPagamento = (forma) => {
  const formas = {
    'cartao_credito': 'Cartão de Crédito',
    'cartao_debito': 'Cartão de Débito',
    'pix': 'PIX',
    'dinheiro': 'Dinheiro',
    'pendente_caixa': 'Pendente Caixa'
  };
  return formas[forma] || forma;
};

// Função para gerar dados de exemplo (para testes)
export const gerarDadosExemplo = () => {
  return {
    resumoGeral: {
      totalVendas: 87,
      valorTotal: 45230.50,
      ticketMedio: 520.12
    },
    vendasPorVendedor: [
      ['Gabriel', { vendas: 23, valor: 12450.00 }],
      ['Daniel', { vendas: 19, valor: 10230.50 }],
      ['Jean', { vendas: 18, valor: 9870.00 }],
      ['Kauan', { vendas: 15, valor: 8120.00 }],
      ['Divino', { vendas: 12, valor: 4560.00 }]
    ],
    produtosMaisVendidos: [
      ['Choseman 1', { quantidade: 45, valor: 27000.00 }],
      ['Alfaiataria VH', { quantidade: 32, valor: 28800.00 }],
      ['Gravata Seda', { quantidade: 28, valor: 2800.00 }],
      ['Traspassado A', { quantidade: 15, valor: 22500.00 }]
    ],
    formasPagamento: [
      ['cartao_credito', { vendas: 35, valor: 18500.00 }],
      ['cartao_debito', { vendas: 25, valor: 12300.00 }],
      ['pix', { vendas: 20, valor: 10200.00 }],
      ['dinheiro', { vendas: 7, valor: 4230.50 }]
    ],
    vendasPorHora: [
      ['9', 3], ['10', 8], ['11', 12], ['12', 15],
      ['13', 18], ['14', 22], ['15', 25], ['16', 20],
      ['17', 18], ['18', 15], ['19', 12], ['20', 8]
    ]
  };
};

// Configurações de notificações
export const NOTIFICACOES = {
  META_ATINGIDA: {
    titulo: '🎉 Meta Atingida!',
    tipo: 'success'
  },
  VENDAS_BAIXAS: {
    titulo: '⚠️ Vendas Abaixo da Meta',
    tipo: 'warning'
  },
  ERRO_SISTEMA: {
    titulo: '❌ Erro no Sistema',
    tipo: 'error'
  }
};

export default BLACK_FRIDAY_CONFIG;