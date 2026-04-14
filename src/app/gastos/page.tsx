import { listExpenses } from '@/server/actions/expense';
import { listCategories } from '@/server/actions/category';
import { ExpenseList } from '@/components/gastos/ExpenseList';

interface GastosPageProps {
  searchParams: { month?: string };
}

export default async function GastosPage({ searchParams }: GastosPageProps) {
  const currentMonth = searchParams.month ? new Date(searchParams.month) : new Date();

  const [expenses, categories] = await Promise.all([listExpenses(currentMonth), listCategories()]);

  const total = expenses.reduce((sum, e) => sum + e.value, 0);

  return (
    <ExpenseList
      expenses={expenses}
      categories={categories}
      currentMonth={currentMonth}
      total={total}
    />
  );
}
