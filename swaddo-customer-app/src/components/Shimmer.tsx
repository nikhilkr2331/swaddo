import React from 'react';

const ShimmerElement = ({ className = '' }: { className?: string }) => {
  return (
    <div className={`relative overflow-hidden bg-gray-100 ${className}`}>
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent"></div>
    </div>
  );
};

export const StallCardShimmer = () => {
  return (
    <div className="flex flex-col bg-white rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-gray-100 overflow-hidden w-full">
      <ShimmerElement className="h-48 sm:h-44 w-full" />
      <div className="p-4 space-y-4">
        <ShimmerElement className="h-6 rounded-md w-3/4" />
        <div className="flex justify-between items-center">
          <ShimmerElement className="h-4 rounded-md w-1/3" />
          <ShimmerElement className="h-4 rounded-md w-1/4" />
        </div>
        <div className="border-t border-gray-100 pt-3">
          <ShimmerElement className="h-4 rounded-md w-1/2" />
        </div>
      </div>
    </div>
  );
};

export const MenuItemShimmer = () => {
  return (
    <div className="bg-white rounded-3xl p-4 shadow-sm border border-border-subtle flex gap-4 w-full">
      <div className="flex-1 space-y-3">
        <ShimmerElement className="w-5 h-5 rounded-sm" />
        <ShimmerElement className="h-5 rounded-md w-3/4" />
        <ShimmerElement className="h-4 rounded-md w-1/4" />
        <ShimmerElement className="h-10 rounded-md w-full mt-2" />
      </div>
      <div className="w-[120px] h-[120px] shrink-0 rounded-2xl overflow-hidden relative">
        <ShimmerElement className="w-full h-full" />
      </div>
    </div>
  );
};

export const OrderCardShimmer = () => {
  return (
    <div className="bg-white rounded-3xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-gray-100 space-y-4 w-full">
      <div className="flex justify-between items-start border-b border-gray-100 pb-4">
        <div className="space-y-2 flex-1">
          <ShimmerElement className="h-5 rounded-md w-1/2" />
          <ShimmerElement className="h-4 rounded-md w-1/3" />
        </div>
        <ShimmerElement className="h-8 rounded-full w-24" />
      </div>
      <div className="space-y-2">
        <ShimmerElement className="h-4 rounded-md w-full" />
        <ShimmerElement className="h-4 rounded-md w-3/4" />
      </div>
      <div className="pt-2 flex justify-between items-center">
        <ShimmerElement className="h-6 rounded-md w-1/4" />
        <ShimmerElement className="h-10 rounded-xl w-1/3" />
      </div>
    </div>
  );
};
