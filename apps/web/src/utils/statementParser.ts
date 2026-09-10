export interface ParsedTx {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'Income' | 'Expense' | 'Transfer';
  category: string;
  selected: boolean;
}

export const getCategory = (desc: string): string => {
  const d = desc.toLowerCase();
  if (d.includes('swiggy') || d.includes('zomato') || d.includes('restaurant') || d.includes('starbucks') || d.includes('food') || d.includes('dining')) {
    return 'Food & Dining';
  }
  if (d.includes('salary') || d.includes('google') || d.includes('credit') || d.includes('payout')) {
    return 'Salary';
  }
  if (d.includes('sip') || d.includes('mutual fund') || d.includes('zerodha') || d.includes('nifty') || d.includes('groww') || d.includes('investment')) {
    return 'Investments';
  }
  if (d.includes('airtel') || d.includes('broadband') || d.includes('power') || d.includes('electricity') || d.includes('bill') || d.includes('recharge') || d.includes('mobile')) {
    return 'Utilities';
  }
  if (d.includes('uber') || d.includes('ola') || d.includes('taxi') || d.includes('cab') || d.includes('transportation') || d.includes('metro') || d.includes('fuel')) {
    return 'Transportation';
  }
  if (d.includes('cred') || d.includes('cc payment') || d.includes('credit card bill')) {
    return 'CreditCard Dues';
  }
  if (d.includes('rent') || d.includes('landlord')) {
    return 'Rent';
  }
  if (d.includes('gst') || d.includes('business') || d.includes('sales')) {
    return 'Business Sales';
  }
  return 'Miscellaneous';
};

export const cleanDescription = (desc: string): string => {
  let clean = desc.trim();
  if (clean.includes('UPI/')) {
    const parts = clean.split('/');
    const merchantPart = parts.find(p => p.trim().length > 3 && !/^\d+$/.test(p) && !p.toLowerCase().includes('upi') && !p.toLowerCase().includes('hdfc') && !p.toLowerCase().includes('icici') && !p.toLowerCase().includes('sbi'));
    if (merchantPart) clean = merchantPart.trim();
  } else if (clean.startsWith('UPI-')) {
    const parts = clean.split('-');
    const merchantPart = parts.find(p => p.trim().length > 3 && !p.toLowerCase().includes('upi') && !p.toLowerCase().includes('icici') && !p.toLowerCase().includes('sbi'));
    if (merchantPart) clean = merchantPart.trim();
  }
  return clean.replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.substring(1).toLowerCase());
};

export const parseStatementText = (text: string): ParsedTx[] => {
  const lines = text.split('\n');
  const results: ParsedTx[] = [];
  const dateRegex = /(\d{4}-\d{2}-\d{2})|(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})|(\d{1,2}[/-][A-Za-z]{3}[/-]\d{2,4})/;

  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    if (!trimmed) return;

    const dateMatch = trimmed.match(dateRegex);
    if (!dateMatch) return;

    const rawDate = dateMatch[0];
    let normalizedDate = new Date().toISOString().split('T')[0];
    try {
      if (/[A-Za-z]{3}/.test(rawDate)) {
        const parts = rawDate.split(/[/-]/);
        const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
        const day = parseInt(parts[0]);
        const monthIdx = months.indexOf(parts[1].toLowerCase().slice(0, 3));
        let year = parseInt(parts[2]);
        if (year < 100) year += 2000;
        if (monthIdx !== -1) {
          normalizedDate = new Date(year, monthIdx, day + 1).toISOString().split('T')[0];
        }
      } else {
        const parts = rawDate.split(/[/-]/);
        if (parts[0].length === 4) {
          normalizedDate = rawDate;
        } else {
          const day = parseInt(parts[0]);
          const month = parseInt(parts[1]) - 1;
          let year = parseInt(parts[2]);
          if (year < 100) year += 2000;
          normalizedDate = new Date(year, month, day + 1).toISOString().split('T')[0];
        }
      }
    } catch {
      normalizedDate = rawDate;
    }

    const cleanLine = trimmed.replace(rawDate, '');
    const tokens = cleanLine.split(/[\t,|]/).map(t => t.trim()).filter(Boolean);

    const amounts: number[] = [];
    let desc = '';

    tokens.forEach(t => {
      const numClean = t.replace(/,/g, '');
      const numMatch = numClean.match(/^[-+]?\d+(\.\d+)?$/);
      if (numMatch) {
        amounts.push(parseFloat(numClean));
      } else if (t.length > 2 && !t.match(/^\d+$/)) {
        desc += ' ' + t;
      }
    });

    if (amounts.length > 0) {
      let finalAmt = amounts[0];
      let type: 'Income' | 'Expense' | 'Transfer' = 'Expense';

      if (amounts.length >= 2) {
        const withdrawal = amounts[0];
        const deposit = amounts[1];
        if (withdrawal > 0 && deposit === 0) {
          finalAmt = withdrawal;
          type = 'Expense';
        } else if (deposit > 0 && withdrawal === 0) {
          finalAmt = deposit;
          type = 'Income';
        }
      } else {
        if (finalAmt < 0) {
          finalAmt = Math.abs(finalAmt);
          type = 'Expense';
        } else {
          type = 'Income';
        }
      }

      const lowercaseDesc = desc.toLowerCase();
      if (lowercaseDesc.includes('cred') || lowercaseDesc.includes('cc bill') || lowercaseDesc.includes('transfer') || lowercaseDesc.includes('sip')) {
        type = 'Transfer';
      }

      const finalDesc = cleanDescription(desc);
      results.push({
        id: `parsed_${idx}_${Date.now()}`,
        date: normalizedDate,
        description: finalDesc,
        amount: finalAmt,
        type,
        category: getCategory(finalDesc),
        selected: true
      });
    }
  });

  return results;
};
