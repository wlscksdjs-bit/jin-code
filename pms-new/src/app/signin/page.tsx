import { signIn } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'

export default async function SignInPage() {
  const session = await auth()
  if (session) redirect('/')

  async function handleSubmit(formData: FormData) {
    'use server'
    await signIn('credentials', {
      email: formData.get('email'),
      password: formData.get('password'),
      redirectTo: '/',
    })
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950">
      <div className="w-full max-w-sm space-y-6 rounded-lg border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold tracking-tight">PMS 2.0</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">프로젝트 관리 시스템</p>
        </div>

        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">이메일</label>
            <input
              id="email"
              name="email"
              type="email"
              required
              defaultValue="admin@pms.com"
              className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-gray-800 dark:bg-gray-800 dark:ring-offset-gray-950"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">비밀번호</label>
            <input
              id="password"
              name="password"
              type="password"
              required
              defaultValue="admin123"
              className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-gray-800 dark:bg-gray-800 dark:ring-offset-gray-950"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            로그인
          </button>
        </form>

        <p className="text-center text-xs text-gray-400">
          테스트: admin@pms.com / admin123
        </p>
      </div>
    </div>
  )
}
