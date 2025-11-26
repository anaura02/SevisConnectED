/**
 * Billing Page - Pricing Plans
 * Modern pricing page with multiple pricing models
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';

export const BillingPage: React.FC = () => {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<'school' | 'individual' | 'ministry'>('school');

  const schoolPlans = [
    {
      id: 'small',
      name: 'Small Secondary',
      studentRange: '100–300 students',
      price: 5000,
      perStudent: 'PGK 16–50',
      features: [
        'Full access to all features',
        'AI-powered study plans',
        'Progress tracking',
        'AI Tutor support',
        'Email support',
      ],
      popular: false,
    },
    {
      id: 'medium',
      name: 'Medium Secondary',
      studentRange: '300–800 students',
      price: 10000,
      perStudent: 'PGK 12–33',
      features: [
        'Everything in Small',
        'Priority support',
        'Advanced analytics',
        'Custom branding options',
        'Dedicated account manager',
      ],
      popular: true,
    },
    {
      id: 'large',
      name: 'Large Secondary',
      studentRange: '800–1500 students',
      price: 18000,
      perStudent: 'PGK 12–22',
      features: [
        'Everything in Medium',
        'API access',
        'Custom integrations',
        'Training sessions',
        '24/7 support',
      ],
      popular: false,
    },
    {
      id: 'whole',
      name: 'Whole-of-School License',
      studentRange: 'Unlimited students',
      price: 25000,
      perStudent: 'Best value',
      features: [
        'Everything in Large',
        'Unlimited students',
        'Multi-campus support',
        'Custom development',
        'NDoE compliance tools',
      ],
      popular: false,
    },
  ];

  const individualPlans = [
    {
      id: 'individual-1',
      name: 'Individual',
      studentRange: '1 person',
      price: 450,
      perStudent: 'Per year',
      features: [
        'Personalized study plans',
        'AI Tutor access',
        'Progress tracking',
        'Practice exercises',
        'Email support',
      ],
      popular: false,
    },
    {
      id: 'individual-3',
      name: 'Small Group',
      studentRange: '3–5 people',
      price: 450,
      perStudent: 'Per year',
      features: [
        'Everything in Individual',
        'Group progress tracking',
        'Shared study plans',
        'Priority support',
      ],
      popular: true,
    },
    {
      id: 'individual-10',
      name: 'Large Group',
      studentRange: '10–15 people',
      price: 850,
      perStudent: 'Per year',
      features: [
        'Everything in Small Group',
        'Advanced analytics',
        'Bulk management',
        'Dedicated support',
      ],
      popular: false,
    },
  ];

  const ministryPlans = [
    {
      id: 'provincial',
      name: 'Provincial License',
      studentRange: 'All Grade 11–12 students in province',
      price: 300000,
      perStudent: 'Per year',
      features: [
        'Unlimited students province-wide',
        'Provincial analytics dashboard',
        'NDoE compliance reporting',
        'Custom curriculum alignment',
        'Dedicated support team',
        'Training & onboarding',
        'Multi-school management',
      ],
      popular: false,
    },
    {
      id: 'national',
      name: 'National License',
      studentRange: 'Entire country',
      price: 3500000,
      perStudent: 'Per year',
      features: [
        'Everything in Provincial',
        'National-level analytics',
        'Custom development',
        'API & integrations',
        'White-label options',
        '24/7 priority support',
        'NDoE partnership',
        'DICT integration',
      ],
      popular: true,
    },
  ];

  const getCurrentPlans = () => {
    switch (selectedModel) {
      case 'school':
        return schoolPlans;
      case 'individual':
        return individualPlans;
      case 'ministry':
        return ministryPlans;
      default:
        return schoolPlans;
    }
  };

  const handleSelectPlan = (planId: string) => {
    setSelectedPlan(planId);
    // Here you would typically redirect to checkout or payment page
    console.log('Selected plan:', planId);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-PG', {
      style: 'currency',
      currency: 'PGK',
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="container mx-auto px-4 py-12 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Select the perfect plan for your needs. All plans include full access to AI-powered learning features.
          </p>
        </div>

        {/* Pricing Model Tabs */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex bg-white rounded-lg p-1 shadow-md border border-gray-200">
            <button
              onClick={() => setSelectedModel('school')}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${
                selectedModel === 'school'
                  ? 'bg-primary-600 text-white shadow-lg'
                  : 'text-gray-700 hover:text-primary-600'
              }`}
            >
              School Licensing
            </button>
            <button
              onClick={() => setSelectedModel('individual')}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${
                selectedModel === 'individual'
                  ? 'bg-primary-600 text-white shadow-lg'
                  : 'text-gray-700 hover:text-primary-600'
              }`}
            >
              Individual Plans
            </button>
            <button
              onClick={() => setSelectedModel('ministry')}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${
                selectedModel === 'ministry'
                  ? 'bg-primary-600 text-white shadow-lg'
                  : 'text-gray-700 hover:text-primary-600'
              }`}
            >
              Ministry/Provincial
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className={`grid gap-8 ${
          selectedModel === 'ministry' 
            ? 'md:grid-cols-2 max-w-5xl mx-auto' 
            : selectedModel === 'individual'
            ? 'md:grid-cols-3 max-w-6xl mx-auto'
            : 'md:grid-cols-2 lg:grid-cols-4'
        }`}>
          {getCurrentPlans().map((plan) => (
            <div
              key={plan.id}
              className={`relative bg-white rounded-2xl shadow-lg border-2 transition-all hover:shadow-2xl ${
                plan.popular
                  ? 'border-primary-500 scale-105'
                  : 'border-gray-200 hover:border-primary-300'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gradient-to-r from-primary-500 to-primary-600 text-white px-4 py-1 rounded-full text-sm font-semibold shadow-lg">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="p-8">
                {/* Plan Header */}
                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <p className="text-gray-600 text-sm mb-4">{plan.studentRange}</p>
                  
                  {/* Price */}
                  <div className="mb-2">
                    <span className="text-4xl font-bold text-gray-900">
                      {formatPrice(plan.price)}
                    </span>
                    <span className="text-gray-600 ml-2">/year</span>
                  </div>
                  <p className="text-sm text-gray-500">{plan.perStudent}</p>
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <svg
                        className="w-5 h-5 text-primary-600 mr-3 mt-0.5 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                <button
                  onClick={() => handleSelectPlan(plan.id)}
                  className={`w-full py-3 px-6 rounded-lg font-semibold transition-all ${
                    plan.popular
                      ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white hover:from-primary-600 hover:to-primary-700 shadow-lg hover:shadow-xl'
                      : 'bg-gray-100 text-gray-900 hover:bg-primary-50 hover:text-primary-600 border-2 border-gray-200 hover:border-primary-300'
                  }`}
                >
                  {selectedPlan === plan.id ? 'Selected' : 'Select Plan'}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Additional Info */}
        <div className="mt-16 text-center">
          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-8 max-w-4xl mx-auto">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Need Help Choosing?
            </h3>
            <p className="text-gray-600 mb-6">
              Contact our sales team to discuss which plan is best for your needs. We offer custom pricing for large deployments.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <a
                href="mailto:sales@aiteacher.pg"
                className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors font-medium"
              >
                Contact Sales
              </a>
              <Link
                to="/dashboard"
                className="bg-gray-100 text-gray-900 px-6 py-3 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-16 max-w-4xl mx-auto">
          <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            Frequently Asked Questions
          </h3>
          <div className="space-y-4">
            <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
              <h4 className="font-semibold text-gray-900 mb-2">
                Can I change plans later?
              </h4>
              <p className="text-gray-600">
                Yes, you can upgrade or downgrade your plan at any time. Changes will be prorated.
              </p>
            </div>
            <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
              <h4 className="font-semibold text-gray-900 mb-2">
                What payment methods do you accept?
              </h4>
              <p className="text-gray-600">
                We accept bank transfers, credit cards, and can arrange invoicing for institutional purchases.
              </p>
            </div>
            <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
              <h4 className="font-semibold text-gray-900 mb-2">
                Is there a free trial?
              </h4>
              <p className="text-gray-600">
                Yes, schools can request a 30-day free trial. Contact us to get started.
              </p>
            </div>
          </div>
        </div>
      </div>
      <Footer />
      </div>
    </>
  );
};

