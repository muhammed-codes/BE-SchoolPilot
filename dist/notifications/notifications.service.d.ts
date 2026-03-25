import { ExpoPushMessage, ExpoPushTicket } from 'expo-server-sdk';
export declare class NotificationsService {
    private expo;
    sendPushNotifications: (messages: ExpoPushMessage[]) => Promise<ExpoPushTicket[]>;
    isValidPushToken: (token: string) => boolean;
}
