/**
 * Simple Virtual Scrolling Hook - React Concurrent Features
 */

import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react'
import { useConcurrentTransition } from './reactConcurrentFeatures'

interface VirtualScrollOptions {
  itemHeight: number
  containerHeight: number
  overscan?: number
  threshold?: number
}

export function useVirtualScroll<T>(
  items: T[], 
  options: VirtualScrollOptions
) {
  const { itemHeight, containerHeight, overscan = 5, threshold = 200 } = options
  const { executeTransition } = useConcurrentTransition()
  
  const [scrollTop, setScrollTop] = useState(0)
  const [isScrolling, setIsScrolling] = useState(false)
  const scrollTimeoutRef = useRef<number>()

  // Skip virtualization for small lists
  const shouldVirtualize = items.length > threshold

  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    const newScrollTop = event.currentTarget.scrollTop
    
    // Use transition for non-critical scroll updates
    executeTransition(() => {
      setScrollTop(newScrollTop)
      setIsScrolling(true)
    })

    // Clear existing timeout
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current)
    }

    // Set scrolling to false after scroll ends
    scrollTimeoutRef.current = window.setTimeout(() => {
      setIsScrolling(false)
    }, 150)
  }, [executeTransition])

  const virtualItems = useMemo(() => {
    if (!shouldVirtualize) {
      return items.map((_, index) => ({ index, item: items[index] }))
    }

    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan)
    const endIndex = Math.min(
      items.length,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
    )

    const visibleItems = []
    for (let i = startIndex; i < endIndex; i++) {
      visibleItems.push({ index: i, item: items[i] })
    }

    return visibleItems
  }, [items, scrollTop, containerHeight, itemHeight, overscan, shouldVirtualize])

  const totalHeight = shouldVirtualize ? items.length * itemHeight : 'auto'
  const offsetY = shouldVirtualize && virtualItems.length > 0 
    ? virtualItems[0].index * itemHeight 
    : 0

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current)
      }
    }
  }, [])

  return {
    virtualItems,
    totalHeight,
    offsetY,
    handleScroll,
    isScrolling,
    shouldVirtualize,
    scrollTop
  }
}