import { listIncomes, getTotalMonthlyIncome } from '@/server/actions/income';
import { IncomeList } from '@/components/rendas/IncomeList';

export default async function RendasPage() {
  const [incomes, totalMonthly] = await Promise.all([listIncomes(), getTotalMonthlyIncome()]);
  return <IncomeList incomes={incomes} totalMonthly={totalMonthly} />;
}
