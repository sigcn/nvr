import React from 'react'
import Todo from '@/components/todo'
import { Button, FloatButton, Modal, Popover } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { useAtom } from 'jotai'
import { DefaultStorageAtom, StorageAtom } from '@/context/globalDataContext'
import { messageError } from '@/utils/utils'
import { targetType } from '@/utils/enums'
import StorageDetail from './StorageDetail'

const todos = [
  { label: '存储源管理', checked: false },
  { label: '支持oss', checked: false },
]

export default function Storage() {

  const [storages, setStorages] = useAtom(StorageAtom)
  const [defaultStorage, setDefaultStorage] = useAtom(DefaultStorageAtom)

  const addStorage = (storage) => {
    if (storages.find(e => e.add)) {
      messageError('已存在一个待完善.')
      return
    }

    setStorages([...storages, { ...storage, add: true }])
  }

  const delConfirmModal = (storage, index) => {
    Modal.confirm({
      title: '删除',
      content: `确认删除 ${storage.type}？`,
      okText: '确认',
      cancelText: '取消',
      onOk: () => {
        setStorages([...storages.filter((_, i) => i !== index)])
      },
    })
  }

  const renderSettingDefaultBtn = (storage) => {
    if (storage.name === defaultStorage) {
      return <h5>默认存储</h5>
    } else {
      return <Button danger ghost onClick={() => setDefaultStorage(storage.name)}>设为默认</Button>
    }
  }

  return <>
    <Todo todos={todos} />

    <FloatButton.Group shape="square" className={'right-7 top-20 bottom-auto'}>
      <FloatButton shape="square" className={'h-12'} icon={<PlusOutlined />} description={'S3'} onClick={() => addStorage({ type: targetType.oss })} />
      <FloatButton shape="square" className={'h-12'} icon={<PlusOutlined />} description={'Local'} onClick={() => addStorage({ type: targetType.local })} />
    </FloatButton.Group>

    <div className={'m-4'}>
      <div className={'text-center text-xl'}>
        存储源
      </div>

      {/*<div className={'w-full'}>*/}
      {/*  <Card>*/}
      {/*    左边桶*/}
      {/*  </Card>*/}
      {/*  <Card>*/}
      {/*    右边桶*/}
      {/*  </Card>*/}
      {/*</div>*/}

      <div className={'gap-x-4 gap-y-8 flex flex-wrap justify-around'}>
        {storages.map((storage, index) => (
          <Popover key={index} placement={'topRight'} content={renderSettingDefaultBtn(storage)}>
            <div key={index} className={'min-w-[600px]  bg-gray-100 rounded-md border-solid border-blue-200 p-2'} style={storage.name === defaultStorage ? { borderColor: 'palevioletred' } : {}}>
              <StorageDetail index={index} delConfirmModal={delConfirmModal} />
            </div>
          </Popover>
        ))}
      </div>
    </div>
  </>
}
