'use client'

import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { 
  Filter, 
  Calendar,
  Share2,
  X,
  Clock,
  Users,
  Eye,
  TrendingUp
} from "lucide-react"
import { useEffect, useState, useMemo, useCallback } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'

export interface FilterState {
  dateRange: {
    from: string
    to: string
  }
  metrics: {
    pageViews: { min: number; max: number }
    uniqueVisitors: { min: number; max: number }
    bounceRate: { min: number; max: number }
    sessionDuration: { min: number; max: number }
  }
  timeRange: string // '1h', '24h', '7d', '30d', 'all'
  sites: string[]
}

export const defaultFilters: FilterState = {
  dateRange: { from: '', to: '' },
  metrics: {
    pageViews: { min: 0, max: 10000 },
    uniqueVisitors: { min: 0, max: 5000 },
    bounceRate: { min: 0, max: 100 },
    sessionDuration: { min: 0, max: 600 }
  },
  timeRange: 'all',
  sites: []
}

interface DashboardFiltersProps {
  onFiltersChange: (filters: FilterState) => void
  dataCount?: number
  className?: string
}

export function DashboardFilters({ 
  onFiltersChange, 
  dataCount = 0,
  className = ""
}: DashboardFiltersProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  
  const [filters, setFilters] = useState<FilterState>(defaultFilters)

  // Parse filters from URL search params
  const parseFiltersFromURL = useCallback((searchParams: URLSearchParams): FilterState => {
    return {
      dateRange: {
        from: searchParams.get('from') || '',
        to: searchParams.get('to') || ''
      },
      timeRange: searchParams.get('timeRange') || 'all',
      metrics: {
        pageViews: {
          min: parseInt(searchParams.get('pageViewsMin') || '0'),
          max: parseInt(searchParams.get('pageViewsMax') || '10000')
        },
        uniqueVisitors: {
          min: parseInt(searchParams.get('uniqueVisitorsMin') || '0'),
          max: parseInt(searchParams.get('uniqueVisitorsMax') || '5000')
        },
        bounceRate: {
          min: parseInt(searchParams.get('bounceRateMin') || '0'),
          max: parseInt(searchParams.get('bounceRateMax') || '100')
        },
        sessionDuration: {
          min: parseInt(searchParams.get('sessionDurationMin') || '0'),
          max: parseInt(searchParams.get('sessionDurationMax') || '600')
        }
      },
      sites: searchParams.get('sites')?.split(',').filter(Boolean) || []
    }
  }, [])

  // Initialize filters from URL params on mount
  useEffect(() => {
    const urlFilters = parseFiltersFromURL(searchParams)
    setFilters(urlFilters)
    onFiltersChange(urlFilters)
  }, [searchParams, parseFiltersFromURL, onFiltersChange])

  // Create query string from filters
  const createQueryString = useCallback(
    (newFilters: FilterState) => {
      const params = new URLSearchParams(searchParams.toString())
      
      // Clear existing filter params
      params.delete('from')
      params.delete('to')
      params.delete('timeRange')
      params.delete('sites')
      
      // Clear metric params
      Object.keys(defaultFilters.metrics).forEach(key => {
        params.delete(`${key}Min`)
        params.delete(`${key}Max`)
      })
      
      // Set new filter params
      if (newFilters.dateRange.from) params.set('from', newFilters.dateRange.from)
      if (newFilters.dateRange.to) params.set('to', newFilters.dateRange.to)
      if (newFilters.timeRange !== 'all') params.set('timeRange', newFilters.timeRange)
      
      // Add metric filters
      Object.entries(newFilters.metrics).forEach(([key, value]) => {
        const defaultMax = defaultFilters.metrics[key as keyof typeof defaultFilters.metrics].max
        if (value.min > 0) params.set(`${key}Min`, value.min.toString())
        if (value.max < defaultMax) params.set(`${key}Max`, value.max.toString())
      })
      
      if (newFilters.sites.length > 0) params.set('sites', newFilters.sites.join(','))
      
      return params.toString()
    },
    [searchParams]
  )

  // Update URL when filters change
  const updateURL = useCallback((newFilters: FilterState) => {
    const queryString = createQueryString(newFilters)
    const newURL = queryString ? `${pathname}?${queryString}` : pathname
    router.replace(newURL, { scroll: false })
  }, [pathname, router, createQueryString])

  const updateFilters = useCallback((newFilters: Partial<FilterState>) => {
    const updatedFilters = { ...filters, ...newFilters }
    setFilters(updatedFilters)
    updateURL(updatedFilters)
    onFiltersChange(updatedFilters)
  }, [filters, updateURL, onFiltersChange])

  const clearFilters = useCallback(() => {
    setFilters(defaultFilters)
    router.replace(pathname, { scroll: false })
    onFiltersChange(defaultFilters)
  }, [router, pathname, onFiltersChange])

  const shareURL = useCallback(() => {
    const currentURL = `${window.location.origin}${pathname}?${createQueryString(filters)}`
    navigator.clipboard.writeText(currentURL)
    // You could add a toast notification here
  }, [pathname, createQueryString, filters])

  const getActiveFiltersCount = useCallback(() => {
    let count = 0
    if (filters.dateRange.from || filters.dateRange.to) count++
    if (filters.timeRange !== 'all') count++
    if (filters.sites.length > 0) count++
    
    Object.entries(filters.metrics).forEach(([key, metric]) => {
      const defaultMetric = defaultFilters.metrics[key as keyof typeof defaultFilters.metrics]
      if (metric.min > 0 || metric.max < defaultMetric.max) count++
    })
    
    return count
  }, [filters])

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Button
        variant="outline"
        onClick={shareURL}
        className="flex items-center gap-2"
      >
        <Share2 className="h-4 w-4" />
        Share
      </Button>
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filters
            {getActiveFiltersCount() > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                {getActiveFiltersCount()}
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80">
          <DropdownMenuLabel className="flex items-center justify-between">
            Filters
            {getActiveFiltersCount() > 0 && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Clear All
              </Button>
            )}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          {/* Time Range Filter */}
          <div className="p-2">
            <Label className="text-xs font-medium flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Time Range
            </Label>
            <div className="grid grid-cols-2 gap-1 mt-1">
              {[
                { value: 'all', label: 'All Time' },
                { value: '1h', label: '1 Hour' },
                { value: '24h', label: '24 Hours' },
                { value: '7d', label: '7 Days' },
                { value: '30d', label: '30 Days' }
              ].map(option => (
                <Button
                  key={option.value}
                  variant={filters.timeRange === option.value ? "default" : "ghost"}
                  size="sm"
                  className="text-xs h-7"
                  onClick={() => updateFilters({ timeRange: option.value })}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>
          
          <DropdownMenuSeparator />
          
          {/* Date Range Filter */}
          <div className="p-2">
            <Label className="text-xs font-medium flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Custom Date Range
            </Label>
            <div className="space-y-2 mt-1">
              <Input
                type="date"
                placeholder="From"
                value={filters.dateRange.from}
                onChange={(e) => updateFilters({ 
                  dateRange: { ...filters.dateRange, from: e.target.value }
                })}
                className="h-7 text-xs"
              />
              <Input
                type="date"
                placeholder="To"
                value={filters.dateRange.to}
                onChange={(e) => updateFilters({ 
                  dateRange: { ...filters.dateRange, to: e.target.value }
                })}
                className="h-7 text-xs"
              />
            </div>
          </div>
          
          <DropdownMenuSeparator />
          
          {/* Metrics Filters */}
          <div className="p-2 max-h-60 overflow-y-auto">
            <Label className="text-xs font-medium flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              Metrics Range
            </Label>
            
            {Object.entries(filters.metrics).map(([key, value]) => (
              <div key={key} className="mt-2">
                <Label className="text-xs text-muted-foreground capitalize flex items-center gap-1">
                  {key === 'pageViews' && <Eye className="h-3 w-3" />}
                  {key === 'uniqueVisitors' && <Users className="h-3 w-3" />}
                  {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                </Label>
                <div className="flex gap-1 mt-1">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={value.min}
                    onChange={(e) => updateFilters({
                      metrics: {
                        ...filters.metrics,
                        [key]: { ...value, min: parseInt(e.target.value) || 0 }
                      }
                    })}
                    className="h-6 text-xs"
                  />
                  <Input
                    type="number"
                    placeholder="Max"
                    value={value.max}
                    onChange={(e) => updateFilters({
                      metrics: {
                        ...filters.metrics,
                        [key]: { ...value, max: parseInt(e.target.value) || 0 }
                      }
                    })}
                    className="h-6 text-xs"
                  />
                </div>
              </div>
            ))}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
      
      {/* Data Count Display */}
      {dataCount > 0 && (
        <span className="text-sm text-muted-foreground">
          {dataCount} data points
        </span>
      )}
    </div>
  )
}

// Active Filters Display Component
interface ActiveFiltersProps {
  filters: FilterState
  onUpdateFilters: (filters: Partial<FilterState>) => void
  className?: string
}

export function ActiveFilters({ filters, onUpdateFilters, className = "" }: ActiveFiltersProps) {
  const getActiveFiltersCount = () => {
    let count = 0
    if (filters.dateRange.from || filters.dateRange.to) count++
    if (filters.timeRange !== 'all') count++
    if (filters.sites.length > 0) count++
    
    Object.entries(filters.metrics).forEach(([key, metric]) => {
      const defaultMetric = defaultFilters.metrics[key as keyof typeof defaultFilters.metrics]
      if (metric.min > 0 || metric.max < defaultMetric.max) count++
    })
    
    return count
  }

  if (getActiveFiltersCount() === 0) return null

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {filters.timeRange !== 'all' && (
        <Badge variant="secondary" className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {filters.timeRange}
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-4 w-4 p-0 hover:bg-transparent"
            onClick={() => onUpdateFilters({ timeRange: 'all' })}
          >
            <X className="h-3 w-3" />
          </Button>
        </Badge>
      )}
      {(filters.dateRange.from || filters.dateRange.to) && (
        <Badge variant="secondary" className="flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          {filters.dateRange.from} - {filters.dateRange.to}
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-4 w-4 p-0 hover:bg-transparent"
            onClick={() => onUpdateFilters({ dateRange: { from: '', to: '' } })}
          >
            <X className="h-3 w-3" />
          </Button>
        </Badge>
      )}
      {filters.sites.length > 0 && (
        <Badge variant="secondary" className="flex items-center gap-1">
          Sites: {filters.sites.join(', ')}
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-4 w-4 p-0 hover:bg-transparent"
            onClick={() => onUpdateFilters({ sites: [] })}
          >
            <X className="h-3 w-3" />
          </Button>
        </Badge>
      )}
    </div>
  )
}

// Hook for filtering data
export function useDataFilter<T extends Record<string, any>>(
  data: T[], 
  filters: FilterState,
  options?: {
    timestampField?: string
    siteField?: string
    pageViewsField?: string
    uniqueVisitorsField?: string
    bounceRateField?: string
    sessionDurationField?: string
  }
) {
  const {
    timestampField = 'timestamp',
    siteField = 'site',
    pageViewsField = 'pageViews',
    uniqueVisitorsField = 'uniqueVisitors',
    bounceRateField = 'bounceRate',
    sessionDurationField = 'sessionDuration'
  } = options || {}

  return useMemo(() => {
    if (!data || data.length === 0) return []
    
    return data.filter(item => {
      // Date range filter
      if (filters.dateRange.from || filters.dateRange.to) {
        const itemDate = new Date(item[timestampField] || Date.now())
        if (filters.dateRange.from && itemDate < new Date(filters.dateRange.from)) return false
        if (filters.dateRange.to && itemDate > new Date(filters.dateRange.to)) return false
      }
      
      // Time range filter
      if (filters.timeRange !== 'all') {
        const now = new Date()
        const itemDate = new Date(item[timestampField] || Date.now())
        const timeDiff = now.getTime() - itemDate.getTime()
        
        switch (filters.timeRange) {
          case '1h':
            if (timeDiff > 60 * 60 * 1000) return false
            break
          case '24h':
            if (timeDiff > 24 * 60 * 60 * 1000) return false
            break
          case '7d':
            if (timeDiff > 7 * 24 * 60 * 60 * 1000) return false
            break
          case '30d':
            if (timeDiff > 30 * 24 * 60 * 60 * 1000) return false
            break
        }
      }
      
      // Metrics filters
      const pageViews = item[pageViewsField] || 0
      const uniqueVisitors = item[uniqueVisitorsField] || 0
      const bounceRate = item[bounceRateField] || 0
      const sessionDuration = item[sessionDurationField] || 0
      
      if (pageViews < filters.metrics.pageViews.min || pageViews > filters.metrics.pageViews.max) return false
      if (uniqueVisitors < filters.metrics.uniqueVisitors.min || uniqueVisitors > filters.metrics.uniqueVisitors.max) return false
      if (bounceRate < filters.metrics.bounceRate.min || bounceRate > filters.metrics.bounceRate.max) return false
      if (sessionDuration < filters.metrics.sessionDuration.min || sessionDuration > filters.metrics.sessionDuration.max) return false
      
      // Site filter
      if (filters.sites.length > 0 && item[siteField] && !filters.sites.includes(item[siteField])) return false
      
      return true
    })
  }, [data, filters, timestampField, siteField, pageViewsField, uniqueVisitorsField, bounceRateField, sessionDurationField])
}