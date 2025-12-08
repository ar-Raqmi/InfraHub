

import { BQGroup, BQItem, GlobalDimensions, CalculationPart } from "../types";

export type PresetVariant = {
    id: string;
    label: string; // e.g. "Dengan tangan"
    rate: number;
    unit: string;
};

export type PresetItem = {
    id: string;
    description: string;
    rate?: number; // Optional: If the item itself has a rate (no variants)
    unit?: string;
    variants?: PresetVariant[];
};

export type PresetGroup = {
    id: string;
    title: string; // Header Title (e.g. KERJA PENGOREKAN)
    category: string; // Main Group Category
    items: PresetItem[];
};

export const BQ_LIBRARY: PresetGroup[] = [
    // --- CATEGORY: PERMULAAN ---
    {
        id: 'G1-1',
        title: 'INSURANS',
        category: 'Permulaan',
        items: [
            {
                id: '1-01',
                description: `Menyediakan polisi insuran berikut bagi merangkumi tempoh pekerjaan yang perlu seperti insuran tanggungan awam (Public Liability), insuran pampasan pekerja (Workmen's Compensation) dan SOCSO\nNota: Liputan (coverage) minima insuran bagi pampasan adalah 30% daripada nilai kerja jika sekiranya pemborong tidak dapat mengadakan Nombor Pendaftaran PERKESO. Liputan bagi Insurans Tanggungan Umum adalah seperti berikut :-`,
                rate: 0, 
                unit: '',
                variants: [
                   { id: '1-01-v1', label: "Bagi nilai kerja yang kurang RM 25,000.00. Liputan minima adalah RM 10,000.00", rate: 340.00, unit: "L/S" },
                   { id: '1-01-v2', label: "Bagi nilai kerja diantara RM25,000.00 hingga RM 50,000.00. Liputan minima adalah RM 25,000.00", rate: 510.00, unit: "L/S" },
                   { id: '1-01-v3', label: "Bagi nilai kerja diantara RM50,000.00 hingga RM 100,000.00. Liputan minima adalah RM 50,000.00", rate: 680.00, unit: "L/S" }
                ]
            }
        ]
    },
    {
        id: 'G1-2',
        title: 'PELAN PENGURUSAN LALULINTAS (TRAFFIC MANAGEMENT)',
        category: 'Permulaan',
        items: [
            {
                id: '2-01',
                description: `Membekal dan menyediakan jentera alat pengangkutan pekerja, papan tanda isyarat lalu lintas sementara, papan tanda 'Awas kerja-kerja sedang dilaksanakan di hadapan, segala kesulitan amat dikesali', papan tanda projek mudah alih yang merangkumi maklumat nama kontraktor, no untuk dihubungi, tarikh mula, tarikh siap serta lampu waktu malam dan kawalan lalu lintas yang mencukupi pada setiap masa mengikut arahan Pegawai Penguatkuasa termasuk pengurusan lalulintas (Traffic Management).`,
                rate: 1275.00,
                unit: 'L/S'
            },
            {
                id: '2-02-i',
                description: 'Membekal dan menyediakan alat, jentera serta papan tanda berkaitan lalulintas berdasarkan Arahan Teknik Jalan 2C/85 (Pindaan 2017) serta arahan Pegawai Penguasa.\nADVANCE WARNING SIGN (T.1)',
                rate: 255.00,
                unit: 'Nos'
            },
            {
                id: '2-02-ii',
                description: 'ROAD WORKS (T.2)',
                rate: 233.75,
                unit: 'Nos'
            },
            {
                id: '2-02-iii',
                description: 'KEEP LEFT/RIGHT (T.7a)/(T.7b)',
                rate: 233.75,
                unit: 'Nos'
            },
            {
                id: '2-02-iv',
                description: 'AWAS (T.15)',
                rate: 191.25,
                unit: 'Nos'
            },
            {
                id: '2-02-v',
                description: 'PLASTICS BARRIERS',
                rate: 153.00,
                unit: 'Nos'
            },
            {
                id: '2-02-vi',
                description: 'CONES',
                rate: 68.00,
                unit: 'Nos'
            },
            {
                id: '2-02-vii',
                description: 'DELINEATOR STRINGS',
                rate: 2.55,
                unit: 'm'
            }
        ]
    },
    {
        id: 'G1-3',
        title: 'LAPORAN BERGAMBAR',
        category: 'Permulaan',
        items: [
            {
                id: '3-01',
                description: 'Membekalkan laporan bergambar mengikut proses pembinaan pada waktu sebelum mula kerja, semasa kerja dan selepas siap kerja serta soft copy dalam bentuk thumb drive.',
                rate: 255.00,
                unit: 'L/S'
            }
        ]
    },
    {
        id: 'G1-4',
        title: 'KERJA-KERJA PENGUKURAN',
        category: 'Permulaan',
        items: [
            {
                id: '4-01',
                description: `KERJA-KERJA PENGUKURAN AWAL\n\nKerja-kerja pengukuran dan pemantauan tapak di sepanjang jajaran longkang/jalan melibatkan pengukuran struktur sedia ada, Sump Invert Level, Drain Invert Level, persempadanan, saiz longkang sedia ada, tiang-tiang sedia ada melibatkan Telekom, TNB serta Syarikat Telekomunikasi, bahu jalan, perabot jalan seperti kerb, papan tanda dan lebar jalan serta lain-lain struktur berkaitan yang boleh dilihat oleh mata kasar serta menyediakan dokumen ukur melalui pelan ukur sebanyak 2 hardcopy, 2 salinan (linen) dan salinan softcopy (CD/Thumb drive) serta disahkan oleh juruukur bertauliah dan berlesen.\n\nDengan purata keluasan :\n.....m² - .....m²`,
                rate: 0.85,
                unit: 'm²'
            },
            {
                id: '4-02',
                description: `KERJA-KERJA PENGUKURAN AKHIR\n\nKerja-kerja pengukuran dan pemantauan tapak di sepanjang jajaran longkang/jalan melibatkan pengukuran struktur sedia ada, Sump Invert Level, Drain Invert Level, persempadanan, saiz longkang sedia ada, tiang-tiang sedia ada melibatkan Telekom, TNB serta Syarikat Telekomunikasi, bahu jalan, perabot jalan seperti kerb, papan tanda dan lebar jalan serta lain-lain struktur berkaitan yang boleh dilihat oleh mata kasar serta menyediakan dokumen As-Built melalui pelan ukur sebanyak 2 hardcopy, 2 salinan (linen) dan salinan softcopy (CD/Thumb drive) serta disahkan oleh juruukur bertauliah dan berlesen.\n\nDengan purata keluasan :\n.....m² - .....m²`,
                rate: 0.85,
                unit: 'm²'
            },
            {
                id: '4-03',
                description: `KERJA-KERJA PENGUKURAN UNDERGROUND MAPPING\n\nKerja-kerja pengukuran dan pemantauan tapak di sepanjang jajaran longkang/jalan melibatkan pengukuran struktur sedia ada, Sump Invert Level, Manhole, sedia ada melibatkan syarikat utiliti seperti TNB, SYABAS dan Syarikat Telekomunikasi, persempadanan, dengan purata kelebaran sebanyak 3m hingga 5m serta menyediakan dokumen ukur melalui pelan ukur sebanyak 2 hardcopy dan salinan softcopy (CD/Thumb drive) serta disahkan oleh juruukur bertauliah dan berlesen.\n\n...m`,
                rate: 8.50,
                unit: 'm'
            }
        ]
    },

    // --- CATEGORY: LONGKANG (UPDATED TO MATCH IMAGE) ---
    {
        id: 'G2',
        title: 'KERJA PENGOREKAN',
        category: 'Longkang',
        items: [
            {
                id: '2-01',
                description: 'Kerja-kerja menggali dan membuang tembok longkang sedia ada tidak melebihi 1500mm ukuran termasuk membuang sisa di tempat yang dibenarkan oleh pegawai penguasa.',
                variants: [
                    { id: '2-01-v1', label: "Dengan jentera", rate: 18.70, unit: "m³" },
                    { id: '2-01-v2', label: "Dengan tangan", rate: 53.40, unit: "m³" }
                ]
            },
            {
                id: '2-02',
                description: 'Kerja-kerja menggali dan membuang tembok longkang sedia ada melebihi 1500mm tetapi tidak melebihi 3000mm ukuran (dengan jentera/tangan) termasuk membuang sisa di tempat yang dibenarkan oleh penguasa.',
                variants: [
                    { id: '2-02-v1', label: "Dengan jentera", rate: 19.30, unit: "m³" },
                    { id: '2-02-v2', label: "Dengan tangan", rate: 88.30, unit: "m³" }
                ]
            }
        ]
    },
    {
        id: 'G3',
        title: 'LEAN CONCRETE',
        category: 'Longkang',
        items: [
            {
                id: '3-01',
                description: 'Kerja-kerja membekal dan memadat konkrit tidak bertetulang (Site Mixed) gred 15 (1:2:4-9mm) 75mm purata tebal lantai atau batu baur (ikut kesesuaian tanah) untuk tapak asas longkang. (Lean Concrete)',
                rate: 27.35,
                unit: 'm²'
            }
        ]
    },
    {
        id: 'G4',
        title: 'REINFORCEMENT',
        category: 'Longkang',
        items: [
            {
                id: '4-01',
                description: 'Kerja-kerja membekal, memasang, membengkok dan memotong kepingan jejaring (BRC) No. B7 atau tetulang keluli dikimpal berbentuk jejaring 100mm x 200mm, beratnya 4.53kg setiap meter persegi. (BRC B7)',
                rate: 30.30,
                unit: 'm²'
            },
            {
                id: '4-02',
                description: 'Kerja-kerja membekal, memasang, membengkok dan memotong kepingan jejaring (BRC) No. A10 atau tetulang keluli dikimpal berbentuk jejaring 200mm x 200mm, beratnya 6.16kg setiap meter persegi. (BRC A10)',
                rate: 50.90,
                unit: 'm²'
            }
        ]
    },
    {
        id: 'G5',
        title: 'FORMWORK',
        category: 'Longkang',
        items: [
            {
                id: '5-01',
                description: 'Kerja-kerja membekal, memotong dan memasang acuan konkrit daripada papan tidak berketam pada muka-muka yang pugak (Vertical) termasuk kerja-kerja menanggal dan membuang.',
                variants: [
                    { id: '5-01-v1', label: "1 kali penggunaan - (20m ke bawah)", rate: 56.10, unit: "m²" },
                    { id: '5-01-v2', label: "2 kali penggunaan - (21m ke atas)", rate: 28.05, unit: "m²" }
                ]
            }
        ]
    },
    {
        id: 'G6',
        title: 'KONKRIT',
        category: 'Longkang',
        items: [
            {
                id: '6-01',
                description: 'Kerja-kerja membekal, menuang dan memadat konkrit Ready Mixed/tuang disitu gred 20 bertetulang tuang disitu untuk lantai dan tembok longkang tebal 100mm/150mm/Ready Mixed/tuang disitu.',
                variants: [
                    { id: '6-01-v1', label: "50mm tebal (Ready Mix)", rate: 15.80, unit: "m²" },
                    { id: '6-01-v2', label: "50mm tebal (Tuang Disitu)", rate: 22.95, unit: "m²" },
                    { id: '6-01-v3', label: "75mm tebal (Ready Mix)", rate: 23.70, unit: "m²" },
                    { id: '6-01-v4', label: "75mm tebal (Tuang Disitu)", rate: 34.54, unit: "m²" },
                    { id: '6-01-v5', label: "100mm tebal (Ready Mix)", rate: 31.60, unit: "m²" },
                    { id: '6-01-v6', label: "100mm tebal (Tuang Disitu)", rate: 46.01, unit: "m²" },
                    { id: '6-01-v7', label: "150mm tebal (Ready Mix)", rate: 47.40, unit: "m²" },
                    { id: '6-01-v8', label: "150mm tebal (Tuang Disitu)", rate: 68.96, unit: "m²" },
                    { id: '6-01-v9', label: "200mm tebal (Ready Mix)", rate: 63.20, unit: "m²" },
                    { id: '6-01-v10', label: "200mm tebal (Tuang Disitu)", rate: 91.91, unit: "m²" }
                ]
            }
        ]
    },
    {
        id: 'G7',
        title: 'LONGKANG JENIS TEMBIKAR (CLAY)',
        category: 'Longkang',
        items: [
            {
                id: '7-01',
                description: 'Kerja-kerja membekal dan memasang longkang jenis separuh bulatan jenis tembikar bergilap (HRGW) dan di sambung dengan simen motar 1:3 saiz :-',
                variants: [
                    { id: '7-01-v1', label: "225mm", rate: 17.70, unit: "m" },
                    { id: '7-01-v2', label: "300mm", rate: 23.60, unit: "m" },
                    { id: '7-01-v3', label: "450mm", rate: 37.17, unit: "m" }
                ]
            }
        ]
    },
    {
        id: 'G-L-7',
        title: 'LONGKANG PUDU CUT',
        category: 'Longkang',
        items: [
            {
                id: '7-02',
                description: 'Kerja-kerja membekal dan memasang longkang jenis Pudu Cut dan disambung dengan simen motar 1:3 saiz :-',
                variants: [
                    { id: '7-02-v1', label: "1050mm x 760mm", rate: 128.56, unit: "m" }
                ]
            }
        ]
    },
    {
        id: 'G-L-8',
        title: 'LONGKANG JENIS U-SHAPE',
        category: 'Longkang',
        items: [
            {
                id: '8-01-L',
                description: 'Kerja-kerja membekal dan memasang longkang jenis U-Shape with Dry weather flow serta mempunyai starter bar termasuk kerja-kerja konkrit 1:2:4 - 19mm agg sebagai asas.',
                variants: [
                    { id: '8-01-L-v1', label: "300mm x 300mm", rate: 169.33, unit: "m" },
                    { id: '8-01-L-v2', label: "450mm x 450mm", rate: 254.00, unit: "m" },
                    { id: '8-01-L-v3', label: "600mm x 600mm", rate: 314.60, unit: "m" },
                    { id: '8-01-L-v4', label: "900mm x 900mm", rate: 505.80, unit: "m" },
                    { id: '8-01-L-v5', label: "1200mm x 1200mm", rate: 677.94, unit: "m" },
                    { id: '8-01-L-v6', label: "1500mm x 1500mm", rate: 846.67, unit: "m" },
                    { id: '8-01-L-v7', label: "2100mm x 2100mm", rate: 1108.90, unit: "m" }
                ]
            }
        ]
    },
    {
        id: 'G-L-9',
        title: 'LONGKANG JENIS L-SHAPE',
        category: 'Longkang',
        items: [
            {
                id: '9-01-L',
                description: 'Kerja-kerja membekal dan memasang longkang jenis L-Shape termasuk kerja-kerja konkrit 1:2:4 - 19mm agg sebagai asas.',
                variants: [
                    { id: '9-01-L-v1', label: "900mm x 450mm", rate: 1262.25, unit: "Nos" },
                    { id: '9-01-L-v2', label: "1200mm x 750mm", rate: 1683.00, unit: "Nos" },
                    { id: '9-01-L-v3', label: "1500mm x 1050mm", rate: 2103.75, unit: "Nos" },
                    { id: '9-01-L-v4', label: "1800mm x 1350mm", rate: 2524.50, unit: "Nos" },
                    { id: '9-01-L-v5', label: "2100mm x 1650mm", rate: 2945.25, unit: "Nos" },
                    { id: '9-01-L-v6', label: "2400mm x 1950mm", rate: 3366.00, unit: "Nos" },
                    { id: '9-01-L-v7', label: "2700mm x 2100mm", rate: 3786.75, unit: "Nos" },
                    { id: '9-01-L-v8', label: "3000mm x 2400mm", rate: 4207.50, unit: "Nos" }
                ]
            }
        ]
    },
    {
        id: 'G-L-10',
        title: 'PEMBENTUNG/BOX CULVERT',
        category: 'Longkang',
        items: [
            {
                id: '10-01-L',
                description: 'Kerja-kerja membekal dan memasang pembentung kekotak (Box Culvert) with Dry weather flow termasuk penutup dan kerja-kerja konkrit 1:2:4 - 19mm agg sebagai asas.',
                variants: [
                    { id: '10-01-L-v1', label: "300mm x 300mm", rate: 395.95, unit: "m" },
                    { id: '10-01-L-v2', label: "450mm x 450mm", rate: 593.93, unit: "m" },
                    { id: '10-01-L-v3', label: "600mm x 600mm", rate: 791.90, unit: "m" },
                    { id: '10-01-L-v4', label: "900mm x 900mm", rate: 1187.85, unit: "m" },
                    { id: '10-01-L-v5', label: "1200mm x 1200mm", rate: 1583.80, unit: "m" },
                    { id: '10-01-L-v6', label: "1500mm x 1500mm", rate: 1979.75, unit: "m" },
                    { id: '10-01-L-v7', label: "2100mm x 2100mm", rate: 2771.65, unit: "m" }
                ]
            }
        ]
    },
    {
        id: 'G-L-11',
        title: 'PEMBENTUNG JENIS PAIP',
        category: 'Longkang',
        items: [
            {
                id: '11-01-L',
                description: 'Kerja-kerja membekal dan memasang pembentung konkrit bertetulang kitar termasuk 150mm tebal penggalas konkrit (1:3:6-38mm) dan dipasang dengan simpai (collar) dan ruang di sekeliling paip ditutup dengan lepa simen serta pasir (1:3) dengan bersaiz :-',
                variants: [
                    { id: '11-01-L-v1', label: "600mm", rate: 375.20, unit: "m" },
                    { id: '11-01-L-v2', label: "900mm", rate: 636.40, unit: "m" },
                    { id: '11-01-L-v3', label: "1200mm", rate: 995.90, unit: "m" }
                ]
            }
        ]
    },
    {
        id: 'G-L-12',
        title: 'CAPPING BEAM',
        category: 'Longkang',
        items: [
            {
                id: '12-01-L',
                description: 'Kerja-kerja membekal dan membina Capping Beam pada kedua belah bibir dan diikat pada Starter Bar dengan ketebalan 150mm, 200mm, 300mm termasuk kerja-kerja memasang tetulang 4Y12, R6 150mm c/c, menuang konkrit gred 20 dan memasang papan acuan termasuk menanggal dan membuang.',
                variants: [
                    { id: '12-01-L-v1', label: "150mm", rate: 74.05, unit: "m" },
                    { id: '12-01-L-v2', label: "200mm", rate: 90.51, unit: "m" },
                    { id: '12-01-L-v3', label: "300mm", rate: 121.36, unit: "m" }
                ]
            }
        ]
    },
    {
        id: 'G-L-13',
        title: 'STRUCT',
        category: 'Longkang',
        items: [
            {
                id: '13-01-L',
                description: 'Kerja-kerja membekal dan membina Struct konkrit bertetulang 4Y12, R6 150mm c/c termasuk menuang konkrit Gred 20 dan memasang papan acuan termasuk menanggal dan membuang serta dibina setiap 3m c/c panjang dengan kelebaran bersaiz :-',
                variants: [
                    { id: '13-01-L-v1', label: "300mm", rate: 28.29, unit: "Nos" },
                    { id: '13-01-L-v2', label: "400mm", rate: 37.71, unit: "Nos" },
                    { id: '13-01-L-v3', label: "500mm", rate: 47.13, unit: "Nos" },
                    { id: '13-01-L-v4', label: "600mm", rate: 56.57, unit: "Nos" },
                    { id: '13-01-L-v5', label: "900mm", rate: 87.42, unit: "Nos" },
                    { id: '13-01-L-v6', label: "1200mm", rate: 113.14, unit: "Nos" },
                    { id: '13-01-L-v7', label: "1500mm", rate: 133.71, unit: "Nos" }
                ]
            }
        ]
    },
    {
        id: 'G-L-14',
        title: 'WEEPHOLES',
        category: 'Longkang',
        items: [
            {
                id: '14-01-L',
                description: 'Kerja-kerja membekal dan memasang paip UPVC sebagai lubang titisan (Weepholes) 305mm panjang termasuk litupan batu dan pasir bersih di satu hujung.',
                variants: [
                    { id: '14-01-L-v1', label: "50mm", rate: 3.72, unit: "Nos" },
                    { id: '14-01-L-v2', label: "100mm", rate: 5.42, unit: "Nos" },
                    { id: '14-01-L-v3', label: "150mm", rate: 8.40, unit: "Nos" }
                ]
            }
        ]
    },
    {
        id: 'G-L-15',
        title: 'TEMBOK BATA',
        category: 'Longkang',
        items: [
            {
                id: '15-01-L',
                description: 'Kerja-kerja membekal dan mengikat tembok bata campuran pasir dan simen diperkuat menggunakan motar simen dan pasir 1:3.',
                variants: [
                    { id: '15-01-L-v1', label: "225mm tebal", rate: 110.00, unit: "m²" },
                    { id: '15-01-L-v2', label: "113mm tebal", rate: 55.70, unit: "m²" }
                ]
            },
            {
                id: '15-02-L',
                description: 'Kerja-kerja melepa menggunakan simen dan pasir (1:3) atau skrid dilepa licin berketebalan 25mm.',
                rate: 28.54,
                unit: 'm²'
            }
        ]
    },
    {
        id: 'G-L-16',
        title: 'SUMP',
        category: 'Longkang',
        items: [
            {
                id: '16-01-L',
                description: 'Kerja-kerja membina lurang tidak lebih 1200mm dalam termasuk penggalian membentuk 100mm asas konkrit (1:3:6-38mm) membuat rusuk (Benching) dan saluran-saluran membina 115mm dinding bata berlepa simen motar (1:3) dinding bahagian dalam dialas dengan 12mm tebal lepa simen dan pasir.',
                variants: [
                    { id: '16-01-L-v1', label: "450mm x 450mm", rate: 462.83, unit: "Nos" },
                    { id: '16-01-L-v2', label: "600mm x 600mm", rate: 617.10, unit: "Nos" },
                    { id: '16-01-L-v3', label: "900mm x 900mm", rate: 822.80, unit: "Nos" },
                    { id: '16-01-L-v4', label: "1200mm x 1200mm", rate: 1028.50, unit: "Nos" },
                    { id: '16-01-L-v5', label: "1500mm x 1500mm", rate: 1234.20, unit: "Nos" },
                    { id: '16-01-L-v6', label: "1800mm x 1800mm", rate: 1542.75, unit: "Nos" },
                    { id: '16-01-L-v7', label: "2000mm x 2000mm", rate: 1748.45, unit: "Nos" }
                ]
            },
            {
                id: '16-02-L',
                description: 'Kerja-kerja membekal dan menimbus tanah di kedua-dua belah tembok longkang serta kerja memadat termasuk kerja-kerja merapi tenaga dengan buruh.',
                rate: 26.30,
                unit: 'm³'
            }
        ]
    },
    {
        id: 'G10',
        title: 'KERJA-KERJA AKHIR',
        category: 'Longkang',
        items: [
            {
                id: '10-01',
                description: 'Kerja-kerja akhir pembersihan sisa bahan binaan dan dibuang ke tempat yang dibenarkan.',
                variants: [
                     { id: '10-01-v1', label: "Nilai Kerja RM20,000.00 dan ke bawah", rate: 340.00, unit: "L/S" },
                     { id: '10-01-v2', label: "Nilai Kerja RM20,000.01 sehingga RM50,000.00", rate: 425.00, unit: "L/S" },
                     { id: '10-01-v3', label: "Nilai Kerja RM50,000.01 sehingga RM100,000.00", rate: 510.00, unit: "L/S" }
                ]
            }
        ]
    },

    // --- CATEGORY: PENUTUP LONGKANG ---
    {
        id: 'G-PL-1',
        title: 'GRATING',
        category: 'Penutup Longkang',
        items: [
            {
                id: 'PL-1-01',
                description: 'Kerja-kerja membekal dan memasang baru besi penutup longkang (M.S. Cover) dari M.S. Plate 75mm x 50mm x 10 mm M.S. Angle Iron untuk slab termasuk kerja-kerja mengecat dan 2 bil engsel ditanam (Bolt) ke lantai hendaklah di sadur dengan Hot Dipped Galvanised M.S.',
                variants: [
                    { id: 'PL-1-01-v1', label: "300mm x 300mm", rate: 806.44, unit: "Nos" },
                    { id: 'PL-1-01-v2', label: "450mm x 450mm", rate: 1129.01, unit: "Nos" },
                    { id: 'PL-1-01-v3', label: "600mm x 600mm", rate: 1612.88, unit: "Nos" },
                    { id: 'PL-1-01-v4', label: "900mm x 750mm", rate: 1881.69, unit: "Nos" },
                    { id: 'PL-1-01-v5', label: "900mm x 900mm", rate: 2258.03, unit: "Nos" },
                    { id: 'PL-1-01-v6', label: "1200mm x 1200mm", rate: 2795.65, unit: "Nos" },
                    { id: 'PL-1-01-v7', label: "1400mm x 1000mm", rate: 2688.13, unit: "Nos" },
                    { id: 'PL-1-01-v8', label: "1500mm x 1500mm", rate: 3440.80, unit: "Nos" },
                    { id: 'PL-1-01-v9', label: "1800mm x 1800mm", rate: 4516.05, unit: "Nos" },
                    { id: 'PL-1-01-v10', label: "1.0m x 1.0m", rate: 2419.31, unit: "m²" }
                ]
            },
            {
                id: 'PL-1-02',
                description: 'Kerja-kerja membekal dan memasang baru besi penutup longkang (M.S. Cover) dari M.S. Plate 75mm x 50mm x 10 mm M.S. Angle Iron untuk slab termasuk kerja-kerja mengecat dan 2 bil engsel ditanam (Bolt) ke lantai.',
                variants: [
                    { id: 'PL-1-02-v1', label: "300mm x 300mm", rate: 376.34, unit: "Nos" },
                    { id: 'PL-1-02-v2', label: "450mm x 450mm", rate: 537.63, unit: "Nos" },
                    { id: 'PL-1-02-v3', label: "600mm x 600mm", rate: 698.91, unit: "Nos" },
                    { id: 'PL-1-02-v4', label: "900mm x 750mm", rate: 860.20, unit: "Nos" },
                    { id: 'PL-1-02-v5', label: "900mm x 900mm", rate: 1021.49, unit: "Nos" },
                    { id: 'PL-1-02-v6', label: "1200mm x 1200mm", rate: 1397.83, unit: "Nos" },
                    { id: 'PL-1-02-v7', label: "1400mm x 1000mm", rate: 1344.06, unit: "Nos" },
                    { id: 'PL-1-02-v8', label: "1500mm x 1500mm", rate: 1612.88, unit: "Nos" },
                    { id: 'PL-1-02-v9', label: "1800mm x 1800mm", rate: 1935.45, unit: "Nos" },
                    { id: 'PL-1-02-v10', label: "1.0m x 1.0m", rate: 1129.01, unit: "m²" }
                ]
            },
            {
                id: 'PL-1-03',
                description: 'Kerja-kerja membekal dan memasang baru besi penutup longkang (M.S. Cover) dari M.S. Plate 50mm x 50mm x 5 mm M.S. Angle Iron untuk slab termasuk kerja-kerja mengecat dan 2 bil. engsel ditanam (Bolt) ke lantai hendaklah disadur dengan Hot Dipped Galvanised.',
                variants: [
                    { id: 'PL-1-03-v1', label: "300mm x 300mm", rate: 564.51, unit: "Nos" },
                    { id: 'PL-1-03-v2', label: "450mm x 450mm", rate: 790.31, unit: "Nos" },
                    { id: 'PL-1-03-v3', label: "600mm x 600mm", rate: 1129.01, unit: "Nos" },
                    { id: 'PL-1-03-v4', label: "900mm x 750mm", rate: 1317.19, unit: "Nos" },
                    { id: 'PL-1-03-v5', label: "900mm x 900mm", rate: 1580.62, unit: "Nos" },
                    { id: 'PL-1-03-v6', label: "1200mm x 1200mm", rate: 1956.96, unit: "Nos" },
                    { id: 'PL-1-03-v7', label: "1400mm x 1000mm", rate: 1881.69, unit: "Nos" },
                    { id: 'PL-1-03-v8', label: "1500mm x 1500mm", rate: 2408.56, unit: "Nos" },
                    { id: 'PL-1-03-v9', label: "1800mm x 1800mm", rate: 3161.24, unit: "Nos" },
                    { id: 'PL-1-03-v10', label: "1.0m x 1.0m", rate: 1693.52, unit: "m²" }
                ]
            },
            {
                id: 'PL-1-04',
                description: 'Kerja-kerja membekal dan memasang baru besi penutup longkang (M.S. Cover) dari M.S. Plate 50mm x 50mm x 10 mm M.S. Angle Iron untuk slab termasuk kerja-kerja mengecat dan 2 bil. engsel ditanam (Bolt) ke lantai hendaklah disadur dengan Hot Dipped Galvanised.',
                variants: [
                    { id: 'PL-1-04-v1', label: "300mm x 300mm", rate: 806.44, unit: "Nos" },
                    { id: 'PL-1-04-v2', label: "450mm x 450mm", rate: 1129.01, unit: "Nos" },
                    { id: 'PL-1-04-v3', label: "600mm x 600mm", rate: 1612.88, unit: "Nos" },
                    { id: 'PL-1-04-v4', label: "900mm x 750mm", rate: 1881.69, unit: "Nos" },
                    { id: 'PL-1-04-v5', label: "900mm x 900mm", rate: 2258.03, unit: "Nos" },
                    { id: 'PL-1-04-v6', label: "1200mm x 1200mm", rate: 2795.65, unit: "Nos" },
                    { id: 'PL-1-04-v7', label: "1400mm x 1000mm", rate: 2688.13, unit: "Nos" },
                    { id: 'PL-1-04-v8', label: "1500mm x 1500mm", rate: 3440.80, unit: "Nos" },
                    { id: 'PL-1-04-v9', label: "1800mm x 1800mm", rate: 4516.05, unit: "Nos" },
                    { id: 'PL-1-04-v10', label: "1.0m x 1.0m", rate: 2419.31, unit: "m²" }
                ]
            }
        ]
    },
    {
        id: 'G-PL-2',
        title: 'PENUTUP LONGKANG JENIS PRECAST CONCRETE',
        category: 'Penutup Longkang',
        items: [
            {
                id: 'PL-2-01',
                description: 'Kerja-kerja membekal dan memasang Pre Cast Concrete Heavy Duty with Lifting Hole bersaiz :-',
                variants: [
                    { id: 'PL-2-01-v1', label: "300mm x 450mm x 50mm", rate: 56.10, unit: "Nos" },
                    { id: 'PL-2-01-v2', label: "300mm x 450mm x 75mm", rate: 65.45, unit: "Nos" },
                    { id: 'PL-2-01-v3', label: "300mm x 450mm x 125mm", rate: 74.80, unit: "Nos" },
                    { id: 'PL-2-01-v4', label: "300mm x 600mm x 50mm", rate: 84.15, unit: "Nos" },
                    { id: 'PL-2-01-v5', label: "300mm x 600mm x 75mm", rate: 93.50, unit: "Nos" },
                    { id: 'PL-2-01-v6', label: "300mm x 600mm x 125mm", rate: 102.85, unit: "Nos" },
                    { id: 'PL-2-01-v7', label: "300mm x 900mm x 50mm", rate: 112.20, unit: "Nos" },
                    { id: 'PL-2-01-v8', label: "300mm x 900mm x 75mm", rate: 121.55, unit: "Nos" },
                    { id: 'PL-2-01-v9', label: "300mm x 900mm x 125mm", rate: 130.90, unit: "Nos" },
                    { id: 'PL-2-01-v10', label: "450mm x 450mm x 50mm", rate: 140.25, unit: "Nos" },
                    { id: 'PL-2-01-v11', label: "450mm x 450mm x 75mm", rate: 149.60, unit: "Nos" },
                    { id: 'PL-2-01-v12', label: "450mm x 450mm x 125mm", rate: 158.95, unit: "Nos" },
                    { id: 'PL-2-01-v13', label: "450mm x 600mm x 50mm", rate: 168.30, unit: "Nos" },
                    { id: 'PL-2-01-v14', label: "450mm x 600mm x 75mm", rate: 177.65, unit: "Nos" },
                    { id: 'PL-2-01-v15', label: "450mm x 600mm x 125mm", rate: 187.00, unit: "Nos" },
                    { id: 'PL-2-01-v16', label: "600mm x 600mm x 50mm", rate: 196.35, unit: "Nos" },
                    { id: 'PL-2-01-v17', label: "600mm x 600mm x 100mm", rate: 205.70, unit: "Nos" },
                    { id: 'PL-2-01-v18', label: "600mm x 600mm x 125mm", rate: 215.05, unit: "Nos" },
                    { id: 'PL-2-01-v19', label: "600mm x 900mm x 50mm", rate: 233.75, unit: "Nos" },
                    { id: 'PL-2-01-v20', label: "600mm x 900mm x 75mm", rate: 243.10, unit: "Nos" },
                    { id: 'PL-2-01-v21', label: "600mm x 900mm x 100mm", rate: 252.45, unit: "Nos" },
                    { id: 'PL-2-01-v22', label: "600mm x 900mm x 125mm", rate: 261.80, unit: "Nos" },
                    { id: 'PL-2-01-v23', label: "750mm x 600mm x 75mm", rate: 289.85, unit: "Nos" }
                ]
            }
        ]
    },
    {
        id: 'G-PL-3',
        title: 'PENUTUP LONGKANG JENIS COMPRESSED CONCRETE',
        category: 'Penutup Longkang',
        items: [
            {
                id: 'PL-3-01',
                description: 'Kerja-kerja membekal dan memasang Compressed Concrete Heavy Duty with Drain Hole bersaiz :-',
                variants: [
                    { id: 'PL-3-01-v1', label: "300mm x 450mm x 50mm", rate: 165.96, unit: "Nos" },
                    { id: 'PL-3-01-v2', label: "300mm x 450mm x 75mm", rate: 170.64, unit: "Nos" },
                    { id: 'PL-3-01-v3', label: "300mm x 450mm x 125mm", rate: 175.31, unit: "Nos" },
                    { id: 'PL-3-01-v4', label: "300mm x 600mm x 50mm", rate: 177.65, unit: "Nos" },
                    { id: 'PL-3-01-v5', label: "300mm x 600mm x 75mm", rate: 182.33, unit: "Nos" },
                    { id: 'PL-3-01-v6', label: "300mm x 600mm x 125mm", rate: 187.00, unit: "Nos" },
                    { id: 'PL-3-01-v7', label: "300mm x 900mm x 50mm", rate: 201.03, unit: "Nos" },
                    { id: 'PL-3-01-v8', label: "300mm x 900mm x 75mm", rate: 205.70, unit: "Nos" },
                    { id: 'PL-3-01-v9', label: "300mm x 900mm x 125mm", rate: 210.38, unit: "Nos" },
                    { id: 'PL-3-01-v10', label: "400mm x 600mm x 50mm", rate: 168.30, unit: "Nos" },
                    { id: 'PL-3-01-v11', label: "400mm x 600mm x 75mm", rate: 177.65, unit: "Nos" },
                    { id: 'PL-3-01-v12', label: "400mm x 600mm x 100mm", rate: 187.00, unit: "Nos" },
                    { id: 'PL-3-01-v13', label: "400mm x 600mm x 125mm", rate: 196.35, unit: "Nos" },
                    { id: 'PL-3-01-v14', label: "450mm x 450mm x 50mm", rate: 189.34, unit: "Nos" },
                    { id: 'PL-3-01-v15', label: "450mm x 450mm x 75mm", rate: 194.01, unit: "Nos" },
                    { id: 'PL-3-01-v16', label: "450mm x 450mm x 125mm", rate: 198.69, unit: "Nos" },
                    { id: 'PL-3-01-v17', label: "450mm x 600mm x 50mm", rate: 201.03, unit: "Nos" },
                    { id: 'PL-3-01-v18', label: "450mm x 600mm x 75mm", rate: 205.70, unit: "Nos" },
                    { id: 'PL-3-01-v19', label: "450mm x 600mm x 125mm", rate: 210.38, unit: "Nos" },
                    { id: 'PL-3-01-v20', label: "600mm x 600mm x 50mm", rate: 224.40, unit: "Nos" },
                    { id: 'PL-3-01-v21', label: "600mm x 600mm x 100mm", rate: 229.08, unit: "Nos" },
                    { id: 'PL-3-01-v22', label: "600mm x 600mm x 125mm", rate: 233.75, unit: "Nos" }
                ]
            }
        ]
    },
    {
        id: 'G-PL-4',
        title: 'IRON ANGLE STEEL FRAME',
        category: 'Penutup Longkang',
        items: [
            {
                id: 'PL-4-01',
                description: 'Kerja-kerja membekal dan memasang Iron Angle Steel Frame dengan ketebalan 5mm sebagai perlindungan kepada penutup longkang serta kerja-kerja berkaitan bersaiz :-',
                variants: [
                    { id: 'PL-4-01-v1', label: "300mm x 450mm x 50mm", rate: 63.54, unit: "Nos" },
                    { id: 'PL-4-01-v2', label: "300mm x 450mm x 75mm", rate: 65.49, unit: "Nos" },
                    { id: 'PL-4-01-v3', label: "300mm x 450mm x 125mm", rate: 69.40, unit: "Nos" },
                    { id: 'PL-4-01-v4', label: "300mm x 600mm x 50mm", rate: 81.13, unit: "Nos" },
                    { id: 'PL-4-01-v5', label: "300mm x 600mm x 75mm", rate: 83.09, unit: "Nos" },
                    { id: 'PL-4-01-v6', label: "300mm x 600mm x 125mm", rate: 87.00, unit: "Nos" },
                    { id: 'PL-4-01-v7', label: "300mm x 900mm x 50mm", rate: 122.19, unit: "Nos" },
                    { id: 'PL-4-01-v8', label: "300mm x 900mm x 75mm", rate: 124.14, unit: "Nos" },
                    { id: 'PL-4-01-v9', label: "300mm x 900mm x 125mm", rate: 128.05, unit: "Nos" },
                    { id: 'PL-4-01-v10', label: "450mm x 450mm x 50mm", rate: 90.91, unit: "Nos" },
                    { id: 'PL-4-01-v11', label: "450mm x 450mm x 75mm", rate: 92.86, unit: "Nos" },
                    { id: 'PL-4-01-v12', label: "450mm x 450mm x 125mm", rate: 96.77, unit: "Nos" },
                    { id: 'PL-4-01-v13', label: "400mm x 600mm x 50mm", rate: 108.50, unit: "Nos" },
                    { id: 'PL-4-01-v14', label: "400mm x 600mm x 75mm", rate: 110.46, unit: "Nos" },
                    { id: 'PL-4-01-v15', label: "400mm x 600mm x 100mm", rate: 112.41, unit: "Nos" },
                    { id: 'PL-4-01-v16', label: "400mm x 600mm x 125mm", rate: 114.37, unit: "Nos" },
                    { id: 'PL-4-01-v17', label: "450mm x 600mm x 50mm", rate: 122.19, unit: "Nos" },
                    { id: 'PL-4-01-v18', label: "450mm x 600mm x 75mm", rate: 124.14, unit: "Nos" },
                    { id: 'PL-4-01-v19', label: "450mm x 600mm x 125mm", rate: 128.05, unit: "Nos" },
                    { id: 'PL-4-01-v20', label: "600mm x 600mm x 50mm", rate: 163.24, unit: "Nos" },
                    { id: 'PL-4-01-v21', label: "600mm x 600mm x 100mm", rate: 167.15, unit: "Nos" },
                    { id: 'PL-4-01-v22', label: "600mm x 600mm x 125mm", rate: 169.11, unit: "Nos" }
                ]
            }
        ]
    },

    // --- CATEGORY: LALUAN KELUAR MASUK ---
    {
        id: 'G11',
        title: 'KERJA LALUAN MASUK (ENTRANCE)',
        category: 'Laluan Keluar Masuk',
        items: [
            {
                id: '11-01',
                description: 'Memecah konkrit sedia ada (Laluan Masuk) dan membaiki semula',
                rate: 384.70,
                unit: 'm³'
            },
            {
                id: '11-02',
                description: 'Membekal & memasang paip PVC (Weep Hole) 100mm dia',
                rate: 15.00,
                unit: 'NOS'
            }
        ]
    },

    // --- CATEGORY: PEJALAN KAKI ---
    {
        id: 'G12',
        title: 'LALUAN PEJALAN KAKI (WALKWAY)',
        category: 'Pejalan Kaki',
        items: [
            {
                id: '12-01',
                description: 'Membekal dan memasang Interlocking Paver 60mm',
                rate: 45.00,
                unit: 'm²'
            },
            {
                id: '12-02',
                description: 'Membekal dan memasang bendul jalan (Kerb) jenis konkrit',
                rate: 28.00,
                unit: 'm'
            }
        ]
    },

    // --- CATEGORY: SCUPPER DRAIN ---
    {
        id: 'G13',
        title: 'SCUPPER DRAIN',
        category: 'Scupper Drain',
        items: [
            {
                id: '13-01',
                description: 'Membina Scupper Drain bersaiz 150mm lebar',
                rate: 35.00,
                unit: 'm'
            },
            {
                id: '13-02',
                description: 'Membekal dan memasang paip UPVC 100mm dia',
                rate: 18.00,
                unit: 'm'
            }
        ]
    },

    // --- CATEGORY: PAGAR ---
    {
        id: 'G14',
        title: 'PAGAR, RAILING & GUARDRAIL',
        category: 'Pagar, Railing & Guardrail',
        items: [
            {
                id: '14-01',
                description: 'Membekal dan memasang Guardrail jenis Galvanised',
                rate: 180.00,
                unit: 'm'
            },
            {
                id: '14-02',
                description: 'Membekal dan memasang Handrailing Besi GI (Diameter 50mm)',
                rate: 120.00,
                unit: 'm'
            },
             {
                id: '14-03',
                description: 'Membekal dan memasang Pagar Chain Link setinggi 1.5m',
                rate: 65.00,
                unit: 'm'
            }
        ]
    }
];

