'use client';

import { useState, useTransition } from 'react';
import { Pencil, Trash2, Plus, Tag } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { deleteCategory } from '@/server/actions/category';
import { formatPercent, getCategoryIcon } from '@/lib/utils';
import { CategoryForm } from './CategoryForm';

interface Category {
  id: string;
  name: string;
  limitPercent: number;
  color: string;
  icon: string;
}

interface CategoryListProps {
  categories: Category[];
}

export function CategoryList({ categories }: CategoryListProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleDelete = (category: Category) => {
    setDeleteError(null);
    startTransition(async () => {
      try {
        await deleteCategory(category.id);
        setDeletingId(null);
      } catch (err) {
        setDeleteError(err instanceof Error ? err.message : 'Erro ao deletar.');
      }
    });
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Categorias</h1>
          <p className="mt-0.5 text-sm text-slate-400">Organize seus gastos por tipo</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus size={14} />
          Nova Categoria
        </Button>
      </div>

      {categories.length === 0 ? (
        <EmptyState
          icon={Tag}
          title="Nenhuma categoria"
          description="Crie categorias para organizar seus gastos por tipo."
          action={
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus size={14} />
              Nova Categoria
            </Button>
          }
        />
      ) : (
        <div className="overflow-hidden rounded-2xl bg-white shadow-card">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-400">
                  Categoria
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-400">
                  Ícone
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wide text-slate-400">
                  Limite Ideal
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wide text-slate-400">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {categories.map((cat) => (
                <tr key={cat.id} className="transition-colors hover:bg-slate-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <span
                        className="h-3 w-3 shrink-0 rounded-full"
                        style={{ backgroundColor: cat.color }}
                      />
                      <span className="text-sm font-medium text-slate-900">{cat.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {(() => {
                      const IconComponent = getCategoryIcon(cat.icon);
                      return (
                        <span
                          className="flex h-8 w-8 items-center justify-center rounded-lg"
                          style={{ backgroundColor: `${cat.color}20` }}
                        >
                          <IconComponent className="h-4 w-4" style={{ color: cat.color }} />
                        </span>
                      );
                    })()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-sm font-semibold text-slate-900">
                      {formatPercent(cat.limitPercent)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => setEditingCategory(cat)}
                        className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingId(cat.id)}
                        className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Nova Categoria">
        <CategoryForm
          onSuccess={() => setIsCreateOpen(false)}
          onCancel={() => setIsCreateOpen(false)}
        />
      </Modal>

      <Modal
        isOpen={!!editingCategory}
        onClose={() => setEditingCategory(null)}
        title="Editar Categoria"
      >
        <CategoryForm
          initial={editingCategory}
          onSuccess={() => setEditingCategory(null)}
          onCancel={() => setEditingCategory(null)}
        />
      </Modal>

      <Modal
        isOpen={!!deletingId}
        onClose={() => {
          setDeletingId(null);
          setDeleteError(null);
        }}
        title="Confirmar exclusão"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-500">
            Tem certeza que deseja deletar esta categoria? Esta ação não pode ser desfeita.
          </p>
          {deleteError && (
            <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2">
              <span className="text-sm text-red-600">{deleteError}</span>
            </div>
          )}
          <div className="flex gap-3">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => {
                setDeletingId(null);
                setDeleteError(null);
              }}
            >
              Cancelar
            </Button>
            <button
              type="button"
              disabled={isPending}
              onClick={() => {
                const cat = categories.find((c) => c.id === deletingId);
                if (cat) handleDelete(cat);
              }}
              className="flex-1 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-100 disabled:opacity-50"
            >
              {isPending ? 'Deletando…' : 'Deletar'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
