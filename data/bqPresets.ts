
import { BQGroup, BQItem, GlobalDimensions, CalculationPart, PresetGroup, BQTemplateDefinition, BQTemplateBillDefinition } from "../types";

export const INITIAL_LIBRARY_DATA: PresetGroup[] = [
    // --- CATEGORY: PERMULAAN ---
    {
        id: 'G1-1',
        title: 'INSURANS',
        category: 'Permulaan',
        items: [
            {
                id: '1-01',
                description: `Menyediakan polisi insuran berikut bagi merangkumi tempoh pekerjaan yang perlu seperti insuran tanggungan awam (Public Liability), insuran pampasan pekerja (Workmen's Compensation) and SOCSO\nNota: Liputan (coverage) minima insuran bagi pampasan adalah 30% daripada nilai kerja jika sekiranya pemborong tidak dapat mengadakan Nombor Pendaftaran PERKESO. Liputan bagi Insurans Tanggungan Umum adalah seperti berikut :-`,
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
                description: `KERJA-KERJA PENGUKURAN AWAL\n\nKerja-kerja pengukuran and pemantauan tapak di sepanjang jajaran longkang/jalan melibatkan pengukuran struktur sedia ada, Sump Invert Level, Drain Invert Level, persempadanan, saiz longkang sedia ada, tiang-tiang sedia ada melibatkan Telekom, TNB serta Syarikat Telekomunikasi, bahu jalan, perabot jalan seperti kerb, papan tanda and lebar jalan serta lain-lain struktur berkaitan yang boleh dilihat oleh mata kasar serta menyediakan dokumen ukur melalui pelan ukur sebanyak 2 hardcopy, 2 salinan (linen) and salinan softcopy (CD/Thumb drive) serta disahkan oleh juruukur bertauliah and berlesen.\n\nDengan purata keluasan :\n.....m² - .....m²`,
                rate: 0.85,
                unit: 'm²'
            },
            {
                id: '4-02',
                description: `KERJA-KERJA PENGUKURAN AKHIR\n\nKerja-kerja pengukuran and pemantauan tapak di sepanjang jajaran longkang/jalan melibatkan pengukuran struktur sedia ada, Sump Invert Level, Drain Invert Level, persempadanan, saiz longkang sedia ada, tiang-tiang sedia ada melibatkan Telekom, TNB serta Syarikat Telekomunikasi, bahu jalan, perabot jalan seperti kerb, papan tanda and lebar jalan serta lain-lain struktur berkaitan yang boleh dilihat oleh mata kasar serta menyediakan dokumen As-Built melalui pelan ukur sebanyak 2 hardcopy, 2 salinan (linen) and salinan softcopy (CD/Thumb drive) serta disahkan oleh juruukur bertauliah and berlesen.\n\nDengan purata keluasan :\n.....m² - .....m²`,
                rate: 0.85,
                unit: 'm²'
            },
            {
                id: '4-03',
                description: `KERJA-KERJA PENGUKURAN UNDERGROUND MAPPING\n\nKerja-kerja pengukuran and pemantauan tapak di sepanjang jajaran longkang/jalan melibatkan pengukuran struktur sedia ada, Sump Invert Level, Manhole, sedia ada melibatkan syarikat utiliti seperti TNB, SYABAS and Syarikat Telekomunikasi, persempadanan, dengan purata kelebaran sebanyak 3m hingga 5m serta menyediakan dokumen ukur melalui pelan ukur sebanyak 2 hardcopy and salinan softcopy (CD/Thumb drive) serta disahkan oleh juruukur bertauliah and berlesen.\n\n...m`,
                rate: 8.50,
                unit: 'm'
            }
        ]
    },

    // --- CATEGORY: LONGKANG ---
    {
        id: 'G2',
        title: 'KERJA PENGOREKAN',
        category: 'Longkang',
        items: [
            {
                id: '2-01',
                description: 'Kerja-kerja menggali and membuang tembok longkang sedia ada tidak melebihi 1500mm ukuran termasuk membuang sisa di tempat yang dibenarkan oleh pegawai penguasa.',
                variants: [
                    { id: '2-01-v1', label: "Dengan jentera", rate: 18.70, unit: "m³" },
                    { id: '2-01-v2', label: "Dengan tangan", rate: 53.40, unit: "m³" }
                ]
            },
            {
                id: '2-02',
                description: 'Kerja-kerja menggali and membuang tembok longkang sedia ada melebihi 1500mm tetapi tidak melebihi 3000mm ukuran (dengan jentera/tangan) termasuk membuang sisa di tempat yang dibenarkan oleh penguasa.',
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
                description: 'Kerja-kerja membekal and memadat konkrit tidak bertetulang (Site Mixed) gred 15 (1:2:4-9mm) 75mm purata tebal lantai atau batu baur (ikut kesesuaian tanah) untuk tapak asas longkang. (Lean Concrete)',
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
                description: 'Kerja-kerja membekal, memasang, membengkok and memotong kepingan jejaring (BRC) No. B7 atau tetulang keluli dikimpal berbentuk jejaring 100mm x 200mm, beratnya 4.53kg setiap meter persegi. (BRC B7)',
                rate: 30.30,
                unit: 'm²'
            },
            {
                id: '4-02',
                description: 'Kerja-kerja membekal, memasang, membengkok and memotong kepingan jejaring (BRC) No. A10 atau tetulang keluli dikimpal berbentuk jejaring 200mm x 200mm, beratnya 6.16kg setiap meter persegi. (BRC A10)',
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
                description: 'Kerja-kerja membekal, memotong and memasang acuan konkrit daripada papan tidak berketam pada muka-muka yang pugak (Vertical) termasuk kerja-kerja menanggal and membuang.',
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
                description: 'Kerja-kerja membekal, menuang and memadat konkrit Ready Mixed/tuang disitu gred 20 bertetulang tuang disitu untuk lantai and tembok longkang tebal 100mm/150mm/Ready Mixed/tuang disitu.',
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
                description: 'Kerja-kerja membekal and memasang longkang jenis separuh bulatan jenis tembikar bergilap (HRGW) and di sambung dengan simen motar 1:3 saiz :-',
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
                description: 'Kerja-kerja membekal and memasang longkang jenis Pudu Cut and disambung dengan simen motar 1:3 saiz :-',
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
                description: 'Kerja-kerja membekal and memasang longkang jenis U-Shape with Dry weather flow serta mempunyai starter bar termasuk kerja-kerja konkrit 1:2:4 - 19mm agg sebagai asas.',
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
                description: 'Kerja-kerja membekal and memasang longkang jenis L-Shape termasuk kerja-kerja konkrit 1:2:4 - 19mm agg sebagai asas.',
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
                description: 'Kerja-kerja membekal and memasang pembentung kekotak (Box Culvert) with Dry weather flow termasuk penutup and kerja-kerja konkrit 1:2:4 - 19mm agg sebagai asas.',
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
                description: 'Kerja-kerja membekal and memasang pembentung konkrit bertetulang kitar termasuk 150mm tebal penggalas konkrit (1:3:6-38mm) and dipasang dengan simpai (collar) and ruang di sekeliling paip ditutup dengan lepa simen serta pasir (1:3) dengan bersaiz :-',
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
                description: 'Kerja-kerja membekal and membina Capping Beam pada kedua belah bibir and diikat pada Starter Bar dengan ketebalan 150mm, 200mm, 300mm termasuk kerja-kerja memasang tetulang 4Y12, R6 150mm c/c, menuang konkrit gred 20 and memasang papan acuan termasuk menanggal and membuang.',
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
                description: 'Kerja-kerja membekal and membina Struct konkrit bertetulang 4Y12, R6 150mm c/c termasuk menuang konkrit Gred 20 and memasang papan acuan termasuk menanggal and membuang serta dibina setiap 3m c/c panjang dengan kelebaran bersaiz :-',
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
                description: 'Kerja-kerja membekal and memasang paip UPVC sebagai lubang titisan (Weepholes) 305mm panjang termasuk litupan batu and pasir bersih di satu hujung.',
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
                description: 'Kerja-kerja membekal and mengikat tembok bata campuran pasir and simen diperkuat menggunakan motar simen and pasir 1:3.',
                variants: [
                    { id: '15-01-L-v1', label: "225mm tebal", rate: 110.00, unit: "m²" },
                    { id: '15-01-L-v2', label: "113mm tebal", rate: 55.70, unit: "m²" }
                ]
            },
            {
                id: '15-02-L',
                description: 'Kerja-kerja melepa menggunakan simen and pasir (1:3) atau skrid dilepa licin berketebalan 25mm.',
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
                description: 'Kerja-kerja membina lurang tidak lebih 1200mm dalam termasuk penggalian membentuk 100mm asas konkrit (1:3:6-38mm) membuat rusuk (Benching) and saluran-saluran membina 115mm dinding bata berlepa simen motar (1:3) dinding bahagian dalam dialas dengan 12mm tebal lepa simen and pasir.',
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
                description: 'Kerja-kerja membekal and menimbus tanah di kedua-dua belah tembok longkang serta kerja memadat termasuk kerja-kerja merapi tenaga dengan buruh.',
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
                description: 'Kerja-kerja akhir pembersihan sisa bahan binaan and dibuang ke tempat yang dibenarkan.',
                variants: [
                     { id: '10-01-v1', label: "Nilai Kerja RM20,000.00 and ke bawah", rate: 340.00, unit: "L/S" },
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
                description: 'Kerja-kerja membekal and memasang baru besi penutup longkang (M.S. Cover) dari M.S. Plate 75mm x 50mm x 10 mm M.S. Angle Iron untuk slab termasuk kerja-kerja mengecat and 2 bil engsel ditanam (Bolt) ke lantai hendaklah di sadur dengan Hot Dipped Galvanised M.S.',
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
                description: 'Kerja-kerja membekal and memasang baru besi penutup longkang (M.S. Cover) dari M.S. Plate 75mm x 50mm x 10 mm M.S. Angle Iron untuk slab termasuk kerja-kerja mengecat and 2 bil engsel ditanam (Bolt) ke lantai.',
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
                description: 'Kerja-kerja membekal and memasang Pre Cast Concrete Heavy Duty with Lifting Hole bersaiz :-',
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
        id: 'G-PL-4',
        title: 'IRON ANGLE STEEL FRAME',
        category: 'Penutup Longkang',
        items: [
            {
                id: 'PL-4-01',
                description: 'Kerja-kerja membekal and memasang Iron Angle Steel Frame dengan ketebalan 5mm sebagai perlindungan kepada penutup longkang serta kerja-kerja berkaitan bersaiz :-',
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
        title: 'BUTIRAN KERJA LALUAN MASUK/KELUAR',
        category: 'Laluan Keluar Masuk',
        items: [
            {
                id: '11-01',
                description: 'Memecah atau merobohkan konkrit sedia ada and membaiki semula mana-mana bahagian rosak, tidak melebihi 300mm tebal.',
                variants: [
                    { id: '11-01-v1', label: "dengan tetulang", rate: 384.70, unit: "m³" },
                    { id: '11-01-v2', label: "tanpa tetulang", rate: 280.80, unit: "m³" }
                ]
            },
            {
                id: '11-02',
                description: 'Membuat lubang menembusi konkrit yang sedia ada and membaiki semula mana-mana bahagian yang rosak, termasuk menumpang di bahagian atas.',
                variants: [
                    { id: '11-02-v1', label: "dengan tetulang", rate: 845.30, unit: "m³" },
                    { id: '11-02-v2', label: "tanpa tetulang", rate: 619.30, unit: "m³" }
                ]
            },
            {
                id: '11-03', // FORMWORK
                description: 'Kerja-kerja membekal, memotong and memasang acuan konkrit daripada papan tidak berketam pada muka-muka yang ufuk (Horizontal) termasuk kerja-kerja menanggal and membuang.',
                rate: 68.11,
                unit: 'm²'
            },
            {
                id: '11-04', // REINFORCEMENT
                description: 'Kerja-kerja membekal, memasang, membengkok and memotong tetulang keluli Y10 yang diikat rapi berbentuk segiempat bersaiz 200mm x 200mm beserta Concrete Spacer, beratnya 6.16kg setiap meter persegi sebanyak 2 lapisan.',
                rate: 101.80,
                unit: 'm²'
            },
            {
                id: '11-05', // KONKRIT
                description: 'Kerja-kerja membekal, menuang and memadat konkrit Ready Mixed /tuang disitu gred 20 bertetulang tuang disitu untuk lantai and tembok longkang tebal 100mm/150mm/ Ready Mixed /tuang disitu.',
                variants: [
                    { id: '11-05-v1', label: "i) 50mm tebal (Ready Mix)", rate: 15.80, unit: "m²" },
                    { id: '11-05-v2', label: "ii) 50mm tebal (Tuang Disitu)", rate: 22.95, unit: "m²" },
                    { id: '11-05-v3', label: "iii) 75mm tebal (Ready Mix)", rate: 23.70, unit: "m²" },
                    { id: '11-05-v4', label: "iv) 75mm tebal (Tuang Disitu)", rate: 34.54, unit: "m²" },
                    { id: '11-05-v5', label: "v) 100mm tebal (Ready Mix)", rate: 31.60, unit: "m²" },
                    { id: '11-05-v6', label: "vi) 100mm tebal (Tuang Disitu)", rate: 46.01, unit: "m²" },
                    { id: '11-05-v7', label: "vii) 150mm tebal (Ready Mix)", rate: 47.40, unit: "m²" },
                    { id: '11-05-v8', label: "viii) 150mm tebal (Tuang Disitu)", rate: 68.96, unit: "m²" },
                    { id: '11-05-v9', label: "ix) 200mm tebal (Ready Mix)", rate: 63.20, unit: "m²" },
                    { id: '11-05-v10', label: "x) 200mm tebal (Tuang Disitu)", rate: 91.91, unit: "m²" }
                ]
            }
        ]
    }
];

// Default Template Definitions (Structure converted for multi-bill creation)
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
                title: 'BIL NO. 1 - KERJA-KERJA PERMULAAN',
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
                    { groupId: 'G11', itemId: '11-01', variantId: '11-01-v1' },
                    { groupId: 'G11', itemId: '11-03' },
                    { groupId: 'G11', itemId: '11-04' },
                    { groupId: 'G11', itemId: '11-05', variantId: '11-05-v5' }
                ]
            },
            {
                id: 'b3',
                title: 'BUTIRAN KERJA PENUTUP LONGKANG',
                items: [
                    { groupId: 'G-PL-4', itemId: 'PL-4-01', variantId: 'PL-4-01-v14' },
                    { groupId: 'G-PL-3', itemId: 'PL-3-01', variantId: 'PL-3-01-v11' }
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
