import { isClient, isLocal } from './common'

const getStorageItem = (key: string): string | null => {
  if (!isClient()) return null
  return localStorage.getItem(key)
}

export const setStorageItem = (key: string, value: string | number): void => {
  if (!isClient()) return
  return localStorage.setItem(key, String(value))
}

const deleteStorageItem = (key: string): void => {
  if (!isClient()) return
  return localStorage.removeItem(key)
}

const getDevOnlyStorage = (key: string): string | null => {
  if (!isClient() || !isLocal()) return null
  return localStorage.getItem(key)
}
