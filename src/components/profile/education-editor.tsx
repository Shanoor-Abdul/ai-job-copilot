"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Trash2 } from "lucide-react"
import { MonthYearPicker } from "@/components/ui/month-year-picker"

export type EducationData = {
  id?: string;
  institution: string;
  degree: string | null;
  fieldOfStudy: string | null;
  startDate: string | null;
  endDate: string | null;
}

interface EducationEditorProps {
  educations: EducationData[]
  onChange: (educations: EducationData[]) => void
  aiEducations?: EducationData[]
}

export function EducationEditor({ educations, onChange, aiEducations }: EducationEditorProps) {
  const handleAdd = () => {
    onChange([
      ...educations,
      { institution: "", degree: "", fieldOfStudy: "", startDate: "", endDate: "" }
    ])
  }

  const handleUpdate = (index: number, field: keyof EducationData, value: any) => {
    const updated = [...educations]
    updated[index] = { ...updated[index], [field]: value }
    onChange(updated)
  }

  const handleRemove = (index: number) => {
    const updated = [...educations]
    updated.splice(index, 1)
    onChange(updated)
  }

  const handleUseAiData = () => {
    if (aiEducations) {
      onChange([...educations, ...aiEducations])
    }
  }

  return (
    <div className="space-y-4 py-4 border-b">
      <div className="flex justify-between items-center">
        <Label className="text-base font-semibold">Education</Label>
        {aiEducations && aiEducations.length > 0 && (
          <Button size="sm" variant="outline" onClick={handleUseAiData} type="button">
            Import {aiEducations.length} AI Detected Education
          </Button>
        )}
      </div>
      
      <div className="space-y-6">
        {educations.map((edu, index) => {
          const missingInstitution = !edu.institution.trim()
          const hasError = missingInstitution

          return (
            <div key={index} className={`p-4 border rounded-md relative ${hasError ? 'border-red-300 bg-red-50/30 dark:border-red-900 dark:bg-red-900/10' : 'bg-white dark:bg-slate-900'}`}>
              <div className="absolute top-4 right-4">
                <Button type="button" variant="ghost" size="icon" onClick={() => handleRemove(index)} className="text-slate-500 hover:text-red-500">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-4 pr-10">
                <div>
                  <Label>Institution / University <span className="text-red-500">*</span></Label>
                  <Input 
                    value={edu.institution} 
                    onChange={(e) => handleUpdate(index, 'institution', e.target.value)}
                    className={missingInstitution ? 'border-red-500' : ''}
                    placeholder="e.g. Stanford University"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Degree</Label>
                    <Input 
                      value={edu.degree || ''} 
                      onChange={(e) => handleUpdate(index, 'degree', e.target.value)}
                      placeholder="e.g. Bachelor of Science"
                    />
                  </div>
                  <div>
                    <Label>Field of Study</Label>
                    <Input 
                      value={edu.fieldOfStudy || ''} 
                      onChange={(e) => handleUpdate(index, 'fieldOfStudy', e.target.value)}
                      placeholder="e.g. Computer Science"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Start Date</Label>
                    <MonthYearPicker 
                      value={edu.startDate} 
                      onChange={(val) => handleUpdate(index, 'startDate', val)}
                    />
                  </div>
                  <div>
                    <Label>End Date (or Expected)</Label>
                    <MonthYearPicker 
                      value={edu.endDate} 
                      onChange={(val) => handleUpdate(index, 'endDate', val)}
                    />
                  </div>
                </div>
              </div>
            </div>
          )
        })}

        {educations.length === 0 && (
          <div className="text-center p-8 border border-dashed rounded-md text-muted-foreground">
            No education added yet.
          </div>
        )}

        <Button type="button" onClick={handleAdd} variant="outline" className="w-full border-dashed">
          <Plus className="w-4 h-4 mr-2" /> Add Education
        </Button>
      </div>
    </div>
  )
}
