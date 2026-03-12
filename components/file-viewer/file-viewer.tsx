import type { FileType } from "@/lib/types"
import { JobHeader } from "./job-header"
import { ApplicationHeader } from "./application-header"
import { ProfileHeader } from "./profile-header"
import { CompanyHeader } from "./company-header"
import { ContactHeader } from "./contact-header"
import { MessageHeader } from "./message-header"
import { GenericHeader } from "./generic-header"
import { MarkdownBody } from "./markdown-body"

interface FileViewerProps {
  filePath: string
  frontmatter: Record<string, unknown>
  content: string
}

function detectFileType(filePath: string): FileType {
  if (filePath === "profile.md" || filePath === "profile") return "profile"
  if (filePath.startsWith("jobs/")) return "job"
  if (filePath.startsWith("applications/")) return "application"
  if (filePath.startsWith("companies/")) return "company"
  if (filePath.startsWith("contacts/")) return "contact"
  if (filePath.startsWith("messages/")) return "message"
  return "generic"
}

function renderHeader(
  fileType: FileType,
  frontmatter: Record<string, unknown>
) {
  switch (fileType) {
    case "job":
      return <JobHeader frontmatter={frontmatter} />
    case "application":
      return <ApplicationHeader frontmatter={frontmatter} />
    case "profile":
      return <ProfileHeader frontmatter={frontmatter} />
    case "company":
      return <CompanyHeader frontmatter={frontmatter} />
    case "contact":
      return <ContactHeader frontmatter={frontmatter} />
    case "message":
      return <MessageHeader frontmatter={frontmatter} />
    case "generic":
      return <GenericHeader frontmatter={frontmatter} />
  }
}

export function FileViewer({ filePath, frontmatter, content }: FileViewerProps) {
  const fileType = detectFileType(filePath)
  const hasFrontmatter = Object.keys(frontmatter).length > 0
  const hasContent = content.trim().length > 0

  return (
    <div className="space-y-6">
      {hasFrontmatter && renderHeader(fileType, frontmatter)}
      {hasContent && <MarkdownBody content={content} />}
    </div>
  )
}
