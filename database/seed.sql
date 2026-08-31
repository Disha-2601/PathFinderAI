-- PathFinder AI - Comprehensive Synthetic Domain Seed Dataset (Stage 2)
-- Contains 20 core tech skills, 60 specialized engineering courses, course skill weights, DAG prerequisites, and mock assessments.

-- ============================================================================
-- 1. SEED 20 TECH SKILLS
-- ============================================================================
INSERT INTO skills (id, name, category, description) VALUES
('10000000-0000-0000-0000-000000000001', 'Python Programming', 'Programming Languages', 'Core Python syntax, data structures, OOP, functional patterns, and packaging.'),
('10000000-0000-0000-0000-000000000002', 'TypeScript & JavaScript', 'Programming Languages', 'Modern ECMAScript, static typing, interfaces, generics, and async asynchronous programming.'),
('10000000-0000-0000-0000-000000000003', 'Go (Golang)', 'Programming Languages', 'High-concurrency systems programming, goroutines, channels, and microservices in Go.'),
('10000000-0000-0000-0000-000000000004', 'Rust Systems Programming', 'Programming Languages', 'Memory safety without garbage collection, borrow checker, lifecycles, and low-level performance.'),
('10000000-0000-0000-0000-000000000005', 'FastAPI & Async Python', 'Backend Frameworks', 'High-performance asynchronous REST and WebSocket API development with Pydantic and OpenAPI.'),
('10000000-0000-0000-0000-000000000006', 'Node.js & Express', 'Backend Frameworks', 'Event-driven server-side JavaScript/TypeScript, middleware chains, and REST architecture.'),
('10000000-0000-0000-0000-000000000007', 'PostgreSQL & Relational DBs', 'Databases', 'Relational database modeling, query optimization, indexing, ACID transactions, and CTEs.'),
('10000000-0000-0000-0000-000000000008', 'Redis & In-Memory Caching', 'Databases', 'Key-value caching, Pub/Sub, rate limiting, session storage, and Redis data structures.'),
('10000000-0000-0000-0000-000000000009', 'Vector Databases & pgvector', 'Artificial Intelligence', 'Vector embeddings, cosine similarity, ANN indexing (HNSW, IVFFlat), Pinecone, and Qdrant.'),
('10000000-0000-0000-0000-000000000010', 'Large Language Models (LLMs)', 'Artificial Intelligence', 'Prompt engineering, tokenization, transformer architectures, fine-tuning, and model evaluation.'),
('10000000-0000-0000-0000-000000000011', 'Retrieval-Augmented Generation (RAG)', 'Artificial Intelligence', 'Document chunking, hybrid search, reranking, contextual compression, and LangChain/LlamaIndex.'),
('10000000-0000-0000-0000-000000000012', 'AI Agents & Tool Orchestration', 'Artificial Intelligence', 'Autonomous multi-agent architectures, function calling, tool use, reflection, and planning loops.'),
('10000000-0000-0000-0000-000000000013', 'Machine Learning Foundations', 'Artificial Intelligence', 'Supervised & unsupervised learning, gradient descent, loss functions, scikit-learn, and evaluation metrics.'),
('10000000-0000-0000-0000-000000000014', 'React & Frontend Architecture', 'Frontend Engineering', 'Component hierarchy, state management (Zustand/Redux), hooks, Suspense, and virtual DOM optimization.'),
('10000000-0000-0000-0000-000000000015', 'Tailwind CSS & Design Systems', 'Frontend Engineering', 'Responsive utility-first layouts, design tokens, micro-interactions, and accessible UI engineering.'),
('10000000-0000-0000-0000-000000000016', 'Docker & Containerization', 'DevOps & Cloud', 'Dockerfile best practices, multi-stage builds, container isolation, and docker-compose orchestration.'),
('10000000-0000-0000-0000-000000000017', 'Kubernetes & Cloud Orchestration', 'DevOps & Cloud', 'Pods, Deployments, Services, Ingress, Helm charts, stateful sets, and cluster management.'),
('10000000-0000-0000-0000-000000000018', 'AWS Cloud Architecture', 'DevOps & Cloud', 'Core AWS infrastructure: IAM, EC2, ECS, Lambda serverless, S3, RDS, VPC networking, and CloudFront.'),
('10000000-0000-0000-0000-000000000019', 'CI/CD & DevOps Automation', 'DevOps & Cloud', 'GitHub Actions, automated test pipelines, trunk-based development, semantic release, and Docker publishing.'),
('10000000-0000-0000-0000-000000000020', 'Distributed Systems & System Design', 'System Architecture', 'Scalability, CAP theorem, load balancing, message queues (Kafka/RabbitMQ), consistency models, and microservices.')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, category = EXCLUDED.category, description = EXCLUDED.description;

