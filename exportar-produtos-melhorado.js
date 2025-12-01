const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function exportarProdutos() {
  try {
    console.log('Exportando produtos...');
    
    const { data: produtos, error } = await supabase
      .from('produtos_tatuape')
      .select('*')
      .order('nome');
    
    if (error) throw error;
    
    // Cabeçalho do CSV (sem aspas desnecessárias)
    const linhas = [];
    linhas.push('codigo,nome,tipo,cor,tamanho,preco_venda,estoque_atual,estoque_minimo,ativo,data_criacao');
    
    // Dados dos produtos
    produtos.forEach(p => {
      const linha = [
        p.codigo || '',
        p.nome || '',
        p.tipo || '',
        p.cor || '',
        p.tamanho || '',
        p.preco_venda || 0,
        p.estoque_atual || 0,
        p.estoque_minimo || 0,
        p.ativo ? 'true' : 'false',
        new Date(p.created_at).toLocaleDateString('pt-BR')
      ];
      
      // Escapar campos que contenham vírgulas ou aspas
      const linhaFormatada = linha.map(campo => {
        const campoStr = String(campo);
        if (campoStr.includes(',') || campoStr.includes('"') || campoStr.includes('\n')) {
          return `"${campoStr.replace(/"/g, '""')}"`;
        }
        return campoStr;
      });
      
      linhas.push(linhaFormatada.join(','));
    });
    
    // Juntar todas as linhas com quebra de linha real
    const csvContent = linhas.join('\n');
    
    // Salvar arquivo
    const nomeArquivo = `produtos-tatuape-${new Date().toISOString().split('T')[0]}.csv`;
    fs.writeFileSync(nomeArquivo, csvContent, 'utf8');
    
    console.log(`✅ Arquivo criado: ${nomeArquivo}`);
    console.log(`📊 Total de produtos: ${produtos.length}`);
    
    // Estatísticas
    const stats = produtos.reduce((acc, p) => {
      acc.total++;
      acc.estoque += p.estoque_atual || 0;
      acc.valor += (p.estoque_atual || 0) * (p.preco_venda || 0);
      acc.tipos[p.tipo] = (acc.tipos[p.tipo] || 0) + 1;
      return acc;
    }, { total: 0, estoque: 0, valor: 0, tipos: {} });
    
    console.log(`📦 Total em estoque: ${stats.estoque} unidades`);
    console.log(`💰 Valor total: R$ ${stats.valor.toFixed(2)}`);
    console.log(`📋 Por tipo:`, stats.tipos);
    
    // Mostrar preview das primeiras 3 linhas
    console.log('\n📋 Preview do CSV:');
    console.log(linhas.slice(0, 4).join('\n'));
    
  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

exportarProdutos();