/**
 * Performance Monitoring
 * 
 * Track and report performance metrics
 */

export interface PerformanceMetric {
  name: string
  value: number
  unit: 'ms' | 'bytes' | 'count'
  timestamp: string
}

/**
 * Measure the execution time of an async function
 */
export async function measureAsync<T>(
  name: string,
  fn: () => Promise<T>
): Promise<T> {
  const startTime = performance.now()
  
  try {
    const result = await fn()
    const duration = performance.now() - startTime
    
    logPerformance({
      name,
      value: duration,
      unit: 'ms',
      timestamp: new Date().toISOString(),
    })
    
    return result
  } catch (error) {
    const duration = performance.now() - startTime
    
    logPerformance({
      name: `${name} (failed)`,
      value: duration,
      unit: 'ms',
      timestamp: new Date().toISOString(),
    })
    
    throw error
  }
}

/**
 * Log performance metric
 */
function logPerformance(metric: PerformanceMetric): void {
  if (process.env.NODE_ENV === 'development') {
    console.log(`⚡ Performance: ${metric.name} - ${metric.value.toFixed(2)}${metric.unit}`)
  }

  // In production, send to monitoring service
  if (process.env.NODE_ENV === 'production' && metric.value > 1000) {
    // Only report slow operations (> 1 second)
    console.warn(`Slow operation: ${metric.name} - ${metric.value}ms`)
  }
}

/**
 * Report Web Vitals
 */
export function reportWebVitals(metric: {
  id: string
  name: string
  value: number
  label: 'web-vital' | 'custom'
}): void {
  if (process.env.NODE_ENV === 'development') {
    console.log('📊 Web Vital:', metric)
  }

  // Send to analytics
  if (typeof window !== 'undefined' && (window as any).plausible) {
    (window as any).plausible('Web Vitals', {
      props: {
        metric_name: metric.name,
        value: Math.round(metric.value),
      },
    })
  }
}


