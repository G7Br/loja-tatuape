import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { onlineService } from '../../utils/onlineService';
import { supabase } from '../../utils/supabase';

const Container = styled.div`
  background: #111111;
  border: 1px solid #333333;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  margin-top: 20px;
`;

const ProductCard = styled.div`
  background: #1a1a1a;
  border: 1px solid #333;
  border-radius: 8px;
  padding: 15px;
  display: flex;
  gap: 15px;
`;

const ImageContainer = styled.div`
  width: 80px;
  height: 80px;
  background: #222;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border: 2px dashed #555;
  flex-shrink: 0;
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const ProductInfo = styled.div`
  flex: 1;
  
  h4 {
    margin: 0 0 5px 0;
    color: #fff;
    font-size: 0.9rem;
  }
  
  p {
    margin: 2px 0;
    color: #999;
    font-size: 0.8rem;
  }
`;

const Button = styled.button`
  padding: 6px 12px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background: #2563eb;
  }
  
  &.success {
    background: #10b981;
    &:hover { background: #059669; }
  }
  
  &.warning {
    background: #f59e0b;
    &:hover { background: #d97706; }
  }
`;

const SearchInput = styled.input`
  width: 100%;
  max-width: 400px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid #333333;
  border-radius: 8px;
  color: #ffffff;
  font-size: 14px;
  margin-bottom: 20px;
  
  &::placeholder {
    color: #888888;
  }
  
  &:focus {
    outline: none;
    border-color: #555555;
  }
`;

const FilterContainer = styled.div`
  display: flex;
  gap: 15px;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
`;

const Select = styled.select`
  padding: 8px 12px;
  background: #333;
  border: 1px solid #555;
  border-radius: 6px;
  color: #fff;
  font-size: 14px;
  
  option {
    background: #333;
    color: #fff;
  }
`;

const StatusBadge = styled.span`
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.7rem;
  font-weight: bold;
  
  &.com-foto {
    background: #10b981;
    color: white;
  }
  
  &.sem-foto {
    background: #ef4444;
    color: white;
  }
`;

export default function GerenciarFotosOnline() {
  const [produtos, setProdutos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState('');
  const [lojaFiltro, setLojaFiltro] = useState('todas');
  const [statusFiltro, setStatusFiltro] = useState('todos');

  useEffect(() => {
    carregarProdutos();
  }, []);

  const carregarProdutos = async () => {
    try {
      setLoading(true);
      const produtosData = await onlineService.getProdutosOnline();
      setProdutos(produtosData);
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
    } finally {
      setLoading(false);
    }
  };

  const sincronizarFotoEspecifica = async (produto) => {
    try {
      // Buscar foto atualizada da loja de origem
      const { data, error } = await supabase
        .from(`produtos_${produto.loja_origem}`)
        .select('foto_url')
        .eq('codigo', produto.produto_codigo)
        .single();
      
      if (error) throw error;
      
      // Sincronizar com sistema online usando a função RPC
      const { error: syncError } = await supabase.rpc('sync_foto_produto_online', {
        p_codigo: produto.produto_codigo,
        p_loja: produto.loja_origem,
        p_foto_url: data.foto_url
      });
      
      if (syncError) throw syncError;
      
      alert('Foto sincronizada com sucesso!');
      carregarProdutos();
    } catch (error) {
      alert('Erro ao sincronizar foto: ' + error.message);
    }
  };

  const produtosFiltrados = produtos.filter(produto => {
    const matchFiltro = !filtro || 
      produto.produto_nome.toLowerCase().includes(filtro.toLowerCase()) ||
      produto.produto_codigo.toLowerCase().includes(filtro.toLowerCase());
    
    const matchLoja = lojaFiltro === 'todas' || produto.loja_origem === lojaFiltro;
    
    const temFoto = produto.foto_url && produto.foto_url.trim() !== '';
    const matchStatus = statusFiltro === 'todos' || 
      (statusFiltro === 'com-foto' && temFoto) ||
      (statusFiltro === 'sem-foto' && !temFoto);
    
    return matchFiltro && matchLoja && matchStatus;
  });

  if (loading) {
    return (
      <Container>
        <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
          Carregando produtos...
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3 style={{ margin: 0, color: '#fff' }}>Gerenciar Fotos dos Produtos Online</h3>
        <Button className="success" onClick={carregarProdutos}>
          🔄 Atualizar Lista
        </Button>
      </div>
      
      <FilterContainer>
        <SearchInput
          placeholder="Buscar por nome ou código..."
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
        />
        
        <Select value={lojaFiltro} onChange={(e) => setLojaFiltro(e.target.value)}>
          <option value="todas">Todas as Lojas</option>
          <option value="tatuape">Tatuapé</option>
          <option value="mogi">Mogi</option>
        </Select>
        
        <Select value={statusFiltro} onChange={(e) => setStatusFiltro(e.target.value)}>
          <option value="todos">Todos os Status</option>
          <option value="com-foto">Com Foto</option>
          <option value="sem-foto">Sem Foto</option>
        </Select>
        
        <div style={{ color: '#999', fontSize: '0.9rem' }}>
          {produtosFiltrados.length} produtos encontrados
        </div>
      </FilterContainer>

      {produtosFiltrados.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
          Nenhum produto encontrado com os filtros aplicados.
        </div>
      ) : (
        <Grid>
          {produtosFiltrados.map((produto, index) => {
            const temFoto = produto.foto_url && produto.foto_url.trim() !== '';
            
            return (
              <ProductCard key={index}>
                <ImageContainer>
                  {temFoto ? (
                    <img src={produto.foto_url} alt={produto.produto_nome} />
                  ) : (
                    <div style={{ textAlign: 'center', color: '#666' }}>
                      <div style={{ fontSize: '1.5rem', marginBottom: '5px' }}>📷</div>
                      <div style={{ fontSize: '0.7rem' }}>Sem foto</div>
                    </div>
                  )}
                </ImageContainer>
                
                <ProductInfo>
                  <h4>{produto.produto_nome}</h4>
                  <p><strong>Código:</strong> {produto.produto_codigo}</p>
                  <p><strong>Loja:</strong> {produto.loja_origem === 'tatuape' ? 'Tatuapé' : 'Mogi'}</p>
                  <p><strong>Categoria:</strong> {produto.categoria_online || 'N/A'}</p>
                  <p><strong>Preço:</strong> R$ {produto.preco_online?.toFixed(2) || '0.00'}</p>
                  
                  <div style={{ marginTop: '10px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <StatusBadge className={temFoto ? 'com-foto' : 'sem-foto'}>
                      {temFoto ? '✅ Com Foto' : '❌ Sem Foto'}
                    </StatusBadge>
                    
                    <Button onClick={() => sincronizarFotoEspecifica(produto)}>
                      🔄 Sincronizar
                    </Button>
                  </div>
                </ProductInfo>
              </ProductCard>
            );
          })}
        </Grid>
      )}
      
      <div style={{ 
        marginTop: '30px', 
        padding: '15px', 
        background: '#0a0a0a', 
        borderRadius: '8px',
        fontSize: '12px',
        color: '#ccc'
      }}>
        <strong>💡 Informações:</strong><br/>
        • As fotos são sincronizadas automaticamente quando definidas pelos gerentes das lojas<br/>
        • Use "Sincronizar" para forçar a atualização de uma foto específica<br/>
        • Produtos sem foto aparecerão sem imagem no catálogo online<br/>
        • As fotos podem ser em formato base64 ou URLs externas
      </div>
    </Container>
  );
}