import { Entity, Column, PrimaryGeneratedColumn, Unique, Index } from 'typeorm';

@Entity('admission_sequences')
@Unique(['schoolId', 'year'])
export class AdmissionSequence {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid' })
  schoolId: string;

  @Column({ type: 'integer' })
  year: number;

  @Column({ type: 'integer', default: 0 })
  lastSequence: number;
}
