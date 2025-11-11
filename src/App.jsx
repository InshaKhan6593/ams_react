import React, { useState, useEffect } from 'react';
import { 
  Menu, 
  X, 
  Package, 
  FileText, 
  Warehouse, 
  TrendingUp, 
  QrCode,
  ArrowUpDown,
  CheckCircle,
  Clock,
  MapPin,
  Search,
  Upload,
  AlertCircle,
  RefreshCw,
  Download,
  Filter
} from 'lucide-react';

const API_BASE = 'http://127.0.0.1:8000/api';

const AssetManagementDashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(false);
  
  // State for data
  const [inspections, setInspections] = useState([]);
  const [stockEntries, setStockEntries] = useState([]);
  const [locations, setLocations] = useState([]);
  const [items, setItems] = useState([]);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [pendingAcknowledgments, setPendingAcknowledgments] = useState([]);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const locsRes = await fetch(`${API_BASE}/locations/`);
      const itemsRes = await fetch(`${API_BASE}/items/`);
      
      if (locsRes.ok) setLocations(await locsRes.json());
      if (itemsRes.ok) setItems(await itemsRes.json());
      
      fetchDashboardData();
    } catch (error) {
      console.error('Error fetching initial data:', error);
    }
  };

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [inspRes, stockRes, statsRes, pendingRes] = await Promise.all([
        fetch(`${API_BASE}/inspection-certificates/`),
        fetch(`${API_BASE}/stock-entries/`),
        fetch(`${API_BASE}/stock-entries/dashboard_stats/`),
        fetch(`${API_BASE}/stock-entries/?status=PENDING_ACK`)
      ]);
      
      if (inspRes.ok) setInspections(await inspRes.json());
      if (stockRes.ok) setStockEntries(await stockRes.json());
      if (statsRes.ok) setDashboardStats(await statsRes.json());
      if (pendingRes.ok) setPendingAcknowledgments(await pendingRes.json());
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStockEntries = async () => {
    try {
      const [stockRes, pendingRes] = await Promise.all([
        fetch(`${API_BASE}/stock-entries/`),
        fetch(`${API_BASE}/stock-entries/?status=PENDING_ACK`)
      ]);
      if (stockRes.ok) setStockEntries(await stockRes.json());
      if (pendingRes.ok) setPendingAcknowledgments(await pendingRes.json());
    } catch (error) {
      console.error('Error fetching stock entries:', error);
    }
  };

  const navigation = [
    { id: 'dashboard', name: 'Dashboard', icon: TrendingUp },
    { id: 'pending-ack', name: 'Pending Acknowledgments', icon: AlertCircle, badge: pendingAcknowledgments.length },
    { id: 'locations', name: 'Locations', icon: MapPin },
    { id: 'categories', name: 'Categories', icon: Package },
    { id: 'items', name: 'Items', icon: Package },
    { id: 'inspections', name: 'Inspections', icon: FileText },
    { id: 'stock-entries', name: 'Stock Entries', icon: ArrowUpDown },
    { id: 'inventory', name: 'Inventory', icon: Warehouse },
    { id: 'instances', name: 'Item Instances', icon: Package },
    { id: 'qr-scan', name: 'QR Scanner', icon: QrCode },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-56' : 'w-16'} bg-white border-r border-gray-200 transition-all duration-300`}>
        <div className="flex items-center justify-between p-3 border-b">
          {sidebarOpen && <h1 className="text-base font-semibold text-gray-800">Asset Manager</h1>}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 hover:bg-gray-100 rounded"
          >
            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
        
        <nav className="p-2">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded mb-1 text-sm transition-colors relative ${
                  activeTab === item.id
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Icon size={18} />
                {sidebarOpen && <span>{item.name}</span>}
                {item.badge > 0 && (
                  <span className={`${sidebarOpen ? 'ml-auto' : 'absolute -top-1 -right-1'} bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[20px] text-center`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          {activeTab === 'dashboard' && (
            <DashboardView stats={dashboardStats} loading={loading} />
          )}
          
          {activeTab === 'pending-ack' && (
            <PendingAcknowledgmentsView
              pendingAcknowledgments={pendingAcknowledgments}
              onRefresh={fetchStockEntries}
            />
          )}

                    {activeTab === 'locations' && (
            <LocationsView onRefresh={fetchInitialData} />
          )}
          
          {activeTab === 'categories' && (
            <CategoriesView />
          )}
          
          {activeTab === 'items' && (
            <ItemsView 
              locations={locations}
              onRefresh={fetchInitialData}
            />
          )}
          
          {activeTab === 'inspections' && (
            <InspectionsView
              inspections={inspections}
              locations={locations}
              items={items}
              onRefresh={() => fetchInitialData()}
            />
          )}


          
          {activeTab === 'stock-entries' && (
            <StockEntriesView
              stockEntries={stockEntries}
              locations={locations}
              items={items}
              onRefresh={fetchStockEntries}
            />
          )}
          
          {activeTab === 'inventory' && (
            <InventoryView locations={locations} />
          )}
          
          {activeTab === 'instances' && (
            <InstancesView locations={locations} items={items} />
          )}
          
          {activeTab === 'qr-scan' && (
            <QRScanView />
          )}
        </div>
      </div>
    </div>
  );
};

// Dashboard View Component
const DashboardView = ({ stats, loading }) => {
  if (loading) {
    return <div className="text-center py-12 text-gray-500">Loading...</div>;
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Dashboard</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Total Entries"
          value={stats?.total_entries || 0}
          icon={ArrowUpDown}
          color="blue"
        />
        <StatCard
          title="Pending Acknowledgment"
          value={stats?.pending_acknowledgment || 0}
          icon={Clock}
          color="yellow"
        />
        <StatCard
          title="Completed Today"
          value={stats?.completed_today || 0}
          icon={CheckCircle}
          color="green"
        />
        <StatCard
          title="Overdue Temporary"
          value={stats?.overdue_temporary_issues || 0}
          icon={AlertCircle}
          color="red"
        />
      </div>

      {stats?.by_type && (
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <h3 className="text-sm font-semibold mb-3">Entries by Type</h3>
          <div className="space-y-2">
            {stats.by_type.map((type) => (
              <div key={type.entry_type} className="flex justify-between items-center py-2 border-b last:border-0">
                <span className="text-sm text-gray-600">{type.entry_type}</span>
                <span className="text-sm font-medium">{type.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Stat Card Component
const StatCard = ({ title, value, icon: Icon, color }) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    green: 'bg-green-50 text-green-600',
    red: 'bg-red-50 text-red-600',
  };

  return (
    <div className="bg-white rounded-lg p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-500 mb-1">{title}</p>
          <p className="text-2xl font-semibold">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
};

// Pending Acknowledgments View Component
const PendingAcknowledgmentsView = ({ pendingAcknowledgments, onRefresh }) => {
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [showAckModal, setShowAckModal] = useState(false);

  const viewEntryDetails = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/stock-entries/${id}/`);
      if (res.ok) {
        const data = await res.json();
        setSelectedEntry(data);
        setShowAckModal(true);
      }
    } catch (error) {
      console.error('Error fetching entry details:', error);
    }
  };

  const acknowledgeEntry = async (id, acceptedIds, rejectedItems) => {
    try {
      const res = await fetch(`${API_BASE}/stock-entries/${id}/acknowledge/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accepted_ids: acceptedIds,
          rejected_items: rejectedItems
        })
      });
      
      if (res.ok) {
        const data = await res.json();
        alert(`Entry acknowledged!\nAccepted: ${data.accepted}\nRejected: ${data.rejected}`);
        setShowAckModal(false);
        setSelectedEntry(null);
        onRefresh();
      } else {
        const error = await res.json();
        alert('Error: ' + JSON.stringify(error));
      }
    } catch (error) {
      console.error('Error acknowledging entry:', error);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-xl font-semibold">Pending Acknowledgments</h2>
          <p className="text-sm text-gray-500 mt-1">Store-to-store transfers awaiting confirmation</p>
        </div>
        <button
          onClick={onRefresh}
          className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 flex items-center gap-2"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {pendingAcknowledgments.length === 0 ? (
        <div className="bg-white rounded-lg p-8 text-center">
          <CheckCircle size={48} className="mx-auto text-green-500 mb-3" />
          <p className="text-gray-600">No pending acknowledgments</p>
          <p className="text-sm text-gray-500 mt-1">All store transfers have been processed</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-600">Entry No</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-600">From Store</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-600">To Store</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-600">Item</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-600">Qty</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-600">Date</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {pendingAcknowledgments.map((entry) => (
                <tr key={entry.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2.5 text-sm font-medium">{entry.entry_number}</td>
                  <td className="px-4 py-2.5 text-sm">{entry.from_location_name}</td>
                  <td className="px-4 py-2.5 text-sm">{entry.to_location_name}</td>
                  <td className="px-4 py-2.5 text-sm">{entry.item_name}</td>
                  <td className="px-4 py-2.5 text-sm">{entry.quantity}</td>
                  <td className="px-4 py-2.5 text-sm">{new Date(entry.entry_date).toLocaleDateString()}</td>
                  <td className="px-4 py-2.5">
                    <button
                      onClick={() => viewEntryDetails(entry.id)}
                      className="px-3 py-1 bg-yellow-600 text-white rounded text-sm hover:bg-yellow-700"
                    >
                      Review & Acknowledge
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Acknowledgment Modal */}
      {showAckModal && selectedEntry && (
        <AcknowledgmentModal
          entry={selectedEntry}
          onClose={() => {
            setShowAckModal(false);
            setSelectedEntry(null);
          }}
          onAcknowledge={acknowledgeEntry}
        />
      )}
    </div>
  );
};

const LocationsView = ({ onRefresh }) => {
  const [locations, setLocations] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingLocation, setEditingLocation] = useState(null);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchLocations();
    fetchCategories();
  }, []);

  const fetchLocations = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/locations/`);
      if (res.ok) {
        const data = await res.json();
        setLocations(data);
      }
    } catch (error) {
      console.error('Error fetching locations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch(`${API_BASE}/categories/`);
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const deleteLocation = async (id) => {
    // eslint-disable-next-line no-restricted-globals
    if (!confirm('Are you sure you want to delete this location?')) return;
    
    try {
      const res = await fetch(`${API_BASE}/locations/${id}/`, {
        method: 'DELETE'
      });
      if (res.ok) {
        alert('Location deleted successfully');
        fetchLocations();
        if (onRefresh) onRefresh();
      } else {
        const error = await res.json();
        alert('Error: ' + JSON.stringify(error));
      }
    } catch (error) {
      console.error('Error deleting location:', error);
      alert('Error deleting location');
    }
  };

  const filteredLocations = locations.filter(loc => 
    filter === 'all' || 
    (filter === 'stores' && loc.is_store) ||
    (filter === 'non-stores' && !loc.is_store) ||
    loc.location_type === filter.toUpperCase()
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-xl font-semibold">Locations</h2>
          <p className="text-sm text-gray-500 mt-1">Manage departments, stores, buildings, and other locations</p>
        </div>
        <button
          onClick={() => {
            setEditingLocation(null);
            setShowForm(true);
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
        >
          + New Location
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-4">
        {['all', 'stores', 'non-stores', 'department', 'building', 'lab', 'room'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded text-sm ${
              filter === f
                ? 'bg-blue-100 text-blue-700'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Locations List */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading...</div>
        ) : filteredLocations.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p>No locations found</p>
            <p className="text-sm mt-2">Create your first location to get started</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-600">Name</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-600">Code</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-600">Type</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-600">Parent</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-600">In Charge</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-600">Contact</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-600">Status</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredLocations.map((loc) => (
                <tr key={loc.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2.5 text-sm font-medium">
                    {loc.name}
                    {loc.is_store && <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">Store</span>}
                  </td>
                  <td className="px-4 py-2.5 text-sm font-mono">{loc.code}</td>
                  <td className="px-4 py-2.5 text-sm">{loc.location_type}</td>
                  <td className="px-4 py-2.5 text-sm">{loc.parent_location_name || '-'}</td>
                  <td className="px-4 py-2.5 text-sm">{loc.in_charge || '-'}</td>
                  <td className="px-4 py-2.5 text-sm">{loc.contact_number || '-'}</td>
                  <td className="px-4 py-2.5">
                    <span className={`px-2 py-1 rounded text-xs ${
                      loc.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {loc.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditingLocation(loc);
                          setShowForm(true);
                        }}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteLocation(loc.id)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Location Form Modal */}
      {showForm && (
        <LocationFormModal
          location={editingLocation}
          locations={locations}
          onClose={() => {
            setShowForm(false);
            setEditingLocation(null);
          }}
          onSuccess={() => {
            setShowForm(false);
            setEditingLocation(null);
            fetchLocations();
            if (onRefresh) onRefresh();
          }}
        />
      )}
    </div>
  );
};

// Location Form Modal
const LocationFormModal = ({ location, locations, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    location_type: 'DEPARTMENT',
    parent_location: '',
    is_store: false,
    description: '',
    address: '',
    in_charge: '',
    contact_number: '',
    is_active: true
  });

  useEffect(() => {
    if (location) {
      setFormData({
        name: location.name || '',
        code: location.code || '',
        location_type: location.location_type || 'DEPARTMENT',
        parent_location: location.parent_location || '',
        is_store: location.is_store || false,
        description: location.description || '',
        address: location.address || '',
        in_charge: location.in_charge || '',
        contact_number: location.contact_number || '',
        is_active: location.is_active !== undefined ? location.is_active : true
      });
    }
  }, [location]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      ...formData,
      parent_location: formData.parent_location || null
    };

    try {
      const url = location 
        ? `${API_BASE}/locations/${location.id}/`
        : `${API_BASE}/locations/`;
      
      const method = location ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        alert(location ? 'Location updated successfully!' : 'Location created successfully!');
        onSuccess();
      } else {
        const error = await res.json();
        alert('Error: ' + JSON.stringify(error));
      }
    } catch (error) {
      console.error('Error saving location:', error);
      alert('Error saving location');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-auto">
        <div className="p-4 border-b flex justify-between items-center sticky top-0 bg-white">
          <h3 className="text-base font-semibold">{location ? 'Edit Location' : 'New Location'}</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1">Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full px-3 py-2 border rounded text-sm"
                placeholder="e.g., Main Store, CS Department"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Code *</label>
              <input
                type="text"
                required
                value={formData.code}
                onChange={(e) => setFormData({...formData, code: e.target.value})}
                className="w-full px-3 py-2 border rounded text-sm"
                placeholder="e.g., MS-001, CS-DEPT"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1">Location Type *</label>
              <select
                required
                value={formData.location_type}
                onChange={(e) => setFormData({...formData, location_type: e.target.value})}
                className="w-full px-3 py-2 border rounded text-sm"
              >
                <option value="DEPARTMENT">Department</option>
                <option value="BUILDING">Building</option>
                <option value="STORE">Store</option>
                <option value="ROOM">Room</option>
                <option value="LAB">Lab</option>
                <option value="JUNKYARD">Junkyard</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Parent Location</label>
              <select
                value={formData.parent_location}
                onChange={(e) => setFormData({...formData, parent_location: e.target.value})}
                className="w-full px-3 py-2 border rounded text-sm"
              >
                <option value="">None (Top Level)</option>
                {locations
                  .filter(loc => !location || loc.id !== location.id)
                  .map(loc => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name} ({loc.code})
                    </option>
                  ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_store}
                onChange={(e) => setFormData({...formData, is_store: e.target.checked})}
                className="cursor-pointer"
              />
              <span className="text-sm font-medium">Is Store Location</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                className="cursor-pointer"
              />
              <span className="text-sm font-medium">Active</span>
            </label>
          </div>

          <div>
            <label className="block text-xs font-medium mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full px-3 py-2 border rounded text-sm"
              rows="2"
              placeholder="Brief description of this location"
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1">Address</label>
            <textarea
              value={formData.address}
              onChange={(e) => setFormData({...formData, address: e.target.value})}
              className="w-full px-3 py-2 border rounded text-sm"
              rows="2"
              placeholder="Physical address"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1">Person In Charge</label>
              <input
                type="text"
                value={formData.in_charge}
                onChange={(e) => setFormData({...formData, in_charge: e.target.value})}
                className="w-full px-3 py-2 border rounded text-sm"
                placeholder="Name of person in charge"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Contact Number</label>
              <input
                type="text"
                value={formData.contact_number}
                onChange={(e) => setFormData({...formData, contact_number: e.target.value})}
                className="w-full px-3 py-2 border rounded text-sm"
                placeholder="Phone number"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded text-sm hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
            >
              {location ? 'Update' : 'Create'} Location
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Categories View Component
const CategoriesView = () => {
  const [categories, setCategories] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/categories/`);
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteCategory = async (id) => {
    // eslint-disable-next-line no-restricted-globals
    if (!confirm('Are you sure you want to delete this category?')) return;
    
    try {
      const res = await fetch(`${API_BASE}/categories/${id}/`, {
        method: 'DELETE'
      });
      if (res.ok) {
        alert('Category deleted successfully');
        fetchCategories();
      } else {
        const error = await res.json();
        alert('Error: ' + JSON.stringify(error));
      }
    } catch (error) {
      console.error('Error deleting category:', error);
      alert('Error deleting category');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-xl font-semibold">Categories</h2>
          <p className="text-sm text-gray-500 mt-1">Organize items into categories and subcategories</p>
        </div>
        <button
          onClick={() => {
            setEditingCategory(null);
            setShowForm(true);
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
        >
          + New Category
        </button>
      </div>

      {/* Categories List */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading...</div>
        ) : categories.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p>No categories found</p>
            <p className="text-sm mt-2">Create your first category to organize items</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-600">Name</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-600">Code</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-600">Parent Category</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-600">Description</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-600">Status</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {categories.map((cat) => (
                <tr key={cat.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2.5 text-sm font-medium">{cat.name}</td>
                  <td className="px-4 py-2.5 text-sm font-mono">{cat.code}</td>
                  <td className="px-4 py-2.5 text-sm">{cat.parent_category_name || '-'}</td>
                  <td className="px-4 py-2.5 text-sm text-gray-600">{cat.description || '-'}</td>
                  <td className="px-4 py-2.5">
                    <span className={`px-2 py-1 rounded text-xs ${
                      cat.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {cat.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditingCategory(cat);
                          setShowForm(true);
                        }}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteCategory(cat.id)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Category Form Modal */}
      {showForm && (
        <CategoryFormModal
          category={editingCategory}
          categories={categories}
          onClose={() => {
            setShowForm(false);
            setEditingCategory(null);
          }}
          onSuccess={() => {
            setShowForm(false);
            setEditingCategory(null);
            fetchCategories();
          }}
        />
      )}
    </div>
  );
};

// Category Form Modal
const CategoryFormModal = ({ category, categories, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    parent_category: '',
    is_active: true
  });

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name || '',
        code: category.code || '',
        description: category.description || '',
        parent_category: category.parent_category || '',
        is_active: category.is_active !== undefined ? category.is_active : true
      });
    }
  }, [category]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      ...formData,
      parent_category: formData.parent_category || null
    };

    try {
      const url = category 
        ? `${API_BASE}/categories/${category.id}/`
        : `${API_BASE}/categories/`;
      
      const method = category ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        alert(category ? 'Category updated successfully!' : 'Category created successfully!');
        onSuccess();
      } else {
        const error = await res.json();
        alert('Error: ' + JSON.stringify(error));
      }
    } catch (error) {
      console.error('Error saving category:', error);
      alert('Error saving category');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-auto">
        <div className="p-4 border-b flex justify-between items-center sticky top-0 bg-white">
          <h3 className="text-base font-semibold">{category ? 'Edit Category' : 'New Category'}</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1">Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full px-3 py-2 border rounded text-sm"
                placeholder="e.g., Electronics, Furniture"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Code *</label>
              <input
                type="text"
                required
                value={formData.code}
                onChange={(e) => setFormData({...formData, code: e.target.value})}
                className="w-full px-3 py-2 border rounded text-sm"
                placeholder="e.g., ELEC, FURN"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium mb-1">Parent Category</label>
            <select
              value={formData.parent_category}
              onChange={(e) => setFormData({...formData, parent_category: e.target.value})}
              className="w-full px-3 py-2 border rounded text-sm"
            >
              <option value="">None (Top Level)</option>
              {categories
                .filter(cat => !category || cat.id !== category.id)
                .map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name} ({cat.code})
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full px-3 py-2 border rounded text-sm"
              rows="3"
              placeholder="Describe this category"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                className="cursor-pointer"
              />
              <span className="text-sm font-medium">Active</span>
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded text-sm hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
            >
              {category ? 'Update' : 'Create'} Category
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Items View Component
const ItemsView = ({ locations, onRefresh }) => {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchItems();
    fetchCategories();
  }, []);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/items/`);
      if (res.ok) {
        const data = await res.json();
        setItems(data);
      }
    } catch (error) {
      console.error('Error fetching items:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch(`${API_BASE}/categories/`);
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const deleteItem = async (id) => {
    // eslint-disable-next-line no-restricted-globals
    if (!confirm('Are you sure you want to delete this item?')) return;
    
    try {
      const res = await fetch(`${API_BASE}/items/${id}/`, {
        method: 'DELETE'
      });
      if (res.ok) {
        alert('Item deleted successfully');
        fetchItems();
        if (onRefresh) onRefresh();
      } else {
        const error = await res.json();
        alert('Error: ' + JSON.stringify(error));
      }
    } catch (error) {
      console.error('Error deleting item:', error);
      alert('Error deleting item');
    }
  };

  const filteredItems = items.filter(item => 
    filter === 'all' || item.category === parseInt(filter)
  );

  const stores = locations.filter(l => l.is_store);

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-xl font-semibold">Items</h2>
          <p className="text-sm text-gray-500 mt-1">Manage inventory items and their specifications</p>
        </div>
        <button
          onClick={() => {
            setEditingItem(null);
            setShowForm(true);
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
        >
          + New Item
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-4 overflow-x-auto">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 rounded text-sm whitespace-nowrap ${
            filter === 'all'
              ? 'bg-blue-100 text-blue-700'
              : 'bg-white text-gray-600 hover:bg-gray-50'
          }`}
        >
          All Items
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setFilter(cat.id.toString())}
            className={`px-3 py-1.5 rounded text-sm whitespace-nowrap ${
              filter === cat.id.toString()
                ? 'bg-blue-100 text-blue-700'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Items List */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading...</div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p>No items found</p>
            <p className="text-sm mt-2">Create your first item to start tracking inventory</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-600">Name</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-600">Code</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-600">Category</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-600">Default Location</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-600">Acct Unit</th>
                  <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-600">Total Qty</th>
                  <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-600">Reorder Level</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-600">Status</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2.5 text-sm font-medium">{item.name}</td>
                    <td className="px-4 py-2.5 text-sm font-mono">{item.code}</td>
                    <td className="px-4 py-2.5 text-sm">{item.category_name}</td>
                    <td className="px-4 py-2.5 text-sm">{item.default_location_name}</td>
                    <td className="px-4 py-2.5 text-sm">{item.acct_unit}</td>
                    <td className="px-4 py-2.5 text-sm text-right font-medium">{item.total_quantity}</td>
                    <td className="px-4 py-2.5 text-sm text-right">
                      {item.reorder_level > 0 ? (
                        <span className={`px-2 py-0.5 rounded text-xs ${
                          item.total_quantity <= item.reorder_level
                            ? 'bg-red-100 text-red-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {item.reorder_level}
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`px-2 py-1 rounded text-xs ${
                        item.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {item.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setEditingItem(item);
                            setShowForm(true);
                          }}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteItem(item.id)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Item Form Modal */}
      {showForm && (
        <ItemFormModal
          item={editingItem}
          categories={categories}
          stores={stores}
          onClose={() => {
            setShowForm(false);
            setEditingItem(null);
          }}
          onSuccess={() => {
            setShowForm(false);
            setEditingItem(null);
            fetchItems();
            if (onRefresh) onRefresh();
          }}
        />
      )}
    </div>
  );
};

// Item Form Modal
const ItemFormModal = ({ item, categories, stores, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    category: '',
    description: '',
    acct_unit: '',
    specifications: '',
    default_location: '',
    reorder_level: 0,
    reorder_quantity: 0,
    is_active: true
  });

  useEffect(() => {
    if (item) {
      setFormData({
        name: item.name || '',
        code: item.code || '',
        category: item.category || '',
        description: item.description || '',
        acct_unit: item.acct_unit || '',
        specifications: item.specifications || '',
        default_location: item.default_location || '',
        reorder_level: item.reorder_level || 0,
        reorder_quantity: item.reorder_quantity || 0,
        is_active: item.is_active !== undefined ? item.is_active : true
      });
    }
  }, [item]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.category) {
      alert('Please select a category');
      return;
    }

    if (!formData.default_location) {
      alert('Please select a default location');
      return;
    }

    try {
      const url = item 
        ? `${API_BASE}/items/${item.id}/`
        : `${API_BASE}/items/`;
      
      const method = item ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        alert(item ? 'Item updated successfully!' : 'Item created successfully!');
        onSuccess();
      } else {
        const error = await res.json();
        alert('Error: ' + JSON.stringify(error));
      }
    } catch (error) {
      console.error('Error saving item:', error);
      alert('Error saving item');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-auto">
        <div className="p-4 border-b flex justify-between items-center sticky top-0 bg-white">
          <h3 className="text-base font-semibold">{item ? 'Edit Item' : 'New Item'}</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1">Item Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full px-3 py-2 border rounded text-sm"
                placeholder="e.g., Laptop, Chair, Projector"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Item Code *</label>
              <input
                type="text"
                required
                value={formData.code}
                onChange={(e) => setFormData({...formData, code: e.target.value})}
                className="w-full px-3 py-2 border rounded text-sm"
                placeholder="e.g., LAP-001, CHR-001"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1">Category *</label>
              <select
                required
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
                className="w-full px-3 py-2 border rounded text-sm"
              >
                <option value="">Select Category</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name} ({cat.code})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Default Location (Store) *</label>
              <select
                required
                value={formData.default_location}
                onChange={(e) => setFormData({...formData, default_location: e.target.value})}
                className="w-full px-3 py-2 border rounded text-sm"
              >
                <option value="">Select Store</option>
                {stores.map(store => (
                  <option key={store.id} value={store.id}>
                    {store.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium mb-1">Accounting Unit *</label>
            <input
              type="text"
              required
              value={formData.acct_unit}
              onChange={(e) => setFormData({...formData, acct_unit: e.target.value})}
              className="w-full px-3 py-2 border rounded text-sm"
              placeholder="e.g., Piece, Unit, Set, Kg, Liter"
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full px-3 py-2 border rounded text-sm"
              rows="2"
              placeholder="Brief description of the item"
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1">Specifications</label>
            <textarea
              value={formData.specifications}
              onChange={(e) => setFormData({...formData, specifications: e.target.value})}
              className="w-full px-3 py-2 border rounded text-sm"
              rows="3"
              placeholder="Technical specifications, model number, features, etc."
            />
          </div>

          <div className="border-t pt-3">
            <h4 className="text-sm font-semibold mb-3">Reorder Settings</h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1">Reorder Level</label>
                <input
                  type="number"
                  min="0"
                  value={formData.reorder_level}
                  onChange={(e) => setFormData({...formData, reorder_level: parseInt(e.target.value) || 0})}
                  className="w-full px-3 py-2 border rounded text-sm"
                  placeholder="Minimum quantity threshold"
                />
                <p className="text-xs text-gray-500 mt-1">Alert when stock falls below this level</p>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Reorder Quantity</label>
                <input
                  type="number"
                  min="0"
                  value={formData.reorder_quantity}
                  onChange={(e) => setFormData({...formData, reorder_quantity: parseInt(e.target.value) || 0})}
                  className="w-full px-3 py-2 border rounded text-sm"
                  placeholder="Suggested reorder amount"
                />
                <p className="text-xs text-gray-500 mt-1">Quantity to order when restocking</p>
              </div>
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                className="cursor-pointer"
              />
              <span className="text-sm font-medium">Active</span>
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded text-sm hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
            >
              {item ? 'Update' : 'Create'} Item
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const InspectionsView = ({ inspections, locations, items, onRefresh }) => {
  const [showForm, setShowForm] = useState(false);
  const [selectedInspection, setSelectedInspection] = useState(null);
  const [filter, setFilter] = useState('all');
  const [downloadingPdf, setDownloadingPdf] = useState(null);

  const filteredInspections = inspections.filter(insp => 
    filter === 'all' || insp.status === filter.toUpperCase()
  );

  const viewInspectionDetails = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/inspection-certificates/${id}/preview/`);
      if (res.ok) {
        const data = await res.json();
        setSelectedInspection(data);
      }
    } catch (error) {
      console.error('Error fetching inspection details:', error);
    }
  };

  const confirmInspection = async (id) => {
    // eslint-disable-next-line no-restricted-globals
    if (!confirm('Confirm this inspection? This will create item instances and update inventory.')) return;
    
    try {
      const res = await fetch(`${API_BASE}/inspection-certificates/${id}/confirm/`, {
        method: 'POST'
      });
      if (res.ok) {
        const data = await res.json();
        alert(`Inspection confirmed!\n\nInstances created: ${data.instances_created}\nReceipt entries: ${data.receipt_entries_created}\n\n${data.message}`);
        onRefresh();
        setSelectedInspection(null);
      } else {
        const error = await res.json();
        alert('Error: ' + JSON.stringify(error));
      }
    } catch (error) {
      console.error('Error confirming inspection:', error);
      alert('Error confirming inspection');
    }
  };

  const downloadPdf = async (id, certificateNo) => {
    setDownloadingPdf(id);
    try {
      const res = await fetch(`${API_BASE}/inspection-certificates/${id}/download_pdf/`);
      
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `inspection_${certificateNo}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } else {
        const error = await res.json();
        alert('Error downloading PDF: ' + JSON.stringify(error));
      }
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert('Error downloading PDF');
    } finally {
      setDownloadingPdf(null);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Inspection Certificates</h2>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
        >
          + New Inspection
        </button>
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-4">
        {['all', 'draft', 'confirmed', 'completed'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded text-sm ${
              filter === f
                ? 'bg-blue-100 text-blue-700'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Inspections List */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-600">Certificate No</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-600">Date</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-600">Contractor</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-600">Store</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-600">Status</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-600">Items</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filteredInspections.map((insp) => (
              <tr key={insp.id} className="hover:bg-gray-50">
                <td className="px-4 py-2.5 text-sm">{insp.certificate_no}</td>
                <td className="px-4 py-2.5 text-sm">{insp.date}</td>
                <td className="px-4 py-2.5 text-sm">{insp.contractor_name}</td>
                <td className="px-4 py-2.5 text-sm">{insp.receiving_store_name || '-'}</td>
                <td className="px-4 py-2.5">
                  <span className={`px-2 py-1 rounded text-xs ${
                    insp.status === 'CONFIRMED' ? 'bg-green-100 text-green-700' :
                    insp.status === 'DRAFT' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {insp.status}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-sm">{insp.total_items_count || 0}</td>
                <td className="px-4 py-2.5">
                  <div className="flex gap-2">
                    <button
                      onClick={() => viewInspectionDetails(insp.id)}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      View
                    </button>
                    {insp.status === 'DRAFT' && (
                      <button
                        onClick={() => confirmInspection(insp.id)}
                        className="text-green-600 hover:text-green-800 text-sm"
                      >
                        Confirm
                      </button>
                    )}
                    {insp.status === 'CONFIRMED' && (
                      <button
                        onClick={() => downloadPdf(insp.id, insp.certificate_no)}
                        disabled={downloadingPdf === insp.id}
                        className="text-purple-600 hover:text-purple-800 text-sm flex items-center gap-1 disabled:text-gray-400"
                      >
                        <Download size={14} />
                        {downloadingPdf === insp.id ? 'Generating...' : 'PDF'}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Inspection Details Modal */}
      {selectedInspection && (
        <InspectionDetailsModal
          inspection={selectedInspection}
          onClose={() => setSelectedInspection(null)}
          onConfirm={confirmInspection}
        />
      )}

      {/* Create Form Modal */}
      {showForm && (
        <InspectionFormModal
          locations={locations}
          items={items}
          onClose={() => setShowForm(false)}
          onSuccess={() => {
            setShowForm(false);
            onRefresh();
          }}
        />
      )}
    </div>
  );
};

const StockEntriesView = ({ stockEntries, locations, items, onRefresh }) => {
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState('all');
  const [selectedEntry, setSelectedEntry] = useState(null);

  const viewEntryDetails = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/stock-entries/${id}/`);
      if (res.ok) {
        const data = await res.json();
        setSelectedEntry(data);
      }
    } catch (error) {
      console.error('Error fetching entry details:', error);
    }
  };

  const returnTemporaryItems = async (id) => {
    // eslint-disable-next-line no-restricted-globals
    if (!confirm('Confirm return of temporarily issued items?')) return;
    
    try {
      const res = await fetch(`${API_BASE}/stock-entries/${id}/return_temporary_items/`, {
        method: 'POST'
      });
      
      if (res.ok) {
        const data = await res.json();
        alert(`Items returned successfully!\nReturned: ${data.returned}\nReceipt Entry: ${data.receipt_entry_number}`);
        onRefresh();
        setSelectedEntry(null);
      } else {
        const error = await res.json();
        alert('Error: ' + JSON.stringify(error));
      }
    } catch (error) {
      console.error('Error returning items:', error);
    }
  };

  const filteredEntries = stockEntries.filter(entry => 
    filter === 'all' || entry.entry_type === filter.toUpperCase()
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Stock Entries</h2>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
        >
          + New Entry
        </button>
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-4">
        {['all', 'receipt', 'issue', 'correction'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded text-sm ${
              filter === f
                ? 'bg-blue-100 text-blue-700'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Entries List */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-600">Entry No</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-600">Type</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-600">From</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-600">To</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-600">Item</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-600">Qty</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-600">Status</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filteredEntries.map((entry) => (
              <tr key={entry.id} className="hover:bg-gray-50">
                <td className="px-4 py-2.5 text-sm font-medium">{entry.entry_number}</td>
                <td className="px-4 py-2.5 text-sm">
                  <span className={`px-2 py-1 rounded text-xs ${
                    entry.is_temporary ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'
                  }`}>
                    {entry.entry_type}
                    {entry.is_temporary && ' (TEMP)'}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-sm">{entry.from_location_name || '-'}</td>
                <td className="px-4 py-2.5 text-sm">{entry.to_location_name || '-'}</td>
                <td className="px-4 py-2.5 text-sm">{entry.item_name}</td>
                <td className="px-4 py-2.5 text-sm">{entry.quantity}</td>
                <td className="px-4 py-2.5">
                  <span className={`px-2 py-1 rounded text-xs ${
                    entry.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                    entry.status === 'PENDING_ACK' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {entry.status}
                    {entry.is_overdue && ' ⚠️'}
                  </span>
                </td>
                <td className="px-4 py-2.5">
                  <div className="flex gap-2">
                    <button
                      onClick={() => viewEntryDetails(entry.id)}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      View
                    </button>
                    {entry.is_temporary && entry.status === 'COMPLETED' && !entry.actual_return_date && (
                      <button
                        onClick={() => returnTemporaryItems(entry.id)}
                        className="text-green-600 hover:text-green-800 text-sm"
                      >
                        Return
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Entry Details Modal */}
      {selectedEntry && (
        <EntryDetailsModal
          entry={selectedEntry}
          onClose={() => setSelectedEntry(null)}
        />
      )}

      {/* Create Form Modal */}
      {showForm && (
        <StockEntryFormModal
          locations={locations}
          items={items}
          onClose={() => setShowForm(false)}
          onSuccess={() => {
            setShowForm(false);
            onRefresh();
          }}
        />
      )}
    </div>
  );
};

// Entry Details Modal
const EntryDetailsModal = ({ entry, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-auto">
        <div className="p-4 border-b flex justify-between items-center sticky top-0 bg-white">
          <h3 className="text-base font-semibold">Entry Details: {entry.entry_number}</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X size={18} />
          </button>
        </div>
        
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Type:</span>
              <span className="ml-2 font-medium">{entry.entry_type}</span>
            </div>
            <div>
              <span className="text-gray-600">Status:</span>
              <span className="ml-2 font-medium">{entry.status}</span>
            </div>
            <div>
              <span className="text-gray-600">From:</span>
              <span className="ml-2 font-medium">{entry.from_location_name || 'N/A'}</span>
            </div>
            <div>
              <span className="text-gray-600">To:</span>
              <span className="ml-2 font-medium">{entry.to_location_name || 'N/A'}</span>
            </div>
            <div>
              <span className="text-gray-600">Item:</span>
              <span className="ml-2 font-medium">{entry.item_name}</span>
            </div>
            <div>
              <span className="text-gray-600">Quantity:</span>
              <span className="ml-2 font-medium">{entry.quantity}</span>
            </div>
            {entry.is_temporary && (
              <>
                <div>
                  <span className="text-gray-600">Expected Return:</span>
                  <span className="ml-2 font-medium">{entry.expected_return_date || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-gray-600">Actual Return:</span>
                  <span className="ml-2 font-medium">{entry.actual_return_date || 'Not returned'}</span>
                </div>
              </>
            )}
          </div>

          {entry.purpose && (
            <div className="text-sm">
              <span className="text-gray-600">Purpose:</span>
              <p className="mt-1 p-2 bg-gray-50 rounded">{entry.purpose}</p>
            </div>
          )}

          {entry.remarks && (
            <div className="text-sm">
              <span className="text-gray-600">Remarks:</span>
              <p className="mt-1 p-2 bg-gray-50 rounded">{entry.remarks}</p>
            </div>
          )}

          {entry.instances_details && entry.instances_details.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold mb-2">Instances</h4>
              <div className="border rounded overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs">Instance Code</th>
                      <th className="px-3 py-2 text-left text-xs">Status</th>
                      <th className="px-3 py-2 text-left text-xs">Condition</th>
                      <th className="px-3 py-2 text-left text-xs">Location</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {entry.instances_details.map((inst) => (
                      <tr key={inst.id}>
                        <td className="px-3 py-2 font-mono text-xs">{inst.instance_code}</td>
                        <td className="px-3 py-2">{inst.current_status}</td>
                        <td className="px-3 py-2">{inst.condition}</td>
                        <td className="px-3 py-2">{inst.current_location_name}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};


const InspectionFormModal = ({ locations, items, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    // Basic Information
    certificate_no: '',
    date: new Date().toISOString().split('T')[0],
    inspected_by: '',
    
    // Contract Details
    contract_no: '',
    contract_date: '',
    contractor_name: '',
    contractor_address: '',
    
    // Indent Details
    indenter: '',
    indent_no: '',
    
    // Consignee & Department
    consignee: '',
    department: '',
    receiving_store: '',
    
    // Delivery Details
    date_of_delivery: '',
    delivery_type: 'FULL',
    date_of_inspection: '',
    
    // Stock Register Details
    stock_register_no: '',
    stock_register_page_no: '',
    stock_entry_date: '',
    
    // Consignee Signature
    consignee_name: '',
    consignee_designation: '',
    
    // Central Store Details
    dead_stock_register_no: '',
    dead_stock_page_no: '',
    central_store_entry_date: '',
    manager_central_store: '',
    
    // Finance Details
    finance_check_date: '',
    assistant_director_finance: '',
    
    // Other
    remarks: ''
  });

  const [certificateImage, setCertificateImage] = useState(null);
  const [inspectionItems, setInspectionItems] = useState([]);
  const [currentItem, setCurrentItem] = useState({
    item: '',
    tendered_quantity: 0,
    accepted_quantity: 0,
    rejected_quantity: 0,
    unit_price: 0,
    remarks: ''
  });

  const [currentSection, setCurrentSection] = useState(1); // For multi-step form

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setCertificateImage(e.target.files[0]);
    }
  };

  const addInspectionItem = () => {
    if (!currentItem.item || currentItem.tendered_quantity <= 0) {
      alert('Please select an item and enter tendered quantity');
      return;
    }

    const selectedItem = items.find(i => i.id === parseInt(currentItem.item));
    setInspectionItems([...inspectionItems, {
      ...currentItem,
      item_name: selectedItem?.name
    }]);
    
    setCurrentItem({
      item: '',
      tendered_quantity: 0,
      accepted_quantity: 0,
      rejected_quantity: 0,
      unit_price: 0,
      remarks: ''
    });
  };

  const removeInspectionItem = (index) => {
    setInspectionItems(inspectionItems.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (inspectionItems.length === 0) {
      alert('Please add at least one inspection item');
      return;
    }

    if (!formData.receiving_store) {
      alert('Please select a receiving store');
      return;
    }

    try {
      // First, upload the image if present and get the URL
      let certificateImagePath = null;
      
      if (certificateImage) {
        const imageFormData = new FormData();
        imageFormData.append('certificate_image', certificateImage);
        
        // You might need a separate endpoint for image upload
        // For now, we'll include it in the main request
      }

      // Prepare JSON payload
      const payload = {
        // Basic Information
        certificate_no: formData.certificate_no,
        date: formData.date,
        inspected_by: formData.inspected_by,
        
        // Contract Details
        contract_no: formData.contract_no,
        contract_date: formData.contract_date || null,
        contractor_name: formData.contractor_name,
        contractor_address: formData.contractor_address || null,
        
        // Indent Details
        indenter: formData.indenter,
        indent_no: formData.indent_no,
        
        // Consignee & Department
        consignee: formData.consignee,
        department: parseInt(formData.department),
        receiving_store: parseInt(formData.receiving_store),
        
        // Delivery Details
        date_of_delivery: formData.date_of_delivery || null,
        delivery_type: formData.delivery_type,
        date_of_inspection: formData.date_of_inspection || null,
        
        // Stock Register Details
        stock_register_no: formData.stock_register_no || null,
        stock_register_page_no: formData.stock_register_page_no || null,
        stock_entry_date: formData.stock_entry_date || null,
        
        // Consignee Signature
        consignee_name: formData.consignee_name || null,
        consignee_designation: formData.consignee_designation || null,
        
        // Central Store Details
        dead_stock_register_no: formData.dead_stock_register_no || null,
        dead_stock_page_no: formData.dead_stock_page_no || null,
        central_store_entry_date: formData.central_store_entry_date || null,
        manager_central_store: formData.manager_central_store || null,
        
        // Finance Details
        finance_check_date: formData.finance_check_date || null,
        assistant_director_finance: formData.assistant_director_finance || null,
        
        // Other
        remarks: formData.remarks || null,
        status: 'DRAFT',
        
        // Inspection Items - properly formatted
        inspection_items: inspectionItems.map(item => ({
          item: parseInt(item.item),
          tendered_quantity: parseInt(item.tendered_quantity),
          accepted_quantity: parseInt(item.accepted_quantity),
          rejected_quantity: parseInt(item.rejected_quantity),
          unit_price: parseFloat(item.unit_price),
          remarks: item.remarks || null
        }))
      };

      // If there's an image, use FormData, otherwise use JSON
      let response;
      
      if (certificateImage) {
        const formDataToSend = new FormData();
        
        // Append all fields
        Object.keys(payload).forEach(key => {
          if (key === 'inspection_items') {
            // Send inspection_items as JSON string
            formDataToSend.append('inspection_items', JSON.stringify(payload.inspection_items));
          } else if (payload[key] !== null && payload[key] !== undefined) {
            formDataToSend.append(key, payload[key]);
          }
        });
        
        // Append image
        formDataToSend.append('certificate_image', certificateImage);
        
        response = await fetch(`${API_BASE}/inspection-certificates/`, {
          method: 'POST',
          body: formDataToSend
        });
      } else {
        // No image, use JSON
        response = await fetch(`${API_BASE}/inspection-certificates/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload)
        });
      }
      
      if (response.ok) {
        alert('Inspection certificate created successfully!');
        onSuccess();
      } else {
        const error = await response.json();
        console.error('Error response:', error);
        alert('Error: ' + JSON.stringify(error));
      }
    } catch (error) {
      console.error('Error creating inspection:', error);
      alert('Error creating inspection certificate: ' + error.message);
    }
  };

  const stores = locations.filter(l => l.is_store);
  const departments = locations.filter(l => l.location_type === 'DEPARTMENT');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto">
        <div className="p-4 border-b flex justify-between items-center sticky top-0 bg-white z-10">
          <div>
            <h3 className="text-base font-semibold">New Inspection Certificate</h3>
            <p className="text-xs text-gray-500 mt-1">Complete all sections for the inspection certificate</p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X size={18} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4">
          {/* Section Navigation */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            {[
              { id: 1, name: 'Basic Info' },
              { id: 2, name: 'Contract & Indent' },
              { id: 3, name: 'Delivery & Items' },
              { id: 4, name: 'Registers & Signatures' },
              { id: 5, name: 'Review' }
            ].map((section) => (
              <button
                key={section.id}
                type="button"
                onClick={() => setCurrentSection(section.id)}
                className={`px-4 py-2 rounded text-sm whitespace-nowrap ${
                  currentSection === section.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {section.id}. {section.name}
              </button>
            ))}
          </div>

          {/* Section 1: Basic Information */}
          {currentSection === 1 && (
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-gray-700 border-b pb-2">Basic Information</h4>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1">Certificate No *</label>
                  <input
                    type="text"
                    required
                    value={formData.certificate_no}
                    onChange={(e) => setFormData({...formData, certificate_no: e.target.value})}
                    className="w-full px-3 py-2 border rounded text-sm"
                    placeholder="e.g., IC-2025-001"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Inspection Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                    className="w-full px-3 py-2 border rounded text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1">Inspected By *</label>
                  <input
                    type="text"
                    required
                    value={formData.inspected_by}
                    onChange={(e) => setFormData({...formData, inspected_by: e.target.value})}
                    className="w-full px-3 py-2 border rounded text-sm"
                    placeholder="Name of inspector"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Date of Inspection</label>
                  <input
                    type="date"
                    value={formData.date_of_inspection}
                    onChange={(e) => setFormData({...formData, date_of_inspection: e.target.value})}
                    className="w-full px-3 py-2 border rounded text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium mb-1">Certificate Image (Optional)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                    id="certificate-image"
                  />
                  <label
                    htmlFor="certificate-image"
                    className="px-3 py-2 bg-gray-100 text-gray-700 rounded text-sm cursor-pointer hover:bg-gray-200 flex items-center gap-2"
                  >
                    <Upload size={16} />
                    {certificateImage ? certificateImage.name : 'Choose File'}
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium mb-1">General Remarks</label>
                <textarea
                  value={formData.remarks}
                  onChange={(e) => setFormData({...formData, remarks: e.target.value})}
                  className="w-full px-3 py-2 border rounded text-sm"
                  rows="2"
                  placeholder="Any general notes or remarks"
                />
              </div>
            </div>
          )}

          {/* Section 2: Contract & Indent Details */}
          {currentSection === 2 && (
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-gray-700 border-b pb-2">Contract & Indent Details</h4>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1">Contract No *</label>
                  <input
                    type="text"
                    required
                    value={formData.contract_no}
                    onChange={(e) => setFormData({...formData, contract_no: e.target.value})}
                    className="w-full px-3 py-2 border rounded text-sm"
                    placeholder="e.g., CTR-2025-001"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Contract Date</label>
                  <input
                    type="date"
                    value={formData.contract_date}
                    onChange={(e) => setFormData({...formData, contract_date: e.target.value})}
                    className="w-full px-3 py-2 border rounded text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium mb-1">Contractor Name *</label>
                <input
                  type="text"
                  required
                  value={formData.contractor_name}
                  onChange={(e) => setFormData({...formData, contractor_name: e.target.value})}
                  className="w-full px-3 py-2 border rounded text-sm"
                  placeholder="Full name of contractor/supplier"
                />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1">Contractor Address</label>
                <textarea
                  value={formData.contractor_address}
                  onChange={(e) => setFormData({...formData, contractor_address: e.target.value})}
                  className="w-full px-3 py-2 border rounded text-sm"
                  rows="2"
                  placeholder="Complete address of contractor"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1">Indent No *</label>
                  <input
                    type="text"
                    required
                    value={formData.indent_no}
                    onChange={(e) => setFormData({...formData, indent_no: e.target.value})}
                    className="w-full px-3 py-2 border rounded text-sm"
                    placeholder="e.g., IND-2025-001"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Indenter *</label>
                  <input
                    type="text"
                    required
                    value={formData.indenter}
                    onChange={(e) => setFormData({...formData, indenter: e.target.value})}
                    className="w-full px-3 py-2 border rounded text-sm"
                    placeholder="Name of person who made indent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1">Consignee *</label>
                  <input
                    type="text"
                    required
                    value={formData.consignee}
                    onChange={(e) => setFormData({...formData, consignee: e.target.value})}
                    className="w-full px-3 py-2 border rounded text-sm"
                    placeholder="Name of consignee"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Department *</label>
                  <select
                    required
                    value={formData.department}
                    onChange={(e) => setFormData({...formData, department: e.target.value})}
                    className="w-full px-3 py-2 border rounded text-sm"
                  >
                    <option value="">Select Department</option>
                    {departments.map(loc => (
                      <option key={loc.id} value={loc.id}>{loc.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Section 3: Delivery Details & Items */}
          {currentSection === 3 && (
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-gray-700 border-b pb-2">Delivery Details</h4>
              
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1">Date of Delivery</label>
                  <input
                    type="date"
                    value={formData.date_of_delivery}
                    onChange={(e) => setFormData({...formData, date_of_delivery: e.target.value})}
                    className="w-full px-3 py-2 border rounded text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Delivery Type *</label>
                  <select
                    required
                    value={formData.delivery_type}
                    onChange={(e) => setFormData({...formData, delivery_type: e.target.value})}
                    className="w-full px-3 py-2 border rounded text-sm"
                  >
                    <option value="FULL">Full Delivery</option>
                    <option value="PART">Partial Delivery</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Receiving Store *</label>
                  <select
                    required
                    value={formData.receiving_store}
                    onChange={(e) => setFormData({...formData, receiving_store: e.target.value})}
                    className="w-full px-3 py-2 border rounded text-sm"
                  >
                    <option value="">Select Store</option>
                    {stores.map(loc => (
                      <option key={loc.id} value={loc.id}>{loc.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="border-t pt-4 mt-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Inspection Items</h4>
                
                {/* Add Item Form */}
                <div className="bg-gray-50 p-3 rounded mb-3">
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <div>
                      <label className="block text-xs font-medium mb-1">Item *</label>
                      <select
                        value={currentItem.item}
                        onChange={(e) => setCurrentItem({...currentItem, item: e.target.value})}
                        className="w-full px-2 py-1.5 border rounded text-sm"
                      >
                        <option value="">Select Item</option>
                        {items.map(item => (
                          <option key={item.id} value={item.id}>{item.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">Tendered Qty *</label>
                      <input
                        type="number"
                        min="0"
                        value={currentItem.tendered_quantity}
                        onChange={(e) => setCurrentItem({...currentItem, tendered_quantity: parseInt(e.target.value) || 0})}
                        className="w-full px-2 py-1.5 border rounded text-sm"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-4 gap-2 mb-2">
                    <div>
                      <label className="block text-xs font-medium mb-1">Accepted *</label>
                      <input
                        type="number"
                        min="0"
                        value={currentItem.accepted_quantity}
                        onChange={(e) => setCurrentItem({...currentItem, accepted_quantity: parseInt(e.target.value) || 0})}
                        className="w-full px-2 py-1.5 border rounded text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">Rejected</label>
                      <input
                        type="number"
                        min="0"
                        value={currentItem.rejected_quantity}
                        onChange={(e) => setCurrentItem({...currentItem, rejected_quantity: parseInt(e.target.value) || 0})}
                        className="w-full px-2 py-1.5 border rounded text-sm"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-medium mb-1">Unit Price</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={currentItem.unit_price}
                        onChange={(e) => setCurrentItem({...currentItem, unit_price: parseFloat(e.target.value) || 0})}
                        className="w-full px-2 py-1.5 border rounded text-sm"
                      />
                    </div>
                  </div>

                  {currentItem.rejected_quantity > 0 && (
                    <div className="mb-2">
                      <label className="block text-xs font-medium mb-1">Rejection Reason</label>
                      <input
                        type="text"
                        value={currentItem.remarks}
                        onChange={(e) => setCurrentItem({...currentItem, remarks: e.target.value})}
                        className="w-full px-2 py-1.5 border rounded text-sm"
                        placeholder="Reason for rejection"
                      />
                    </div>
                  )}
                  
                  <button
                    type="button"
                    onClick={addInspectionItem}
                    className="w-full px-3 py-1.5 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                  >
                    + Add Item
                  </button>
                </div>

                {/* Items List */}
                {inspectionItems.length > 0 && (
                  <div className="border rounded overflow-hidden">
                    <table className="w-full text-xs">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          <th className="px-2 py-1.5 text-left">Item</th>
                          <th className="px-2 py-1.5 text-left">Tendered</th>
                          <th className="px-2 py-1.5 text-left">Accepted</th>
                          <th className="px-2 py-1.5 text-left">Rejected</th>
                          <th className="px-2 py-1.5 text-left">Price</th>
                          <th className="px-2 py-1.5"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {inspectionItems.map((item, idx) => (
                          <tr key={idx}>
                            <td className="px-2 py-1.5">{item.item_name}</td>
                            <td className="px-2 py-1.5">{item.tendered_quantity}</td>
                            <td className="px-2 py-1.5">{item.accepted_quantity}</td>
                            <td className="px-2 py-1.5">{item.rejected_quantity}</td>
                            <td className="px-2 py-1.5">{item.unit_price}</td>
                            <td className="px-2 py-1.5">
                              <button
                                type="button"
                                onClick={() => removeInspectionItem(idx)}
                                className="text-red-600 hover:text-red-800"
                              >
                                Remove
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Section 4: Registers & Signatures */}
          {currentSection === 4 && (
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-gray-700 border-b pb-2">Stock Register Details</h4>
              
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1">Stock Register No</label>
                  <input
                    type="text"
                    value={formData.stock_register_no}
                    onChange={(e) => setFormData({...formData, stock_register_no: e.target.value})}
                    className="w-full px-3 py-2 border rounded text-sm"
                    placeholder="e.g., SR-001"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Page No</label>
                  <input
                    type="text"
                    value={formData.stock_register_page_no}
                    onChange={(e) => setFormData({...formData, stock_register_page_no: e.target.value})}
                    className="w-full px-3 py-2 border rounded text-sm"
                    placeholder="e.g., 45"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Entry Date</label>
                  <input
                    type="date"
                    value={formData.stock_entry_date}
                    onChange={(e) => setFormData({...formData, stock_entry_date: e.target.value})}
                    className="w-full px-3 py-2 border rounded text-sm"
                  />
                </div>
              </div>

              <h4 className="text-sm font-semibold text-gray-700 border-b pb-2 mt-6">Consignee Signature Details</h4>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1">Consignee Name</label>
                  <input
                    type="text"
                    value={formData.consignee_name}
                    onChange={(e) => setFormData({...formData, consignee_name: e.target.value})}
                    className="w-full px-3 py-2 border rounded text-sm"
                    placeholder="Name for signature"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Designation</label>
                  <input
                    type="text"
                    value={formData.consignee_designation}
                    onChange={(e) => setFormData({...formData, consignee_designation: e.target.value})}
                    className="w-full px-3 py-2 border rounded text-sm"
                    placeholder="e.g., Professor, Lab Incharge"
                  />
                </div>
              </div>

              <h4 className="text-sm font-semibold text-gray-700 border-b pb-2 mt-6">Central Store Details</h4>
              
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1">Dead Stock Register No</label>
                  <input
                    type="text"
                    value={formData.dead_stock_register_no}
                    onChange={(e) => setFormData({...formData, dead_stock_register_no: e.target.value})}
                    className="w-full px-3 py-2 border rounded text-sm"
                    placeholder="e.g., DSR-001"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Page No</label>
                  <input
                    type="text"
                    value={formData.dead_stock_page_no}
                    onChange={(e) => setFormData({...formData, dead_stock_page_no: e.target.value})}
                    className="w-full px-3 py-2 border rounded text-sm"
                    placeholder="e.g., 12"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Entry Date</label>
                  <input
                    type="date"
                    value={formData.central_store_entry_date}
                    onChange={(e) => setFormData({...formData, central_store_entry_date: e.target.value})}
                    className="w-full px-3 py-2 border rounded text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium mb-1">Manager Central Store</label>
                <input
                  type="text"
                  value={formData.manager_central_store}
                  onChange={(e) => setFormData({...formData, manager_central_store: e.target.value})}
                  className="w-full px-3 py-2 border rounded text-sm"
                  placeholder="Name of Manager Central Store"
                />
              </div>

              <h4 className="text-sm font-semibold text-gray-700 border-b pb-2 mt-6">Finance Section</h4>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1">Finance Check Date</label>
                  <input
                    type="date"
                    value={formData.finance_check_date}
                    onChange={(e) => setFormData({...formData, finance_check_date: e.target.value})}
                    className="w-full px-3 py-2 border rounded text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Assistant Director Finance</label>
                  <input
                    type="text"
                    value={formData.assistant_director_finance}
                    onChange={(e) => setFormData({...formData, assistant_director_finance: e.target.value})}
                    className="w-full px-3 py-2 border rounded text-sm"
                    placeholder="Name"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Section 5: Review */}
          {currentSection === 5 && (
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-gray-700 border-b pb-2">Review & Submit</h4>
              
              <div className="bg-blue-50 border border-blue-200 rounded p-4">
                <h5 className="font-medium text-sm mb-2">Summary</h5>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><span className="text-gray-600">Certificate No:</span> <span className="font-medium">{formData.certificate_no || 'Not set'}</span></div>
                  <div><span className="text-gray-600">Date:</span> <span className="font-medium">{formData.date || 'Not set'}</span></div>
                  <div><span className="text-gray-600">Contractor:</span> <span className="font-medium">{formData.contractor_name || 'Not set'}</span></div>
                  <div><span className="text-gray-600">Contract No:</span> <span className="font-medium">{formData.contract_no || 'Not set'}</span></div>
                  <div><span className="text-gray-600">Items:</span> <span className="font-medium">{inspectionItems.length}</span></div>
                  <div><span className="text-gray-600">Receiving Store:</span> <span className="font-medium">{stores.find(s => s.id === parseInt(formData.receiving_store))?.name || 'Not set'}</span></div>
                </div>
              </div>

              {inspectionItems.length > 0 && (
                <div>
                  <h5 className="font-medium text-sm mb-2">Items to Inspect</h5>
                  <div className="border rounded overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs">Item</th>
                          <th className="px-3 py-2 text-left text-xs">Tendered</th>
                          <th className="px-3 py-2 text-left text-xs">Accepted</th>
                          <th className="px-3 py-2 text-left text-xs">Rejected</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {inspectionItems.map((item, idx) => (
                          <tr key={idx}>
                            <td className="px-3 py-2">{item.item_name}</td>
                            <td className="px-3 py-2">{item.tendered_quantity}</td>
                            <td className="px-3 py-2 text-green-600 font-medium">{item.accepted_quantity}</td>
                            <td className="px-3 py-2 text-red-600 font-medium">{item.rejected_quantity}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="bg-yellow-50 border border-yellow-200 rounded p-3 text-sm">
                <p className="text-yellow-800">
                  <strong>Note:</strong> This will create a DRAFT inspection certificate. 
                  You can review and confirm it later to create item instances and update inventory.
                </p>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between gap-2 pt-6 border-t mt-6">
            <div>
              {currentSection > 1 && (
                <button
                  type="button"
                  onClick={() => setCurrentSection(currentSection - 1)}
                  className="px-4 py-2 border rounded text-sm hover:bg-gray-50"
                >
                  ← Previous
                </button>
              )}
            </div>
            
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border rounded text-sm hover:bg-gray-50"
              >
                Cancel
              </button>
              
              {currentSection < 5 ? (
                <button
                  type="button"
                  onClick={() => setCurrentSection(currentSection + 1)}
                  className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                >
                  Next →
                </button>
              ) : (
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                >
                  Create Inspection Certificate
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

const InspectionDetailsModal = ({ inspection, onClose, onConfirm }) => {
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const downloadPdf = async () => {
    setDownloadingPdf(true);
    try {
      const res = await fetch(`${API_BASE}/inspection-certificates/${inspection.id}/download_pdf/`);
      
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `inspection_${inspection.certificate_no}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } else {
        const error = await res.json();
        alert('Error downloading PDF: ' + JSON.stringify(error));
      }
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert('Error downloading PDF');
    } finally {
      setDownloadingPdf(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto">
        <div className="p-4 border-b flex justify-between items-center sticky top-0 bg-white">
          <h3 className="text-base font-semibold">Inspection Certificate: {inspection.certificate_no}</h3>
          <div className="flex items-center gap-2">
            {/* Add Download PDF button */}
            <button
              onClick={downloadPdf}
              disabled={downloadingPdf}
              className="px-3 py-1.5 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:bg-gray-400 flex items-center gap-2"
              title="Download PDF"
            >
              <Download size={16} />
              {downloadingPdf ? 'Generating...' : 'Download PDF'}
            </button>
            <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
              <X size={18} />
            </button>
          </div>
        </div>
        
        <div className="p-4">
          <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
            <div>
              <span className="text-gray-600">Date:</span>
              <span className="ml-2 font-medium">{inspection.date}</span>
            </div>
            <div>
              <span className="text-gray-600">Status:</span>
              <span className="ml-2 font-medium">{inspection.status}</span>
            </div>
            <div>
              <span className="text-gray-600">Contractor:</span>
              <span className="ml-2 font-medium">{inspection.contractor_name}</span>
            </div>
            <div>
              <span className="text-gray-600">Department:</span>
              <span className="ml-2 font-medium">{inspection.department_name}</span>
            </div>
            <div>
              <span className="text-gray-600">Receiving Store:</span>
              <span className="ml-2 font-medium">{inspection.receiving_store_name}</span>
            </div>
          </div>

          {inspection.certificate_image_url && (
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Certificate Image:</label>
              <img
                src={inspection.certificate_image_url}
                alt="Certificate"
                className="max-w-full h-auto border rounded"
              />
            </div>
          )}

          <h4 className="text-sm font-semibold mb-2">Inspection Items</h4>
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs">Item</th>
                <th className="px-3 py-2 text-left text-xs">Tendered</th>
                <th className="px-3 py-2 text-left text-xs">Accepted</th>
                <th className="px-3 py-2 text-left text-xs">Rejected</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {inspection.inspection_items?.map((item, idx) => (
                <tr key={idx}>
                  <td className="px-3 py-2">{item.item_name}</td>
                  <td className="px-3 py-2">{item.tendered_quantity}</td>
                  <td className="px-3 py-2">{item.accepted_quantity}</td>
                  <td className="px-3 py-2">{item.rejected_quantity}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {inspection.summary && (
            <div className="mt-4 p-3 bg-blue-50 rounded text-sm">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <span className="text-gray-600">Total Items:</span>
                  <span className="ml-2 font-medium">{inspection.summary.total_items}</span>
                </div>
                <div>
                  <span className="text-gray-600">Accepted:</span>
                  <span className="ml-2 font-medium text-green-600">{inspection.summary.total_accepted}</span>
                </div>
                <div>
                  <span className="text-gray-600">Rejected:</span>
                  <span className="ml-2 font-medium text-red-600">{inspection.summary.total_rejected}</span>
                </div>
              </div>
            </div>
          )}

          {inspection.status === 'DRAFT' && (
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 border rounded text-sm hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => onConfirm(inspection.id)}
                className="px-4 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700"
              >
                Confirm & Create Instances
              </button>
            </div>
          )}
          
          {/* Show download button for confirmed inspections too */}
          {inspection.status === 'CONFIRMED' && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
              <p className="text-sm text-green-800 mb-2">
                ✓ This inspection has been confirmed. You can download the PDF certificate.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
// Part 2: StockEntryFormModal and AcknowledgmentModal Components
// This continues from dashboard_updated_part1.jsx

const StockEntryFormModal = ({ locations, items, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    entry_type: 'ISSUE',
    from_location: '',
    to_location: '',
    item: '',
    quantity: 1,
    purpose: '',
    remarks: '',
    is_temporary: false,
    expected_return_date: '',
    temporary_recipient: '',
    auto_create_instances: false,
    reference_entry: null  // Add reference entry field
  });

  const [availableInstances, setAvailableInstances] = useState([]);
  const [selectedInstances, setSelectedInstances] = useState([]);
  const [loadingInstances, setLoadingInstances] = useState(false);
  const [pendingTempIssues, setPendingTempIssues] = useState([]);
  const [selectedTempIssue, setSelectedTempIssue] = useState('');
  const [manualInstanceCodes, setManualInstanceCodes] = useState('');

  // Reference Entry Search State
  const [entrySearchTerm, setEntrySearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchingEntries, setSearchingEntries] = useState(false);
  const [selectedReferenceEntry, setSelectedReferenceEntry] = useState(null);

  const stores = locations.filter(l => l.is_store);
  const nonStores = locations.filter(l => !l.is_store);

  // Search for stock entries by entry number
  const searchStockEntries = async (searchTerm) => {
    if (!searchTerm || searchTerm.length < 3) {
      setSearchResults([]);
      return;
    }

    setSearchingEntries(true);
    try {
      const res = await fetch(`${API_BASE}/stock-entries/`);
      if (res.ok) {
        const data = await res.json();
        // Filter entries that match the search term
        const filtered = data.filter(entry => 
          entry.entry_number.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setSearchResults(filtered);
      }
    } catch (error) {
      console.error('Error searching entries:', error);
    } finally {
      setSearchingEntries(false);
    }
  };

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.entry_type === 'CORRECTION' && entrySearchTerm) {
        searchStockEntries(entrySearchTerm);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [entrySearchTerm, formData.entry_type]);

  // Handle reference entry selection
  const selectReferenceEntry = (entry) => {
    setSelectedReferenceEntry(entry);
    setFormData(prev => ({ 
      ...prev, 
      reference_entry: entry.id,
      // Auto-fill related fields from the reference entry
      item: entry.item.toString(),
      from_location: entry.from_location?.toString() || '',
      to_location: entry.to_location?.toString() || '',
    }));
    setEntrySearchTerm(entry.entry_number);
    setSearchResults([]);
  };

  // Clear reference entry
  const clearReferenceEntry = () => {
    setSelectedReferenceEntry(null);
    setFormData(prev => ({ ...prev, reference_entry: null }));
    setEntrySearchTerm('');
    setSearchResults([]);
  };

  // Determine destination based on entry type
  const getDestinationOptions = () => {
    if (formData.entry_type === 'ISSUE') {
      return locations;
    } else if (formData.entry_type === 'RECEIPT') {
      return stores;
    }
    return locations;
  };

  const getSourceOptions = () => {
    if (formData.entry_type === 'ISSUE') {
      return stores;
    } else if (formData.entry_type === 'RECEIPT') {
      return locations;
    }
    return locations;
  };

  const isDestinationStore = () => {
    if (!formData.to_location) return false;
    const toLoc = locations.find(l => l.id === parseInt(formData.to_location));
    return toLoc?.is_store || false;
  };

  const isSourceStore = () => {
    if (!formData.from_location) return false;
    const fromLoc = locations.find(l => l.id === parseInt(formData.from_location));
    return fromLoc?.is_store || false;
  };

  useEffect(() => {
    if (formData.entry_type === 'ISSUE' && formData.to_location && !isDestinationStore()) {
      setFormData(prev => ({ ...prev, is_temporary: true }));
    }
  }, [formData.to_location, formData.entry_type]);

  useEffect(() => {
    if (formData.entry_type === 'RECEIPT' && formData.from_location && !isSourceStore()) {
      fetchPendingTempIssues(formData.from_location);
    } else {
      setPendingTempIssues([]);
      setSelectedTempIssue('');
    }
  }, [formData.entry_type, formData.from_location]);

  const fetchPendingTempIssues = async (locationId) => {
    try {
      const res = await fetch(`${API_BASE}/stock-entries/?entry_type=ISSUE&is_temporary=true&status=COMPLETED`);
      if (res.ok) {
        const data = await res.json();
        const relevant = data.filter(entry => 
          entry.to_location === parseInt(locationId) && !entry.actual_return_date
        );
        setPendingTempIssues(relevant);
      }
    } catch (error) {
      console.error('Error fetching pending temp issues:', error);
    }
  };

  useEffect(() => {
    if (selectedTempIssue) {
      const issue = pendingTempIssues.find(i => i.id === parseInt(selectedTempIssue));
      if (issue) {
        setFormData(prev => ({
          ...prev,
          from_location: issue.to_location.toString(),
          to_location: issue.from_location.toString(),
          item: issue.item.toString(),
          quantity: issue.quantity,
          purpose: `Return from temporary issue ${issue.entry_number}`,
        }));
        if (issue.instances_details) {
          setSelectedInstances(issue.instances_details.map(inst => inst.id));
        }
      }
    }
  }, [selectedTempIssue]);

  useEffect(() => {
    const shouldFetch = formData.from_location && formData.item && 
      (formData.entry_type !== 'RECEIPT' || !formData.auto_create_instances);
    
    if (shouldFetch) {
      fetchAvailableInstances();
    } else {
      setAvailableInstances([]);
      setSelectedInstances([]);
    }
  }, [formData.from_location, formData.item, formData.auto_create_instances, formData.entry_type]);

  const fetchAvailableInstances = async () => {
    setLoadingInstances(true);
    try {
      let statusFilter = 'IN_STORE';
      
      if (formData.entry_type === 'RECEIPT' && formData.from_location) {
        const fromLoc = locations.find(l => l.id === parseInt(formData.from_location));
        if (fromLoc && !fromLoc.is_store) {
          statusFilter = 'TEMPORARY_ISSUED';
        }
      }
      
      const res = await fetch(
        `${API_BASE}/item-instances/?location=${formData.from_location}&item=${formData.item}&status=${statusFilter}`
      );
      if (res.ok) {
        const data = await res.json();
        setAvailableInstances(data);
      }
    } catch (error) {
      console.error('Error fetching instances:', error);
    } finally {
      setLoadingInstances(false);
    }
  };

  const toggleInstanceSelection = (instanceId) => {
    if (selectedInstances.includes(instanceId)) {
      setSelectedInstances(selectedInstances.filter(id => id !== instanceId));
    } else {
      setSelectedInstances([...selectedInstances, instanceId]);
    }
  };

  const selectAllInstances = () => {
    const allIds = availableInstances.slice(0, formData.quantity).map(inst => inst.id);
    setSelectedInstances(allIds);
  };

  useEffect(() => {
    if (selectedInstances.length > 0) {
      setFormData(prev => ({ ...prev, quantity: selectedInstances.length }));
    }
  }, [selectedInstances]);

  const handleManualInstanceCodes = () => {
    const codes = manualInstanceCodes.split(/[\n,]+/).map(c => c.trim()).filter(c => c);
    fetchInstancesByCodes(codes);
  };

  const fetchInstancesByCodes = async (codes) => {
    try {
      const promises = codes.map(code => 
        fetch(`${API_BASE}/item-instances/scan/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ instance_code: code })
        }).then(res => res.json())
      );
      
      const results = await Promise.all(promises);
      const instances = results.filter(r => r.instance).map(r => r.instance);
      
      if (instances.length > 0) {
        setSelectedInstances(instances.map(inst => inst.id));
        setAvailableInstances(prev => {
          const newInsts = instances.filter(inst => !prev.find(p => p.id === inst.id));
          return [...prev, ...newInsts];
        });
        setManualInstanceCodes('');
      }
    } catch (error) {
      console.error('Error fetching instances by codes:', error);
      alert('Error fetching some instance codes');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (formData.entry_type === 'ISSUE' && !formData.from_location) {
      alert('Please select a source store');
      return;
    }

    if (!formData.to_location) {
      alert('Please select a destination location');
      return;
    }

    if (formData.is_temporary && !formData.expected_return_date) {
      alert('Please provide expected return date for temporary issues');
      return;
    }

    // CORRECTION-specific validation
    if (formData.entry_type === 'CORRECTION') {
      if (!formData.reference_entry) {
        alert('Please select a reference entry to correct');
        return;
      }
      if (!formData.purpose) {
        alert('Please provide a reason for the correction');
        return;
      }
      if (selectedInstances.length === 0) {
        alert('Please select instances for the correction');
        return;
      }
    } else {
      // For non-correction entries
      if (!formData.auto_create_instances && selectedInstances.length === 0) {
        alert('Please select instances or enable auto-create');
        return;
      }
    }

    const payload = {
      ...formData,
      instances: selectedInstances.length > 0 ? selectedInstances : undefined,
      expected_return_date: formData.expected_return_date || null,
      reference_entry: formData.reference_entry || null,  // Ensure this is sent
    };

    try {
      const res = await fetch(`${API_BASE}/stock-entries/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        if (formData.entry_type === 'CORRECTION') {
          alert(`Correction entry created successfully!\nEntry: ${data.entry_number}\nReference: ${data.reference_entry_number || selectedReferenceEntry?.entry_number}`);
        } else {
          alert(`Stock entry created successfully!\nEntry: ${data.entry_number}`);
        }
        onSuccess();
      } else {
        const error = await res.json();
        console.error('Error response:', error);
        alert('Error: ' + JSON.stringify(error));
      }
    } catch (error) {
      console.error('Error creating stock entry:', error);
      alert('Error creating stock entry: ' + error.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-auto">
        <div className="p-4 border-b flex justify-between items-center sticky top-0 bg-white z-10">
          <h3 className="text-base font-semibold">New Stock Entry</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X size={18} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4 space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">Entry Type</label>
            <select
              required
              value={formData.entry_type}
              onChange={(e) => {
                setFormData({...formData, entry_type: e.target.value});
                // Clear reference entry when changing type
                if (e.target.value !== 'CORRECTION') {
                  clearReferenceEntry();
                }
              }}
              className="w-full px-3 py-2 border rounded text-sm"
            >
              <option value="ISSUE">Issue (From Store)</option>
              <option value="RECEIPT">Receipt (To Store)</option>
              <option value="CORRECTION">Correction</option>
            </select>
          </div>

          {/* Reference Entry Search - Only for CORRECTION */}
          {formData.entry_type === 'CORRECTION' && (
            <div className="border rounded p-3 bg-orange-50">
              <label className="block text-sm font-medium mb-2">Reference Entry to Correct *</label>
              
              {!selectedReferenceEntry ? (
                <>
                  <div className="relative">
                    <input
                      type="text"
                      value={entrySearchTerm}
                      onChange={(e) => setEntrySearchTerm(e.target.value)}
                      placeholder="Search by entry number (e.g., ISSUE-20250101-0001)"
                      className="w-full px-3 py-2 border rounded text-sm pr-10"
                    />
                    {searchingEntries && (
                      <div className="absolute right-3 top-2.5">
                        <RefreshCw size={16} className="animate-spin text-gray-400" />
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    Type at least 3 characters to search for stock entries
                  </p>

                  {/* Search Results */}
                  {searchResults.length > 0 && (
                    <div className="mt-2 border rounded max-h-48 overflow-y-auto bg-white">
                      {searchResults.map((entry) => (
                        <div
                          key={entry.id}
                          onClick={() => selectReferenceEntry(entry)}
                          className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium text-sm">{entry.entry_number}</p>
                              <p className="text-xs text-gray-600 mt-1">
                                {entry.entry_type} • {entry.item_name}
                              </p>
                              <p className="text-xs text-gray-500">
                                {entry.from_location_name || 'N/A'} → {entry.to_location_name || 'N/A'}
                              </p>
                            </div>
                            <div className="text-right">
                              <span className={`px-2 py-0.5 rounded text-xs ${
                                entry.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                                entry.status === 'PENDING_ACK' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-gray-100 text-gray-700'
                              }`}>
                                {entry.status}
                              </span>
                              <p className="text-xs text-gray-500 mt-1">Qty: {entry.quantity}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {entrySearchTerm.length >= 3 && !searchingEntries && searchResults.length === 0 && (
                    <p className="text-sm text-gray-500 mt-2 text-center py-3 bg-gray-50 rounded">
                      No entries found matching "{entrySearchTerm}"
                    </p>
                  )}
                </>
              ) : (
                /* Selected Reference Entry Display */
                <div className="bg-white border rounded p-3">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-medium text-sm">{selectedReferenceEntry.entry_number}</p>
                      <p className="text-xs text-gray-600 mt-1">
                        {selectedReferenceEntry.entry_type} • {selectedReferenceEntry.item_name}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={clearReferenceEntry}
                      className="text-red-600 hover:text-red-800 text-xs"
                    >
                      Change
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-gray-600">From:</span>
                      <span className="ml-1 font-medium">{selectedReferenceEntry.from_location_name || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">To:</span>
                      <span className="ml-1 font-medium">{selectedReferenceEntry.to_location_name || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Quantity:</span>
                      <span className="ml-1 font-medium">{selectedReferenceEntry.quantity}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Status:</span>
                      <span className={`ml-1 px-2 py-0.5 rounded text-xs ${
                        selectedReferenceEntry.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                        selectedReferenceEntry.status === 'PENDING_ACK' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {selectedReferenceEntry.status}
                      </span>
                    </div>
                  </div>
                  {selectedReferenceEntry.purpose && (
                    <p className="text-xs text-gray-600 mt-2">
                      <span className="font-medium">Purpose:</span> {selectedReferenceEntry.purpose}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Info message for CORRECTION */}
          {formData.entry_type === 'CORRECTION' && selectedReferenceEntry && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded text-sm">
              <p className="text-blue-800">
                <strong>Note:</strong> This correction entry will reference {selectedReferenceEntry.entry_number}. 
                The fields below have been auto-filled from the reference entry. Adjust as needed for the correction.
              </p>
            </div>
          )}

          {/* Show pending temp issues for RECEIPT from non-store */}
          {formData.entry_type === 'RECEIPT' && pendingTempIssues.length > 0 && (
            <div className="border rounded p-3 bg-purple-50">
              <label className="block text-sm font-medium mb-2">Pending Temporary Issues (Optional)</label>
              <select
                value={selectedTempIssue}
                onChange={(e) => setSelectedTempIssue(e.target.value)}
                className="w-full px-3 py-2 border rounded text-sm"
              >
                <option value="">-- Select a pending issue or enter manually --</option>
                {pendingTempIssues.map(issue => (
                  <option key={issue.id} value={issue.id}>
                    {issue.entry_number} - {issue.item_name} ({issue.quantity} items) - {issue.temporary_recipient || 'N/A'}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-600 mt-1">
                Or leave empty to manually enter instance codes below
              </p>
            </div>
          )}

          {/* Source and Destination - Rest of the form remains the same */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">
                {formData.entry_type === 'ISSUE' ? 'From Store *' : 'From Location'}
              </label>
              <select
                value={formData.from_location}
                onChange={(e) => setFormData({...formData, from_location: e.target.value})}
                className="w-full px-3 py-2 border rounded text-sm"
                required={formData.entry_type !== 'RECEIPT'}
                disabled={formData.entry_type === 'CORRECTION' && selectedReferenceEntry}
              >
                <option value="">Select Location</option>
                {getSourceOptions().map(loc => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name} {loc.is_store && '(Store)'}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                {formData.entry_type === 'RECEIPT' ? 'To Store *' : 'To Location *'}
              </label>
              <select
                required
                value={formData.to_location}
                onChange={(e) => setFormData({...formData, to_location: e.target.value})}
                className="w-full px-3 py-2 border rounded text-sm"
                disabled={formData.entry_type === 'CORRECTION' && selectedReferenceEntry}
              >
                <option value="">Select Location</option>
                {getDestinationOptions().map(loc => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name} {loc.is_store && '(Store)'}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Show info about store-to-store transfer */}
          {formData.entry_type === 'ISSUE' && formData.to_location && isDestinationStore() && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded text-sm">
              <p className="font-medium text-yellow-800">Store-to-Store Transfer</p>
              <p className="text-yellow-700 text-xs mt-1">
                This transfer will require acknowledgment from the receiving store before items are moved.
              </p>
            </div>
          )}

          {/* Show info about temporary issue */}
          {formData.entry_type === 'ISSUE' && formData.to_location && !isDestinationStore() && (
            <div className="p-3 bg-purple-50 border border-purple-200 rounded text-sm">
              <p className="font-medium text-purple-800">Temporary Issue</p>
              <p className="text-purple-700 text-xs mt-1">
                Items issued to non-store locations are automatically marked as temporary and remain in your inventory.
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">Item *</label>
            <select
              required
              value={formData.item}
              onChange={(e) => setFormData({...formData, item: e.target.value})}
              className="w-full px-3 py-2 border rounded text-sm"
              disabled={formData.entry_type === 'CORRECTION' && selectedReferenceEntry}
            >
              <option value="">Select Item</option>
              {items.map(item => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </select>
          </div>

          {/* Temporary Issue Details */}
          {formData.is_temporary && formData.entry_type === 'ISSUE' && (
            <div className="border rounded p-3 bg-blue-50 space-y-2">
              <div>
                <label className="block text-xs font-medium mb-1">Expected Return Date *</label>
                <input
                  type="date"
                  required
                  value={formData.expected_return_date}
                  onChange={(e) => setFormData({...formData, expected_return_date: e.target.value})}
                  className="w-full px-2 py-1.5 border rounded text-sm"
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Recipient Name</label>
                <input
                  type="text"
                  value={formData.temporary_recipient}
                  onChange={(e) => setFormData({...formData, temporary_recipient: e.target.value})}
                  className="w-full px-2 py-1.5 border rounded text-sm"
                  placeholder="Person receiving the items"
                />
              </div>
            </div>
          )}

          {/* Auto-create instances option for RECEIPT */}
          {formData.entry_type === 'RECEIPT' && !selectedTempIssue && (
            <div className="border rounded p-2 bg-yellow-50">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.auto_create_instances}
                  onChange={(e) => setFormData({...formData, auto_create_instances: e.target.checked})}
                  className="cursor-pointer"
                />
                <span className="text-xs font-medium">Auto-create new instances (for new items)</span>
              </label>
            </div>
          )}

          {!formData.auto_create_instances && (
            <div>
              <label className="block text-sm font-medium mb-1">Quantity</label>
              <input
                type="number"
                required
                min="1"
                value={formData.quantity}
                onChange={(e) => setFormData({...formData, quantity: parseInt(e.target.value)})}
                className="w-full px-3 py-2 border rounded text-sm"
                disabled={selectedInstances.length > 0}
              />
            </div>
          )}

          {/* Instance Selection - continues as before... */}
          {formData.from_location && formData.item && !formData.auto_create_instances && (
            <div className="border-t pt-3">
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-sm font-semibold">
                  Select Instances
                  {loadingInstances && <span className="ml-2 text-xs text-gray-500">(Loading...)</span>}
                </h4>
                {availableInstances.length > 0 && (
                  <button
                    type="button"
                    onClick={selectAllInstances}
                    className="text-xs text-blue-600 hover:text-blue-800"
                  >
                    Select First {Math.min(formData.quantity, availableInstances.length)}
                  </button>
                )}
              </div>

              {/* Manual Instance Code Entry */}
              <div className="mb-3 p-2 bg-gray-50 rounded">
                <label className="block text-xs font-medium mb-1">Or Enter Instance Codes Manually:</label>
                <textarea
                  value={manualInstanceCodes}
                  onChange={(e) => setManualInstanceCodes(e.target.value)}
                  placeholder="Enter instance codes (one per line or comma-separated)"
                  className="w-full px-2 py-1.5 border rounded text-xs"
                  rows="2"
                />
                <button
                  type="button"
                  onClick={handleManualInstanceCodes}
                  className="mt-1 px-3 py-1 bg-gray-600 text-white rounded text-xs hover:bg-gray-700"
                  disabled={!manualInstanceCodes.trim()}
                >
                  Add Instances
                </button>
              </div>
              
              {availableInstances.length === 0 && !loadingInstances && (
                <div className="text-sm text-gray-500 py-3 text-center bg-gray-50 rounded">
                  No instances available at this location
                </div>
              )}
              
              {availableInstances.length > 0 && (
                <div className="max-h-48 overflow-y-auto border rounded">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-2 py-1.5 text-left">Select</th>
                        <th className="px-2 py-1.5 text-left">Instance Code</th>
                        <th className="px-2 py-1.5 text-left">Condition</th>
                        <th className="px-2 py-1.5 text-left">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {availableInstances.map((inst) => (
                        <tr 
                          key={inst.id} 
                          className={`hover:bg-gray-50 cursor-pointer ${
                            selectedInstances.includes(inst.id) ? 'bg-blue-50' : ''
                          }`}
                          onClick={() => toggleInstanceSelection(inst.id)}
                        >
                          <td className="px-2 py-1.5">
                            <input
                              type="checkbox"
                              checked={selectedInstances.includes(inst.id)}
                              onChange={() => {}}
                              className="cursor-pointer"
                            />
                          </td>
                          <td className="px-2 py-1.5 font-mono">{inst.instance_code}</td>
                          <td className="px-2 py-1.5">{inst.condition}</td>
                          <td className="px-2 py-1.5">{inst.current_status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              
              {selectedInstances.length > 0 && (
                <div className="mt-2 text-xs text-gray-600">
                  Selected: {selectedInstances.length} instance(s)
                </div>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">Purpose {formData.entry_type === 'CORRECTION' && '*'}</label>
            <input
              type="text"
              value={formData.purpose}
              onChange={(e) => setFormData({...formData, purpose: e.target.value})}
              className="w-full px-3 py-2 border rounded text-sm"
              placeholder={formData.entry_type === 'CORRECTION' ? 'Explain the reason for correction' : 'e.g., For lab experiment, Equipment maintenance, etc.'}
              required={formData.entry_type === 'CORRECTION'}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Remarks</label>
            <textarea
              value={formData.remarks}
              onChange={(e) => setFormData({...formData, remarks: e.target.value})}
              className="w-full px-3 py-2 border rounded text-sm"
              rows="2"
              placeholder={formData.entry_type === 'CORRECTION' ? 'Additional details about the correction' : ''}
            />
          </div>

          <div className="flex justify-end gap-2 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded text-sm hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
              disabled={
                (!formData.auto_create_instances && 
                formData.from_location && 
                formData.item &&
                selectedInstances.length === 0) ||
                (formData.entry_type === 'CORRECTION' && !formData.reference_entry)
              }
            >
              Create Entry
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// AcknowledgmentModal Component
const AcknowledgmentModal = ({ entry, onClose, onAcknowledge }) => {
  const [acceptedInstances, setAcceptedInstances] = useState([]);
  const [rejectedInstances, setRejectedInstances] = useState([]);
  const [rejectionReasons, setRejectionReasons] = useState({});

  useEffect(() => {
    if (entry.instances_details && entry.instances_details.length > 0) {
      // By default, accept all instances
      const allIds = entry.instances_details.map(inst => inst.id);
      setAcceptedInstances(allIds);
    }
  }, [entry.id]);

  const toggleInstanceAcceptance = (instanceId) => {
    if (acceptedInstances.includes(instanceId)) {
      // Move to rejected
      setAcceptedInstances(prev => prev.filter(id => id !== instanceId));
      setRejectedInstances(prev => [...prev, instanceId]);
    } else {
      // Move to accepted
      setRejectedInstances(prev => prev.filter(id => id !== instanceId));
      setAcceptedInstances(prev => [...prev, instanceId]);
    }
  };

  const acceptAll = () => {
    const allIds = entry.instances_details.map(inst => inst.id);
    setAcceptedInstances(allIds);
    setRejectedInstances([]);
    setRejectionReasons({});
  };

  const handleSubmit = () => {
    if (acceptedInstances.length === 0 && rejectedInstances.length === 0) {
      alert('Please accept or reject at least one instance');
      return;
    }

    // Validate rejection reasons
    const rejectedItems = rejectedInstances.map(id => ({
      id,
      reason: rejectionReasons[id] || ''
    }));

    const missingReasons = rejectedItems.filter(item => !item.reason);
    if (missingReasons.length > 0) {
      alert('Please provide rejection reasons for all rejected items');
      return;
    }

    onAcknowledge(entry.id, acceptedInstances, rejectedItems);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto">
        <div className="p-4 border-b flex justify-between items-center sticky top-0 bg-white z-10">
          <div>
            <h3 className="text-base font-semibold">Acknowledge Stock Transfer</h3>
            <p className="text-xs text-gray-500">Entry: {entry.entry_number}</p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X size={18} />
          </button>
        </div>
        
        <div className="p-4">
          {/* Entry Details */}
          <div className="bg-gray-50 rounded p-3 mb-4 grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-gray-600">From Store:</span>
              <span className="ml-2 font-medium">{entry.from_location_name}</span>
            </div>
            <div>
              <span className="text-gray-600">To Store:</span>
              <span className="ml-2 font-medium">{entry.to_location_name}</span>
            </div>
            <div>
              <span className="text-gray-600">Item:</span>
              <span className="ml-2 font-medium">{entry.item_name}</span>
            </div>
            <div>
              <span className="text-gray-600">Quantity:</span>
              <span className="ml-2 font-medium">{entry.quantity}</span>
            </div>
            {entry.purpose && (
              <div className="col-span-2">
                <span className="text-gray-600">Purpose:</span>
                <span className="ml-2 font-medium">{entry.purpose}</span>
              </div>
            )}
          </div>

          {/* Instructions */}
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
            <p className="text-sm text-blue-800">
              <strong>Instructions:</strong> Review each item and mark as accepted or rejected. 
              Accepted items will be transferred to your store's inventory. 
              Rejected items will remain with the sender.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="mb-3 flex gap-2">
            <button
              type="button"
              onClick={acceptAll}
              className="px-3 py-1.5 bg-green-100 text-green-700 rounded text-sm hover:bg-green-200"
            >
              ✓ Accept All
            </button>
          </div>

          {/* Instances List */}
          {entry.instances_details && entry.instances_details.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold mb-2">Item Instances</h4>

              <div className="border rounded overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">Action</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">Instance Code</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">Condition</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">Current Status</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">Rejection Reason</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {entry.instances_details.map((inst) => {
                      const isAccepted = acceptedInstances.includes(inst.id);
                      const isRejected = rejectedInstances.includes(inst.id);
                      
                      return (
                        <tr 
                          key={inst.id} 
                          className={`${
                            isAccepted ? 'bg-green-50' : 
                            isRejected ? 'bg-red-50' : 
                            'hover:bg-gray-50'
                          }`}
                        >
                          <td className="px-3 py-2">
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => toggleInstanceAcceptance(inst.id)}
                                className={`px-2 py-1 rounded text-xs transition-colors ${
                                  isAccepted 
                                    ? 'bg-green-600 text-white' 
                                    : 'bg-gray-200 text-gray-700 hover:bg-green-100'
                                }`}
                              >
                                {isAccepted ? '✓ Accepted' : 'Accept'}
                              </button>
                              <button
                                type="button"
                                onClick={() => toggleInstanceAcceptance(inst.id)}
                                className={`px-2 py-1 rounded text-xs transition-colors ${
                                  isRejected 
                                    ? 'bg-red-600 text-white' 
                                    : 'bg-gray-200 text-gray-700 hover:bg-red-100'
                                }`}
                              >
                                {isRejected ? '✗ Rejected' : 'Reject'}
                              </button>
                            </div>
                          </td>
                          <td className="px-3 py-2 font-mono text-xs">{inst.instance_code}</td>
                          <td className="px-3 py-2">{inst.condition}</td>
                          <td className="px-3 py-2">
                            <span className="px-2 py-0.5 bg-gray-100 rounded text-xs">
                              {inst.current_status}
                            </span>
                          </td>
                          <td className="px-3 py-2">
                            {isRejected && (
                              <input
                                type="text"
                                placeholder="Reason for rejection (required)"
                                value={rejectionReasons[inst.id] || ''}
                                onChange={(e) => setRejectionReasons({
                                  ...rejectionReasons,
                                  [inst.id]: e.target.value
                                })}
                                className="w-full px-2 py-1 border rounded text-xs"
                                required
                              />
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="mt-3 p-3 bg-blue-50 rounded">
                <div className="flex justify-between text-sm">
                  <span className="text-green-700 font-medium">
                    ✓ Accepting: {acceptedInstances.length} instances
                  </span>
                  <span className="text-red-700 font-medium">
                    ✗ Rejecting: {rejectedInstances.length} instances
                  </span>
                </div>
                {acceptedInstances.length > 0 && (
                  <p className="text-xs text-gray-600 mt-2">
                    Accepted items will be added to your store's inventory and ownership will be transferred.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
            <button
              onClick={onClose}
              className="px-4 py-2 border rounded text-sm hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
            >
              Submit Acknowledgment
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const InventoryView = ({ locations }) => {
  const [inventory, setInventory] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [selectedItem, setSelectedItem] = useState('all');
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);

  const stores = locations.filter(l => l.is_store);

  useEffect(() => {
    fetchItems();
  }, []);

  useEffect(() => {
    fetchInventory();
  }, [selectedLocation, selectedItem]);

  const fetchItems = async () => {
    try {
      const res = await fetch(`${API_BASE}/items/`);
      if (res.ok) {
        const data = await res.json();
        setItems(data);
      }
    } catch (error) {
      console.error('Error fetching items:', error);
    }
  };

  const fetchInventory = async () => {
    setLoading(true);
    try {
      let url = `${API_BASE}/location-inventory/summary/`;
      const params = new URLSearchParams();
      
      if (selectedLocation !== 'all') {
        params.append('location', selectedLocation);
      }
      if (selectedItem !== 'all') {
        params.append('item', selectedItem);
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setInventory(data);
      }
    } catch (error) {
      console.error('Error fetching inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshInventory = async (locationId) => {
    if (!locationId) return;
    
    try {
      const res = await fetch(`${API_BASE}/location-inventory/refresh/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ location_id: locationId })
      });
      
      if (res.ok) {
        const data = await res.json();
        alert(data.message);
        fetchInventory();
      } else {
        const error = await res.json();
        alert('Error: ' + JSON.stringify(error));
      }
    } catch (error) {
      console.error('Error refreshing inventory:', error);
      alert('Error refreshing inventory');
    }
  };

  const exportToCSV = () => {
    if (inventory.length === 0) {
      alert('No data to export');
      return;
    }

    const headers = ['Store', 'Item', 'Item Code', 'Total', 'Available', 'In Transit', 'In Use', 'Temp Issued'];
    const rows = inventory.map(inv => [
      inv.location_name,
      inv.item_name,
      inv.item_code,
      inv.total_quantity,
      inv.available_quantity,
      inv.in_transit_quantity,
      inv.in_use_quantity,
      inv.temporary_issued_quantity || 0
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inventory_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  // Calculate totals
  const totals = inventory.reduce((acc, inv) => ({
    total: acc.total + inv.total_quantity,
    available: acc.available + inv.available_quantity,
    inTransit: acc.inTransit + inv.in_transit_quantity,
    inUse: acc.inUse + inv.in_use_quantity,
    tempIssued: acc.tempIssued + (inv.temporary_issued_quantity || 0)
  }), { total: 0, available: 0, inTransit: 0, inUse: 0, tempIssued: 0 });

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-xl font-semibold">Store Inventory</h2>
          <p className="text-sm text-gray-500 mt-1">View and manage inventory across all stores</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportToCSV}
            className="px-4 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700 flex items-center gap-2"
          >
            <Download size={16} />
            Export CSV
          </button>
          <button
            onClick={() => fetchInventory()}
            className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 flex items-center gap-2"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg p-4 mb-4 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <Filter size={16} className="text-gray-600" />
          <span className="text-sm font-medium text-gray-700">Filters</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium mb-1">Store Location</label>
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="w-full px-3 py-2 border rounded text-sm"
            >
              <option value="all">All Stores</option>
              {stores.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Item</label>
            <select
              value={selectedItem}
              onChange={(e) => setSelectedItem(e.target.value)}
              className="w-full px-3 py-2 border rounded text-sm"
            >
              <option value="all">All Items</option>
              {items.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} ({item.code})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-5 gap-4 mb-4">
        <SummaryCard title="Total Owned" value={totals.total} color="blue" />
        <SummaryCard title="Available" value={totals.available} color="green" />
        <SummaryCard title="In Transit" value={totals.inTransit} color="yellow" />
        <SummaryCard title="In Use" value={totals.inUse} color="purple" />
        <SummaryCard title="Temp Issued" value={totals.tempIssued} color="orange" />
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading inventory...</div>
        ) : inventory.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p>No inventory data found</p>
            <p className="text-sm mt-2">Try adjusting your filters or create some stock entries</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-600">Store</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-600">Item</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-600">Item Code</th>
                    <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-600">Total Owned</th>
                    <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-600">Available</th>
                    <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-600">In Transit</th>
                    <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-600">In Use</th>
                    <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-600">Temp Issued</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {inventory.map((inv) => (
                    <tr key={`${inv.location}-${inv.item}`} className="hover:bg-gray-50">
                      <td className="px-4 py-2.5 text-sm font-medium">{inv.location_name}</td>
                      <td className="px-4 py-2.5 text-sm">{inv.item_name}</td>
                      <td className="px-4 py-2.5 text-sm font-mono text-gray-600">{inv.item_code}</td>
                      <td className="px-4 py-2.5 text-sm text-right font-semibold">{inv.total_quantity}</td>
                      <td className="px-4 py-2.5 text-sm text-right">
                        <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded">
                          {inv.available_quantity}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-sm text-right">
                        {inv.in_transit_quantity > 0 ? (
                          <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded">
                            {inv.in_transit_quantity}
                          </span>
                        ) : (
                          <span className="text-gray-400">{inv.in_transit_quantity}</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-sm text-right">
                        {inv.in_use_quantity > 0 ? (
                          <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded">
                            {inv.in_use_quantity}
                          </span>
                        ) : (
                          <span className="text-gray-400">{inv.in_use_quantity}</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-sm text-right">
                        {inv.temporary_issued_quantity > 0 ? (
                          <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded">
                            {inv.temporary_issued_quantity}
                          </span>
                        ) : (
                          <span className="text-gray-400">{inv.temporary_issued_quantity || 0}</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-sm">
                        <button
                          onClick={() => refreshInventory(inv.location)}
                          className="text-blue-600 hover:text-blue-800 text-xs"
                          title="Recalculate inventory"
                        >
                          Recalculate
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50 border-t font-medium">
                  <tr>
                    <td colSpan="3" className="px-4 py-2.5 text-sm text-right">TOTALS:</td>
                    <td className="px-4 py-2.5 text-sm text-right">{totals.total}</td>
                    <td className="px-4 py-2.5 text-sm text-right">{totals.available}</td>
                    <td className="px-4 py-2.5 text-sm text-right">{totals.inTransit}</td>
                    <td className="px-4 py-2.5 text-sm text-right">{totals.inUse}</td>
                    <td className="px-4 py-2.5 text-sm text-right">{totals.tempIssued}</td>
                    <td className="px-4 py-2.5"></td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Legend */}
            <div className="p-4 bg-gray-50 border-t">
              <h4 className="text-xs font-semibold mb-2 text-gray-700">Inventory Breakdown:</h4>
              <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                <div>
                  <strong>Total Owned:</strong> All items sourced from this store (regardless of current location)
                </div>
                <div>
                  <strong>Available:</strong> Items currently at this store in IN_STORE status
                </div>
                <div>
                  <strong>In Transit:</strong> Items being transferred between stores
                </div>
                <div>
                  <strong>In Use:</strong> Items permanently issued to non-store locations
                </div>
                <div>
                  <strong>Temp Issued:</strong> Items temporarily loaned to non-store locations (will be returned)
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const SummaryCard = ({ title, value, color }) => {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
    green: 'bg-green-50 border-green-200 text-green-700',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-700',
    purple: 'bg-purple-50 border-purple-200 text-purple-700',
    orange: 'bg-orange-50 border-orange-200 text-orange-700',
  };

  return (
    <div className={`p-4 rounded-lg border-2 ${colorClasses[color]}`}>
      <p className="text-xs font-medium mb-1">{title}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
};

export const InstancesView = ({ locations, items }) => {
  const [instances, setInstances] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedInstance, setSelectedInstance] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchInstances();
  }, [selectedLocation, selectedStatus]);

  const fetchInstances = async () => {
    setLoading(true);
    try {
      let url = `${API_BASE}/item-instances/`;
      const params = new URLSearchParams();
      
      if (selectedLocation !== 'all') params.append('location', selectedLocation);
      if (selectedStatus !== 'all') params.append('status', selectedStatus);
      if (searchTerm) params.append('search', searchTerm);
      
      if (params.toString()) url += `?${params.toString()}`;
      
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setInstances(data);
      }
    } catch (error) {
      console.error('Error fetching instances:', error);
    } finally {
      setLoading(false);
    }
  };

  const viewQRCode = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/item-instances/${id}/qr_code/`);
      if (res.ok) {
        const data = await res.json();
        setSelectedInstance(data);
      }
    } catch (error) {
      console.error('Error fetching QR code:', error);
    }
  };

  const viewInstanceHistory = async (instanceCode) => {
    try {
      const res = await fetch(`${API_BASE}/item-instances/scan/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instance_code: instanceCode })
      });
      
      if (res.ok) {
        const data = await res.json();
        // Show history in a modal or navigate to history view
        alert(`Instance: ${data.instance.instance_code}\nMovements: ${data.movement_history.length} records`);
      }
    } catch (error) {
      console.error('Error fetching instance history:', error);
    }
  };

  const downloadQRCode = (data) => {
    const link = document.createElement('a');
    link.href = data.qr_code_data;
    link.download = `${data.instance_code}_QR.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToCSV = () => {
    if (instances.length === 0) {
      alert('No data to export');
      return;
    }

    const headers = ['Instance Code', 'Item', 'Source Store', 'Current Location', 'Status', 'Condition', 'Purchase Date'];
    const rows = instances.map(inst => [
      inst.instance_code,
      inst.item_name,
      inst.source_location_name,
      inst.current_location_name,
      inst.current_status,
      inst.condition,
      inst.purchase_date || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `instances_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-xl font-semibold">Item Instances</h2>
          <p className="text-sm text-gray-500 mt-1">Track individual items across all locations</p>
        </div>
        <button
          onClick={exportToCSV}
          className="px-4 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700 flex items-center gap-2"
        >
          <Download size={16} />
          Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg p-4 mb-4 shadow-sm">
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium mb-1">Search by Instance Code</label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g., ITEM-2025-0001"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchInstances()}
                className="flex-1 px-3 py-2 border rounded text-sm"
              />
              <button
                onClick={fetchInstances}
                className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
              >
                <Search size={16} />
              </button>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Location</label>
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="w-full px-3 py-2 border rounded text-sm"
            >
              <option value="all">All Locations</option>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name} {loc.is_store && '(Store)'}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 border rounded text-sm"
            >
              <option value="all">All Status</option>
              <option value="IN_STORE">In Store</option>
              <option value="IN_USE">In Use</option>
              <option value="IN_TRANSIT">In Transit</option>
              <option value="TEMPORARY_ISSUED">Temporary Issued</option>
              <option value="UNDER_REPAIR">Under Repair</option>
              <option value="DISPOSED">Disposed</option>
              <option value="LOST">Lost</option>
              <option value="CONDEMNED">Condemned</option>
            </select>
          </div>
        </div>
      </div>

      {/* Instances List */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading instances...</div>
        ) : instances.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p>No instances found</p>
            <p className="text-sm mt-2">Try adjusting your filters or create some inspection certificates</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-600">Instance Code</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-600">Item</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-600">Source Store</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-600">Current Location</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-600">Status</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-600">Condition</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {instances.map((inst) => (
                  <tr key={inst.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2.5 text-sm font-mono font-medium">{inst.instance_code}</td>
                    <td className="px-4 py-2.5 text-sm">{inst.item_name}</td>
                    <td className="px-4 py-2.5 text-sm">{inst.source_location_name}</td>
                    <td className="px-4 py-2.5 text-sm">{inst.current_location_name}</td>
                    <td className="px-4 py-2.5">
                      <span className={`px-2 py-1 rounded text-xs ${
                        inst.current_status === 'IN_STORE' ? 'bg-green-100 text-green-700' :
                        inst.current_status === 'IN_USE' ? 'bg-blue-100 text-blue-700' :
                        inst.current_status === 'IN_TRANSIT' ? 'bg-yellow-100 text-yellow-700' :
                        inst.current_status === 'TEMPORARY_ISSUED' ? 'bg-purple-100 text-purple-700' :
                        inst.current_status === 'UNDER_REPAIR' ? 'bg-orange-100 text-orange-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {inst.current_status}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-sm">
                      <span className={`px-2 py-0.5 rounded text-xs ${
                        inst.condition === 'NEW' ? 'bg-green-50 text-green-700' :
                        inst.condition === 'GOOD' ? 'bg-blue-50 text-blue-700' :
                        inst.condition === 'FAIR' ? 'bg-yellow-50 text-yellow-700' :
                        inst.condition === 'POOR' ? 'bg-orange-50 text-orange-700' :
                        'bg-red-50 text-red-700'
                      }`}>
                        {inst.condition}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex gap-2">
                        <button
                          onClick={() => viewQRCode(inst.id)}
                          className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
                          title="View QR Code"
                        >
                          <QrCode size={14} />
                          QR
                        </button>
                        <button
                          onClick={() => viewInstanceHistory(inst.instance_code)}
                          className="text-gray-600 hover:text-gray-800 text-sm flex items-center gap-1"
                          title="View History"
                        >
                          <MapPin size={14} />
                          History
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* QR Code Modal */}
      {selectedInstance && (
        <QRCodeModal
          instance={selectedInstance}
          onClose={() => setSelectedInstance(null)}
          onDownload={downloadQRCode}
        />
      )}
    </div>
  );
};

// QR Code Modal Component
const QRCodeModal = ({ instance, onClose, onDownload }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="p-4 border-b flex justify-between items-center">
          <h3 className="text-base font-semibold">QR Code</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X size={18} />
          </button>
        </div>
        
        <div className="p-6 text-center">
          <div className="mb-4">
            <img
              src={instance.qr_code_data}
              alt="QR Code"
              className="mx-auto border-2 border-gray-200 rounded"
            />
          </div>
          
          <div className="space-y-2 text-sm text-left bg-gray-50 p-4 rounded">
            <div>
              <span className="text-gray-600">Instance Code:</span>
              <span className="ml-2 font-mono font-medium">{instance.instance_code}</span>
            </div>
            <div>
              <span className="text-gray-600">Item:</span>
              <span className="ml-2 font-medium">{instance.item_name}</span>
            </div>
            <div>
              <span className="text-gray-600">Current Location:</span>
              <span className="ml-2 font-medium">{instance.current_location}</span>
            </div>
            <div>
              <span className="text-gray-600">Status:</span>
              <span className="ml-2 font-medium">{instance.status}</span>
            </div>
          </div>

          <div className="flex gap-2 mt-6">
            <button
              onClick={() => onDownload(instance)}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
            >
              Download QR Code
            </button>
            <button
              onClick={() => window.print()}
              className="flex-1 px-4 py-2 border rounded text-sm hover:bg-gray-50"
            >
              Print
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// QRScanView Component
export const QRScanView = () => {
  const [instanceCode, setInstanceCode] = useState('');
  const [instanceData, setInstanceData] = useState(null);
  const [loading, setLoading] = useState(false);

  const scanInstance = async () => {
    if (!instanceCode.trim()) {
      alert('Please enter an instance code');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/item-instances/scan/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instance_code: instanceCode.trim() })
      });
      
      if (res.ok) {
        const data = await res.json();
        setInstanceData(data);
      } else {
        alert('Instance not found');
        setInstanceData(null);
      }
    } catch (error) {
      console.error('Error scanning instance:', error);
      alert('Error scanning instance');
    } finally {
      setLoading(false);
    }
  };

  const clearScan = () => {
    setInstanceCode('');
    setInstanceData(null);
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">QR Code Scanner</h2>

      <div className="bg-white rounded-lg p-6 shadow-sm max-w-3xl">
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Enter Instance Code</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={instanceCode}
              onChange={(e) => setInstanceCode(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && scanInstance()}
              placeholder="e.g., ITEM-2025-0001"
              className="flex-1 px-4 py-3 border rounded text-sm font-mono"
              autoFocus
            />
            <button
              onClick={scanInstance}
              disabled={loading}
              className="px-6 py-3 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:bg-gray-400 flex items-center gap-2"
            >
              {loading ? 'Scanning...' : (
                <>
                  <QrCode size={18} />
                  Scan
                </>
              )}
            </button>
            {instanceData && (
              <button
                onClick={clearScan}
                className="px-4 py-3 border rounded text-sm hover:bg-gray-50"
              >
                Clear
              </button>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Scan or manually enter the instance code to view item details and movement history
          </p>
        </div>

        {instanceData && (
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">Instance Details</h3>
            
            {/* Instance Info Card */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 mb-4 border border-blue-200">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-600 mb-1">Instance Code</p>
                  <p className="font-mono font-bold text-lg">{instanceData.instance?.instance_code}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">Status</p>
                  <span className={`inline-block px-3 py-1 rounded text-sm font-medium ${
                    instanceData.instance?.current_status === 'IN_STORE' ? 'bg-green-100 text-green-700' :
                    instanceData.instance?.current_status === 'IN_USE' ? 'bg-blue-100 text-blue-700' :
                    instanceData.instance?.current_status === 'IN_TRANSIT' ? 'bg-yellow-100 text-yellow-700' :
                    instanceData.instance?.current_status === 'TEMPORARY_ISSUED' ? 'bg-purple-100 text-purple-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {instanceData.instance?.current_status}
                  </span>
                </div>
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <DetailCard label="Item" value={instanceData.instance?.item_name} />
              <DetailCard label="Item Code" value={instanceData.instance?.item_code} mono />
              <DetailCard label="Source Store" value={instanceData.instance?.source_location_name} />
              <DetailCard label="Current Location" value={instanceData.instance?.current_location_name} />
              <DetailCard label="Condition" value={instanceData.instance?.condition} />
              <DetailCard label="Purchase Date" value={instanceData.instance?.purchase_date || 'N/A'} />
            </div>

            {/* Movement History */}
            {instanceData.movement_history?.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <MapPin size={16} />
                  Movement History
                </h4>
                <div className="space-y-3">
                  {instanceData.movement_history.map((mov, idx) => (
                    <div key={idx} className="border-l-4 border-blue-500 pl-4 py-2 bg-gray-50 rounded-r">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 text-sm font-medium mb-1">
                            <span>{mov.from_location_name || 'N/A'}</span>
                            <span className="text-gray-400">→</span>
                            <span>{mov.to_location_name || 'N/A'}</span>
                          </div>
                          <div className="flex gap-3 text-xs text-gray-600">
                            <span>
                              Status: <span className="font-medium">{mov.previous_status}</span> → <span className="font-medium">{mov.new_status}</span>
                            </span>
                          </div>
                          {mov.remarks && (
                            <p className="text-xs text-gray-600 mt-1 italic">{mov.remarks}</p>
                          )}
                        </div>
                        <div className="text-right text-xs text-gray-500">
                          {new Date(mov.moved_at).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Detail Card Component
const DetailCard = ({ label, value, mono = false }) => (
  <div className="bg-gray-50 rounded p-3">
    <p className="text-xs text-gray-600 mb-1">{label}</p>
    <p className={`text-sm font-medium ${mono ? 'font-mono' : ''}`}>{value}</p>
  </div>
);

// Continue in next message due to length...
export default AssetManagementDashboard;