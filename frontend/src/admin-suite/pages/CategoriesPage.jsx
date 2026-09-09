import { useState } from 'react'
import {
  useGetCategoriesQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
  useGetProductsQuery,
} from '@/features/adminApi'
import {
  Plus,
  Trash2,
  Edit3,
  Loader2,
  FolderTree,
  Layers,
  X,
  CheckCircle2,
} from 'lucide-react'
import ConfirmModal from '@/components/ConfirmModal'
import MediaUploadPicker from '@/components/MediaUploadPicker'

export default function CategoriesPage() {
  const { data: categoriesData, isLoading, isError, refetch } = useGetCategoriesQuery()
  const { data: productsData } = useGetProductsQuery()
  const [createCategory, { isLoading: isCreating }] = useCreateCategoryMutation()
  const [updateCategory, { isLoading: isUpdating }] = useUpdateCategoryMutation()
  const [deleteCategory, { isLoading: isDeleting }] = useDeleteCategoryMutation()

  // New Category Form State
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [image, setImage] = useState('')
  const [description, setDescription] = useState('')

  // Edit Modal State
  const [editModal, setEditModal] = useState({
    isOpen: false,
    id: null,
    name: '',
    slug: '',
    description: '',
    initialName: '',
    initialSlug: '',
    initialDescription: '',
  })

  // Delete Confirm State
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, id: null, name: '' })

  const categories = Array.isArray(categoriesData?.data)
    ? categoriesData.data
    : Array.isArray(categoriesData?.categories)
    ? categoriesData.categories
    : Array.isArray(categoriesData)
    ? categoriesData
    : []

  const rawProducts = Array.isArray(productsData?.data)
    ? productsData.data
    : Array.isArray(productsData?.products)
    ? productsData.products
    : Array.isArray(productsData)
    ? productsData
    : []

  const getProductCount = (catId, catName) => {
    return rawProducts.filter(
      (p) =>
        (p.category?._id || p.category) === catId ||
        p.category?.name?.toLowerCase() === catName?.toLowerCase()
    ).length
  }

  // Check if user has actually changed name, slug or description
  const hasChanges =
    editModal.isOpen &&
    (editModal.name.trim() !== (editModal.initialName || '').trim() ||
      editModal.slug.trim() !== (editModal.initialSlug || '').trim() ||
      (editModal.description || '').trim() !== (editModal.initialDescription || '').trim())

  // Create Category Handler
  const handleCreate = async (e) => {
    e.preventDefault()
    if (!name.trim()) return
    try {
      await createCategory({
        name: name.trim(),
        slug: slug.trim() || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''),
        description: description.trim(),
      }).unwrap()
      setName('')
      setSlug('')
      setDescription('')
      refetch()
    } catch (err) {
      // Handled automatically by toast notification middleware
    }
  }

  // Open Edit Modal Handler
  const handleOpenEdit = (cat) => {
    setEditModal({
      isOpen: true,
      id: cat._id,
      name: cat.name || '',
      slug: cat.slug || '',
      description: cat.description || '',
      initialName: cat.name || '',
      initialSlug: cat.slug || '',
      initialDescription: cat.description || '',
    })
  }

  // Submit Category Update Handler
  const handleSaveEdit = async (e) => {
    e.preventDefault()
    if (!hasChanges || !editModal.name.trim()) return
    try {
      await updateCategory({
        id: editModal.id,
        name: editModal.name.trim(),
        slug: editModal.slug.trim() || editModal.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''),
        description: editModal.description.trim(),
      }).unwrap()
      setEditModal({
        isOpen: false,
        id: null,
        name: '',
        slug: '',
        description: '',
        initialName: '',
        initialSlug: '',
        initialDescription: '',
      })
      refetch()
    } catch (err) {
      // Handled automatically by toast notification middleware
    }
  }

  // Delete Category Handlers
  const handleDelete = (id, catName) => {
    setDeleteConfirm({ isOpen: true, id, name: catName })
  }

  const confirmDeleteCategory = async () => {
    if (!deleteConfirm.id) return
    try {
      await deleteCategory(deleteConfirm.id).unwrap()
      refetch()
    } catch (err) {
      // Handled automatically by toast notification middleware
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-blue-600 font-mono text-[11px] uppercase tracking-widest font-bold">
          <FolderTree className="h-3.5 w-3.5" />
          <span>Taxonomy Management</span>
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight font-display mt-1">
          Product Categories
        </h1>
        <p className="text-slate-500 text-xs mt-0.5">
          Organize formulations into structured store collections.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Add Category Form */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-4 h-fit">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 font-display">
            <Plus className="h-4 w-4 text-blue-600" /> Add New Category
          </h2>

          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">
                Category Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => {
                  const val = e.target.value
                  setName(val)
                  setSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''))
                }}
                placeholder="e.g. Keratin Smooth Hair Masks"
                className="w-full bg-slate-50 border border-slate-200 text-xs text-slate-900 rounded-xl p-3 focus:border-blue-600 focus:bg-white outline-none transition-colors font-medium"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">
                URL Slug
              </label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="e.g. keratin-smooth-hair-masks"
                className="w-full bg-slate-50 border border-slate-200 text-xs font-mono text-slate-900 rounded-xl p-3 focus:border-blue-600 focus:bg-white outline-none transition-colors"
              />
            </div>

            <div>
              <MediaUploadPicker
                label="Category Cover Photo (Optional)"
                category="category"
                mediaType="image"
                recommendedSize="600 × 600 px (1:1 Square)"
                value={image}
                onChange={setImage}
                placeholder="Upload category thumbnail/cover..."
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">
                Description (Optional)
              </label>
              <textarea
                rows="3"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief summary of products in this category..."
                className="w-full bg-slate-50 border border-slate-200 text-xs text-slate-900 rounded-xl p-3 focus:border-blue-600 focus:bg-white outline-none transition-colors font-medium"
              />
            </div>

            <button
              type="submit"
              disabled={isCreating}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              {isCreating && <Loader2 className="h-4 w-4 animate-spin" />}
              <span>Create Category</span>
            </button>
          </form>
        </div>

        {/* Categories List */}
        <div className="lg:col-span-2 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 font-display">
              <Layers className="h-4 w-4 text-blue-600" /> Active Categories
            </h2>
            <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
              {categories.length} total
            </span>
          </div>

          {isLoading ? (
            <div className="py-16 text-center text-slate-400 flex flex-col items-center gap-2">
              <Loader2 className="h-7 w-7 animate-spin text-blue-600" />
              <span className="text-xs font-semibold text-slate-600">Loading categories...</span>
            </div>
          ) : isError ? (
            <div className="text-rose-600 text-xs text-center py-8">Failed to load categories.</div>
          ) : categories.length === 0 ? (
            <div className="text-slate-500 text-xs text-center py-8">No categories created yet.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {categories.map((cat) => {
                const count = getProductCount(cat._id, cat.name)
                return (
                  <div
                    key={cat._id}
                    className="bg-slate-50 border border-slate-200/80 hover:border-blue-300 p-5 rounded-2xl flex items-start justify-between gap-3 group transition-all shadow-xs"
                  >
                    <div className="flex-1 min-w-0 pr-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-900 text-sm group-hover:text-blue-600 transition-colors">
                          {cat.name}
                        </span>
                        <span className="px-2 py-0.5 bg-blue-50 border border-blue-200 text-blue-700 text-[10px] font-mono font-bold rounded-full">
                          {count} items
                        </span>
                      </div>
                      <div className="text-[11px] font-mono text-slate-400 mt-1">
                        /{cat.slug || cat.name?.toLowerCase().replace(/\s+/g, '-')}
                      </div>
                      {cat.description && (
                        <p className="text-slate-600 text-xs mt-2 line-clamp-2 leading-relaxed">
                          {cat.description}
                        </p>
                      )}
                    </div>

                    {/* Action Buttons: Edit & Delete */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleOpenEdit(cat)}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all cursor-pointer"
                        title="Edit Category"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(cat._id, cat.name)}
                        disabled={isDeleting}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
                        title="Delete Category"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Edit Category Modal */}
      {editModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={() =>
              setEditModal({
                isOpen: false,
                id: null,
                name: '',
                slug: '',
                description: '',
                initialName: '',
                initialSlug: '',
                initialDescription: '',
              })
            }
          />

          <div className="relative z-10 w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Edit3 className="h-5 w-5 text-blue-600" />
                <h3 className="text-base font-bold text-slate-900 font-display">Edit Category</h3>
              </div>
              <button
                onClick={() =>
                  setEditModal({
                    isOpen: false,
                    id: null,
                    name: '',
                    slug: '',
                    description: '',
                    initialName: '',
                    initialSlug: '',
                    initialDescription: '',
                  })
                }
                className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  value={editModal.name}
                  onChange={(e) => {
                    const val = e.target.value
                    setEditModal((prev) => ({
                      ...prev,
                      name: val,
                      slug: val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''),
                    }))
                  }}
                  className="w-full bg-slate-50 border border-slate-200 text-xs text-slate-900 rounded-xl p-3 focus:border-blue-600 focus:bg-white outline-none transition-colors font-medium"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  URL Slug
                </label>
                <input
                  type="text"
                  value={editModal.slug}
                  onChange={(e) => setEditModal((prev) => ({ ...prev, slug: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 text-xs font-mono text-slate-900 rounded-xl p-3 focus:border-blue-600 focus:bg-white outline-none transition-colors"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Description (Optional)
                </label>
                <textarea
                  rows="3"
                  value={editModal.description}
                  onChange={(e) => setEditModal((prev) => ({ ...prev, description: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 text-xs text-slate-900 rounded-xl p-3 focus:border-blue-600 focus:bg-white outline-none transition-colors font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() =>
                    setEditModal({
                      isOpen: false,
                      id: null,
                      name: '',
                      slug: '',
                      description: '',
                      initialName: '',
                      initialSlug: '',
                      initialDescription: '',
                    })
                  }
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!hasChanges || !editModal.name.trim() || isUpdating}
                  className={`px-5 py-2.5 font-bold text-xs rounded-xl flex items-center gap-2 transition-all ${
                    !hasChanges || !editModal.name.trim() || isUpdating
                      ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed shadow-none'
                      : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/20 cursor-pointer'
                  }`}
                >
                  {isUpdating && <Loader2 className="h-4 w-4 animate-spin" />}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Category Confirm Modal */}
      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, id: null, name: '' })}
        onConfirm={confirmDeleteCategory}
        title="Delete Category"
        message={`Are you sure you want to delete category "${deleteConfirm.name}"? Products in this category may need reassignment.`}
        confirmText="Yes, Delete"
      />
    </div>
  )
}
