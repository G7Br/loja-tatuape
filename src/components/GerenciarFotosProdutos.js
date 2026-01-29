import React, { useState } from 'react';
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
  max-width: 600px;
  color: white;
  max-height: 80vh;
  overflow-y: auto;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  
  h3 {
    margin: 0;
    color: #ffffff;
  }
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: #999;
  font-size: 24px;
  cursor: pointer;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    color: #fff;
  }
`;

const Input = styled.input`
  width: 100%;
  padding: 15px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid #333333;
  border-radius: 8px;
  color: #ffffff;
  font-size: 16px;
  margin-bottom: 15px;
  
  &::placeholder {
    color: #888888;
  }
  
  &:focus {
    outline: none;
    border-color: #555555;
  }
`;

const Button = styled.button`
  padding: 12px 24px;
  background: #ffffff;
  color: #000000;
  border: none;
  border-radius: 8px;
  font-weight: 700;
  cursor: pointer;
  margin-right: 10px;
  transition: all 0.3s ease;
  
  &:hover { 
    background: #cccccc;
  }
  
  &.success { 
    background: #10b981; 
    color: #ffffff; 
    &:hover { background: #059669; }
  }
  
  &.danger { 
    background: #ef4444; 
    color: #ffffff; 
    &:hover { background: #dc2626; }
  }
  
  &.secondary { 
    background: #6b7280; 
    color: #ffffff; 
    &:hover { background: #4b5563; }
  }
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

const FileInput = styled.input`
  display: none;
`;

const FileInputLabel = styled.label`
  display: inline-block;
  padding: 12px 24px;
  background: #3b82f6;
  color: white;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
  margin-bottom: 15px;
  
  &:hover {
    background: #2563eb;
  }
`;

export default function GerenciarFotosProdutos({ produto, onClose, onSave, supabase, loja }) {
  const [fotoUrl, setFotoUrl] = useState(produto?.foto_url || '');
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(produto?.foto_url || '');

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione apenas arquivos de imagem!');
      return;
    }

    // Validar tamanho (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Arquivo muito grande! Máximo 5MB.');
      return;
    }

    setUploading(true);

    try {
      // Converter para base64 para armazenar diretamente no banco
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target.result;
        setFotoUrl(base64);
        setPreviewUrl(base64);
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Erro ao processar imagem:', error);
      alert('Erro ao processar imagem!');
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!fotoUrl.trim()) {
      alert('Digite uma URL ou faça upload de uma imagem!');
      return;
    }

    try {
      const tabela = loja === 'mogi' ? 'produtos_mogi' : 'produtos_tatuape';
      
      const { error } = await supabase
        .from(tabela)
        .update({ foto_url: fotoUrl })
        .eq('id', produto.id);

      if (error) throw error;

      alert('Foto atualizada com sucesso!');
      onSave(produto.id, fotoUrl);
      onClose();
    } catch (error) {
      console.error('Erro ao salvar foto:', error);
      alert('Erro ao salvar foto: ' + error.message);
    }
  };

  const handleRemoveFoto = async () => {
    if (!confirm('Tem certeza que deseja remover a foto?')) return;

    try {
      const tabela = loja === 'mogi' ? 'produtos_mogi' : 'produtos_tatuape';
      
      const { error } = await supabase
        .from(tabela)
        .update({ foto_url: null })
        .eq('id', produto.id);

      if (error) throw error;

      alert('Foto removida com sucesso!');
      onSave(produto.id, null);
      onClose();
    } catch (error) {
      console.error('Erro ao remover foto:', error);
      alert('Erro ao remover foto: ' + error.message);
    }
  };

  return (
    <Modal onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <h3>Gerenciar Foto do Produto</h3>
          <CloseButton onClick={onClose}>×</CloseButton>
        </ModalHeader>

        <div style={{ marginBottom: '20px' }}>
          <strong>Produto:</strong> {produto?.nome}<br/>
          <strong>Código:</strong> {produto?.codigo}
        </div>

        <ImagePreview>
          {previewUrl ? (
            <img src={previewUrl} alt="Preview" />
          ) : (
            <div style={{ textAlign: 'center', color: '#666' }}>
              <div style={{ fontSize: '3rem', marginBottom: '10px' }}>📷</div>
              <div>Nenhuma imagem selecionada</div>
            </div>
          )}
        </ImagePreview>

        <FileInput
          id="foto-upload"
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          disabled={uploading}
        />
        <FileInputLabel htmlFor="foto-upload">
          {uploading ? 'Processando...' : '📁 Selecionar Imagem'}
        </FileInputLabel>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '10px', color: '#ccc' }}>
            Ou digite a URL da imagem:
          </label>
          <Input
            placeholder="https://exemplo.com/imagem.jpg"
            value={fotoUrl}
            onChange={(e) => {
              setFotoUrl(e.target.value);
              setPreviewUrl(e.target.value);
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <Button className="secondary" onClick={onClose}>
            Cancelar
          </Button>
          {produto?.foto_url && (
            <Button className="danger" onClick={handleRemoveFoto}>
              Remover Foto
            </Button>
          )}
          <Button className="success" onClick={handleSave} disabled={uploading}>
            {uploading ? 'Salvando...' : 'Salvar Foto'}
          </Button>
        </div>

        <div style={{ 
          marginTop: '20px', 
          padding: '15px', 
          background: '#2a2a2a', 
          borderRadius: '8px',
          fontSize: '12px',
          color: '#ccc'
        }}>
          <strong>💡 Dicas:</strong><br/>
          • Formatos aceitos: JPG, PNG, GIF, WebP<br/>
          • Tamanho máximo: 5MB<br/>
          • Resolução recomendada: 800x600px<br/>
          • A imagem será exibida no catálogo online
        </div>
      </ModalContent>
    </Modal>
  );
}