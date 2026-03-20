import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

/**
 * Generic hook for fetching data from a Supabase table.
 * @param {string} table - Table name
 * @param {object} [options]
 * @param {string} [options.orderBy] - Column to order by
 * @param {boolean} [options.ascending] - Order direction
 * @param {string} [options.select] - Select clause
 * @param {boolean} [options.single] - Fetch single record
 * @param {Array<{column: string, value: any}>} [options.filters] - eq filters
 */
export function useSupabaseQuery(table, options = {}) {
  const [data, setData] = useState(options.single ? null : [])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      let query = supabase.from(table).select(options.select || '*')

      if (options.filters) {
        for (const f of options.filters) {
          query = query.eq(f.column, f.value)
        }
      }

      if (options.orderBy) {
        query = query.order(options.orderBy, { ascending: options.ascending ?? false })
      }

      if (options.single) {
        query = query.limit(1).single()
      }

      const { data: result, error: err } = await query
      if (err) throw err
      setData(result)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [table, options.select, options.orderBy, options.ascending, options.single,
      JSON.stringify(options.filters)])

  useEffect(() => { fetch() }, [fetch])

  return { data, loading, error, refetch: fetch }
}

/**
 * Hook for saving a record back to Supabase.
 * @param {string} table
 */
export function useSupabaseMutation(table) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const upsert = useCallback(async (record) => {
    setSaving(true)
    setError(null)
    try {
      const { data, error: err } = await supabase
        .from(table)
        .upsert(record, { onConflict: 'id' })
        .select()
      if (err) throw err
      return data
    } catch (err) {
      setError(err.message)
      return null
    } finally {
      setSaving(false)
    }
  }, [table])

  const insert = useCallback(async (record) => {
    setSaving(true)
    setError(null)
    try {
      const { data, error: err } = await supabase
        .from(table)
        .insert(record)
        .select()
      if (err) throw err
      return data
    } catch (err) {
      setError(err.message)
      return null
    } finally {
      setSaving(false)
    }
  }, [table])

  const remove = useCallback(async (id) => {
    setSaving(true)
    setError(null)
    try {
      const { error: err } = await supabase.from(table).delete().eq('id', id)
      if (err) throw err
      return true
    } catch (err) {
      setError(err.message)
      return false
    } finally {
      setSaving(false)
    }
  }, [table])

  return { upsert, insert, remove, saving, error }
}
