
import { createClient } from '@supabase/supabase-js';
import { INITIAL_LIBRARY_DATA, INITIAL_TEMPLATE_DATA } from '../data/bqPresets';
import { config } from 'dotenv';
import path from 'path';

// Load env vars
config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

enum Role {
  ADMIN = 'ADMIN',
  PJA = 'PJA',
  JURUTERA = 'JURUTERA',
}

const VOTES = [
    { code: '282090', name: 'LONGKANG', allocation: 2000000 },
    { code: '282130', name: 'INFRA & KEMUDAHAN AWAM', allocation: 1500000 },
    { code: '282050', name: 'PENYELENGGARAAN JALAN & LORONG', allocation: 3000000 },
    { code: '272040', name: 'PAPAN TANDA', allocation: 500000 },
    { code: '282180', name: 'PENYELENGGARAAN PERHENTIAN BAS', allocation: 600000 },
    { code: '331100', name: 'MEMBINA PONDOK BAS', allocation: 800000 }
];

const SYSTEM_USERS = [
  { id: 1, username: 'syafiq', fullName: 'Syafiq Daniel Bin Ahmad Firdaus', role: Role.ADMIN, password: 'password', email: 'syafiq@mps.gov.my', phone: '012-3456789', jawatan: 'Pembantu Tadbir N1', bahagian: 'Bahagian Infrastruktur', unit: 'Unit Selenggara Infrastruktur' },
  { id: 2, username: 'khairul', fullName: 'Mohamad Khairul Amirin Bin Zainal Abidin', role: Role.PJA, password: 'password', email: 'khairul@mps.gov.my', phone: '013-9876543', jawatan: 'Penolong Jurutera JA5', bahagian: 'Bahagian Infrastruktur', unit: 'Unit Selenggara Infrastruktur' },
  { id: 3, username: 'farhan', fullName: 'Muhammad Farhan', role: Role.PJA, password: 'password', email: 'farhan@mps.gov.my', phone: '014-1234567', jawatan: 'Penolong Jurutera JA5', bahagian: 'Bahagian Infrastruktur', unit: 'Unit Selenggara Infrastruktur' },
  { id: 4, username: 'nursilmi', fullName: 'Nursilmi Binti Ahmad', role: Role.PJA, password: 'password', email: 'nursilmi@mps.gov.my', phone: '015-9876543', jawatan: 'Penolong Jurutera JA5', bahagian: 'Bahagian Infrastruktur', unit: 'Unit Selenggara Infrastruktur' },
  { id: 5, username: 'salam', fullName: 'Muhammad Salam', role: Role.PJA, password: 'password', email: 'salam@mps.gov.my', phone: '016-1234567', jawatan: 'Penolong Jurutera JA5', bahagian: 'Bahagian Infrastruktur', unit: 'Unit Selenggara Infrastruktur' },
  { id: 6, username: 'ain', fullName: "A'IN SYAHIRA BINTI RATIMIN", role: Role.JURUTERA, password: 'password', email: 'ain@mps.gov.my', phone: '017-1122334', jawatan: 'Jurutera Awam', bahagian: 'Jabatan Kejuruteraan', unit: 'Majlis Perbandaran Selayang' }
];

async function seed() {
  console.log('Seeding data...');

  console.log('Seeding app_users...');
  const { error: usersError } = await supabase.from('app_users').upsert(
    SYSTEM_USERS.map(u => ({
      id: u.id,
      username: u.username,
      full_name: u.fullName,
      role: u.role,
      password: u.password,
      email: u.email,
      phone: u.phone,
      jawatan: u.jawatan,
      bahagian: u.bahagian,
      unit: u.unit
    }))
  );
  if (usersError) console.error('Error seeding users:', usersError);
  else console.log('Users seeded.');

  console.log('Seeding library_groups...');
  const { error: libError } = await supabase.from('library_groups').upsert(
    INITIAL_LIBRARY_DATA.map(g => ({
        id: g.id,
        title: g.title,
        category: g.category,
        items: g.items
    }))
  );
  if (libError) console.error('Error seeding library:', libError);
  else console.log('Library seeded.');

  console.log('Seeding templates...');
  const { error: tempError } = await supabase.from('templates').upsert(
    INITIAL_TEMPLATE_DATA.map(t => ({
        id: t.id,
        key: t.key,
        title: t.title,
        subtitle: t.subtitle,
        icon: t.icon,
        color: t.color,
        bills: t.bills,
        group_refs: t.groupRefs
    }))
  );
  if (tempError) console.error('Error seeding templates:', tempError);
  else console.log('Templates seeded.');

  console.log('Seeding system_settings...');
  const settingsData = ['2024', '2025'].map(year => ({
      year: parseInt(year),
      companies: [],
      company_details: {},
      company_order: [],
      vote_numbers: VOTES,
      sebutharga_numbers: [],
      manual_financials: { outsource: 0, ydp: 0 },
      meeting_date: ''
  }));

  const { error: settingsError } = await supabase.from('system_settings').upsert(settingsData);
  if (settingsError) console.error('Error seeding settings:', settingsError);
  else console.log('Settings seeded.');
  
  console.log('Seeding complete.');
}

seed().catch(e => console.error(e));
