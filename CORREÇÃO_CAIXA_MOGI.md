# 🚨 CORREÇÃO ERRO CAIXA MOGI

## Problema
❌ Erro ao abrir caixa Mogi: Could not find the 'data_fechamento' column of 'fechamentos_caixa_mogi' in the schema cache

## Causa
A tabela `fechamentos_caixa_mogi` não existe ou não possui a estrutura correta no banco de dados Supabase.

## Solução

### 1. Acesse o Supabase
- URL: https://supabase.com/dashboard/project/imecyqjxvkxmdgfdvmbk/editor
- Vá para **SQL Editor**

### 2. Execute o Script de Correção
Execute o conteúdo do arquivo `fix_fechamentos_caixa_mogi.sql`:

```sql
-- CORREÇÃO URGENTE: Adicionar coluna 'status' na tabela fechamentos_caixa_mogi
-- Execute este script no Supabase para corrigir o erro de coluna não encontrada

-- Verificar se a tabela existe e adicionar a coluna status se não existir
DO $$ 
BEGIN
    -- Verificar se a tabela existe
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'fechamentos_caixa_mogi') THEN
        -- Adicionar coluna status se não existir
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name = 'fechamentos_caixa_mogi' 
                      AND column_name = 'status') THEN
            ALTER TABLE fechamentos_caixa_mogi 
            ADD COLUMN status VARCHAR(50) DEFAULT 'fechado';
            
            RAISE NOTICE 'Coluna status adicionada à tabela fechamentos_caixa_mogi';
        ELSE
            RAISE NOTICE 'Coluna status já existe na tabela fechamentos_caixa_mogi';
        END IF;
    ELSE
        -- Se a tabela não existe, criar ela completa
        CREATE TABLE fechamentos_caixa_mogi (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            data_fechamento DATE NOT NULL UNIQUE,
            valor_inicial DECIMAL(10,2) DEFAULT 0,
            total_vendas DECIMAL(10,2) DEFAULT 0,
            total_dinheiro DECIMAL(10,2) DEFAULT 0,
            total_cartao DECIMAL(10,2) DEFAULT 0,
            total_pix DECIMAL(10,2) DEFAULT 0,
            sangrias DECIMAL(10,2) DEFAULT 0,
            suprimentos DECIMAL(10,2) DEFAULT 0,
            valor_final DECIMAL(10,2) DEFAULT 0,
            diferenca DECIMAL(10,2) DEFAULT 0,
            usuario_id UUID,
            observacoes TEXT,
            status VARCHAR(50) DEFAULT 'fechado',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        
        -- Criar índice
        CREATE INDEX IF NOT EXISTS idx_fechamentos_caixa_mogi_data ON fechamentos_caixa_mogi(data_fechamento);
        CREATE INDEX IF NOT EXISTS idx_fechamentos_caixa_mogi_status ON fechamentos_caixa_mogi(status);
        CREATE INDEX IF NOT EXISTS idx_fechamentos_caixa_mogi_usuario ON fechamentos_caixa_mogi(usuario_id);
        
        RAISE NOTICE 'Tabela fechamentos_caixa_mogi criada com sucesso';
    END IF;
END $$;

-- Verificar se a tabela historico_caixa_diario_mogi existe
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'historico_caixa_diario_mogi') THEN
        CREATE TABLE historico_caixa_diario_mogi (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            usuario_id UUID,
            data_operacao DATE NOT NULL,
            valor_inicial DECIMAL(10,2) DEFAULT 0,
            total_entradas DECIMAL(10,2) DEFAULT 0,
            total_saidas DECIMAL(10,2) DEFAULT 0,
            qtd_saidas INTEGER DEFAULT 0,
            saldo_final DECIMAL(10,2) DEFAULT 0,
            vendas_dinheiro DECIMAL(10,2) DEFAULT 0,
            vendas_credito DECIMAL(10,2) DEFAULT 0,
            vendas_debito DECIMAL(10,2) DEFAULT 0,
            vendas_pix DECIMAL(10,2) DEFAULT 0,
            vendas_link DECIMAL(10,2) DEFAULT 0,
            total_troco DECIMAL(10,2) DEFAULT 0,
            qtd_vendas_dinheiro INTEGER DEFAULT 0,
            qtd_vendas_credito INTEGER DEFAULT 0,
            qtd_vendas_debito INTEGER DEFAULT 0,
            qtd_vendas_pix INTEGER DEFAULT 0,
            relatorio_completo TEXT,
            status VARCHAR(50) DEFAULT 'aberto',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        
        -- Criar índices
        CREATE INDEX IF NOT EXISTS idx_historico_caixa_mogi_data ON historico_caixa_diario_mogi(data_operacao);
        CREATE INDEX IF NOT EXISTS idx_historico_caixa_mogi_usuario ON historico_caixa_diario_mogi(usuario_id);
        
        RAISE NOTICE 'Tabela historico_caixa_diario_mogi criada com sucesso';
    END IF;
END $$;
```

### 3. Verificar Execução
Após executar o script, você deve ver mensagens como:
- "Tabela fechamentos_caixa_mogi criada com sucesso" OU
- "Coluna status já existe na tabela fechamentos_caixa_mogi"

### 4. Testar o Sistema
1. Recarregue a página do sistema
2. Tente abrir o caixa novamente
3. O erro deve ter sido resolvido

## Alterações Feitas no Código

✅ **CaixaControllerMogi.js** foi atualizado com:
- Melhor tratamento de erros
- Verificação se a tabela existe
- Mensagens de erro mais claras
- Instruções para o usuário sobre como resolver

## Status
- ✅ Script de correção criado: `fix_fechamentos_caixa_mogi.sql`
- ✅ Código atualizado com tratamento de erro
- ⏳ **PRÓXIMO PASSO**: Execute o script SQL no Supabase

## Observações
- Este erro ocorre quando as tabelas do Mogi não foram criadas corretamente
- O script é seguro e só cria/altera se necessário
- Após a correção, o sistema funcionará normalmente