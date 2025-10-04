// src/utils/env.ts

export const getEnvVar = (key: string): string => {
  // Try different variations of the key
  const variations = [
    process.env[key],
    process.env[`NEXT_PUBLIC_${key}`],
    process.env[key.replace('NEXT_PUBLIC_', '')]
  ];

  // Return the first non-undefined value
  const value = variations.find(v => v !== undefined);
  
  if (!value) {
    console.error(`Environment variable ${key} is not set`);
    throw new Error(`Environment variable ${key} is not set`);
  }

  return value;
};
