import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
  useMemo,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    const fetchProducts = async (): Promise<void> => {
      const productsFromStorage = await AsyncStorage.getItem(
        '@GoMarketplace:products',
      );

      if (productsFromStorage) setProducts(JSON.parse(productsFromStorage));
    };

    fetchProducts();
  }, []);

  const addToCart = useCallback(
    async product => {
      const foundProduct = products.find(({ id }) => id === product.id);

      const updatedProducts = !foundProduct
        ? [...products, { ...product, quantity: 1 }]
        : products.map(eachProduct =>
            eachProduct.id === product.id
              ? { ...product, quantity: eachProduct.quantity + 1 }
              : eachProduct,
          );

      setProducts(updatedProducts);

      await AsyncStorage.setItem(
        '@GoMarketplace:products',
        JSON.stringify(updatedProducts),
      );
    },

    [products],
  );

  const increment = useCallback(
    async id => {
      const updatedProducts = products.map(product =>
        product.id === id
          ? { ...product, quantity: product.quantity + 1 }
          : product,
      );

      setProducts(updatedProducts);

      await AsyncStorage.setItem(
        '@GoMarketplace:products',
        JSON.stringify(updatedProducts),
      );
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      const quantity = products.find(product => product.id === id)?.quantity;

      const updatedProducts =
        quantity === 1
          ? products.filter(product => product.id !== id)
          : products.map(product =>
              product.id === id
                ? { ...product, quantity: product.quantity - 1 }
                : product,
            );

      setProducts(updatedProducts);

      await AsyncStorage.setItem(
        '@GoMarketplace:products',
        JSON.stringify(updatedProducts),
      );
    },
    [products],
  );

  const value = useMemo(() => ({ addToCart, increment, decrement, products }), [
    products,
    addToCart,
    increment,
    decrement,
  ]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

const useCart = (): CartContext => {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
};

export { CartProvider, useCart };
