import store from '../../store';
import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import DataTransferObject, { ErrorResponseDto } from '@/api/models/common.dtos';


export const apiBaseUrl = 'https://api.kimhwan.kr/api/';

export interface HttpApiClient {
  getRequest<T extends DataTransferObject | void = void>(uri: string, params?: any, headers?: any): Promise<T>;

  deleteRequest<T extends DataTransferObject | void = void>(uri: string, params?: any, headers?: any): Promise<T>;

  postRequest<T extends DataTransferObject | void = void>(uri: string, params?: any, requestModel?: DataTransferObject | null, headers?: any): Promise<T>;

  putRequest<T extends DataTransferObject | void = void>(uri: string, params?: any, requestModel?: DataTransferObject | null, headers?: any): Promise<T>;

  patchRequest<T extends DataTransferObject | void = void>(uri: string, params?: any, requestModel?: DataTransferObject | null, headers?: any): Promise<T>;
}

export function createHttpApiClient(uri: string, withAuth: boolean = true): HttpApiClient {
  return new HttpApiClientInstance(uri, withAuth);
}

interface CustomAxiosRequestConfig extends AxiosRequestConfig {
  retryCount: number;
}

class HttpApiClientInstance implements HttpApiClient {
  private readonly instance: AxiosInstance;

  public constructor(uri: string, withAuth: boolean = true) {
    const instance = axios.create({
      baseURL: `${apiBaseUrl}${uri}`,
    });
    this.instance = this.setInterceptors(instance, withAuth);
  }

  public getRequest<T extends DataTransferObject | void = void>(uri: string, params?: any, headers?: any): Promise<T> {
    return this.createHttpApiResponse(
      this.instance.get<T>(uri, this.buildAxiosRequestConfig(params, headers)),
    );
  }

  public deleteRequest<T extends DataTransferObject | void = void>(uri: string, params?: any, headers?: any): Promise<T> {
    return this.createHttpApiResponse(
      this.instance.delete<T>(uri, this.buildAxiosRequestConfig(params, headers)),
    );
  }

  public patchRequest<T extends DataTransferObject | void = void>(uri: string, params?: any, requestModel?: DataTransferObject | null, headers?: any): Promise<T> {
    return this.createHttpApiResponse(
      this.instance.patch<T>(uri, requestModel, this.buildAxiosRequestConfig(params, headers)),
    );
  }

  public postRequest<T extends DataTransferObject | void = void>(uri: string, params?: any, requestModel?: DataTransferObject | null, headers?: any): Promise<T> {
    return this.createHttpApiResponse(
      this.instance.post<T>(uri, requestModel, this.buildAxiosRequestConfig(params, headers)),
    );
  }

  public putRequest<T extends DataTransferObject | void = void>(uri: string, params?: any, requestModel?: DataTransferObject | null, headers?: any): Promise<T> {
    return this.createHttpApiResponse(
      this.instance.put<T>(uri, requestModel, this.buildAxiosRequestConfig(params, headers)),
    );
  }

  private createHttpApiResponse<T extends DataTransferObject | void = void>(response: Promise<AxiosResponse>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      response.then(response => {
        resolve(response.data);
      }).catch((error: Error | AxiosError<ErrorResponseDto>) => {
        if (axios.isAxiosError(error)) {
          reject(new Error(error.response?.data?.message));
        } else {
          reject(error);
        }
      });
    });
  }

  private buildAxiosRequestConfig(params?: any, headers?: any): AxiosRequestConfig {
    return {
      params: params,
      headers: headers,
    };
  }

  private setInterceptors(instance: AxiosInstance, withAuth: boolean) {
    // Add a request interceptor
    instance.interceptors.request.use(
      (config: AxiosRequestConfig) => {
        // 인증 사용 시 인증 헤더를 항상 추가하여 전송한다.
        if (withAuth) {
          config.headers!.Authorization = `Bearer ${store.state.accountStore.accessToken}`;
        }

        return config;
      },
      (error: Error) => {
        return Promise.reject(error);
      },
    );

    // Add a response interceptor
    instance.interceptors.response.use(
      (response: AxiosResponse) => {
        // 현재는 별 다른 처리 없이 응답 데이터를 그대로 사용한다.
        return response;
      },
      async (error: Error | AxiosError<ErrorResponseDto>) => {
        if (withAuth && axios.isAxiosError(error)) {
          const responseErrorName = error.response?.data?.name?.toLowerCase();

          // 토큰이 만료된 경우 갱신 토큰이 있다면 갱신을 시도한다.
          if (responseErrorName == 'token_expired' && store.state.accountStore.refreshToken) {
            const requestConfig = error.config as CustomAxiosRequestConfig;
            requestConfig.retryCount ??= 0;

            if (requestConfig.retryCount < 1) {
              requestConfig.retryCount++;

              try {
                await store.dispatch('accountStore/reissueToken');
              } catch (error) {
                return Promise.reject(error);
              }

              // 토큰이 만료되어 실패했던 요청을 다시 재요청 시도한다.
              return instance.request(requestConfig);
            }
          }
        }

        return Promise.reject(error);
      },
    );
    return instance;
  }
}