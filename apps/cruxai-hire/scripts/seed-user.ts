import "dotenv/config";
import { auth } from "../src/lib/auth";

const users = [
  { name: "Ron Kantor", email: "ronkamail@gmail.com", password: "u1rx42c5" },
  { name: "Test User", email: "test@test.com", password: "test123456" },
];

for (const user of users) {
  try {
    const result = await auth.api.signUpEmail({
      body: user,
    });
    console.log(`✓ Created user: ${user.email}`, result.user?.id);
  } catch (e: unknown) {
    console.error(`✗ Failed to create ${user.email}:`, e);
  }
}

process.exit(0);
