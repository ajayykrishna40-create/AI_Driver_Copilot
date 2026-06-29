import './globals.css';

export const metadata = {
  title: 'AI Driver Copilot',
  description: 'Intelligent fleet management powered by AI',
  viewport: 'width=device-width, initial-scale=1',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
