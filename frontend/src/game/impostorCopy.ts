import { Ghost, Shield, VenetianMask } from 'lucide-react'
import type { ImpostorRole } from '../types/game'

export const ROLE_COPY: Record<
  ImpostorRole,
  {
    title: string
    hint: string
    icon: typeof Shield
    bg: string
    fg: string
  }
> = {
  CIVIL: {
    title: 'Civil',
    hint: 'Tu as le vrai mot. Donne un indice, sans le dire. Débusque les imposteurs.',
    icon: Shield,
    bg: '#8B5CF6',
    fg: '#FFFFFF',
  },
  IMPOSTOR: {
    title: 'Imposteur',
    hint: 'Ton mot est faux. Fond-toi dans le groupe. Tu ne devines pas si on t’élimine.',
    icon: VenetianMask,
    bg: '#FF69B4',
    fg: '#FFFFFF',
  },
  MR_WHITE: {
    title: 'Mr White',
    hint: 'Aucun mot. Bluffe. Si on te trouve, tu peux encore gagner en devinant le mot des civils.',
    icon: Ghost,
    bg: '#F4F4F5',
    fg: '#1A1A1A',
  },
}