-- ============================================================================
-- 2. SEED 60 SPECIALIZED ENGINEERING COURSES
-- ============================================================================
INSERT INTO courses (id, title, provider, description, difficulty, duration_hours, rating, url, cost) VALUES
-- Python & Core Programming (1-6)
('20000000-0000-0000-0000-000000000001', 'Python for Software Engineers', 'MIT OpenCourseWare', 'Rigorous foundation in computer science and programming using Python, focusing on algorithms, object-oriented design, and algorithmic complexity.', 'beginner', 35, 4.85, 'https://ocw.mit.edu/courses/python-engineering', 0.00),
('20000000-0000-0000-0000-000000000002', 'Modern Python Deep Dive & Metaprogramming', 'DeepLearning.AI', 'Advanced Python language features including decorators, descriptors, generators, async iterators, and memory management under the GIL.', 'advanced', 25, 4.90, 'https://deeplearning.ai/advanced-python', 49.00),
('20000000-0000-0000-0000-000000000003', 'Mastering Modern TypeScript', 'Frontend Masters', 'Comprehensive TypeScript covering generic constraints, mapped types, conditional types, template literal types, and AST transformations.', 'intermediate', 20, 4.88, 'https://frontendmasters.com/typescript-mastery', 39.00),
('20000000-0000-0000-0000-000000000004', 'Go: Building High-Performance Concurrent Systems', 'Go Academy', 'Learn idiomatic Go, memory layouts, CSP concurrency with channels and select loops, and high-throughput networking services.', 'intermediate', 30, 4.78, 'https://golang.org/learn-concurrency', 59.00),
('20000000-0000-0000-0000-000000000005', 'Rust for Systems Programmers', 'Stanford Online', 'Comprehensive systems development in Rust covering ownership, borrowing, lifetimes, fearless concurrency, and unsafe Rust boundaries.', 'advanced', 40, 4.92, 'https://online.stanford.edu/rust-systems', 79.00),
('20000000-0000-0000-0000-000000000006', 'Data Structures and Algorithms in Modern Python', 'Coursera', 'Essential data structures (trees, graphs, heaps, hash tables) and dynamic programming algorithms analyzed using Python 3.', 'intermediate', 30, 4.80, 'https://coursera.org/learn/dsa-python', 0.00),

-- Backend APIs & Microservices (7-15)
('20000000-0000-0000-0000-000000000007', 'Building Production REST APIs with FastAPI', 'FastAPI Official', 'Step-by-step production backend development using FastAPI, Pydantic v2 validation, SQLAlchemy async ORM, and automated OpenAPI documentation.', 'beginner', 18, 4.91, 'https://fastapi.tiangolo.com/tutorial', 0.00),
('20000000-0000-0000-0000-000000000008', 'Enterprise Node.js & TypeScript Backend Architecture', 'Udemy', 'Clean architecture, domain-driven design, dependency injection, and scalable Express/Node microservices with TypeScript.', 'intermediate', 28, 4.75, 'https://udemy.com/course/enterprise-nodejs-typescript', 29.99),
('20000000-0000-0000-0000-000000000009', 'Event-Driven Microservices with Go and gRPC', 'O Reilly Media', 'Designing low-latency event-driven microservices using protocol buffers, gRPC streaming, and distributed tracing.', 'advanced', 24, 4.82, 'https://oreilly.com/grpc-go-microservices', 89.00),
('20000000-0000-0000-0000-000000000010', 'High-Throughput WebSocket and Streaming Servers', 'Pluralsight', 'Building real-time full-duplex communication backends with WebSockets, SSE, and ASGI async server patterns in Python and Node.', 'intermediate', 16, 4.68, 'https://pluralsight.com/courses/websocket-streaming', 35.00),
('20000000-0000-0000-0000-000000000011', 'Authentication and Authorization Security (OAuth2 & JWT)', 'Security Innovation', 'Deep dive into stateless JWT validation, refresh token rotation, OAuth2 authorization code flows, RBAC, and OWASP API security.', 'intermediate', 15, 4.86, 'https://securityinnovation.com/oauth2-jwt-mastery', 49.00),
('20000000-0000-0000-0000-000000000012', 'GraphQL API Design and Federation', 'Apollo GraphQL', 'Schema-first GraphQL API design, DataLoader N+1 query solving, Apollo Federation subgraphs, and query complexity mitigation.', 'intermediate', 20, 4.77, 'https://apollographql.com/tutorials/federation', 0.00),
('20000000-0000-0000-0000-000000000013', 'API Gateway Patterns & Rate Limiting', 'Educative', 'Designing API gateway layers, token bucket rate limiters, request routing, reverse proxies, and TLS termination.', 'advanced', 14, 4.73, 'https://educative.io/courses/api-gateway-patterns', 39.00),
('20000000-0000-0000-0000-000000000014', 'Asynchronous Job Queues and Background Workers', 'Coursera', 'Scaling asynchronous task execution using Celery, BullMQ, Redis queues, retry strategies, and dead-letter queues.', 'intermediate', 18, 4.79, 'https://coursera.org/learn/async-worker-queues', 29.00),
('20000000-0000-0000-0000-000000000015', 'Resilient Microservices with Circuit Breakers & Retries', 'Packt Publishing', 'Fault tolerance patterns in distributed systems including circuit breakers, exponential backoff, jitter, and bulkhead isolation.', 'advanced', 16, 4.71, 'https://packt.com/resilient-microservices', 45.00),

