import Todo from "@/components/todo";
import React from "react";
import {useQuery} from "react-query";
import {camera} from "@/api/camera";
import {App, FloatButton, Skeleton} from 'antd'
import {VideoCameraAddOutlined} from "@ant-design/icons";
import AddCamera from "@/pages/camera/AddCamera";
import {ignoreCatch, messageError, messageSuccess} from "@/utils/utils";
import CameraDetail from "@/pages/camera/CameraDetail";

const todos = [
  {label: '监控列表', checked: false},
  {label: '支持监控批量增加(支持按网段)', checked: false},
  {label: '支持通道切换(主通道占用较大)', checked: false},
  {label: '切换预览数量', checked: false},
  {label: '支持动态布局', checked: false},
]

export default function Camera() {

  const {modal, message} = App.useApp()
  const {isLoading, isSuccess, ...query} = useQuery(['cameras'], () => camera.list(), {refetchOnWindowFocus: false});
  const {success = false, data = []} = query?.data || {}

  const [cameras, setCameras] = React.useState([])

  React.useEffect(() => {
    if (success) {
      const arr = data || []
      setCameras([...arr])
    }
  }, [data, success])

  const addCameraRef = React.useRef()

  const addCameraOk = async () => {
    const {username, password, type, multi, addr, addrStart, addrEnd} = addCameraRef.current.data
    if (!multi) {
      const {success} = await camera.save({username, password, type, addr})
      return success
    }

    // 将起始 IP 和结束 IP 转换为数组
    const startParts = addrStart.split('.').map(Number);
    const endParts = addrEnd.split('.').map(Number);

    // 确保 IP 地址前 3 段相同，否则返回空数组
    if (startParts[0] !== endParts[0] || startParts[1] !== endParts[1] || startParts[2] !== endParts[2]) {
      messageError('暂只支持在同一网段下')
      return false;
    }

    // 获取范围的起始和结束的第四段
    const start = startParts[3];
    const end = endParts[3];

    // 遍历生成 IP 地址范围
    const ipRange = [];
    for (let i = start; i <= end; i++) {
      ipRange.push(`${startParts[0]}.${startParts[1]}.${startParts[2]}.${i}`);
    }

    // await Promise.all(ipRange.map(async (ip) => {
    //   camera.save({username, password, type, addr: ip}).catch(ignoreCatch)
    // }))

    for (let i = 0; i < ipRange.length; i += 10) {
      const batch = ipRange.slice(i, i + 10);
      await Promise.all(batch.map(async (ip) => {
        try {
          await camera.save({username, password, type, addr: ip});
        } catch (err) {
          ignoreCatch(err);
        }
      }));
    }

    messageSuccess('👌')
    await query.refetch()
    return true
  }

  const deleteCamera = async (id) => {
    const {success, msg} = await camera.delete(id)
    if (success) {
      messageSuccess('👌')
      setCameras(o => ([...o.filter(item => item.id !== id)]))
    } else {
      messageError(msg)
    }
  }

  return <>
    <Todo todos={todos}/>

    <div className={'mt-4 m-4'}>
      <Skeleton loading={isLoading}>
        <div className={`grid grid-cols-1 gap-4 sm_grid-cols-1 md_grid-cols-2 lg_grid-cols-3 xl_grid-cols-4`}>
          {cameras.map(item => (<div key={item.id} className={'rounded-md'}><CameraDetail item={item} deleteCamera={deleteCamera}/></div>))}
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
