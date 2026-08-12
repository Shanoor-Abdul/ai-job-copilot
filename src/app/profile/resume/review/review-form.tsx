"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { confirmResumeReview } from "./actions"

import { SkillsEditor } from "@/components/profile/skills-editor"
import { ProjectsEditor, ProjectData } from "@/components/profile/projects-editor"

export function ReviewForm({ resumeId, parsedData, existingProfile }: { resumeId: string, parsedData: any, existingProfile: any }) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Initialize form state. Prefer existing profile data, fallback to parsed AI data.
  const [formData, setFormData] = useState({
    firstName: existingProfile?.firstName || parsedData?.personal?.firstName || "",
    lastName: existingProfile?.lastName || parsedData?.personal?.lastName || "",
    phone: existingProfile?.phone || parsedData?.personal?.phone || "",
    currentTitle: existingProfile?.currentTitle || parsedData?.professional?.currentTitle || "",
    yearsOfExperience: existingProfile?.yearsOfExperience || parsedData?.professional?.yearsOfExperience || 0,
    summary: existingProfile?.summary || parsedData?.professional?.professionalSummary || "",
    location: existingProfile?.city || parsedData?.personal?.location || "",
    linkedinUrl: existingProfile?.linkedinUrl || parsedData?.links?.linkedin || "",
    githubUrl: existingProfile?.githubUrl || parsedData?.links?.github || "",
    portfolioUrl: existingProfile?.portfolioUrl || parsedData?.links?.portfolio || "",
    skills: existingProfile?.skills?.length ? existingProfile.skills : (parsedData?.skills || []),
    projects: existingProfile?.projects?.length ? existingProfile.projects : (parsedData?.projects || []),
  })

  const handleUseAiValue = (field: keyof typeof formData, aiValue: any) => {
    setFormData(prev => ({ ...prev, [field]: aiValue }))
  }

  const handleChange = (field: keyof typeof formData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async () => {
    // Validate projects before submitting
    const hasInvalidProject = formData.projects.some((p: ProjectData) => !p.name.trim() || !p.startDate?.trim() || !p.endDate?.trim())
    if (hasInvalidProject) {
      toast.error("Please fill out all required fields (Name, Start Date, End Date) for your projects.")
      return
    }

    setIsSubmitting(true)
    try {
      const result = await confirmResumeReview(resumeId, {
        ...formData,
        city: formData.location // Map location to city for now
      })
      if (result.success) {
        toast.success("Profile updated with resume data!")
        router.push("/profile")
      }
    } catch (e: any) {
      toast.error(e.message || "Failed to confirm review")
    } finally {
      setIsSubmitting(false)
    }
  }

  const FieldRow = ({ label, field, aiValue }: { label: string, field: keyof typeof formData, aiValue: string | number | null }) => {
    const existingValue = formData[field] as string | number
    const hasConflict = aiValue && String(aiValue) !== String(existingValue)

    return (
      <div className="space-y-2 py-4 border-b last:border-0">
        <Label className="text-base font-semibold">{label}</Label>
        
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
          <div className="flex-1 w-full">
            {field === 'summary' ? (
              <Textarea 
                value={existingValue} 
                onChange={(e) => handleChange(field, e.target.value)} 
                className="min-h-[100px]"
              />
            ) : (
              <Input 
                value={existingValue} 
                onChange={(e) => handleChange(field, field === 'yearsOfExperience' ? Number(e.target.value) : e.target.value)} 
              />
            )}
          </div>
          
          {hasConflict && (
            <div className="flex-1 w-full bg-slate-100 dark:bg-slate-800 p-3 rounded-md flex flex-col md:flex-row justify-between items-start md:items-center gap-2 text-sm">
              <div>
                <span className="text-xs text-muted-foreground uppercase font-semibold block mb-1">AI Detected</span>
                <span>{aiValue}</span>
              </div>
              <Button size="sm" variant="secondary" onClick={() => handleUseAiValue(field, aiValue)}>
                Use AI Value
              </Button>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold">Personal Information</h2>
        <FieldRow label="First Name" field="firstName" aiValue={parsedData?.personal?.firstName} />
        <FieldRow label="Last Name" field="lastName" aiValue={parsedData?.personal?.lastName} />
        <FieldRow label="Phone" field="phone" aiValue={parsedData?.personal?.phone} />
        <FieldRow label="Location" field="location" aiValue={parsedData?.personal?.location} />
      </div>

      <div className="space-y-1 mt-8">
        <h2 className="text-lg font-semibold">Professional Information</h2>
        <FieldRow label="Current Title" field="currentTitle" aiValue={parsedData?.professional?.currentTitle} />
        <FieldRow label="Years of Experience" field="yearsOfExperience" aiValue={parsedData?.professional?.yearsOfExperience} />
        <FieldRow label="Professional Summary" field="summary" aiValue={parsedData?.professional?.professionalSummary} />
      </div>

      <div className="space-y-1 mt-8">
        <h2 className="text-lg font-semibold">Links</h2>
        <FieldRow label="LinkedIn" field="linkedinUrl" aiValue={parsedData?.links?.linkedin} />
        <FieldRow label="GitHub" field="githubUrl" aiValue={parsedData?.links?.github} />
        <FieldRow label="Portfolio" field="portfolioUrl" aiValue={parsedData?.links?.portfolio} />
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-semibold">Skills & Projects</h2>
        <SkillsEditor 
          skills={formData.skills} 
          onChange={(s) => handleChange('skills', s)}
          aiSkills={existingProfile?.skills?.length ? parsedData?.skills : undefined}
        />
        <ProjectsEditor 
          projects={formData.projects}
          onChange={(p) => handleChange('projects', p)}
          aiProjects={existingProfile?.projects?.length ? parsedData?.projects : undefined}
        />
      </div>

      <div className="mt-8">
        <h3 className="text-md font-medium mb-2">Other Data Extracted (Phase 2 Preview)</h3>
        <p className="text-sm text-muted-foreground mb-4">Education and Work Experience have been parsed and securely stored in the database for upcoming features.</p>
        <div className="bg-slate-100 dark:bg-slate-900 p-4 rounded text-xs font-mono overflow-auto max-h-[200px]">
          {JSON.stringify({ 
            education: parsedData?.education, 
            experience: parsedData?.experience,
            achievements: parsedData?.achievements
          }, null, 2)}
        </div>
      </div>

      <div className="flex justify-end gap-4 pt-6 mt-8 border-t">
        <Button variant="outline" onClick={() => router.push("/profile/resume")}>Cancel</Button>
        <Button onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Confirm & Update Profile"}
        </Button>
      </div>
    </div>
  )
}
