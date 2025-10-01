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
    
    // Determine responsive behavior - more reasonable breakpoints
    let shouldCompactCards = idealColumnWidth < 200; // Only compact when really tight
    let shouldHideDetails = idealColumnWidth < 160;  // Only hide details when extremely tight
    
    // Override: At normal zoom levels, prefer comfortable view unless really constrained
    if (isNormalZoom && idealColumnWidth > 180) {
      shouldCompactCards = false;
    }
    
    // Debug logging to understand what's happening
    console.log('Responsive Kanban Debug:', {
      containerWidth,
      idealColumnWidth,
      zoomLevel,
      isNormalZoom,
      shouldCompactCards,
      shouldHideDetails
    });
    const columnWidth = Math.max(Math.min(idealColumnWidth, maxColumnWidth), minColumnWidth);
    
    // Dynamic font sizing based on available space - more reasonable breakpoints
    const fontSize = idealColumnWidth > 280 ? '0.875rem' : 
                    idealColumnWidth > 200 ? '0.8125rem' : '0.75rem';
    
    // Dynamic gap sizing - more reasonable breakpoints
    const gapSize = idealColumnWidth > 280 ? '0.75rem' : 
                   idealColumnWidth > 200 ? '0.5rem' : '0.25rem';

    setState({
      columnWidth: `${columnWidth}px`,
      shouldCompactCards,
      shouldHideDetails,
      fontSize,
      gap: gapSize
    });
  }, [config]);

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
