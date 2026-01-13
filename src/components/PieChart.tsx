import { formatCurrency } from '@/lib/formatters';

interface PieChartData {
  name: string;
  value: number;
  color: string;
}

interface PieChartProps {
  data: PieChartData[];
  size?: number;
}

export function PieChart({ data, size = 200 }: PieChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  if (total === 0) {
    return (
      <div className="flex items-center justify-center" style={{ width: size, height: size }}>
        <p className="text-sm text-muted-foreground">データがありません</p>
      </div>
    );
  }

  let currentAngle = -90; // Start from top

  const slices = data.map((item) => {
    const percentage = (item.value / total) * 100;
    const angle = (item.value / total) * 360;
    const startAngle = currentAngle;
    currentAngle += angle;

    // Calculate path for pie slice
    const radius = size / 2;
    const centerX = radius;
    const centerY = radius;

    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (currentAngle * Math.PI) / 180;

    const x1 = centerX + radius * Math.cos(startRad);
    const y1 = centerY + radius * Math.sin(startRad);
    const x2 = centerX + radius * Math.cos(endRad);
    const y2 = centerY + radius * Math.sin(endRad);

    const largeArcFlag = angle > 180 ? 1 : 0;

    const pathData = [
      `M ${centerX} ${centerY}`,
      `L ${x1} ${y1}`,
      `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
      'Z',
    ].join(' ');

    return {
      ...item,
      percentage,
      pathData,
    };
  });

  return (
    <div className="flex flex-col items-center gap-4">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {slices.map((slice, index) => (
          <g key={index}>
            <path
              d={slice.pathData}
              fill={slice.color}
              className="transition-opacity hover:opacity-80 cursor-pointer"
            />
          </g>
        ))}
      </svg>
      <div className="grid grid-cols-2 gap-3 w-full">
        {slices.map((slice, index) => (
          <div key={index} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-sm flex-shrink-0"
              style={{ backgroundColor: slice.color }}
            />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium truncate">{slice.name}</p>
              <p className="text-xs text-muted-foreground">
                {formatCurrency(slice.value)} ({slice.percentage.toFixed(1)}%)
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
