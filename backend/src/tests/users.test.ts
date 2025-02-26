describe('GET /api/users/:id/details', () => {
  it('should return user details with activities', async () => {
    const response = await request(app)
      .get(`/api/users/${testUserId}/details`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('activities');
    expect(Array.isArray(response.body.activities)).toBe(true);
  });
}); 