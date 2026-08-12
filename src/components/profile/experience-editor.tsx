"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Trash2 } from "lucide-react"
import { MonthYearPicker } from "@/components/ui/month-year-picker"

export type ExperienceData = {
  id?: string;
  company: string;
  title: string;
  startDate: string | null;
  endDate: string | null;
  description: string | null;
  technologies: string[];
}

interface ExperienceEditorProps {
  experiences: ExperienceData[]
  onChange: (experiences: ExperienceData[]) => void
  aiExperiences?: ExperienceData[]
}

export function ExperienceEditor({ experiences, onChange, aiExperiences }: ExperienceEditorProps) {
  const handleAdd = () => {
    onChange([
      ...experiences,
      { company: "", title: "", startDate: "", endDate: "", description: "", technologies: [] }
    ])
  }

  const handleUpdate = (index: number, field: keyof ExperienceData, value: any) => {
    const updated = [...experiences]
    updated[index] = { ...updated[index], [field]: value }
    onChange(updated)
  }

  const handleRemove = (index: number) => {
    const updated = [...experiences]
    updated.splice(index, 1)
    onChange(updated)
  }

  const handleUseAiData = () => {
    if (aiExperiences) {
      onChange([...experiences, ...aiExperiences])
    }
  }

  return (
    <div className="space-y-4 py-4 border-b">
      <div className="flex justify-between items-center">
        <Label className="text-base font-semibold">Work Experience</Label>
        {aiExperiences && aiExperiences.length > 0 && (
          <Button size="sm" variant="outline" onClick={handleUseAiData} type="button">
            Import {aiExperiences.length} AI Detected Experiences
          </Button>
        )}
      </div>
      
      <div className="space-y-6">
        {experiences.map((exp, index) => {
          const missingCompany = !exp.company.trim()
          const missingTitle = !exp.title.trim()
          const missingStart = !exp.startDate?.trim()
          const hasError = missingCompany || missingTitle || missingStart

          return (
            <div key={index} className={`p-4 border rounded-md relative ${hasError ? 'border-red-300 bg-red-50/30 dark:border-red-900 dark:bg-red-900/10' : 'bg-white dark:bg-slate-900'}`}>
              <div className="absolute top-4 right-4">
                <Button type="button" variant="ghost" size="icon" onClick={() => handleRemove(index)} className="text-slate-500 hover:text-red-500">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-4 pr-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Company <span className="text-red-500">*</span></Label>
                    <Input 
                      value={exp.company} 
                      onChange={(e) => handleUpdate(index, 'company', e.target.value)}
                      className={missingCompany ? 'border-red-500' : ''}
                      placeholder="e.g. Google"
                    />
                  </div>
                  <div>
                    <Label>Job Title <span className="text-red-500">*</span></Label>
                    <Input 
                      value={exp.title} 
                      onChange={(e) => handleUpdate(index, 'title', e.target.value)}
                      className={missingTitle ? 'border-red-500' : ''}
                      placeholder="e.g. Senior Software Engineer"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Start Date <span className="text-red-500">*</span></Label>
                    <MonthYearPicker 
                      value={exp.startDate} 
                      onChange={(val) => handleUpdate(index, 'startDate', val)}
                      error={missingStart}
                    />
                  </div>
                  <div>
                    <Label>End Date</Label>
                    <MonthYearPicker 
                      value={exp.endDate} 
                      onChange={(val) => handleUpdate(index, 'endDate', val)}
                    />
                  </div>
                </div>

                <div>
                  <Label>Description / Responsibilities</Label>
                  <Textarea 
                    value={exp.description || ''} 
                    onChange={(e) => handleUpdate(index, 'description', e.target.value)}
                    placeholder="Describe your role, responsibilities, and achievements..."
                    className="min-h-[100px]"
                  />
                </div>
                
                <div>
                  <Label>Technologies (Comma separated)</Label>
                  <Input 
                    value={(exp.technologies || []).join(', ')} 
                    onChange={(e) => {
                      const tech = e.target.value.split(',').map(t => t.trim()).filter(Boolean)
                      handleUpdate(index, 'technologies', tech)
                    }}
                    placeholder="e.g. React, Node.js, AWS"
                  />
                </div>
              </div>
            </div>
          )
        })}

        {experiences.length === 0 && (
          <div className="text-center p-8 border border-dashed rounded-md text-muted-foreground">
            No work experience added yet.
          </div>
        )}

        <Button type="button" onClick={handleAdd} variant="outline" className="w-full border-dashed">
          <Plus className="w-4 h-4 mr-2" /> Add Experience
        </Button>
      </div>
    </div>
  )
}
