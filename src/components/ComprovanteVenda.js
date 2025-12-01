import React from 'react';

const versiculos = [
  { texto: "Tudo o que fizerem, façam de todo o coração, como para o Senhor, e não para os homens.", referencia: "Colossenses 3:23" },
  { texto: "O Senhor é o meu pastor; de nada terei falta.", referencia: "Salmos 23:1" },
  { texto: "Posso todas as coisas naquele que me fortalece.", referencia: "Filipenses 4:13" },
  { texto: "Confie no Senhor de todo o seu coração e não se apoie em seu próprio entendimento.", referencia: "Provérbios 3:5" },
  { texto: "Busquem, pois, em primeiro lugar o Reino de Deus e a sua justiça.", referencia: "Mateus 6:33" },
  { texto: "O Senhor é a minha luz e a minha salvação; de quem terei medo?", referencia: "Salmos 27:1" },
  { texto: "Entrega o teu caminho ao Senhor; confia nele, e ele tudo fará.", referencia: "Salmos 37:5" },
  { texto: "Deus é o nosso refúgio e fortaleza, socorro bem presente na angústia.", referencia: "Salmos 46:1" },
  { texto: "O Senhor lutará por vocês; tão somente acalmem-se.", referencia: "Êxodo 14:14" },
  { texto: "O amor jamais acaba.", referencia: "1 Coríntios 13:8" },
  { texto: "O Senhor está perto de todos os que o invocam.", referencia: "Salmos 145:18" },
  { texto: "Sede fortes e corajosos. Não temais, porque o Senhor, vosso Deus, vai convosco.", referencia: "Deuteronômio 31:6" },
  { texto: "Alegrai-vos sempre no Senhor.", referencia: "Filipenses 4:4" },
  { texto: "O Senhor firmará os passos daquele que dele se agrada.", referencia: "Salmos 37:23" },
  { texto: "O choro pode durar uma noite, mas a alegria vem pela manhã.", referencia: "Salmos 30:5" },
  { texto: "O meu Deus suprirá todas as necessidades de vocês, de acordo com as suas riquezas em glória.", referencia: "Filipenses 4:19" },
  { texto: "Se Deus é por nós, quem será contra nós?", referencia: "Romanos 8:31" },
  { texto: "O Senhor é bom, um refúgio em tempos de angústia.", referencia: "Naum 1:7" },
  { texto: "Aquele que habita no esconderijo do Altíssimo descansará à sombra do Todo-Poderoso.", referencia: "Salmos 91:1" },
  { texto: "Mil poderão cair ao seu lado, dez mil à sua direita, mas nada o atingirá.", referencia: "Salmos 91:7" },
  { texto: "O Senhor te guardará de todo mal.", referencia: "Salmos 121:7" },
  { texto: "O Senhor é bom para com todos.", referencia: "Salmos 145:9" },
  { texto: "Nada é impossível para Deus.", referencia: "Lucas 1:37" },
  { texto: "Clame a mim e eu responderei.", referencia: "Jeremias 33:3" },
  { texto: "A fé é a certeza daquilo que esperamos.", referencia: "Hebreus 11:1" },
  { texto: "O Senhor restaura a alma.", referencia: "Salmos 23:3" },
  { texto: "Aquele que começou boa obra em vocês há de completá-la.", referencia: "Filipenses 1:6" },
  { texto: "O Senhor conhece os planos que tem para vocês: planos de paz e não de mal.", referencia: "Jeremias 29:11" },
  { texto: "Não temas, porque eu sou contigo.", referencia: "Isaías 41:10" },
  { texto: "Em paz me deito e logo adormeço, pois só tu, Senhor, me fazes viver em segurança.", referencia: "Salmos 4:8" },
  { texto: "O Senhor é bom; a sua misericórdia dura para sempre.", referencia: "Salmos 100:5" },
  { texto: "Bem-aventurados os que confiam no Senhor.", referencia: "Provérbios 16:20" },
  { texto: "Busquem ao Senhor enquanto é possível achá-lo.", referencia: "Isaías 55:6" },
  { texto: "O Senhor sustém os que vacilam.", referencia: "Salmos 145:14" },
  { texto: "A graça do Senhor é melhor do que a vida.", referencia: "Salmos 63:3" },
  { texto: "O Senhor é a minha rocha, a minha fortaleza e o meu libertador.", referencia: "Salmos 18:2" },
  { texto: "O Senhor é bom para os que nele esperam.", referencia: "Lamentações 3:25" },
  { texto: "Ainda que eu ande pelo vale da sombra da morte, não temerei mal algum.", referencia: "Salmos 23:4" },
  { texto: "Eu sou o caminho, a verdade e a vida.", referencia: "João 14:6" },
  { texto: "Bem-aventurados os limpos de coração, porque verão a Deus.", referencia: "Mateus 5:8" }
];

