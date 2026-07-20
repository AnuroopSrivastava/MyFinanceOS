import React, { useState, useMemo } from 'react';
import { dbService } from '@financeos/database';
import { GlobalDateRange, filterByDateRange } from '../utils/dateFilter.js';
import {
  BusinessInvoice, InventoryItem, VendorCustomer,
  BusinessRegisterEntry
} from '@financeos/shared';
import {
  Printer, Coins, ShoppingBag, Eye, Trash2, Edit2,
  FileText, Archive, BarChart2, Plus
} from 'lucide-react';
import { formatRupee } from '../utils/currency.js';
import { CurrencyInput } from './ui/CurrencyInput.js';

interface BusinessViewProps {
  dateRange: GlobalDateRange;

  activeProfileId: string;
}

export const BusinessView: React.FC<BusinessViewProps> = ({ activeProfileId, dateRange }) => {
  const [activeSubTab, setActiveSubTab] = useState<'invoices' | 'gst' | 'inventory' | 'statements'>('invoices');

  const settings = useMemo(() => dbService.getSettings(), []);
  const profiles = useMemo(() => dbService.getProfiles(), []);
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

  // Form: Invoicing Generator States
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

  const refreshData = () => {
    setInvoices(dbService.getInvoices());
    setInventory(dbService.getInventory());
    setContacts(dbService.getContacts());
    setRegister(dbService.getRegister());
  };

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

    register.forEach(r => {
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
    if (confirm('Delete this contact?')) {
      await dbService.deleteContact(id);
      refreshData();
    }
  };

  const handleAddInventory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invCode || !invName || !invQty || !invPurchasePrice || !invSalesPrice) return;
    await dbService.addInventoryItem({
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
    if (confirm('Delete this inventory item?')) {
      await dbService.deleteInventoryItem(id);
      refreshData();
    }
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
    const customer = customers.find(c => c.id === selectedCustomerId);
    if (!customer) return;

    let subtotal = 0;
    let cgstTotal = 0;
    let sgstTotal = 0;
    let igstTotal = 0;
    const itemsList = [];

    for (const itemRow of invoiceItems) {
      const invItem = inventory.find(i => i.id === itemRow.itemId);
      if (invItem) {
        const itemAmount = invItem.salesPrice * itemRow.quantity;
        const taxRate = invItem.gstRate;

        const isInterState = customer.gstin ? !customer.gstin.startsWith('27') : false; // Maharashtra default state check
        const taxAmount = itemAmount * (taxRate / 100);

        if (isInterState) {
          igstTotal += taxAmount;
        } else {
          cgstTotal += taxAmount / 2;
          sgstTotal += taxAmount / 2;
        }

        subtotal += itemAmount;
        itemsList.push({
          itemId: invItem.id,
          name: invItem.name,
          quantity: itemRow.quantity,
          price: invItem.salesPrice,
          gstRate: taxRate,
          amount: itemAmount
        });
      }
    }

    const grandTotal = subtotal + cgstTotal + sgstTotal + igstTotal;

    await dbService.addInvoice({
      invoiceNumber,
      date: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      customerId: customer.id,
      customerName: customer.name,
      customerGSTIN: customer.gstin,
      items: itemsList,
      subtotal,
      cgstTotal,
      sgstTotal,
      igstTotal,
      grandTotal,
      status: 'Sent',
      notes: invoiceNotes
    });

    setSelectedCustomerId('');
    setInvoiceItems([{ itemId: '', quantity: 1 }]);
    setInvoiceNotes('');
    setInvoiceNumber(`INV-2026-00${invoices.length + 2}`);
    setShowCreateInvoice(false);
    refreshData();
  };

  const handleUpdateInvoiceStatus = async (id: string, currentStatus: string) => {
    const statuses = ['Draft', 'Sent', 'Paid', 'Overdue'];
    const nextStatus = statuses[(statuses.indexOf(currentStatus) + 1) % statuses.length];
    await dbService.updateInvoiceStatus(id, nextStatus as any);
    refreshData();
  };

  const handleDeleteInvoice = async (id: string) => {
    if (confirm('Delete this invoice? This will restock inventory and remove the GSTR sales entry.')) {
      await dbService.deleteInvoice(id);
      refreshData();
    }
  };

  const handleSaveRegisterEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regDate || !regPartyName || !regTaxableAmount) return;
    
    const entryData = {
      date: regDate,
      type: regType,
      refNumber: regRefNumber,
      partyName: regPartyName,
      taxableAmount: parseFloat(regTaxableAmount),
      cgst: parseFloat(regCgst) || 0,
      sgst: parseFloat(regSgst) || 0,
      igst: parseFloat(regIgst) || 0,
      totalAmount: parseFloat(regTaxableAmount) + (parseFloat(regCgst) || 0) + (parseFloat(regSgst) || 0) + (parseFloat(regIgst) || 0),
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
    if (confirm('Delete this register entry?')) {
      await dbService.deleteRegisterEntry(id);
      refreshData();
    }
  };



  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

      {/* Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Corporate & Bookkeeping Engine</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>GST Billing, purchase/sales journals, FIFO stock sheets, and financial statements</p>
        </div>
      </div>

      {/* Sub tabs */}
      <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
        <button className={`btn ${activeSubTab === 'invoices' ? 'btn-primary' : 'btn-secondary'}`} style={{ padding: '0.5rem 1rem' }} onClick={() => setActiveSubTab('invoices')}>
          <FileText size={14} /> GST Invoices & Clients
        </button>
        <button className={`btn ${activeSubTab === 'gst' ? 'btn-primary' : 'btn-secondary'}`} style={{ padding: '0.5rem 1rem' }} onClick={() => setActiveSubTab('gst')}>
          <Coins size={14} /> GSTR Liability Register
        </button>
        <button className={`btn ${activeSubTab === 'inventory' ? 'btn-primary' : 'btn-secondary'}`} style={{ padding: '0.5rem 1rem' }} onClick={() => setActiveSubTab('inventory')}>
          <Archive size={14} /> FIFO Inventory Ledger
        </button>
        <button className={`btn ${activeSubTab === 'statements' ? 'btn-primary' : 'btn-secondary'}`} style={{ padding: '0.5rem 1rem' }} onClick={() => setActiveSubTab('statements')}>
          <BarChart2 size={14} /> Financial Statements
        </button>
      </div>

      {/* Sub tab: Invoices & Clients Split View */}
      {activeSubTab === 'invoices' && (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.25rem' }} className="responsive-stack">

          {/* Active Invoices List */}
          <div className="glass-panel" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Active Invoices</h3>
              <button className="btn btn-primary" onClick={() => setShowCreateInvoice(true)} disabled={customers.length === 0 || inventory.length === 0}>
                <Plus size={16} /> New GST Invoice
              </button>
            </div>

            {customers.length === 0 || inventory.length === 0 ? (
              <div style={{
                color: 'var(--text-muted)', fontSize: '0.82rem', border: '1px dashed var(--border-color)',
                padding: '2rem', borderRadius: 'var(--radius-sm)', textAlign: 'center'
              }}>
                Please create at least **1 Customer** and **1 Inventory Item** before drafting an invoice.
              </div>
            ) : null}

            <table className="custom-table" style={{ marginTop: '0.5rem' }}>
              <thead>
                <tr>
                  <th>Invoice #</th>
                  <th>Date</th>
                  <th>Client Name</th>
                  <th>Grand Total</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.length > 0 ? (
                  invoices.map(inv => (
                    <tr key={inv.id}>
                      <td style={{ fontWeight: 650 }}>{inv.invoiceNumber}</td>
                      <td>{inv.date}</td>
                      <td style={{ fontWeight: 550 }}>{inv.customerName}</td>
                      <td style={{ fontWeight: 650, color: 'var(--accent-1)' }}>{formatRupee(inv.grandTotal)}</td>
                      <td>
                        <span style={{
                          fontSize: '0.75rem', fontWeight: 600, padding: '0.15rem 0.5rem', borderRadius: '4px',
                          color: inv.status === 'Paid' ? 'var(--success)' : 'var(--warning)',
                          background: inv.status === 'Paid' ? 'var(--success-bg)' : 'var(--warning-bg)'
                        }}>{inv.status}</span>
                      </td>
                      <td style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                        <button className="btn btn-secondary" style={{ padding: '0.35rem', fontSize: '0.75rem' }} onClick={() => handleUpdateInvoiceStatus(inv.id, inv.status)}>
                          Status
                        </button>
                        <button className="btn btn-secondary" style={{ padding: '0.35rem' }} onClick={() => setViewingInvoice(inv)}>
                          <Eye size={13} /> View
                        </button>
                        <button className="btn btn-danger" style={{ padding: '0.35rem' }} onClick={() => handleDeleteInvoice(inv.id)}>
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                      No invoices drafted.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Manage Clients List */}
          <div className="glass-panel" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Contacts Directory</h3>
              <button className="btn btn-secondary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }} onClick={() => setShowAddContact(true)}>
                <Plus size={14} /> Add
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '400px', overflowY: 'auto' }}>
              {contacts.map(c => (
                <div key={c.id} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem',
                  background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-sm)', fontSize: '0.82rem',
                  border: '1px solid var(--border-color)'
                }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{c.name}</div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Type: {c.type} {c.gstin ? `| GSTIN: ${c.gstin}` : ''}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <button className="btn btn-secondary" style={{ padding: '0.25rem', borderRadius: '4px' }} onClick={() => openEditContact(c)}>
                      <Edit2 size={12} />
                    </button>
                    <button className="btn btn-danger" style={{ padding: '0.25rem', borderRadius: '4px' }} onClick={() => handleDeleteContact(c.id)}>
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))}

              {contacts.length === 0 && (
                <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textAlign: 'center', padding: '2rem' }}>
                  No contacts linked yet. Click "Add" to save clients and vendors.
                </div>
              )}
            </div>
          </div>

        </div>
      )}

      {/* Sub tab: GST Liabilities */}
      {activeSubTab === 'gst' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          <div className="glass-panel" style={{ padding: '1.25rem', background: 'linear-gradient(135deg, rgba(3,105,161,0.05) 0%, rgba(3,105,161,0.01) 100%)' }}>
            <h4 style={{ fontSize: '1rem', marginBottom: '0.75rem', color: 'var(--text-secondary)' }}>Net GST Reconciliation Summary</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
              <div>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>GST Collected (Outward Sales)</span>
                <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--accent-1)', marginTop: '0.2rem' }}>
                  {formatRupee(gstSummary.cgstCollected + gstSummary.sgstCollected + gstSummary.igstCollected)}
                </div>
              </div>
              <div>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Input Credit (Inward Purchase)</span>
                <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--success)', marginTop: '0.2rem' }}>
                  {formatRupee(gstSummary.cgstPaid + gstSummary.sgstPaid + gstSummary.igstPaid)}
                </div>
              </div>
              <div style={{ borderLeft: '1px solid var(--border-color)', paddingLeft: '1.25rem' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Net GSTR-3B Liability Due</span>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: gstSummary.totalNetPayable >= 0 ? 'var(--warning)' : 'var(--success)', marginTop: '0.2rem' }}>
                  {formatRupee(gstSummary.totalNetPayable)}
                </div>
              </div>
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <h4 style={{ fontSize: '1.1rem' }}>GSTR Register entries</h4>
              <button className="btn btn-secondary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }} onClick={() => openAddRegisterEntry()}>
                <Plus size={14} /> Add Entry
              </button>
            </div>
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Bill/Inv #</th>
                  <th>Client/Party Name</th>
                  <th>Taxable Amt</th>
                  <th>CGST</th>
                  <th>SGST</th>
                  <th>IGST</th>
                  <th>Total Amt</th>
                  <th style={{ textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {register.length > 0 ? (
                  register.map(reg => (
                    <tr key={reg.id}>
                      <td>{reg.date}</td>
                      <td>
                        <span style={{
                          fontSize: '0.72rem', fontWeight: 600, padding: '0.1rem 0.35rem', borderRadius: '3px',
                          color: reg.type === 'Sales' ? 'var(--accent-1)' : 'var(--success)',
                          background: reg.type === 'Sales' ? 'hsla(186, 100%, 50%, 0.1)' : 'var(--success-bg)'
                        }}>{reg.type}</span>
                      </td>
                      <td>{reg.refNumber}</td>
                      <td style={{ fontWeight: 550 }}>{reg.partyName}</td>
                      <td>{formatRupee(reg.taxableAmount)}</td>
                      <td>{formatRupee(reg.cgst)}</td>
                      <td>{formatRupee(reg.sgst)}</td>
                      <td>{formatRupee(reg.igst)}</td>
                      <td style={{ fontWeight: 650 }}>{formatRupee(reg.totalAmount)}</td>
                      <td style={{ display: 'flex', gap: '0.4rem', justifyContent: 'center' }}>
                        <button className="btn btn-secondary" style={{ padding: '0.25rem', borderRadius: '4px' }} onClick={() => openEditRegisterEntry(reg)}>
                          <Edit2 size={12} />
                        </button>
                        <button className="btn btn-danger" style={{ padding: '0.25rem', borderRadius: '4px' }} onClick={() => handleDeleteRegisterEntry(reg.id)}>
                          <Trash2 size={12} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={10} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                      No tax entries recorded in the current registers.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Sub tab: FIFO Inventory */}
      {activeSubTab === 'inventory' && (
        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.1rem' }}>FIFO Store Inventory Stock Ledger</h3>
            <button className="btn btn-primary" onClick={() => setShowAddInventory(true)}>
              <Plus size={16} /> Add Stock Item
            </button>
          </div>

          <table className="custom-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Item Name</th>
                <th>Quantity</th>
                <th>Purchase Cost</th>
                <th>Sales Cost</th>
                <th>GST Slabs</th>
                <th>Total Value</th>
                <th>Alert Status</th>
                <th style={{ textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {inventory.length > 0 ? (
                inventory.map(item => {
                  const totalCostVal = item.quantity * item.purchasePrice;
                  const isUnderstock = item.quantity <= item.reorderLevel;
                  return (
                    <tr key={item.id}>
                      <td style={{ fontWeight: 600 }}>{item.code}</td>
                      <td style={{ color: 'var(--text-secondary)' }}>{item.name}</td>
                      <td style={{ fontWeight: 650 }}>{item.quantity} units</td>
                      <td>{formatRupee(item.purchasePrice)}</td>
                      <td>{formatRupee(item.salesPrice)}</td>
                      <td>{item.gstRate}%</td>
                      <td style={{ fontWeight: 650 }}>{formatRupee(totalCostVal)}</td>
                      <td>
                        {isUnderstock ? (
                          <span style={{ color: 'var(--error)', fontSize: '0.78rem', fontWeight: 600 }}>⚠️ Understock Warning</span>
                        ) : (
                          <span style={{ color: 'var(--success)', fontSize: '0.78rem' }}>✓ Good</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'center' }}>
                          <button className="btn btn-secondary" style={{ padding: '0.3rem', borderRadius: '4px' }} onClick={() => openEditInventory(item)}>
                            <Edit2 size={13} />
                          </button>
                          <button className="btn btn-danger" style={{ padding: '0.3rem', borderRadius: '4px' }} onClick={() => handleDeleteInventoryItem(item.id)}>
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                    No stock inventory listed. Click "Add Stock Item" to catalog.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Sub tab: Statements (P&L and Balance Sheet) */}
      {activeSubTab === 'statements' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }} className="responsive-stack">

          <div className="glass-panel" style={{ padding: '1.25rem' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
              Profit & Loss Statement (Estimated)
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Sales Operating Revenue</span>
                <span style={{ fontWeight: 600 }}>{formatRupee(profitAndLoss.salesRevenue)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                <span>Less: Cost of Goods Sold (COGS)</span>
                <span>-{formatRupee(profitAndLoss.purchasesCost)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 650, borderTop: '1px solid var(--border-color)', paddingTop: '0.4rem' }}>
                <span>Gross Profit Margin</span>
                <span style={{ color: 'var(--accent-1)' }}>{formatRupee(profitAndLoss.grossProfit)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                <span>Less: Ledger Operating Expenses</span>
                <span>-{formatRupee(profitAndLoss.generalExpenses)}</span>
              </div>
              <div style={{
                display: 'flex', justifyContent: 'space-between', fontWeight: 700,
                borderTop: '2px double var(--border-color)', paddingTop: '0.5rem', marginTop: '0.5rem',
                fontSize: '1rem', color: profitAndLoss.netProfit >= 0 ? 'var(--success)' : 'var(--error)'
              }}>
                <span>Net Business Earnings</span>
                <span>{formatRupee(profitAndLoss.netProfit)}</span>
              </div>
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '1.25rem' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
              Balance Sheet
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.88rem' }}>
              <div style={{ fontWeight: 600, color: 'var(--accent-1)' }}>ASSETS</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: '0.75rem' }}>
                <span>Cash & Cash Equivalents</span>
                <span>{formatRupee(balanceSheet.cashBalance)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: '0.75rem' }}>
                <span>Inventory Valuations (FIFO cost)</span>
                <span>{formatRupee(balanceSheet.stockValuation)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: '0.75rem' }}>
                <span>Trade Accounts Receivables</span>
                <span>{formatRupee(balanceSheet.receivables)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 650, borderTop: '1px dashed var(--border-color)', paddingTop: '0.4rem', paddingLeft: '0.75rem' }}>
                <span>Total Assets Valuation</span>
                <span>{formatRupee(balanceSheet.totalAssets)}</span>
              </div>

              <div style={{ fontWeight: 600, color: 'var(--accent-2)', marginTop: '0.5rem' }}>LIABILITIES & EQUITY</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: '0.75rem' }}>
                <span>Partner Owner Equity capital</span>
                <span>{formatRupee(balanceSheet.equityCapital)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, borderTop: '2px double var(--border-color)', paddingTop: '0.4rem', paddingLeft: '0.75rem', marginTop: '0.25rem' }}>
                <span>Total Equity & Liabilities</span>
                <span>{formatRupee(balanceSheet.equityCapital)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dialog: Add Contact */}
      {showAddContact && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '400px', padding: '1.5rem 2rem' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '1.25rem' }}>Add Contact</h3>
            <form onSubmit={handleAddContact}>
              <div className="form-group">
                <label className="form-label">Full Name / Trading Label</label>
                <input type="text" className="form-input" value={contName} onChange={(e) => setContName(e.target.value)} placeholder="e.g. Sharma Enterprise" required />
              </div>
              <div className="form-group">
                <label className="form-label">GSTIN (Optional)</label>
                <input type="text" className="form-input" value={contGstin} onChange={(e) => setContGstin(e.target.value)} placeholder="15 character GSTIN" />
              </div>
              <div className="form-group">
                <label className="form-label">Contact Type</label>
                <select value={contType} onChange={(e) => setContType(e.target.value as any)}>
                  <option value="Customer">Customer</option>
                  <option value="Vendor">Vendor</option>
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input type="text" className="form-input" value={contPhone} onChange={(e) => setContPhone(e.target.value)} placeholder="Mobile num" />
                </div>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input type="email" className="form-input" value={contEmail} onChange={(e) => setContEmail(e.target.value)} placeholder="email@server.com" />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Address</label>
                <input type="text" className="form-input" value={contAddress} onChange={(e) => setContAddress(e.target.value)} placeholder="Billing address" />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddContact(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Contact</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dialog: Add Inventory Item */}
      {showAddInventory && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '420px', padding: '1.5rem 2rem' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '1.25rem' }}>Catalog Inventory Item</h3>
            <form onSubmit={handleAddInventory}>
              <div className="form-group">
                <label className="form-label">Stock Code</label>
                <input type="text" className="form-input" value={invCode} onChange={(e) => setInvCode(e.target.value)} placeholder="e.g. LED-40" required />
              </div>
              <div className="form-group">
                <label className="form-label">Item Description</label>
                <input type="text" className="form-input" value={invName} onChange={(e) => setInvName(e.target.value)} placeholder="Product descriptive name" required />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">Quantity on Hand</label>
                  <input type="number" className="form-input" value={invQty} onChange={(e) => setInvQty(e.target.value)} placeholder="0" required />
                </div>
                <div className="form-group">
                  <label className="form-label">GST Tax Bracket (%)</label>
                  <select value={invGstRate} onChange={(e) => setInvGstRate(e.target.value)}>
                    <option value="0">0% (Nil)</option>
                    <option value="5">5% (Essential)</option>
                    <option value="12">12%</option>
                    <option value="18">18% (Standard)</option>
                    <option value="28">28% (Luxury)</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">Unit Purchase Cost (₹)</label>
                  <CurrencyInput className="form-input" value={invPurchasePrice} onChange={(e) => setInvPurchasePrice(e.target.value)} placeholder="Buy price" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Unit Sales Price (₹)</label>
                  <CurrencyInput className="form-input" value={invSalesPrice} onChange={(e) => setInvSalesPrice(e.target.value)} placeholder="Sell price" required />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Reorder Limit Warning Point</label>
                <input type="number" className="form-input" value={invReorder} onChange={(e) => setInvReorder(e.target.value)} placeholder="5" />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddInventory(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Item</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dialog: Create Invoice */}
      {showCreateInvoice && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div className="glass-panel" style={{ width: '90%', maxWidth: '600px', padding: '1.5rem 2rem', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '1.25rem' }}>Draft GST Invoice</h3>
            <form onSubmit={handleCreateInvoice}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Invoice Number</label>
                  <input type="text" className="form-input" value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Choose Client</label>
                  <select value={selectedCustomerId} onChange={(e) => setSelectedCustomerId(e.target.value)} required>
                    <option value="">-- Select Customer --</option>
                    {customers.map(c => <option key={c.id} value={c.id}>{c.name} {c.gstin ? `(${c.gstin})` : ''}</option>)}
                  </select>
                </div>
              </div>

              <h4 style={{ fontSize: '0.95rem', margin: '0.5rem 0' }}>Line Items</h4>
              {invoiceItems.map((row, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end', marginBottom: '0.5rem' }}>
                  <div className="form-group" style={{ flex: 3, margin: 0 }}>
                    <select value={row.itemId} onChange={(e) => handleInvoiceItemChange(idx, 'itemId', e.target.value)} required>
                      <option value="">-- Choose Stock Item --</option>
                      {inventory.map(i => <option key={i.id} value={i.id}>{i.name} (Sell: ₹{i.salesPrice})</option>)}
                    </select>
                  </div>
                  <div className="form-group" style={{ flex: 1, margin: 0 }}>
                    <input type="number" className="form-input" value={row.quantity} onChange={(e) => handleInvoiceItemChange(idx, 'quantity', e.target.value)} min={1} required />
                  </div>
                  <button type="button" className="btn btn-danger" style={{ padding: '0.6rem 0.8rem' }} onClick={() => removeInvoiceItemRow(idx)}>X</button>
                </div>
              ))}

              <button type="button" className="btn btn-secondary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', marginTop: '0.5rem' }} onClick={addInvoiceItemRow}>
                + Add Row Item
              </button>

              <div className="form-group" style={{ marginTop: '1rem' }}>
                <label className="form-label">Invoice Notes / Terms</label>
                <textarea className="form-input" style={{ height: '60px' }} value={invoiceNotes} onChange={(e) => setInvoiceNotes(e.target.value)} placeholder="Terms of payment, Bank details, etc." />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateInvoice(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Generate Invoice</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dialog: Invoice Print/View */}
      {viewingInvoice && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.65)',
          backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div className="glass-panel" style={{ width: '90%', maxWidth: '640px', padding: '2rem', background: '#fff', color: '#111', maxHeight: '90vh', overflowY: 'auto' }}>
            <div id="printable-invoice">
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #ddd', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#333' }}>TAX INVOICE</h3>
                  <div style={{ fontSize: '0.8rem', color: '#555' }}>FinanceOS India Bookkeeping Sandbox</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 650 }}>{viewingInvoice.invoiceNumber}</h4>
                  <div style={{ fontSize: '0.8rem', color: '#555' }}>Date: {viewingInvoice.date}</div>
                  <div style={{ fontSize: '0.8rem', color: '#555' }}>Due Date: {viewingInvoice.dueDate}</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem', fontSize: '0.85rem' }}>
                <div>
                  <div style={{ fontWeight: 600, color: '#666' }}>Billed By:</div>
                  <div style={{ fontWeight: 600 }}>{activeProfile?.name || 'Owner'} (Proprietor)</div>
                  <div>{settings.businessName || 'Trading Enterprises'}</div>
                  <div>GSTIN: {settings.businessGSTIN || 'N/A'}</div>
                </div>
                <div>
                  <div style={{ fontWeight: 600, color: '#666' }}>Billed To:</div>
                  <div style={{ fontWeight: 600 }}>{viewingInvoice.customerName}</div>
                  {viewingInvoice.customerGSTIN && <div>GSTIN: {viewingInvoice.customerGSTIN}</div>}
                </div>
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1.5rem', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ background: '#f5f5f5', borderBottom: '1px solid #ddd' }}>
                    <th style={{ padding: '0.5rem', textAlign: 'left' }}>Item Description</th>
                    <th style={{ padding: '0.5rem', textAlign: 'center' }}>Qty</th>
                    <th style={{ padding: '0.5rem', textAlign: 'right' }}>Rate (₹)</th>
                    <th style={{ padding: '0.5rem', textAlign: 'center' }}>GST %</th>
                    <th style={{ padding: '0.5rem', textAlign: 'right' }}>Amount (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {viewingInvoice.items.map((item, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '0.5rem' }}>{item.name}</td>
                      <td style={{ padding: '0.5rem', textAlign: 'center' }}>{item.quantity}</td>
                      <td style={{ padding: '0.5rem', textAlign: 'right' }}>{item.price.toFixed(2)}</td>
                      <td style={{ padding: '0.5rem', textAlign: 'center' }}>{item.gstRate}%</td>
                      <td style={{ padding: '0.5rem', textAlign: 'right' }}>{item.amount.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div style={{ display: 'flex', justifyContent: 'flex-end', fontSize: '0.85rem' }}>
                <div style={{ width: '220px', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Subtotal:</span>
                    <span>₹{viewingInvoice.subtotal.toFixed(2)}</span>
                  </div>
                  {viewingInvoice.cgstTotal > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#555' }}>
                      <span>CGST Collected:</span>
                      <span>₹{viewingInvoice.cgstTotal.toFixed(2)}</span>
                    </div>
                  )}
                  {viewingInvoice.sgstTotal > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#555' }}>
                      <span>SGST Collected:</span>
                      <span>₹{viewingInvoice.sgstTotal.toFixed(2)}</span>
                    </div>
                  )}
                  {viewingInvoice.igstTotal > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#555' }}>
                      <span>IGST Collected:</span>
                      <span>₹{viewingInvoice.igstTotal.toFixed(2)}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, borderTop: '1px solid #333', paddingTop: '0.4rem', fontSize: '1rem' }}>
                    <span>Grand Total:</span>
                    <span>₹{viewingInvoice.grandTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {viewingInvoice.notes && (
                <div style={{ marginTop: '2rem', fontSize: '0.78rem', borderTop: '1px solid #ddd', paddingTop: '0.5rem', color: '#666' }}>
                  <strong>Notes/Terms:</strong> {viewingInvoice.notes}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '2rem' }}>
              <button className="btn btn-secondary" style={{ color: '#333', borderColor: '#ccc' }} onClick={() => window.print()}>
                <Printer size={16} /> Print/Save PDF
              </button>
              <button className="btn btn-primary" onClick={() => setViewingInvoice(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Dialog: Edit Contact */}
      {showEditContact && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '400px', padding: '1.5rem 2rem' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '1.25rem' }}>Edit Contact</h3>
            <form onSubmit={handleEditContactSubmit}>
              <div className="form-group">
                <label className="form-label">Contact Name</label>
                <input type="text" className="form-input" value={editContName} onChange={(e) => setEditContName(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">GSTIN (Optional)</label>
                <input type="text" className="form-input" value={editContGstin} onChange={(e) => setEditContGstin(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Contact Type</label>
                <select className="form-input" value={editContType} onChange={(e) => setEditContType(e.target.value as any)}>
                  <option value="Customer">Client / Customer</option>
                  <option value="Vendor">Vendor / Supplier</option>
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input type="text" className="form-input" value={editContPhone} onChange={(e) => setEditContPhone(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input type="email" className="form-input" value={editContEmail} onChange={(e) => setEditContEmail(e.target.value)} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Address</label>
                <input type="text" className="form-input" value={editContAddress} onChange={(e) => setEditContAddress(e.target.value)} />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowEditContact(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dialog: Edit Inventory Item */}
      {showEditInventory && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '440px', padding: '1.5rem 2rem' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '1.25rem' }}>Edit Inventory Stock</h3>
            <form onSubmit={handleEditInventorySubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">SKU Code</label>
                  <input type="text" className="form-input" value={editInvCode} onChange={(e) => setEditInvCode(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Item Name</label>
                  <input type="text" className="form-input" value={editInvName} onChange={(e) => setEditInvName(e.target.value)} required />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Purchase Price (₹)</label>
                  <CurrencyInput className="form-input" value={editInvPurchasePrice} onChange={(e) => setEditInvPurchasePrice(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Sales Price (₹)</label>
                  <CurrencyInput className="form-input" value={editInvSalesPrice} onChange={(e) => setEditInvSalesPrice(e.target.value)} required />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Stock Qty</label>
                  <input type="number" step="any" className="form-input" value={editInvQty} onChange={(e) => setEditInvQty(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">GST Rate %</label>
                  <input type="number" step="any" className="form-input" value={editInvGstRate} onChange={(e) => setEditInvGstRate(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Reorder Limit</label>
                  <input type="number" step="any" className="form-input" value={editInvReorder} onChange={(e) => setEditInvReorder(e.target.value)} required />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowEditInventory(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dialog: Edit/Add Register Entry */}
      {showRegisterForm && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '500px', padding: '1.5rem 2rem' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '1.25rem' }}>{regIsEdit ? 'Edit Register Entry' : 'Add Register Entry'}</h3>
            <form onSubmit={handleSaveRegisterEntry}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Date</label>
                  <input type="date" className="form-input" value={regDate} onChange={(e) => setRegDate(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Type</label>
                  <select className="form-input" value={regType} onChange={(e) => setRegType(e.target.value as any)}>
                    <option value="Purchase">Purchase (Input Credit)</option>
                    <option value="Sales">Sales (Liability)</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Ref / Bill Number</label>
                  <input type="text" className="form-input" value={regRefNumber} onChange={(e) => setRegRefNumber(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Party Name</label>
                  <input type="text" className="form-input" value={regPartyName} onChange={(e) => setRegPartyName(e.target.value)} required />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Taxable Amount (₹)</label>
                  <CurrencyInput className="form-input" value={regTaxableAmount} onChange={(e) => setRegTaxableAmount(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">GST Rate %</label>
                  <input type="number" step="any" className="form-input" value={regGstRate} onChange={(e) => setRegGstRate(e.target.value)} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">CGST (₹)</label>
                  <CurrencyInput className="form-input" value={regCgst} onChange={(e) => setRegCgst(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">SGST (₹)</label>
                  <CurrencyInput className="form-input" value={regSgst} onChange={(e) => setRegSgst(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">IGST (₹)</label>
                  <CurrencyInput className="form-input" value={regIgst} onChange={(e) => setRegIgst(e.target.value)} />
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowRegisterForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Entry</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
