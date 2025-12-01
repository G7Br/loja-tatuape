const fs = require('fs');
const path = require('path');

// Função para processar XLSX (sem dependência externa)
function lerXLSX(nomeArquivo) {
  console.log('⚠️  Para processar arquivos XLSX, instale a dependência:');
  console.log('npm install xlsx');
  console.log('\nConvertendo XLSX para CSV...');
  
  try {
    const XLSX = require('xlsx');
    
    // Ler arquivo XLSX
    const workbook = XLSX.readFile(nomeArquivo);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Converter para CSV
    const csvData = XLSX.utils.sheet_to_csv(worksheet);
    
    // Salvar como CSV temporário
    const csvTemp = nomeArquivo.replace('.xlsx', '_temp.csv');
    fs.writeFileSync(csvTemp, csvData, 'utf8');
    
    console.log(`✅ XLSX convertido para: ${csvTemp}`);
    return csvTemp;
    
  } catch (error) {
    if (error.code === 'MODULE_NOT_FOUND') {
      console.log('❌ Dependência XLSX não encontrada. Instalando...');
      const { execSync } = require('child_process');
      try {
        execSync('npm install xlsx', { stdio: 'inherit' });
        console.log('✅ Dependência instalada. Execute novamente.');
        process.exit(0);
      } catch (installError) {
        console.log('❌ Erro ao instalar dependência. Instale manualmente: npm install xlsx');
        process.exit(1);
      }
    }
    throw error;
  }
}

// Função para processar CSV
function lerCSV(nomeArquivo) {
  console.log(`Processando CSV: ${nomeArquivo}`);
  return nomeArquivo;
}

// Função principal para processar qualquer arquivo
function processarArquivo(nomeArquivo) {
  try {
    if (!fs.existsSync(nomeArquivo)) {
      throw new Error(`Arquivo não encontrado: ${nomeArquivo}`);
    }
    
    const extensao = path.extname(nomeArquivo).toLowerCase();
    let arquivoCSV;
    
    switch (extensao) {
      case '.xlsx':
        arquivoCSV = lerXLSX(nomeArquivo);
        break;
      case '.csv':
        arquivoCSV = lerCSV(nomeArquivo);
        break;
      default:
        throw new Error(`Formato não suportado: ${extensao}. Use .csv ou .xlsx`);
    }
    
    // Processar o CSV (corrigir formatação)
    corrigirCSV(arquivoCSV);
    
    // Limpar arquivo temporário se foi criado
    if (arquivoCSV !== nomeArquivo && arquivoCSV.includes('_temp.csv')) {
      fs.unlinkSync(arquivoCSV);
      console.log('🗑️  Arquivo temporário removido');
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

// Função para corrigir CSV (reutilizada)
function corrigirCSV(nomeArquivo) {
  console.log(`Corrigindo formatação: ${nomeArquivo}`);
  
  let conteudo = fs.readFileSync(nomeArquivo, 'utf8');
  
  // Corrigir problemas comuns
  conteudo = conteudo
    .replace(/^"([^",\n]*)"(?=,|$)/gm, '$1')
    .replace(/\\n/g, '\n')
    .replace(/\s*,\s*/g, ',')
    .replace(/,\s*$/gm, '')
    .replace(/\n\s*\n/g, '\n')
    .trim();
  
  const linhas = conteudo.split('\n');
  
  const linhasCorrigidas = linhas.map((linha, index) => {
    if (index === 0) {
      return linha.toLowerCase().replace(/\s+/g, '_');
    }
    
    const campos = linha.split(',');
    return campos.map(campo => {
      campo = campo.trim();
      
      if (campo.startsWith('"') && campo.endsWith('"') && !campo.includes(',')) {
        campo = campo.slice(1, -1);
      }
      
      if (campo.toLowerCase() === 'sim' || campo.toLowerCase() === 'ativo') {
        return 'true';
      }
      if (campo.toLowerCase() === 'não' || campo.toLowerCase() === 'inativo') {
        return 'false';
      }
      
      return campo;
    }).join(',');
  });
  
  const nomeCorrigido = nomeArquivo.replace(/(_temp)?\.csv$/, '_processado.csv');
  fs.writeFileSync(nomeCorrigido, linhasCorrigidas.join('\n'), 'utf8');
  
  console.log(`✅ Arquivo processado salvo como: ${nomeCorrigido}`);
  console.log(`📊 Total de linhas: ${linhasCorrigidas.length}`);
  
  console.log('\n📋 Preview:');
  console.log(linhasCorrigidas.slice(0, 4).join('\n'));
}

// Executar script
const arquivo = process.argv[2];
if (!arquivo) {
  console.log('Uso: node processar-arquivo.js arquivo.csv');
  console.log('   ou: node processar-arquivo.js arquivo.xlsx');
  process.exit(1);
}

processarArquivo(arquivo);