-- Databases & Caching (16-24)
('20000000-0000-0000-0000-000000000016', 'PostgreSQL Query Optimization and Internals', 'Postgres Weekly', 'Understanding PostgreSQL query plans (EXPLAIN ANALYZE), index types (B-Tree, GIN, GiST), connection pooling with PgBouncer, and MVCC internals.', 'advanced', 26, 4.93, 'https://postgresweekly.com/query-optimization', 65.00),
('20000000-0000-0000-0000-000000000017', 'Relational Data Modeling with PostgreSQL and Supabase', 'Supabase University', 'Schema design, foreign key cascading, Row Level Security (RLS) policies, database triggers, and stored procedures.', 'beginner', 18, 4.89, 'https://supabase.com/docs/guides/database', 0.00),
('20000000-0000-0000-0000-000000000018', 'Redis for High-Performance Caching and State Management', 'Redis University', 'Redis caching strategies (Cache-Aside, Write-Through), eviction policies, HyperLogLog, Sorted Sets for leaderboards, and Redis Streams.', 'intermediate', 16, 4.84, 'https://university.redis.com/courses/ru101', 0.00),
('20000000-0000-0000-0000-000000000019', 'Vector Databases & pgvector in Practice', 'Pinecone Academy', 'Storing and querying high-dimensional dense embeddings using pgvector, HNSW indexing, IVFFlat, cosine similarity, and L2 distance metrics.', 'intermediate', 14, 4.92, 'https://pinecone.io/learn/vector-databases', 0.00),
('20000000-0000-0000-0000-000000000020', 'Database Sharding, Replication, and High Availability', 'DataCamp', 'Multi-region active-passive replication, read replicas, horizontal table sharding, and consensus algorithms for zero-downtime databases.', 'expert', 22, 4.81, 'https://datacamp.com/courses/database-sharding', 79.00),
('20000000-0000-0000-0000-000000000021', 'Time-Series and Analytical Data Pipelines', 'ClickHouse Official', 'Designing high-volume append-only time-series databases, column-oriented storage, ClickHouse ingestion, and analytical aggregations.', 'advanced', 20, 4.76, 'https://clickhouse.com/learn/analytics', 0.00),
('20000000-0000-0000-0000-000000000022', 'Database Migrations and Schema Evolution in CI/CD', 'Prisma Academy', 'Zero-downtime database migrations, blue-green schema evolution, backward compatibility, and automated schema validation.', 'intermediate', 12, 4.74, 'https://prisma.io/academy/migrations', 0.00),
('20000000-0000-0000-0000-000000000023', 'ACID Transactions, Locking, and Isolation Levels', 'Harvard Online', 'Deep investigation into dirty reads, non-repeatable reads, phantom reads, 2-phase locking, and distributed 2PC transactions.', 'advanced', 18, 4.90, 'https://harvard.edu/database-transactions', 99.00),
('20000000-0000-0000-0000-000000000024', 'Search Engines: Full-Text Search with Postgres & Elasticsearch', 'Elastic Training', 'Inverted indexes, tokenization, BM25 ranking, fuzzy matching, and combining full-text search with vector embeddings.', 'intermediate', 20, 4.79, 'https://elastic.co/training/search-fundamentals', 49.00),

