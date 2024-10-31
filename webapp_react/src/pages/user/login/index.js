import React from 'react'
import {Button} from "antd";
import {TokenAtom} from "@/context/globalDataContext";
import {useAtom} from "jotai";


export default function Login() {

  const [, setToken] = useAtom(TokenAtom)

  return (
    <>
      <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
        <Button style={{'marginTop': '40vh', 'padding': '10px 20px'}} onClick={() => setToken(`${Math.random()}`)}>
          Login
        </Button>
      </div>
    </>
  );
}
