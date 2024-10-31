import React, {useEffect} from "react";
import {Dropdown, Layout} from "antd";
import {HomeOutlined, IdcardOutlined, ImportOutlined, TeamOutlined} from "@ant-design/icons";
import {useRouter} from "next/router";
import {messageError, messageSuccess} from "@/utils/utils";

export default function Navigation({children}) {
  const [userInfo, setUserInfo] = React.useState({})
  const [logged, setLogged] = React.useState(false)

  const {Header, Footer, Sider, Content} = Layout
  const [selectedMenuKey, setSelectedMenuKey] = React.useState(['camera'])

  const menus = [
    {label: '监控', key: 'camera', icon: <HomeOutlined/>},
    {label: '录制', key: 'record', icon: <ImportOutlined/>},
    {label: '存储', key: 'storage', icon: <TeamOutlined/>},
    {label: '用户', key: 'user', icon: <IdcardOutlined/>},
  ];

  const router = useRouter()

  useEffect(() => {
    if (router.isReady) {
      setSelectedMenuKey([router.route.slice(1)])
    }
  }, [router])

  const signOut = () => {
    messageSuccess('Sign Out Ok.')
  }

  const dropdownMenus = [
    {label: 'Sign Out', key: 'sign out', danger: true, onClick: signOut},
    {label: 'Other', key: 'other', onClick: () => messageError('Click Other.')},
  ]

  return (
    <>
      <Layout className={'h-screen overflow-y-hidden'}>
        <Header className={'flex flex-align-center justify-between bg-dark h-14 leading-10 w-screen'}>
          <div className={'flex flex-align-center'}>
            <div className={'h-8 w-24 m-4 bg-[#2d1717] rounded-[5px] text-[#f30606] flex justify-center items-center'}>NVR</div>
            <div className={'inline-flex '}>
              {menus.map(menu => {
                return (
                  <div key={menu.key}
                       className={'m-2 w-20 flex-align-center justify-center rounded-md cursor-pointer fz-14 text-white/70 hover_text-white'}
                       style={{backgroundColor: selectedMenuKey.includes(menu.key) ? '#2c88b0' : ''}}
                       onClick={async () => {
                         await router.push(`/${menu.key}`)
                         setSelectedMenuKey([menu.key])
                       }}
                  >
                    <span>{menu.icon}</span>
                    <span className={'ml-2.5'}>{menu.label}</span>
                  </div>
                )
              })}
            </div>
          </div>
          <div className={'text-red-50'}>
            <Dropdown placement={'bottom'} menu={{items: dropdownMenus.map(e => ({...e}))}}>
              <div className={'text-white'}>{userInfo.username || 'admin'}</div>
            </Dropdown>
          </div>
        </Header>
        <Layout>
          <Content className={'m-4 bg-white'}>
            {children}
          </Content>
          <Footer className={'justify-center flex-align-center text-center bg-gray-300 h-12'}>
            footer
          </Footer>
        </Layout>
      </Layout>
    </>
  )
}
