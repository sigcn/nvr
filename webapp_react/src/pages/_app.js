import React from 'react'
import '@/styles/globals.css'
import {ConfigProvider} from "antd";
import zhCN from 'antd/locale/zh_CN';
import {StyleProvider} from "@ant-design/cssinjs";
import Layout from "@/pages/layout";

export default function App({Component, pageProps}) {

  return (
    <>
      <ConfigProvider locale={zhCN} theme={{hashed: false}}>
        <StyleProvider hashPriority={'high'}>
          <Layout>
            <Component {...pageProps} />
          </Layout>
        </StyleProvider>
      </ConfigProvider>
    </>
  )

}
