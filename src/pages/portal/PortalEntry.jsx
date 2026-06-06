import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { portalAPI } from '../../services/api';

export default function PortalEntry() {
  const { companyId } = useParams();
  const navigate = useNavigate();

  const [company, setCompany] = useState(null);
  const [step, setStep] = useState('email'); // email | login | register-sent | forgot-sent
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showForgot, setShowForgot] = useState(false);

  const color = company?.color || '#ea4e00';

  useEffect(() => {
    // Redirect if already logged in
    const token = localStorage.getItem('portal_token');
    const stored = localStorage.getItem('portal_company');
    if (token && stored === companyId) {
      navigate(`/portal/${companyId}/dashboard`, { replace: true });
      return;
    }
    portalAPI.getInfo(companyId)
      .then(res => setCompany(res.data))
      .catch(() => setError('Company not found.'));
  }, [companyId]);

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return setError('Please enter your email address.');
    setError(''); setLoading(true);
    try {
      const res = await portalAPI.checkEmail(companyId, email.trim());
      if (res.data.exists) {
        setStep('login');
      } else {
        setStep('new-user');
      }
    } catch (err) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await portalAPI.register(companyId, { email: email.trim(), name: name.trim() });
      setStep('register-sent');
    } catch (err) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!password) return setError('Please enter your password.');
    setError(''); setLoading(true);
    try {
      const res = await portalAPI.login(companyId, { email: email.trim(), password });
      localStorage.setItem('portal_token', res.data.token);
      localStorage.setItem('portal_customer', JSON.stringify(res.data.customer));
      localStorage.setItem('portal_company', companyId);
      navigate(`/portal/${companyId}/dashboard`);
    } catch (err) {
      setError(err.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const res = await portalAPI.forgotPassword(companyId, email.trim());
      setSuccessMsg(res.message);
      setShowForgot(false);
      setStep('forgot-sent');
    } catch (err) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  if (error === 'Company not found.') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Support portal not found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      {/* Header */}
      <div className="w-full max-w-md mb-8 text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4 shadow"
          style={{ background: color }}>
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">{company?.name || '...'}</h1>
        <p className="text-gray-500 mt-1">Customer Support Portal</p>
      </div>

      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-200 p-8">

        {/* Step: email */}
        {step === 'email' && (
          <>
            <h2 className="text-lg font-semibold text-gray-900 mb-1">Get started</h2>
            <p className="text-sm text-gray-500 mb-6">Enter your email to continue</p>
            {error && <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg">{error}</div>}
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email address</label>
                <input type="email" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:border-transparent"
                  style={{ '--tw-ring-color': color }}
                  placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required autoFocus />
              </div>
              <button type="submit" disabled={loading}
                className="w-full py-2.5 rounded-lg text-white text-sm font-semibold transition-opacity disabled:opacity-60"
                style={{ background: color }}>
                {loading ? 'Checking...' : 'Continue'}
              </button>
            </form>
          </>
        )}

        {/* Step: new user — register */}
        {step === 'new-user' && (
          <>
            <h2 className="text-lg font-semibold text-gray-900 mb-1">Create your account</h2>
            <p className="text-sm text-gray-500 mb-6">
              <strong>{email}</strong> is not registered yet. Enter your name and we'll send your password by email.
            </p>
            {error && <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg">{error}</div>}
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Your name</label>
                <input type="text" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:border-transparent"
                  placeholder="John Doe" value={name} onChange={e => setName(e.target.value)} autoFocus />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input type="email" className="w-full border border-gray-200 bg-gray-50 rounded-lg px-3 py-2 text-sm text-gray-500 cursor-not-allowed"
                  value={email} readOnly />
              </div>
              <button type="submit" disabled={loading}
                className="w-full py-2.5 rounded-lg text-white text-sm font-semibold transition-opacity disabled:opacity-60"
                style={{ background: color }}>
                {loading ? 'Creating account...' : 'Create Account & Send Password'}
              </button>
              <button type="button" onClick={() => { setStep('email'); setError(''); }}
                className="w-full text-sm text-gray-500 hover:text-gray-700 text-center">
                ← Use a different email
              </button>
            </form>
          </>
        )}

        {/* Step: register sent */}
        {step === 'register-sent' && (
          <div className="text-center">
            <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: color + '20' }}>
              <svg className="w-7 h-7" fill="none" stroke={color} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Check your email</h2>
            <p className="text-sm text-gray-500 mb-6">
              Your account has been created. We've sent your password to <strong>{email}</strong>. Use it to log in below.
            </p>
            <button onClick={() => setStep('login')}
              className="w-full py-2.5 rounded-lg text-white text-sm font-semibold"
              style={{ background: color }}>
              Go to Login
            </button>
          </div>
        )}

        {/* Step: login */}
        {step === 'login' && !showForgot && (
          <>
            <h2 className="text-lg font-semibold text-gray-900 mb-1">Welcome back</h2>
            <p className="text-sm text-gray-500 mb-6">Logging in as <strong>{email}</strong></p>
            {error && <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg">{error}</div>}
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-gray-700">Password</label>
                  <button type="button" onClick={() => { setShowForgot(true); setError(''); }}
                    className="text-xs font-medium hover:underline" style={{ color }}>
                    Forgot password?
                  </button>
                </div>
                <input type="password" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:border-transparent"
                  placeholder="Enter your password" value={password} onChange={e => setPassword(e.target.value)} required autoFocus />
              </div>
              <button type="submit" disabled={loading}
                className="w-full py-2.5 rounded-lg text-white text-sm font-semibold transition-opacity disabled:opacity-60"
                style={{ background: color }}>
                {loading ? 'Logging in...' : 'Log In'}
              </button>
              <button type="button" onClick={() => { setStep('email'); setPassword(''); setError(''); }}
                className="w-full text-sm text-gray-500 hover:text-gray-700 text-center">
                ← Use a different email
              </button>
            </form>
          </>
        )}

        {/* Forgot password form */}
        {step === 'login' && showForgot && (
          <>
            <h2 className="text-lg font-semibold text-gray-900 mb-1">Reset password</h2>
            <p className="text-sm text-gray-500 mb-6">
              We'll generate a new password and send it to <strong>{email}</strong>.
            </p>
            {error && <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg">{error}</div>}
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <button type="submit" disabled={loading}
                className="w-full py-2.5 rounded-lg text-white text-sm font-semibold transition-opacity disabled:opacity-60"
                style={{ background: color }}>
                {loading ? 'Sending...' : 'Send New Password'}
              </button>
              <button type="button" onClick={() => { setShowForgot(false); setError(''); }}
                className="w-full text-sm text-gray-500 hover:text-gray-700 text-center">
                ← Back to login
              </button>
            </form>
          </>
        )}

        {/* Forgot password sent */}
        {step === 'forgot-sent' && (
          <div className="text-center">
            <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: color + '20' }}>
              <svg className="w-7 h-7" fill="none" stroke={color} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">New password sent</h2>
            <p className="text-sm text-gray-500 mb-6">{successMsg || 'Check your email for your new password.'}</p>
            <button onClick={() => { setStep('login'); setShowForgot(false); }}
              className="w-full py-2.5 rounded-lg text-white text-sm font-semibold"
              style={{ background: color }}>
              Go to Login
            </button>
          </div>
        )}
      </div>

      <p className="mt-6 text-xs text-gray-400">Powered by SBIT - Live Chat</p>
    </div>
  );
}
