import { Link, useNavigate } from "react-router-dom";
import { DemoCard } from "@/ui/components/Card/DemoCard";
import useDecksService from "@/ui/hooks/useDecksService";
import Icons from "@/ui/components/common/Icons";

export default function HomePageOptimized() {
  const navigate = useNavigate();
  const { decks, loading } = useDecksService();
  const recent = [...decks]
    .sort((a: any, b: any) => (b.lastStudied || 0) - (a.lastStudied || 0))
    .slice(0, 3);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-fuchsia-800 to-orange-600 dark:from-purple-950 dark:via-fuchsia-950 dark:to-orange-950 animate-gradient-x">
      {/* Hero Section - MEGA ULTRA FLASHY */}
      <div className="container mx-auto px-4 py-20 text-center relative">
        {/* Effet de lumière flottante */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-1/4 w-96 h-96 bg-yellow-400/30 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-cyan-400/30 rounded-full blur-3xl animate-pulse delay-700"></div>
        </div>

        <div className="relative bg-gradient-to-br from-white/20 to-white/5 backdrop-blur-2xl border-4 border-white/40 rounded-[2.5rem] p-16 shadow-[0_0_80px_rgba(255,255,255,0.3)] mb-12 hover:scale-105 transition-transform duration-500">
          <h1 className="text-9xl font-black mb-8 bg-gradient-to-r from-yellow-300 via-orange-400 to-purple-400 bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(255,255,255,0.8)] animate-pulse">
            ⚡ ARIBA CARDS ⚡
          </h1>
          <p className="text-4xl font-black bg-gradient-to-r from-cyan-300 via-blue-400 to-purple-400 bg-clip-text text-transparent mb-10 drop-shadow-2xl animate-bounce">
            🚀 MAÎTRISEZ VOS CONNAISSANCES AVEC L'IA 🎯
          </p>
          <div className="flex gap-8 justify-center mb-10 flex-wrap">
            <Link
              to="/study-workspace"
              className="relative group perspective-1000"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-300 via-orange-400 to-red-500 rounded-3xl blur-xl opacity-75 group-hover:opacity-100 animate-pulse"></div>
              <div className="relative bg-gradient-to-br from-yellow-400 via-orange-500 to-red-600 text-white px-16 py-8 rounded-3xl font-black text-3xl shadow-2xl hover:shadow-[0_0_80px_rgba(251,191,36,1)] hover:scale-125 hover:-rotate-2 transition-all duration-500 border-[6px] border-white group-hover:border-yellow-200">
                <span className="relative z-10 drop-shadow-lg flex items-center gap-3">
                  <Icons.Study size="md" />
                  <span>Commencer maintenant</span>
                </span>
              </div>
            </Link>
            <Link to="/decks" className="relative group perspective-1000">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-300 via-teal-400 to-cyan-500 rounded-3xl blur-xl opacity-75 group-hover:opacity-100 animate-pulse"></div>
              <div className="relative bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-600 text-white px-16 py-8 rounded-3xl font-black text-3xl shadow-2xl hover:shadow-[0_0_80px_rgba(20,184,166,1)] hover:scale-125 hover:rotate-2 transition-all duration-500 border-[6px] border-white group-hover:border-cyan-200">
                <span className="relative z-10 drop-shadow-lg flex items-center gap-3">
                  <Icons.Decks size="md" />
                  <span>Mes paquets</span>
                </span>
              </div>
            </Link>
          </div>
        </div>

        {/* Demo Card - MEGA SPECTACULAIRE */}
        <div className="max-w-2xl mx-auto mb-24 relative group">
          <div className="absolute -inset-4 bg-gradient-to-r from-yellow-400 via-pink-500 to-blue-600 rounded-[3rem] blur-2xl opacity-75 group-hover:opacity-100 animate-pulse"></div>
          <div className="relative p-3 rounded-[2.5rem] bg-gradient-to-r from-yellow-300 via-orange-400 to-purple-600 shadow-[0_0_80px_rgba(251,191,36,1)] animate-gradient-x">
            <div className="bg-gradient-to-br from-blue-600 via-purple-700 to-fuchsia-600 rounded-[2rem] p-12 border-[6px] border-yellow-300 hover:border-white transition-all duration-500 hover:scale-105">
              <p className="text-4xl font-black mb-6 bg-gradient-to-r from-yellow-200 via-orange-300 to-pink-300 bg-clip-text text-transparent drop-shadow-2xl animate-bounce">
                ✨ CARTE MAGIQUE INTERACTIVE ✨
              </p>
              <DemoCard frontText="Hello" backText="Bonjour / Salut" />
            </div>
          </div>
        </div>

        {/* Features - EXPLOSION DE COULEURS ET ANIMATIONS */}
        <div className="mb-24">
          <h2 className="text-7xl font-black text-center mb-16 bg-gradient-to-r from-yellow-300 via-pink-400 to-cyan-400 bg-clip-text text-transparent drop-shadow-2xl animate-pulse">
            🌟 FONCTIONNALITÉS EXTRAORDINAIRES 🌟
          </h2>
          <div className="grid md:grid-cols-3 gap-10">
            <div className="relative group perspective-1000">
              <div className="absolute -inset-2 bg-gradient-to-r from-blue-400 to-cyan-500 rounded-[2rem] blur-xl opacity-50 group-hover:opacity-100 animate-pulse"></div>
              <div className="relative bg-gradient-to-br from-blue-400 via-cyan-400 to-teal-400 rounded-[2rem] p-10 shadow-[0_0_60px_rgba(59,130,246,1)] hover:shadow-[0_0_100px_rgba(59,130,246,1)] hover:scale-110 hover:-rotate-6 transition-all duration-500 border-[6px] border-white cursor-pointer transform-gpu">
                <div className="absolute -top-6 -right-6 bg-gradient-to-r from-yellow-300 to-orange-400 text-blue-900 px-6 py-3 rounded-full font-black text-xl rotate-12 shadow-2xl animate-bounce border-4 border-white">
                  NEW! 🎉
                </div>
                <div className="bg-white/30 backdrop-blur-md rounded-3xl p-6 w-24 h-24 flex items-center justify-center mb-6 mx-auto text-6xl shadow-2xl group-hover:rotate-12 transition-transform duration-500">
                  <Icons.Sparkles size="xl" />
                </div>
                <h3 className="text-4xl font-black mb-5 text-white text-center drop-shadow-2xl">
                  IA AVANCÉE
                </h3>
                <p className="text-white font-black text-center text-xl leading-relaxed">
                  Algorithme SM-2 adaptatif qui booste votre mémoire!
                </p>
              </div>
            </div>
            <div className="relative group perspective-1000">
              <div className="absolute -inset-2 bg-gradient-to-r from-green-400 to-emerald-500 rounded-[2rem] blur-xl opacity-50 group-hover:opacity-100 animate-pulse"></div>
              <div className="relative bg-gradient-to-br from-green-400 via-emerald-400 to-lime-400 rounded-[2rem] p-10 shadow-[0_0_60px_rgba(34,197,94,1)] hover:shadow-[0_0_100px_rgba(34,197,94,1)] hover:scale-110 hover:rotate-6 transition-all duration-500 border-[6px] border-white cursor-pointer transform-gpu">
                <div className="absolute -top-6 -right-6 bg-gradient-to-r from-pink-300 to-rose-400 text-green-900 px-6 py-3 rounded-full font-black text-xl rotate-12 shadow-2xl animate-bounce border-4 border-white">
                  HOT! 🔥
                </div>
                <div className="bg-white/30 backdrop-blur-md rounded-3xl p-6 w-24 h-24 flex items-center justify-center mb-6 mx-auto text-6xl shadow-2xl group-hover:rotate-12 transition-transform duration-500">
                  <Icons.Stats size="xl" />
                </div>
                <h3 className="text-4xl font-black mb-5 text-white text-center drop-shadow-2xl">
                  STATS PRO
                </h3>
                <p className="text-white font-black text-center text-xl leading-relaxed">
                  Analytics ultra-détaillées en temps réel!
                </p>
              </div>
            </div>
            <div className="relative group perspective-1000">
              <div className="absolute -inset-2 bg-gradient-to-r from-orange-400 to-pink-500 rounded-[2rem] blur-xl opacity-50 group-hover:opacity-100 animate-pulse"></div>
              <div className="relative bg-gradient-to-br from-orange-400 via-red-400 to-pink-400 rounded-[2rem] p-10 shadow-[0_0_60px_rgba(249,115,22,1)] hover:shadow-[0_0_100px_rgba(249,115,22,1)] hover:scale-110 hover:-rotate-6 transition-all duration-500 border-[6px] border-white cursor-pointer transform-gpu">
                <div className="absolute -top-6 -right-6 bg-gradient-to-r from-cyan-300 to-blue-400 text-orange-900 px-6 py-3 rounded-full font-black text-xl rotate-12 shadow-2xl animate-bounce border-4 border-white">
                  FAST! ⚡
                </div>
                <div className="bg-white/30 backdrop-blur-md rounded-3xl p-6 w-24 h-24 flex items-center justify-center mb-6 mx-auto text-6xl shadow-2xl group-hover:rotate-12 transition-transform duration-500">
                  <Icons.Zap size="xl" />
                </div>
                <h3 className="text-4xl font-black mb-5 text-white text-center drop-shadow-2xl">
                  ULTRA RAPIDE
                </h3>
                <p className="text-white font-black text-center text-xl leading-relaxed">
                  7 systèmes d'optimisation puissants!
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Decks - ULTRA HOT */}
        {!loading && recent.length > 0 && (
          <div className="mb-24">
            <h2 className="text-7xl font-black mb-16 text-center bg-gradient-to-r from-orange-300 via-red-400 to-purple-400 bg-clip-text text-transparent drop-shadow-2xl animate-pulse">
              🔥 PAQUETS ULTRA HOT 🔥
            </h2>
            <div className="grid md:grid-cols-3 gap-10">
              {recent.map((d, i) => (
                <div
                  key={d.id}
                  className="relative group perspective-1000"
                  style={{ animationDelay: `${i * 150}ms` }}
                >
                  <div className="absolute -inset-3 bg-gradient-to-r from-pink-500 via-rose-500 to-red-600 rounded-[2rem] blur-xl opacity-60 group-hover:opacity-100 animate-pulse"></div>
                  <button
                    onClick={() => navigate(`/study/${d.id}`)}
                    className="relative bg-gradient-to-br from-pink-500 via-rose-500 to-red-600 rounded-[2rem] p-10 shadow-[0_0_60px_rgba(236,72,153,1)] hover:shadow-[0_0_100px_rgba(236,72,153,1)] hover:scale-110 hover:rotate-3 transition-all duration-500 border-[6px] border-yellow-300 hover:border-white cursor-pointer text-left transform-gpu"
                  >
                    <div className="absolute -top-4 -left-4 bg-gradient-to-r from-yellow-300 to-orange-400 text-pink-900 px-8 py-3 rounded-full font-black text-lg rotate-[-12deg] shadow-2xl border-4 border-white animate-bounce">
                      TRENDING 🚀
                    </div>
                    <div className="text-7xl mb-6 transform group-hover:scale-125 group-hover:rotate-12 transition-all duration-500">
                      {d.icon || <Icons.Decks size={40} />}
                    </div>
                    <h3 className="text-3xl font-black mb-6 text-white drop-shadow-2xl">
                      {d.name}
                    </h3>
                    <div className="flex gap-4 flex-wrap">
                      <span className="px-6 py-3 bg-white text-pink-600 rounded-2xl text-xl font-black shadow-xl">
                        {d.totalCards} cartes 📝
                      </span>
                      <span className="px-6 py-3 bg-gradient-to-r from-yellow-300 to-orange-400 text-pink-900 rounded-2xl text-xl font-black shadow-xl">
                        {d.masteredCards} ✨
                      </span>
                    </div>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Actions - MEGA POWER */}
        <div className="mb-24">
          <h2 className="text-7xl font-black mb-16 text-center bg-gradient-to-r from-cyan-300 via-blue-400 to-purple-400 bg-clip-text text-transparent drop-shadow-2xl animate-pulse">
            ⚡ ACTIONS ULTRA RAPIDES ⚡
          </h2>
          <div className="grid md:grid-cols-2 gap-12">
            <div className="relative group perspective-1000">
              <div className="absolute -inset-4 bg-gradient-to-r from-emerald-400 to-cyan-500 rounded-[2.5rem] blur-2xl opacity-60 group-hover:opacity-100 animate-pulse"></div>
              <button
                onClick={() => navigate("/analytics-workspace")}
                className="relative bg-gradient-to-br from-emerald-400 via-teal-400 to-cyan-400 p-14 rounded-[2rem] text-white hover:scale-110 hover:-rotate-3 transition-all duration-500 shadow-[0_0_80px_rgba(16,185,129,1)] border-[6px] border-white hover:border-yellow-300 transform-gpu"
              >
                <div className="absolute -top-6 -right-6 bg-gradient-to-r from-yellow-300 to-orange-400 text-emerald-900 px-8 py-4 rounded-full font-black text-2xl animate-bounce shadow-2xl border-4 border-white">
                  VOIR! 👀
                </div>
                <div className="flex items-center gap-8">
                  <div className="w-28 h-28 bg-white/90 rounded-[2rem] flex items-center justify-center text-7xl shadow-2xl transform group-hover:rotate-[360deg] group-hover:scale-125 transition-all duration-700">
                    <Icons.Stats size={48} />
                  </div>
                  <div className="text-left">
                    <h3 className="text-5xl font-black drop-shadow-2xl mb-3">
                      STATISTIQUES
                    </h3>
                    <p className="text-2xl font-black">Analysez vos progrès!</p>
                  </div>
                </div>
              </button>
            </div>
            <div className="relative group perspective-1000">
              <div className="absolute -inset-4 bg-gradient-to-r from-purple-400 to-pink-500 rounded-[2.5rem] blur-2xl opacity-60 group-hover:opacity-100 animate-pulse"></div>
              <button
                onClick={() => navigate("/settings")}
                className="relative bg-gradient-to-br from-purple-400 via-fuchsia-400 to-pink-400 p-14 rounded-[2rem] text-white hover:scale-110 hover:rotate-3 transition-all duration-500 shadow-[0_0_80px_rgba(168,85,247,1)] border-[6px] border-white hover:border-yellow-300 transform-gpu"
              >
                <div className="absolute -top-6 -right-6 bg-gradient-to-r from-cyan-300 to-blue-400 text-purple-900 px-8 py-4 rounded-full font-black text-2xl animate-bounce shadow-2xl border-4 border-white">
                  GO! 🚀
                </div>
                <div className="flex items-center gap-8">
                  <div className="w-28 h-28 bg-white/90 rounded-[2rem] flex items-center justify-center text-7xl shadow-2xl transform group-hover:rotate-[360deg] group-hover:scale-125 transition-all duration-700">
                    <Icons.Settings size={48} />
                  </div>
                  <div className="text-left">
                    <h3 className="text-5xl font-black drop-shadow-2xl mb-3">
                      PARAMÈTRES
                    </h3>
                    <p className="text-2xl font-black">Customisez tout!</p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Footer - ULTRA TECH */}
        <div className="py-16">
          <div className="relative bg-gradient-to-br from-white/25 to-white/10 backdrop-blur-2xl border-[6px] border-white/50 rounded-[2.5rem] p-12 shadow-[0_0_80px_rgba(255,255,255,0.4)] hover:scale-105 transition-all duration-500">
            <h3 className="text-6xl font-black bg-gradient-to-r from-yellow-300 via-orange-400 to-pink-400 bg-clip-text text-transparent mb-10 drop-shadow-2xl animate-pulse">
              🎉 TECHNOLOGIE ULTRA-MODERNE 🎉
            </h3>
            <div className="flex gap-8 justify-center flex-wrap mb-8">
              <span className="relative group px-12 py-6 bg-gradient-to-r from-blue-400 via-purple-500 to-violet-600 text-white rounded-2xl text-2xl font-black shadow-[0_0_50px_rgba(59,130,246,1)] hover:shadow-[0_0_80px_rgba(59,130,246,1)] hover:scale-125 hover:-rotate-3 transition-all duration-500 border-4 border-white cursor-pointer">
                <span className="drop-shadow-lg">✅ PWA Ready</span>
              </span>
              <span className="relative group px-12 py-6 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-600 text-white rounded-2xl text-2xl font-black shadow-[0_0_50px_rgba(251,191,36,1)] hover:shadow-[0_0_80px_rgba(251,191,36,1)] hover:scale-125 hover:rotate-3 transition-all duration-500 border-4 border-white cursor-pointer">
                <span className="drop-shadow-lg">📴 Mode Offline</span>
              </span>
              <span className="relative group px-12 py-6 bg-gradient-to-r from-green-400 via-emerald-500 to-teal-600 text-white rounded-2xl text-2xl font-black shadow-[0_0_50px_rgba(34,197,94,1)] hover:shadow-[0_0_80px_rgba(34,197,94,1)] hover:scale-125 hover:-rotate-3 transition-all duration-500 border-4 border-white cursor-pointer">
                <span className="drop-shadow-lg">💾 IndexedDB</span>
              </span>
            </div>
            <p className="text-white font-black text-4xl drop-shadow-2xl animate-bounce">
              🚀 L'APPLICATION LA PLUS PUISSANTE AU MONDE! 🚀
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
