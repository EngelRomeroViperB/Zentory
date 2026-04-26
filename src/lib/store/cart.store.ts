import { create } from 'zustand';
import dinero from 'dinero.js';

export interface CartItem {
  product_id: string;
  batch_id: string | null;
  code_qr_bar: string;
  name: string;
  unit_price: string;
  unit_cost: string;
  quantity: number;
  discount_pct: number;
  tax_rate: number;
  current_stock: number; // para validar máximo
}

/**
 * Estructura mínima del producto esperada por addItem
 * Viene de la base de datos (products table)
 */
export interface ProductInput {
  id: string;
  code_qr_bar: string | null;
  name: string;
  sale_price: string;
  cost_price: string;
  current_stock: number;
}

interface CartStore {
  items: CartItem[];
  client_id: string | null;
  client_name: string | null;
  global_discount: number;
  
  addItem: (product: ProductInput) => void;
  removeItem: (product_id: string) => void;
  updateQuantity: (product_id: string, quantity: number) => void;
  updateDiscount: (product_id: string, discount_pct: number) => void;
  setClient: (id: string | null, name: string | null) => void;
  setGlobalDiscount: (discount: number) => void;
  clearCart: () => void;
  
  getSubtotal: () => string;
  getTaxAmount: (rate: number) => string;
  getTotal: (rate: number) => string;
  getItemCount: () => number;
}

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],
  client_id: null,
  client_name: null,
  global_discount: 0,

  addItem: (product) => {
    const { items } = get();
    const existing = items.find(i => i.product_id === product.id);

    if (product.current_stock === 0) {
      throw new Error(`Producto ${product.name} sin stock.`);
    }

    if (existing) {
      if (existing.quantity >= product.current_stock) {
        throw new Error(`No hay más stock disponible para ${product.name}.`);
      }
      set({
        items: items.map(i => 
          i.product_id === product.id ? { ...i, quantity: i.quantity + 1 } : i
        )
      });
    } else {
      set({
        items: [...items, {
          product_id: product.id,
          batch_id: null,
          code_qr_bar: product.code_qr_bar || '',
          name: product.name,
          unit_price: product.sale_price,
          unit_cost: product.cost_price,
          quantity: 1,
          discount_pct: 0,
          tax_rate: 0,
          current_stock: product.current_stock
        }]
      });
    }
  },

  removeItem: (product_id) => {
    set(state => ({ items: state.items.filter(i => i.product_id !== product_id) }));
  },

  updateQuantity: (product_id, quantity) => {
    const { items } = get();
    const existing = items.find(i => i.product_id === product_id);
    if (!existing) return;

    if (quantity > existing.current_stock) {
      throw new Error(`La cantidad supera el stock disponible (${existing.current_stock}).`);
    }

    set({
      items: items.map(i => 
        i.product_id === product_id ? { ...i, quantity: Math.max(1, quantity) } : i
      )
    });
  },

  updateDiscount: (product_id, discount_pct) => {
    set(state => ({
      items: state.items.map(i => 
        i.product_id === product_id ? { ...i, discount_pct: Math.min(100, Math.max(0, discount_pct)) } : i
      )
    }));
  },

  setClient: (id, name) => set({ client_id: id, client_name: name }),
  
  setGlobalDiscount: (discount) => set({ global_discount: Math.min(100, Math.max(0, discount)) }),

  clearCart: () => set({ items: [], client_id: null, client_name: null, global_discount: 0 }),

  getSubtotal: () => {
    const { items, global_discount } = get();
    const sum = items.reduce((acc, item) => {
      const price = Number(item.unit_price) * 100;
      const sub = price * item.quantity;
      const withDiscount = sub * (1 - (item.discount_pct / 100));
      return acc + withDiscount;
    }, 0);

    const finalSubtotal = sum * (1 - (global_discount / 100));
    return dinero({ amount: Math.round(finalSubtotal), currency: 'USD' }).toFormat('$0,0.00');
  },

  getTaxAmount: (rate) => {
    const { items, global_discount } = get();
    const sum = items.reduce((acc, item) => {
      const price = Number(item.unit_price) * 100;
      const sub = price * item.quantity;
      const withDiscount = sub * (1 - (item.discount_pct / 100));
      return acc + withDiscount;
    }, 0);

    const finalSubtotal = sum * (1 - (global_discount / 100));
    const tax = finalSubtotal * (rate / 100);
    return dinero({ amount: Math.round(tax), currency: 'USD' }).toFormat('$0,0.00');
  },

  getTotal: (rate) => {
    const { items, global_discount } = get();
    const sum = items.reduce((acc, item) => {
      const price = Number(item.unit_price) * 100;
      const sub = price * item.quantity;
      const withDiscount = sub * (1 - (item.discount_pct / 100));
      return acc + withDiscount;
    }, 0);

    const finalSubtotal = sum * (1 - (global_discount / 100));
    const tax = finalSubtotal * (rate / 100);
    return dinero({ amount: Math.round(finalSubtotal + tax), currency: 'USD' }).toFormat('$0,0.00');
  },

  getItemCount: () => {
    const { items } = get();
    return items.reduce((acc, item) => acc + item.quantity, 0);
  }
}));
