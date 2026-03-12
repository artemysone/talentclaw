import { notFound } from "next/navigation"
import { readFileByPath } from "@/lib/fs-data"
import { FileViewer } from "@/components/file-viewer/file-viewer"

interface FilePageProps {
  params: Promise<{ path: string[] }>
}

export async function generateMetadata({ params }: FilePageProps) {
  const { path: segments } = await params
  const filename = segments[segments.length - 1]
  return {
    title: filename,
  }
}

export default async function FilePage({ params }: FilePageProps) {
  const { path: segments } = await params
  const relativePath = segments.join("/")

  const file = await readFileByPath(relativePath)
  if (!file) {
    notFound()
  }

  return (
    <div className="p-6 max-w-4xl">
      <FileViewer
        filePath={relativePath}
        frontmatter={file.frontmatter}
        content={file.content}
      />
    </div>
  )
}
