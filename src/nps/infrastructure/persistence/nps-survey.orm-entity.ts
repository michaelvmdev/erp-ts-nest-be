import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'nps_surveys' })
export class NpsSurveyOrmEntity {
  @PrimaryColumn({ name: 'survey_id', type: 'uuid' })
  surveyId!: string;

  @Column({ name: 'sale_id', type: 'uuid' })
  saleId!: string;

  @Column({ name: 'score', type: 'smallint' })
  score!: number;

  @Column({ name: 'comment', type: 'text', nullable: true })
  comment!: string | null;

  @Column({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
