# ForgeQA - Complete End-to-End Process Flow

Below is the complete end-to-end process flow for the **ForgeQA** AI-powered QA automation platform, presented both as a high-resolution visual infographic image and a detailed technical diagram.

---

## 🎨 Visual Process Flow Infographic

![ForgeQA Complete Process Flow Diagram](C:\Users\jagat\.gemini\antigravity-ide\brain\f73044c6-8a97-4f71-9a25-88e535324f8a\forgeqa_process_flow_1784903306683.png)

---

## 🔄 Detailed Process Flow Diagram (Mermaid)

```mermaid
flowchart TD
    subgraph Phase1["Phase 1: Knowledge Base & RAG Pipeline"]
        A[User Uploads Docs / Specs] --> B{File Type Router}
        B -->|PDF| C1[pdf-parse]
        B -->|DOCX| C2[mammoth]
        B -->|Images| C3[Tesseract.js OCR]
        B -->|XLSX / CSV| C4[xlsx parser]
        C1 & C2 & C3 & C4 --> D[Clean & Normalize Text]
        D --> E[Chunking ~700 Chars]
        E --> F[(MongoDB Vector / Text Index)]
    end

    subgraph Phase2["Phase 2: AI Test Case Generation"]
        G[User Enters Requirement / Feature Spec] --> H[RAG Similarity Search]
        F -. RAG Context .-> H
        H --> I[Prompt Assembly + System Rules]
        I --> J{Select AI Provider}
        J -->|Gemini 2.0| K[AI Inference Model]
        J -->|OpenAI GPT-4o| K
        J -->|Claude 3.5| K
        J -->|Groq / OpenRouter| K
        K --> L[Streaming SSE Response]
        L --> M[Parse JSON & Categorize Test Cases]
        M --> N[Positive / Negative / Edge Cases]
    end

    subgraph Phase3["Phase 3: Test Suite Management"]
        N --> O[Create / Assign Test Suites]
        O --> P1[Smoke Test Suite]
        O --> P2[Regression Test Suite]
        O --> P3[Sanity / Custom Suite]
    end

    subgraph Phase4["Phase 4: Automation Script Generation"]
        O --> Q[Configure Script Options]
        Q --> R{Target Framework}
        R -->|Playwright| S[TypeScript / JavaScript]
        R -->|Cypress| S
        R -->|Selenium| T[Python / Java / C#]
        R -->|Appium| U[Mobile Automation Script]
        S & T & U --> V[Executable Automation Script]
    end

    subgraph Phase5["Phase 5: Regression & CI/CD Execution"]
        V --> W[Upload Build Artifact APK / ZIP]
        W --> X[Trigger Execution via Webhook / UI]
        X --> Y[Simulated / Runner Test Execution]
        Y --> Z[Generate Execution Analytics & Pass/Fail Reports]
    end
```

---

## 📋 Phase Breakdown Summary

| Phase | Core Action | Key Outputs & Technologies |
| :--- | :--- | :--- |
| **1. Knowledge Ingestion (RAG)** | Upload requirements, PRDs, specs, design images | Vector index, text chunks in MongoDB, extracted OCR text |
| **2. AI Test Generation** | Stream requirement text + RAG context through LLMs | Categorized structured test cases (Positive, Negative, Edge) |
| **3. Test Suite Management** | Organize generated test cases into logical groups | Color-coded Smoke, Sanity, & Regression Test Suites |
| **4. Script Generation** | Convert test cases into framework-specific code | Executable Playwright, Cypress, Selenium, or Appium code |
| **5. CI/CD & Execution** | Run automated regression suites on build artifacts | Test execution pass/fail logs, status metrics, analytics dashboard |
