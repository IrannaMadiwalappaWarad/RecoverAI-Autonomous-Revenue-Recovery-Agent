import React from 'react';
import { LucideIcon } from 'lucide-react';

interface KPICardProps {
  id: string;
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  variant?: 'emerald' | 'rose' | 'amber' | 'indigo' | 'blue' | 'slate';
  badge?: string;
}

export const KPICard: React.FC<KPICardProps> = ({
  id,
  title,
  value,
  subtitle,
  icon: Icon,
  variant = 'slate',
  badge
}) => {
  const variantStyles = {
    emerald: {
      text: 'text-emerald-600',
      badge: 'bg-emerald-50 text-emerald-700 border-emerald-200'
    },
    rose: {
      text: 'text-slate-900',
      badge: 'bg-rose-50 text-rose-700 border-rose-200'
    },
    amber: {
      text: 'text-amber-600',
      badge: 'bg-amber-50 text-amber-700 border-amber-200'
    },
    indigo: {
      text: 'text-blue-600',
      badge: 'bg-blue-50 text-blue-700 border-blue-200'
    },
    blue: {
      text: 'text-blue-600',
      badge: 'bg-blue-50 text-blue-700 border-blue-200'
    },
    slate: {
      text: 'text-slate-900',
      badge: 'bg-slate-100 text-slate-700 border-slate-200'
    }
  };

  const st = variantStyles[variant];

  return (
    <div
      id={id}
      className="bg-white border border-slate-200 rounded-lg p-3.5 sm:p-4 hover:border-slate-300 transition-colors flex flex-col justify-between"
    >
      <div>
        <div className="flex items-center justify-between mb-1">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            {title}
          </p>
          <Icon className="w-4 h-4 text-slate-400" />
        </div>
        <p className={`text-xl sm:text-2xl font-mono font-semibold tracking-tight ${st.text}`}>
          {value}
        </p>
      </div>

      {(subtitle || badge) && (
        <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
          {subtitle && <span className="text-slate-500 font-medium">{subtitle}</span>}
          {badge && (
            <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border ${st.badge}`}>
              {badge}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
