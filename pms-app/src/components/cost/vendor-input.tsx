'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface VendorInputProps {
  value: string
  onChange: (value: string) => void
  required?: boolean
  error?: string
}

export function VendorInput({
  value,
  onChange,
  required = true,
  error,
}: VendorInputProps) {
  return (
    <div className="space-y-1">
      <Label className="text-xs">
        업체명 {required && <span className="text-red-500">*</span>}
      </Label>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={required ? "필수 입력" : "업체명 입력"}
        className={error ? "border-red-500" : ""}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}
