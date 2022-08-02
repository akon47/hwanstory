import axios from "axios";
import { setInterceptors } from "./common/interceptors";

export const apiUrl = "https://api.kimhwan.kr/api/";

function createInstance() {
    const instance = axios.create({
        baseURL: apiUrl
    });
    return instance;
}

function createInstanceWithAuth(url) {
    const instance = axios.create({
        baseURL: `${apiUrl}${url}`
    });
    return setInterceptors(instance);
}

export const instance = createInstance();
export const accountsV1 = createInstanceWithAuth("v1/accounts");
export const authenticationV1 = createInstanceWithAuth("v1/authentication");