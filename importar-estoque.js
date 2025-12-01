const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

function lerArquivo(nomeArquivo) {
  const extensao = path.extname(nomeArquivo).toLowerCase();
  
  if (extensao === '.xlsx') {
    const XLSX = require('xlsx');
    const workbook = XLSX.readFile(nomeArquivo);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    return XLSX.utils.sheet_to_csv(worksheet);
  } else {
    return fs.readFileSync(nomeArquivo, 'utf8');
  }
}

function processarCSV(csvData) {
  const linhas = csvData.trim().split('\n');
  const produtos = [];
  
  for (let i = 1; i < linhas.length; i++) {
    const campos = linhas[i].split(',').map(c => c.trim().replace(/^"|"$/g, ''));
    
    if (campos.length >= 9) {
      produtos.push({
        codigo: campos[0],
        nome: campos[1],
        tipo: campos[2],
        cor: campos[3],
        tamanho: campos[4],
        preco_venda: parseFloat(campos[5]) || 0,
        estoque_atual: parseInt(campos[6]) || 0,
        estoque_minimo: parseInt(campos[7]) || 5,
        ativo: ['true', 'sim', 'ativo'].includes(campos[8].toLowerCase())
      });
    }
  }
  
  return produtos;
}

async function importarEstoque(nomeArquivo) {
  try {
    console.log(`Importando: ${nomeArquivo}`);
    
    const csvData = lerArquivo(nomeArquivo);
    const produtos = processarCSV(csvData);
    
    console.log(`📦 ${produtos.length} produtos encontrados`);
    
    const { data, error } = await supabase
      .from('produtos_tatuape')
      .upsert(produtos, { onConflict: 'codigo' });
    
    if (error) throw error;
    
    console.log('✅ Produtos importados com sucesso!');
    
    // Estatísticas
    const stats = produtos.reduce((acc, p) => {
      acc.total++;
      acc.estoque += p.estoque_atual;
      acc.valor += p.estoque_atual * p.preco_venda;
      return acc;
    }, { total: 0, estoque: 0, valor: 0 });
    
    console.log(`📊 Total: ${stats.total} produtos`);
    console.log(`📦 Estoque: ${stats.estoque} unidades`);
    console.log(`💰 Valor: R$ ${stats.valor.toFixed(2)}`);
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

const arquivo = process.argv[2];
if (!arquivo) {
  console.log('Uso: node importar-estoque.js arquivo.xlsx');
  console.log('  ou: node importar-estoque.js arquivo.csv');
  process.exit(1);
}

importarEstoque(arquivo);