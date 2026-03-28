import { config } from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

const envPath = path.resolve(__dirname, '../../.env.test');

if (!fs.existsSync(envPath)) {
  throw new Error(`❌ .env.test file not found at ${envPath}`);
}

config({ path: envPath });

if (!process.env.DATABASE_URL) {
  throw new Error('❌ DATABASE_URL missing in .env.test');
}
console.log('✅ Using test DB:', process.env.DATABASE_URL);
