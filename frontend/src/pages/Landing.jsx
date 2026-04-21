import { useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { usePageTitle } from '../hooks/usePageTitle'
import { BRAND_FULL_NAME, BRAND_SHORT_NAME } from '../constants/branding'
import {
  FaGraduationCap,
  FaCalendarAlt,
  FaBook,
  FaBuilding,
  FaClipboardCheck,
  FaUsers,
  FaArrowRight,
  FaCheckCircle,
  FaShieldAlt,
  FaMobileAlt,
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt
} from 'react-icons/fa'

// Feature cards data
const features = [
  {
    icon: FaCalendarAlt,
    title: 'Academic Scheduling',
    description: 'View your class timetable, exam schedules, and academic calendar all in one place.',
    color: 'bg-blue-500',
  },
  {
    icon: FaBuilding,
    title: 'Facility Booking',
    description: 'Reserve study rooms, labs, and campus facilities with real-time availability.',
    color: 'bg-green-500',
  },
  {
    icon: FaClipboardCheck,
    title: 'Course Management',
    description: 'Register for courses, view grades, and track your academic progress.',
    color: 'bg-purple-500',
  },
  {
    icon: FaBook,
    title: 'Library Resources',
    description: 'Access digital resources, check book availability, and manage loans.',
    color: 'bg-orange-500',
  },
  {
    icon: FaUsers,
    title: 'Campus Community',
    description: 'Connect with student clubs, events, and campus announcements.',
    color: 'bg-pink-500',
  },
  {
    icon: FaShieldAlt,
    title: 'Secure Access',
    description: 'Your data is protected with enterprise-grade security and authentication.',
    color: 'bg-indigo-500',
  },
]

// Statistics
const stats = [
  { value: '15,000+', label: 'Active Students' },
  { value: '500+', label: 'Courses Offered' },
  { value: '50+', label: 'Campus Facilities' },
  { value: '24/7', label: 'Support Available' },
]

export default function Landing() {
  const { token, user, loading } = useAuth()
  const navigate = useNavigate()
  usePageTitle('Home')

  useEffect(() => {
    if (loading || !token) return

    if (user?.role === 'ADMIN') {
      navigate('/admin-panel', { replace: true })
      return
    }

    if (user) {
      navigate('/dashboard', { replace: true })
      return
    }

    // Token exists but user profile is unavailable, force fresh login.
    localStorage.removeItem('token')
    navigate('/login', { replace: true })
  }, [loading, token, user, navigate])

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#003366] rounded-lg flex items-center justify-center">
                <FaGraduationCap className="w-6 h-6 text-[#c9a227]" />
              </div>
              <div>
                <span className="text-[#003366] font-bold text-lg">{BRAND_SHORT_NAME}</span>
                <span className="text-gray-400 mx-2">|</span>
                <span className="text-gray-600 text-sm">Student Portal</span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Link
                to="/login"
                className="text-gray-700 hover:text-[#003366] font-medium transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="bg-[#003366] hover:bg-[#004080] text-white px-5 py-2 rounded-lg font-medium transition-colors shadow-md hover:shadow-lg"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-[#003366] via-[#004080] to-[#005299] text-white overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-64 h-64 border border-white rounded-full"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 border border-white rounded-full"></div>
          <div className="absolute top-1/2 left-1/2 w-32 h-32 border border-white rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 mb-6">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                <span className="text-sm font-medium">Now Open for Spring 2026</span>
              </div>

              <h1 className="text-4xl lg:text-5xl font-bold leading-tight mb-6">
                Your Complete Campus
                <br />
                <span className="text-[#c9a227]">Management Solution</span>
              </h1>

              <p className="text-lg text-white/90 mb-8 leading-relaxed max-w-lg">
                {BRAND_FULL_NAME} gives you one secure platform to access courses, book facilities, track grades, and stay connected with campus life.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center gap-2 bg-[#c9a227] hover:bg-[#d4af37] text-[#003366] font-bold px-8 py-3.5 rounded-xl transition-all shadow-lg hover:shadow-xl"
                >
                  Create Account
                  <FaArrowRight />
                </Link>
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white font-semibold px-8 py-3.5 rounded-xl border border-white/30 transition-all"
                >
                  Sign In
                </Link>
              </div>

              {/* Trust badges */}
              <div className="mt-8 flex items-center gap-6 text-sm text-white/70">
                <div className="flex items-center gap-2">
                  <FaCheckCircle className="text-green-400" />
                  <span>Free for Students</span>
                </div>
                <div className="flex items-center gap-2">
                  <FaShieldAlt className="text-[#c9a227]" />
                  <span>Secure & Private</span>
                </div>
                <div className="flex items-center gap-2">
                  <FaMobileAlt className="text-blue-400" />
                  <span>Mobile Ready</span>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="bg-white rounded-2xl p-6 shadow-2xl">
                {/* Mock Dashboard Preview */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#003366] rounded-full flex items-center justify-center text-white font-bold">S
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">Welcome back, Student!</div>
                        <div className="text-sm text-gray-500">Spring 2026</div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <div className="w-8 h-8 bg-gray-100 rounded-lg"></div>
                      <div className="w-8 h-8 bg-gray-100 rounded-lg"></div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { icon: FaCalendarAlt, label: 'Schedule', color: 'bg-blue-500' },
                      { icon: FaBook, label: 'Courses', color: 'bg-green-500' },
                      { icon: FaBuilding, label: 'Bookings', color: 'bg-purple-500' },
                      { icon: FaClipboardCheck, label: 'Grades', color: 'bg-orange-500' },
                    ].map((item, i) => (
                      <div key={i} className="bg-gray-50 rounded-xl p-4 text-center">
                        <div className={`w-10 h-10 ${item.color} rounded-lg mx-auto mb-2 flex items-center justify-center text-white`}>
                          <item.icon className="w-5 h-5" />
                        </div>
                        <div className="text-sm font-medium text-gray-700">{item.label}</div>
                      </div>
                    ))}
                  </div>

                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="text-sm font-semibold text-gray-900 mb-3">Latest Announcements</div>
                    {[
                      { title: 'Registration opens tomorrow', tag: 'Academic' },
                      { title: 'Library extended hours', tag: 'Facility' },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center justify-between py-2 border-b border-gray-200 last:border-0">
                        <span className="text-sm text-gray-700">{item.title}</span>
                        <span className="text-xs bg-[#003366]/10 text-[#003366] px-2 py-0.5 rounded-full">{item.tag}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Floating badges */}
              <div className="absolute -top-4 -right-4 bg-white rounded-xl p-3 shadow-lg">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <FaCheckCircle className="w-4 h-4 text-green-600" />
                  </div>
                  <div className="text-sm">
                    <div className="font-semibold text-gray-900">Authenticated</div>
                    <div className="text-gray-500">Secure login</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-gray-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-3xl lg:text-4xl font-bold text-[#003366]">{stat.value}</div>
                <div className="text-gray-600 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-[#003366] font-semibold text-sm uppercase tracking-wider">Features</span>
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mt-2">Everything You Need</h2>
            <p className="text-gray-600 mt-4 max-w-2xl mx-auto">
              A comprehensive platform designed to simplify your campus experience. From scheduling to grades, we've got you covered.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <div
                key={i}
                className="group bg-white rounded-2xl p-6 border border-gray-200 hover:border-[#003366]/30 hover:shadow-xl transition-all"
              >
                <div className={`w-12 h-12 ${feature.color} rounded-xl flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform`}>
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-[#003366]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">Ready to Get Started?</h2>
            <p className="text-lg text-white/80 mb-8">
              Join thousands of students already using {BRAND_FULL_NAME} to manage their academic journey.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/register"
                className="inline-flex items-center justify-center gap-2 bg-[#c9a227] hover:bg-[#d4af37] text-[#003366] font-bold px-8 py-4 rounded-xl transition-all shadow-lg hover:shadow-xl"
              >
                Create Free Account
                <FaArrowRight />
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center justify-center gap-2 bg-transparent hover:bg-white/10 text-white font-semibold px-8 py-4 rounded-xl border-2 border-white/30 transition-all"
              >
                Sign In to Portal
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#002244] text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-[#c9a227] rounded-lg flex items-center justify-center">
                  <FaGraduationCap className="w-6 h-6 text-[#003366]" />
                </div>
                <span className="font-bold text-lg">{BRAND_FULL_NAME}</span>
              </div>
              <p className="text-gray-400 text-sm">
                Empowering students with modern tools for academic success.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link to="#" className="hover:text-white transition-colors">Academic Calendar</Link></li>
                <li><Link to="#" className="hover:text-white transition-colors">Course Catalog</Link></li>
                <li><Link to="#" className="hover:text-white transition-colors">Library Services</Link></li>
                <li><Link to="#" className="hover:text-white transition-colors">Campus Map</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link to="#" className="hover:text-white transition-colors">Help Center</Link></li>
                <li><Link to="#" className="hover:text-white transition-colors">IT Support</Link></li>
                <li><Link to="#" className="hover:text-white transition-colors">Student Services</Link></li>
                <li><Link to="#" className="hover:text-white transition-colors">FAQs</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Contact</h4>
              <ul className="space-y-3 text-sm text-gray-400">
                <li className="flex items-center gap-2">
                  <FaEnvelope className="w-4 h-4" />
                  support@nust.edu
                </li>
                <li className="flex items-center gap-2">
                  <FaPhone className="w-4 h-4" />
                  +1 (555) 123-4567
                </li>
                <li className="flex items-center gap-2">
                  <FaMapMarkerAlt className="w-4 h-4" />
                  123 Campus Drive, Education City
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-400">
              © 2026 {BRAND_FULL_NAME}. All rights reserved.
            </p>
            <p className="text-sm text-gray-400">
              IT3030 – Programming Applications and Frameworks
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
