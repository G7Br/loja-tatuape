# Funcionalidade QR Code - Sistema de Vendas

## 📱 Como usar o Scanner QR Code

### Para Vendedores

1. **Acesse a aba "Produtos"** no sistema de vendas
2. **Clique no botão "📱 Escanear QR Code"** (botão verde abaixo da barra de busca)
3. **Permita o acesso à câmera** quando solicitado pelo navegador
4. **Aponte a câmera para o QR code** do produto
5. O produto será **automaticamente adicionado ao carrinho** quando o QR code for lido

### Funcionalidades Disponíveis

- ✅ **Scanner automático**: Usa a câmera do dispositivo para ler QR codes
- ✅ **Input manual**: Caso a câmera não funcione, é possível digitar o código manualmente
- ✅ **Validação de estoque**: Só adiciona produtos que estão em estoque
- ✅ **Feedback visual**: Confirmação quando o produto é adicionado
- ✅ **Compatível com ambas as lojas**: Tatuapé e Mogi

### Requisitos Técnicos

- **Navegador moderno** com suporte a câmera (Chrome, Firefox, Safari, Edge)
- **HTTPS** (necessário para acesso à câmera)
- **Permissão de câmera** concedida pelo usuário

### Como Funciona

1. O QR code deve conter o **código do produto** (campo `codigo` na tabela de produtos)
2. O sistema busca o produto pelo código no banco de dados
3. Verifica se o produto está ativo e tem estoque disponível
4. Adiciona automaticamente ao carrinho com quantidade 1

### Gerando QR Codes para Produtos

Para gerar QR codes dos produtos, você pode usar o **Gerador de QR Code** disponível no sistema:

1. Acesse a área administrativa
2. Use a funcionalidade "Gerar QR Code" 
3. O QR code conterá o código do produto
4. Imprima e cole nas etiquetas dos produtos

### Troubleshooting

**Câmera não funciona?**
- Verifique se o navegador tem permissão para acessar a câmera
- Certifique-se de que está usando HTTPS
- Use o input manual como alternativa

**Produto não encontrado?**
- Verifique se o código do produto está correto
- Confirme se o produto está ativo no sistema
- Verifique se há estoque disponível

**QR code não é lido?**
- Certifique-se de que há boa iluminação
- Mantenha a câmera estável
- Aproxime ou afaste a câmera conforme necessário
- Use o input manual como alternativa

### Compatibilidade

- ✅ **Tatuapé**: Funciona com produtos da tabela `produtos_tatuape`
- ✅ **Mogi**: Funciona com produtos da tabela `produtos` (schema mogi)
- ✅ **Mobile**: Otimizado para dispositivos móveis
- ✅ **Desktop**: Funciona também em computadores com câmera

---

*Esta funcionalidade foi implementada para agilizar o processo de vendas, permitindo que os vendedores adicionem produtos rapidamente ao carrinho através da leitura de QR codes.*