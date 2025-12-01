// Additional pages for Caixa component
export const renderEstoquePage = (produtos, searchTerm, darkMode, TableContainer, TableHeader, TableRow) => {
  // Produtos já vêm filtrados do componente principal
  const produtosFiltrados = produtos.filter(p => {
    if (!p.nome) return false;
    const temEstoque = (p.estoque_atual || 0) > 0;
    return temEstoque;
  });
  
  return (
    <div>
      <h3 style={{marginBottom: '1rem', color: darkMode ? '#fff' : '#000'}}>Estoque Disponível</h3>
      {produtosFiltrados.length > 0 ? (
        <TableContainer $darkMode={darkMode}>
          <TableHeader $darkMode={darkMode}>
            <div>PRODUTO</div>
            <div>CÓDIGO</div>
            <div>ESTOQUE</div>
            <div>PREÇO</div>
            <div>STATUS</div>
          </TableHeader>
          {produtosFiltrados.map(produto => (
            <TableRow key={produto.id} $darkMode={darkMode}>
              <div>{produto.nome}</div>
              <div>{produto.codigo || 'N/A'}</div>
              <div style={{fontWeight: '600', color: produto.estoque_atual < 5 ? '#f59e0b' : '#10b981'}}>
                {produto.estoque_atual} unid.
              </div>
              <div>R$ {parseFloat(produto.preco_venda || 0).toFixed(2)}</div>
              <div>
                <span style={{
                  padding: '0.25rem 0.5rem',
                  borderRadius: '0.25rem',
                  fontSize: '0.8rem',
                  fontWeight: '600',
                  background: produto.estoque_atual === 0 ? '#ef4444' : produto.estoque_atual < 5 ? '#f59e0b' : '#10b981',
                  color: 'white'
                }}>
                  {produto.estoque_atual === 0 ? 'SEM ESTOQUE' : produto.estoque_atual < 5 ? 'BAIXO' : 'OK'}
                </span>
              </div>
            </TableRow>
          ))}
        </TableContainer>
      ) : (
        <div style={{padding: '4rem', textAlign: 'center', color: '#888'}}>
          <h3>{searchTerm ? 'Nenhum produto encontrado' : 'Nenhum produto em estoque'}</h3>
          <p>{searchTerm ? `Nenhum produto encontrado para "${searchTerm}"` : 'Não há produtos com estoque disponível'}</p>
        </div>
      )}
    </div>
  );
};

export const renderSaidaValoresPage = (darkMode, caixaAberto, setShowSaidaModal, historicoSaidas, TableContainer, TableHeader, TableRow) => {
  return (
    <div>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem'}}>
        <h2 style={{color: darkMode ? '#fff' : '#000', margin: 0}}>Saída de Valores</h2>
        <button
          onClick={() => setShowSaidaModal(true)}
          disabled={!caixaAberto}
          style={{
            padding: '0.75rem 1.5rem',
            background: !caixaAberto ? '#666' : '#ef4444',
            color: 'white',
            border: 'none',
            borderRadius: '0.5rem',
            cursor: !caixaAberto ? 'not-allowed' : 'pointer',
            fontWeight: '600'
          }}
        >
          💸 Nova Saída
        </button>
      </div>
      
      {!caixaAberto && (
        <div style={{
          background: darkMode ? '#2a1a1a' : '#fef2f2',
          border: '1px solid #ef4444',
          borderRadius: '0.5rem',
          padding: '1rem',
          marginBottom: '2rem',
          textAlign: 'center'
        }}>
          <p style={{color: '#ef4444', margin: 0, fontWeight: '600'}}>
            ⚠️ Caixa fechado - Abra o caixa para registrar saídas
          </p>
        </div>
      )}
      
      <TableContainer $darkMode={darkMode}>
        <TableHeader $darkMode={darkMode}>
          <div>DATA</div>
          <div>VALOR</div>
          <div>OBSERVAÇÃO</div>
          <div>USUÁRIO</div>
        </TableHeader>
        
        {historicoSaidas.length > 0 ? (
          historicoSaidas.map(saida => (
            <TableRow key={saida.id} $darkMode={darkMode}>
              <div>{new Date(saida.created_at).toLocaleDateString('pt-BR')}</div>
              <div style={{color: '#ef4444', fontWeight: '600'}}>-R$ {parseFloat(saida.valor).toFixed(2)}</div>
              <div>{saida.observacao}</div>
              <div>{saida.usuario_id}</div>
            </TableRow>
          ))
        ) : (
          <div style={{padding: '3rem', textAlign: 'center', color: '#888', gridColumn: '1 / -1'}}>
            <h3>Nenhuma saída registrada</h3>
          </div>
        )}
      </TableContainer>
    </div>
  );
};

