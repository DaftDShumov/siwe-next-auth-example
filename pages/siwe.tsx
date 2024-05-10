import { getCsrfToken, signIn, useSession } from "next-auth/react"
import { SiweMessage } from "siwe"
import { useAccount, useConnect, useNetwork, useSignMessage } from "wagmi"
import Layout from "../components/layout"
import { InjectedConnector } from 'wagmi/connectors/injected'
import { useEffect, useState } from "react"
import { useRouter } from "next/router"

function Siwe() {
  const { signMessageAsync } = useSignMessage()
  const { chain } = useNetwork()
  const { address, isConnected } = useAccount()
  const { connect } = useConnect({
    connector: new InjectedConnector(),
  });
  const { data: session, status } = useSession()
  const router = useRouter()
  const telegramId = router.query.telegramId;
  console.log(`Telegram ID is ${telegramId}`)

  const buildMessage = async () => {
    const baseMessage = {
      domain: window.location.host,
      address: address,
      statement: "Sign in with Ethereum to the app.",
      uri: window.location.origin,
      version: "1",
      chainId: chain?.id,
      nonce: await getCsrfToken()
    }
    if (!Array.isArray(telegramId) && telegramId !== undefined && telegramId != "") {
      return { ...baseMessage, resources: [`Connect with telegram id ${telegramId}`] }
    } else {
      return { ...baseMessage }
    }
  }

  const handleLogin = async () => {
    try {
      const callbackUrl = "/protected"
      const siweMessageContent = await buildMessage()
      console.log(`Siwe message content ${JSON.stringify(siweMessageContent, null, 2)}`)
      const message = new SiweMessage(siweMessageContent)
      const signature = await signMessageAsync({
        message: message.prepareMessage(),
      })
      signIn("credentials", {
        message: JSON.stringify(message),
        redirect: false,
        telegramId: telegramId,
        signature,
        callbackUrl
      })
    } catch (error) {
      window.alert(error)
    }
  }

  useEffect(() => {
    console.log(isConnected);
    if (isConnected && !session) {
      handleLogin()
    }
  }, [isConnected])

  return (
    <Layout>
      <button
        onClick={(e) => {
          e.preventDefault()
          if (!isConnected) {
            connect()
          } else {
            handleLogin()
          }
        }}
      >
        Sign-in
      </button>
    </Layout>
  )
}

export async function getServerSideProps(context: any) {
  return {
    props: {
      csrfToken: await getCsrfToken(context),
    },
  }
}

Siwe.Layout = Layout

export default Siwe