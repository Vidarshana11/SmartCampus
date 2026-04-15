import React from 'react'

export default class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, message: '' }
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      message: error?.message || 'Something went wrong while rendering the page.',
    }
  }

  componentDidCatch(error, errorInfo) {
    // Keep full stack details in console for debugging.
    console.error('App render error:', error, errorInfo)
  }

  handleGoLogin = () => {
    window.location.assign('/login')
  }

  handleGoDashboard = () => {
    window.location.assign('/dashboard')
  }

  handleReload = () => {
    window.location.reload()
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-xl bg-white border border-red-200 rounded-xl p-6 shadow-sm">
          <h1 className="text-xl font-bold text-red-700">Page failed to load</h1>
          <p className="text-sm text-gray-700 mt-2">
            {this.state.message}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={this.handleReload}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
            >
              Reload
            </button>
            <button
              type="button"
              onClick={this.handleGoLogin}
              className="px-4 py-2 rounded-lg bg-gray-200 text-gray-800 text-sm font-medium hover:bg-gray-300"
            >
              Go to Login
            </button>
            <button
              type="button"
              onClick={this.handleGoDashboard}
              className="px-4 py-2 rounded-lg bg-gray-200 text-gray-800 text-sm font-medium hover:bg-gray-300"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    )
  }
}
