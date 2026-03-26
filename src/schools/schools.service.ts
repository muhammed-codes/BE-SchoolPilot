import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { Upload } from 'graphql-upload-ts';
import { School } from './entities/school.entity';
import { CreateSchoolInput } from './dto/create-school.input';
import { UpdateSchoolInput } from './dto/update-school.input';
import { UploadService } from '../upload/upload.service';
import { PaginationArgs } from '../common/pagination';

@Injectable()
export class SchoolsService {
  constructor(
    @InjectRepository(School)
    private readonly schoolsRepository: Repository<School>,
    private readonly uploadService: UploadService,
  ) {}

  createSchool = (input: CreateSchoolInput) => {
    const school = this.schoolsRepository.create({
      ...input,
      uniqueQrCode: uuidv4(),
    });
    return this.schoolsRepository.save(school);
  };

  findAll = (pagination: PaginationArgs) => {
    const { page, limit } = pagination;
    const skip = (page - 1) * limit;

    return this.schoolsRepository
      .findAndCount({ skip, take: limit, order: { createdAt: 'DESC' } })
      .then(([items, total]) => ({
        items,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      }));
  };

  findById = (id: string) => {
    return this.schoolsRepository.findOne({ where: { id } }).then((school) => {
      if (!school) throw new NotFoundException('School not found');
      return school;
    });
  };

  findByQrCode = (qrCode: string) => {
    return this.schoolsRepository
      .findOne({ where: { uniqueQrCode: qrCode } })
      .then((school) => {
        if (!school)
          throw new NotFoundException('School not found for this QR code');
        return school;
      });
  };

  updateSchool = (id: string, input: UpdateSchoolInput) => {
    return this.schoolsRepository
      .update(id, input)
      .then(() => this.findById(id));
  };

  uploadLogo = (schoolId: string, file: Upload) => {
    return this.findById(schoolId).then((school) => {
      const deleteOld = school.logoPublicId
        ? this.uploadService.deleteFile(school.logoPublicId)
        : Promise.resolve();

      return deleteOld
        .then(() => this.uploadService.uploadFile(file, 'schools/logos'))
        .then((result) =>
          this.schoolsRepository
            .update(schoolId, {
              logoUrl: result.url,
              logoPublicId: result.publicId,
            })
            .then(() => this.findById(schoolId)),
        );
    });
  };

  uploadStamp = (schoolId: string, file: Upload) => {
    return this.findById(schoolId).then((school) => {
      const deleteOld = school.stampPublicId
        ? this.uploadService.deleteFile(school.stampPublicId)
        : Promise.resolve();

      return deleteOld
        .then(() => this.uploadService.uploadFile(file, 'schools/stamps'))
        .then((result) =>
          this.schoolsRepository
            .update(schoolId, {
              stampUrl: result.url,
              stampPublicId: result.publicId,
            })
            .then(() => this.findById(schoolId)),
        );
    });
  };

  deactivateSchool = (id: string) => {
    return this.schoolsRepository
      .update(id, { isActive: false })
      .then(() => this.findById(id));
  };

  regenerateQrCode = (id: string) => {
    return this.schoolsRepository
      .update(id, { uniqueQrCode: uuidv4() })
      .then(() => this.findById(id));
  };
}