// Helper to create basic items
export const createItem = (
    groupId: string, 
    itemId: string, 
    varId: string | null = null, 
    customParts?: CalculationPart[] 
): BQItem => {
    const group = BQ_LIBRARY.find(g => g.id === groupId);
    if(!group) throw new Error("Group not found");
    const item = group.items.find(i => i.id === itemId);
    if(!item) throw new Error("Item not found");
    
    let variant = null;
    let rate = item.rate || 0;
    let unit = item.unit || '';
    let desc = item.description;

    if (varId) {
        variant = item.variants?.find(v => v.id === varId);
        if(variant) {
            rate = variant.rate;
            unit = variant.unit;
            // Desc update optional
        }
    }

    let calculationParts: CalculationPart[] = [];
    let calculatedQty = 0;

    // --- UNIT-BASED CALCULATION LOGIC ---
    const u = unit.toLowerCase().trim();
    let hasLength = false;
    let hasWidth = false;
    let hasDepth = false;
    let isGlobal = false;
    let defaultQty = 1;

    const isM = u === 'm' || u === 'meter';
    const isM2 = u === 'm2' || u === 'm²' || u === 'sqm';
    const isM3 = u === 'm3' || u === 'm³' || u === 'cum';
    const isLS = u === 'l/s' || u === 'ls' || u === 'lumpsum' || u === 'lump sum';
    const isNos = u === 'nos' || u === 'no' || u === 'unit' || u === 'units';
    
    // STRICT FLAG SETTING AS REQUESTED
    if (isM) {
        // m = only (P)
        hasLength = true;
        hasWidth = false;
        hasDepth = false;
        isGlobal = true;
        defaultQty = 0; // Wait for dims
    } else if (isM2) {
        // m2 = only (P) x (L)
        hasLength = true;
        hasWidth = true;
        hasDepth = false;
        isGlobal = true;
        defaultQty = 0; // Wait for dims
    } else if (isM3) {
        // m3 = all turn on (P) (L) (T)
        hasLength = true;
        hasWidth = true;
        hasDepth = true;
        isGlobal = true;
        defaultQty = 0; // Wait for dims
    } else {
        // L/S or Nos = Tick off all
        hasLength = false;
        hasWidth = false;
        hasDepth = false;
        isGlobal = false;
        defaultQty = 1;
    }

    // SPECIAL OVERRIDE: 1.0m x 1.0m (Unlinked)
    const isOneByOne = variant && variant.label.includes("1.0m x 1.0m");
    if (isOneByOne) {
        isGlobal = false;
        hasLength = true;
        hasWidth = true;
        hasDepth = false;
    }

    if (customParts && customParts.length > 0) {
        // User provided specific dims (e.g. from a template generator)
        calculationParts = customParts.map(p => ({
            ...p,
            id: Math.random().toString(36).substr(2, 9)
        }));
        
        calculatedQty = calculationParts.reduce((acc, part) => {
            let product = 1;
            if (part.hasLength) product *= part.length;
            if (part.hasWidth) product *= part.width;
            if (part.hasDepth) product *= part.depth;
            return acc + (product * part.multiplier);
        }, 0);

    } else {
        // Default initialization
        const initialLen = isOneByOne ? 1 : 0;
        const initialWid = isOneByOne ? 1 : 0;

        calculationParts = [{
            id: Math.random().toString(36).substr(2, 9),
            label: "",
            length: initialLen,
            width: initialWid,
            depth: 0,
            multiplier: 1, 
            hasLength,
            hasWidth,
            hasDepth
        }];

        if (isOneByOne) {
            calculatedQty = 1;
        } else {
            calculatedQty = defaultQty;
        }
    }

    // IF VARIANT: Use Variant Label as Description
    const finalDesc = varId && variant ? variant.label : desc;

    return {
        id: Math.random().toString(36).substr(2, 9),
        type: 'ITEM',
        description: finalDesc,
        variant: undefined, // Cleared because description now holds the variant text
        unit,
        rate,
        qty: parseFloat(calculatedQty.toFixed(2)),
        amount: parseFloat((calculatedQty * rate).toFixed(2)),
        
        // Calc Fields
        isGlobal: isGlobal, 
        calculationParts,
        isCustomCalc: false,
    };
};

