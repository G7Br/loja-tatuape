const fs = require('fs');

function corrigirCSV(nomeArquivo) {
  try {
    console.log(`Corrigindo arquivo: ${nomeArquivo}`);
    
    // Ler arquivo
    let conteudo = fs.readFileSync(nomeArquivo, 'utf8');
    
    // Corrigir problemas comuns
    conteudo = conteudo
      // Remover aspas desnecessárias
      .replace(/^"([^",\n]*)"(?=,|$)/gm, '$1')
      // Corrigir quebras de linha literais
      .replace(/\\n/g, '\n')
      // Remover espaços extras
      .replace(/\s*,\s*/g, ',')
      // Garantir que cada linha termine corretamente
      .replace(/,\s*$/gm, '')
      // Remover linhas vazias
      .replace(/\n\s*\n/g, '\n')
      .trim();
    
    // Dividir em linhas
    const linhas = conteudo.split('\n');
    
    // Processar cada linha
    const linhasCorrigidas = linhas.map((linha, index) => {
      if (index === 0) {
        // Cabeçalho - manter em minúsculas e sem espaços
        return linha.toLowerCase().replace(/\s+/g, '_');
      }
      
      // Dados - processar campos
      const campos = linha.split(',');
      return campos.map(campo => {
        campo = campo.trim();
        
        // Remover aspas se não necessárias
        if (campo.startsWith('"') && campo.endsWith('"') && !campo.includes(',')) {
          campo = campo.slice(1, -1);
        }
        
        // Corrigir valores booleanos
        if (campo.toLowerCase() === 'sim' || campo.toLowerCase() === 'ativo') {
          return 'true';
        }
        if (campo.toLowerCase() === 'não' || campo.toLowerCase() === 'inativo') {
          return 'false';
        }
        
        return campo;
      }).join(',');
    });
    
    // Salvar arquivo corrigido
    const nomeCorrigido = nomeArquivo.replace('.csv', '_corrigido.csv');
    fs.writeFileSync(nomeCorrigido, linhasCorrigidas.join('\n'), 'utf8');
    
    console.log(`✅ Arquivo corrigido salvo como: ${nomeCorrigido}`);
    console.log(`📊 Total de linhas: ${linhasCorrigidas.length}`);
    
    // Mostrar preview
    console.log('\n📋 Preview do arquivo corrigido:');
    console.log(linhasCorrigidas.slice(0, 4).join('\n'));
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

// Usar o script
const arquivo = process.argv[2];
if (!arquivo) {
  console.log('Uso: node corrigir-csv.js nome_do_arquivo.csv');
  process.exit(1);
}

corrigirCSV(arquivo);