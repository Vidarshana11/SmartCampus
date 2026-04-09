import React, { useState, useEffect } from 'react';
import resourceService from '../services/resourceService';
import { useAuth } from '../auth/AuthProvider';
import { 
  FaBuilding, FaUsers, FaMapMarkerAlt, FaSearch, 
  FaFilter, FaExclamationCircle, FaSpinner, FaArrowRight 
} from 'react-icons/fa';

const TYPE_STYLES = {
  ROOM: { border: 'border-l-blue-500', badge: 'bg-blue-50 text-blue-700 border border-blue-200', dot: 'bg-blue-500' },
  LAB: { border: 'border-l-purple-500', badge: 'bg-purple-50 text-purple-700 border border-purple-200', dot: 'bg-purple-500' },
  EQUIPMENT: { border: 'border-l-orange-500', badge: 'bg-orange-50 text-orange-700 border border-orange-200', dot: 'bg-orange-500' }
};

const ResourceList = () => {
  const { token, loading: authLoading } = useAuth();
  const [resources, setResources] = useState([]);
  const [filters, setFilters] = useState({
    type: '',
    capacity: '',
    location: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchResources = async () => {
    if (!token) {
        setResources([]);
        setLoading(false);
        return;
    }

    setLoading(true);
    try {
      const data = await resourceService.getAllResources(token, filters);
      setResources(data);
      setError('');
    } catch (err) {
      console.error('Error fetching resources:', err);
      setError(err.response?.status === 403 ? 'Access denied. Administrator permissions required.' : 'Failed to load resources.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
        fetchResources();
    }
  }, [filters, token, authLoading]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  if (authLoading) {
      return (
          <div className="min-h-screen flex items-center justify-center bg-gray-50">
              <div className="flex items-center gap-3 text-gray-500 font-medium">
                <FaSpinner className="w-5 h-5 animate-spin" />
                Verifying access...
              </div>
          </div>
      );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <FaBuilding className="text-blue-600" />
                Campus Resources
              </h1>
              <p className="text-gray-600 mt-1">Explore and reserve available campus facilities and equipment</p>
            </div>
            <div className="bg-gray-100 px-4 py-2 rounded-lg border border-gray-200">
               <span className="text-sm font-semibold text-gray-700">{resources.length}</span>
               <span className="text-sm text-gray-500 ml-1.5">Assets Available</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Filters Bar */}
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2 text-gray-400">
                <FaFilter className="w-3.5 h-3.5" />
                <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Filters</span>
            </div>
            
            <select 
              name="type" 
              value={filters.type} 
              onChange={handleFilterChange} 
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-medium"
            >
              <option value="">All Types</option>
              <option value="ROOM">Room</option>
              <option value="LAB">Lab</option>
              <option value="EQUIPMENT">Equipment</option>
            </select>
            
            <div className="relative">
              <input 
                type="number" 
                name="capacity" 
                value={filters.capacity} 
                onChange={handleFilterChange} 
                placeholder="Min Capacity" 
                className="pl-4 pr-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 w-32 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
              />
            </div>
            
            <div className="relative flex-grow max-w-sm">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
              <input 
                type="text" 
                name="location" 
                value={filters.location} 
                onChange={handleFilterChange} 
                placeholder="Search location..." 
                className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
              />
            </div>

            <button 
              onClick={() => setFilters({ type: '', capacity: '', location: '' })}
              className="ml-auto text-sm text-gray-500 hover:text-blue-600 font-semibold transition-colors"
            >
              Clear All
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 font-medium mb-8 flex items-center gap-3">
            <FaExclamationCircle className="w-5 h-5" />
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-gray-400">
            <FaSpinner className="w-8 h-8 animate-spin text-blue-500" />
            <span className="font-medium">Curating campus assets...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {resources.length > 0 ? (
              resources.map(resource => {
                const s = TYPE_STYLES[resource.type] || TYPE_STYLES.ROOM;
                return (
                  <div key={resource.id} className={`bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all cursor-pointer border-l-4 ${s.border} group`}>
                    <div className="p-6">
                      {/* Card Header */}
                      <div className="flex items-start justify-between mb-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${s.badge}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${s.dot} mr-1.5`}></span>
                          {resource.type}
                        </span>
                        <div className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider ${
                          resource.status === 'ACTIVE' ? 'text-green-600' : 'text-red-500'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${resource.status === 'ACTIVE' ? 'bg-green-600' : 'bg-red-500'}`}></span>
                          {resource.status}
                        </div>
                      </div>
                      
                      <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">
                        {resource.name}
                      </h3>
                      
                      <p className="text-sm text-gray-600 mb-5 line-clamp-2 leading-relaxed h-10">
                        {resource.description || 'No detailed description provided for this campus asset.'}
                      </p>
                      
                      {/* Meta Info */}
                      <div className="flex flex-col gap-2 pt-4 border-t border-gray-100">
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <FaMapMarkerAlt className="w-3.5 h-3.5 text-gray-400" />
                          <span className="font-medium text-gray-700">{resource.location}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <FaUsers className="w-3.5 h-3.5 text-gray-400" />
                            <span className="font-medium text-gray-700">{resource.capacity} Seats Available</span>
                          </div>
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 group-hover:translate-x-1 transition-transform">
                            Details <FaArrowRight className="w-2.5 h-2.5" />
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-span-full py-20 text-center bg-white rounded-xl border border-dashed border-gray-300">
                <FaExclamationCircle className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-1">No resources found</h3>
                <p className="text-gray-500 text-sm max-w-xs mx-auto">Try adjusting your filters to discover other available campus assets.</p>
                <button 
                  onClick={() => setFilters({ type: '', capacity: '', location: '' })}
                  className="mt-6 px-6 py-2 bg-gray-900 text-white rounded-lg font-semibold text-sm hover:bg-blue-600 transition-all shadow-md active:scale-95"
                >
                  Reset Filters
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ResourceList;

