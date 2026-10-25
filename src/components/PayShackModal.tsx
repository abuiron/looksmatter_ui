import { useState, useEffect } from 'react';
import { X, Smartphone, QrCode, RefreshCw, Loader2, Lock } from 'lucide-react';
import QRCode from 'qrcode';
import api from '../services/api';
import { useRouter } from '../utils/router';
import { formatINR } from '../utils/format';
import Modal from './ui/Modal';

interface PaymentGatewayModalProps {
  paymentData: {
    paymentUrl: string;
    txnRefId: string;
    orderId: string;
    amount: number;
  };
  onClose: () => void;
  onSuccess: (orderId: string) => void;
  onCheckStatus: (txnRefId: string) => Promise<any>;
}

const UPI_APPS = ['Google Pay', 'PhonePe', 'Paytm', 'BHIM UPI'];

const MOBILE_STEPS = [
  'Tap the button above to open your UPI app',
  'Approve the payment in the app',
  'Come back here — confirmation is automatic',
];

const DESKTOP_STEPS = [
  'Open any UPI app on your phone',
  'Scan this QR code',
  'Approve the payment — this window updates automatically',
];

function Steps({ steps }: { steps: string[] }) {
  return (
    <ol className="space-y-2.5">
      {steps.map((step, i) => (
        <li key={step} className="flex items-start gap-3 text-[13px] text-stone-600">
          <span className="grid h-6 w-6 flex-shrink-0 place-items-center rounded-full bg-stone-950 text-[11px] font-semibold text-gold-400">
            {i + 1}
          </span>
          <span className="pt-0.5 leading-snug">{step}</span>
        </li>
      ))}
    </ol>
  );
}

