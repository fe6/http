import type { AxiosRequestConfig, AxiosInstance, AxiosResponse } from 'axios';
import type { RequestOptions, CreateAxiosOptions, Result } from './types';

import { isFunction, clone } from 'lodash';
// import isFunction from 'lodash/isFunction';
// import clone from 'lodash/clone';
import axios from 'axios';

import { errorResult } from '../constant';

import { AxiosCanceler } from './axios-cancel';
import { hasOwn } from '@fe6/shared';

export * from './transform';
export * from './types';

export class TheHttp {
  private axiosInstance: AxiosInstance;
  private readonly options: CreateAxiosOptions;

  constructor(options: CreateAxiosOptions) {
    this.options = options;
    this.axiosInstance = axios.create(options);
    this.setupInterceptors();
  }

  private createAxios(config: CreateAxiosOptions): void {
    this.axiosInstance = axios.create(config);
  }

  private getTransform() {
    const { transform } = this.options;
    return transform;
  }

  getAxios(): AxiosInstance {
    return this.axiosInstance;
  }

  configAxios(config: CreateAxiosOptions) {
    if (!this.axiosInstance) {
      return;
    }

    this.createAxios(config);
  }

  setHeader(headers: any): void {
    if (!this.axiosInstance) {
      return;
    }

    Object.assign(this.axiosInstance.defaults.headers, headers);
  }

  private setupInterceptors() {
    const transform = this.getTransform();
    if (!transform) {
      return;
    }

    const {
      requestInterceptors,
      requestInterceptorsCatch,
      responseInterceptors,
      responseInterceptorsCatch,
    } = transform;

    const axiosCanceler = new AxiosCanceler();

    // Request interceptor configuration processing
    this.axiosInstance.interceptors.request.use(
      (config: AxiosRequestConfig) => {
        // If cancel repeat request is turned on, then cancel repeat request is prohibited
        const {
          headers: { ignoreCancelToken = false },
        } = config as any;
        !ignoreCancelToken && axiosCanceler.addPending(config);
        if (requestInterceptors && isFunction(requestInterceptors)) {
          config = requestInterceptors(config);
        }

        return config;
      },
      undefined,
    );

    // Request interceptor error capture
    requestInterceptorsCatch &&
      isFunction(requestInterceptorsCatch) &&
      this.axiosInstance.interceptors.request.use(
        undefined,
        requestInterceptorsCatch,
      );

    // Response result interceptor processing
    this.axiosInstance.interceptors.response.use((res: AxiosResponse<any>) => {
      res && axiosCanceler.removePending(res.config);
      if (responseInterceptors && isFunction(responseInterceptors)) {
        res = responseInterceptors(res);
      }

      return res;
    }, undefined);

    // Response result interceptor error capture
    responseInterceptorsCatch &&
      isFunction(responseInterceptorsCatch) &&
      this.axiosInstance.interceptors.response.use(
        undefined,
        responseInterceptorsCatch,
      );
  }

  request<T = any>(
    config: AxiosRequestConfig,
    options?: RequestOptions,
  ): Promise<T> {
    let conf: AxiosRequestConfig = clone(config);
    const transform = this.getTransform();

    const { requestOptions } = this.options;

    const opt: RequestOptions = Object.assign({}, requestOptions, options);

    const { beforeRequestHook, requestCatch, transformRequestData } =
      transform || {};
    if (beforeRequestHook && isFunction(beforeRequestHook)) {
      conf = beforeRequestHook(conf, opt);
    }

    return new Promise((resolve, reject) => {
      this.axiosInstance
        .request<any, AxiosResponse<Result>>({ ...conf, ...options })
        .then((res: AxiosResponse<Result>) => {
          if (transformRequestData && isFunction(transformRequestData)) {
            const ret = transformRequestData(res, opt);
            if (ret !== errorResult) {
              if (hasOwn(options, 'success') && isFunction(options?.success)) {
                options?.success(res as unknown as Promise<T>);
              }
              resolve(ret);
            } else {
              reject(this.options.errorLog!('网络错误'));
            }
            return;
          }
          if (hasOwn(options, 'success') && isFunction(options?.success)) {
            options?.success(res as unknown as Promise<T>);
          }
          resolve(res as unknown as Promise<T>);
        })
        .catch((e: Error) => {
          if (hasOwn(options, 'error') && isFunction(options?.error)) {
            options?.error(2);
          }
          if (requestCatch && isFunction(requestCatch)) {
            reject(requestCatch(e));
            return;
          }
          reject(e);
        });
    });
  }
}
