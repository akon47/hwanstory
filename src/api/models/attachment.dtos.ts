import DataTransferObject from '@/api/models/common.dtos';

// 파일 Dto
export interface FileDto extends DataTransferObject {
  // 파일 Id
  readonly id: string;
  // Mime 타입
  readonly contentType: string;
  // 파일 URL
  readonly url: string;
  // 파일 크기 (bytes)
  readonly fileSize: number;
  // 파일 이름
  readonly fileName: string;
}

// 간단한 파일 Dto
export interface SimpleFileDto extends DataTransferObject {
  // 파일 Id
  readonly id: string;
  // 파일 URL
  readonly url: string;
  // 파일 이름
  readonly fileName: string;
}
