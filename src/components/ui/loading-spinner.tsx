// src/components/ui/loading-spinner.tsx
interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = "md",
  className = "",
}) => {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12",
  };

  return (
    <div
      className={`flex items-center justify-center min-h-screen ${className}`}
    >
      <div
        className={`${sizeClasses[size]} animate-spin rounded-full border-2 border-primary border-t-transparent`}
      />
    </div>
  );
};
