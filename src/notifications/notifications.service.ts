import { Injectable } from '@nestjs/common';
import Expo, { ExpoPushMessage, ExpoPushTicket } from 'expo-server-sdk';

@Injectable()
export class NotificationsService {
  private expo = new Expo();

  sendPushNotifications = (
    messages: ExpoPushMessage[],
  ): Promise<ExpoPushTicket[]> => {
    const chunks = this.expo.chunkPushNotifications(messages);
    const tickets: ExpoPushTicket[] = [];

    return Promise.all(
      chunks.map((chunk) =>
        this.expo.sendPushNotificationsAsync(chunk).then((ticketChunk) => {
          tickets.push(...ticketChunk);
        }),
      ),
    ).then(() => tickets);
  };

  isValidPushToken = (token: string): boolean => {
    return Expo.isExpoPushToken(token);
  };
}
