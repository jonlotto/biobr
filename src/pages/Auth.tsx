import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, ArrowRight } from "lucide-react";
import biobrLogo from "@/assets/biobr-logo.png";

const inputClass =
  "w-full rounded-lg border border-black bg-white px-3 py-2.5 text-base text-black placeholder:text-black/40 outline-none focus:ring-2 focus:ring-[#0349FD]/30";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = isLogin
        ? await signIn(email, password)
        : await signUp(email, password);

      if (error) {
        toast({
          title: "Erro",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: isLogin ? "Bem-vindo!" : "Conta criada!",
          description: isLogin
            ? "Login realizado com sucesso."
            : "Sua conta foi criada com sucesso.",
        });
        navigate("/admin");
      }
    } catch {
      toast({
        title: "Erro",
        description: "Algo deu errado. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen relative overflow-hidden flex flex-col items-center justify-center bg-[#0A1520] p-4">
      <img
        src={biobrLogo}
        alt="VtrineBio"
        className="h-8 w-auto mb-6 animate-fade-in"
      />

      <div className="w-full max-w-[460px] rounded-xl bg-white p-6 sm:p-10 shadow-2xl animate-scale-in">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-black">
            {isLogin ? "Bem-vindo!" : "Criar conta"}
          </h1>
          <p className="text-black/60 mt-1">
            {isLogin
              ? "Acesse sua conta para continuar."
              : "Crie seu Link na Bio agora."}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="email" className="text-sm font-medium text-black">
              E-mail
            </label>
            <input
              id="email"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className={inputClass}
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="password" className="text-sm font-medium text-black">
              Senha
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className={`${inputClass} pr-10`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-black/60 hover:text-black transition-colors"
                aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          {isLogin && (
            <div className="text-right">
              <button
                type="button"
                className="text-sm text-black/60 hover:text-black transition-colors"
              >
                Esqueci minha senha
              </button>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 rounded-full text-white font-semibold flex items-center justify-center gap-2 transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: "#0349FD" }}
          >
            {loading ? (
              "Carregando..."
            ) : (
              <>
                {isLogin ? "Fazer login" : "Criar conta"}
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>
      </div>

      <p className="mt-6 text-sm text-white/70 text-center">
        {isLogin ? "Não tem conta? " : "Já tem conta? "}
        <button
          type="button"
          onClick={() => setIsLogin(!isLogin)}
          className="text-white underline"
        >
          {isLogin ? "Criar agora" : "Fazer login"}
        </button>
      </p>
    </div>
  );
};

export default Auth;
