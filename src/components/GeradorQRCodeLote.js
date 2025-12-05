import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

const Modal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: #1a1a1a;
  border: 1px solid #333;
  border-radius: 12px;
  padding: 30px;
  width: 90%;
  max-width: 800px;
  max-height: 80vh;
  overflow-y: auto;
  color: white;
`;

const Button = styled.button`
  padding: 12px 24px;
  margin: 5px;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &.primary {
    background: #3b82f6;
    color: white;
    &:hover { background: #2563eb; }
  }
  
  &.success {
    background: #10b981;
    color: white;
    &:hover { background: #059669; }
  }
  
  &.secondary {
    background: #6b7280;
    color: white;
    &:hover { background: #4b5563; }
  }
`;

const QRGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin: 20px 0;
`;

const QRItem = styled.div`
  background: white;
  padding: 15px;
  border-radius: 8px;
  text-align: center;
  color: black;
`;

export default function GeradorQRCodeLote({ produtos, onClose }) {
  const [qrCodes, setQrCodes] = useState([]);
  const [loading, setLoading] = useState(false);

  const gerarQRCodesLote = async () => {
    setLoading(true);
    const qrs = [];
    
    try {
      const QRCode = (await import('qrcode')).default;
      
      for (const produto of produtos) {
        try {
          // QR code contém apenas o código do produto para compatibilidade com o scanner
          const qrData = produto.codigo;
          const qrUrl = await QRCode.toDataURL(qrData, {
            width: 150,
            margin: 1,
            color: {
              dark: '#000000',
              light: '#FFFFFF'
            }
          });
          
          qrs.push({ produto, qrUrl });
        } catch (error) {
          console.error(`Erro ao gerar QR Code para ${produto.codigo}:`, error);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar biblioteca QRCode:', error);
      alert('Erro ao carregar gerador de QR Code');
    }
    
    setQrCodes(qrs);
    setLoading(false);
  };

  const imprimirTodos = () => {
    const printWindow = window.open('', '_blank');
    const qrHtml = qrCodes.map(({ produto, qrUrl }) => `
      <div style="
        display: inline-block; 
        border: 1px solid #ccc; 
        padding: 10px; 
        margin: 10px; 
        text-align: center;
        page-break-inside: avoid;
      ">
        <div style="font-size: 12px; margin-bottom: 5px;">
          <strong>${produto.nome}</strong><br>
          ${produto.codigo} - R$ ${parseFloat(produto.preco_venda).toFixed(2)}
        </div>
        <img src="${qrUrl}" alt="QR Code" />
      </div>
    `).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>QR Codes - Lote</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              padding: 20px; 
            }
            @media print {
              body { margin: 0; }
            }
          </style>
        </head>
        <body>${qrHtml}</body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 500);
  };

  useEffect(() => {
    if (produtos?.length > 0) {
      gerarQRCodesLote();
    }
  }, [produtos]);

  return (
    <Modal onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <h3>QR Codes em Lote ({produtos?.length || 0} produtos)</h3>
        
        {loading && <div>Gerando QR Codes...</div>}
        
        {qrCodes.length > 0 && (
          <>
            <QRGrid>
              {qrCodes.map(({ produto, qrUrl }, index) => (
                <QRItem key={index}>
                  <div style={{ fontSize: '12px', marginBottom: '8px' }}>
                    <strong>{produto.nome}</strong><br/>
                    {produto.codigo} - R$ {parseFloat(produto.preco_venda).toFixed(2)}
                  </div>
                  <img src={qrUrl} alt="QR Code" style={{ width: '100px' }} />
                </QRItem>
              ))}
            </QRGrid>
            
            <div style={{ textAlign: 'center' }}>
              <Button className="primary" onClick={imprimirTodos}>
                Imprimir Todos
              </Button>
            </div>
          </>
        )}
        
        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <Button className="secondary" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </ModalContent>
    </Modal>
  );
}