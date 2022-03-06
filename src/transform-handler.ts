import type { AxiosResponse, AxiosRequestConfig } from 'axios';
import { objectToQuery } from '@fe6/shared';
import { has, isString, merge } from 'lodash';
// import has from 'lodash/has';
// import isString from 'lodash/isString';
// import merge from 'lodash/merge';

import type { CreateAxiosOptions, RequestOptions, Result } from './core/types';
import { AxiosTransform } from './core/transform';

import { RequestEnum, ResultEnum, RES_NAMES } from './http-enum';
import { errorResult, HTTP_ERROR_TIPS } from './constant';

const operationFailed = '操作失败';
const errorMessage = '操作失败;系统异常!';
const timeoutMessage = '登录超时;请重新登录!';
const networkException = '网络异常';
const networkExceptionMsg = '请检查您的网络连接是否正常!';
const errorException = '系统错误';
const errorExceptionMsg = '请检查您的联系管理员!';

const transformHandler: (
  transformParams?: Partial<CreateAxiosOptions>,
) => AxiosTransform = (transformParams?: Partial<CreateAxiosOptions>) => {
  const transformOptions = transformParams?.transform;
  const isDevMode = transformParams?.isDevMode as Function;
  const errorLog = transformParams?.errorLog as Function;
  const errorMsg = transformParams?.errorMsg as Function;
  const errorModal = transformParams?.errorModal as Function;
  const transformRequestInner =
    transformOptions?.transformRequestInner as Function;
  const requestInterceptors = transformOptions?.requestInterceptors as Function;
  const statusHooks = transformParams?.statusHooks as Function;
  const successCode = transformParams?.successCode || ResultEnum.SUCCESS;
  const errorCode = transformParams?.errorCode || ResultEnum.ERROR;
  const resNames = transformParams?.resNames || RES_NAMES;

  const transformDef = {
    transformRequestData: (
      res: AxiosResponse<Result>,
      options: RequestOptions,
    ) => {
      const { isTransformRequestResult } = options;
      const filterResult = has(options, 'filter') ? options.filter : true;
      // 不进行任何处理，直接返回
      // 用于页面代码可能需要直接获取code，data，message这些信息时开启
      if (!isTransformRequestResult) {
        return res.data;
      }

      const { data: resData } = res;
      if (!resData) {
        // return '[HTTP] Request has no return value';
        return errorResult;
      }

      const code = (resData as any)?.[resNames?.code] || resData;
      const data = (resData as any)?.[resNames?.data] || resData;
      const message = (resData as any)?.[resNames?.message] || resData;
      // 这里逻辑可以根据项目进行修改
      const hasSuccess =
        data &&
        Reflect.has(resData, resNames?.code) &&
        (code === successCode || !filterResult);

      transformRequestInner(res, options);

      if (!hasSuccess) {
        if (message) {
          errorMsg(message);
        }

        if (isDevMode()) {
          Promise.reject(errorLog(message));
        }

        return errorResult;
      }

      // 接口请求成功，直接返回结果
      if (!filterResult) {
        return resData;
      }

      if (code === successCode) {
        return data;
      }

      // 接口请求错误，统一提示错误信息
      if (code === errorCode) {
        if (message) {
          errorMsg(data.message);
          if (isDevMode()) {
            Promise.reject(errorLog(message));
          }
        } else {
          const msg = errorMessage;
          errorMsg(msg);
          if (isDevMode()) {
            Promise.reject(errorLog(msg));
          }
        }
        return errorResult;
      }
      // 登录超时
      if (code === ResultEnum.TIMEOUT) {
        const timeoutMsg = timeoutMessage;
        errorModal({
          title: operationFailed,
          content: timeoutMsg,
        });
        if (isDevMode()) {
          Promise.reject(errorLog(timeoutMsg));
        }

        return errorResult;
      }
      return errorResult;
    },

    // 请求之前处理config
    beforeRequestHook: (
      config: AxiosRequestConfig,
      options: RequestOptions,
    ) => {
      const { apiUrl, joinParamsToUrl, mock = false } = options;

      if (apiUrl && isString(apiUrl)) {
        config.url = `${mock ? '' : apiUrl}${config.url}`;
      }

      const params = config.params || {};
      if (config.method?.toUpperCase() === RequestEnum.GET) {
        if (!isString(params)) {
          config.params = Object.assign(params || {});
        } else {
          config.url = config.url + params;
          config.params = undefined;
        }
      } else {
        if (!isString(params)) {
          // formatDate && formatRequestDate(params);
          config.data = params;
          config.params = undefined;
          if (joinParamsToUrl) {
            config.url = objectToQuery(config.url as string, config.data);
          }
        } else {
          // 兼容restful风格
          config.url = config.url + params;
          config.params = undefined;
        }
      }
      return config;
    },

    requestInterceptors: (config: AxiosRequestConfig) => {
      return requestInterceptors(config);
    },

    responseInterceptorsCatch: (error: any) => {
      // errorStore.setupErrorHandle(error);
      const { response, code, message } = error || {};
      const msg: string = response?.data?.error?.message ?? '';
      const err: string = error?.toString?.() ?? '';
      try {
        if (code === 'ECONNABORTED' && message.includes('timeout')) {
          errorMsg(HTTP_ERROR_TIPS[504]);
        }

        if (err?.includes('Network Error')) {
          errorModal({
            title: networkException,
            content: networkExceptionMsg,
          });
        }
        if (err?.includes('404') || err?.includes('503')) {
          errorModal({
            title: errorException,
            content: errorExceptionMsg,
          });
        }
      } catch (error) {
        errorModal({
          title: errorException,
          content: errorExceptionMsg,
        });
      }

      statusHooks(msg, error?.response?.status, HTTP_ERROR_TIPS);
      return isDevMode() ? Promise.reject(error) : '';
    },
  };
  const newTransform = merge(transformOptions, transformDef);
  return newTransform;
};

export default transformHandler;
