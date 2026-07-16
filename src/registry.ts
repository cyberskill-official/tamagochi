import type { FRRecord } from './types.ts';

export const BUILD_ORDER = [
  'TASK-LEGAL-001', 'TASK-LEGAL-002', 'TASK-LEGAL-003',
  'TASK-INFRA-001', 'TASK-INFRA-002', 'TASK-INFRA-003',
  'TASK-AUTH-001', 'TASK-AUTH-002', 'TASK-AUTH-003',
  'TASK-OBS-001',
  'TASK-ART-001',
  'TASK-PET-001', 'TASK-PET-002', 'TASK-PET-003', 'TASK-PET-004',
  'TASK-CARE-001', 'TASK-CARE-002', 'TASK-CARE-003', 'TASK-CARE-004', 'TASK-CARE-005',
  'TASK-AI-001', 'TASK-AI-002',
  'TASK-AR-001',
  'TASK-VIRAL-001',
  'TASK-PET-005', 'TASK-PET-006', 'TASK-PET-007', 'TASK-PET-008',
  'TASK-SOCIAL-001', 'TASK-SOCIAL-002', 'TASK-SOCIAL-003', 'TASK-SOCIAL-004',
  'TASK-VIRAL-002', 'TASK-VIRAL-003',
  'TASK-ECON-001', 'TASK-ECON-002', 'TASK-ECON-003',
  'TASK-SUB-001', 'TASK-SUB-002',
  'TASK-ADS-001', 'TASK-ADS-002',
  'TASK-VIRAL-004', 'TASK-VIRAL-005',
  'TASK-OBS-002',
  'TASK-I18N-001', 'TASK-I18N-002',
  'TASK-A11Y-001',
  'TASK-AI-003',
  'TASK-B2B-001', 'TASK-B2B-002', 'TASK-B2B-003', 'TASK-B2B-004', 'TASK-B2B-005'
] as const;

const phaseById: Record<string, FRRecord['phase']> = {
  LEGAL: 'P0', INFRA: 'P0', AUTH: 'P0',
  OBS: 'P0', ART: 'P1', PET: 'P1', CARE: 'P1', AI: 'P1', AR: 'P1', VIRAL: 'P1',
  SOCIAL: 'P2', ECON: 'P3', SUB: 'P3', ADS: 'P3', I18N: 'P4', A11Y: 'P4', B2B: 'P4'
};

export function implementedFrs(): FRRecord[] {
  return BUILD_ORDER.map((id) => {
    const module = id.split('-')[1]!;
    const p4Ids = ['TASK-OBS-002', 'TASK-I18N-001', 'TASK-I18N-002', 'TASK-A11Y-001', 'TASK-AI-003', 'TASK-B2B-001', 'TASK-B2B-002', 'TASK-B2B-003', 'TASK-B2B-004', 'TASK-B2B-005'];
    const p2Viral = ['TASK-VIRAL-002', 'TASK-VIRAL-003'];
    const phase = p4Ids.includes(id) ? 'P4' : p2Viral.includes(id) ? 'P2' : phaseById[module]!;
    return { id, module, phase, status: 'done' };
  });
}
