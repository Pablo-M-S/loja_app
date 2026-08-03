# Loja App — MVP

Base do backend + painel admin para o app de loja estilo Magalu.

## Estrutura

```
loja-app/
├── backend/          → API (Node.js + Express)
│   ├── server.js
│   ├── db.js         → banco em JSON local (lowdb)
│   ├── seed.js        → popula categorias e produtos de exemplo
│   └── routes/
│       ├── categories.js
│       ├── products.js
│       └── customers.js
└── admin/            → painel de gestão (HTML/JS puro)
    └── index.html
```

## Como rodar no Termux

1. Instale o Node.js (se ainda não tiver):
   ```
   pkg install nodejs
   ```

2. Copie a pasta `loja-app` para o seu Termux (via `git clone` do seu repositório,
   ou transferindo o zip e extraindo com `unzip`).

3. Entre na pasta do backend e instale as dependências:
   ```
   cd loja-app/backend
   npm install
   ```

4. Popule o banco com as categorias e produtos de exemplo:
   ```
   npm run seed
   ```

5. Suba o servidor:
   ```
   npm start
   ```

6. Abra no navegador do celular (ou Termux:X11):
   - API: `http://localhost:3000/api/health`
   - Painel admin: `http://localhost:3000/admin`

## Endpoints disponíveis

- `GET /api/categories` — lista categorias
- `GET /api/products` — lista produtos (aceita `?categoria=slug`)
- `POST /api/products` — cria produto (usado pelo painel admin)
- `PUT /api/products/:id` — edita produto
- `DELETE /api/products/:id` — remove produto
- `POST /api/customers` — cadastro de cliente (nome, cpf, endereço)
- `GET /api/customers/:id` — busca cliente

## Categorias já cadastradas no seed

Grãos, Farinhas, Temperos, Frutas secas, Casa, Cuidados pessoais, Sem glúten.

## O que ainda falta (próximas etapas)

1. **Tela de splash com logo** — isso é parte do app mobile (Flutter/React Native),
   ainda não criado. O backend já está pronto para alimentar essa tela.
2. **Login com Google** — vamos integrar OAuth (Google Identity Services) quando
   começarmos o app mobile. O campo `googleId` já existe no cadastro de cliente
   para isso.
3. **Cálculo de frete interestadual** — depende de escolher a transportadora/API
   (Correios, Melhor Envio, etc.) — combinamos isso depois.
4. **Pagamento** — vamos integrar um gateway (Mercado Pago, Pix, etc.) depois
   que o fluxo de carrinho estiver pronto.
5. **App mobile de verdade** — o que temos agora é a API. O app que vai pra
   Play Store será construído em cima dela (recomendo React Native ou Flutter).
6. **Deploy na nuvem** — quando estiver pronto para colocar no ar, subimos esse
   backend no Railway ou Render (deploy direto do GitHub, sem precisar de
   computador).

## Sobre o banco de dados

Por enquanto o banco é um arquivo `db.json` dentro da pasta `backend/` — isso é
só para desenvolvimento local, é rápido de configurar e não exige compilar
nada no Termux. Quando formos para produção, trocamos por PostgreSQL
(Railway/Supabase têm opção gratuita).
