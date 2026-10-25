import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from '../utils/router';
import { User, Package, Users, ShoppingBag, LogOut, FileText } from 'lucide-react';
import AdminProfile from '../components/admin/AdminProfile';
import AdminOrders from '../components/admin/AdminOrders';
import AdminUsers from '../components/admin/AdminUsers';
import AdminProducts from '../components/admin/AdminProducts';
import AdminProductForm from '../components/admin/AdminProductForm';
import AdminReports from '../components/admin/AdminReports';

type AdminSection = 'profile' | 'orders' | 'users' | 'products' | 'product-form' | 'reports';

export default function AdminDashboard() {
  const { user, isAuthenticated, isAdmin, loading: authLoading, logout } = useAuth();
  const { navigate } = useRouter();
  const [activeSection, setActiveSection] = useState<AdminSection>('profile');
  const [editProductId, setEditProductId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || !isAdmin)) {
      navigate('/login');
    }
  }, [isAuthenticated, isAdmin, authLoading, navigate]);

  const handleLogout = () => {
    logout();
    navigate('/');
    setTimeout(() => window.location.reload(), 100);
  };

  const handleEditProduct = (productId: string) => {
    setEditProductId(productId);
    setActiveSection('product-form');
  };

  const handleAddProduct = () => {
    setEditProductId(null);
    setActiveSection('product-form');
  };

  const handleBackToProducts = () => {
    setEditProductId(null);
    setActiveSection('products');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || !isAdmin) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-gray-200 min-h-screen sticky top-0">
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-900">Admin Panel</h2>
            <p className="text-sm text-gray-600 mt-1">{user.name}</p>
          </div>

          <nav className="px-4 space-y-1">
            <button
              onClick={() => setActiveSection('profile')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                activeSection === 'profile'
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <User className="w-5 h-5" />
              <span className="font-medium">Profile</span>
            </button>

            <button
              onClick={() => setActiveSection('orders')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                activeSection === 'orders'
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Package className="w-5 h-5" />
              <span className="font-medium">Orders</span>
            </button>

            <button
              onClick={() => setActiveSection('users')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                activeSection === 'users'
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Users className="w-5 h-5" />
              <span className="font-medium">Users</span>
            </button>

            <button
              onClick={() => setActiveSection('reports')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                activeSection === 'reports'
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <FileText className="w-5 h-5" />
              <span className="font-medium">Reports</span>
            </button>

            <button
              onClick={() => setActiveSection('products')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                activeSection === 'products' || activeSection === 'product-form'
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <ShoppingBag className="w-5 h-5" />
              <span className="font-medium">Products</span>
            </button>
          </nav>

          <div className="absolute bottom-0 w-64 p-4 border-t border-gray-200">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8">
          {activeSection === 'profile' && <AdminProfile />}
          {activeSection === 'orders' && <AdminOrders />}
          {activeSection === 'users' && <AdminUsers />}
          {activeSection === 'reports' && <AdminReports />}
          {activeSection === 'products' && (
            <AdminProducts onEditProduct={handleEditProduct} onAddProduct={handleAddProduct} />
          )}
          {activeSection === 'product-form' && (
            <AdminProductForm productId={editProductId} onBack={handleBackToProducts} />
          )}
        </main>
      </div>
    </div>
  );
}
