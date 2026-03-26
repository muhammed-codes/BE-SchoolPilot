import { Type } from '@nestjs/common';
export declare const createPaginatedType: <T>(ItemType: Type<T>) => {
    new (): {
        items: T[];
        total: number;
        page: number;
        totalPages: number;
    };
};
