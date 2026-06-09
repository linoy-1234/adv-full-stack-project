import { memo } from 'react';
import { AlertTriangle } from 'lucide-react';

interface TemperatureBadgeProps {
  temperature: number;
  size?: 'small' | 'medium' | 'large';
}

export const TemperatureBadge = memo(({ temperature, size = 'medium' }: TemperatureBadgeProps) => {
  const isElevated = temperature >= 38.0;

  const bgColor = isElevated ? '#FEF2F2' : '#D1FAE5';
  const borderColor = isElevated ? '#FCA5A5' : '#7CAE8E';
  const textColor = isElevated ? '#991B1B' : '#166534';

  const sizeClasses = {
    small: 'px-2 py-1 text-xs',
    medium: 'px-3 py-1.5 text-sm',
    large: 'px-4 py-2 text-base',
  };

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-xl ${sizeClasses[size]}`}
      style={{
        backgroundColor: bgColor,
        border: `1.5px solid ${borderColor}`,
        color: textColor,
      }}
    >
      {isElevated && <AlertTriangle className="w-3.5 h-3.5 shrink-0" />}
      <span className="font-medium">
        {temperature.toFixed(1)}°C
      </span>
      {isElevated && (
        <span className="text-xs ml-1" style={{ color: '#B91C1C' }}>
          Elevated
        </span>
      )}
    </div>
  );
}, (prevProps, nextProps) => {
  // Only re-render if temperature changes
  return prevProps.temperature === nextProps.temperature && prevProps.size === nextProps.size;
});

TemperatureBadge.displayName = 'TemperatureBadge';
