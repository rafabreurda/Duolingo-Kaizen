import Link from 'next/link'

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[#1a1a2e] text-white flex flex-col items-center justify-center px-6">
      <div className="max-w-2xl text-center space-y-8">
        <div>
          <h1 className="text-6xl font-bold mb-4">⚔️ Kaizen Dojo</h1>
          <p className="text-xl text-white/60">
            Aprenda karatê de forma gamificada. Evolua de faixa em faixa, ganhe Kaizens e
            prove seu valor ao Sensei.
          </p>
        </div>

        <div className="flex gap-4 justify-center">
          <Link
            href="/cadastro"
            className="bg-[#e94560] hover:bg-[#c73550] text-white font-semibold px-8 py-3 rounded-xl transition-colors"
          >
            Começar agora
          </Link>
          <Link
            href="/login"
            className="border border-white/20 text-white hover:bg-white/5 px-8 py-3 rounded-xl transition-colors"
          >
            Entrar
          </Link>
        </div>

        <div className="grid grid-cols-3 gap-4 pt-4">
          {[
            { icon: '🥋', label: '9 Faixas', desc: 'Do branco ao preto' },
            { icon: '⚡', label: 'Kaizens', desc: 'Sistema de pontos' },
            { icon: '📹', label: 'Avaliação', desc: 'Vídeos aprovados pelo Sensei' },
          ].map((item) => (
            <div key={item.label} className="bg-white/5 rounded-xl p-4 border border-white/10">
              <p className="text-3xl mb-2">{item.icon}</p>
              <p className="font-semibold">{item.label}</p>
              <p className="text-white/40 text-sm">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
