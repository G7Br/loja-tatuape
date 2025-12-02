import React from 'react';
import styled from 'styled-components';
import { formatBrasiliaDateTime, formatCurrency } from '../../utils/dateUtils';

const Modal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ComprovanteContainer = styled.div`
  background: white;
  width: 400px;
  max-height: 90vh;
  overflow-y: auto;
  border-radius: 0.5rem;
  box-shadow: 0 20px 40px rgba(0,0,0,0.3);
`;

const ComprovanteContent = styled.div`
  padding: 2rem;
  font-family: 'Courier New', monospace;
  font-size: 0.9rem;
  line-height: 1.4;
  color: #000;
`;

const Header = styled.div`
  text-align: center;
  border-bottom: 2px dashed #333;
  padding-bottom: 1rem;
  margin-bottom: 1rem;
`;

const Logo = styled.div`
  font-size: 1.5rem;
  font-weight: bold;
  margin-bottom: 0.5rem;
`;

const Section = styled.div`
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px dashed #ccc;
`;

const Row = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.25rem;
`;

const Total = styled.div`
  font-size: 1.1rem;
  font-weight: bold;
  text-align: center;
  margin: 1rem 0;
  padding: 0.5rem;
  border: 2px solid #333;
`;

const Footer = styled.div`
  text-align: center;
  font-size: 0.8rem;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 2px dashed #333;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: center;
  padding: 1rem;
  background: #f8f9fa;
  border-top: 1px solid #e5e7eb;
`;

const Button = styled.button`
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s ease;
  
  &.primary {
    background: #3b82f6;
    color: white;
    
    &:hover {
      background: #2563eb;
    }
  }
  
  &.secondary {
    background: #6b7280;
    color: white;
    
    &:hover {
      background: #4b5563;
    }
  }
`;

export default function ComprovanteVendaMogi({ venda, itens, onClose, dadosPagamento }) {
  const imprimirComprovante = () => {
    const printWindow = window.open('', '_blank');
    const comprovanteHtml = document.querySelector('.comprovante-content').innerHTML;
    
    printWindow.document.write(`
      <html>
        <head>
          <title>Comprovante - ${venda.numero_venda}</title>
          <style>
            body { 
              font-family: 'Courier New', monospace; 
              font-size: 12px; 
              line-height: 1.4; 
              margin: 0; 
              padding: 20px;
            }
            .no-print { display: none; }
          </style>
        </head>
        <body>
          ${comprovanteHtml}
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.print();
  };

  const calcularSubtotal = () => {
    return itens.reduce((sum, item) => sum + (item.preco_unitario * item.quantidade), 0);
  };

  return (
    <Modal>
      <ComprovanteContainer>
        <ComprovanteContent className="comprovante-content">
          <Header>
            <Logo>VH ALFAIATARIA</Logo>
            <div>LOJA MOGI DAS CRUZES</div>
            <div style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>
              Rua das Flores, 123 - Centro<br/>
              Mogi das Cruzes - SP<br/>
              Tel: (11) 4728-0000
            </div>
          </Header>

          <Section>
            <div style={{ textAlign: 'center', fontWeight: 'bold', marginBottom: '0.5rem' }}>
              COMPROVANTE DE VENDA
            </div>
            <Row>
              <span>Número:</span>
              <span>{venda.numero_venda}</span>
            </Row>
            <Row>
              <span>Data:</span>
              <span>{formatBrasiliaDateTime(venda.data_venda)}</span>
            </Row>
            <Row>
              <span>Vendedor:</span>
              <span>{venda.vendedor_nome}</span>
            </Row>
            <Row>
              <span>Cliente:</span>
              <span>{venda.cliente_nome}</span>
            </Row>
            {venda.cliente_telefone && (
              <Row>
                <span>Telefone:</span>
                <span>{venda.cliente_telefone}</span>
              </Row>
            )}
          </Section>

          <Section>
            <div style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>ITENS:</div>
            {itens.map((item, index) => (
              <div key={index} style={{ marginBottom: '0.5rem' }}>
                <Row>
                  <span>{item.produto_nome}</span>
                  <span></span>
                </Row>
                <Row style={{ fontSize: '0.8rem' }}>
                  <span>{item.quantidade}x {formatCurrency(item.preco_unitario)}</span>
                  <span>{formatCurrency(item.preco_unitario * item.quantidade)}</span>
                </Row>
              </div>
            ))}
          </Section>

          <Section>
            <Row>
              <span>Subtotal:</span>
              <span>{formatCurrency(calcularSubtotal())}</span>
            </Row>
            {venda.desconto > 0 && (
              <Row>
                <span>Desconto:</span>
                <span>-{formatCurrency(venda.desconto)}</span>
              </Row>
            )}
            <Total>
              TOTAL: {formatCurrency(venda.valor_final)}
            </Total>
          </Section>

          <Section>
            <Row>
              <span>Forma Pagamento:</span>
              <span>{venda.forma_pagamento?.toUpperCase()}</span>
            </Row>
            {dadosPagamento?.valorPago && (
              <Row>
                <span>Valor Pago:</span>
                <span>{formatCurrency(dadosPagamento.valorPago)}</span>
              </Row>
            )}
            {dadosPagamento?.troco > 0 && (
              <Row>
                <span>Troco:</span>
                <span>{formatCurrency(dadosPagamento.troco)}</span>
              </Row>
            )}
          </Section>

          <Footer>
            <div>Obrigado pela preferência!</div>
            <div style={{ marginTop: '0.5rem' }}>
              www.vhalfaiataria.com.br
            </div>
            <div style={{ marginTop: '1rem', fontSize: '0.7rem' }}>
              Via do Cliente - Mogi das Cruzes
            </div>
          </Footer>
        </ComprovanteContent>

        <ActionButtons className="no-print">
          <Button className="primary" onClick={imprimirComprovante}>
            🖨️ Imprimir
          </Button>
          <Button className="secondary" onClick={onClose}>
            ✕ Fechar
          </Button>
        </ActionButtons>
      </ComprovanteContainer>
    </Modal>
  );
}