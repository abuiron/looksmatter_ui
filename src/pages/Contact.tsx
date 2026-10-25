import { ChangeEvent, FormEvent, ReactNode, useRef, useState } from 'react';
import { AlertCircle, CheckCircle2, Clock, Mail, MapPin, MessageCircle, Phone, Send } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import PageHero from '../components/ui/PageHero';

const SUPPORT_EMAIL = 'info@looksmatter.in';
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type FieldName = 'name' | 'email' | 'phone' | 'message';
type FormErrors = Partial<Record<FieldName, string>>;

function InfoCard({ icon: Icon, label, href, children }: { icon: LucideIcon; label: string; href?: string; children: ReactNode }) {
  const body = (
    <>
      <span className="grid h-11 w-11 flex-shrink-0 place-items-center rounded-full bg-stone-950 text-gold-400 transition-colors group-hover:bg-gold-500 group-hover:text-stone-950">
        <Icon className="h-5 w-5" />
      </span>
      <span className="min-w-0">
        <span className="block text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-500">{label}</span>
        <span className="mt-1 block text-[15px] font-medium leading-relaxed text-stone-900">{children}</span>
      </span>
    </>
  );
  const className = 'group flex items-start gap-4 rounded-2xl border border-stone-200 bg-white p-5 transition-colors';
  return (
    <li>
      {href ? (
        <a href={href} className={`${className} hover:border-stone-950`}>
          {body}
        </a>
      ) : (
        <div className={className}>{body}</div>
      )}
    </li>
  );
}

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitted, setSubmitted] = useState(false);
  const fieldRefs = useRef<Partial<Record<FieldName, HTMLInputElement | HTMLTextAreaElement | null>>>({});

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const name = e.target.name as FieldName;
    setFormData((prev) => ({ ...prev, [name]: e.target.value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }));
    setSubmitted(false);
  };

  const validate = (): FormErrors => {
    const next: FormErrors = {};
    if (!formData.name.trim()) next.name = 'Please enter your name';
    if (!formData.email.trim()) next.email = 'Please enter your email';
    else if (!EMAIL_PATTERN.test(formData.email.trim())) next.email = 'Please enter a valid email address';
    if (!formData.message.trim()) next.message = 'Please write a message';
    return next;
  };

  // There is no contact API, so hand the message to the visitor's email app
  // with everything filled in instead of pretending it was sent.
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const nextErrors = validate();
    setErrors(nextErrors);
    const firstInvalid = (['name', 'email', 'message'] as FieldName[]).find((field) => nextErrors[field]);
    if (firstInvalid) {
      fieldRefs.current[firstInvalid]?.focus();
      setSubmitted(false);
      return;
    }

    const name = formData.name.trim();
    const subject = `Website enquiry from ${name}`;
    const body = [
      `Name: ${name}`,
      `Email: ${formData.email.trim()}`,
      `Phone: ${formData.phone.trim() || '-'}`,
      '',
      formData.message.trim(),
    ].join('\n');

    window.location.href = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setSubmitted(true);
  };

  const fieldClass = (field: FieldName) => `input ${errors[field] ? 'input-error' : ''}`;

  const errorText = (field: FieldName) =>
    errors[field] ? (
      <p id={`${field}-error`} className="field-error">
        <AlertCircle className="h-3.5 w-3.5" />
        {errors[field]}
      </p>
    ) : null;

  return (
    <div className="bg-white">
      <PageHero
        eyebrow="Contact"
        title="Contact Us"
        icon={MessageCircle}
        breadcrumbs={[{ label: 'Home', to: '/' }, { label: 'Contact Us' }]}
        description="Get in touch with us"
      />

      <div className="container-page py-12 sm:py-16 lg:py-20">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-14">
          {/* Company information */}
          <div className="lg:col-span-5">
            <h2 className="text-2xl font-semibold text-stone-950 sm:text-3xl">Company Information</h2>
            <p className="mt-2 text-sm font-semibold uppercase tracking-[0.16em] text-gold-700">LOOKSMATTER CONSULTING PVT LTD</p>

            <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <InfoCard icon={Mail} label="Email" href={`mailto:${SUPPORT_EMAIL}`}>
                {SUPPORT_EMAIL}
              </InfoCard>
              <InfoCard icon={Phone} label="Phone" href="tel:+916380280076">
                +91 6380280076
              </InfoCard>
              <InfoCard icon={MapPin} label="Address">
                <address className="not-italic">
                 Virutal Office only: LOOKSMATTER 
                </address>
              </InfoCard>
              <InfoCard icon={Clock} label="Business Hours">
                Monday - Saturday, 10:00 AM - 6:00 PM IST
              </InfoCard>
            </ul>
          </div>

          {/* Message form */}
          <div className="lg:col-span-7">
            <div className="card p-6 shadow-soft sm:p-10">
              <h2 className="text-2xl font-semibold text-stone-950 sm:text-3xl">Send us a Message</h2>
              <p className="mt-2 text-[15px] text-stone-500">
                Fill in your details and we'll open your email app with the message ready to send.
              </p>

              {submitted && (
                <div role="status" className="mt-6 flex gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm">
                  <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-emerald-600" />
                  <div>
                    <p className="font-semibold text-emerald-900">Your email app has been opened</p>
                    <p className="mt-1 leading-relaxed text-emerald-800">
                      Your message is ready to send — just press send in your email app. If nothing opened, write to us
                      directly at{' '}
                      <a href={`mailto:${SUPPORT_EMAIL}`} className="font-semibold underline underline-offset-2">
                        {SUPPORT_EMAIL}
                      </a>
                      .
                    </p>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} noValidate className="mt-8 grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="name" className="label">
                    Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    ref={(el) => { fieldRefs.current.name = el; }}
                    type="text"
                    id="name"
                    name="name"
                    autoComplete="name"
                    value={formData.name}
                    onChange={handleChange}
                    aria-invalid={!!errors.name}
                    aria-describedby={errors.name ? 'name-error' : undefined}
                    className={fieldClass('name')}
                    placeholder="Your full name"
                  />
                  {errorText('name')}
                </div>

                <div>
                  <label htmlFor="email" className="label">
                    Email <span className="text-rose-500">*</span>
                  </label>
                  <input
                    ref={(el) => { fieldRefs.current.email = el; }}
                    type="email"
                    id="email"
                    name="email"
                    autoComplete="email"
                    value={formData.email}
                    onChange={handleChange}
                    aria-invalid={!!errors.email}
                    aria-describedby={errors.email ? 'email-error' : undefined}
                    className={fieldClass('email')}
                    placeholder="you@example.com"
                  />
                  {errorText('email')}
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="phone" className="label">
                    Phone number <span className="font-normal text-stone-400">(optional)</span>
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    autoComplete="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    className={fieldClass('phone')}
                    placeholder="+91"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="message" className="label">
                    Message <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    ref={(el) => { fieldRefs.current.message = el; }}
                    id="message"
                    name="message"
                    rows={6}
                    value={formData.message}
                    onChange={handleChange}
                    aria-invalid={!!errors.message}
                    aria-describedby={errors.message ? 'message-error' : undefined}
                    className={`${fieldClass('message')} resize-none`}
                    placeholder="How can we help? Include your order number if it's about an order."
                  />
                  {errorText('message')}
                </div>

                <div className="sm:col-span-2">
                  <button type="submit" className="btn-primary btn-lg w-full sm:w-auto">
                    <Send className="h-4 w-4" />
                    Send message
                  </button>
                  <p className="field-hint">This opens your email app with your message ready to send.</p>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
