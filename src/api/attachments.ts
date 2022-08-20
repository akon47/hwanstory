import { attachmentsV1 } from './index';
import { SimpleFileDto } from '@/api/models/attachment.dtos';

function uploadImageFile(blob: Blob) {
  return attachmentsV1.uploadFileRequest<SimpleFileDto>('', 'imageFile', Array.of(blob));
}

export { uploadImageFile };
