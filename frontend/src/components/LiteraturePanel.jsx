import "../styles/literaturePanel.css";

function LiteraturePanel() {

  const papers = [

    {
      title: "Alginate-based bioinks for 3D Bioprinting",
      journal: "Biomaterials",
      year: "2024"
    },

    {
      title: "Hydrogel Design Strategies",
      journal: "Nature Reviews Materials",
      year: "2023"
    },

    {
      title: "GelMA in Tissue Engineering",
      journal: "Advanced Healthcare Materials",
      year: "2025"
    },

    {
      title: "Current Trends in Bioinks",
      journal: "Tissue Engineering Part A",
      year: "2024"
    }

  ];

  return (

    <div className="literature-panel">

      <h2>📚 Supporting Scientific Literature</h2>

      {

        papers.map((paper,index)=>(

          <div
            className="paper-card"
            key={index}
          >

            <h3>{paper.title}</h3>

            <p>{paper.journal}</p>

            <span>{paper.year}</span>

          </div>

        ))

      }

    </div>

  );

}

export default LiteraturePanel;