import { createClient } from '@supabase/supabase-js';

const supabaseUrlMogi = 'https://imecyqjxvkxmdgfdvmbk.supabase.co';
const supabaseKeyMogi = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImltZWN5cWp4dmt4bWRnZmR2bWJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2MDU1ODgsImV4cCI6MjA4MDE4MTU4OH0.tKvXB75zt68xS3TyP27hX3VjItmIbNsy-OFP28fBw5k';

export const supabase = createClient(supabaseUrlMogi, supabaseKeyMogi);
export const supabaseMogi = supabase;

// Helper para obter tabela baseada na loja Mogi
export const getTableNameMogi = (baseTable) => {
  return `${baseTable}_mogi`;
};

// Helper para queries com loja Mogi
export const queryWithStoreMogi = (baseTable) => {
  const tableName = getTableNameMogi(baseTable);
  return supabase.from(tableName);
};

export const authServiceMogi = {
  login: async (usuario, senha) => {
    try {
      const { data, error } = await supabase
        .from('usuarios_mogi')
        .select('*')
        .eq('email', usuario)
        .eq('senha', senha)
        .eq('ativo', true)
        .single();
      
      if (error || !data) {
        return { user: null, error: 'Usuário ou senha inválidos' };
      }
      
      const userWithStore = { ...data, loja: 'mogi' };
      localStorage.setItem('current_user', JSON.stringify(userWithStore));
      localStorage.setItem('current_store', 'mogi');
      return { user: userWithStore, error: null };
    } catch (error) {
      return { user: null, error: error.message };
    }
  },

  getCurrentUser: () => {
    try {
      const user = localStorage.getItem('current_user');
      return user ? JSON.parse(user) : null;
    } catch {
      return null;
    }
  },

  getCurrentStore: () => {
    return 'mogi';
  },

  signOut: () => {
    localStorage.removeItem('current_user');
    localStorage.removeItem('current_store');
    return Promise.resolve();
  }
};