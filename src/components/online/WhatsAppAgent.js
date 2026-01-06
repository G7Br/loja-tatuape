import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '../../contexts/ThemeContext';

export default function WhatsAppAgent({ user, produtos, onAddToCart }) {
  const { darkMode } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [currentClient, setCurrentClient] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const agentResponses = {
    greeting: [
      "Olá! 👋 Bem-vindo à VH Alfaiataria! Como posso ajudá-lo hoje?",
      "Oi! Sou o assistente virtual da VH. Em que posso ajudar?",
      "Olá! Que bom ter você aqui! Como posso te ajudar?"
    ],
    products: [
      "Temos uma linha completa de roupas masculinas! Que tipo de peça você está procurando?",
      "Nossa coleção inclui camisas, calças, ternos e acessórios. O que te interessa?",
      "Posso te mostrar nossos produtos! Você tem alguma preferência de estilo ou cor?"
    ],
    help: [
      "Posso te ajudar com: 📱 Ver produtos, 💰 Preços, 📦 Entrega, 🛒 Fazer pedido",
      "Estou aqui para: mostrar produtos, tirar dúvidas sobre preços e fazer seu pedido!",
      "Como posso ajudar? Produtos, preços, entrega ou fazer um pedido?"
    ]
  };

  const getRandomResponse = (category) => {
    const responses = agentResponses[category];
    return responses[Math.floor(Math.random() * responses.length)];
  };

  const processMessage = (message) => {
    const msg = message.toLowerCase();
    
    if (msg.includes('oi') || msg.includes('olá') || msg.includes('ola')) {
      return getRandomResponse('greeting');
    }
    
    if (msg.includes('produto') || msg.includes('roupa') || msg.includes('camisa') || msg.includes('calça')) {
      return getRandomResponse('products');
    }
    
    if (msg.includes('preço') || msg.includes('valor') || msg.includes('quanto')) {
      return "Os preços variam conforme o produto. Posso te mostrar nossa vitrine com valores atualizados! 💰";
    }
    
    if (msg.includes('entrega') || msg.includes('envio') || msg.includes('frete')) {
      return "Fazemos entrega em toda região! 🚚 Retirada na loja, entrega local ou correios. Qual prefere?";
    }
    
    if (msg.includes('ajuda') || msg.includes('help')) {
      return getRandomResponse('help');
    }
    
    return "Interessante! Posso te mostrar nossos produtos ou tirar alguma dúvida específica? 😊";
  };

  const sendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage = {
      id: Date.now(),
      text: inputMessage,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    // Simular digitação do agente
    setTimeout(() => {
      const agentResponse = {
        id: Date.now() + 1,
        text: processMessage(inputMessage),
        sender: 'agent',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, agentResponse]);
      setIsTyping(false);
      
      // Sugerir produtos após algumas mensagens
      if (messages.length > 2) {
        setTimeout(() => {
          const productSuggestion = {
            id: Date.now() + 2,
            text: "Que tal dar uma olhada em nossos produtos em destaque? 👔✨",
            sender: 'agent',
            timestamp: new Date(),
            showProducts: true
          };
          setMessages(prev => [...prev, productSuggestion]);
        }, 2000);
      }
    }, 1500);
  };

  const startNewChat = () => {
    const welcomeMessage = {
      id: Date.now(),
      text: getRandomResponse('greeting'),
      sender: 'agent',
      timestamp: new Date()
    };
    setMessages([welcomeMessage]);
  };

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      startNewChat();
    }
  }, [isOpen]);

  return (
    <>
      {/* Botão WhatsApp Flutuante */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          width: '60px',
          height: '60px',
          background: '#25D366',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(37, 211, 102, 0.4)',
          zIndex: 1000,
          transition: 'all 0.3s ease'
        }}
      >
        <span style={{ fontSize: '24px', color: 'white' }}>💬</span>
      </div>

      {/* Chat Window */}
      {isOpen && (
        <div style={{
          position: 'fixed',
          bottom: '90px',
          right: '20px',
          width: '350px',
          height: '500px',
          background: darkMode ? '#1a1a1a' : '#ffffff',
          border: `1px solid ${darkMode ? '#333' : '#e5e7eb'}`,
          borderRadius: '12px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          {/* Header */}
          <div style={{
            background: '#25D366',
            color: 'white',
            padding: '1rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <h4 style={{ margin: 0, fontSize: '1rem' }}>Assistente VH</h4>
              <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.9 }}>Online agora</p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'white',
                fontSize: '1.2rem',
                cursor: 'pointer'
              }}
            >
              ✕
            </button>
          </div>

          {/* Messages */}
          <div style={{
            flex: 1,
            padding: '1rem',
            overflowY: 'auto',
            background: darkMode ? '#0a0a0a' : '#f8f9fa'
          }}>
            {messages.map(message => (
              <div key={message.id} style={{
                marginBottom: '1rem',
                display: 'flex',
                justifyContent: message.sender === 'user' ? 'flex-end' : 'flex-start'
              }}>
                <div style={{
                  maxWidth: '80%',
                  padding: '0.75rem',
                  borderRadius: '12px',
                  background: message.sender === 'user' 
                    ? '#25D366' 
                    : (darkMode ? '#2a2a2a' : '#ffffff'),
                  color: message.sender === 'user' ? 'white' : (darkMode ? '#ffffff' : '#000000'),
                  border: message.sender === 'agent' ? `1px solid ${darkMode ? '#333' : '#e5e7eb'}` : 'none'
                }}>
                  <p style={{ margin: 0, fontSize: '0.9rem' }}>{message.text}</p>
                  
                  {/* Mostrar produtos em destaque */}
                  {message.showProducts && (
                    <div style={{ marginTop: '0.5rem' }}>
                      {produtos.slice(0, 3).map(produto => (
                        <div key={produto.produto_id} style={{
                          background: darkMode ? '#1a1a1a' : '#f8f9fa',
                          border: `1px solid ${darkMode ? '#333' : '#e5e7eb'}`,
                          borderRadius: '8px',
                          padding: '0.5rem',
                          marginBottom: '0.5rem',
                          cursor: 'pointer'
                        }}
                        onClick={() => onAddToCart && onAddToCart(produto)}
                        >
                          <div style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>
                            {produto.produto_nome}
                          </div>
                          <div style={{ fontSize: '0.7rem', color: '#25D366' }}>
                            R$ {produto.preco_online?.toFixed(2)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <div style={{ 
                    fontSize: '0.7rem', 
                    opacity: 0.7, 
                    marginTop: '0.25rem',
                    textAlign: 'right'
                  }}>
                    {message.timestamp.toLocaleTimeString('pt-BR', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </div>
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div style={{
                display: 'flex',
                justifyContent: 'flex-start',
                marginBottom: '1rem'
              }}>
                <div style={{
                  padding: '0.75rem',
                  borderRadius: '12px',
                  background: darkMode ? '#2a2a2a' : '#ffffff',
                  border: `1px solid ${darkMode ? '#333' : '#e5e7eb'}`
                }}>
                  <span style={{ fontSize: '0.9rem' }}>Digitando...</span>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div style={{
            padding: '1rem',
            borderTop: `1px solid ${darkMode ? '#333' : '#e5e7eb'}`,
            background: darkMode ? '#1a1a1a' : '#ffffff'
          }}>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Digite sua mensagem..."
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  border: `1px solid ${darkMode ? '#333' : '#e5e7eb'}`,
                  borderRadius: '20px',
                  background: darkMode ? '#2a2a2a' : '#f8f9fa',
                  color: darkMode ? '#ffffff' : '#000000',
                  outline: 'none'
                }}
              />
              <button
                onClick={sendMessage}
                style={{
                  padding: '0.75rem 1rem',
                  background: '#25D366',
                  color: 'white',
                  border: 'none',
                  borderRadius: '20px',
                  cursor: 'pointer'
                }}
              >
                ➤
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}