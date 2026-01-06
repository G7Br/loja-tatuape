import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { supabase, queryWithStore } from '../../utils/supabase';
import { getBrasiliaDateOnly, getBrasiliaDateISO, formatCurrency, createBrasiliaTimestamp } from '../../utils/dateUtils';

const Container = styled.div`
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
  color: ${props => props.$darkMode ? '#ffffff' : '#1a1a1a'};
`;

const Card = styled.div.withConfig({
  shouldForwardProp: (prop) => !['darkMode'].includes(prop)
})`
  background: ${props => props.darkMode ? '#1a1a1a' : '#ffffff'};
  border-radius: 1rem;
  padding: 2rem;
  margin-bottom: 2rem;
  border: 1px solid ${props => props.darkMode ? '#333' : '#e5e7eb'};
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
`;

const StatusCard = styled.div`
  padding: 1.5rem;
  border-radius: 0.75rem;
  margin-bottom: 2rem;
  text-align: center;
  background: ${props => props.status === 'aberto' ? '#10b981' : '#ef4444'};
  color: white;
`;

const Button = styled.button`
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s ease;
  
  &:hover {
    opacity: 0.9;
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export default function CaixaControllerMogi({ user, darkMode }) {
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
      const hoje = getBrasiliaDateOnly();
      
      const { data, error } = await supabase
        .from('fechamentos_caixa_mogi')
        .select('*')
        .eq('usuario_id', user.id)
        .eq('data_fechamento', hoje)
        .eq('status', 'aberto')
        .maybeSingle();
      
      console.log('Verificando caixa Mogi:', { data, error, hoje, userId: user.id });
      
      if (error) {
        console.error('Erro na consulta do caixa Mogi:', error);
        if (error.message.includes('does not exist') || error.message.includes('schema cache')) {
          alert('❌ Erro: Tabela do caixa não encontrada. Execute o script de correção no Supabase.');
          return;
        }
      }
      
      if (data && data.status === 'aberto') {
        setCaixaStatus('aberto');
        setValorInicial(data.valor_inicial || 0);
        console.log('Caixa Mogi está aberto');
      } else {
        setCaixaStatus('fechado');
        console.log('Caixa Mogi está fechado');
      }
    } catch (error) {
      console.error('Erro ao verificar caixa Mogi:', error);
      if (error.message.includes('does not exist') || error.message.includes('schema cache')) {
        alert('❌ Erro: Problema na estrutura do banco de dados. Contate o administrador.');
      }
      setCaixaStatus('fechado');
    }
  };

  const abrirCaixa = async () => {
    const valor = prompt('Valor inicial no caixa (R$):');
    if (valor === null) return;

    const valorNumerico = parseFloat(valor) || 0;
    
    try {
      const hoje = getBrasiliaDateOnly();
      
      // Verificar se já existe um fechamento para hoje
      const { data: existente, error: errorConsulta } = await supabase
        .from('fechamentos_caixa_mogi')
        .select('*')
        .eq('usuario_id', user.id)
        .eq('data_fechamento', hoje)
        .maybeSingle();
      
      if (errorConsulta && (errorConsulta.message.includes('does not exist') || errorConsulta.message.includes('schema cache'))) {
        alert('❌ Erro: Tabela do caixa não encontrada. Execute o script fix_fechamentos_caixa_mogi.sql no Supabase.');
        return;
      }
      
      if (existente) {
        // Se já existe, apenas atualizar o status para aberto
        const { error } = await supabase
          .from('fechamentos_caixa_mogi')
          .update({
            valor_inicial: valorNumerico,
            status: 'aberto'
          })
          .eq('usuario_id', user.id)
          .eq('data_fechamento', hoje);
        
        if (error) throw error;
      } else {
        // Se não existe, criar novo
        const { error } = await supabase
          .from('fechamentos_caixa_mogi')
          .insert({
            usuario_id: user.id,
            data_fechamento: hoje,
            valor_inicial: valorNumerico,
            status: 'aberto'
          });
        
        if (error) throw error;
      }
      
      setCaixaStatus('aberto');
      setValorInicial(valorNumerico);
      
      // Forçar atualização do status
      await verificarStatusCaixa();
      await carregarResumoDia();
      
      // Recarregar a página para garantir sincronização
      setTimeout(() => {
        window.location.reload();
      }, 1000);
      
      alert(`✅ Caixa Mogi aberto com valor inicial de R$ ${valorNumerico.toFixed(2)}`);
    } catch (error) {
      console.error('Erro completo ao abrir caixa:', error);
      if (error.message.includes('does not exist') || error.message.includes('schema cache')) {
        alert('❌ Erro: Problema na estrutura do banco. Execute o script de correção fix_fechamentos_caixa_mogi.sql');
      } else {
        alert('❌ Erro ao abrir caixa Mogi: ' + error.message);
      }
    }
  };

  const fecharCaixa = async () => {
    if (!confirm('⚠️ ATENÇÃO: Deseja realmente fechar o caixa?\n\nCertifique-se de ter gerado o relatório antes de fechar!')) {
      return;
    }

    try {
      const hoje = getBrasiliaDateOnly();
      
      // Atualizar status para fechado
      const { error } = await supabase
        .from('fechamentos_caixa_mogi')
        .update({ 
          status: 'fechado'
        })
        .eq('usuario_id', user.id)
        .eq('data_fechamento', hoje);
      
      if (error) throw error;
      
      // Atualizar histórico
      await supabase
        .from('historico_caixa_diario_mogi')
        .update({ status: 'fechado' })
        .eq('usuario_id', user.id)
        .eq('data_operacao', hoje);
      
      setCaixaStatus('fechado');
      
      // Recarregar a página para garantir sincronização
      setTimeout(() => {
        window.location.reload();
      }, 1000);
      
      alert('✅ Caixa Mogi fechado com sucesso!\n\nO histórico foi mantido e o caixa está pronto para ser aberto no próximo dia.');
      
    } catch (error) {
      alert('❌ Erro ao fechar caixa Mogi: ' + error.message);
    }
  };

  const carregarResumoDia = async () => {
    try {
      const hoje = getBrasiliaDateOnly();
      
      // Buscar valor inicial do caixa
      const { data: caixaData } = await supabase
        .from('fechamentos_caixa_mogi')
        .select('valor_inicial')
        .eq('usuario_id', user.id)
        .eq('data_fechamento', hoje)
        .single();
      
      const valorInicial = parseFloat(caixaData?.valor_inicial || 0);
      
      // Buscar vendas dos últimos 2 dias (CORRIGIDO)
      const ontem = new Date();
      ontem.setDate(ontem.getDate() - 1);
      const ontemStr = ontem.toISOString().split('T')[0];
      
      const { data: vendasData, error: vendasError } = await supabase
        .from('vendas_mogi')
        .select('*')
        .gte('data_venda', ontemStr + 'T00:00:00')
        .lt('data_venda', hoje + 'T23:59:59')
        .neq('forma_pagamento', 'pendente_caixa')
        .neq('status', 'cancelada')
        .in('status', ['finalizada', 'pendente']);
      
      console.log('🔍 DEBUG - Parâmetros de busca:');
      console.log('  - Data hoje:', hoje);
      console.log('  - Data ontem:', ontemStr);
      console.log('  - Buscando de:', ontemStr + 'T00:00:00', 'até:', hoje + 'T23:59:59');
      
      console.log('📊 Vendas encontradas Mogi:', vendasData?.length || 0);
      console.log('❌ Erro vendas Mogi:', vendasError);
      
      if (vendasData && vendasData.length > 0) {
        console.log('🔍 Primeiras vendas:', vendasData.slice(0, 3));
      } else {
        console.log('⚠️ NENHUMA VENDA ENCONTRADA - Verificando no banco...');
        // Buscar sem filtro de data para debug
        const { data: todasVendas } = await supabase
          .from('vendas_mogi')
          .select('*')
          .order('data_venda', { ascending: false })
          .limit(5);
        console.log('🔍 Últimas 5 vendas no banco:', todasVendas);
      }
      
      // Buscar saídas do dia
      const { data: saidasData } = await supabase
        .from('saidas_caixa_mogi')
        .select('*')
        .eq('data', hoje);
      
      // Função para contabilizar pagamento misto - DIRETA
      const contabilizarPagamentoMisto = (formaPagamento, valorFinal) => {
        const resultado = { dinheiro: 0, credito: 0, debito: 0, pix: 0, link_pagamento: 0 };

        if (!formaPagamento) {
          resultado.dinheiro = valorFinal;
          return resultado;
        }

        const forma = formaPagamento.toLowerCase();

        // Se é pagamento misto (contém |)
        if (forma.includes('|')) {
          const opcoes = forma.split('|');
          opcoes.forEach(opcao => {
            const [tipo, valor] = opcao.trim().split(':');
            const valorNumerico = parseFloat(valor) || 0;
            
            switch (tipo.trim()) {
              case 'dinheiro': resultado.dinheiro += valorNumerico; break;
              case 'cartao_credito': resultado.credito += valorNumerico; break;
              case 'cartao_debito': resultado.debito += valorNumerico; break;
              case 'pix': resultado.pix += valorNumerico; break;
              case 'link_pagamento': resultado.link_pagamento += valorNumerico; break;
            }
          });
        } else {
          // Pagamento simples
          switch (forma) {
            case 'dinheiro': resultado.dinheiro = valorFinal; break;
            case 'cartao_credito': case 'credito': resultado.credito = valorFinal; break;
            case 'cartao_debito': case 'debito': resultado.debito = valorFinal; break;
            case 'pix': resultado.pix = valorFinal; break;
            default: 
              if (forma.includes('link_pagamento')) resultado.link_pagamento = valorFinal;
              else resultado.dinheiro = valorFinal;
              break;
          }
        }

        return resultado;
      };

      // Calcular totais das vendas (CORRIGIDO)
      let vendas_dinheiro = 0, vendas_credito = 0, vendas_debito = 0, vendas_pix = 0, vendas_link = 0;
      let qtd_vendas_dinheiro = 0, qtd_vendas_credito = 0, qtd_vendas_debito = 0, qtd_vendas_pix = 0;
      let total_troco = 0;
      
      if (vendasData && vendasData.length > 0) {
        console.log('💰 Processando', vendasData.length, 'vendas Mogi');
        
        // Atualizar vendas pendentes para finalizadas
        const vendasPendentes = vendasData.filter(v => v.status === 'pendente');
        if (vendasPendentes.length > 0) {
          console.log('🔄 Finalizando', vendasPendentes.length, 'vendas pendentes');
          for (const venda of vendasPendentes) {
            supabase
              .from('vendas_mogi')
              .update({ status: 'finalizada' })
              .eq('id', venda.id)
              .then(() => console.log('✅ Finalizada:', venda.numero_venda));
          }
        }
        
        vendasData.forEach((venda, index) => {
          const valor = parseFloat(venda.valor_final || 0);
          const troco = parseFloat(venda.troco || 0);
          const formaPagamento = venda.forma_pagamento;
          
          const contabilizacao = contabilizarPagamentoMisto(formaPagamento, valor);
          console.log(`✅ Venda ${index + 1} (${venda.numero_venda}):`, contabilizacao);
          
          vendas_dinheiro += contabilizacao.dinheiro;
          vendas_credito += contabilizacao.credito;
          vendas_debito += contabilizacao.debito;
          vendas_pix += contabilizacao.pix;
          vendas_link += contabilizacao.link_pagamento;
          
          // Contar quantidades
          if (contabilizacao.dinheiro > 0) qtd_vendas_dinheiro++;
          if (contabilizacao.credito > 0) qtd_vendas_credito++;
          if (contabilizacao.debito > 0) qtd_vendas_debito++;
          if (contabilizacao.pix > 0) qtd_vendas_pix++;
          
          total_troco += troco;
        });
      } else {
        console.log('⚠️ Nenhuma venda encontrada para hoje');
      }
      
      // Calcular total de saídas
      const total_saidas = saidasData ? saidasData.reduce((sum, saida) => sum + parseFloat(saida.valor || 0), 0) : 0;
      
      console.log('Saídas do dia Mogi:', saidasData);
      console.log('Total de saídas Mogi:', total_saidas);
      
      // Calcular totais
      const total_entradas = vendas_dinheiro + vendas_credito + vendas_debito + vendas_pix + vendas_link;
      const saldo_final = valorInicial + total_entradas - total_saidas;
      
      setResumoDia({
        valor_inicial: valorInicial,
        total_entradas: total_entradas,
        total_saidas: total_saidas,
        qtd_saidas: saidasData ? saidasData.length : 0,
        saldo_final: saldo_final,
        vendas_dinheiro: vendas_dinheiro,
        vendas_credito: vendas_credito,
        vendas_debito: vendas_debito,
        vendas_pix: vendas_pix,
        vendas_link: vendas_link,
        total_troco: total_troco,
        qtd_vendas_dinheiro: qtd_vendas_dinheiro,
        qtd_vendas_credito: qtd_vendas_credito,
        qtd_vendas_debito: qtd_vendas_debito,
        qtd_vendas_pix: qtd_vendas_pix
      });
      
    } catch (error) {
      console.error('Erro ao carregar resumo Mogi:', error);
      // Em caso de erro, manter valores zerados
      setResumoDia({
        valor_inicial: 0,
        total_entradas: 0,
        total_saidas: 0,
        qtd_saidas: 0,
        saldo_final: 0,
        vendas_dinheiro: 0,
        vendas_credito: 0,
        vendas_debito: 0,
        vendas_pix: 0,
        vendas_link: 0,
        total_troco: 0,
        qtd_vendas_dinheiro: 0,
        qtd_vendas_credito: 0,
        qtd_vendas_debito: 0,
        qtd_vendas_pix: 0
      });
    }
  };

  const gerarRelatorio = async () => {
    try {
      const hoje = new Date().toLocaleDateString('pt-BR');
      const agora = new Date().toLocaleString('pt-BR');
      
      const totalVendas = resumoDia.qtd_vendas_dinheiro + resumoDia.qtd_vendas_credito + resumoDia.qtd_vendas_debito + resumoDia.qtd_vendas_pix;
      const ticketMedio = totalVendas > 0 ? resumoDia.total_entradas / totalVendas : 0;
      const percentualDinheiro = resumoDia.total_entradas > 0 ? (resumoDia.vendas_dinheiro / resumoDia.total_entradas * 100) : 0;
      const percentualCartao = resumoDia.total_entradas > 0 ? ((resumoDia.vendas_credito + resumoDia.vendas_debito) / resumoDia.total_entradas * 100) : 0;
      const percentualPix = resumoDia.total_entradas > 0 ? (resumoDia.vendas_pix / resumoDia.total_entradas * 100) : 0;
      
      const relatorio = `
