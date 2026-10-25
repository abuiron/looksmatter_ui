import { AlertCircle, Clock, IndianRupee, MapPin, PackageCheck, Truck } from 'lucide-react';
import { Link } from '../utils/router';
import PolicyLayout, { PolicyCallout, PolicyNote, PolicyPanel, PolicySection } from '../components/PolicyLayout';

const DELIVERY_ZONES = [
  { label: 'Metro cities', value: '3-5 business days' },
  { label: 'Other cities and towns', value: '5-7 business days' },
  { label: 'Remote or rural areas', value: '7-10 business days' },
];

const SECTIONS: PolicySection[] = [
  {
    id: 'overview',
    title: 'Overview',
    content: (
      <>
        <p>
          At LOOKSMATTER CONSULTING PVT LTD, we are committed to delivering your order safely and on time. This Shipping Policy explains how we process, ship, and deliver the products you purchase from us, including timelines, charges, and coverage areas.
        </p>
        <PolicyCallout icon={AlertCircle} title="Important Notice">
          <p>
            Delivery timelines are estimates and may vary due to factors beyond our control, such as courier delays, weather conditions, or public holidays. By completing your order, you acknowledge and agree to the terms outlined in this Shipping Policy.
          </p>
        </PolicyCallout>
      </>
    ),
  },
  {
    id: 'order-processing-time',
    title: 'Order Processing Time',
    content: (
      <PolicyPanel icon={Clock}>
        <p>
          Orders are processed within <strong>1-2 business days</strong> after payment is confirmed. Orders placed on weekends or public holidays are processed on the next business day.
        </p>
        <p>
          You will receive an order confirmation by email once your order is placed, and a shipping notification once your order has been dispatched.
        </p>
      </PolicyPanel>
    ),
  },
  {
    id: 'delivery-time',
    title: 'Delivery Time',
    content: (
      <>
        <p>
          Once dispatched, your order is typically delivered within <strong>4-7 business days</strong> depending on your location:
        </p>
        <ul className="grid gap-3 sm:grid-cols-3">
          {DELIVERY_ZONES.map((zone) => (
            <li key={zone.label} className="rounded-2xl border border-stone-200 bg-cream-50 p-5">
              <p className="text-[13px] font-semibold text-stone-500">{zone.label}</p>
              <p className="mt-1 font-display text-xl font-semibold text-stone-950">{zone.value}</p>
            </li>
          ))}
        </ul>
        <PolicyNote>
          <strong>Note:</strong> Delivery estimates begin from the date of dispatch, not the date the order is placed.
        </PolicyNote>
      </>
    ),
  },
  {
    id: 'shipping-charges',
    title: 'Shipping Charges',
    content: (
      <PolicyPanel icon={IndianRupee}>
        <p>
          A flat shipping charge of <strong>Rs. 45</strong> is applied to each order and is displayed in your order summary at checkout before payment.
        </p>
        <p>
          Any applicable taxes are calculated and shown separately in your order summary. The final amount payable, including product price, shipping, and taxes, is always shown before you place your order.
        </p>
      </PolicyPanel>
    ),
  },
  {
    id: 'shipping-coverage',
    title: 'Shipping Coverage',
    content: (
      <PolicyPanel icon={MapPin}>
        <p>
          We currently ship across India. We deliver to most serviceable pin codes through our courier partners. If your pin code is not serviceable, our team will contact you to arrange an alternative or process a refund.
        </p>
      </PolicyPanel>
    ),
  },
  {
    id: 'order-tracking',
    title: 'Order Tracking',
    content: (
      <PolicyPanel icon={PackageCheck}>
        <p>
          Once your order is shipped, you will receive tracking details by email. You can also view your order status any time from your{' '}
          <Link to="/profile?tab=orders">Profile</Link> page under "My Orders".
        </p>
      </PolicyPanel>
    ),
  },
  {
    id: 'delays-and-undelivered-packages',
    title: 'Delays & Undelivered Packages',
    content: (
      <>
        <p>
          While we make every effort to deliver on time, delays may occasionally occur due to courier issues, weather, strikes, or other unforeseen circumstances. We appreciate your patience in such situations.
        </p>
        <p>
          If a delivery attempt fails because the address is incorrect or nobody is available to receive the package, the courier will attempt redelivery. Repeated failed attempts may result in the package being returned to us, in which case re-shipping charges may apply.
        </p>
      </>
    ),
  },
  {
    id: 'damaged-or-lost-shipments',
    title: 'Damaged or Lost Shipments',
    content: (
      <>
        <p>
          If your package arrives damaged, or is lost in transit, please contact us immediately (within 48 hours of the expected delivery) with your order number and, where applicable, photos of the damaged package. We will investigate with our courier partner and arrange a replacement or refund as appropriate.
        </p>
        <PolicyNote>
          For returns and refunds, please also review our <Link to="/refund">Refund Policy</Link>.
        </PolicyNote>
      </>
    ),
  },
];

export default function ShippingPolicy() {
  return (
    <PolicyLayout
      title="Shipping Policy"
      icon={Truck}
      updated="December 1, 2025"
      sections={SECTIONS}
      highlights={[
        { icon: Clock, value: '1-2 business days', label: 'to process your order' },
        { icon: Truck, value: '4-7 business days', label: 'typical delivery after dispatch' },
        { icon: IndianRupee, value: 'Rs. 45', label: 'flat shipping charge per order' },
      ]}
      help="Our customer support team is here to assist you with any questions about your shipment or delivery. Don't hesitate to reach out!"
      contact={{
        title: 'Contact Our Support Team',
        text: 'For any questions about shipping, delivery, or this policy, please contact us:',
        showContactForm: true,
      }}
    />
  );
}
