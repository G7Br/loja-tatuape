# CONFIGURAÇÃO DOS PROJETOS SUPABASE

## Projeto Tatuapé
- **URL**: https://supabase.com/dashboard/project/cuukvbdlzzksaxyjielo
- **Supabase URL**: https://cuukvbdlzzksaxyjielo.supabase.co
- **Responsabilidade**: 
  - Dados operacionais da loja Tatuapé
  - **TODAS as tabelas financeiras centralizadas**
  - Sistema de auditoria
  - Controle de pagamentos de funcionários

## Projeto Mogi
- **URL**: https://supabase.com/dashboard/project/imecyqjxvkxmdgfdvmbk  
- **Supabase URL**: https://imecyqjxvkxmdgfdvmbk.supabase.co
- **Responsabilidade**:
  - Dados operacionais da loja Mogi
  - Apenas usuário financeiro para autenticação

## Arquitetura do Sistema Financeiro

```
┌─────────────────────────────────────────────────────────────┐
│                    SISTEMA FINANCEIRO                       │
│                   (Usuário Financeiro)                     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  PROJETO TATUAPÉ                            │
│              (Banco Centralizado)                          │
│                                                             │
│  ✅ Tabelas Financeiras:                                   │
│     • pagamentos_funcionarios                              │
│     • lancamentos_financeiros                              │
│     • fechamentos_financeiros                              │
│     • auditoria_financeira                                 │
│     • metas_financeiras                                    │
│                                                             │
│  ✅ Dados Operacionais Tatuapé:                           │
│     • vendas_tatuape                                       │
│     • usuarios_tatuape                                     │
│     • produtos_tatuape                                     │
│     • caixa_tatuape                                        │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ (Consulta dados Mogi)
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    PROJETO MOGI                            │
│               (Dados Operacionais)                         │
│                                                             │
│  ✅ Dados Operacionais Mogi:                              │
│     • vendas_mogi                                          │
│     • usuarios_mogi                                        │
│     • produtos_mogi                                        │
│     • caixa_mogi                                           │
│                                                             │
│  ✅ Usuário Financeiro:                                   │
│     • financeiro@vh.com (para autenticação)               │
└─────────────────────────────────────────────────────────────┘
```

## Fluxo de Dados

1. **Login**: Usuário financeiro pode logar em qualquer projeto
2. **Redirecionamento**: Sistema redireciona para `/financeiro`
3. **Dados Operacionais**: 
   - Tatuapé: Busca direto no projeto Tatuapé
   - Mogi: Busca no projeto Mogi via `supabaseMogi`
4. **Dados Financeiros**: Sempre no projeto Tatuapé (centralizado)
5. **Consolidação**: Frontend consolida dados de ambos os projetos

## Vantagens desta Arquitetura

✅ **Centralização Financeira**: Todos os dados financeiros em um só lugar  
✅ **Auditoria Unificada**: Log único de todas as operações  
✅ **Backup Simplificado**: Dados críticos em um projeto  
✅ **Segurança**: Controle de acesso centralizado  
✅ **Performance**: Menos conexões para dados financeiros  
✅ **Manutenção**: Easier para gerenciar tabelas financeiras  

## Implementação

### 1. Execute no Projeto Tatuapé:
```sql
-- Execute: database/financeiro_tatuape.sql
```

### 2. Execute no Projeto Mogi:
```sql  
-- Execute: database/financeiro_mogi.sql
```

### 3. Configure as URLs no código:
```javascript
// src/utils/supabase.js já configurado com as URLs corretas
const supabaseUrlTatuape = 'https://cuukvbdlzzksaxyjielo.supabase.co';
const supabaseUrlMogi = 'https://imecyqjxvkxmdgfdvmbk.supabase.co';
```

### 4. Teste o sistema:
```
Login: financeiro@vh.com
Senha: 123456
URL: /financeiro
```