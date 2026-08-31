import React, { useState, useEffect } from 'react';
import api from '../services/api';
import AdvancedLayout from '../components/AdvancedLayout';
import '../styles/global-advanced.css';

interface FamilyMember {
  _id: string;
  userId: string;
  name: string;
  email: string;
  role: 'owner' | 'member' | 'viewer';
  joinedAt: string;
}

interface Family {
  _id: string;
  name: string;
  currency: string;
  timezone: string;
  members: FamilyMember[];
  createdAt: string;
  createdBy: string;
}

export default function FamilyManagement() {
  const [families, setFamilies] = useState<Family[]>([]);
  const [selectedFamily, setSelectedFamily] = useState<Family | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateFamily, setShowCreateFamily] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', currency: 'INR', timezone: 'Asia/Kolkata' });
  const [addMemberForm, setAddMemberForm] = useState({ email: '', role: 'member' });
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    fetchFamilies();
  }, []);

  const fetchFamilies = async () => {
    try {
      setLoading(true);
      const response = await api.get('/families');
      setFamilies(response.data.data || []);
      if (response.data.data?.length > 0) {
        setSelectedFamily(response.data.data[0]);
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: 'Failed to load families' });
      console.error('Families fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFamily = async () => {
    if (!createForm.name.trim()) {
      setMessage({ type: 'error', text: 'Family name is required' });
      return;
    }

    try {
      const response = await api.post('/families', createForm);
      setFamilies([...families, response.data.data]);
      setSelectedFamily(response.data.data);
      setCreateForm({ name: '', currency: 'INR', timezone: 'Asia/Kolkata' });
      setShowCreateFamily(false);
      setMessage({ type: 'success', text: 'Family created successfully!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.error?.message || 'Failed to create family' });
    }
  };

  const handleAddMember = async () => {
    if (!selectedFamily) return;
    if (!addMemberForm.email.trim()) {
      setMessage({ type: 'error', text: 'Email is required' });
      return;
    }

    try {
      const response = await api.post(`/families/${selectedFamily._id}/members`, {
        email: addMemberForm.email,
        role: addMemberForm.role
      });
      setSelectedFamily(response.data.data);
      setAddMemberForm({ email: '', role: 'member' });
      setShowAddMember(false);
      setMessage({ type: 'success', text: 'Member added successfully!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.error?.message || 'Failed to add member' });
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!selectedFamily || !window.confirm('Remove this member from the family?')) return;

    try {
      const response = await api.delete(`/families/${selectedFamily._id}/members/${memberId}`);
      setSelectedFamily(response.data.data);
      setMessage({ type: 'success', text: 'Member removed' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      setMessage({ type: 'error', text: 'Failed to remove member' });
    }
  };

  const handleUpdateRole = async (memberId: string, newRole: string) => {
    if (!selectedFamily) return;

    try {
      const response = await api.put(`/families/${selectedFamily._id}/members/${memberId}/role`, {
        role: newRole
      });
      setSelectedFamily(response.data.data);
      setMessage({ type: 'success', text: 'Member role updated' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      setMessage({ type: 'error', text: 'Failed to update member role' });
    }
  };

  if (loading) {
    return (
      <AdvancedLayout>
        <div className="page-content" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: '2rem', marginBottom: '20px' }}>⏳</div>
          <p style={{ color: '#cbd5e1' }}>Loading families...</p>
        </div>
      </AdvancedLayout>
    );
  }

  return (
    <AdvancedLayout>
      <div className="page-content">
        {/* Page Header */}
        <div className="page-header">
          <h1>👨‍👩‍👧‍👦 Family Management</h1>
          <p>Create and manage families for expense sharing</p>
        </div>

        {/* Message Alert */}
        {message && (
          <div style={{
            padding: '16px',
            borderRadius: '12px',
            marginBottom: '24px',
            background: message.type === 'success'
              ? 'rgba(16, 185, 129, 0.1)'
              : 'rgba(239, 68, 68, 0.1)',
            border: `1px solid ${message.type === 'success' ? '#10b981' : '#ef4444'}`,
            color: message.type === 'success' ? '#10b981' : '#ef4444'
          }}>
            {message.type === 'success' ? '✅' : '❌'} {message.text}
          </div>
        )}

        {/* Layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '24px' }}>
          {/* Sidebar - Families List */}
          <div>
            <div style={{ marginBottom: '16px' }}>
              <button
                className="btn btn-primary"
                onClick={() => setShowCreateFamily(true)}
                style={{ width: '100%' }}
              >
                ➕ Create Family
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {families.map(family => (
                <div
                  key={family._id}
                  onClick={() => setSelectedFamily(family)}
                  style={{
                    padding: '12px 16px',
                    borderRadius: '10px',
                    background: selectedFamily?._id === family._id
                      ? 'linear-gradient(135deg, #667eea, #764ba2)'
                      : 'rgba(26, 32, 44, 0.5)',
                    border: `1px solid ${selectedFamily?._id === family._id ? 'var(--primary)' : 'var(--border)'}`,
                    cursor: 'pointer',
                    color: selectedFamily?._id === family._id ? 'white' : 'var(--text-primary)',
                    transition: 'all 0.3s ease'
                  }}
                >
                  <h4 style={{ margin: 0, marginBottom: '4px', fontSize: '1rem', fontWeight: '600' }}>
                    {family.name}
                  </h4>
                  <p style={{ margin: 0, fontSize: '0.85rem', opacity: 0.8 }}>
                    {family.members.length} members
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Main Content - Family Details */}
          {selectedFamily && (
            <div>
              {/* Family Header */}
              <div className="glass-card" style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '20px' }}>
                  <div>
                    <h2 style={{ margin: 0, marginBottom: '8px', color: 'var(--text-primary)' }}>
                      👨‍👩‍👧‍👦 {selectedFamily.name}
                    </h2>
                    <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                      {selectedFamily.currency} • {selectedFamily.timezone}
                    </p>
                  </div>
                  <button
                    className="btn btn-primary"
                    onClick={() => setShowAddMember(true)}
                  >
                    👤 Add Member
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                  <div style={{ padding: '12px', background: 'rgba(102, 126, 234, 0.05)', borderRadius: '8px' }}>
                    <p style={{ margin: '0 0 4px 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Members</p>
                    <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: '700', color: 'var(--primary)' }}>
                      {selectedFamily.members.length}
                    </p>
                  </div>
                  <div style={{ padding: '12px', background: 'rgba(102, 126, 234, 0.05)', borderRadius: '8px' }}>
                    <p style={{ margin: '0 0 4px 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Owners</p>
                    <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: '700', color: 'var(--primary)' }}>
                      {selectedFamily.members.filter(m => m.role === 'owner').length}
                    </p>
                  </div>
                  <div style={{ padding: '12px', background: 'rgba(102, 126, 234, 0.05)', borderRadius: '8px' }}>
                    <p style={{ margin: '0 0 4px 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Created</p>
                    <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: '600' }}>
                      {new Date(selectedFamily.createdAt).toLocaleDateString('en-IN')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Members List */}
              <div className="glass-card">
                <h3 style={{ margin: '0 0 20px 0', color: 'var(--text-primary)' }}>👥 Members</h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {selectedFamily.members.map(member => (
                    <div
                      key={member._id}
                      style={{
                        padding: '16px',
                        background: 'rgba(45, 55, 72, 0.3)',
                        borderRadius: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '16px'
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <h4 style={{ margin: 0, marginBottom: '4px', fontWeight: '600' }}>
                          {member.name}
                        </h4>
                        <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                          {member.email}
                        </p>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <select
                          value={member.role}
                          onChange={(e) => handleUpdateRole(member._id, e.target.value)}
                          style={{
                            padding: '8px 12px',
                            background: 'rgba(102, 126, 234, 0.1)',
                            border: '1px solid var(--primary)',
                            borderRadius: '8px',
                            color: 'var(--text-primary)',
                            cursor: 'pointer',
                            fontSize: '0.9rem'
                          }}
                        >
                          <option value="owner">Owner</option>
                          <option value="member">Member</option>
                          <option value="viewer">Viewer</option>
                        </select>

                        <button
                          className="btn btn-danger"
                          style={{ padding: '8px 12px', fontSize: '0.9rem' }}
                          onClick={() => handleRemoveMember(member._id)}
                        >
                          🗑️ Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Create Family Modal */}
        {showCreateFamily && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div className="glass-card" style={{ width: '90%', maxWidth: '500px' }}>
              <h3 style={{ margin: '0 0 20px 0', color: 'var(--text-primary)' }}>➕ Create New Family</h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Family Name</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g., My Family"
                    value={createForm.name}
                    onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Currency</label>
                  <select
                    className="form-input"
                    value={createForm.currency}
                    onChange={(e) => setCreateForm({ ...createForm, currency: e.target.value })}
                  >
                    <option value="INR">₹ Indian Rupee</option>
                    <option value="USD">$ US Dollar</option>
                    <option value="EUR">€ Euro</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Timezone</label>
                  <select
                    className="form-input"
                    value={createForm.timezone}
                    onChange={(e) => setCreateForm({ ...createForm, timezone: e.target.value })}
                  >
                    <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                    <option value="UTC">UTC</option>
                    <option value="America/New_York">America/New_York (EST)</option>
                  </select>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button className="btn btn-primary" onClick={handleCreateFamily} style={{ flex: 1 }}>
                    ✅ Create
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={() => setShowCreateFamily(false)}
                    style={{ flex: 1 }}
                  >
                    ❌ Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Add Member Modal */}
        {showAddMember && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div className="glass-card" style={{ width: '90%', maxWidth: '500px' }}>
              <h3 style={{ margin: '0 0 20px 0', color: 'var(--text-primary)' }}>👤 Add Family Member</h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Member Email</label>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="member@example.com"
                    value={addMemberForm.email}
                    onChange={(e) => setAddMemberForm({ ...addMemberForm, email: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Role</label>
                  <select
                    className="form-input"
                    value={addMemberForm.role}
                    onChange={(e) => setAddMemberForm({ ...addMemberForm, role: e.target.value })}
                  >
                    <option value="member">Member (Can add/edit expenses)</option>
                    <option value="viewer">Viewer (Can only view)</option>
                  </select>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button className="btn btn-primary" onClick={handleAddMember} style={{ flex: 1 }}>
                    ✅ Add
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={() => setShowAddMember(false)}
                    style={{ flex: 1 }}
                  >
                    ❌ Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdvancedLayout>
  );
}
