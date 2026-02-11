import NextAuth, { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from '@/lib/prisma'
import { exchangeToken, getUserProfile } from '@/lib/secondme'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'SecondMe',
      credentials: {
        code: { label: 'Authorization Code', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.code) {
          return null
        }

        try {
          // 用授权码换取 token
          const tokenData = await exchangeToken(
            credentials.code,
            `${process.env.NEXTAUTH_URL}/api/auth/callback/secondme`
          )

          // 获取用户资料
          const userProfile = await getUserProfile(tokenData.access_token)

          // 计算 token 过期时间
          const tokenExpiry = new Date(Date.now() + tokenData.expires_in * 1000)

          // 存储或更新用户
          const user = await prisma.user.upsert({
            where: { email: userProfile.email || userProfile.id },
            update: {
              name: userProfile.name,
              avatar: userProfile.avatar,
              bio: userProfile.bio,
              token: tokenData.access_token,
              refreshToken: tokenData.refresh_token,
              tokenExpiry,
            },
            create: {
              email: userProfile.email || userProfile.id,
              name: userProfile.name,
              avatar: userProfile.avatar,
              bio: userProfile.bio,
              token: tokenData.access_token,
              refreshToken: tokenData.refresh_token,
              tokenExpiry,
            },
          })

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.avatar,
          }
        } catch (error) {
          console.error('Auth error:', error)
          return null
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
      }
      return session
    },
  },
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
