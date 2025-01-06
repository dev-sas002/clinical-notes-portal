"use client"

import { useEffect, useRef } from "react"

export interface PollingOptions {
  /** Gap between ticks while the tab is visible. */
  intervalMs?: number
  /** Pause without unmounting - e.g. while a form is mid-submit. */
  enabled?: boolean
}

/**
 * Poll on an interval, but only while the tab is actually being looked at.
 *
 * Both screens used to poll every 60s unconditionally, so a forgotten tab
 * kept a ward's aggregate query running all night for nobody. This suspends
 * the timer on `visibilitychange` and fires one immediate refresh when the
 * tab comes back, which is both cheaper and fresher than waiting out the
 * remainder of an interval.
 */
export const usePolling = (
  task: () => void,
  { intervalMs = 60_000, enabled = true }: PollingOptions = {},
) => {
  const latestTask = useRef(task)
  latestTask.current = task

  useEffect(() => {
    if (!enabled) return

    let timer: ReturnType<typeof setInterval> | undefined

    const stop = () => {
      if (timer !== undefined) {
        clearInterval(timer)
        timer = undefined
      }
    }

    const start = () => {
      stop()
      timer = setInterval(() => latestTask.current(), intervalMs)
    }

    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        stop()
        return
      }
      // Back in focus: refresh now, then resume the cadence.
      latestTask.current()
      start()
    }

    if (document.visibilityState !== "hidden") start()
    document.addEventListener("visibilitychange", onVisibilityChange)

    return () => {
      stop()
      document.removeEventListener("visibilitychange", onVisibilityChange)
    }
  }, [enabled, intervalMs])
}
