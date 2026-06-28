import 'server-only';
import { createRuleEngine } from '@/rule-engine/index';
import { rules } from '@/rules/rules';

export const engine = createRuleEngine({ rules });
