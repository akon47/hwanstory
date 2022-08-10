import { createHttpApiClient, HttpApiClient } from '@/api/common/httpApiClient';

export const accountsV1: HttpApiClient = createHttpApiClient('v1/accounts');
export const authenticationV1: HttpApiClient = createHttpApiClient('v1/authentication');
export const blogV1: HttpApiClient = createHttpApiClient('v1/blog');
