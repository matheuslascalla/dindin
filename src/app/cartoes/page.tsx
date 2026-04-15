import { listCards, listCardExpenses, getCardTotal, getAllCardsTotal } from '@/server/actions/card';
import { listCategories } from '@/server/actions/category';
import { getContextPersons } from '@/server/actions/house';
import { CardList } from '@/components/cartoes/CardList';

interface CartoesPageProps {
  searchParams: { month?: string };
}

export default async function CartoesPage({ searchParams }: CartoesPageProps) {
  const currentMonth = searchParams.month ? new Date(searchParams.month) : new Date();

  const [cards, categories, grandTotal, contextPersons] = await Promise.all([
    listCards(),
    listCategories(),
    getAllCardsTotal(currentMonth),
    getContextPersons(),
  ]);

  // Fetch expenses and totals per card in parallel
  const [expensesByCardArr, totalsByCardArr] = await Promise.all([
    Promise.all(
      cards.map((c) => listCardExpenses(c.id, currentMonth).then((exps) => ({ id: c.id, exps })))
    ),
    Promise.all(
      cards.map((c) => getCardTotal(c.id, currentMonth).then((total) => ({ id: c.id, total })))
    ),
  ]);

  const expensesByCard = Object.fromEntries(expensesByCardArr.map(({ id, exps }) => [id, exps]));
  const totalsByCard = Object.fromEntries(totalsByCardArr.map(({ id, total }) => [id, total]));

  return (
    <CardList
      cards={cards}
      expensesByCard={expensesByCard}
      totalsByCard={totalsByCard}
      grandTotal={grandTotal}
      categories={categories}
      contextPersons={contextPersons}
      currentMonth={currentMonth}
    />
  );
}
