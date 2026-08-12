"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { X, Plus } from "lucide-react"

interface SkillsEditorProps {
  skills: string[]
  onChange: (skills: string[]) => void
  aiSkills?: string[]
}

export function SkillsEditor({ skills, onChange, aiSkills }: SkillsEditorProps) {
  const [newSkill, setNewSkill] = useState("")

  const handleAdd = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      onChange([...skills, newSkill.trim()])
      setNewSkill("")
    }
  }

  const handleRemove = (skillToRemove: string) => {
    onChange(skills.filter(s => s !== skillToRemove))
  }

  const handleUseAiSkills = () => {
    if (aiSkills) {
      // Merge unique skills
      const merged = Array.from(new Set([...skills, ...aiSkills]))
      onChange(merged)
    }
  }

  return (
    <div className="space-y-4 py-4 border-b">
      <Label className="text-base font-semibold">Skills & Technologies</Label>
      
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 space-y-4">
          <div className="flex gap-2">
            <Input 
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              placeholder="e.g. React.js, TypeScript"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleAdd()
                }
              }}
            />
            <Button type="button" onClick={handleAdd} variant="secondary">
              <Plus className="w-4 h-4 mr-1" /> Add
            </Button>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {skills.map((skill, index) => (
              <div key={index} className="bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full flex items-center gap-2 text-sm border">
                {skill}
                <button type="button" onClick={() => handleRemove(skill)} className="text-slate-500 hover:text-red-500">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
            {skills.length === 0 && <span className="text-sm text-muted-foreground">No skills added yet.</span>}
          </div>
        </div>

        {aiSkills && aiSkills.length > 0 && (
          <div className="flex-1 w-full bg-slate-50 dark:bg-slate-800/50 p-4 rounded-md border text-sm">
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs text-muted-foreground uppercase font-semibold">AI Detected Skills</span>
              <Button size="sm" variant="outline" onClick={handleUseAiSkills} type="button">
                Merge AI Skills
              </Button>
            </div>
            <div className="flex flex-wrap gap-1">
              {aiSkills.map((sk, i) => (
                <span key={i} className="bg-white dark:bg-slate-700 px-2 py-0.5 rounded text-xs border shadow-sm">
                  {sk}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
