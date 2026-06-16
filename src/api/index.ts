import { createHttpApiClient, HttpApiClient } from '@/api/common/httpApiClient';

export const accountsV1: HttpApiClient = createHttpApiClient('v1/accounts');
export const authenticationV1: HttpApiClient = createHttpApiClient('v1/authentication');
export const blogV1: HttpApiClient = createHttpApiClient('v1/blog');
export const attachmentsV1: HttpApiClient = createHttpApiClient('v1/attachments');

export const notificationsV1: HttpApiClient = createHttpApiClient('v1/notifications');

export const followV1: HttpApiClient = createHttpApiClient('v1/follow');
export const feedV1: HttpApiClient = createHttpApiClient('v1/feed');

export const adminV1: HttpApiClient = createHttpApiClient('v1/admin');
