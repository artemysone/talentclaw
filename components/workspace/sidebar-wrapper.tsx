"use client"

import { createContext, useContext, useState, useCallback } from "react"

interface SidebarContextValue {
  open: boolean
  setOpen: (open: boolean) => void
  toggle: () => void
  collapsed: boolean
  setCollapsed: (collapsed: boolean) => void
  toggleCollapsed: () => void
}

const SidebarContext = createContext<SidebarContextValue>({
  open: false,
  setOpen: () => {},
  toggle: () => {},
  collapsed: false,
  setCollapsed: () => {},
  toggleCollapsed: () => {},
})

export const useSidebar = () => useContext(SidebarContext)

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(true)
  const toggle = useCallback(() => setOpen((v) => !v), [])
  const toggleCollapsed = useCallback(() => setCollapsed((v) => !v), [])

  return (
    <SidebarContext.Provider value={{ open, setOpen, toggle, collapsed, setCollapsed, toggleCollapsed }}>
      {children}
    </SidebarContext.Provider>
  )
}

export function SidebarShell({ children }: { children: React.ReactNode }) {
  const { open, setOpen, collapsed } = useSidebar()

  return (
    <>
      {/* Mobile backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/20 transition-opacity md:hidden ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={() => setOpen(false)}
      />
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[256px] bg-surface-sidebar border-r border-border-sidebar flex flex-col transition-all duration-200 ease-out ${
          open ? "translate-x-0" : "-translate-x-full"
        } md:relative md:z-auto md:translate-x-0 md:shrink-0 md:transition-[width] md:duration-300 ${
          collapsed ? "md:w-[48px] md:overflow-hidden" : "md:w-[256px]"
        }`}
      >
        {children}
      </aside>
    </>
  )
}
