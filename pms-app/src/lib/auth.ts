import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import Google from 'next-auth/providers/google'
import Kakao from 'next-auth/providers/kakao'
import { compare } from 'bcryptjs'
import prisma from './prisma'

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    Kakao({
      clientId: process.env.KAKAO_CLIENT_ID,
      clientSecret: process.env.KAKAO_CLIENT_SECRET,
    }),
    Credentials({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string }
        })

        if (!user || !user.password) {
          return null
        }

        const isPasswordValid = await compare(credentials.password as string, user.password)

        if (!isPasswordValid) {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id
        token.role = user.role
      }
      if (account?.provider === 'google' || account?.provider === 'kakao') {
        const email = token.email as string
        if (email) {
          let existingUser = await prisma.user.findUnique({
            where: { email }
          })
          
          if (!existingUser) {
            existingUser = await prisma.user.create({
              data: {
                email,
                name: (token.name as string) || 'OAuth User',
                role: 'STAFF',
                isActive: true,
                password: 'oauth_' + Date.now(),
              }
            })
          }
          token.id = existingUser.id
          token.role = existingUser.role
        }
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
      }
      return session
    }
  },
  pages: {
    signIn: '/login',
  }
})
