declare module 'lucide-react' {
  import { FC, SVGProps } from 'react';

  export interface LucideProps extends SVGProps<SVGSVGElement> {
    size?: string | number;
    color?: string;
    strokeWidth?: string | number;
    className?: string;
  }

  type LucideIcon = FC<LucideProps>;

  export const Activity: LucideIcon;
  export const AlertCircle: LucideIcon;
  export const AlertTriangle: LucideIcon;
  export const ArrowDown: LucideIcon;
  export const ArrowUp: LucideIcon;
  export const ArrowUpDown: LucideIcon;
  export const Building2: LucideIcon;
  export const CheckCircle: LucideIcon;
  export const CheckCircle2: LucideIcon;
  export const ChevronDown: LucideIcon;
  export const ChevronRight: LucideIcon;
  export const ChevronUp: LucideIcon;
  export const Clock: LucideIcon;
  export const Droplets: LucideIcon;
  export const Eye: LucideIcon;
  export const EyeOff: LucideIcon;
  export const FileText: LucideIcon;
  export const Filter: LucideIcon;
  export const Gauge: LucideIcon;
  export const HelpCircle: LucideIcon;
  export const LayoutList: LucideIcon;
  export const MapPin: LucideIcon;
  export const Megaphone: LucideIcon;
  export const Newspaper: LucideIcon;
  export const Package: LucideIcon;
  export const PackagePlus: LucideIcon;
  export const Plus: LucideIcon;
  export const Radio: LucideIcon;
  export const RadioReceiver: LucideIcon;
  export const RadioTower: LucideIcon;
  export const Sailboat: LucideIcon;
  export const Search: LucideIcon;
  export const Send: LucideIcon;
  export const ShieldAlert: LucideIcon;
  export const Siren: LucideIcon;
  export const Sparkles: LucideIcon;
  export const TrendingDown: LucideIcon;
  export const Truck: LucideIcon;
  export const Undo2: LucideIcon;
  export const Users: LucideIcon;
  export const Waves: LucideIcon;
  export const X: LucideIcon;

  // Catch-all for any other icon
  const _default: Record<string, LucideIcon>;
  export default _default;
}