╔═══════════════════════════════════════════════════════════════╗
║                    RELATÓRIO DE FECHAMENTO                  ║
║                         CAIXA MOGI                          ║
╚═══════════════════════════════════════════════════════════════╝

📅 DATA: ${hoje} | ⏰ HORÁRIO: ${agora.split(' ')[1]}
👤 OPERADOR: ${user.nome}

┌───────────────────────────────────────────────────────────────┐
│                      RESUMO EXECUTIVO                      │
└───────────────────────────────────────────────────────────────┘
💰 Valor Inicial do Caixa: R$ ${resumoDia.valor_inicial.toFixed(2)}
💵 Total de Vendas: R$ ${resumoDia.total_entradas.toFixed(2)}
📊 Quantidade de Vendas: ${totalVendas}
🎯 Ticket Médio: R$ ${ticketMedio.toFixed(2)}
💰 Saldo Final: R$ ${resumoDia.saldo_final.toFixed(2)}

┌───────────────────────────────────────────────────────────────┐
│                  FORMAS DE PAGAMENTO                       │
└───────────────────────────────────────────────────────────────┘
💵 DINHEIRO (${percentualDinheiro.toFixed(1)}%):
   Vendas: ${resumoDia.qtd_vendas_dinheiro} | Valor: R$ ${resumoDia.vendas_dinheiro.toFixed(2)}
   Troco Dado: R$ ${resumoDia.total_troco.toFixed(2)}

