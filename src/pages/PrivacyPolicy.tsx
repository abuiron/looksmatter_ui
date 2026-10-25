import { Shield } from 'lucide-react';
import PolicyLayout, { PolicyH3, PolicyList, PolicySection } from '../components/PolicyLayout';

const SECTIONS: PolicySection[] = [
  {
    id: 'introduction',
    title: 'Introduction',
    content: (
      <p>
        Welcome to LOOKSMATTER CONSULTING PVT LTD ("we," "our," or "us"). We are committed to protecting your personal information and your right to privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website and use our services.
      </p>
    ),
  },
  {
    id: 'information-we-collect',
    title: 'Information We Collect',
    content: (
      <>
        <PolicyH3>Personal Information</PolicyH3>
        <p>When you register on our site, place an order, or subscribe to our newsletter, we may collect:</p>
        <PolicyList
          items={[
            'Name and contact information (email, phone number)',
            'Billing and shipping addresses',
            'Payment information (processed securely through PaymentGateway)',
            'Order history and preferences',
          ]}
        />
        <PolicyH3>Automatically Collected Information</PolicyH3>
        <PolicyList
          items={[
            'Browser type and version',
            'IP address and device information',
            'Pages visited and time spent on our site',
            'Referring website addresses',
          ]}
        />
      </>
    ),
  },
  {
    id: 'how-we-use-your-information',
    title: 'How We Use Your Information',
    content: (
      <>
        <p>We use the information we collect to:</p>
        <PolicyList
          items={[
            'Process and fulfill your orders',
            'Send order confirmations and shipping updates',
            'Provide customer support and respond to inquiries',
            'Improve our website and services',
            'Send promotional emails (you can opt-out at any time)',
            'Prevent fraudulent transactions and enhance security',
            'Comply with legal obligations',
          ]}
        />
      </>
    ),
  },
  {
    id: 'information-sharing',
    title: 'Information Sharing and Disclosure',
    content: (
      <>
        <p>We do not sell, trade, or rent your personal information to third parties. We may share your information with:</p>
        <PolicyList
          items={[
            <>
              <strong>Payment Processors:</strong> PaymentGateway for secure payment processing
            </>,
            <>
              <strong>Shipping Partners:</strong> To deliver your orders
            </>,
            <>
              <strong>Service Providers:</strong> Who assist in our business operations
            </>,
            <>
              <strong>Legal Authorities:</strong> When required by law or to protect our rights
            </>,
          ]}
        />
      </>
    ),
  },
  {
    id: 'data-security',
    title: 'Data Security',
    content: (
      <p>
        We implement industry-standard security measures to protect your personal information. This includes SSL encryption for data transmission, secure storage systems, and regular security audits. However, no method of transmission over the Internet is 100% secure, and we cannot guarantee absolute security.
      </p>
    ),
  },
  {
    id: 'cookies',
    title: 'Cookies and Tracking Technologies',
    content: (
      <p>
        Our website uses cookies to enhance your browsing experience, remember your preferences, and analyze site traffic. You can control cookie settings through your browser preferences. Disabling cookies may limit certain features of our website.
      </p>
    ),
  },
  {
    id: 'your-rights',
    title: 'Your Rights',
    content: (
      <>
        <p>You have the right to:</p>
        <PolicyList
          items={[
            'Access and review your personal information',
            'Request correction of inaccurate data',
            'Request deletion of your account and data',
            'Opt-out of marketing communications',
            'Withdraw consent for data processing',
          ]}
        />
      </>
    ),
  },
  {
    id: 'third-party-links',
    title: 'Third-Party Links',
    content: (
      <p>
        Our website may contain links to third-party websites. We are not responsible for the privacy practices of these external sites. We encourage you to review their privacy policies before providing any personal information.
      </p>
    ),
  },
  {
    id: 'childrens-privacy',
    title: "Children's Privacy",
    content: (
      <p>
        Our services are not intended for individuals under 18 years of age. We do not knowingly collect personal information from children. If you believe we have collected information from a child, please contact us immediately.
      </p>
    ),
  },
  {
    id: 'changes-to-this-policy',
    title: 'Changes to This Policy',
    content: (
      <p>
        We may update this Privacy Policy from time to time. Any changes will be posted on this page with an updated "Last Updated" date. We encourage you to review this policy periodically.
      </p>
    ),
  },
];

export default function PrivacyPolicy() {
  return (
    <PolicyLayout
      title="Privacy Policy"
      icon={Shield}
      updated="December 1, 2025"
      sections={SECTIONS}
      contact={{
        title: 'Contact Us',
        text: 'If you have any questions about this Privacy Policy or how we handle your data, please contact us:',
      }}
    />
  );
}
