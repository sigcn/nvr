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
  // timeout: 1000_000
  timeout: 1000_0
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
    config.headers['X-ApiKey'] = localStorage.token
    return config;
  },
  (error) => {
    messageError('系统异常，请联系管理员！')
    return Promise.reject(error)
  }
);

api.interceptors.response.use(response => {
    const {code, success = code === 0, msg, data} = response.data
    if (success) {
      return Promise.resolve({success, code, msg, data})
    } else {
      // messageError(msg)
      return Promise.reject({success, code, msg, data})
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
