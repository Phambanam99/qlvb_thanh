import { AlertCircle } from "lucide-react";

interface ErrorMessageProps {
  message: string | null;
}

export function ErrorMessage({ message }: ErrorMessageProps) {
  if (!message) return null;

  return (
    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md flex items-center mb-4">
      <AlertCircle className="h-4 w-4 mr-2" />
      <span className="text-sm">{message}</span>
    </div>
  );
}
