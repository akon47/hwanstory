import { attachmentsV1 } from './index';
import { SimpleFileDto } from '@/api/models/attachment.dtos';

function uploadFile(blob: Blob) {
  return attachmentsV1.uploadFileRequest<SimpleFileDto>('', 'file', Array.of(blob));
}

function uploadFileFromUrl(fileUrl: URL) {
  return fetch(fileUrl.href)
  .then(response => response.blob())
  .then(async (blob: Blob) => {
    return uploadFile(blob);
  })
  .catch(() => {
    return attachmentsV1.postRequest<SimpleFileDto>('', {
      fileUrl: fileUrl.href
    });
  });
}

export { uploadFile, uploadFileFromUrl };
