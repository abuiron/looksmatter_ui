import { useState } from 'react';
import { X, Download, Upload, FileJson, FileSpreadsheet, AlertCircle, Trash2, CheckCircle2, XCircle } from 'lucide-react';
import { parseImageList } from '../../utils/images';

interface Product {
  _id?: string;
  name: string;
  category: string;
  price: number;
  oldPrice?: number;
  description?: string;
  stock?: number;
  image: string;
  images?: string[];
  inStock?: boolean;
  isSale?: boolean;
  sku?: string;
  sizes?: string[];
}

interface BulkImportExportProps {
  products: Product[];
  onImport: (products: Product[]) => Promise<void>;
  onClose: () => void;
}

// Columns used for templates, CSV/Excel export and the on-screen reference.
const COLUMNS: {
  key: keyof Product;
  required: boolean;
  type: string;
  desc: string;
}[] = [
  { key: 'name', required: true, type: 'Text', desc: 'Product name' },
  { key: 'category', required: true, type: 'Text', desc: 'Category, e.g. T-Shirts' },
  { key: 'price', required: true, type: 'Number', desc: 'Selling price (₹), e.g. 999' },
  { key: 'image', required: true, type: 'URL(s)', desc: 'One or more direct image links separated by commas, e.g. https://a.jpg,https://b.jpg — the first is the main image, the rest form the product gallery' },
  { key: 'oldPrice', required: false, type: 'Number', desc: 'Compare-at / original price for the strike-through. Leave blank if none' },
  { key: 'description', required: false, type: 'Text', desc: 'Short description' },
  { key: 'stock', required: false, type: 'Number', desc: 'Quantity in stock (default 100)' },
  { key: 'inStock', required: false, type: 'true / false', desc: 'Available for sale. Blank or true = available, false = Sold Out (default true)' },
  { key: 'isSale', required: false, type: 'true / false', desc: 'Show the "Sale" badge (default false)' },
  { key: 'sku', required: false, type: 'Text', desc: 'Stock keeping unit. Auto-generated if blank' },
  { key: 'sizes', required: false, type: 'List', desc: 'Sizes separated by | e.g. S|M|L|XL (footwear: 7|8|9). Blank if none' },
];

const HEADERS = COLUMNS.map((c) => c.key) as string[];

// Robustly coerce loose spreadsheet values to a boolean.
// Excel writes TRUE/FALSE (upper-case), users type yes/no, 1/0, etc.
// `fallback` is returned for blank/unknown cells (column absent or empty).
const parseBool = (value: unknown, fallback: boolean): boolean => {
  if (value === undefined || value === null || value === '') return fallback;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  const v = String(value).trim().toLowerCase();
  if (['true', '1', 'yes', 'y', 'in stock', 'instock', 'available', 'on'].includes(v)) return true;
  if (['false', '0', 'no', 'n', 'out of stock', 'outofstock', 'sold out', 'soldout', 'off'].includes(v)) return false;
  return fallback;
};

const parseNum = (value: unknown): number | undefined => {
  if (value === undefined || value === null || String(value).trim() === '') return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
};

// Sizes may arrive as a real array (JSON) or a delimited string (CSV/Excel).
// Split on | , or / and de-duplicate case-insensitively.
const parseSizes = (value: unknown): string[] => {
  if (value === undefined || value === null || value === '') return [];
  const arr = Array.isArray(value) ? value : String(value).split(/[|,/]/);
  const seen = new Set<string>();
  const out: string[] = [];
  arr.forEach((s) => {
    const t = String(s).trim();
    const k = t.toUpperCase();
    if (t && !seen.has(k)) {
      seen.add(k);
      out.push(t);
    }
  });
  return out;
};

// Full image list for a product: main image first, then the gallery, deduplicated.
const imageList = (product: Product): string[] => parseImageList([product.image, product.images]);

// Render a product field for CSV/Excel export; sizes join with | and images join
// with , so every cell round-trips cleanly through re-import.
const cellValue = (product: Product, key: string): unknown => {
  if (key === 'sizes') return Array.isArray(product.sizes) ? product.sizes.join('|') : '';
  if (key === 'image') return imageList(product).join(',');
  return product[key as keyof Product];
};

