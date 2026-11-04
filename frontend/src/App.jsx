import React from "react";
import { Routes, Route, useLocation } from "react-router-dom";

import Header from "./components/Header.jsx";
import Footer from "./components/Footer.jsx";

import Home from "./pages/Home.jsx";
import Shop from "./pages/Shop.jsx";
import ProductDetail from "./pages/ProductDetail.jsx";
import Cart from "./pages/Cart.jsx";
import Checkout from "./pages/Checkout.jsx";
import OrderConfirmation from "./pages/OrderConfirmation.jsx";
import NotFound from "./pages/NotFound.jsx";
import Account from "./pages/Account.jsx";

// Administration
import AdminLogin from "./admin/AdminLogin.jsx";
import AdminRoute from "./admin/AdminRoute.jsx";
import AdminDashboard from "./admin/AdminDashboard.jsx";
import AdminProducts from "./admin/AdminProducts.jsx";
import AdminOrders from "./admin/AdminOrders.jsx";
import AdminSales from "./admin/AdminSales.jsx";
import AdminProfile from "./admin/AdminProfile.jsx";

export default function App() {
  const location = useLocation();

  // Toutes les pages /admin utilisent leur propre interface
  // avec la sidebar d'administration.
  const isAdminRoute = location.pathname.startsWith("/admin");

  return (
    <div className="min-h-screen flex flex-col bg-paper text-ink font-body">
      {/* Header uniquement pour la boutique */}
      {!isAdminRoute && <Header />}

      <main className="flex-1">
        <Routes>
          {/* =====================================================
              BOUTIQUE CLIENT
          ===================================================== */}

          <Route path="/" element={<Home />} />

          <Route
            path="/boutique"
            element={<Shop />}
          />

          <Route
            path="/produit/:id"
            element={<ProductDetail />}
          />

          <Route
            path="/panier"
            element={<Cart />}
          />

          <Route
            path="/commande"
            element={<Checkout />}
          />

          <Route
            path="/confirmation/:id"
            element={<OrderConfirmation />}
          />

          <Route
            path="/compte"
            element={<Account />}
          />

          {/* =====================================================
              ADMINISTRATION
          ===================================================== */}

          {/* Connexion administrateur */}
          <Route
            path="/admin/connexion"
            element={<AdminLogin />}
          />

          {/* Tableau de bord */}
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            }
          />

          {/* Produits */}
          <Route
            path="/admin/produits"
            element={
              <AdminRoute>
                <AdminProducts />
              </AdminRoute>
            }
          />

          {/* Commandes clients */}
          <Route
            path="/admin/commandes"
            element={
              <AdminRoute>
                <AdminOrders />
              </AdminRoute>
            }
          />

          {/* Activité des ventes */}
          <Route
            path="/admin/ventes"
            element={
              <AdminRoute>
                <AdminSales />
              </AdminRoute>
            }
          />

          {/* Profil administrateur */}
          <Route
            path="/admin/profil"
            element={
              <AdminRoute>
                <AdminProfile />
              </AdminRoute>
            }
          />

          {/* =====================================================
              PAGE 404
          ===================================================== */}

          <Route
            path="*"
            element={<NotFound />}
          />
        </Routes>
      </main>

      {/* Footer uniquement pour la boutique */}
      {!isAdminRoute && <Footer />}
    </div>
  );
}