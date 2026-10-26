import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import { ThemeProvider } from "./context/ThemeContext";
import Layout from "./components/Layout";
import PageTransition from "./components/PageTransition";
import HomePage from "./pages/HomePage";
import CatalogPage from "./pages/CatalogPage";
import CourseDetailPage from "./pages/CourseDetailPage";
import ProposePage from "./pages/ProposePage";
import MyAreaPage from "./pages/MyAreaPage";
import RepAreaPage from "./pages/RepAreaPage";
import HowItWorksPage from "./pages/HowItWorksPage";
import NotFoundPage from "./pages/NotFoundPage";

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <Routes location={location} key={location.pathname}>
        <Route
          path="/"
          element={
            <PageTransition>
              <HomePage />
            </PageTransition>
          }
        />
        <Route
          path="/corsi"
          element={
            <PageTransition>
              <CatalogPage />
            </PageTransition>
          }
        />
        <Route
          path="/corsi/:id"
          element={
            <PageTransition>
              <CourseDetailPage />
            </PageTransition>
          }
        />
        <Route
          path="/proponi"
          element={
            <PageTransition>
              <ProposePage />
            </PageTransition>
          }
        />
        <Route
          path="/area-personale"
          element={
            <PageTransition>
              <MyAreaPage />
            </PageTransition>
          }
        />
        <Route
          path="/rappresentanti"
          element={
            <PageTransition>
              <RepAreaPage />
            </PageTransition>
          }
        />
        <Route
          path="/come-funziona"
          element={
            <PageTransition>
              <HowItWorksPage />
            </PageTransition>
          }
        />
        <Route
          path="*"
          element={
            <PageTransition>
              <NotFoundPage />
            </PageTransition>
          }
        />
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <HelmetProvider>
      <BrowserRouter>
        <ThemeProvider>
          <AuthProvider>
            <ToastProvider>
              <Layout>
                <AnimatedRoutes />
              </Layout>
            </ToastProvider>
          </AuthProvider>
        </ThemeProvider>
      </BrowserRouter>
    </HelmetProvider>
  );
}
