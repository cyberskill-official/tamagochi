import type { FRRecord } from './types.ts';

export const BUILD_ORDER = [
  'FR-LEGAL-001', 'FR-LEGAL-002', 'FR-LEGAL-003',
  'FR-INFRA-001', 'FR-INFRA-002', 'FR-INFRA-003',
  'FR-AUTH-001', 'FR-AUTH-002', 'FR-AUTH-003',
  'FR-OBS-001',
  'FR-ART-001',
  'FR-PET-001', 'FR-PET-002', 'FR-PET-003', 'FR-PET-004',
  'FR-CARE-001', 'FR-CARE-002', 'FR-CARE-003', 'FR-CARE-004', 'FR-CARE-005',
  'FR-AI-001', 'FR-AI-002',
  'FR-AR-001',
  'FR-VIRAL-001',
  'FR-PET-005', 'FR-PET-006', 'FR-PET-007', 'FR-PET-008',
  'FR-SOCIAL-001', 'FR-SOCIAL-002', 'FR-SOCIAL-003', 'FR-SOCIAL-004',
  'FR-VIRAL-002', 'FR-VIRAL-003',
  'FR-ECON-001', 'FR-ECON-002', 'FR-ECON-003',
  'FR-SUB-001', 'FR-SUB-002',
  'FR-ADS-001', 'FR-ADS-002',
  'FR-VIRAL-004', 'FR-VIRAL-005',
  'FR-OBS-002',
  'FR-I18N-001', 'FR-I18N-002',
  'FR-A11Y-001',
  'FR-AI-003',
  'FR-B2B-001', 'FR-B2B-002', 'FR-B2B-003', 'FR-B2B-004', 'FR-B2B-005'
] as const;

const phaseById: Record<string, FRRecord['phase']> = {
  LEGAL: 'P0', INFRA: 'P0', AUTH: 'P0',
  OBS: 'P0', ART: 'P1', PET: 'P1', CARE: 'P1', AI: 'P1', AR: 'P1', VIRAL: 'P1',
  SOCIAL: 'P2', ECON: 'P3', SUB: 'P3', ADS: 'P3', I18N: 'P4', A11Y: 'P4', B2B: 'P4'
};

export function implementedFrs(): FRRecord[] {
  return BUILD_ORDER.map((id) => {
    const module = id.split('-')[1]!;
    const p4Ids = ['FR-OBS-002', 'FR-I18N-001', 'FR-I18N-002', 'FR-A11Y-001', 'FR-AI-003', 'FR-B2B-001', 'FR-B2B-002', 'FR-B2B-003', 'FR-B2B-004', 'FR-B2B-005'];
    const p2Viral = ['FR-VIRAL-002', 'FR-VIRAL-003'];
    const phase = p4Ids.includes(id) ? 'P4' : p2Viral.includes(id) ? 'P2' : phaseById[module]!;
    return { id, module, phase, status: 'shipped' };
  });
}
