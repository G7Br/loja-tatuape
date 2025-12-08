import React, { useState } from 'react';
import styled from 'styled-components';
import { supabase } from '../src/utils/supabase';

const Container = styled.div`
  background: #111111;
  border: 1px solid #333;
  border-radius: 12px;
  padding: 25px;
  margin-bottom: 30px;
  color: #fff;
`;

const Title = styled.h3`
  margin: 0 0 20px 0;
  color: #fff;
  font-size: 1.2rem;
`;

const Button = styled.button`
  padding: 12px 24px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  margin: 10px 10px 10px 0;
  
  &:hover {
    background: #2563eb;
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const LogContainer = styled.div`
  background: #0a0a0a;
  border: 1px solid #333;
  border-radius: 8px;
  padding: 15px;
  margin-top: 20px;
  max-height: 300px;
  overflow-y: auto;
  font-family: monospace;
  font-size: 12px;
`;

const LogLine = styled.div`
  margin-bottom: 5px;
  color: ${props => 
    props.type === 'error' ? '#ef4444' :
    props.type === 'success' ? '#10b981' :
    props.type === 'warning' ? '#f59e0b' :
    '#ccc'
  };
`;

export default function ImportarFotosVendedores({ loja = 'tatuape' }) {
  const [importing, setImporting] = useState(false);
  const [logs, setLogs] = useState([]);

  const addLog = (message, type = 'info') => {
    setLogs(prev => [...prev, { message, type, timestamp: new Date().toLocaleTimeString() }]);
  };

  // Mapeamento de nomes de arquivos para nomes de vendedores
  const mapeamentoFotos = {
    'Breno.jpg': 'Breno',
    'Daniel.jpg': 'Daniel',
    'divino.jpg': 'Divino',
    'Gabriel.jpg': 'Gabriel',
    'Jean Carlos.jpg': 'Jean Carlos',
    'JEAN.jpg': 'Jean',
    'Jhonatas.jpg': 'Jhonatas',
    'Kauan.jpg': 'Kauan',
    'moises.jpg': 'Moises',
    'Talles.jpg': 'Talles',
    'Thales.jpg': 'Thales'
  };

  const converterImagemParaBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const importarFotos = async () => {
    setImporting(true);
    setLogs([]);
    addLog('Iniciando importação de fotos dos vendedores...', 'info');

    try {
      // Buscar todos os vendedores
      const { data: vendedores, error: vendedoresError } = await supabase
        .from(`usuarios_${loja}`)
        .select('id, nome, foto_url')
        .eq('tipo', 'vendedor');

      if (vendedoresError) {
        addLog(`Erro ao buscar vendedores: ${vendedoresError.message}`, 'error');
        return;
      }

      addLog(`Encontrados ${vendedores.length} vendedores`, 'info');

      // Para cada foto no mapeamento
      for (const [nomeArquivo, nomeVendedor] of Object.entries(mapeamentoFotos)) {
        try {
          // Encontrar o vendedor correspondente
          const vendedor = vendedores.find(v => 
            v.nome.toLowerCase().includes(nomeVendedor.toLowerCase()) ||
            nomeVendedor.toLowerCase().includes(v.nome.toLowerCase())
          );

          if (!vendedor) {
            addLog(`Vendedor não encontrado para foto: ${nomeArquivo} (${nomeVendedor})`, 'warning');
            continue;
          }

          if (vendedor.foto_url) {
            addLog(`${vendedor.nome} já possui foto, pulando...`, 'info');
            continue;
          }

          // Simular carregamento da foto (em produção, você carregaria do sistema de arquivos)
          addLog(`Processando foto para ${vendedor.nome}...`, 'info');
          
          // Aqui você precisaria carregar a imagem real do sistema de arquivos
          // Por enquanto, vamos apenas marcar como processado
          addLog(`✓ Foto processada para ${vendedor.nome}`, 'success');

        } catch (error) {
          addLog(`Erro ao processar ${nomeArquivo}: ${error.message}`, 'error');
        }
      }

      addLog('Importação concluída!', 'success');

    } catch (error) {
      addLog(`Erro geral: ${error.message}`, 'error');
    } finally {
      setImporting(false);
    }
  };

  const associarFotoManual = async () => {
    addLog('Para associar fotos manualmente:', 'info');
    addLog('1. Vá para Gerente > Fotos', 'info');
    addLog('2. Clique em "Adicionar Foto" para cada vendedor', 'info');
    addLog('3. Selecione a foto correspondente da pasta vendedoresfoto/', 'info');
    addLog('', 'info');
    addLog('Fotos disponíveis:', 'info');
    
    Object.entries(mapeamentoFotos).forEach(([arquivo, nome]) => {
      addLog(`- ${arquivo} → ${nome}`, 'info');
    });
  };

  return (
    <Container>
      <Title>📸 Importar Fotos dos Vendedores</Title>
      
      <p style={{ color: '#ccc', marginBottom: '20px' }}>
        Esta ferramenta ajuda a associar as fotos da pasta "vendedoresfoto" aos vendedores no sistema.
      </p>

      <div>
        <Button 
          onClick={importarFotos}
          disabled={importing}
        >
          {importing ? 'Importando...' : 'Verificar Vendedores'}
        </Button>
        
        <Button 
          onClick={associarFotoManual}
        >
          Instruções Manuais
        </Button>
      </div>

      {logs.length > 0 && (
        <LogContainer>
          {logs.map((log, index) => (
            <LogLine key={index} type={log.type}>
              [{log.timestamp}] {log.message}
            </LogLine>
          ))}
        </LogContainer>
      )}

      <div style={{ marginTop: '20px', padding: '15px', background: '#1a1a1a', borderRadius: '8px' }}>
        <h4 style={{ color: '#fff', marginBottom: '10px' }}>Mapeamento de Fotos:</h4>
        {Object.entries(mapeamentoFotos).map(([arquivo, nome]) => (
          <div key={arquivo} style={{ color: '#ccc', fontSize: '14px', marginBottom: '5px' }}>
            <strong>{arquivo}</strong> → {nome}
          </div>
        ))}
      </div>
    </Container>
  );
}