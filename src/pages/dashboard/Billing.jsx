import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { billingAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const CheckIcon = () => (
  <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

export default function Billing() {
  const { user } = useAuth();
  const [cycle, setCycle] = useState('monthly');

  const { data: plansData } = useQuery({ queryKey: ['plans'], queryFn: billingAPI.getPlans });
  const { data: subData } = useQuery({ queryKey: ['subscription'], queryFn: billingAPI.getSubscription });

  const plans = plansData?.data || [];
  const sub = subData?.data?.subscription;
  const currentPlan = user?.company?.plan || 'free';

  const checkoutMutation = useMutation({
    mutationFn: billingAPI.createCheckout,
    onSuccess: (res) => {
      if (res.data?.url) window.location.href = res.data.url;
    },
    onError: err => toast.error(err.message || 'Failed to start checkout. Please configure Stripe keys.'),
  });

  const portalMutation = useMutation({
    mutationFn: billingAPI.createPortal,
    onSuccess: (res) => {
      if (res.data?.url) window.location.href = res.data.url;
    },
    onError: err => toast.error(err.message || 'Portal unavailable. Please configure Stripe.'),
  });

  const planFeatures = {
    free: ['1 Agent', '100 Chats/month', 'Basic Analytics', 'Visitor Tracking', 'Ticket System', 'Email Notifications'],
    pro: ['5 Agents', '5,000 Chats/month', 'Advanced Analytics', 'Custom Branding', 'File Uploads', 'Widget Customization', 'Priority Support'],
    business: ['Unlimited Agents', 'Unlimited Chats', 'Full Analytics Suite', 'API Access', 'Custom Integrations', 'White-label Widget', 'Dedicated Support', 'SLA Guarantee'],
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Billing & Plans</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Current plan: <span className="font-semibold text-primary-600 capitalize">{currentPlan}</span>
          {sub?.currentPeriodEnd && <span className="text-gray-400"> · Renews {new Date(sub.currentPeriodEnd).toLocaleDateString()}</span>}
        </p>
      </div>

      {(currentPlan === 'pro' || currentPlan === 'business') && (
        <div className="card p-4 mb-6 flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="font-medium text-gray-900 dark:text-white">Manage your subscription</p>
            <p className="text-sm text-gray-500">Update payment method, view invoices, change plan</p>
          </div>
          <button onClick={() => portalMutation.mutate()} className="btn-secondary" disabled={portalMutation.isPending}>
            {portalMutation.isPending ? 'Opening...' : 'Billing Portal →'}
          </button>
        </div>
      )}

      <div className="flex items-center justify-center mb-8">
        <div className="flex bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
          <button onClick={() => setCycle('monthly')}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${cycle === 'monthly' ? 'bg-white dark:bg-gray-700 shadow text-gray-900 dark:text-white' : 'text-gray-500'}`}>
            Monthly
          </button>
          <button onClick={() => setCycle('annual')}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${cycle === 'annual' ? 'bg-white dark:bg-gray-700 shadow text-gray-900 dark:text-white' : 'text-gray-500'}`}>
            Annual <span className="text-green-500 text-xs font-semibold">Save 17%</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map(plan => {
          const isCurrent = currentPlan === plan.id;
          const price = cycle === 'annual' ? plan.price.annual : plan.price.monthly;
          const features = planFeatures[plan.id] || [];

          return (
            <div key={plan.id} className={`card p-6 relative ${plan.popular ? 'border-2 border-primary-500 shadow-lg' : ''}`}>
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-primary-600 text-white text-xs font-bold px-3 py-1 rounded-full">Most Popular</span>
                </div>
              )}
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">{plan.name}</h3>
              <div className="mt-3 mb-5">
                {price === 0 ? (
                  <span className="text-3xl font-bold text-gray-900 dark:text-white">Free</span>
                ) : (
                  <div className="flex items-end gap-1">
                    <span className="text-3xl font-bold text-gray-900 dark:text-white">${price}</span>
                    <span className="text-gray-500 mb-1">/{cycle === 'annual' ? 'yr' : 'mo'}</span>
                  </div>
                )}
              </div>
              <ul className="space-y-2.5 mb-6">
                {features.map((f, i) => (
                  <li key={i} className="flex items-center gap-2.5 text-sm text-gray-600 dark:text-gray-400">
                    <CheckIcon />
                    {f}
                  </li>
                ))}
              </ul>
              {isCurrent ? (
                <button disabled className="btn-secondary w-full opacity-60 cursor-not-allowed">Current Plan</button>
              ) : plan.id === 'free' ? (
                <button disabled className="btn-secondary w-full">Downgrade to Free</button>
              ) : (
                <button
                  onClick={() => checkoutMutation.mutate({ plan: plan.id, billingCycle: cycle })}
                  disabled={checkoutMutation.isPending}
                  className={plan.popular ? 'btn-primary w-full' : 'btn-secondary w-full'}
                >
                  {checkoutMutation.isPending ? 'Processing...' : `Upgrade to ${plan.name}`}
                </button>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-8 card p-5 bg-gray-50 dark:bg-gray-800/50">
        <p className="text-center text-sm text-gray-500 dark:text-gray-400">
          All plans include SSL encryption, 99.9% uptime SLA, and GDPR compliance.
          Questions? <a href="mailto:support@livechat.com" className="text-primary-600 hover:underline">Contact Support</a>
        </p>
      </div>
    </div>
  );
}
