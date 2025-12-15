import { v4 as uuidv4 } from 'uuid';

import type { Client } from './clients';

export type TollingRecord = {
  id: string;
  clientId: string;
  clientName: string;
  company: string;
  phone: string;
  type: string;
  order: string;
  quantityKg: number;
  color: string;
  filmCategory: string;
  filmSubcategory: string;
  notes: string;
};

export const MATERIALS_STORAGE_KEY = 'clients-tolling-materials';
export const CLIENTS_STORAGE_KEY = 'clients-main';
export const MATERIAL_TYPES = [
  'ombor/plyonka',
  'ombor/kraska',
  'ombor/suyuq-kraska',
  'ombor/razvaritel',
] as const;
export const RAZVARITEL_TYPES = ['eaf', 'etilin', 'metoksil'] as const;

export type FilmCategoryOption = {
  value: string;
  label: string;
  subcategories: string[];
};

export const FILM_CATEGORIES: FilmCategoryOption[] = [
  { value: 'BOPP', label: 'BOPP', subcategories: ['prazrachni', 'metal', 'jemchuk', 'jemchuk metal'] },
  { value: 'CPP', label: 'CPP', subcategories: ['prazrachni', 'beliy', 'metal'] },
  { value: 'PE', label: 'PE', subcategories: ['prazrachniy', 'beliy'] },
  { value: 'PET', label: 'PET', subcategories: ['prazrachniyb', 'metal', 'beliy'] },
];

export const getRawPhone = (value: string | undefined | null) =>
  (typeof value === 'string' ? value : '').replace(/\D/g, '').slice(0, 9);

export const formatPhone = (raw: string) => {
  const digits = getRawPhone(raw);
  const part1 = digits.slice(0, 2);
  const part2 = digits.slice(2, 5);
  const part3 = digits.slice(5, 7);
  const part4 = digits.slice(7, 9);
  let formatted = '';
  if (part1) formatted = `${part1}`;
  if (part2) formatted += ` ${part2}`;
  if (part3) formatted += `-${part3}`;
  if (part4) formatted += `-${part4}`;
  return formatted.trim();
};

const buildNotes = (
  item: Partial<TollingRecord> & { provided?: string; received?: string; waste?: string }
) => {
  const rawNotes = typeof item.notes === 'string' ? item.notes.trim() : '';
  if (rawNotes) return rawNotes;
  const pieces: string[] = [];
  if (item.provided) pieces.push(`Provided: ${item.provided}`);
  if (item.received) pieces.push(`Received: ${item.received}`);
  if (item.waste) pieces.push(`Waste: ${item.waste}`);
  return pieces.join(' • ');
};

export const normalizeRecords = (
  items: (Partial<TollingRecord> & { client?: string; provided?: string; received?: string; waste?: string })[]
): TollingRecord[] =>
  items.map((item, index) => ({
    id: item.id || `toll-${index}`,
    clientId: item.clientId || '',
    clientName: item.clientName || (item as any).client || '',
    company: item.company || '',
    phone: formatPhone(item.phone || ''),
    type: item.type || MATERIAL_TYPES[0],
    order: item.order || '',
    quantityKg: Number(item.quantityKg) || 0,
    color: item.color || '',
    filmCategory:
      item.type === 'ombor/plyonka'
        ? item.filmCategory || FILM_CATEGORIES[0]?.value || ''
        : '',
    filmSubcategory:
      item.type === 'ombor/plyonka'
        ? item.filmSubcategory || FILM_CATEGORIES[0]?.subcategories?.[0] || ''
        : '',
    notes: buildNotes(item),
  }));

export const seedRecords: TollingRecord[] = normalizeRecords([
  {
    id: 'toll-1',
    clientName: 'Dilnoza Rahimova',
    company: 'GreenPack LLC',
    phone: '909876543',
    type: 'ombor/plyonka',
    order: 'Zakaz #D-102 / BOPP 20 mikron',
    quantityKg: 520,
    color: 'clear',
    filmCategory: 'BOPP',
    filmSubcategory: 'prazrachni',
    notes: "PET 12 mikron rulon 520 kg, lak 40 kg. Qayta qo'ng'iroq qilish kerak.",
    clientId: 'client-2',
  },
  {
    id: 'toll-2',
    clientName: 'Otabek Karimov',
    company: 'PoliTex Group',
    phone: '991234567',
    type: 'ombor/kraska',
    order: 'Zakaz #P-044 / CPP oziq-ovqat plyonka',
    quantityKg: 1200,
    color: 'red',
    filmCategory: '',
    filmSubcategory: '',
    notes: "CPP granulasi 1.2 tonna, pigment 8 kg. Qadoqlash va qoldiqni qaytarish haqida eslatma.",
    clientId: 'client-1',
  },
]);

export const readMaterialsRecords = (): TollingRecord[] => {
  if (typeof window === 'undefined') return seedRecords;
  const stored = localStorage.getItem(MATERIALS_STORAGE_KEY);
  if (!stored) return seedRecords;
  try {
    const parsed = JSON.parse(stored) as TollingRecord[];
    return normalizeRecords(parsed);
  } catch {
    return seedRecords;
  }
};

export const persistMaterialsRecords = (records: TollingRecord[]) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(MATERIALS_STORAGE_KEY, JSON.stringify(records));
};

const FALLBACK_CLIENTS: Client[] = [
  {
    id: 'client-1',
    fullName: 'Otabek Karimov',
    phone: formatPhone('991234567'),
    company: 'PoliTex Group',
    notes: 'Key contact for packaging films. Prefers USD quotes.',
    complaints: [],
    monthlyPlans: [],
  },
  {
    id: 'client-2',
    fullName: 'Dilnoza Rahimova',
    phone: formatPhone('909876543'),
    company: 'GreenPack LLC',
    notes: 'Handles tolling materials (davalilik).',
    complaints: [],
    monthlyPlans: [],
  },
];

export const readClientsFromStorage = (): Client[] => {
  if (typeof window === 'undefined') return FALLBACK_CLIENTS;
  const stored = localStorage.getItem(CLIENTS_STORAGE_KEY);
  if (!stored) return FALLBACK_CLIENTS;
  try {
    const parsed = JSON.parse(stored) as any[];
    return parsed.map((c, index) => ({
      id: c.id || `client-${index}`,
      fullName: c.fullName?.trim() || '',
      phone: formatPhone(c.phone),
      company: c.company?.trim() || '',
      notes: c.notes?.trim() || '',
      complaints: c.complaints ?? [],
      monthlyPlans: c.monthlyPlans ?? [],
    }));
  } catch {
    return FALLBACK_CLIENTS;
  }
};
