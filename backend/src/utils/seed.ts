import { User } from '../models/User';
import { Family } from '../models/Family';

export async function seedDemoUser() {
  try {
    const demoEmail = 'demo@example.com';

    // Check if demo user already exists
    const existingUser = await User.findOne({ email: demoEmail });
    if (existingUser) {
      console.log('✅ Demo user already exists');
      return;
    }

    // Create demo user
    const demoUser = new User({
      email: demoEmail,
      password: 'password123',
      name: 'Demo User',
      isVerified: true,
    });
    await demoUser.save();

    // Create default family
    const demoFamily = new Family({
      name: "Demo User's Family",
      ownerId: demoUser._id,
      members: [{ userId: demoUser._id, role: 'owner' }],
      currency: 'INR',
      timezone: 'Asia/Kolkata',
    });
    await demoFamily.save();

    // Add family to user
    demoUser.familyIds = [demoFamily._id];
    await demoUser.save();

    console.log('✅ Demo user created successfully');
  } catch (error) {
    console.error('⚠️  Demo user seeding failed:', error);
  }
}
