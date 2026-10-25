import { useState, DragEvent } from 'react';
import { X, AlertCircle, CreditCard, Package, Receipt, UploadCloud, Loader2, Check } from 'lucide-react';
import api from '../services/api';
import Modal from './ui/Modal';

type IssueType = 'order_issue' | 'payment_issue';

interface ReportIssueProps {
  orderId: string;
  orderNumber?: string;
  // Which issue type is pre-selected when the form opens.
  initialType?: IssueType;
  onClose: () => void;
  onSuccess?: () => void;
}

const ISSUE_TYPES: { value: IssueType; label: string; hint: string; icon: typeof Package }[] = [
  { value: 'order_issue', label: 'Order issue', hint: 'Wrong item, damaged, etc.', icon: Package },
  { value: 'payment_issue', label: 'Payment issue', hint: 'Charge problem, refund, etc.', icon: CreditCard },
];

export default function ReportIssue({ orderId, orderNumber, initialType, onClose, onSuccess }: ReportIssueProps) {
  const [type, setType] = useState<IssueType>(initialType ?? 'order_issue');
  const [subject, setSubject] = useState('');
  const [notes, setNotes] = useState('');
  const [image, setImage] = useState<string>('');
  const [imagePreview, setImagePreview] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);

  // Shared by the file picker and drag-and-drop.
  const handleImageUpload = async (file: File) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB');
      return;
    }

    try {
      setUploading(true);
      setError('');

      const formData = new FormData();
      formData.append('image', file);

      const data = await api.uploadImage(formData);
      setImage(data.url);
      setImagePreview(URL.createObjectURL(file));
    } catch (err) {
      setError('Failed to upload image');
      console.error('Upload error:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    if (!uploading) setDragOver(true);
  };

  const handleDrop = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setDragOver(false);
    if (uploading) return;
    const file = e.dataTransfer.files?.[0];
    if (file) handleImageUpload(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!subject.trim()) {
      setError('Please enter a subject');
      return;
    }

    if (!notes.trim()) {
      setError('Please describe your issue');
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      await api.createReport({
        orderId,
        type,
        subject: subject.trim(),
        notes: notes.trim(),
        image: image || undefined,
      });

      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to submit report');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    // Not dismissible by backdrop/Escape so a stray click can't throw away a half-written report.
    <Modal open onClose={onClose} title="Report an issue" size="lg" dismissible={false} label="Report an issue">
      <form onSubmit={handleSubmit} className="space-y-6 p-6 sm:p-8">
        {/* Order Info */}
        <div className="flex items-center gap-3 rounded-2xl bg-cream-100 px-4 py-3">
          <span className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-full bg-white text-stone-700">
            <Receipt className="h-[18px] w-[18px]" />
          </span>
          <div className="min-w-0">
            <p className="text-xs text-stone-500">Order</p>
            <p className="truncate font-semibold text-stone-950">{orderNumber || orderId}</p>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div role="alert" className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {/* Issue Type */}
        <div>
          <p className="label">
            Issue type <span className="text-rose-500">*</span>
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Issue type">
            {ISSUE_TYPES.map(({ value, label, hint, icon: Icon }) => {
              const selected = type === value;
              return (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => setType(value)}
                  className={`relative flex items-center gap-3 rounded-2xl border p-4 text-left transition ${
                    selected
                      ? 'border-stone-950 bg-cream-50 ring-1 ring-stone-950'
                      : 'border-stone-200 bg-white hover:border-stone-400'
                  }`}
                >
                  <span
                    className={`grid h-10 w-10 flex-shrink-0 place-items-center rounded-full ${
                      selected ? 'bg-stone-950 text-gold-400' : 'bg-cream-200 text-stone-700'
                    }`}
                  >
                    <Icon className="h-[18px] w-[18px]" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-stone-950">{label}</span>
                    <span className="block text-xs text-stone-500">{hint}</span>
                  </span>
                  {selected && (
                    <span className="absolute right-3 top-3 grid h-5 w-5 place-items-center rounded-full bg-stone-950 text-white">
                      <Check className="h-3 w-3" strokeWidth={3} />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Subject */}
        <div>
          <label htmlFor="report-subject" className="label">
            Subject <span className="text-rose-500">*</span>
          </label>
          <input
            id="report-subject"
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Brief description of the issue"
            className="input"
            required
          />
        </div>

        {/* Notes */}
        <div>
          <label htmlFor="report-notes" className="label">
            Detailed description <span className="text-rose-500">*</span>
          </label>
          <textarea
            id="report-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={5}
            placeholder="Please describe your issue in detail..."
            className="input resize-none"
            required
          />
        </div>

        {/* Image Upload */}
        <div>
          <p className="label">
            Attach an image <span className="font-normal text-stone-400">(optional)</span>
          </p>

          {imagePreview ? (
            <div className="relative overflow-hidden rounded-2xl border border-stone-200 bg-cream-100">
              <img src={imagePreview} alt="Attachment preview" className="mx-auto max-h-64 w-full object-contain" />
              <button
                type="button"
                onClick={() => {
                  setImage('');
                  setImagePreview('');
                }}
                className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-white/95 text-stone-700 shadow-soft transition hover:bg-rose-50 hover:text-rose-600"
                aria-label="Remove image"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <label
              onDragOver={handleDragOver}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              className={`flex h-36 w-full cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed text-center transition-colors ${
                dragOver ? 'border-gold-500 bg-gold-50' : 'border-stone-300 bg-cream-50 hover:border-stone-400 hover:bg-cream-100'
              } ${uploading ? 'pointer-events-none' : ''}`}
            >
              {uploading ? (
                <span className="flex flex-col items-center gap-2 text-sm text-stone-600">
                  <Loader2 className="h-7 w-7 animate-spin text-stone-500" />
                  Uploading…
                </span>
              ) : (
                <>
                  <UploadCloud className="mb-2 h-8 w-8 text-stone-400" strokeWidth={1.5} />
                  <p className="text-sm text-stone-600">
                    <span className="font-semibold text-stone-950">Click to upload</span> or drag and drop
                  </p>
                  <p className="mt-1 text-xs text-stone-400">PNG, JPG, GIF up to 5MB</p>
                </>
              )}
              <input
                type="file"
                className="hidden"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImageUpload(file);
                }}
                disabled={uploading}
              />
            </label>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col-reverse gap-3 border-t border-stone-200 pt-6 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} className="btn-outline">
            Cancel
          </button>
          <button type="submit" disabled={submitting || uploading} className="btn-primary">
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {submitting ? 'Submitting…' : 'Submit report'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
