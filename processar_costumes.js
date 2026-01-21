const XLSX = require('xlsx');
const fs = require('fs');

// Ler o arquivo Excel existente
const workbook = XLSX.readFile('COSTUMES TETELESTAI - APP (1).xlsx');
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];

// Converter para JSON para análise
const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

console.log('Dados encontrados no arquivo:');
console.log('Cabeçalhos:', jsonData[0]);
console.log('Total de linhas:', jsonData.length);
console.log('Primeiras 5 linhas:');
jsonData.slice(0, 5).forEach((row, index) => {
  console.log(`Linha ${index}:`, row);
});

// Criar estrutura padronizada
const produtosFormatados = [];
const headers = jsonData[0];

for (let i = 1; i < jsonData.length; i++) {
  const row = jsonData[i];
  if (row && row.length > 0) {
    // Mapear dados para estrutura padrão
    const produto = {
      codigo: row[0] || `PROD${String(i).padStart(3, '0')}`,
      nome: row[1] || 'Produto sem nome',
      tipo: row[2] || 'Geral',
      cor: row[3] || 'Não especificada',
      tamanho: row[4] || 'Único',
      preco_venda: parseFloat(row[5]) || 0,
      estoque_atual: parseInt(row[6]) || 0,
      estoque_minimo: parseInt(row[7]) || 5,
      ativo: row[8] !== false && row[8] !== 'false' && row[8] !== 'inativo'
    };
    produtosFormatados.push(produto);
  }
}

// Criar CSV formatado
const csvHeaders = 'codigo,nome,tipo,cor,tamanho,preco_venda,estoque_atual,estoque_minimo,ativo';
const csvRows = produtosFormatados.map(produto => 
  `${produto.codigo},"${produto.nome}","${produto.tipo}","${produto.cor}","${produto.tamanho}",${produto.preco_venda},${produto.estoque_atual},${produto.estoque_minimo},${produto.ativo}`
);

const csvContent = [csvHeaders, ...csvRows].join('\n');

// Salvar CSV formatado
fs.writeFileSync('COSTUMES_TETELESTAI_FORMATADO.csv', csvContent, 'utf8');

// Criar Excel formatado
const newWorkbook = XLSX.utils.book_new();
const newWorksheet = XLSX.utils.json_to_sheet(produtosFormatados);
XLSX.utils.book_append_sheet(newWorkbook, newWorksheet, 'Produtos');
XLSX.writeFile(newWorkbook, 'COSTUMES_TETELESTAI_FORMATADO.xlsx');

console.log('\nArquivos criados:');
console.log('- COSTUMES_TETELESTAI_FORMATADO.csv');
console.log('- COSTUMES_TETELESTAI_FORMATADO.xlsx');
console.log(`Total de produtos processados: ${produtosFormatados.length}`);