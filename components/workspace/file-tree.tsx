"use client"

import { useState, memo } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  ChevronRight,
  Folder,
  FolderOpen,
  FileText,
  FileCode,
} from "lucide-react"
import type { TreeNode } from "@/lib/types"
import { useSidebar } from "./sidebar-wrapper"

interface FileTreeProps {
  tree: TreeNode[]
}

function getDefaultExpanded(tree: TreeNode[]): Set<string> {
  const set = new Set<string>()
  for (const node of tree) {
    if (node.type === "directory") {
      set.add(node.path)
    }
  }
  return set
}

function fileIcon(name: string) {
  if (name.endsWith(".md")) {
    return <FileText className="w-3.5 h-3.5 shrink-0" />
  }
  return <FileCode className="w-3.5 h-3.5 shrink-0" />
}

function fileHref(nodePath: string): string {
  const cleaned = nodePath.endsWith(".md")
    ? nodePath.replace(/\.md$/, "")
    : nodePath
  return `/file/${cleaned}`
}

function normalizeFilePath(nodePath: string): string {
  return nodePath.endsWith(".md") ? nodePath.replace(/\.md$/, "") : nodePath
}

const TreeItem = memo(function TreeItem({
  node,
  depth,
  expanded,
  onToggle,
  activePath,
  onFileClick,
}: {
  node: TreeNode
  depth: number
  expanded: Set<string>
  onToggle: (path: string) => void
  activePath: string | null
  onFileClick: () => void
}) {
  const isDir = node.type === "directory"
  const isOpen = expanded.has(node.path)
  const active = !isDir && activePath === normalizeFilePath(node.path)

  if (isDir) {
    return (
      <div>
        <button
          onClick={() => onToggle(node.path)}
          className="flex items-center gap-1.5 w-full py-1 text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
          style={{ paddingLeft: depth * 12 }}
        >
          <ChevronRight
            className={`w-3 h-3 shrink-0 transition-transform ${
              isOpen ? "rotate-90" : ""
            }`}
          />
          {isOpen ? (
            <FolderOpen className="w-3.5 h-3.5 shrink-0" />
          ) : (
            <Folder className="w-3.5 h-3.5 shrink-0" />
          )}
          <span className="truncate">{node.name}</span>
          {node.count != null && node.count > 0 && (
            <span className="ml-auto mr-2 text-[10px] text-text-muted bg-surface-overlay px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
              {node.count}
            </span>
          )}
        </button>
        {isOpen && node.children && (
          <div>
            {node.children.map((child) => (
              <TreeItem
                key={child.path}
                node={child}
                depth={depth + 1}
                expanded={expanded}
                onToggle={onToggle}
                activePath={activePath}
                onFileClick={onFileClick}
              />
            ))}
          </div>
        )}
      </div>
    )
  }

  // File node
  return (
    <Link
      href={fileHref(node.path)}
      onClick={onFileClick}
      className={`flex items-center gap-1.5 py-1 transition-colors rounded-md ${
        active
          ? "bg-accent-subtle text-accent"
          : "text-text-secondary hover:text-text-primary hover:bg-surface-overlay"
      }`}
      style={{ paddingLeft: depth * 12 + 15 }}
    >
      {fileIcon(node.name)}
      <span className="truncate">{node.name}</span>
    </Link>
  )
})

export function FileTree({ tree }: FileTreeProps) {
  const pathname = usePathname()
  const { setOpen } = useSidebar()
  const [expanded, setExpanded] = useState<Set<string>>(
    () => getDefaultExpanded(tree)
  )

  const activePath = pathname.startsWith("/file/")
    ? pathname.slice("/file/".length)
    : null

  const onToggle = (path: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(path)) {
        next.delete(path)
      } else {
        next.add(path)
      }
      return next
    })
  }

  const onFileClick = () => setOpen(false)

  return (
    <div className="font-mono text-[12px] px-1">
      {tree.map((node) => (
        <TreeItem
          key={node.path}
          node={node}
          depth={1}
          expanded={expanded}
          onToggle={onToggle}
          activePath={activePath}
          onFileClick={onFileClick}
        />
      ))}
    </div>
  )
}
