'use client';

import { Fragment, useState, useTransition } from 'react';
import { Pencil, Trash2, Plus, Tag, ChevronDown, ChevronRight } from 'lucide-react';

import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { deleteCategory } from '@/server/actions/category';
import { deleteSubcategory } from '@/server/actions/subcategory';
import { formatPercent, getCategoryIcon } from '@/lib/utils';
import type { Subcategory } from '@/types';
import { CategoryForm } from './CategoryForm';
import { SubcategoryForm } from './SubcategoryForm';

interface Category {
  id: string;
  name: string;
  limitPercent: number;
  color: string;
  icon: string;
  subcategories: Subcategory[];
}

interface CategoryListProps {
  categories: Category[];
}

type DeleteTarget = { kind: 'category'; id: string } | { kind: 'subcategory'; id: string };

export function CategoryList({ categories }: CategoryListProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [creatingSubForCategoryId, setCreatingSubForCategoryId] = useState<string | null>(null);
  const [editingSubcategory, setEditingSubcategory] = useState<{
    sub: Subcategory;
    categoryId: string;
  } | null>(null);

  const [deletingTarget, setDeletingTarget] = useState<DeleteTarget | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleDelete = () => {
    if (!deletingTarget) return;
    setDeleteError(null);
    startTransition(async () => {
      try {
        if (deletingTarget.kind === 'category') {
          await deleteCategory(deletingTarget.id);
        } else {
          await deleteSubcategory(deletingTarget.id);
        }
        setDeletingTarget(null);
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
              {categories.map((cat) => {
                const isExpanded = expandedIds.has(cat.id);
                const IconComponent = getCategoryIcon(cat.icon);

                return (
                  <Fragment key={cat.id}>
                    <tr className="transition-colors hover:bg-slate-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => toggleExpand(cat.id)}
                            className="shrink-0 text-slate-400 transition-colors hover:text-slate-600"
                            title={
                              isExpanded ? 'Recolher sub-categorias' : 'Expandir sub-categorias'
                            }
                          >
                            {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                          </button>
                          <span
                            className="h-3 w-3 shrink-0 rounded-full"
                            style={{ backgroundColor: cat.color }}
                          />
                          <span className="text-sm font-medium text-slate-900">{cat.name}</span>
                          {cat.subcategories.length > 0 && (
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                              {cat.subcategories.length}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className="flex h-8 w-8 items-center justify-center rounded-lg"
                          style={{ backgroundColor: `${cat.color}20` }}
                        >
                          <IconComponent className="h-4 w-4" style={{ color: cat.color }} />
                        </span>
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
                            onClick={() => setDeletingTarget({ kind: 'category', id: cat.id })}
                            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>

                    {isExpanded && (
                      <tr>
                        <td colSpan={4} className="border-t border-slate-100 bg-slate-50 px-6 py-3">
                          <div className="space-y-1">
                            {cat.subcategories.length === 0 ? (
                              <p className="py-1 text-xs text-slate-400">
                                Nenhuma sub-categoria ainda.
                              </p>
                            ) : (
                              cat.subcategories.map((sub) => (
                                <div
                                  key={sub.id}
                                  className="flex items-center justify-between rounded-lg px-3 py-1.5"
                                >
                                  <div className="flex items-center gap-2">
                                    <span
                                      className="h-1.5 w-1.5 shrink-0 rounded-full"
                                      style={{ backgroundColor: cat.color }}
                                    />
                                    <span className="text-sm text-slate-700">{sub.name}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setEditingSubcategory({ sub, categoryId: cat.id })
                                      }
                                      className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-white hover:text-slate-700"
                                    >
                                      <Pencil size={12} />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setDeletingTarget({ kind: 'subcategory', id: sub.id })
                                      }
                                      className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500"
                                    >
                                      <Trash2 size={12} />
                                    </button>
                                  </div>
                                </div>
                              ))
                            )}

                            <button
                              type="button"
                              onClick={() => setCreatingSubForCategoryId(cat.id)}
                              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-teal-600 transition-colors hover:bg-teal-50"
                            >
                              <Plus size={12} />
                              Nova Sub-categoria
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
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
        isOpen={!!creatingSubForCategoryId}
        onClose={() => setCreatingSubForCategoryId(null)}
        title="Nova Sub-categoria"
      >
        {creatingSubForCategoryId && (
          <SubcategoryForm
            expenseTypeId={creatingSubForCategoryId}
            onSuccess={() => setCreatingSubForCategoryId(null)}
            onCancel={() => setCreatingSubForCategoryId(null)}
          />
        )}
      </Modal>

      <Modal
        isOpen={!!editingSubcategory}
        onClose={() => setEditingSubcategory(null)}
        title="Editar Sub-categoria"
      >
        {editingSubcategory && (
          <SubcategoryForm
            expenseTypeId={editingSubcategory.categoryId}
            initial={editingSubcategory.sub}
            onSuccess={() => setEditingSubcategory(null)}
            onCancel={() => setEditingSubcategory(null)}
          />
        )}
      </Modal>

      <Modal
        isOpen={!!deletingTarget}
        onClose={() => {
          setDeletingTarget(null);
          setDeleteError(null);
        }}
        title="Confirmar exclusão"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-500">
            {deletingTarget?.kind === 'category'
              ? 'Tem certeza que deseja deletar esta categoria? Esta ação não pode ser desfeita.'
              : 'Tem certeza que deseja deletar esta sub-categoria? Esta ação não pode ser desfeita.'}
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
                setDeletingTarget(null);
                setDeleteError(null);
              }}
            >
              Cancelar
            </Button>
            <button
              type="button"
              disabled={isPending}
              onClick={handleDelete}
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
