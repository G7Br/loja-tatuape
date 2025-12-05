# 🛍️ Sistema Black Friday - VH Tatuapé

Sistema completo para análise e gerenciamento dos dados da Black Friday 2024.

## 📋 Componentes Criados

### 1. **Extrator de Dados Python** 
📁 `ferramentas/extrator_dados_blackfriday.py`

**Funcionalidades:**
- Extrai dados do backup SQL do Supabase
- Processa vendas, produtos, itens e usuários
- Gera relatórios em JSON e HTML
- Calcula estatísticas detalhadas

**Como usar:**
```bash
# Executar diretamente
python ferramentas/extrator_dados_blackfriday.py

# Ou usar o script batch
ferramentas/executar_extrator_blackfriday.bat
```

### 2. **Dashboard React**
📁 `src/components/DashboardBlackFriday.js`

**Funcionalidades:**
- Interface visual moderna e responsiva
- Dados em tempo real do Supabase
- Gráficos e estatísticas interativas
- Cards de resumo com métricas principais

**Componentes inclusos:**
- 📊 Resumo geral (vendas, faturamento, ticket médio)
- 👥 Performance por vendedor
- 🛒 Produtos mais vendidos
- 💳 Análise de formas de pagamento
- ⏰ Vendas por horário

### 3. **Views SQL Otimizadas**
📁 `sql/view_blackfriday_analytics.sql`

**Views criadas:**
- `vw_blackfriday_vendas` - Vendas consolidadas
- `vw_blackfriday_itens` - Itens vendidos
- `vw_blackfriday_vendedores` - Performance vendedores
- `vw_blackfriday_produtos` - Produtos mais vendidos
- `vw_blackfriday_pagamentos` - Análise pagamentos
- `vw_blackfriday_horarios` - Vendas por horário
- `vw_blackfriday_resumo` - Resumo geral

### 4. **Configurações do Sistema**
📁 `src/utils/blackfridayConfig.js`

**Inclui:**
- Configurações de metas e objetivos
- Queries SQL otimizadas
- Funções de formatação
- Utilitários para cálculos
- Dados de exemplo para testes

## 🚀 Como Implementar

### Passo 1: Executar o Extrator
```bash
cd "C:\Users\user\Desktop\GestãoVHTatuape\ferramentas"
python extrator_dados_blackfriday.py
```

### Passo 2: Criar as Views no Banco
```sql
-- Executar no Supabase SQL Editor
\i sql/view_blackfriday_analytics.sql
```

### Passo 3: Integrar o Dashboard
```javascript
// Em src/pages/index.js ou onde desejar
import DashboardBlackFriday from '../components/DashboardBlackFriday';

// Adicionar rota ou componente
<DashboardBlackFriday />
```

### Passo 4: Configurar Permissões no Supabase
```sql
-- Dar permissões para as views
GRANT SELECT ON vw_blackfriday_vendas TO authenticated;
GRANT SELECT ON vw_blackfriday_itens TO authenticated;
GRANT SELECT ON vw_blackfriday_vendedores TO authenticated;
GRANT SELECT ON vw_blackfriday_produtos TO authenticated;
GRANT SELECT ON vw_blackfriday_pagamentos TO authenticated;
GRANT SELECT ON vw_blackfriday_horarios TO authenticated;
GRANT SELECT ON vw_blackfriday_resumo TO authenticated;
```

## 📊 Dados Extraídos

### Resumo da Black Friday 2024 (29/11/2024)

**Estatísticas Principais:**
- ✅ Total de vendas processadas
- 💰 Faturamento total do dia
- 🎯 Ticket médio por venda
- 👥 Performance individual dos vendedores
- 🛒 Produtos mais vendidos
- 💳 Distribuição por forma de pagamento
- ⏰ Picos de vendas por horário

### Estrutura dos Dados