-- AI, Machine Learning, and LLMs (25-38)
('20000000-0000-0000-0000-000000000025', 'Machine Learning Foundations and Mathematical Principles', 'Coursera / Stanford', 'Andrew Ng’s comprehensive machine learning specialization covering linear regression, neural networks, SVMs, and model regularization.', 'beginner', 45, 4.94, 'https://coursera.org/specializations/machine-learning-introduction', 0.00),
('20000000-0000-0000-0000-000000000026', 'Deep Learning Specialization with PyTorch', 'DeepLearning.AI', 'Neural network architectures, convolution networks (CNNs), sequence models (RNNs/LSTMs), batch normalization, and PyTorch autograd.', 'intermediate', 50, 4.93, 'https://deeplearning.ai/deep-learning-specialization', 49.00),
('20000000-0000-0000-0000-000000000027', 'Transformer Architectures and Hugging Face Ecosystem', 'Hugging Face', 'Attention mechanisms, encoder-decoder models, BERT, GPT tokenization, Hugging Face transformers library, and model fine-tuning.', 'intermediate', 28, 4.91, 'https://huggingface.co/learn/nlp-course', 0.00),
('20000000-0000-0000-0000-000000000028', 'Generative AI with Large Language Models', 'DeepLearning.AI & AWS', 'LLM lifecycle, prompt engineering, instruction fine-tuning, LoRA/QLoRA parameter-efficient tuning, and RLHF reinforcement learning.', 'intermediate', 30, 4.88, 'https://deeplearning.ai/generative-ai-with-llms', 49.00),
('20000000-0000-0000-0000-000000000029', 'Building Production RAG Systems from Scratch', 'LlamaIndex Academy', 'Production-grade Retrieval-Augmented Generation: semantic chunking, multi-modal ingestion, hybrid search, Cohere rerankers, and RAG evaluation (Ragas).', 'intermediate', 22, 4.95, 'https://llamaindex.ai/learn/rag-production', 0.00),
('20000000-0000-0000-0000-000000000030', 'Autonomous AI Agents and Tool Orchestration', 'DeepLearning.AI', 'Building autonomous agents with LangGraph, AutoGen, and CrewAI featuring tool calling, hierarchical teams, memory persistence, and human-in-the-loop.', 'advanced', 24, 4.92, 'https://deeplearning.ai/ai-agents-orchestration', 39.00),
('20000000-0000-0000-0000-000000000031', 'Fine-Tuning Open Source LLMs (Llama 3, Mistral, Gemma)', 'Weights & Biases', 'Quantization (GGUF, AWQ), dataset synthesis, Unsloth fine-tuning, flash attention, and evaluating hallucination rates with W&B.', 'advanced', 26, 4.87, 'https://wandb.ai/courses/llm-fine-tuning', 0.00),
('20000000-0000-0000-0000-000000000032', 'Prompt Engineering and Context Window Optimization', 'OpenAI Academy', 'Few-shot prompting, Chain-of-Thought, ReAct framing, structured JSON outputs, and optimizing 1M+ token context windows.', 'beginner', 12, 4.82, 'https://platform.openai.com/docs/guides/prompt-engineering', 0.00),
('20000000-0000-0000-0000-000000000033', 'Sentence Transformers and Semantic Text Embeddings', 'UKPLab / Hugging Face', 'Bi-encoders, cross-encoders, contrastive loss, training custom domain embeddings with sentence-transformers, and MTEB benchmarks.', 'intermediate', 18, 4.89, 'https://sbert.net/tutorials/embeddings', 0.00),
('20000000-0000-0000-0000-000000000034', 'LLMOps: Deploying and Monitoring AI in Production', 'Full Stack Deep Learning', 'Model serving with vLLM, TensorRT-LLM, token-level streaming, latency benchmarks, cost optimization, and observability with OpenInference.', 'advanced', 32, 4.86, 'https://fullstackdeeplearning.com/llmops', 0.00),
('20000000-0000-0000-0000-000000000035', 'AI Safety, Guardrails, and Red Teaming', 'NVIDIA DLI', 'Guardrails AI, NeMo Guardrails, jailbreak prevention, PII masking, toxic content classification, and automated red teaming.', 'intermediate', 16, 4.79, 'https://nvidia.com/dli/ai-guardrails', 90.00),
('20000000-0000-0000-0000-000000000036', 'Multimodal AI: Vision, Audio, and Reasoning Models', 'Stanford Online', 'CLIP embeddings, Gemini Pro Vision, Whisper speech recognition, diffusion models, and multimodal agentic reasoning.', 'advanced', 25, 4.88, 'https://online.stanford.edu/multimodal-ai', 120.00),
('20000000-0000-0000-0000-000000000037', 'Knowledge Graphs and Hybrid Neuro-Symbolic AI', 'Neo4j GraphAcademy', 'Graph databases, Cypher queries, combining vector embeddings with knowledge graph relationships for accurate biomedical and financial reasoning.', 'advanced', 20, 4.83, 'https://graphacademy.neo4j.com/knowledge-graphs', 0.00),
('20000000-0000-0000-0000-000000000038', 'AI Code Generation and Developer Productivity Tooling', 'GitHub Universe', 'Tree-sitter AST parsing, language server protocol (LSP), automated unit test synthesis, and building Copilot extensions.', 'intermediate', 15, 4.75, 'https://github.blog/ai-code-generation', 0.00),

-- Frontend & Full-Stack (39-45)
('20000000-0000-0000-0000-000000000039', 'Modern React 18/19 & Component Architecture', 'Frontend Masters', 'React hooks (useActionState, useOptimistic), concurrency, server components, Suspense boundaries, and performance profiling.', 'beginner', 24, 4.87, 'https://frontendmasters.com/react-complete-guide', 39.00),
('20000000-0000-0000-0000-000000000040', 'Tailwind CSS Mastery & Custom UI Systems', 'Tailwind Labs', 'Building accessible component libraries, arbitrary variants, fluid typography, dark mode theming, and Framer Motion micro-animations.', 'beginner', 14, 4.92, 'https://tailwindcss.com/course', 0.00),
('20000000-0000-0000-0000-000000000041', 'State Management and Data Fetching with TanStack Query', 'TkDodo React', 'Server-state vs client-state, automatic query caching, optimistic UI updates, background prefetching, and Zustand integration.', 'intermediate', 16, 4.90, 'https://tkdodo.eu/blog/react-query', 0.00),
('20000000-0000-0000-0000-000000000042', 'Interactive Data Visualizations with Recharts and D3', 'Observable HQ', 'SVG geometry, interactive time-series charts, skill radar graphs, network hierarchy graphs, and responsive dashboards.', 'intermediate', 18, 4.80, 'https://observablehq.com/learn/data-viz', 35.00),
('20000000-0000-0000-0000-000000000043', 'Web Performance Optimization and Core Web Vitals', 'Google Chrome Developers', 'LCP, CLS, INP optimization, bundle splitting, tree shaking, asset preloading, and edge rendering.', 'advanced', 15, 4.85, 'https://web.dev/learn/performance', 0.00),
('20000000-0000-0000-0000-000000000044', 'Building AI Chat UIs with Streaming and Markdown', 'Vercel AI SDK', 'Vercel AI SDK, token streaming responses, LaTeX math rendering, code snippet copy blocks, and generative UI widgets.', 'intermediate', 16, 4.93, 'https://sdk.vercel.ai/docs', 0.00),
('20000000-0000-0000-0000-000000000045', 'Full-Stack Monorepo Architecture with Turborepo', 'Vercel Academy', 'Managing multi-package TypeScript workspaces, shared UI components, shared ESLint/tsconfig, and incremental remote caching.', 'advanced', 18, 4.78, 'https://turborepo.org/course', 0.00),

