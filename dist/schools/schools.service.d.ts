import { Repository } from 'typeorm';
import { Upload } from 'graphql-upload-ts';
import { School } from './entities/school.entity';
import { CreateSchoolInput } from './dto/create-school.input';
import { UpdateSchoolInput } from './dto/update-school.input';
import { UploadService } from '../upload/upload.service';
import { PaginationArgs } from '../common/pagination';
export declare class SchoolsService {
    private readonly schoolsRepository;
    private readonly uploadService;
    constructor(schoolsRepository: Repository<School>, uploadService: UploadService);
    createSchool: (input: CreateSchoolInput) => Promise<School>;
    findAll: (pagination: PaginationArgs) => Promise<{
        items: School[];
        total: number;
        page: number;
        totalPages: number;
    }>;
    findById: (id: string) => Promise<School>;
    findByQrCode: (qrCode: string) => Promise<School>;
    updateSchool: (id: string, input: UpdateSchoolInput) => Promise<School>;
    uploadLogo: (schoolId: string, file: Upload) => Promise<School>;
    uploadStamp: (schoolId: string, file: Upload) => Promise<School>;
    deactivateSchool: (id: string) => Promise<School>;
    regenerateQrCode: (id: string) => Promise<School>;
}
