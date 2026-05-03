import React from 'react';
import clsx from 'clsx';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import styles from './index.module.css';

export default function Home(): JSX.Element {
  return (
    <Layout
      title="Data Engineering Roadmap"
      description="Learn Data Engineering with real projects, Azure, Databricks, and interview prep"
    >
      <header className={styles.heroBanner}>
        <div className="container">
          <h1 className="hero__title">
            Become a Data Engineer (Not Just Another Tutorial Follower)
          </h1>
          <p className="hero__subtitle">
            Learn Data Engineering from scratch using real-world projects,
            Azure, Databricks, and production-level concepts.
          </p>

          <div style={{ marginTop: '20px' }}>
            <Link
              className="button button--primary button--lg"
              to="/docs/intro"
            >
              Start Learning →
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* SECTION 1 */}
        <section className="container margin-vert--lg">
          <h2>What You’ll Learn</h2>
          <ul>
            <li>End-to-end Data Engineering roadmap</li>
            <li>Azure Data Factory + Databricks pipelines</li>
            <li>Delta Lake, Unity Catalog, Data Governance</li>
            <li>Real-world project implementation (SAP → Databricks)</li>
            <li>Interview preparation (SQL, PySpark, system design)</li>
          </ul>
        </section>

        {/* SECTION 2 */}
        <section className="container margin-vert--lg">
          <h2>Who This Is For</h2>
          <ul>
            <li>Beginners entering Data Engineering</li>
            <li>Developers switching to data roles</li>
            <li>Engineers stuck at tutorial level</li>
          </ul>
        </section>

        {/* SECTION 3 */}
        <section className="container margin-vert--lg">
          <h2>Why This Is Different</h2>
          <ul>
            <li>No fluff — only production-level concepts</li>
            <li>Focused on Azure + Databricks (real industry stack)</li>
            <li>Based on actual project experience</li>
          </ul>
        </section>

        {/* CTA */}
        <section className="container margin-vert--lg">
          <h2>Start Now</h2>
          <Link
            className="button button--secondary button--lg"
            to="/docs/intro"
          >
            Go to Roadmap →
          </Link>
        </section>
      </main>
    </Layout>
  );
}