import { Module, Global } from '@nestjs/common';
import { SettingsService } from './settings.service';

@Global()  // Available everywhere without importing SettingsModule explicitly
@Module({
  providers: [SettingsService],
  exports: [SettingsService],
})
export class SettingsModule {}
