import React, { useState, useEffect, useCallback } from 'react';
import resourceService from '../services/resourceService';
import { useAuth } from '../auth/AuthProvider';

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

  const fetchResources = useCallback(async () => {
    // If auth is still loading or token is not yet available, don't fetch
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
      if (err.response?.status === 403) {
          setError('Access denied. Please contact the administrator to verify your role permissions.');
      } else {
          setError('Failed to load resources. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  }, [token, filters]);

  useEffect(() => {
    if (!authLoading) {
        fetchResources();
    }
  }, [authLoading, fetchResources]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  if (authLoading) {
      return (
          <div className="min-h-screen flex items-center justify-center bg-white text-black">
              <div className="font-bold text-xl">Verifying access...</div>
          </div>
      );
  }

  return (
    <div className="min-h-screen bg-white text-black p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8 border-b pb-4">
          <h1 className="text-3xl font-bold text-black uppercase tracking-tight">Campus Resources</h1>
          <div className="text-right">
              <p className="text-gray-900 font-medium">Available Resources</p>
              <p className="text-gray-500 text-sm">{resources.length} items found</p>
          </div>
        </div>
        
        {/* Filters Section */}
        <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 mb-10 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex flex-col">
              <label className="text-sm font-bold mb-2 text-black uppercase tracking-wide">Type</label>
              <select 
                name="type" 
                value={filters.type} 
                onChange={handleFilterChange} 
                className="w-full border border-gray-300 p-3 rounded-lg text-black bg-white font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
              >
                <option value="" className="text-black bg-white font-medium">All Types</option>
                <option value="ROOM" className="text-black bg-white font-medium">Room</option>
                <option value="LAB" className="text-black bg-white font-medium">Lab</option>
                <option value="EQUIPMENT" className="text-black bg-white font-medium">Equipment</option>
              </select>
            </div>
            
            <div className="flex flex-col">
              <label className="text-sm font-bold mb-2 text-black uppercase tracking-wide">Minimum Capacity</label>
              <input 
                type="number" 
                name="capacity" 
                value={filters.capacity} 
                onChange={handleFilterChange} 
                placeholder="e.g. 10" 
                className="w-full border border-gray-300 p-3 rounded-lg text-black bg-white font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
              />
            </div>
            
            <div className="flex flex-col">
              <label className="text-sm font-bold mb-2 text-black uppercase tracking-wide">Location</label>
              <input 
                type="text" 
                name="location" 
                value={filters.location} 
                onChange={handleFilterChange} 
                placeholder="Building A, Room 101..." 
                className="w-full border border-gray-300 p-3 rounded-lg text-black bg-white font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
              />
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border-2 border-red-200 p-5 mb-8 text-red-800 rounded-xl flex items-center gap-3">
            <span className="text-2xl font-bold">!</span>
            <span className="font-semibold">{error}</span>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center py-32 bg-gray-50 rounded-2xl border border-gray-200">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent shadow-lg"></div>
            <span className="ml-4 font-bold text-gray-700">Fetching Data...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {resources.length > 0 ? (
              resources.map(resource => (
                <div key={resource.id} className="bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col group overflow-hidden">
                  <div className="p-7 flex-grow">
                    <div className="flex justify-between items-center mb-6">
                      <div className={`px-4 py-1.5 text-xs font-black rounded-full uppercase tracking-widest ${
                        resource.type === 'ROOM' ? 'bg-blue-600 text-white shadow-sm' : 
                        resource.type === 'LAB' ? 'bg-purple-600 text-white shadow-sm' : 
                        'bg-orange-500 text-white shadow-sm'
                      }`}>
                        {resource.type}
                      </div>
                      <div className={`flex items-center gap-1.5 font-bold uppercase text-[10px] tracking-tight ${
                        resource.status === 'ACTIVE' ? 'text-green-600' : 'text-red-500'
                      }`}>
                        <span className={`w-2 h-2 rounded-full ${resource.status === 'ACTIVE' ? 'bg-green-600' : 'bg-red-500'}`}></span>
                        {resource.status}
                      </div>
                    </div>
                    
                    <h3 className="text-2xl font-black text-black mb-4 group-hover:text-blue-600 transition-colors uppercase tracking-tight">{resource.name}</h3>
                    
                    <div className="space-y-4 mb-6">
                      <div className="flex items-center bg-gray-50 p-3 rounded-lg border border-gray-100">
                        <span className="text-xs font-black text-gray-400 w-24 uppercase">Location</span>
                        <span className="text-sm font-bold text-gray-900">{resource.location}</span>
                      </div>
                      <div className="flex items-center bg-gray-50 p-3 rounded-lg border border-gray-100">
                        <span className="text-xs font-black text-gray-400 w-24 uppercase">Capacity</span>
                        <span className="text-sm font-bold text-gray-900">{resource.capacity} seats</span>
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-700 leading-relaxed font-medium line-clamp-3">
                      {resource.description || 'No detailed description provided for this campus asset.'}
                    </p>
                  </div>
                  
                  <div className="px-7 py-5 bg-gray-50 border-t border-gray-100 flex justify-end items-center group-hover:bg-blue-50 transition-colors">
                    {/* <span className="text-sm font-black text-blue-600 group-hover:translate-x-2 transition-transform cursor-pointer">
                      RESERVE NOW →
                    </span> */}
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full py-32 text-center bg-gray-50 rounded-2xl border-2 border-dashed border-gray-300">
                <p className="text-gray-900 font-black text-2xl mb-4">NO ASSETS DISCOVERED</p>
                <p className="text-gray-500 font-medium mb-8">Refine your filters or clear your selection to browse all resources.</p>
                <button 
                  onClick={() => setFilters({ type: '', capacity: '', location: '' })}
                  className="bg-black text-white px-8 py-3 rounded-full font-black text-sm uppercase tracking-widest hover:bg-blue-600 transition-all shadow-lg active:scale-95"
                >
                  Reset Dashboard
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
