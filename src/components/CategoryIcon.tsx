import {
  Home,
  Utensils,
  CreditCard,
  Gamepad2,
  Beer,
  ShoppingBag,
  Car,
  Heart,
  Book,
  Smartphone,
  Zap,
  Coffee,
  Shirt,
  Receipt,
  type LucideIcon,
} from 'lucide-react';

interface CategoryIconProps {
  icon: string;
  className?: string;
  size?: number;
}

const iconMap: Record<string, LucideIcon> = {
  home: Home,
  utensils: Utensils,
  'credit-card': CreditCard,
  'gamepad-2': Gamepad2,
  beer: Beer,
  'shopping-bag': ShoppingBag,
  car: Car,
  heart: Heart,
  book: Book,
  smartphone: Smartphone,
  zap: Zap,
  coffee: Coffee,
  shirt: Shirt,
  receipt: Receipt,
};

export function CategoryIcon({ icon, className, size = 20 }: CategoryIconProps) {
  const IconComponent = iconMap[icon] || Receipt;
  return <IconComponent size={size} className={className} />;
}

// アイコン選択用のオプション
export const iconOptions = [
  { value: 'home', label: '家', Icon: Home },
  { value: 'utensils', label: '食事', Icon: Utensils },
  { value: 'credit-card', label: 'カード', Icon: CreditCard },
  { value: 'gamepad-2', label: 'ゲーム', Icon: Gamepad2 },
  { value: 'beer', label: '飲み物', Icon: Beer },
  { value: 'shopping-bag', label: '買い物', Icon: ShoppingBag },
  { value: 'car', label: '車', Icon: Car },
  { value: 'heart', label: 'ハート', Icon: Heart },
  { value: 'book', label: '本', Icon: Book },
  { value: 'smartphone', label: 'スマホ', Icon: Smartphone },
  { value: 'zap', label: '電気', Icon: Zap },
  { value: 'coffee', label: 'カフェ', Icon: Coffee },
  { value: 'shirt', label: '服', Icon: Shirt },
  { value: 'receipt', label: 'その他', Icon: Receipt },
];
