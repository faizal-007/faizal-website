import { getTodayDateStr, getRelativeDateStr } from '../utils/formatters';

export const INITIAL_SETTINGS = {
  stationName: 'Sri Balaji Petroleum',
  dealerCode: 'IOCL-RO-56214',
  tagline: 'IndianOil Authorized Dealer',
  gstin: '29AABCS1429B1Z8',
  address: 'Plot 14-A, Tumakuru Main Road, Peenya Industrial Area, Bengaluru - 560058',
  phone: '+91 80 2839 4455',
  email: 'balaji.petroleum.blr@gmail.com',
  currency: '₹',
  timezone: 'Asia/Kolkata',
  rates: {
    Petrol: 102.84,
    Diesel: 88.92,
    'Power Petrol': 109.50,
  },
  defaultOpeningCash: 25000,
  supervisorPin: '1234',
  customExpenseCategories: [
    'Electricity',
    'Staff Salary',
    'Maintenance',
    'Tea / Food',
    'Transport',
    'Cleaning',
    'Office Expenses',
    'Generator Fuel',
    'Safety Equipment',
    'Other'
  ]
};

export const INITIAL_PUMPS = [
  // PETROL (4)
  { id: 'p-1', name: 'Petrol Pump 1', pumpNumber: 1, fuelType: 'Petrol', status: 'Active', assignedStaffId: 'staff-1' },
  { id: 'p-2', name: 'Petrol Pump 2', pumpNumber: 2, fuelType: 'Petrol', status: 'Active', assignedStaffId: 'staff-2' },
  { id: 'p-3', name: 'Petrol Pump 3', pumpNumber: 3, fuelType: 'Petrol', status: 'Active', assignedStaffId: 'staff-1' },
  { id: 'p-4', name: 'Petrol Pump 4', pumpNumber: 4, fuelType: 'Petrol', status: 'Active', assignedStaffId: 'staff-3' },

  // DIESEL (4)
  { id: 'p-5', name: 'Diesel Pump 1', pumpNumber: 5, fuelType: 'Diesel', status: 'Active', assignedStaffId: 'staff-4' },
  { id: 'p-6', name: 'Diesel Pump 2', pumpNumber: 6, fuelType: 'Diesel', status: 'Active', assignedStaffId: 'staff-4' },
  { id: 'p-7', name: 'Diesel Pump 3', pumpNumber: 7, fuelType: 'Diesel', status: 'Active', assignedStaffId: 'staff-5' },
  { id: 'p-8', name: 'Diesel Pump 4', pumpNumber: 8, fuelType: 'Diesel', status: 'Inactive', assignedStaffId: null },

  // POWER PETROL (2)
  { id: 'p-9', name: 'Power Petrol Pump 1', pumpNumber: 9, fuelType: 'Power Petrol', status: 'Active', assignedStaffId: 'staff-2' },
  { id: 'p-10', name: 'Power Petrol Pump 2', pumpNumber: 10, fuelType: 'Power Petrol', status: 'Active', assignedStaffId: 'staff-3' },
];

export const INITIAL_STAFF = [
  { id: 'staff-1', name: 'Rajesh Kumar', phone: '+91 98450 12345', role: 'Pump Operator', status: 'Active', assignedPumpId: 'p-1' },
  { id: 'staff-2', name: 'Suresh Patil', phone: '+91 97412 88321', role: 'Senior Operator', status: 'Active', assignedPumpId: 'p-2' },
  { id: 'staff-3', name: 'Vikram Singh', phone: '+91 99001 77654', role: 'Cashier', status: 'Active', assignedPumpId: null },
  { id: 'staff-4', name: 'Amit Yadav', phone: '+91 96112 55432', role: 'Pump Operator', status: 'Active', assignedPumpId: 'p-5' },
  { id: 'staff-5', name: 'Priya Sharma', phone: '+91 94480 33219', role: 'Supervisor', status: 'Active', assignedPumpId: null },
];

