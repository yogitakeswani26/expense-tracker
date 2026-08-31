import { Category } from '../models/Category';

interface CatData {
  name: string;
  emoji: string;
  description?: string;
  level: 1 | 2 | 3;
  order: number;
  subcategories?: CatData[];
}

const categoryHierarchy: CatData[] = [
  {
    name: 'Entertainment',
    emoji: '🎬',
    description: 'Entertainment and leisure expenses',
    level: 1,
    order: 1,
    subcategories: [
      {
        name: 'Streaming Services',
        emoji: '🎪',
        description: 'Streaming platforms',
        level: 2,
        order: 1,
        subcategories: [
          { name: 'Hotstar', emoji: '⭐', level: 3, order: 1 },
          { name: 'Netflix', emoji: '🎥', level: 3, order: 2 },
          { name: 'Prime Video', emoji: '🎁', level: 3, order: 3 },
          { name: 'Disney+', emoji: '✨', level: 3, order: 4 },
          { name: 'Spotify', emoji: '🎵', level: 3, order: 5 },
          { name: 'YouTube Premium', emoji: '📺', level: 3, order: 6 },
          { name: 'SonyLiv', emoji: '🎞️', level: 3, order: 7 },
          { name: 'ZEE5', emoji: '📽️', level: 3, order: 8 },
          { name: 'ALTBalaji', emoji: '🎭', level: 3, order: 9 },
          { name: 'Other Streaming', emoji: '🎪', level: 3, order: 10 },
        ],
      },
      {
        name: 'Movies & Cinemas',
        emoji: '🎫',
        level: 2,
        order: 2,
        subcategories: [
          { name: 'Movie Tickets', emoji: '🎫', level: 3, order: 1 },
          { name: 'IMAX/Premium Shows', emoji: '🍿', level: 3, order: 2 },
          { name: 'Movie Snacks', emoji: '🍿', level: 3, order: 3 },
        ],
      },
      {
        name: 'Gaming',
        emoji: '🎮',
        level: 2,
        order: 3,
        subcategories: [
          { name: 'Game Passes', emoji: '🎮', level: 3, order: 1 },
          { name: 'In-game Purchases', emoji: '💎', level: 3, order: 2 },
          { name: 'Gaming Hardware', emoji: '🖱️', level: 3, order: 3 },
          { name: 'Gaming Cafe', emoji: '🎮', level: 3, order: 4 },
        ],
      },
      {
        name: 'Events & Concerts',
        emoji: '🎤',
        level: 2,
        order: 4,
        subcategories: [
          { name: 'Concert Tickets', emoji: '🎤', level: 3, order: 1 },
          { name: 'Sports Events', emoji: '⚽', level: 3, order: 2 },
          { name: 'Festival Events', emoji: '🎪', level: 3, order: 3 },
          { name: 'Music Events', emoji: '🎵', level: 3, order: 4 },
        ],
      },
    ],
  },
  {
    name: 'Food & Dining',
    emoji: '🍔',
    description: 'Food and dining expenses',
    level: 1,
    order: 2,
    subcategories: [
      {
        name: 'Groceries',
        emoji: '🛒',
        level: 2,
        order: 1,
        subcategories: [
          { name: 'Vegetables & Fruits', emoji: '🥕', level: 3, order: 1 },
          { name: 'Grains & Pulses', emoji: '🌾', level: 3, order: 2 },
          { name: 'Oil & Spices', emoji: '🧂', level: 3, order: 3 },
          { name: 'Dairy & Eggs', emoji: '🥛', level: 3, order: 4 },
          { name: 'Frozen Foods', emoji: '❄️', level: 3, order: 5 },
          { name: 'Beverages', emoji: '🥤', level: 3, order: 6 },
          { name: 'Snacks', emoji: '🍿', level: 3, order: 7 },
          { name: 'Packaged Food', emoji: '📦', level: 3, order: 8 },
        ],
      },
      {
        name: 'Restaurants & Eating Out',
        emoji: '🍽️',
        level: 2,
        order: 2,
        subcategories: [
          { name: 'Breakfast', emoji: '🥐', level: 3, order: 1 },
          { name: 'Lunch', emoji: '🍜', level: 3, order: 2 },
          { name: 'Dinner', emoji: '🍛', level: 3, order: 3 },
          { name: 'Fast Food', emoji: '🍔', level: 3, order: 4 },
          { name: 'Cafe & Coffee', emoji: '☕', level: 3, order: 5 },
          { name: 'Desserts & Bakery', emoji: '🍰', level: 3, order: 6 },
          { name: 'Bars & Nightlife', emoji: '🍻', level: 3, order: 7 },
        ],
      },
      {
        name: 'Meal Subscriptions',
        emoji: '🥗',
        level: 2,
        order: 3,
        subcategories: [
          { name: 'Fitness Meal Plans', emoji: '🥗', level: 3, order: 1 },
          { name: 'Delivery Subscription', emoji: '🚚', level: 3, order: 2 },
        ],
      },
    ],
  },
  {
    name: 'Transportation',
    emoji: '🚗',
    description: 'Transportation and vehicle expenses',
    level: 1,
    order: 3,
    subcategories: [
      {
        name: 'Fuel',
        emoji: '🛢️',
        level: 2,
        order: 1,
        subcategories: [
          { name: 'Petrol', emoji: '⛽', level: 3, order: 1 },
          { name: 'Diesel', emoji: '🛢️', level: 3, order: 2 },
          { name: 'CNG', emoji: '💨', level: 3, order: 3 },
        ],
      },
      {
        name: 'Vehicle Maintenance',
        emoji: '🔧',
        level: 2,
        order: 2,
        subcategories: [
          { name: 'Oil Changes', emoji: '🛢️', level: 3, order: 1 },
          { name: 'Spare Parts', emoji: '🔩', level: 3, order: 2 },
          { name: 'Car Wash', emoji: '🚙', level: 3, order: 3 },
          { name: 'Servicing', emoji: '🔧', level: 3, order: 4 },
          { name: 'Tires', emoji: '🛞', level: 3, order: 5 },
          { name: 'Battery', emoji: '🔋', level: 3, order: 6 },
        ],
      },
      {
        name: 'Public Transport',
        emoji: '🚌',
        level: 2,
        order: 3,
        subcategories: [
          { name: 'Bus Pass', emoji: '🚌', level: 3, order: 1 },
          { name: 'Train Pass', emoji: '🚄', level: 3, order: 2 },
          { name: 'Metro Card', emoji: '🚇', level: 3, order: 3 },
          { name: 'Auto/Taxi', emoji: '🛵', level: 3, order: 4 },
          { name: 'Flight Tickets', emoji: '✈️', level: 3, order: 5 },
        ],
      },
      {
        name: 'Vehicle Insurance',
        emoji: '🛡️',
        level: 2,
        order: 4,
      },
      {
        name: 'Parking & Tolls',
        emoji: '🅿️',
        level: 2,
        order: 5,
      },
    ],
  },
  {
    name: 'Utilities & Bills',
    emoji: '💡',
    description: 'Utility bills and services',
    level: 1,
    order: 4,
    subcategories: [
      { name: 'Electricity', emoji: '💡', level: 2, order: 1 },
      { name: 'Water & Sewage', emoji: '💧', level: 2, order: 2 },
      {
        name: 'Internet & Mobile',
        emoji: '📱',
        level: 2,
        order: 3,
        subcategories: [
          { name: 'Internet Bill', emoji: '🌐', level: 3, order: 1 },
          { name: 'Mobile Recharge', emoji: '📞', level: 3, order: 2 },
          { name: 'DTH/Cable TV', emoji: '📺', level: 3, order: 3 },
        ],
      },
      { name: 'Gas (Cooking)', emoji: '🔥', level: 2, order: 4 },
      { name: 'Household Insurance', emoji: '🛡️', level: 2, order: 5 },
    ],
  },
  {
    name: 'Rent & Housing',
    emoji: '🏠',
    description: 'Rent and housing expenses',
    level: 1,
    order: 5,
    subcategories: [
      { name: 'Rent', emoji: '🏘️', level: 2, order: 1 },
      { name: 'Home Loan/EMI', emoji: '🏦', level: 2, order: 2 },
      { name: 'Property Maintenance', emoji: '🔨', level: 2, order: 3 },
      { name: 'Property Tax', emoji: '📋', level: 2, order: 4 },
      { name: 'Home Insurance', emoji: '🛡️', level: 2, order: 5 },
      { name: 'Society Charges', emoji: '👥', level: 2, order: 6 },
    ],
  },
  {
    name: 'Health & Fitness',
    emoji: '💪',
    description: 'Health and fitness expenses',
    level: 1,
    order: 6,
    subcategories: [
      {
        name: 'Gym Membership',
        emoji: '🏋️',
        level: 2,
        order: 1,
        subcategories: [
          { name: 'Gym Fees', emoji: '💪', level: 3, order: 1 },
          { name: 'Personal Training', emoji: '👨‍🏫', level: 3, order: 2 },
          { name: 'Online Classes', emoji: '📱', level: 3, order: 3 },
        ],
      },
      {
        name: 'Medical & Doctor',
        emoji: '🏥',
        level: 2,
        order: 2,
        subcategories: [
          { name: 'Doctor Visits', emoji: '👨‍⚕️', level: 3, order: 1 },
          { name: 'Hospital Bills', emoji: '🏥', level: 3, order: 2 },
          { name: 'Medicines', emoji: '💊', level: 3, order: 3 },
          { name: 'Lab Tests', emoji: '🧬', level: 3, order: 4 },
          { name: 'Dental Care', emoji: '🦷', level: 3, order: 5 },
          { name: 'Eye Care', emoji: '👁️', level: 3, order: 6 },
        ],
      },
      { name: 'Health Insurance', emoji: '🛡️', level: 2, order: 3 },
      { name: 'Supplements', emoji: '💊', level: 2, order: 4 },
      { name: 'Sports Equipment', emoji: '⚽', level: 2, order: 5 },
    ],
  },
  {
    name: 'Education',
    emoji: '📚',
    description: 'Education and learning expenses',
    level: 1,
    order: 7,
    subcategories: [
      { name: 'Tuition Fees', emoji: '🎓', level: 2, order: 1 },
      { name: 'Courses & Classes', emoji: '📖', level: 2, order: 2 },
      { name: 'Books & Materials', emoji: '📕', level: 2, order: 3 },
      { name: 'Online Learning', emoji: '💻', level: 2, order: 4 },
      { name: 'School Fees', emoji: '🏫', level: 2, order: 5 },
      { name: 'Exam Fees', emoji: '📝', level: 2, order: 6 },
      { name: 'Coaching Classes', emoji: '👨‍🎓', level: 2, order: 7 },
    ],
  },
  {
    name: 'Insurance',
    emoji: '🛡️',
    description: 'Insurance premiums',
    level: 1,
    order: 8,
    subcategories: [
      { name: 'Health Insurance', emoji: '🏥', level: 2, order: 1 },
      { name: 'Life Insurance', emoji: '💚', level: 2, order: 2 },
      { name: 'Home Insurance', emoji: '🏠', level: 2, order: 3 },
      { name: 'Vehicle Insurance', emoji: '🚗', level: 2, order: 4 },
      { name: 'Travel Insurance', emoji: '✈️', level: 2, order: 5 },
      { name: 'Pet Insurance', emoji: '🐕', level: 2, order: 6 },
      { name: 'Gadget Insurance', emoji: '📱', level: 2, order: 7 },
    ],
  },
  {
    name: 'EMI & Loans',
    emoji: '🏦',
    description: 'EMI and loan payments',
    level: 1,
    order: 9,
    subcategories: [
      { name: 'Car EMI', emoji: '🚗', level: 2, order: 1 },
      { name: 'Home Loan', emoji: '🏠', level: 2, order: 2 },
      { name: 'Personal Loan', emoji: '💰', level: 2, order: 3 },
      { name: 'Education Loan', emoji: '📚', level: 2, order: 4 },
      { name: 'Credit Card Bill', emoji: '💳', level: 2, order: 5 },
      { name: 'Other EMIs', emoji: '📋', level: 2, order: 6 },
    ],
  },
  {
    name: 'Shopping & Clothing',
    emoji: '👔',
    description: 'Shopping and clothing expenses',
    level: 1,
    order: 10,
    subcategories: [
      { name: 'Clothes & Shoes', emoji: '👕', level: 2, order: 1 },
      { name: 'Accessories', emoji: '👜', level: 2, order: 2 },
      {
        name: 'Electronics',
        emoji: '📱',
        level: 2,
        order: 3,
        subcategories: [
          { name: 'Mobile', emoji: '📱', level: 3, order: 1 },
          { name: 'Laptop', emoji: '💻', level: 3, order: 2 },
          { name: 'Headphones', emoji: '🎧', level: 3, order: 3 },
          { name: 'Smartwatch', emoji: '⌚', level: 3, order: 4 },
          { name: 'Accessories', emoji: '🔌', level: 3, order: 5 },
        ],
      },
      { name: 'Furniture', emoji: '🛋️', level: 2, order: 4 },
      { name: 'Home Appliances', emoji: '🍳', level: 2, order: 5 },
      { name: 'Beauty & Grooming', emoji: '💄', level: 2, order: 6 },
    ],
  },
  {
    name: 'Personal Care & Grooming',
    emoji: '💇',
    description: 'Personal care expenses',
    level: 1,
    order: 11,
    subcategories: [
      { name: 'Haircut & Salon', emoji: '💇', level: 2, order: 1 },
      { name: 'Skincare', emoji: '🧴', level: 2, order: 2 },
      { name: 'Makeup', emoji: '💄', level: 2, order: 3 },
      { name: 'Perfume', emoji: '👃', level: 2, order: 4 },
      { name: 'Personal Hygiene', emoji: '🧼', level: 2, order: 5 },
    ],
  },
  {
    name: 'Travel & Vacation',
    emoji: '✈️',
    description: 'Travel and vacation expenses',
    level: 1,
    order: 12,
    subcategories: [
      { name: 'Flight Tickets', emoji: '✈️', level: 2, order: 1 },
      { name: 'Hotel & Accommodation', emoji: '🏨', level: 2, order: 2 },
      { name: 'Travel Insurance', emoji: '✈️', level: 2, order: 3 },
      { name: 'Tour Packages', emoji: '🗺️', level: 2, order: 4 },
      { name: 'Car Rental', emoji: '🚗', level: 2, order: 5 },
      { name: 'Local Travel', emoji: '🚕', level: 2, order: 6 },
    ],
  },
  {
    name: 'Family & Social',
    emoji: '👨‍👩‍👧‍👦',
    description: 'Family and social expenses',
    level: 1,
    order: 13,
    subcategories: [
      { name: 'Gifts', emoji: '🎁', level: 2, order: 1 },
      { name: 'Celebrations & Events', emoji: '🎉', level: 2, order: 2 },
      { name: 'Family Dinners', emoji: '🍽️', level: 2, order: 3 },
      { name: 'Kids Allowance', emoji: '👧', level: 2, order: 4 },
      { name: 'Pet Care', emoji: '🐕', level: 2, order: 5 },
      { name: 'Donations', emoji: '🤝', level: 2, order: 6 },
    ],
  },
  {
    name: 'Subscriptions',
    emoji: '📡',
    description: 'Subscription services',
    level: 1,
    order: 14,
    subcategories: [
      { name: 'Software Subscriptions', emoji: '💻', level: 2, order: 1 },
      { name: 'News & Magazine', emoji: '📰', level: 2, order: 2 },
      { name: 'Cloud Storage', emoji: '☁️', level: 2, order: 3 },
      { name: 'Fitness Apps', emoji: '💪', level: 2, order: 4 },
      { name: 'Productivity Tools', emoji: '📅', level: 2, order: 5 },
    ],
  },
  {
    name: 'Miscellaneous',
    emoji: '🎯',
    description: 'Miscellaneous expenses',
    level: 1,
    order: 15,
    subcategories: [
      { name: 'Office Supplies', emoji: '📎', level: 2, order: 1 },
      { name: 'Household Items', emoji: '🧹', level: 2, order: 2 },
      { name: 'Pet Supplies', emoji: '🐾', level: 2, order: 3 },
      { name: 'Repairs & Maintenance', emoji: '🔧', level: 2, order: 4 },
      { name: 'Other Expenses', emoji: '📌', level: 2, order: 5 },
    ],
  },
];

