import { useState, useEffect } from 'react';
import { ArrowLeft, Upload, Link as LinkIcon, Plus, X, Star } from 'lucide-react';
import api from '../../services/api';
import { getSuggestedSizes, isFootwearCategory, sortSizes } from '../../utils/sizes';
import { parseImageList } from '../../utils/images';

interface AdminProductFormProps {
  productId: string | null;
  onBack: () => void;
}

export default function AdminProductForm({ productId, onBack }: AdminProductFormProps) {
  const [loading, setLoading] = useState(false);
  const [loadingProduct, setLoadingProduct] = useState(!!productId);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [imageInputType, setImageInputType] = useState<'url' | 'upload'>('url');
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
  const [categories, setCategories] = useState<string[]>([
    'T-Shirts',
    'Shirts',
    'Hoodies',
    'Pants',
    'Accessories',
  ]);

  const [formData, setFormData] = useState({
    name: '',
    category: '',
    newCategory: '',
    price: '',
    oldPrice: '',
    sku: '',
    description: '',
    stock: '',
    inStock: true,
    isSale: false,
  });

  // Product images: first entry is the main image, the rest form the gallery.
  const [images, setImages] = useState<string[]>([]);
  const [imageUrlInput, setImageUrlInput] = useState('');

  const [sizes, setSizes] = useState<string[]>([]);
  const [customSize, setCustomSize] = useState('');

  // Add one or more pasted URLs (comma / newline separated) to the image list.
  const addImageUrls = () => {
    const parsed = parseImageList(imageUrlInput);
    if (!parsed.length) return;
    setImages((prev) => parseImageList([...prev, ...parsed]));
    setImageUrlInput('');
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const makeMainImage = (index: number) => {
    setImages((prev) => [prev[index], ...prev.filter((_, i) => i !== index)]);
  };

  // Category currently in effect (existing selection or the new-category text).
  const activeCategory = showNewCategoryInput ? formData.newCategory : formData.category;
  const suggestedSizes = getSuggestedSizes(activeCategory);

  const toggleSize = (size: string) => {
    setSizes((prev) =>
      prev.some((s) => s.toUpperCase() === size.toUpperCase())
        ? prev.filter((s) => s.toUpperCase() !== size.toUpperCase())
        : sortSizes([...prev, size])
    );
  };

  const addCustomSize = () => {
    const value = customSize.trim();
    if (!value) return;
    if (!sizes.some((s) => s.toUpperCase() === value.toUpperCase())) {
      setSizes((prev) => sortSizes([...prev, value]));
    }
    setCustomSize('');
  };

  useEffect(() => {
    if (productId) {
      fetchProduct();
    }
  }, [productId]);

  const fetchProduct = async () => {
    try {
      const product = await api.getProduct(productId!);
      setFormData({
        name: product.name || '',
        category: product.category || '',
        newCategory: '',
        price: product.price?.toString() || '',
        oldPrice: (product.oldPrice ?? product.originalPrice)?.toString() || '',
        sku: product.sku || '',
        description: product.description || '',
        stock: product.stock?.toString() || '',
        inStock: product.inStock ?? true,
        isSale: product.isSale ?? false,
      });
      setImages(parseImageList([product.image, product.images]));
      setSizes(Array.isArray(product.sizes) ? sortSizes(product.sizes) : []);
    } catch (error) {
      console.error('Failed to fetch product:', error);
      setMessage({ type: 'error', text: 'Failed to load product' });
    } finally {
      setLoadingProduct(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    try {
      setLoading(true);
      const uploaded: string[] = [];
      for (const file of files) {
        const formData = new FormData();
        formData.append('image', file);
        const response = await api.uploadImage(formData);
        uploaded.push(response.url);
      }
      setImages((prev) => parseImageList([...prev, ...uploaded]));
      setMessage({ type: 'success', text: `${uploaded.length} image(s) uploaded successfully!` });
    } catch (error) {
      console.error('Failed to upload image:', error);
      setMessage({ type: 'error', text: 'Failed to upload image. Please try again.' });
    } finally {
      setLoading(false);
      e.target.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (images.length === 0) {
      setMessage({ type: 'error', text: 'Please add at least one product image.' });
      return;
    }
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const category = showNewCategoryInput && formData.newCategory
        ? formData.newCategory
        : formData.category;

      const productData = {
        name: formData.name,
        category,
        price: Number(formData.price),
        // Compare-at / original price. Send 0 when cleared so the strike-through is removed.
        oldPrice: formData.oldPrice ? Number(formData.oldPrice) : 0,
        sku: formData.sku || undefined,
        description: formData.description,
        stock: Number(formData.stock),
        image: images[0],
        images,
        inStock: formData.inStock,
        isSale: formData.isSale,
        sizes,
      };

      if (productId) {
        await api.updateProduct(productId, productData);
        setMessage({ type: 'success', text: 'Product updated successfully!' });
      } else {
        await api.createProduct(productData);
        setMessage({ type: 'success', text: 'Product created successfully!' });
        // Reset form
        setFormData({
          name: '',
          category: '',
          newCategory: '',
          price: '',
          oldPrice: '',
          sku: '',
          description: '',
          stock: '',
          inStock: true,
          isSale: false,
        });
        setImages([]);
        setImageUrlInput('');
        setSizes([]);
        setCustomSize('');
      }

      // Add new category to list if created
      if (showNewCategoryInput && formData.newCategory && !categories.includes(formData.newCategory)) {
        setCategories([...categories, formData.newCategory]);
      }

      setTimeout(() => {
        onBack();
      }, 1500);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to save product' });
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryChange = (value: string) => {
    if (value === '__new__') {
      setShowNewCategoryInput(true);
      setFormData({ ...formData, category: '', newCategory: '' });
    } else {
      setShowNewCategoryInput(false);
      setFormData({ ...formData, category: value, newCategory: '' });
    }
  };

  if (loadingProduct) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="w-5 h-5" />
        Back to Products
      </button>

      <h1 className="text-3xl font-bold text-gray-900 mb-8">
        {productId ? 'Edit Product' : 'Add New Product'}
      </h1>

      {message.text && (
        <div className={`mb-6 p-4 rounded-md ${message.type === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
          <p className={message.type === 'success' ? 'text-green-800' : 'text-red-800'}>{message.text}</p>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Product Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Product Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900"
              required
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category <span className="text-red-500">*</span>
            </label>
            {!showNewCategoryInput ? (
              <select
                value={formData.category}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900"
                required
              >
                <option value="">Select Category</option>
                <option value="__new__">+ Create New Category</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            ) : (
              <div className="space-y-2">
                <input
                  type="text"
                  value={formData.newCategory}
                  onChange={(e) => setFormData({ ...formData, newCategory: e.target.value })}
                  placeholder="Enter new category name"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900"
                  required
                />
                <button
                  type="button"
                  onClick={() => handleCategoryChange(categories[0])}
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  Cancel - Select existing category
                </button>
              </div>
            )}
          </div>

          {/* Price + Compare-at price */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Price (₹) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900"
                min="0"
                step="0.01"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Compare-at / Old Price (₹)
              </label>
              <input
                type="number"
                value={formData.oldPrice}
                onChange={(e) => setFormData({ ...formData, oldPrice: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900"
                min="0"
                step="0.01"
                placeholder="Leave blank for no discount"
              />
              <p className="text-xs text-gray-500 mt-1">
                Shown as a strike-through original price. Leave blank to remove it.
              </p>
            </div>
          </div>

          {/* SKU */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">SKU</label>
            <input
              type="text"
              value={formData.sku}
              onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900"
              placeholder="Auto-generated if left blank"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>

          {/* Stock */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Stock Quantity <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={formData.stock}
              onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900"
              min="0"
              required
            />
          </div>

          {/* Sizes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Available Sizes
            </label>
            <p className="text-xs text-gray-500 mb-3">
              {isFootwearCategory(activeCategory)
                ? 'Footwear detected — pick the numeric sizes you stock.'
                : 'Pick the sizes you stock (S, M, L, XL, XXL, 3XL, 4XL). Leave empty if this product has no sizes.'}
            </p>

            {/* Quick-pick preset chips */}
            <div className="flex flex-wrap gap-2 mb-3">
              {suggestedSizes.map((size) => {
                const selected = sizes.some((s) => s.toUpperCase() === size.toUpperCase());
                return (
                  <button
                    key={size}
                    type="button"
                    onClick={() => toggleSize(size)}
                    className={`px-4 py-2 rounded-md border text-sm font-medium transition-colors ${
                      selected
                        ? 'bg-gray-900 text-white border-gray-900'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {size}
                  </button>
                );
              })}
            </div>

            {/* Custom size input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={customSize}
                onChange={(e) => setCustomSize(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addCustomSize();
                  }
                }}
                placeholder="Add a custom size (e.g. 5XL, Free Size, 13)"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
              <button
                type="button"
                onClick={addCustomSize}
                className="flex items-center gap-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add
              </button>
            </div>

            {/* Selected sizes summary */}
            {sizes.length > 0 && (
              <div className="mt-4">
                <p className="text-xs text-gray-500 mb-2">Selected sizes (shown to customers):</p>
                <div className="flex flex-wrap gap-2">
                  {sizes.map((size) => (
                    <span
                      key={size}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-gray-900 text-white text-sm rounded-full"
                    >
                      {size}
                      <button
                        type="button"
                        onClick={() => toggleSize(size)}
                        className="hover:text-gray-300"
                        aria-label={`Remove ${size}`}
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Images */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Product Images <span className="text-red-500">*</span>
            </label>
            <p className="text-xs text-gray-500 mb-3">
              Add one or more images. The first image is the main image shown in listings; the
              rest appear in the product gallery. You can paste several URLs at once separated by
              commas.
            </p>
            <div className="flex gap-4 mb-4">
              <button
                type="button"
                onClick={() => setImageInputType('url')}
                className={`flex items-center gap-2 px-4 py-2 rounded-md border ${
                  imageInputType === 'url'
                    ? 'bg-gray-900 text-white border-gray-900'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                <LinkIcon className="w-4 h-4" />
                Image URL
              </button>
              <button
                type="button"
                onClick={() => setImageInputType('upload')}
                className={`flex items-center gap-2 px-4 py-2 rounded-md border ${
                  imageInputType === 'upload'
                    ? 'bg-gray-900 text-white border-gray-900'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                <Upload className="w-4 h-4" />
                Upload Image
              </button>
            </div>

            {imageInputType === 'url' ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={imageUrlInput}
                  onChange={(e) => setImageUrlInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addImageUrls();
                    }
                  }}
                  placeholder="https://example.com/a.jpg, https://example.com/b.jpg"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
                <button
                  type="button"
                  onClick={addImageUrls}
                  className="flex items-center gap-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add
                </button>
              </div>
            ) : (
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            )}

            {images.length > 0 && (
              <div className="mt-4">
                <p className="text-sm text-gray-600 mb-2">
                  {images.length} image{images.length > 1 ? 's' : ''} — the first is the main image:
                </p>
                <div className="flex flex-wrap gap-3">
                  {images.map((src, index) => (
                    <div key={src} className="relative group">
                      <img
                        src={src}
                        alt={`Product image ${index + 1}`}
                        className={`w-24 h-24 object-cover rounded border-2 ${
                          index === 0 ? 'border-gray-900' : 'border-gray-300'
                        }`}
                      />
                      {index === 0 && (
                        <span className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-gray-900 text-white text-[10px] font-semibold rounded">
                          Main
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full shadow hover:bg-red-600 transition-colors"
                        aria-label={`Remove image ${index + 1}`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                      {index !== 0 && (
                        <button
                          type="button"
                          onClick={() => makeMainImage(index)}
                          className="absolute -top-2 -left-2 p-1 bg-white text-gray-700 border border-gray-300 rounded-full shadow opacity-0 group-hover:opacity-100 hover:text-yellow-500 transition-all"
                          title="Make main image"
                          aria-label={`Make image ${index + 1} the main image`}
                        >
                          <Star className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Checkboxes */}
          <div className="space-y-3">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.inStock}
                onChange={(e) => setFormData({ ...formData, inStock: e.target.checked })}
                className="w-4 h-4 text-gray-900 border-gray-300 rounded focus:ring-gray-900"
              />
              <span className="text-sm font-medium text-gray-700">In Stock</span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.isSale}
                onChange={(e) => setFormData({ ...formData, isSale: e.target.checked })}
                className="w-4 h-4 text-gray-900 border-gray-300 rounded focus:ring-gray-900"
              />
              <span className="text-sm font-medium text-gray-700">On Sale</span>
            </label>
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-gray-900 text-white rounded-md hover:bg-gray-800 disabled:bg-gray-400 transition-colors"
            >
              {loading ? 'Saving...' : productId ? 'Update Product' : 'Create Product'}
            </button>
            <button
              type="button"
              onClick={onBack}
              className="px-6 py-3 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
