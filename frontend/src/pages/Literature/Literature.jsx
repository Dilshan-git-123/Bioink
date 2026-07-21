import React, { useState } from 'react';
import { 
    FaSearch, 
    FaFilter, 
    FaBookmark, 
    FaRegBookmark,
    FaExternalLinkAlt,
    FaRobot,
    FaQuoteLeft,
    FaCalendarAlt,
    FaBookOpen,
    FaUserEdit
} from 'react-icons/fa';
import './Literature.css';

// Mock Data
const mockPapers = [
    {
        id: "LIT-001",
        title: "Advanced Alginate-GelMA Hydrogels for Cardiac Tissue Engineering",
        authors: "Smith, A., Johnson, B., Davis, C.",
        journal: "Biomaterials Science",
        year: 2025,
        doi: "10.1016/j.biomaterials.2025.1001",
        abstract: "This study investigates the tunable mechanical properties and printability of Alginate and GelMA blends. By varying the photo-crosslinking time and UV intensity, we achieved a highly viable environment for induced pluripotent stem cell-derived cardiomyocytes (iPSC-CMs). The printed constructs demonstrated synchronous beating after 7 days in culture, indicating robust functional integration.",
        aiSummary: [
            "Optimum crosslinking time identified as 45s at 365nm.",
            "High cell viability (>90%) for iPSC-CMs.",
            "Suitable for extrusion-based bioprinting."
        ],
        saved: true
    },
    {
        id: "LIT-002",
        title: "Rheological assessment of PEGDA bioinks for bone regeneration",
        authors: "Chen, H., Wang, Y.",
        journal: "Advanced Healthcare Materials",
        year: 2024,
        doi: "10.1002/adhm.202400112",
        abstract: "Poly(ethylene glycol) diacrylate (PEGDA) offers tunable stiffness crucial for osteogenic differentiation. We evaluated the rheological behavior of high-concentration PEGDA bioinks to optimize shape fidelity during 3D printing. Results show that incorporating nano-hydroxyapatite significantly improves both the shear-thinning properties and the ultimate compressive modulus of the scaffolds.",
        aiSummary: [
            "Adding nano-hydroxyapatite improves shear-thinning.",
            "Ideal for load-bearing bone tissue scaffolds.",
            "Stiffness tunable between 20-50 kPa."
        ],
        saved: false
    },
    {
        id: "LIT-003",
        title: "Decellularized Extracellular Matrix (dECM) as a Bioink",
        authors: "Garcia, M., Lopez, R., et al.",
        journal: "Nature Biomedical Engineering",
        year: 2026,
        doi: "10.1038/s41551-026-0000",
        abstract: "Tissue-specific dECM provides unmatched biochemical cues. However, its low viscosity poses challenges for direct bioprinting. We introduce a novel thermal gelation methodology combined with a gelatin microparticle support bath (FRESH method) to print complex, patient-specific heart geometries using porcine cardiac dECM.",
        aiSummary: [
            "FRESH method enables printing of complex heart geometries.",
            "Overcomes low viscosity limitation of pure dECM.",
            "Retains crucial tissue-specific biochemical cues."
        ],
        saved: false
    }
];

const Literature = () => {
    const [selectedPaper, setSelectedPaper] = useState(mockPapers[0]);
    const [searchQuery, setSearchQuery] = useState("");

    return (
        <div className="literature-page">
            
            {/* Header & Search Bar */}
            <div className="lit-header-section">
                <div className="lit-title">
                    <h1>Literature Explorer</h1>
                    <p>Discover, analyze, and integrate the latest biomaterials research directly into your workflow.</p>
                </div>
                
                <div className="lit-search-container">
                    <div className="lit-search-box">
                        <FaSearch className="search-icon" />
                        <input 
                            type="text" 
                            placeholder="Search papers, authors, DOIs, or keywords..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <button className="secondary-btn"><FaFilter /> Advanced Filters</button>
                </div>

                {/* Filter Chips */}
                <div className="lit-filter-chips">
                    <button className="chip active">All</button>
                    <button className="chip">Cartilage</button>
                    <button className="chip">Cardiac</button>
                    <button className="chip">Hydrogels</button>
                    <button className="chip">Extrusion Printing</button>
                    <button className="chip">Saved Papers <FaBookmark className="ml-1" /></button>
                </div>
            </div>

            <div className="lit-main-layout">
                
                {/* Left Area: Paper Listing */}
                <div className="lit-listing-area">
                    {mockPapers.map(paper => (
                        <div 
                            key={paper.id} 
                            className={`paper-card ${selectedPaper.id === paper.id ? 'active' : ''}`}
                            onClick={() => setSelectedPaper(paper)}
                        >
                            <h4 className="paper-title">{paper.title}</h4>
                            <div className="paper-meta">
                                <span><FaUserEdit /> {paper.authors}</span>
                                <span><FaBookOpen /> {paper.journal}</span>
                                <span><FaCalendarAlt /> {paper.year}</span>
                            </div>
                            <div className="paper-actions-mini">
                                {paper.saved ? <FaBookmark className="saved-icon" /> : <FaRegBookmark className="unsaved-icon" />}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Right Area: Abstract Viewer & AI Summary */}
                <div className="lit-viewer-panel">
                    {selectedPaper ? (
                        <>
                            <div className="viewer-header">
                                <h2>{selectedPaper.title}</h2>
                                <p className="viewer-authors">{selectedPaper.authors}</p>
                                <div className="viewer-meta-row">
                                    <span className="journal-badge">{selectedPaper.journal} ({selectedPaper.year})</span>
                                    <a href={`https://doi.org/${selectedPaper.doi}`} target="_blank" rel="noreferrer" className="doi-link">
                                        DOI: {selectedPaper.doi} <FaExternalLinkAlt />
                                    </a>
                                </div>
                            </div>
                            
                            <div className="viewer-actions">
                                <button className={selectedPaper.saved ? "primary-btn" : "secondary-btn"}>
                                    {selectedPaper.saved ? <FaBookmark /> : <FaRegBookmark />} 
                                    {selectedPaper.saved ? " Saved to Library" : " Save Paper"}
                                </button>
                                <button className="secondary-btn">Extract Formulations</button>
                            </div>

                            <div className="viewer-section ai-summary">
                                <div className="section-title">
                                    <FaRobot className="text-info" /> 
                                    <h3>AI Key Takeaways</h3>
                                </div>
                                <ul className="ai-takeaways-list">
                                    {selectedPaper.aiSummary.map((point, index) => (
                                        <li key={index}>{point}</li>
                                    ))}
                                </ul>
                            </div>

                            <div className="viewer-section abstract-section">
                                <div className="section-title">
                                    <FaQuoteLeft className="text-muted" /> 
                                    <h3>Abstract</h3>
                                </div>
                                <p className="abstract-text">{selectedPaper.abstract}</p>
                            </div>

                            <div className="viewer-section related-section">
                                <h3>Related Papers</h3>
                                <div className="related-papers-list">
                                    <div className="related-paper-item">
                                        <h5>Printability Assessment of Hydrogel-based Bioinks</h5>
                                        <span>Biofabrication, 2023</span>
                                    </div>
                                    <div className="related-paper-item">
                                        <h5>Optimizing UV Crosslinking for GelMA</h5>
                                        <span>Advanced Materials, 2024</span>
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="empty-state">
                            <p>Select a paper to read the abstract and AI insights.</p>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};

export default Literature;
