const fs = require('fs');
const path = require('path');

function processarArquivo(nomeArquivo) {
  try {
    if (!fs.existsSync(nomeArquivo)) {
      throw new Error(`Arquivo não encontrado: ${nomeArquivo}`);
    }
    
    const extensao = path.extname(nomeArquivo).toLowerCase();
    let csvData;
    
    if (extensao === '.xlsx') {
      csvData = converterXLSX(nomeArquivo);
    } else if (extensao === '.csv') {
      csvData = fs.readFileSync(nomeArquivo, 'utf8');
    } else {
      throw new Error(`Formato não suportado: ${extensao}`);
    }
    
    // Processar e padronizar CSV
    const csvPadronizado = padronizarCSV(csvData);
    
    // Salvar arquivo final
    const nomeArquivoFinal = nomeArquivo.replace(/\.(xlsx|csv)$/i, '_padronizado.csv');
    fs.writeFileSync(nomeArquivoFinal, csvPadronizado, 'utf8');
    
    console.log(`✅ Arquivo padronizado: ${nomeArquivoFinal}`);
    
    // Preview
    const linhas = csvPadronizado.split('\n');
    console.log('\n📋 Preview (primeiras 4 linhas):');
    console.log(linhas.slice(0, 4).join('\n'));
    
    console.log(`\n📊 Total de registros: ${linhas.length - 1}`);
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

function converterXLSX(nomeArquivo) {
  const XLSX = require('xlsx');
  const workbook = XLSX.readFile(nomeArquivo);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  return XLSX.utils.sheet_to_csv(worksheet);
}

function padronizarCSV(csvData) {
  const linhas = csvData.trim().split('\n');
  
  const linhasPadronizadas = linhas.map((linha, index) => {
    if (index === 0) {
      // Cabeçalho - padronizar nomes
      return linha.toLowerCase()
        .replace(/\s+/g, '_')
        .replace(/[áàâã]/g, 'a')
        .replace(/[éêë]/g, 'e')
        .replace(/[íîï]/g, 'i')
        .replace(/[óôõ]/g, 'o')
        .replace(/[úûü]/g, 'u')
        .replace(/ç/g, 'c');
    }
    
    // Dados - processar campos
    const campos = linha.split(',');
    return campos.map((campo, colIndex) => {
      campo = campo.trim().replace(/^"|"$/g, '');
      
      // Coluna 'ativo' (última coluna) - padronizar booleanos
      if (colIndex === campos.length - 1) {
        const valorLower = campo.toLowerCase();
        if (['true', 'sim', 'ativo', '1', 'verdadeiro'].includes(valorLower)) {
          return 'true';
        }
        if (['false', 'não', 'nao', 'inativo', '0', 'falso'].includes(valorLower)) {
          return 'false';
        }
      }
      
      // Preços - garantir formato decimal
      if (colIndex === 5 && campo.includes('.')) { // preco_venda
        return parseFloat(campo).toFixed(2);
      }
      
      return campo;
    }).join(',');
  });
  
  return linhasPadronizadas.join('\n');
}

// Executar
const arquivo = process.argv[2];
if (!arquivo) {
  console.log('📋 Conversor Universal CSV/XLSX');
  console.log('Uso: node conversor-universal.js arquivo.csv');
  console.log('  ou: node conversor-universal.js arquivo.xlsx');
  console.log('\n✅ Suporta: .csv e .xlsx');
  console.log('✅ Padroniza: colunas, booleanos, decimais');
  process.exit(1);
}

processarArquivo(arquivo);