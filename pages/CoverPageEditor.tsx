import React, { useState, useEffect } from 'react';
import { Project, User, formatDate, formatCurrency } from '../types';
import { mockService } from '../services/mockService';

interface CoverPageEditorProps {
    project: Project;
    selectedYear?: number;
    pjaUser?: User;
    onUpdate: (updates: Partial<Project>) => void;
    isPrintView?: boolean;
}

const CoverPageEditor: React.FC<CoverPageEditorProps> = ({ project, selectedYear, pjaUser, onUpdate, isPrintView }) => {
    const [meetingDate, setMeetingDate] = useState('');

    useEffect(() => {
        let yearToFetch = selectedYear;

        if (!yearToFetch && project.tarikhBuka) {
            const yearStr = project.tarikhBuka.split('-')[0];
            const parsed = parseInt(yearStr);
            if (!isNaN(parsed)) yearToFetch = parsed;
        }

        if (!yearToFetch) {
            yearToFetch = new Date().getFullYear();
        }

        if (yearToFetch) {
            const settings = mockService.getSettings(yearToFetch);
            setMeetingDate(settings.meetingDate || '');
        }
    }, [selectedYear, project.tarikhBuka]);

    const jawatan = project.coverJawatan || pjaUser?.jawatan || "Penolong Jurutera JA29";
    const bahagian = project.coverBahagian || pjaUser?.bahagian || "Bahagian Infrastruktur";
    const unit = project.coverUnit || pjaUser?.unit || "Unit Selenggara Infrastruktur";
    const pjaName = pjaUser?.fullName || "Nama Pegawai";

    const monthNames = ["Januari", "Februari", "Mac", "April", "Mei", "Jun", "Julai", "Ogos", "September", "Oktober", "November", "Disember"];
    const dateObj = project.tarikhBuka ? new Date(project.tarikhBuka) : new Date();
    const month = monthNames[dateObj.getMonth()];
    const year = dateObj.getFullYear();
    const formattedDate = `${month} ${year}`;

    return (
        <div className="flex flex-col gap-6 w-full max-w-[210mm] mx-auto">
            
            {/* PREVIEW CONTAINER */}
            <div className={`flex flex-col items-center bg-gray-100 dark:bg-slate-900/50 py-8 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 shadow-inner ${!isPrintView ? 'hidden' : ''}`}>
                <div id="cover-page-doc" className="origin-top transition-transform">
                    {/* PAGE 1 WRAPPER */}
                    <div className="w-[210mm] mx-auto mb-10 shadow-2xl print:shadow-none print:mb-0">
                        <div 
                            className="w-full h-[290mm] bg-white text-black dark:text-black p-[20mm] relative box-border mx-auto leading-normal flex flex-col justify-between pdf-page print:h-[296mm]"
                            style={{ fontFamily: 'Arial, sans-serif' }}
                        >
                            <div>
                                {/* HEADER */}
                                <div className="flex items-start justify-between mb-6">
                                    {/* Jata Logo */}
                                    <div className="w-[100px] h-[80px] flex items-start justify-center">
                                    <img 
                                            src="https://upload.wikimedia.org/wikipedia/commons/6/6e/Selayang_Seal.png" 
                                            alt="MPS Logo" 
                                            className="w-full h-full object-contain"
                                    />
                                    </div>
                                    
                                    {/* Center Text */}
                                    <div className="flex-1 text-center px-4">
                                        <h2 className="text-[16px] font-bold uppercase tracking-wide text-black dark:text-black">JABATAN KEJURUTERAAN</h2>
                                        <h1 className="text-[18px] font-bold uppercase tracking-wide mb-1 text-black dark:text-black">MAJLIS PERBANDARAN SELAYANG</h1>
                                        <p className="text-[11px] font-bold leading-tight text-black dark:text-black">
                                            Persiaran 3, Bandar Baru Selayang<br/>
                                            68100 Batu Caves, Selangor.<br/>
                                            Tel. : 03-61204897/61311426 Fax. : 03-61204879
                                        </p>
                                        <div className="mt-4 text-[16px] font-bold uppercase italic underline text-black dark:text-black">
                                            CADANGAN KERJA
                                        </div>
                                    </div>

                                    {/* MPS Logo */}
                                    <div className="w-[100px] h-[80px] flex items-start justify-center">
                                        <img 
                                            src="https://i.imgur.com/ZB7DFaV.png"
                                            alt="Selayangku Sayang Logo" 
                                            className="w-full h-full object-contain"
                                        />
                                    </div>
                                </div>

                                {/* TABLE */}
                                <table className="w-full border-collapse border border-black text-[13px] mb-6 table-fixed text-black dark:text-black">
                                    <tbody>
                                        <tr>
                                            <td className="border border-black p-2 w-[30%] align-top font-bold text-black dark:text-black">Tarikh</td>
                                            <td className="border border-black p-2 align-top font-bold text-black dark:text-black">
                                                <span className="pl-12">{formattedDate}</span>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className="border border-black p-2 align-top font-bold text-black dark:text-black">Daripada</td>
                                            <td className="border border-black p-2 align-top text-black dark:text-black">
                                                <span className="font-bold uppercase">{pjaName}</span><br/>
                                                {jawatan}<br/>
                                                {bahagian},<br/>
                                                {unit}.
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className="border border-black p-2 align-top font-bold text-black dark:text-black">Kepada</td>
                                            <td className="border border-black p-2 align-top text-black dark:text-black">
                                                Pengarah<br/>
                                                Jabatan Kejuruteraan
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className="border border-black p-2 align-top font-bold text-black dark:text-black">Tajuk</td>
                                            <td className="border border-black p-2 align-top font-bold uppercase text-justify text-black dark:text-black">
                                                {project.namaProjek}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className="border border-black p-2 align-top font-bold text-black dark:text-black">Blok Perancangan</td>
                                            <td className="border border-black p-2 align-top text-black dark:text-black">
                                                {project.bp}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className="border border-black p-2 align-top font-bold text-black dark:text-black">Zon</td>
                                            <td className="border border-black p-2 align-top text-black dark:text-black">
                                                {project.zon}
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>

                                {/* BODY TEXT */}
                                <div className="text-[13px] leading-relaxed mb-6 text-justify text-black dark:text-black">
                                    <p className="mb-4">Perkara di atas adalah dirujuk.</p>
                                    
                                    <div className="flex gap-4">
                                        <span>2.</span>
                                        <div className="font-bold text-black dark:text-black">
                                            {project.namaProjek ? (
                                                <>
                                                    {project.namaProjek}.
                                                </>
                                            ) : 'Cadangan Kerja...'}
                                            <br/>
                                            <span className="font-normal text-black dark:text-black">
                                                Bersama-sama ini dilampirkan pelan tapak, gambar lokasi aduan serta spesifikasi kerja (BQ)
                                            </span>
                                        </div>
                                    </div>

                                    <p className="mt-8 text-black dark:text-black">Sekian, terima kasih.</p>
                                    
                                    <div className="mt-8 font-bold text-[12px] space-y-1 text-black dark:text-black">
                                        <p>“KITASELANGOR MAJU BERSAMA”</p>
                                        <p>“MALAYSIA MADANI”</p>
                                        <p>“BERKHIDMAT UNTUK NEGARA”</p>
                                        <p>“MAMPAN PROGRESIF SEJAHTERA”</p>
                                    </div>
                                </div>
                            </div>

                            {/* FOOTER / SIGNATURE */}
                            <div className="text-[13px] mt-auto text-black dark:text-black">
                                <p className="mb-16">Saya yang menjalankan amanah,</p>
                                
                                <div className="border-b border-black border-dashed w-[250px] mb-2"></div>
                                
                                <div className="font-bold uppercase text-black dark:text-black">
                                    ({pjaName})
                                </div>
                                <div className="text-black dark:text-black">{jawatan},</div>
                                <div className="text-black dark:text-black">{bahagian},</div>
                                <div className="text-black dark:text-black">{unit}.</div>
                            </div>
                        </div>
                    </div>

                    {/* PAGE 2 WRAPPER */}
                    <div className="w-[210mm] mx-auto shadow-2xl print:shadow-none print:mb-0">
                        <div className="w-full h-[290mm] bg-white text-black dark:text-black p-[20mm] relative box-border mx-auto leading-normal pdf-page print:h-[296mm]" style={{ fontFamily: 'Arial, sans-serif' }}>
                            <div className="border border-black h-full flex flex-col">
                                {/* Top Half */}
                                <div className="flex-1 border-b border-black p-6 relative flex flex-col">
                                    <h3 className="font-bold uppercase mb-4 text-[14px] text-black dark:text-black">ULASAN JURUTERA</h3>
                                    <p className="text-justify mb-8 uppercase leading-relaxed text-[13px] font-bold text-black dark:text-black">{project.namaProjek}</p>
                                    
                                    <div className="grid grid-cols-[150px_20px_1fr] gap-y-4 mb-10 text-[13px] text-black dark:text-black">
                                        <div className="font-bold">Anggaran Kontrak</div>
                                        <div>:</div>
                                        <div className="border-b border-black h-6">{project.kosProjek ? formatCurrency(project.kosProjek) : ''}</div>
                                        
                                        <div className="font-bold">Tempoh Kontrak</div>
                                        <div>:</div>
                                        <div className="border-b border-black h-6">{project.tempohKontrak || ''}</div>

                                        <div className="font-bold">Lantikan</div>
                                        <div>:</div>
                                        <div className="border-b border-black h-6">{project.namaSyarikat || ''}</div>
                                    </div>
                                    
                                    {/* Signature */}
                                    <div className="mt-auto text-[13px] text-black dark:text-black">
                                        <div className="mb-4">Tandatangan :</div>
                                        <div>Tarikh &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;:</div>
                                    </div>
                                </div>

                                {/* Bottom Half */}
                                <div className="flex-1 p-6 relative flex flex-col">
                                    <h3 className="font-bold uppercase mb-4 text-[14px] text-black dark:text-black">ULASAN PENGARAH</h3>
                                    <p className="text-justify mb-8 leading-relaxed text-[13px] text-black dark:text-black">
                                        Rujuk kelulusan Jawatankuasa Sebutharga Majlis Perbandaran Selayang (MPS) yang bersidang pada <strong>{meetingDate || '.........................'}</strong> dengan rotasi bagi syarikat :-
                                    </p>
                                    
                                    <div className="space-y-12 mt-12">
                                        <div className="border-b border-black w-full h-1"></div>
                                        <div className="border-b border-black w-full h-1"></div>
                                    </div>

                                    {/* Signature */}
                                    <div className="mt-auto text-[13px] text-black dark:text-black">
                                        <div className="mb-4">Tandatangan :</div>
                                        <div>Tarikh &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;:</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CoverPageEditor;