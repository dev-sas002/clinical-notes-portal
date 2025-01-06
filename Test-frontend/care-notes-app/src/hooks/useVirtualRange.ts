"use client"

import { useCallback, useEffect, useRef, useState } from "react"

export interface VirtualRangeOptions {
  itemCount: number
  /** Row height including the gap beneath it, in pixels. */
  itemHeight: number
  /** Visible height of the scrolling container, in pixels. */
  viewportHeight: number
  /** Extra rows kept mounted above and below the viewport. */
  overscan?: number
}

export interface VirtualRange {
  startIndex: number
  /** Exclusive. */
  endIndex: number
  /** Height of the whole list, so the scrollbar stays honest. */
  totalHeight: number
  /** Offset the rendered window is translated by. */
  offsetTop: number
}

/** Pure windowing maths, kept separate so it can be tested without a DOM. */
export const computeVirtualRange = (
  scrollTop: number,
  { itemCount, itemHeight, viewportHeight, overscan = 4 }: VirtualRangeOptions,
): VirtualRange => {
  const rowHeight = Math.max(1, itemHeight)
  const maxStart = Math.max(0, itemCount - 1)
  const startIndex = Math.min(
    maxStart,
    Math.max(0, Math.floor(Math.max(0, scrollTop) / rowHeight) - overscan),
  )
  const visibleRows = Math.ceil(Math.max(0, viewportHeight) / rowHeight) + overscan * 2

  return {
    startIndex: itemCount === 0 ? 0 : startIndex,
    endIndex: Math.min(itemCount, startIndex + visibleRows),
    totalHeight: itemCount * rowHeight,
    offsetTop: itemCount === 0 ? 0 : startIndex * rowHeight,
  }
}

/**
 * Render only the rows near the viewport.
 *
 * A page of notes can be 100 rows, and each row is a card with a badge, a
 * timestamp and two lines of text. Mounting every one of them is measurable
 * on the low-end tablets wards actually use, so above a threshold the list
 * becomes a fixed-height scroller that mounts roughly a screenful. Below the
 * threshold this is inert and the list renders normally - see README
 * "Design notes".
 */
export const useVirtualRange = (options: VirtualRangeOptions) => {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [scrollTop, setScrollTop] = useState(0)

  const onScroll = useCallback(() => {
    setScrollTop(containerRef.current?.scrollTop ?? 0)
  }, [])

  // A filter or page change re-seeds the list; start it back at the top.
  useEffect(() => {
    setScrollTop(0)
    if (containerRef.current) containerRef.current.scrollTop = 0
  }, [options.itemCount])

  return {
    containerRef,
    onScroll,
    range: computeVirtualRange(scrollTop, options),
  }
}
