import "../styles/tissueSelector.css";

const tissues = [
  { icon: "🦴", name: "Bone" },
  { icon: "🦵", name: "Cartilage" },
  { icon: "❤️", name: "Heart" },
  { icon: "🧠", name: "Neural" },
  { icon: "🧬", name: "Skin" },
  { icon: "🫀", name: "Liver" },
  { icon: "🫁", name: "Lung" },
  { icon: "➕", name: "Custom" }
];

function TissueSelector({ selectedTissue, setSelectedTissue }) {

  return (
    <div className="tissue-section">

      <h2>Select Target Tissue</h2>

      <div className="tissue-grid">

        {tissues.map((tissue) => (

          <div
            key={tissue.name}
            className={`tissue-card ${
              selectedTissue === tissue.name ? "active-card" : ""
            }`}
            onClick={() => setSelectedTissue(tissue.name)}
          >

            <div className="tissue-icon">
              {tissue.icon}
            </div>

            <h3>{tissue.name}</h3>

          </div>

        ))}

      </div>

    </div>
  );
}

export default TissueSelector;