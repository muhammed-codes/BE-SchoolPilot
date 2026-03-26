import { BaseEntity } from '../../common/entities/base.entity';
export declare class School extends BaseEntity {
    name: string;
    address: string;
    phone: string;
    email: string;
    logoUrl: string;
    stampUrl: string;
    logoPublicId: string;
    stampPublicId: string;
    schoolType: string;
    defaultReportTemplate: string;
    schoolStartTime: string;
    isActive: boolean;
    uniqueQrCode: string;
}
