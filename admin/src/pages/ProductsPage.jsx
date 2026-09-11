import { useState, useEffect } from 'react'
import {
  useGetProductsQuery,
  useGetCategoriesQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
} from '@/features/adminApi'
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Loader2,
  X,
  Sparkles,
  CheckCircle2,
  Package,
  Star,
  Image as ImageIcon,
  Tag,
  Layers,
  ArrowUpDown,
} from 'lucide-react'
import MediaUploadPicker from '@/components/MediaUploadPicker'
import ConfirmModal from '@/components/ConfirmModal'

export default function ProductsPage() {
  const { data: productsData, isLoading, isError, refetch } = useGetProductsQuery()
  const { data: categoriesData } = useGetCategoriesQuery()

  const [createProduct, { isLoading: isCreating }] = useCreateProductMutation()
  const [updateProduct, { isLoading: isUpdating }] = useUpdateProductMutation()
  const [deleteProduct, { isLoading: isDeleting }] = useDeleteProductMutation()

  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('ALL')
  const [stockFilter, setStockFilter] = useState('ALL') // ALL, IN_STOCK, LOW_STOCK
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [feedbackMsg, setFeedbackMsg] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, id: null, name: '' })

  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isModalOpen])

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

  const products = rawProducts.filter((p) => {
    const matchesSearch =
      p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesCategory =
      categoryFilter === 'ALL' ||
      (p.category?._id || p.category) === categoryFilter ||
      p.category?.name?.toLowerCase() === categoryFilter.toLowerCase()

    const stock = p.stock ?? 10
    const matchesStock =
      stockFilter === 'ALL' ||
      (stockFilter === 'IN_STOCK' && stock > 5) ||
      (stockFilter === 'LOW_STOCK' && stock <= 5) ||
      (stockFilter === 'FEATURED' && p.isFeatured)

    return matchesSearch && matchesCategory && matchesStock
  })

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    category: '',
    price: '',
    compareAtPrice: '',
    description: '',
    mainImage: '',
    gallery: [],
    stock: 15,
    isFeatured: false,
    size: '250ml',
    sizes: ['250ml'],
    weight: 250,
    length: 15,
    breadth: 10,
    height: 8,
    sku: '',
    hsnCode: '3305',
  })

  const openAddModal = () => {
    setEditingProduct(null)
    setFormData({
      name: '',
      slug: '',
      category: categories[0]?._id || '',
      price: '',
      compareAtPrice: '',
      description: '',
      mainImage: '',
      gallery: [],
      stock: 15,
      isFeatured: false,
      size: '250ml',
      sizes: ['250ml'],
      weight: 250,
      length: 15,
      breadth: 10,
      height: 8,
      sku: '',
      hsnCode: '3305',
    })
    setIsModalOpen(true)
  }

  const openEditModal = (product) => {
    setEditingProduct(product)
    setFormData({
      name: product.name || '',
      slug: product.slug || '',
      category: product.category?._id || product.category || categories[0]?._id || '',
      price: product.price || '',
      compareAtPrice: product.compareAtPrice || '',
      description: product.description || '',
      mainImage: product.mainImage || '',
      gallery: Array.isArray(product.gallery) ? [...product.gallery] : [],
      stock: product.stock ?? 10,
      isFeatured: !!product.isFeatured,
      size: product.size || '250ml',
      sizes: Array.isArray(product.sizes) && product.sizes.length > 0 ? [...product.sizes] : [product.size || '250ml'],
      weight: product.weight || 250,
      length: product.dimensions?.length || 15,
      breadth: product.dimensions?.breadth || 10,
      height: product.dimensions?.height || 8,
      sku: product.sku || '',
      hsnCode: product.hsnCode || '3305',
    })
    setIsModalOpen(true)
  }

  const handleNameChange = (nameVal) => {
    setFormData((prev) => ({
      ...prev,
      name: nameVal,
      slug: !editingProduct
        ? nameVal
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)+/g, '')
        : prev.slug,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.name || !formData.price) {
      alert('Please fill product name and price.')
      return
    }

    try {
      const payload = {
        name: formData.name.trim(),
        slug: formData.slug.trim() || formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        category: formData.category || categories[0]?._id,
        price: Number(formData.price),
        compareAtPrice: formData.compareAtPrice ? Number(formData.compareAtPrice) : undefined,
        description: formData.description.trim(),
        mainImage: formData.mainImage.trim() || 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&auto=format&fit=crop&q=80',
        gallery: Array.isArray(formData.gallery) ? formData.gallery.filter((url) => typeof url === 'string' && url.trim().length > 0) : [],
        stock: Number(formData.stock),
        isFeatured: Boolean(formData.isFeatured),
        weight: Number(formData.weight) || 250,
        dimensions: {
          length: Number(formData.length) || 15,
          breadth: Number(formData.breadth) || 10,
          height: Number(formData.height) || 8,
        },
        sku: formData.sku?.trim() || '',
        hsnCode: formData.hsnCode?.trim() || '3305',
        size: formData.size?.trim() || '250ml',
        sizes: Array.isArray(formData.sizes) && formData.sizes.length > 0 ? formData.sizes : [formData.size?.trim() || '250ml'],
      }

      if (editingProduct) {
        await updateProduct({ id: editingProduct._id, ...payload }).unwrap()
      } else {
        await createProduct(payload).unwrap()
      }

      setIsModalOpen(false)
      refetch()
    } catch (err) {
      // Handled automatically by toast notification middleware
    }
  }

  const handleDelete = (id, prodName) => {
    setDeleteConfirm({ isOpen: true, id, name: prodName })
  }

  const confirmDeleteProduct = async () => {
    if (!deleteConfirm.id) return
    try {
      await deleteProduct(deleteConfirm.id).unwrap()
      refetch()
    } catch (err) {
      // Handled automatically by toast notification middleware
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-blue-600 font-mono text-[11px] uppercase tracking-widest font-bold">
            <Package className="h-3.5 w-3.5" />
            <span>Catalog Management</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight font-display mt-1">
            Store Products & Inventory
          </h1>
          <p className="text-slate-500 text-xs mt-0.5">
            Manage live pricing, formulations, stock quantities, and catalog listings.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
        >
          <Plus className="h-4 w-4" /> Add New Product
        </button>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search products by title, benefit, or keyword..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-xl pl-11 pr-4 py-2.5 focus:outline-none focus:border-blue-600 focus:bg-white transition-colors placeholder:text-slate-400 font-medium"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setStockFilter('ALL')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${stockFilter === 'ALL'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200/80'
                }`}
            >
              All Items ({rawProducts.length})
            </button>
            <button
              onClick={() => setStockFilter('FEATURED')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${stockFilter === 'FEATURED'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200/80'
                }`}
            >
              <Star className="h-3.5 w-3.5 fill-current" /> Featured
            </button>
            <button
              onClick={() => setStockFilter('LOW_STOCK')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${stockFilter === 'LOW_STOCK'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200/80'
                }`}
            >
              Low Stock (&le; 5)
            </button>
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
        {isLoading ? (
          <div className="py-20 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="text-xs font-semibold text-slate-600">Loading Sensein catalog items...</span>
          </div>
        ) : isError ? (
          <div className="py-16 text-center text-rose-600 text-xs font-semibold">
            Failed to fetch products from database.
          </div>
        ) : products.length === 0 ? (
          <div className="py-20 text-center text-slate-500 text-xs flex flex-col items-center gap-2">
            <Package className="h-10 w-10 text-slate-300" />
            <span>No products match the selected criteria.</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 uppercase text-[10px] font-bold tracking-wider text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="p-4 sm:p-5">Product Details</th>
                  <th className="p-4 sm:p-5">Category</th>
                  <th className="p-4 sm:p-5">Price (INR)</th>
                  <th className="p-4 sm:p-5">Stock Level</th>
                  <th className="p-4 sm:p-5 text-center">Featured</th>
                  <th className="p-4 sm:p-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map((p) => {
                  const stock = p.stock ?? 10
                  const hasDiscount = p.compareAtPrice && p.compareAtPrice > p.price
                  const discountPct = hasDiscount
                    ? Math.round(((p.compareAtPrice - p.price) / p.compareAtPrice) * 100)
                    : 0

                  return (
                    <tr key={p._id} className="hover:bg-slate-50/80 transition-colors group">
                      {/* Product Name & Image */}
                      <td className="p-4 sm:p-5">
                        <div className="flex items-center gap-3.5 min-w-[200px]">
                          <img
                            src={p.mainImage || '/favicon.png'}
                            alt={p.name}
                            className="w-12 h-12 rounded-xl object-cover border border-slate-200 bg-slate-50 shrink-0 shadow-xs"
                            onError={(e) => {
                              e.currentTarget.src = '/favicon.png'
                            }}
                          />
                          <div>
                            <div className="font-bold text-slate-900 text-sm group-hover:text-blue-600 transition-colors">
                              {p.name}
                            </div>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              <span className="text-[10px] font-mono text-slate-400">
                                /{p.slug || p._id.slice(-6)}
                              </span>
                              {p.size && (
                                <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200 font-mono text-[10px] font-bold">
                                  🧴 {p.size}
                                </span>
                              )}
                              <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200/80 font-mono text-[10px] font-bold">
                                📦 {p.weight || 250}g ({p.dimensions?.length || 15}×{p.dimensions?.breadth || 10}×{p.dimensions?.height || 8}cm)
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="p-4 sm:p-5">
                        <span className="px-3 py-1 bg-slate-100 border border-slate-200 text-slate-700 text-[11px] font-semibold rounded-full">
                          {p.category?.name || p.category || 'Haircare'}
                        </span>
                      </td>

                      {/* Price */}
                      <td className="p-4 sm:p-5">
                        <div className="font-mono">
                          <span className="text-slate-900 font-bold text-sm">
                            ₹{(p.price || 0).toLocaleString('en-IN')}
                          </span>
                          {hasDiscount && (
                            <div className="flex items-center gap-1.5 mt-0.5 text-[10px]">
                              <span className="line-through text-slate-400">
                                ₹{p.compareAtPrice.toLocaleString('en-IN')}
                              </span>
                              <span className="text-emerald-600 font-bold">-{discountPct}%</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Stock Level */}
                      <td className="p-4 sm:p-5">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider font-mono ${stock > 5
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : stock > 0
                                  ? 'bg-amber-50 text-amber-700 border border-amber-200 animate-pulse'
                                  : 'bg-rose-50 text-rose-700 border border-rose-200'
                              }`}
                          >
                            {stock > 0 ? `${stock} in stock` : 'Sold out'}
                          </span>
                        </div>
                      </td>

                      {/* Featured */}
                      <td className="p-4 sm:p-5 text-center">
                        {p.isFeatured ? (
                          <div className="inline-flex items-center justify-center p-1.5 bg-blue-50 text-blue-600 rounded-xl border border-blue-200">
                            <Star className="h-4 w-4 fill-blue-600" />
                          </div>
                        ) : (
                          <span className="text-slate-300 text-xs">—</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="p-4 sm:p-5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEditModal(p)}
                            className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg border border-slate-200 transition-colors cursor-pointer"
                            title="Edit Product"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(p._id, p.name)}
                            disabled={isDeleting}
                            className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg border border-slate-200 transition-colors cursor-pointer"
                            title="Delete Product"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={() => setIsModalOpen(false)}
          />

          <div className="relative z-10 w-full max-w-2xl bg-white border border-slate-200 rounded-3xl shadow-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header (Fixed) */}
            <div className="flex items-center justify-between px-6 sm:px-8 py-5 border-b border-slate-100 bg-white shrink-0">
              <div>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight font-display">
                  {editingProduct ? 'Edit Catalog Product' : 'Add New Luxury Product'}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Set pricing, inventory numbers, and product media.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-700 rounded-xl bg-slate-100 hover:bg-slate-200/80 border border-slate-200 transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="px-6 sm:px-8 py-6 overflow-y-auto space-y-4 flex-1">
              {/* Product Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Product Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sensein Keratin Smooth Silk Hair Mask"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-xl p-3 focus:outline-none focus:border-blue-600 focus:bg-white font-medium"
                />
              </div>

              {/* Slug & Category Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    URL Slug
                  </label>
                  <input
                    type="text"
                    placeholder="keratin-smooth-mask"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs font-mono rounded-xl p-3 focus:outline-none focus:border-blue-600 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-xl p-3 focus:outline-none focus:border-blue-600 focus:bg-white cursor-pointer font-medium"
                  >
                    {categories.map((cat) => (
                      <option key={cat._id} value={cat._id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Price & Compare-At Price & Stock Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Selling Price (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="1299"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs font-mono rounded-xl p-3 focus:outline-none focus:border-blue-600 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Original Price (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="1799"
                    value={formData.compareAtPrice}
                    onChange={(e) => setFormData({ ...formData, compareAtPrice: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs font-mono rounded-xl p-3 focus:outline-none focus:border-blue-600 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Available Stock *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="25"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs font-mono rounded-xl p-3 focus:outline-none focus:border-blue-600 focus:bg-white"
                  />
                </div>
              </div>

              {/* Product Size / Volume / Net Qty (કદ / સાઇઝ / વજન) */}
              <div className="p-4 bg-slate-50 border border-slate-200/90 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 uppercase tracking-wide">
                      Product Size / Volume (પ્રોડક્ટ સાઇઝ / નેટ કદ) *
                    </label>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      દા.ત. 100ml, 200ml, 250ml, 500ml અથવા 50g, 100g, 250g.
                    </p>
                  </div>
                  <span className="text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-lg font-mono">
                    {formData.size || '250ml'}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {['50ml', '100ml', '200ml', '250ml', '300ml', '500ml', '50g', '100g', '200g', '250g'].map((sz) => (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => setFormData({ ...formData, size: sz })}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        formData.size === sz
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {sz}
                    </button>
                  ))}
                </div>

                <div className="pt-1">
                  <input
                    type="text"
                    placeholder="Custom Size (e.g. 250ml or 100ml / 50g)"
                    value={formData.size || ''}
                    onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                    className="w-full bg-white border border-slate-200 text-slate-900 text-xs rounded-xl p-3 focus:outline-none focus:border-blue-600 font-bold"
                  />
                </div>
              </div>

              {/* Main Image URL with Upload Picker & Size Guide */}
              <MediaUploadPicker
                label="Product Main Photo *"
                category="product"
                mediaType="image"
                value={formData.mainImage}
                onChange={(url) => setFormData({ ...formData, mainImage: url })}
                placeholder="Select or upload primary product image..."
              />

              {/* Additional Gallery Photos Section */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-xs font-bold text-slate-700">
                      Additional Gallery Photos ({formData.gallery?.length || 0})
                    </label>
                    <p className="text-[11px] text-slate-400">
                      Add multiple side views, texture shots, and customer showcase images.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        gallery: [...(prev.gallery || []), ''],
                      }))
                    }
                    className="px-3.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-xl border border-blue-200 shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add Photo</span>
                  </button>
                </div>

                {formData.gallery && formData.gallery.length > 0 && (
                  <div className="space-y-3 p-3.5 bg-slate-50/80 border border-slate-200 rounded-2xl">
                    {formData.gallery.map((imgUrl, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 p-2 bg-white rounded-xl border border-slate-200/80 shadow-2xs"
                      >
                        <div className="flex-1">
                          <MediaUploadPicker
                            label={`Gallery Image #${idx + 1}`}
                            category="product"
                            mediaType="image"
                            value={imgUrl}
                            onChange={(url) => {
                              const newGallery = [...formData.gallery]
                              newGallery[idx] = url
                              setFormData((prev) => ({ ...prev, gallery: newGallery }))
                            }}
                            placeholder="Select or upload additional photo..."
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const newGallery = formData.gallery.filter((_, i) => i !== idx)
                            setFormData((prev) => ({ ...prev, gallery: newGallery }))
                          }}
                          className="p-2.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl border border-rose-200 transition-colors cursor-pointer self-end mb-0.5"
                          title="Remove this photo"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Description &amp; Key Botanical Ingredients
                </label>
                <textarea
                  rows="3"
                  placeholder="Infused with Moroccan Argan Oil, hydrolyzed keratin, and botanical vitamins for luminous shine..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-xl p-3 focus:outline-none focus:border-blue-600 focus:bg-white font-medium"
                />
              </div>

              {/* Shipping Package Specifications (Weight & Dimensions) */}
              <div className="p-4 bg-blue-50/60 border border-blue-200/80 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-900 flex items-center gap-1.5 font-display">
                    📦 Shipping Package Specs (Delhivery Logistics Parameters)
                  </span>
                  <span className="text-[11px] font-mono font-bold text-blue-600 bg-blue-100 px-2 py-0.5 rounded-md">
                    Courier Slabs
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Weight (Grams) *
                    </label>
                    <input
                      type="number"
                      min="10"
                      placeholder="250"
                      value={formData.weight}
                      onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                      className="w-full bg-white border border-slate-200 text-slate-900 text-xs font-mono font-bold rounded-xl p-2.5 focus:outline-none focus:border-blue-600"
                    />
                    <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">e.g. 250g / 350g</span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Length (cm)
                    </label>
                    <input
                      type="number"
                      min="1"
                      placeholder="15"
                      value={formData.length}
                      onChange={(e) => setFormData({ ...formData, length: e.target.value })}
                      className="w-full bg-white border border-slate-200 text-slate-900 text-xs font-mono rounded-xl p-2.5 focus:outline-none focus:border-blue-600"
                    />
                    <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">Box Length</span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Breadth (cm)
                    </label>
                    <input
                      type="number"
                      min="1"
                      placeholder="10"
                      value={formData.breadth}
                      onChange={(e) => setFormData({ ...formData, breadth: e.target.value })}
                      className="w-full bg-white border border-slate-200 text-slate-900 text-xs font-mono rounded-xl p-2.5 focus:outline-none focus:border-blue-600"
                    />
                    <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">Box Width</span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Height (cm)
                    </label>
                    <input
                      type="number"
                      min="1"
                      placeholder="8"
                      value={formData.height}
                      onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                      className="w-full bg-white border border-slate-200 text-slate-900 text-xs font-mono rounded-xl p-2.5 focus:outline-none focus:border-blue-600"
                    />
                    <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">Box Height</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      SKU Code (Inventory ID)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. SEN-SHP-250ML"
                      value={formData.sku}
                      onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                      className="w-full bg-white border border-slate-200 text-slate-900 text-xs font-mono rounded-xl p-2.5 focus:outline-none focus:border-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      GST HSN Code
                    </label>
                    <input
                      type="text"
                      placeholder="3305 (Hair Preparations)"
                      value={formData.hsnCode}
                      onChange={(e) => setFormData({ ...formData, hsnCode: e.target.value })}
                      className="w-full bg-white border border-slate-200 text-slate-900 text-xs font-mono rounded-xl p-2.5 focus:outline-none focus:border-blue-600"
                    />
                  </div>
                </div>
              </div>

              {/* Featured Switch */}
              <div className="pt-2">
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={formData.isFeatured}
                    onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 bg-slate-50 border-slate-300"
                  />
                  <span className="text-xs font-bold text-slate-800">
                    Feature this product on Homepage Hero Showcase
                  </span>
                </label>
              </div>

              </div>

              {/* Modal Actions (Fixed Sticky Footer) */}
              <div className="flex items-center justify-end gap-3 px-6 sm:px-8 py-4 border-t border-slate-100 bg-slate-50/90 shrink-0 rounded-b-3xl">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 text-xs font-bold transition-all cursor-pointer bg-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating || isUpdating}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-600/20 transition-all flex items-center gap-2 cursor-pointer"
                >
                  {isCreating || isUpdating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                  <span>{editingProduct ? 'Save Product Changes' : 'Create Product'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, id: null, name: '' })}
        onConfirm={confirmDeleteProduct}
        title="Delete Catalog Product"
        message={`Are you sure you want to permanently delete "${deleteConfirm.name}"? This action cannot be undone.`}
        confirmText="Yes, Delete Product"
      />
    </div>
  )
}
