import {TokenAtom} from "@/context/globalDataContext";
import {useAtom} from "jotai";
import React from "react";
import mpegts from "mpegts.js";
import {Button, Card, Modal, Space, Tag} from "antd";

import TPLink from '@/svgs/TPLink.svg'
import Svg from "@/svgs/Svg";
import {useBoolean} from "ahooks";
import getConfig from "next/config";

export default function CameraDetail({item, deleteCamera}) {
  const {publicRuntimeConfig} = getConfig()

  const [token] = useAtom(TokenAtom)
  const videoRef = React.useRef()
  const {Meta} = Card;

  const [instance, setInstance] = React.useState({})

  const [playing, setPlaying] = React.useState(true)
  const [volume, setVolume] = React.useState(0.3)
  const [muted, {toggle}] = useBoolean(false)

  const playerRef = React.useRef({})

  const [previewUrl, setPreviewUrl] = React.useState(`http://localhost:2998/media/${item.id}/live.ts?api_key=${token}`)
  React.useEffect(() => setPreviewUrl(`${publicRuntimeConfig.BASE_URL}/media/${item.id}/live.ts?api_key=${token}`), [item.id, token])

  /**
   * 播放视频
   */
  React.useEffect(() => {
    let player
    if (mpegts && typeof window !== 'undefined' && mpegts.isSupported()) {
      player = mpegts.createPlayer({
        type: 'mpegts',
        isLive: true,
        url: previewUrl,
      });

      playerRef.current = player
      setInstance(player)

      player.attachMediaElement(videoRef.current);
      player.load();
      // player.play();

      player.on(mpegts.Events.ERROR, (ErrorTypes, ErrorDetails, ErrorInfo, ...other) => {
        debugger
        console.warn(ErrorTypes, ErrorDetails, ErrorInfo)
      })

      player.onvCanPlay = () => {
        debugger
        player.play();
        console.log('can play')
      }


    } else {
      console.error('当前浏览器不支持 MSE');
    }

    // 清理函数
    return () => {
      player?.pause()
      player?.unload()
      player?.detachMediaElement()
      player?.destroy()
      setInstance({})
    };
  }, [previewUrl])

  React.useEffect(() => {
    playerRef.current.volume = volume
  }, [volume])

  const handlePlayClick = () => {
    console.log(playerRef.current)
  }

  const handleVolumeClick = () => {
    playerRef.current.muted = !playerRef.current.muted
  }

  const del = () => {
    Modal.confirm({
      title: '确认删除',
      content: '确认删除该设备？',
      okText: '确认',
      cancelText: '取消',
      onOk: () => deleteCamera && deleteCamera()
    })
  }

  return <>
    <Card
      bordered
      className={'w-full'}
      cover={<video ref={videoRef} width={'100%'}/>}
      title={item.remark || `(id:${item.id}) This is Remark.`}
      extra={(<div>
        <Button onClick={() => handleVolumeClick()}>{volume}</Button>
        <Button onClick={() => handlePlayClick()}>{playing ? 'Playing' : 'Pausing'}</Button>

      </div>)}
      actions={[
        <Button key={'1'} type={'dashed'}>测试1</Button>,
        <Button key={'2'} type={'dashed'}>测试2</Button>,
        <Button key={'del'} danger onClick={() => del()}>删除</Button>,
      ]}
    >
      <Meta avatar={<Svg src={TPLink} width={'64'}/>}
            description={<Space direction={'vertical'} className={'text-sm'}>
              <div className={'inline-block'}>
                <Tag className={'text-sm'}>model</Tag>
                <Tag className={'text-sm'}>{item.meta.model}</Tag>
              </div>
              <div className={'inline-block'}>
                <Tag className={'text-sm'}>firmware_version</Tag>
                <Tag className={'text-sm'}>{item.meta.firmware_version}</Tag>
              </div>
              <div className={'inline-block'}>
                <Tag className={'text-sm'}>serial_number</Tag>
                <Tag className={'text-sm'}>{item.meta.serial_number}</Tag>
              </div>
            </Space>}/>
    </Card>
  </>

}
