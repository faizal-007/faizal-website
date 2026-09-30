import React from 'react';
import { useFuel } from '../context/FuelContext';
import Modal from './Modal';
import AccountEntryView from '../views/AccountEntryView';

export default function QuickSaleModal() {
  const { isQuickSaleOpen, closeQuickSale, quickSalePreselect } = useFuel();

  if (!isQuickSaleOpen) return null;

  return (
    <Modal
      isOpen={isQuickSaleOpen}
      onClose={closeQuickSale}
      title="Quick Fuel Sale Entry"
      wide
    >
      <div style={{ margin: '-24px', padding: '0 8px 16px' }}>
        <AccountEntryView 
          preselectedData={quickSalePreselect}
          onSuccess={() => closeQuickSale()} 
        />
      </div>
    </Modal>
  );
}
