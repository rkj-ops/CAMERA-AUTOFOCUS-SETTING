import React from 'react';

interface ControlSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  unit?: string;
}

export const ControlSlider: React.FC<ControlSliderProps> = ({
  label,
  value,
  min,
  max,
  step,
  onChange,
  disabled = false,
  unit = ''
}) => {
  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-1">
        <label className={`text-sm font-medium ${disabled ? 'text-gray-600' : 'text-gray-300'}`}>
          {label}
        </label>
        <span className={`text-xs font-mono ${disabled ? 'text-gray-600' : 'text-primary-500'}`}>
          {value.toFixed(2)}{unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        disabled={disabled}
        className={`w-full h-2 rounded-lg appearance-none cursor-pointer 
          ${disabled ? 'bg-gray-800' : 'bg-gray-700 hover:bg-gray-600'}
          accent-primary-500`}
      />
    </div>
  );
};