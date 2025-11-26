/**
 * Checkout Page - Enter details for plan purchase
 * MVP version - no backend integration
 */
import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';

interface PlanDetails {
  id: string;
  name: string;
  price: number;
  model: 'school' | 'individual' | 'ministry';
  studentRange: string;
}

export const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sevisPassId, setSevisPassId] = useState('');
  const [password, setPassword] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [plan, setPlan] = useState<PlanDetails | null>(null);

  useEffect(() => {
    // Get plan details from location state
    const planData = location.state as PlanDetails | null;
    if (planData) {
      setPlan(planData);
    } else {
      // If no plan selected, redirect to billing
      navigate('/billing');
    }
  }, [location, navigate]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-PG', {
      style: 'currency',
      currency: 'PGK',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!sevisPassId.trim() || !password.trim() || !cardNumber.trim()) {
      alert('Please fill in all fields');
      return;
    }

    // Show verification modal
    setShowVerificationModal(true);
  };

  const handleVerificationClose = () => {
    setShowVerificationModal(false);
    // Redirect to login page after a short delay
    setTimeout(() => {
      navigate('/login');
    }, 500);
  };

  const formatCardNumber = (value: string) => {
    // Remove all non-digits
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    // Add spaces every 4 digits
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCardNumber(e.target.value);
    setCardNumber(formatted);
  };

  if (!plan) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
        <div className="container mx-auto px-4 py-12 max-w-4xl">
          {/* Back Link */}
          <Link
            to="/billing"
            className="inline-flex items-center text-primary-600 hover:text-primary-700 mb-6 transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Pricing
          </Link>

          {/* Page Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Complete Your Purchase</h1>
            <p className="text-gray-600">Enter your details to proceed with your selected plan</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Selected Plan Summary */}
            <div className="md:col-span-1">
              <div className="bg-white rounded-xl shadow-lg border-2 border-primary-500 p-6 sticky top-24">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Selected Plan</h3>
                <div className="mb-4">
                  <p className="text-2xl font-bold text-gray-900 mb-1">{plan.name}</p>
                  <p className="text-sm text-gray-600 mb-4">{plan.studentRange}</p>
                  <div className="mb-2">
                    <span className="text-3xl font-bold text-primary-600">
                      {formatPrice(plan.price)}
                    </span>
                    <span className="text-gray-600 ml-2">/year</span>
                  </div>
                </div>
                <div className="pt-4 border-t border-gray-200">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-semibold text-gray-900">{formatPrice(plan.price)}</span>
                  </div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">Tax</span>
                    <span className="font-semibold text-gray-900">Included</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold pt-4 border-t border-gray-200">
                    <span className="text-gray-900">Total</span>
                    <span className="text-primary-600">{formatPrice(plan.price)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Checkout Form */}
            <div className="md:col-span-2">
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Payment Details</h2>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* SevisPass Digital ID */}
                  <div>
                    <label htmlFor="sevisPassId" className="block text-sm font-medium text-gray-700 mb-2">
                      SevisPass Digital ID *
                    </label>
                    <input
                      id="sevisPassId"
                      type="text"
                      value={sevisPassId}
                      onChange={(e) => setSevisPassId(e.target.value)}
                      placeholder="Enter your SevisPass Digital ID"
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                    />
                  </div>

                  {/* Password */}
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                      Password *
                    </label>
                    <input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                    />
                  </div>

                  {/* Card Number */}
                  <div>
                    <label htmlFor="cardNumber" className="block text-sm font-medium text-gray-700 mb-2">
                      Card Number *
                    </label>
                    <input
                      id="cardNumber"
                      type="text"
                      value={cardNumber}
                      onChange={handleCardNumberChange}
                      placeholder="1234 5678 9012 3456"
                      maxLength={19}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                    />
                    <p className="text-xs text-gray-500 mt-2">Enter your 16-digit card number</p>
                  </div>

                  {/* Security Note */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start">
                      <svg className="w-5 h-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      <p className="text-sm text-blue-800">
                        Your payment information is secure and encrypted. This is an MVP demo - no actual charges will be made.
                      </p>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    className="w-full bg-gradient-to-r from-primary-500 to-primary-600 text-white py-4 px-6 rounded-lg hover:from-primary-600 hover:to-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-all font-semibold shadow-lg hover:shadow-xl text-lg"
                  >
                    Complete Purchase
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />

      {/* Verification Modal */}
      {showVerificationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-8 text-center">
            <div className="mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                SevisPass Identity Verified
              </h3>
              <p className="text-gray-600">
                Your SevisPass identity has been successfully verified. You will be redirected to the login page.
              </p>
            </div>
            <button
              onClick={handleVerificationClose}
              className="w-full bg-primary-600 text-white py-3 px-6 rounded-lg hover:bg-primary-700 transition-colors font-medium"
            >
              Continue to Login
            </button>
          </div>
        </div>
      )}
    </>
  );
};

