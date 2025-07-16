'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Shepherd from 'shepherd.js';
import 'shepherd.js/dist/css/shepherd.css';

interface TourContextType {
  startTour: () => void;
  isActive: boolean;
  currentStep: number;
  totalSteps: number;
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
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [totalSteps, setTotalSteps] = useState(0);
  const [tour, setTour] = useState<any>(null);

  useEffect(() => {
    const newTour = new Shepherd.Tour({
      defaultStepOptions: {
        cancelIcon: {
          enabled: true,
        },
        scrollTo: { behavior: 'smooth', block: 'center' },
        modalOverlayOpeningPadding: 10,
      },
      useModalOverlay: true,
      keyboardNavigation: true,
      exitOnEsc: true,
    });

    // Welcome step
    newTour.addStep({
      id: 'welcome',
      title: 'Welcome to Referra! 🎉',
      text: [
        'Let me show you around your Case Manager dashboard and help you get started with managing referrals effectively.',
        'This interactive tour will guide you through the key features step by step.'
      ],
      buttons: [
        {
          text: 'Skip Tour',
          classes: 'shepherd-button-secondary',
          action() {
            this.cancel();
          },
        },
        {
          text: 'Start Tour',
          classes: 'shepherd-button-primary',
          action() {
            this.next();
          },
        },
      ],
      when: {
        show: () => {
          setCurrentStep(1);
          setIsActive(true);
        },
      },
    });
    
    // Dashboard metrics overview
    newTour.addStep({
      id: 'dashboard-metrics',
      title: 'Dashboard Overview',
      text: [
        'Here you can see your key metrics at a glance:',
        '• Pending selections that need your attention',
        '• Referrals requiring follow-up',
        '• Cases that need status updates'
      ],
      attachTo: {
        element: '#dashboard-metrics',
        on: 'bottom',
      },
      buttons: [
        {
          text: 'Back',
          classes: 'shepherd-button-secondary',
          action() {
            this.back();
          },
        },
        {
          text: 'Next',
          classes: 'shepherd-button-primary',
          action() {
            this.next();
          },
        },
      ],
      when: {
        show: () => setCurrentStep(2),
      },
    });

    // Recent activity section
    newTour.addStep({
      id: 'recent-activity',
      title: 'Recent Activity',
      text: [
        'This section shows your most recent referrals and their current status.',
        'You can quickly view details or access the workspace for active referrals from here.'
      ],
      attachTo: {
        element: '#recent-activity',
        on: 'top',
      },
      buttons: [
        {
          text: 'Back',
          classes: 'shepherd-button-secondary',
          action() {
            this.back();
          },
        },
        {
          text: 'Next',
          classes: 'shepherd-button-primary',
          action() {
            this.next();
          },
        },
      ],
      when: {
        show: () => setCurrentStep(3),
      },
    });

    // Quick actions card
    newTour.addStep({
      id: 'quick-actions',
      title: 'Quick Actions',
      text: [
        'Need to create a new referral? This is your go-to spot!',
        'Click "New Referral" to start the referral process for a client.'
      ],
      attachTo: {
        element: '#quick-actions',
        on: 'left',
      },
      buttons: [
        {
          text: 'Back',
          classes: 'shepherd-button-secondary',
          action() {
            this.back();
          },
        },
        {
          text: 'Next',
          classes: 'shepherd-button-primary',
          action() {
            this.next();
          },
        },
      ],
      when: {
        show: () => setCurrentStep(4),
      },
    });

    // Navigation - New Referral
    newTour.addStep({
      id: 'nav-new-referral',
      title: 'Create New Referrals',
      text: [
        'You can also create new referrals from the top navigation.',
        'This button is always accessible from any page.'
      ],
      attachTo: {
        element: '#nav-new-referral',
        on: 'bottom',
      },
      buttons: [
        {
          text: 'Back',
          classes: 'shepherd-button-secondary',
          action() {
            this.back();
          },
        },
        {
          text: 'Try It Out',
          classes: 'shepherd-button-primary',
          action() {
            this.next();
          },
        },
      ],
      when: {
        show: () => setCurrentStep(5),
      },
    });

    // Navigate to new referral page
    newTour.addStep({
      id: 'new-referral-page',
      title: 'Referral Creation Form',
      text: [
        'This is where you create new referrals for your clients.',
        'The form guides you through all the necessary information step by step.'
      ],
      buttons: [
        {
          text: 'Back to Dashboard',
          classes: 'shepherd-button-secondary',
          action() {
            router.push('/case-manager');
            setTimeout(() => this.back(), 300);
          },
        },
        {
          text: 'Continue Tour',
          classes: 'shepherd-button-primary',
          action() {
            this.next();
          },
        },
      ],
      beforeShowPromise: function() {
        return new Promise((resolve) => {
          router.push('/case-manager/new-referral');
          setTimeout(resolve, 500);
        });
      },
      when: {
        show: () => setCurrentStep(6),
      },
    });

    // Navigate to referrals list
    newTour.addStep({
      id: 'referrals-list',
      title: 'Manage All Referrals',
      text: [
        'Here you can view and manage all your referrals.',
        'Filter by status, search for specific clients, and take action on pending items.'
      ],
      buttons: [
        {
          text: 'Back',
          classes: 'shepherd-button-secondary',
          action() {
            router.push('/case-manager/new-referral');
            setTimeout(() => this.back(), 300);
          },
        },
        {
          text: 'Continue',
          classes: 'shepherd-button-primary',
          action() {
            this.next();
          },
        },
      ],
      beforeShowPromise: function() {
        return new Promise((resolve) => {
          router.push('/case-manager/referrals');
          setTimeout(resolve, 500);
        });
      },
      when: {
        show: () => setCurrentStep(7),
      },
    });

    // Navigate to clients
    newTour.addStep({
      id: 'clients-management',
      title: 'Client Management',
      text: [
        'Keep track of all your clients and their referral history.',
        'You can add new clients, edit existing ones, and view their complete referral timeline.'
      ],
      buttons: [
        {
          text: 'Back',
          classes: 'shepherd-button-secondary',
          action() {
            router.push('/case-manager/referrals');
            setTimeout(() => this.back(), 300);
          },
        },
        {
          text: 'Continue',
          classes: 'shepherd-button-primary',
          action() {
            this.next();
          },
        },
      ],
      beforeShowPromise: function() {
        return new Promise((resolve) => {
          router.push('/case-manager/clients');
          setTimeout(resolve, 500);
        });
      },
      when: {
        show: () => setCurrentStep(8),
      },
    });

    // Navigation menu
    newTour.addStep({
      id: 'navigation-menu',
      title: 'Navigation Menu',
      text: [
        'Use the sidebar to navigate between different sections:',
        '• Dashboard - Overview and quick actions',
        '• Referrals - Manage all referrals',
        '• Clients - Client management',
        '• Messages - Communication hub'
      ],
      attachTo: {
        element: '#sidebar-nav',
        on: 'right',
      },
      buttons: [
        {
          text: 'Back',
          classes: 'shepherd-button-secondary',
          action() {
            this.back();
          },
        },
        {
          text: 'Continue',
          classes: 'shepherd-button-primary',
          action() {
            this.next();
          },
        },
      ],
      when: {
        show: () => setCurrentStep(9),
      },
    });

    // Final step - back to dashboard
    newTour.addStep({
      id: 'tour-complete',
      title: 'Tour Complete! 🎉',
      text: [
        'Great job! You now know the key features of your Case Manager dashboard.',
        'Ready to start managing referrals? Click "Get Started" to begin, or "Restart Tour" if you want to see it again.'
      ],
      buttons: [
        {
          text: 'Restart Tour',
          classes: 'shepherd-button-secondary',
          action() {
            this.cancel();
            setTimeout(() => {
              router.push('/case-manager');
              setTimeout(() => startTour(), 500);
            }, 300);
          },
        },
        {
          text: 'Get Started',
          classes: 'shepherd-button-primary',
          action() {
            this.complete();
          },
        },
      ],
      beforeShowPromise: function() {
        return new Promise((resolve) => {
          router.push('/case-manager');
          setTimeout(resolve, 500);
        });
      },
      when: {
        show: () => setCurrentStep(10),
        hide: () => {
          setIsActive(false);
          setCurrentStep(0);
          // Mark tour as completed
          if (typeof window !== 'undefined') {
            localStorage.setItem('referra-tour-completed', 'true');
          }
        },
      },
    });

    setTour(newTour);
    setTotalSteps(10);

    // Auto-start tour for new users
    if (typeof window !== 'undefined') {
      const tourCompleted = localStorage.getItem('referra-tour-completed');
      if (!tourCompleted && window.location.pathname === '/case-manager') {
        setTimeout(() => {
          newTour.start();
        }, 1000);
      }
    }

    return () => {
      newTour.complete();
    };
  }, [router]);

  const startTour = () => {
    if (tour) {
      setIsActive(true);
      setCurrentStep(0);
      tour.start();
    }
  };

  const contextValue: TourContextType = {
    startTour,
    isActive,
    currentStep,
    totalSteps,
  };

  return (
    <TourContext.Provider value={contextValue}>
      {children}
    </TourContext.Provider>
  );
}; 