import { QrCode, Banknote, CreditCard } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type PaymentMethod = 'PIX' | 'MONEY' | 'CARD';

export const PAYMENT_METHOD_CONFIG: Record<
  PaymentMethod,
  { label: string; icon: LucideIcon; activeClass: string; badgeClass: string }
> = {
  PIX: {
    label: 'PIX',
    icon: QrCode,
    activeClass: 'bg-cyan-500 text-white shadow-sm',
    badgeClass: 'bg-cyan-50 text-cyan-700 border border-cyan-200',
  },
  MONEY: {
    label: 'Dinheiro',
    icon: Banknote,
    activeClass: 'bg-emerald-500 text-white shadow-sm',
    badgeClass: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  },
  CARD: {
    label: 'Cartão',
    icon: CreditCard,
    activeClass: 'bg-violet-500 text-white shadow-sm',
    badgeClass: 'bg-violet-50 text-violet-700 border border-violet-200',
  },
};

export const PAYMENT_METHOD_OPTIONS = (Object.keys(PAYMENT_METHOD_CONFIG) as PaymentMethod[]).map(
  (key) => ({ value: key, ...PAYMENT_METHOD_CONFIG[key] })
);
