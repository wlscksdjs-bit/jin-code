'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function ImportProjectsPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; imported?: number; errors?: any[] } | null>(null)

  const downloadTemplate = async () => {
    const res = await fetch('/api/import/projects')
    const blob = await res.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'projects-template.xlsx'
    a.click()
  }

  const handleImport = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setResult(null)

    const formData = new FormData(e.currentTarget)
    const file = formData.get('file') as File

    if (!file) {
      setResult({ success: false, errors: [{ error: '파일을 선택해주세요' }] })
      setLoading(false)
      return
    }

    try {
      const submitFormData = new FormData()
      submitFormData.append('file', file)

      const res = await fetch('/api/import/projects', {
        method: 'POST',
        body: submitFormData,
      })

      const data = await res.json()
      setResult(data)
    } catch (err) {
      setResult({ success: false, errors: [{ error: (err as Error).message }] })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">프로젝트 일괄 등록</h1>
        </div>
        <Link href="/projects">
          <Button variant="ghost">목록</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Excel 파일로 프로젝트 일괄 등록</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button variant="outline" onClick={downloadTemplate}>
              양식 다운로드
            </Button>
          </div>

          <form onSubmit={handleImport} className="space-y-4">
            <div>
              <Label htmlFor="file">Excel 파일 선택</Label>
              <Input
                id="file"
                name="file"
                type="file"
                accept=".xlsx,.xls"
                required
              />
            </div>

            <Button type="submit" disabled={loading}>
              {loading ? '처리 중...' : 'Import 실행'}
            </Button>
          </form>

          {result && (
            <div className={`p-4 rounded ${result.success ? 'bg-green-50' : 'bg-red-50'}`}>
              {result.success ? (
                <p className="text-green-700">
                  {result.imported}건의 프로젝트를 등록했습니다.
                </p>
              ) : (
                <p className="text-red-700">오류가 발생했습니다.</p>
              )}
              {result.errors && result.errors.length > 0 && (
                <ul className="mt-2 text-sm text-red-600">
                  {result.errors.map((err, i) => (
                    <li key={i}>행 {err.row}: {err.error}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
