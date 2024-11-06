import {TokenAtom} from "@/context/globalDataContext";
import {useAtom} from "jotai";
import React from "react";
import {Button, Card, Modal} from "antd";
import getConfig from "next/config";
import Svg from "@/svgs/Svg";
import Volume from '@/svgs/volume.svg'
import Volume_Close from '@/svgs/volume_close.svg'
import useOnScreen from "@/hooks/useOnScreen";
import {ignoreCatch} from "@/utils/utils";

export default function CameraDetail({item, deleteCamera}) {
  const {publicRuntimeConfig} = getConfig()

  const [token] = useAtom(TokenAtom)
  const videoRef = React.useRef()
  const cardRef = React.useRef()
  const visibility = useOnScreen(cardRef);
  const {Meta} = Card;

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
      });

      playerRef.current = player

      player.attachMediaElement(videoRef.current);
      player.load();
      player.muted = true
      player.play();
      setPlaying(true)

      player.on(mpegts.Events.ERROR, (ErrorTypes, ErrorDetails, ErrorInfo, ...other) => {
        console.warn(ErrorTypes, ErrorDetails, ErrorInfo)
      })

    } else {
      console.error('当前浏览器不支持 MSE');
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
    };
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
      title: '确认删除',
      content: '确认删除该设备？',
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
    >
      <div className={'flex items-center justify-between'}>
        <div className={'flex'}>
          <Button size={'small'} onClick={() => handleMuteClick()}><Svg src={muted ? Volume_Close : Volume} width={'24'} height={'24'}/></Button>
          <Button size={'small'} className={'ml-1'} onClick={() => handlePlayClick()}>{playing ? 'Playing' : 'Pausing'}</Button>
        </div>

        <div className={'flex'}>
          {mouseEnter && (
            <Button.Group>
              <Button size={'small'} key={'1'} type={'dashed'}>测试1</Button>
              <Button size={'small'} key={'2'} type={'dashed'}>测试2</Button>
              <Button size={'small'} key={'del'} danger onClick={() => del()}>删除</Button>
            </Button.Group>
          )}
        </div>
      </div>

      <div className={'flex'}>
        <span className={'text-xs'}>
          {item?.meta?.model}
          {item?.meta?.firmware_version}
          {item?.meta?.serial_number}
        </span>
      </div>
    </Card>
  </>

}
