import { Test } from '@nestjs/testing';
import { NPS_REPOSITORY } from '../domain/nps-survey.repository';
import { SendNpsCampaignUseCase } from './send-nps-campaign.use-case';

describe('SendNpsCampaignUseCase', () => {
  let useCase: SendNpsCampaignUseCase;
  let repo: { getEmailsBySegment: jest.Mock };

  beforeEach(async () => {
    repo = { getEmailsBySegment: jest.fn() };

    const module = await Test.createTestingModule({
      providers: [
        SendNpsCampaignUseCase,
        { provide: NPS_REPOSITORY, useValue: repo },
      ],
    }).compile();

    useCase = module.get(SendNpsCampaignUseCase);
  });

  it('returns segment, subject, sentTo and contacts', async () => {
    const contacts = [
      { email: 'a@test.com', firstName: 'Ana', lastName: 'P' },
      { email: 'b@test.com', firstName: 'Bob', lastName: 'Q' },
    ];
    repo.getEmailsBySegment.mockResolvedValue(contacts);

    const result = await useCase.execute('promoter', 'Thanks!');

    expect(result).toEqual({
      segment: 'promoter',
      subject: 'Thanks!',
      sentTo: 2,
      contacts,
    });
    expect(repo.getEmailsBySegment).toHaveBeenCalledWith('promoter');
  });

  it('returns sentTo 0 when no contacts for segment', async () => {
    repo.getEmailsBySegment.mockResolvedValue([]);

    const result = await useCase.execute('detractor', 'We miss you');

    expect(result.sentTo).toBe(0);
    expect(result.contacts).toEqual([]);
  });
});
