"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Trash2 } from "lucide-react"

import { MonthYearPicker } from "@/components/ui/month-year-picker"

export type ProjectData = {
  id?: string;
  name: string;
  description: string | null;
  startDate: string | null;
  endDate: string | null;
  url: string | null;
  technologies: string[];
}

interface ProjectsEditorProps {
  projects: ProjectData[]
  onChange: (projects: ProjectData[]) => void
  aiProjects?: ProjectData[]
}

export function ProjectsEditor({ projects, onChange, aiProjects }: ProjectsEditorProps) {
  const handleAddProject = () => {
    onChange([
      ...projects,
      { name: "", description: "", startDate: "", endDate: "", url: "", technologies: [] }
    ])
  }

  const handleUpdateProject = (index: number, field: keyof ProjectData, value: any) => {
    const updated = [...projects]
    updated[index] = { ...updated[index], [field]: value }
    onChange(updated)
  }

  const handleRemoveProject = (index: number) => {
    const updated = [...projects]
    updated.splice(index, 1)
    onChange(updated)
  }

  const handleUseAiProjects = () => {
    if (aiProjects) {
      // Just append AI projects for now to avoid losing user data
      onChange([...projects, ...aiProjects])
    }
  }

  return (
    <div className="space-y-4 py-4 border-b">
      <div className="flex justify-between items-center">
        <Label className="text-base font-semibold">Projects</Label>
        {aiProjects && aiProjects.length > 0 && (
          <Button size="sm" variant="outline" onClick={handleUseAiProjects} type="button">
            Import {aiProjects.length} AI Detected Projects
          </Button>
        )}
      </div>
      
      <div className="space-y-6">
        {projects.map((project, index) => {
          // Validation: missing name or dates
          const missingName = !project.name.trim()
          const missingStart = !project.startDate?.trim()
          const missingEnd = !project.endDate?.trim()
          const hasError = missingName || missingStart || missingEnd

          return (
            <div key={index} className={`p-4 border rounded-md relative ${hasError ? 'border-red-300 bg-red-50/30 dark:border-red-900 dark:bg-red-900/10' : 'bg-white dark:bg-slate-900'}`}>
              <div className="absolute top-4 right-4">
                <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveProject(index)} className="text-slate-500 hover:text-red-500">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-4 pr-10">
                <div>
                  <Label>Project Name <span className="text-red-500">*</span></Label>
                  <Input 
                    value={project.name} 
                    onChange={(e) => handleUpdateProject(index, 'name', e.target.value)}
                    className={missingName ? 'border-red-500' : ''}
                    placeholder="e.g. AI Job Copilot"
                  />
                  {missingName && <p className="text-xs text-red-500 mt-1">Project name is required.</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Start Date <span className="text-red-500">*</span></Label>
                    <MonthYearPicker 
                      value={project.startDate} 
                      onChange={(val) => handleUpdateProject(index, 'startDate', val)}
                      error={missingStart}
                    />
                    {missingStart && <p className="text-xs text-red-500 mt-1">Start date is required.</p>}
                  </div>
                  <div>
                    <Label>End Date <span className="text-red-500">*</span></Label>
                    <MonthYearPicker 
                      value={project.endDate} 
                      onChange={(val) => handleUpdateProject(index, 'endDate', val)}
                      error={missingEnd}
                    />
                    {missingEnd && <p className="text-xs text-red-500 mt-1">End date is required.</p>}
                  </div>
                </div>

                <div>
                  <Label>Project URL</Label>
                  <Input 
                    value={project.url || ''} 
                    onChange={(e) => handleUpdateProject(index, 'url', e.target.value)}
                    placeholder="e.g. https://github.com/user/project"
                  />
                </div>

                <div>
                  <Label>Description</Label>
                  <Textarea 
                    value={project.description || ''} 
                    onChange={(e) => handleUpdateProject(index, 'description', e.target.value)}
                    placeholder="Describe your role and the project..."
                    className="min-h-[80px]"
                  />
                </div>

                <div>
                  <Label>Technologies (Comma separated)</Label>
                  <Input 
                    value={(project.technologies || []).join(', ')} 
                    onChange={(e) => {
                      const tech = e.target.value.split(',').map(t => t.trim()).filter(Boolean)
                      handleUpdateProject(index, 'technologies', tech)
                    }}
                    placeholder="e.g. React, Node.js, PostgreSQL"
                  />
                </div>
              </div>
            </div>
          )
        })}

        {projects.length === 0 && (
          <div className="text-center p-8 border border-dashed rounded-md text-muted-foreground">
            No projects added yet.
          </div>
        )}

        <Button type="button" onClick={handleAddProject} variant="outline" className="w-full border-dashed">
          <Plus className="w-4 h-4 mr-2" /> Add Project
        </Button>
      </div>
    </div>
  )
}
