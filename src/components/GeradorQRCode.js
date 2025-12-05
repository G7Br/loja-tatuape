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
  max-width: 500px;
  color: white;
  text-align: center;
`;

const QRContainer = styled.div`
  background: white;
  padding: 20px;
  border-radius: 8px;
  margin: 20px 0;
  display: inline-block;
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

export default function GeradorQRCode({ produto, onClose }) {
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (produto) {
      gerarQRCode();
    }
  }, [produto]);

  const gerarQRCode = async () => {
    setLoading(true);
    try {
      const QRCode = (await import('qrcode')).default;
      
      // QR code contém apenas o código do produto para compatibilidade com o scanner
      const qrData = produto.codigo;
      const qrUrl = await QRCode.toDataURL(qrData, {
        width: 256,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      
      setQrCodeUrl(qrUrl);
    } catch (error) {
      console.error('Erro ao gerar QR Code:', error);
      alert('Erro ao gerar QR Code');
    }
    setLoading(false);
  };

  const baixarQRCode = () => {
    const link = document.createElement('a');
    link.download = `qrcode-${produto.codigo}.png`;
    link.href = qrCodeUrl;
    link.click();
  };

  const imprimirQRCode = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>QR Code - ${produto.codigo}</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              text-align: center; 
              padding: 20px; 
            }
            .qr-container { 
              border: 1px solid #ccc; 
              padding: 20px; 
              margin: 20px auto; 
              width: fit-content; 
            }
            .produto-info { 
              margin-bottom: 15px; 
              font-size: 14px; 
            }
          </style>
        </head>
        <body>
          <div class="qr-container">
            <div class="produto-info">
              <strong>${produto.nome}</strong><br>
              Código: ${produto.codigo}<br>
              Preço: R$ ${parseFloat(produto.preco_venda).toFixed(2)}
            </div>
            <img src="${qrCodeUrl}" alt="QR Code" />
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 500);
  };

  if (!produto) return null;

  return (
    <Modal onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <h3>QR Code do Produto</h3>
        
        <div style={{ marginBottom: '20px' }}>
          <strong>{produto.nome}</strong><br/>
          <span>Código: {produto.codigo}</span><br/>
          <span>Preço: R$ {parseFloat(produto.preco_venda).toFixed(2)}</span>
        </div>

        {loading ? (
          <div>Gerando QR Code...</div>
        ) : qrCodeUrl ? (
          <QRContainer>
            <img src={qrCodeUrl} alt="QR Code" />
          </QRContainer>
        ) : null}

        <div>
          <Button className="success" onClick={baixarQRCode} disabled={!qrCodeUrl}>
            Baixar PNG
          </Button>
          <Button className="primary" onClick={imprimirQRCode} disabled={!qrCodeUrl}>
            Imprimir
          </Button>
          <Button className="secondary" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </ModalContent>
    </Modal>
  );
}