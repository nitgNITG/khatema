import { Injectable } from '@nestjs/common';
import { DatabaseService } from '@/database/database.service';

export interface AppSettingsData {
  sessionDurationDays: number;
  registrationMode: string;
  defaultMaxCollective: number;
  defaultMaxIndividual: number;
  emailNotificationsEnabled: boolean;
  maxKhatmaParticipants: number;
  maintenanceMode: boolean;
  maintenanceMessage: string | null;
}

const DEFAULTS: AppSettingsData = {
  sessionDurationDays: 7,
  registrationMode: 'OPEN',
  defaultMaxCollective: 3,
  defaultMaxIndividual: 3,
  emailNotificationsEnabled: true,
  maxKhatmaParticipants: 100,
  maintenanceMode: false,
  maintenanceMessage: null,
};

@Injectable()
export class SettingsService {
  // In-memory cache so every auth call doesn't hit DB
  private cache: AppSettingsData | null = null;
  private cacheAt = 0;
  private readonly TTL = 60_000; // 1 minute

  constructor(private db: DatabaseService) {}

  async get(): Promise<AppSettingsData> {
    if (this.cache && Date.now() - this.cacheAt < this.TTL) {
      return this.cache;
    }
    const row = await this.db.appSettings.findUnique({ where: { id: 'singleton' } });
    this.cache = row
      ? {
          sessionDurationDays: row.sessionDurationDays,
          registrationMode: row.registrationMode,
          defaultMaxCollective: row.defaultMaxCollective,
          defaultMaxIndividual: row.defaultMaxIndividual,
          emailNotificationsEnabled: row.emailNotificationsEnabled,
          maxKhatmaParticipants: row.maxKhatmaParticipants,
          maintenanceMode: row.maintenanceMode,
          maintenanceMessage: row.maintenanceMessage,
        }
      : { ...DEFAULTS };
    this.cacheAt = Date.now();
    return this.cache;
  }

  async update(data: Partial<AppSettingsData>, updatedById?: string): Promise<AppSettingsData> {
    const row = await this.db.appSettings.upsert({
      where: { id: 'singleton' },
      create: { id: 'singleton', ...DEFAULTS, ...data, updatedById },
      update: { ...data, updatedById },
    });
    // Bust cache
    this.cache = null;
    return this.get();
  }

  // Convenience: get a single value with type safety
  async getValue<K extends keyof AppSettingsData>(key: K): Promise<AppSettingsData[K]> {
    const settings = await this.get();
    return settings[key];
  }
}
