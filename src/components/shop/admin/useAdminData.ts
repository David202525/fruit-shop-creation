import { useState, useEffect } from 'react';
import { Product, Category, User } from './types';

const API_PRODUCTS = 'https://functions.poehali.dev/5ae817c6-e62e-40c6-8e34-18ffac2d3cfc';
const API_CATEGORIES = 'https://functions.poehali.dev/0a62d37c-9fd0-4ff3-9b5b-2c881073d3ac';
const API_SETTINGS = 'https://functions.poehali.dev/9b1ac59e-93b6-41de-8974-a7f58d4ffaf9';
const API_AUTH = 'https://functions.poehali.dev/2cc7c24d-08b2-4c44-a9a7-8d09198dbefc';
const API_ORDERS = 'https://functions.poehali.dev/b35bef37-8423-4939-b43b-0fb565cc8853';

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