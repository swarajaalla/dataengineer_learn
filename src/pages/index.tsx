import React from 'react';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import styles from './index.module.css';

const roadmapPhases = [
  {
    phase: '0',
    label: 'Mindset & Setup',
    desc: 'How to think like a data engineer. VS Code, Git, Python, and Databricks Community setup.',
    topics: ['Mental models', 'Dev environment', 'Git workflow'],
    link: '/docs/phase-0-mindset/what-is-data-engineering',
  },
  {
    phase: '1',
    label: 'Core Foundations',
    desc: 'The skills every DE uses every day — SQL window functions, Python scripting, file formats.',
    topics: ['SQL & window functions', 'Python for pipelines', 'Parquet / JSON / CSV'],
    link: '/docs/phase-1-core-foundations/sql/basics',
  },
  {
    phase: '2',
    label: 'Data Engineering Core',
    desc: 'Storage systems, file formats, ingestion patterns, data modeling, streaming — the full DE toolkit.',
    topics: ['Medallion architecture', 'Star schema & SCD2', 'CDC & batch ingestion'],
    link: '/docs/phase-2-data-engineering-core/intro',
  },
  {
    phase: '3',
    label: 'Big Data & Processing',
    desc: 'Apache Spark from architecture to performance tuning. Delta Lake ACID transactions and MERGE.',
    topics: ['Spark internals', 'PySpark transformations', 'Delta Lake'],
    link: '/docs/phase-3-big-data-processing/spark/spark-architecture',
  },
  {
    phase: '4',
    label: 'Cloud Platforms',
    desc: 'Azure (primary), AWS, and GCP — storage, compute, and security services for data engineers.',
    topics: ['ADLS + ADF + Synapse', 'S3 + Glue + Redshift', 'BigQuery + Dataproc'],
    link: '/docs/phase-4-cloud-platforms/azure/adls',
  },
  {
    phase: '5',
    label: 'Production Engineering',
    desc: 'What separates hobby projects from production systems: orchestration, CI/CD, monitoring, system design.',
    topics: ['Pipeline patterns', 'System design', 'Scalability & trade-offs'],
    link: '/docs/phase-5-production-engineering/system-design/pipeline-patterns',
  },
  {
    phase: '6',
    label: 'Tools & Platforms',
    desc: 'Deep dives into Databricks, Snowflake, and Kafka — the platforms most DE job descriptions require.',
    topics: ['Databricks Unity Catalog', 'Snowflake architecture', 'Kafka brokers & consumers'],
    link: '/docs/phase-6-tools-platforms/databricks/workspace-overview',
  },
  {
    phase: '7',
    label: 'Real Projects',
    desc: 'End-to-end builds and production case studies. SAP migration, DQX framework, medallion lakehouse.',
    topics: ['Full medallion project', 'SAP → Databricks migration', 'DQX data quality'],
    link: '/docs/phase-7-real-projects/case-studies/sap-databricks-migration',
  },
  {
    phase: '8',
    label: 'Interviews & Career',
    desc: 'SQL challenges, Spark questions, system design prep, certifications, and job strategy.',
    topics: ['SQL & Spark interview Q&A', 'DP-203 / Databricks cert', 'Resume & networking'],
    link: '/docs/phase-8-interviews-career/interview-prep/sql-questions',
  },
];

const toolSections = [
  {
    title: 'Processing',
    tools: ['Apache Spark', 'Databricks', 'dbt', 'PySpark'],
  },
  {
    title: 'Storage',
    tools: ['Delta Lake', 'Snowflake', 'ADLS Gen2', 'Parquet'],
  },
  {
    title: 'Orchestration',
    tools: ['Azure Data Factory', 'Airflow', 'Databricks Workflows'],
  },
  {
    title: 'Visualization',
    tools: ['Power BI', 'Tableau', 'Looker', 'Superset'],
  },
];

