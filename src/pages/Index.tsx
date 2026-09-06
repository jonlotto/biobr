import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { templates } from "@/data/templates";
import TemplateCard from "@/components/TemplateCard";
import type { Template } from "@/data/templates";
import biobrLogo from "@/assets/biobr-logo.png";

const Index = () => {
  const navigate = useNavigate();

  const handleSelectTemplate = (template: Template) => {
    navigate(`/auth?template=${template.slug}`);
  };

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />

      <div className="relative z-10">
        {/* Header */}
        <header className="flex items-center justify-between p-4 md:p-6">
          <div className="flex items-center gap-2">
            <img src={biobrLogo} alt="VtrineBio" className="h-8" />
          </div>
          <Button
            onClick={() => navigate("/auth")}
            className="rounded-full bg-primary hover:bg-primary/90 text-white"
          >
            Entrar
          </Button>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-8 md:py-16">
          {/* Title Section */}
          <div className="text-center mb-10 md:mb-16 animate-fade-in">
            <h1 className="text-3xl md:text-5xl font-bold text-white mb-4">
              Escolha seu estilo
            </h1>
            <p className="text-gray-400 text-base md:text-lg max-w-md mx-auto">
              Selecione um template para começar ou crie do zero sua página de links personalizada
            </p>
          </div>

          {/* Templates Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 max-w-5xl mx-auto">
            {templates.map((template, index) => (
              <div
                key={template.id}
                className="animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <TemplateCard
                  template={template}
                  onClick={handleSelectTemplate}
                />
              </div>
            ))}
          </div>

          {/* Already have account */}
          <div className="text-center mt-12">
            <p className="text-gray-400 text-sm">
              Já tem uma conta?{" "}
              <button
                onClick={() => navigate("/auth")}
                className="text-primary font-medium hover:underline"
              >
                Faça login
              </button>
            </p>
          </div>
        </main>

        {/* Footer */}
        <footer className="text-center py-8 text-gray-500 text-sm">
          <p>© 2026 VtrineBio. Todos os direitos reservados.</p>
        </footer>
      </div>
    </div>
  );
};

export default Index;
