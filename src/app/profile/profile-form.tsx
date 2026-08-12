"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { updateProfile } from "./actions"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

import { SkillsEditor } from "@/components/profile/skills-editor"
import { ProjectsEditor, ProjectData } from "@/components/profile/projects-editor"
import { ExperienceEditor, ExperienceData } from "@/components/profile/experience-editor"
import { EducationEditor, EducationData } from "@/components/profile/education-editor"

const profileSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  phone: z.string().optional().nullable(),
  currentTitle: z.string().min(1, "Current title is required"),
  yearsOfExperience: z.coerce.number().min(0, "Must be at least 0"),
  summary: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  linkedinUrl: z.string().url().optional().nullable().or(z.literal("")),
  githubUrl: z.string().url().optional().nullable().or(z.literal("")),
  portfolioUrl: z.string().url().optional().nullable().or(z.literal("")),
  skills: z.array(z.string()).default([]),
  projects: z.array(z.any()).default([]),
  experiences: z.array(z.any()).default([]),
  educations: z.array(z.any()).default([]),
})

type ProfileFormProps = {
  initialData: any
  userId: string
}

type ProfileFormValues = z.infer<typeof profileSchema>

export function ProfileForm({ initialData, userId }: ProfileFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema) as any,
    defaultValues: {
      firstName: initialData?.firstName || "",
      lastName: initialData?.lastName || "",
      phone: initialData?.phone || "",
      currentTitle: initialData?.currentTitle || "",
      yearsOfExperience: initialData?.yearsOfExperience || 0,
      summary: initialData?.summary || "",
      country: initialData?.country || "",
      city: initialData?.city || "",
      linkedinUrl: initialData?.linkedinUrl || "",
      githubUrl: initialData?.githubUrl || "",
      portfolioUrl: initialData?.portfolioUrl || "",
      skills: initialData?.skills || [],
      projects: initialData?.projects || [],
      experiences: initialData?.experiences || [],
      educations: initialData?.educations || [],
    },
  })

  async function onSubmit(values: z.infer<typeof profileSchema>) {
    // Validate projects before submitting
    const hasInvalidProject = values.projects.some((p: ProjectData) => !p.name?.trim() || !p.startDate?.trim() || !p.endDate?.trim())
    if (hasInvalidProject) {
      toast.error("Please fill out all required fields (Name, Start Date, End Date) for your projects.")
      return
    }
    setIsLoading(true)
    
    try {
      const result = await updateProfile(userId, values)
      
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Profile updated successfully")
        router.push("/dashboard")
      }
    } catch (error) {
      toast.error("Failed to update profile")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField control={form.control} name="firstName" render={({ field }) => (
            <FormItem><FormLabel>First Name</FormLabel><FormControl><Input {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="lastName" render={({ field }) => (
            <FormItem><FormLabel>Last Name</FormLabel><FormControl><Input {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="phone" render={({ field }) => (
            <FormItem><FormLabel>Phone Number</FormLabel><FormControl><Input {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="currentTitle" render={({ field }) => (
            <FormItem><FormLabel>Current Title</FormLabel><FormControl><Input {...field} value={field.value || ""} placeholder="e.g. Frontend Engineer" /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="yearsOfExperience" render={({ field }) => (
            <FormItem><FormLabel>Years of Experience</FormLabel><FormControl><Input type="number" {...field} value={field.value || 0} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="country" render={({ field }) => (
            <FormItem><FormLabel>Country</FormLabel><FormControl><Input {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="city" render={({ field }) => (
            <FormItem><FormLabel>City</FormLabel><FormControl><Input {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>
          )} />
        </div>

        <FormField control={form.control} name="summary" render={({ field }) => (
          <FormItem><FormLabel>Professional Summary</FormLabel><FormControl><Textarea className="h-32" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>
        )} />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FormField control={form.control} name="linkedinUrl" render={({ field }) => (
            <FormItem><FormLabel>LinkedIn URL</FormLabel><FormControl><Input type="url" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="githubUrl" render={({ field }) => (
            <FormItem><FormLabel>GitHub URL</FormLabel><FormControl><Input type="url" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="portfolioUrl" render={({ field }) => (
            <FormItem><FormLabel>Portfolio URL</FormLabel><FormControl><Input type="url" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>
          )} />
        </div>

        <FormField control={form.control} name="skills" render={({ field }) => (
          <FormItem>
            <FormControl>
              <SkillsEditor 
                skills={field.value} 
                onChange={field.onChange} 
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <FormField control={form.control} name="projects" render={({ field }) => (
          <FormItem>
            <FormControl>
              <ProjectsEditor 
                projects={field.value} 
                onChange={field.onChange} 
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <FormField control={form.control} name="experiences" render={({ field }) => (
          <FormItem>
            <FormControl>
              <ExperienceEditor 
                experiences={field.value} 
                onChange={field.onChange} 
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <FormField control={form.control} name="educations" render={({ field }) => (
          <FormItem>
            <FormControl>
              <EducationEditor 
                educations={field.value} 
                onChange={field.onChange} 
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <div className="flex justify-end gap-4 border-t pt-6">
          <Button type="button" variant="outline" onClick={() => form.reset()}>Cancel</Button>
          <Button type="submit" disabled={isLoading}>{isLoading ? "Saving..." : "Save Changes"}</Button>
        </div>
      </form>
    </Form>
  )
}
