import { Module } from '@nestjs/common';
import { SearchController } from './infrastructure/http/search.controller';

@Module({
  controllers: [SearchController],
})
export class SearchModule {}