export default function Home(): JSX.Element {
  return (
    <Layout
      title="Data Engineering Roadmap"
      description="Learn Data Engineering with real projects, Azure, Databricks, and interview prep"
    >
      {/* HERO */}
      <header className={styles.heroBanner}>
        <div className="container">
          <h1 className="hero__title">
            Become a Production-Ready Data Engineer
          </h1>
          <p className="hero__subtitle">
            A no-fluff roadmap built on real Azure + Databricks experience.
            Learn the patterns, tools, and design thinking that matter in production.
          </p>
          <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link className="button button--primary button--lg" to="/docs/intro">
              View Roadmap →
            </Link>
            <Link className="button button--secondary button--lg" to="/docs/tools">
              Explore Tools
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* ROADMAP PHASES */}
        <section className="container margin-vert--xl">
          <h2 style={{ textAlign: 'center', marginBottom: '0.5rem' }}>The Learning Path</h2>
          <p style={{ textAlign: 'center', color: 'var(--ifm-color-emphasis-700)', marginBottom: '2rem' }}>
            9 phases from zero to interview-ready. Each phase builds on the last.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
            {roadmapPhases.map((p) => (
              <Link
                key={p.phase}
                to={p.link}
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                <div style={{
                  border: '1px solid var(--ifm-color-emphasis-300)',
                  borderRadius: '8px',
                  padding: '1.25rem',
                  height: '100%',
                  transition: 'box-shadow 0.2s, border-color 0.2s',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{
                      background: 'var(--ifm-color-primary)',
                      color: '#fff',
                      borderRadius: '4px',
                      padding: '0.1rem 0.5rem',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      letterSpacing: '0.05em',
                    }}>
                      PHASE {p.phase}
                    </span>
                    <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{p.label}</span>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--ifm-color-emphasis-700)', lineHeight: 1.5 }}>
                    {p.desc}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: 'auto', paddingTop: '0.5rem' }}>
                    {p.topics.map((topic) => (
                      <span key={topic} style={{
                        background: 'var(--ifm-color-emphasis-100)',
                        border: '1px solid var(--ifm-color-emphasis-200)',
                        borderRadius: '4px',
                        padding: '0.1rem 0.45rem',
                        fontSize: '0.75rem',
                        color: 'var(--ifm-color-emphasis-800)',
                      }}>
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>
              </Link>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
            <Link className="button button--outline button--primary" to="/docs/intro">
              View Full Roadmap →
            </Link>
          </div>
        </section>

        {/* TOOLS OVERVIEW */}
        <section style={{ background: 'var(--ifm-color-emphasis-100)', padding: '3rem 0' }}>
          <div className="container">
            <h2 style={{ textAlign: 'center', marginBottom: '0.5rem' }}>Tools You'll Master</h2>
            <p style={{ textAlign: 'center', color: 'var(--ifm-color-emphasis-700)', marginBottom: '2rem' }}>
              Industry-standard stack used in real enterprise pipelines.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
              {toolSections.map((section) => (
                <div key={section.title} style={{
                  background: 'var(--ifm-background-color)',
                  borderRadius: '8px',
                  padding: '1rem',
                  border: '1px solid var(--ifm-color-emphasis-300)',
                }}>
                  <div style={{ fontWeight: 700, marginBottom: '0.75rem', fontSize: '0.875rem', color: 'var(--ifm-color-primary)' }}>
                    {section.title.toUpperCase()}
                  </div>
                  {section.tools.map((tool) => (
                    <div key={tool} style={{ fontSize: '0.875rem', padding: '0.2rem 0' }}>
                      {tool}
                    </div>
                  ))}
                </div>
              ))}
            </div>
            <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
              <Link className="button button--outline button--primary" to="/docs/tools">
                See All Tools & Languages →
              </Link>
            </div>
          </div>
        </section>

        {/* CLOUD SECTION */}
        <section className="container margin-vert--xl">
          <h2 style={{ textAlign: 'center', marginBottom: '0.5rem' }}>Cloud Platforms</h2>
          <p style={{ textAlign: 'center', color: 'var(--ifm-color-emphasis-700)', marginBottom: '2rem' }}>
            Azure, AWS, and GCP — the relevant services for data engineers, side by side.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1rem' }}>
            {[
              { name: 'Microsoft Azure', focus: 'Most common in enterprise DE. ADF + Databricks + ADLS is the standard stack.', color: '#0078d4' },
              { name: 'Amazon Web Services', focus: 'Largest cloud by market share. S3 + Glue + Redshift + EMR.', color: '#ff9900' },
              { name: 'Google Cloud', focus: 'BigQuery is the best serverless warehouse. Strong in analytics-first teams.', color: '#4285f4' },
            ].map((cloud) => (
              <div key={cloud.name} style={{
                border: `2px solid ${cloud.color}20`,
                borderRadius: '8px',
                padding: '1.25rem',
              }}>
                <div style={{ fontWeight: 700, color: cloud.color, marginBottom: '0.5rem' }}>{cloud.name}</div>
                <div style={{ fontSize: '0.875rem', color: 'var(--ifm-color-emphasis-700)' }}>{cloud.focus}</div>
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
            <Link className="button button--outline button--primary" to="/docs/cloud-platforms">
              Full Cloud Platform Reference →
            </Link>
          </div>
        </section>

        {/* WHY THIS IS DIFFERENT */}
        <section style={{ background: 'var(--ifm-color-emphasis-100)', padding: '3rem 0' }}>
          <div className="container">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1.5rem' }}>
              {[
                {
                  title: 'No Fluff',
                  desc: 'Every page has real code, real trade-offs, and real design decisions. No motivational content.',
                },
                {
                  title: 'Production-Level Patterns',
                  desc: 'MERGE, incremental loads, SCD2, medallion architecture — the patterns that actually appear in enterprise pipelines.',
                },
                {
                  title: 'Built from Experience',
                  desc: 'Content built on 4+ years of Azure + Databricks production engineering. Not a tutorial rewrite.',
                },
                {
                  title: 'Interview Ready',
                  desc: 'SQL challenges, Spark questions, system design — everything you need to prep for a senior DE role.',
                },
              ].map((item) => (
                <div key={item.title} style={{ padding: '1rem' }}>
                  <div style={{ fontWeight: 700, marginBottom: '0.5rem' }}>{item.title}</div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--ifm-color-emphasis-700)' }}>{item.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CASE STUDIES CTA */}
        <section className="container margin-vert--xl" style={{ textAlign: 'center' }}>
          <h2>Real Case Studies</h2>
          <p style={{ color: 'var(--ifm-color-emphasis-700)', maxWidth: '600px', margin: '0 auto 1.5rem' }}>
            SAP to Databricks Unity Catalog migration. Data quality framework with DQX.
            Architecture, challenges, and lessons from production implementations.
          </p>
          <Link className="button button--primary button--lg" to="/docs/phase-7-real-projects/case-studies/sap-databricks-migration">
            View Case Studies →
          </Link>
        </section>
      </main>
    </Layout>
  );
}
