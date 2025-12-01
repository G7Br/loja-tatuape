import { supabase } from './supabase';

export async function importarArquivo(arquivo) {
  try {
    const extensao = arquivo.name.split('.').pop().toLowerCase();
    let csvData;
    
    if (extensao === 'xlsx') {
      csvData = await lerXLSX(arquivo);
    } else if (extensao === 'csv') {
      csvData = await lerCSV(arquivo);
    } else {
      throw new Error('Formato não suportado. Use .csv ou .xlsx');
    }
    
    const produtos = processarCSV(csvData);
    
    const { data, error } = await supabase
      .from('produtos_tatuape')
      .upsert(produtos, { onConflict: 'codigo' });
    
    if (error) throw error;
    
    return {
      sucesso: true,
      total: produtos.length,
      produtos
    };
    
  } catch (error) {
    return {
      sucesso: false,
      erro: error.message
    };
  }
}

async function lerXLSX(arquivo) {
  const XLSX = await import('xlsx');
  const arrayBuffer = await arquivo.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer);
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  return XLSX.utils.sheet_to_csv(worksheet);
}

async function lerCSV(arquivo) {
  return await arquivo.text();
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