💳 CARTÃO CRÉDITO:
   Vendas: ${resumoDia.qtd_vendas_credito} | Valor: R$ ${resumoDia.vendas_credito.toFixed(2)}

💳 CARTÃO DÉBITO:
   Vendas: ${resumoDia.qtd_vendas_debito} | Valor: R$ ${resumoDia.vendas_debito.toFixed(2)}

📱 PIX (${percentualPix.toFixed(1)}%):
   Vendas: ${resumoDia.qtd_vendas_pix} | Valor: R$ ${resumoDia.vendas_pix.toFixed(2)}

🔗 LINK DE PAGAMENTO:
   Valor: R$ ${(resumoDia.vendas_link || 0).toFixed(2)}

┌───────────────────────────────────────────────────────────────┐
│                    ANÁLISE FINANCEIRA                      │
└───────────────────────────────────────────────────────────────┘
📈 Total Recebido: R$ ${resumoDia.total_entradas.toFixed(2)}
📉 Total de Saídas: R$ ${resumoDia.total_saidas.toFixed(2)}
💰 Dinheiro Físico em Caixa: R$ ${(resumoDia.valor_inicial + resumoDia.vendas_dinheiro - resumoDia.total_saidas - resumoDia.total_troco).toFixed(2)}
💸 Total de Saídas: R$ ${resumoDia.total_saidas.toFixed(2)} (${resumoDia.qtd_saidas || 0} saídas)
💳 Valores em Cartão: R$ ${(resumoDia.vendas_credito + resumoDia.vendas_debito).toFixed(2)}
🔗 Valores em Link: R$ ${(resumoDia.vendas_link || 0).toFixed(2)}

