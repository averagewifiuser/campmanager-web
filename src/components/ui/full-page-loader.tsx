import React from "react";
import { LoadingSpinner } from "./loading-spinner";

interface FullPageLoaderProps {
  message?: string;
}

export const FullPageLoader: React.FC<FullPageLoaderProps> = ({ 
  message = "Processing..." 
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
      <div className="bg-white rounded-lg p-8 flex flex-col items-center space-y-4 shadow-xl">
        <LoadingSpinner />
        <p className="text-lg font-medium text-gray-700">{message}</p>
        <p className="text-sm text-gray-500">Please wait...</p>
      </div>
    </div>
  );
};

export default FullPageLoader;
