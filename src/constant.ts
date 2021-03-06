// 接口返回值 data 不能为这个，否则会判为请求失败
export const errorResult = '__ERROR_RESULT__';

export const HTTP_ERROR_TIPS = {
  200: '请求成功',
  401: '用户没有权限（令牌、用户名、密码错误）!',
  403: '用户得到授权，但是访问是被禁止的。!',
  404: '网络请求错误,未找到该资源!',
  405: '网络请求错误,请求方法未允许!',
  408: '网络请求超时!',
  500: '服务器错误,请联系管理员!',
  501: '网络未实现!',
  502: '网络错误!',
  503: '服务不可用，服务器暂时过载或维护!',
  504: '网络超时，请刷新页面重试!',
  505: 'Http 版本不支持该请求!',
};
