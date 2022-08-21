import { attachmentsV1 } from './index';
import { SimpleFileDto } from '@/api/models/attachment.dtos';

function uploadImageFile(blob: Blob) {
  return attachmentsV1.uploadFileRequest<SimpleFileDto>('', 'imageFile', Array.of(blob));
}

function uploadImageFileFromUrl(imageUrl: URL) {
  return fetch(imageUrl.href)
  .then(response => response.blob())
  .then(async (blob: Blob) => {
    return uploadImageFile(blob);
  })
  .catch(() => {
    return attachmentsV1.postRequest<SimpleFileDto>('', {
      imageUrl: imageUrl.href
    });
  });
}

export { uploadImageFile, uploadImageFileFromUrl };
