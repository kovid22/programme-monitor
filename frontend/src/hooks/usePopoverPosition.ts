import { useState, useLayoutEffect } from 'react';
import type { RefObject } from 'react';

interface PositionOptions {
  anchorRef: RefObject<HTMLElement | null>;
  popoverRef: RefObject<HTMLElement | null>;
  isOpen: boolean;
  align?: 'left' | 'right';
  offset?: number;
}

export function usePopoverPosition({ anchorRef, popoverRef, isOpen, align = 'right', offset = 8 }: PositionOptions) {
  const [style, setStyle] = useState<{ top?: number; bottom?: number; left?: number; right?: number }>({});

  useLayoutEffect(() => {
    if (!isOpen || !anchorRef.current || !popoverRef.current) return;

    const updatePosition = () => {
      const anchorRect = anchorRef.current!.getBoundingClientRect();
      const popoverRect = popoverRef.current!.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      const newStyle: { top?: number; bottom?: number; left?: number; right?: number } = {};

      // Vertical positioning
      const spaceBelow = viewportHeight - anchorRect.bottom;
      const spaceAbove = anchorRect.top;
      const height = popoverRect.height;

      if (spaceBelow >= height + offset || spaceBelow > spaceAbove) {
        // Render below
        newStyle.top = anchorRect.bottom + offset;
      } else {
        // Render above
        newStyle.top = anchorRect.top - height - offset;
      }

      // Horizontal positioning
      const width = popoverRect.width;

      if (align === 'right') {
        const potentialLeft = anchorRect.right - width;
        if (potentialLeft >= 0) {
          // Align right edge to anchor right edge
          newStyle.left = potentialLeft;
        } else {
          // Shift to fit
          newStyle.left = Math.max(8, anchorRect.left);
        }
      } else {
        const potentialRight = anchorRect.left + width;
        if (potentialRight <= viewportWidth) {
          // Align left edge to anchor left edge
          newStyle.left = anchorRect.left;
        } else {
          // Shift to fit
          newStyle.left = Math.max(8, viewportWidth - width - 8);
        }
      }

      setStyle(newStyle);
    };

    updatePosition();
    
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true); // true for capturing phase to catch inner scrolls
    
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [isOpen, anchorRef, popoverRef, align, offset]);

  return style;
}
