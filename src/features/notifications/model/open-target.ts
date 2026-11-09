import { useNavigate } from 'react-router';
import { useCurrentUser } from '@/features/auth';
import { appointmentDate, type Notification } from '../api/notifications-api';

/**
 * Куда ведёт уведомление: если RecId — запись (онлайн-запись, отмена), открываем её в журнале
 * на нужный день. Иначе — никуда (тексты сервисных уведомлений самодостаточны).
 */
export function useOpenNotification() {
  const user = useCurrentUser();
  const navigate = useNavigate();
  return async (notification: Notification): Promise<boolean> => {
    if (notification.recordId === null) return false;
    const date = await appointmentDate(user.userId, notification.recordId).catch(() => null);
    if (!date) return false;
    void navigate(`/logbook?date=${date}&open=${notification.recordId}`);
    return true;
  };
}