export const createHeader = (title: string): BQItem => ({
    id: Math.random().toString(36).substr(2, 9),
    type: 'HEADER',
    description: title,
    unit: '',
    rate: 0,
    qty: 0,
    amount: 0,
    calculationParts: []
});

export const generatePermulaanTemplate = (): BQGroup[] => {
    return [
        {
            id: `bil-${Date.now()}-1`,
            title: 'BIL NO. 1 - KERJA-KERJA PERMULAAN',
            items: [
                createHeader('ALL QUANTITY ARE PROVISIONAL'),
                createHeader('INSURANS'),
                createItem('G1-1', '1-01', '1-01-v1'),
                createHeader('PELAN PENGURUSAN LALULINTAS (TRAFFIC MANAGEMENT)'),
                createItem('G1-2', '2-01'), 
                createHeader('LAPORAN BERGAMBAR'),
                createItem('G1-3', '3-01'),
            ]
        }
    ];
};

export const generatePermulaanEmptyTemplate = (): BQGroup[] => {
    return [
        {
            id: `bil-${Date.now()}-1-empty`,
            title: 'BIL NO. 1 - KERJA-KERJA PERMULAAN',
            items: [
                createHeader('ALL QUANTITY ARE PROVISIONAL'),
                createHeader('INSURANS'),
                // Empty item for user to fill
                {
                    id: Math.random().toString(36).substr(2, 9),
                    type: 'ITEM',
                    description: 'MASUKKAN BUTIRAN INSURANS...',
                    unit: 'L/S',
                    rate: 0,
                    qty: 1,
                    amount: 0,
                    calculationParts: [],
                    isCustomCalc: false
                }
            ]
        }
    ];
};

