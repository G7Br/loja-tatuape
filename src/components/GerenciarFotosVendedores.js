import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

const Container = styled.div`
  background: #111111;
  border: 1px solid #333;
  border-radius: 12px;
  padding: 25px;
  margin-bottom: 30px;
`;

const Title = styled.h3`
  margin: 0 0 20px 0;
  color: #fff;
  font-size: 1.2rem;
`;

const VendedorCard = styled.div`
  display: flex;
  align-items: center;
  padding: 15px;
  background: #1a1a1a;
  border: 1px solid #333;
  border-radius: 8px;
  margin-bottom: 15px;
  gap: 20px;
  
  @media (max-width: 768px) {
    padding: 12px;
    gap: 15px;
  }
`;

const FotoContainer = styled.div`
  position: relative;
  width: 80px;
  height: 80px;
  border-radius: 50%;
  overflow: hidden;
  border: 2px solid #333;
  background: #222;
  display: flex;
  align-items: center;
  justify-content: center;
  
  @media (max-width: 768px) {
    width: 60px;
    height: 60px;
  }
`;

const FotoVendedor = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const FotoPlaceholder = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  color: #666;
`;

const VendedorInfo = styled.div`
  flex: 1;
`;

const VendedorNome = styled.div`
  font-size: 1.1rem;
  font-weight: bold;
  color: #fff;
  margin-bottom: 5px;
  
  @media (max-width: 768px) {
    font-size: 1rem;
  }
`;

const VendedorTipo = styled.div`
  font-size: 0.9rem;
  color: #999;
  
  @media (max-width: 768px) {
    font-size: 0.8rem;
  }
`;

const FileInput = styled.input`
  display: none;
`;

const UploadButton = styled.button`
  padding: 8px 16px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background: #2563eb;
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  @media (max-width: 768px) {
    padding: 6px 10px;
    font-size: 10px;
  }
`;

const RemoveButton = styled.button`
  padding: 8px 16px;
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-left: 10px;
  
  &:hover {
    background: #dc2626;
  }
  
  @media (max-width: 768px) {
    padding: 6px 10px;
    font-size: 10px;
    margin-left: 5px;
  }
`;

const ActionButtons = styled.div`
  display: flex;
  align-items: center;
  
  @media (max-width: 768px) {
    gap: 5px;
  }
`;

export default function GerenciarFotosVendedores({ vendedores, onUpdateFoto, supabase }) {
  const [uploading, setUploading] = useState({});

  const handleFileSelect = async (vendedorId, file) => {
    if (!file) return;

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione apenas arquivos de imagem.');
      return;
    }

    // Validar tamanho (máximo 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('A imagem deve ter no máximo 2MB.');
      return;
    }

    setUploading(prev => ({ ...prev, [vendedorId]: true }));

    try {
      // Converter para base64
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = e.target.result;
        
        // Atualizar no banco de dados
        const { error } = await supabase
          .from(window.location.pathname.includes('mogi') ? 'usuarios_mogi' : 'usuarios_tatuape')
          .update({ foto_url: base64 })
          .eq('id', vendedorId);

        if (error) {
          console.error('Erro ao salvar foto:', error);
          alert('Erro ao salvar foto: ' + error.message);
        } else {
          alert('Foto atualizada com sucesso!');
          onUpdateFoto(vendedorId, base64);
        }
        
        setUploading(prev => ({ ...prev, [vendedorId]: false }));
      };

      reader.onerror = () => {
        alert('Erro ao processar a imagem.');
        setUploading(prev => ({ ...prev, [vendedorId]: false }));
      };

      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      alert('Erro ao fazer upload da foto.');
      setUploading(prev => ({ ...prev, [vendedorId]: false }));
    }
  };

  const handleRemoveFoto = async (vendedorId) => {
    if (!confirm('Tem certeza que deseja remover a foto deste vendedor?')) return;

    setUploading(prev => ({ ...prev, [vendedorId]: true }));

    try {
      const { error } = await supabase
        .from(window.location.pathname.includes('mogi') ? 'usuarios_mogi' : 'usuarios_tatuape')
        .update({ foto_url: null })
        .eq('id', vendedorId);

      if (error) {
        console.error('Erro ao remover foto:', error);
        alert('Erro ao remover foto: ' + error.message);
      } else {
        alert('Foto removida com sucesso!');
        onUpdateFoto(vendedorId, null);
      }
    } catch (error) {
      console.error('Erro ao remover foto:', error);
      alert('Erro ao remover foto.');
    }

    setUploading(prev => ({ ...prev, [vendedorId]: false }));
  };

  return (
    <Container>
      <Title>📸 Gerenciar Fotos dos Vendedores</Title>
      
      {vendedores.filter(v => v.tipo === 'vendedor').map(vendedor => (
        <VendedorCard key={vendedor.id}>
          <FotoContainer>
            {vendedor.foto_url ? (
              <FotoVendedor src={vendedor.foto_url} alt={vendedor.nome} />
            ) : (
              <FotoPlaceholder>👤</FotoPlaceholder>
            )}
          </FotoContainer>
          
          <VendedorInfo>
            <VendedorNome>{vendedor.nome}</VendedorNome>
            <VendedorTipo>Vendedor</VendedorTipo>
          </VendedorInfo>
          
          <ActionButtons>
            <FileInput
              id={`foto-${vendedor.id}`}
              type="file"
              accept="image/*"
              onChange={(e) => handleFileSelect(vendedor.id, e.target.files[0])}
            />
            <UploadButton
              as="label"
              htmlFor={`foto-${vendedor.id}`}
              disabled={uploading[vendedor.id]}
            >
              {uploading[vendedor.id] ? 'Salvando...' : vendedor.foto_url ? 'Alterar Foto' : 'Adicionar Foto'}
            </UploadButton>
            
            {vendedor.foto_url && (
              <RemoveButton
                onClick={() => handleRemoveFoto(vendedor.id)}
                disabled={uploading[vendedor.id]}
              >
                Remover
              </RemoveButton>
            )}
          </ActionButtons>
        </VendedorCard>
      ))}
      
      {vendedores.filter(v => v.tipo === 'vendedor').length === 0 && (
        <div style={{ color: '#999', textAlign: 'center', padding: '20px' }}>
          Nenhum vendedor encontrado.
        </div>
      )}
    </Container>
  );
}