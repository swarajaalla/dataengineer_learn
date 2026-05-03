import type { SidebarsConfig } from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  tutorialSidebar: [
    'intro',

    {
      type: 'category',
      label: 'Phase 0: Mindset & Setup',
      items: ['mindset', 'setup'],
    },

    {
      type: 'category',
      label: 'Phase 1: Core Foundations',
      items: ['fundamentals', 'sql', 'python'],
    },

    {
      type: 'category',
      label: 'Phase 2: Data Engineering Core',
      items: ['etl', 'data-modeling', 'batch-vs-streaming'],
    },

    {
      type: 'category',
      label: 'Phase 3: Big Data & Processing',
      items: ['spark', 'delta-lake'],
    },

    {
      type: 'category',
      label: 'Phase 4: Cloud & Production',
      items: ['cloud', 'orchestration', 'ci-cd'],
    },

    {
      type: 'category',
      label: 'Phase 5: Real Projects',
      items: ['projects', 'case-study'],
    },

    {
      type: 'category',
      label: 'Phase 6: Interviews & Jobs',
      items: ['interview-prep', 'resume', 'system-design'],
    },
  ],
};

export default sidebars;