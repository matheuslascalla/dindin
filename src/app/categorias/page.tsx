import { listCategories } from '@/server/actions/category';
import { CategoryList } from '@/components/categorias/CategoryList';

export default async function CategoriasPage() {
  const categories = await listCategories();
  return <CategoryList categories={categories} />;
}
