import { FeesService } from './fees.service';
import { UserRole } from '../common/enums';

describe('fee directory dependency', () => {
  const make = () => {
    const query = {
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([{ id: 'class-a', name: 'JSS 1' }]),
    };
    const find = jest.fn().mockResolvedValue([
      {
        id: 'student-a',
        firstName: 'A',
        lastName: 'Student',
        admissionNumber: '001',
        currentClassId: 'class-a',
        dateOfBirth: 'private',
        address: 'private',
      },
    ]);
    const service = Object.create(FeesService.prototype) as FeesService;
    Object.assign(service, {
      studentRepo: {
        manager: { getRepository: () => ({ createQueryBuilder: () => query }) },
        find,
      },
    });
    return { service, query, find };
  };
  it('returns only fee selector fields and binds the current school', async () => {
    const { service, find, query } = make();
    const result = await service.getFeeStudentLookup(
      'school-a',
      'bursar-a',
      UserRole.BURSAR,
    );
    expect(query.where).toHaveBeenCalledWith('c.schoolId = :schoolId', {
      schoolId: 'school-a',
    });
    expect(find).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          schoolId: 'school-a',
          isArchived: false,
        }),
      }),
    );
    expect(result[0]).not.toHaveProperty('dateOfBirth');
    expect(result[0]).not.toHaveProperty('address');
    expect(result[0].admissionNumber).toBe('001');
  });
  it('does not expose a foreign class roster', async () => {
    const { service, find } = make();
    expect(
      await service.getFeeStudentLookup(
        'school-a',
        'bursar-a',
        UserRole.BURSAR,
        'foreign',
      ),
    ).toEqual([]);
    expect(find).not.toHaveBeenCalled();
  });
  it('rejects parent directory access', async () => {
    const { service } = make();
    await expect(
      service.getFeeClassLookup('school-a', 'parent-a', UserRole.PARENT),
    ).rejects.toThrow('linked-child');
  });
});