export default function PaymentGatewayModal({ paymentData, onClose, onSuccess, onCheckStatus }: PaymentGatewayModalProps) {
  const { navigate } = useRouter();
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const [checking, setChecking] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(true);

  useEffect(() => {
    // Detect if user is on mobile
    const checkMobile = () => {
      return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    };
    setIsMobile(checkMobile());

    // Generate QR code for desktop
    if (!checkMobile()) {
      QRCode.toDataURL(paymentData.paymentUrl, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      })
        .then(setQrCodeUrl)
        .catch(console.error);
    }

    // Check order status from database every 5 seconds to detect webhook updates
    // Only if modal is still open
    const statusCheckInterval = setInterval(async () => {
      if (isModalOpen) {
        await checkOrderStatusFromDB();
      }
    }, 5000);

    return () => clearInterval(statusCheckInterval);
  }, [paymentData, isModalOpen]);

  // Check order status from our database (updated by webhook)
  const checkOrderStatusFromDB = async () => {
    if (checking || !isModalOpen) return;

    setChecking(true);
    try {
      const order = await api.getOrder(paymentData.orderId);
      console.log('Order status from DB:', order);

      // Check if webhook has updated the order to any final status
      const finalStatuses = ['paid', 'refunded', 'failed'];
      if (order && finalStatuses.includes(order.paymentStatus)) {
        console.log(`Payment ${order.paymentStatus}! Redirecting to success page...`);
        setIsModalOpen(false); // Stop further checks
        onSuccess(paymentData.orderId);
      } else {
        console.log(`Payment status: ${order?.paymentStatus || 'pending'}`);
      }
    } catch (error) {
      console.error('Failed to check order status:', error);
    } finally {
      setChecking(false);
    }
  };

  // Manual status check via PaymentGateway API (fallback)
  const checkPaymentStatus = async () => {
    if (checking || !isModalOpen) return;

    setChecking(true);
    try {
      const status = await onCheckStatus(paymentData.txnRefId);
      console.log('Payment status check result:', status);

      // Check payment status from response
      if (status && status.success) {
        const paymentStatus = status.status?.toUpperCase();
        console.log('Received payment status:', paymentStatus);

        // Handle all final statuses
        if (paymentStatus === 'SUCCESS') {
          console.log('Payment successful! Redirecting...');
          setIsModalOpen(false);
          onSuccess(paymentData.orderId);
        } else if (paymentStatus === 'REFUNDED') {
          console.log('Payment refunded! Redirecting...');
          setIsModalOpen(false);
          onSuccess(paymentData.orderId);
        } else if (paymentStatus === 'FAILED' || paymentStatus === 'FAILURE') {
          console.log('Payment failed! Redirecting...');
          setIsModalOpen(false);
          onSuccess(paymentData.orderId);
        } else if (paymentStatus === 'PENDING' || paymentStatus === 'INITIATED' || paymentStatus === 'HOLD') {
          console.log('Payment still pending...');
          // Don't close modal, keep checking
        } else {
          console.log('Unknown status:', paymentStatus);
        }
      }
    } catch (error) {
      console.error('Failed to check payment status:', error);
    } finally {
      setChecking(false);
    }
  };

  const handleClose = () => {
    setIsModalOpen(false); // Stop status checks
    onClose();
    // Redirect to profile orders page when user closes QR without payment
    navigate('/profile?tab=orders');
  };

  const handleMobileRedirect = () => {
    setRedirecting(true);
    // Redirect to UPI payment app
    window.location.href = paymentData.paymentUrl;

    // After 3 seconds, start checking payment status
    setTimeout(() => {
      setRedirecting(false);
    }, 3000);
  };

  return (
    <Modal open onClose={handleClose} dismissible={false} size="sm" label="Complete payment">
      <div className="relative p-6 sm:p-8">
        <button onClick={handleClose} className="icon-btn absolute right-3 top-3" aria-label="Close payment window">
          <X className="h-5 w-5" />
        </button>

        {/* Amount */}
        <div className="text-center">
          <span className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-stone-950 text-gold-400">
            {isMobile ? <Smartphone className="h-6 w-6" /> : <QrCode className="h-6 w-6" />}
          </span>
          <p className="eyebrow">Complete your payment</p>
          <p className="mt-2 font-display text-4xl font-semibold tabular-nums text-stone-950">
            {formatINR(paymentData.amount, true)}
          </p>
          <p className="mt-2 text-xs text-stone-500">
            Ref: <span className="font-mono text-stone-700">{paymentData.txnRefId}</span>
          </p>
        </div>

        {isMobile ? (
          /* Mobile: hand off to a UPI app */
          <div className="mt-7 space-y-6">
            <button onClick={handleMobileRedirect} disabled={redirecting} className="btn-primary btn-lg w-full">
              {redirecting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Opening payment app…
                </>
              ) : (
                <>
                  <Smartphone className="h-5 w-5" />
                  Pay with UPI app
                </>
              )}
            </button>
            <div className="rounded-2xl bg-cream-100 p-4">
              <Steps steps={MOBILE_STEPS} />
            </div>
          </div>
        ) : (
          /* Desktop: scan the QR code */
          <div className="mt-7 space-y-5">
            <div className="rounded-3xl bg-cream-100 p-5">
              <div className="mx-auto w-fit rounded-2xl bg-white p-3 shadow-soft">
                {qrCodeUrl ? (
                  <img src={qrCodeUrl} alt="Payment QR code" className="h-56 w-56" />
                ) : (
                  <div className="grid h-56 w-56 place-items-center">
                    <Loader2 className="h-8 w-8 animate-spin text-stone-400" />
                  </div>
                )}
              </div>
            </div>
            <Steps steps={DESKTOP_STEPS} />
            <div className="flex flex-wrap justify-center gap-2">
              {UPI_APPS.map((app) => (
                <span key={app} className="badge bg-white text-stone-600 ring-1 ring-inset ring-stone-200">
                  {app}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Status Check Button */}
        <button onClick={checkPaymentStatus} disabled={checking} className="btn-outline mt-6 w-full">
          {checking ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Checking payment status…
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4" />
              Check payment status
            </>
          )}
        </button>

        {/* Footer Info */}
        <div className="mt-6 border-t border-stone-200 pt-5 text-center">
          <p className="flex items-center justify-center gap-1.5 text-xs font-medium text-stone-600">
            <Lock className="h-3.5 w-3.5 text-emerald-600" />
            Secure payment powered by PaymentGateway
          </p>
          <p className="mt-1 text-xs text-stone-400">Please don't refresh or close this page until payment is complete.</p>
        </div>
      </div>
    </Modal>
  );
}
