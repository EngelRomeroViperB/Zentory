// ════════════════════════════════════════════════════════════════════════
// Zentory — Tipos TypeScript del schema de base de datos
// Generados manualmente para reflejar exactamente el schema de Supabase.
//
// Regla monetaria: todos los campos numeric(12,2) de PostgreSQL se tipan
// como `string` porque Supabase los serializa como string para preservar
// la precisión decimal exacta. NUNCA usar `number` para valores monetarios.
// ════════════════════════════════════════════════════════════════════════

// ──────────────────────────────────────────────────────────────────────────
// ENUMS
// ──────────────────────────────────────────────────────────────────────────
export type MovementType = 'ENTRY' | 'EXIT' | 'ADJUSTMENT' | 'RETURN';
export type SaleStatus   = 'ACTIVE' | 'DELETED';
export type PrintStatus  = 'PENDING' | 'PRINTED' | 'FAILED';
export type UserRole     = 'admin' | 'vendedor' | 'bodeguero';


// ──────────────────────────────────────────────────────────────────────────
// FILAS DE TABLA (Row types)
// ──────────────────────────────────────────────────────────────────────────

export interface SupplierRow {
  id:         string;   // uuid
  name:       string;
  nit:        string | null;
  phone:      string | null;
  email:      string | null;
  created_at: string;   // timestamptz → ISO 8601 string
}

export interface ClientRow {
  id:         string;
  name:       string;
  nit:        string | null;
  email:      string | null;
  phone:      string | null;
  created_at: string;
}

export interface UserRoleRow {
  id:         string;
  user_id:    string;
  role:       UserRole;
  created_at: string;
}

export interface CategoryRow {
  id:         string;
  name:       string;
  created_at: string;
}

export interface ProductRow {
  id:            string;
  code_qr_bar:   string | null;
  name:          string;
  category_id:   string | null;
  cost_price:    string;  // numeric → string (regla monetaria)
  sale_price:    string;  // numeric → string
  current_stock: number;  // int → number (no es dinero)
  min_stock:     number;
  created_at:    string;
  updated_at:    string;
}

export interface ProductBatchRow {
  id:          string;
  product_id:  string;
  batch_code:  string | null;
  quantity:    number;
  unit_cost:   string | null;  // numeric → string
  expiry_date: string | null;  // date → ISO date string
  location:    string | null;
  created_at:  string;
}

export interface KardexMovementRow {
  id:            string;
  product_id:    string;
  batch_id:      string | null;
  type:          MovementType;
  quantity:      number;
  unit_cost:     string;  // numeric → string
  reference_doc: string | null;
  notes:         string | null;
  created_by:    string | null;
  created_at:    string;
}

/** Vista kardex_with_balance — extiende KardexMovementRow con los saldos calculados */
export interface KardexWithBalanceRow extends KardexMovementRow {
  balance_quantity: number;
  balance_value:    string;  // numeric → string
}

export interface SaleRow {
  id:             string;
  invoice_seq:    number;
  invoice_number: string;  // columna generada, solo lectura
  client_id:      string | null;
  vendedor_id:    string | null;
  total:          string;  // numeric → string
  tax_amount:     string;  // numeric → string
  status:         SaleStatus;
  notes:          string | null;
  created_at:     string;
  updated_at:     string;
}

export interface SaleItemRow {
  id:           string;
  sale_id:      string;
  product_id:   string;
  batch_id:     string | null;
  quantity:     number;
  unit_price:   string;  // numeric → string
  unit_cost:    string;  // numeric → string
  discount_pct: string;  // numeric → string
  tax_rate:     string;  // numeric → string
  subtotal:     string;  // numeric → string (columna generada)
}

export interface PurchaseRow {
  id:             string;
  supplier_id:    string | null;
  invoice_number: string | null;
  total:          string;  // numeric → string
  tax_amount:     string;  // numeric → string
  status:         string;
  notes:          string | null;
  created_by:     string | null;
  created_at:     string;
}

export interface PurchaseItemRow {
  id:          string;
  purchase_id: string;
  product_id:  string;
  batch_id:    string | null;
  quantity:    number;
  unit_cost:   string;  // numeric → string
}

export interface PrintQueueRow {
  id:         string;
  content:    Record<string, unknown>;  // jsonb
  status:     PrintStatus;
  device_id:  string | null;
  created_at: string;
  claimed_at: string | null;
  printed_at: string | null;
}


// ──────────────────────────────────────────────────────────────────────────
// INSERT types (campos opcionales que tienen DEFAULT en la DB)
// ──────────────────────────────────────────────────────────────────────────

export type SupplierInsert = Omit<SupplierRow, 'id' | 'created_at'> & {
  id?: string;
  created_at?: string;
};