const triggerDownload = (content: BlobPart, mime: string, filename: string) => {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

const csvCell = (value: unknown) => {
  const s = value === undefined || value === null ? '' : String(value);
  return `"${s.replace(/"/g, '""')}"`;
};

const htmlCell = (value: unknown) =>
  String(value === undefined || value === null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

export default function BulkImportExport({ products, onImport, onClose }: BulkImportExportProps) {
  const [activeTab, setActiveTab] = useState<'import' | 'export'>('export');
  const [importFormat, setImportFormat] = useState<'json' | 'csv'>('csv');
  const [importedProducts, setImportedProducts] = useState<Product[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [error, setError] = useState('');
  const [importing, setImporting] = useState(false);

  // Three example rows that demonstrate every flag clearly.
  // The first two show multiple images (comma-separated in the CSV image cell).
  const sampleData: Product[] = [
    {
      name: 'Classic Cotton T-Shirt',
      category: 'T-Shirts',
      price: 799,
      image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab',
      images: [
        'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab',
        'https://images.unsplash.com/photo-1503341504253-dff4815485f1',
        'https://images.unsplash.com/photo-1576566588028-4147f3842f27',
      ],
      oldPrice: 1299,
      description: 'Soft 100% cotton tee',
      stock: 50,
      inStock: true,
      isSale: true,
      sku: 'TSHIRT-001',
      sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    },
    {
      name: 'Premium Hoodie',
      category: 'Hoodies',
      price: 1999,
      image: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7',
      images: [
        'https://images.unsplash.com/photo-1556821840-3a63f95609a7',
        'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633',
      ],
      oldPrice: 0,
      description: 'Warm fleece hoodie',
      stock: 30,
      inStock: true,
      isSale: false,
      sku: 'HOODIE-001',
      sizes: ['M', 'L', 'XL', 'XXL', '3XL'],
    },
    {
      name: 'Limited Edition Cap (Sold Out)',
      category: 'Accessories',
      price: 499,
      image: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b',
      oldPrice: 699,
      description: 'Currently unavailable',
      stock: 0,
      inStock: false,
      isSale: true,
      sku: 'CAP-001',
    },
  ];

  const rowsToCsv = (rows: Product[]) => {
    const csvRows = [HEADERS.join(',')];
    rows.forEach((product) => {
      csvRows.push(HEADERS.map((h) => csvCell(cellValue(product, h))).join(','));
    });
    // Prefix with a UTF-8 BOM so Excel reads accented characters correctly.
    return '﻿' + csvRows.join('\r\n');
  };

  const rowsToExcelHtml = (rows: Product[]) => {
    const head = HEADERS.map((h) => `<th>${htmlCell(h)}</th>`).join('');
    const body = rows
      .map(
        (p) =>
          `<tr>${HEADERS.map((h) => `<td>${htmlCell(cellValue(p, h))}</td>`).join('')}</tr>`
      )
      .join('');
    return `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="UTF-8"></head><body><table border="1"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></body></html>`;
  };

  const today = new Date().toISOString().split('T')[0];

  // ---- Export ----
  const exportToJSON = () =>
    triggerDownload(JSON.stringify(products, null, 2), 'application/json', `products-${today}.json`);

  const exportToCSV = () =>
    triggerDownload(rowsToCsv(products), 'text/csv;charset=utf-8;', `products-${today}.csv`);

  const exportToExcel = () =>
    triggerDownload(rowsToExcelHtml(products), 'application/vnd.ms-excel', `products-${today}.xls`);

  // ---- Sample template ----
  const downloadSample = () => {
    if (importFormat === 'json') {
      triggerDownload(JSON.stringify(sampleData, null, 2), 'application/json', 'product-template.json');
    } else {
      triggerDownload(rowsToCsv(sampleData), 'text/csv;charset=utf-8;', 'product-template.csv');
    }
  };

  // ---- CSV parsing ----
  const parseCsvLine = (line: string): string[] => {
    const out: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"'; // escaped quote ""
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        out.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    out.push(current);
    return out.map((v) => v.trim());
  };

  const parseCSV = (text: string): Product[] => {
    const clean = text.replace(/^﻿/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    const lines = clean.split('\n').filter((l) => l.trim());
    if (lines.length < 2) throw new Error('CSV file is empty or has no data rows.');

    const headers = parseCsvLine(lines[0]).map((h) => h.replace(/^"|"$/g, '').trim());
    const rows: Product[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = parseCsvLine(lines[i]);
      const raw: any = {};
      headers.forEach((header, index) => {
        raw[header] = values[index] ?? '';
      });
      rows.push(normalizeRow(raw));
    }
    return rows;
  };

  // Normalize one raw record (from CSV or JSON) into a typed Product with sane defaults.
  // The image cell may hold several comma-separated URLs: first = main, all = gallery.
  const normalizeRow = (raw: any): Product => {
    const images = parseImageList([raw.image, raw.images]);
    return {
      name: String(raw.name ?? '').trim(),
      category: String(raw.category ?? '').trim(),
      price: parseNum(raw.price) ?? 0,
      image: images[0] ?? '',
      images,
      oldPrice: parseNum(raw.oldPrice ?? raw.originalPrice),
      description: raw.description !== undefined ? String(raw.description) : undefined,
      stock: parseNum(raw.stock),
      inStock: parseBool(raw.inStock, true),
      isSale: parseBool(raw.isSale, false),
      sku: raw.sku ? String(raw.sku).trim() : undefined,
      sizes: parseSizes(raw.sizes),
    };
  };

  // ---- File upload ----
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');

    try {
      const text = await file.text();
      let parsed: Product[] = [];

      const isJson = file.name.endsWith('.json') || importFormat === 'json';
      if (isJson) {
        const data = JSON.parse(text);
        if (!Array.isArray(data)) throw new Error('JSON file must contain an array of products.');
        parsed = data.map(normalizeRow);
      } else {
        parsed = parseCSV(text);
      }

      // Validate required fields with row numbers.
      parsed.forEach((p, index) => {
        const missing: string[] = [];
        if (!p.name) missing.push('name');
        if (!p.category) missing.push('category');
        if (!p.price) missing.push('price');
        if (!p.image) missing.push('image');
        if (missing.length) {
          throw new Error(`Row ${index + 1}: missing required field(s): ${missing.join(', ')}.`);
        }
      });

      if (parsed.length === 0) throw new Error('No products found in the file.');

      setImportedProducts(parsed);
      setShowPreview(true);
    } catch (err: any) {
      setError(err.message || 'Failed to parse file');
    }

    e.target.value = '';
  };

  const removeProduct = (index: number) => {
    setImportedProducts((prev) => prev.filter((_, i) => i !== index));
  };

  const confirmImport = async () => {
    if (importedProducts.length === 0) return;
    try {
      setImporting(true);
      setError('');
      await onImport(importedProducts);
      setShowPreview(false);
      setImportedProducts([]);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to import products');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Bulk Product Management</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('export')}
            className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
              activeTab === 'export'
                ? 'text-gray-900 border-b-2 border-gray-900'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Download className="w-5 h-5 inline-block mr-2" />
            Export Products
          </button>
          <button
            onClick={() => setActiveTab('import')}
            className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
              activeTab === 'import'
                ? 'text-gray-900 border-b-2 border-gray-900'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Upload className="w-5 h-5 inline-block mr-2" />
            Import Products
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {activeTab === 'export' ? (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="text-sm text-blue-900 font-medium">Export All Products</p>
                    <p className="text-sm text-blue-800 mt-1">
                      Download all {products.length} products in your preferred format. Every field
                      (price, old price, stock, in-stock, on-sale, SKU, sizes, all images) is
                      included. Multiple images export as comma-separated URLs in the image column.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={exportToJSON}
                  className="flex flex-col items-center gap-3 p-6 border-2 border-gray-300 rounded-lg hover:border-gray-900 hover:bg-gray-50 transition-all"
                >
                  <FileJson className="w-12 h-12 text-gray-700" />
                  <div className="text-center">
                    <p className="font-semibold text-gray-900">JSON Format</p>
                    <p className="text-sm text-gray-600 mt-1">Best for developers / re-import</p>
                  </div>
                </button>

                <button
                  onClick={exportToCSV}
                  className="flex flex-col items-center gap-3 p-6 border-2 border-gray-300 rounded-lg hover:border-gray-900 hover:bg-gray-50 transition-all"
                >
                  <FileSpreadsheet className="w-12 h-12 text-gray-700" />
                  <div className="text-center">
                    <p className="font-semibold text-gray-900">CSV Format</p>
                    <p className="text-sm text-gray-600 mt-1">Universal · re-importable</p>
                  </div>
                </button>

                <button
                  onClick={exportToExcel}
                  className="flex flex-col items-center gap-3 p-6 border-2 border-gray-300 rounded-lg hover:border-gray-900 hover:bg-gray-50 transition-all"
                >
                  <FileSpreadsheet className="w-12 h-12 text-green-700" />
                  <div className="text-center">
                    <p className="font-semibold text-gray-900">Excel Format</p>
                    <p className="text-sm text-gray-600 mt-1">Opens in Excel (.xls)</p>
                  </div>
                </button>
              </div>

              <p className="text-xs text-gray-500">
                Tip: To edit in Excel and import back, export as Excel, make your changes, then use
                <span className="font-medium"> File → Save As → CSV</span> and import the CSV.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {!showPreview ? (
                <>
                  {/* Column reference */}
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                      <p className="text-sm font-semibold text-gray-900">Column Reference</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        <span className="text-red-500">*</span> = required. Optional columns can be left blank.
                      </p>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Column</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Notes</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {COLUMNS.map((c) => (
                            <tr key={c.key as string}>
                              <td className="px-4 py-2 font-mono text-gray-900 whitespace-nowrap">
                                {c.key}
                                {c.required && <span className="text-red-500"> *</span>}
                              </td>
                              <td className="px-4 py-2 text-gray-600 whitespace-nowrap">{c.type}</td>
                              <td className="px-4 py-2 text-gray-600">{c.desc}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                      <p className="text-sm text-yellow-800">
                        <span className="font-medium">Stock tip:</span> leave <code>inStock</code> blank or set it to{' '}
                        <code>true</code> for products that are available. Only set it to <code>false</code> for items
                        you want shown as <span className="font-medium">Sold Out</span>.
                      </p>
                    </div>
                  </div>

                  {/* Format Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">Select Import Format</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => setImportFormat('csv')}
                        className={`p-4 border-2 rounded-lg transition-all ${
                          importFormat === 'csv' ? 'border-gray-900 bg-gray-50' : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        <FileSpreadsheet className="w-8 h-8 mx-auto mb-2" />
                        <p className="text-sm font-medium">CSV / Excel</p>
                        <p className="text-xs text-gray-500 mt-1">Save Excel sheets as .csv</p>
                      </button>
                      <button
                        onClick={() => setImportFormat('json')}
                        className={`p-4 border-2 rounded-lg transition-all ${
                          importFormat === 'json' ? 'border-gray-900 bg-gray-50' : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        <FileJson className="w-8 h-8 mx-auto mb-2" />
                        <p className="text-sm font-medium">JSON</p>
                        <p className="text-xs text-gray-500 mt-1">Array of products</p>
                      </button>
                    </div>
                  </div>

                  {/* Download Sample */}
                  <button
                    onClick={downloadSample}
                    className="w-full px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-900 font-medium transition-colors"
                  >
                    <Download className="w-5 h-5 inline-block mr-2" />
                    Download Sample Template ({importFormat.toUpperCase()})
                  </button>

                  {/* File Upload */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">Upload Products File</label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
                      <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <label className="cursor-pointer">
                        <span className="text-gray-600">Click to upload</span>
                        <input
                          type="file"
                          accept={importFormat === 'json' ? '.json' : '.csv,.txt'}
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                      </label>
                      <p className="text-xs text-gray-500 mt-2">
                        {importFormat === 'json' ? '.json' : '.csv'} files only
                      </p>
                    </div>
                  </div>

                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <p className="text-sm text-red-800 whitespace-pre-line">{error}</p>
                    </div>
                  )}
                </>
              ) : (
                <>
                  {/* Preview Table */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Preview: {importedProducts.length} Products
                    </h3>
                    <div className="border border-gray-200 rounded-lg overflow-hidden max-h-96 overflow-y-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50 sticky top-0">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Images</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Old Price</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sizes</th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">In Stock</th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">On Sale</th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Action</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {importedProducts.map((product, index) => (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="px-4 py-3 text-sm text-gray-900">{product.name}</td>
                              <td className="px-4 py-3">
                                <div className="flex items-center">
                                  <div className="flex -space-x-2">
                                    {imageList(product).slice(0, 3).map((src, i) => (
                                      <img
                                        key={i}
                                        src={src}
                                        alt=""
                                        className="w-8 h-8 rounded object-cover border-2 border-white bg-gray-100"
                                      />
                                    ))}
                                  </div>
                                  {imageList(product).length > 3 && (
                                    <span className="ml-2 text-xs text-gray-500">
                                      +{imageList(product).length - 3}
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-600">{product.category}</td>
                              <td className="px-4 py-3 text-sm text-gray-900">₹{product.price}</td>
                              <td className="px-4 py-3 text-sm text-gray-600">
                                {product.oldPrice ? `₹${product.oldPrice}` : '-'}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-600">{product.stock ?? 100}</td>
                              <td className="px-4 py-3 text-sm text-gray-600">
                                {product.sizes && product.sizes.length > 0 ? product.sizes.join(', ') : '-'}
                              </td>
                              <td className="px-4 py-3 text-center">
                                {product.inStock ? (
                                  <CheckCircle2 className="w-4 h-4 text-green-600 inline" />
                                ) : (
                                  <XCircle className="w-4 h-4 text-red-500 inline" />
                                )}
                              </td>
                              <td className="px-4 py-3 text-center">
                                {product.isSale ? (
                                  <CheckCircle2 className="w-4 h-4 text-green-600 inline" />
                                ) : (
                                  <span className="text-gray-300">-</span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-center">
                                <button
                                  onClick={() => removeProduct(index)}
                                  className="text-red-600 hover:text-red-900"
                                  title="Remove"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <p className="text-sm text-red-800 whitespace-pre-line">{error}</p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setShowPreview(false);
                        setImportedProducts([]);
                        setError('');
                      }}
                      className="flex-1 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={confirmImport}
                      disabled={importing || importedProducts.length === 0}
                      className="flex-1 px-6 py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 disabled:bg-gray-400 transition-colors"
                    >
                      {importing ? 'Adding...' : `Add ${importedProducts.length} Products`}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
