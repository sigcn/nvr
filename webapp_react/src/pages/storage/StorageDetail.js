import React, { useEffect, useMemo } from 'react'
import { Button, Form, Input, Tag } from 'antd'
import { useAtom } from 'jotai/index'
import { StorageAtom } from '@/context/globalDataContext'
import { targetType as storageType } from '@/utils/enums'

export default function StorageDetail({ index, delConfirmModal }) {

  const [storages, setStorages] = useAtom(StorageAtom)
  const [storage, setStorage] = React.useState(() => storages[index])

  const [form] = Form.useForm()


  useEffect(() => {
    setStorage(storages[index])
  }, [index, storages])

  const changeEditState = () => {
    setStorage(a => ({ ...a, edit: true }))
  }

  const saveStorage = async () => {
    const values = await form.validateFields()
    //替换数组里的旧对象
    setStorages([...storages.map((item, i) => i === index ? { ...values, edit: false, type: storage.type } : item)])
  }

  const cancelStorage = () => {
    setStorage(a => ({ ...a, edit: false }))

    if (storage.add) {
      setStorages([...storages.filter((_, i) => i !== index)])
    } else {
      form.resetFields()
    }
  }

  const disabled = useMemo(() => !(storage.add || storage.edit), [storage.add, storage.edit])

  return <>
    <Tag>{storage.type}</Tag>

    <div className={'form'}>
      {storage.type === storageType.oss && <>
        <Form name={storageType.oss} form={form} layout={'horizontal'} labelCol={{ span: 4 }} initialValues={storage} disabled={disabled} autoComplete="off">
          <Form.Item label="Name" name="name" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item label="Address" name="address" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item label="AccessKey" name="accessKey" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item label="SecretKey" name="secretKey" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item label="Bucket" name="bucket" rules={[{ required: true }]}><Input /></Form.Item>
        </Form>
      </>}

      {storage.type === storageType.local && <>
        <Form name={storageType.local} form={form} layout={'horizontal'} labelCol={{ span: 4 }} initialValues={storage} disabled={disabled} autoComplete="off">
          <Form.Item label="Name" name="name" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item label="Folder" name="folder" rules={[{ required: true }]}><Input /></Form.Item>
        </Form>
      </>}

      <div className={'flex justify-around'}>
        {disabled && <>
          <Button onClick={() => changeEditState()}>编辑</Button>
          {storages.length > 1 && (<Button danger onClick={() => delConfirmModal(storage, index)}>删除</Button>)}
        </>}

        {!disabled && <>
          <Button onClick={() => saveStorage()}>保存</Button>
          <Button onClick={() => cancelStorage()}>取消</Button>
        </>}
      </div>
    </div>
  </>
}
