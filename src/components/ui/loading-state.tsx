import { Loader2 } from "lucide-react";

interface LoadingStateProps {
  message?: string;
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "h-4 w-4",
  md: "h-8 w-8",
  lg: "h-12 w-12"
};

export function LoadingState({ message = "Cargando...", size = "md" }: LoadingStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-4">
      <Loader2 className={`${sizeClasses[size]} animate-spin text-blue-600`} />
      <p className="text-gray-500 text-sm">{message}</p>
    </div>
  );
}
