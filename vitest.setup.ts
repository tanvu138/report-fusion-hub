// Basic setup for Node.js environment tests
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from root .env file for tests
dotenv.config({ path: path.resolve(__dirname, '.env') });