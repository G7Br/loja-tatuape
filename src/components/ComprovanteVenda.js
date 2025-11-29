import React from 'react';

const versiculos = [
  { texto: "Tudo o que fizerem, façam de todo o coração, como para o Senhor, e não para os homens.", referencia: "Colossenses 3:23" },
  { texto: "O Senhor é o meu pastor; de nada terei falta.", referencia: "Salmos 23:1" },
  { texto: "Posso todas as coisas naquele que me fortalece.", referencia: "Filipenses 4:13" },
  { texto: "Confie no Senhor de todo o seu coração e não se apoie em seu próprio entendimento.", referencia: "Provérbios 3:5" },
  { texto: "Busquem, pois, em primeiro lugar o Reino de Deus e a sua justiça.", referencia: "Mateus 6:33" }
];

export default function ComprovanteVenda({ venda, itens = [], onClose }) {
  const [versiculoAtual] = React.useState(() => {
    return versiculos[Math.floor(Math.random() * versiculos.length)];
  });
  
  const calcularSubtotal = () => {
    return itens.reduce((total, item) => total + (item.preco_unitario * item.quantidade), 0);
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
            background: '#ffffffff',
            padding: '25px',
            textAlign: 'center',
            borderBottom: '3px solid #e7e4e4ff'
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
              color: '#0e0a0aff',
              marginBottom: '3px',
              letterSpacing: '2px'
            }}>COMPROVANTE DE PAGAMENTO</div>
            <div style={{
              fontSize: '12px',
              color: '#0a0606ff',
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
                  <div style={{ width: '85px', textAlign: 'right', fontWeight: 'bold' }}>
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
                  <div style={{ width: '85px', textAlign: 'right', fontWeight: 'bold' }}>
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
              border: '1px solid #ddd'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '13px',
                marginBottom: '6px',
                color: '#333'
              }}>
                <span>Subtotal:</span>
                <span>R$ {calcularSubtotal().toFixed(2)}</span>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontWeight: 'bold',
                fontSize: '18px',
                marginTop: '10px',
                paddingTop: '10px',
                borderTop: '2px solid #333',
                color: '#000'
              }}>
                <span>TOTAL:</span>
                <span>R$ {parseFloat(venda.valor_final).toFixed(2)}</span>
              </div>
            </div>
            
            {/* Pagamento */}
            <div style={{
              margin: '18px 0',
              fontSize: '12px',
              textAlign: 'center',
              padding: '12px',
              background: '#f9f9f9',
              border: '1px solid #ddd'
            }}>
              <strong style={{ display: 'block', marginBottom: '6px', color: '#333', fontSize: '13px' }}>
                FORMA DE PAGAMENTO
              </strong>
              <span style={{ color: '#000', fontWeight: 'bold' }}>
                {(() => {
                  switch(venda.forma_pagamento) {
                    case 'dinheiro': return 'Dinheiro';
                    case 'cartao_credito': return 'Cartão de Crédito';
                    case 'cartao_debito': return 'Cartão de Débito';
                    case 'pix': return 'PIX';
                    default: return venda.forma_pagamento || 'Não informado';
                  }
                })()}
              </span>
            </div>
            
            {/* Versículo */}
            <div style={{
              fontStyle: 'italic',
              margin: '18px 0',
              padding: '12px',
              background: '#fafafa',
              borderLeft: '3px solid #f1efefff',
              fontSize: '11px',
              color: '#555',
              lineHeight: '1.5'
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
              color: '#666'
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