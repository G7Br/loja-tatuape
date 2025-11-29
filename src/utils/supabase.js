import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);

export const authService = {
  login: async (usuario, senha) => {
    try {
      const { data, error } = await supabase
        .from('usuarios_tatuape')
        .select('*')
        .eq('email', usuario)
        .eq('senha', senha)
        .eq('ativo', true)
        .single();
      
      if (error || !data) {
        return { user: null, error: 'Usuário ou senha inválidos' };
      }
      
      localStorage.setItem('user_tatuape', JSON.stringify(data));
      return { user: data, error: null };
    } catch (error) {
      return { user: null, error: error.message };
    }
  },

  getCurrentUser: () => {
    try {
      const user = localStorage.getItem('user_tatuape');
      return user ? JSON.parse(user) : null;
    } catch {
      return null;
    }
  },

  signOut: () => {
    localStorage.removeItem('user_tatuape');
    return Promise.resolve();
  }
};
