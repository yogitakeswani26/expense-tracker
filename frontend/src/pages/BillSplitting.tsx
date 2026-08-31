import React, { useState, useEffect } from 'react';
import api from '../services/api';
import AdvancedLayout from '../components/AdvancedLayout';
import '../styles/global-advanced.css';

interface Settlement {
  from: string;
  to: string;
  amount: number;
  description: string;
}

interface FamilySettlement {
  familyId: string;
  familyName: string;
  totalExpenses: number;
  settlements: Settlement[];
  members: Array<{ _id: string; name: string; email: string }>;
}

interface WhoOwesWho {
  whoOwes: string;
  toWhom: string;
  amount: number;
}

export default function BillSplitting() {
  const [families, setFamilies] = useState<FamilySettlement[]>([]);
  const [selectedFamily, setSelectedFamily] = useState<FamilySettlement | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    fetchSettlements();
  }, []);

  const fetchSettlements = async () => {
    try {
      setLoading(true);
      const familiesResponse = await api.get('/families');
      const familiesList = familiesResponse.data.data || [];

      const familiesWithSettlements = await Promise.all(
        familiesList.map(async (family: any) => {
          try {
            const settlementsResponse = await api.get(`/families/${family._id}/settlements`);
            return {
              familyId: family._id,
              familyName: family.name,
              totalExpenses: 0,
              settlements: settlementsResponse.data.data || [],
              members: family.members || []
            };
          } catch {
            return {
              familyId: family._id,
              familyName: family.name,
              totalExpenses: 0,
              settlements: [],
              members: family.members || []
            };
          }
        })
      );

      setFamilies(familiesWithSettlements);
      if (familiesWithSettlements.length > 0) {
        setSelectedFamily(familiesWithSettlements[0]);
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: 'Failed to load settlements' });
      console.error('Settlements fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSettlement = async (whoOwes: string, toWhom: string, amount: number) => {
    if (!selectedFamily || amount <= 0) return;

    try {
      await api.post(`/families/${selectedFamily.familyId}/settle`, {
        whoOwes,
        toWhom,
        amount
      });
      setMessage({ type: 'success', text: `Settlement of ₹${amount} recorded!` });
      setTimeout(() => setMessage(null), 3000);
      fetchSettlements();
    } catch (error: any) {
      setMessage({ type: 'error', text: 'Failed to record settlement' });
    }
  };

  const calculateBalances = (family: FamilySettlement) => {
    const balances: { [key: string]: number } = {};

    family.members.forEach(member => {
      balances[member._id] = 0;
    });

    family.settlements.forEach(settlement => {
      if (balances[settlement.from] !== undefined) {
        balances[settlement.from] -= settlement.amount;
      }
      if (balances[settlement.to] !== undefined) {
        balances[settlement.to] += settlement.amount;
      }
    });

    return balances;
  };

  const getMemberName = (memberId: string, family: FamilySettlement) => {
    return family.members.find(m => m._id === memberId)?.name || 'Unknown';
  };

  if (loading) {
    return (
      <AdvancedLayout>
        <div className="page-content" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: '2rem', marginBottom: '20px' }}>⏳</div>
          <p style={{ color: '#cbd5e1' }}>Loading settlements...</p>
        </div>
      </AdvancedLayout>
    );
  }

  return (
    <AdvancedLayout>
      <div className="page-content">
        {/* Page Header */}
        <div className="page-header">
          <h1>💰 Bill Splitting & Settlements</h1>
          <p>Track who owes whom and settle up</p>
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

        {families.length === 0 ? (
          <div className="glass-card" style={{ textAlign: 'center', padding: '60px 20px' }}>
            <p style={{ fontSize: '3rem', margin: '0 0 16px 0' }}>👨‍👩‍👧‍👦</p>
            <h3 style={{ margin: '0 0 8px 0', color: 'var(--text-primary)' }}>No Families Yet</h3>
            <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
              Create a family to start tracking shared expenses and settlements
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '24px' }}>
            {/* Sidebar - Families List */}
            <div>
              <h3 style={{ margin: '0 0 16px 0', color: 'var(--text-primary)', fontSize: '1rem' }}>👨‍👩‍👧‍👦 Families</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {families.map(family => (
                  <div
                    key={family.familyId}
                    onClick={() => setSelectedFamily(family)}
                    style={{
                      padding: '12px 16px',
                      borderRadius: '10px',
                      background: selectedFamily?.familyId === family.familyId
                        ? 'linear-gradient(135deg, #667eea, #764ba2)'
                        : 'rgba(26, 32, 44, 0.5)',
                      border: `1px solid ${selectedFamily?.familyId === family.familyId ? 'var(--primary)' : 'var(--border)'}`,
                      cursor: 'pointer',
                      color: selectedFamily?.familyId === family.familyId ? 'white' : 'var(--text-primary)',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    <h4 style={{ margin: 0, marginBottom: '4px', fontSize: '1rem', fontWeight: '600' }}>
                      {family.familyName}
                    </h4>
                    <p style={{ margin: 0, fontSize: '0.85rem', opacity: 0.8 }}>
                      {family.settlements.length} transactions
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Main Content */}
            {selectedFamily && (
              <div>
                {/* Summary Cards */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                  gap: '16px',
                  marginBottom: '30px'
                }}>
                  <div className="glass-card">
                    <h4 style={{ margin: '0 0 8px 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                      Total Members
                    </h4>
                    <div style={{
                      fontSize: '2rem',
                      fontWeight: '800',
                      background: 'linear-gradient(135deg, #667eea, #06b6d4)',
                      backgroundClip: 'text',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent'
                    }}>
                      {selectedFamily.members.length}
                    </div>
                  </div>

                  <div className="glass-card">
                    <h4 style={{ margin: '0 0 8px 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                      Total Transactions
                    </h4>
                    <div style={{
                      fontSize: '2rem',
                      fontWeight: '800',
                      background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                      backgroundClip: 'text',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent'
                    }}>
                      {selectedFamily.settlements.length}
                    </div>
                  </div>

                  <div className="glass-card">
                    <h4 style={{ margin: '0 0 8px 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                      Pending Settlements
                    </h4>
                    <div style={{
                      fontSize: '2rem',
                      fontWeight: '800',
                      background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                      backgroundClip: 'text',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent'
                    }}>
                      {selectedFamily.settlements.filter(s => !s.description?.includes('settled')).length}
                    </div>
                  </div>
                </div>

                {/* Member Balances */}
                <div className="glass-card" style={{ marginBottom: '30px' }}>
                  <h3 style={{ margin: '0 0 20px 0', color: 'var(--text-primary)' }}>💸 Member Balances</h3>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {selectedFamily.members.map(member => {
                      const balances = calculateBalances(selectedFamily);
                      const balance = balances[member._id] || 0;
                      const isOwed = balance > 0;

                      return (
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
                          <div>
                            <h4 style={{ margin: 0, marginBottom: '4px', fontWeight: '600' }}>
                              {member.name}
                            </h4>
                            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                              {member.email}
                            </p>
                          </div>

                          <div style={{
                            padding: '12px 20px',
                            borderRadius: '10px',
                            background: isOwed
                              ? 'rgba(16, 185, 129, 0.1)'
                              : 'rgba(239, 68, 68, 0.1)',
                            textAlign: 'right'
                          }}>
                            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                              {isOwed ? 'Owed to them' : 'Owes'}
                            </p>
                            <p style={{
                              margin: 0,
                              fontSize: '1.5rem',
                              fontWeight: '700',
                              color: isOwed ? '#10b981' : '#ef4444'
                            }}>
                              ₹{Math.abs(balance).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Settlements List */}
                <div className="glass-card">
                  <h3 style={{ margin: '0 0 20px 0', color: 'var(--text-primary)' }}>📋 Settlement History</h3>

                  {selectedFamily.settlements.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-secondary)' }}>
                      <p style={{ fontSize: '3rem', margin: '0 0 12px 0' }}>🎉</p>
                      <p style={{ margin: 0 }}>No settlements yet. All expenses are balanced!</p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {selectedFamily.settlements.map((settlement, idx) => (
                        <div
                          key={idx}
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
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
                              <span style={{ fontWeight: '600' }}>
                                {getMemberName(settlement.from, selectedFamily)}
                              </span>
                              <span style={{ color: 'var(--text-secondary)' }}>→</span>
                              <span style={{ fontWeight: '600' }}>
                                {getMemberName(settlement.to, selectedFamily)}
                              </span>
                            </div>
                            {settlement.description && (
                              <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                {settlement.description}
                              </p>
                            )}
                          </div>

                          <div style={{
                            padding: '8px 16px',
                            background: 'rgba(102, 126, 234, 0.1)',
                            borderRadius: '8px',
                            fontWeight: '700',
                            color: 'var(--primary)',
                            minWidth: '100px',
                            textAlign: 'right'
                          }}>
                            ₹{settlement.amount.toFixed(2)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </AdvancedLayout>
  );
}
