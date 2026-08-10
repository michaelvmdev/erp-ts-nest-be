import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CreateNpsSurveyUseCase } from './application/create-nps-survey.use-case';
import { FindNpsSurveyUseCase } from './application/find-nps-survey.use-case';
import { GetNpsScoreUseCase } from './application/get-nps-score.use-case';
import { ListNpsSurveysUseCase } from './application/list-nps-surveys.use-case';
import { NPS_REPOSITORY } from './domain/nps-survey.repository';
import { NpsController } from './infrastructure/http/nps.controller';
import { NpsSurveyOrmEntity } from './infrastructure/persistence/nps-survey.orm-entity';
import { TypeOrmNpsSurveyRepository } from './infrastructure/persistence/typeorm-nps-survey.repository';

@Module({
  imports: [TypeOrmModule.forFeature([NpsSurveyOrmEntity])],
  controllers: [NpsController],
  providers: [
    TypeOrmNpsSurveyRepository,
    { provide: NPS_REPOSITORY, useExisting: TypeOrmNpsSurveyRepository },
    FindNpsSurveyUseCase,
    ListNpsSurveysUseCase,
    CreateNpsSurveyUseCase,
    GetNpsScoreUseCase,
  ],
})
export class NpsModule {}
