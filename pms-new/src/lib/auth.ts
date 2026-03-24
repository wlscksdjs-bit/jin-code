import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'

const nextAuth = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null
        const bcrypt = await import('bcryptjs')
        const { default: prisma } = await import('./prisma')
        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        })
        if (!user) return null
        const match = await bcrypt.compare(credentials.password as string, user.password)
        if (!match) return null
        return { id: user.id, email: user.email, name: user.name, role: user.role }
      },
    }),
  ],
  session: { strategy: 'jwt' },
  pages: { signIn: '/signin' },
  callbacks: {
    jwt({ token, user }) {
      if (user) { token.id = user.id; token.role = (user as { role?: string }).role }
      return token
    },
    session({ session, token }) {
      if (token) { session.user.id = token.id as string; session.user.role = token.role as string }
      return session
    },
  },
})

export const { handlers, signIn, signOut, auth } = nextAuth

declare module 'next-auth' {
  interface Session {
    user: { id: string; email: string; name?: string | null; role: string }
  }
}
