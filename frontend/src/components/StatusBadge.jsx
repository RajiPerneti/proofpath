import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Clock } from 'lucide-react';

export default function StatusBadge({ status, size = 'md' }) {
  const norm = (status || '').toLowerCase().replace(/[\s-]/g, '_');

  const configs = {
    demonstrated: {
      label: 'Fully Demonstrated',
      bg: 'bg-emerald-50 border-emerald-200 text-emerald-800',
      icon: CheckCircle2,
      dot: 'bg-emerald-500'
    },
    fully_demonstrated: {
      label: 'Fully Demonstrated',
      bg: 'bg-emerald-50 border-emerald-200 text-emerald-800',
      icon: CheckCircle2,
      dot: 'bg-emerald-500'
    },
    partially_demonstrated: {
      label: 'Partially Demonstrated',
      bg: 'bg-amber-50 border-amber-200 text-amber-800',
      icon: AlertTriangle,
      dot: 'bg-amber-500'
    },
    insufficient_evidence: {
      label: 'Insufficient Evidence',
      bg: 'bg-rose-50 border-rose-200 text-rose-800',
      icon: XCircle,
      dot: 'bg-rose-500'
    },
    not_assessed: {
      label: 'Not Yet Assessed',
      bg: 'bg-slate-100 border-slate-200 text-slate-600',
      icon: Clock,
      dot: 'bg-slate-400'
    }
  };

  const config = configs[norm] || configs.not_assessed;
  const Icon = config.icon;
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs font-medium';

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border ${config.bg} ${sizeClasses}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
      <Icon className="h-3.5 w-3.5" />
      <span>{config.label}</span>
    </span>
  );
}
