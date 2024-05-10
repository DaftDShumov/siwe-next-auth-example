import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { getCsrfToken } from "next-auth/react"
import { SiweMessage } from "siwe"
import { updateSession } from "../../../utils/firestore-telegram"

// For more information on each option (and a full list of options) go to
// https://next-auth.js.org/configuration/options
export default async function auth(req: any, res: any) {
  const providers = [
    CredentialsProvider({
      name: "Ethereum",
      credentials: {
        message: {
          label: "Message",
          type: "text",
          placeholder: "0x0",
        },
        signature: {
          label: "Signature",
          type: "text",
          placeholder: "0x0",
        },
        telegramId: {
          label: "Telegram connection ID",
          type: "text",
          placeholder: "0"
        }
      },
      async authorize(credentials) {
        try {
          const siwe = new SiweMessage(JSON.parse(credentials?.message || "{}"))
          const nextAuthUrl = new URL(process.env.NEXTAUTH_URL)

          const result = await siwe.verify({
            signature: credentials?.signature || "",
            domain: nextAuthUrl.host,
            nonce: await getCsrfToken({ req }),
          })

          if (result.success) {
            return {
              id: siwe.address,
              telegramId: credentials?.telegramId,
              authToken: "some_auth_token"
            }
          }
          return null
        } catch (e) {
          return null
        }
      },
    }),
  ]

  const isDefaultSigninPage =
    req.method === "GET" && req.query.nextauth.includes("signin")

  // Hide Sign-In with Ethereum from default sign page
  if (isDefaultSigninPage) {
    providers.pop()
  }

  return await NextAuth(req, res, {
    // https://next-auth.js.org/configuration/providers/oauth
    providers,
    session: {
      strategy: "jwt",
    },
    secret: process.env.NEXTAUTH_SECRET,
    callbacks: {
      async session({ session, token }: { session: any; token: any }) {
        session.address = token.sub
        session.user.name = token.sub
        session.user.image = "https://www.fillmurray.com/128/128"
        return session
      },
      async jwt({ token, user }) {
        if (user) {
          const telegramId = (user as any).telegramId
          const authToken = (user as any).authToken
          if (
            telegramId != undefined && 
            telegramId != "undefined" && 
            telegramId != "" && 
            authToken != "" && 
            authToken != undefined && 
            authToken != "undefined"
          ) {
            await updateSession(telegramId, user.id, authToken) 
          }
        }
        return token
      }
    },
  })
}