export const generateEmptyBillWithLocation = (nextBilNo: number, locationId: string): BQGroup[] => {
    return [{
        id: `bil-${Date.now()}`,
        title: `BIL NO. ${nextBilNo} - BUTIRAN KERJA-KERJA `,
        locationId: locationId,
        items: []
    }];
};


export const generateLongkangTemplate = (startBillNo: number, locationId: string, dims: GlobalDimensions): BQGroup[] => {
    
    // --- BIL 2 Parts ---
    
    // 1.1 Excavation (1.0): P x L x T
    const partsExcavation: CalculationPart[] = [{
        id: 'p1', length: dims.length, width: dims.width, depth: dims.depth, multiplier: 1, 
        hasLength: true, hasWidth: true, hasDepth: true
    }];

    // 2.1 Lean Concrete (2.0): P x L
    const partsLean: CalculationPart[] = [{
        id: 'p1', length: dims.length, width: dims.width, depth: 0, multiplier: 1, 
        hasLength: true, hasWidth: true, hasDepth: false
    }];

    // 3.1 BRC (3.0): Base (P x L) + Walls (P x T x 2)
    const partsBRC: CalculationPart[] = [
        { id: 'p1', label: 'Base', length: dims.length, width: dims.width, depth: 0, multiplier: 1, hasLength: true, hasWidth: true, hasDepth: false },
        { id: 'p2', label: 'Walls', length: dims.length, width: 0, depth: dims.depth, multiplier: 2, hasLength: true, hasWidth: false, hasDepth: true },
    ];

    // 4.1 Formwork (4.0): P x T x 2 (Walls Only)
    // Using v2 (2 kali usage) as a sensible default for template
    const partsFormworkV: CalculationPart[] = [
        { id: 'p1', length: dims.length, width: 0, depth: dims.depth, multiplier: 2, hasLength: true, hasWidth: false, hasDepth: true }
    ];

    // 5.1 Concrete (5.0): Base (P x L) + Walls (P x T x 2)
    // Using v5 (100mm Ready Mix) as default
    const partsConc: CalculationPart[] = [
        { id: 'p1', label: 'Base', length: dims.length, width: dims.width, depth: 0, multiplier: 1, hasLength: true, hasWidth: true, hasDepth: false },
        { id: 'p2', label: 'Walls', length: dims.length, width: 0, depth: dims.depth, multiplier: 2, hasLength: true, hasWidth: false, hasDepth: true },
    ];

    // 6.1 Clay Drain (6.0): Fixed 1
    const partsClay: CalculationPart[] = [
        { id: 'p1', length: 0, width: 0, depth: 0, multiplier: 1, hasLength: false, hasWidth: false, hasDepth: false }
    ];

    // 17.1 Kerja Akhir (17.0): Fixed 1
    const partsAkhir: CalculationPart[] = [
        { id: 'p1', length: 0, width: 0, depth: 0, multiplier: 1, hasLength: false, hasWidth: false, hasDepth: false }
    ];

    // --- BIL 3 Parts (Entrance/Exit) ---
    // 11.1 Pecah Konkrit (11.0): P x L x T
    const partsPecah: CalculationPart[] = [{
        id: 'p1', length: dims.length, width: dims.width, depth: dims.depth, multiplier: 1, 
        hasLength: true, hasWidth: true, hasDepth: true
    }];

    // 4.1 Formwork H (Assume 5-02 from Group 4? No, it's 5-01 logic but horiz is usually separate. 
    // Wait, G5 is Formwork. The library has Vertical only under G5 now. 
    // Image 4.0 Formwork only shows Vertical items 4.1 i & ii.
    // I will use 5-01 for now, but really should check if Horizontal is in image. It's not.
    // I'll stick to 5-01-v2 for vertical formwork.
    
    // 3.1 Y10 -> Now using A10 (4-02 in new G4)
    const partsA10: CalculationPart[] = [{
        id: 'p1', length: dims.length, width: dims.width, depth: 0, multiplier: 1, 
        hasLength: true, hasWidth: true, hasDepth: false
    }];

    // --- BIL 4 Parts ---
    const partsFixed2: CalculationPart[] = [
        { id: 'p1', length: 0, width: 0, depth: 0, multiplier: 2, hasLength: false, hasWidth: false, hasDepth: false }
    ];

    return [
        {
            id: `bil-${Date.now()}-2`,
            title: `BIL NO. ${startBillNo} - BUTIRAN KERJA LONGKANG`,
            locationId,
            items: [
                createHeader('KERJA PENGOREKAN'),
                createHeader('Kerja-kerja menggali dan membuang tembok longkang sedia ada tidak melebihi 1500mm ukuran termasuk membuang sisa di tempat yang dibenarkan oleh pegawai penguasa.'),
                createItem('G2', '2-01', '2-01-v1', partsExcavation),
                createHeader('LEAN CONCRETE'),
                createItem('G3', '3-01', null, partsLean),
                createHeader('REINFORCEMENT'),
                createItem('G4', '4-01', null, partsBRC),
                createHeader('FORMWORK'),
                createHeader('Kerja-kerja membekal, memotong dan memasang acuan konkrit daripada papan tidak berketam pada muka-muka yang pugak (Vertical) termasuk kerja-kerja menanggal dan membuang.'),
                createItem('G5', '5-01', '5-01-v2', partsFormworkV),
                createHeader('KONKRIT'),
                createHeader('Kerja-kerja membekal, menuang dan memadat konkrit Ready Mixed/tuang disitu gred 20 bertetulang tuang disitu untuk lantai dan tembok longkang tebal 100mm/150mm/Ready Mixed/tuang disitu.'),
                createItem('G6', '6-01', '6-01-v5', partsConc),
                createHeader('LONGKANG JENIS TEMBIKAR (CLAY)'),
                createItem('G7', '7-01', '7-01-v1', partsClay),
                createHeader('KERJA-KERJA AKHIR'),
                createItem('G10', '10-01', '10-01-v1', partsAkhir)
            ]
        },
        {
            id: `bil-${Date.now()}-3`,
            title: `BIL NO. ${startBillNo + 1} - BUTIRAN KERJA LALUAN MASUK/KELUAR`,
            locationId,
            items: [
                createHeader('MEMBUAT KERJA-KERJA KONKRIT SEDIA ADA'),
                createItem('G11', '11-01', null, partsPecah),
                createHeader('REINFORCEMENT'),
                createItem('G4', '4-02', null, partsA10), 
                createHeader('KONKRIT'),
                createItem('G6', '6-01', '6-01-v5', partsConc)
            ]
        },
        {
            id: `bil-${Date.now()}-4`,
            title: `BIL NO. ${startBillNo + 2} - BUTIRAN KERJA PENUTUP LONGKANG`,
            locationId,
            items: [
                createHeader('IRON ANGLE STEEL FRAME'),
                createHeader('Kerja-kerja membekal dan memasang Iron Angle Steel Frame dengan ketebalan 5mm sebagai perlindungan kepada penutup longkang serta kerja-kerja berkaitan bersaiz :-'),
                createItem('G-PL-4', 'PL-4-01', 'PL-4-01-v14', partsFixed2), 
                createHeader('PENUTUP LONGKANG JENIS COMPRESSED CONCRETE'),
                createHeader('Kerja-kerja membekal dan memasang Compressed Concrete Heavy Duty with Drain Hole bersaiz :-'),
                createItem('G-PL-3', 'PL-3-01', 'PL-3-01-v11', partsFixed2) 
            ]
        }
    ];
};
