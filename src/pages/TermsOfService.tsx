import { FileText } from 'lucide-react';
import { Link } from '../utils/router';
import PolicyLayout, { PolicyH3, PolicyList, PolicySection } from '../components/PolicyLayout';

const SECTIONS: PolicySection[] = [
  {
    id: 'agreement-to-terms',
    title: 'Agreement to Terms',
    content: (
      <p>
        By accessing and using the LOOKSMATTER website and services, you agree to be bound by these Terms of Service. If you disagree with any part of these terms, you may not access our services. These terms apply to all visitors, users, and customers.
      </p>
    ),
  },
  {
    id: 'use-of-our-service',
    title: 'Use of Our Service',
    content: (
      <>
        <PolicyH3>Account Registration</PolicyH3>
        <PolicyList
          items={[
            'You must be at least 18 years old to create an account',
            'You must provide accurate and complete information',
            'You are responsible for maintaining the confidentiality of your account',
            'You are responsible for all activities under your account',
            'You must notify us immediately of any unauthorized use',
          ]}
        />
        <PolicyH3>Prohibited Activities</PolicyH3>
        <p>You agree not to:</p>
        <PolicyList
          items={[
            'Use the service for any illegal purpose',
            'Violate any applicable laws or regulations',
            'Infringe upon the rights of others',
            'Transmit harmful code or malware',
            'Engage in fraudulent activities',
            'Harass, abuse, or harm other users',
            'Attempt to gain unauthorized access to our systems',
          ]}
        />
      </>
    ),
  },
  {
    id: 'products-and-services',
    title: 'Products and Services',
    content: (
      <>
        <p>
          <strong>Product Information:</strong> We strive to display accurate product descriptions, images, and pricing. However, we do not guarantee that all information is error-free. We reserve the right to correct any errors and update information without prior notice.
        </p>
        <p>
          <strong>Pricing:</strong> All prices are listed in Indian Rupees (₹) and are subject to change without notice. We reserve the right to modify prices, discontinue products, or limit quantities at any time.
        </p>
        <p>
          <strong>Availability:</strong> Product availability is subject to change. We do not guarantee that all items shown on the website are in stock. In case of unavailability, we will notify you and offer alternatives or a full refund.
        </p>
      </>
    ),
  },
  {
    id: 'orders-and-payments',
    title: 'Orders and Payments',
    content: (
      <>
        <p>
          <strong>Order Acceptance:</strong> Your order is an offer to purchase products. We reserve the right to accept or decline your order for any reason, including product availability, errors in pricing, or suspected fraud.
        </p>
        <p>
          <strong>Payment Processing:</strong> All payments are processed securely through PaymentGateway. By placing an order, you authorize us to charge your payment method for the total amount, including applicable taxes and shipping fees.
        </p>
        <p>
          <strong>Payment Methods:</strong> We accept major credit cards, debit cards, UPI, and other payment methods as displayed at checkout. Your payment information is encrypted and never stored on our servers.
        </p>
        <p>
          <strong>Order Confirmation:</strong> You will receive an email confirmation once your order is successfully placed. This confirmation does not signify acceptance of your order.
        </p>
      </>
    ),
  },
  {
    id: 'shipping-and-delivery',
    title: 'Shipping and Delivery',
    content: (
      <>
        <p>
          We ship to addresses within India. Delivery times are estimates and may vary based on location, product availability, and external factors. We are not responsible for delays caused by courier services or unforeseen circumstances.
        </p>
        <p>
          Risk of loss and title for items purchased pass to you upon delivery to the shipping carrier. You are responsible for providing accurate shipping information.
        </p>
      </>
    ),
  },
  {
    id: 'returns-and-refunds',
    title: 'Returns and Refunds',
    content: (
      <p>
        Please refer to our <Link to="/refund">Refund Policy</Link> for detailed information about returns, exchanges, and refunds. By making a purchase, you agree to the terms outlined in our Refund Policy.
      </p>
    ),
  },
  {
    id: 'intellectual-property',
    title: 'Intellectual Property Rights',
    content: (
      <>
        <p>
          All content on this website, including text, graphics, logos, images, and software, is the property of LOOKSMATTER CONSULTING PVT LTD and is protected by Indian and international copyright laws.
        </p>
        <p>
          You may not reproduce, distribute, modify, or create derivative works from any content without our express written permission. The LOOKSMATTER name and logo are trademarks of LOOKSMATTER CONSULTING PVT LTD.
        </p>
      </>
    ),
  },
  {
    id: 'user-content',
    title: 'User Content',
    content: (
      <p>
        By submitting reviews, comments, or other content to our website, you grant us a non-exclusive, royalty-free, perpetual license to use, reproduce, and display such content. You represent that you own or have the necessary rights to the content you submit.
      </p>
    ),
  },
  {
    id: 'limitation-of-liability',
    title: 'Limitation of Liability',
    content: (
      <>
        <p>
          To the maximum extent permitted by law, LOOKSMATTER CONSULTING PVT LTD shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of our services.
        </p>
        <p>Our total liability for any claims related to our services shall not exceed the amount you paid for the products in question.</p>
      </>
    ),
  },
  {
    id: 'indemnification',
    title: 'Indemnification',
    content: (
      <p>
        You agree to indemnify and hold harmless LOOKSMATTER CONSULTING PVT LTD, its officers, directors, employees, and agents from any claims, damages, losses, or expenses arising from your violation of these Terms of Service or your use of our services.
      </p>
    ),
  },
  {
    id: 'governing-law',
    title: 'Governing Law',
    content: (
      <p>
        These Terms of Service are governed by the laws of India. Any disputes arising from these terms shall be subject to the exclusive jurisdiction of the courts in Bengaluru, Karnataka.
      </p>
    ),
  },
  {
    id: 'changes-to-terms',
    title: 'Changes to Terms',
    content: (
      <p>
        We reserve the right to modify these Terms of Service at any time. Changes will be effective immediately upon posting. Your continued use of our services after changes are posted constitutes acceptance of the modified terms.
      </p>
    ),
  },
  {
    id: 'termination',
    title: 'Termination',
    content: (
      <p>
        We reserve the right to suspend or terminate your account and access to our services at any time, without notice, for conduct that we believe violates these Terms of Service or is harmful to other users, our business, or third parties.
      </p>
    ),
  },
];

export default function TermsOfService() {
  return (
    <PolicyLayout
      title="Terms of Service"
      icon={FileText}
      updated="December 1, 2025"
      sections={SECTIONS}
      contact={{
        title: 'Contact Information',
        text: 'If you have questions about these Terms of Service, please contact us:',
      }}
    />
  );
}
