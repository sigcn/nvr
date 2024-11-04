import Todo from "@/components/todo";
import React from "react";
import {useQuery} from "react-query";
import {camera} from "@/api/camera";
import {App, FloatButton, Skeleton} from 'antd'
import {VideoCameraAddOutlined} from "@ant-design/icons";
import AddCamera from "@/pages/camera/AddCamera";
import {messageError, messageSuccess} from "@/utils/utils";
import CameraDetail from './CameraDetail'

export default function Camera() {
  const todos = [
    {label: '监控列表', checked: false},
    {label: '支持监控批量增加(支持按网段)', checked: false},
    {label: '支持通道切换(主通道占用较大)', checked: false},
    {label: '切换预览数量', checked: false},
    {label: '支持动态布局', checked: false},
  ]
  const {data = {}, isLoading, refetch} = useQuery('cameras', () => camera.list());
  const {success, ...other} = data
  const {modal, message} = App.useApp()

  const addCameraRef = React.useRef()

  const addCameraOk = async () => {
    const {username, password, type, multi, addr, addrStart, addrEnd} = addCameraRef.current.data
    if (!multi) {
      await camera.save({username, password, type, addr})
      return
    }


    // 将起始 IP 和结束 IP 转换为数组
    const startParts = addrStart.split('.').map(Number);
    const endParts = addrEnd.split('.').map(Number);

    // 确保 IP 地址前 3 段相同，否则返回空数组
    if (startParts[0] !== endParts[0] || startParts[1] !== endParts[1] || startParts[2] !== endParts[2]) {
      messageError('暂只支持在同一网段下')
      return;
    }

    // 获取范围的起始和结束的第四段
    const start = startParts[3];
    const end = endParts[3];

    // 遍历生成 IP 地址范围
    const ipRange = [];
    for (let i = start; i <= end; i++) {
      ipRange.push(`${startParts[0]}.${startParts[1]}.${startParts[2]}.${i}`);
    }

    await Promise.all(ipRange.map(async (ip) => {
      await camera.save({username, password, type, addr: ip})
    }))

    messageSuccess('👌')
    await refetch()

  }

  const deleteCamera = async (id) => {
    const {success, data} = await camera.delete(id)
    if (success) {
      messageSuccess('👌')
      await refetch()
      other.data = other.data.filter(item => item.id !== id)
    } else {
      messageError(data)
    }
  }

  return <>
    <Todo todos={todos}/>

    <div className={'mt-4 m-4'}>

      <Skeleton loading={isLoading}>
        <div className={`grid grid-cols-1 gap-4 sm_grid-cols-1 md_grid-cols-2 lg_grid-cols-3 xl_grid-cols-4`}>
          {other.data?.map(item => {
            return <div key={item.id} className={'min-w-[300px] min-h-[400px] rounded-md'}>
              <CameraDetail item={item} deleteCamera={deleteCamera}/>
            </div>
          })}

          {/*<div className={'min-w-[300px] h-[200px] bg-blue-300 p-4 rounded-md flex justify-center cursor-pointer'}>*/}
          {/*  <VideoCameraAddOutlined className={'text-6xl text-green-900'}/>*/}
          {/*</div>*/}
        </div>
      </Skeleton>

      <FloatButton type={'primary'}
                   className={'right-7 top-20 bottom-auto w-12 h-12'}
                   icon={(<VideoCameraAddOutlined className={'text-xl text-blue-50'}/>)}
                   onClick={() => {
                     modal.success({
                       title: 'Add new camera.',
                       content: (<AddCamera ref={addCameraRef}/>),
                       okText: '提交',
                       cancelText: '取消',
                       okCancel: true,
                       onOk: () => addCameraOk()
                     });
                   }}/>
    </div>

  </>

}