-- DevOps, Cloud, CI/CD, and Containers (46-54)
('20000000-0000-0000-0000-000000000046', 'Docker & Containerization for Developers', 'Docker Official', 'Building lean multi-stage Dockerfiles, non-root security principles, volume management, and container networking.', 'beginner', 15, 4.88, 'https://docker.com/101-tutorial', 0.00),
('20000000-0000-0000-0000-000000000047', 'Kubernetes from Basics to Production Clusters', 'Linux Foundation', 'CKA syllabus: Pod lifecycle, ReplicaSets, StatefulSets, Ingress controllers, Persistent Volumes, and cluster debugging.', 'intermediate', 38, 4.89, 'https://training.linuxfoundation.org/kubernetes-certified', 150.00),
('20000000-0000-0000-0000-000000000048', 'AWS Cloud Solutions Architect Fundamentals', 'AWS Training', 'VPC subnetting, NAT gateways, ALB load balancing, Auto-Scaling Groups, RDS multi-AZ, and S3 lifecycle policies.', 'intermediate', 42, 4.85, 'https://aws.amazon.com/training/architect', 0.00),
('20000000-0000-0000-0000-000000000049', 'Automated CI/CD with GitHub Actions', 'GitHub Learning Lab', 'Custom composite actions, workflow matrix builds, secret scanning, caching dependencies, and automatic container deployments.', 'beginner', 14, 4.86, 'https://github.com/features/actions', 0.00),
('20000000-0000-0000-0000-000000000050', 'Infrastructure as Code with Terraform and OpenTofu', 'HashiCorp Learn', 'Declarative HCL modules, state management, remote backends (S3/DynamoDB), and multi-environment AWS infrastructure provisioning.', 'intermediate', 26, 4.87, 'https://developer.hashicorp.com/terraform/tutorials', 0.00),
('20000000-0000-0000-0000-000000000051', 'Cloud-Native Observability: Prometheus, Grafana, OpenTelemetry', 'CNCF', 'Distributed tracing, structured JSON logs, RED metrics (Rate, Errors, Duration), Grafana alert manager, and OTEL collectors.', 'advanced', 22, 4.81, 'https://cncf.io/observability', 0.00),
('20000000-0000-0000-0000-000000000052', 'Zero-Trust Cloud Security and IAM Hardening', 'SANS Institute', 'Least-privilege IAM policies, AWS KMS envelope encryption, mutual TLS (mTLS), and runtime security with Falco.', 'advanced', 20, 4.90, 'https://sans.org/cloud-security', 190.00),
('20000000-0000-0000-0000-000000000053', 'Serverless Architecture with AWS Lambda and DynamoDB', 'Serverless Guru', 'Single-table DynamoDB design, event-driven Lambda triggers, API Gateway HTTP APIs, and cold-start mitigations.', 'intermediate', 18, 4.79, 'https://serverlessguru.com/course', 45.00),
('20000000-0000-0000-0000-000000000054', 'GitOps and Progressive Delivery with ArgoCD and Flagger', 'Codefresh', 'Git as single source of truth, declarative sync with ArgoCD, canary deployments, and automated rollback upon SLO degradation.', 'advanced', 18, 4.83, 'https://codefresh.io/gitops-cert', 0.00),

-- Distributed Systems & System Architecture (55-60)
('20000000-0000-0000-0000-000000000055', 'System Design Interview & Scalable Architecture Mastery', 'ByteByteGo', 'Designing YouTube, WhatsApp, Rate Limiter, TinyURL, and Distributed Web Crawlers; understanding bottlenecks and trade-offs.', 'intermediate', 35, 4.96, 'https://bytebytego.com', 79.00),
('20000000-0000-0000-0000-000000000056', 'Distributed Event Streaming with Apache Kafka', 'Confluent Developer', 'Kafka brokers, topics, partitions, consumer groups, exactly-once semantics (EOS), schema registry, and Kafka Connect.', 'intermediate', 30, 4.89, 'https://developer.confluent.io/courses/kafka-101', 0.00),
('20000000-0000-0000-0000-000000000057', 'Distributed Consensus and Raft Protocol', 'MIT 6.824', 'MIT’s famous distributed systems course: Raft consensus algorithm, Paxos, distributed key-value stores, and linearizable consistency.', 'expert', 45, 4.97, 'https://pdos.csail.mit.edu/6.824', 0.00),
('20000000-0000-0000-0000-000000000058', 'High-Scale Caching, Sharding, and Replication Patterns', 'O Reilly Media', 'Cache stampede prevention, consistent hashing algorithms, bloom filters, and distributed write-ahead logs.', 'advanced', 24, 4.84, 'https://oreilly.com/high-scale-caching', 69.00),
('20000000-0000-0000-0000-000000000059', 'Designing Data-Intensive Applications in Practice', 'Martin Kleppmann Masterclass', 'Storage engines (LSM trees vs B-Trees), transaction isolation levels, batch processing, stream processing, and unbundling databases.', 'expert', 40, 4.98, 'https://dataintensive.net', 99.00),
('20000000-0000-0000-0000-000000000060', 'AI System Architecture: High-Scale Vector Search & Serving', 'Stanford MLSys', 'Serving 100M+ vector embedding searches under 15ms, GPU cluster scheduling, model quantization pipelines, and streaming inference.', 'expert', 32, 4.94, 'https://stanford-cs329s.github.io', 0.00)
ON CONFLICT (id) DO UPDATE SET 
    title = EXCLUDED.title,
    provider = EXCLUDED.provider,
    description = EXCLUDED.description,
    difficulty = EXCLUDED.difficulty,
    duration_hours = EXCLUDED.duration_hours,
    rating = EXCLUDED.rating,
    url = EXCLUDED.url,
    cost = EXCLUDED.cost;

