import React, { useState } from 'react';
import styled from 'styled-components';
import { supabase } from '../../utils/supabase';

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
`;

const ImagePreview = styled.div`
  width: 100%;
  height: 200px;
  background: #222;
  border-radius: 8px;
  margin-bottom: 15px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border: 2px dashed #555;
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const Input = styled.input`
  width: 100%;
  padding: 12px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid #333333;
  border-radius: 8px;
  color: #ffffff;
  font-size: 14px;
  margin-bottom: 15px;
  
  &::placeholder {
    color: #888888;
  }
`;

const Button = styled.button`
  padding: 10px 20px;
  background: #ffffff;
  color: #000000;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  margin-right: 10px;
  
  &.success { 
    background: #10b981; 
    color: #ffffff; 
  }
  
  &.secondary { 
    background: #6b7280; 
    color: #ffffff; 
  }
`;

export default function AtualizarImagemProduto({ produto, onClose, onUpdate }) {
  const [novaFotoUrl, setNovaFotoUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const atualizarImagem = async () => {
    if (!novaFotoUrl.trim()) {
      alert('Digite uma URL válida!');
      return;
    }

    setLoading(true);
    try {
      const tabela = `produtos_${produto.loja_origem}`;
      
      const { error } = await supabase
        .from(tabela)
        .update({ foto_url: novaFotoUrl })
        .eq('codigo', produto.produto_codigo);

      if (error) throw error;

      alert('Imagem atualizada e sincronizada automaticamente!');
      onUpdate();
      onClose();
    } catch (error) {
      alert('Erro ao atualizar imagem: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <h3>Atualizar Imagem do Produto</h3>
        
        <div style={{ marginBottom: '20px' }}>
          <strong>Produto:</strong> {produto.produto_nome}<br/>
          <strong>Código:</strong> {produto.produto_codigo}<br/>
          <strong>Loja:</strong> {produto.loja_origem.toUpperCase()}
        </div>

        <ImagePreview>
          {produto.foto_url ? (
            <img src={produto.foto_url} alt="Atual" />
          ) : (
            <div style={{ textAlign: 'center', color: '#666' }}>
              <div style={{ fontSize: '3rem' }}>📷</div>
              <div>Sem imagem atual</div>
            </div>
          )}
        </ImagePreview>

        <Input
          placeholder="Cole a URL da nova imagem aqui..."
          value={novaFotoUrl}
          onChange={(e) => setNovaFotoUrl(e.target.value)}
        />

        {novaFotoUrl && (
          <ImagePreview>
            <img src={novaFotoUrl} alt="Preview" onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'block';
            }} />
            <div style={{ display: 'none', textAlign: 'center', color: '#ef4444' }}>
              URL inválida
            </div>
          </ImagePreview>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <Button className="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button 
            className="success" 
            onClick={atualizarImagem}
            disabled={loading || !novaFotoUrl.trim()}
          >
            {loading ? 'Atualizando...' : 'Atualizar Imagem'}
          </Button>
        </div>
      </ModalContent>
    </Modal>
  );
}