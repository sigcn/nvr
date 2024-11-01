import Todo from "@/components/todo";
import React from "react";
import {useQuery} from "react-query";
import {camera} from "@/api/camera";
import {App, FloatButton, Skeleton} from 'antd'
import {VideoCameraAddOutlined} from "@ant-design/icons";
import AddCamera from "@/pages/camera/AddCamera";
import {messageError, messageSuccess, messageWarning} from "@/utils/utils";

export default function Camera() {
  const todos = [
    {label: '监控列表', checked: false},
    {label: '支持监控批量增加(支持按网段)', checked: false},
    {label: '支持通道切换(主通道占用较大)', checked: false},
    {label: '切换预览数量', checked: false},
    {label: '支持动态布局', checked: false},
  ]
  const {data = {}, isLoading} = useQuery('cameras', () => camera.list());
  const {success, ...other} = data
  const {modal, message} = App.useApp()

  return <>
    <Todo todos={todos}/>

    <div className={'mt-4 m-4'}>

      <Skeleton loading={isLoading}>
        <div className={`grid grid-cols-1 gap-4 sm_grid-cols-2 md_grid-cols-3 lg_grid-cols-4 xl_grid-cols-5`}>
          {other.data?.map(item => {
            return <div key={item.id} className={'min-w-[150px] h-[200px] bg-blue-300 p-4 rounded-md'}>{item.meta.manufacturer}</div>
          })}
          <div className={'min-w-[150px] h-[200px] bg-blue-300 p-4 rounded-md flex justify-center cursor-pointer'}>
            <VideoCameraAddOutlined className={'text-6xl text-green-900'}/>
          </div>
        </div>
      </Skeleton>

      <FloatButton type={'primary'}
                   className={'right-7 top-20 bottom-auto w-12 h-12'}
                   icon={(<VideoCameraAddOutlined className={'text-xl text-blue-50'}/>)}
                   onClick={() => {
                     modal.success({
                       title: 'Add new camera.',
                       content: (<AddCamera/>),
                       okText:'提交',
                       cancelText:'取消',
                       okCancel: true,
                       onOk: ()=> messageSuccess('👌'),
                       onCancel: ()=> messageWarning('❌')

                     });
                   }}/>
    </div>

  </>

}
