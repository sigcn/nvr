import {TokenAtom, UserInfoAtom} from "@/context/globalDataContext";
import Login from "@/pages/user/login";
import {useAtom} from "jotai";
import {useRouter} from "next/router";
import React from "react";
import {ignoreCatch, notBlank} from "@/utils/utils";
import Navigation from "@/components/navigation/Navigation";
import {QueryClient, QueryClientProvider} from "react-query";
import {App} from "antd";

const queryClient = new QueryClient()


export default function Layout({children}) {
  const router = useRouter();
  const [userInfo, setUserInfo] = useAtom(UserInfoAtom)
  const [token, setToken] = useAtom(TokenAtom)

  /**
   * 特殊逻辑,如果携带了 token,则直接尝试登录
   */
  React.useEffect(() => {
    if (router.isReady) {
      const {token} = router.query
      if (notBlank(token)) {
        setToken(token).then(ignoreCatch)
      }
    }
  }, [router.isReady, router.query, setToken])

  const navigation = () => {
    return <Navigation {...{children}}/>
  }

  const loginOrPass = () => {
    if (!token) {
      return <Login/>
    } else {
      return (
        <QueryClientProvider client={queryClient}>
          <App>
            {navigation()}
          </App>
        </QueryClientProvider>
      )
    }
  }

  return (
    <>
      {loginOrPass()}
    </>
  )

}
