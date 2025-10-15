import { WalletConnectButton } from '../app/WalletConnectButton';

export default function Home() {
  return (
        <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-400 to-blue-900">
      <div className="card">
        <h1 className="text-4xl font-bold mb-4">Typhoon Investment DApp</h1>
        <p className="text-lg">Tailwind CSS works! This is your new home page.</p>
        <WalletConnectButton />
      </div>
    </main>
  )
}
