import { listAllExpenses } from '@/server/actions/expense';
import { listCategories } from '@/server/actions/category';
import { getContextPersons } from '@/server/actions/house';
import { listCards } from '@/server/actions/card';
import { ExpenseList } from '@/components/gastos/ExpenseList';
import type { PaymentMethod } from '@/lib/constants/payments';

interface GastosPageProps {
  searchParams: {
    month?: string;
    categoryId?: string;
    paymentMethod?: string;
    person?: string;
    page?: string;
  };
}

export default async function GastosPage({ searchParams }: GastosPageProps) {
  const currentMonth = searchParams.month ? new Date(searchParams.month) : new Date();
  const currentPage = searchParams.page ? parseInt(searchParams.page, 10) : 1;

  const currentFilters = {
    categoryId: searchParams.categoryId,
    paymentMethod: searchParams.paymentMethod as PaymentMethod | undefined,
    person: searchParams.person,
  };

  const [{ items, total, totalValue, pageCount }, categories, contextPersons, rawCards] =
    await Promise.all([
      listAllExpenses({
        month: currentMonth,
        categoryId: currentFilters.categoryId,
        paymentMethod: currentFilters.paymentMethod,
        person: currentFilters.person,
        page: currentPage,
        pageSize: 10,
      }),
      listCategories(),
      getContextPersons(),
      listCards(),
    ]);

  const cards = rawCards.map((c) => ({ id: c.id, name: c.name }));

  return (
    <ExpenseList
      items={items}
      total={total}
      totalValue={totalValue}
      pageCount={pageCount}
      currentPage={currentPage}
      categories={categories}
      contextPersons={contextPersons}
      cards={cards}
      currentMonth={currentMonth}
      currentFilters={currentFilters}
    />
  );
}
