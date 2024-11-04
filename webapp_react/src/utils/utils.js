import _ from 'lodash'
import {Button, message, Modal} from "antd";

export const copyContent = async text => {
  await navigator?.clipboard?.writeText(text)
  messageSuccess('已复制到剪贴板')
}

export const ignoreCatch = (args) => {
  console.debug(`ignore catch`, args)
}

export const delBlankParam = obj => {
  _.forOwn(obj, (value, key) => {
    if (typeof value === 'object') {
      delBlankParam(value)
    }

    if (typeof value === 'string' && value.length === 0) {
      delete obj[key]
    }
  })
}

export const isBlank = val => _.isEmpty(val) && !_.isNumber(val) || _.isNaN(val)
export const notBlank = val => !isBlank(val)

export const isEmpty = (val) => _.isEmpty(val)
export const notEmpty = (val) => !isEmpty(val)

const messageFormat = content => {
  const type = typeof content

  if (type === "object") {
    return JSON.stringify(content)
  }

  return content;
}

export const modalWithOk = ({title, content}) => {
  Modal.info({content: messageFormat(content), maskClosable: true, okText: '我知道了', okType: 'dashed'})
}

const messageArr = []

export const messageSuccess = (content) => {
  const key = Math.random()
  message.success({content: messageFormat(content), key, duration: 1.5}).then(ignoreCatch)
  messageCountResize(key)
}

export const messageWarning = (content) => {
  const key = Math.random()
  message.warning({content: messageFormat(content), key, duration: 1.5}).then(ignoreCatch)
  messageCountResize(key)
}

export const messageError = (content = '操作失败') => {
  const key = Math.random()
  content = messageFormat(content)
  const duration = 10

  const withOk = (
    <>
      {content}<Button size={'small'} type={'text'} danger onClick={() => message.destroy(key)}>关闭</Button>
    </>
  )
  message.error({key, content: withOk, type: 'error', duration}).then(ignoreCatch)
  messageCountResize(key)
}

const messageCountResize = (key) => {
  messageArr.push(key)
  if (messageArr.length > 10) {
    closeFirstMessage()
  }
}

// 关闭指定key或者第一个消息
export const closeFirstMessage = (key) => {
  _.remove(messageArr, (item, index) => (item && item === key) || index === 0).forEach(key => message.destroy(key))
}
