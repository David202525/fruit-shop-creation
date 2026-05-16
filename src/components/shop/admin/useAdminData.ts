import { useState, useEffect } from 'react';
import { Product, Category, User } from './types';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';
const API_PRODUCTS = `${API_BASE}/products`;
const API_CATEGORIES = `${API_BASE}/categories`;
const API_SETTINGS = `${API_BASE}/settings`;
const API_AUTH = `${API_BASE}/auth`;
const API_ORDERS = `${API_BASE}/orders`;

export const useAdminData = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [siteSettings, setSiteSettings] = useState<any>({});

  const loadProducts = async () => {
    try {
      const response = await fetch(API_PRODUCTS);
      const data = await response.json();
      setProducts(data.products || []);
    } catch (error) {
      console.error('Failed to load products:', error);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await fetch(API_CATEGORIES);
      const data = await response.json();
      setCategories(data.categories || []);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const loadSettings = async () => {
    try {
      const response = await fetch(`${API_SETTINGS}?t=${Date.now()}`);
      const data = await response.json();
      setSiteSettings(data.settings || {});
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await fetch(`${API_AUTH}?action=get_all_users`);
      const data = await response.json();
      console.log('Users loaded:', data.users?.length || 0);
      setUsers(data.users || []);
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  };

  const loadOrders = async () => {
    try {
      const response = await fetch(`${API_ORDERS}?all=true`);
      const data = await response.json();
      setOrders(data.orders || []);
    } catch (error) {
      console.error('Failed to load orders:', error);
    }
  };



  useEffect(() => {
    loadProducts();
    loadCategories();
    loadSettings();
    loadUsers();
    loadOrders();
  }, []);

  return {
    products,
    categories,
    users,
    orders,
    siteSettings,
    loadProducts,
    loadCategories,
    loadSettings,
    loadUsers,
    loadOrders,
    API_PRODUCTS,
    API_CATEGORIES,
    API_SETTINGS,
    API_AUTH,
    API_ORDERS
  };
};