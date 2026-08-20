import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { ProjectsController } from './infrastructure/http/projects.controller';
import { ProjectEntity } from './infrastructure/orm/project.entity';
import { ProjectTaskEntity } from './infrastructure/orm/project-task.entity';
import { ProjectExpenseEntity } from './infrastructure/orm/project-expense.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([ProjectEntity, ProjectTaskEntity, ProjectExpenseEntity]),
    AuthModule,
  ],
  controllers: [ProjectsController],
})
export class ProjectsModule {}
