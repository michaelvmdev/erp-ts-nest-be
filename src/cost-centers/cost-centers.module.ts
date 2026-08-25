import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { CostCenterOrmEntity } from './infrastructure/persistence/cost-center.orm-entity';
import { CostCentersService } from './cost-centers.service';
import { CostCentersController } from './infrastructure/http/cost-centers.controller';

@Module({
  imports: [TypeOrmModule.forFeature([CostCenterOrmEntity]), AuthModule],
  controllers: [CostCentersController],
  providers:   [CostCentersService],
  exports:     [CostCentersService],
})
export class CostCentersModule {}
