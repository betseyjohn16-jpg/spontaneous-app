import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function requestNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === "web") return false;
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === "granted") return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === "granted";
}

function parseReservationTime(timeStr: string): Date | null {
  const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!match) return null;

  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const period = match[3].toUpperCase();

  if (period === "PM" && hours !== 12) hours += 12;
  if (period === "AM" && hours === 12) hours = 0;

  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date;
}

export async function scheduleReservationReminder(
  restaurantName: string,
  reservationTime: string,
  attire?: string
): Promise<string | null> {
  if (Platform.OS === "web") return null;

  const granted = await requestNotificationPermissions();
  if (!granted) return null;

  const reservationDate = parseReservationTime(reservationTime);
  if (!reservationDate) return null;

  const reminderDate = new Date(reservationDate.getTime() - 30 * 60 * 1000);
  if (reminderDate <= new Date()) return null;

  const body = attire
    ? `You're heading to ${restaurantName} at ${reservationTime}. Remember: ${attire} dress code.`
    : `You're heading to ${restaurantName} at ${reservationTime}. Don't be late!`;

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: "Reservation in 30 minutes",
      body,
      sound: true,
      data: { restaurantName, reservationTime },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: reminderDate,
    },
  });

  return id;
}

export async function cancelNotification(id: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(id);
}
