import { useEffect, useState } from 'react';
import api from '../services/api';

interface Category {
  _id: string;
  name: string;
  emoji: string;
  level: 1 | 2 | 3;
  children?: Category[];
}

interface CategorySelectorProps {
  value: string;
  onChange: (categoryId: string, categoryName: string) => void;
  onClose?: () => void;
}

export default function CategorySelector({ value, onChange, onClose }: CategorySelectorProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedMain, setSelectedMain] = useState<Category | null>(null);
  const [selectedSub, setSelectedSub] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fallbackCategories: Category[] = [
    {
      _id: 'entertainment',
      name: 'Entertainment',
      emoji: '🎬',
      level: 1,
      children: [
        { _id: 'streaming', name: 'Streaming Services', emoji: '🎪', level: 2, children: [
          { _id: 'netflix', name: 'Netflix', emoji: '🎥', level: 3 },
          { _id: 'hotstar', name: 'Hotstar', emoji: '⭐', level: 3 },
          { _id: 'prime', name: 'Prime Video', emoji: '🎁', level: 3 },
          { _id: 'spotify', name: 'Spotify', emoji: '🎵', level: 3 },
        ]},
      ],
    },
    {
      _id: 'food',
      name: 'Food & Dining',
      emoji: '🍔',
      level: 1,
      children: [
        { _id: 'groceries', name: 'Groceries', emoji: '🛒', level: 2 },
        { _id: 'restaurants', name: 'Restaurants', emoji: '🍽️', level: 2 },
      ],
    },
    {
      _id: 'transport',
      name: 'Transportation',
      emoji: '🚗',
      level: 1,
      children: [
        { _id: 'fuel', name: 'Fuel', emoji: '⛽', level: 2 },
        { _id: 'maintenance', name: 'Maintenance', emoji: '🔧', level: 2 },
      ],
    },
    {
      _id: 'utilities',
      name: 'Utilities & Bills',
      emoji: '💡',
      level: 1,
      children: [
        { _id: 'electricity', name: 'Electricity', emoji: '💡', level: 2 },
        { _id: 'water', name: 'Water', emoji: '💧', level: 2 },
      ],
    },
    {
      _id: 'housing',
      name: 'Rent & Housing',
      emoji: '🏠',
      level: 1,
      children: [
        { _id: 'rent', name: 'Rent', emoji: '🏘️', level: 2 },
        { _id: 'maintenance-home', name: 'Maintenance', emoji: '🔨', level: 2 },
      ],
    },
  ];

  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories');
      const data = res.data.data;
      setCategories(Array.isArray(data) ? data : fallbackCategories);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch categories, using fallback:', error);
      setCategories(fallbackCategories);
      setLoading(false);
    }
  };

  const handleMainSelect = (category: Category) => {
    setSelectedMain(category);
    if (category.children && category.children.length > 0) {
      setStep(2);
    } else {
      onChange(category._id, category.name);
      onClose?.();
    }
  };

  const handleSubSelect = (category: Category) => {
    setSelectedSub(category);
    if (category.children && category.children.length > 0) {
      setStep(3);
    } else {
      onChange(category._id, category.name);
      onClose?.();
    }
  };

  const handleSubSubSelect = (category: Category) => {
    onChange(category._id, category.name);
    onClose?.();
  };

  if (loading) {
    return (
      <div className="p-4 text-center text-gray-600">
        Loading categories...
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Step 1: Main Categories */}
      {step === 1 && (
        <div>
          <h3 className="text-lg font-semibold mb-3">Select Category</h3>
          <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
            {categories.map((cat) => (
              <button
                key={cat._id}
                onClick={() => handleMainSelect(cat)}
                className="p-3 text-left border border-gray-300 rounded-lg hover:bg-blue-50 hover:border-blue-500 transition"
              >
                <div className="text-2xl">{cat.emoji}</div>
                <div className="text-sm font-semibold text-gray-900 mt-1">{cat.name}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 2: Subcategories */}
      {step === 2 && selectedMain && (
        <div>
          <button
            onClick={() => {
              setStep(1);
              setSelectedMain(null);
            }}
            className="text-blue-600 hover:text-blue-800 text-sm mb-3 flex items-center gap-1"
          >
            ← Back
          </button>
          <h3 className="text-lg font-semibold mb-3">
            {selectedMain.emoji} {selectedMain.name}
          </h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {selectedMain.children?.map((cat) => (
              <button
                key={cat._id}
                onClick={() => handleSubSelect(cat)}
                className="w-full p-3 text-left border border-gray-300 rounded-lg hover:bg-blue-50 hover:border-blue-500 transition"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{cat.emoji}</span>
                  <div>
                    <div className="text-sm font-semibold text-gray-900">{cat.name}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 3: Sub-subcategories */}
      {step === 3 && selectedSub && (
        <div>
          <button
            onClick={() => {
              setStep(2);
              setSelectedSub(null);
            }}
            className="text-blue-600 hover:text-blue-800 text-sm mb-3 flex items-center gap-1"
          >
            ← Back
          </button>
          <h3 className="text-lg font-semibold mb-3">
            {selectedSub.emoji} {selectedSub.name}
          </h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {selectedSub.children?.map((cat) => (
              <button
                key={cat._id}
                onClick={() => handleSubSubSelect(cat)}
                className="w-full p-3 text-left border border-gray-300 rounded-lg hover:bg-blue-50 hover:border-blue-500 transition"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{cat.emoji}</span>
                  <div>
                    <div className="text-sm font-semibold text-gray-900">{cat.name}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
