import { notificationsV1 } from './index';
import { SliceDto } from "@/api/models/common.dtos";
import { NotificationDto } from "@/api/models/notification.dtos";

function getNotifications(size: number, cursorId: string | null = null) {
  return notificationsV1.getRequest<SliceDto<NotificationDto>>(``, {
    cursorId: cursorId,
    size: size,
  });
}

function deleteNotification(notificationId: string) {
  return notificationsV1.deleteRequest(`/${notificationId}`);
}

export { getNotifications, deleteNotification };
