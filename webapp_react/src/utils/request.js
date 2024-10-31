import axios from 'axios';
import {message} from "antd";
import {ignoreCatch, messageError, messageWarning} from "@/utils/utils";
import getConfig from "next/config";

const {publicRuntimeConfig} = getConfig()

export const buildUrl = (url) => {
  return publicRuntimeConfig.BASE_URL + url
}

const loadingInstanceArr = []
const api = axios.create({
  baseURL: publicRuntimeConfig.BASE_URL,
  timeout: 10_000
});

const loading = () => {
  const key = Math.random()
  loadingInstanceArr.push(key)
  message.loading({key, content: '处理中...', duration: 10,}).then(ignoreCatch)
}

const loadingSuccess = (content = '处理完成') => {
  const key = loadingInstanceArr.pop()
  key && message.open({key, content, duration: 1.5, type: 'success'})
}

const loadingFailure = (content = '处理失败') => {
  const key = loadingInstanceArr.pop()
  key && message.open({key, content, duration: 3, type: 'error'})
}


api.interceptors.request.use(config => {
    // loading()
    config.headers.token = localStorage.token
    return config;
  },
  (error) => {
    messageError('系统异常，请联系管理员！')
    return Promise.reject(error)
  }
);

api.interceptors.response.use(response => {
    const {success, msg} = response.data
    if (success) {
      return Promise.resolve(response.data)
    } else {
      messageError(msg)
      return Promise.reject(response.data)
    }
  },
  error => {
    if (error.response) {
      if (error.response.status === 401) {
        messageWarning('登录失效，请重新登录')
      }
      if (error.response.status === 403) {
        messageWarning('未授权，请联系管理员！')
      }
    } else {
      messageError('系统异常，请联系管理员！')
    }
    return Promise.reject()
  }
);

export default api;
