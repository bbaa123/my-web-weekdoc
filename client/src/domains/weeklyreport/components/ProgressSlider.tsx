import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ProgressSliderProps {
  value: number;
  onChange: (value: number) => void;
}

function getBarColor(value: number): string {
  if (value <= 30) return 'bg-red-400';
  if (value <= 70) return 'bg-yellow-400';
  return 'bg-green-500';
}

export function ProgressSlider({ value, onChange }: ProgressSliderProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(Number(e.target.value));
    },
    [onChange]
  );

  const barColor = getBarColor(value);
  const isComplete = value === 100;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-slate-700">진도율</span>
        <div className="flex items-center gap-2">
          <AnimatePresence>
            {isComplete && (
              <motion.span
                key="confetti"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: [0, 1.4, 1], opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ duration: 0.45 }}
                className="text-2xl leading-none select-none"
              >
                🎉
              </motion.span>
            )}
          </AnimatePresence>
          <motion.span
            className={`font-black tabular-nums transition-colors duration-200 ${
              isComplete ? 'text-green-600' : value <= 30 ? 'text-red-500' : 'text-slate-900'
            }`}
            animate={{ scale: isDragging ? 1.3 : 1 }}
            style={{
              fontSize: isDragging ? '1.5rem' : '1.125rem',
              transition: 'font-size 0.15s ease',
            }}
            transition={{ type: 'spring', stiffness: 350, damping: 22 }}
          >
            {value}%
          </motion.span>
        </div>
      </div>

      <div className="relative py-2">
        {/* Visual track */}
        <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
          <motion.div
            className={`h-full rounded-full ${barColor}`}
            animate={{ width: `${value}%` }}
            transition={{ type: 'spring', stiffness: 200, damping: 28 }}
          />
        </div>
        {/* Transparent range input sits on top */}
        <input
          type="range"
          min={0}
          max={100}
          step={5}
          value={value}
          onChange={handleChange}
          onMouseDown={() => setIsDragging(true)}
          onMouseUp={() => setIsDragging(false)}
          onTouchStart={() => setIsDragging(true)}
          onTouchEnd={() => setIsDragging(false)}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          aria-label="진도율"
        />
      </div>

      <div className="flex justify-between text-xs text-slate-400 select-none">
        <span>0%</span>
        <span>50%</span>
        <span>100%</span>
      </div>
    </div>
  );
}
