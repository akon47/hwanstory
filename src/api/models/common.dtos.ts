// DTO를 나타내는 최상위 인터페이스
export default interface DataTransferObject {
}

export interface ErrorResponseDto extends DataTransferObject {
  readonly name: string;
  readonly message: string;
}
