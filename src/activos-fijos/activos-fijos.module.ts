import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { FixedAssetOrmEntity } from './infrastructure/persistence/fixed-asset.orm-entity';
import { AssetDepreciationOrmEntity } from './infrastructure/persistence/asset-depreciation.orm-entity';
import { AssetMaintenanceOrmEntity } from './infrastructure/persistence/asset-maintenance.orm-entity';
import { ActivosFijosService } from './activos-fijos.service';
import { ActivosFijosController } from './infrastructure/http/activos-fijos.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([FixedAssetOrmEntity, AssetDepreciationOrmEntity, AssetMaintenanceOrmEntity]),
    AuthModule,
    AuditModule,
  ],
  controllers: [ActivosFijosController],
  providers:   [ActivosFijosService],
  exports:     [ActivosFijosService],
})
export class ActivosFijosModule {}
