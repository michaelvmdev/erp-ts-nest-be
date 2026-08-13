import { Inject, Injectable, Logger } from '@nestjs/common';
import { NPS_REPOSITORY } from '../domain/nps-survey.repository';
import type { NpsCampaignContact, NpsSurveyRepository } from '../domain/nps-survey.repository';

export interface NpsCampaignResult {
  segment: 'promoter' | 'passive' | 'detractor';
  subject: string;
  sentTo: number;
  contacts: NpsCampaignContact[];
}

@Injectable()
export class SendNpsCampaignUseCase {
  private readonly logger = new Logger(SendNpsCampaignUseCase.name);

  constructor(
    @Inject(NPS_REPOSITORY)
    private readonly repo: NpsSurveyRepository,
  ) {}

  async execute(
    segment: 'promoter' | 'passive' | 'detractor',
    subject: string,
  ): Promise<NpsCampaignResult> {
    const contacts = await this.repo.getEmailsBySegment(segment);
    this.logger.log(
      `Campaign "${subject}" → segment=${segment} recipients=${contacts.length}`,
    );
    return { segment, subject, sentTo: contacts.length, contacts };
  }
}
