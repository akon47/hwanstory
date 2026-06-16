import DataTransferObject from '@/api/models/common.dtos';
import { SimpleAccountDto } from "@/api/models/account.dtos";
import { CommentDto } from "@/api/models/blog.dtos";

// 알림 유형
export type NotificationType = 'COMMENT' | 'FOLLOW'

// 알림 Dto
export interface NotificationDto extends DataTransferObject {
  // 알림 Id
  readonly id: string;
  // 알림을 받은 사용자
  readonly receiver: SimpleAccountDto;
  // 알림 유형
  readonly notificationType: NotificationType;
  // 알림이 발생한 시간
  readonly createdAt: Date;
  // 알림을 읽은 시간
  readonly readAt: Date;
}

// 댓글 알림 Dto
export interface CommentNotificationDto extends NotificationDto {
  // 관련 댓글
  readonly comment: CommentDto;
}

// 팔로우 알림 Dto
export interface FollowNotificationDto extends NotificationDto {
  // 새로 팔로우한 사용자
  readonly follower: SimpleAccountDto;
}