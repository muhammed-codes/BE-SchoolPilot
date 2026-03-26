import { Upload } from 'graphql-upload-ts';
import { SchoolsService } from './schools.service';
import { School } from './entities/school.entity';
import { CreateSchoolInput } from './dto/create-school.input';
import { UpdateSchoolInput } from './dto/update-school.input';
import { PaginationArgs } from '../common/pagination';
export declare class SchoolsResolver {
    private readonly schoolsService;
    constructor(schoolsService: SchoolsService);
    schools(pagination: PaginationArgs): Promise<{
        items: School[];
        total: number;
        page: number;
        totalPages: number;
    }>;
    school(id: string): Promise<School>;
    mySchool(user: {
        sub: string;
        schoolId: string;
    }): Promise<School>;
    createSchool(input: CreateSchoolInput): Promise<School>;
    updateSchool(id: string, input: UpdateSchoolInput, user: {
        role: string;
        schoolId: string;
    }): Promise<School>;
    uploadSchoolLogo(schoolId: string, file: Upload, user: {
        role: string;
        schoolId: string;
    }): Promise<School>;
    uploadSchoolStamp(schoolId: string, file: Upload, user: {
        role: string;
        schoolId: string;
    }): Promise<School>;
    deactivateSchool(id: string): Promise<School>;
    regenerateQrCode(schoolId: string, user: {
        schoolId: string;
    }): Promise<School>;
}
