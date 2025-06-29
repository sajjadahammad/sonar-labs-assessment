'use client'

import { AlertTriangle, Home, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br  p-4">
      <Card className="w-full max-w-md shadow-lg border-red-200">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold text-primary">
              Oops! Something went wrong
            </CardTitle>
            <CardDescription className="text-gray-600 mt-2">
              We encountered an unexpected error. Please try again or return to the dashboard.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-700 font-mono break-all">
              {error.message || 'An unknown error occurred'}
            </p>
            {error.digest && (
              <p className="text-xs text-red-500 mt-1">
                Error ID: {error.digest}
              </p>
            )}
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              onClick={reset}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => window.location.href = '/dashboard'}
            >
              <Home className="w-4 h-4 mr-2" />
              Go to Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
