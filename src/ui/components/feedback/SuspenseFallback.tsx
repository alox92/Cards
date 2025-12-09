import React, { memo } from "react";

export const SuspenseFallback = memo(() => (
  <div className="flex flex-col items-center justify-center min-h-[50vh] w-full p-6 animate-fade-in">
    <div className="relative w-16 h-16 mb-6">
      <div className="absolute inset-0 rounded-full border-4 border-gray-100 dark:border-gray-800"></div>
      <div className="absolute inset-0 rounded-full border-4 border-primary-500 border-t-transparent animate-spin"></div>
      <div className="absolute inset-4 rounded-full bg-white dark:bg-gray-900 shadow-sm flex items-center justify-center">
        <div className="w-2 h-2 rounded-full bg-primary-500 animate-pulse"></div>
      </div>
    </div>
    <div className="flex flex-col items-center gap-2">
      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
        Chargement
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 animate-pulse">
        Préparation de votre espace...
      </p>
    </div>
  </div>
));