export const seedCategories = async () => {
  try {
    const existingCount = await Category.countDocuments({ isActive: true });
    if (existingCount > 50) {
      console.log('✅ Categories already seeded (found ' + existingCount + ' active categories)');
      return;
    }

    let totalCreated = 0;

    for (const mainCat of categoryHierarchy) {
      const createdMain = await Category.create({
        name: mainCat.name,
        emoji: mainCat.emoji,
        description: mainCat.description,
        level: 1,
        order: mainCat.order,
        parentId: null,
        isActive: true,
        isDefault: true
      });
      totalCreated++;

      if (mainCat.subcategories) {
        for (const subCat of mainCat.subcategories) {
          const createdSub = await Category.create({
            name: subCat.name,
            emoji: subCat.emoji,
            description: subCat.description,
            level: 2,
            order: subCat.order,
            parentId: createdMain._id,
            isActive: true,
            isDefault: true
          });
          totalCreated++;

          if (subCat.subcategories) {
            for (const subSubCat of subCat.subcategories) {
              await Category.create({
                name: subSubCat.name,
                emoji: subSubCat.emoji,
                description: subSubCat.description,
                level: 3,
                order: subSubCat.order,
                parentId: createdSub._id,
                isActive: true,
                isDefault: true
              });
              totalCreated++;
            }
          }
        }
      }
    }

    console.log(`✅ Seeded ${totalCreated} categories successfully!`);
  } catch (error) {
    console.error('❌ Error seeding categories:', error);
  }
};
