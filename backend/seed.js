// seed.js
// Popula o banco com as categorias que você pediu, mais alguns produtos
// de exemplo em cada uma. Rode com: npm run seed

const { v4: uuid } = require('uuid');
const db = require('./db');

const categorias = [
  { nome: 'Grãos', slug: 'graos' },
  { nome: 'Farinhas', slug: 'farinhas' },
  { nome: 'Temperos', slug: 'temperos' },
  { nome: 'Frutas secas', slug: 'frutas-secas' },
  { nome: 'Casa', slug: 'casa' },
  { nome: 'Cuidados pessoais', slug: 'cuidados-pessoais' },
  { nome: 'Sem glúten', slug: 'sem-gluten' }
];

const categoriasComId = categorias.map(c => ({ id: uuid(), ...c }));

const produtosPorSlug = {
  'graos': [
    { nome: 'Arroz Branco 1kg', preco: 6.50, estoque: 120 },
    { nome: 'Feijão Carioca 1kg', preco: 8.90, estoque: 90 },
    { nome: 'Lentilha 500g', preco: 7.20, estoque: 50 }
  ],
  'farinhas': [
    { nome: 'Farinha de Trigo 1kg', preco: 5.40, estoque: 100 },
    { nome: 'Farinha de Mandioca 500g', preco: 6.10, estoque: 60 }
  ],
  'temperos': [
    { nome: 'Orégano 30g', preco: 4.30, estoque: 80 },
    { nome: 'Páprica Doce 50g', preco: 5.90, estoque: 70 }
  ],
  'frutas-secas': [
    { nome: 'Damasco Seco 200g', preco: 12.90, estoque: 40 },
    { nome: 'Castanha do Pará 200g', preco: 18.50, estoque: 35 }
  ],
  'casa': [
    { nome: 'Detergente Neutro 500ml', preco: 3.20, estoque: 150 },
    { nome: 'Esponja Multiuso (pacote)', preco: 4.00, estoque: 100 }
  ],
  'cuidados-pessoais': [
    { nome: 'Sabonete Neutro 90g', preco: 2.80, estoque: 200 },
    { nome: 'Shampoo 350ml', preco: 15.90, estoque: 60 }
  ],
  'sem-gluten': [
    { nome: 'Macarrão Sem Glúten 500g', preco: 11.50, estoque: 45 },
    { nome: 'Pão Sem Glúten 300g', preco: 14.90, estoque: 30 }
  ]
};

const produtos = [];
for (const cat of categoriasComId) {
  const lista = produtosPorSlug[cat.slug] || [];
  for (const p of lista) {
    produtos.push({
      id: uuid(),
      categoriaId: cat.id,
      nome: p.nome,
      preco: p.preco,
      estoque: p.estoque,
      ativo: true,
      imagemUrl: null,
      descricao: ''
    });
  }
}

db.set('categories', categoriasComId).write();
db.set('products', produtos).write();

console.log(`Seed concluído: ${categoriasComId.length} categorias, ${produtos.length} produtos.`);
