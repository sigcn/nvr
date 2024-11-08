import { TokenAtom } from '@/context/globalDataContext'
import { useAtom } from 'jotai'
import React from 'react'
import { Button, Card, Modal, Tooltip } from 'antd'
import getConfig from 'next/config'
import Svg from '@/svgs/Svg'
import useOnScreen from '@/hooks/useOnScreen'
import { ignoreCatch } from '@/utils/utils'
import TPLink from '@/svgs/TPLink.svg'
import { CaretRightFilled, DeleteOutlined, MutedFilled, PauseOutlined, SoundFilled } from '@ant-design/icons'

export default function CameraDetail({ item, deleteCamera, openCameraById }) {
  const {publicRuntimeConfig} = getConfig()

  const [token] = useAtom(TokenAtom)
  const videoRef = React.useRef()
  const cardRef = React.useRef()
  const visibility = useOnScreen(cardRef)
  const { Meta } = Card

  const [mouseEnter, setMouseEnter] = React.useState(false)
  const [playing, setPlaying] = React.useState(false)
  const [muted, setMuted] = React.useState(true)
  const playerRef = React.useRef({})

  const [previewUrl, setPreviewUrl] = React.useState(`https://localhost:2998/media/${item.id}/live.ts?api_key=${token}`)
  React.useEffect(() => setPreviewUrl(`${publicRuntimeConfig.BASE_URL}/media/${item.id}/live.ts?api_key=${token}`), [item.id, publicRuntimeConfig.BASE_URL, token])

  const loadLiveVideo = React.useCallback(async () => {
    const mpegts = await import('mpegts.js')
    if (mpegts && typeof window !== 'undefined' && mpegts.isSupported()) {
      const player = mpegts.createPlayer({
        type: 'mpegts',
        isLive: true,
        url: previewUrl,
      })

      playerRef.current = player

      player.attachMediaElement(videoRef.current)
      player.load()
      player.muted = true
      player.play()
      setPlaying(true)

      player.on(mpegts.Events.ERROR, (ErrorTypes, ErrorDetails, ErrorInfo, ...other) => {
        console.warn(ErrorTypes, ErrorDetails, ErrorInfo)
      })

    } else {
      console.error('当前浏览器不支持 MSE')
    }
  }, [previewUrl])

  const destroyLiveVideo = React.useCallback(() => {
    if (playerRef?.current) {
      try {
        playerRef.current?.unload()
        playerRef.current?.detachMediaElement()
        playerRef.current?.destroy()
      } catch (e) {
        ignoreCatch()
      }
    }
  }, [])

  /**
   * 播放视频
   */
  React.useEffect(() => {
    if (visibility) {
      loadLiveVideo().finally(ignoreCatch)
    } else {
      destroyLiveVideo()
    }

    // 清理函数
    return () => {
      destroyLiveVideo()
    }
  }, [destroyLiveVideo, loadLiveVideo, visibility])


  /**
   * 播放按钮变更
   */
  const handlePlayClick = () => {
    if (playing) {
      playerRef.current.pause()
    } else {
      playerRef.current.play()
    }
    setPlaying(!playing)
  }

  const handleMuteClick = () => {
    setMuted(old => {
      const newV = !old
      playerRef.current.muted = newV
      return newV
    })
  }

  const del = () => {
    Modal.confirm({
      title: '删除',
      content: `确认删除 ${item.remark}？`,
      okText: '确认',
      cancelText: '取消',
      onOk: () => deleteCamera && deleteCamera(item.id)
    })
  }

  return <>
    <Card
      ref={cardRef}
      bordered
      onMouseEnter={() => setMouseEnter(true)}
      onMouseLeave={() => setMouseEnter(false)}
      className={'w-full shadow-xl duration-300 transition-opacity opacity-95 hover_opacity-100'}
      cover={<video ref={videoRef} width={'100%'} height={'100%'} controls/>}
      title={(
        <div className={'flex'}>
          <Svg src={TPLink} width={'36'} />
          <h3 className={'flex items-center ml-2'}>{item?.meta?.model}</h3>
        </div>
      )}
      extra={<h3>{item.remark || 'Remark'}</h3>}
    >
      <div className={'flex items-center justify-between'}>
        <div className={'flex'}>
          {muted && <Tooltip title={'UnMute'}><Button danger size={'small'} onClick={() => handleMuteClick()}><MutedFilled /></Button></Tooltip>}
          {!muted && <Tooltip title={'Mute'}><Button size={'small'} onClick={() => handleMuteClick()}><SoundFilled /></Button></Tooltip>}

          {playing && <Tooltip title={'Pause'}><Button size={'small'} className={'ml-1'} onClick={() => handlePlayClick()}><CaretRightFilled /></Button></Tooltip>}
          {!playing && <Tooltip title={'Play'}><Button danger size={'small'} className={'ml-1'} onClick={() => handlePlayClick()}><PauseOutlined /></Button></Tooltip>}
        </div>

        <div className={'flex'}>
          {mouseEnter && (
            <div className={'flex'}>
              <Button size={'small'} onClick={() => openCameraById && openCameraById()}>Enter</Button>
              <Button size={'small'} className={'ml-1'} danger onClick={() => del()}><DeleteOutlined /></Button>
            </div>
          )}
        </div>
      </div>
    </Card>
  </>

}
