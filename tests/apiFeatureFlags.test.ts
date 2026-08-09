import handler from '../api/feature-flags';
import { evaluateFeatureFlags } from '../lib/vercelFlags';

jest.mock('../lib/vercelFlags', () => ({
  evaluateFeatureFlags: jest.fn().mockResolvedValue({ sailBoomLength: 72, sailStrokeWidth: 5, darkSailInLightMode: true }),
}));

const mockEvaluateFeatureFlags = jest.mocked(evaluateFeatureFlags);

function responseMock() {
  return {
    setHeader: jest.fn(),
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
}

describe('/api/feature-flags', () => {
  beforeEach(() => {
    mockEvaluateFeatureFlags.mockClear();
  });

  it('returns evaluated flags for GET requests', async () => {
    const response = responseMock();
    const request = {
      method: 'GET',
      cookies: { tack_wise_user_id: 'custom-user-123' },
    };

    await handler(request as never, response as never);

    expect(response.setHeader).toHaveBeenCalledWith('Cache-Control', 'no-store');
    expect(response.status).toHaveBeenCalledWith(200);
    expect(response.json).toHaveBeenCalledWith({ sailBoomLength: 72, sailStrokeWidth: 5, darkSailInLightMode: true });
    expect(mockEvaluateFeatureFlags).toHaveBeenCalledWith(request, {
      user: { id: 'custom-user-123' },
    });
  });

  it('creates and persists the custom user ID when the cookie is missing', async () => {
    const response = responseMock();
    const request = { method: 'GET', cookies: {} };

    await handler(request as never, response as never);

    const setCookieCall = response.setHeader.mock.calls.find(([name]) => name === 'Set-Cookie');
    expect(setCookieCall?.[1]).toEqual(expect.stringMatching(/^tack_wise_user_id=[0-9a-f-]{36};/));

    const [, entities] = mockEvaluateFeatureFlags.mock.calls[0];
    expect(entities).toEqual({
      user: { id: expect.stringMatching(/^[0-9a-f-]{36}$/) },
    });
  });

  it('rejects non-GET requests', async () => {
    const response = responseMock();

    await handler({ method: 'POST' } as never, response as never);

    expect(response.setHeader).toHaveBeenCalledWith('Allow', 'GET');
    expect(response.status).toHaveBeenCalledWith(405);
    expect(response.json).toHaveBeenCalledWith({ error: 'Method not allowed.' });
  });
});
