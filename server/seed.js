const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const User = require('./models/User');
const Medicine = require('./models/Medicine');
const MedicationLog = require('./models/MedicationLog');
const CaregiverRelationship = require('./models/CaregiverRelationship');
const Prescription = require('./models/Prescription');

dotenv.config();

const seedData = async (skipExit = false) => {
  try {
    console.log('[Seed] Clearing existing collections...');
    await User.deleteMany({});
    await Medicine.deleteMany({});
    await MedicationLog.deleteMany({});
    await CaregiverRelationship.deleteMany({});
    await Prescription.deleteMany({});

    console.log('[Seed] Creating demo users...');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('Password123!', salt);

    // Patient
    const patient = await User.create({
      name: 'Sarah Connor',
      email: 'patient@meditrack.com',
      password: hashedPassword,
      role: 'patient',
      age: 42,
      gender: 'female',
      phone: '+1 (555) 234-5678',
      emergencyContact: {
        name: 'John Connor',
        phone: '+1 (555) 987-6543',
      },
    });

    // Caregiver
    const caregiver = await User.create({
      name: 'Dr. Marcus Vance',
      email: 'caregiver@meditrack.com',
      password: hashedPassword,
      role: 'caregiver',
      age: 50,
      gender: 'male',
      phone: '+1 (555) 345-6789',
    });

    console.log('[Seed] Creating accepted Caregiver Relationship...');
    await CaregiverRelationship.create({
      caregiverId: caregiver._id,
      patientId: patient._id,
      status: 'accepted',
    });

    console.log('[Seed] Creating 4 demo medicines...');
    const now = new Date();
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - 14); // 2 weeks ago

    const med1 = await Medicine.create({
      userId: patient._id,
      name: 'Paracetamol 500mg',
      dosage: '1 Tablet',
      frequency: 'twice_daily',
      startDate: startDate,
      endDate: null,
      reminderTimes: ['08:00', '20:00'],
      foodInstruction: 'after_food',
      notes: 'Take with full glass of water for fever/pain relief.',
      isActive: true,
    });

    const med2 = await Medicine.create({
      userId: patient._id,
      name: 'Amoxicillin 250mg',
      dosage: '1 Capsule',
      frequency: 'thrice_daily',
      startDate: startDate,
      endDate: null,
      reminderTimes: ['08:00', '14:00', '20:00'],
      foodInstruction: 'with_food',
      notes: 'Finish full antibiotic course as prescribed by Dr. Vance.',
      isActive: true,
    });

    const med3 = await Medicine.create({
      userId: patient._id,
      name: 'Vitamin D3 1000IU',
      dosage: '1 Softgel',
      frequency: 'once_daily',
      startDate: startDate,
      endDate: null,
      reminderTimes: ['09:00'],
      foodInstruction: 'with_food',
      notes: 'Daily dietary supplement.',
      isActive: true,
    });

    const med4 = await Medicine.create({
      userId: patient._id,
      name: 'Ibuprofen 400mg',
      dosage: '1 Tablet',
      frequency: 'custom',
      startDate: startDate,
      endDate: null,
      reminderTimes: ['12:00'],
      foodInstruction: 'after_food',
      notes: 'Take strictly after meals for joint inflammation.',
      isActive: true,
    });

    console.log('[Seed] Generating 14 days of realistic MedicationLog history...');
    const medicines = [med1, med2, med3, med4];

    for (let dayOffset = 13; dayOffset >= 0; dayOffset--) {
      const d = new Date(now);
      d.setDate(d.getDate() - dayOffset);
      const scheduledDate = new Date(d);
      scheduledDate.setHours(0, 0, 0, 0);

      const isToday = dayOffset === 0;

      for (const med of medicines) {
        for (const timeStr of med.reminderTimes) {
          const [hours, minutes] = timeStr.split(':').map(Number);
          const doseTime = new Date(scheduledDate);
          doseTime.setHours(hours, minutes, 0, 0);

          let status = 'taken';
          let takenAt = new Date(doseTime.getTime() + Math.floor(Math.random() * 20 - 10) * 60 * 1000);

          if (isToday) {
            if (doseTime > now) {
              status = 'upcoming';
              takenAt = null;
            } else {
              if (Math.random() < 0.25) {
                status = 'missed';
                takenAt = null;
              }
            }
          } else {
            if (Math.random() < 0.15) {
              status = 'missed';
              takenAt = null;
            }
          }

          try {
            await MedicationLog.create({
              userId: patient._id,
              medicineId: med._id,
              scheduledDate: scheduledDate,
              scheduledTime: timeStr,
              status: status,
              takenAt: takenAt,
            });
          } catch (e) {
            // Ignore potential duplicates
          }
        }
      }
    }

    console.log('[Seed] Creating demo prescription...');
    await Prescription.create({
      userId: patient._id,
      doctorName: 'Dr. Marcus Vance',
      prescriptionDate: new Date(),
      fileUrl: '/uploads/demo-prescription.pdf',
      fileType: 'pdf',
      notes: 'Standard 14-day anti-inflammatory and antibiotic routine.',
    });

    console.log('==================================================');
    console.log('[Seed SUCCESS] Database seeded successfully!');
    console.log('Demo Credentials:');
    console.log('  Patient:   patient@meditrack.com   / Password123!');
    console.log('  Caregiver: caregiver@meditrack.com / Password123!');
    console.log('==================================================');

    if (!skipExit) {
      process.exit(0);
    }
  } catch (err) {
    console.error('[Seed FAILED]', err);
    if (!skipExit) {
      process.exit(1);
    }
  }
};

if (require.main === module) {
  const connectDB = require('./config/db');
  connectDB().then(() => seedData(false));
}

module.exports = { seedData };
