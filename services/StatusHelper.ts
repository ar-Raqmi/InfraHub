import { ProjectStatus } from '../types';

export class StatusHelper {
  static getStatusColor(status: ProjectStatus): string {
    switch (status) {
      case ProjectStatus.FASA_DRAF: return 'bg-slate-100 text-slate-700 border-slate-200';
      case ProjectStatus.MENUNGGU_LANTIKAN: return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case ProjectStatus.DALAM_PROSES: return 'bg-blue-100 text-blue-700 border-blue-200';
      case ProjectStatus.PEMERIKSAAN_TAPAK: return 'bg-indigo-100 text-indigo-700 border-indigo-200';
      case ProjectStatus.TUNTUTAN_BAYARAN: return 'bg-orange-100 text-orange-700 border-orange-200';
      case ProjectStatus.SIAP: return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      default: return 'bg-gray-100 text-gray-700';
    }
  }

  static getStatusLabel(status: ProjectStatus): string {
    switch (status) {
      case ProjectStatus.FASA_DRAF: return 'Draf';
      case ProjectStatus.MENUNGGU_LANTIKAN: return 'Menunggu Lantikan';
      case ProjectStatus.DALAM_PROSES: return 'Dalam Proses';
      case ProjectStatus.PEMERIKSAAN_TAPAK: return 'Pemeriksaan Tapak';
      case ProjectStatus.TUNTUTAN_BAYARAN: return 'Tuntutan Bayaran';
      case ProjectStatus.SIAP: return 'Siap';
      default: return status;
    }
  }
}
