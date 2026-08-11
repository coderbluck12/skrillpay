import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import Navbar from '@/components/Navbar';

export const metadata = {
  title: 'Skrillpay — Merchant Payment Platform',
  description: 'Accept payments, split fees, and settle merchants automatically with Skrillpay Engine.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased noise-bg">
        <ThemeProvider>
          <AuthProvider>
            <Navbar />
            <main className="min-h-[calc(100vh-64px)]">{children}</main>
            <footer className="border-t border-slate-800/60 py-10">
              <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-sky-400 to-indigo-500 flex items-center justify-center text-xs font-black text-white">S</div>
                  <span className="text-slate-400 text-sm">© 2026 Skrillpay Inc. All rights reserved.</span>
                </div>
                <div className="flex gap-8 text-sm text-slate-500">
                  <a href="/docs" className="hover:text-sky-400 transition-colors">API Docs</a>
                  <a href="/auth" className="hover:text-sky-400 transition-colors">Onboard</a>
                  <a href="/dashboard" className="hover:text-sky-400 transition-colors">Dashboard</a>
                </div>
              </div>
            </footer>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
