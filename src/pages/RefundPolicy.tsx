import { ReactNode } from 'react';
import { AlertCircle, Clock, Mail, Phone, RotateCcw, Wallet } from 'lucide-react';
import PolicyLayout, { PolicyCallout, PolicyList, PolicyNote, PolicySection } from '../components/PolicyLayout';

function ReturnStep({ step, title, last = false, children }: { step: number; title: string; last?: boolean; children: ReactNode }) {
  return (
    <li className="flex gap-4 sm:gap-5">
      <div className="flex flex-col items-center">
        <span className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-full bg-stone-950 font-display text-sm font-semibold text-gold-400">
          {step}
        </span>
        {!last && <span aria-hidden="true" className="mt-2 w-px flex-1 bg-stone-200" />}
      </div>
      <div className={`min-w-0 flex-1 space-y-3 rounded-2xl border border-stone-200 bg-cream-50 p-5 sm:p-6 ${last ? '' : 'mb-4'}`}>
        <h3 className="text-lg font-semibold text-stone-950">
          <span className="text-stone-400">Step {step}:</span> {title}
        </h3>
        {children}
      </div>
    </li>
  );
}

const SECTIONS: PolicySection[] = [
  {
    id: 'our-commitment',
    title: 'Our Commitment',
    content: (
      <>
        <p>
          At LOOKSMATTER CONSULTING PVT LTD, customer satisfaction is our priority. We want you to be completely happy with your purchase. If you're not satisfied with your order, we're here to help with returns, exchanges, and refunds according to the policy outlined below.
        </p>
        <PolicyCallout icon={AlertCircle} title="Important Notice">
          <p>
            Please read this policy carefully before making a purchase. By completing your order, you acknowledge and agree to the terms outlined in this Refund Policy.
          </p>
        </PolicyCallout>
      </>
    ),
  },
  {
    id: 'return-eligibility',
    title: 'Return Eligibility',
    content: (
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-4 rounded-2xl border border-stone-200 p-5 sm:p-6">
          <h3 className="text-lg font-semibold text-stone-950">You can return products if:</h3>
          <PolicyList
            items={[
              'The product is defective, damaged, or not as described',
              'You received the wrong item or size',
              'The product has manufacturing defects',
              <>
                You initiate the return within <strong>7 days</strong> of delivery
              </>,
              'The product is unused, unworn, and in original condition with all tags attached',
              'The product is in its original packaging',
            ]}
          />
        </div>
        <div className="space-y-4 rounded-2xl border border-stone-200 bg-cream-50 p-5 sm:p-6">
          <h3 className="text-lg font-semibold text-stone-950">Non-Returnable Items:</h3>
          <PolicyList
            items={[
              'Products marked as "Final Sale" or "Non-Returnable"',
              'Intimate apparel and undergarments (for hygiene reasons)',
              'Products with removed tags or packaging',
              'Products that show signs of wear or use',
              'Customized or personalized items',
              'Sale or clearance items (unless defective)',
            ]}
          />
        </div>
      </div>
    ),
  },
  {
    id: 'return-process',
    title: 'Return Process',
    content: (
      <ol>
        <ReturnStep step={1} title="Contact Us">
          <p>Before returning any product, you must contact our customer support team:</p>
          <div className="flex flex-col gap-2 sm:flex-row sm:gap-6">
            <span className="inline-flex items-center gap-2">
              <Mail className="h-4 w-4 text-stone-400" />
              <a href="mailto:info@looksmatter.in">info@looksmatter.in</a>
            </span>
            <span className="inline-flex items-center gap-2">
              <Phone className="h-4 w-4 text-stone-400" />
              <a href="tel:+916380280076">+91 6380280076</a>
            </span>
          </div>
          <p>Provide your order number, reason for return, and photos of the product (if defective or damaged).</p>
        </ReturnStep>
        <ReturnStep step={2} title="Receive Authorization">
          <p>
            Our team will review your request within <strong>24-48 hours</strong> and provide you with a Return Authorization (RA) number and return shipping instructions if your return is approved.
          </p>
        </ReturnStep>
        <ReturnStep step={3} title="Ship the Product" last>
          <p>
            Pack the product securely in its original packaging with all tags and accessories. Include the RA number on the package. Ship the product to the address provided by our team. We recommend using a trackable shipping service.
          </p>
          <PolicyNote tone="warning">
            <strong>Note:</strong> Return shipping costs are the customer's responsibility unless the product is defective or we sent the wrong item.
          </PolicyNote>
        </ReturnStep>
      </ol>
    ),
  },
  {
    id: 'refund-processing',
    title: 'Refund Processing',
    content: (
      <div className="grid gap-4 sm:grid-cols-2">
        <p className="rounded-2xl border border-stone-200 p-5">
          <strong className="mb-1 block">Inspection:</strong> Once we receive your returned product, our team will inspect it to verify it meets our return eligibility criteria. This process typically takes 2-3 business days.
        </p>
        <p className="rounded-2xl border border-stone-200 p-5">
          <strong className="mb-1 block">Refund Approval:</strong> If your return is approved, we will initiate a refund to your original payment method. The refund amount will be the product price minus any applicable deductions (see below).
        </p>
        <p className="rounded-2xl border border-stone-200 p-5">
          <strong className="mb-1 block">Processing Time:</strong> Refunds are processed within <strong>5-7 business days</strong> after approval. Depending on your bank or payment provider, it may take an additional 3-5 business days for the funds to appear in your account.
        </p>
        <p className="rounded-2xl border border-stone-200 p-5">
          <strong className="mb-1 block">Deductions:</strong> Shipping charges (original and return) are non-refundable unless the return is due to our error or a defective product.
        </p>
      </div>
    ),
  },
  {
    id: 'exchanges',
    title: 'Exchanges',
    content: (
      <>
        <p>
          If you would like to exchange an item for a different size, color, or product, please follow the return process outlined above. Once your return is approved and we receive the product, you can place a new order for the desired item.
        </p>
        <p>
          <strong>Size Exchange:</strong> For size exchanges of the same product, we may offer a direct exchange option. Contact our customer support team to check availability.
        </p>
        <PolicyNote>
          <strong>Tip:</strong> To ensure faster delivery of your new item, we recommend placing a new order before returning the original product.
        </PolicyNote>
      </>
    ),
  },
  {
    id: 'damaged-or-defective-products',
    title: 'Damaged or Defective Products',
    content: (
      <>
        <p>If you receive a damaged or defective product, please contact us immediately (within 48 hours of delivery) with:</p>
        <PolicyList items={['Your order number', 'Clear photos showing the damage or defect', 'A detailed description of the issue']} />
        <p>
          We will arrange for a replacement or full refund (including shipping charges) at no additional cost to you. In such cases, we will provide a prepaid return shipping label.
        </p>
      </>
    ),
  },
  {
    id: 'cancellations',
    title: 'Cancellations',
    content: (
      <>
        <p>
          <strong>Before Shipment:</strong> You can cancel your order free of charge before it is shipped. Contact us immediately at{' '}
          <a href="mailto:info@looksmatter.in">info@looksmatter.in</a> or +91 6380280076. Full refund will be processed within 3-5 business days.
        </p>
        <p>
          <strong>After Shipment:</strong> Once your order has been shipped, cancellation is not possible. You will need to follow the standard return process upon receiving the product.
        </p>
      </>
    ),
  },
  {
    id: 'partial-refunds',
    title: 'Partial Refunds',
    content: (
      <>
        <p>In certain situations, partial refunds may be granted:</p>
        <PolicyList
          items={[
            'Products with minor signs of use or damage',
            'Products returned without original packaging',
            'Products returned more than 7 days after delivery',
            'Products missing accessories or components',
          ]}
        />
      </>
    ),
  },
  {
    id: 'late-or-missing-refunds',
    title: 'Late or Missing Refunds',
    content: (
      <>
        <p>If you haven't received your refund within the expected timeframe:</p>
        <PolicyList
          ordered
          items={[
            'Check your bank account or credit card statement again',
            'Contact your bank or credit card company (processing delays may occur)',
            'Contact your payment provider (PaymentGateway)',
            <>
              If you've done all of this and still have not received your refund, contact us at{' '}
              <a href="mailto:info@looksmatter.in">info@looksmatter.in</a>
            </>,
          ]}
        />
      </>
    ),
  },
];

export default function RefundPolicy() {
  return (
    <PolicyLayout
      title="Refund Policy"
      icon={RotateCcw}
      updated="December 1, 2025"
      sections={SECTIONS}
      highlights={[
        { icon: RotateCcw, value: '7 days', label: 'to start a return after delivery' },
        { icon: Clock, value: '24-48 hours', label: 'to review your return request' },
        { icon: Wallet, value: '5-7 business days', label: 'to process an approved refund' },
      ]}
      help="Our customer support team is here to assist you with any questions or concerns about returns and refunds. Don't hesitate to reach out!"
      contact={{
        title: 'Contact Our Support Team',
        text: 'For any questions about returns, refunds, or this policy, please contact us:',
        showContactForm: true,
      }}
    />
  );
}
