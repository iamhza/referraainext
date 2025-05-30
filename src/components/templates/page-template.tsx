import { Container } from '@/components/ui/container';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
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
      <PageHeader 
        title={title}
        description={description}
      >
        <div className="flex items-center gap-2">
          {backHref && (
            <Button variant="outline" asChild>
              <Link href={backHref}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                {backLabel}
              </Link>
            </Button>
          )}
          {actions}
        </div>
      </PageHeader>
      
      <div className="space-y-6">
        {children}
      </div>
    </Container>
  );
} 