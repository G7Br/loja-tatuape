# Sistema de Caixa Diário - VH Alfaiataria Tatuapé

## Visão Geral

Sistema completo de controle de caixa com fluxo diário que zera automaticamente a cada dia, mantendo todo o histórico de operações.

## Fluxo Diário Completo

### 1. **Abertura do Caixa** 🔓
- **Quando**: Início do dia de trabalho
- **Ação**: Definir valor inicial em dinheiro
- **Sistema**: Cria registro na tabela `fechamentos_caixa_tatuape`
- **Status**: Caixa fica "aberto" para operações

### 2. **Operações Durante o Dia** 💰

#### Vendas
- Vendedores criam vendas com status "pendente_caixa"
- Caixa finaliza pagamentos (dinheiro, cartão, PIX)
- Sistema registra automaticamente em `caixa_tatuape`
- Controla troco para pagamentos em dinheiro

#### Entradas e Saídas
- **Entradas**: Vendas finalizadas
- **Saídas**: Registradas manualmente (compras, pagamentos, etc.)
- Todas movimentações ficam registradas com data/hora

### 3. **Relatório de Fechamento** 📄
- **Quando**: Antes de fechar o caixa
- **Conteúdo**:
  - Valor inicial
  - Vendas por forma de pagamento
  - Total de entradas e saídas
  - Saldo final calculado
  - Dinheiro que deve ter em caixa
  - Estatísticas do dia

### 4. **Fechamento do Caixa** 🔒
- **Ação**: Marca caixa como "fechado"
- **Sistema**: Preserva todo histórico
- **Resultado**: Caixa pronto para novo dia

## Como Usar

### Para Operadores de Caixa

1. **Início do Dia**:
   - Acesse "Controle de Caixa"
   - Clique "Abrir Caixa"
   - Informe valor inicial em dinheiro

2. **Durante o Dia**:
   - Finalize vendas pendentes
   - Registre saídas quando necessário
   - Monitore resumo em tempo real

3. **Final do Dia**:
   - Gere relatório de fechamento
   - Confira valores físicos
   - Feche o caixa

## Vantagens do Sistema

### 🔄 **Fluxo Diário Limpo**
- Cada dia inicia zerado
- Sem acúmulo de valores antigos
- Controle independente por operador

### 📊 **Relatórios Detalhados**
- Informações completas e precisas
- Cálculos automáticos
- Formato profissional para impressão

### 🔒 **Segurança e Auditoria**
- Todo histórico preservado
- Rastreabilidade completa
- Controle de acesso por usuário

### 💰 **Controle Financeiro Preciso**
- Separação por forma de pagamento
- Controle de troco
- Cálculo automático de saldos