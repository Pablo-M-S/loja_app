# Loja App — Mobile (React Native + Expo)

## O que já está pronto

- **Splash screen** com logo (placeholder — troque pela logo real em `assets/`)
- **Cadastro de cliente**: nome, CPF (com validação), endereço completo
- **Estrutura de login com Google** (ainda precisa das credenciais OAuth — veja
  o comentário em `screens/RegisterScreen.js`)
- **Listagem de categorias** puxando direto do backend
- **Listagem de produtos por categoria**

## Como rodar no Termux

1. Instale as dependências (a primeira vez pode demorar):
   ```
   cd loja-app/mobile
   npm install
   ```

2. Antes de rodar, edite o arquivo `app.json` e troque:
   ```
   "apiUrl": "http://SEU_BACKEND_AQUI:3000/api"
   ```
   Pelo endereço real do seu backend. Se estiver testando no mesmo celular
   com o backend rodando localmente, use o IP local do celular (não
   `localhost`, porque o Expo pode rodar em um contexto separado) — descubra
   com `ifconfig` no Termux, ou já publique o backend na nuvem (recomendado
   assim que possível, evita esse tipo de ajuste).

3. Suba o projeto:
   ```
   npx expo start
   ```

4. Vai aparecer um QR code no terminal. Instale o app **Expo Go** (disponível
   na Play Store) no seu celular, abra ele e escaneie o QR code — o app vai
   carregar direto, sem precisar compilar nada ainda.

## Sobre a logo

As imagens em `assets/` (`logo-placeholder.png`, `icon.png`, `splash.png`,
`adaptive-icon.png`) são placeholders gerados automaticamente — só um
retângulo azul com texto. Assim que você tiver a logo real da empresa, troque
esses arquivos pelos definitivos (mantenha os mesmos nomes ou ajuste as
referências em `app.json` e `SplashScreen.js`).

## Próximos passos

1. **Testar esse esqueleto no Expo Go** e validar o fluxo: splash → cadastro
   → categorias → produtos
2. **Login com Google de verdade** — precisamos criar credenciais no Google
   Cloud Console (é gratuito, mas exige criar um projeto lá)
3. **Carrinho de compras** — tela para adicionar produtos e ver o total
4. **Cálculo de frete** — depende de decidirmos a transportadora/API
5. **Pagamento** — integração com gateway (Mercado Pago, Pix)
6. **Gerar o build de produção** (.aab) para publicar na Play Store — isso é
   feito com `eas build`, outro serviço do Expo, quando o app estiver pronto
