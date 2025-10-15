'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';

// Type-only import
type Tour = any;

interface TourContextType {
  startTour: (role?: 'case_manager' | 'supervisor' | 'org_admin') => Promise<void>;
  isActive: boolean;
  currentStep: number;
  totalSteps: number;
  resetTour: () => void;
}

const TourContext = createContext<TourContextType | undefined>(undefined);

export const useTour = () => {
  const context = useContext(TourContext);
  if (!context) {
    throw new Error('useTour must be used within a TourProvider');
  }
  return context;
};

interface TourProviderProps {
  children: React.ReactNode;
}

export const TourProvider: React.FC<TourProviderProps> = ({ children }) => {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session } = useSession();
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [totalSteps, setTotalSteps] = useState(0);
  const [tour, setTour] = useState<Tour | null>(null);
  const [shepherdReady, setShepherdReady] = useState(false);
  const [sandboxStatus, setSandboxStatus] = useState<{ isSandbox: boolean; role?: string } | null>(null);
  
  // Get user role and sandbox status
  const userRole = (session?.user?.role as 'case_manager' | 'supervisor' | 'org_admin') || 'case_manager';
  const isSandbox = sandboxStatus?.isSandbox || false;

  // Load Shepherd.js only on client
  useEffect(() => {
    if (typeof window !== 'undefined' && !shepherdReady) {
      Promise.all([
        import('shepherd.js'),
        // @ts-ignore - CSS import has no types
        import('shepherd.js/dist/css/shepherd.css')
      ]).then(() => {
        setShepherdReady(true);
      }).catch(err => {
        console.error('Failed to load Shepherd.js:', err);
      });
    }
  }, [shepherdReady]);

  // Fetch sandbox status when session is available
  useEffect(() => {
    if (session?.user) {
      fetch('/api/sandbox/status')
        .then(res => res.json())
        .then(data => {
          setSandboxStatus({
            isSandbox: data.isSandbox || false,
            role: data.role,
          });
        })
        .catch(err => {
          console.error('Failed to fetch sandbox status:', err);
          setSandboxStatus({ isSandbox: false });
        });
    }
  }, [session]);

  const getTourCompleteKey = () => `referra-tour-${userRole}-completed`;
  const getSandboxPrefix = () => isSandbox ? 'In this demo, ' : '';

  // Build tour steps based on role
  const buildTourSteps = useCallback((tourInstance: Tour, role: 'case_manager' | 'supervisor' | 'org_admin') => {
    switch (role) {
      case 'case_manager':
        // Welcome
        tourInstance.addStep({
          id: 'cm-welcome',
          title: `Welcome to Referra${isSandbox ? ' Demo' : ''}! 🎉`,
          text: `${getSandboxPrefix()}Let's take a quick tour of your Case Manager board where you'll manage all your clients and referrals.`,
          buttons: [
            {
              text: 'Skip Tour',
              classes: 'shepherd-button-secondary',
              action() { tourInstance.cancel(); }
            },
            {
              text: 'Start Tour',
              classes: 'shepherd-button-primary',
              action() { tourInstance.next(); }
            },
          ],
          when: {
            show: () => {
              setCurrentStep(1);
              setIsActive(true);
            },
          },
        });

        // Kanban Board
        tourInstance.addStep({
          id: 'cm-board',
          title: 'Your Client Kanban Board',
          text: 'This board provides a visual overview of all your clients, organized by their status. Drag and drop clients between columns to update their progress.',
          attachTo: { element: '.kanban-board-container', on: 'bottom' },
          buttons: [
            { text: 'Back', classes: 'shepherd-button-secondary', action() { tourInstance.back(); } },
            { text: 'Next', classes: 'shepherd-button-primary', action() { tourInstance.next(); } },
          ],
          when: { show: () => setCurrentStep(2) },
        });

        // Client Card
        tourInstance.addStep({
          id: 'cm-client-card',
          title: 'Client Cards',
          text: 'Each card represents a client with key information. Click any card to open their detailed drawer.',
          attachTo: { element: '.client-card-wrapper:first-child', on: 'right' },
          buttons: [
            { text: 'Back', classes: 'shepherd-button-secondary', action() { tourInstance.back(); } },
            { text: 'Next', classes: 'shepherd-button-primary', action() { tourInstance.next(); } },
          ],
          when: { show: () => setCurrentStep(3) },
        });

        // Service Feed
        tourInstance.addStep({
          id: 'cm-service-feed',
          title: 'Service Feed',
          text: 'The Service Feed tab is your central hub for all client activity, communication, and actions.',
          attachTo: { element: '#drawer-tab-actions', on: 'bottom' },
          buttons: [
            { text: 'Back', classes: 'shepherd-button-secondary', action() { tourInstance.back(); } },
            { text: 'Next', classes: 'shepherd-button-primary', action() { tourInstance.next(); } },
          ],
          when: { show: () => setCurrentStep(4) },
        });

        // Complete
        tourInstance.addStep({
          id: 'cm-complete',
          title: 'You\'re All Set! 🚀',
          text: 'You\'ve completed the Case Manager tour! You\'re now ready to start managing clients and referrals.',
          buttons: [
            { text: 'Back', classes: 'shepherd-button-secondary', action() { tourInstance.back(); } },
            { text: 'Finish', classes: 'shepherd-button-primary', action() { tourInstance.complete(); } },
          ],
          when: {
            show: () => {
              setCurrentStep(5);
              localStorage.setItem(getTourCompleteKey(), 'true');
            },
          },
        });

        setTotalSteps(5);
        break;

      case 'supervisor':
        // Supervisor tour steps
        tourInstance.addStep({
          id: 'sup-welcome',
          title: 'Welcome, Supervisor! 👔',
          text: `${getSandboxPrefix()}This tour will guide you through your Supervisor dashboard.`,
          buttons: [
            { text: 'Skip Tour', classes: 'shepherd-button-secondary', action() { tourInstance.cancel(); } },
            { text: 'Start Tour', classes: 'shepherd-button-primary', action() { tourInstance.next(); } },
          ],
          when: { show: () => { setCurrentStep(1); setIsActive(true); } },
        });

        tourInstance.addStep({
          id: 'sup-dashboard',
          title: 'Team Overview Dashboard',
          text: 'Here you get a high-level view of your team\'s activity and performance metrics.',
          buttons: [
            { text: 'Back', classes: 'shepherd-button-secondary', action() { tourInstance.back(); } },
            { text: 'Finish', classes: 'shepherd-button-primary', action() { tourInstance.complete(); } },
          ],
          when: { show: () => setCurrentStep(2) },
        });

        setTotalSteps(2);
        break;

      case 'org_admin':
        // Org Admin tour steps
        tourInstance.addStep({
          id: 'admin-welcome',
          title: 'Welcome, Org Admin! 🏢',
          text: `${getSandboxPrefix()}This tour will introduce you to the Organization Admin dashboard.`,
          buttons: [
            { text: 'Skip Tour', classes: 'shepherd-button-secondary', action() { tourInstance.cancel(); } },
            { text: 'Start Tour', classes: 'shepherd-button-primary', action() { tourInstance.next(); } },
          ],
          when: { show: () => { setCurrentStep(1); setIsActive(true); } },
        });

        tourInstance.addStep({
          id: 'admin-dashboard',
          title: 'Organization Command Center',
          text: 'Your dashboard provides a holistic view of your organization\'s performance.',
          buttons: [
            { text: 'Back', classes: 'shepherd-button-secondary', action() { tourInstance.back(); } },
            { text: 'Finish', classes: 'shepherd-button-primary', action() { tourInstance.complete(); } },
          ],
          when: { show: () => setCurrentStep(2) },
        });

        setTotalSteps(2);
        break;
    }
  }, [isSandbox, getSandboxPrefix, getTourCompleteKey]);

  // Create tour instance
  const createTour = useCallback(async (role: 'case_manager' | 'supervisor' | 'org_admin'): Promise<Tour | null> => {
    if (!shepherdReady || typeof window === 'undefined') return null;

    try {
      const ShepherdModule = await import('shepherd.js');
      const Shepherd = ShepherdModule.default as any; // ShepherdBase instance with Tour constructor
      const newTour = new Shepherd.Tour({
        defaultStepOptions: {
          cancelIcon: { enabled: true },
          scrollTo: { behavior: 'smooth', block: 'center' },
          modalOverlayOpeningPadding: 10,
          classes: 'referra-tour-step',
        },
        useModalOverlay: true,
        keyboardNavigation: true,
        exitOnEsc: true,
      });

      // Event handlers
      newTour.on('cancel', () => {
        setIsActive(false);
        setCurrentStep(0);
        localStorage.setItem(getTourCompleteKey(), 'true');
      });

      newTour.on('complete', () => {
        setIsActive(false);
        setCurrentStep(0);
        localStorage.setItem(getTourCompleteKey(), 'true');
      });

      // Build steps
      buildTourSteps(newTour, role);

      return newTour;
    } catch (error) {
      console.error('Failed to create tour:', error);
      return null;
    }
  }, [shepherdReady, buildTourSteps, getTourCompleteKey]);

  // Auto-start tour for sandbox users
  useEffect(() => {
    // Wait for all required data to be loaded
    if (!shepherdReady || sandboxStatus === null || typeof window === 'undefined') return;
    
    // Only auto-start if user is in sandbox mode
    if (!isSandbox) return;

    const tourCompleted = localStorage.getItem(getTourCompleteKey());
    if (tourCompleted) return;

    let mounted = true;

    console.log('🎯 Auto-starting tour for sandbox user:', { userRole, isSandbox });

    (async () => {
      const newTour = await createTour(userRole);
      if (!newTour || !mounted) return;

      setTour(newTour);
      
      // Delay to ensure UI is rendered
      setTimeout(() => {
        if (mounted) {
          console.log('🚀 Starting tour now!');
          newTour.start();
        }
      }, 1500);
    })();

    return () => {
      mounted = false;
    };
  }, [shepherdReady, sandboxStatus, isSandbox, userRole, createTour, getTourCompleteKey]);

  // Start tour manually
  const startTour = useCallback(async (role?: 'case_manager' | 'supervisor' | 'org_admin') => {
    if (!shepherdReady) return;

    const targetRole = role || userRole;
    
    if (tour) {
      tour.cancel();
    }

    const newTour = await createTour(targetRole);
    if (!newTour) return;

    setTour(newTour);
    newTour.start();
  }, [shepherdReady, tour, userRole, createTour]);

  // Reset tour
  const resetTour = useCallback(() => {
    localStorage.removeItem(getTourCompleteKey());
    if (tour) {
      tour.start();
    }
  }, [tour, getTourCompleteKey]);

  const contextValue: TourContextType = {
    startTour,
    isActive,
    currentStep,
    totalSteps,
    resetTour,
  };

  return (
    <TourContext.Provider value={contextValue}>
      {children}
    </TourContext.Provider>
  );
};
