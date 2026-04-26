'use client';

import * as React from "react";
import { Button } from "@/components/ui/button";
import { FileText, Table as TableIcon, Loader2 } from "lucide-react";

interface ExportBarProps {
  onExportPDF: () => Promise<void> | void;
  onExportExcel: () => Promise<void> | void;
  disabled?: boolean;
}

export function ExportBar({ onExportPDF, onExportExcel, disabled }: ExportBarProps) {
  const [loadingPdf, setLoadingPdf] = React.useState(false);
  const [loadingExcel, setLoadingExcel] = React.useState(false);

  const handlePdf = async () => {
    setLoadingPdf(true);
    try {
      await onExportPDF();
    } finally {
      setLoadingPdf(false);
    }
  };

  const handleExcel = async () => {
    setLoadingExcel(true);
    try {
      await onExportExcel();
    } finally {
      setLoadingExcel(false);
    }
  };

  return (
    <div className="flex gap-2 justify-end">
      <Button 
        variant="outline" 
        size="sm" 
        onClick={handlePdf} 
        disabled={disabled || loadingPdf || loadingExcel}
        className="text-red-600 border-red-200 hover:bg-red-50"
      >
        {loadingPdf ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
        PDF
      </Button>
      <Button 
        variant="outline" 
        size="sm" 
        onClick={handleExcel} 
        disabled={disabled || loadingPdf || loadingExcel}
        className="text-emerald-600 border-emerald-200 hover:bg-emerald-50"
      >
        {loadingExcel ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <TableIcon className="mr-2 h-4 w-4" />}
        Excel
      </Button>
    </div>
  );
}
