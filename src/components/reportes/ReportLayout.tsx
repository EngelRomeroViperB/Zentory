import * as React from "react";

export function ReportLayout({ 
  title, 
  description, 
  filters, 
  children 
}: { 
  title: string, 
  description: string, 
  filters?: React.ReactNode, 
  children: React.ReactNode 
}) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">{title}</h1>
          <p className="text-gray-500">{description}</p>
        </div>
      </div>
      
      {filters && (
        <div className="bg-slate-50 p-4 border rounded-md">
          {filters}
        </div>
      )}

      <div className="bg-white rounded-lg border shadow-sm">
        {children}
      </div>
    </div>
  );
}
