import type { CreateAxiosOptions } from './core/types';
import { TheHttp } from './core/axios';

import {
  ContentTypeEnum,
  RequestEnum,
  RES_NAMES,
  ResultEnum,
} from './http-enum';
import httpTransformHandler from './transform-handler';

export type { AxiosTransform } from './core/transform';
// 全局默认配置
export const AXIOS_DEF_OPTIONS = (opt?: Partial<CreateAxiosOptions>) => ({
  timeout: 10 * 1000,
  // 接口可能会有通用的地址部分，可以统一抽取出来
  prefixUrl: '',
  headers: { 'Content-Type': ContentTypeEnum.JSON },
  // 如果是form-data格式
  // headers: { 'Content-Type': ContentTypeEnum.FORM_URLENCODED },
  // 数据处理方式
  transform: httpTransformHandler(opt),
  // 配置项，下面的选项都可以在独立的接口请求中覆盖
  requestOptions: {
    // 需要对返回数据进行处理
    isTransformRequestResult: true,
    // post请求的时候添加参数到url
    joinParamsToUrl: false,
    // 格式化提交参数时间
    formatDate: true,
    // 接口地址
    apiUrl: opt?.apiUrl,
    //  是否加入时间戳
    joinTime: true,
  },
});

const createTheHttp = (opt?: Partial<CreateAxiosOptions>) => {
  return new TheHttp(Object.assign(AXIOS_DEF_OPTIONS(opt), opt || {}));
};

export default createTheHttp;

export type {
  Result,
  CreateAxiosOptions,
  ResType,
  RequestOptions,
} from './core/types';

export {
  createTheHttp,
  TheHttp,
  ContentTypeEnum,
  RequestEnum,
  RES_NAMES,
  ResultEnum,
  httpTransformHandler,
};
