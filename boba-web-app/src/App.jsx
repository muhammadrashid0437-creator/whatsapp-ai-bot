/* eslint-disable */
import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { CONFIG } from './config.js';

const supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_KEY);

export default function App() {
  const [view, setView] = useState('pending'); // 'pending' | 'merchants' | 'catalog' | 'branches'
  const [companies, setCompanies] = useState([]);
  const [products, setProducts] = useState([]);
  const [branches, setBranches] = useState([]);
  const [selectedMerchant, setSelectedMerchant] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const { data: c } = await supabase.from('companies').select('*').order('created_at', { ascending: false });
    const { data: p } = await supabase.from('products').select('*');
    const { data: b } = await supabase.from('store_branches').select('*');
    if (c) setCompanies(c);
    if (p) setProducts(p);
    if (b) setBranches(b);
  };

  const approveMerchant = async (id, e) => {
    e.stopPropagation();
    await supabase.from('companies').update({ status: 'approved' }).eq('id', id);
    loadData();
  };

  const rejectMerchant = async (id, name, e) => {
    e.stopPropagation();
    if (!confirm(`Are you sure you want to reject/delete "${name}"?`)) return;
    await supabase.from('companies').delete().eq('id', id);
    loadData();
    if (selectedMerchant?.id === id) setSelectedMerchant(null);
  };

  // Filter approved vs pending
  const pendingMerchants = companies.filter(c => c.status === 'pending' || !c.status);
  const approvedMerchants = companies.filter(c => c.status === 'approved');

  return (
    <div className="min-h-screen flex flex-col bg-gray-100 font-sans">
      {/* TOP NAVIGATION BAR WITH 4 TABS */}
      <nav className="bg-indigo-900 text-white p-4 flex justify-between items-center shadow-lg">
        <div className="flex items-center space-x-2">
          <span className="text-2xl">🧋</span>
          <span className="font-bold text-xl tracking-wide">BOBA Admin Platform</span>
        </div>
        <div className="flex space-x-2 bg-indigo-950 p-1 rounded-lg border border-indigo-700">
          <button
            onClick={() => setView('pending')}
            className={`px-3 py-1.5 rounded text-xs font-semibold transition ${
              view === 'pending' ? 'bg-amber-600 text-white shadow' : 'text-indigo-200 hover:text-white'
            }`}
          >
            ⏳ Pending Approvals ({pendingMerchants.length})
          </button>
          <button
            onClick={() => setView('merchants')}
            className={`px-3 py-1.5 rounded text-xs font-semibold transition ${
              view === 'merchants' ? 'bg-indigo-600 text-white shadow' : 'text-indigo-200 hover:text-white'
            }`}
          >
            🏢 Registered Merchants ({approvedMerchants.length})
          </button>
          <button
            onClick={() => setView('catalog')}
            className={`px-3 py-1.5 rounded text-xs font-semibold transition ${
              view === 'catalog' ? 'bg-indigo-600 text-white shadow' : 'text-indigo-200 hover:text-white'
            }`}
          >
            📦 Products ({products.length})
          </button>
          <button
            onClick={() => setView('branches')}
            className={`px-3 py-1.5 rounded text-xs font-semibold transition ${
              view === 'branches' ? 'bg-indigo-600 text-white shadow' : 'text-indigo-200 hover:text-white'
            }`}
          >
            📍 Store Branches ({branches.length})
          </button>
        </div>
      </nav>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 p-6 max-w-6xl mx-auto w-full space-y-6">

        {/* TAB 1: PENDING APPROVALS / MERCHANTS UNDER REVIEW */}
        {view === 'pending' && (
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <div>
                <h2 className="text-xl font-bold text-amber-900">⏳ Merchants Under Review / Pending Approval</h2>
                <p className="text-gray-500 text-xs mt-1">Review new store registrations before approving them to sell on your platform.</p>
              </div>
              <span className="bg-amber-100 text-amber-800 text-xs font-bold px-3 py-1 rounded-full">
                Under Review: {pendingMerchants.length}
              </span>
            </div>

            {pendingMerchants.length === 0 ? (
              <p className="text-center text-gray-400 py-12">🎉 No pending merchant registrations! All stores are reviewed.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
                {pendingMerchants.map(c => {
                  const cleanMerchantId = `MID-${c.id.substring(0, 8).toUpperCase()}`;

                  return (
                    <div
                      key={c.id}
                      onClick={() => setSelectedMerchant({ ...c, cleanId: cleanMerchantId })}
                      className="bg-amber-50/50 rounded-xl p-5 border border-amber-200 shadow-sm flex flex-col justify-between hover:shadow-lg transition cursor-pointer"
                    >
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center space-x-3">
                            {c.image_url ? (
                              <img src={c.image_url} alt={c.name} className="w-12 h-12 object-cover rounded-lg border shadow-sm" />
                            ) : (
                              <div className="w-12 h-12 bg-amber-100 text-amber-800 font-bold rounded-lg flex items-center justify-center text-base border">
                                {c.name.substring(0, 2).toUpperCase()}
                              </div>
                            )}
                            <div>
                              <h3 className="font-bold text-gray-900 text-base leading-tight">{c.name}</h3>
                              <p className="text-gray-500 text-xs">{c.description || 'No description'}</p>
                            </div>
                          </div>
                          <span className="bg-amber-100 text-amber-900 text-[10px] font-mono font-bold px-2 py-0.5 rounded border border-amber-200">
                            {cleanMerchantId}
                          </span>
                        </div>

                        <div className="space-y-1 text-xs text-gray-600 bg-white p-3 rounded-lg border border-gray-100 my-3">
                          <p><span className="font-semibold text-gray-700">📞 Phone:</span> {c.phone || 'N/A'}</p>
                          <p><span className="font-semibold text-gray-700">📍 Address:</span> {c.address || 'N/A'}</p>
                          <p><span className="font-semibold text-gray-700">📅 Submitted:</span> {new Date(c.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>

                      {/* APPROVE & REJECT ACTION BUTTONS */}
                      <div className="pt-3 border-t flex space-x-2">
                        <button
                          onClick={(e) => approveMerchant(c.id, e)}
                          className="flex-1 bg-green-600 text-white py-1.5 rounded-lg text-xs font-bold hover:bg-green-700 shadow-sm"
                        >
                          ✅ Approve
                        </button>
                        <button
                          onClick={(e) => rejectMerchant(c.id, c.name, e)}
                          className="flex-1 bg-red-600 text-white py-1.5 rounded-lg text-xs font-bold hover:bg-red-700 shadow-sm"
                        >
                          ❌ Reject
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: REGISTERED & APPROVED MERCHANTS */}
        {view === 'merchants' && (
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <div>
                <h2 className="text-xl font-bold text-indigo-900">🏢 Approved Merchants Directory</h2>
                <p className="text-gray-500 text-xs mt-1">Stores that have been approved and are active on your platform.</p>
              </div>
              <span className="bg-indigo-100 text-indigo-800 text-xs font-bold px-3 py-1 rounded-full">
                Active Merchants: {approvedMerchants.length}
              </span>
            </div>

            {approvedMerchants.length === 0 ? (
              <p className="text-center text-gray-400 py-8">No approved merchants yet. Check the Pending tab!</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
                {approvedMerchants.map(c => {
                  const merchantProducts = products.filter(p => p.company_id === c.id);
                  const merchantBranches = branches.filter(b => b.company_id === c.id);
                  const cleanMerchantId = `MID-${c.id.substring(0, 8).toUpperCase()}`;

                  return (
                    <div
                      key={c.id}
                      onClick={() => setSelectedMerchant({ ...c, cleanId: cleanMerchantId })}
                      className="bg-gray-50 rounded-xl p-5 border border-gray-200 shadow-sm flex flex-col justify-between hover:shadow-lg hover:border-indigo-400 transition cursor-pointer group"
                    >
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center space-x-3">
                            {c.image_url ? (
                              <img src={c.image_url} alt={c.name} className="w-12 h-12 object-cover rounded-lg border shadow-sm" />
                            ) : (
                              <div className="w-12 h-12 bg-indigo-100 text-indigo-800 font-bold rounded-lg flex items-center justify-center text-base border">
                                {c.name.substring(0, 2).toUpperCase()}
                              </div>
                            )}
                            <div>
                              <h3 className="font-bold text-gray-900 text-base leading-tight group-hover:text-indigo-600 transition">{c.name}</h3>
                              <p className="text-gray-500 text-xs">{c.description || 'No description'}</p>
                            </div>
                          </div>
                          <span className="bg-indigo-100 text-indigo-900 text-[10px] font-mono font-bold px-2 py-0.5 rounded border border-indigo-200">
                            {cleanMerchantId}
                          </span>
                        </div>

                        <div className="space-y-1 text-xs text-gray-600 bg-white p-3 rounded-lg border border-gray-100 my-3">
                          <p><span className="font-semibold text-gray-700">📞 Phone:</span> {c.phone || 'N/A'}</p>
                          <p><span className="font-semibold text-gray-700">📍 Address:</span> {c.address || 'N/A'}</p>
                        </div>
                      </div>

                      <div className="pt-3 border-t flex justify-between items-center text-xs">
                        <span className="font-semibold text-indigo-900 bg-indigo-50 px-2.5 py-1 rounded border border-indigo-100">
                          📦 {merchantProducts.length} Products
                        </span>
                        <div className="flex space-x-2 items-center">
                          <span className="font-semibold text-teal-900 bg-teal-50 px-2.5 py-1 rounded border border-teal-100">
                            📍 {merchantBranches.length} Branches
                          </span>
                          <button
                            onClick={(e) => rejectMerchant(c.id, c.name, e)}
                            title="Delete profile"
                            className="bg-red-100 text-red-700 p-1.5 rounded hover:bg-red-200 text-xs"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: PRODUCTS CATALOG */}
        {view === 'catalog' && (
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <h3 className="text-lg font-bold text-indigo-900 mb-4">📦 Product Catalog ({products.length})</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {products.map(p => (
                <div key={p.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200 flex flex-col justify-between hover:shadow-md transition">
                  <div>
                    {p.image_url ? (
                      <img src={p.image_url} alt={p.title} className="w-full h-36 object-cover rounded mb-3 border" />
                    ) : (
                      <div className="w-full h-36 bg-gray-200 rounded mb-3 border flex items-center justify-center text-xs text-gray-400">No Image</div>
                    )}
                    <p className="font-bold text-gray-900 text-base">{p.title}</p>
                    <p className="text-teal-700 font-extrabold text-lg mt-1">${p.price}</p>
                  </div>
                  <div className="mt-3 flex justify-between items-center pt-2 border-t">
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${p.stock_quantity <= p.reorder_threshold ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                      Stock: {p.stock_quantity}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: STORE BRANCHES */}
        {view === 'branches' && (
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <h3 className="text-lg font-bold text-indigo-900 mb-4">📍 Registered Store Branches ({branches.length})</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {branches.map(b => (
                <div key={b.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:shadow-sm">
                  <p className="font-bold text-gray-800 text-base">📍 {b.branch_name}</p>
                  <p className="text-gray-600 text-sm mt-1">{b.address || 'Address not listed'}</p>
                  <p className="text-gray-500 text-xs mt-1">Phone: {b.phone || 'N/A'}</p>
                </div>
              ))}
            </div>
          </div>
        )}

      </main>

      {/* MERCHANT FULL PROFILE MODAL */}
      {selectedMerchant && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start border-b pb-4">
              <div className="flex items-center space-x-4">
                {selectedMerchant.image_url ? (
                  <img src={selectedMerchant.image_url} alt={selectedMerchant.name} className="w-16 h-16 object-cover rounded-xl border shadow-sm" />
                ) : (
                  <div className="w-16 h-16 bg-indigo-100 text-indigo-800 font-bold rounded-xl flex items-center justify-center text-xl border">
                    {selectedMerchant.name.substring(0, 2).toUpperCase()}
                  </div>
                )}
                <div>
                  <div className="flex items-center space-x-2">
                    <h2 className="text-2xl font-bold text-gray-900">{selectedMerchant.name}</h2>
                    <span className="bg-indigo-100 text-indigo-900 text-xs font-mono font-bold px-2 py-0.5 rounded border border-indigo-200">
                      {selectedMerchant.cleanId}
                    </span>
                  </div>
                  <p className="text-gray-500 text-sm mt-1">{selectedMerchant.description || 'No description'}</p>
                </div>
              </div>
              <button onClick={() => setSelectedMerchant(null)} className="text-gray-400 hover:text-gray-600 font-bold text-2xl">✕</button>
            </div>

            <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl text-xs">
              <p><span className="font-bold text-gray-700">📞 Phone:</span> {selectedMerchant.phone || 'N/A'}</p>
              <p><span className="font-bold text-gray-700">📍 Address:</span> {selectedMerchant.address || 'N/A'}</p>
              <p><span className="font-bold text-gray-700">📅 Date Submitted:</span> {new Date(selectedMerchant.created_at).toLocaleDateString()}</p>
              <p><span className="font-bold text-gray-700">🆔 Ref Code:</span> <span className="font-mono text-xs font-bold text-indigo-900">{selectedMerchant.cleanId}</span></p>
            </div>

            {selectedMerchant.status === 'pending' && (
              <div className="flex space-x-3 pt-2">
                <button
                  onClick={(e) => { approveMerchant(selectedMerchant.id, e); setSelectedMerchant(null); }}
                  className="flex-1 bg-green-600 text-white py-2 rounded-lg font-bold text-xs hover:bg-green-700"
                >
                  ✅ Approve Merchant
                </button>
                <button
                  onClick={(e) => { rejectMerchant(selectedMerchant.id, selectedMerchant.name, e); }}
                  className="flex-1 bg-red-600 text-white py-2 rounded-lg font-bold text-xs hover:bg-red-700"
                >
                  ❌ Reject & Delete
                </button>
              </div>
            )}

            <div className="pt-2 border-t flex justify-end">
              <button onClick={() => setSelectedMerchant(null)} className="bg-gray-200 text-gray-800 px-5 py-2 rounded-lg font-bold text-xs hover:bg-gray-300">
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}