export const renderVendedoresPage = (darkMode, vendedores, clientes, vendedoresTab, setVendedoresTab, formCliente, setFormCliente, salvarCliente, TableContainer, TableHeader, TableRow) => {
  const vendedoresValidos = vendedores.filter(v => v.nome || v.nome_completo);
  const clientesUnicos = clientes.reduce((acc, cliente) => {
    const key = cliente.cliente_nome?.toLowerCase();
    if (key && !acc[key]) {
      acc[key] = {
        id: cliente.cliente_nome,
        nome_completo: cliente.cliente_nome,
        telefone: cliente.cliente_telefone,
        ultima_compra: cliente.data_venda
      };
    }
    return acc;
  }, {});
  const clientesValidos = Object.values(clientesUnicos);
  
  return (
    <div>
      <div style={{
        display: 'flex', 
        gap: '0.5rem', 
        marginBottom: '2rem',
        background: darkMode ? '#1a1a1a' : '#f8f9fa',
        padding: '0.5rem',
        borderRadius: '0.75rem',
        border: `1px solid ${darkMode ? '#333' : '#e5e7eb'}`,
        width: 'fit-content'
      }}>
        <button 
          onClick={() => setVendedoresTab('lista')}
          style={{
            padding: '0.75rem 1.5rem',
            background: vendedoresTab === 'lista' ? (darkMode ? '#ffffff' : '#000000') : 'transparent',
            color: vendedoresTab === 'lista' ? (darkMode ? '#000000' : '#ffffff') : (darkMode ? '#ffffff' : '#000000'),
            border: 'none',
            borderRadius: '0.5rem',
            cursor: 'pointer',
            fontWeight: '600'
          }}
        >
          👥 Vendedores
        </button>
        <button 
          onClick={() => setVendedoresTab('clientes')}
          style={{
            padding: '0.75rem 1.5rem',
            background: vendedoresTab === 'clientes' ? (darkMode ? '#ffffff' : '#000000') : 'transparent',
            color: vendedoresTab === 'clientes' ? (darkMode ? '#000000' : '#ffffff') : (darkMode ? '#ffffff' : '#000000'),
            border: 'none',
            borderRadius: '0.5rem',
            cursor: 'pointer',
            fontWeight: '600'
          }}
        >
          🛍️ Clientes
        </button>
      </div>
      
      {vendedoresTab === 'lista' ? (
        vendedoresValidos.length > 0 ? (
          <TableContainer $darkMode={darkMode}>
            <TableHeader $darkMode={darkMode}>
              <div>VENDEDOR</div>
              <div>FUNÇÃO</div>
              <div>STATUS</div>
              <div>AÇÕES</div>
            </TableHeader>
            {vendedoresValidos.map(vendedor => (
              <TableRow key={vendedor.id} $darkMode={darkMode}>
                <div>{vendedor.nome_completo || vendedor.nome}</div>
                <div>{vendedor.tipo || 'Vendedor'}</div>
                <div>
                  <span style={{
                    padding: '0.25rem 0.5rem',
                    borderRadius: '0.25rem',
                    fontSize: '0.8rem',
                    fontWeight: '600',
                    background: vendedor.ativo ? '#10b981' : '#ef4444',
                    color: 'white'
                  }}>
                    {vendedor.ativo ? 'Ativo' : 'Inativo'}
                  </span>
                </div>
                <div>-</div>
              </TableRow>
            ))}
          </TableContainer>
        ) : (
          <div style={{padding: '4rem', textAlign: 'center', color: '#888'}}>
            <h3>Nenhum vendedor encontrado</h3>
          </div>
        )
      ) : (
        <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem'}}>
          <div style={{
            background: darkMode ? '#1a1a1a' : '#ffffff',
            borderRadius: '0.75rem',
            border: `1px solid ${darkMode ? '#333' : '#e5e7eb'}`,
            padding: '2rem'
          }}>
            <h3 style={{marginBottom: '1rem', color: darkMode ? '#fff' : '#000'}}>Cadastrar Cliente</h3>
            <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
              <input
                placeholder="Nome Completo *"
                value={formCliente.nome_completo}
                onChange={(e) => setFormCliente({...formCliente, nome_completo: e.target.value})}
                style={{
                  padding: '0.75rem',
                  border: `1px solid ${darkMode ? '#333' : '#e5e7eb'}`,
                  borderRadius: '0.5rem',
                  background: darkMode ? '#2a2a2a' : '#ffffff',
                  color: darkMode ? '#ffffff' : '#1a1a1a'
                }}
              />
              <input
                placeholder="Telefone *"
                value={formCliente.telefone}
                onChange={(e) => setFormCliente({...formCliente, telefone: e.target.value})}
                style={{
                  padding: '0.75rem',
                  border: `1px solid ${darkMode ? '#333' : '#e5e7eb'}`,
                  borderRadius: '0.5rem',
                  background: darkMode ? '#2a2a2a' : '#ffffff',
                  color: darkMode ? '#ffffff' : '#1a1a1a'
                }}
              />
              <button
                onClick={salvarCliente}
                disabled={!formCliente.nome_completo || !formCliente.telefone}
                style={{
                  padding: '0.75rem',
                  background: (!formCliente.nome_completo || !formCliente.telefone) ? '#666' : '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  cursor: (!formCliente.nome_completo || !formCliente.telefone) ? 'not-allowed' : 'pointer',
                  fontWeight: '600'
                }}
              >
                Salvar Cliente
              </button>
            </div>
          </div>
          
          <div>
            <h3 style={{marginBottom: '1rem', color: darkMode ? '#fff' : '#000'}}>Clientes ({clientesValidos.length})</h3>
            {clientesValidos.length > 0 ? (
              <div style={{maxHeight: '400px', overflowY: 'auto'}}>
                {clientesValidos.map(cliente => (
                  <div key={cliente.id} style={{
                    background: darkMode ? '#2a2a2a' : '#f9fafb',
                    padding: '1rem',
                    borderRadius: '0.5rem',
                    marginBottom: '0.5rem',
                    border: `1px solid ${darkMode ? '#333' : '#e5e7eb'}`
                  }}>
                    <div style={{fontWeight: '600'}}>{cliente.nome_completo}</div>
                    <div style={{fontSize: '0.9rem', color: '#888'}}>{cliente.telefone || 'N/A'}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{padding: '2rem', textAlign: 'center', color: '#888'}}>
                <p>Nenhum cliente encontrado</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};