export type ClientInsert = Omit<ClientRow, 'created_at'> & {
  created_at?: string;
};

export type UserRoleInsert = Omit<UserRoleRow, 'id' | 'created_at'> & {
  id?: string;
  created_at?: string;
};

export type CategoryInsert = Omit<CategoryRow, 'id' | 'created_at'> & {
  id?: string;
  created_at?: string;
};

export type ProductInsert = Omit<ProductRow, 'id' | 'created_at' | 'updated_at'> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

export type ProductBatchInsert = Omit<ProductBatchRow, 'id' | 'created_at'> & {
  id?: string;
  created_at?: string;
};

export type KardexMovementInsert = Omit<KardexMovementRow, 'id' | 'created_at'> & {
  id?: string;
  created_at?: string;
};

// invoice_number es GENERATED ALWAYS → no se puede insertar
export type SaleInsert = Omit<SaleRow, 'id' | 'invoice_seq' | 'invoice_number' | 'created_at' | 'updated_at'> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

// subtotal es GENERATED ALWAYS → no se puede insertar
export type SaleItemInsert = Omit<SaleItemRow, 'id' | 'subtotal'> & {
  id?: string;
};

export type PurchaseInsert = Omit<PurchaseRow, 'id' | 'created_at'> & {
  id?: string;
  created_at?: string;
};

export type PurchaseItemInsert = Omit<PurchaseItemRow, 'id'> & {
  id?: string;
};

export type PrintQueueInsert = Omit<PrintQueueRow, 'id' | 'created_at'> & {
  id?: string;
  created_at?: string;
};


// ──────────────────────────────────────────────────────────────────────────
// UPDATE types (todos los campos opcionales excepto el id)
// ──────────────────────────────────────────────────────────────────────────

export type ProductUpdate = Partial<Omit<ProductRow, 'id' | 'created_at' | 'updated_at'>>;
export type SaleUpdate    = Partial<Omit<SaleRow, 'id' | 'invoice_seq' | 'invoice_number' | 'created_at' | 'updated_at'>>;
export type PrintQueueUpdate = Partial<Omit<PrintQueueRow, 'id' | 'created_at'>>;


// ──────────────────────────────────────────────────────────────────────────
// Tipo Database completo — compatible con el cliente tipado de Supabase
// createClient<Database>(url, key)
// ──────────────────────────────────────────────────────────────────────────
export interface Database {
  public: {
    Tables: {
      suppliers: {
        Row:    SupplierRow;
        Insert: SupplierInsert;
        Update: Partial<Omit<SupplierRow, 'id' | 'created_at'>>;
      };
      clients: {
        Row:    ClientRow;
        Insert: ClientInsert;
        Update: Partial<Omit<ClientRow, 'id' | 'created_at'>>;
      };
      user_roles: {
        Row:    UserRoleRow;
        Insert: UserRoleInsert;
        Update: Partial<Pick<UserRoleRow, 'role'>>;
      };
      categories: {
        Row:    CategoryRow;
        Insert: CategoryInsert;
        Update: Partial<Pick<CategoryRow, 'name'>>;
      };
      products: {
        Row:    ProductRow;
        Insert: ProductInsert;
        Update: ProductUpdate;
      };
      product_batches: {
        Row:    ProductBatchRow;
        Insert: ProductBatchInsert;
        Update: Partial<Omit<ProductBatchRow, 'id' | 'created_at'>>;
      };
      kardex_movements: {
        Row:    KardexMovementRow;
        Insert: KardexMovementInsert;
        Update: never;  // El kardex es inmutable — no se permite UPDATE
      };
      sales: {
        Row:    SaleRow;
        Insert: SaleInsert;
        Update: SaleUpdate;
      };
      sale_items: {
        Row:    SaleItemRow;
        Insert: SaleItemInsert;
        Update: never;  // Los items de factura no se editan, se eliminan y recrean
      };
      purchases: {
        Row:    PurchaseRow;
        Insert: PurchaseInsert;
        Update: Partial<Omit<PurchaseRow, 'id' | 'created_at'>>;
      };
      purchase_items: {
        Row:    PurchaseItemRow;
        Insert: PurchaseItemInsert;
        Update: Partial<Omit<PurchaseItemRow, 'id'>>;
      };
      print_queue: {
        Row:    PrintQueueRow;
        Insert: PrintQueueInsert;
        Update: PrintQueueUpdate;
      };
    };
    Views: {
      kardex_with_balance: {
        Row: KardexWithBalanceRow;
      };
    };
    Functions: {
      get_my_role: {
        Args:    Record<string, never>;
        Returns: UserRole;
      };
    };
    Enums: {
      movement_type: MovementType;
      sale_status:   SaleStatus;
      print_status:  PrintStatus;
      user_role:     UserRole;
    };
  };
}
