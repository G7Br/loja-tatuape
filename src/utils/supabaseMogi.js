// ARQUIVO DESCONTINUADO - AGORA TUDO USA O ARQUIVO PRINCIPAL
// Redirecionamento para manter compatibilidade
export { supabase, authService } from './supabase.js';

// Funções de compatibilidade
export const supabaseMogi = require('./supabase.js').supabase;
export const authServiceMogi = require('./supabase.js').authService;

// Helper simplificado para tabelas Mogi
export const queryWithStoreMogi = (baseTable) => {
  const { supabase } = require('./supabase.js');
  return supabase.from(`${baseTable}_mogi`);
};

export const getTableNameMogi = (baseTable) => `${baseTable}_mogi`;