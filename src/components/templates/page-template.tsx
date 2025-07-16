import { Container } from '@/components/ui/container';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Home, Users, FileText } from 'lucide-react';
import Link from 'next/link';
import { ReactNode } from 'react';

interface PageTemplateProps {
  title: string | ReactNode;
  description?: string;
  backHref?: string;
  backLabel?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}

export function PageTemplate({
  title,
  description,
  backHref,
  backLabel = 'Back',
  actions,
  children,
}: PageTemplateProps) {
  return (
    <Container>
      {/* Enhanced Navigation Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between p-4 bg-white/90 backdrop-blur-sm border border-gray-200 rounded-2xl shadow-sm">
          <div className="flex items-center gap-4">
            {/* Breadcrumb Navigation */}
            <div className="flex items-center gap-2 text-sm">
              <Button variant="ghost" size="sm" asChild className="h-8 px-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100">
                <Link href="/case-manager">
                  <Home className="h-4 w-4 mr-1" />
                  Dashboard
                </Link>
              </Button>
              <span className="text-gray-400">/</span>
              {backHref && (
                <>
                  <Button variant="ghost" size="sm" asChild className="h-8 px-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100">
                    <Link href={backHref}>
                      <FileText className="h-4 w-4 mr-1" />
                      {backLabel}
                    </Link>
                  </Button>
                  <span className="text-gray-400">/</span>
                </>
              )}
              <span className="font-medium text-gray-900">{typeof title === 'string' ? title : 'Current Page'}</span>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            {backHref && (
              <Button variant="outline" size="sm" asChild className="h-9 px-4 border-gray-300 hover:bg-gray-50">
                <Link href={backHref}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  {backLabel}
                </Link>
              </Button>
            )}
            {actions}
          </div>
        </div>
      </div>

      {/* Page Header */}
      <PageHeader 
        title={title}
        description={description}
        className="mb-6"
      />
      
      <div className="space-y-6">
        {children}
      </div>
    </Container>
  );
} 