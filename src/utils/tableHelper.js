// Helper para obter nome da tabela baseado na loja do usuário
export const getTableName = (baseTable, user) => {
  const loja = user?.loja || 'tatuape';
  return `${baseTable}_${loja}`;
};

// Helper para queries com loja dinâmica
export const queryWithStore = (supabase, baseTable, user) => {
  const tableName = getTableName(baseTable, user);
  return supabase.from(tableName);
};