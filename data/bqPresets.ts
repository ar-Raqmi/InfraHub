
import { BQGroup, BQItem, GlobalDimensions, CalculationPart, PresetGroup, BQTemplateDefinition, BQTemplateBillDefinition } from "../types";

export const INITIAL_LIBRARY_DATA: PresetGroup[] = [
    {
        id: 'G1-1',
        title: 'INSURANS',
        category: 'Permulaan',
        items: [
            {
                id: '1-01',
                description: `Menyediakan polisi insuran berikut bagi merangkumi tempoh pekerjaan yang perlu seperti insuran tanggungan awam (Public Liability) , insuran pampasan pekerja (Workmen's Compensation) dan SOCSO\nNota: Liputan (coverage) minima insuran bagi pampasan adalah 30% daripada nilai kerja jika sekiranya pemborong tidak dapat mengadakan Nombor Pendaftaran PERKESO. Liputan bagi Insurans Tanggungan Umum adalah seperti berikut :-\nBagi perkara di atas, Kontraktor adalah dikehendaki mengemukakan Nota Liputan (Cover Note) bagi polisi-polisi insuran dan resit-resit premium yang telah dibayar, bagi tujuan memulakan kerja.`,
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
                description: 'Membekal dan menyediakan alat, jentera serta papan tanda berkaitan lalulintas berdasarkan Arahan Teknik Jalan 2C/85 (Pindaan 2017) serta arahan Pegawai Penguasa.\ni.) ADVANCE WARNING SIGN (T.1)',
                rate: 255.00,
                unit: 'Nos'
            },
            {
                id: '2-02-ii',
                description: 'ii.) ROAD WORKS (T.2)',
                rate: 233.75,
                unit: 'Nos'
            },
            {
                id: '2-02-iii',
                description: 'iii.) KEEP LEFT/RIGHT (T.7a)/(T.7b)',
                rate: 233.75,
                unit: 'Nos'
            },
            {
                id: '2-02-iv',
                description: 'iv.) AWAS (T.15)',
                rate: 191.25,
                unit: 'Nos'
            },
            {
                id: '2-02-v',
                description: 'v.) PLASTICS BARRIERS',
                rate: 153.00,
                unit: 'Nos'
            },
            {
                id: '2-02-vi',
                description: 'vi.) CONES',
                rate: 68.00,
                unit: 'Nos'
            },
            {
                id: '2-02-vii',
                description: 'vii.) DELINEATOR STRINGS',
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
                description: `KERJA-KERJA PENGUKURAN AWAL\n\nKerja-kerja pengukuran dan pemantauan tapak di sepanjang jajaran longkang/jalan melibatkan pengukuran struktur sedia ada, Sump Invert Level, Drain Invert Level, persempadanan, saiz longkang sedia ada, tiang-tiang sedia ada melibatkan Telekom, TNB serta Syarikat Telekomunikasi, bahu jalan, perabot jalan seperti kerb, papan tanda dan lebar jalan serta lain-lain struktur berkaitan yang boleh dilihat oleh mata kasar serta menyediakan dokumen ukur melalui pelan ukur sebanyak 2 Hardcopy, 1 salinan linen & kertas bersaiz A1 dan salinan softcopy (Thumb drive) serta disahkan oleh juruukur bertauliah dan berlesen. Pelan tersebut hendaklah disediakan dalam format ACAD/MRSO GDM 200 coordinate system/ArcGIS.\n\nDengan purata keluasan : .....m² - .....m²`,
                rate: 1.28,
                unit: 'm²'
            },
            {
                id: '4-02',
                description: `KERJA-KERJA PENGUKURAN AKHIR\n\nKerja-kerja pengukuran dan pemantauan tapak di sepanjang jajaran longkang/jalan melibatkan pengukuran struktur sedia ada, Sump Invert Level, Drain Invert Level, persempadanan, saiz longkang sedia ada, tiang-tiang sedia ada melibatkan Telekom, TNB serta Syarikat Telekomunikasi, bahu jalan, perabot jalan seperti kerb, papan tanda dan lebar jalan serta lain-lain struktur berkaitan yang boleh dilihat oleh mata kasar serta menyediakan dokumen As-Built melalui pelan ukur sebanyak 2 Hardcopy, 1 salinan linen & kertas bersaiz A1 dan salinan softcopy (Thumb drive) serta disahkan oleh juruukur bertauliah dan berlesen. Pelan tersebut hendaklah disediakan dalam format ACAD/MRSO GDM 200 coordinate system/ArcGIS.\n\nDengan purata keluasan : .....m² - .....m²`,
                rate: 1.28,
                unit: 'm²'
            },
            {
                id: '4-03',
                description: `KERJA-KERJA PENGUKURAN UNDERGROUND MAPPING\n\nKerja-kerja pengukuran dan pemantauan tapak di sepanjang jajaran longkang/jalan melibatkan pengukuran kabel atau paip, Invert Level , Manhole , sedia ada melibatkan syarikat utiliti seperti TNB, SYABAS dan Syarikat Telekomunikasi, persempadanan, dengan purata kelebaran sebanyak 3m hingga 5m serta menyediakan dokumen ukur melalui pelan ukur sebanyak 2 Hardcopy , 1 salinan linen & kertas bersaiz A1 dan salinan softcopy (Thumb drive) serta disahkan oleh juruukur bertauliah dan berlesen. Pelan tersebut hendaklah disediakan dalam format ACAD/MRSO GDM 200 coordinate system/ArcGIS.`,
                rate: 12.75,
                unit: 'm'
            }
        ]
    },

    {
        id: 'GJ-1',
        title: 'GARISAN JALAN',
        category: 'Garisan Jalan',
        items: [
            {
                id: 'GJ-1-01',
                description: 'Membekal segala peralatan, bahan-bahan, jentera dan tenaga buruh untuk mengecat jalan jenis Thermoplastic termasuk Prime Coat dan Glass bead serta membersihkan permukaan jalan seperti yang tercatat di dalam penentuan kerja dan Arahan Teknik Jalan 2D/85. Kerja mengecat Roadmarking merangkumi semua jenis garisan kecuali Tulisan Abjad.\n\nGARISAN PUTIH',
                variants: [
                    { id: 'GJ-1-01-v1', label: 'Garisan Berhenti', rate: 21.25, unit: 'm²' },
                    { id: 'GJ-1-01-v2', label: 'Garisan Tengah (100mm lebar)', rate: 21.25, unit: 'm²' },
                    { id: 'GJ-1-01-v3', label: 'Garisan Tepi (150mm lebar)', rate: 21.25, unit: 'm²' },
                    { id: 'GJ-1-01-v4', label: 'Single Arrow', rate: 68.00, unit: 'Nos' },
                    { id: 'GJ-1-01-v5', label: 'Double Arrow', rate: 106.25, unit: 'Nos' },
                    { id: 'GJ-1-01-v6', label: 'Triple Arrow', rate: 127.50, unit: 'Nos' }
                ]
            },
            {
                id: 'GJ-1-02',
                description: 'GARISAN KUNING',
                variants: [
                    { id: 'GJ-1-02-v1', label: 'Petak kuning', rate: 21.25, unit: 'm²' },
                    { id: 'GJ-1-02-v2', label: 'Garisan bonggol jalan', rate: 21.25, unit: 'm²' },
                    { id: 'GJ-1-02-v3', label: 'Lot tempat meletak kenderaan & Nombor petak parking (sila rujuk spesifikasi pelan)', rate: 27.20, unit: 'Nos' },
                    { id: 'GJ-1-02-v4', label: 'Transverse Bar (5mm Tebal)', rate: 27.20, unit: 'm²' },
                    { id: 'GJ-1-02-v5', label: 'Lot tempat meletak motorsikal', rate: 10.20, unit: 'Nos' }
                ]
            },
            {
                id: 'GJ-1-03',
                description: 'GARISAN HITAM',
                variants: [
                    { id: 'GJ-1-03-v1', label: 'Garisan Berhenti', rate: 21.25, unit: 'm²' },
                    { id: 'GJ-1-03-v2', label: 'Garisan Tengah (100mm lebar)', rate: 21.25, unit: 'm²' },
                    { id: 'GJ-1-03-v3', label: 'Garisan Tepi (150mm lebar)', rate: 21.25, unit: 'm²' },
                    { id: 'GJ-1-03-v4', label: 'Single/Double/Triple Arrow', rate: 61.20, unit: 'Nos' },
                    { id: 'GJ-1-03-v5', label: 'Petak kuning', rate: 21.25, unit: 'm²' },
                    { id: 'GJ-1-03-v6', label: 'Garisan bonggol jalan', rate: 21.25, unit: 'm²' },
                    { id: 'GJ-1-03-v7', label: 'Lot tempat meletak kenderaan & Nombor petak parking', rate: 23.80, unit: 'Nos' },
                    { id: 'GJ-1-03-v8', label: 'Lot tempat meletak motorsikal', rate: 10.20, unit: 'Nos' }
                ]
            },
            {
                id: 'GJ-1-04',
                description: 'GARISAN JALAN YANG LAIN',
                variants: [
                    { id: 'GJ-1-04-v1', label: 'Garisan Chevron Hatching (300mm lebar)', rate: 23.46, unit: 'm²' },
                    { id: 'GJ-1-04-v2', label: 'Cat Merah Ghost Island', rate: 19.55, unit: 'm²' },
                    { id: 'GJ-1-04-v3', label: 'Petak Parking OKU', rate: 450.50, unit: 'Nos' },
                    { id: 'GJ-1-04-v4', label: 'Cat Merah Petak Sewa Khas', rate: 27.20, unit: 'm²' }
                ]
            }
        ]
    },
    {
        id: 'GJ-2',
        title: 'CAT SEMENTARA',
        category: 'Garisan Jalan',
        items: [
            {
                id: 'GJ-2-01',
                description: 'Kerja-kerja membekal dan mengecat tanda jalan SEMENTARA setelah kerja-kerja penurapan siap dilaksanakan bagi tujuan keselamatan pengguna awam. Contoh seperti bonggol, garisan tengah dan garisan berhenti.',
                rate: 255.00,
                unit: 'L/S'
            }
        ]
    },
    {
        id: 'GJ-3',
        title: 'GARISAN JALAN PUTIH ALL WEATHER THERMOPLASTIC (AWT)',
        category: 'Garisan Jalan',
        items: [
            {
                id: 'GJ-3-01',
                description: 'Kerja-kerja membekal dan mengecat jalan jenis All Weather Thermoplastic (AWT) seperti yang tercatat di dalam penentuan kerja.',
                variants: [
                    { id: 'GJ-3-01-v1', label: 'Garisan Berhenti', rate: 68.00, unit: 'm²' },
                    { id: 'GJ-3-01-v2', label: 'Garisan Tengah (100mm lebar)', rate: 68.00, unit: 'm²' },
                    { id: 'GJ-3-01-v3', label: 'Garisan Tepi (150mm lebar)', rate: 68.00, unit: 'm²' },
                    { id: 'GJ-3-01-v4', label: 'Single Arrow', rate: 127.50, unit: 'Nos' },
                    { id: 'GJ-3-01-v5', label: 'Double Arrow', rate: 170.00, unit: 'Nos' },
                    { id: 'GJ-3-01-v6', label: 'Triple Arrow', rate: 212.50, unit: 'Nos' }
                ]
            }
        ]
    },
    {
        id: 'GJ-4',
        title: 'SPEED BREAKER ANTI SKID',
        category: 'Garisan Jalan',
        items: [
            {
                id: 'GJ-4-01',
                description: 'Kerja-kerja membina garisan merah campuran Anti-Skid dengan purata ketebalan di antara 5-7mm.',
                rate: 229.71,
                unit: 'm²'
            }
        ]
    },

    {
        id: 'G-JALAN-1',
        title: 'KERJA JALAN',
        category: 'Jalan',
        items: [
            {
                id: 'J-1-01',
                description: 'Membawa masuk dan keluar serta sewa mesin dan kesemua jentera pembinaan peralatan yang diperlukan (Mobilization and Demobilization Plant/Equipment) bagi melaksanakan kerja-kerja berkaitan di tapak mengikut arahan pegawai penguasa.',
                rate: 2975.00,
                unit: 'L/S'
            },
            {
                id: 'J-1-02',
                description: 'Membersihkan permukaan jalan dari sebarang kekotoran, habuk dan bahan-bahan asing lain yang tidak diperlukan termasuklah taburan bahan premix yang sejuk. (Klausa 4.3.2.4 (b) JKR/SPJ/2008-S4)',
                rate: 0.51,
                unit: 'm²'
            },
            {
                id: 'J-1-03',
                description: '60mm tebal lapisan pengikat (Binder Course) termasuk lapisan asas berbitumen bergred penembusan 80/100 (Prime Coat) disembur pada kadar 1.4 liter/meter persegi dan dimampatkan dengan mesin penggelek 8 tan.',
                rate: 62.82,
                unit: 'm²'
            },
            {
                id: 'J-1-04',
                description: 'Membekal dan memadat 50mm tebal (Macadam Bitumen) ACWC 14 termasuk satu lapisan cecair (Tack Coat) disembur pada kadar 2 liter/meter persegi dan dimampatkan dengan mesin penggelek 8 tan.',
                rate: 50.20,
                unit: 'm²'
            }
        ]
    },
    {
        id: 'G-JALAN-2',
        title: 'BUTIRAN KERJA-KERJA BONGGOL JALAN',
        category: 'Jalan',
        items: [
            {
                id: 'J-2-01',
                description: 'Kerja-kerja membina bonggol jalan mengikut pelan spesifikasi MPS seperti dilampirkan termasuk kerja-kerja mengecat sementara bonggol jalan.',
                variants: [
                    { id: 'J-2-01-v1', label: 'Ukuran ..................m (P) x 2.1m @ 3.0m (L) x 75mm (T)', rate: 133.71, unit: 'm' }
                ]
            },
            {
                id: 'J-2-02',
                description: 'Kerja-kerja membekal dan memasang rubber speed hump dengan ketebalan 45mm termasuk kerja-kerja pemasangan dengan menggunakan bolt bersaiz 16mm diameter',
                rate: 238.30,
                unit: 'm'
            },
            {
                id: 'J-2-03',
                description: 'Kerja-kerja memotong jalan yang rosak menggunakan Diamond Cutter setebal 150mm hingga ke paras yang dibenarkan termasuk kerja-kerja mengorek permukaan jalan sedia ada sehingga ke lapisan asas serta membuang sisa ke tempat yang dibenarkan.',
                rate: 11.22,
                unit: 'm²'
            }
        ]
    },
    {
        id: 'G-JALAN-3',
        title: 'COLD PREMIX',
        category: 'Jalan',
        items: [
            {
                id: 'J-3-01',
                description: 'Kerja-kerja membekal dan menghantar Cold Mix Asphalt untuk Jabatan Kejuruteraan Majlis Perbandaran selayang bagi kegunaan unit jalan.',
                rate: 72.25,
                unit: 'Nos'
            }
        ]
    },

    {
        id: 'G2',
        title: 'KERJA PENGOREKAN',
        category: 'Longkang',
        items: [
            {
                id: '2-01',
                description: 'Kerja-kerja menggali dan membuang tembok longkang sedia ada tidak melebihi 1500mm ukuran termasuk membuang sisa di tempat yang dibenarkan oleh pegawai penguasa.',
                variants: [
                    { id: '2-01-v1', label: "Dengan jentera", rate: 21.17, unit: "m³" },
                    { id: '2-01-v2', label: "Dengan tangan", rate: 59.42, unit: "m³" }
                ]
            },
            {
                id: '2-02',
                description: 'Kerja-kerja menggali dan membuang tembok longkang sedia ada melebihi 1500mm tetapi tidak melebihi 3000mm ukuran (dengan jentera/tangan) termasuk membuang sisa di tempat yang dibenarkan oleh penguasa.',
                variants: [
                    { id: '2-02-v1', label: "dengan jentera", rate: 21.76, unit: "m³" },
                    { id: '2-02-v2', label: "dengan tangan", rate: 94.32, unit: "m³" }
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
                rate: 32.51,
                unit: 'm²'
            },
            {
                id: '4-02',
                description: 'Kerja-kerja membekal, memasang, membengkok dan memotong kepingan jejaring (BRC) No. A10 atau tetulang keluli dikimpal berbentuk jejaring 200mm x 200mm, beratnya 6.16kg setiap meter persegi. (BRC A10)',
                rate: 53.13,
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
                    { id: '5-01-v1', label: "1 kali penggunaan - (20m ke bawah)", rate: 61.71, unit: "m²" },
                    { id: '5-01-v2', label: "2 kali penggunaan - (21m ke atas)", rate: 30.86, unit: "m²" }
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
                description: 'Kerja-kerja membekal, menuang dan memadat konkrit Ready Mixed /tuang disitu gred 20 bertetulang tuang disitu untuk lantai dan tembok longkang tebal 100mm/150mm/ Ready Mixed /tuang disitu.',
                variants: [
                    { id: '6-01-v1', label: "50mm tebal (Ready Mix)", rate: 17.38, unit: "m²" },
                    { id: '6-01-v2', label: "50mm tebal (Tuang Disitu)", rate: 25.25, unit: "m²" },
                    { id: '6-01-v3', label: "75mm tebal (Ready Mix)", rate: 26.07, unit: "m²" },
                    { id: '6-01-v4', label: "75mm tebal (Tuang Disitu)", rate: 37.99, unit: "m²" },
                    { id: '6-01-v5', label: "100mm tebal (Ready Mix)", rate: 34.77, unit: "m²" },
                    { id: '6-01-v6', label: "100mm tebal (Tuang Disitu)", rate: 50.61, unit: "m²" },
                    { id: '6-01-v7', label: "150mm tebal (Ready Mix)", rate: 52.14, unit: "m²" },
                    { id: '6-01-v8', label: "150mm tebal (Tuang Disitu)", rate: 75.85, unit: "m²" },
                    { id: '6-01-v9', label: "200mm tebal (Ready Mix)", rate: 69.52, unit: "m²" },
                    { id: '6-01-v10', label: "200mm tebal (Tuang Disitu)", rate: 101.10, unit: "m²" }
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
                    { id: '7-01-v1', label: "225mm", rate: 23.04, unit: "m" },
                    { id: '7-01-v2', label: "300mm", rate: 30.60, unit: "m" },
                    { id: '7-01-v3', label: "450mm", rate: 45.90, unit: "m" }
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
                    { id: '8-01-L-v4', label: "750mm x 750mm", rate: 410.20, unit: "m" },
                    { id: '8-01-L-v5', label: "900mm x 900mm", rate: 505.80, unit: "m" },
                    { id: '8-01-L-v6', label: "1200mm x 1200mm", rate: 677.94, unit: "m" },
                    { id: '8-01-L-v7', label: "1500mm x 1500mm", rate: 846.67, unit: "m" },
                    { id: '8-01-L-v8', label: "2100mm x 2100mm", rate: 1108.90, unit: "m" }
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
                    { id: '10-01-L-v3', label: "600mm x 600mm", rate: 989.88, unit: "m" },
                    { id: '10-01-L-v4', label: "750mm x 750mm", rate: 791.90, unit: "m" },
                    { id: '10-01-L-v5', label: "900mm x 900mm", rate: 1187.85, unit: "m" },
                    { id: '10-01-L-v6', label: "1200mm x 1200mm", rate: 1583.80, unit: "m" },
                    { id: '10-01-L-v7', label: "1500mm x 1500mm", rate: 1979.75, unit: "m" },
                    { id: '10-01-L-v8', label: "2100mm x 2100mm", rate: 2771.65, unit: "m" }
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
                    { id: '11-01-L-v1', label: "600mm", rate: 375.12, unit: "m" },
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
                    { id: '13-01-L-v3', label: "450mm", rate: 42.43, unit: "Nos" },
                    { id: '13-01-L-v4', label: "500mm", rate: 47.13, unit: "Nos" },
                    { id: '13-01-L-v5', label: "600mm", rate: 56.57, unit: "Nos" },
                    { id: '13-01-L-v6', label: "750mm", rate: 70.72, unit: "Nos" },
                    { id: '13-01-L-v7', label: "800mm", rate: 75.44, unit: "Nos" },
                    { id: '13-01-L-v8', label: "900mm", rate: 87.42, unit: "Nos" },
                    { id: '13-01-L-v9', label: "1000mm", rate: 94.29, unit: "Nos" },
                    { id: '13-01-L-v10', label: "1200mm", rate: 113.14, unit: "Nos" },
                    { id: '13-01-L-v11', label: "1500mm", rate: 133.71, unit: "Nos" }
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
                    { id: '16-01-L-v4', label: "1000mm x 1000mm", rate: 914.60, unit: "Nos" },
                    { id: '16-01-L-v5', label: "1200mm x 1200mm", rate: 1028.50, unit: "Nos" },
                    { id: '16-01-L-v6', label: "1500mm x 1500mm", rate: 1234.20, unit: "Nos" },
                    { id: '16-01-L-v7', label: "1800mm x 1800mm", rate: 1542.75, unit: "Nos" },
                    { id: '16-01-L-v8', label: "2000mm x 2000mm", rate: 1748.45, unit: "Nos" }
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

    // --- CATEGORY: PENUTUP LONGKANG (UPDATED) ---
    {
        id: 'G-PL-1',
        title: 'GRATING',
        category: 'Penutup Longkang',
        items: [
            {
                id: 'PL-1-01',
                description: 'Kerja-kerja membekal dan memasang baru besi penutup longkang (M.S. Cover) dari M.S. Plate 75mm x 50mm x 10 mm M.S. Angle Iron untuk slab termasuk kerja-kerja mengecat dan 2 bil engsel ditanam (Bolt) ke lantai hendaklah di sadur dengan Hot Dipped Galvanised M.S.',
                variants: [
                    { id: 'PL-1-01-v1', label: '300mm x 300mm', rate: 806.44, unit: 'Nos' },
                    { id: 'PL-1-01-v2', label: '450mm x 450mm', rate: 1129.01, unit: 'Nos' },
                    { id: 'PL-1-01-v3', label: '600mm x 600mm', rate: 1612.88, unit: 'Nos' },
                    { id: 'PL-1-01-v4', label: '900mm x 750mm', rate: 1881.69, unit: 'Nos' },
                    { id: 'PL-1-01-v5', label: '900mm x 900mm', rate: 2258.03, unit: 'Nos' },
                    { id: 'PL-1-01-v6', label: '1200mm x 1200mm', rate: 2795.65, unit: 'Nos' },
                    { id: 'PL-1-01-v7', label: '1400mm x 1000mm', rate: 2688.13, unit: 'Nos' },
                    { id: 'PL-1-01-v8', label: '1500mm x 1500mm', rate: 3440.80, unit: 'Nos' },
                    { id: 'PL-1-01-v9', label: '1800mm x 1800mm', rate: 4516.05, unit: 'Nos' },
                    { id: 'PL-1-01-v10', label: '1.0m x 1.0m', rate: 2419.31, unit: 'm²' }
                ]
            },
            {
                id: 'PL-1-02',
                description: 'Kerja-kerja membekal dan memasang baru besi penutup longkang (M.S. Cover) dari M.S. Plate 75mm x 50mm x 10 mm M.S. Angle Iron untuk slab termasuk kerja-kerja mengecat dan 2 bil engsel ditanam (Bolt) ke lantai.',
                variants: [
                    { id: 'PL-1-02-v1', label: '300mm x 300mm', rate: 376.34, unit: 'Nos' },
                    { id: 'PL-1-02-v2', label: '450mm x 450mm', rate: 537.63, unit: 'Nos' },
                    { id: 'PL-1-02-v3', label: '600mm x 600mm', rate: 698.91, unit: 'Nos' },
                    { id: 'PL-1-02-v4', label: '900mm x 750mm', rate: 860.20, unit: 'Nos' },
                    { id: 'PL-1-02-v5', label: '900mm x 900mm', rate: 1021.49, unit: 'Nos' },
                    { id: 'PL-1-02-v6', label: '1200mm x 1200mm', rate: 1397.83, unit: 'Nos' },
                    { id: 'PL-1-02-v7', label: '1400mm x 1000mm', rate: 1344.06, unit: 'Nos' },
                    { id: 'PL-1-02-v8', label: '1500mm x 1500mm', rate: 1612.88, unit: 'Nos' },
                    { id: 'PL-1-02-v9', label: '1800mm x 1800mm', rate: 1935.45, unit: 'Nos' },
                    { id: 'PL-1-02-v10', label: '1.0m x 1.0m', rate: 1129.01, unit: 'm²' }
                ]
            },
            {
                id: 'PL-1-03',
                description: 'Kerja-kerja membekal dan memasang baru besi penutup longkang (M.S. Cover) dari M.S. Plate 50mm x 50mm x 5 mm M.S. Angle Iron untuk slab termasuk kerja-kerja mengecat dan 2 bil. engsel ditanam (Bolt) ke lantai hendaklah disadur dengan Hot Dipped Galvanised.',
                variants: [
                    { id: 'PL-1-03-v1', label: '300mm x 300mm', rate: 564.51, unit: 'Nos' },
                    { id: 'PL-1-03-v2', label: '450mm x 450mm', rate: 790.31, unit: 'Nos' },
                    { id: 'PL-1-03-v3', label: '600mm x 600mm', rate: 1129.01, unit: 'Nos' },
                    { id: 'PL-1-03-v4', label: '900mm x 750mm', rate: 1317.19, unit: 'Nos' },
                    { id: 'PL-1-03-v5', label: '900mm x 900mm', rate: 1580.62, unit: 'Nos' },
                    { id: 'PL-1-03-v6', label: '1200mm x 1200mm', rate: 1956.96, unit: 'Nos' },
                    { id: 'PL-1-03-v7', label: '1400mm x 1000mm', rate: 1881.69, unit: 'Nos' },
                    { id: 'PL-1-03-v8', label: '1500mm x 1500mm', rate: 2408.56, unit: 'Nos' },
                    { id: 'PL-1-03-v9', label: '1800mm x 1800mm', rate: 3161.24, unit: 'Nos' },
                    { id: 'PL-1-03-v10', label: '1.0m x 1.0m', rate: 1693.52, unit: 'm²' }
                ]
            },
            {
                id: 'PL-1-04',
                description: 'Kerja-kerja membekal dan memasang baru besi penutup longkang (M.S. Cover) dari M.S. Plate 50mm x 50mm x 10 mm M.S. Angle Iron untuk slab termasuk kerja-kerja mengecat dan 2 bil. engsel ditanam (Bolt) ke lantai hendaklah disadur dengan Hot Dipped Galvanised.',
                variants: [
                    { id: 'PL-1-04-v1', label: '300mm x 300mm', rate: 806.44, unit: 'Nos' },
                    { id: 'PL-1-04-v2', label: '450mm x 450mm', rate: 1129.01, unit: 'Nos' },
                    { id: 'PL-1-04-v3', label: '600mm x 600mm', rate: 1612.88, unit: 'Nos' },
                    { id: 'PL-1-04-v4', label: '900mm x 750mm', rate: 1881.69, unit: 'Nos' },
                    { id: 'PL-1-04-v5', label: '900mm x 900mm', rate: 2258.03, unit: 'Nos' },
                    { id: 'PL-1-04-v6', label: '1200mm x 1200mm', rate: 2795.65, unit: 'Nos' },
                    { id: 'PL-1-04-v7', label: '1400mm x 1000mm', rate: 2688.13, unit: 'Nos' },
                    { id: 'PL-1-04-v8', label: '1500mm x 1500mm', rate: 3440.80, unit: 'Nos' },
                    { id: 'PL-1-04-v9', label: '1800mm x 1800mm', rate: 4516.05, unit: 'Nos' },
                    { id: 'PL-1-04-v10', label: '1.0m x 1.0m', rate: 2419.31, unit: 'm²' }
                ]
            }
        ]
    },
    {
        id: 'PL-G5',
        title: 'PENUTUP LONGKANG JENIS PRECAST CONCRETE',
        category: 'Penutup Longkang',
        items: [
            {
                id: 'PL-2-0',
                description: 'Kerja-kerja membekal dan memasang Pre Cast Concrete Heavy Duty with Lifting Hole bersaiz :-',
                variants: [
                    { id: 'v1', label: '300mm x 450mm x 50mm', rate: 56.10, unit: 'Nos' },
                    { id: 'v2', label: '300mm x 450mm x 75mm', rate: 65.45, unit: 'Nos' },
                    { id: 'v3', label: '300mm x 450mm x 125mm', rate: 74.80, unit: 'Nos' },
                    { id: 'v4', label: '300mm x 600mm x 50mm', rate: 84.15, unit: 'Nos' },
                    { id: 'v5', label: '300mm x 600mm x 75mm', rate: 93.50, unit: 'Nos' },
                    { id: 'v6', label: '300mm x 600mm x 125mm', rate: 102.85, unit: 'Nos' },
                    { id: 'v7', label: '300mm x 900mm x 50mm', rate: 112.20, unit: 'Nos' },
                    { id: 'v8', label: '300mm x 900mm x 75mm', rate: 121.55, unit: 'Nos' },
                    { id: 'v9', label: '300mm x 900mm x 125mm', rate: 130.90, unit: 'Nos' },
                    { id: 'v10', label: '450mm x 450mm x 50mm', rate: 140.25, unit: 'Nos' },
                    { id: 'v11', label: '450mm x 450mm x 75mm', rate: 149.60, unit: 'Nos' },
                    { id: 'v12', label: '450mm x 450mm x 125mm', rate: 158.95, unit: 'Nos' },
                    { id: 'v13', label: '450mm x 600mm x 50mm', rate: 168.30, unit: 'Nos' },
                    { id: 'v14', label: '450mm x 600mm x 75mm', rate: 177.65, unit: 'Nos' },
                    { id: 'v15', label: '450mm x 600mm x 125mm', rate: 187.00, unit: 'Nos' },
                    { id: 'v16', label: '600mm x 600mm x 50mm', rate: 196.35, unit: 'Nos' },
                    { id: 'v17', label: '600mm x 600mm x 100mm', rate: 205.70, unit: 'Nos' },
                    { id: 'v18', label: '600mm x 600mm x 125mm', rate: 215.05, unit: 'Nos' },
                    { id: 'v19', label: '600mm x 900mm x 50mm', rate: 233.75, unit: 'Nos' },
                    { id: 'v20', label: '600mm x 900mm x 75mm', rate: 243.10, unit: 'Nos' },
                    { id: 'v21', label: '600mm x 900mm x 100mm', rate: 252.45, unit: 'Nos' },
                    { id: 'v22', label: '600mm x 900mm x 125mm', rate: 261.80, unit: 'Nos' },
                    { id: 'v23', label: '750mm x 600mm x 75mm', rate: 289.85, unit: 'Nos' }
                ]
            }
        ]
    },
    {
        id: 'PL-G6',
        title: 'PENUTUP LONGKANG JENIS COMPRESSED CONCRETE',
        category: 'Penutup Longkang',
        items: [
            {
                id: 'PL-3-0',
                description: 'Kerja-kerja membekal dan memasang Compressed Concrete Heavy Duty with Drain Hole bersaiz :-',
                variants: [
                    { id: 'v1', label: '300mm x 450mm x 50mm', rate: 165.96, unit: 'Nos' },
                    { id: 'v2', label: '300mm x 450mm x 75mm', rate: 170.64, unit: 'Nos' },
                    { id: 'v3', label: '300mm x 450mm x 125mm', rate: 175.31, unit: 'Nos' },
                    { id: 'v4', label: '300mm x 600mm x 50mm', rate: 177.65, unit: 'Nos' },
                    { id: 'v5', label: '300mm x 600mm x 75mm', rate: 182.33, unit: 'Nos' },
                    { id: 'v6', label: '300mm x 600mm x 125mm', rate: 187.00, unit: 'Nos' },
                    { id: 'v7', label: '300mm x 900mm x 50mm', rate: 201.03, unit: 'Nos' },
                    { id: 'v8', label: '300mm x 900mm x 75mm', rate: 205.70, unit: 'Nos' },
                    { id: 'v9', label: '300mm x 900mm x 125mm', rate: 210.38, unit: 'Nos' },
                    { id: 'v10', label: '400mm x 600mm x 50mm', rate: 168.30, unit: 'Nos' },
                    { id: 'v11', label: '400mm x 600mm x 75mm', rate: 177.65, unit: 'Nos' },
                    { id: 'v12', label: '400mm x 600mm x 100mm', rate: 187.00, unit: 'Nos' },
                    { id: 'v13', label: '400mm x 600mm x 125mm', rate: 196.35, unit: 'Nos' },
                    { id: 'v14', label: '450mm x 450mm x 50mm', rate: 189.34, unit: 'Nos' },
                    { id: 'v15', label: '450mm x 450mm x 75mm', rate: 194.01, unit: 'Nos' },
                    { id: 'v16', label: '450mm x 450mm x 125mm', rate: 198.69, unit: 'Nos' },
                    { id: 'v17', label: '450mm x 600mm x 50mm', rate: 201.03, unit: 'Nos' },
                    { id: 'v18', label: '450mm x 600mm x 75mm', rate: 205.70, unit: 'Nos' },
                    { id: 'v19', label: '450mm x 600mm x 125mm', rate: 210.38, unit: 'Nos' },
                    { id: 'v20', label: '600mm x 600mm x 50mm', rate: 224.40, unit: 'Nos' },
                    { id: 'v21', label: '600mm x 600mm x 100mm', rate: 229.08, unit: 'Nos' },
                    { id: 'v22', label: '600mm x 600mm x 125mm', rate: 233.75, unit: 'Nos' }
                ]
            }
        ]
    },
    {
        id: 'PL-G7',
        title: 'IRON ANGLE STEEL FRAME',
        category: 'Penutup Longkang',
        items: [
            {
                id: 'PL-4-0',
                description: 'Kerja-kerja membekal dan memasang Iron Angle Steel Frame dengan ketebalan 5mm sebagai perlindungan kepada penutup longkang serta kerja-kerja berkaitan bersaiz :-',
                variants: [
                    { id: 'v1', label: '300mm x 450mm x 50mm', rate: 63.54, unit: 'Nos' },
                    { id: 'v2', label: '300mm x 450mm x 75mm', rate: 65.49, unit: 'Nos' },
                    { id: 'v3', label: '300mm x 450mm x 125mm', rate: 69.40, unit: 'Nos' },
                    { id: 'v4', label: '300mm x 600mm x 50mm', rate: 81.13, unit: 'Nos' },
                    { id: 'v5', label: '300mm x 600mm x 75mm', rate: 83.09, unit: 'Nos' },
                    { id: 'v6', label: '300mm x 600mm x 125mm', rate: 87.00, unit: 'Nos' },
                    { id: 'v7', label: '300mm x 900mm x 50mm', rate: 122.19, unit: 'Nos' },
                    { id: 'v8', label: '300mm x 900mm x 75mm', rate: 124.14, unit: 'Nos' },
                    { id: 'v9', label: '300mm x 900mm x 125mm', rate: 128.05, unit: 'Nos' },
                    { id: 'v10', label: '450mm x 450mm x 50mm', rate: 90.91, unit: 'Nos' },
                    { id: 'v11', label: '450mm x 450mm x 75mm', rate: 92.86, unit: 'Nos' },
                    { id: 'v12', label: '450mm x 450mm x 125mm', rate: 96.77, unit: 'Nos' },
                    { id: 'v13', label: '400mm x 600mm x 50mm', rate: 108.50, unit: 'Nos' },
                    { id: 'v14', label: '400mm x 600mm x 75mm', rate: 110.46, unit: 'Nos' },
                    { id: 'v15', label: '400mm x 600mm x 100mm', rate: 112.41, unit: 'Nos' },
                    { id: 'v16', label: '400mm x 600mm x 125mm', rate: 114.37, unit: 'Nos' },
                    { id: 'v17', label: '450mm x 600mm x 50mm', rate: 122.19, unit: 'Nos' },
                    { id: 'v18', label: '450mm x 600mm x 75mm', rate: 124.14, unit: 'Nos' },
                    { id: 'v19', label: '450mm x 600mm x 125mm', rate: 128.05, unit: 'Nos' },
                    { id: 'v20', label: '600mm x 600mm x 50mm', rate: 163.24, unit: 'Nos' },
                    { id: 'v21', label: '600mm x 600mm x 100mm', rate: 167.15, unit: 'Nos' },
                    { id: 'v22', label: '600mm x 600mm x 125mm', rate: 169.11, unit: 'Nos' }
                ]
            }
        ]
    },

    // --- CATEGORY: LALUAN KELUAR MASUK (UPDATED STRUCTURE) ---
    {
        id: 'G11-1',
        title: 'MEMBUAT KERJA-KERJA KONKRIT SEDIA ADA',
        category: 'Laluan Keluar Masuk',
        items: [
            {
                id: '11-1-01',
                description: 'Memecah atau merobohkan konkrit sedia ada dan membaiki semula mana-mana bahagian rosak, tidak melebihi 300mm tebal.',
                variants: [
                    { id: '11-1-01-v1', label: "dengan tetulang", rate: 384.70, unit: "m³" },
                    { id: '11-1-01-v2', label: "tanpa tetulang", rate: 280.80, unit: "m³" }
                ]
            },
            {
                id: '11-1-02',
                description: 'Membuat lubang menembusi konkrit yang sedia ada dan membaiki semula mana-mana bahagian yang rosak, termasuk menumpang di bahagian atas.',
                variants: [
                    { id: '11-1-02-v1', label: "dengan tetulang", rate: 845.30, unit: "m³" },
                    { id: '11-1-02-v2', label: "tanpa tetulang", rate: 619.30, unit: "m³" }
                ]
            }
        ]
    },
    {
        id: 'G11-2',
        title: 'FORMWORK',
        category: 'Laluan Keluar Masuk',
        items: [
            {
                id: '11-2-01',
                description: 'Kerja-kerja membekal, memotong dan memasang acuan konkrit daripada papan tidak berketam pada muka-muka yang ufuk (Horizontal) termasuk kerja-kerja menanggal dan membuang.',
                rate: 68.11,
                unit: 'm²'
            }
        ]
    },
    {
        id: 'G11-3',
        title: 'REINFORCEMENT',
        category: 'Laluan Keluar Masuk',
        items: [
            {
                id: '11-3-01',
                description: 'Kerja-kerja membekal, memasang, membengkok dan memotong tetulang keluli Y10 yang diikat rapi berbentuk segiempat bersaiz 200mm x 200mm beserta Concrete Spacer, beratnya 6.16kg setiap meter persegi sebanyak 2 lapisan.',
                rate: 101.80,
                unit: 'm²'
            }
        ]
    },
    {
        id: 'G11-4',
        title: 'KONKRIT',
        category: 'Laluan Keluar Masuk',
        items: [
            {
                id: '11-4-01',
                description: 'Kerja-kerja membekal, menuang dan memadat konkrit Ready Mixed /tuang disitu gred 20 bertetulang tuang disitu untuk lantai dan tembok longkang tebal 100mm/150mm/ Ready Mixed /tuang disitu.',
                variants: [
                    { id: '11-4-01-v1', label: "50mm tebal (Ready Mix)", rate: 17.38, unit: "m²" },
                    { id: '11-4-01-v2', label: "50mm tebal (Tuang Disitu)", rate: 25.25, unit: "m²" },
                    { id: '11-4-01-v3', label: "75mm tebal (Ready Mix)", rate: 26.07, unit: "m²" },
                    { id: '11-4-01-v4', label: "75mm tebal (Tuang Disitu)", rate: 37.99, unit: "m²" },
                    { id: '11-4-01-v5', label: "100mm tebal (Ready Mix)", rate: 34.77, unit: "m²" },
                    { id: '11-4-01-v6', label: "100mm tebal (Tuang Disitu)", rate: 50.61, unit: "m²" },
                    { id: '11-4-01-v7', label: "150mm tebal (Ready Mix)", rate: 52.14, unit: "m²" },
                    { id: '11-4-01-v8', label: "150mm tebal (Tuang Disitu)", rate: 75.85, unit: "m²" },
                    { id: '11-4-01-v9', label: "200mm tebal (Ready Mix)", rate: 69.52, unit: "m²" },
                    { id: '11-4-01-v10', label: "200mm tebal (Tuang Disitu)", rate: 101.10, unit: "m²" }
                ]
            }
        ]
    },
    // --- CATEGORY: PEJALAN KAKI ---
    {
        id: 'G-PK-1',
        title: 'KERJA-KERJA PENYEDIAAN DASAR (BASE)',
        category: 'Pejalan Kaki',
        items: [
            {
                id: 'PK-1-01',
                description: 'Kerja-kerja membekal dan memadat batu baur hancur (Crusher Run) sebagai bahan dasar jalan (Road Base) yang setara dan diluluskan dengan ketebalan :-',
                variants: [
                    { id: 'PK-1-01-v1', label: '150mm', rate: 15.51, unit: 'm²' },
                    { id: 'PK-1-01-v2', label: '300mm', rate: 31.03, unit: 'm²' }
                ]
            },
            {
                id: 'PK-1-02',
                description: 'Kerja-kerja membekal dan memadat batu baur hancur (Crusher Run) sebagai bahan dasar jalan (Road Base) yang setara dan diluluskan.',
                rate: 102.85,
                unit: 'm³'
            },
            {
                id: 'PK-1-03',
                description: 'Kerja-kerja membekal dan memadat pasir sebagai bahan dasar (Sub Base) yang setara dan diluluskan.',
                variants: [
                    { id: 'PK-1-03-v1', label: '25mm', rate: 3.50, unit: 'm²' },
                    { id: 'PK-1-03-v2', label: '50mm', rate: 7.00, unit: 'm²' },
                    { id: 'PK-1-03-v3', label: '75mm', rate: 10.50, unit: 'm²' }
                ]
            }
        ]
    },
    {
        id: 'G-PK-2',
        title: 'INTERLOCKING CONCRETE PAVING',
        category: 'Pejalan Kaki',
        items: [
            {
                id: 'PK-2-01',
                description: 'Kerja-kerja membekal dan membina Interlocking Concrete Paving Units diturap di atas lapisan permukaan lapisan pasir setebal 30mm dan ruang di antara unit turapan diisi dengan pasir halus dengan ketebalan :-',
                variants: [
                    { id: 'PK-2-01-v1', label: '60mm', rate: 85.14, unit: 'm²' },
                    { id: 'PK-2-01-v2', label: '80mm', rate: 110.07, unit: 'm²' }
                ]
            },
            {
                id: 'PK-2-02',
                description: 'Kerja-kerja membuka dan memasang semula Interlocking Concrete Paving Units diturap di atas lapisan permukaan lapisan pasir setebal 50mm dan ruang di antara unit turapan diisi dengan pasir halus.',
                rate: 7.95,
                unit: 'm²'
            },
            {
                id: 'PK-2-03',
                description: 'Kerja-kerja membekal dan membina Grass Interlocking Concrete Paving Units diturap di atas lapisan permukaan lapisan pasir setebal 30mm dan ruang di antara unit turapan diisi dengan pasir halus dengan ketebalan :-',
                variants: [
                    { id: 'PK-2-03-v1', label: '60mm', rate: 78.30, unit: 'm²' },
                    { id: 'PK-2-03-v2', label: '80mm', rate: 96.50, unit: 'm²' }
                ]
            }
        ]
    },
    {
        id: 'G-PK-3',
        title: 'LALUAN (OKU)',
        category: 'Pejalan Kaki',
        items: [
            {
                id: 'PK-3-01',
                description: 'Kerja-kerja membekal dan memasang jubin dari jenis Indoor Tactile (Line for Direction & Stud/Dome for Hazard Warning ukuran 300mm x 300mm. Kerja-kerja termasuk memecah mebuang jubin atau permukaan lantai sedia ada dan kerja-kerja skrid turapan simen dan pasir 1:3 untuk menerima jubin baru.',
                rate: 74.80,
                unit: 'Nos'
            }
        ]
    },

    // --- CATEGORY: SCUPPER DRAIN ---
    {
        id: 'SD-1',
        title: 'PEMBINAAN SCUPPER DRAIN',
        category: 'Scupper Drain',
        items: [
            {
                id: 'SD-1-01',
                description: 'Kerja-kerja pembinaan Scupper Drain menggunakan longkang separuh bulat jenis tembikar bergilap (HRGW) 225mm x 225mm termasuk Lean Concrete , konkrit lantai dan BRC B7 sebagai asas serta tembok menggunakan konkrit (100mm) tebal harga termasuk kerja-kerja penggalian, timbus semula tanah dan membina laluan air masuk bersaiz 335mm x 160mm.',
                rate: 141.60,
                unit: 'm'
            },
            {
                id: 'SD-1-02',
                description: 'Kerja-kerja pembinaan Scupper Drain Tanpa longkang separuh bulat termasuk konkrit lantai dan BRC B7 sebagai asas serta tembok menggunakan konkrit (100mm) tebal harga termasuk kerja-kerja penggalian, timbus semula tanah dan membina laluan air masuk bersaiz 335mm x 160mm.',
                rate: 121.01,
                unit: 'm'
            },
            {
                id: 'SD-1-03',
                description: 'Kerja-kerja pembinaan Scupper Drain menggunakan paip PVC bersaiz 225mm diameter termasuk kerja-kerja pengalian, timbus semula tanah dan membina laluan air masuk bersaiz 335mm x 160mm.',
                rate: 107.99,
                unit: 'm'
            }
        ]
    },
    {
        id: 'SD-2',
        title: 'CATCH PIT',
        category: 'Scupper Drain',
        items: [
            {
                id: 'SD-2-01',
                description: 'Kerja-kerja membekal dan memasang Catch Pit bersaiz 450mm (H) x 350mm (W) x 700mm (L) beserta penutup jenis Hot Dip Galvanized termasuk kerja penggalian ke aras yang ditetapkan.',
                rate: 448.80,
                unit: 'Nos'
            },
            {
                id: 'SD-2-02',
                description: 'Kerja-kerja membekal dan memasang Catch Pit bersaiz 445mm (H) x 280mm (W) x 495mm (L) beserta penutup jenis Hot Dip Galvanized termasuk kerja penggalian ke aras yang ditetapkan.',
                rate: 376.04,
                unit: 'Nos'
            }
        ]
    },
    {
        id: 'SD-3',
        title: 'PERFORATED SUBSOIL DRAIN',
        category: 'Scupper Drain',
        items: [
            {
                id: 'SD-3-01',
                description: 'Kerja-kerja membekal dan memasang Perforated Subsoil Drain bersaiz 150mm diameter serta kerja-kerja berkaitan dan mengikut arahan Pegawai Penguasa.',
                rate: 22.27,
                unit: 'm'
            }
        ]
    },
    {
        id: 'SD-4',
        title: 'EMBANKMENT SHOULDER DRAIN',
        category: 'Scupper Drain',
        items: [
            {
                id: 'SD-4-01',
                description: 'Kerja-kerja membekal dan memasang longkang jenis Embankment Shoulder Drain termasuk kerja-kerja penggalian dan konkrit 1:2:4 - 19mm agg sebagai asas bersaiz 500mm (W) x 1000mm (L) x 200mm (H)',
                rate: 103.32,
                unit: 'm'
            }
        ]
    },
    {
        id: 'SD-5',
        title: 'SALIRAN AIR HUJAN',
        category: 'Scupper Drain',
        items: [
            {
                id: 'SD-5-01',
                description: 'Kerja-kerja menanggal & membuang 150mm diameter salur tegak air hujan mengikut BS 4576 dengan sambungan soket dan dipasang dengan bolt dan pendakap.',
                rate: 6.00,
                unit: 'm'
            },
            {
                id: 'SD-5-02',
                description: 'Kerja-kerja membekal & memasang 150mm diameter salur tegak air hujan mengikut BS 4576 dengan sambungan soket dan dipasang dengan bolt dan pendakap.',
                rate: 53.60,
                unit: 'm'
            },
            {
                id: 'SD-5-03',
                description: 'Tambahan untuk liku',
                rate: 31.20,
                unit: 'Nos'
            }
        ]
    },
    {
        id: 'SD-6',
        title: 'KERJA PAIP',
        category: 'Scupper Drain',
        items: [
            {
                id: 'SD-6-01',
                description: 'Kerja-kerja membekal & memasang paip jenis Polivinil Klorida Tak Plastik (UPVC) bagi kerja-kerja berkaitan dengan saiz :-',
                variants: [
                    { id: 'SD-6-01-v1', label: '100mm', rate: 25.33, unit: 'm' },
                    { id: 'SD-6-01-v2', label: '150mm', rate: 38.00, unit: 'm' },
                    { id: 'SD-6-01-v3', label: '200mm', rate: 50.66, unit: 'm' }
                ]
            }
        ]
    },

    {
        id: 'PRG-1',
        title: 'KERJA-KERJA MENGECAT HANDRAIL',
        category: 'Pagar, Railling & Guardrail',
        items: [
            {
                id: 'PRG-1-01',
                description: 'Membekal dan mengecat Handrail dengan menggunakan cat jenis Weathershield sebanyak 2 lapisan termasuk anti karat, membuang kekotoran lama, mengikut arahan Pegawai Penguasa serta kerja-kerja berkaitan.',
                rate: 23.38,
                unit: 'm²'
            }
        ]
    },
    {
        id: 'PRG-2',
        title: 'RAILLING /PAGAR KESELAMATAN',
        category: 'Pagar, Railling & Guardrail',
        items: [
            {
                id: 'PRG-2-01',
                description: 'Kerja-kerja membekal dan memasang panel susur tangan keluli lembut berukuran 38mmx 60mm (Frame) yang bersaiz 1.5m(l) x 0.9m(t) dan dikimpal dengan 11 batang besi berongga 25mm x 25mm secara menegak dengan jarak 150mm c/c dan termasuk besi berongga 60mm x 75mm dikimpal secara menegak dengan jarak 1m setiap satu termasuk kerja-kerja asas konkrit gred 20 berukuran 150mm x 150mm x 450mm setiap satu tiang dan mengecat 1 lapisan anti karat seterusnya 1 lapisan asas dan 2 lapisan akhir (Gloss Finish) disapu kepada semua permukaan. (Rujuk Lukisan).',
                rate: 293.25,
                unit: 'm'
            },
            {
                id: 'PRG-2-03',
                description: 'Kerja-kerja membekal dan memasang panel susur tangan keluli lembut berukuran 50mm diameter (Frame) yang bersaiz 2.0m(l) x 0.7m(t) dan dikimpal dengan 4 batang besi berongga 50mm diameter secara menegak dengan jarak 253mm c/c dan termasuk besi berongga 75mm diameter dikimpal secara menegak dengan jarak 1.125m setiap satu termasuk kerja-kerja asas konkrit gred 20 berukuran 300mm x 300mm x 450mm setiap satu tiang dan mengecat 1 lapisan anti karat seterusnya 1 lapisan asas dan 2 lapisan akhir (Gloss Finish) disapu kepada semua permukaan. (Rujuk Lukisan Type B).',
                rate: 469.20,
                unit: 'm'
            },
            {
                id: 'PRG-2-04',
                description: 'Kerja-kerja membekal dan memasang pagar bersaiz 2000mm x 1400mm disadur Hot Dipped Galvanised termasuk tiang Stainless Steel bersaiz 75 diameter diperkuat konkrit gred 20. (Rujuk Lukisan Terperinci).',
                rate: 680.00,
                unit: 'm'
            },
            {
                id: 'PRG-2-05',
                description: 'Kerja-kerja membekal dan memasang pagar bersaiz 3000mm x 1000mm disadur Hot Dipped Galvanised termasuk tiang bersaiz 38 diameter diperkuat konkrit Gred 20. (Rujuk Lukisan Spesifikasi).',
                rate: 552.50,
                unit: 'm'
            },
            {
                id: 'PRG-2-06',
                description: 'Kerja-kerja membersihkan tapak bina dari segala semak samun, kotoran hasil pembinaan termasuk membuka Railling sedia ada dan membawa keluar ke tapak pelupusan yang dibenarkan.',
                rate: 8.50,
                unit: 'm'
            }
        ]
    },
    {
        id: 'PRG-3',
        title: 'BRC FENCING',
        category: 'Pagar, Railling & Guardrail',
        items: [
            {
                id: 'PRG-3-01',
                description: 'Kerja-kerja membekal dan memasang sistem pagar BRC Fence dengan 5mm diameter jejaring halus dengan 50mm x 150mm serta disadur Hot Dipped Galvanised termasuk tiang bersaiz 75 diameter diperkuat konkrit gred 20 dengan panel pagar bersaiz :-',
                variants: [
                    { id: 'v1', label: '2400mm (w) x 900mm (h)', rate: 275.66, unit: 'm' },
                    { id: 'v2', label: '2400mm (w) x 1200mm (h)', rate: 366.56, unit: 'm' },
                    { id: 'v3', label: '2400mm (w) x 1500mm (h)', rate: 457.47, unit: 'm' }
                ]
            }
        ]
    },
    {
        id: 'PRG-4',
        title: 'GUARD RAIL',
        category: 'Pagar, Railling & Guardrail',
        items: [
            {
                id: 'PRG-4-01',
                description: 'Membekal dan memasang Standard Galvanised Steel Guardrail termasuk segala peralatan yang perlu untuk kerja dengan sempurna mengikut lukisan spesifikasi.',
                rate: 406.40,
                unit: 'm'
            },
            {
                id: 'PRG-4-02',
                description: 'Membekal dan memasang Standard Galvanised Steel Guardrail termasuk segala peralatan yang perlu untuk kerja dan perlu mengimpal bolt dan nut tersebut pada tiang guardrail dengan sempurna serta memasang pelekat reflector bersaiz 50mm x 50mm pada setiap jarak 3m c/c pada beam dan bersaiz 100mm x 250mm pada setiap tiang.',
                rate: 586.50,
                unit: 'm'
            }
        ]
    },
    {
        id: 'PRG-5',
        title: 'KERJA-KERJA MEMBEKAL DAN MEMASANG KOMPONEN PAGAR KESELAMATAN',
        category: 'Pagar, Railling & Guardrail',
        items: [
            {
                id: 'PRG-5-01',
                description: 'Kerja-kerja membekal dan memasang tiang keselamatan disalut dengan Galvanised termasuk konkrit gred 20.',
                rate: 255.00,
                unit: 'Nos'
            },
            {
                id: 'PRG-5-02',
                description: 'Kerja-kerja membekal dan memasang C-Packer keselamatan disalut dengan Galvanised termasuk Bolt dan Nut.',
                rate: 54.74,
                unit: 'Nos'
            },
            {
                id: 'PRG-5-03',
                description: 'Kerja-kerja membekal dan memasang Galvanised Rail keselamatan disalut dengan Galvanised termasuk Bolt dan Nut.',
                rate: 340.00,
                unit: 'Nos'
            },
            {
                id: 'PRG-5-04',
                description: 'Kerja-kerja membekal dan memasang Fish Tail/End keselamatan disalut dengan Galvanised termasuk Bolt dan Nut.',
                rate: 178.50,
                unit: 'Nos'
            }
        ]
    },
    {
        id: 'PRG-6',
        title: 'PAGAR CHAIN LINK',
        category: 'Pagar, Railling & Guardrail',
        items: [
            {
                id: 'PRG-6-01',
                description: 'Kerja-kerja membekal dan memasang pagar jejari berangkai 3.0mm tebal bersalut PVC dengan jejari berukuran 50 mm berbentuk berlian.',
                rate: 24.60,
                unit: 'm²'
            },
            {
                id: 'PRG-6-02',
                description: 'Kerja-kerja menanggal dan membuang pagar jejari berangkai 3.0mm tebal bersalut PVC dengan berukuran 50 mm berbentuk berlian.',
                rate: 1.30,
                unit: 'm²'
            },
            {
                id: 'PRG-6-03',
                description: 'Membekal dan memasang 4.06mm tebal dawai perenggang keluli tergalvani pada pagar.',
                rate: 1.20,
                unit: 'm'
            },
            {
                id: 'PRG-6-04',
                description: 'Membekal dan memasang keluli lembut bersudut dan berbentuk L atau T serta kerja-kerja lain termasuk konkrit pada bahagian bawah.',
                rate: 4.77,
                unit: 'm'
            }
        ]
    },
    {
        id: 'PRG-7',
        title: 'STABLE FENCING',
        category: 'Pagar, Railling & Guardrail',
        items: [
            {
                id: 'PRG-7-01',
                description: 'Kerja-kerja membekal dan memasang railing keselamatan jenis keluli lembut Galvanised berukuran 50mm diameter (2 lapisan) yang bersaiz 6m (L) x 1.2m (T) termasuk pemasangan tiang berukuran 50mm diameter. Tapak asas railing konkrit gred 25 dengan kedalaman 450mm.',
                rate: 322.58,
                unit: 'm'
            },
            {
                id: 'PRG-7-02',
                description: 'Kerja-kerja membekal dan memasang railing keselamatan jenis keluli lembut Galvanised berukuran 50mm diameter (3 lapisan) yang bersaiz 6m (L) x 1.2m (T) termasuk pemasangan tiang berukuran 50mm diameter. Tapak asas railing konkrit gred 25 dengan kedalaman 450mm.',
                rate: 430.10,
                unit: 'm'
            }
        ]
    },
    {
        id: 'PRG-8',
        title: 'BOLLARD',
        category: 'Pagar, Railling & Guardrail',
        items: [
            {
                id: 'PRG-8-01',
                description: 'Kerja-kerja membekal dan memasang tiang jenis concrete bollard 150 mm diameter termasuk memadat konkrit bertetulang Gred 15 untuk tapak asas.',
                rate: 450.50,
                unit: 'Nos'
            },
            {
                id: 'PRG-8-02',
                description: 'Kerja-kerja membekal dan memasang Bollard Stainless Steel Heavy Duty Metal (Dia) 76mm, 1000mm (H) serta kerja-kerja merangka mengimpal termasuk memotong/menggerudi dengan kemasan lantai serta mengikut arahan pegawai penguasa.',
                rate: 212.50,
                unit: 'Nos'
            }
        ]
    },
    // --- CATEGORY: PALANG PENGHADANG ---
    {
        id: 'PP-1',
        title: 'TAPAK TIANG I-BEAM',
        category: 'Palang Penghadang',
        items: [
            {
                id: 'PP-1-01',
                description: 'Ukuran tapak asas berserta palang pengukuh bertetulang dengan 4 batang 12mm diameter bar keluli lembut dan 1.6mm dawai pengikat berjarak 300mm dan membuat lubang di tiang untuk memasang tiang.',
                variants: [
                    { id: 'PP-1-01-v1', label: '150mm x 150mm x 150mm', rate: 49.90, unit: 'Nos' },
                    { id: 'PP-1-01-v2', label: '200mm x 200mm x 200mm', rate: 77.95, unit: 'Nos' },
                    { id: 'PP-1-01-v3', label: '300mm x 300mm x 300mm', rate: 90.43, unit: 'Nos' },
                    { id: 'PP-1-01-v4', label: '450mm x 450mm x 300mm', rate: 96.02, unit: 'Nos' },
                    { id: 'PP-1-01-v5', label: '600mm x 600mm x 300mm', rate: 127.59, unit: 'Nos' }
                ]
            }
        ]
    },
    {
        id: 'PP-2',
        title: 'TIANG I-BEAM',
        category: 'Palang Penghadang',
        items: [
            {
                id: 'PP-2-01',
                description: 'Membekal, mengimpal dan memasang tiang I-Beam termasuk kerja-kerja bolt dan nut dan aksesori berkaitan pada tapak asas.',
                variants: [
                    { id: 'PP-2-01-v1', label: '100mm x 100mm x 6mm x 8m', rate: 2258.03, unit: 'Nos' },
                    { id: 'PP-2-01-v2', label: '125mm x 125mm x 7mm x 9m', rate: 2526.84, unit: 'Nos' },
                    { id: 'PP-2-01-v3', label: '150mm x 150mm x 7mm x 10m', rate: 2795.65, unit: 'Nos' },
                    { id: 'PP-2-01-v4', label: '175mm x 175mm 7.5mm x 11m', rate: 3064.46, unit: 'Nos' },
                    { id: 'PP-2-01-v5', label: '200mm x 200mm x 8mm x 12 m', rate: 3333.28, unit: 'Nos' },
                    { id: 'PP-2-01-v6', label: '250mm x 250mm x 9mm 14m', rate: 3870.90, unit: 'Nos' },
                    { id: 'PP-2-01-v7', label: '300mm x 300mm x 10mm x 15m', rate: 4139.71, unit: 'Nos' },
                    { id: 'PP-2-01-v8', label: '350mm x 350mm x 12mm x 19m', rate: 5214.96, unit: 'Nos' },
                    { id: 'PP-2-01-v9', label: '400mm x 400mm x 13mm x 21m', rate: 5752.59, unit: 'Nos' }
                ]
            }
        ]
    },
    {
        id: 'PP-3',
        title: 'BESI PENGHADANG/HAD KETINGGIAN',
        category: 'Palang Penghadang',
        items: [
            {
                id: 'PP-3-01',
                description: 'Kerja-kerja membekal dan memasang serta mendirikan besi penghadang jenis I-Beam termasuk kerja-kerja bolt, nut dan aksesori berkaitan.',
                variants: [
                    { id: 'PP-3-01-v1', label: '100mm x 100mm x 6mm', rate: 376.34, unit: 'm' },
                    { id: 'PP-3-01-v2', label: '125mm x 125mm x 7mm', rate: 421.50, unit: 'm' },
                    { id: 'PP-3-01-v3', label: '150mm x 150mm x 7mm', rate: 451.61, unit: 'm' },
                    { id: 'PP-3-01-v4', label: '175mm x 175mm 7.5mm', rate: 481.71, unit: 'm' },
                    { id: 'PP-3-01-v5', label: '200mm x 200mm x 8mm', rate: 511.82, unit: 'm' },
                    { id: 'PP-3-01-v6', label: '250mm x 250mm x 9mm', rate: 541.93, unit: 'm' },
                    { id: 'PP-3-01-v7', label: '300mm x 300mm x 10mm', rate: 572.03, unit: 'm' },
                    { id: 'PP-3-01-v8', label: '350mm x 350mm x 12mm', rate: 602.14, unit: 'm' },
                    { id: 'PP-3-01-v9', label: '400mm x 400mm x 13mm', rate: 632.25, unit: 'm' }
                ]
            }
        ]
    },
    // --- CATEGORY: SUSUR JALAN (ROAD KERB) ---
    {
        id: 'KERB-1',
        title: 'KERJA-KERJA MENGECAT SUSUR JALAN (KERB) DAN PERABOT JALAN',
        category: 'Susur Jalan (Road Kerb)',
        items: [
            {
                id: 'K1-01',
                description: 'Membekal dan mengecat susur jalan dengan menggunakan cat jenis Weathershield sebanyak 2 lapisan termasuk membuang kekotoran lama dengan scrapper bersama kerja-kerja pembersihan mengikut arahan Pegawai Penguasa serta kerja-kerja berkaitan.',
                rate: 17.96,
                unit: 'm²'
            }
        ]
    },
    {
        id: 'KERB-2',
        title: 'SUSUR JALAN (ROAD KERB)',
        category: 'Susur Jalan (Road Kerb)',
        items: [
            {
                id: 'K2-01',
                description: 'Menanggal dan membuang susur jalan sedia ada.',
                rate: 3.40,
                unit: 'm'
            },
            {
                id: 'K2-02',
                description: 'Membekal dan memasang susur jalan dari konkrit pra tuang (1:2:4-20mm) dengan satu permukaan condong 100mm x 300mm termasuk tapak konkrit (1:3:6-38mm) 375mm lebar x 50mm tebal diperkukuh dihadapan dan belakang dengan konkrit yang sama disapu cat jenis Weathershield berwarna.',
                rate: 31.80,
                unit: 'm'
            },
            {
                id: 'K2-03',
                description: 'Kerja-kerja membekal dan memasang 150mm x 300mm tinggi susur jalan dari konkrit tuang disitu Extruded Kerb (1:2:4-20mm) termasuk tapak konkrit (1:3:6-38mm) 375mm lebar x 50mm tebal diperkukuhkan di hadapan dan belakang dengan konkrit yang sama.',
                rate: 52.60,
                unit: 'm'
            },
            {
                id: 'K2-04',
                description: 'Kerja-kerja membekal dan memasang 150mm x 450mm tinggi susur jalan dari konkrit tuang disitu Extruded Kerb (1:2:4-20mm) termasuk tapak konkrit (1:3:6-38mm) 375mm lebar x 50mm tebal diperkukuhkan di hadapan dan belakang dengan konkrit yang sama.',
                rate: 78.90,
                unit: 'm'
            },
            {
                id: 'K2-05',
                description: 'Kerja-kerja membekal dan memasang 400mm x 600mm tinggi susur jalan dari konkrit tuang disitu Extruded Kerb (1:2:4-20mm) termasuk tapak konkrit (1:3:6-38mm) 375mm lebar x 50mm tebal diperkukuhkan di hadapan dan belakang dengan konkrit yang sama.',
                rate: 91.80,
                unit: 'm'
            }
        ]
    },
    {
        id: 'KERB-3',
        title: 'MENANAM RUMPUT',
        category: 'Susur Jalan (Road Kerb)',
        items: [
            {
                id: 'K3-01',
                description: 'Kerja-kerja membekal dan menanam rumput secara bertompok pada jarak 600mm dari satu sama lain, dibenam sedalam 25mm kekawasan dalam tanah dan hendaklah di tanam di terbuka seperti yang di arahkan oleh pegawai penguasa termasuk pembajaan.',
                rate: 9.70,
                unit: 'm²'
            },
            {
                id: 'K3-02',
                description: 'Kerja-kerja membekal dan menanam rumput secara rapat, dibenam sedalam 25mm kekawasan dalam tanah dan hendaklah ditanam secara terbuka seperti yang di arahkan oleh Pegawai Penguasa termasuk pembajaan.',
                rate: 20.10,
                unit: 'm²'
            }
        ]
    },

    // --- CATEGORY: PELBAGAI ---
    {
        id: 'PEL-1',
        title: 'CERMIN KESELAMATAN',
        category: 'Pelbagai',
        items: [
            {
                id: 'PEL-1-01',
                description: 'Kerja-kerja membekal dan memasang cermin keselamatan dengan tiang besi 100mm Diameter berketinggian 2.4m dari paras permukaan tanah/jalan termasuk kerja-kerja 450mm kedalaman asas konkrit.',
                variants: [
                    { id: 'PEL-1-01-v1', label: "600mm diameter", rate: 1147.50, unit: "Nos" },
                    { id: 'PEL-1-01-v2', label: "800mm diameter", rate: 1343.00, unit: "Nos" },
                    { id: 'PEL-1-01-v3', label: "1000mm diameter", rate: 1538.50, unit: "Nos" }
                ]
            }
        ]
    },
    {
        id: 'PEL-2',
        title: 'ELASTIC POLE',
        category: 'Pelbagai',
        items: [
            { id: 'PEL-2-01', description: 'Kerja-kerja membekal dan memasang Elastic Pole PU-Heavy Duty mengikut arahan pegawai penguasa.', rate: 168.30, unit: 'Nos' },
            { id: 'PEL-2-02', description: 'Kerja-kerja membekal dan memasang Rubber Lane Block Heavy Duty with flexible post mengikut arahan pegawai penguasa.', rate: 204.00, unit: 'Nos' },
            { id: 'PEL-2-03', description: 'Kerja-kerja menyediakan, membekal dan memasang pelekat pantulan cahaya lengkap plat besi dan diboltkan.', rate: 5.61, unit: 'Nos' }
        ]
    },
    {
        id: 'PEL-3',
        title: 'ROAD STUD',
        category: 'Pelbagai',
        items: [
            { id: 'PEL-3-01', description: 'Kerja-kerja menanggal Road Stud sedia ada/rosak.', rate: 9.35, unit: 'Nos' },
            { id: 'PEL-3-02', description: 'Kerja-kerja membekal dan memasang Road Stud dari jenis Single Sided mengikut spesifikasi seperti arahan pegawai penguasa.', rate: 54.79, unit: 'Nos' },
            { id: 'PEL-3-03', description: 'Kerja-kerja membekal dan memasang Road Stud dari jenis Double Sided mengikut spesifikasi seperti arahan pegawai penguasa.', rate: 61.80, unit: 'Nos' }
        ]
    },
    {
        id: 'PEL-4',
        title: 'SOLAR FLASHING LIGHT',
        category: 'Pelbagai',
        items: [
            { id: 'PEL-4-01', description: 'Kerja-kerja membekal dan memasang Aspect-Solar Flashing Light c/w Solar Panel bersaiz 300 mm bersama aksesori berkaitan dan tiang sadur Hot Dip Galvanised.', rate: 2248.25, unit: 'Nos' }
        ]
    },
    {
        id: 'PEL-5',
        title: 'MILD STEEL PLATE',
        category: 'Pelbagai',
        items: [
            {
                id: 'PEL-5-01',
                description: 'Kerja-kerja membekal, memasang dan membuka semula Mild Steel Plate 10mm tebal sebagai perlindungan sementara kepada dasar jalan/pembentung mengikut arahan pegawai penguasa.',
                variants: [
                    { id: 'PEL-5-01-v1', label: "1200mm x 1200mm", rate: 806.44, unit: "Nos" },
                    { id: 'PEL-5-01-v2', label: "1200mm x 2400mm", rate: 1290.30, unit: "Nos" },
                    { id: 'PEL-5-01-v3', label: "1500mm x 3000mm", rate: 1881.69, unit: "Nos" }
                ]
            }
        ]
    },
    {
        id: 'PEL-6',
        title: 'PERABOT JALAN',
        category: 'Pelbagai',
        items: [
            { id: 'PEL-6-01', description: 'Membekal dan mengecat dengan menggunakan cat jenis Weathershield sebanyak 2 lapisan termasuk anti karat, membuang kekotoran lama, dengan scrapper bersama kerja-kerja pembersihan mengikut arahan Pegawai Penguasa serta kerja-kerja berkaitan.', rate: 30.86, unit: 'm²' },
            { id: 'PEL-6-02', description: 'Kerja-kerja membuang kekotoran lama pada perabot jalan dengan scrapper bersama kerja-kerja pembersihan mengikut arahan Pegawai Penguasa serta kerja-kerja berkaitan.', rate: 18.70, unit: 'm²' }
        ]
    },
    {
        id: 'PEL-7',
        title: 'CONCRETE ROAD BARRIER',
        category: 'Pelbagai',
        items: [
            { id: 'PEL-7-01', description: 'Kerja-kerja membekal dan memasang Precast Concrete Barrier bersaiz (200mm, 580mm) x 860mm x 1000mm dicat warna hitam dan kuning beserta logo MPS mengikut arahan Pegawai Penguasa.', rate: 327.25, unit: 'Nos' },
            { id: 'PEL-7-02', description: 'Kerja-kerja membekal dan memasang Precast Concrete Barrier bersaiz (150mm, 450mm) x 800mm x 2000mm dicat warna hitam dan kuning beserta logo MPS mengikut arahan Pegawai Penguasa.', rate: 514.25, unit: 'Nos' }
        ]
    },
    {
        id: 'PEL-8',
        title: 'KADAR UPAH BURUH',
        category: 'Pelbagai',
        items: [
            {
                id: 'PEL-8-01',
                description: 'Menyediakan tenaga buruh bagi melaksanakan kerja-kerja am yang berkaitan :-',
                variants: [
                    { id: 'PEL-8-01-v1', label: "Tukang Besi/Kimpal", rate: 130.05, unit: "Hari" },
                    { id: 'PEL-8-01-v2', label: "Tukang Cat", rate: 110.50, unit: "Hari" },
                    { id: 'PEL-8-01-v3', label: "Tukang Paip", rate: 120.70, unit: "Hari" },
                    { id: 'PEL-8-01-v4', label: "Buruh Am", rate: 90.10, unit: "Hari" }
                ]
            }
        ]
    },
    {
        id: 'PEL-9',
        title: 'KERJA-KERJA PEMBERSIHAN',
        category: 'Pelbagai',
        items: [
            { id: 'PEL-9-01', description: 'Kerja-kerja membersih longkang konkrit sedia ada dengan kaedah menggali dan membuang bahan buangan/sisa korekan/bahan binaan sedia ada menggunakan peralatan/jentera yang bersesuaian termasuk membuang sisa ke tempat yang dibenarkan oleh Pegawai Penguasa.', rate: 26.60, unit: 'm³' },
            { id: 'PEL-9-02', description: 'Kerja-kerja membersih semak samun dengan kaedah mencantas, mencabut tumbuhan-tumbuhan sedia ada menggunakan peralatan/jentera yang bersesuaian termasuk membuang sisa ke tempat yang dibenarkan oleh Pegawai Penguasa.', rate: 0.80, unit: 'm²' }
        ]
    },
    {
        id: 'PEL-10',
        title: 'BOOM GATE',
        category: 'Pelbagai',
        items: [
            { id: 'PEL-10-01', description: 'Kerja-kerja membekal, mengimpal dan memasang tiang I-Beam 100mm x 100mm x 6mm (tidak melebihi 2.8m) dan palang pengadang diameter 75mm (tidak melebihi 4.5m) termasuk kerja-kerja bolt, nut dan aksesori berkaitan pada tapak asas dan disadur dengan Hot Dipped Galvanized M.S.', rate: 3450.58, unit: 'Nos' }
        ]
    },
    {
        id: 'PEL-11',
        title: 'FLAP GATE',
        category: 'Pelbagai',
        items: [
            { id: 'PEL-11-01', description: 'Kerja-kerja membekal dan memasang HDPE Flap Gate berbentuk segi empat tepat yang berukuran 900mm x 900mm termasuk segala aksesori kelengkapan pemasangan', rate: 5950.00, unit: 'Nos' },
            { id: 'PEL-11-02', description: 'Kerja-kerja membekal dan memasang HDPE Flap Gate yang berukuran 1000mm x 1000mm termasuk segala aksesori kelengkapan pemasangan', rate: 7650.00, unit: 'Nos' }
        ]
    },
    {
        id: 'PEL-12',
        title: 'LALUAN (OKU)',
        category: 'Pelbagai',
        items: [
            { id: 'PEL-12-01', description: 'Kerja-kerja membekal dan memasang jubin dari jenis Indoor Tactile (Line for Direction & Stud/Dome for Hazard Warning ukuran 300mm x 300mm. Kerja-kerja termasuk memecah mebuang jubin atau permukaan lantai sedia ada dan kerja-kerja skrid turapan simen dan pasir 1:3 untuk menerima jubin baru.', rate: 74.80, unit: 'Nos' }
        ]
    },

    {
        id: 'PT-1',
        title: 'PAPAN TANDA NAMA JALAN',
        category: 'Papan Tanda',
        items: [
            {
                id: 'PT-1-01',
                description: `Kerja-kerja membekal dan memasang papan tanda baru nama jalan (huruf depan & belakang) serta membuka semula papantanda sedia ada seperti spesifikasi berikut :-\n(a.) Board - 3.2mm thick Fibre Board\n(b.) Board Size - 1000mm x 270mm (Blue)\n(c.) Frame - 30mm x 38mm x 4mm S.H.S\n(d.) Font Sticker Backdrop - Oracle (White and Red)\n(e.) Emblem MPS Sticker Backdrop - 3M Reflective (Yellow)\n(f.) Font Sticker - 3M Engineering Grade (Reflected)\n(g.) Sticker Lining - 3M Engineering Grade (White Reflected)\n(h.) Post welded with plate (Hot Dipped Galvanized)\n     Post - 75mm (diameter) x 3m (embedded 0.425m)\n     Plate - 250mm(L) x 250mm(W) x 5mm(D)\n(i.) Emblem - 150mm x 150mm Transparent Sheet Silk Screen Coloured\n(j.) Angle Iron Bracket - 38mm x 38mm (Hot Dipped Galvanized)\n(k.) Dome & Ring - 75mm diameter (Hot Dipped Galvanized)\n(l.) Footing Size - 250mm(L) x 250mm (W) x 425mm (D)\n(m) Kaedah Penanaman - Penggunaan Mesin Gerudi dengan Saiz Korekan 250mm\n     atau Precast Concrete bersaiz 250mm(L) x 250mm (W) x 425mm (D)\n(Rujuk Lukisan Spesifikasi - sila dapatkan lukisan daripada Jabatan Kejuruteraan)\nTermasuk mengecat keseluruhan permukaan tiang dan papan tanda dengan cat anti pelekat sebanyak 2 lapisan.\nJALAN MEDAN BATU CAVES (contoh)`,
                rate: 591.39,
                unit: 'Nos'
            }
        ]
    },
    {
        id: 'PT-2',
        title: 'PAPAN TANDA NAMA TAMAN',
        category: 'Papan Tanda',
        items: [
            {
                id: 'PT-2-01',
                description: `Kerja-kerja membekal dan memasang papan tanda baru nama taman termasuk mengecat keseluruhan permukaan tiang dan papan tanda dengan cat anti pelekat sebanyak 2 lapisan serta membuka semula papan tanda sedia ada dan membuang sisa di tempat yang dibenarkan oleh pegawai penguasa.\nTAMAN MEDAN BATU CAVES (contoh)\n(Rujuk lukisan spesifikasi) - sila dapatkan dari jabatan kejuruteraan sekiranya tidak dilampirkan.`,
                rate: 4838.63,
                unit: 'Nos'
            },
            {
                id: 'PT-2-02',
                description: `Kerja-kerja membekal dan memasang papan tanda baru nama taman termasuk segala aksesori berkaitan serta membuka semula papan tanda sedia ada dan membuang sisa di tempat yang dibenarkan oleh pegawai penguasa\nTAMAN MEDAN BATU CAVES (contoh)\n(Rujuk lukisan spesifikasi) - sila dapatkan dari jabatan kejuruteraan sekiranya tidak dilampirkan.`,
                rate: 6800.00,
                unit: 'Nos'
            },
            {
                id: 'PT-2-03',
                description: `Membekal dan mengecat struktur papan tanda dengan menggunakan cat jenis Weathershield' sebanyak 2 lapisan termasuk anti karat, membuang kekotoran lama dengan scrapper serta mengikut arahan pegawai penguasa serta kerja-kerja berkaitan.`,
                rate: 187.00,
                unit: 'Nos'
            },
            {
                id: 'PT-2-04',
                description: `Membekal dan memasang papan tanda menggunakan bahan aluminium composite bagi kedua-dua bahagian depan dan belakang termasuk kerja-kerja mengimpal, memasang bingkai, klip, bolt dan nut serta kerja-kerja lain yang berkaitan.`,
                rate: 1065.90,
                unit: 'Nos'
            }
        ]
    },
    {
        id: 'PT-3',
        title: 'PAPAN TANDA PEMBERITAHUAN',
        category: 'Papan Tanda',
        items: [
            {
                id: 'PT-3-01',
                description: `Membekal dan memasang papantanda aluminium composite termasuk kerja-kerja mengimpal, memasang bingkai, klip, bolt dan nut serta kerja-kerja lain yang berkaitan menggunakan kepingan Diamond Grade Reflective seperti spesifikasi berikut :-\n(a.) Board - 3.2mm thick Fibre Board/Archylic\n(b.) Frame - 38mm x 4mm S.H.S\n(c.) Sticker Backdrop Huruf - 3M Diamond Reflected\n(d.) Sticker Backdrop Logo - 3M Diamond Reflected\n(e.) Sticker Huruf - 3M Engineering Grade (Reflected)\n(f.) Sticker Lining - 3M Engineering Grade (Reflected)\n(g.) Post welded with plate (Hot Dipped Galvanized)\n     Post - 200mm (diameter) x 4m (embedded 0.425m) - 2 nos\n     Plate - 300mm(L) x 300mm(W) x 5mm(D)\n(h.) Bracket Riveted - Gold\n(i.) Footing Size - 350mm(L) x 350mm (W) x 450mm (D)\n(j) Kaedah Penanaman - Penggunaan Mesin Gerudi dengan Saiz Korekan 350mm\n     atau Precast Concrete bersaiz 350mm(L) x 350mm (W) x 425mm (D)\n(Rujuk Lukisan Spesifikasi - sila dapatkan lukisan daripada Jabatan Kejuruteraan)\nTermasuk mengecat keseluruhan permukaan tiang dan papan tanda dengan cat anti pelekat sebanyak 2 lapisan.`,
                rate: 680.00,
                unit: 'm²'
            }
        ]
    },
    {
        id: 'PT-4',
        title: 'PAPAN TANDA KESELAMATAN/PEMBERITAHUAN JALAN RAYA',
        category: 'Papan Tanda',
        items: [
            {
                id: 'PT-4-01',
                description: `Kerja-kerja membekal dan memasang papan tanda baru serta membuka semula membuka semula papan tanda sedia ada, mengikut spesifikasi berikut dan arahan pegawai penguasa :-\n(a.) Sticker Backdrop dan Logo dari jenis 3M Diamond Reflected\n(b.) Board 3.2mm Fibre Board/Archylic\n(c.) Post welded with plate (Hot Dipped Galvanized)\n     Post - 75mm (diameter) x 3m (embedded 0.425m)\n     Plate - 250mm(L) x 250mm(W) x 5mm(D)\n(d.) Sticker Lining - 3M Engineering Grade\n(e.) Sticker Font/Symbol - 3M Engineering Grade\n(g) Footing Size - 250mm(L) x 250mm (W) x 425mm (D)\n(h) Kaedah Penanaman - Penggunaan Mesin Gerudi dengan Saiz Korekan 250mm\n     atau Precast Concrete bersaiz 250mm(L) x 250mm (W) x 425mm (D)\n(i) Jenis 1 tiang / 2 papan (pengurangan RM 120 bagi set ini)`,
                variants: [
                    { id: 'PT-4-01-v1', label: "BONGGOL - Size 600mm x 600mm", rate: 587.10, unit: "Nos" },
                    { id: 'PT-4-01-v2', label: "BERHENTI - Size 600mm x 600mm", rate: 587.10, unit: "Nos" },
                    { id: 'PT-4-01-v3', label: "DILARANG MASUK - Size 600mm x 600mm", rate: 587.10, unit: "Nos" },
                    { id: 'PT-4-01-v4', label: "U TURN - Size 600mm x 600mm", rate: 587.10, unit: "Nos" },
                    { id: 'PT-4-01-v5', label: "JALAN MATI - Size 750mm x 600mm", rate: 593.56, unit: "Nos" },
                    { id: 'PT-4-01-v6', label: "CHEVRON - Size 750mm x 600mm", rate: 593.56, unit: "Nos" },
                    { id: 'PT-4-01-v7', label: "SEHALA - Size 600mm x 600mm", rate: 587.10, unit: "Nos" },
                    { id: 'PT-4-01-v8', label: "LALUAN BASIKAL - Size 600mm x 600mm", rate: 587.10, unit: "Nos" },
                    { id: 'PT-4-01-v9', label: "BULATAN DI HADAPAN - Size 600mm x 600mm", rate: 587.10, unit: "Nos" },
                    { id: 'PT-4-01-v10', label: "LAMPU ISYARAT - Size 600mm x 600mm & 300mm x 900mm", rate: 625.80, unit: "Nos" },
                    { id: 'PT-4-01-v11', label: "KANAK-KANAK MELINTAS - Size 600mm x 600mm", rate: 587.10, unit: "Nos" },
                    { id: 'PT-4-01-v12', label: "HAIWAN MELINTAS - Size 600mm x 600mm", rate: 587.10, unit: "Nos" },
                    { id: 'PT-4-01-v13', label: "PENANDA HALANGAN - Size 900mm x 300mm", rate: 451.61, unit: "Nos" },
                    { id: 'PT-4-01-v14', label: "DLL - Size 600mm x 600mm", rate: 587.10, unit: "Nos" }
                ]
            },
            {
                id: 'PT-4-02',
                description: `Kerja-kerja membekal dan memasang papan tanda baru serta membuka semula membuka semula papan tanda sedia ada, mengikut spesifikasi berikut dan arahan pegawai penguasa :-\n(a.) Sticker Backdrop dan Logo dari jenis 3M Diamond Reflected\n(b.) Board 3.2mm Fibre Board/Archylic (2 bahagian)\n(c.) Post welded with plate (Hot Dipped Galvanized)\n     Post - 75mm (diameter) x 3m (embedded 0.425m)\n     Plate - 150mm(L) x 150mm(W) x 5mm(D)\n(d.) Sticker Lining - 3M Engineering Grade\n(e.) Sticker Font/Symbol - 3M Engineering Grade\n(f.) Footing Size - 250mm(L) x 250mm (W) x 425mm (D)\n(i) Kaedah Penanaman - Penggunaan Mesin Gerudi dengan Saiz Korekan 250mm\n     atau Precast Concrete bersaiz 250mm(L) x 250mm (W) x 425mm (D)`,
                variants: [
                    { id: 'PT-4-02-v1', label: "BONGGOL - Size 600mm x 600mm", rate: 704.52, unit: "Nos" },
                    { id: 'PT-4-02-v2', label: "BERHENTI - Size 600mm x 600mm", rate: 704.52, unit: "Nos" },
                    { id: 'PT-4-02-v3', label: "DILARANG MASUK - Size 600mm x 600mm", rate: 704.52, unit: "Nos" },
                    { id: 'PT-4-02-v4', label: "U TURN - Size 600mm x 600mm", rate: 704.52, unit: "Nos" },
                    { id: 'PT-4-02-v5', label: "JALAN MATI - Size 750mm x 600mm", rate: 712.25, unit: "Nos" },
                    { id: 'PT-4-02-v6', label: "CHEVRON - Size 750mm x 600mm", rate: 712.25, unit: "Nos" },
                    { id: 'PT-4-02-v7', label: "SEHALA - Size 600mm x 600mm", rate: 704.52, unit: "Nos" },
                    { id: 'PT-4-02-v8', label: "LALUAN BASIKAL - Size 600mm x 600mm", rate: 704.52, unit: "Nos" },
                    { id: 'PT-4-02-v9', label: "BULATAN DI HADAPAN - Size 600mm x 600mm", rate: 704.52, unit: "Nos" },
                    { id: 'PT-4-02-v10', label: "LAMPU ISYARAT - Size 600mm x 600mm & 300mm x 900mm", rate: 751.21, unit: "Nos" },
                    { id: 'PT-4-02-v11', label: "KANAK-KANAK MELINTAS - Size 600mm x 600mm", rate: 704.52, unit: "Nos" },
                    { id: 'PT-4-02-v12', label: "HAIWAN MELINTAS - Size 600mm x 600mm", rate: 704.52, unit: "Nos" },
                    { id: 'PT-4-02-v13', label: "PENANDA HALANGAN - Size 900mm x 300mm", rate: 456.93, unit: "Nos" },
                    { id: 'PT-4-02-v14', label: "DLL - Size 600mm x 600mm", rate: 704.52, unit: "Nos" }
                ]
            },
            {
                id: 'PT-4-03',
                description: `Kerja-kerja membekal dan memasang papan tanda baru serta membuka semula membuka semula papan tanda sedia ada, mengikut spesifikasi berikut dan arahan pegawai penguasa :-\n(a.) Sticker Backdrop dan Logo dari jenis 3M Diamond Reflected\n(b.) Board 3.2mm Fibre Board/Archylic\n(c.) Post welded with plate (Hot Dipped Galvanized)\n     Post - 50mm (diameter) x 3m (embedded 0.425m)\n     Plate - 150mm(L) x 150mm(W) x 5mm(D)\n(d.) Sticker Lining - 3M Engineering Grade\n(e.) Sticker Font/Symbol - 3M Engineering Grade\n(f.) Footing Size - 150mm(L) x 150mm (W) x 425mm (D)\n(i) Kaedah Penanaman - Penggunaan Mesin Gerudi dengan Saiz Korekan 250mm\n     atau Precast Concrete bersaiz 150mm(L) x 150mm (W) x 425mm (D)`,
                variants: [
                    { id: 'PT-4-03-v1', label: "BONGGOL - Size 300mm x 300mm", rate: 440.33, unit: "Nos" },
                    { id: 'PT-4-03-v2', label: "BERHENTI - Size 300mm x 300mm", rate: 440.33, unit: "Nos" },
                    { id: 'PT-4-03-v3', label: "DILARANG MASUK - Size 300mm x 300mm", rate: 440.33, unit: "Nos" },
                    { id: 'PT-4-03-v4', label: "U TURN - Size 300mm x 300mm", rate: 440.33, unit: "Nos" },
                    { id: 'PT-4-03-v5', label: "JALAN MATI - Size 375mm x 300mm", rate: 445.16, unit: "Nos" },
                    { id: 'PT-4-03-v6', label: "CHEVRON - Size 375mm x 300mm", rate: 445.16, unit: "Nos" },
                    { id: 'PT-4-03-v7', label: "SEHALA - Size 300mm x 300mm", rate: 440.33, unit: "Nos" },
                    { id: 'PT-4-03-v8', label: "LALUAN BASIKAL - Size 300mm x 300mm", rate: 440.33, unit: "Nos" },
                    { id: 'PT-4-03-v9', label: "BULATAN DI HADAPAN - Size 300mm x 300mm", rate: 440.33, unit: "Nos" },
                    { id: 'PT-4-03-v10', label: "LAMPU ISYARAT - Size 300mm x 300mm & 150mm x 450mm", rate: 408.14, unit: "Nos" },
                    { id: 'PT-4-03-v11', label: "KANAK-KANAK MELINTAS - Size 300mm x 300mm", rate: 440.33, unit: "Nos" },
                    { id: 'PT-4-03-v12', label: "HAIWAN MELINTAS - Size 300mm x 300mm", rate: 440.33, unit: "Nos" },
                    { id: 'PT-4-03-v13', label: "PENANDA HALANGAN - Size 450mm x 150mm", rate: 338.70, unit: "Nos" },
                    { id: 'PT-4-03-v14', label: "DLL - Size 300mm x 300mm", rate: 440.33, unit: "Nos" }
                ]
            }
        ]
    },
    {
        id: 'PT-5',
        title: 'PAPAN TANDA PEMAKLUMAN DAN PEMBERITAHUAN',
        category: 'Papan Tanda',
        items: [
            {
                id: 'PT-5-01',
                description: `Kerja-kerja membekal dan memasang papan tanda pemakluman dan pemberitahuan menggunakan sticker pantul cahaya serta mengikut spesifikasi lukisan yang ditetapkan (Saiz 1200mm x 900mm). Contoh :-\n(a.) Board 3.2mm Fibre Board/Archylic\n(b.) Post welded with plate (Hot Dipped Galvanized)\n     Post - 75mm (diameter) x 3m (embedded 0.425m)\n     Plate - 250mm(L) x 250mm(W) x 5mm(D)\n(c.) Sticker Lining - 3M Engineering Grade\n(d.) Sticker Font/Symbol - 3M Engineering Grade\n(e.) Footing Size - 250mm(L) x 250mm (W) x 425mm (D)\n(f) Kaedah Penanaman - Penggunaan Mesin Gerudi dengan Saiz Korekan 250mm\n     atau Precast Concrete bersaiz 250mm(L) x 250mm (W) x 425mm (D)`,
                variants: [
                    { id: 'PT-5-01-v1', label: "Dilarang berniaga di kawasan ini", rate: 735.47, unit: "Nos" },
                    { id: 'PT-5-01-v2', label: "Dilarang membuang sampah di kawasan ini", rate: 735.47, unit: "Nos" },
                    { id: 'PT-5-01-v3', label: "Awas kanak-kanak melintas", rate: 735.47, unit: "Nos" },
                    { id: 'PT-5-01-v4', label: "Dilarang meletakkan kenderaan dibahu jalan", rate: 735.47, unit: "Nos" },
                    { id: 'PT-5-01-v5', label: "DLL", rate: 735.47, unit: "Nos" }
                ]
            }
        ]
    },
    {
        id: 'PT-6',
        title: 'PAPANTANDA PEMBERITAHUAN/KESELAMATAN',
        category: 'Papan Tanda',
        items: [
            {
                id: 'PT-6-01',
                description: `Kerja-kerja membekal dan memasang papan tanda baru serta membuka semula papan tanda sedia ada, mengikut arahan pegawai penguasa dan spesifikasi berikut :-\na) Sticker backdrop dan logo dari jenis 3M Diamond Reflected\nb) Board 3.2mm Fibre Board/Archylic\nc) Post welded with plate (Hot Dipped Galvanized)\n     Post - 75mm (diameter) x 3m (embedded 0.425m)\n     Plate - 250mm(L) x 250mm(W) x 5mm(D)\nd) Sticker lining - 3M Engineering Grade\ne) Logo - Transparent Sheet Silk Screen Coloured\nf) Ukuran papan tanda MULA/TAMAT - 300mm x 120mm\ng) Footing Size - 250mm(L) x 250mm (W) x 425mm (D)\n(h) Kaedah Penanaman - Penggunaan Mesin Gerudi dengan Saiz Korekan 250mm\n     atau Precast Concrete bersaiz 250mm(L) x 250mm (W) x 425mm (D)\n\n*bagi papan tanda had sempadan penyelenggaraan harga termasuk papan tanda MULA/TAMAT\n(Rujuk lukisan spesifikasi - sila dapatkan lukisan daripada jabatan kejuruteraan)\nTermasuk mengecat keseluruhan permukaan tiang papan tanda dengan cat anti sebanyak 2 lapisan`,
                variants: [
                    { id: 'PT-6-01-v1', label: "600mm x 600mm", rate: 670.96, unit: "Nos" },
                    { id: 'PT-6-01-v2', label: "750mm x 450mm", rate: 929.02, unit: "Nos" },
                    { id: 'PT-6-01-v3', label: "750mm x 750mm", rate: 890.31, unit: "Nos" },
                    { id: 'PT-6-01-v4', label: "900mm x 900mm", rate: 1083.85, unit: "Nos" },
                    { id: 'PT-6-01-v5', label: "1000mm x 1000mm (2 tiang)", rate: 2322.54, unit: "Nos" }
                ]
            },
            {
                id: 'PT-6-02',
                description: `Kerja-kerja membekal dan memasang papan tanda pemakluman dan pemberitahuan menggunakan sticker pantul cahaya serta mengikut spesifikasi lukisan yang ditetapkan (tanpa tiang).`,
                rate: 420.75,
                unit: 'm²'
            },
            {
                id: 'PT-6-03',
                description: `Kerja-kerja membaiki papan tanda pemakluman dan pemberitahuan serta perabot jalan termasuk kerja-kerja mendirikan semula tiang sedia ada dan pembersihan mengikut arahan Pegawai Penguasa serta kerja-kerja berkaitan.`,
                rate: 76.50,
                unit: 'Nos'
            },
            {
                id: 'PT-6-04',
                description: `Kerja-kerja menanggal papan tanda pemakluman dan pemberitahuan dilupuskan bersama kerja-kerja pembersihan mengikut arahan Pegawai Penguasa serta kerja-kerja berkaitan.`,
                rate: 15.30,
                unit: 'Nos'
            },
            {
                id: 'PT-6-05',
                description: `Kerja-kerja menanggal papan tanda perabot jalan dan dilupuskan bersama kerja-kerja pembersihan mengikut arahan Pegawai Penguasa serta kerja-kerja berkaitan.`,
                rate: 11.90,
                unit: 'Nos'
            }
        ]
    },
    // --- CATEGORY: PERHENTIAN BAS ---
    {
        id: 'PB-1',
        title: 'KERJA-KERJA PEMBERSIHAN TAPAK',
        category: 'Perhentian Bas',
        items: [
            {
                id: 'PB-1-01',
                description: 'Kerja-kerja meroboh, membuka atau memecahkan struktur sedia ada seperti lantai, bumbung, tiang, handrail , tempat duduk, papan tanda serta lain-lain yang berkaitan dengan menggunakan jentera atau mesin yang bersesuaian serta dibuang atau dilupuskan ke tempat pembuangan yang dibenarkan oleh pegawai penguasa.',
                rate: 3400.00,
                unit: 'L/S'
            }
        ]
    },
    {
        id: 'PB-2',
        title: 'PENYEDIAAN TIANG BESERTA TAPAK (FOOTING)',
        category: 'Perhentian Bas',
        items: [
            {
                id: 'PB-2-01',
                description: 'Kerja-kerja menggali dan mengorek tanah tidak melebihi 1500mm ukuran termasuk membuang sisa ke tempat yang dibenarkan oleh pegawai penguasa.',
                rate: 50.47,
                unit: 'm³'
            },
            {
                id: 'PB-2-02',
                description: 'Kerja-kerja membekal dan memadat konkrit tidak bertetulang (Site Mixed) Gred 15 (1:2:4-9mm) 75mm purata tebal lantai atau batu baur (mengikut kesesuaian tanah) untuk tapak asas tiang.',
                rate: 24.86,
                unit: 'm²'
            },
            {
                id: 'PB-2-03',
                description: 'Kerja-kerja membekal, memasang, membengkok dan memotong tetulang keluli Y12 yang diikat rapi berbentuk kekotak bersaiz 450mm x 450mm beserta Concrete Spacer mengikut lukisan spesifikasi.',
                rate: 84.15,
                unit: 'Nos'
            },
            {
                id: 'PB-2-04',
                description: 'Membekal dan memasang tiang dari jenis Stainless Steel 100mm diameter termasuk memasang 6mm tebal Mild Steel Plate pada dasar tiang.',
                rate: 383.35,
                unit: 'm'
            },
            {
                id: 'PB-2-05',
                description: 'Kerja-kerja menuang dan memadat ready mixed /tuang disitu Gred 20 konkrit tuang disitu bertetulang bagi asas tiang.',
                rate: 270.67,
                unit: 'm³'
            },
            {
                id: 'PB-2-06',
                description: 'Membekal dan memasang tiang dari jenis Galvanised Structural Steel Hollow (SHS) 150mm diameter beserta kelengkapan aksesori pemasangan termasuk memasang 6mm tebal Mild Steel Plate pada dasar tiang.',
                rate: 255.00,
                unit: 'm'
            },
            {
                id: 'PB-2-07',
                description: 'Membekal dan memasang tiang dari jenis Structural Steel Hollow (SHS) 100mm diameter beserta kelengkapan aksesori pemasangan termasuk memasang 6mm tebal Mild Steel Plate pada dasar tiang dan mengecat 1 lapisan anti karat seterusnya 1 lapisan asas dan 2 lapisan akhir (Gloss Finish) disapu kepada semua permukaan.',
                rate: 212.50,
                unit: 'm'
            }
        ]
    },
    {
        id: 'PB-3',
        title: 'PENYEDIAAN LANTAI',
        category: 'Perhentian Bas',
        items: [
            {
                id: 'PB-3-01',
                description: 'Kerja-kerja menggali dan mengorek tanah sedalam 150mm termasuk kerja-kerja membuang sisa ke tempat yang dibenarkan oleh pegawai penguasa.',
                rate: 7.57,
                unit: 'm²'
            },
            {
                id: 'PB-3-02',
                description: 'Kerja-kerja membekal dan memadat batu baur hancur (Crusher Run) sebagai dasar lantai dengan bahan yang setara dan diluluskan dengan ketebalan 150mm.',
                rate: 15.51,
                unit: 'm²'
            },
            {
                id: 'PB-3-03',
                description: 'Kerja-kerja membekal dan memadat konkrit tidak bertetulang (Site Mixed) gred 15 (1:2:4-9mm) 75mm purata tebal lantai atau batu baur (mengikut kesesuaian tanah) untuk tapak asas lantai.',
                rate: 24.86,
                unit: 'm²'
            },
            {
                id: 'PB-3-04',
                description: 'Kerja-kerja memasang, membengkok dan memotong kepingan jejaring (BRC) No. B7 atau tetulang keluli dikimpal berbentuk jejaring 100mm x 200mm, beratnya 4.53kg setiap meter persegi.',
                rate: 28.90,
                unit: 'm²'
            },
            {
                id: 'PB-3-05',
                description: 'Membekal, memotong dan memasang acuan konkrit daripada papan tidak berketam pada muka-muka yang pugak (Vertical) termasuk kerja-kerja menanggal dan membuang.',
                rate: 55.57,
                unit: 'm²'
            },
            {
                id: 'PB-3-06',
                description: 'Kerja-kerja menuang dan memadat ready mixed /tuang disitu Gred 20 konkrit tuang disitu bertetulang bagi lantai dengan ketebalan 150mm.',
                rate: 68.96,
                unit: 'm²'
            }
        ]
    },
    {
        id: 'PB-4',
        title: 'BUMBUNG',
        category: 'Perhentian Bas',
        items: [
            {
                id: 'PB-4-01',
                description: 'Kerja-kerja membuka dan menanggal struktur bumbung sedia ada termasuk kerja-kerja menanggal skru dan lain lain serta membuang ke tempat yang dibenarkan oleh pegawai penguasa.',
                rate: 637.50,
                unit: 'L/S'
            },
            {
                id: 'PB-4-02',
                description: 'Membekal besi keluli lembut untuk kerangka bumbung. (Rujuk Lukisan Spesifikasi)',
                rate: 2932.50,
                unit: 'L/S'
            },
            {
                id: 'PB-4-03',
                description: 'Membekal dan memasang bumbung jenis Metal Deck lengkap dengan Aluminium Strip Ceiling , termasuk membentuk lengkung (Forming Curve ), peralatan tambahan untuk memasangnya ada rangka keluli serta kerja-kerja lain yang berkaitan dan hendaklah mematuhi sepenuhnya arahan pengilang.',
                rate: 187.00,
                unit: 'm²'
            },
            {
                id: 'PB-4-04',
                description: 'Membekal dan memasang kerangka bumbung dari jenis Structural Steel Hollow Section (SHS) 150mm diameter beserta kelengkapan aksesori pemasangan.',
                rate: 4675.00,
                unit: 'L/S'
            },
            {
                id: 'PB-4-05',
                description: 'Kerja-kerja membekal dan memasang bumbung jenis Aluminium Composite Panel (ACP) Cladding (Roofing) dengan sistem bukaan bersambung atau setara beserta kelengkapan aksesori pemasangan.',
                rate: 3825.00,
                unit: 'L/S'
            },
            {
                id: 'PB-4-06',
                description: 'Kerja-kerja membekal dan memasang Aluminium Composite Panel (ACP) dengan kelebaran bersaiz 200mm Cladding (Gutter) terbina dengan sistem cladding beserta paip PVC beserta kelengkapan aksesori pemasangan.',
                rate: 2975.00,
                unit: 'L/S'
            }
        ]
    },
    {
        id: 'PB-5',
        title: 'TEMPAT DUDUK',
        category: 'Perhentian Bas',
        items: [
            {
                id: 'PB-5-01',
                description: 'Kerja-kerja membuka dan menanggal struktur tempat duduk sedia ada termasuk kerja-kerja menanggal skru dan lain-lain serta membuang ke tempat yang dibenarkan oleh pegawai penguasa.',
                rate: 425.00,
                unit: 'L/S'
            },
            {
                id: 'PB-5-02',
                description: 'Membekal dan memasang tempat duduk Sitting Bench dari paip jenis Stainless Steel 100mm diameter termasuk kerja-kerja merangka/mengimpal serta lain-lain termasuk memotong/menggerudi Drilling dengan tapak Mild Steel Plate bersaiz 320mm x 200mm, ketebalan 6mm pada dasar Sitting Bench dan dipasang pada permukaan lantai secara Wall Plug dan ditutup dengan kemasan lantai mengikut arahan pegawai penguasa.\nNota : 2 nos Stainless Steel Pipe/set (Rujuk Lukisan Spesifikasi)',
                rate: 537.63,
                unit: 'm'
            },
            {
                id: 'PB-5-03',
                description: 'Kerja-kerja membekal dan membina concrete bench bersaiz 2000mm (L) x 450mm (W) x 450mm (D) merujuk kepada arahan pegawai penguasa.',
                rate: 1700.00,
                unit: 'L/S'
            }
        ]
    },
    {
        id: 'PB-6',
        title: 'HANDRAIL',
        category: 'Perhentian Bas',
        items: [
            {
                id: 'PB-6-01',
                description: 'Kerja-kerja membuka dan menanggal struktur handrail sedia ada termasuk kerja-kerja menanggal skru dan lain lain serta membuang ke tempat yang dibenarkan oleh pegawai penguasa.',
                rate: 340.00,
                unit: 'L/S'
            },
            {
                id: 'PB-6-02',
                description: 'Membekal dan memasang Handrail jenis Stainless Steel 75mm diameter serta kerja-kerja merangka/mengimpal serta lain-lain termasuk memotong/menggerudi Drilling dengan tapak Mild Steel Plate bersaiz 150mm x 150mm, ketebalan 6mm pada dasar Handrail dan dipasang pada permukaan lantai secara Wall Plug dan ditutup dengan kemasan lantai serta mengikut arahan pegawai penguasa.',
                rate: 430.10,
                unit: 'm'
            },
            {
                id: 'PB-6-03',
                description: 'Kerja-kerja membekal dan memasang handrail jenis Stainless Steel 50mm diameter serta kerja-kerja merangka/ mengimpal serta lain-lain termasuk memotong/ menggerudi dengan kemasan lantai serta mengikut arahan pegawai penguasa.',
                rate: 255.00,
                unit: 'm'
            }
        ]
    },
    {
        id: 'PB-7',
        title: 'RAMP',
        category: 'Perhentian Bas',
        items: [
            {
                id: 'PB-7-01',
                description: 'Kerja-kerja membina ramp konkrit untuk keperluan OKU dengan kemasan konkrit kasar serta kerja-kerja berkaitan mengikut spesifikasi yang telah ditetapkan.',
                rate: 168.30,
                unit: 'm²'
            }
        ]
    },
    {
        id: 'PB-8',
        title: 'KERJA KEMASAN LANTAI',
        category: 'Perhentian Bas',
        items: [
            {
                id: 'PB-8-01',
                description: 'Membekal dan menyediakan kemasan lantai dari jenis Broom Finishing serta kerja-kerja berkaitan dengan ketebalan 25mm mengikut spesifikasi yang telah ditetapkan (Rujuk Lukisan Spesifikasi).',
                rate: 48.20,
                unit: 'm²'
            },
            {
                id: 'PB-8-02',
                description: 'Membekal dan menyediakan kemasan lantai dari jenis Broom Finishing konkrit berwarna dengan ketebalan 25mm serta kerja-kerja berkaitan mengikut spesifikasi yang telah ditetapkan (Rujuk Lukisan Spesifikasi).',
                rate: 57.83,
                unit: 'm²'
            }
        ]
    },
    {
        id: 'PB-9',
        title: 'PAPAN TANDA',
        category: 'Perhentian Bas',
        items: [
            {
                id: 'PB-9-01',
                description: 'Kerja-kerja membuka dan menanggal struktur papantanda sedia ada termasuk kerja-kerja menanggal skru dan lain lain serta membuang ke tempat yang dibenarkan oleh pegawai penguasa.',
                rate: 382.50,
                unit: 'L/S'
            },
            {
                id: 'PB-9-02',
                description: 'Kerja-kerja membekal dan memasang papan tanda Bus Stop menggunakan bahan Aluminium Composite termasuk kerja-kerja mengimpal, memasang bingkai, klip, bolt dan nut serta kerja-kerja lain yang berkaitan serta mengikut ukuran bentuk seperti spesifikasi yang ditetapkan (Rujuk Lukisan Spesifikasi).',
                rate: 430.10,
                unit: 'm²'
            }
        ]
    },
    {
        id: 'PB-10',
        title: 'BUS CAGE',
        category: 'Perhentian Bas',
        items: [
            {
                id: 'PB-10-01',
                description: 'Menyediakan dan menyapu cat garisan jalan jenis Reflective Thermoplastic bagi Bus Lay-By dan perkataan BAS seperti arahan pegawai penguasa.',
                rate: 21.25,
                unit: 'm²'
            }
        ]
    },
    {
        id: 'PB-11',
        title: 'KERJA-KERJA MENGECAT TIANG',
        category: 'Perhentian Bas',
        items: [
            {
                id: 'PB-11-01',
                description: 'Membekal dan mengecat tiang dengan menggunakan cat jenis cat yang bersesuaian sebanyak 2 lapisan termasuk anti karat, membuang kekotoran lama, mengikut arahan Pegawai Penguasa serta kerja-kerja berkaitan.',
                rate: 204.00,
                unit: 'L/S'
            }
        ]
    },
    {
        id: 'PB-12',
        title: 'KERJA-KERJA MENGECAT KERANGKA BUMBUNG',
        category: 'Perhentian Bas',
        items: [
            {
                id: 'PB-12-01',
                description: 'Membekal dan mengecat kerangka bumbung dengan menggunakan cat yang bersesuaian sebanyak 2 lapisan termasuk anti karat, membuang kekotoran lama, mengikut arahan Pegawai Penguasa serta kerja-kerja berkaitan.',
                rate: 382.50,
                unit: 'L/S'
            }
        ]
    },
    {
        id: 'PB-13',
        title: 'KERJA-KERJA MENGILAP',
        category: 'Perhentian Bas',
        items: [
            {
                id: 'PB-13-01',
                description: 'Membekal dan mengilap permukaan kemasan dengan menggunakan pengilap jenis Varnish sebanyak 2 lapisan dengan membersihkan kekotoran lama dan mengikut arahan Pegawai Penguasa serta kerja-kerja berkaitan.',
                rate: 297.50,
                unit: 'L/S'
            }
        ]
    },
    {
        id: 'PB-14',
        title: 'GLASS PANEL',
        category: 'Perhentian Bas',
        items: [
            {
                id: 'PB-14-01',
                description: 'Kerja-kerja membekal dan memasang Laminated Glass panel bersaiz 1500mm x 1500mm dengan ketebalan 10mm dan dilengkapi dengan pelekat logo dan perkataan Majlis Perbandaran Selayang beserta kelengkapan aksesori pemasangan.',
                rate: 850.00,
                unit: 'Nos'
            }
        ]
    },
    {
        id: 'PB-15',
        title: 'STEEL PANEL',
        category: 'Perhentian Bas',
        items: [
            {
                id: 'PB-15-01',
                description: 'Kerja-kerja membekal dan memasang Perforated Steel Panel bersaiz 1000mm x 1500mm dengan ketebalan 6mm beserta kelengkapan aksesori pemasangan.',
                rate: 595.00,
                unit: 'Nos'
            }
        ]
    },
    {
        id: 'PB-16',
        title: 'WALL DISPLAY',
        category: 'Perhentian Bas',
        items: [
            {
                id: 'PB-16-01',
                description: 'Kerja-kerja membekal dan memasang Aluminium Composite Panel (ACP) dengan rangka besi untuk sistem paparan pada dinding.',
                rate: 1530.00,
                unit: 'Nos'
            }
        ]
    },
    {
        id: 'PB-17',
        title: 'PHOTOVOLTAIC PANEL & LIGHTING FITTINGS',
        category: 'Perhentian Bas',
        items: [
            {
                id: 'PB-17-01',
                description: 'Kerja-kerja membekal dan memasang Photovoltaic Panel di atas bumbung dengan LED sebanyak 50 watts',
                rate: 5100.00,
                unit: 'L/S'
            }
        ]
    },
    {
        id: 'JEN-1',
        title: 'KERJA-KERJA MEMOTONG POKOK',
        category: 'Jentera',
        items: [
            {
                id: 'JEN-1-01',
                description: 'Kerja-kerja memotong pokok termasuk menggali dan mencabut akar dan umbi.',
                variants: [
                    { id: 'JEN-1-01-v1', label: 'ukur lilit tidak melebihi 600mm', rate: 449.10, unit: 'Nos' },
                    { id: 'JEN-1-01-v2', label: 'ukur lilit 600mm dan tidak melebihi 1200mm', rate: 588.60, unit: 'Nos' },
                    { id: 'JEN-1-01-v3', label: 'ukur lilit 1200mm dan tidak melebihi 1800mm', rate: 872.80, unit: 'Nos' },
                    { id: 'JEN-1-01-v4', label: 'ukur lilit 1800mm dan tidak melebihi 2400mm', rate: 1434.30, unit: 'Nos' },
                    { id: 'JEN-1-01-v5', label: 'ukur lilit 2400mm dan tidak melebihi 3000mm', rate: 1591.10, unit: 'Nos' }
                ]
            }
        ]
    },
    {
        id: 'JEN-2',
        title: 'TAMBAHAN',
        category: 'Jentera',
        items: [
            {
                id: 'JEN-2-01',
                description: 'Menyediakan jentera semasa melaksanakan kerja-kerja yang berkaitan.',
                variants: [
                    { id: 'JEN-2-01-v1', label: 'Sky lift / Hari', rate: 884.00, unit: 'Hari' },
                    { id: 'JEN-2-01-v2', label: 'Lori Roro', rate: 442.00, unit: 'Nos' },
                    { id: 'JEN-2-01-v3', label: 'Lori Tipper (10 Tan)', rate: 663.00, unit: 'Hari' },
                    { id: 'JEN-2-01-v4', label: 'Lori Tipper (22 Tan)', rate: 884.00, unit: 'Hari' },
                    { id: 'JEN-2-01-v5', label: 'Kren', rate: 1989.00, unit: 'Hari' },
                    { id: 'JEN-2-01-v6', label: 'Backhoe', rate: 663.00, unit: 'Hari' },
                    { id: 'JEN-2-01-v7', label: 'Back Pusher', rate: 663.00, unit: 'Hari' },
                    { id: 'JEN-2-01-v8', label: 'Backhoe with Hydraulic Breaker', rate: 1049.75, unit: 'Hari' },
                    { id: 'JEN-2-01-v9', label: 'Excavator with Load Loader', rate: 2652.00, unit: 'Hari' },
                    { id: 'JEN-2-01-v10', label: 'Water Jetter & Tanker', rate: 4641.00, unit: 'Hari' },
                    { id: 'JEN-2-01-v11', label: 'Suction Tanker', rate: 7225.00, unit: 'Hari' },
                    { id: 'JEN-2-01-v12', label: 'Tipping Fee', rate: 93.50, unit: 'Trip' }
                ]
            }
        ]
    },
    {
        id: 'JEN-3',
        title: 'WATER PUMP',
        category: 'Jentera',
        items: [
            {
                id: 'JEN-3-01',
                description: 'Menyediakan jentera bagi kerja-kerja mengepam air termasuk aksesori yang lengkap.',
                rate: 552.50,
                unit: 'Hari'
            }
        ]
    },
    {
        id: 'GEO-1',
        title: 'KERJA-KERJA TAMBAKAN BATU',
        category: 'Geoteknikal',
        items: [
            {
                id: 'GEO-1-01',
                description: 'Kerja-kerja meninggikan tempat yang rendah menggunakan batu pejal bersaiz 6" x 9" serta disusun secara rambang tanpa diikat menggunakan motar. Harga termasuk membekal dan memasang.',
                rate: 237.15,
                unit: 'm³'
            },
            {
                id: 'GEO-1-02',
                description: 'Kerja-kerja meninggikan tempat yang rendah menggunakan batu pejal bersaiz 6" x 9" serta disusun secara rambang dan diikat menggunakan motar 1:3. Harga termasuk membekal dan memasang.',
                rate: 259.85,
                unit: 'm³'
            }
        ]
    },
    {
        id: 'GEO-2',
        title: 'GABBION',
        category: 'Geoteknikal',
        items: [
            {
                id: 'GEO-2-01',
                description: 'Kerja-kerja membekal dan memasang 1.0m x 1.0m x 1.0m (mesh wire 2.7mm diameter dan mesh size 8cm x 10cm) raga gabion di salut PVC (PVC Coated Galvanised Wire Gabion) dengan isian batu.',
                rate: 561.20,
                unit: 'm³'
            },
            {
                id: 'GEO-2-02',
                description: 'Kerja-kerja perbersihan tapak, runtuhan, menggali membentuk Benching dan menyediakan laluan ke tempat kerja serta lain-lain penyediaan tapak.',
                rate: 2125.00,
                unit: 'L/S'
            },
            {
                id: 'GEO-2-03',
                description: 'Membekal dan memasang High Tensile Geotextile MacTex atau setara dengan kekuatan minimun 19kN/m atau setaraf sebagai lapisan pemisah antara tanah asal dengan tanah tambak.',
                rate: 21.08,
                unit: 'm²'
            },
            {
                id: 'GEO-2-04',
                description: 'Kerja-kerja membekal dan menimbus tanah di kawasan tanah runtuh serta kerja memadat termasuk kerja-kerja merapi dengan tenaga buruh.',
                rate: 26.60,
                unit: 'm³'
            }
        ]
    },
    {
        id: 'GEO-3',
        title: 'CERUCUK KAYU',
        category: 'Geoteknikal',
        items: [
            {
                id: 'GEO-3-01',
                description: 'Kerja-kerja membekal dan melantak cerucuk kayu bakau diameter 150mm maksimum 4m dalam di kawasan jajaran cerun runtuh, longkang, Sump dan laluan paip sepanjang menggunakan jentera yang sesuai dan manual serta kelengkapan kerja mengikut arahan Pegawai Penguasa.',
                rate: 136.90,
                unit: 'm'
            }
        ]
    },
    {
        id: 'GEO-4',
        title: 'TARPAULIN SHEET',
        category: 'Geoteknikal',
        items: [
            {
                id: 'GEO-4-01',
                description: 'Kerja-kerja membekal dan memasang tarpaulin sheet dari jenis PE Hijau dan Kelabu GRED A bagi menutup cerun yang terdedah pada runtuhan dan dijahit kemas pada sambungan termasuk kerja-kerja berkaitan.',
                rate: 23.80,
                unit: 'm²'
            }
        ]
    },
    {
        id: 'GEO-5',
        title: 'SAND BAG',
        category: 'Geoteknikal',
        items: [
            {
                id: 'GEO-5-01',
                description: 'Kerja-kerja membekal dan memasang bag pasir/sand bag untuk mengelakkan air daripada melimpah ke cerun menggunakan tenaga buruh seperti arahan pegawai penguasa.',
                rate: 12.75,
                unit: 'Nos'
            }
        ]
    },
    {
        id: 'GEO-6',
        title: 'KERJA-KERJA PEMBERSIHAN CERUN',
        category: 'Geoteknikal',
        items: [
            {
                id: 'GEO-6-01',
                description: 'Kerja- kerja membekal peralatan untuk membersih, mencantas semak samun dan mencuci semak longkang sediada pada sepanjang jajaran longkang cerun serta menebang pokok serdahana besar kurang 600mm diameter bagi memastikan tiada halangan pengaliran dan laluan penyelenggaraan dengan menggunakan jentera dan tenaga buruh minima 2.0m serta membuang di tempat pembuangan sampah yang dibenarkan.',
                rate: 3.23,
                unit: 'm²'
            }
        ]
    },
    {
        id: 'GEO-7',
        title: 'KERJA-KERJA PEMBINAAN SALIRAN CERUN',
        category: 'Geoteknikal',
        items: [
            {
                id: 'GEO-7-01',
                description: 'Kerja-kerja membina U-Drain/Cascade Cast In-Situ bersaiz 0.6m (L) x 0.6m (T) dengan (site mixed) Grade 25 (1:2:4-25/38) 100mm purata tebal lantai diperkuatkan dengan kepingan jejaring (BRC) No. B7 serta kotak bentuk dan kerja penggalian termasuk weephole mengikut keperluan tapak',
                rate: 257.13,
                unit: 'm'
            },
            {
                id: 'GEO-7-02',
                description: 'Kerja-kerja membina V-Drain/Cascade Cast In-Situ bersaiz 0.6m (L) x 0.6m (T) dengan (site mixed) Grade 25 (1:2:4-25/38) 100mm purata tebal lantai diperkuatkan dengan kepingan jejaring (BRC) No. B7 serta kotak bentuk dan kerja penggalian termasuk weephole mengikut keperluan tapak',
                rate: 257.13,
                unit: 'm'
            }
        ]
    }
];

export const INITIAL_TEMPLATE_DATA: BQTemplateDefinition[] = [
    {
        id: 't-1',
        key: 'PERMULAAN_BASIC',
        title: 'Basic Insurans',
        subtitle: 'Permulaan (Standard)',
        icon: 'file',
        color: 'blue',
        bills: [
            {
                id: 'b1',
                title: 'KERJA-KERJA PERMULAAN',
                items: [
                    { groupId: 'G1-1', itemId: '1-01', variantId: '1-01-v1' },
                    { groupId: 'G1-2', itemId: '2-01' },
                    { groupId: 'G1-3', itemId: '3-01' }
                ]
            }
        ],
        groupRefs: []
    },
    {
        id: 't-3',
        key: 'LONGKANG',
        title: 'Longkang',
        subtitle: 'Template Longkang, Jalan & Penutup',
        icon: 'layout',
        color: 'emerald',
        bills: [
            {
                id: 'b1',
                title: 'BUTIRAN KERJA LONGKANG',
                items: [
                    { groupId: 'G2', itemId: '2-01', variantId: '2-01-v1' },
                    { groupId: 'G3', itemId: '3-01' },
                    { groupId: 'G4', itemId: '4-01' },
                    { groupId: 'G5', itemId: '5-01', variantId: '5-01-v2' },
                    { groupId: 'G6', itemId: '6-01', variantId: '6-01-v5' },
                    { groupId: 'G7', itemId: '7-01', variantId: '7-01-v1' },
                    { groupId: 'G10', itemId: '10-01', variantId: '10-01-v1' }
                ]
            },
            {
                id: 'b2',
                title: 'BUTIRAN KERJA LALUAN MASUK/KELUAR',
                items: [
                    { groupId: 'G11-1', itemId: '11-1-01', variantId: '11-1-01-v1' },
                    { groupId: 'G11-2', itemId: '11-2-01' },
                    { groupId: 'G11-3', itemId: '11-3-01' },
                    { groupId: 'G11-4', itemId: '11-4-01', variantId: '11-4-01-v5' }
                ]
            },
            {
                id: 'b3',
                title: 'BUTIRAN KERJA PENUTUP LONGKANG',
                items: [
                    { groupId: 'G-PL-1', itemId: 'PL-1-01', variantId: 'PL-1-01-v1' },
                    { groupId: 'PL-G7', itemId: 'PL-4-0', variantId: 'v14' },
                    { groupId: 'PL-G6', itemId: 'PL-3-0', variantId: 'v11' }
                ]
            }
        ],
        groupRefs: []
    },
    {
        id: 't-4',
        key: 'EMPTY',
        title: 'Kosong (Lokasi)',
        subtitle: 'Bill kosong dengan tetapan lokasi',
        icon: 'plus',
        color: 'slate',
        bills: [
            { id: 'b1', title: 'BUTIRAN KERJA-KERJA', items: [] }
        ],
        groupRefs: []
    }
];

export const createItem = (
    library: PresetGroup[],
    groupId: string, 
    itemId: string, 
    varId: string | null = null, 
    customParts?: CalculationPart[] 
): BQItem => {
    const group = library.find(g => g.id === groupId);
    if(!group) throw new Error("Group not found: " + groupId);
    const item = group.items.find(i => i.id === itemId);
    if(!item) throw new Error("Item not found: " + itemId);
    
    let variant = null;
    let rate = item.rate || 0;
    let unit = item.unit || '';
    let desc = item.description;

    if (varId) {
        variant = item.variants?.find(v => v.id === varId);
        if(variant) {
            rate = variant.rate;
            unit = variant.unit;
        }
    }

    let calculationParts: CalculationPart[] = [];
    let calculatedQty = 0;

    const u = unit.toLowerCase().trim();
    let hasLength = false;
    let hasWidth = false;
    let hasDepth = false;
    let isGlobal = false;
    let defaultQty = 1;

    const isM = u === 'm' || u === 'meter';
    const isM2 = u === 'm2' || u === 'm²' || u === 'sqm';
    const isM3 = u === 'm3' || u === 'm³' || u === 'cum';
    
    if (isM) {
        hasLength = true;
        isGlobal = true;
        defaultQty = 0;
    } else if (isM2) {
        hasLength = true;
        hasWidth = true;
        isGlobal = true;
        defaultQty = 0;
    } else if (isM3) {
        hasLength = true;
        hasWidth = true;
        hasDepth = true;
        isGlobal = true;
        defaultQty = 0;
    } else {
        isGlobal = false;
        defaultQty = 1;
    }

    const isOneByOne = variant && variant.label.includes("1.0m x 1.0m");
    if (isOneByOne) {
        isGlobal = false;
        hasLength = true;
        hasWidth = true;
        hasDepth = false;
    }

    if (customParts && customParts.length > 0) {
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
        calculationParts = [{
            id: Math.random().toString(36).substr(2, 9),
            label: "",
            length: isOneByOne ? 1 : 0,
            width: isOneByOne ? 1 : 0,
            depth: 0,
            multiplier: 1, 
            hasLength,
            hasWidth,
            hasDepth
        }];
        calculatedQty = isOneByOne ? 1 : defaultQty;
    }

    const finalDesc = varId && variant ? variant.label : desc;

    return {
        id: Math.random().toString(36).substr(2, 9),
        type: 'ITEM',
        description: finalDesc,
        variant: undefined, 
        unit,
        rate,
        qty: parseFloat(calculatedQty.toFixed(2)),
        amount: parseFloat((calculatedQty * rate).toFixed(2)),
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
