import { Sun } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex">
      {/* Left side - Form */}
      <div className="flex flex-1 flex-col justify-center px-4 py-12 sm:px-6 lg:flex-none lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          {/* Logo */}
          <div className="flex items-center gap-2 mb-8">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-solar-500">
              <Sun className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-solar-gradient">
              SolarGestão
            </span>
          </div>
          {children}
        </div>
      </div>

      {/* Right side - Image/Gradient */}
      <div className="relative hidden w-0 flex-1 lg:block">
        <div className="absolute inset-0 bg-gradient-to-br from-solar-400 via-solar-500 to-amber-600">
          <div className="absolute inset-0 bg-black/20" />
          <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-white">
            <Sun className="h-24 w-24 mb-8 animate-pulse" />
            <h2 className="text-4xl font-bold text-center mb-4">
              Transforme seu negócio solar
            </h2>
            <p className="text-xl text-center text-white/90 max-w-md">
              Gerencie leads, automatize atendimentos e aumente suas vendas com
              inteligência artificial
            </p>
            <div className="mt-12 grid grid-cols-3 gap-8 text-center">
              <div>
                <p className="text-4xl font-bold">+500</p>
                <p className="text-sm text-white/80">Empresas</p>
              </div>
              <div>
                <p className="text-4xl font-bold">50k+</p>
                <p className="text-sm text-white/80">Leads</p>
              </div>
              <div>
                <p className="text-4xl font-bold">R$2M+</p>
                <p className="text-sm text-white/80">Em vendas</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
