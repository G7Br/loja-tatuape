import React from 'react';
import styled from 'styled-components';
import { formatBrasiliaDateTime, formatCurrency } from '../../utils/dateUtils';

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
  const [versiculoAtual] = React.useState(() => {
    return versiculos[Math.floor(Math.random() * versiculos.length)];
  });
  
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
            <Logo>VH</Logo>
            <div>LOJA MOGI DAS CRUZES</div>
            <div style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>
              Av. Fernando Costa, 195 - Centro<br/>
              Mogi das Cruzes - SP<br/>
              Tel:  (11) 91323-5358
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
            {/* Versículo */}
            <div style={{
              fontStyle: 'italic',
              margin: '1rem 0',
              padding: '0.75rem',
              background: '#f5f5f5',
              borderLeft: '3px solid #333',
              fontSize: '0.8rem',
              color: '#333',
              lineHeight: '1.4',
              borderRadius: '0 4px 4px 0'
            }}>
              "{versiculoAtual.texto}"<br/>
              <strong>— {versiculoAtual.referencia}</strong>
            </div>
            
            <div>Obrigado pela preferência!</div>
            <div style={{ marginTop: '0.5rem' }}>
              https://www.vhgravatas.com/
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