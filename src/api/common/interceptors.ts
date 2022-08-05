import store from "../../store";
import {AxiosInstance, AxiosRequestConfig, AxiosResponse} from "axios";

function setInterceptors(instance: AxiosInstance) {
    // Add a request interceptor
    instance.interceptors.request.use(
        function (config: AxiosRequestConfig) {
            // Do something before request is sent
            config.headers!.Authorization = store.state.accountStore.accessToken;
            return config;
        },
        function (error: any) {
            // Do something with request error
            return Promise.reject(error);
        }
    );

    // Add a response interceptor
    instance.interceptors.response.use(
        function (response: AxiosResponse) {
            // Any status code that lie within the range of 2xx cause this function to trigger
            // Do something with response data
            return response;
        },
        function (error: any) {
            // Any status codes that falls outside the range of 2xx cause this function to trigger
            // Do something with response error
            return Promise.reject(error);
        }
    );
    return instance;
}

export {setInterceptors};