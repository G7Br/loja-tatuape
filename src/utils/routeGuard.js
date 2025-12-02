import { authService } from './supabase';

// Middleware para verificar e redirecionar usuários para a página correta
export const routeGuard = {
  // Verificar se o usuário tem acesso à rota atual
  checkAccess: (currentPath) => {
    const user = authService.getCurrentUser();
    
    if (!user) {
      return { hasAccess: false, redirectTo: '/' };
    }

    const { loja, cargo } = user;
    
    // Definir rotas permitidas para cada loja e cargo
    const routes = {
      tatuape: {
        gerente: ['/'],
        vendedor: ['/'],
        caixa: ['/'],
        default: ['/']
      },
      mogi: {
        gerente: ['/mogi/gerente', '/mogi'],
        vendedor: ['/mogi/vendedor', '/mogi'],
        caixa: ['/mogi'],
        default: ['/mogi']
      }
    };

    // Obter rotas permitidas para o usuário
    const allowedRoutes = routes[loja]?.[cargo] || routes[loja]?.default || ['/'];
    
    // Verificar se a rota atual é permitida
    const hasAccess = allowedRoutes.some(route => currentPath.startsWith(route));
    
    if (!hasAccess) {
      // Determinar para onde redirecionar
      let redirectTo = '/';
      
      if (loja === 'mogi') {
        switch (cargo) {
          case 'vendedor':
            redirectTo = '/mogi/vendedor';
            break;
          case 'gerente':
            redirectTo = '/mogi/gerente';
            break;
          default:
            redirectTo = '/mogi';
        }
      }
      
      return { hasAccess: false, redirectTo };
    }
    
    return { hasAccess: true, redirectTo: null };
  },

  // Obter a rota correta para um usuário
  getCorrectRoute: (user) => {
    if (!user) return '/';
    
    const { loja, cargo } = user;
    
    if (loja === 'mogi') {
      switch (cargo) {
        case 'vendedor':
          return '/mogi/vendedor';
        case 'gerente':
          return '/mogi/gerente';
        default:
          return '/mogi';
      }
    }
    
    return '/';
  },

  // Verificar se o usuário deve ser redirecionado na inicialização
  shouldRedirect: (currentPath) => {
    const user = authService.getCurrentUser();
    
    if (!user) return null;
    
    const correctRoute = routeGuard.getCorrectRoute(user);
    
    // Se a rota atual não é a correta, redirecionar
    if (currentPath !== correctRoute && !currentPath.startsWith(correctRoute)) {
      return correctRoute;
    }
    
    return null;
  }
};

// Hook para usar o route guard em componentes
export const useRouteGuard = (currentPath) => {
  const user = authService.getCurrentUser();
  
  if (!user) {
    return { isAuthorized: false, shouldRedirect: '/' };
  }
  
  const { hasAccess, redirectTo } = routeGuard.checkAccess(currentPath);
  
  return {
    isAuthorized: hasAccess,
    shouldRedirect: redirectTo,
    user
  };
};