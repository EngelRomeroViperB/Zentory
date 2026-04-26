'use client';

import * as React from "react";
import { ProductsTable } from "@/components/inventario/ProductsTable";
import { LoadingState } from "@/components/ui/loading-state";
import { ErrorState } from "@/components/ui/error-state";
import { getProducts, getCategories } from "@/lib/queries/products";

export default function ProductosPage() {
  const [products, setProducts] = React.useState<any[]>([]);
  const [categories, setCategories] = React.useState<any[]>([]);
  const [page, setPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);
  const [search, setSearch] = React.useState("");

  const loadData = React.useCallback(async (currentPage: number, searchTerm: string = "") => {
    setIsLoading(true);
    setError(null);
    try {
      const [productsResult, categoriesData] = await Promise.all([
        getProducts({ 
          page: currentPage, 
          limit: 50,
          search: searchTerm || undefined 
        }),
        getCategories()
      ]);
      
      setProducts(productsResult.data);
      setTotalPages(productsResult.totalPages);
      setCategories(categoriesData);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Error desconocido"));
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadData(page, search);
  }, [page, search, loadData]);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  if (isLoading && products.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Catálogo de Productos</h1>
          <p className="text-gray-500">Gestiona los productos, precios y niveles de stock.</p>
        </div>
        <LoadingState message="Cargando productos..." />
      </div>
    );
  }

  if (error && products.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Catálogo de Productos</h1>
          <p className="text-gray-500">Gestiona los productos, precios y niveles de stock.</p>
        </div>
        <ErrorState onRetry={() => loadData(page, search)} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Catálogo de Productos</h1>
        <p className="text-gray-500">Gestiona los productos, precios y niveles de stock.</p>
      </div>
      
      <ProductsTable 
        data={products} 
        categories={categories} 
        page={page}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        isLoading={isLoading}
      />
    </div>
  );
}
