// Exportações dos componentes Mogi - Sistema Multi-Lojas
// Todos os componentes usam as tabelas com sufixo '_mogi'

export { default as CaixaMogi } from './CaixaMogi';
export { default as SistemaVendasMogi } from './SistemaVendasMogi';
export { default as LoginMogi } from './LoginMogi';
export { default as VendedorMogi } from './VendedorMogi';
export { default as VendedorMobileMogi } from './VendedorMobileMogi';
export { default as VendedorProfileMogi } from './VendedorProfileMogi';
export { default as GerenteMogi } from './GerenteMogi';
export { default as CaixaControllerMogi } from './CaixaControllerMogi';
export { default as HistoricoCaixaMogi } from './HistoricoCaixaMogi';
export { default as SeletorProdutosMogi } from './SeletorProdutosMogi';
export { default as ComprovanteVendaMogi } from './ComprovanteVendaMogi';
export { default as StoreIndicatorMogi } from './StoreIndicatorMogi';

// Utilitários específicos para Mogi
export { supabase as supabaseMogi, queryWithStoreMogi, authServiceMogi } from '../../utils/supabaseMogi';