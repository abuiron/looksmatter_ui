import { useState, useEffect } from 'react';
import { Edit2, Save, X, Search, Calendar, Trash2 } from 'lucide-react';
import api from '../../services/api';

interface Order {
  _id: string;
  orderNumber?: string;
  user: { _id: string; name: string; email: string };
  items: { product: string; name: string; qty: number; price: number; size?: string }[];
  total: number;
  status: string;
  paymentStatus?: string;
  paymentMethod?: string;
  estimatedDeliveryDate?: string;
  isDeleted?: boolean;
  deletionMessage?: string;
  createdAt: string;
}

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editStatus, setEditStatus] = useState('');
  const [editPaymentStatus, setEditPaymentStatus] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Delete modal state
  const [deleteModal, setDeleteModal] = useState({
    show: false,
    orderId: '',
    message: '',
  });

  // Delivery date modal state
  const [deliveryDateModal, setDeliveryDateModal] = useState({
    show: false,
    orderId: '',
    date: '',
  });

  // Filters
  const [filters, setFilters] = useState({
    orderId: '',
    clientName: '',
    status: '',
    paymentStatus: '',
    paymentMethod: '',
    startDate: '',
    endDate: '',
  });

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [orders, filters]);

  const fetchOrders = async () => {
    try {
      const data = await api.getAllOrders();
      setOrders(data || []);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...orders];

    if (filters.orderId) {
      filtered = filtered.filter(order => 
        order._id.toLowerCase().includes(filters.orderId.toLowerCase())
      );
    }

    if (filters.clientName) {
      filtered = filtered.filter(order => 
        order.user?.name?.toLowerCase().includes(filters.clientName.toLowerCase())
      );
    }

    if (filters.status) {
      filtered = filtered.filter(order => order.status === filters.status);
    }

    if (filters.startDate) {
      filtered = filtered.filter(order => 
        new Date(order.createdAt) >= new Date(filters.startDate)
      );
    }

    if (filters.endDate) {
      filtered = filtered.filter(order => 
        new Date(order.createdAt) <= new Date(filters.endDate)
      );
    }

    setFilteredOrders(filtered);
    setCurrentPage(1);
  };

  const handleEdit = (order: Order) => {
    setEditingId(order._id);
    setEditStatus(order.status);
    setEditPaymentStatus(order.paymentStatus || 'pending');
  };

  const handleSave = async (orderId: string) => {
    try {
      const order = orders.find(o => o._id === orderId);
      
      // Update order status
      await api.updateOrderStatus(orderId, editStatus);
      
      // Update payment status if it's COD or user changed it
      if (order && (order.paymentMethod === 'cod' || editPaymentStatus !== (order.paymentStatus || 'pending'))) {
        await api.updatePaymentStatus(orderId, editPaymentStatus);
      }
      
      setOrders(prev => 
        prev.map(order => 
          order._id === orderId ? { 
            ...order, 
            status: editStatus,
            paymentStatus: editPaymentStatus
          } : order
        )
      );
      setEditingId(null);
    } catch (error) {
      console.error('Failed to update order status:', error);
      alert('Failed to update order');
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditStatus('');
  };

  const handleDeleteClick = (orderId: string) => {
    setDeleteModal({
      show: true,
      orderId,
      message: '',
    });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModal.message.trim()) {
      alert('Please enter a deletion message');
      return;
    }

    try {
      await api.deleteOrder(deleteModal.orderId, deleteModal.message);
      await fetchOrders(); // Refresh orders list
      setDeleteModal({ show: false, orderId: '', message: '' });
      alert('Order marked for deletion successfully');
    } catch (error) {
      console.error('Failed to delete order:', error);
      alert('Failed to delete order');
    }
  };

  const handleDeliveryDateClick = (order: Order) => {
    const currentDate = order.estimatedDeliveryDate 
      ? new Date(order.estimatedDeliveryDate).toISOString().split('T')[0]
      : '';
    setDeliveryDateModal({
      show: true,
      orderId: order._id,
      date: currentDate,
    });
  };

  const handleDeliveryDateSave = async () => {
    if (!deliveryDateModal.date) {
      alert('Please select a delivery date');
      return;
    }

    try {
      await api.updateDeliveryDate(deliveryDateModal.orderId, deliveryDateModal.date);
      await fetchOrders(); // Refresh orders list
      setDeliveryDateModal({ show: false, orderId: '', date: '' });
      alert('Delivery date updated successfully');
    } catch (error) {
      console.error('Failed to update delivery date:', error);
      alert('Failed to update delivery date');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'order confirmed': 'bg-blue-100 text-blue-800',
      'processing': 'bg-indigo-100 text-indigo-800',
      'ready to shipment': 'bg-purple-100 text-purple-800',
      'in transit': 'bg-orange-100 text-orange-800',
      'out for delivery': 'bg-teal-100 text-teal-800',
      'delivered': 'bg-green-100 text-green-800',
      'cancelled': 'bg-red-100 text-red-800',
      'refunded': 'bg-pink-100 text-pink-800',
    };
    return colors[status.toLowerCase()] || 'bg-gray-100 text-gray-800';
  };

  const getStatusEmoji = (status: string) => {
    const emojis: Record<string, string> = {
      'pending': '⏳',
      'order confirmed': '✅',
      'processing': '⚙️',
      'ready to shipment': '📦',
      'in transit': '🚚',
      'out for delivery': '🏃',
      'delivered': '✨',
      'cancelled': '❌',
      'refunded': '💰',
    };
    return emojis[status.toLowerCase()] || '📋';
  };

  // Pagination
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedOrders = filteredOrders.slice(startIndex, startIndex + itemsPerPage);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Orders Management</h1>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Order ID / Number</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search Order"
                value={filters.orderId}
                onChange={(e) => setFilters({ ...filters, orderId: e.target.value })}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Client Name</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by Client"
                value={filters.clientName}
                onChange={(e) => setFilters({ ...filters, clientName: e.target.value })}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Order Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900"
            >
              <option value="">All Status</option>
              <option value="pending">⏳ Pending</option>
              <option value="order confirmed">✅ Order Confirmed</option>
              <option value="processing">⚙️ Processing</option>
              <option value="ready to shipment">📦 Ready to Shipment</option>
              <option value="in transit">🚚 In Transit</option>
              <option value="out for delivery">🏃 Out for Delivery</option>
              <option value="delivered">✨ Delivered</option>
              <option value="cancelled">❌ Cancelled</option>
              <option value="refunded">💰 Refunded</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Payment Status</label>
            <select
              value={filters.paymentStatus}
              onChange={(e) => setFilters({ ...filters, paymentStatus: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900"
            >
              <option value="">All Payment Status</option>
              <option value="pending">⏳ Pending</option>
              <option value="paid">✅ Paid</option>
              <option value="failed">❌ Failed</option>
              <option value="refunded">💰 Refunded</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
            <select
              value={filters.paymentMethod}
              onChange={(e) => setFilters({ ...filters, paymentMethod: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900"
            >
              <option value="">All Methods</option>
              <option value="cod">💵 Cash on Delivery</option>
              <option value="PaymentGateway">💳 PaymentGateway</option>
              <option value="online">💳 Online Payment</option>
            </select>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order Number</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedOrders.map((order) => (
                <tr 
                  key={order._id} 
                  className={`hover:bg-gray-50 ${
                    order.isDeleted 
                      ? 'bg-red-50 opacity-75' 
                      : ''
                  }`}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    <span className={order.isDeleted ? 'line-through' : ''}>
                      {order.orderNumber || order._id.slice(-8).toUpperCase()}
                    </span>
                    {order.isDeleted && (
                      <span className="ml-2 px-2 py-1 text-xs bg-red-600 text-white rounded-full">
                        DELETED
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span className={order.isDeleted ? 'line-through' : ''}>
                      {order.user?.name || order.user?.email || 'Guest User'}
                    </span>
                    {order.isDeleted && order.deletionMessage && (
                      <div className="text-xs text-red-600 mt-1 italic max-w-xs">
                        Reason: {order.deletionMessage}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    <div className={order.isDeleted ? 'line-through' : ''}>
                      {order.items.slice(0, 2).map((item, idx) => (
                        <div key={idx}>
                          {item.name}
                          {item.size ? ` [${item.size}]` : ''} (x{item.qty})
                        </div>
                      ))}
                      {order.items.length > 2 && (
                        <div className="text-gray-500 text-xs">+{order.items.length - 2} more</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span className={order.isDeleted ? 'line-through' : ''}>
                      ₹{order.total.toLocaleString()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(order.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingId === order._id ? (
                      <select
                        value={editStatus}
                        onChange={(e) => setEditStatus(e.target.value)}
                        className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                      >
                        <option value="pending">⏳ Pending</option>
                        <option value="order confirmed">✅ Order Confirmed</option>
                        <option value="processing">⚙️ Processing</option>
                        <option value="ready to shipment">📦 Ready to Shipment</option>
                        <option value="in transit">🚚 In Transit</option>
                        <option value="out for delivery">🏃 Out for Delivery</option>
                        <option value="delivered">✨ Delivered</option>
                        <option value="cancelled">❌ Cancelled</option>
                        <option value="refunded">💰 Refunded</option>
                      </select>
                    ) : (
                      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(order.status)}`}>
                        {getStatusEmoji(order.status)} {order.status}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingId === order._id ? (
                      <div className="space-y-1">
                        <select
                          value={editPaymentStatus}
                          onChange={(e) => setEditPaymentStatus(e.target.value)}
                          className="px-2 py-1 border border-gray-300 rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-gray-900"
                        >
                          <option value="pending">⏳ Pending</option>
                          <option value="paid">✅ Paid</option>
                          <option value="failed">❌ Failed</option>
                          <option value="refunded">💰 Refunded</option>
                        </select>
                        <div className="text-xs text-gray-500">
                          {order.paymentMethod === 'cod' ? '💵 COD' : order.paymentMethod === 'PaymentGateway' ? '💳 PaymentGateway' : order.paymentMethod?.toUpperCase()}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          order.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' :
                          order.paymentStatus === 'failed' ? 'bg-red-100 text-red-800' :
                          order.paymentStatus === 'refunded' ? 'bg-purple-100 text-purple-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {order.paymentStatus === 'paid' ? '✅' : order.paymentStatus === 'failed' ? '❌' : order.paymentStatus === 'refunded' ? '💰' : '⏳'} {(order.paymentStatus || 'pending').toUpperCase()}
                        </span>
                        <div className="text-xs text-gray-500">
                          {order.paymentMethod === 'cod' ? '💵 COD' : order.paymentMethod === 'PaymentGateway' ? '💳 PaymentGateway' : order.paymentMethod?.toUpperCase()}
                        </div>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {editingId === order._id ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSave(order._id)}
                          className="text-green-600 hover:text-green-900"
                          title="Save"
                        >
                          <Save className="w-5 h-5" />
                        </button>
                        <button
                          onClick={handleCancel}
                          className="text-red-600 hover:text-red-900"
                          title="Cancel"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(order)}
                          className="text-gray-600 hover:text-gray-900"
                          title="Edit Status"
                        >
                          <Edit2 className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDeliveryDateClick(order)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Edit Delivery Date"
                        >
                          <Calendar className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(order._id)}
                          className={`text-red-600 ${order.isDeleted ? 'opacity-30 cursor-not-allowed' : 'hover:text-red-900'}`}
                          title={order.isDeleted ? 'Already Deleted' : 'Delete Order'}
                          disabled={order.isDeleted}
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredOrders.length)} of {filteredOrders.length} results
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <div className="flex gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-4 py-2 border rounded-md text-sm font-medium ${
                      currentPage === page
                        ? 'bg-gray-900 text-white border-gray-900'
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-4">Delete Order</h3>
            <p className="mb-4 text-gray-600">Please provide a reason for deleting this order. This message will be shown to the customer.</p>
            <textarea 
              value={deleteModal.message}
              onChange={(e) => setDeleteModal({...deleteModal, message: e.target.value})}
              className="w-full border border-gray-300 p-3 rounded-md mb-4 focus:outline-none focus:ring-2 focus:ring-gray-900"
              rows={4}
              placeholder="Enter deletion reason (e.g., customer requested cancellation, payment issue, etc.)..."
            />
            <div className="flex gap-2 justify-end">
              <button 
                onClick={() => setDeleteModal({show: false, orderId: '', message: ''})} 
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button 
                onClick={handleDeleteConfirm} 
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                disabled={!deleteModal.message.trim()}
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delivery Date Modal */}
      {deliveryDateModal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-4">Update Delivery Date</h3>
            <p className="mb-4 text-gray-600">Select the estimated delivery date for this order.</p>
            <input 
              type="date"
              value={deliveryDateModal.date}
              onChange={(e) => setDeliveryDateModal({...deliveryDateModal, date: e.target.value})}
              className="w-full border border-gray-300 p-3 rounded-md mb-4 focus:outline-none focus:ring-2 focus:ring-gray-900"
              min={new Date().toISOString().split('T')[0]}
            />
            <div className="flex gap-2 justify-end">
              <button 
                onClick={() => setDeliveryDateModal({show: false, orderId: '', date: ''})} 
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button 
                onClick={handleDeliveryDateSave} 
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                disabled={!deliveryDateModal.date}
              >
                Update Date
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
