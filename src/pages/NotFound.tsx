import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="app-layout">
      <main className="app-main items-center justify-center">
        <div className="text-center px-4">
          <h1 className="mb-4 font-bold">404</h1>
          <p className="mb-4 text-muted-foreground">Oops! Page not found</p>
          <a href="/" className="text-primary underline hover:text-primary/80 min-h-[44px] inline-flex items-center">
            Return to Home
          </a>
        </div>
      </main>
    </div>
  );
};

export default NotFound;
