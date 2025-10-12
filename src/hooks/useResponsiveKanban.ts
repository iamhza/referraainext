import { useState, useEffect, useCallback } from 'react';

interface ResponsiveKanbanConfig {
  columnCount: number;
  minColumnWidth: number;
  maxColumnWidth: number;
  gap: number;
}

interface ResponsiveKanbanState {
  columnWidth: string;
  shouldCompactCards: boolean;
  shouldHideDetails: boolean;
  fontSize: string;
  gap: string;
}

export const useResponsiveKanban = (config: ResponsiveKanbanConfig): ResponsiveKanbanState => {
  const [state, setState] = useState<ResponsiveKanbanState>({
    columnWidth: 'auto',
    shouldCompactCards: false,
    shouldHideDetails: false,
    fontSize: '0.875rem',
    gap: '0.75rem'
  });

  const updateLayout = useCallback(() => {
    const container = document.querySelector('.kanban-board-container');
    if (!container) return;

    const containerWidth = container.clientWidth;
    const { columnCount, minColumnWidth, maxColumnWidth, gap } = config;
    
    // Calculate available width after gaps
    const totalGapWidth = gap * (columnCount - 1);
    const availableWidth = containerWidth - totalGapWidth;
    const idealColumnWidth = availableWidth / columnCount;
    
    // Detect zoom level to avoid false compacting at normal zoom
    const zoomLevel = window.outerWidth / window.innerWidth;
    const isNormalZoom = zoomLevel >= 0.95 && zoomLevel <= 1.05; // Consider 95%-105% as "normal"
    
    // Determine responsive behavior - balanced for permanent narrow layout
    let shouldCompactCards = idealColumnWidth < 150; // Compact only when really needed
    let shouldHideDetails = idealColumnWidth < 120;  // Hide details rarely
    
    // Override: At normal zoom levels, prefer comfortable view
    if (isNormalZoom && idealColumnWidth > 140) {
      shouldCompactCards = false;
    }
    
    const columnWidth = Math.max(Math.min(idealColumnWidth, maxColumnWidth), minColumnWidth);
    
    // Dynamic font sizing - balanced for narrow layout
    const fontSize = idealColumnWidth > 200 ? '0.875rem' : 
                    idealColumnWidth > 160 ? '0.8125rem' : '0.75rem';
    
    // Dynamic gap sizing - balanced spacing
    const gapSize = idealColumnWidth > 200 ? '0.625rem' : 
                   idealColumnWidth > 160 ? '0.5rem' : '0.4rem';

    // Only update state if values have actually changed
    setState(prev => {
      if (
        prev.columnWidth === `${columnWidth}px` &&
        prev.shouldCompactCards === shouldCompactCards &&
        prev.shouldHideDetails === shouldHideDetails &&
        prev.fontSize === fontSize &&
        prev.gap === gapSize
      ) {
        return prev; // No change, return previous state
      }
      
      return {
        columnWidth: `${columnWidth}px`,
        shouldCompactCards,
        shouldHideDetails,
        fontSize,
        gap: gapSize
      };
    });
  }, [config.columnCount, config.minColumnWidth, config.maxColumnWidth, config.gap]);

  useEffect(() => {
    updateLayout();
    
    // Use ResizeObserver for better performance than window resize
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

// Zoom level detection hook
export const useZoomLevel = () => {
  const [zoomLevel, setZoomLevel] = useState(1);

  useEffect(() => {
    const detectZoom = () => {
      const zoom = Math.round((window.outerWidth / window.innerWidth) * 100) / 100;
      setZoomLevel(zoom);
    };

    detectZoom();
    window.addEventListener('resize', detectZoom);
    
    return () => window.removeEventListener('resize', detectZoom);
  }, []);

  return zoomLevel;
};

// Viewport width categories
export const useViewportCategory = () => {
  const [category, setCategory] = useState<'xl' | 'lg' | 'md' | 'sm' | 'xs'>('xl');

  useEffect(() => {
    const updateCategory = () => {
      const width = window.innerWidth;
      if (width >= 1536) setCategory('xl');
      else if (width >= 1280) setCategory('lg');
      else if (width >= 1024) setCategory('md');
      else if (width >= 768) setCategory('sm');
      else setCategory('xs');
    };

    updateCategory();
    window.addEventListener('resize', updateCategory);
    
    return () => window.removeEventListener('resize', updateCategory);
  }, []);

  return category;
};
