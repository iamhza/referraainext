// Type declarations for shepherd.js
declare module 'shepherd.js' {
  export interface StepOptions {
    id: string;
    title?: string;
    text?: string | string[];
    attachTo?: {
      element: string;
      on: 'top' | 'bottom' | 'left' | 'right' | 'center';
    };
    advanceOn?: {
      selector: string;
      event: string;
    };
    buttons?: Array<{
      text: string;
      classes?: string;
      action?(this: Step): void;
    }>;
    classes?: string;
    cancelIcon?: {
      enabled: boolean;
    };
    scrollTo?: {
      behavior: 'smooth' | 'auto';
      block: 'center' | 'start' | 'end' | 'nearest';
    };
    modalOverlayOpeningPadding?: number;
    when?: {
      show?(): void;
      hide?(): void;
      cancel?(): void;
      complete?(): void;
      destroy?(): void;
    };
  }

  export interface TourOptions {
    defaultStepOptions?: Partial<StepOptions>;
    useModalOverlay?: boolean;
    keyboardNavigation?: boolean;
    exitOnEsc?: boolean;
  }

  export class Step {
    id: string;
    cancel(): void;
    complete(): void;
    destroy(): void;
    hide(): void;
    show(): void;
    next(): void;
    back(): void;
    on(event: string, handler: () => void): void;
  }

  export class Tour {
    constructor(options?: TourOptions);
    addStep(options: StepOptions): Step;
    start(): void;
    next(): void;
    back(): void;
    cancel(): void;
    complete(): void;
    hide(): void;
    show(stepId?: string): void;
    getCurrentStep(): Step | null;
    on(event: string, handler: () => void): void;
    off(event: string, handler?: () => void): void;
    steps: Step[];
  }

  export default Tour;
}

