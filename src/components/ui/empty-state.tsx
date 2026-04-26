import { Package, Search, Inbox, FolderOpen } from "lucide-react";
import { Button } from "./button";

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: "package" | "search" | "inbox" | "folder";
  action?: {
    label: string;
    onClick: () => void;
  };
}

const icons = {
  package: Package,
  search: Search,
  inbox: Inbox,
  folder: FolderOpen
};

export function EmptyState({ 
  title = "No hay datos", 
  description = "No se encontraron registros para mostrar.",
  icon = "inbox",
  action
}: EmptyStateProps) {
  const Icon = icons[icon];
  
  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-4 text-center">
      <div className="p-4 bg-gray-100 rounded-full">
        <Icon className="h-8 w-8 text-gray-400" />
      </div>
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <p className="text-gray-500 max-w-sm">{description}</p>
      </div>
      {action && (
        <Button onClick={action.onClick} variant="outline">
          {action.label}
        </Button>
      )}
    </div>
  );
}
