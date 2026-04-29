import { useMemo, useState } from 'react'
import {
  Eye,
  ImagePlus,
  Loader2,
  Pencil,
  Plus,
  ToggleLeft,
  ToggleRight,
  Trash2,
  X,
} from 'lucide-react'

import { Pagination } from '@/components/Pagination'
import { FilterBar } from '@/components/FilterBar'
import { useDbStore } from '@/data/db'
import { useAuthStore } from '@/store/authStore'
import { Feature, Product } from '@/types'

const ITEMS_PER_PAGE = 10
const MAX_IMAGE_SIZE_BYTES = 2 * 1024 * 1024

type ProductFormState = {
  name: string
  price: string
  businessId: string
  features: Feature[]
  stockQuantity: string
  inStock: boolean
  imageUrl: string
  uploadedImageDataUrl: string
  uploadedImageName: string
  imageAltText: string
}

function createEmptyFeature(): Feature {
  return { key: '', value: '' }
}

function isProductInStock(product: Product) {
  const status = product.status ?? 'available'
  const stockQuantity = product.stockQuantity ?? 0
  return (status === 'available' || status === 'active') && stockQuantity > 0
}

function formatCreatedDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return 'Unknown date'
  }

  return date.toLocaleDateString()
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result ?? ''))
    reader.onerror = () => reject(new Error('Unable to read image file'))
    reader.readAsDataURL(file)
  })
}

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
  const [isSaving, setIsSaving] = useState(false)
  const [stockUpdatingId, setStockUpdatingId] = useState<string | null>(null)

  const getInitialFormData = (): ProductFormState => ({
    name: '',
    price: '',
    businessId: user?.businessId || businesses[0]?.id || '',
    features: [createEmptyFeature()],
    stockQuantity: '1',
    inStock: true,
    imageUrl: '',
    uploadedImageDataUrl: '',
    uploadedImageName: '',
    imageAltText: '',
  })

  const [formData, setFormData] = useState<ProductFormState>(getInitialFormData)

  const resetForm = () => {
    setFormData(getInitialFormData())
    setEditingProduct(null)
  }

  const handleAddFeature = () => {
    setFormData((current) => ({
      ...current,
      features: [...current.features, createEmptyFeature()],
    }))
  }

  const handleRemoveFeature = (index: number) => {
    setFormData((current) => ({
      ...current,
      features: current.features.filter((_, itemIndex) => itemIndex !== index),
    }))
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
      features: product.features.length > 0 ? [...product.features] : [createEmptyFeature()],
      stockQuantity: String(product.stockQuantity ?? 0),
      inStock: isProductInStock(product),
      imageUrl: '',
      uploadedImageDataUrl: '',
      uploadedImageName: '',
      imageAltText: product.name,
    })
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    resetForm()
  }

  const handleFeatureChange = (index: number, field: keyof Feature, value: string) => {
    setFormData((current) => {
      const nextFeatures = [...current.features]
      nextFeatures[index] = {
        ...nextFeatures[index],
        [field]: value,
      }

      return {
        ...current,
        features: nextFeatures,
      }
    })
  }

  const handleImageUrlChange = (value: string) => {
    setFormData((current) => ({
      ...current,
      imageUrl: value,
      uploadedImageDataUrl: '',
      uploadedImageName: '',
    }))
  }

  const handleClearImageSelection = () => {
    setFormData((current) => ({
      ...current,
      imageUrl: '',
      uploadedImageDataUrl: '',
      uploadedImageName: '',
    }))
  }

  const handleImageFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      alert('Please upload an image smaller than 2 MB.')
      event.target.value = ''
      return
    }

    try {
      const uploadedImageDataUrl = await readFileAsDataUrl(file)
      setFormData((current) => ({
        ...current,
        imageUrl: '',
        uploadedImageDataUrl,
        uploadedImageName: file.name,
        imageAltText: current.imageAltText || current.name,
      }))
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Unable to read image file')
    } finally {
      event.target.value = ''
    }
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    const name = formData.name.trim()
    const businessId = formData.businessId.trim()
    const price = Number(formData.price)
    const stockQuantity = Number(formData.stockQuantity)
    const imageUrl = formData.uploadedImageDataUrl || formData.imageUrl.trim() || undefined
    const features = formData.features.filter((feature) => feature.key.trim() && feature.value.trim())

    if (!name || Number.isNaN(price) || price <= 0 || !businessId) {
      alert('Please complete the required product fields.')
      return
    }

    if (formData.inStock && (!Number.isInteger(stockQuantity) || stockQuantity < 1)) {
      alert('Please enter a stock quantity of at least 1 for in-stock products.')
      return
    }

    setIsSaving(true)

    try {
      const payload = {
        name,
        price,
        businessId,
        features,
        status: formData.inStock ? 'available' : 'inactive' as const,
        stockQuantity: formData.inStock ? stockQuantity : 0,
        imageUrl,
        imageAltText: formData.imageAltText.trim() || name,
      }

      if (editingProduct) {
        await updateProduct(editingProduct.id, payload)
      } else {
        await addProduct(payload)
      }

      handleCloseModal()
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Unable to save product')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) {
      return
    }

    try {
      await deleteProduct(id)
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Unable to delete product')
    }
  }

  const handleViewFeatures = (product: Product) => {
    setSelectedProduct(product)
    setShowFeaturesModal(true)
  }

  const handleToggleStock = async (product: Product) => {
    const nextInStock = !isProductInStock(product)
    setStockUpdatingId(product.id)

    try {
      await updateProduct(product.id, {
        status: nextInStock ? 'available' : 'inactive',
        stockQuantity: nextInStock ? Math.max(product.stockQuantity ?? 0, 1) : 0,
      })
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Unable to update product stock')
    } finally {
      setStockUpdatingId(null)
    }
  }

  const filteredProducts = useMemo(() => {
    let result = user?.role === 'admin'
      ? products.filter((product) => product.businessId === user.businessId)
      : products

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter((product) => product.name.toLowerCase().includes(query))
    }

    if (businessFilter) {
      result = result.filter((product) => product.businessId === businessFilter)
    }

    return result
  }, [products, user, searchQuery, businessFilter])

  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE)
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  )

  const previewImageUrl =
    formData.uploadedImageDataUrl ||
    formData.imageUrl.trim() ||
    editingProduct?.primaryImageUrl ||
    editingProduct?.images?.[0]?.imageUrl ||
    ''

  const businessFilterOptions = businesses.map((business) => ({
    value: business.id,
    label: business.name,
  }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Products</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Manage your product catalog</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 dark:bg-indigo-500"
        >
          <Plus size={18} />
          Add Product
        </button>
      </div>

      <FilterBar
        searchValue={searchQuery}
        onSearchChange={(value) => {
          setSearchQuery(value)
          setCurrentPage(1)
        }}
        searchPlaceholder="Search by product name..."
        filters={
          user?.role === 'super-admin'
            ? [
                {
                  label: 'All Businesses',
                  value: businessFilter,
                  onChange: (value: string) => {
                    setBusinessFilter(value)
                    setCurrentPage(1)
                  },
                  options: businessFilterOptions,
                },
              ]
            : []
        }
      />

      <div className="overflow-hidden rounded-xl border border-sky-200/50 bg-white dark:border-sky-500/20 dark:bg-slate-800 sky-glow">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-slate-900/60">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400">
                  Business
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400">
                  Price
                </th>
                <th className="px-6 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400">
                  Stock
                </th>
                <th className="px-6 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400">
                  Features
                </th>
                <th className="px-6 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {paginatedProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    No products found
                  </td>
                </tr>
              ) : (
                paginatedProducts.map((product) => {
                  const inStock = isProductInStock(product)
                  const isUpdatingStock = stockUpdatingId === product.id

                  return (
                    <tr
                      key={product.id}
                      className="transition-colors hover:bg-gray-50 dark:hover:bg-slate-700/50"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl bg-gray-100 dark:bg-slate-700">
                            {product.primaryImageUrl ? (
                              <img
                                src={product.primaryImageUrl}
                                alt={product.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <ImagePlus size={18} className="text-gray-400 dark:text-gray-500" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">{product.name}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Added {formatCreatedDate(product.createdAt)}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-700 dark:text-gray-300">
                        {product.businessName || businesses.find((business) => business.id === product.businessId)?.name || '-'}
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                          ${product.price.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          type="button"
                          onClick={() => void handleToggleStock(product)}
                          disabled={isUpdatingStock}
                          className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                            inStock
                              ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-500/15 dark:text-emerald-300'
                              : 'bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-500/15 dark:text-rose-300'
                          } ${isUpdatingStock ? 'cursor-not-allowed opacity-70' : ''}`}
                        >
                          {isUpdatingStock ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : inStock ? (
                            <ToggleRight size={16} />
                          ) : (
                            <ToggleLeft size={16} />
                          )}
                          {inStock ? 'In stock' : 'Out of stock'}
                        </button>
                        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                          Qty: {product.stockQuantity ?? 0}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => handleViewFeatures(product)}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-600 transition-colors hover:bg-indigo-100 dark:bg-indigo-900/20 dark:text-indigo-400 dark:hover:bg-indigo-900/40"
                        >
                          <Eye size={14} />
                          {product.features.length} feature{product.features.length === 1 ? '' : 's'}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleOpenEdit(product)}
                            className="rounded-lg p-2 transition-colors hover:bg-gray-100 dark:hover:bg-slate-600"
                            title="Edit product"
                          >
                            <Pencil size={16} className="text-gray-600 dark:text-gray-400" />
                          </button>
                          <button
                            onClick={() => void handleDeleteProduct(product.id)}
                            className="rounded-lg p-2 transition-colors hover:bg-red-50 dark:hover:bg-red-900/20"
                            title="Delete product"
                          >
                            <Trash2 size={16} className="text-red-500 dark:text-red-400" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="border-t border-gray-200 px-4 dark:border-gray-700">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={filteredProducts.length}
            itemsPerPage={ITEMS_PER_PAGE}
          />
        </div>
      </div>

      {showFeaturesModal && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white shadow-2xl dark:bg-slate-800">
            <div className="flex items-center justify-between border-b border-gray-200 p-5 dark:border-gray-700">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Features - {selectedProduct.name}
              </h2>
              <button
                onClick={() => setShowFeaturesModal(false)}
                aria-label="Close features modal"
                className="p-1 text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-5">
              {selectedProduct.features.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">No features listed.</p>
              ) : (
                <div className="space-y-2">
                  {selectedProduct.features.map((feature, index) => (
                    <div
                      key={`${feature.key}-${index}`}
                      className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 dark:bg-slate-900/50"
                    >
                      <span className="text-sm text-gray-600 dark:text-gray-400">{feature.key}</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{feature.value}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="border-t border-gray-200 p-5 dark:border-gray-700">
              <button
                onClick={() => setShowFeaturesModal(false)}
                className="w-full rounded-lg bg-gray-200 py-2 text-sm font-medium text-gray-900 transition-colors hover:bg-gray-300 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white shadow-2xl dark:bg-slate-800">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-slate-800">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {editingProduct ? 'Edit Product' : 'Add Product'}
              </h2>
              <button
                onClick={handleCloseModal}
                aria-label="Close product modal"
                className="p-1 text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={(event) => void handleSubmit(event)} className="space-y-5 p-6">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Product Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(event) => setFormData((current) => ({ ...current, name: event.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-600 dark:bg-slate-700 dark:text-white"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Price *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(event) => setFormData((current) => ({ ...current, price: event.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-600 dark:bg-slate-700 dark:text-white"
                  />
                </div>

                {user?.role === 'super-admin' ? (
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Business *
                    </label>
                    <select
                      value={formData.businessId}
                      onChange={(event) => setFormData((current) => ({ ...current, businessId: event.target.value }))}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-600 dark:bg-slate-700 dark:text-white"
                    >
                      {businesses.map((business) => (
                        <option key={business.id} value={business.id}>
                          {business.name}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : null}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Stock Quantity
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={formData.stockQuantity}
                    disabled={!formData.inStock}
                    onChange={(event) => setFormData((current) => ({ ...current, stockQuantity: event.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-600 dark:bg-slate-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Availability
                  </label>
                  <button
                    type="button"
                    onClick={() => setFormData((current) => ({ ...current, inStock: !current.inStock }))}
                    className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                      formData.inStock
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-300'
                        : 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/15 dark:text-rose-300'
                    }`}
                  >
                    <span>{formData.inStock ? 'In stock' : 'Out of stock'}</span>
                    {formData.inStock ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                  </button>
                </div>
              </div>

              <div className="space-y-4 rounded-xl border border-dashed border-gray-300 p-4 dark:border-gray-600">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Product image</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Upload an image or paste a direct URL. Max file size: 2 MB.
                    </p>
                  </div>
                  {(formData.uploadedImageDataUrl || formData.imageUrl) && (
                    <button
                      type="button"
                      onClick={handleClearImageSelection}
                      className="text-xs font-medium text-red-500 transition-colors hover:text-red-600"
                    >
                      Clear image
                    </button>
                  )}
                </div>

                <div className="grid gap-4 md:grid-cols-[140px_1fr]">
                  <div className="flex h-36 items-center justify-center overflow-hidden rounded-xl bg-gray-100 dark:bg-slate-700">
                    {previewImageUrl ? (
                      <img src={previewImageUrl} alt={formData.name || 'Product preview'} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-gray-400 dark:text-gray-500">
                        <ImagePlus size={24} />
                        <span className="text-xs">No image</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-700 transition-colors hover:bg-indigo-100 dark:border-indigo-500/30 dark:bg-indigo-500/15 dark:text-indigo-300">
                      <ImagePlus size={16} />
                      Upload from device
                      <input type="file" accept="image/*" className="hidden" onChange={(event) => void handleImageFileChange(event)} />
                    </label>

                    {formData.uploadedImageName ? (
                      <p className="text-xs text-gray-500 dark:text-gray-400">Selected file: {formData.uploadedImageName}</p>
                    ) : null}

                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Or paste image URL
                      </label>
                      <input
                        type="url"
                        value={formData.imageUrl}
                        onChange={(event) => handleImageUrlChange(event.target.value)}
                        placeholder="https://example.com/product.jpg"
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-600 dark:bg-slate-700 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Image alt text
                      </label>
                      <input
                        type="text"
                        value={formData.imageAltText}
                        onChange={(event) => setFormData((current) => ({ ...current, imageAltText: event.target.value }))}
                        placeholder="Front view of the product"
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-600 dark:bg-slate-700 dark:text-white"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <div className="mb-3 flex items-center justify-between">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Features</label>
                  <button
                    type="button"
                    onClick={handleAddFeature}
                    className="text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400"
                  >
                    + Add Feature
                  </button>
                </div>

                <div className="space-y-2">
                  {formData.features.map((feature, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Feature name"
                        value={feature.key}
                        onChange={(event) => handleFeatureChange(index, 'key', event.target.value)}
                        className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-slate-700 dark:text-white"
                      />
                      <input
                        type="text"
                        placeholder="Value"
                        value={feature.value}
                        onChange={(event) => handleFeatureChange(index, 'value', event.target.value)}
                        className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-slate-700 dark:text-white"
                      />
                      {formData.features.length > 1 ? (
                        <button
                          type="button"
                          onClick={() => handleRemoveFeature(index)}
                          aria-label="Remove feature"
                          className="rounded-lg p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          <X size={16} />
                        </button>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 border-t border-gray-200 pt-4 dark:border-gray-700">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-indigo-600 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-indigo-500"
                >
                  {isSaving ? <Loader2 size={16} className="animate-spin" /> : null}
                  {editingProduct ? 'Save Changes' : 'Add Product'}
                </button>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={isSaving}
                  className="flex-1 rounded-lg bg-gray-200 py-2.5 text-sm font-medium text-gray-900 transition-colors hover:bg-gray-300 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
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
