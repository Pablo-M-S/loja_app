import React, { createContext, useContext, useState } from 'react';

const CartContext = createContext();

export function CartProvider({ children }) {
  const [items, setItems] = useState([]); // { id, nome, preco, quantidade }

  function addToCart(produto, quantidade) {
    setItems((prev) => {
      const existente = prev.find((i) => i.id === produto.id);
      if (existente) {
        return prev.map((i) =>
          i.id === produto.id ? { ...i, quantidade: i.quantidade + quantidade } : i
        );
      }
      return [...prev, { ...produto, quantidade }];
    });
  }

  function updateQuantity(id, quantidade) {
    if (quantidade <= 0) {
      removeFromCart(id);
      return;
    }
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, quantidade } : i))
    );
  }

  function removeFromCart(id) {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  function clearCart() {
    setItems([]);
  }

  const totalItens = items.reduce((soma, i) => soma + i.quantidade, 0);
  const totalPreco = items.reduce((soma, i) => soma + i.quantidade * i.preco, 0);

  return (
    <CartContext.Provider
      value={{ items, addToCart, updateQuantity, removeFromCart, clearCart, totalItens, totalPreco }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