export function generateSampleData() {
  const today = getTodayDateStr();
  const yesterday = getRelativeDateStr(-1);
  const twoDaysAgo = getRelativeDateStr(-2);

  const sampleTransactions = [
    // Today's Sales
    {
      id: 'TXN-TODAY-01',
      date: today,
      time: '06:45',
      staffId: 'staff-1',
      staffName: 'Rajesh Kumar',
      fuelCategory: 'Petrol',
      pumpId: 'p-1',
      pumpName: 'Petrol Pump 1',
      vehicleNumber: 'KA-04-ME-4821',
      litres: 15.00,
      fuelRate: 102.84,
      totalAmount: 1542.60,
      isManualOverride: false,
      overrideReason: '',
      paymentMethod: 'GPay',
      transactionRef: 'GPAY-781928374',
      notes: 'Car tank fill',
      isSample: true,
      createdAt: `${today}T06:45:00.000Z`,
      updatedAt: `${today}T06:45:00.000Z`,
      editHistory: []
    },
    {
      id: 'TXN-TODAY-02',
      date: today,
      time: '07:15',
      staffId: 'staff-4',
      staffName: 'Amit Yadav',
      fuelCategory: 'Diesel',
      pumpId: 'p-5',
      pumpName: 'Diesel Pump 1',
      vehicleNumber: 'KA-51-AB-9012',
      litres: 80.00,
      fuelRate: 88.92,
      totalAmount: 7113.60,
      isManualOverride: false,
      overrideReason: '',
      paymentMethod: 'Cash',
      transactionRef: '',
      notes: 'Commercial truck (Eicher)',
      isSample: true,
      createdAt: `${today}T07:15:00.000Z`,
      updatedAt: `${today}T07:15:00.000Z`,
      editHistory: []
    },
    {
      id: 'TXN-TODAY-03',
      date: today,
      time: '08:30',
      staffId: 'staff-2',
      staffName: 'Suresh Patil',
      fuelCategory: 'Power Petrol',
      pumpId: 'p-9',
      pumpName: 'Power Petrol Pump 1',
      vehicleNumber: 'MH-12-RP-1100',
      litres: 35.50,
      fuelRate: 109.50,
      totalAmount: 3887.25,
      isManualOverride: false,
      overrideReason: '',
      paymentMethod: 'Other UPI',
      transactionRef: 'PAYTM-992144310',
      notes: 'SUV premium octane fill',
      isSample: true,
      createdAt: `${today}T08:30:00.000Z`,
      updatedAt: `${today}T08:30:00.000Z`,
      editHistory: []
    },
    {
      id: 'TXN-TODAY-04',
      date: today,
      time: '09:10',
      staffId: 'staff-1',
      staffName: 'Rajesh Kumar',
      fuelCategory: 'Petrol',
      pumpId: 'p-2',
      pumpName: 'Petrol Pump 2',
      vehicleNumber: 'KA-01-JJ-5510',
      litres: 5.00,
      fuelRate: 102.84,
      totalAmount: 514.20,
      isManualOverride: false,
      overrideReason: '',
      paymentMethod: 'Cash',
      transactionRef: '',
      notes: 'Two-wheeler Honda Activa',
      isSample: true,
      createdAt: `${today}T09:10:00.000Z`,
      updatedAt: `${today}T09:10:00.000Z`,
      editHistory: []
    },
    {
      id: 'TXN-TODAY-05',
      date: today,
      time: '10:05',
      staffId: 'staff-4',
      staffName: 'Amit Yadav',
      fuelCategory: 'Diesel',
      pumpId: 'p-6',
      pumpName: 'Diesel Pump 2',
      vehicleNumber: 'KA-05-TR-7721',
      litres: 50.00,
      fuelRate: 88.92,
      totalAmount: 4446.00,
      isManualOverride: false,
      overrideReason: '',
      paymentMethod: 'Card',
      transactionRef: 'HDFC-POS-882190',
      notes: 'Innova fleet vehicle',
      isSample: true,
      createdAt: `${today}T10:05:00.000Z`,
      updatedAt: `${today}T10:05:00.000Z`,
      editHistory: []
    },
    {
      id: 'TXN-TODAY-06',
      date: today,
      time: '11:20',
      staffId: 'staff-2',
      staffName: 'Suresh Patil',
      fuelCategory: 'Petrol',
      pumpId: 'p-3',
      pumpName: 'Petrol Pump 3',
      vehicleNumber: 'DL-3C-CD-4190',
      litres: 28.50,
      fuelRate: 102.84,
      totalAmount: 2930.94,
      isManualOverride: false,
      overrideReason: '',
      paymentMethod: 'GPay',
      transactionRef: 'GPAY-441098231',
      notes: 'Sedan',
      isSample: true,
      createdAt: `${today}T11:20:00.000Z`,
      updatedAt: `${today}T11:20:00.000Z`,
      editHistory: []
    },
    {
      id: 'TXN-TODAY-07',
      date: today,
      time: '13:00',
      staffId: 'staff-3',
      staffName: 'Vikram Singh',
      fuelCategory: 'Power Petrol',
      pumpId: 'p-10',
      pumpName: 'Power Petrol Pump 2',
      vehicleNumber: 'KA-03-MK-7007',
      litres: 20.00,
      fuelRate: 109.50,
      totalAmount: 2190.00,
      isManualOverride: false,
      overrideReason: '',
      paymentMethod: 'Cash',
      transactionRef: '',
      notes: 'KTM Duke 390',
      isSample: true,
      createdAt: `${today}T13:00:00.000Z`,
      updatedAt: `${today}T13:00:00.000Z`,
      editHistory: []
    },

    // Yesterday's Sales
    {
      id: 'TXN-YEST-01',
      date: yesterday,
      time: '07:30',
      staffId: 'staff-1',
      staffName: 'Rajesh Kumar',
      fuelCategory: 'Petrol',
      pumpId: 'p-1',
      pumpName: 'Petrol Pump 1',
      vehicleNumber: 'KA-04-Q-9912',
      litres: 30.00,
      fuelRate: 102.84,
      totalAmount: 3085.20,
      paymentMethod: 'Cash',
      transactionRef: '',
      notes: 'Yesterday morning sale',
      isSample: true,
      createdAt: `${yesterday}T07:30:00.000Z`,
      updatedAt: `${yesterday}T07:30:00.000Z`,
      editHistory: []
    },
    {
      id: 'TXN-YEST-02',
      date: yesterday,
      time: '09:45',
      staffId: 'staff-4',
      staffName: 'Amit Yadav',
      fuelCategory: 'Diesel',
      pumpId: 'p-5',
      pumpName: 'Diesel Pump 1',
      vehicleNumber: 'KA-41-C-8820',
      litres: 120.00,
      fuelRate: 88.92,
      totalAmount: 10670.40,
      paymentMethod: 'GPay',
      transactionRef: 'GPAY-88129034',
      notes: 'Bus diesel refill',
      isSample: true,
      createdAt: `${yesterday}T09:45:00.000Z`,
      updatedAt: `${yesterday}T09:45:00.000Z`,
      editHistory: []
    },
    {
      id: 'TXN-YEST-03',
      date: yesterday,
      time: '15:15',
      staffId: 'staff-2',
      staffName: 'Suresh Patil',
      fuelCategory: 'Petrol',
      pumpId: 'p-2',
      pumpName: 'Petrol Pump 2',
      vehicleNumber: 'KA-02-EE-3211',
      litres: 18.25,
      fuelRate: 102.84,
      totalAmount: 1876.83,
      paymentMethod: 'Other UPI',
      transactionRef: 'PHONEPE-10293847',
      notes: 'Swift Dzire',
      isSample: true,
      createdAt: `${yesterday}T15:15:00.000Z`,
      updatedAt: `${yesterday}T15:15:00.000Z`,
      editHistory: []
    },
    {
      id: 'TXN-YEST-04',
      date: yesterday,
      time: '18:40',
      staffId: 'staff-3',
      staffName: 'Vikram Singh',
      fuelCategory: 'Power Petrol',
      pumpId: 'p-9',
      pumpName: 'Power Petrol Pump 1',
      vehicleNumber: 'KA-05-MM-1234',
      litres: 42.00,
      fuelRate: 109.50,
      totalAmount: 4599.00,
      paymentMethod: 'Card',
      transactionRef: 'POS-192837',
      notes: 'Harrier fuel',
      isSample: true,
      createdAt: `${yesterday}T18:40:00.000Z`,
      updatedAt: `${yesterday}T18:40:00.000Z`,
      editHistory: []
    },

    // 2 Days Ago Sales
    {
      id: 'TXN-PAST-01',
      date: twoDaysAgo,
      time: '08:00',
      staffId: 'staff-1',
      staffName: 'Rajesh Kumar',
      fuelCategory: 'Petrol',
      pumpId: 'p-1',
      pumpName: 'Petrol Pump 1',
      vehicleNumber: 'KA-04-MM-9999',
      litres: 25.00,
      fuelRate: 102.84,
      totalAmount: 2571.00,
      paymentMethod: 'Cash',
      transactionRef: '',
      notes: '',
      isSample: true,
      createdAt: `${twoDaysAgo}T08:00:00.000Z`,
      updatedAt: `${twoDaysAgo}T08:00:00.000Z`,
      editHistory: []
    },
    {
      id: 'TXN-PAST-02',
      date: twoDaysAgo,
      time: '11:30',
      staffId: 'staff-4',
      staffName: 'Amit Yadav',
      fuelCategory: 'Diesel',
      pumpId: 'p-7',
      pumpName: 'Diesel Pump 3',
      vehicleNumber: 'KA-52-T-5432',
      litres: 95.00,
      fuelRate: 88.92,
      totalAmount: 8447.40,
      paymentMethod: 'GPay',
      transactionRef: 'GPAY-55102948',
      notes: 'Cement lorry',
      isSample: true,
      createdAt: `${twoDaysAgo}T11:30:00.000Z`,
      updatedAt: `${twoDaysAgo}T11:30:00.000Z`,
      editHistory: []
    }
  ];

  const sampleExpenses = [
    {
      id: 'EXP-TODAY-01',
      date: today,
      category: 'Tea / Food',
      amount: 320.00,
      paymentMethod: 'Cash',
      paidTo: 'Sharma Tea Stall',
      description: 'Morning and afternoon tea/snacks for 6 shift workers',
      recordedBy: 'Vikram Singh',
      isSample: true,
      createdAt: `${today}T11:00:00.000Z`
    },
    {
      id: 'EXP-TODAY-02',
      date: today,
      category: 'Cleaning',
      amount: 450.00,
      paymentMethod: 'Cash',
      paidTo: 'Munna Cleaning Supplies',
      description: 'Forecourt detergent powder, wiper blades & trash bags',
      recordedBy: 'Priya Sharma',
      isSample: true,
      createdAt: `${today}T12:30:00.000Z`
    },
    {
      id: 'EXP-YEST-01',
      date: yesterday,
      category: 'Maintenance',
      amount: 1250.00,
      paymentMethod: 'GPay',
      paidTo: 'Air Compressor Technician (Ramu)',
      description: 'Free air unit hose replacement & pressure nozzle calibration',
      recordedBy: 'Priya Sharma',
      isSample: true,
      createdAt: `${yesterday}T14:00:00.000Z`
    },
    {
      id: 'EXP-YEST-02',
      date: yesterday,
      category: 'Office Expenses',
      amount: 600.00,
      paymentMethod: 'Cash',
      paidTo: 'Balaji Stationery',
      description: 'Thermal billing paper rolls (pack of 20) & receipt books',
      recordedBy: 'Vikram Singh',
      isSample: true,
      createdAt: `${yesterday}T16:30:00.000Z`
    },
    {
      id: 'EXP-PAST-01',
      date: twoDaysAgo,
      category: 'Generator Fuel',
      amount: 1500.00,
      paymentMethod: 'Cash',
      paidTo: 'Station Internal Transfer',
      description: '17L diesel filled into 25KVA backup DG set for power cut',
      recordedBy: 'Vikram Singh',
      isSample: true,
      createdAt: `${twoDaysAgo}T17:00:00.000Z`
    }
  ];

  const sampleAdjustments = [
    {
      id: 'COL-TODAY-01',
      date: today,
      time: '12:15',
      amount: 5000.00,
      paymentType: 'GPay',
      transactionRef: 'GPAY-BANK-CREDIT-9102',
      relatedPumpId: 'p-1',
      notes: 'Direct QR fleet customer pre-payment advance (Apex Logistics)',
      isSample: true,
      createdAt: `${today}T12:15:00.000Z`
    },
    {
      id: 'COL-YEST-01',
      date: yesterday,
      time: '16:00',
      amount: 3500.00,
      paymentType: 'Other UPI',
      transactionRef: 'PHONEPE-SETTLE-8812',
      relatedPumpId: 'p-5',
      notes: 'Direct bank QR settlement for corporate diesel voucher',
      isSample: true,
      createdAt: `${yesterday}T16:00:00.000Z`
    }
  ];

  // Yesterday's pre-calculated closed record
  const sampleClosings = {
    [yesterday]: {
      id: `CLOSE-${yesterday}`,
      date: yesterday,
      closedAt: `${yesterday}T22:30:00.000Z`,
      closedBy: 'Priya Sharma (Supervisor)',
      status: 'Closed',
      openingCash: 25000.00,
      totalSales: {
        Petrol: 4962.03,
        Diesel: 10670.40,
        'Power Petrol': 4599.00,
        total: 20231.43,
        totalLitres: 210.25
      },
      paymentBreakdown: {
        Cash: 3085.20,
        GPay: 10670.40,
        'Other UPI': 1876.83,
        Card: 4599.00,
        total: 20231.43
      },
      expenses: {
        cash: 600.00,
        digital: 1250.00,
        total: 1850.00
      },
      cashAdjustments: 0.00,
      adjustmentReason: 'Standard closing',
      expectedCash: 27485.20, // 25000 + 3085.20 - 600.00
      actualCashCounted: 27485.20,
      denominations: {
        500: 50, // 25000
        200: 10, // 2000
        100: 4,  // 400
        50: 1,   // 50
        20: 1,   // 20
        10: 1,   // 10
        coins: 5.20
      },
      cashDifference: 0.00,
      closingStatus: 'Matched',
      isLocked: true,
      reopenLogs: []
    }
  };

  const sampleAuditLogs = [
    {
      id: 'AUDIT-01',
      timestamp: `${yesterday}T22:30:00.000Z`,
      action: 'DAILY_CLOSE',
      entity: 'DAILY_CLOSING',
      details: `Closed accounts for date ${yesterday}. Status: Matched. Expected & Counted: ₹27,485.20`,
      user: 'Priya Sharma (Supervisor)'
    },
    {
      id: 'AUDIT-02',
      timestamp: `${today}T06:30:00.000Z`,
      action: 'SHIFT_START',
      entity: 'STATION',
      details: 'Morning shift opened with default opening cash ₹25,000.00',
      user: 'Rajesh Kumar (Operator)'
    }
  ];

  // Sample Pump Meter Readings (Opening, Closing, 5L Testing)
  const samplePumpReadings = {
    [today]: {
      'p-1': {
        openingMeter: 1000,
        closingMeter: 1100,
        testingEvents: [
          {
            id: 'TEST-P1-01',
            pumpId: 'p-1',
            pumpName: 'Petrol Pump 1',
            quantity: 5.00,
            time: '09:15 AM',
            timestamp: `${today}T09:15:00.000Z`,
            recordedBy: 'Rajesh Kumar'
          }
        ],
        updatedAt: `${today}T09:15:00.000Z`
      },
      'p-2': {
        openingMeter: 2450,
        closingMeter: 2575,
        testingEvents: [],
        updatedAt: `${today}T08:00:00.000Z`
      },
      'p-3': {
        openingMeter: 3100,
        closingMeter: 3180,
        testingEvents: [],
        updatedAt: `${today}T08:00:00.000Z`
      },
      'p-4': {
        openingMeter: 1500,
        closingMeter: 1610,
        testingEvents: [
          {
            id: 'TEST-P4-01',
            pumpId: 'p-4',
            pumpName: 'Petrol Pump 4',
            quantity: 5.00,
            time: '10:30 AM',
            timestamp: `${today}T10:30:00.000Z`,
            recordedBy: 'Vikram Singh'
          }
        ],
        updatedAt: `${today}T10:30:00.000Z`
      },
      'p-5': {
        openingMeter: 4200,
        closingMeter: 4420,
        testingEvents: [
          {
            id: 'TEST-P5-01',
            pumpId: 'p-5',
            pumpName: 'Diesel Pump 1',
            quantity: 5.00,
            time: '08:00 AM',
            timestamp: `${today}T08:00:00.000Z`,
            recordedBy: 'Amit Yadav'
          }
        ],
        updatedAt: `${today}T08:00:00.000Z`
      },
      'p-6': {
        openingMeter: 5100,
        closingMeter: 5350,
        testingEvents: [],
        updatedAt: `${today}T08:00:00.000Z`
      },
      'p-7': {
        openingMeter: 1800,
        closingMeter: 1980,
        testingEvents: [],
        updatedAt: `${today}T08:00:00.000Z`
      },
      'p-8': {
        openingMeter: 900,
        closingMeter: 900,
        testingEvents: [],
        updatedAt: `${today}T08:00:00.000Z`
      },
      'p-9': {
        openingMeter: 820,
        closingMeter: 915,
        testingEvents: [
          {
            id: 'TEST-P9-01',
            pumpId: 'p-9',
            pumpName: 'Power Petrol Pump 1',
            quantity: 5.00,
            time: '09:45 AM',
            timestamp: `${today}T09:45:00.000Z`,
            recordedBy: 'Suresh Patil'
          }
        ],
        updatedAt: `${today}T09:45:00.000Z`
      },
      'p-10': {
        openingMeter: 650,
        closingMeter: 710,
        testingEvents: [],
        updatedAt: `${today}T08:00:00.000Z`
      }
    },
    [yesterday]: {
      'p-1': { openingMeter: 900, closingMeter: 1000, testingEvents: [{ id: 'TEST-Y-1', pumpId: 'p-1', pumpName: 'Petrol Pump 1', quantity: 5.00, time: '09:00 AM', timestamp: `${yesterday}T09:00:00.000Z`, recordedBy: 'Rajesh Kumar' }], updatedAt: `${yesterday}T22:00:00.000Z` },
      'p-2': { openingMeter: 2320, closingMeter: 2450, testingEvents: [], updatedAt: `${yesterday}T22:00:00.000Z` },
      'p-3': { openingMeter: 3010, closingMeter: 3100, testingEvents: [], updatedAt: `${yesterday}T22:00:00.000Z` },
      'p-4': { openingMeter: 1390, closingMeter: 1500, testingEvents: [], updatedAt: `${yesterday}T22:00:00.000Z` },
      'p-5': { openingMeter: 3970, closingMeter: 4200, testingEvents: [{ id: 'TEST-Y-2', pumpId: 'p-5', pumpName: 'Diesel Pump 1', quantity: 5.00, time: '08:30 AM', timestamp: `${yesterday}T08:30:00.000Z`, recordedBy: 'Amit Yadav' }], updatedAt: `${yesterday}T22:00:00.000Z` },
      'p-6': { openingMeter: 4850, closingMeter: 5100, testingEvents: [], updatedAt: `${yesterday}T22:00:00.000Z` },
      'p-7': { openingMeter: 1610, closingMeter: 1800, testingEvents: [], updatedAt: `${yesterday}T22:00:00.000Z` },
      'p-8': { openingMeter: 900, closingMeter: 900, testingEvents: [], updatedAt: `${yesterday}T22:00:00.000Z` },
      'p-9': { openingMeter: 730, closingMeter: 820, testingEvents: [], updatedAt: `${yesterday}T22:00:00.000Z` },
      'p-10': { openingMeter: 590, closingMeter: 650, testingEvents: [], updatedAt: `${yesterday}T22:00:00.000Z` }
    }
  };

  // Sample Staff Attendance Records
  const sampleAttendance = [
    // Today
    {
      id: 'ATT-TODAY-01',
      staffId: 'staff-1',
      staffName: 'Rajesh Kumar',
      date: today,
      status: 'Present',
      shift: 'Morning Shift (06:00 - 14:00)',
      checkInTime: '05:52 AM',
      checkOutTime: '02:08 PM',
      markedBy: 'Supervisor',
      notes: 'Nozzle 1 & 3 operation on time',
      editHistory: []
    },
    {
      id: 'ATT-TODAY-02',
      staffId: 'staff-2',
      staffName: 'Suresh Patil',
      date: today,
      status: 'Present',
      shift: 'Morning Shift (06:00 - 14:00)',
      checkInTime: '05:58 AM',
      checkOutTime: '02:00 PM',
      markedBy: 'Supervisor',
      notes: 'Senior forecourt attendant',
      editHistory: []
    },
    {
      id: 'ATT-TODAY-03',
      staffId: 'staff-3',
      staffName: 'Vikram Singh',
      date: today,
      status: 'Present',
      shift: 'General Shift (09:00 - 18:00)',
      checkInTime: '08:55 AM',
      checkOutTime: '',
      markedBy: 'Supervisor',
      notes: 'Cash counter on duty',
      editHistory: []
    },
    {
      id: 'ATT-TODAY-04',
      staffId: 'staff-4',
      staffName: 'Amit Yadav',
      date: today,
      status: 'Present',
      shift: 'Morning Shift (06:00 - 14:00)',
      checkInTime: '05:48 AM',
      checkOutTime: '02:05 PM',
      markedBy: 'Supervisor',
      notes: 'Heavy vehicle diesel bay duty',
      editHistory: []
    },
    {
      id: 'ATT-TODAY-05',
      staffId: 'staff-5',
      staffName: 'Priya Sharma',
      date: today,
      status: 'Present',
      shift: 'General Shift (08:30 - 17:30)',
      checkInTime: '08:20 AM',
      checkOutTime: '',
      markedBy: 'Owner',
      notes: 'Forecourt supervisor',
      editHistory: []
    },
    // Yesterday
    {
      id: 'ATT-YEST-01',
      staffId: 'staff-1',
      staffName: 'Rajesh Kumar',
      date: yesterday,
      status: 'Present',
      shift: 'Morning Shift (06:00 - 14:00)',
      checkInTime: '05:50 AM',
      checkOutTime: '02:10 PM',
      markedBy: 'Supervisor',
      notes: '',
      editHistory: []
    },
    {
      id: 'ATT-YEST-02',
      staffId: 'staff-2',
      staffName: 'Suresh Patil',
      date: yesterday,
      status: 'Present',
      shift: 'Morning Shift (06:00 - 14:00)',
      checkInTime: '06:00 AM',
      checkOutTime: '02:00 PM',
      markedBy: 'Supervisor',
      notes: '',
      editHistory: []
    },
    {
      id: 'ATT-YEST-03',
      staffId: 'staff-3',
      staffName: 'Vikram Singh',
      date: yesterday,
      status: 'Leave',
      shift: 'General Shift (09:00 - 18:00)',
      checkInTime: '',
      checkOutTime: '',
      markedBy: 'Supervisor',
      notes: 'Casual leave approved',
      editHistory: []
    },
    {
      id: 'ATT-YEST-04',
      staffId: 'staff-4',
      staffName: 'Amit Yadav',
      date: yesterday,
      status: 'Present',
      shift: 'Morning Shift (06:00 - 14:00)',
      checkInTime: '05:45 AM',
      checkOutTime: '02:00 PM',
      markedBy: 'Supervisor',
      notes: '',
      editHistory: []
    },
    {
      id: 'ATT-YEST-05',
      staffId: 'staff-5',
      staffName: 'Priya Sharma',
      date: yesterday,
      status: 'Present',
      shift: 'General Shift (08:30 - 17:30)',
      checkInTime: '08:25 AM',
      checkOutTime: '05:40 PM',
      markedBy: 'Owner',
      notes: '',
      editHistory: []
    }
  ];

  return {
    transactions: sampleTransactions,
    expenses: sampleExpenses,
    adjustments: sampleAdjustments,
    closings: sampleClosings,
    auditLogs: sampleAuditLogs,
    pumpReadings: samplePumpReadings,
    staffAttendance: sampleAttendance
  };
}
