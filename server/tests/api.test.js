process.env.JWT_SECRET = 'test_secret_with_at_least_32_characters_long';
process.env.NODE_ENV = 'test';

const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const request = require('supertest');
const app = require('../server');
const Medicine = require('../models/Medicine');
const MedicationLog = require('../models/MedicationLog');
const User = require('../models/User');

let database;
beforeAll(async () => {
  database = await MongoMemoryServer.create();
  await mongoose.connect(database.getUri());
  await Promise.all([User.init(), Medicine.init(), MedicationLog.init()]);
});
afterEach(async () => {
  await Promise.all(Object.values(mongoose.connection.collections).map(collection => collection.deleteMany({})));
});
afterAll(async () => {
  await mongoose.disconnect();
  await database.stop();
});

describe('MediTrack API', () => {
  test('health endpoint reports service status', async () => {
    const response = await request(app).get('/api/health').expect(200);
    expect(response.body).toEqual({ success: true, message: 'MediTrack API is running' });
  });

  test('registers a patient and authenticates using an HTTP-only cookie', async () => {
    const agent = request.agent(app);
    const response = await agent.post('/api/auth/register').send({ name: 'Test Patient', email: 'patient@example.com', password: 'SafePass123!' }).expect(201);
    expect(response.body.user.role).toBe('patient');
    expect(response.headers['set-cookie'][0]).toContain('HttpOnly');
    await agent.get('/api/auth/me').expect(200);
    await request(app).post('/api/auth/register').send({ name: 'Test Patient', email: 'patient@example.com', password: 'SafePass123!' }).expect(409);
  });

  test('protects medicine routes and prevents cross-user dose records', async () => {
    await request(app).get('/api/medicines').expect(401);
    const patientA = request.agent(app);
    const patientB = request.agent(app);
    await patientA.post('/api/auth/register').send({ name: 'Patient A', email: 'a@example.com', password: 'SafePass123!' }).expect(201);
    await patientB.post('/api/auth/register').send({ name: 'Patient B', email: 'b@example.com', password: 'SafePass123!' }).expect(201);
    const med = await patientA.post('/api/medicines').send({ name: 'Example', dosage: '1 tablet', frequency: 'once_daily', startDate: '2026-01-01', reminderTimes: ['08:00'] }).expect(201);
    await patientB.post('/api/medication-logs').send({ medicineId: med.body._id, scheduledDate: '2026-01-01', scheduledTime: '08:00', status: 'taken' }).expect(404);
    await patientB.get(`/api/medicines/${med.body._id}`).expect(404);
  });

  test('rejects weak passwords and invalid medicine schedules', async () => {
    await request(app).post('/api/auth/register').send({ name: 'Weak User', email: 'weak@example.com', password: 'password' }).expect(422);
    const agent = request.agent(app);
    await agent.post('/api/auth/register').send({ name: 'Patient C', email: 'c@example.com', password: 'SafePass123!' }).expect(201);
    await agent.post('/api/medicines').send({ name: 'Incomplete', dosage: '1 tablet' }).expect(400);
    await agent.post('/api/medicines').send({ name: 'Invalid time', dosage: '1 tablet', frequency: 'once_daily', startDate: '2026-01-01', reminderTimes: ['25:88'] }).expect(422);
  });

  test('records a taken dose once and returns it in history', async () => {
    const agent = request.agent(app);
    await agent.post('/api/auth/register').send({ name: 'Patient D', email: 'd@example.com', password: 'SafePass123!' }).expect(201);
    const date = new Date().toISOString().slice(0, 10);
    const med = await agent.post('/api/medicines').send({ name: 'Daily medicine', dosage: '1 tablet', frequency: 'once_daily', startDate: date, reminderTimes: ['08:00'] }).expect(201);
    const dose = { medicineId: med.body._id, scheduledDate: date, scheduledTime: '08:00', status: 'taken' };
    const first = await agent.post('/api/medication-logs').send(dose).expect(200);
    expect(first.body.takenAt).toBeTruthy();
    await agent.post('/api/medication-logs').send(dose).expect(200);
    expect(await MedicationLog.countDocuments({ userId: first.body.userId, medicineId: med.body._id })).toBe(1);
    const history = await agent.get(`/api/medication-logs?date=${date}`).expect(200);
    expect(history.body).toHaveLength(1);
    expect(history.body[0].status).toBe('taken');
  });

  test('returns dashboard and weekly report statistics from database records', async () => {
    const agent = request.agent(app);
    await agent.post('/api/auth/register').send({ name: 'Patient E', email: 'e@example.com', password: 'SafePass123!' }).expect(201);
    const dashboard = await agent.get('/api/dashboard').expect(200);
    expect(dashboard.body).toHaveProperty('todaySchedule');
    expect(dashboard.body).toHaveProperty('weeklyCompliance');
    const report = await agent.get('/api/reports/weekly').expect(200);
    expect(report.body.days).toHaveLength(7);
  });
});
