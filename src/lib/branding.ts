// =====================================================================
// BRANDING CONFIGURATION MODULE (WHITE-LABEL CENTRAL SETTINGS)
// =====================================================================

export const APP_CONFIG = {
  // Nama instansi / merek aplikasi yang dapat di-override lewat .env.local
  name: process.env.NEXT_PUBLIC_APP_NAME || 'Daely Report',
  tagline: 'AI-Powered Student Progress Reporting Studio',
  description: 'Dashboard laporan progres belajar murid cerdas bertenaga AI.',
  adminEmail: process.env.NEXT_PUBLIC_BRANCH_ADMIN_EMAIL || 'admin@school.com',
  logoPath: '/logo.png',
  iconPath: '/icon.png',
}
