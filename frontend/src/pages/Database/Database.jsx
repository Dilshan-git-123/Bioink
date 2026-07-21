import React, { useState } from 'react';
import { 
    FaSearch, 
    FaFilter, 
    FaList, 
    FaThLarge, 
    FaBook, 
    FaExternalLinkAlt,
    FaFlask,
    FaInfoCircle,
    FaDna
} from 'react-icons/fa';
import './Database.css';

// Mock Data
const mockMaterials = [
    {
        id: "BIO-001",
        name: "Alginate-GelMA (Standard)",
        category: "Hydrogels",
        tissue: "Cartilage",
        printability: "High",
        viscosity: "20-30 Pa·s",
        crosslinking: "UV + Ionic (CaCl2)",
        references: ["Smith et al. 2024, Biomaterials, 10(2)", "Johnson 2025, Biofabrication"],
        desc: "A highly versatile hybrid bioink combining the printability of alginate with the cell adhesion sites of GelMA."
    },
    {
        id: "BIO-002",
        name: "PEGDA-HA Blend",
        category: "Synthetic",
        tissue: "Bone",
        printability: "Medium",
        viscosity: "40-50 Pa·s",
        crosslinking: "UV (365nm)",
        references: ["Chen et al. 2023, Adv. Healthcare Mat."],
        desc: "Stiff synthetic network providing excellent mechanical properties for load-bearing tissue engineering."
    },
    {
        id: "BIO-003",
        name: "Collagen Type I",
        category: "Proteins",
        tissue: "Skin",
        printability: "Low",
        viscosity: "5-10 Pa·s",
        crosslinking: "Thermal (37°C)",
        references: ["Lee 2026, Nature Materials"],
        desc: "Highly biomimetic extracellular matrix component, requires support bath for complex 3D structures."
    },
    {
        id: "BIO-004",
        name: "dECM (Heart)",
        category: "Natural",
        tissue: "Cardiac",
        printability: "Medium",
        viscosity: "15-25 Pa·s",
        crosslinking: "Thermal + UV",
        references: ["Garcia 2025, Biofabrication"],
        desc: "Decellularized extracellular matrix retaining tissue-specific cues for cardiac regeneration."
    }
];

const Database = () => {
    const [viewMode, setViewMode] = useState('table'); // 'table' or 'grid'
    const [selectedBioink, setSelectedBioink] = useState(mockMaterials[0]);

    return (
        <div className="database-page">
            
            {/* Header & Search/Filter Bar */}
            <div className="db-header-section">
                <div className="db-title">
                    <h1>Bioink Database</h1>
                    <p>Explore thousands of peer-reviewed and AI-generated biomaterial formulations.</p>
                </div>
                
                <div className="db-toolbar">
                    <div className="search-box">
                        <FaSearch className="search-icon" />
                        <input type="text" placeholder="Search materials, tissues, ID..." />
                    </div>
                    <div className="db-actions">
                        <button className="secondary-btn"><FaFilter /> Filters</button>
                        <div className="view-toggle">
                            <button 
                                className={`icon-btn ${viewMode === 'table' ? 'active' : ''}`}
                                onClick={() => setViewMode('table')}
                                title="Table View"
                            >
                                <FaList />
                            </button>
                            <button 
                                className={`icon-btn ${viewMode === 'grid' ? 'active' : ''}`}
                                onClick={() => setViewMode('grid')}
                                title="Grid View"
                            >
                                <FaThLarge />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="db-main-layout">
                
                {/* Left Area: Categories & Listing */}
                <div className="db-listing-area">
                    
                    {/* Material Categories */}
                    <div className="db-categories">
                        <button className="cat-btn active">All Materials</button>
                        <button className="cat-btn">Hydrogels</button>
                        <button className="cat-btn">Synthetic</button>
                        <button className="cat-btn">Natural</button>
                        <button className="cat-btn">Proteins</button>
                    </div>

                    {/* Listing Content */}
                    <div className="db-content">
                        {viewMode === 'table' ? (
                            <div className="db-table-container">
                                <table className="db-table">
                                    <thead>
                                        <tr>
                                            <th>ID</th>
                                            <th>Name</th>
                                            <th>Category</th>
                                            <th>Target Tissue</th>
                                            <th>Printability</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {mockMaterials.map(mat => (
                                            <tr 
                                                key={mat.id} 
                                                className={selectedBioink.id === mat.id ? 'selected-row' : ''}
                                                onClick={() => setSelectedBioink(mat)}
                                            >
                                                <td>{mat.id}</td>
                                                <td className="mat-name-cell">{mat.name}</td>
                                                <td><span className="badge category-badge">{mat.category}</span></td>
                                                <td>{mat.tissue}</td>
                                                <td>
                                                    <span className={`status-dot ${mat.printability.toLowerCase()}`}></span>
                                                    {mat.printability}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="db-grid-container">
                                {mockMaterials.map(mat => (
                                    <div 
                                        key={mat.id} 
                                        className={`bioink-card ${selectedBioink.id === mat.id ? 'selected-card' : ''}`}
                                        onClick={() => setSelectedBioink(mat)}
                                    >
                                        <div className="card-top">
                                            <span className="badge category-badge">{mat.category}</span>
                                            <span className="mat-id">{mat.id}</span>
                                        </div>
                                        <h4>{mat.name}</h4>
                                        <div className="card-specs">
                                            <span><FaDna /> {mat.tissue}</span>
                                            <span><FaFlask /> {mat.printability} Printability</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Area: Detail Panel & References */}
                <div className="db-detail-panel">
                    {selectedBioink ? (
                        <>
                            <div className="detail-header">
                                <span className="detail-category">{selectedBioink.category}</span>
                                <h2>{selectedBioink.name}</h2>
                                <p className="detail-id">ID: {selectedBioink.id}</p>
                            </div>
                            
                            <div className="detail-desc">
                                <p>{selectedBioink.desc}</p>
                            </div>

                            <div className="detail-specs-grid">
                                <div className="spec-item">
                                    <span className="spec-label">Target Tissue</span>
                                    <span className="spec-value">{selectedBioink.tissue}</span>
                                </div>
                                <div className="spec-item">
                                    <span className="spec-label">Viscosity</span>
                                    <span className="spec-value">{selectedBioink.viscosity}</span>
                                </div>
                                <div className="spec-item">
                                    <span className="spec-label">Crosslinking</span>
                                    <span className="spec-value">{selectedBioink.crosslinking}</span>
                                </div>
                                <div className="spec-item">
                                    <span className="spec-label">Printability</span>
                                    <span className="spec-value">{selectedBioink.printability}</span>
                                </div>
                            </div>

                            <div className="detail-references">
                                <h3><FaBook className="icon" /> References & Literature</h3>
                                <ul className="ref-list">
                                    {selectedBioink.references.map((ref, idx) => (
                                        <li key={idx}>
                                            {ref} <FaExternalLinkAlt className="ref-link-icon" />
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="detail-actions">
                                <button className="primary-btn w-100">Load into Designer</button>
                                <button className="secondary-btn w-100 mt-2">Export Data Sheet</button>
                            </div>
                        </>
                    ) : (
                        <div className="empty-state">
                            <FaInfoCircle className="empty-icon" />
                            <p>Select a material to view details.</p>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};

export default Database;
