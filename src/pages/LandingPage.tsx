import { useNavigate } from 'react-router-dom'
import { Phone, BarChart3, Zap, Shield, ArrowRight, Check } from 'lucide-react'

export function LandingPage() {
  const navigate = useNavigate()

  const features = [
    { icon: Phone, title: 'AI-Powered Calls', description: 'Intelligent call handling with natural conversations' },
    { icon: BarChart3, title: 'Analytics', description: 'Real-time insights into call performance and metrics' },
    { icon: Zap, title: 'Fast & Reliable', description: 'Lightning-fast response times with 99.9% uptime' },
    { icon: Shield, title: 'Secure', description: 'Enterprise-grade security and data protection' },
  ]

  const pricingPlans = [
    {
      name: 'Basic',
      price: '$99',
      calls: '1,000 calls/month',
      features: ['Call handling', 'Basic analytics', 'Email support'],
    },
    {
      name: 'Professional',
      price: '$299',
      calls: '5,000 calls/month',
      features: ['Call handling', 'Advanced analytics', '24/7 support', 'Custom workflows'],
      popular: true,
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      calls: 'Unlimited calls',
      features: ['Everything in Pro', 'Dedicated support', 'Custom integration', 'SLA guarantee'],
    },
  ]

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900">
      {/* Navigation */}
      <nav className="sticky top-0 z-40 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-primary">CallAI</h1>
          <button
            onClick={() => navigate('/login')}
            className="bg-indigo-600 dark:bg-indigo-500 text-white px-6 py-2 rounded-lg hover:opacity-90 transition-opacity"
          >
            Login
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-6 py-20 text-center space-y-6">
        <div>
          <h2 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-4">
            AI-Powered Call Handling for Your Business
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Automate customer interactions, boost sales, and provide 24/7 support with our intelligent AI system
          </p>
        </div>

        <div className="flex gap-4 justify-center pt-8">
          <button
            onClick={() => navigate('/login')}
            className="flex items-center gap-2 bg-indigo-600 dark:bg-indigo-500 text-white px-8 py-3 rounded-lg hover:opacity-90 transition-opacity font-medium"
          >
            Get Started
            <ArrowRight size={20} />
          </button>
          <button
            onClick={() => navigate('/call-simulator')}
            className="border-2 border-indigo-600 dark:border-indigo-500 text-indigo-600 dark:text-indigo-400 px-8 py-3 rounded-lg hover:bg-indigo-50 dark:hover:bg-slate-800 transition-colors font-medium"
          >
            Try Call Simulator
          </button>
        </div>

        {/* Hero Image Placeholder */}
        <div className="mt-16 bg-linear-to-br from-primary/10 to-indigo-200/10 dark:from-primary/20 dark:to-slate-800 rounded-2xl h-96 flex items-center justify-center">
          <div className="text-center text-gray-400">
            <Phone size={64} className="mx-auto mb-4 opacity-40" />
            <p>Dashboard Preview</p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-gray-50 dark:bg-slate-800 py-20">
        <div className="max-w-6xl mx-auto px-6 space-y-12">
          <div className="text-center space-y-4">
            <h3 className="text-4xl font-bold text-gray-900 dark:text-white">
              Powerful Features
            </h3>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              Everything you need to manage AI-powered calls
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, idx) => {
              const Icon = feature.icon
              return (
                <div
                  key={idx}
                  className="bg-white dark:bg-slate-700 p-6 rounded-xl border border-gray-200 dark:border-gray-600"
                >
                  <Icon className="text-indigo-600 dark:text-indigo-400 mb-4" size={32} />
                  <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                    {feature.title}
                  </h4>
                  <p className="text-gray-600 dark:text-gray-400">{feature.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="max-w-6xl mx-auto px-6 py-20 space-y-12">
        <div className="text-center space-y-4">
          <h3 className="text-4xl font-bold text-gray-900 dark:text-white">
            How It Works
          </h3>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Simple three-step process to get started
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { num: '1', title: 'Setup', desc: 'Configure your business details and AI settings' },
            { num: '2', title: 'Deploy', desc: 'Deploy the AI system to handle incoming calls' },
            { num: '3', title: 'Analyze', desc: 'Get insights and optimize your call handling' },
          ].map((step) => (
            <div key={step.num} className="text-center">
              <div className="w-16 h-16 bg-indigo-600 dark:bg-indigo-500 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                {step.num}
              </div>
              <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                {step.title}
              </h4>
              <p className="text-gray-600 dark:text-gray-400">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing Section */}
      <section className="bg-gray-50 dark:bg-slate-800 py-20">
        <div className="max-w-6xl mx-auto px-6 space-y-12">
          <div className="text-center space-y-4">
            <h3 className="text-4xl font-bold text-gray-900 dark:text-white">
              Simple, Transparent Pricing
            </h3>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              Choose the perfect plan for your business
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {pricingPlans.map((plan, idx) => (
              <div
                key={idx}
                className={`rounded-xl p-8 border-2 transition-transform hover:scale-105 ${
                  plan.popular
                    ? 'bg-indigo-600 dark:bg-indigo-500 text-white border-indigo-600 dark:border-indigo-500'
                    : 'bg-white dark:bg-slate-700 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white'
                }`}
              >
                {plan.popular && (
                  <div className="mb-4 inline-block bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 px-4 py-1 rounded-full text-sm font-bold">
                    Most Popular
                  </div>
                )}
                <h4 className="text-2xl font-bold mb-2">{plan.name}</h4>
                <div className="text-4xl font-bold mb-1">{plan.price}</div>
                <p className={`mb-6 text-sm ${plan.popular ? 'text-gray-100' : 'text-gray-600 dark:text-gray-400'}`}>
                  {plan.calls}
                </p>

                <button
                  onClick={() => navigate('/login')}
                  className={`w-full py-2 rounded-lg font-medium mb-6 transition-colors ${
                    plan.popular
                      ? 'bg-white text-indigo-600 dark:bg-slate-900 dark:text-indigo-400 hover:bg-gray-100'
                      : 'bg-indigo-600 dark:bg-indigo-500 text-white hover:opacity-90'
                  }`}
                >
                  Get Started
                </button>

                <ul className="space-y-3">
                  {plan.features.map((feature, fidx) => (
                    <li key={fidx} className="flex items-center gap-2">
                      <Check size={20} />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-6xl mx-auto px-6 py-20 text-center space-y-6">
        <h3 className="text-4xl font-bold text-gray-900 dark:text-white">
          Ready to Transform Your Business?
        </h3>
        <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Join hundreds of businesses using CallAI to automate their customer interactions
        </p>
        <button
          onClick={() => navigate('/login')}
          className="inline-flex items-center gap-2 bg-indigo-600 dark:bg-indigo-500 text-white px-8 py-3 rounded-lg hover:opacity-90 transition-opacity font-medium"
        >
          Start Free Trial
          <ArrowRight size={20} />
        </button>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 dark:bg-black text-gray-400 py-12">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <p>&copy; 2024 CallAI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
