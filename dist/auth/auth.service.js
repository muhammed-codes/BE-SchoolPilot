"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const bcrypt = __importStar(require("bcrypt"));
const users_service_1 = require("../users/users.service");
let AuthService = class AuthService {
    usersService;
    jwtService;
    configService;
    constructor(usersService, jwtService, configService) {
        this.usersService = usersService;
        this.jwtService = jwtService;
        this.configService = configService;
    }
    register = (input) => {
        return this.usersService
            .findByEmail(input.email)
            .then((existing) => {
            if (existing) {
                throw new common_1.BadRequestException('User with this email already exists');
            }
            return this.hashData(input.password);
        })
            .then((passwordHash) => this.usersService.create({
            email: input.email,
            firstName: input.firstName,
            lastName: input.lastName,
            role: input.role,
            schoolId: input.schoolId,
            phone: input.phone,
            passwordHash,
        }))
            .then((user) => this.generateTokens(user).then((tokens) => ({ ...tokens, user })));
    };
    login = (input) => {
        return this.validateUser(input.email, input.password).then((user) => this.generateTokens(user).then((tokens) => ({ ...tokens, user })));
    };
    refreshTokens = (userId, refreshToken) => {
        return this.usersService.findById(userId).then((user) => {
            if (!user || !user.refreshToken) {
                throw new common_1.ForbiddenException('Access denied');
            }
            return bcrypt
                .compare(refreshToken, user.refreshToken)
                .then((matches) => {
                if (!matches) {
                    throw new common_1.ForbiddenException('Access denied');
                }
                return this.generateTokens(user).then((tokens) => ({
                    ...tokens,
                    user,
                }));
            });
        });
    };
    logout = (userId) => {
        return this.usersService
            .update(userId, { refreshToken: null })
            .then(() => true);
    };
    updateExpoPushToken = (userId, token) => {
        return this.usersService
            .update(userId, { expoPushToken: token })
            .then(() => true);
    };
    validateUser = (email, password) => {
        return this.usersService.findByEmail(email).then((user) => {
            if (!user) {
                throw new common_1.UnauthorizedException('Invalid credentials');
            }
            return bcrypt
                .compare(password, user.passwordHash)
                .then((isValid) => {
                if (!isValid) {
                    throw new common_1.UnauthorizedException('Invalid credentials');
                }
                return user;
            });
        });
    };
    generateTokens = (user) => {
        const payload = {
            sub: user.id,
            email: user.email,
            role: user.role,
            schoolId: user.schoolId,
        };
        const accessToken = this.jwtService.sign({ ...payload }, {
            secret: this.configService.getOrThrow('JWT_ACCESS_SECRET'),
            expiresIn: this.configService.getOrThrow('JWT_ACCESS_EXPIRES'),
        });
        const refreshToken = this.jwtService.sign({ sub: user.id }, {
            secret: this.configService.getOrThrow('JWT_REFRESH_SECRET'),
            expiresIn: this.configService.getOrThrow('JWT_REFRESH_EXPIRES'),
        });
        return this.hashData(refreshToken).then((hashedRefresh) => this.usersService
            .update(user.id, { refreshToken: hashedRefresh })
            .then(() => ({ accessToken, refreshToken })));
    };
    hashData = (data) => {
        return bcrypt.hash(data, 12);
    };
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [users_service_1.UsersService,
        jwt_1.JwtService,
        config_1.ConfigService])
], AuthService);
//# sourceMappingURL=auth.service.js.map