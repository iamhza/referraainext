import { useState, useEffect, useCallback } from 'react';

interface ResponsiveKanbanConfig {
  columnCount?: number;
  minColumnWidth?: number;
  maxColumnWidth?: number;
  gap?: number;
}

interface ResponsiveKanbanState {
  shouldCompactCards: boolean;
  shouldHideDetails: boolean;
}

/**
 * Simplified responsive kanban hook - CSS Grid handles sizing now!
 * 
 * This hook only determines viewport-based display flags.
 * All sizing, spacing, and font calculations are handled by CSS custom properties.
 */
export const useResponsiveKanban = (_config?: ResponsiveKanbanConfig): ResponsiveKanbanState => {
  const [state, setState] = useState<ResponsiveKanbanState>({
    shouldCompactCards: false,
    shouldHideDetails: false,
  });

  const updateLayout = useCallback(() => {
    const container = document.querySelector('.kanban-board-container');
    if (!container) return;

    const containerWidth = container.clientWidth;
    
    // Simple viewport-based flags
    // CSS Grid + CSS variables handle all the actual sizing
    const shouldCompactCards = containerWidth < 800;  // Show compact cards on narrow viewports
    const shouldHideDetails = containerWidth < 600;   // Hide secondary details on very narrow viewports

    // Only update if changed
    setState(prev => {
      if (
        prev.shouldCompactCards === shouldCompactCards &&
        prev.shouldHideDetails === shouldHideDetails
      ) {
        return prev;
      }
      
      return {
        shouldCompactCards,
        shouldHideDetails,
      };
    });
  }, []);

  useEffect(() => {
    updateLayout();
    
    // Use ResizeObserver for performance
    const resizeObserver = new ResizeObserver(updateLayout);
    const container = document.querySelector('.kanban-board-container');
    
    if (container) {
      resizeObserver.observe(container);
    }

    // Fallback for older browsers
    window.addEventListener('resize', updateLayout);
    
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateLayout);
    };
  }, [updateLayout]);

  return state;
};
