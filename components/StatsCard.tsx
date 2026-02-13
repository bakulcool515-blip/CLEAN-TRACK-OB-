import React from 'react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  colorClass: string;
}

export const StatsCard: React.FC<StatsCardProps> = ({ title, value, icon, colorClass }) => {
  return (
    <div className="bg-white p-4 md:p-6 rounded-[32px] shadow-sm border border-slate-100 flex items-center space-x-4 transition-transform active:scale-95">
      <div className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl ${colorClass} text-white text-xl md:text-2xl flex items-center justify-center shrink-0 shadow-lg`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-slate-400 text-[9px] md:text-[10px] font-black uppercase tracking-[0.15em] truncate mb-0.5">{title}</p>
        <h3 className="text-xl md:text-2xl font-black text-slate-900 leading-none">{value}</h3>
      </div>
    </div>
  );
};