export default function ComprovanteVenda({ venda, itens = [], onClose, dadosPagamento = null }) {
  const [versiculoAtual] = React.useState(() => {
    return versiculos[Math.floor(Math.random() * versiculos.length)];
  });
  
  const calcularSubtotal = () => {
    if (itens.length === 0) {
      return parseFloat(venda.valor_final || 0);
    }
    return itens.reduce((total, item) => {
      const preco = parseFloat(item.preco_unitario || item.preco_venda || item.valor || 0);
      const quantidade = parseInt(item.quantidade || 1);
      return total + (preco * quantidade);
    }, 0);
  };

  const calcularTroco = () => {
    // Se temos dados de pagamento específicos, usar eles
    if (dadosPagamento && dadosPagamento.troco) {
      return parseFloat(dadosPagamento.troco);
    }
    
    // Para pagamento em dinheiro, calcular troco
    if (venda.forma_pagamento === 'dinheiro') {
      const valorPago = getValorPagoCliente();
      const valorFinal = parseFloat(venda.valor_final || 0);
      return valorPago > valorFinal ? valorPago - valorFinal : 0;
    }
    
    // Para pagamentos mistos, verificar se há dinheiro e calcular troco
    if (venda.forma_pagamento && venda.forma_pagamento.includes('dinheiro:')) {
      const formas = venda.forma_pagamento.split('|');
      const formaDinheiro = formas.find(forma => forma.startsWith('dinheiro:'));
      
      if (formaDinheiro) {
        const valorDinheiro = parseFloat(formaDinheiro.split(':')[1] || 0);
        const valorTotal = parseFloat(venda.valor_final || 0);
        const valorOutrasFormas = formas
          .filter(forma => !forma.startsWith('dinheiro:'))
          .reduce((total, forma) => {
            const valor = parseFloat(forma.split(':')[1] || 0);
            return total + valor;
          }, 0);
        
        const valorRestante = valorTotal - valorOutrasFormas;
        if (valorDinheiro > valorRestante) {
          return valorDinheiro - valorRestante;
        }
      }
    }
    
    return 0;
  };

  const formatarFormaPagamento = (formaPagamento) => {
    if (!formaPagamento) return 'Não informado';
    
    // Pagamento misto (contém |)
    if (formaPagamento.includes('|')) {
      const formas = formaPagamento.split('|');
      return formas.map(forma => {
        const [tipo, valor, taxa] = forma.split(':');
        let nome = '';
        switch(tipo) {
          case 'dinheiro': nome = 'Dinheiro'; break;
          case 'cartao_credito': nome = 'Cartão Crédito'; break;
          case 'cartao_debito': nome = 'Cartão Débito'; break;
          case 'pix': nome = 'PIX'; break;
          case 'link_pagamento': nome = 'Link Pagamento'; break;
          default: nome = tipo;
        }
        let resultado = `${nome}: R$ ${parseFloat(valor).toFixed(2)}`;
        if (taxa && taxa.includes('taxa_')) {
          const taxaPercent = taxa.replace('taxa_', '').replace('%', '');
          resultado += ` (Taxa: ${taxaPercent}%)`;
        }
        return resultado;
      });
    }
    
    // Pagamento simples
    if (formaPagamento.includes(':taxa_')) {
      const [tipo, taxa] = formaPagamento.split(':');
      const taxaPercent = taxa.replace('taxa_', '').replace('%', '');
      let nome = '';
      switch(tipo) {
        case 'link_pagamento': nome = 'Link Pagamento'; break;
        default: nome = tipo;
      }
      return `${nome} (Taxa: ${taxaPercent}%)`;
    }
    
    switch(formaPagamento) {
      case 'dinheiro': return 'Dinheiro';
      case 'cartao_credito': return 'Cartão de Crédito';
      case 'cartao_debito': return 'Cartão de Débito';
      case 'pix': return 'PIX';
      case 'link_pagamento': return 'Link de Pagamento';
      default: return formaPagamento;
    }
  };

  const getDesconto = () => {
    // Verificar se há desconto direto na venda
    if (venda.desconto && parseFloat(venda.desconto) > 0) {
      return parseFloat(venda.desconto);
    }
    
    // Calcular desconto baseado na diferença entre subtotal e valor final
    const subtotal = calcularSubtotal();
    const valorFinal = parseFloat(venda.valor_final || 0);
    
    if (subtotal > valorFinal) {
      return subtotal - valorFinal;
    }
    
    return 0;
  };

  const getValorPagoCliente = () => {
    // Se temos dados de pagamento específicos, usar eles
    if (dadosPagamento && dadosPagamento.valorPago) {
      return parseFloat(dadosPagamento.valorPago);
    }
    
    // Para pagamentos mistos, somar todos os valores
    if (venda.forma_pagamento && venda.forma_pagamento.includes('|')) {
      const formas = venda.forma_pagamento.split('|');
      return formas.reduce((total, forma) => {
        const valor = parseFloat(forma.split(':')[1] || 0);
        return total + valor;
      }, 0);
    }
    
    // Para outros tipos de pagamento, o valor pago é igual ao valor final
    return parseFloat(venda.valor_final || 0);
  };

  const imprimir = () => {
    const printContent = document.querySelector('.comprovante-content');
    if (!printContent) {
      alert('Erro: Conteúdo do comprovante não encontrado');
      return;
    }
    
    // Criar uma nova janela para impressão
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Comprovante de Venda</title>
          <style>
            body {
              margin: 0;
              padding: 20px;
              font-family: 'Courier New', monospace;
              background: white;
            }
            @media print {
              body { margin: 0; padding: 0; }
              .no-print { display: none !important; }
            }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    
    // Aguardar o carregamento e imprimir
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  };

  return (
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
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '8px',
        maxWidth: '320px',
        width: '100%',
        maxHeight: '90vh',
        overflow: 'auto',
        position: 'relative'
      }}>
        {/* Botões de ação */}
        <div className="no-print" style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          display: 'flex',
          gap: '10px',
          zIndex: 10
        }}>
          <button onClick={imprimir} style={{
            background: '#10b981',
            color: 'white',
            border: 'none',
            padding: '8px 12px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px'
          }}>
            🖨️ Imprimir
          </button>
          <button onClick={onClose} style={{
            background: '#ef4444',
            color: 'white',
            border: 'none',
            padding: '8px 12px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px'
          }}>
            ✕
          </button>
        </div>

        {/* Comprovante */}
        <div className="comprovante-content" style={{
          fontFamily: "'Courier New', monospace",
          padding: '0'
        }}>
          {/* Cabeçalho */}
          <div style={{
            background: '#ffffff',
            padding: '25px',
            textAlign: 'center',
            borderBottom: '3px solid #ccc'
          }}>
            <div style={{
              width: '90px',
              height: '90px',
              margin: '0 auto 15px',
              background: 'white',
              padding: '10px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <img 
                src="/images/logo.png" 
                alt="VH Logo" 
                style={{
                  maxWidth: '100%',
                  maxHeight: '100%',
                  objectFit: 'contain'
                }}
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'block';
                }}
              />
              <svg 
                viewBox="0 0 100 100" 
                xmlns="http://www.w3.org/2000/svg"
                style={{ display: 'none' }}
              >
                <polygon points="50,5 93.3,27.5 93.3,72.5 50,95 6.7,72.5 6.7,27.5" 
                         fill="none" stroke="#fcfcfcff" strokeWidth="4"/>
                <text x="50" y="65" 
                      fontFamily="Georgia, serif" 
                      fontSize="36" 
                      fontWeight="bold" 
                      fill="#1a1a1a" 
                      textAnchor="middle">VH</text>
              </svg>
            </div>
            <div style={{
              fontSize: '12px',
              color: '#000',
              marginBottom: '3px',
              letterSpacing: '2px'
            }}>COMPROVANTE DE PAGAMENTO</div>
            <div style={{
              fontSize: '12px',
              color: '#000',
              letterSpacing: '2px'
            }}></div>
          </div>
          
          {/* Conteúdo */}
          <div style={{ padding: '25px' }}>
            {/* Informações da venda */}
            <div style={{ marginBottom: '18px', fontSize: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', padding: '3px 0' }}>
                <span style={{ fontWeight: 'bold', color: '#333' }}>Data:</span>
                <span style={{ color: '#555' }}>{new Date(venda.data_venda).toLocaleDateString('pt-BR')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', padding: '3px 0' }}>
                <span style={{ fontWeight: 'bold', color: '#333' }}>Hora:</span>
                <span style={{ color: '#555' }}>{new Date(venda.data_venda).toLocaleTimeString('pt-BR')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', padding: '3px 0' }}>
                <span style={{ fontWeight: 'bold', color: '#333' }}>Cupom Nº:</span>
                <span style={{ color: '#555' }}>{venda.numero_venda}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', padding: '3px 0' }}>
                <span style={{ fontWeight: 'bold', color: '#333' }}>Vendedor:</span>
                <span style={{ color: '#555' }}>{venda.vendedor_nome}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', padding: '3px 0' }}>
                <span style={{ fontWeight: 'bold', color: '#333' }}>Cliente:</span>
                <span style={{ color: '#555' }}>{venda.cliente_nome}</span>
              </div>
            </div>
            
            <div style={{ borderTop: '1px dashed #999', margin: '18px 0' }}></div>
            
            {/* Itens */}
            <div style={{ margin: '18px 0' }}>
              <div style={{
                display: 'flex',
                fontWeight: 'bold',
                borderBottom: '1px solid #333',
                paddingBottom: '6px',
                marginBottom: '10px',
                fontSize: '11px',
                color: '#666'
              }}>
                <div style={{ flex: 1 }}>PRODUTO</div>
                <div style={{ width: '50px', textAlign: 'center' }}>QTD</div>
                <div style={{ width: '85px', textAlign: 'right' }}>VALOR</div>
              </div>
              
              {itens.length > 0 ? itens.map((item, index) => (
                <div key={index} style={{
                  display: 'flex',
                  marginBottom: '10px',
                  fontSize: '12px',
                  paddingBottom: '8px',
                  borderBottom: '1px dotted #ddd'
                }}>
                  <div style={{ flex: 1, color: '#000' }}>{item.produto_nome || item.nome || 'Produto'}</div>
                  <div style={{ width: '50px', textAlign: 'center', color: '#666' }}>{item.quantidade || 1}</div>
                  <div style={{ width: '85px', textAlign: 'right', fontWeight: 'bold', color: '#000' }}>
                    R$ {((item.preco_unitario || item.preco_venda || item.valor || 0) * (item.quantidade || 1)).toFixed(2)}
                  </div>
                </div>
              )) : (
                <div style={{
                  display: 'flex',
                  marginBottom: '10px',
                  fontSize: '12px',
                  paddingBottom: '8px',
                  borderBottom: '1px dotted #ddd'
                }}>
                  <div style={{ flex: 1, color: '#000' }}>Venda Finalizada</div>
                  <div style={{ width: '50px', textAlign: 'center', color: '#666' }}>1</div>
                  <div style={{ width: '85px', textAlign: 'right', fontWeight: 'bold', color: '#000' }}>
                    R$ {parseFloat(venda.valor_final).toFixed(2)}
                  </div>
                </div>
              )}
            </div>
            
            <div style={{ borderTop: '1px dashed #999', margin: '18px 0' }}></div>
            
            {/* Total */}
            <div style={{
              marginTop: '18px',
              padding: '15px',
              background: '#f5f5f5',
              border: '1px solid #ccc',
              borderRadius: '6px'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '13px',
                marginBottom: '6px',
                color: '#333'
              }}>
                <span>Subtotal:</span>
                <span style={{ fontWeight: '600', color: '#000' }}>R$ {calcularSubtotal().toFixed(2)}</span>
              </div>
              
              {getDesconto() > 0 && (
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '13px',
                  marginBottom: '6px',
                  color: '#333'
                }}>
                  <span>Desconto:</span>
                  <span style={{ fontWeight: '600' }}>- R$ {getDesconto().toFixed(2)}</span>
                </div>
              )}
              
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontWeight: 'bold',
                fontSize: '18px',
                marginTop: '10px',
                paddingTop: '10px',
                borderTop: '2px solid #000',
                color: '#000'
              }}>
                <span>TOTAL:</span>
                <span>R$ {parseFloat(venda.valor_final).toFixed(2)}</span>
              </div>
              
              {/* Valor Pago pelo Cliente */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginTop: '8px',
                paddingTop: '8px',
                borderTop: '1px solid #999',
                fontSize: '14px'
              }}>
                <span style={{ fontWeight: 'bold', color: '#000' }}>Valor Pago:</span>
                <span style={{ fontWeight: 'bold', color: '#000' }}>R$ {getValorPagoCliente().toFixed(2)}</span>
              </div>
              
              {/* Troco */}
              {calcularTroco() > 0 && (
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginTop: '6px',
                  fontSize: '15px'
                }}>
                  <span style={{ fontWeight: 'bold', color: '#000' }}>TROCO:</span>
                  <span style={{ fontWeight: 'bold', color: '#000' }}>R$ {calcularTroco().toFixed(2)}</span>
                </div>
              )}
            </div>
            
            {/* Pagamento */}
            <div style={{
              margin: '18px 0',
              fontSize: '12px',
              padding: '15px',
              background: '#f5f5f5',
              border: '1px solid #ccc',
              borderRadius: '6px'
            }}>
              <div style={{ textAlign: 'center', marginBottom: '12px' }}>
                <strong style={{ display: 'block', marginBottom: '8px', color: '#000', fontSize: '14px' }}>
                  FORMA DE PAGAMENTO
                </strong>
              </div>
              
              {/* Pagamento Misto */}
              {venda.forma_pagamento && venda.forma_pagamento.includes('|') ? (
                <div>
                  <div style={{ marginBottom: '8px', textAlign: 'center', fontWeight: 'bold', color: '#000' }}>
                    PAGAMENTO MISTO
                  </div>
                  {formatarFormaPagamento(venda.forma_pagamento).map((forma, index) => (
                    <div key={index} style={{
                      marginBottom: '6px',
                      padding: '6px 8px',
                      background: '#ffffff',
                      borderRadius: '4px',
                      border: '1px solid #999',
                      textAlign: 'center'
                    }}>
                      <span style={{ color: '#333', fontWeight: '500', fontSize: '11px' }}>{forma}</span>
                    </div>
                  ))}
                </div>
              ) : (
                /* Pagamento Simples */
                <div style={{ textAlign: 'center', marginBottom: '10px' }}>
                  <span style={{ 
                    color: '#000', 
                    fontWeight: 'bold',
                    fontSize: '13px',
                    padding: '6px 12px',
                    background: '#ffffff',
                    borderRadius: '4px',
                    border: '1px solid #999'
                  }}>
                    {formatarFormaPagamento(venda.forma_pagamento)}
                  </span>
                </div>
              )}
            </div>
            
            {/* Versículo */}
            <div style={{
              fontStyle: 'italic',
              margin: '18px 0',
              padding: '12px',
              background: '#f5f5f5',
              borderLeft: '3px solid #333',
              fontSize: '11px',
              color: '#333',
              lineHeight: '1.5',
              borderRadius: '0 4px 4px 0'
            }}>
              "{versiculoAtual.texto}"<br/>
              <strong>— {versiculoAtual.referencia}</strong>
            </div>
            
            {/* Rodapé */}
            <div style={{
              textAlign: 'center',
              fontSize: '11px',
              marginTop: '20px',
              paddingTop: '15px',
              borderTop: '1px dashed #999',
              color: '#333'
            }}>
              <p style={{ marginBottom: '4px' }}><strong>Que Deus prospere seus caminhos!</strong></p>
              <p style={{ marginBottom: '4px' }}>www.vhgravatas.com</p>
              <p style={{ marginBottom: '4px' }}>WhatsApp: (11) 92004-8618</p>
              <p style={{ marginBottom: '4px' }}>vhgravatas@hotmail.com</p>
              <p style={{ marginBottom: '4px' }}>Rua Boa Esperança, 229 - Chácara Santo Antônio (Zona Leste), São Paulo - SP</p>
              
              <div style={{
                marginTop: '12px',
                paddingTop: '12px',
                borderTop: '1px solid #ddd',
                fontSize: '10px',
                color: '#999'
              }}>

              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}