┌───────────────────────────────────────────────────────────────┐
│                      INDICADORES                           │
└───────────────────────────────────────────────────────────────┘
🏆 Forma de Pagamento Predominante: ${getMaiorFormaPagamento()}
📊 Distribuição: Dinheiro ${percentualDinheiro.toFixed(0)}% | Cartão ${percentualCartao.toFixed(0)}% | PIX ${percentualPix.toFixed(0)}%
⚡ Status do Caixa: ${caixaStatus.toUpperCase()}

═══════════════════════════════════════════════════════════════
              RELATÓRIO GERADO AUTOMATICAMENTE
═══════════════════════════════════════════════════════════════
      `.trim();

      setRelatorioCompleto(relatorio);
      setShowRelatorio(true);

      // Salvar relatório no histórico
      const hoje_iso = getBrasiliaDateOnly();
      await supabase
        .from('historico_caixa_diario_mogi')
        .upsert({
          usuario_id: user.id,
          data_operacao: hoje_iso,
          relatorio_completo: relatorio,
          ...resumoDia
        });

    } catch (error) {
      alert('❌ Erro ao gerar relatório Mogi: ' + error.message);
    }
  };

  const getMaiorFormaPagamento = () => {
    const formas = [
      { nome: 'Dinheiro', valor: resumoDia.vendas_dinheiro },
      { nome: 'Crédito', valor: resumoDia.vendas_credito },
      { nome: 'Débito', valor: resumoDia.vendas_debito },
      { nome: 'PIX', valor: resumoDia.vendas_pix },
      { nome: 'Link', valor: resumoDia.vendas_link || 0 }
    ];
    
    const maior = formas.reduce((prev, current) => 
      prev.valor > current.valor ? prev : current
    );
    
    return maior.nome;
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
      doc.text('RELATÓRIO DE FECHAMENTO DE CAIXA - MOGI', 20, 20);
      
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
      doc.save(`Relatorio_Caixa_Mogi_${hoje.replace(/\//g, '-')}.pdf`);
      
    } catch (error) {
      console.error('Erro ao gerar PDF Mogi:', error);
      alert('❌ Erro ao gerar PDF. Usando impressão alternativa...');
      imprimirRelatorio();
    }
  };

  const imprimirRelatorio = () => {
    const janela = window.open('', '_blank');
    janela.document.write(`
      <html>
        <head>
          <title>Relatório de Fechamento Mogi - ${new Date().toLocaleDateString('pt-BR')}</title>
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
    <Container $darkMode={darkMode}>
      <StatusCard status={caixaStatus}>
        <h2>{caixaStatus === 'aberto' ? '🔓 CAIXA ABERTO - MOGI' : '🔒 CAIXA FECHADO - MOGI'}</h2>
        {caixaStatus === 'aberto' && (
          <p>Valor inicial: R$ {valorInicial.toFixed(2)}</p>
        )}
      </StatusCard>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        <Button
          onClick={abrirCaixa}
          disabled={caixaStatus === 'aberto'}
          style={{
            background: caixaStatus === 'aberto' ? '#666' : '#10b981',
            color: 'white',
            padding: '0.75rem 1.5rem',
            border: 'none',
            borderRadius: '0.5rem',
            cursor: caixaStatus === 'aberto' ? 'not-allowed' : 'pointer',
            fontWeight: '600'
          }}
        >
          🔓 Abrir Caixa
        </Button>

        <Button
          onClick={gerarRelatorio}
          disabled={caixaStatus === 'fechado'}
          style={{
            background: caixaStatus === 'fechado' ? '#666' : '#3b82f6',
            color: 'white',
            padding: '0.75rem 1.5rem',
            border: 'none',
            borderRadius: '0.5rem',
            cursor: caixaStatus === 'fechado' ? 'not-allowed' : 'pointer',
            fontWeight: '600'
          }}
        >
          📄 Gerar Relatório
        </Button>

        <Button
          onClick={fecharCaixa}
          disabled={caixaStatus === 'fechado'}
          style={{
            background: caixaStatus === 'fechado' ? '#666' : '#ef4444',
            color: 'white',
            padding: '0.75rem 1.5rem',
            border: 'none',
            borderRadius: '0.5rem',
            cursor: caixaStatus === 'fechado' ? 'not-allowed' : 'pointer',
            fontWeight: '600'
          }}
        >
          🔒 Fechar Caixa
        </Button>
        
        <Button
          onClick={() => {
            verificarStatusCaixa();
            carregarResumoDia();
          }}
          style={{
            background: '#f59e0b',
            color: 'white',
            padding: '0.75rem 1.5rem',
            border: 'none',
            borderRadius: '0.5rem',
            cursor: 'pointer',
            fontWeight: '600'
          }}
        >
          🔄 Atualizar Status
        </Button>
      </div>

      <Card $darkMode={darkMode}>
        <h3 style={{ color: darkMode ? '#fff' : '#000', marginBottom: '1rem' }}>
          📊 Resumo do Dia - Mogi
        </h3>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem'
        }}>
          {[
            { icon: '💰', label: 'Valor Inicial', value: formatCurrency(resumoDia.valor_inicial), color: '#10b981' },
            { icon: '💵', label: 'Dinheiro', value: `${resumoDia.qtd_vendas_dinheiro} vendas`, subValue: formatCurrency(resumoDia.vendas_dinheiro), color: '#10b981' },
            { icon: '💳', label: 'Cartões', value: `${resumoDia.qtd_vendas_credito + resumoDia.qtd_vendas_debito} vendas`, subValue: formatCurrency(resumoDia.vendas_credito + resumoDia.vendas_debito), color: '#3b82f6' },
            { icon: '📱', label: 'PIX', value: `${resumoDia.qtd_vendas_pix} vendas`, subValue: formatCurrency(resumoDia.vendas_pix), color: '#f59e0b' },
            { icon: '🔗', label: 'Link Pagamento', value: formatCurrency(resumoDia.vendas_link || 0), color: '#6366f1' },
            { icon: '📉', label: 'Saídas', value: formatCurrency(resumoDia.total_saidas), color: '#ef4444' },
            { icon: '💰', label: 'Saldo Final', value: formatCurrency(resumoDia.saldo_final), color: resumoDia.saldo_final >= 0 ? '#10b981' : '#ef4444' }
          ].map((item, index) => (
            <div key={index} style={{
              background: darkMode ? '#2a2a2a' : '#f8f9fa',
              padding: '1rem',
              borderRadius: '0.5rem',
              textAlign: 'center',
              border: `1px solid ${darkMode ? '#333' : '#e5e7eb'}`,
              color: darkMode ? '#ffffff' : '#1a1a1a'
            }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{item.icon}</div>
              <div style={{ fontSize: '0.9rem', color: darkMode ? '#ccc' : '#666' }}>{item.label}</div>
              <div style={{ fontSize: '1.2rem', fontWeight: '700', color: item.color }}>
                {item.value}
              </div>
              {item.subValue && (
                <div style={{ fontSize: '0.8rem', color: darkMode ? '#ddd' : '#888' }}>
                  {item.subValue}
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>

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
                📄 Relatório de Fechamento - Mogi
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
              <Button
                onClick={gerarPDF}
                style={{
                  background: '#ef4444',
                  color: 'white',
                  padding: '0.75rem 1.5rem',
                  border: 'none',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                📄 Gerar PDF
              </Button>
              
              <Button
                onClick={imprimirRelatorio}
                style={{
                  background: '#10b981',
                  color: 'white',
                  padding: '0.75rem 1.5rem',
                  border: 'none',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                🖨️ Imprimir
              </Button>
              
              <Button
                onClick={() => setShowRelatorio(false)}
                style={{
                  background: darkMode ? '#333' : '#f3f4f6',
                  color: darkMode ? '#fff' : '#000',
                  padding: '0.75rem 1.5rem',
                  border: 'none',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                Fechar
              </Button>
            </div>
          </div>
        </div>
      )}
    </Container>
  );
}