**Vendas:**
- ID da venda
- Número da venda
- Vendedor responsável
- Valor total e final
- Forma de pagamento
- Status da venda
- Dados do cliente
- Data e hora da venda

**Produtos:**
- Código e nome do produto
- Tipo, cor e tamanho
- Preço de venda
- Estoque atual
- Quantidade vendida

**Performance:**
- Vendas por vendedor
- Faturamento individual
- Ticket médio por vendedor
- Horários mais produtivos

## 🔧 Personalização

### Alterar Metas
```javascript
// Em src/utils/blackfridayConfig.js
export const BLACK_FRIDAY_CONFIG = {
  METAS: {
    FATURAMENTO_DIA: 50000, // Alterar meta de faturamento
    VENDAS_DIA: 100,        // Alterar meta de vendas
    TICKET_MEDIO: 500       // Alterar meta de ticket médio
  }
};
```

### Adicionar Novos Gráficos
```javascript
// No componente DashboardBlackFriday.js
// Adicionar novos cards ou visualizações
```

### Customizar Cores
```javascript
// Em src/utils/blackfridayConfig.js
CORES: {
  PRIMARY: '#1f2937',     // Cor principal
  SECONDARY: '#f59e0b',   // Cor secundária
  SUCCESS: '#10b981',     // Verde (sucesso)
  WARNING: '#f59e0b',     // Amarelo (aviso)
  DANGER: '#ef4444',      // Vermelho (erro)
  INFO: '#3b82f6'         // Azul (informação)
}
```

## 📈 Relatórios Disponíveis

### 1. Relatório HTML Interativo
- Visualização completa no navegador
- Gráficos e tabelas formatadas
- Exportável para PDF

### 2. Dados JSON Estruturados
- Formato para integração com outros sistemas
- Dados brutos para análises customizadas
- API-friendly

### 3. Consultas SQL Diretas
```sql
-- Exemplos de consultas úteis

-- Resumo geral
SELECT * FROM vw_blackfriday_resumo;

-- Top 5 vendedores
SELECT vendedor_nome, total_vendas, faturamento_total 
FROM vw_blackfriday_vendedores 
LIMIT 5;

-- Produtos mais vendidos
SELECT produto_nome, quantidade_total, faturamento_produto 
FROM vw_blackfriday_produtos 
LIMIT 10;

-- Vendas por horário
SELECT hora_venda, total_vendas, faturamento_total 
FROM vw_blackfriday_horarios 
ORDER BY hora_venda;
```

## 🔄 Atualizações Automáticas

O dashboard atualiza automaticamente a cada 30 segundos para mostrar dados em tempo real.

Para alterar o intervalo:
```javascript
// Em src/utils/blackfridayConfig.js
REFRESH_INTERVAL: 30000, // Alterar para o intervalo desejado em ms
```

## 🎯 Próximos Passos

1. **Integrar ao Menu Principal**
   - Adicionar link no menu de navegação
   - Criar ícone específico para Black Friday

2. **Notificações em Tempo Real**
   - Alertas quando metas são atingidas
   - Notificações de performance baixa

3. **Exportação de Relatórios**
   - Gerar PDFs automaticamente
   - Envio por email para gestores

4. **Comparativo com Anos Anteriores**
   - Análise histórica
   - Crescimento year-over-year

## 🆘 Suporte

Para dúvidas ou problemas:

1. Verificar logs do console do navegador
2. Confirmar conexão com Supabase
3. Validar permissões das views SQL
4. Testar queries diretamente no SQL Editor

## 📝 Notas Importantes

- ⚠️ **Backup**: Sempre fazer backup antes de executar scripts SQL
- 🔒 **Segurança**: Views criadas respeitam permissões do Supabase
- 📊 **Performance**: Queries otimizadas para grandes volumes de dados
- 🔄 **Compatibilidade**: Sistema compatível com estrutura atual do banco

---

**Desenvolvido para VH Tatuapé - Sistema de Gestão Black Friday 2024** 🛍️