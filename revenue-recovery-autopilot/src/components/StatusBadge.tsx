import React from 'react';
import { CaseStatus, RiskLevel, PaymentStatus } from '../types';

interface StatusBadgeProps {
  type: 'status' | 'risk' | 'payment' | 'mode';
  value: string;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ type, value, className = '' }) => {
  let badgeStyles = 'bg-slate-100 text-slate-700 border-slate-200';

  if (type === 'status') {
    const status = value as CaseStatus;
    switch (status) {
      case 'RECOVERED':
        badgeStyles = 'bg-green-100 text-green-700 border-green-200';
        break;
      case 'DETECTED':
        badgeStyles = 'bg-amber-100 text-amber-700 border-amber-200';
        break;
      case 'DIAGNOSED':
        badgeStyles = 'bg-blue-100 text-blue-700 border-blue-200';
        break;
      case 'ACTION_RECOMMENDED':
        badgeStyles = 'bg-purple-100 text-purple-700 border-purple-200';
        break;
      case 'PENDING_APPROVAL':
        badgeStyles = 'bg-amber-100 text-amber-800 border-amber-300';
        break;
      case 'RECOVERY_IN_PROGRESS':
        badgeStyles = 'bg-blue-100 text-blue-700 border-blue-200 animate-pulse';
        break;
      case 'BLOCKED':
        badgeStyles = 'bg-slate-100 text-slate-500 border-slate-200';
        break;
      case 'FAILED':
        badgeStyles = 'bg-red-100 text-red-700 border-red-200';
        break;
      default:
        badgeStyles = 'bg-slate-100 text-slate-700 border-slate-200';
    }
  } else if (type === 'risk') {
    const risk = value as RiskLevel;
    switch (risk) {
      case 'LOW':
        badgeStyles = 'bg-green-50 text-green-700 border-green-200';
        break;
      case 'MEDIUM':
        badgeStyles = 'bg-amber-50 text-amber-700 border-amber-200';
        break;
      case 'HIGH':
        badgeStyles = 'bg-orange-50 text-orange-700 border-orange-200';
        break;
      case 'CRITICAL':
        badgeStyles = 'bg-red-50 text-red-700 border-red-200';
        break;
    }
  } else if (type === 'payment') {
    const status = value as PaymentStatus;
    switch (status) {
      case 'recovered':
      case 'captured':
        badgeStyles = 'bg-green-100 text-green-700 border-green-200';
        break;
      case 'failed':
        badgeStyles = 'bg-red-100 text-red-700 border-red-200';
        break;
      case 'abandoned':
        badgeStyles = 'bg-purple-100 text-purple-700 border-purple-200';
        break;
      case 'processing':
        badgeStyles = 'bg-blue-100 text-blue-700 border-blue-200';
        break;
      default:
        badgeStyles = 'bg-slate-100 text-slate-700 border-slate-200';
    }
  } else if (type === 'mode') {
    if (value.includes('CONNECTED') || value.includes('TEST API')) {
      badgeStyles = 'bg-green-100 text-green-700 border-green-200';
    } else {
      badgeStyles = 'bg-amber-100 text-amber-700 border-amber-200';
    }
  }

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border whitespace-nowrap ${badgeStyles} ${className}`}
    >
      {value.replace(/_/g, ' ')}
    </span>
  );
};
