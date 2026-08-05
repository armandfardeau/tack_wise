import handler from '../api/feature-flags';

jest.mock('../lib/vercelFlags', () => ({
  evaluateFeatureFlags: jest.fn().mockResolvedValue({ sailBoomLength: 72, sailStrokeWidth: 5 }),
}));

function responseMock() {
  return {
    setHeader: jest.fn(),
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
}

describe('/api/feature-flags', () => {
  it('returns evaluated flags for GET requests', async () => {
    const response = responseMock();

    await handler({ method: 'GET' } as never, response as never);

    expect(response.setHeader).toHaveBeenCalledWith('Cache-Control', 'no-store');
    expect(response.status).toHaveBeenCalledWith(200);
    expect(response.json).toHaveBeenCalledWith({ sailBoomLength: 72, sailStrokeWidth: 5 });
  });

  it('rejects non-GET requests', async () => {
    const response = responseMock();

    await handler({ method: 'POST' } as never, response as never);

    expect(response.setHeader).toHaveBeenCalledWith('Allow', 'GET');
    expect(response.status).toHaveBeenCalledWith(405);
    expect(response.json).toHaveBeenCalledWith({ error: 'Method not allowed.' });
  });
});
