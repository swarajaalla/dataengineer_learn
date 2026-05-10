import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const config: Config = {
  title: 'Data engineer Learn',
  tagline: 'Learn data engineering from scratch with real projects and interview prep',
  favicon: 'img/favicon.ico',

  // Future flags, see https://docusaurus.io/docs/api/docusaurus-config#future
  future: {
    v4: true, // Improve compatibility with the upcoming Docusaurus v4
  },

  // Set the production url of your site here
  url: 'https://learn.dataengineer.com',
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: '/',

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: 'Swaraj_learn', // Usually your GitHub org/user name.
  projectName: 'dataengineer_learn', // Usually your repo name.

  onBrokenLinks: 'throw',

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          editUrl:
            'https://github.com/swarajaalla/dataengineer_learn/tree/master',
        },
        blog: {
          showReadingTime: true,
          feedOptions: {
            type: ['rss', 'atom'],
            xslt: true,
          },
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          editUrl:
            'https://github.com/swarajaalla/dataengineer_learn.git',
          // Useful options to enforce blogging best practices
          onInlineTags: 'warn',
          onInlineAuthors: 'warn',
          onUntruncatedBlogPosts: 'warn',
        },
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    // Replace with your project's social card
    image: 'img/docusaurus-social-card.jpg',
    colorMode: {
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: 'DE Learn',
      logo: {
        alt: 'Data Engineering Learn',
        src: 'img/logo.svg',
      },
      items: [
        {
          to: '/docs/intro',
          label: 'Roadmap',
          position: 'left',
        },
        {
          to: '/docs/tools',
          label: 'Tools',
          position: 'left',
        },
        {
          to: '/docs/cloud-platforms',
          label: 'Cloud',
          position: 'left',
        },
        {
          to: '/docs/phase-7-real-projects/case-studies/sap-databricks-migration',
          label: 'Case Studies',
          position: 'left',
        },
        {
          to: '/docs/phase-8-interviews-career/interview-prep/sql-questions',
          label: 'Interview Prep',
          position: 'left',
        },
        {
          href: 'https://github.com/swarajaalla/dataengineer_learn.git',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Learn',
          items: [
            { label: 'Roadmap', to: '/docs/intro' },
            { label: 'Tools & Technologies', to: '/docs/tools' },
            { label: 'Cloud Platforms', to: '/docs/cloud-platforms' },
          ],
        },
        {
          title: 'Deep Dives',
          items: [
            { label: 'Case Studies', to: '/docs/phase-7-real-projects/case-studies/sap-databricks-migration' },
            { label: 'Interview Prep', to: '/docs/phase-8-interviews-career/interview-prep/sql-questions' },
            { label: 'System Design', to: '/docs/phase-8-interviews-career/interview-prep/spark-questions' },
          ],
        },
        {
          title: 'More',
          items: [
            {
              label: 'GitHub',
              href: 'https://github.com/swarajaalla/dataengineer_learn.git',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Data Engineering Learn. Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
