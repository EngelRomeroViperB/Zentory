'use client';

import * as React from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Link from "next/link";
import { formatMoney } from "@/lib/config/dinero";
import { exportToCSV, productExportHeaders, validateExportSize } from "@/lib/exports/csv.utils";

interface ProductsTableProps {
  data: any[];
  categories: any[];
  page?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  isLoading?: boolean;
}

export function ProductsTable({ 
  data, 
  categories, 
  page = 1, 
  totalPages = 1, 
  onPageChange,
  isLoading 
}: ProductsTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: "code_qr_bar",
      header: "Código",
    },
    {
      accessorKey: "name",
      header: "Nombre",
    },
    {
      accessorKey: "categories.name",
      header: "Categoría",
      cell: ({ row }) => row.original.categories?.name || 'Sin categoría',
    },
    {
      accessorKey: "current_stock",
      header: "Stock Actual",
    },
    {
      accessorKey: "min_stock",
      header: "Stock Min",
    },
    {
      accessorKey: "cost_price",
      header: "Costo",
      cell: ({ row }) => formatMoney(row.original.cost_price),
    },
    {
      accessorKey: "sale_price",
      header: "Precio Venta",
      cell: ({ row }) => formatMoney(row.original.sale_price),
    },
    {
      id: "margin",
      header: "Margen",
      cell: ({ row }) => {
        const cost = Number(row.original.cost_price);
        const sale = Number(row.original.sale_price);
        if (cost === 0) return <Badge variant="secondary">N/A</Badge>;
        
        const marginPct = ((sale - cost) / cost) * 100;
        let variant: "default" | "destructive" | "secondary" | "outline" = "default";
        
        // Verde > 20%, Amarillo 10-20%, Rojo < 10%
        if (marginPct < 10) variant = "destructive";
        else if (marginPct <= 20) variant = "secondary";
        
        return <Badge variant={variant}>{marginPct.toFixed(1)}%</Badge>;
      }
    },
    {
      id: "actions",
      header: "Acciones",
      cell: ({ row }) => {
        return (
          <Link href={`/inventario/productos/${row.original.id}`}>
            <Button variant="outline" size="sm">Ver</Button>
          </Link>
        )
      }
    }
  ];

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    // NOTA: getPaginationRowModel removido — la paginación es SSR (props page/totalPages)
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      columnFilters,
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
          <Input
            placeholder="Buscar producto..."
            value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
              table.getColumn("name")?.setFilterValue(event.target.value)
            }
            className="w-full sm:max-w-sm"
          />
          <Select 
            onValueChange={(val) => table.getColumn("categories_name")?.setFilterValue(val === 'all' ? '' : val)}
          >
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Categoría" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {categories.map(c => (
                <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Link href="/inventario/productos/nuevo">
            <Button>Nuevo producto</Button>
          </Link>
          <Button 
            variant="outline" 
            onClick={() => {
              if (!validateExportSize(data.length)) return;
              
              // Preparar datos para export
              const exportData = data.map(p => ({
                ...p,
                category_name: p.categories?.name || 'Sin categoría',
              }));
              
              exportToCSV({
                data: exportData,
                filename: 'productos',
                headers: productExportHeaders,
              });
            }}
          >
            Exportar CSV
          </Button>
        </div>
      </div>
      
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No hay resultados.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      
      <div className="flex items-center justify-between py-4">
        <div className="text-sm text-gray-500">
          Página {page} de {totalPages}
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange?.(page - 1)}
            disabled={page <= 1 || isLoading}
          >
            Anterior
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange?.(page + 1)}
            disabled={page >= totalPages || isLoading}
          >
            Siguiente
          </Button>
        </div>
      </div>
    </div>
  );
}