-- ============================================================================
-- 3. SEED COURSE SKILLS JUNCTION (Proficiency rating 1-5 & gap weights 0.1-1.0)
-- ============================================================================
INSERT INTO course_skills (course_id, skill_id, proficiency_level, gap_weight) VALUES
-- Python courses
('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 2, 0.90),
('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 5, 0.95),
('20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000002', 4, 0.90),
('20000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000003', 4, 0.85),
('20000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000020', 3, 0.60),
('20000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000004', 5, 0.95),
('20000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000001', 3, 0.80),

-- Backend APIs & Frameworks
('20000000-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000005', 3, 0.95),
('20000000-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000001', 2, 0.50),
('20000000-0000-0000-0000-000000000008', '10000000-0000-0000-0000-000000000006', 4, 0.90),
('20000000-0000-0000-0000-000000000008', '10000000-0000-0000-0000-000000000002', 3, 0.70),
('20000000-0000-0000-0000-000000000009', '10000000-0000-0000-0000-000000000003', 4, 0.85),
('20000000-0000-0000-0000-000000000009', '10000000-0000-0000-0000-000000000020', 4, 0.80),
('20000000-0000-0000-0000-000000000010', '10000000-0000-0000-0000-000000000005', 3, 0.65),
('20000000-0000-0000-0000-000000000010', '10000000-0000-0000-0000-000000000006', 3, 0.65),
('20000000-0000-0000-0000-000000000011', '10000000-0000-0000-0000-000000000005', 4, 0.70),
('20000000-0000-0000-0000-000000000011', '10000000-0000-0000-0000-000000000006', 4, 0.70),
('20000000-0000-0000-0000-000000000012', '10000000-0000-0000-0000-000000000006', 3, 0.75),
('20000000-0000-0000-0000-000000000013', '10000000-0000-0000-0000-000000000020', 4, 0.85),
('20000000-0000-0000-0000-000000000014', '10000000-0000-0000-0000-000000000008', 4, 0.85),
('20000000-0000-0000-0000-000000000015', '10000000-0000-0000-0000-000000000020', 4, 0.90),

-- Databases & Caching
('20000000-0000-0000-0000-000000000016', '10000000-0000-0000-0000-000000000007', 5, 0.95),
('20000000-0000-0000-0000-000000000017', '10000000-0000-0000-0000-000000000007', 2, 0.90),
('20000000-0000-0000-0000-000000000018', '10000000-0000-0000-0000-000000000008', 4, 0.95),
('20000000-0000-0000-0000-000000000019', '10000000-0000-0000-0000-000000000009', 4, 0.95),
('20000000-0000-0000-0000-000000000019', '10000000-0000-0000-0000-000000000007', 3, 0.60),
('20000000-0000-0000-0000-000000000020', '10000000-0000-0000-0000-000000000007', 5, 0.90),
('20000000-0000-0000-0000-000000000020', '10000000-0000-0000-0000-000000000020', 5, 0.85),
('20000000-0000-0000-0000-000000000021', '10000000-0000-0000-0000-000000000007', 4, 0.75),
('20000000-0000-0000-0000-000000000022', '10000000-0000-0000-0000-000000000007', 3, 0.70),
('20000000-0000-0000-0000-000000000022', '10000000-0000-0000-0000-000000000019', 3, 0.70),
('20000000-0000-0000-0000-000000000023', '10000000-0000-0000-0000-000000000007', 5, 0.95),
('20000000-0000-0000-0000-000000000024', '10000000-0000-0000-0000-000000000007', 4, 0.80),
('20000000-0000-0000-0000-000000000024', '10000000-0000-0000-0000-000000000009', 3, 0.60),

-- AI, ML & LLMs
('20000000-0000-0000-0000-000000000025', '10000000-0000-0000-0000-000000000013', 3, 0.95),
('20000000-0000-0000-0000-000000000025', '10000000-0000-0000-0000-000000000001', 2, 0.60),
('20000000-0000-0000-0000-000000000026', '10000000-0000-0000-0000-000000000013', 4, 0.90),
('20000000-0000-0000-0000-000000000027', '10000000-0000-0000-0000-000000000010', 4, 0.90),
('20000000-0000-0000-0000-000000000028', '10000000-0000-0000-0000-000000000010', 4, 0.95),
('20000000-0000-0000-0000-000000000029', '10000000-0000-0000-0000-000000000011', 5, 0.98),
('20000000-0000-0000-0000-000000000029', '10000000-0000-0000-0000-000000000009', 4, 0.90),
('20000000-0000-0000-0000-000000000030', '10000000-0000-0000-0000-000000000012', 5, 0.95),
('20000000-0000-0000-0000-000000000030', '10000000-0000-0000-0000-000000000010', 4, 0.80),
('20000000-0000-0000-0000-000000000031', '10000000-0000-0000-0000-000000000010', 5, 0.92),
('20000000-0000-0000-0000-000000000032', '10000000-0000-0000-0000-000000000010', 2, 0.85),
('20000000-0000-0000-0000-000000000033', '10000000-0000-0000-0000-000000000009', 4, 0.90),
('20000000-0000-0000-0000-000000000033', '10000000-0000-0000-0000-000000000013', 3, 0.70),
('20000000-0000-0000-0000-000000000034', '10000000-0000-0000-0000-000000000010', 4, 0.85),
('20000000-0000-0000-0000-000000000034', '10000000-0000-0000-0000-000000000016', 3, 0.60),
('20000000-0000-0000-0000-000000000035', '10000000-0000-0000-0000-000000000010', 3, 0.80),
('20000000-0000-0000-0000-000000000036', '10000000-0000-0000-0000-000000000010', 4, 0.85),
('20000000-0000-0000-0000-000000000037', '10000000-0000-0000-0000-000000000009', 4, 0.75),
('20000000-0000-0000-0000-000000000037', '10000000-0000-0000-0000-000000000011', 4, 0.75),
('20000000-0000-0000-0000-000000000038', '10000000-0000-0000-0000-000000000012', 4, 0.85),

-- Frontend & Full-Stack
('20000000-0000-0000-0000-000000000039', '10000000-0000-0000-0000-000000000014', 3, 0.95),
('20000000-0000-0000-0000-000000000040', '10000000-0000-0000-0000-000000000015', 3, 0.95),
('20000000-0000-0000-0000-000000000041', '10000000-0000-0000-0000-000000000014', 4, 0.90),
('20000000-0000-0000-0000-000000000042', '10000000-0000-0000-0000-000000000014', 3, 0.80),
('20000000-0000-0000-0000-000000000043', '10000000-0000-0000-0000-000000000014', 4, 0.85),
('20000000-0000-0000-0000-000000000044', '10000000-0000-0000-0000-000000000014', 4, 0.85),
('20000000-0000-0000-0000-000000000044', '10000000-0000-0000-0000-000000000010', 3, 0.70),
('20000000-0000-0000-0000-000000000045', '10000000-0000-0000-0000-000000000002', 4, 0.80),

-- DevOps, Cloud & CI/CD
('20000000-0000-0000-0000-000000000046', '10000000-0000-0000-0000-000000000016', 3, 0.95),
('20000000-0000-0000-0000-000000000047', '10000000-0000-0000-0000-000000000017', 4, 0.95),
('20000000-0000-0000-0000-000000000047', '10000000-0000-0000-0000-000000000016', 3, 0.60),
('20000000-0000-0000-0000-000000000048', '10000000-0000-0000-0000-000000000018', 3, 0.95),
('20000000-0000-0000-0000-000000000049', '10000000-0000-0000-0000-000000000019', 3, 0.95),
('20000000-0000-0000-0000-000000000050', '10000000-0000-0000-0000-000000000018', 4, 0.85),
('20000000-0000-0000-0000-000000000051', '10000000-0000-0000-0000-000000000017', 4, 0.80),
('20000000-0000-0000-0000-000000000052', '10000000-0000-0000-0000-000000000018', 4, 0.90),
('20000000-0000-0000-0000-000000000053', '10000000-0000-0000-0000-000000000018', 3, 0.85),
('20000000-0000-0000-0000-000000000054', '10000000-0000-0000-0000-000000000017', 4, 0.85),
('20000000-0000-0000-0000-000000000054', '10000000-0000-0000-0000-000000000019', 4, 0.75),

-- Distributed Systems & System Design
('20000000-0000-0000-0000-000000000055', '10000000-0000-0000-0000-000000000020', 4, 0.95),
('20000000-0000-0000-0000-000000000056', '10000000-0000-0000-0000-000000000020', 4, 0.90),
('20000000-0000-0000-0000-000000000057', '10000000-0000-0000-0000-000000000020', 5, 0.98),
('20000000-0000-0000-0000-000000000058', '10000000-0000-0000-0000-000000000008', 4, 0.80),
('20000000-0000-0000-0000-000000000058', '10000000-0000-0000-0000-000000000020', 4, 0.85),
('20000000-0000-0000-0000-000000000059', '10000000-0000-0000-0000-000000000020', 5, 0.98),
('20000000-0000-0000-0000-000000000059', '10000000-0000-0000-0000-000000000007', 4, 0.70),
('20000000-0000-0000-0000-000000000060', '10000000-0000-0000-0000-000000000009', 5, 0.95),
('20000000-0000-0000-0000-000000000060', '10000000-0000-0000-0000-000000000020', 5, 0.90)
ON CONFLICT (course_id, skill_id) DO UPDATE SET proficiency_level = EXCLUDED.proficiency_level, gap_weight = EXCLUDED.gap_weight;

-- ============================================================================
-- 4. SEED COURSE PREREQUISITES (DAG structure)
-- ============================================================================
INSERT INTO course_prerequisites (course_id, prerequisite_course_id, is_mandatory) VALUES
-- Advanced Python requires Basic Python
('20000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001', true),
('20000000-0000-0000-0000-000000000006', '20000000-0000-0000-0000-000000000001', true),
-- FastAPI requires Basic Python
('20000000-0000-0000-0000-000000000007', '20000000-0000-0000-0000-000000000001', true),
-- Deep Learning requires ML Foundations
('20000000-0000-0000-0000-000000000026', '20000000-0000-0000-0000-000000000025', true),
-- Transformers requires Deep Learning
('20000000-0000-0000-0000-000000000027', '20000000-0000-0000-0000-000000000026', true),
-- LLMs requires Transformers
('20000000-0000-0000-0000-000000000028', '20000000-0000-0000-0000-000000000027', true),
-- Production RAG requires Vector DBs & LLMs
('20000000-0000-0000-0000-000000000029', '20000000-0000-0000-0000-000000000019', true),
('20000000-0000-0000-0000-000000000029', '20000000-0000-0000-0000-000000000028', true),
-- AI Agents requires Production RAG
('20000000-0000-0000-0000-000000000030', '20000000-0000-0000-0000-000000000029', true),
-- Fine-Tuning requires LLMs
('20000000-0000-0000-0000-000000000031', '20000000-0000-0000-0000-000000000028', true),
-- pgvector requires Relational Data Modeling
('20000000-0000-0000-0000-000000000019', '20000000-0000-0000-0000-000000000017', true),
-- Kubernetes requires Docker
('20000000-0000-0000-0000-000000000047', '20000000-0000-0000-0000-000000000046', true),
-- GitOps requires Kubernetes & CI/CD
('20000000-0000-0000-0000-000000000054', '20000000-0000-0000-0000-000000000047', true),
('20000000-0000-0000-0000-000000000054', '20000000-0000-0000-0000-000000000049', false),
-- High Scale Vector Search requires pgvector & System Design
('20000000-0000-0000-0000-000000000060', '20000000-0000-0000-0000-000000000019', true),
('20000000-0000-0000-0000-000000000060', '20000000-0000-0000-0000-000000000055', true)
ON CONFLICT (course_id, prerequisite_course_id) DO NOTHING;

-- ============================================================================
-- 5. SEED DEMO USER & CAREER GOALS
-- ============================================================================
INSERT INTO users (id, email, password_hash, full_name, role, target_role, experience_level, bio)
VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'alex.rivera@pathfinder.ai',
    '$2b$10$vjD2aapnG7QJ8LeX2kplqekqGFKgRP7fu.DV43wJ0yPoTt16dyeSG',
    'Alex Rivera',
    'student',
    'AI Solutions Architect',
    'intermediate',
    'Full-stack software engineer specializing in LLMs, high-scale RAG, and autonomous agent ecosystems.'
)
ON CONFLICT (email) DO UPDATE SET
    password_hash = EXCLUDED.password_hash,
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    target_role = EXCLUDED.target_role,
    experience_level = EXCLUDED.experience_level,
    bio = EXCLUDED.bio,
    updated_at = CURRENT_TIMESTAMP;

INSERT INTO goals (id, user_id, target_role, target_timeline_months, weekly_study_hours, preferred_learning_style, status, notes)
VALUES (
    'c0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'Senior AI Solutions Architect',
    6,
    15,
    'hands_on_projects',
    'active',
    'Goal is to master distributed LLM serving, vector search at scale, and multi-agent coordination.'
)
ON CONFLICT (id) DO UPDATE SET 
    target_role = EXCLUDED.target_role,
    target_timeline_months = EXCLUDED.target_timeline_months;

-- Seed User Current Skills
INSERT INTO user_skills (user_id, skill_id, proficiency_level, verified) VALUES
('a0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 4, true),  -- Python
('a0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000005', 3, true),  -- FastAPI
('a0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000007', 3, true),  -- PostgreSQL
('a0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000009', 2, false), -- Vector Databases
('a0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000010', 2, false), -- LLMs
('a0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000011', 1, false), -- RAG
('a0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000012', 1, false)  -- AI Agents
ON CONFLICT (user_id, skill_id) DO UPDATE SET proficiency_level = EXCLUDED.proficiency_level, verified = EXCLUDED.verified;

-- ============================================================================
-- 6. SEED MOCK ASSESSMENTS
-- ============================================================================
INSERT INTO assessments (id, user_id, skill_id, title, score, max_score, status, passed, assessment_data)
VALUES
(
    'd0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000001',
    'Python Core & Async Mastery Diagnostic',
    88,
    100,
    'passed',
    true,
    '{"completed_at": "2026-08-30T14:00:00Z", "topics": {"generators": 90, "asyncio": 85, "decorators": 90}}'::jsonb
),
(
    'd0000000-0000-0000-0000-000000000002',
    'a0000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000009',
    'Vector Search & Embeddings Diagnostic',
    52,
    100,
    'passed',
    false,
    '{"completed_at": "2026-08-30T14:30:00Z", "topics": {"cosine_similarity": 70, "hnsw_tuning": 40, "hybrid_search": 45}}'::jsonb
)
ON CONFLICT (id) DO NOTHING;
