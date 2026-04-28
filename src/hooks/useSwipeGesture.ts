/**
 * useSwipeGesture Hook - Basic swipe gesture detection for mobile
 * 
 * Provides simple swipe gesture detection for mobile-friendly interactions
 * 
 * Created: 2025-07-09
 * Feature: Issue #15 - Mobile Swipe Gestures
 */

import { useRef, useCallback, TouchEvent } from 'react';

interface SwipeGestureOptions {
  threshold?: number; // Minimum distance for swipe (px)
  velocityThreshold?: number; // Minimum velocity for swipe (px/ms)
  preventDefaultTouchmove?: boolean;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
}

interface TouchPoint {
  x: number;
  y: number;
  time: number;
}

export const useSwipeGesture = (options: SwipeGestureOptions = {}) => {
  const {
    threshold = 50,
    velocityThreshold = 0.3,
    preventDefaultTouchmove = false,
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
  } = options;

  const touchStart = useRef<TouchPoint | null>(null);
  const touchEnd = useRef<TouchPoint | null>(null);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    touchEnd.current = null; // Reset touch end
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      touchStart.current = {
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now(),
      };
    }
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (preventDefaultTouchmove) {
      e.preventDefault();
    }
  }, [preventDefaultTouchmove]);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (!touchStart.current) return;
    
    if (e.changedTouches.length === 1) {
      const touch = e.changedTouches[0];
      touchEnd.current = {
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now(),
      };
    }

    if (!touchEnd.current) return;

    const deltaX = touchEnd.current.x - touchStart.current.x;
    const deltaY = touchEnd.current.y - touchStart.current.y;
    const deltaTime = touchEnd.current.time - touchStart.current.time;
    
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);
    
    // Calculate velocity
    const velocityX = absX / deltaTime;
    const velocityY = absY / deltaTime;
    
    // Check if swipe meets threshold and velocity requirements
    if (absX < threshold && absY < threshold) return;
    if (velocityX < velocityThreshold && velocityY < velocityThreshold) return;
    
    // Determine swipe direction (favor the axis with larger movement)
    if (absX > absY) {
      // Horizontal swipe
      if (deltaX > 0) {
        onSwipeRight?.();
      } else {
        onSwipeLeft?.();
      }
    } else {
      // Vertical swipe
      if (deltaY > 0) {
        onSwipeDown?.();
      } else {
        onSwipeUp?.();
      }
    }
    
    // Reset touch points
    touchStart.current = null;
    touchEnd.current = null;
  }, [threshold, velocityThreshold, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown]);

  return {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
  };
};

export default useSwipeGesture;