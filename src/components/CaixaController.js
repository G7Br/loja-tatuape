import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { supabase } from '../utils/supabase';

const Container = styled.div`
  padding: 2rem;
  background: ${props => props.darkMode ? '#1a1a1a' : '#ffffff'};
  border-radius: 1rem;
  border: 1px solid ${props => props.darkMode ? '#333' : '#e5e7eb'};
`;

const StatusCard = styled.div`
  padding: 1.5rem;
  border-radius: 0.75rem;
  margin-bottom: 2rem;
  text-align: center;
  background: ${props => props.status === 'aberto' ? '#10b981' : '#ef4444'};
  color: white;
`;

const ActionButton = styled.button`
  padding: 0.75rem 1.5rem;
  margin: 0.5rem;
  border: none;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ResumoCard = styled.div`
  background: ${props => props.darkMode ? '#2a2a2a' : '#f8f9fa'};
  border-radius: 0.75rem;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
`;

const GridResumo = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
`;

const ItemResumo = styled.div`
  text-align: center;
  padding: 1rem;
  background: ${props => props.darkMode ? '#333' : '#ffffff'};
  border-radius: 0.5rem;
  border: 1px solid ${props => props.darkMode ? '#444' : '#e5e7eb'};
`;

export default function CaixaController({ user, darkMode }) {
  const [caixaStatus, setCaixaStatus] = useState('fechado');
  const [valorInicial, setValorInicial] = useState(0);
  const [resumoDia, setResumoDia] = useState({
    valor_inicial: 0,
    total_entradas: 0,
    total_saidas: 0,
    saldo_final: 0,
    vendas_dinheiro: 0,
    vendas_credito: 0,
    vendas_debito: 0,
    vendas_pix: 0,
    total_troco: 0,
    qtd_vendas_dinheiro: 0,
    qtd_vendas_credito: 0,
    qtd_vendas_debito: 0,
    qtd_vendas_pix: 0
  });
  const [showRelatorio, setShowRelatorio] = useState(false);
  const [relatorioCompleto, setRelatorioCompleto] = useState('');

  useEffect(() => {
    verificarStatusCaixa();
    carregarResumoDia();
  }, []);

  const verificarStatusCaixa = async () => {
    try {
      const hoje = new Date().toISOString().split('T')[0];
      
      const { data } = await supabase
        .from('fechamentos_caixa_tatuape')
        .select('*')
        .eq('usuario_id', user.id)
        .eq('data_fechamento', hoje)
        .eq('status', 'aberto')
        .single();
      
      if (data) {
        setCaixaStatus('aberto');
        setValorInicial(data.valor_inicial || 0);
      } else {
        setCaixaStatus('fechado');
      }
    } catch (error) {
      setCaixaStatus('fechado');
    }
  };

  const carregarResumoDia = async () => {
    try {
      const hoje = new Date().toISOString().split('T')[0];
      
      // Usar a função do banco para calcular o resumo
      const { data, error } = await supabase
        .rpc('calcular_saldo_caixa_diario', {
          p_usuario_id: user.id,
          p_data: hoje
        });

      if (error) throw error;

      if (data && data.length > 0) {
        const resumo = data[0];
        setResumoDia({
          valor_inicial: parseFloat(resumo.valor_inicial || 0),
          total_entradas: parseFloat(resumo.total_entradas || 0),
          total_saidas: parseFloat(resumo.total_saidas || 0),
          saldo_final: parseFloat(resumo.saldo_final || 0),
          vendas_dinheiro: parseFloat(resumo.vendas_dinheiro || 0),
          vendas_credito: parseFloat(resumo.vendas_credito || 0),
          vendas_debito: parseFloat(resumo.vendas_debito || 0),
          vendas_pix: parseFloat(resumo.vendas_pix || 0),
          total_troco: parseFloat(resumo.total_troco || 0),
          qtd_vendas_dinheiro: parseInt(resumo.qtd_vendas_dinheiro || 0),
          qtd_vendas_credito: parseInt(resumo.qtd_vendas_credito || 0),
          qtd_vendas_debito: parseInt(resumo.qtd_vendas_debito || 0),
          qtd_vendas_pix: parseInt(resumo.qtd_vendas_pix || 0)
        });
      }
    } catch (error) {
      console.error('Erro ao carregar resumo:', error);
    }
  };

  const abrirCaixa = async () => {
    const valor = prompt('Valor inicial no caixa (R$):');
    if (valor === null) return;

    const valorNumerico = parseFloat(valor) || 0;
    
    try {
      const hoje = new Date().toISOString().split('T')[0];
      
      const { error } = await supabase
        .from('fechamentos_caixa_tatuape')
        .insert({
          usuario_id: user.id,
          data_fechamento: hoje,
          valor_inicial: valorNumerico,
          status: 'aberto'
        });
      
      if (error) throw error;
      
      setCaixaStatus('aberto');
      setValorInicial(valorNumerico);
      await carregarResumoDia();
      
      alert(`✅ Caixa aberto com valor inicial de R$ ${valorNumerico.toFixed(2)}`);
    } catch (error) {
      alert('❌ Erro ao abrir caixa: ' + error.message);
    }
  };

  const gerarRelatorio = async () => {
    try {
      const hoje = new Date().toLocaleDateString('pt-BR');
      const agora = new Date().toLocaleString('pt-BR');
      
      const relatorio = `
=== RELATÓRIO DE FECHAMENTO DE CAIXA ===
Data: ${hoje}
Horário: ${agora}
Operador: ${user.nome}

--- RESUMO FINANCEIRO ---
💰 Valor Inicial: R$ ${resumoDia.valor_inicial.toFixed(2)}

--- VENDAS POR FORMA DE PAGAMENTO ---
💵 DINHEIRO:
  • Quantidade: ${resumoDia.qtd_vendas_dinheiro} vendas
  • Total Recebido: R$ ${(resumoDia.vendas_dinheiro + resumoDia.total_troco).toFixed(2)}
  • Troco Dado: R$ ${resumoDia.total_troco.toFixed(2)}
  • Líquido: R$ ${resumoDia.vendas_dinheiro.toFixed(2)}

💳 CARTÃO CRÉDITO:
  • Quantidade: ${resumoDia.qtd_vendas_credito} vendas
  • Total: R$ ${resumoDia.vendas_credito.toFixed(2)}

💳 CARTÃO DÉBITO:
  • Quantidade: ${resumoDia.qtd_vendas_debito} vendas
  • Total: R$ ${resumoDia.vendas_debito.toFixed(2)}

📱 PIX:
  • Quantidade: ${resumoDia.qtd_vendas_pix} vendas
  • Total: R$ ${resumoDia.vendas_pix.toFixed(2)}

--- MOVIMENTAÇÕES ---
📈 Total de Entradas: R$ ${resumoDia.total_entradas.toFixed(2)}
📉 Total de Saídas: R$ ${resumoDia.total_saidas.toFixed(2)}

--- RESULTADO FINAL ---
💰 Saldo Final: R$ ${resumoDia.saldo_final.toFixed(2)}

--- DINHEIRO EM CAIXA ---
💵 Dinheiro que deve ter: R$ ${(resumoDia.valor_inicial + resumoDia.vendas_dinheiro - resumoDia.total_saidas).toFixed(2)}

--- OBSERVAÇÕES ---
• Total de vendas realizadas: ${resumoDia.qtd_vendas_dinheiro + resumoDia.qtd_vendas_credito + resumoDia.qtd_vendas_debito + resumoDia.qtd_vendas_pix}
• Maior concentração em: ${getMaiorFormaPagamento()}
• Status: Caixa ${caixaStatus}

=== FIM DO RELATÓRIO ===
      `.trim();

      setRelatorioCompleto(relatorio);
      setShowRelatorio(true);

      // Salvar relatório no histórico
      const hoje_iso = new Date().toISOString().split('T')[0];
      await supabase
        .from('historico_caixa_diario_tatuape')
        .upsert({
          usuario_id: user.id,
          data_operacao: hoje_iso,
          relatorio_completo: relatorio,
          ...resumoDia
        });

    } catch (error) {
      alert('❌ Erro ao gerar relatório: ' + error.message);
    }
  };

  const getMaiorFormaPagamento = () => {
    const formas = [
      { nome: 'Dinheiro', valor: resumoDia.vendas_dinheiro },
      { nome: 'Crédito', valor: resumoDia.vendas_credito },
      { nome: 'Débito', valor: resumoDia.vendas_debito },
      { nome: 'PIX', valor: resumoDia.vendas_pix }
    ];
    
    const maior = formas.reduce((prev, current) => 
      prev.valor > current.valor ? prev : current
    );
    
    return maior.nome;
  };

  const fecharCaixa = async () => {
    if (!confirm('⚠️ ATENÇÃO: Deseja realmente fechar o caixa?\n\nCertifique-se de ter gerado o relatório antes de fechar!')) {
      return;
    }

    try {
      const hoje = new Date().toISOString().split('T')[0];
      
      // Atualizar status para fechado
      const { error } = await supabase
        .from('fechamentos_caixa_tatuape')
        .update({ 
          status: 'fechado',
          fechado_em: new Date().toISOString(),
          relatorio_gerado: true
        })
        .eq('usuario_id', user.id)
        .eq('data_fechamento', hoje);
      
      if (error) throw error;
      
      // Atualizar histórico
      await supabase
        .from('historico_caixa_diario_tatuape')
        .update({ status: 'fechado' })
        .eq('usuario_id', user.id)
        .eq('data_operacao', hoje);
      
      setCaixaStatus('fechado');
      alert('✅ Caixa fechado com sucesso!\n\nO histórico foi mantido e o caixa está pronto para ser aberto no próximo dia.');
      
    } catch (error) {
      alert('❌ Erro ao fechar caixa: ' + error.message);
    }
  };

  const gerarPDF = async () => {
    try {
      // Importar jsPDF dinamicamente
      const { jsPDF } = await import('jspdf');
      
      const doc = new jsPDF();
      const hoje = new Date().toLocaleDateString('pt-BR');
      const agora = new Date().toLocaleTimeString('pt-BR');
      
      // Configurar fonte
      doc.setFont('helvetica');
      
      // Cabeçalho
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('RELATÓRIO DE FECHAMENTO DE CAIXA', 20, 20);
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(`Data: ${hoje}`, 20, 35);
      doc.text(`Horário: ${agora}`, 20, 45);
      doc.text(`Operador: ${user.nome}`, 20, 55);
      
      // Linha separadora
      doc.line(20, 65, 190, 65);
      
      // Resumo Financeiro
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('RESUMO FINANCEIRO', 20, 80);
      
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text(`Valor Inicial: R$ ${resumoDia.valor_inicial.toFixed(2)}`, 20, 95);
      
      // Vendas por forma de pagamento
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('VENDAS POR FORMA DE PAGAMENTO', 20, 115);
      
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      
      let yPos = 130;
      
      // Dinheiro
      doc.setFont('helvetica', 'bold');
      doc.text('DINHEIRO:', 20, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(`Quantidade: ${resumoDia.qtd_vendas_dinheiro} vendas`, 25, yPos + 10);
      doc.text(`Total Recebido: R$ ${(resumoDia.vendas_dinheiro + resumoDia.total_troco).toFixed(2)}`, 25, yPos + 20);
      doc.text(`Troco Dado: R$ ${resumoDia.total_troco.toFixed(2)}`, 25, yPos + 30);
      doc.text(`Líquido: R$ ${resumoDia.vendas_dinheiro.toFixed(2)}`, 25, yPos + 40);
      
      yPos += 55;
      
      // Cartão Crédito
      doc.setFont('helvetica', 'bold');
      doc.text('CARTÃO CRÉDITO:', 20, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(`Quantidade: ${resumoDia.qtd_vendas_credito} vendas`, 25, yPos + 10);
      doc.text(`Total: R$ ${resumoDia.vendas_credito.toFixed(2)}`, 25, yPos + 20);
      
      yPos += 35;
      
      // Cartão Débito
      doc.setFont('helvetica', 'bold');
      doc.text('CARTÃO DÉBITO:', 20, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(`Quantidade: ${resumoDia.qtd_vendas_debito} vendas`, 25, yPos + 10);
      doc.text(`Total: R$ ${resumoDia.vendas_debito.toFixed(2)}`, 25, yPos + 20);
      
      yPos += 35;
      
      // PIX
      doc.setFont('helvetica', 'bold');
      doc.text('PIX:', 20, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(`Quantidade: ${resumoDia.qtd_vendas_pix} vendas`, 25, yPos + 10);
      doc.text(`Total: R$ ${resumoDia.vendas_pix.toFixed(2)}`, 25, yPos + 20);
      
      yPos += 40;
      
      // Movimentações
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('MOVIMENTAÇÕES', 20, yPos);
      
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text(`Total de Entradas: R$ ${resumoDia.total_entradas.toFixed(2)}`, 20, yPos + 15);
      doc.text(`Total de Saídas: R$ ${resumoDia.total_saidas.toFixed(2)}`, 20, yPos + 25);
      
      yPos += 40;
      
      // Resultado Final
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('RESULTADO FINAL', 20, yPos);
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(`Saldo Final: R$ ${resumoDia.saldo_final.toFixed(2)}`, 20, yPos + 15);
      
      yPos += 30;
      
      // Dinheiro em Caixa
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text(`Dinheiro que deve ter: R$ ${(resumoDia.valor_inicial + resumoDia.vendas_dinheiro - resumoDia.total_saidas).toFixed(2)}`, 20, yPos);
      
      yPos += 20;
      
      // Observações
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('OBSERVAÇÕES', 20, yPos);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const totalVendas = resumoDia.qtd_vendas_dinheiro + resumoDia.qtd_vendas_credito + resumoDia.qtd_vendas_debito + resumoDia.qtd_vendas_pix;
      doc.text(`Total de vendas realizadas: ${totalVendas}`, 20, yPos + 12);
      doc.text(`Maior concentração em: ${getMaiorFormaPagamento()}`, 20, yPos + 22);
      doc.text(`Status: Caixa ${caixaStatus}`, 20, yPos + 32);
      
      // Salvar PDF
      doc.save(`Relatorio_Caixa_${hoje.replace(/\//g, '-')}.pdf`);
      
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      alert('❌ Erro ao gerar PDF. Usando impressão alternativa...');
      imprimirRelatorio();
    }
  };

  const imprimirRelatorio = () => {
    const janela = window.open('', '_blank');
    janela.document.write(`
      <html>
        <head>
          <title>Relatório de Fechamento - ${new Date().toLocaleDateString('pt-BR')}</title>
          <style>
            body { font-family: 'Courier New', monospace; margin: 20px; }
            pre { white-space: pre-wrap; }
          </style>
        </head>
        <body>
          <pre>${relatorioCompleto}</pre>
          <script>window.print();</script>
        </body>
      </html>
    `);
  };

  return (
    <Container darkMode={darkMode}>
      <StatusCard status={caixaStatus}>
        <h2>{caixaStatus === 'aberto' ? '🔓 CAIXA ABERTO' : '🔒 CAIXA FECHADO'}</h2>
        {caixaStatus === 'aberto' && (
          <p>Valor inicial: R$ {valorInicial.toFixed(2)}</p>
        )}
      </StatusCard>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        <ActionButton
          onClick={abrirCaixa}
          disabled={caixaStatus === 'aberto'}
          style={{
            background: caixaStatus === 'aberto' ? '#666' : '#10b981',
            color: 'white'
          }}
        >
          🔓 Abrir Caixa
        </ActionButton>

        <ActionButton
          onClick={gerarRelatorio}
          disabled={caixaStatus === 'fechado'}
          style={{
            background: caixaStatus === 'fechado' ? '#666' : '#3b82f6',
            color: 'white'
          }}
        >
          📄 Gerar Relatório
        </ActionButton>

        <ActionButton
          onClick={fecharCaixa}
          disabled={caixaStatus === 'fechado'}
          style={{
            background: caixaStatus === 'fechado' ? '#666' : '#ef4444',
            color: 'white'
          }}
        >
          🔒 Fechar Caixa
        </ActionButton>
      </div>

      <ResumoCard darkMode={darkMode}>
        <h3 style={{ color: darkMode ? '#fff' : '#000', marginBottom: '1rem' }}>
          📊 Resumo do Dia
        </h3>
        
        <GridResumo>
          <ItemResumo darkMode={darkMode}>
            <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>💰</div>
            <div style={{ fontSize: '0.9rem', color: '#666' }}>Valor Inicial</div>
            <div style={{ fontSize: '1.2rem', fontWeight: '700', color: '#10b981' }}>
              R$ {resumoDia.valor_inicial.toFixed(2)}
            </div>
          </ItemResumo>

          <ItemResumo darkMode={darkMode}>
            <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>💵</div>
            <div style={{ fontSize: '0.9rem', color: '#666' }}>Dinheiro</div>
            <div style={{ fontSize: '1.2rem', fontWeight: '700', color: '#10b981' }}>
              {resumoDia.qtd_vendas_dinheiro} vendas
            </div>
            <div style={{ fontSize: '0.8rem', color: '#888' }}>
              R$ {resumoDia.vendas_dinheiro.toFixed(2)}
            </div>
          </ItemResumo>

          <ItemResumo darkMode={darkMode}>
            <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>💳</div>
            <div style={{ fontSize: '0.9rem', color: '#666' }}>Cartões</div>
            <div style={{ fontSize: '1.2rem', fontWeight: '700', color: '#3b82f6' }}>
              {resumoDia.qtd_vendas_credito + resumoDia.qtd_vendas_debito} vendas
            </div>
            <div style={{ fontSize: '0.8rem', color: '#888' }}>
              R$ {(resumoDia.vendas_credito + resumoDia.vendas_debito).toFixed(2)}
            </div>
          </ItemResumo>

          <ItemResumo darkMode={darkMode}>
            <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>📱</div>
            <div style={{ fontSize: '0.9rem', color: '#666' }}>PIX</div>
            <div style={{ fontSize: '1.2rem', fontWeight: '700', color: '#f59e0b' }}>
              {resumoDia.qtd_vendas_pix} vendas
            </div>
            <div style={{ fontSize: '0.8rem', color: '#888' }}>
              R$ {resumoDia.vendas_pix.toFixed(2)}
            </div>
          </ItemResumo>

          <ItemResumo darkMode={darkMode}>
            <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>📉</div>
            <div style={{ fontSize: '0.9rem', color: '#666' }}>Saídas</div>
            <div style={{ fontSize: '1.2rem', fontWeight: '700', color: '#ef4444' }}>
              R$ {resumoDia.total_saidas.toFixed(2)}
            </div>
          </ItemResumo>

          <ItemResumo darkMode={darkMode}>
            <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>💰</div>
            <div style={{ fontSize: '0.9rem', color: '#666' }}>Saldo Final</div>
            <div style={{ 
              fontSize: '1.2rem', 
              fontWeight: '700', 
              color: resumoDia.saldo_final >= 0 ? '#10b981' : '#ef4444' 
            }}>
              R$ {resumoDia.saldo_final.toFixed(2)}
            </div>
          </ItemResumo>
        </GridResumo>
      </ResumoCard>

      {/* Modal do Relatório */}
      {showRelatorio && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: darkMode ? '#1a1a1a' : '#ffffff',
            borderRadius: '1rem',
            padding: '2rem',
            maxWidth: '800px',
            width: '90%',
            maxHeight: '90vh',
            overflow: 'auto',
            border: `1px solid ${darkMode ? '#333' : '#e5e7eb'}`
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1.5rem'
            }}>
              <h2 style={{ color: darkMode ? '#fff' : '#000', margin: 0 }}>
                📄 Relatório de Fechamento
              </h2>
              <button
                onClick={() => setShowRelatorio(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  color: darkMode ? '#fff' : '#000'
                }}
              >
                ✕
              </button>
            </div>

            <pre style={{
              background: darkMode ? '#2a2a2a' : '#f8f9fa',
              padding: '1.5rem',
              borderRadius: '0.5rem',
              fontSize: '0.9rem',
              lineHeight: '1.4',
              color: darkMode ? '#fff' : '#000',
              whiteSpace: 'pre-wrap',
              overflow: 'auto',
              maxHeight: '60vh'
            }}>
              {relatorioCompleto}
            </pre>

            <div style={{
              display: 'flex',
              gap: '1rem',
              justifyContent: 'center',
              marginTop: '1.5rem'
            }}>
              <ActionButton
                onClick={gerarPDF}
                style={{
                  background: '#ef4444',
                  color: 'white'
                }}
              >
                📄 Gerar PDF
              </ActionButton>
              
              <ActionButton
                onClick={imprimirRelatorio}
                style={{
                  background: '#10b981',
                  color: 'white'
                }}
              >
                🖨️ Imprimir
              </ActionButton>
              
              <ActionButton
                onClick={() => setShowRelatorio(false)}
                style={{
                  background: darkMode ? '#333' : '#f3f4f6',
                  color: darkMode ? '#fff' : '#000'
                }}
              >
                Fechar
              </ActionButton>
            </div>
          </div>
        </div>
      )}
    </Container>
  );
}
