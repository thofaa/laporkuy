// Lintas Windows/macOS/Linux. Pengaturan ini tidak mengubah file .env.
const child = Bun.spawn([process.execPath,"--hot","src/server/index.js"], {
  env: { ...process.env, DEMO_MODE:"true", PORT:process.env.PORT || "3000" },
  stdin:"inherit", stdout:"inherit", stderr:"inherit",
});
for (const signal of ["SIGINT","SIGTERM"]) process.on(signal,() => child.kill(signal));
process.exit(await child.exited);
