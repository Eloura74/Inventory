import React from 'react';

// Composant Skeleton de base
export const Skeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div
    className={`animate-pulse bg-slate-800/50 rounded ${className}`}
  />
);

// Skeleton pour une Card
export const CardSkeleton: React.FC = () => (
  <div className="bg-zinc-900/40 backdrop-blur-sm border border-white/5 rounded-xl p-6 animate-pulse">
    <div className="flex items-center justify-between mb-4">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-8 w-8 rounded" />
    </div>
    <Skeleton className="h-12 w-20 mb-2" />
    <Skeleton className="h-3 w-40" />
  </div>
);

// Skeleton pour une ligne de tableau
export const TableRowSkeleton: React.FC = () => (
  <tr className="border-b border-slate-800 animate-pulse">
    <td className="p-4">
      <Skeleton className="h-10 w-10 rounded" />
    </td>
    <td className="p-4">
      <Skeleton className="h-4 w-32 mb-2" />
      <Skeleton className="h-3 w-24" />
    </td>
    <td className="p-4">
      <Skeleton className="h-4 w-24" />
    </td>
    <td className="p-4">
      <Skeleton className="h-4 w-16" />
    </td>
    <td className="p-4">
      <Skeleton className="h-6 w-16 rounded-full" />
    </td>
    <td className="p-4">
      <Skeleton className="h-8 w-8 rounded" />
    </td>
  </tr>
);

// Skeleton pour la liste d'inventaire complète
export const InventoryListSkeleton: React.FC = () => (
  <div className="bg-[#0b1120] rounded border border-slate-800 overflow-hidden">
    <table className="w-full">
      <thead className="bg-slate-900/50 border-b border-slate-800">
        <tr>
          <th className="p-4 text-left"><Skeleton className="h-4 w-16" /></th>
          <th className="p-4 text-left"><Skeleton className="h-4 w-24" /></th>
          <th className="p-4 text-left"><Skeleton className="h-4 w-20" /></th>
          <th className="p-4 text-left"><Skeleton className="h-4 w-16" /></th>
          <th className="p-4 text-left"><Skeleton className="h-4 w-20" /></th>
          <th className="p-4 text-left"><Skeleton className="h-4 w-12" /></th>
        </tr>
      </thead>
      <tbody>
        {[...Array(5)].map((_, i) => (
          <TableRowSkeleton key={i} />
        ))}
      </tbody>
    </table>
  </div>
);

// Skeleton pour le Dashboard
export const DashboardSkeleton: React.FC = () => (
  <div className="space-y-6 animate-in fade-in duration-500">
    {/* Header Skeleton */}
    <div className="space-y-2">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-64" />
    </div>

    {/* Stats Cards Grid */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>

    {/* Charts Section */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="bg-zinc-900/40 backdrop-blur-sm border border-white/5 rounded-xl p-6 animate-pulse">
        <Skeleton className="h-5 w-32 mb-6" />
        <Skeleton className="h-64 w-full" />
      </div>
      <div className="bg-zinc-900/40 backdrop-blur-sm border border-white/5 rounded-xl p-6 animate-pulse">
        <Skeleton className="h-5 w-32 mb-6" />
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    </div>
  </div>
);
