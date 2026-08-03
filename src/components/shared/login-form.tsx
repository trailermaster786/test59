'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/stores/app-store';
import { Input } from '@/components/ui/input';
import { Droplets, Loader2, ArrowRight, Sparkles, Shield, Truck, Package } from 'lucide-react';
import { toast } from 'sonner';

export default function LoginForm() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [loading, setLoading] = useState(false);
  const { setUser, setPortal } = useAppStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = isSignUp ? '/api/auth/signup' : '/api/auth/login';
      const body = isSignUp
        ? { name, email, password, phone, address: address || undefined, city: city || undefined }
        : { email, password };

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.error?.includes('sign up')) {
          toast.error(data.error, { action: { label: 'Sign Up', onClick: () => setIsSignUp(true) } });
        } else {
          throw new Error(data.error || 'Failed to authenticate');
        }
        return;
      }

      setUser(data.user);
      setPortal(data.user.role as 'customer' | 'admin' | 'driver');
      toast.success(isSignUp ? 'Account created!' : 'Welcome back!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (demoEmail: string, demoPassword: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: demoEmail, password: demoPassword }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setUser(data.user);
      setPortal(data.user.role as 'customer' | 'admin' | 'driver');
      toast.success('Welcome!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const demoAccounts = [
    { label: 'Admin', email: 'admin@gmail.com', password: 'admin123', icon: Shield, color: 'from-violet-500 to-purple-600' },
    { label: 'Driver', email: 'driver@gmail.com', password: 'driver123', icon: Truck, color: 'from-orange-500 to-amber-600' },
    { label: 'Customer', email: 'customer@gmail.com', password: 'customer123', icon: Package, color: 'from-cyan-500 to-blue-600' },
  ];

  return (
    <div className="min-h-screen gradient-mesh flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background */}
      <div className="animated-bg" />
      <div className="aurora" />

      {/* Floating Particles */}
      {mounted && (
        <div className="particles">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="particle"
              style={{
                left: `${Math.random() * 100}%`,
                animationDuration: `${10 + Math.random() * 20}s`,
                animationDelay: `${Math.random() * 10}s`,
                opacity: 0.3 + Math.random() * 0.5,
                width: `${2 + Math.random() * 4}px`,
                height: `${2 + Math.random() * 4}px`,
              }}
            />
          ))}
        </div>
      )}

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-8"
        >
          <motion.div
            className="inline-flex items-center justify-center w-20 h-20 rounded-3xl gradient-water shadow-lg shadow-cyan-500/30 mb-4"
            whileHover={{ scale: 1.1, rotate: 5 }}
            whileTap={{ scale: 0.95 }}
          >
            <Droplets className="w-10 h-10 text-white" />
          </motion.div>
          <motion.h1
            className="text-4xl font-bold text-shimmer"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            AquaTrack
          </motion.h1>
          <motion.p
            className="text-gray-400 mt-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            Smart Water Factory & Logistics
          </motion.p>
        </motion.div>

        {/* Demo Quick Login */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="card-modern p-6 mb-6 gradient-border"
        >
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span className="text-sm font-medium text-gray-300">Quick Demo Login</span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {demoAccounts.map((account, i) => (
              <motion.button
                key={account.label}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 + i * 0.1 }}
                whileHover={{ scale: 1.05, y: -4 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleDemoLogin(account.email, account.password)}
                disabled={loading}
                className={`relative overflow-hidden rounded-xl p-4 bg-gradient-to-br ${account.color} text-white font-medium transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/25`}
              >
                <div className="flex flex-col items-center gap-2">
                  <account.icon className="w-6 h-6" />
                  <span className="text-sm">{account.label}</span>
                </div>
                {loading && (
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                    <Loader2 className="w-5 h-5 animate-spin" />
                  </div>
                )}
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Login/SignUp Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="card-modern p-6 gradient-border"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={isSignUp ? 'signup' : 'login'}
              initial={{ opacity: 0, x: isSignUp ? 20 : -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: isSignUp ? -20 : 20 }}
              transition={{ duration: 0.3 }}
            >
              <h2 className="text-xl font-bold text-white mb-1">
                {isSignUp ? 'Create Account' : 'Welcome Back'}
              </h2>
              <p className="text-sm text-gray-400 mb-6">
                {isSignUp ? 'Enter your details to get started' : 'Sign in to your account'}
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <AnimatePresence>
                  {isSignUp && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-4"
                    >
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">Name</label>
                        <Input
                          type="text"
                          placeholder="Your nickname (e.g. ahmed12345)"
                          value={name}
                          onChange={(e) => {
                            const val = e.target.value.replace(/[^a-zA-Z0-9]/g, '');
                            setName(val);
                            if (isSignUp && val) {
                              setEmail(`${val}@customer.com`);
                            }
                          }}
                          required
                          className="input-modern"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">Phone</label>
                        <Input
                          type="tel"
                          placeholder="+971..."
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="input-modern"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">Address (optional)</label>
                        <Input
                          type="text"
                          placeholder="Street address"
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          className="input-modern"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">City (optional)</label>
                        <Input
                          type="text"
                          placeholder="Your city"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          className="input-modern"
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">Email</label>
                  <Input
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => !isSignUp && setEmail(e.target.value)}
                    readOnly={isSignUp}
                    required
                    className={`input-modern ${isSignUp ? 'opacity-70 cursor-not-allowed' : ''}`}
                  />
                  {isSignUp && name && (
                    <p className="text-xs text-cyan-400">Your email will be: {email}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">Password</label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="input-modern"
                  />
                </div>

                <motion.button
                  type="submit"
                  disabled={loading}
                  className="w-full btn-primary flex items-center justify-center gap-2"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      {isSignUp ? 'Create Account' : 'Sign In'}
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </motion.button>
              </form>

              <div className="mt-6 text-center">
                <button
                  type="button"
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                  {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
                </button>
              </div>
            </motion.div>
          </AnimatePresence>
        </motion.div>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="text-center text-xs text-gray-500 mt-6"
        >
          AquaTrack v1.0 - Smart Water Management
        </motion.p>
      </div>
    </div>
  );
}
