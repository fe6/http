import type { AxiosRequestConfig } from 'axios';
import { AxiosTransform } from './transform';

export interface RequestOptions {
  // 请求参数拼接到url
  joinParamsToUrl?: boolean;
  // 格式化请求参数时间
  formatDate?: boolean;
  //  是否处理请求结果
  isTransformRequestResult?: boolean;
  // 接口地址， 不填则使用默认apiUrl
  apiUrl?: string;
  // 因为有时候需要每个接口单独定义返回不用内置的 promise，成功回调
  success?: Function;
  // 因为有时候需要每个接口单独定义返回不用内置的 promise，失败回调
  error?: Function;
  // 错误消息提示类型
  // 是否加入时间戳
  joinTime?: boolean;
  // 是否单接口 mock 数据
  mock?: boolean;
  // 是否 过滤 code message
  filter?: boolean;
  // 是否取消
  cancel?: boolean;
}

export interface ResType {
  code: string;
  message: string;
  data: string;
}

export interface CreateAxiosOptions extends AxiosRequestConfig {
  prefixUrl?: string;
  transform: AxiosTransform;
  requestOptions?: RequestOptions;
  apiUrl?: string;
  isDevMode?: () => boolean;
  // 报错的 log 提醒
  errorLog?: Function;
  // 报错的 提示弹框 ( message.error ) 提醒
  errorMsg?: Function;
  // 报错的 提示弹框 ( modal.error ) 提醒
  errorModal?: Function;
  // 统一状态处理钩子
  statusHooks?: Function;
  // 统一的错误码判断
  errorCode?: number;
  // 统一的成功码判断
  successCode?: number;
  resNames?: ResType;
}

export interface Result<T = any> {
  code: number;
  // type: 'success' | 'error' | 'warning';
  message: string;
  data: T;
}
