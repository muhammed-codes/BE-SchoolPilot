"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationsService = void 0;
const common_1 = require("@nestjs/common");
const expo_server_sdk_1 = __importDefault(require("expo-server-sdk"));
let NotificationsService = class NotificationsService {
    expo = new expo_server_sdk_1.default();
    sendPushNotifications = (messages) => {
        const chunks = this.expo.chunkPushNotifications(messages);
        const tickets = [];
        return Promise.all(chunks.map((chunk) => this.expo.sendPushNotificationsAsync(chunk).then((ticketChunk) => {
            tickets.push(...ticketChunk);
        }))).then(() => tickets);
    };
    isValidPushToken = (token) => {
        return expo_server_sdk_1.default.isExpoPushToken(token);
    };
};
exports.NotificationsService = NotificationsService;
exports.NotificationsService = NotificationsService = __decorate([
    (0, common_1.Injectable)()
], NotificationsService);
//# sourceMappingURL=notifications.service.js.map