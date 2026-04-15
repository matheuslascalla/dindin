import { listExpenses } from '@/server/actions/expense';
import { listCategories } from '@/server/actions/category';
import { getContextPersons } from '@/server/actions/house';
import { ExpenseList } from '@/components/gastos/ExpenseList';

interface GastosPageProps {
  searchParams: { month?: string };
}

export default async function GastosPage({ searchParams }: GastosPageProps) {
  const currentMonth = searchParams.month ? new Date(searchParams.month) : new Date();

  const [expenses, categories, contextPersons] = await Promise.all([
    listExpenses(currentMonth),
    listCategories(),
    getContextPersons(),
  ]);

  const total = expenses.reduce((sum, e) => sum + e.value, 0);

  return (
    <ExpenseList
      expenses={expenses}
      categories={categories}
      contextPersons={contextPersons}
      currentMonth={currentMonth}
      total={total}
    />
  );
}
