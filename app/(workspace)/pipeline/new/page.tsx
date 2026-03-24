import { JobForm } from "@/components/jobs/job-form"

export default function NewJobPage() {
  return (
    <div className="max-w-2xl mx-auto px-5 py-8">
      <div className="mb-8">
        <h1 className="font-prose text-2xl text-text-primary">Add a Job</h1>
        <p className="text-sm text-text-secondary mt-1">
          Found something interesting? Add it to your pipeline and track it here.
        </p>
      </div>
      <JobForm />
    </div>
  )
}
