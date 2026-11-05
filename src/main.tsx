import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { StoreLayout } from './components/layout/StoreLayout';
import { Home } from './pages/Home';
import { CategoryPage } from './pages/CategoryPage';
import { SearchPage } from './pages/SearchPage';
import { DishDetail } from './pages/DishDetail';
import { Checkout } from './pages/Checkout';
import { AdminLayout } from './admin/AdminLayout';
import { ProductsPage } from './admin/ProductsPage';
import { OrdersPage } from './admin/OrdersPage';
import { CategoriesPage } from './admin/CategoriesPage';
import { SettingsPage } from './admin/SettingsPage';
import { PromotionsPage } from './admin/PromotionsPage';
import { NotFound } from './pages/NotFound';
import { applyTheme, getInitialTheme } from './lib';
import './styles/base.css';
import './components/layout/layout.css';
import './components/menu/menu.css';
import './components/cart/cart.css';
import './components/product/product.css';
import './pages/pages.css';
import './admin/admin.css';

applyTheme(getInitialTheme());

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route element={<StoreLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/buscar" element={<SearchPage />} />
          <Route path="/categoria/:slug" element={<CategoryPage />} />
          <Route path="/plato/:id" element={<DishDetail />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="*" element={<NotFound />} />
        </Route>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<ProductsPage />} />
          <Route path="orders" element={<OrdersPage />} />
          <Route path="categories" element={<CategoriesPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="promotions" element={<PromotionsPage />} />
          <Route path="*" element={<NotFound message="La sección del panel que buscas no existe." />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
);
