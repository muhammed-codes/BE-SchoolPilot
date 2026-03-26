import { BaseEntity } from '../../common/entities/base.entity';
import { Term } from './term.entity';
export declare class Session extends BaseEntity {
    name: string;
    schoolId: string;
    isActive: boolean;
    terms: Term[];
}
