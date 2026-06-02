'use client';

import { useState } from 'react';
import { 
  ProfessionalAccountMenu 
} from '@/components/shared/professional-account-menu';
import { 
  ProfessionalStatusTabs 
} from '@/components/shared/professional-status-tabs';
import { 
  ProfessionalViewTabs, 
  ProfessionalViewTabsFlat 
} from '@/components/shared/professional-view-tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  TrendingUp, 
  Users, 
  Package 
} from 'lucide-react';

/**
 * Professional UI Components Demo
 * Showcasing enterprise-grade UI components
 */
export default function UIComponentsDemo() {
  const [statusFilter, setStatusFilter] = useState('all');
  const [mainView, setMainView] = useState('all');
  const [secondaryView, setSecondaryView] = useState('all');

  // Sample data counts
  const statusCounts = {
    all: 247,
    draft: 18,
    pending: 23,
    authorized: 206,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                Professional UI Components Demo
              </h1>
              <p className="text-sm text-gray-500">
                Enterprise-grade components for your ERP
              </p>
            </div>
            <ProfessionalAccountMenu />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Section 1: Account Menu Demo */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                Professional Account Menu
              </CardTitle>
              <CardDescription>
                Clean dropdown menu with user profile and settings - See top right corner →
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <h3 className="font-semibold text-sm text-gray-700 mb-2">Features:</h3>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li>✓ User name and email in header</li>
                    <li>✓ Profile Settings link</li>
                    <li>✓ System Settings link</li>
                    <li>✓ Red logout action for emphasis</li>
                    <li>✓ Smooth hover transitions</li>
                    <li>✓ Fully accessible</li>
                  </ul>
                </div>
                <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <span className="text-sm font-medium text-blue-900">
                    Click the user icon in the top-right corner to see the menu →
                  </span>
                  <Badge variant="active">Try it!</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section 2: Status Filter Tabs Demo */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                Professional Status Filter Tabs
              </CardTitle>
              <CardDescription>
                Clean status filters with count badges - Perfect for document filtering
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Live Demo */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-gray-700">Live Demo:</h3>
                  <ProfessionalStatusTabs 
                    activeTab={statusFilter}
                    onTabChange={setStatusFilter}
                    counts={statusCounts}
                  />
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-sm text-gray-600">
                      <span className="font-semibold">Currently selected:</span>{' '}
                      <Badge variant="active" className="ml-2">
                        {statusFilter} ({statusCounts[statusFilter as keyof typeof statusCounts]})
                      </Badge>
                    </p>
                  </div>
                </div>

                {/* Features */}
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <h3 className="font-semibold text-sm text-gray-700 mb-2">Features:</h3>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li>✓ Active state with blue text and white background</li>
                    <li>✓ Count badges showing document totals</li>
                    <li>✓ Smooth hover transitions</li>
                    <li>✓ Keyboard navigation support</li>
                    <li>✓ Responsive design</li>
                  </ul>
                </div>

                {/* Code Example */}
                <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                  <pre className="text-sm text-slate-100">
                    <code>{`<ProfessionalStatusTabs 
  activeTab={statusFilter}
  onTabChange={setStatusFilter}
  counts={{
    all: 247,
    draft: 18,
    pending: 23,
    authorized: 206
  }}
/>`}</code>
                  </pre>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section 3: View Tabs Demo (Gradient Style) */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                Professional View Tabs (Gradient Style)
              </CardTitle>
              <CardDescription>
                Modern view filters with gradient active state and icons
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Live Demo */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-gray-700">Live Demo:</h3>
                  <ProfessionalViewTabs 
                    activeView={mainView}
                    onViewChange={setMainView}
                    showIcons={true}
                  />
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-sm text-gray-600">
                      <span className="font-semibold">Currently viewing:</span>{' '}
                      <Badge variant="active" className="ml-2">
                        {mainView}
                      </Badge>
                    </p>
                  </div>
                </div>

                {/* Features */}
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <h3 className="font-semibold text-sm text-gray-700 mb-2">Features:</h3>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li>✓ Active state with blue gradient background</li>
                    <li>✓ Optional icons for visual clarity</li>
                    <li>✓ Smooth shadow transitions</li>
                    <li>✓ Professional hover effects</li>
                    <li>✓ Mobile responsive</li>
                  </ul>
                </div>

                {/* Code Example */}
                <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                  <pre className="text-sm text-slate-100">
                    <code>{`<ProfessionalViewTabs 
  activeView={activeView}
  onViewChange={setActiveView}
  showIcons={true}
/>`}</code>
                  </pre>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section 4: View Tabs Demo (Flat Style) */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-blue-600" />
                Professional View Tabs (Flat Style)
              </CardTitle>
              <CardDescription>
                Clean, flat design with border-based active state
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Live Demo */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-gray-700">Live Demo:</h3>
                  <ProfessionalViewTabsFlat 
                    activeView={secondaryView}
                    onViewChange={setSecondaryView}
                    showIcons={false}
                  />
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-sm text-gray-600">
                      <span className="font-semibold">Currently viewing:</span>{' '}
                      <Badge variant="default" className="ml-2">
                        {secondaryView}
                      </Badge>
                    </p>
                  </div>
                </div>

                {/* Features */}
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <h3 className="font-semibold text-sm text-gray-700 mb-2">Features:</h3>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li>✓ Flat, clean design</li>
                    <li>✓ Active state with blue border</li>
                    <li>✓ Subtle hover effects</li>
                    <li>✓ Perfect for minimal designs</li>
                    <li>✓ Fully accessible</li>
                  </ul>
                </div>

                {/* Code Example */}
                <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                  <pre className="text-sm text-slate-100">
                    <code>{`<ProfessionalViewTabsFlat 
  activeView={activeView}
  onViewChange={setActiveView}
  showIcons={false}
/>`}</code>
                  </pre>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Design Guidelines */}
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="text-blue-900">Design Guidelines</CardTitle>
              <CardDescription className="text-blue-700">
                Professional UI best practices for your ERP application
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                {/* DO */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-green-900 flex items-center gap-2">
                    ✓ DO
                  </h3>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li>• Use consistent spacing (4px, 8px, 16px)</li>
                    <li>• Maintain visual hierarchy</li>
                    <li>• Include proper focus states</li>
                    <li>• Use subtle transitions (200ms max)</li>
                    <li>• Keep colors professional</li>
                    <li>• Show clear active states</li>
                  </ul>
                </div>

                {/* DON'T */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-red-900 flex items-center gap-2">
                    ✗ DON&apos;T
                  </h3>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li>• Use flashy animations</li>
                    <li>• Over-emphasize inactive states</li>
                    <li>• Mix multiple color schemes</li>
                    <li>• Use heavy shadows everywhere</li>
                    <li>• Forget accessibility</li>
                    <li>• Ignore mobile responsiveness</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
