import { execSync } from 'child_process';
try {
  const output = execSync('npx prisma db push --accept-data-loss', { encoding: 'utf-8' });
  console.log(output);
} catch (error) {
  console.error("Error running prisma:", error.message);
  if (error.stdout) console.log("Stdout:", error.stdout);
  if (error.stderr) console.log("Stderr:", error.stderr);
}
