import type { Priority } from '../types';

interface PriorityOption {
  value: Priority;
  label: string;
  base: string;
  active: string;
  text: string;
}

const OPTIONS: PriorityOption[] = [
  {
    value: '상',
    label: '상',
    base: 'bg-red-50 border-red-200 text-red-600',
    active: 'bg-red-100 border-red-500 text-red-700 shadow-sm shadow-red-100',
    text: 'text-red-600',
  },
  {
    value: '중',
    label: '중',
    base: 'bg-blue-50 border-blue-200 text-blue-600',
    active: 'bg-blue-100 border-blue-500 text-blue-700 shadow-sm shadow-blue-100',
    text: 'text-blue-600',
  },
  {
    value: '하',
    label: '하',
    base: 'bg-gray-50 border-gray-200 text-gray-700',
    active: 'bg-gray-100 border-gray-500 text-gray-800 shadow-sm',
    text: 'text-gray-700',
  },
];

interface PrioritySelectorProps {
  value: Priority;
  onChange: (priority: Priority) => void;
}

export function PrioritySelector({ value, onChange }: PrioritySelectorProps) {
  return (
    <div className="flex gap-3" role="group" aria-label="중요도 선택">
      {OPTIONS.map((opt) => {
        const isSelected = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            aria-pressed={isSelected}
            className={`flex-1 py-3.5 rounded-xl border-2 font-bold text-xl transition-all duration-200 ${
              isSelected ? `${opt.active} scale-105` : `${opt.base} hover:opacity-75`
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
