import store from '../../store';
import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import DataTransferObject, { ErrorResponseDto } from '@/api/models/common.dtos';

export const serverUrl = process.env.VUE_APP_API_BASE_URI;
export const apiBaseUrl = `${serverUrl}api/`;
export const attachmentFileBaseUrl = `${apiBaseUrl}v1`;

export interface HttpApiClient {
  getRequest<T extends DataTransferObject | void = void>(uri: string, params?: any, headers?: any): Promise<T>;

  deleteRequest<T extends DataTransferObject | void = void>(uri: string, params?: any, headers?: any): Promise<T>;

  postRequest<T extends DataTransferObject | void = void>(uri: string, params?: any, requestModel?: DataTransferObject | null, headers?: any): Promise<T>;

  putRequest<T extends DataTransferObject | void = void>(uri: string, params?: any, requestModel?: DataTransferObject | null, headers?: any): Promise<T>;

  patchRequest<T extends DataTransferObject | void = void>(uri: string, params?: any, requestModel?: DataTransferObject | null, headers?: any): Promise<T>;

  uploadFileRequest<T extends DataTransferObject | void = void>(uri: string, name: string, files: Array<Blob>, params?: any, headers?: any): Promise<T>;
}

export interface HttpApiError extends Error {
  readonly statusCode?: number;
  readonly statusText?: string;
  readonly serverErrorCode?: string;
  readonly serverErrorMessage?: string;

  getErrorMessage(): string;

  isNotFound(): boolean;

  isConflict(): boolean;

  isUnauthorized(): boolean;

  isForbidden(): boolean;
}

export function createHttpApiClient(uri: string, withAuth: boolean = true): HttpApiClient {
  return new AxiosHttpApiClientImpl(uri, withAuth);
}

//region Axios를 이용한 구현체

// Retry 요청 기능을 지원하기 위한 인터페이스
interface CustomAxiosRequestConfig extends AxiosRequestConfig {
  retryCount: number;
}

// Axios를 이용한 HttpApiError 구현체
class AxiosHttpApiErrorImpl implements HttpApiError {
  public readonly statusCode?: number;
  public readonly statusText?: string;
  public readonly serverErrorCode?: string;
  public readonly serverErrorMessage?: string;
  public message: string;
  public name: string;

  private readonly config: AxiosRequestConfig;

  public constructor(error: AxiosError<ErrorResponseDto>) {
    this.statusCode = error.response?.status;
    this.statusText = error.response?.statusText;
    this.serverErrorCode = error.response?.data?.name;
    this.serverErrorMessage = error.response?.data?.message;
    this.name = 'HttpApiError';
    this.message = error.message;

    this.config = error.config;
  }

  public getErrorMessage(defaultErrorMessage: string = '서비스에 일시적인 문제가 있습니다. 다시 시도해 보세요.'): string {
    if (this.serverErrorMessage) {
      return this.serverErrorMessage;
    }
    if (this.message) {
      return this.message;
    }

    return defaultErrorMessage;
  }

  public isUnauthorized = () => this.statusCode == 401;

  public isForbidden = () => this.statusCode == 403;

  public isNotFound = () => this.statusCode == 404;

  public isConflict = () => this.statusCode == 409;

  public getCustomAxiosRequestConfig(): CustomAxiosRequestConfig {
    const requestConfig = this.config as CustomAxiosRequestConfig;
    requestConfig.retryCount ??= 0;

    return requestConfig;
  }
}

// Axios를 이용한 HttpApiClient 구현체
class AxiosHttpApiClientImpl implements HttpApiClient {
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

  public uploadFileRequest<T extends DataTransferObject | void = void>(uri: string, name: string, files: Array<Blob>, params?: any, headers?: any): Promise<T> {
    const form = new FormData();
    files.forEach((file) => form.append(name, file));
    return this.createHttpApiResponse(
      this.instance.post<T>(uri, form, this.buildAxiosRequestConfig(params, headers)),
    );
  }

  private createHttpApiResponse<T extends DataTransferObject | void = void>(response: Promise<AxiosResponse>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      response
      .then(response => {
        resolve(response.data);
      })
      .catch(error => {
        reject(error);
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
        // HttpApiClient를 통하여 호출하는 모든 Api 호출은 HttpApiError 인터페이스의 에러 타입을 반환하도록 처리한다.
        const httpApiError = new AxiosHttpApiErrorImpl(axios.isAxiosError(error) ? error : new AxiosError<ErrorResponseDto>(error.message));

        if (withAuth && httpApiError.isUnauthorized()) {
          const serverErrorCode = httpApiError.serverErrorCode?.toLowerCase();

          // 토큰이 만료된 경우 갱신을 시도한다.
          if (serverErrorCode == 'token_expired') {
            const requestConfig = httpApiError.getCustomAxiosRequestConfig();

            if (requestConfig?.retryCount < 1) {
              requestConfig.retryCount++;

              try {
                await store.dispatch('accountStore/reissueToken');
              } catch (error) {
                return store.dispatch('accountStore/signOut', true);
              }

              // 토큰이 만료되어 실패했던 요청을 다시 재요청 시도한다.
              return instance.request(requestConfig);
            }
          } else {
            // 토큰이 만료된 경우가 아닌 경우에 대해서는 클라이언트에 저장되어 있는 토큰을 삭제한다.
            await store.dispatch('accountStore/signOut', true);
          }
        }

        return Promise.reject(httpApiError);
      },
    );
    return instance;
  }
}

//endregion
