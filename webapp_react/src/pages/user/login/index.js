import React from 'react'
import {Button, Input} from "antd";
import {TokenAtom, UserInfoAtom} from "@/context/globalDataContext";
import {useAtom} from "jotai";
import {isBlank, messageError, notBlank} from "@/utils/utils";
import {auth} from "@/api/auth";


export default function Login() {

  const [, setToken] = useAtom(TokenAtom)
  const [, setUserInfo] = useAtom(UserInfoAtom);
  const [username, setUsername] = React.useState('admin')
  const [password, setPassword] = React.useState('admin')

  const [loading, setLoading] = React.useState(false)

  const passwordInputRef = React.useRef()

  const login = async () => {
    setLoading(true)
    try {
      const {success, msg, data} = await auth.login({id: username, password})
      if (success) {
        await setUserInfo(data)
        await setToken(data.key)
      } else {
        messageError(msg)
      }
    } finally {
      setLoading(false)
    }
  }

  const onPressEnter = async () => {
    if (notBlank(username) && notBlank(password)) {
      await login()
      return
    }

    if (isBlank(password)) {
      passwordInputRef.current.focus()
    }
  }

  return (
    <>
      <div className={'flex justify-center items-center w-screen h-screen'}>
        <div className={'flex flex-col min-w-[300px] space-y-4'}>
          <span>Username</span>
          <Input placeholder={'username'} value={username} onChange={e => setUsername(e.target.value)} onPressEnter={onPressEnter}/>
          <span>Password</span>
          <Input ref={passwordInputRef} placeholder={'password'} value={password} onChange={e => setPassword(e.target.value)} onPressEnter={onPressEnter}/>
          <Button loading={loading} type={'primary'} disabled={isBlank(username) || isBlank(password)} onClick={() => login()}>
            Login
          </Button>
        </div>
      </div>
    </>
  );
}
