import React, { useState, useMemo, useEffect } from 'react';
import { Button, CurrencyInput, Modal, ConfirmModal, useConfirmModal, SectionHeader, Tabs, StatusBadge, FormActions, FormField, FormRow } from '@financeos/ui';
import { motion } from 'framer-motion';
import { dbService } from '@financeos/database';
import { useDbSyncCallback, useDbVersion } from '../hooks/useDbSync.js';
import {
  BusinessInvoice, InventoryItem, VendorCustomer,
  BusinessRegisterEntry, formatRupee, GlobalDateRange
} from '@financeos/shared';
import {
  Printer, Coins, Eye, Trash2, Edit2,
  FileText, Archive, BarChart2, Plus, Download, Briefcase
} from 'lucide-react';
import { exportToCSV } from '../utils/exportCsv.js';

interface BusinessViewProps {
  dateRange: GlobalDateRange;
  activeProfileId: string;
}

export const BusinessView: React.FC<BusinessViewProps> = ({ dateRange, activeProfileId }) => {
  const { modal: confirmModal, openConfirm, closeConfirm } = useConfirmModal();

  const [activeSubTab, setActiveSubTab] = useState<'invoices' | 'gst' | 'inventory' | 'statements'>('invoices');
  const dbVersion = useDbVersion();

  const settings = useMemo(() => dbService.getSettings(), [dbVersion]);
  const profiles = useMemo(() => dbService.getProfiles(), [dbVersion]);
  const activeProfile = useMemo(() => profiles.find(p => p.id === activeProfileId) || profiles[0], [profiles, activeProfileId]);

  // DB States
  const [invoices, setInvoices] = useState<BusinessInvoice[]>(() => dbService.getInvoices());
  const [inventory, setInventory] = useState<InventoryItem[]>(() => dbService.getInventory());
  const [contacts, setContacts] = useState<VendorCustomer[]>(() => dbService.getContacts());
  const [register, setRegister] = useState<BusinessRegisterEntry[]>(() => dbService.getRegister());

  // Modals Toggles
  const [showCreateInvoice, setShowCreateInvoice] = useState(false);
  const [showAddContact, setShowAddContact] = useState(false);
  const [showAddInventory, setShowAddInventory] = useState(false);

  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [invoiceItems, setInvoiceItems] = useState<{ itemId: string; quantity: number }[]>([
    { itemId: '', quantity: 1 }
  ]);
  const [invoiceNotes, setInvoiceNotes] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState(`INV-2026-00${invoices.length + 1}`);

  // Form: Add Contact
  const [contName, setContName] = useState('');
  const [contGstin, setContGstin] = useState('');
  const [contPhone, setContPhone] = useState('');
  const [contEmail, setContEmail] = useState('');
  const [contAddress, setContAddress] = useState('');
  const [contType, setContType] = useState<'Customer' | 'Vendor'>('Customer');

  // Form: Add Inventory Item
  const [invCode, setInvCode] = useState('');
  const [invName, setInvName] = useState('');
  const [invQty, setInvQty] = useState('');
  const [invPurchasePrice, setInvPurchasePrice] = useState('');
  const [invSalesPrice, setInvSalesPrice] = useState('');
  const [invGstRate, setInvGstRate] = useState('18');
  const [invReorder, setInvReorder] = useState('5');

  // Form: Edit Contact
  const [showEditContact, setShowEditContact] = useState(false);
  const [editContId, setEditContId] = useState('');
  const [editContName, setEditContName] = useState('');
  const [editContGstin, setEditContGstin] = useState('');
  const [editContPhone, setEditContPhone] = useState('');
  const [editContEmail, setEditContEmail] = useState('');
  const [editContAddress, setEditContAddress] = useState('');
  const [editContType, setEditContType] = useState<'Customer' | 'Vendor'>('Customer');

  // Form: Edit Inventory Item
  const [showEditInventory, setShowEditInventory] = useState(false);
  const [editInvId, setEditInvId] = useState('');
  const [editInvCode, setEditInvCode] = useState('');
  const [editInvName, setEditInvName] = useState('');
  const [editInvQty, setEditInvQty] = useState('');
  const [editInvPurchasePrice, setEditInvPurchasePrice] = useState('');
  const [editInvSalesPrice, setEditInvSalesPrice] = useState('');
  const [editInvGstRate, setEditInvGstRate] = useState('18');
  const [editInvReorder, setEditInvReorder] = useState('5');

  // Form: Register Entry
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [regIsEdit, setRegIsEdit] = useState(false);
  const [regId, setRegId] = useState('');
  const [regDate, setRegDate] = useState('');
  const [regType, setRegType] = useState<'Sales' | 'Purchase'>('Purchase');
  const [regRefNumber, setRegRefNumber] = useState('');
  const [regPartyName, setRegPartyName] = useState('');
  const [regTaxableAmount, setRegTaxableAmount] = useState('');
  const [regCgst, setRegCgst] = useState('');
  const [regSgst, setRegSgst] = useState('');
  const [regIgst, setRegIgst] = useState('');
  const [regGstRate, setRegGstRate] = useState('18');

  // View Invoice State
  const [viewingInvoice, setViewingInvoice] = useState<BusinessInvoice | null>(null);

  const [isLoaded, setIsLoaded] = React.useState(false);

  // Load saved Business Drafts on profile switch
  React.useEffect(() => {
    try {
      const saved = dbService.getBusinessDrafts?.(activeProfileId);
      if (saved) {
        if (saved.selectedCustomerId) setSelectedCustomerId(saved.selectedCustomerId);
        if (saved.invoiceItems) setInvoiceItems(saved.invoiceItems);
        if (saved.invoiceNotes !== undefined) setInvoiceNotes(saved.invoiceNotes);
        if (saved.invoiceNumber) setInvoiceNumber(saved.invoiceNumber);
        if (saved.contName !== undefined) setContName(saved.contName);
        if (saved.contGstin !== undefined) setContGstin(saved.contGstin);
        if (saved.contPhone !== undefined) setContPhone(saved.contPhone);
        if (saved.contEmail !== undefined) setContEmail(saved.contEmail);
        if (saved.contAddress !== undefined) setContAddress(saved.contAddress);
        if (saved.contType) setContType(saved.contType);
        if (saved.invCode !== undefined) setInvCode(saved.invCode);
        if (saved.invName !== undefined) setInvName(saved.invName);
        if (saved.invQty !== undefined) setInvQty(saved.invQty);
        if (saved.invPurchasePrice !== undefined) setInvPurchasePrice(saved.invPurchasePrice);
        if (saved.invSalesPrice !== undefined) setInvSalesPrice(saved.invSalesPrice);
        if (saved.invGstRate) setInvGstRate(saved.invGstRate);
        if (saved.invReorder) setInvReorder(saved.invReorder);
        if (saved.regDate !== undefined) setRegDate(saved.regDate);
        if (saved.regType) setRegType(saved.regType);
        if (saved.regRefNumber !== undefined) setRegRefNumber(saved.regRefNumber);
        if (saved.regPartyName !== undefined) setRegPartyName(saved.regPartyName);
        if (saved.regTaxableAmount !== undefined) setRegTaxableAmount(saved.regTaxableAmount);
        if (saved.regCgst !== undefined) setRegCgst(saved.regCgst);
        if (saved.regSgst !== undefined) setRegSgst(saved.regSgst);
        if (saved.regIgst !== undefined) setRegIgst(saved.regIgst);
        if (saved.regGstRate) setRegGstRate(saved.regGstRate);
      }
    } catch (e) {
      console.error('Failed to load business drafts', e);
    } finally {
      setIsLoaded(true);
    }
  }, [activeProfileId]);

  // Auto-Save Business Drafts on change
  React.useEffect(() => {
    if (!isLoaded) return;
    const timer = setTimeout(() => {
      dbService.updateBusinessDrafts(activeProfileId, {
        selectedCustomerId,
        invoiceItems,
        invoiceNotes,
        invoiceNumber,
        contName,
        contGstin,
        contPhone,
        contEmail,
        contAddress,
        contType,
        invCode,
        invName,
        invQty,
        invPurchasePrice,
        invSalesPrice,
        invGstRate,
        invReorder,
        regDate,
        regType,
        regRefNumber,
        regPartyName,
        regTaxableAmount,
        regCgst,
        regSgst,
        regIgst,
        regGstRate
      }).catch(console.error);
    }, 150);
    return () => clearTimeout(timer);
  }, [
    selectedCustomerId, invoiceItems, invoiceNotes, invoiceNumber,
    contName, contGstin, contPhone, contEmail, contAddress, contType,
    invCode, invName, invQty, invPurchasePrice, invSalesPrice, invGstRate, invReorder,
    regDate, regType, regRefNumber, regPartyName, regTaxableAmount, regCgst, regSgst, regIgst, regGstRate,
    activeProfileId, isLoaded
  ]);

  const refreshData = () => {
    setInvoices(dbService.getInvoices().filter(i => i.profileId === activeProfileId));
    setInventory(dbService.getInventory().filter(i => i.profileId === activeProfileId));
    setContacts(dbService.getContacts().filter(c => c.profileId === activeProfileId));
    setRegister(dbService.getRegister().filter(r => r.profileId === activeProfileId));
  };

  useDbSyncCallback(refreshData);

  useEffect(() => {
    refreshData();
  }, [activeProfileId]);

  // Filter Contacts
  const customers = useMemo(() => contacts.filter(c => c.type === 'Customer'), [contacts]);
  const vendors = useMemo(() => contacts.filter(c => c.type === 'Vendor'), [contacts]);

  // GST Liability calculations
  const gstSummary = useMemo(() => {
    let salesTaxable = 0;
    let cgstCollected = 0;
    let sgstCollected = 0;
    let igstCollected = 0;

    let purchaseTaxable = 0;
    let cgstPaid = 0;
    let sgstPaid = 0;
    let igstPaid = 0;

    register.forEach((r) => {
      if (r.type === 'Sales') {
        salesTaxable += r.taxableAmount;
        cgstCollected += r.cgst;
        sgstCollected += r.sgst;
        igstCollected += r.igst;
      } else {
        purchaseTaxable += r.taxableAmount;
        cgstPaid += r.cgst;
        sgstPaid += r.sgst;
        igstPaid += r.igst;
      }
    });

    const netCgstPayable = cgstCollected - cgstPaid;
    const netSgstPayable = sgstCollected - sgstPaid;
    const netIgstPayable = igstCollected - igstPaid;
    const totalNetPayable = netCgstPayable + netSgstPayable + netIgstPayable;

    return {
      salesTaxable, cgstCollected, sgstCollected, igstCollected,
      purchaseTaxable, cgstPaid, sgstPaid, igstPaid,
      netCgstPayable, netSgstPayable, netIgstPayable, totalNetPayable
    };
  }, [register]);

  // Profit and Loss calculations
  const profitAndLoss = useMemo(() => {
    const salesRevenue = register
      .filter(r => r.type === 'Sales')
      .reduce((sum, r) => sum + r.taxableAmount, 0);

    const purchasesCost = register
      .filter(r => r.type === 'Purchase')
      .reduce((sum, r) => sum + r.taxableAmount, 0);

    const txLedger = dbService.getTransactions();
    const generalExpenses = txLedger
      .filter(t => t.type === 'Expense' && t.category !== 'Investments' && t.category !== 'Business Purchase')
      .reduce((sum, t) => sum + t.amount, 0);

    const grossProfit = salesRevenue - purchasesCost;
    const netProfit = grossProfit - generalExpenses;

    return { salesRevenue, purchasesCost, grossProfit, generalExpenses, netProfit };
  }, [register]);

  // Balance Sheet calculations
  const balanceSheet = useMemo(() => {
    const bankAccounts = dbService.getAccounts();
    const cashBalance = bankAccounts.reduce((sum, a) => sum + a.balance, 0);

    const stockValuation = inventory.reduce((sum, item) => sum + (item.quantity * item.purchasePrice), 0);

    const receivables = invoices
      .filter(i => i.status !== 'Paid')
      .reduce((sum, i) => sum + i.grandTotal, 0);

    const totalAssets = cashBalance + stockValuation + receivables;
    const equityCapital = totalAssets;

    return { cashBalance, stockValuation, receivables, totalAssets, equityCapital };
  }, [invoices, inventory]);

  // Handlers
  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contName) return;
    await dbService.addContact({
      profileId: activeProfileId,
      name: contName,
      gstin: contGstin || undefined,
      phone: contPhone || undefined,
      email: contEmail || undefined,
      address: contAddress || undefined,
      type: contType
    });
    setContName(''); setContGstin(''); setContPhone(''); setContEmail(''); setContAddress('');
    setShowAddContact(false);
    refreshData();
  };

  const handleEditContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editContName) return;
    await dbService.updateContact(editContId, {
      name: editContName,
      gstin: editContGstin || undefined,
      phone: editContPhone || undefined,
      email: editContEmail || undefined,
      address: editContAddress || undefined,
      type: editContType
    });
    setShowEditContact(false);
    refreshData();
  };

  const openEditContact = (c: VendorCustomer) => {
    setEditContId(c.id);
    setEditContName(c.name);
    setEditContGstin(c.gstin || '');
    setEditContPhone(c.phone || '');
    setEditContEmail(c.email || '');
    setEditContAddress(c.address || '');
    setEditContType(c.type);
    setShowEditContact(true);
  };

  const handleDeleteContact = async (id: string) => {
    openConfirm({
      title: 'Delete Contact',
      message: 'Permanently remove this contact from your vendor and customer directory?',
      confirmLabel: 'Delete Contact',
      isDanger: true,
      onConfirm: async () => { await dbService.deleteContact(id); refreshData(); }
    });
  };

  const handleAddInventory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invCode || !invName || !invQty || !invPurchasePrice || !invSalesPrice) return;
    await dbService.addInventoryItem({
      profileId: activeProfileId,
      code: invCode.toUpperCase(),
      name: invName,
      quantity: parseFloat(invQty),
      purchasePrice: parseFloat(invPurchasePrice),
      salesPrice: parseFloat(invSalesPrice),
      gstRate: parseFloat(invGstRate) || 18,
      reorderLevel: parseFloat(invReorder) || 5
    });
    setInvCode(''); setInvName(''); setInvQty(''); setInvPurchasePrice(''); setInvSalesPrice(''); setInvGstRate('18'); setInvReorder('5');
    setShowAddInventory(false);
    refreshData();
  };

  const handleEditInventorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editInvCode || !editInvName || !editInvQty || !editInvPurchasePrice || !editInvSalesPrice) return;
    await dbService.updateInventoryItem(editInvId, {
      code: editInvCode.toUpperCase(),
      name: editInvName,
      quantity: parseFloat(editInvQty),
      purchasePrice: parseFloat(editInvPurchasePrice),
      salesPrice: parseFloat(editInvSalesPrice),
      gstRate: parseFloat(editInvGstRate) || 18,
      reorderLevel: parseFloat(editInvReorder) || 5
    });
    setShowEditInventory(false);
    refreshData();
  };

  const openEditInventory = (i: InventoryItem) => {
    setEditInvId(i.id);
    setEditInvCode(i.code);
    setEditInvName(i.name);
    setEditInvQty(i.quantity.toString());
    setEditInvPurchasePrice(i.purchasePrice.toString());
    setEditInvSalesPrice(i.salesPrice.toString());
    setEditInvGstRate(i.gstRate.toString());
    setEditInvReorder(i.reorderLevel.toString());
    setShowEditInventory(true);
  };

  const handleDeleteInventoryItem = async (id: string) => {
    openConfirm({
      title: 'Delete Inventory Item',
      message: 'Permanently remove this item from your inventory catalog? Stock levels and cost tracking will be removed.',
      confirmLabel: 'Delete Item',
      isDanger: true,
      onConfirm: async () => { await dbService.deleteInventoryItem(id); refreshData(); }
    });
  };

  const handleInvoiceItemChange = (index: number, field: 'itemId' | 'quantity', value: string) => {
    const items = [...invoiceItems];
    if (field === 'itemId') {
      items[index].itemId = value;
    } else {
      items[index].quantity = parseInt(value) || 1;
    }
    setInvoiceItems(items);
  };

  const addInvoiceItemRow = () => {
    setInvoiceItems(prev => [...prev, { itemId: '', quantity: 1 }]);
  };

  const removeInvoiceItemRow = (index: number) => {
    if (invoiceItems.length > 1) {
      setInvoiceItems(prev => prev.filter((_, idx) => idx !== index));
    }
  };

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId || invoiceItems.length === 0 || !invoiceItems[0].itemId) return;

    let subtotal = 0;
    let cgst = 0;
    let sgst = 0;
    let igst = 0;

    const customer = contacts.find(c => c.id === selectedCustomerId);
    const customerName = customer ? customer.name : 'Unknown';
    const customerGSTIN = customer ? customer.gstin : undefined;
    const dueDate = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const populatedItems = invoiceItems.map(item => {
      const inv = inventory.find(i => i.id === item.itemId);
      if (!inv) return null;
      const rate = inv.salesPrice;
      const amount = rate * item.quantity;
      const gstRate = inv.gstRate || 18;
      const tax = amount * (gstRate / 100);

      subtotal += amount;
      cgst += (tax / 2);
      sgst += (tax / 2);

      return {
        itemId: inv.id,
        name: inv.name,
        quantity: item.quantity,
        price: rate,
        gstRate,
        amount
      };
    }).filter(Boolean) as any[];

    const total = subtotal + cgst + sgst + igst;

    await dbService.addInvoice({
      profileId: activeProfileId,
      invoiceNumber: invoiceNumber || `INV-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      dueDate,
      customerId: selectedCustomerId,
      customerName,
      customerGSTIN,
      items: populatedItems,
      subtotal,
      cgstTotal: cgst,
      sgstTotal: sgst,
      igstTotal: igst,
      grandTotal: total,
      status: 'Sent',
      notes: invoiceNotes || undefined
    });

    // Reset Form
    setSelectedCustomerId('');
    setInvoiceItems([{ itemId: '', quantity: 1 }]);
    setInvoiceNotes('');
    setShowCreateInvoice(false);
    refreshData();
  };

  const handleCycleInvoiceStatus = async (id: string, currentStatus: string) => {
    const statuses = ['Draft', 'Sent', 'Paid', 'Overdue'];
    const nextStatus = statuses[(statuses.indexOf(currentStatus) + 1) % statuses.length];
    await dbService.updateInvoiceStatus(id, nextStatus as any);
    refreshData();
  };

  const handleDeleteInvoice = async (id: string) => {
    openConfirm({
      title: 'Delete Tax Invoice',
      message: 'Permanently delete this invoice? Associated inventory quantities will be restored and GSTR sales entries updated.',
      confirmLabel: 'Delete Invoice',
      isDanger: true,
      onConfirm: async () => { await dbService.deleteInvoice(id); refreshData(); }
    });
  };

  const handleSaveRegisterEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regDate || !regPartyName || !regTaxableAmount) return;

    const entryData = {
      profileId: activeProfileId,
      date: regDate,
      type: regType,
      refNumber: regRefNumber,
      partyName: regPartyName,
      taxableAmount: parseFloat(regTaxableAmount) || 0,
      cgst: parseFloat(regCgst) || 0,
      sgst: parseFloat(regSgst) || 0,
      igst: parseFloat(regIgst) || 0,
      totalAmount: (parseFloat(regTaxableAmount) || 0) + (parseFloat(regCgst) || 0) + (parseFloat(regSgst) || 0) + (parseFloat(regIgst) || 0),
      gstRate: parseFloat(regGstRate) || 18
    };

    if (regIsEdit) {
      await dbService.updateRegisterEntry(regId, entryData);
    } else {
      await dbService.addRegisterEntry(entryData);
    }

    setShowRegisterForm(false);
    refreshData();
  };

  const openAddRegisterEntry = () => {
    setRegIsEdit(false);
    setRegId('');
    setRegDate(new Date().toISOString().split('T')[0]);
    setRegType('Purchase');
    setRegRefNumber('');
    setRegPartyName('');
    setRegTaxableAmount('');
    setRegCgst('');
    setRegSgst('');
    setRegIgst('');
    setRegGstRate('18');
    setShowRegisterForm(true);
  };

  const openEditRegisterEntry = (r: BusinessRegisterEntry) => {
    setRegIsEdit(true);
    setRegId(r.id);
    setRegDate(r.date);
    setRegType(r.type);
    setRegRefNumber(r.refNumber);
    setRegPartyName(r.partyName);
    setRegTaxableAmount(r.taxableAmount.toString());
    setRegCgst(r.cgst.toString());
    setRegSgst(r.sgst.toString());
    setRegIgst(r.igst.toString());
    setRegGstRate(r.gstRate.toString());
    setShowRegisterForm(true);
  };

  const handleDeleteRegisterEntry = async (id: string) => {
    openConfirm({
      title: 'Delete Register Entry',
      message: 'Delete this register entry?',
      confirmLabel: 'Delete',
      isDanger: true,
      onConfirm: async () => { await dbService.deleteRegisterEntry(id); refreshData(); }
    });
  };



  return (
    <>
    <ConfirmModal state={confirmModal} onClose={closeConfirm} />
    <motion.div initial="hidden" animate="visible" variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.15 } } }} className="gap-stack-lg">

      {/* Page Header Banner */}
      <SectionHeader
        variant="banner"
        icon={<Briefcase />}
        title="Business Suite & Bookkeeping"
        description="GST Invoicing, purchase and sales registers, inventory control, and business financial statements."
        action={
          <Button
            variant="secondary"
            onClick={() => {
              if (activeSubTab === 'gst') {
                exportToCSV('gstr_register', [
                  { label: 'Date', key: 'date' },
                  { label: 'Type', key: 'type' },
                  { label: 'Ref Number', key: 'refNumber' },
                  { label: 'Party Name', key: 'partyName' },
                  { label: 'Taxable Amount', key: 'taxableAmount' },
                  { label: 'CGST', key: 'cgst' },
                  { label: 'SGST', key: 'sgst' },
                  { label: 'IGST', key: 'igst' },
                  { label: 'Total Amount', key: 'totalAmount' }
                ], register);
              } else {
                exportToCSV('business_invoices', [
                  { label: 'Invoice No', key: 'invoiceNumber' },
                  { label: 'Date', key: 'date' },
                  { label: 'Customer', key: 'customerName' },
                  { label: 'GSTIN', key: 'customerGSTIN' },
                  { label: 'Subtotal', key: 'subtotal' },
                  { label: 'Grand Total', key: 'grandTotal' },
                  { label: 'Status', key: 'status' }
                ], invoices);
              }
            }}
            style={{ padding: 'var(--spacing-05) var(--spacing-1)', fontSize: 'var(--font-sm)', gap: 'var(--spacing-04)', display: 'flex', alignItems: 'center' }}
          >
            <Download size={16} />
            <span>Export {activeSubTab === 'gst' ? 'GSTR Register' : 'Invoices'} CSV</span>
          </Button>
        }
      />

      {/* Sub tabs */}
      <Tabs
        tabs={[
          { id: 'invoices', label: 'Invoices', icon: <FileText size={14} /> },
          { id: 'gst', label: 'GSTR', icon: <Coins size={14} /> },
          { id: 'inventory', label: 'Inventory', icon: <Archive size={14} /> },
          { id: 'statements', label: 'Statements', icon: <BarChart2 size={14} /> }
        ]}
        activeTab={activeSubTab}
        onChange={(id) => setActiveSubTab(id as 'invoices' | 'gst' | 'inventory' | 'statements')}
        variant="segmented"
      />

      {/* Sub tab: Invoices & Clients Split View */}
      {activeSubTab === 'invoices' && (
        <div className="card-grid-lg responsive-stack" style={{ gridTemplateColumns: '2fr 1fr' }}>

          {/* Active Invoices List */}
          <motion.div className="glass-panel" data-interactive-card="off" variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } } }} style={{ padding: 'var(--spacing-15)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-125)', flexWrap: 'wrap', gap: 'var(--spacing-05)' }}>
              <h3 style={{ fontSize: 'var(--font-xl)', fontWeight: 'var(--fw-bold)' }}>Active Invoices</h3>
              <Button variant="primary" onClick={() => setShowCreateInvoice(true)} disabled={customers.length === 0 || inventory.length === 0} style={{ padding: 'var(--spacing-04) var(--spacing-085)', fontSize: 'var(--font-sm)', borderRadius: 'var(--radius-sm)' }}>
                <Plus size={14} /> New GST Invoice
              </Button>
            </div>

            {customers.length === 0 || inventory.length === 0 ? (
              <div style={{
                color: 'var(--text-secondary)', fontSize: 'var(--font-sm)', border: '1px dashed var(--border-focus)',
                padding: 'var(--spacing-125) var(--spacing-1)', borderRadius: 'var(--radius-md)', textAlign: 'center',
                background: 'var(--surface-faint)', marginBottom: 'var(--spacing-125)', lineHeight: 1.5
              }}>
                Please create at least <strong style={{ color: 'var(--text-primary)' }}>1 Customer</strong> and <strong style={{ color: 'var(--text-primary)' }}>1 Inventory Item</strong> before drafting an invoice.
              </div>
            ) : null}

            <div style={{ overflowX: 'auto', width: '100%', WebkitOverflowScrolling: 'touch' }}>
              <table className="custom-table" style={{ marginTop: 'var(--spacing-05)', width: '100%' }}>
                <caption style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap', border: 0, padding: 0, margin: -1 }}>
                  Active GST invoices with invoice number, date, client, total, status and actions
                </caption>
                <thead>
                  <tr>
                    <th scope="col">Invoice #</th>
                    <th scope="col">Date</th>
                    <th scope="col">Client Name</th>
                    <th scope="col" className="numeric-cell">Grand Total</th>
                    <th scope="col">Status</th>
                    <th scope="col" style={{ textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.length > 0 ? (
                    invoices.slice(0, 500).map(inv => (
                      <tr key={inv.id}>
                        <td style={{ fontWeight: 'var(--fw-bold)', fontFamily: 'var(--font-display)' }}>{inv.invoiceNumber}</td>
                        <td className="tabular-nums">{inv.date}</td>
                        <td style={{ fontWeight: 'var(--fw-medium)' }}>{inv.customerName}</td>
                        <td className="numeric-cell" style={{ fontWeight: 'var(--fw-bold)', fontFamily: 'var(--font-display)', color: 'var(--accent-1)' }}>{formatRupee(inv.grandTotal)}</td>
                        <td>
                          <StatusBadge status={inv.status.toLowerCase() as any} />
                        </td>
                        <td style={{ display: 'flex', gap: 'var(--spacing-04)', justifyContent: 'center' }}>
                          <Button variant="secondary" aria-label={`Update status for invoice ${inv.invoiceNumber}`} style={{ padding: 'var(--spacing-025) var(--spacing-04)', fontSize: 'var(--font-xs)' }} onClick={() => handleCycleInvoiceStatus(inv.id, inv.status)}>
                            Status
                          </Button>
                          <Button variant="secondary" aria-label={`View invoice ${inv.invoiceNumber}`} style={{ padding: 'var(--spacing-025) var(--spacing-04)', fontSize: 'var(--font-xs)' }} onClick={() => setViewingInvoice(inv)}>
                            <Eye size={13} /> View
                          </Button>
                          <Button variant="danger" aria-label={`Delete invoice ${inv.invoiceNumber}`} style={{ padding: 'var(--spacing-025) var(--spacing-04)', fontSize: 'var(--font-xs)' }} onClick={() => handleDeleteInvoice(inv.id)}>
                            <Trash2 size={13} />
                          </Button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 'var(--spacing-2)' }}>
                        No invoices created yet. Click "New GST Invoice" above to draft and issue invoices.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>

          {/* Manage Clients List */}
          <motion.div className="glass-panel" data-interactive-card="off" variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } } }} style={{ padding: 'var(--spacing-15)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-125)', flexWrap: 'wrap', gap: 'var(--spacing-05)' }}>
              <h3 style={{ fontSize: 'var(--font-xl)', fontWeight: 'var(--fw-bold)' }}>Contacts Directory</h3>
              <Button variant="secondary" style={{ padding: 'var(--spacing-04) var(--spacing-085)', fontSize: 'var(--font-sm)', borderRadius: 'var(--radius-sm)' }} onClick={() => setShowAddContact(true)}>
                <Plus size={14} /> Add
              </Button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-075)', maxHeight: 'var(--chart-height-xl)', overflowY: 'auto' }}>
              {contacts.slice(0, 500).map(c => (
                <div key={c.id} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--spacing-075) var(--spacing-1)',
                  background: 'var(--surface-faint)', borderRadius: 'var(--radius-sm)', fontSize: 'var(--font-sm)',
                  border: '1px solid var(--border-color)'
                }}>
                  <div>
                    <div style={{ fontWeight: 'var(--fw-bold)', color: 'var(--text-primary)', marginBottom: 'var(--spacing-02)' }}>{c.name}</div>
                    <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-secondary)' }}>Type: {c.type} {c.gstin ? `| GSTIN: ${c.gstin}` : ''}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 'var(--spacing-05)' }}>
                    <Button variant="secondary" style={{ padding: 'var(--spacing-04)', borderRadius: 'var(--radius-xs)' }} onClick={() => openEditContact(c)}>
                      <Edit2 size={13} />
                    </Button>
                    <Button variant="danger" style={{ padding: 'var(--spacing-04)', borderRadius: 'var(--radius-xs)' }} onClick={() => handleDeleteContact(c.id)}>
                      <Trash2 size={13} />
                    </Button>
                  </div>
                </div>
              ))}

              {contacts.length === 0 && (
                <div style={{
                  padding: 'var(--spacing-15) var(--spacing-1)',
                  textAlign: 'center',
                  borderRadius: 'var(--radius-md)',
                  border: '1px dashed var(--border-focus)',
                  background: 'var(--surface-faint)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 'var(--spacing-05)'
                }}>
                  <div style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-sm)' }}>
                    No contacts linked yet. Click "Add" to save clients and vendors.
                  </div>
                  <Button
                    variant="secondary"
                    onClick={() => setShowAddContact(true)}
                    style={{ padding: 'var(--spacing-04) var(--spacing-1)', fontSize: 'var(--font-sm)', borderRadius: 'var(--radius-md)', marginTop: 'var(--spacing-05)' }}
                  >
                    <Plus size={14} /> Add First Contact
                  </Button>
                </div>
              )}
            </div>
          </motion.div>

        </div>
      )}

      {/* Sub tab: GST Liabilities */}
      {activeSubTab === 'gst' && (
        <div className="gap-stack-lg">

          <motion.div className="glass-panel" data-interactive-card="off" variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } } }} style={{ padding: 'var(--spacing-15)', position: 'relative', overflow: 'hidden', background: 'linear-gradient(135deg, rgba(3,105,161,0.05) 0%, rgba(3,105,161,0.01) 100%)' }}>
            <h4 style={{ fontSize: 'var(--font-base)', marginBottom: 'var(--spacing-075)', color: 'var(--text-secondary)' }}>Net GST Reconciliation Summary</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'var(--spacing-1)' }}>
              <div>
                <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>GST Collected (Outward Sales)</span>
              <div style={{ fontSize: 'var(--font-xl)', fontWeight: 'var(--fw-semibold)', fontFamily: 'var(--font-display)', fontVariantNumeric: 'tabular-nums', color: 'var(--accent-1)', marginTop: 'var(--spacing-02)' }}>
                  {formatRupee(gstSummary.cgstCollected + gstSummary.sgstCollected + gstSummary.igstCollected)}
                </div>
              </div>
              <div>
                <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>Input Credit (Inward Purchase)</span>
                <div style={{ fontSize: 'var(--font-xl)', fontWeight: 'var(--fw-semibold)', fontFamily: 'var(--font-display)', fontVariantNumeric: 'tabular-nums', color: 'var(--success)', marginTop: 'var(--spacing-02)' }}>
                  {formatRupee(gstSummary.cgstPaid + gstSummary.sgstPaid + gstSummary.igstPaid)}
                </div>
              </div>
              <div style={{ borderLeft: '1px solid var(--border-color)', paddingLeft: 'var(--spacing-125)' }}>
                <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>Net GSTR-3B Liability Due</span>
                <div style={{ fontSize: 'var(--font-xl)', fontWeight: 'var(--fw-semibold)', fontFamily: 'var(--font-display)', fontVariantNumeric: 'tabular-nums', color: gstSummary.totalNetPayable >= 0 ? 'var(--warning)' : 'var(--success)', marginTop: 'var(--spacing-02)' }}>
                  {formatRupee(gstSummary.totalNetPayable)}
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div className="glass-panel" data-interactive-card="off" variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } } }} style={{ padding: 'var(--spacing-15)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-075)' }}>
              <h4 style={{ fontSize: 'var(--font-xl)' }}>GSTR Register entries</h4>
              <Button variant="secondary" style={{ padding: 'var(--spacing-04) var(--spacing-075)', fontSize: 'var(--font-xs)' }} onClick={() => openAddRegisterEntry()}>
                <Plus size={14} /> Add Entry
              </Button>
            </div>
            <div className="table-responsive">
            <table className="custom-table">
              <caption style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap', border: 0, padding: 0, margin: -1 }}>
                GST register entries with date, type, bill number, party, taxable amount, CGST, SGST, IGST, and total
              </caption>
              <thead>
                <tr>
                  <th scope="col">Date</th>
                  <th scope="col">Type</th>
                  <th scope="col">Bill/Inv #</th>
                  <th scope="col">Client/Party Name</th>
                  <th scope="col" className="numeric-cell">Taxable Amt</th>
                  <th scope="col" className="numeric-cell">CGST</th>
                  <th scope="col" className="numeric-cell">SGST</th>
                  <th scope="col" className="numeric-cell">IGST</th>
                  <th scope="col" className="numeric-cell">Total Amt</th>
                  <th scope="col" style={{ textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {register.length > 0 ? (
                  register.slice(0, 500).map(reg => (
                    <tr key={reg.id}>
                      <td className="tabular-nums">{reg.date}</td>
                      <td>
                        <span style={{
                          fontSize: 'var(--font-xs)', fontWeight: 'var(--fw-semibold)', padding: 'var(--spacing-02) var(--spacing-04)', borderRadius: 'var(--radius-xs)',
                          color: reg.type === 'Sales' ? 'var(--badge-cyan-text)' : 'var(--badge-emerald-text)',
                          background: reg.type === 'Sales' ? 'var(--badge-cyan-bg)' : 'var(--badge-emerald-bg)',
                          border: `1px solid ${reg.type === 'Sales' ? 'var(--badge-cyan-border)' : 'var(--badge-emerald-border)'}`
                        }}>{reg.type}</span>
                      </td>
                      <td>{reg.refNumber}</td>
                      <td style={{ fontWeight: 'var(--fw-medium)' }}>{reg.partyName}</td>
                      <td className="numeric-cell">{formatRupee(reg.taxableAmount)}</td>
                      <td className="numeric-cell">{formatRupee(reg.cgst)}</td>
                      <td className="numeric-cell">{formatRupee(reg.sgst)}</td>
                      <td className="numeric-cell">{formatRupee(reg.igst)}</td>
                      <td className="numeric-cell" style={{ fontWeight: 'var(--fw-bold)' }}>{formatRupee(reg.totalAmount)}</td>
                      <td style={{ display: 'flex', gap: 'var(--spacing-04)', justifyContent: 'center' }}>
                        <Button variant="secondary" style={{ padding: 'var(--spacing-025)', borderRadius: 'var(--radius-xs)' }} onClick={() => openEditRegisterEntry(reg)}>
                          <Edit2 size={12} />
                        </Button>
                        <Button variant="danger" style={{ padding: 'var(--spacing-025)', borderRadius: 'var(--radius-xs)' }} onClick={() => handleDeleteRegisterEntry(reg.id)}>
                          <Trash2 size={12} />
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={10} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 'var(--spacing-2)' }}>
                      No tax entries recorded in the current registers.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            </div>
          </motion.div>
        </div>
      )}

      {/* Sub tab: FIFO Inventory */}
      {activeSubTab === 'inventory' && (
        <motion.div className="glass-panel" data-interactive-card="off" variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } } }} style={{ padding: 'var(--spacing-15)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-1)' }}>
            <h3 style={{ fontSize: 'var(--font-xl)' }}>Inventory &amp; Stock Ledger (FIFO)</h3>
            <Button variant="primary" onClick={() => setShowAddInventory(true)}>
              <Plus size={16} /> Add Stock Item
            </Button>
          </div>

          <div className="table-responsive">
          <table className="custom-table">
            <caption style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap', border: 0, padding: 0, margin: -1 }}>
              FIFO inventory stock ledger with item code, name, quantity, purchase cost, sales price, GST slab, total value, and stock alert status
            </caption>
            <thead>
              <tr>
                <th scope="col">Code</th>
                <th scope="col">Item Name</th>
                <th scope="col" className="numeric-cell">Quantity</th>
                <th scope="col" className="numeric-cell">Purchase Cost</th>
                <th scope="col" className="numeric-cell">Sales Cost</th>
                <th scope="col" className="numeric-cell">GST Slabs</th>
                <th scope="col" className="numeric-cell">Total Value</th>
                <th scope="col">Alert Status</th>
                <th scope="col" style={{ textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {inventory.length > 0 ? (
                inventory.slice(0, 500).map(item => {
                  const totalCostVal = item.quantity * item.purchasePrice;
                  const isUnderstock = item.quantity <= item.reorderLevel;
                  return (
                    <tr key={item.id}>
                      <td style={{ fontWeight: 'var(--fw-semibold)' }}>{item.code}</td>
                      <td style={{ color: 'var(--text-secondary)' }}>{item.name}</td>
                      <td className="numeric-cell" style={{ fontWeight: 'var(--fw-bold)' }}>{item.quantity} units</td>
                      <td className="numeric-cell">{formatRupee(item.purchasePrice)}</td>
                      <td className="numeric-cell">{formatRupee(item.salesPrice)}</td>
                      <td className="numeric-cell">{item.gstRate}%</td>
                      <td className="numeric-cell" style={{ fontWeight: 'var(--fw-bold)' }}>{formatRupee(totalCostVal)}</td>
                      <td>
                        {isUnderstock ? (
                          <span style={{ color: 'var(--error)', fontSize: 'var(--font-xs)', fontWeight: 'var(--fw-semibold)' }}>⚠️ Low Stock (&lt; Reorder Level)</span>
                        ) : (
                          <span style={{ color: 'var(--success)', fontSize: 'var(--font-xs)' }}>✓ In Stock</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: 'var(--spacing-04)', justifyContent: 'center' }}>
                          <Button variant="secondary" style={{ padding: 'var(--spacing-04)', borderRadius: 'var(--radius-xs)' }} onClick={() => openEditInventory(item)}>
                            <Edit2 size={13} />
                          </Button>
                          <Button variant="danger" style={{ padding: 'var(--spacing-04)', borderRadius: 'var(--radius-xs)' }} onClick={() => handleDeleteInventoryItem(item.id)}>
                            <Trash2 size={13} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 'var(--spacing-2)' }}>
                    No inventory products or services cataloged. Add inventory items to begin invoicing and track stock movements.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          </div>
        </motion.div>
      )}

      {/* Sub tab: Statements (P&L and Balance Sheet) */}
      {activeSubTab === 'statements' && (
        <div className="card-grid responsive-stack" style={{ gridTemplateColumns: '1fr 1fr' }}>

          <motion.div className="glass-panel" data-interactive-card="off" variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } } }} style={{ padding: 'var(--spacing-15)', position: 'relative', overflow: 'hidden' }}>
            <h3 style={{ fontSize: 'var(--font-xl)', marginBottom: 'var(--spacing-1)', borderBottom: '1px solid var(--border-color)', paddingBottom: 'var(--spacing-05)' }}>
              Profit & Loss Statement (Estimated)
            </h3>
            <div className="tabular-nums" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-075)', fontSize: 'var(--font-base)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Sales Operating Revenue</span>
                <span style={{ fontWeight: 'var(--fw-semibold)' }}>{formatRupee(profitAndLoss.salesRevenue)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                <span>Less: Cost of Goods Sold (COGS)</span>
                <span>-{formatRupee(profitAndLoss.purchasesCost)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'var(--fw-bold)', borderTop: '1px solid var(--border-color)', paddingTop: 'var(--spacing-04)' }}>
                <span>Gross Profit Margin</span>
                <span style={{ color: 'var(--accent-1)' }}>{formatRupee(profitAndLoss.grossProfit)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginTop: 'var(--spacing-025)' }}>
                <span>Less: Ledger Operating Expenses</span>
                <span>-{formatRupee(profitAndLoss.generalExpenses)}</span>
              </div>
              <div style={{
                display: 'flex', justifyContent: 'space-between', fontWeight: 'var(--fw-semibold)', fontFamily: 'var(--font-display)',
                borderTop: '2px double var(--border-color)', paddingTop: 'var(--spacing-05)', marginTop: 'var(--spacing-05)',
                fontSize: 'var(--font-base)', color: profitAndLoss.netProfit >= 0 ? 'var(--success)' : 'var(--error)'
              }}>
                <span>Net Business Earnings</span>
                <span>{formatRupee(profitAndLoss.netProfit)}</span>
              </div>
            </div>
          </motion.div>

          <motion.div className="glass-panel" data-interactive-card="off" variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } } }} style={{ padding: 'var(--spacing-15)', position: 'relative', overflow: 'hidden' }}>
            <h3 style={{ fontSize: 'var(--font-xl)', marginBottom: 'var(--spacing-1)', borderBottom: '1px solid var(--border-color)', paddingBottom: 'var(--spacing-05)' }}>
              Balance Sheet
            </h3>
            <div className="tabular-nums" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-06)', fontSize: 'var(--font-base)' }}>
              <div style={{ fontWeight: 'var(--fw-semibold)', color: 'var(--accent-1)' }}>ASSETS</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: 'var(--spacing-075)' }}>
                <span>Cash & Cash Equivalents</span>
                <span>{formatRupee(balanceSheet.cashBalance)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: 'var(--spacing-075)' }}>
                <span>Inventory Valuations (FIFO cost)</span>
                <span>{formatRupee(balanceSheet.stockValuation)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: 'var(--spacing-075)' }}>
                <span>Trade Accounts Receivables</span>
                <span>{formatRupee(balanceSheet.receivables)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'var(--fw-bold)', borderTop: '1px dashed var(--border-color)', paddingTop: 'var(--spacing-04)', paddingLeft: 'var(--spacing-075)' }}>
                <span>Total Assets Valuation</span>
                <span>{formatRupee(balanceSheet.totalAssets)}</span>
              </div>

              <div style={{ fontWeight: 'var(--fw-semibold)', color: 'var(--accent-2)', marginTop: 'var(--spacing-05)' }}>LIABILITIES & EQUITY</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: 'var(--spacing-075)' }}>
                <span>Partner Owner Equity capital</span>
                <span>{formatRupee(balanceSheet.equityCapital)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'var(--fw-semibold)', fontFamily: 'var(--font-display)', borderTop: '2px double var(--border-color)', paddingTop: 'var(--spacing-04)', paddingLeft: 'var(--spacing-075)', marginTop: 'var(--spacing-025)' }}>
                <span>Total Equity & Liabilities</span>
                <span>{formatRupee(balanceSheet.equityCapital)}</span>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Dialog: Add Contact */}
      <Modal isOpen={showAddContact} onClose={() => setShowAddContact(false)} title="Add Contact" size="sm">
        <form onSubmit={handleAddContact} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-1)' }}>
          <FormField label="Full Name / Trading Label">
            <input type="text" className="form-input" value={contName} onChange={(e) => setContName(e.target.value)} placeholder="ABCD Trading Corp" required />
          </FormField>
          <FormField label="GSTIN (Optional)">
            <input type="text" className="form-input" value={contGstin} onChange={(e) => setContGstin(e.target.value)} placeholder="15 character GSTIN" />
          </FormField>
          <FormField label="Contact Type">
            <select value={contType} onChange={(e) => setContType(e.target.value as any)}>
              <option value="Customer">Customer</option>
              <option value="Vendor">Vendor</option>
            </select>
          </FormField>
          <FormRow gap="var(--spacing-075)">
            <FormField label="Phone" style={{ margin: 0 }}>
              <input type="text" className="form-input" value={contPhone} onChange={(e) => setContPhone(e.target.value)} placeholder="Mobile num" />
            </FormField>
            <FormField label="Email" style={{ margin: 0 }}>
              <input type="email" className="form-input" value={contEmail} onChange={(e) => setContEmail(e.target.value)} placeholder="email@server.com" />
            </FormField>
          </FormRow>
          <FormField label="Address">
            <input type="text" className="form-input" value={contAddress} onChange={(e) => setContAddress(e.target.value)} placeholder="Billing address" />
          </FormField>
          <FormActions
            onCancel={() => setShowAddContact(false)}
            submitLabel="Save Contact"
          />
        </form>
      </Modal>

      {/* Dialog: Add Inventory Item */}
      <Modal isOpen={showAddInventory} onClose={() => setShowAddInventory(false)} title="Catalog Inventory Item" size="md">
        <form onSubmit={handleAddInventory} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-1)' }}>
          <FormField label="Stock Code">
            <input type="text" className="form-input" value={invCode} onChange={(e) => setInvCode(e.target.value)} placeholder="ABCD-STOCK-01" required />
          </FormField>
          <FormField label="Item Description">
            <input type="text" className="form-input" value={invName} onChange={(e) => setInvName(e.target.value)} placeholder="Product descriptive name" required />
          </FormField>
          <FormRow gap="var(--spacing-075)">
            <FormField label="Quantity on Hand" style={{ margin: 0 }}>
              <input type="number" className="form-input" value={invQty} onChange={(e) => setInvQty(e.target.value)} placeholder="0" required />
            </FormField>
            <FormField label="GST Tax Bracket (%)" style={{ margin: 0 }}>
              <select value={invGstRate} onChange={(e) => setInvGstRate(e.target.value)}>
                <option value="0">0% (Nil)</option>
                <option value="5">5% (Essential)</option>
                <option value="12">12%</option>
                <option value="18">18% (Standard)</option>
                <option value="28">28% (Luxury)</option>
              </select>
            </FormField>
          </FormRow>
          <FormRow gap="var(--spacing-075)">
            <FormField label="Unit Purchase Cost (₹)" style={{ margin: 0 }}>
              <CurrencyInput className="form-input" value={invPurchasePrice} onChange={(e) => setInvPurchasePrice(e.target.value)} placeholder="Buy price" required />
            </FormField>
            <FormField label="Unit Sales Price (₹)" style={{ margin: 0 }}>
              <CurrencyInput className="form-input" value={invSalesPrice} onChange={(e) => setInvSalesPrice(e.target.value)} placeholder="Sell price" required />
            </FormField>
          </FormRow>
          <FormField label="Reorder Limit Warning Point">
            <input type="number" className="form-input" value={invReorder} onChange={(e) => setInvReorder(e.target.value)} placeholder="5" />
          </FormField>
          <FormActions
            onCancel={() => setShowAddInventory(false)}
            submitLabel="Save Item"
          />
        </form>
      </Modal>

      {/* Dialog: Create Invoice */}
      <Modal isOpen={showCreateInvoice} onClose={() => setShowCreateInvoice(false)} title="Draft GST Invoice" size="lg">
        <form onSubmit={handleCreateInvoice} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-1)' }}>
          <FormRow>
            <FormField label="Invoice Number" style={{ margin: 0 }}>
              <input type="text" className="form-input" value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} required />
            </FormField>
            <FormField label="Choose Client" style={{ margin: 0 }}>
              <select value={selectedCustomerId} onChange={(e) => setSelectedCustomerId(e.target.value)} required>
                <option value="">-- Select Customer --</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.name} {c.gstin ? `(${c.gstin})` : ''}</option>)}
              </select>
            </FormField>
          </FormRow>

          <h4 style={{ fontSize: 'var(--font-base)', margin: 'var(--spacing-05) 0 var(--spacing-025) 0', fontWeight: 'var(--fw-bold)' }}>Line Items</h4>
          {invoiceItems.map((row, idx) => (
            <div key={idx} style={{ display: 'flex', gap: 'var(--spacing-05)', alignItems: 'flex-end', marginBottom: 'var(--spacing-05)', flexWrap: 'wrap', minWidth: 0 }}>
              <div className="form-group" style={{ flex: '3 1 200px', margin: 0, minWidth: 0 }}>
                <select value={row.itemId} onChange={(e) => handleInvoiceItemChange(idx, 'itemId', e.target.value)} required>
                  <option value="">-- Choose Stock Item --</option>
                  {inventory.map(i => <option key={i.id} value={i.id}>{i.name} (Sell: ₹{i.salesPrice})</option>)}
                </select>
              </div>
              <div className="form-group" style={{ flex: 1, margin: 0 }}>
                <input type="number" className="form-input" value={row.quantity} onChange={(e) => handleInvoiceItemChange(idx, 'quantity', e.target.value)} min={1} required />
              </div>
              <Button type="button" variant="danger" style={{ padding: 'var(--spacing-06) var(--spacing-08)' }} onClick={() => removeInvoiceItemRow(idx)}>X</Button>
            </div>
          ))}

          <Button type="button" variant="secondary" style={{ padding: 'var(--spacing-04) var(--spacing-075)', fontSize: 'var(--font-xs)', alignSelf: 'flex-start' }} onClick={addInvoiceItemRow}>
            + Add Row Item
          </Button>

          <FormField label="Invoice Notes / Terms">
            <textarea className="form-input" style={{ height: '60px' }} value={invoiceNotes} onChange={(e) => setInvoiceNotes(e.target.value)} placeholder="Terms of payment, Bank details, etc." />
          </FormField>

          <FormActions
            onCancel={() => setShowCreateInvoice(false)}
            submitLabel="Generate Invoice"
          />
        </form>
      </Modal>

      {/* Dialog: Invoice Print/View */}
      {viewingInvoice && (
        <div className="invoice-print-modal">
          <div className="invoice-print-content">
            <div id="printable-invoice">
              <div className="invoice-header">
                <div>
                  <h3 className="invoice-title">TAX INVOICE</h3>
                  <div className="invoice-subtitle">FinanceOS India Bookkeeping Sandbox</div>
                </div>
                <div className="invoice-number-block">
                  <h4 className="invoice-number">{viewingInvoice.invoiceNumber}</h4>
                  <div className="invoice-date">Date: {viewingInvoice.date}</div>
                  <div className="invoice-date">Due Date: {viewingInvoice.dueDate}</div>
                </div>
              </div>

              <div className="invoice-party-row">
                <div className="invoice-party">
                  <div className="invoice-party-label">Billed By:</div>
                  <div className="invoice-party-name">{activeProfile?.name || 'Owner'} (Proprietor)</div>
                  <div>{settings.businessName || 'Trading Enterprises'}</div>
                  <div className="invoice-party-gstin">GSTIN: {settings.businessGSTIN || 'N/A'}</div>
                </div>
                <div className="invoice-party">
                  <div className="invoice-party-label">Billed To:</div>
                  <div className="invoice-party-name">{viewingInvoice.customerName}</div>
                  {viewingInvoice.customerGSTIN && <div className="invoice-party-gstin">GSTIN: {viewingInvoice.customerGSTIN}</div>}
                </div>
              </div>

              <div style={{ overflowX: 'auto' }}>
              <table className="invoice-table">
                <thead>
                  <tr>
                    <th>Item Description</th>
                    <th style={{ textAlign: 'center' }}>Qty</th>
                    <th style={{ textAlign: 'right' }}>Rate (₹)</th>
                    <th style={{ textAlign: 'center' }}>GST %</th>
                    <th style={{ textAlign: 'right' }}>Amount (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {viewingInvoice.items.map((item, idx) => (
                    <tr key={idx}>
                      <td>{item.name}</td>
                      <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                      <td style={{ textAlign: 'right' }}>{item.price.toFixed(2)}</td>
                      <td style={{ textAlign: 'center' }}>{item.gstRate}%</td>
                      <td style={{ textAlign: 'right' }}>{item.amount.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>

              <div className="invoice-totals">
                <div className="invoice-totals-block">
                  <div className="invoice-total-row">
                    <span>Subtotal:</span>
                    <span>₹{viewingInvoice.subtotal.toFixed(2)}</span>
                  </div>
                  {viewingInvoice.cgstTotal > 0 && (
                    <div className="invoice-total-row invoice-total-row--subtle">
                      <span>CGST Collected:</span>
                      <span>₹{viewingInvoice.cgstTotal.toFixed(2)}</span>
                    </div>
                  )}
                  {viewingInvoice.sgstTotal > 0 && (
                    <div className="invoice-total-row invoice-total-row--subtle">
                      <span>SGST Collected:</span>
                      <span>₹{viewingInvoice.sgstTotal.toFixed(2)}</span>
                    </div>
                  )}
                  {viewingInvoice.igstTotal > 0 && (
                    <div className="invoice-total-row invoice-total-row--subtle">
                      <span>IGST Collected:</span>
                      <span>₹{viewingInvoice.igstTotal.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="invoice-total-row invoice-grand-total">
                    <span>Grand Total:</span>
                    <span>₹{viewingInvoice.grandTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {viewingInvoice.notes && (
                <div className="invoice-notes">
                  <strong>Notes/Terms:</strong> {viewingInvoice.notes}
                </div>
              )}

              <div className="invoice-actions">
                <Button variant="secondary" onClick={() => window.print()}>
                  <Printer size={16} /> Print/Save PDF
                </Button>
                <Button variant="primary" onClick={() => setViewingInvoice(null)}>Close</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dialog: Edit Contact */}
      <Modal isOpen={showEditContact} onClose={() => setShowEditContact(false)} title="Edit Contact" size="sm">
        <form onSubmit={handleEditContactSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-1)' }}>
          <FormField label="Contact Name">
            <input type="text" className="form-input" value={editContName} onChange={(e) => setEditContName(e.target.value)} required />
          </FormField>
          <FormField label="GSTIN (Optional)">
            <input type="text" className="form-input" value={editContGstin} onChange={(e) => setEditContGstin(e.target.value)} />
          </FormField>
          <FormField label="Contact Type">
            <select className="form-input" value={editContType} onChange={(e) => setEditContType(e.target.value as any)}>
              <option value="Customer">Client / Customer</option>
              <option value="Vendor">Vendor / Supplier</option>
            </select>
          </FormField>
          <FormRow>
            <FormField label="Phone" style={{ margin: 0 }}>
              <input type="text" className="form-input" value={editContPhone} onChange={(e) => setEditContPhone(e.target.value)} />
            </FormField>
            <FormField label="Email" style={{ margin: 0 }}>
              <input type="email" className="form-input" value={editContEmail} onChange={(e) => setEditContEmail(e.target.value)} />
            </FormField>
          </FormRow>
          <FormField label="Address">
            <input type="text" className="form-input" value={editContAddress} onChange={(e) => setEditContAddress(e.target.value)} />
          </FormField>
          <FormActions
            onCancel={() => setShowEditContact(false)}
            submitLabel="Save Changes"
          />
        </form>
      </Modal>

      {/* Dialog: Edit Inventory Item */}
      <Modal isOpen={showEditInventory} onClose={() => setShowEditInventory(false)} title="Edit Inventory Stock" size="md">
        <form onSubmit={handleEditInventorySubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-1)' }}>
          <FormRow columns="1fr 2fr">
            <FormField label="SKU Code" style={{ margin: 0 }}>
              <input type="text" className="form-input" value={editInvCode} onChange={(e) => setEditInvCode(e.target.value)} required />
            </FormField>
            <FormField label="Item Name" style={{ margin: 0 }}>
              <input type="text" className="form-input" value={editInvName} onChange={(e) => setEditInvName(e.target.value)} required />
            </FormField>
          </FormRow>
          <FormRow>
            <FormField label="Purchase Price (₹)" style={{ margin: 0 }}>
              <CurrencyInput className="form-input" value={editInvPurchasePrice} onChange={(e) => setEditInvPurchasePrice(e.target.value)} required />
            </FormField>
            <FormField label="Sales Price (₹)" style={{ margin: 0 }}>
              <CurrencyInput className="form-input" value={editInvSalesPrice} onChange={(e) => setEditInvSalesPrice(e.target.value)} required />
            </FormField>
          </FormRow>
          <FormRow columns={3}>
            <FormField label="Stock Qty" style={{ margin: 0 }}>
              <input type="number" step="any" className="form-input" value={editInvQty} onChange={(e) => setEditInvQty(e.target.value)} required />
            </FormField>
            <FormField label="GST Rate %" style={{ margin: 0 }}>
              <input type="number" step="any" className="form-input" value={editInvGstRate} onChange={(e) => setEditInvGstRate(e.target.value)} required />
            </FormField>
            <FormField label="Reorder Limit" style={{ margin: 0 }}>
              <input type="number" step="any" className="form-input" value={editInvReorder} onChange={(e) => setEditInvReorder(e.target.value)} required />
            </FormField>
          </FormRow>
          <FormActions
            onCancel={() => setShowEditInventory(false)}
            submitLabel="Save Changes"
          />
        </form>
      </Modal>

      {/* Dialog: Edit/Add Register Entry */}
      <Modal isOpen={showRegisterForm} onClose={() => setShowRegisterForm(false)} title={regIsEdit ? 'Edit Register Entry' : 'Add Register Entry'} size="md">
        <form onSubmit={handleSaveRegisterEntry} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-1)' }}>
          <FormRow>
            <FormField label="Date" style={{ margin: 0 }}>
              <input type="date" className="form-input" value={regDate} onChange={(e) => setRegDate(e.target.value)} required />
            </FormField>
            <FormField label="Type" style={{ margin: 0 }}>
              <select className="form-input" value={regType} onChange={(e) => setRegType(e.target.value as any)}>
                <option value="Purchase">Purchase (Input Credit)</option>
                <option value="Sales">Sales (Liability)</option>
              </select>
            </FormField>
          </FormRow>
          <FormRow>
            <FormField label="Ref / Bill Number" style={{ margin: 0 }}>
              <input type="text" className="form-input" value={regRefNumber} onChange={(e) => setRegRefNumber(e.target.value)} />
            </FormField>
            <FormField label="Party Name" style={{ margin: 0 }}>
              <input type="text" className="form-input" value={regPartyName} onChange={(e) => setRegPartyName(e.target.value)} required />
            </FormField>
          </FormRow>
          <FormRow>
            <FormField label="Taxable Amount (₹)" style={{ margin: 0 }}>
              <CurrencyInput className="form-input" value={regTaxableAmount} onChange={(e) => setRegTaxableAmount(e.target.value)} required />
            </FormField>
            <FormField label="GST Rate %" style={{ margin: 0 }}>
              <input type="number" step="any" className="form-input" value={regGstRate} onChange={(e) => setRegGstRate(e.target.value)} />
            </FormField>
          </FormRow>
          <FormRow columns={3}>
            <FormField label="CGST (₹)" style={{ margin: 0 }}>
              <CurrencyInput className="form-input" value={regCgst} onChange={(e) => setRegCgst(e.target.value)} />
            </FormField>
            <FormField label="SGST (₹)" style={{ margin: 0 }}>
              <CurrencyInput className="form-input" value={regSgst} onChange={(e) => setRegSgst(e.target.value)} />
            </FormField>
            <FormField label="IGST (₹)" style={{ margin: 0 }}>
              <CurrencyInput className="form-input" value={regIgst} onChange={(e) => setRegIgst(e.target.value)} />
            </FormField>
          </FormRow>

          <FormActions
            onCancel={() => setShowRegisterForm(false)}
            submitLabel="Save Entry"
          />
        </form>
      </Modal>

    </motion.div>
    </>
  );
};
