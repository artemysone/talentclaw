"use client"

import { useState } from "react"
import { MapPin, DollarSign, Wifi, Tag } from "lucide-react"

export function Filters() {
  const [remote, setRemote] = useState(false)
  const [location, setLocation] = useState("")
  const [minComp, setMinComp] = useState("")
  const [maxComp, setMaxComp] = useState("")
  const [skills, setSkills] = useState("")

  return (
    <div className="bg-surface-raised rounded-xl border border-border-subtle p-5 space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Skills */}
        <div>
          <label className="flex items-center gap-1.5 text-xs font-medium text-text-secondary mb-1.5">
            <Tag className="w-3 h-3" />
            Skills
          </label>
          <input
            type="text"
            value={skills}
            onChange={(e) => setSkills(e.target.value)}
            placeholder="TypeScript, React..."
            className="w-full px-3 py-2 rounded-lg bg-surface-overlay border border-border-subtle text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent/40 transition-colors"
          />
        </div>

        {/* Location */}
        <div>
          <label className="flex items-center gap-1.5 text-xs font-medium text-text-secondary mb-1.5">
            <MapPin className="w-3 h-3" />
            Location
          </label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="San Francisco, NYC..."
            className="w-full px-3 py-2 rounded-lg bg-surface-overlay border border-border-subtle text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent/40 transition-colors"
          />
        </div>

        {/* Compensation */}
        <div>
          <label className="flex items-center gap-1.5 text-xs font-medium text-text-secondary mb-1.5">
            <DollarSign className="w-3 h-3" />
            Compensation Range
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={minComp}
              onChange={(e) => setMinComp(e.target.value)}
              placeholder="Min"
              className="w-full px-3 py-2 rounded-lg bg-surface-overlay border border-border-subtle text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent/40 transition-colors"
            />
            <span className="text-text-muted text-xs">-</span>
            <input
              type="number"
              value={maxComp}
              onChange={(e) => setMaxComp(e.target.value)}
              placeholder="Max"
              className="w-full px-3 py-2 rounded-lg bg-surface-overlay border border-border-subtle text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent/40 transition-colors"
            />
          </div>
        </div>

        {/* Remote toggle */}
        <div>
          <label className="flex items-center gap-1.5 text-xs font-medium text-text-secondary mb-1.5">
            <Wifi className="w-3 h-3" />
            Remote Only
          </label>
          <button
            onClick={() => setRemote(!remote)}
            className={`w-full px-3 py-2 rounded-lg border text-sm font-medium transition-colors cursor-pointer ${
              remote
                ? "bg-accent-subtle border-accent/40 text-accent"
                : "bg-surface-overlay border-border-subtle text-text-secondary hover:border-accent/30"
            }`}
          >
            {remote ? "Remote Only" : "All Locations"}
          </button>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          onClick={() => {
            setRemote(false)
            setLocation("")
            setMinComp("")
            setMaxComp("")
            setSkills("")
          }}
          className="text-xs text-text-muted hover:text-text-secondary transition-colors cursor-pointer"
        >
          Clear all
        </button>
        <button className="px-4 py-1.5 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent-hover transition-colors cursor-pointer">
          Apply Filters
        </button>
      </div>
    </div>
  )
}
