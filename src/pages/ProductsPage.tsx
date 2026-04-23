import { useState, useMemo } from 'react'
import { Plus, Trash2, X, Eye, Pencil } from 'lucide-react'
import { Product, Feature } from '@/types'
import { useAuthStore } from '@/store/authStore'
import { useDbStore } from '@/data/db'
import { Pagination } from '@/components/Pagination'
import { FilterBar } from '@/components/FilterBar'

const ITEMS_PER_PAGE = 10

export function ProductsPage() {
  const products = useDbStore((state) => state.products)
  const businesses = useDbStore((state) => state.businesses)
  const addProduct = useDbStore((state) => state.addProduct)
  const updateProduct = useDbStore((state) => state.updateProduct)
  const deleteProduct = useDbStore((state) => state.deleteProduct)
  const user = useAuthStore((state) => state.user)

  const [showModal, setShowModal] = useState(false)
  const [showFeaturesModal, setShowFeaturesModal] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [businessFilter, setBusinessFilter] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  const [formData, setFormData] = useState({
    name: '',
    price: '',
    businessId: user?.businessId || '1',
    features: [{ key: '', value: '' }] as Feature[],
  })

  const resetForm = () => {
    setFormData({
      name: '',
      price: '',
      businessId: user?.businessId || '1',
      features: [{ key: '', value: '' }],
    })
    setEditingProduct(null)
  }

  const handleAddFeature = () => {
    setFormData({
      ...formData,
      features: [...formData.features, { key: '', value: '' }],
    })
  }

  const handleRemoveFeature = (index: number) => {
    setFormData({
      ...formData,
      features: formData.features.filter((_, i) => i !== index),
    })
  }

  const handleOpenAdd = () => {
    resetForm()
    setShowModal(true)
  }

  const handleOpenEdit = (product: Product) => {
    setEditingProduct(product)
    setFormData({
      name: product.name,
      price: product.price.toString(),
      businessId: product.businessId,
      features: product.features.length > 0 ? [...product.features] : [{ key: '', value: '' }],
    })
    setShowModal(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name || !formData.price) {
      alert('Please fill required fields')
      return
    }

    const businessName = businesses.find((b) => b.id === formData.businessId)?.name || 'Unknown'

    if (editingProduct) {
      updateProduct(editingProduct.id, {
        name: formData.name,
        price: parseFloat(formData.price),
        businessId: formData.businessId,
        businessName,
        features: formData.features.filter((f) => f.key && f.value),
      })
    } else {
      const newProduct: Product = {
        id: Date.now().toString(),
        name: formData.name,
        price: parseFloat(formData.price),
        businessId: formData.businessId,
        businessName,
        features: formData.features.filter((f) => f.key && f.value),
        createdAt: new Date().toISOString().split('T')[0],
      }
      addProduct(newProduct)
    }

    setShowModal(false)
    resetForm()
  }

  const handleDeleteProduct = (id: string) => {
    if (confirm('Are you sure you want to delete this product?')) {
      deleteProduct(id)
    }
  }

  const handleViewFeatures = (product: Product) => {
    setSelectedProduct(product)
    setShowFeaturesModal(true)
  }

  // Filtering logic
  const filteredProducts = useMemo(() => {
    let result = user?.role === 'admin'
      ? products.filter((p) => p.businessId === user.businessId)
      : products

    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter((p) => p.name.toLowerCase().includes(q))
    }

    if (businessFilter) {
      result = result.filter((p) => p.businessId === businessFilter)
    }

    return result
  }, [products, user, searchQuery, businessFilter])

  // Pagination logic
  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE)
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  // Reset to page 1 when filters change
  const handleSearchChange = (val: string) => {
    setSearchQuery(val)
    setCurrentPage(1)
  }
  const handleBusinessFilterChange = (val: string) => {
    setBusinessFilter(val)
    setCurrentPage(1)
  }

  const businessFilterOptions = businesses.map((b) => ({ value: b.id, label: b.name }))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Products</h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">Manage your product catalog</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 bg-indigo-600 dark:bg-indigo-500 text-white px-4 py-2.5 rounded-lg hover:opacity-90 transition-opacity font-medium text-sm"
        >
          <Plus size={18} />
          Add Product
        </button>
      </div>

      {/* Filters */}
      <FilterBar
        searchValue={searchQuery}
        onSearchChange={handleSearchChange}
        searchPlaceholder="Search by product name..."
        filters={
          user?.role === 'super-admin'
            ? [
                {
                  label: 'All Businesses',
                  value: businessFilter,
                  onChange: handleBusinessFilterChange,
                  options: businessFilterOptions,
                },
              ]
            : []
        }
      />

      {/* Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-sky-200/50 dark:border-sky-500/20 overflow-hidden sky-glow">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-slate-900/60 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                  Product Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                  Business
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                  Features
                </th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {paginatedProducts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    No products found
                  </td>
                </tr>
              ) : (
                paginatedProducts.map((product) => (
                  <tr
                    key={product.id}
                    className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"
                  >
                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                      {product.name}
                    </td>
                    <td className="px-6 py-4 text-gray-700 dark:text-gray-300">
                      {product.businessName || businesses.find(b => b.id === product.businessId)?.name || '—'}
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                        ${product.price.toFixed(2)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => handleViewFeatures(product)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors"
                      >
                        <Eye size={14} />
                        View Features
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleOpenEdit(product)}
                          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-600 transition-colors"
                          title="Edit product"
                        >
                          <Pencil size={16} className="text-gray-600 dark:text-gray-400" />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(product.id)}
                          className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                          title="Delete product"
                        >
                          <Trash2 size={16} className="text-red-500 dark:text-red-400" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="border-t border-gray-200 dark:border-gray-700 px-4">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={filteredProducts.length}
            itemsPerPage={ITEMS_PER_PAGE}
          />
        </div>
      </div>

      {/* View Features Modal */}
      {showFeaturesModal && selectedProduct && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl max-w-md w-full shadow-2xl">
            <div className="p-5 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Features — {selectedProduct.name}
              </h2>
              <button
                onClick={() => setShowFeaturesModal(false)}
                aria-label="Close features modal"
                className="p-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-5">
              {selectedProduct.features.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-sm">No features listed.</p>
              ) : (
                <div className="space-y-2">
                  {selectedProduct.features.map((feature, idx) => (
                    <div
                      key={idx}
                      className="flex justify-between items-center py-2 px-3 rounded-lg bg-gray-50 dark:bg-slate-900/50"
                    >
                      <span className="text-sm text-gray-600 dark:text-gray-400">{feature.key}</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {feature.value}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="p-5 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setShowFeaturesModal(false)}
                className="w-full bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white py-2 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors text-sm font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Product Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between sticky top-0 bg-white dark:bg-slate-800 z-10">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {editingProduct ? 'Edit Product' : 'Add Product'}
              </h2>
              <button
                onClick={() => { setShowModal(false); resetForm() }}
                aria-label="Close product modal"
                className="p-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Product Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-slate-700 rounded-lg dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Price *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-slate-700 rounded-lg dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  />
                </div>

                {user?.role === 'super-admin' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Business *
                    </label>
                    <select
                      value={formData.businessId}
                      onChange={(e) => setFormData({ ...formData, businessId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-slate-700 rounded-lg dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                    >
                      {businesses.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Features */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Features
                  </label>
                  <button
                    type="button"
                    onClick={handleAddFeature}
                    className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
                  >
                    + Add Feature
                  </button>
                </div>

                <div className="space-y-2">
                  {formData.features.map((feature, idx) => (
                    <div key={idx} className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Feature name"
                        value={feature.key}
                        onChange={(e) => {
                          const newFeatures = [...formData.features]
                          newFeatures[idx].key = e.target.value
                          setFormData({ ...formData, features: newFeatures })
                        }}
                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-slate-700 rounded-lg dark:text-white text-sm"
                      />
                      <input
                        type="text"
                        placeholder="Value"
                        value={feature.value}
                        onChange={(e) => {
                          const newFeatures = [...formData.features]
                          newFeatures[idx].value = e.target.value
                          setFormData({ ...formData, features: newFeatures })
                        }}
                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-slate-700 rounded-lg dark:text-white text-sm"
                      />
                      {formData.features.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveFeature(idx)}
                          aria-label="Remove feature"
                          className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                        >
                          <X size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="submit"
                  className="flex-1 bg-indigo-600 dark:bg-indigo-500 text-white py-2.5 rounded-lg hover:opacity-90 transition-opacity font-medium text-sm"
                >
                  {editingProduct ? 'Save Changes' : 'Add Product'}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowModal(false); resetForm() }}
                  className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white py-2.5 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium text-sm"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
