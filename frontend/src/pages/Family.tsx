import { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuthStore } from '../stores/authStore';
import { Family as FamilyType } from '../types';

export default function Family() {
  const [family, setFamily] = useState<FamilyType | null>(null);
  const [loading, setLoading] = useState(true);
  const [settlements, setSettlements] = useState<any>({});
  const [inviteEmail, setInviteEmail] = useState('');
  const [role, setRole] = useState('member');

  const familyId = useAuthStore((state) => state.familyId);

  useEffect(() => {
    if (familyId) fetchFamily();
  }, [familyId]);

  const fetchFamily = async () => {
    try {
      const [familyRes, settlementsRes] = await Promise.all([
        api.get(`/families/${familyId}`),
        api.get(`/families/${familyId}/settlements`),
      ]);
      setFamily(familyRes.data.data);
      setSettlements(settlementsRes.data.data);
    } catch (err) {
      console.error('Failed to load family');
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async () => {
    try {
      await api.post(`/families/${familyId}/members`, { email: inviteEmail, role });
      setInviteEmail('');
      fetchFamily();
      alert('Invitation sent!');
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to invite member');
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (window.confirm('Remove this member?')) {
      try {
        await api.delete(`/families/${familyId}/members/${userId}`);
        fetchFamily();
      } catch (err) {
        alert('Failed to remove member');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">👨‍👩‍👧‍👦 Family Management</h1>

        {loading ? (
          <div>Loading...</div>
        ) : (
          <div className="space-y-8">
            {/* Invite New Member */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold mb-4">Invite Member</h2>
              <div className="flex gap-4 flex-col md:flex-row">
                <input
                  type="email"
                  placeholder="Email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
                />
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="member">Member</option>
                  <option value="viewer">Viewer</option>
                </select>
                <button
                  onClick={handleInvite}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Invite
                </button>
              </div>
            </div>

            {/* Members */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold mb-4">Family Members</h2>
              <div className="space-y-4">
                {family?.members.map((member) => {
                  // Get user name if populated, else use email as fallback
                  const memberName = typeof member.userId === 'object'
                    ? member.userId.name || member.userId.email
                    : member.userId;
                  const memberEmail = typeof member.userId === 'object' ? member.userId.email : '';

                  return (
                    <div key={member.userId._id || member.userId} className="flex justify-between items-center p-4 border rounded-lg">
                      <div>
                        <div className="font-semibold">{memberName}</div>
                        {memberEmail && <div className="text-sm text-gray-500">{memberEmail}</div>}
                        <div className="text-sm text-gray-600">Role: <span className="font-medium capitalize">{member.role}</span></div>
                      </div>
                      <button
                        onClick={() => handleRemoveMember(typeof member.userId === 'object' ? member.userId._id : member.userId)}
                        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                      >
                        Remove
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Settlements */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold mb-4">⚖️ Who Owes Whom</h2>
              <div className="space-y-2">
                {Object.entries(settlements).length === 0 ? (
                  <p className="text-gray-600">All settled up!</p>
                ) : (
                  Object.entries(settlements).map(([user, amounts]: any) => (
                    <div key={user} className="text-sm">
                      {Object.entries(amounts).map(([creditor, amount]: any) => (
                        <div key={creditor} className="flex justify-between p-2 bg-gray-50 rounded">
                          <span>{user} → {creditor}</span>
                          <span className="font-semibold">₹{amount}</span>
                        </div>
                      ))}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
